
-- Create agent_shortlist table for agents to save interested pitches
CREATE TABLE IF NOT EXISTS public.agent_shortlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  pitch_id UUID NOT NULL REFERENCES public.transfer_pitches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  notes TEXT,
  priority_level TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, pitch_id)
);

-- Add Row Level Security
ALTER TABLE public.agent_shortlist ENABLE ROW LEVEL SECURITY;

-- Create policy for agents to manage their own shortlist
CREATE POLICY "Agents can manage their own shortlist" 
  ON public.agent_shortlist 
  FOR ALL 
  USING (agent_id IN (
    SELECT a.id FROM agents a 
    JOIN profiles p ON a.profile_id = p.id 
    WHERE p.user_id = auth.uid()
  ));

-- Create function to increment pitch view count
CREATE OR REPLACE FUNCTION public.increment_pitch_view_count(pitch_uuid uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE public.transfer_pitches 
  SET view_count = view_count + 1 
  WHERE id = pitch_uuid;
END;
$function$;
