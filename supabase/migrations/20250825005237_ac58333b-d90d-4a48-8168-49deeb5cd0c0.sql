
-- Create enhanced video analysis table
CREATE TABLE public.enhanced_video_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  analysis_status TEXT NOT NULL DEFAULT 'pending',
  tagged_player_present BOOLEAN DEFAULT false,
  overview TEXT,
  key_events JSONB DEFAULT '[]'::jsonb,
  context_reasoning TEXT,
  explanations TEXT,
  recommendations TEXT[],
  visual_summary JSONB DEFAULT '{}'::jsonb,
  player_performance_radar JSONB DEFAULT '{}'::jsonb,
  event_timeline JSONB DEFAULT '[]'::jsonb,
  tagged_player_analysis JSONB DEFAULT '{}'::jsonb,
  missing_players JSONB DEFAULT '[]'::jsonb,
  analysis_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create AI analysis reports table for PDF storage
CREATE TABLE public.ai_analysis_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL DEFAULT 'comprehensive',
  pdf_url TEXT NOT NULL,
  report_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for enhanced analysis
ALTER TABLE public.enhanced_video_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis_reports ENABLE ROW LEVEL SECURITY;

-- Teams can manage their video analysis
CREATE POLICY "Teams can manage their video analysis" 
  ON public.enhanced_video_analysis 
  FOR ALL 
  USING (video_id IN (
    SELECT v.id FROM videos v 
    JOIN teams t ON v.team_id = t.id 
    WHERE t.profile_id = auth.uid()
  ));

-- Teams can manage their analysis reports
CREATE POLICY "Teams can manage their analysis reports" 
  ON public.ai_analysis_reports 
  FOR ALL 
  USING (team_id IN (
    SELECT id FROM teams WHERE profile_id = auth.uid()
  ));

-- Create trigger for analysis status updates
CREATE OR REPLACE FUNCTION public.update_video_analysis_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE videos 
  SET ai_analysis_status = 'completed'
  WHERE id = NEW.video_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_video_analysis_status
  AFTER INSERT ON enhanced_video_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_video_analysis_status();
