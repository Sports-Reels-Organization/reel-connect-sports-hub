-- Debug transfer_pitches table schema to identify 406 error cause
-- Run this in Supabase SQL Editor to check the actual table structure

-- 1. Check if transfer_pitches table exists and its columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'transfer_pitches'
ORDER BY ordinal_position;

-- 2. Check if the specific columns from the error exist
SELECT 
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'transfer_pitches' AND column_name = 'id') 
    THEN '✅ id column exists'
    ELSE '❌ id column missing'
  END as id_check,
  
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'transfer_pitches' AND column_name = 'transfer_type') 
    THEN '✅ transfer_type column exists'
    ELSE '❌ transfer_type column missing'
  END as transfer_type_check,
  
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'transfer_pitches' AND column_name = 'asking_price') 
    THEN '✅ asking_price column exists'
    ELSE '❌ asking_price column missing'
  END as asking_price_check,
  
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'transfer_pitches' AND column_name = 'currency') 
    THEN '✅ currency column exists'
    ELSE '❌ currency column missing'
  END as currency_check,
  
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'transfer_pitches' AND column_name = 'player_id') 
    THEN '✅ player_id column exists'
    ELSE '❌ player_id column missing'
  END as player_id_check;

-- 3. Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN 'RLS is enabled'
    ELSE 'RLS is disabled'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'transfer_pitches';

-- 4. Check foreign key constraints
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'transfer_pitches';

-- 5. Test a simple query to see if basic access works
SELECT 'Testing basic access to transfer_pitches' as test_type;
-- SELECT COUNT(*) as total_records FROM transfer_pitches;

-- 6. Check if there are any triggers on the table that might interfere
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'transfer_pitches';

-- 7. Check table permissions
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'transfer_pitches';
