
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
      playerStats,
      taggedPlayers
    } = await req.json();

    console.log(`Starting AI analysis for video ${videoId} of type ${videoType}`);

    // Get player names from the taggedPlayers array (assuming they contain names)
    const playerNames = taggedPlayers ? taggedPlayers.map((player: any) => 
      typeof player === 'string' ? player : player.playerName || player.name || 'Unknown Player'
    ).join(', ') : 'No players tagged';

    // Create detailed prompt based on video type
    let analysisPrompt = '';
    
    switch (videoType) {
      case 'match':
        analysisPrompt = `As a professional football analyst, provide a comprehensive analysis of this match video titled "${videoTitle}". ${videoDescription ? `Video Description: ${videoDescription}` : ''}

MATCH DETAILS:
- Opposition: ${opposingTeam}
- Tagged Players: ${playerNames}
- Player Statistics: ${JSON.stringify(playerStats)}

Please provide a detailed professional analysis including:

1. MATCH OVERVIEW & CONTEXT
- Overall match flow and key phases
- Tactical setup and formations observed
- Weather/pitch conditions impact (if visible)

2. INDIVIDUAL PLAYER ANALYSIS (focus on tagged players: ${playerNames})
For each tagged player, analyze:
- Technical performance (first touch, passing accuracy, ball control)
- Tactical awareness (positioning, decision-making, game intelligence)
- Physical attributes (pace, strength, stamina displayed)
- Mental aspects (composure under pressure, leadership, communication)
- Key moments and contributions
- Areas of excellence and improvement needed

3. TEAM PERFORMANCE ASSESSMENT
- Attacking patterns and effectiveness
- Defensive organization and vulnerabilities
- Transition play (defense to attack and vice versa)
- Set piece execution
- Communication and coordination

4. TACTICAL ANALYSIS
- Formation effectiveness
- Pressing triggers and intensity
- Build-up play patterns
- Counter-attacking opportunities
- Substitution impact

5. KEY MOMENTS & TURNING POINTS
- Goals scored/conceded with detailed breakdown
- Missed opportunities and their causes
- Defensive errors or excellent saves
- Game-changing moments

6. PERFORMANCE METRICS EVALUATION
Based on the statistics provided: ${JSON.stringify(playerStats)}
- Contextualize the numbers with what was observed
- Highlight standout statistical performances
- Identify areas where stats don't tell the full story

7. DEVELOPMENT RECOMMENDATIONS
For each tagged player (${playerNames}):
- Specific technical skills to work on
- Tactical understanding improvements
- Physical development needs
- Mental/psychological aspects

8. SCOUTING SUMMARY
- Player market value assessment
- Transfer readiness evaluation
- League/level suitability
- Comparison to similar players

Provide specific examples, timestamps where possible, and actionable insights. Use professional football terminology and be detailed in your explanations.`;
        break;

      case 'training':
        analysisPrompt = `As a football training analyst, provide a comprehensive analysis of this training session video titled "${videoTitle}". ${videoDescription ? `Description: ${videoDescription}` : ''}

TRAINING SESSION DETAILS:
- Tagged Players: ${playerNames}

Please provide detailed analysis including:

1. TRAINING SESSION OVERVIEW
- Session objectives and focus areas
- Training intensity and duration
- Drill progression and structure

2. INDIVIDUAL PLAYER ASSESSMENT (${playerNames})
For each tagged player:
- Technical execution in drills
- Learning pace and adaptation
- Effort level and commitment
- Interaction with teammates and coaches
- Areas of strength demonstrated
- Skills needing development

3. DRILL ANALYSIS
- Effectiveness of training exercises
- Player engagement levels
- Skill transfer potential to match situations
- Difficulty progression appropriateness

4. PHYSICAL CONDITIONING OBSERVATIONS
- Fitness levels displayed
- Recovery between exercises
- Injury prevention measures
- Physical development areas

5. TACTICAL UNDERSTANDING
- Positional awareness in drills
- Decision-making under pressure
- Communication and teamwork
- Game intelligence development

6. DEVELOPMENT RECOMMENDATIONS
- Individual player development priorities
- Additional training focus suggestions
- Skill-specific drill recommendations
- Long-term development pathway

Provide specific observations with reasoning and actionable development advice.`;
        break;

      case 'highlight':
        analysisPrompt = `As a football scout and analyst, provide a comprehensive analysis of this highlight video titled "${videoTitle}". ${videoDescription ? `Description: ${videoDescription}` : ''}

HIGHLIGHT REEL DETAILS:
- Featured Players: ${playerNames}

Please provide detailed analysis including:

1. HIGHLIGHT SUMMARY
- Most impressive moments showcased
- Overall quality of plays featured
- Variety of skills demonstrated

2. INDIVIDUAL PLAYER SHOWCASE (${playerNames})
For each featured player:
- Standout technical abilities
- Game intelligence displayed
- Physical attributes highlighted
- Mental strength in key moments
- Signature moves or playing style
- Consistency across different scenarios

3. TECHNICAL SKILL ANALYSIS
- Ball control and first touch quality
- Passing range and accuracy
- Shooting technique and power
- Dribbling ability and close control
- Defensive actions (if applicable)

4. TACTICAL AWARENESS EVALUATION
- Positioning and movement
- Decision-making in crucial moments
- Understanding of game flow
- Adaptability to different situations

5. STANDOUT MOMENTS BREAKDOWN
Detailed analysis of each key highlight:
- Context and situation
- Technical execution
- Decision-making process
- Impact on the game/situation
- Difficulty level assessment

6. PLAYER COMPARISON & BENCHMARKING
- Playing style similarities to known players
- Level assessment compared to peers
- Unique qualities that stand out
- Market value implications

7. SCOUTING VERDICT
- Overall rating and assessment
- Transfer potential and readiness
- Suitable leagues/teams
- Development areas despite highlights
- Long-term potential evaluation

Be specific about what makes these moments highlight-worthy and provide professional scouting insights.`;
        break;

      case 'interview':
        analysisPrompt = `As a sports journalist and analyst, provide a comprehensive analysis of this interview video titled "${videoTitle}". ${videoDescription ? `Description: ${videoDescription}` : ''}

INTERVIEW ANALYSIS:
- Featured Person: ${playerNames}

Please provide detailed analysis including:

1. INTERVIEW OVERVIEW
- Main topics and themes discussed
- Interview setting and atmosphere
- Communication style and clarity

2. KEY INSIGHTS SHARED
- Important revelations or announcements
- Strategic information disclosed
- Personal perspectives and opinions
- Career-related discussions

3. PERSONALITY ASSESSMENT
- Communication skills and media presence
- Confidence and composure
- Emotional intelligence displayed
- Leadership qualities evident
- Authenticity and sincerity

4. PROFESSIONAL INSIGHTS
- Tactical knowledge demonstrated
- Understanding of the game
- Relationship with teammates/coaches
- Career ambitions and goals
- Professional maturity level

5. NOTABLE QUOTES & STATEMENTS
- Most significant quotes with context
- Controversial or attention-grabbing statements
- Inspirational or motivational messages
- Technical insights shared

6. MEDIA READINESS EVALUATION
- Handling of difficult questions
- PR awareness and skill
- Brand potential assessment
- Marketing appeal

7. IMPLICATIONS & TAKEAWAYS
- Impact on team dynamics
- Transfer market implications
- Fan and media reaction potential
- Career development insights

Provide context for statements and analyze the broader implications of the conversation.`;
        break;

      default:
        analysisPrompt = `As a professional football analyst, provide a comprehensive analysis of this sports video titled "${videoTitle}". ${videoDescription ? `Description: ${videoDescription}` : ''}

GENERAL VIDEO ANALYSIS:
- Featured Players: ${playerNames}

Please provide detailed professional analysis including:

1. VIDEO CONTENT OVERVIEW
- Type of content and context
- Quality and clarity of footage
- Key elements captured

2. PLAYER ANALYSIS (${playerNames})
For each visible player:
- Performance assessment
- Technical skills observed
- Tactical awareness displayed
- Physical attributes noted
- Areas of strength and improvement

3. TECHNICAL OBSERVATIONS
- Skills and abilities demonstrated
- Execution quality assessment
- Consistency in performance
- Standout moments

4. PROFESSIONAL EVALUATION
- Overall assessment and rating
- Development potential
- Suitability for different levels
- Comparison to position standards

5. KEY INSIGHTS & RECOMMENDATIONS
- Main takeaways from the video
- Development priorities
- Strategic recommendations
- Future potential assessment

Provide specific observations with professional reasoning and actionable insights.`;
    }

    // Call Gemini API for video analysis
    console.log('Calling Gemini API for analysis...');
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 4096,
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    const analysisText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!analysisText) {
      throw new Error('No analysis text received from Gemini API');
    }

    console.log('AI analysis completed successfully');

    // Parse the analysis text to extract structured data
    const analysisLines = analysisText.split('\n').filter(line => line.trim());
    
    // Extract key highlights (look for numbered lists or bullet points)
    const highlights = analysisLines
      .filter(line => 
        line.match(/^[-*•]\s/) || 
        line.match(/^\d+\.\s/) ||
        line.includes('highlight') ||
        line.includes('standout') ||
        line.includes('excellent') ||
        line.includes('impressive')
      )
      .slice(0, 8)
      .map(line => line.replace(/^[-*•]\s|\d+\.\s/, '').trim());

    // Extract recommendations (look for improvement suggestions)
    const recommendations = analysisLines
      .filter(line => 
        line.toLowerCase().includes('recommend') ||
        line.toLowerCase().includes('should') ||
        line.toLowerCase().includes('improve') ||
        line.toLowerCase().includes('develop') ||
        line.toLowerCase().includes('focus on') ||
        line.toLowerCase().includes('work on')
      )
      .slice(0, 6)
      .map(line => line.trim());

    // Create performance metrics from the analysis
    const performanceMetrics: Record<string, string> = {
      'Analysis Type': videoType.charAt(0).toUpperCase() + videoType.slice(1),
      'Players Analyzed': playerNames,
      'Analysis Depth': 'Comprehensive Professional Assessment',
      'Key Focus Areas': highlights.length > 0 ? `${highlights.length} major points identified` : 'General overview provided'
    };

    // Add video-specific metrics
    if (opposingTeam) {
      performanceMetrics['Opposition'] = opposingTeam;
    }

    // Save comprehensive analysis to database
    const { error: updateError } = await supabase
      .from('enhanced_video_analysis')
      .upsert({
        video_id: videoId,
        analysis_status: 'completed',
        overall_assessment: analysisText,
        recommendations: recommendations.length > 0 ? recommendations : ['Continue current development path', 'Focus on consistency', 'Maintain performance levels'],
        game_context: {
          key_highlights: highlights.length > 0 ? highlights : ['Comprehensive analysis completed', 'Performance evaluation provided', 'Professional assessment delivered'],
          performance_metrics: performanceMetrics,
          video_type: videoType,
          analyzed_players: playerNames,
          analysis_model: 'gemini-1.5-flash',
          analysis_timestamp: new Date().toISOString()
        }
      }, {
        onConflict: 'video_id'
      });

    if (updateError) {
      console.error('Error saving analysis to database:', updateError);
      throw updateError;
    }

    console.log('Analysis saved to database successfully');

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisText,
      videoType: videoType,
      playersAnalyzed: playerNames,
      highlightsCount: highlights.length,
      recommendationsCount: recommendations.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-video function:', error);
    
    // Save failed analysis to database if we have the videoId
    const requestBody = await req.text();
    let videoId = null;
    try {
      const parsed = JSON.parse(requestBody);
      videoId = parsed.videoId;
    } catch (e) {
      console.log('Could not parse request body for error handling');
    }

    if (videoId) {
      try {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        await supabase
          .from('enhanced_video_analysis')
          .upsert({
            video_id: videoId,
            analysis_status: 'failed',
            overall_assessment: null,
            recommendations: [],
            game_context: {
              error_message: error.message,
              failed_at: new Date().toISOString()
            }
          }, {
            onConflict: 'video_id'
          });
      } catch (dbError) {
        console.error('Error saving failed analysis to database:', dbError);
      }
    }
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
