
-- Fix missing foreign key relationships and columns that are causing the errors

-- Add missing columns to teams table
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS member_association text,
ADD COLUMN IF NOT EXISTS year_founded integer,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS titles text[];

-- Ensure proper foreign key relationship between transfer_pitches and teams
ALTER TABLE transfer_pitches 
DROP CONSTRAINT IF EXISTS transfer_pitches_team_id_fkey;

ALTER TABLE transfer_pitches 
ADD CONSTRAINT transfer_pitches_team_id_fkey 
FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

-- Ensure proper foreign key relationship between transfer_pitches and players
ALTER TABLE transfer_pitches 
DROP CONSTRAINT IF EXISTS transfer_pitches_player_id_fkey;

ALTER TABLE transfer_pitches 
ADD CONSTRAINT transfer_pitches_player_id_fkey 
FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;

-- Ensure proper foreign key relationship between players and teams
ALTER TABLE players 
DROP CONSTRAINT IF EXISTS players_team_id_fkey;

ALTER TABLE players 
ADD CONSTRAINT players_team_id_fkey 
FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- Fix agent_interest foreign key relationships
ALTER TABLE agent_interest 
DROP CONSTRAINT IF EXISTS agent_interest_agent_id_fkey;

ALTER TABLE agent_interest 
ADD CONSTRAINT agent_interest_agent_id_fkey 
FOREIGN KEY (agent_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE agent_interest 
DROP CONSTRAINT IF EXISTS agent_interest_pitch_id_fkey;

ALTER TABLE agent_interest 
ADD CONSTRAINT agent_interest_pitch_id_fkey 
FOREIGN KEY (pitch_id) REFERENCES transfer_pitches(id) ON DELETE CASCADE;

-- Ensure video_requirements table exists and has proper structure
CREATE TABLE IF NOT EXISTS video_requirements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    video_count integer DEFAULT 0,
    last_updated timestamp with time zone DEFAULT now(),
    UNIQUE(team_id)
);

-- Enable RLS on video_requirements
ALTER TABLE video_requirements ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for video_requirements
DROP POLICY IF EXISTS "Teams can view their video requirements" ON video_requirements;
CREATE POLICY "Teams can view their video requirements" 
ON video_requirements FOR SELECT 
USING (team_id IN (
    SELECT id FROM teams WHERE profile_id = (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
));

-- Initialize video_requirements for existing teams
INSERT INTO video_requirements (team_id, video_count)
SELECT t.id, COUNT(v.id)
FROM teams t
LEFT JOIN videos v ON v.team_id = t.id
GROUP BY t.id
ON CONFLICT (team_id) DO UPDATE SET 
    video_count = EXCLUDED.video_count,
    last_updated = now();
