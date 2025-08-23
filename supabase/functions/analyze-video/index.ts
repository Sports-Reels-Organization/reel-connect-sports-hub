
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

    // Create appropriate prompt based on video type
    let analysisPrompt = '';
    
    switch (videoType) {
      case 'match':
        analysisPrompt = `Analyze this football match video titled "${videoTitle}". ${videoDescription ? `Description: ${videoDescription}` : ''}
        
This is a match against ${opposingTeam}. The following players were tagged: ${taggedPlayers.map((p: any) => `${p.playerName} (#${p.jerseyNumber})`).join(', ')}.

Please provide a comprehensive match analysis including:
1. Overall match summary and key moments
2. Team performance assessment
3. Individual player performances (focus on tagged players)
4. Goals, assists, fouls, cards, and significant plays
5. Tactical analysis and team formations
6. Key substitutions and their impact
7. Areas for improvement and recommendations
8. Match turning points and decisive moments

Player statistics recorded: ${JSON.stringify(playerStats)}

Focus on tactical insights, player positioning, decision-making, and overall team coordination. Provide constructive feedback for improvement.`;
        break;

      case 'interview':
        analysisPrompt = `Analyze this sports interview video titled "${videoTitle}". ${videoDescription ? `Description: ${videoDescription}` : ''}

Please provide a comprehensive interview summary including:
1. Main topics discussed
2. Key insights and quotes
3. Player/coach perspectives shared
4. Important announcements or revelations
5. Overall tone and mood of the interview
6. Notable questions and responses
7. Any strategic information revealed
8. Personal insights about the player/team

Focus on extracting meaningful content and key messages from the conversation.`;
        break;

      case 'training':
        analysisPrompt = `Analyze this training session video titled "${videoTitle}". ${videoDescription ? `Description: ${videoDescription}` : ''}

Please provide a comprehensive training analysis including:
1. Training objectives and focus areas
2. Drills and exercises performed
3. Player participation and engagement levels
4. Technical skills being developed
5. Physical conditioning elements
6. Team coordination and communication
7. Areas needing improvement
8. Recommended additional training focus
9. Overall session effectiveness
10. Individual player progress observations

Provide constructive feedback for optimizing future training sessions and player development.`;
        break;

      case 'highlight':
        analysisPrompt = `Analyze this sports highlight video titled "${videoTitle}". ${videoDescription ? `Description: ${videoDescription}` : ''}

Please provide a comprehensive highlight analysis including:
1. Summary of featured moments
2. Standout individual performances
3. Most impressive plays and skills displayed
4. Technical execution quality
5. Tactical awareness shown in highlights
6. Key statistics from featured moments
7. What made these moments highlight-worthy
8. Impact on team/player reputation
9. Areas of excellence demonstrated
10. Memorable aspects for fans and scouts

Focus on what makes these moments special and their significance for the team/players involved.`;
        break;

      default:
        analysisPrompt = `Analyze this sports video titled "${videoTitle}". ${videoDescription ? `Description: ${videoDescription}` : ''}

Please provide a comprehensive video analysis including key observations, notable moments, and insights about the content.`;
    }

    // Call Gemini API for video analysis
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
          maxOutputTokens: 2048,
        }
      })
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const analysisText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!analysisText) {
      throw new Error('No analysis text received from Gemini API');
    }

    console.log('AI analysis completed successfully');

    // Save analysis to database
    const { error: updateError } = await supabase
      .from('videos')
      .update({
        ai_analysis: {
          analysis: analysisText,
          video_type: videoType,
          analyzed_at: new Date().toISOString(),
          model_used: 'gemini-1.5-flash'
        },
        ai_analysis_status: 'completed'
      })
      .eq('id', videoId);

    if (updateError) {
      console.error('Error saving analysis to database:', updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisText,
      videoType: videoType
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
