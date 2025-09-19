-- Test script to verify database trigger is working for agent interest notifications
-- Run this in your Supabase SQL Editor to debug

-- First, let's check if the trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_agent_interest_notifications';

-- Check if the function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'handle_agent_interest_notifications';

-- Test the get_user_id_from_profile function
-- Replace 'YOUR_TEAM_PROFILE_ID' with an actual team profile_id from your database
SELECT get_user_id_from_profile('YOUR_TEAM_PROFILE_ID'::UUID) as user_id_result;

-- Check recent notifications to see if any are being created
SELECT 
  id,
  user_id,
  title,
  message,
  type,
  created_at
FROM notifications 
WHERE type = 'agent_interest' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check recent agent interest records
SELECT 
  ai.id,
  ai.pitch_id,
  ai.agent_id,
  ai.status,
  ai.created_at,
  p.full_name as player_name,
  t.team_name,
  t.profile_id as team_profile_id
FROM agent_interest ai
JOIN transfer_pitches tp ON ai.pitch_id = tp.id
JOIN players p ON tp.player_id = p.id
JOIN teams t ON tp.team_id = t.id
ORDER BY ai.created_at DESC
LIMIT 5;
