-- Test to verify user targeting in the trigger
-- This will help us see exactly who should get notifications

-- 1. First, let's see the current agent interest records and verify the relationships
SELECT 
  ai.id as interest_id,
  ai.pitch_id,
  ai.agent_id,
  ai.status,
  ai.created_at,
  
  -- Agent info
  a.profile_id as agent_profile_id,
  agent_profile.user_id as agent_user_id,
  agent_profile.full_name as agent_name,
  agent_profile.user_type as agent_type,
  
  -- Team info
  t.id as team_id,
  t.profile_id as team_profile_id,
  team_profile.user_id as team_user_id,
  team_profile.full_name as team_name,
  team_profile.user_type as team_type,
  
  -- Player info
  p.full_name as player_name

FROM agent_interest ai
JOIN transfer_pitches tp ON ai.pitch_id = tp.id
JOIN agents a ON ai.agent_id = a.id
JOIN profiles agent_profile ON a.profile_id = agent_profile.id
JOIN teams t ON tp.team_id = t.id
JOIN profiles team_profile ON t.profile_id = team_profile.id
JOIN players p ON tp.player_id = p.id
ORDER BY ai.created_at DESC
LIMIT 5;

-- 2. Check recent notifications to see who actually received them
SELECT 
  n.id,
  n.user_id as notification_recipient_user_id,
  n.title,
  n.message,
  n.type,
  n.created_at,
  p.full_name as recipient_name,
  p.user_type as recipient_type,
  n.metadata->>'action' as action_type
FROM notifications n
LEFT JOIN profiles p ON n.user_id = p.user_id
WHERE n.type = 'agent_interest'
AND n.created_at > NOW() - INTERVAL '2 hours'
ORDER BY n.created_at DESC
LIMIT 10;

-- 3. Test the exact query the trigger should use
-- Replace the pitch_id below with an actual pitch_id from step 1
-- SELECT 
--   profiles.user_id as team_user_id_from_trigger,
--   profiles.full_name as team_name_from_trigger,
--   profiles.user_type as team_type_from_trigger,
--   players.full_name as player_name_from_trigger,
--   teams.team_name as team_name_from_teams
-- FROM transfer_pitches
-- JOIN teams ON transfer_pitches.team_id = teams.id
-- JOIN profiles ON teams.profile_id = profiles.id
-- JOIN players ON transfer_pitches.player_id = players.id
-- WHERE transfer_pitches.id = 'REPLACE_WITH_ACTUAL_PITCH_ID';

-- 4. Verify the get_user_id_from_profile function if it exists
-- Replace with actual team profile_id from step 1
-- SELECT get_user_id_from_profile('REPLACE_WITH_TEAM_PROFILE_ID'::UUID) as function_result;

-- 5. Check if there are multiple profiles with the same user_id (shouldn't happen but worth checking)
SELECT 
  user_id,
  COUNT(*) as profile_count,
  array_agg(id) as profile_ids,
  array_agg(full_name) as names,
  array_agg(user_type) as types
FROM profiles
GROUP BY user_id
HAVING COUNT(*) > 1;
