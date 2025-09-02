# Foreign Key Constraint Fix Guide

## Issue Description
You're encountering this error:
```
ERROR: insert or update on table "transfer_pitches" violates foreign key constraint "fk_transfer_pitches_team_id"
```

## Root Cause Analysis
This error occurs when:
1. **Orphaned Records**: `transfer_pitches` table contains records with `team_id` values that don't exist in the `teams` table
2. **Constraint Name Mismatch**: The actual constraint name differs from what the code expects
3. **NULL Values**: Attempting to insert NULL values where the constraint requires NOT NULL
4. **Missing Referenced Data**: The `teams` or `players` tables are empty or missing required records

## Step-by-Step Solution

### Step 1: Diagnose the Issue
Run the diagnostic script first to understand what's happening:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `diagnose_foreign_key_issue.sql`
4. Execute the script

This will show you:
- What foreign key constraints exist
- If there are orphaned records
- Sample data from all tables

### Step 2: Apply the Fix
Based on the diagnostic results, run the comprehensive fix:

1. Copy and paste the contents of `fix_foreign_key_constraint_issue.sql`
2. Execute the script

This script will:
- Identify and report orphaned records
- Drop and recreate foreign key constraints with correct names
- Create necessary indexes
- Verify the fix worked

### Step 3: Handle Orphaned Records
The fix script will show you if there are orphaned records. You have two options:

#### Option A: Delete Orphaned Records (Recommended for test data)
If the orphaned records are test data you don't need:
```sql
DELETE FROM transfer_pitches 
WHERE team_id IS NOT NULL 
AND team_id NOT IN (SELECT id FROM teams);

DELETE FROM transfer_pitches 
WHERE player_id IS NOT NULL 
AND player_id NOT IN (SELECT id FROM players);
```

#### Option B: Fix Orphaned Records (If you want to keep them)
If you want to keep the records, update them with valid IDs:
```sql
-- Update with a valid team_id (replace with actual team ID)
UPDATE transfer_pitches 
SET team_id = 'valid-team-id-here'
WHERE team_id IS NOT NULL 
AND team_id NOT IN (SELECT id FROM teams);

-- Update with a valid player_id (replace with actual player ID)
UPDATE transfer_pitches 
SET player_id = 'valid-player-id-here'
WHERE player_id IS NOT NULL 
AND player_id NOT IN (SELECT id FROM players);
```

### Step 4: Verify the Fix
After running the fix script, verify everything works:

1. **Check Constraints**: The script will show if constraints were created successfully
2. **Test Insert**: Try creating a new transfer pitch in your application
3. **Check Console**: Ensure no more foreign key errors appear

## Prevention Measures

### 1. Data Validation in Code
Add validation before inserting records:

```typescript
// Before inserting transfer_pitches
const { data: teamData } = await supabase
  .from('teams')
  .select('id')
  .eq('profile_id', profile.id)
  .single();

if (!teamData) {
  throw new Error('Team not found for current user');
}

// Verify player exists
const { data: playerData } = await supabase
  .from('players')
  .select('id')
  .eq('id', pitchData.playerId)
  .single();

if (!playerData) {
  throw new Error('Player not found');
}
```

### 2. Database Constraints
Ensure proper foreign key constraints are in place:
- `transfer_pitches.team_id` → `teams.id`
- `transfer_pitches.player_id` → `players.id`

### 3. RLS Policies
Make sure RLS policies allow the operations you need:
- Teams can insert their own pitches
- Authenticated users can view transfer pitches

## Common Scenarios

### Scenario 1: Empty Tables
If `teams` or `players` tables are empty:
1. Create some test data first
2. Then create transfer pitches

### Scenario 2: Profile ID Mismatch
If team lookup fails:
1. Check if `profiles` table has the correct user
2. Verify `teams.profile_id` matches `profiles.id`

### Scenario 3: Constraint Name Issues
If constraint names don't match:
1. Drop existing constraints
2. Recreate with correct names
3. Update code to use correct constraint names

## Testing Checklist

After applying the fix:
- [ ] Diagnostic script runs without errors
- [ ] Fix script completes successfully
- [ ] No orphaned records remain
- [ ] Foreign key constraints are properly created
- [ ] Can create new transfer pitches
- [ ] Can query existing transfer pitches
- [ ] No console errors in application

## Support

If the issue persists:
1. Run the diagnostic script and share the results
2. Check if you have the necessary permissions in Supabase
3. Verify your database schema matches the expected structure
4. Ensure RLS policies are correctly configured

## Files Created
- `diagnose_foreign_key_issue.sql` - Diagnostic script
- `fix_foreign_key_constraint_issue.sql` - Comprehensive fix script
- `FOREIGN_KEY_CONSTRAINT_FIX_GUIDE.md` - This guide
