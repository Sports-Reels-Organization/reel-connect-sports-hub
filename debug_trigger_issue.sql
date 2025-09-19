-- Debug the trigger issue - find out why notifications aren't being created

-- 1. Check if the trigger exists and is active
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_agent_interest_notifications';

-- 2. Check if the function exists
SELECT 
  routine_name, 
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_agent_interest_notifications';

-- 3. Test the get_user_id_from_profile function with actual data
-- First, let's see what team profile IDs exist
SELECT 
  t.id as team_id,
  t.team_name,
  t.profile_id as team_profile_id,
  p.user_id as team_user_id,
  p.full_name as team_name_from_profile
FROM teams t
JOIN profiles p ON t.profile_id = p.id
WHERE p.user_type = 'team'
LIMIT 5;

-- 4. Test the function with a real team profile_id (replace with actual ID from above)
-- SELECT get_user_id_from_profile('REPLACE_WITH_ACTUAL_TEAM_PROFILE_ID'::UUID) as result;

-- 5. Check recent agent_interest records
SELECT 
  ai.id,
  ai.pitch_id,
  ai.agent_id,
  ai.status,
  ai.created_at,
  tp.id as transfer_pitch_id,
  tp.team_id,
  t.team_name,
  t.profile_id as team_profile_id,
  p.full_name as player_name
FROM agent_interest ai
JOIN transfer_pitches tp ON ai.pitch_id = tp.id
JOIN teams t ON tp.team_id = t.id
JOIN players p ON tp.player_id = p.id
ORDER BY ai.created_at DESC
LIMIT 5;

-- 6. Check recent notifications
SELECT 
  n.id,
  n.user_id,
  n.title,
  n.message,
  n.type,
  n.created_at,
  pr.full_name as recipient_name,
  pr.user_type as recipient_type,
  n.metadata->>'action' as action_type,
  n.metadata->>'source' as source
FROM notifications n
LEFT JOIN profiles pr ON n.user_id = pr.user_id
WHERE n.type = 'agent_interest'
AND n.created_at > NOW() - INTERVAL '1 hour'
ORDER BY n.created_at DESC
LIMIT 10;

-- 7. Check if there are any errors in the logs
-- (This would show in your Supabase dashboard logs, not in SQL results)

-- 8. Test manual notification creation to ensure the notifications table works
-- INSERT INTO notifications (
--   user_id,
--   title,
--   message,
--   type,
--   action_url,
--   action_text,
--   metadata,
--   is_read,
--   created_at
-- ) VALUES (
--   'REPLACE_WITH_ACTUAL_USER_ID',  -- Use a real user_id from step 3
--   'Test Notification',
--   'This is a test notification to verify the table works',
--   'test',
--   '/test',
--   'Test Action',
--   '{"test": true}',
--   false,
--   NOW()
-- );

-- 9. Check if RLS policies are blocking notifications
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'notifications';

-- 10. Simplified test trigger (uncomment to test)
/*
CREATE OR REPLACE FUNCTION test_simple_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE NOTICE 'SIMPLE TRIGGER FIRED: Operation = %, Pitch ID = %', TG_OP, NEW.pitch_id;
  
  -- Try to insert a simple notification
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    is_read,
    created_at
  ) VALUES (
    'REPLACE_WITH_ACTUAL_USER_ID',  -- Use a real user_id
    'Simple Test',
    'Simple trigger test',
    'test',
    false,
    NOW()
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS test_simple_trigger ON agent_interest;
CREATE TRIGGER test_simple_trigger
  AFTER INSERT ON agent_interest
  FOR EACH ROW
  EXECUTE FUNCTION test_simple_trigger();
*/
