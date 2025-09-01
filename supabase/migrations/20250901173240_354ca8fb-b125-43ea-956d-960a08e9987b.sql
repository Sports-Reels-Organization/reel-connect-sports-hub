
-- Fix video queries that are returning multiple rows when single expected
-- Add unique constraints and indexes to prevent duplicate data issues

-- First, let's check and fix any duplicate video entries
DELETE FROM videos a USING videos b 
WHERE a.id > b.id 
AND a.title = b.title 
AND a.team_id = b.team_id;

-- Add unique constraint on videos to prevent future duplicates
ALTER TABLE videos 
ADD CONSTRAINT unique_video_title_team 
UNIQUE (title, team_id);

-- Fix match_videos duplicates if any
DELETE FROM match_videos a USING match_videos b 
WHERE a.id > b.id 
AND a.title = b.title 
AND a.team_id = b.team_id;

-- Add unique constraint on match_videos
ALTER TABLE match_videos 
ADD CONSTRAINT unique_match_video_title_team 
UNIQUE (title, team_id);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_videos_title_team ON videos(title, team_id);
CREATE INDEX IF NOT EXISTS idx_videos_tagged_players ON videos USING GIN(tagged_players);
CREATE INDEX IF NOT EXISTS idx_match_videos_tagged_players ON match_videos USING GIN(tagged_players);

-- Ensure players table has proper indexes
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_full_name ON players(full_name);

-- Fix any potential null values that might cause query issues
UPDATE players SET position = 'Unknown' WHERE position IS NULL;
UPDATE players SET citizenship = 'Unknown' WHERE citizenship IS NULL;
UPDATE teams SET team_name = 'Unknown Team' WHERE team_name IS NULL;
UPDATE teams SET country = 'Unknown' WHERE country IS NULL;
