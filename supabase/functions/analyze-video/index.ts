
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { 
      videoId, 
      videoUrl, 
      videoType, 
      videoTitle, 
      videoDescription,
      opposingTeam,
      matchDate,
      score,
      taggedPlayers,
      teamId
    } = await req.json();

    console.log(`Starting AI analysis for video ${videoId} - Type: ${videoType}, Title: ${videoTitle}`);

    // Get comprehensive video and team context
    const { data: videoData } = await supabase
      .from('videos')
      .select(`
        *,
        teams (
          name,
          country,
          member_association
        )
      `)
      .eq('id', videoId)
      .single();

    // Get detailed player information if tagged
    let playerDetails = [];
    if (taggedPlayers && taggedPlayers.length > 0) {
      const { data: players } = await supabase
        .from('players')
        .select('id, full_name, position, jersey_number, citizenship, date_of_birth')
        .in('id', taggedPlayers);
      
      playerDetails = players || [];
    }

    // Get team information
    let teamInfo = null;
    if (teamId) {
      const { data: team } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();
      teamInfo = team;
    }

    // Create context-aware analysis prompt
    const analysisPrompt = createAnalysisPrompt(
      videoType,
      videoTitle,
      videoDescription,
      opposingTeam,
      matchDate,
      score,
      playerDetails,
      teamInfo
    );

    console.log('Sending analysis request to Gemini API...');

    // Call Gemini API for analysis
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: analysisPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 4096,
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorData);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const analysisText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!analysisText) {
      throw new Error('No analysis text received from Gemini API');
    }

    console.log('AI analysis completed successfully');

    // Update video record with detailed analysis
    const { error: updateError } = await supabase
      .from('videos')
      .update({
        ai_analysis: {
          analysis: analysisText,
          video_type: videoType,
          analyzed_at: new Date().toISOString(),
          model_used: 'gemini-2.0-flash-exp',
          analysis_version: '2.1',
          context: {
            videoTitle,
            videoDescription,
            opposingTeam,
            matchDate,
            score,
            teamName: teamInfo?.name,
            playersAnalyzed: playerDetails.length,
            analysisPromptLength: analysisPrompt.length
          }
        },
        ai_analysis_status: 'completed'
      })
      .eq('id', videoId);

    if (updateError) {
      console.error('Error saving analysis:', updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisText,
      videoType: videoType,
      context: {
        teamName: teamInfo?.name || 'Unknown Team',
        opposingTeam: opposingTeam || 'Unknown Opposition',
        playersAnalyzed: playerDetails.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-video function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function createAnalysisPrompt(
  videoType: string,
  videoTitle: string,
  videoDescription: string,
  opposingTeam?: string,
  matchDate?: string,
  score?: string,
  playerDetails: any[] = [],
  teamInfo: any = null
): string {
  let prompt = `You are a professional football/soccer analyst with expertise in video analysis. Provide a comprehensive, detailed analysis of this ${videoType} video.

**VIDEO INFORMATION:**
- Title: "${videoTitle}"
- Type: ${videoType.toUpperCase()}
- Team: ${teamInfo?.name || 'Home Team'}
${opposingTeam ? `- Opposition: ${opposingTeam}` : ''}
${matchDate ? `- Date: ${matchDate}` : ''}
${score ? `- Final Score: ${score}` : ''}
${videoDescription ? `- Description: ${videoDescription}` : ''}

**FEATURED PLAYERS:**
${playerDetails.length > 0 ? 
  playerDetails.map(p => `- ${p.full_name} (#${p.jersey_number || 'N/A'}) - Position: ${p.position} (${p.citizenship})`).join('\n') :
  '- Analysis will focus on observable player performances'
}

**ANALYSIS REQUIREMENTS:**
Provide a detailed analysis in the following format:

## EXECUTIVE SUMMARY
Write 3-4 sentences summarizing what this video shows, the key events, and overall significance. Be specific about what actually happened.

## DETAILED VIDEO ANALYSIS`;

  // Add type-specific analysis sections
  switch (videoType) {
    case 'match':
      prompt += `

### MATCH OVERVIEW
- Describe the overall flow and narrative of the match segment shown
- Identify the phase of play (first half, second half, specific moments)
- Analyze the tempo, intensity, and style of play observed
- Comment on weather conditions, pitch quality, and crowd atmosphere if visible

### TACTICAL ANALYSIS
- **Formation & Setup**: Analyze visible tactical formations and player positioning
- **Defensive Organization**: Describe defensive shape, pressing patterns, and compactness
- **Attacking Patterns**: Detail build-up play, attacking movements, and creativity
- **Transitions**: Analyze how teams transition between defense and attack
- **Set Pieces**: Evaluate corner kicks, free kicks, and throw-in strategies

### INDIVIDUAL PERFORMANCES
${playerDetails.length > 0 ? 
  `For each featured player, analyze:\n${playerDetails.map(p => 
    `**${p.full_name} (#${p.jersey_number || 'N/A'}) - ${p.position}:**
- Technical skills demonstrated (passing accuracy, first touch, ball control)
- Physical attributes shown (pace, strength, aerial ability, stamina)
- Tactical awareness and positioning throughout the match
- Key moments, contributions, and decision-making
- Defensive/offensive actions and effectiveness
- Overall performance rating (1-10) with specific justification`).join('\n\n')}` :
  `Analyze standout individual performances of key players visible in the video`
}

### KEY MATCH EVENTS
- **Goals/Scoring Chances**: Detailed breakdown of goals, near-misses, and key saves
- **Defensive Actions**: Tackles, interceptions, clearances, and blocks
- **Disciplinary**: Cards, fouls, and controversial moments
- **Substitutions**: Tactical changes and their immediate impact
- **Turning Points**: Moments that shifted momentum or changed the game

### STATISTICAL OBSERVATIONS
Based on visible play, estimate and comment on:
- Possession patterns and territorial advantage
- Pass completion rates and key passes
- Shots on target vs. total attempts
- Successful tackles and defensive actions
- Set piece effectiveness
- Physical duels won/lost

### OPPOSITION ANALYSIS
${opposingTeam ? `
**${opposingTeam} Performance:**
- Strengths and weaknesses displayed
- Key players who made an impact
- Tactical approach and effectiveness
- How they responded to pressure
- Areas where they were vulnerable` :
'**Opposition Assessment:**\nAnalyze the opposing team\'s visible strengths, weaknesses, and tactical approach'}

### PERFORMANCE RATINGS
- **Team Performance**: X/10 (with detailed justification)
- **Individual Ratings**: Rate key players with specific reasoning
- **Tactical Execution**: X/10 (formation adherence, role execution)
- **Physical Performance**: X/10 (fitness, work rate, stamina)
- **Mental Resilience**: X/10 (composure, decision-making under pressure)`;
      break;

    case 'training':
      prompt += `

### TRAINING SESSION OVERVIEW
- **Objectives**: Primary focus areas and training goals observed
- **Intensity Level**: Rate the session intensity and work rate
- **Duration & Structure**: Session organization and time management
- **Equipment Used**: Training aids, cones, goals, and facilities

### TECHNICAL SKILLS FOCUS
- **Ball Work**: First touch, passing accuracy, and ball control drills
- **Shooting Practice**: Finishing technique and shot accuracy
- **Passing Drills**: Short/long passing, crossing, and distribution
- **Dribbling & 1v1**: Individual skill work and close control
- **Aerial Play**: Heading technique and aerial duels

### TACTICAL DEVELOPMENT
- **Formation Work**: Positioning and shape maintenance
- **Set Piece Practice**: Corner kicks, free kicks, and defensive setups
- **Pressing Patterns**: Coordinated pressing and defensive triggers
- **Game Situations**: Small-sided games and match scenarios
- **Communication**: Player interaction and coaching instructions

### PHYSICAL CONDITIONING
- **Fitness Work**: Endurance running, sprint intervals, and stamina building
- **Strength & Power**: Physical challenges and power development
- **Agility & Coordination**: Movement quality and athletic ability
- **Recovery**: Cool-down procedures and injury prevention

### INDIVIDUAL ASSESSMENTS
${playerDetails.length > 0 ? 
  playerDetails.map(p => 
    `**${p.full_name} - ${p.position}:**
- Technical execution quality and consistency
- Physical effort and training intensity shown
- Learning adaptation and skill improvement
- Leadership qualities and communication
- Areas requiring additional focus
- Training performance rating (1-10)`).join('\n\n') :
  'Assess individual player performances and development areas'
}

### COACHING EFFECTIVENESS
- **Instruction Quality**: Clarity and effectiveness of coaching communication
- **Session Flow**: Organization, timing, and progression
- **Individual Attention**: Personal feedback and correction quality
- **Motivation**: Player engagement and response to coaching
- **Tactical Implementation**: How well tactical concepts were taught`;
      break;

    case 'highlight':
      prompt += `

### HIGHLIGHT COMPILATION ANALYSIS
- **Quality Assessment**: Technical and entertainment value of selected moments
- **Narrative Flow**: How highlights tell the story of performance/match
- **Production Value**: Video quality, editing, and presentation

### STANDOUT PERFORMANCES
- **Technical Excellence**: Most impressive technical skills displayed
- **Physical Prowess**: Outstanding athletic abilities shown
- **Mental Strength**: Composure and decision-making under pressure
- **Game Impact**: How these moments influenced the match outcome

### DETAILED SKILL BREAKDOWN
For each major highlight moment:
- **Technical Execution**: Detailed analysis of skill or technique
- **Tactical Context**: Situation leading up to the moment
- **Physical Demands**: Athletic requirements and execution
- **Decision Quality**: Thought process and timing
- **Outcome Impact**: Effect on team performance and result

### PLAYER DEVELOPMENT PROFILE
${playerDetails.length > 0 ? 
  playerDetails.map(p => 
    `**${p.full_name} - ${p.position}:**
- Key strengths clearly demonstrated
- Technical abilities showcased
- Physical attributes highlighted
- Areas for continued development
- Market value and potential assessment
- Professional readiness level (1-10)`).join('\n\n') :
  'Analyze featured players\' development potential and market readiness'
}

### SCOUTING ASSESSMENT
- **Current Ability Level**: Assessment against professional standards
- **Consistency Factor**: Reliability across different situations
- **Adaptability**: Potential to perform at higher levels
- **Transfer Market Appeal**: Commercial and sporting value
- **Development Trajectory**: Projected improvement pathway`;
      break;

    case 'interview':
      prompt += `

### COMMUNICATION ASSESSMENT
- **Verbal Skills**: Clarity, articulation, and language proficiency
- **Confidence Level**: Comfort and assurance in responses
- **Professional Demeanor**: Media presentation and composure
- **Engagement Quality**: Active listening and thoughtful responses

### CONTENT ANALYSIS
- **Key Topics**: Main themes and subjects discussed
- **Football Knowledge**: Understanding of tactics, strategy, and game
- **Personal Insights**: Character, motivations, and ambitions revealed
- **Team Dynamics**: Relationships and squad harmony mentioned
- **Career Perspective**: Future goals and professional outlook

### PERSONALITY PROFILE
- **Leadership Qualities**: Natural leadership traits and communication style
- **Emotional Intelligence**: Self-awareness and social skills
- **Maturity Level**: Professional attitude and decision-making capability
- **Cultural Adaptability**: International awareness and flexibility
- **Passion & Drive**: Commitment to football and career development

### MEDIA READINESS
- **Interview Skills**: Handling of questions and media training effectiveness
- **Brand Awareness**: Understanding of personal and commercial value
- **Crisis Management**: Ability to handle difficult or controversial questions
- **Public Relations**: Suitability for media obligations and sponsorships
- **Future Potential**: Projected media career and marketability

### PROFESSIONAL ASSESSMENT
${playerDetails.length > 0 ? 
  playerDetails.map(p => 
    `**${p.full_name}:**
- Communication effectiveness (1-10)
- Professional maturity level
- Media training quality
- Brand potential assessment
- Cultural and language adaptability
- Overall interview performance rating`).join('\n\n') :
  'Assess professional readiness and media capabilities'
}`;
      break;
  }

  prompt += `

## RECOMMENDATIONS FOR IMPROVEMENT

### Immediate Focus Areas
1. **Technical Development**: Specific skills requiring attention
2. **Tactical Understanding**: Areas for tactical improvement
3. **Physical Conditioning**: Fitness and athletic development needs
4. **Mental Aspects**: Psychological and decision-making improvements

### Strategic Recommendations
- **Training Priorities**: What should be emphasized in upcoming sessions
- **Match Preparation**: Tactical adjustments for future games
- **Player Development**: Individual improvement pathways
- **Team Strategy**: Collective tactical and strategic considerations

## FUTURE OUTLOOK

### Short-term Projections (Next 3-6 months)
- Expected performance trajectory based on current evidence
- Areas likely to see rapid improvement
- Potential challenges and obstacles

### Long-term Assessment (6+ months)
- Career development potential and pathway
- Market value considerations and transfer prospects
- Professional readiness for higher levels of competition

## CONCLUSION
Provide a comprehensive summary of the key findings, standout observations, and overall assessment. Include specific, actionable insights that would be valuable for coaches, scouts, and player development staff.

**IMPORTANT**: Base your entire analysis on realistic football scenarios that match the video type and context provided. Avoid generic statements and focus on specific, observable details. Provide genuine insights that demonstrate deep understanding of football tactics, technique, and player development. Make all observations consistent with the video title, description, and player information provided.`;

  return prompt;
}
