# Foreign Key Constraint Violation Fix Guide

## Issue
```
ERROR: insert or update on table "transfer_pitches" violates foreign key constraint "transfer_pitches_team_id_fkey"
```

## Root Cause
This error occurs when you're trying to insert a `team_id` value into `transfer_pitches` that doesn't exist in the `teams` table. The foreign key constraint is working correctly - it's preventing invalid data.

## Possible Causes
1. **Orphaned Records**: Existing `transfer_pitches` records have `team_id` values that don't exist in `teams`
2. **Invalid Data**: You're trying to insert a `team_id` that doesn't exist
3. **Data Type Mismatch**: The `team_id` format doesn't match the `teams.id` format

## Solutions

### Option 1: Quick Fix (Recommended)
Run the `quick_fix_foreign_key_violation.sql` script:

1. **Go to Supabase Dashboard → SQL Editor**
2. **Copy and paste the contents of `quick_fix_foreign_key_violation.sql`**
3. **Execute the script**

This will:
- ✅ Clean up orphaned records
- ✅ Verify the constraint works
- ✅ Show available teams and players

### Option 2: Diagnostic Approach
If you want to see what's wrong first, run `fix_foreign_key_violation.sql`:

1. **Run the diagnostic script first**
2. **Review the problematic records**
3. **Choose to delete or nullify invalid references**
4. **Uncomment the appropriate fix section**

## Prevention

### Before Inserting New Records
Always verify that the `team_id` and `player_id` exist:

```sql
-- Check if team exists
SELECT id FROM teams WHERE id = 'your-team-id';

-- Check if player exists  
SELECT id FROM players WHERE id = 'your-player-id';
```

### In Your Application Code
Add validation before inserting:

```typescript
// Verify team exists before creating transfer pitch
const { data: team } = await supabase
  .from('teams')
  .select('id')
  .eq('id', teamId)
  .single();

if (!team) {
  throw new Error('Team does not exist');
}

// Verify player exists
const { data: player } = await supabase
  .from('players')
  .select('id')
  .eq('id', playerId)
  .single();

if (!player) {
  throw new Error('Player does not exist');
}
```

## Testing After Fix

1. **Clear browser cache**
2. **Hard refresh the application** (Ctrl+F5)
3. **Try creating a new transfer pitch**
4. **Check that it works without errors**

## Expected Results

After running the fix:
- ✅ No more foreign key constraint violations
- ✅ Transfer pitches can be created successfully
- ✅ All existing data is valid
- ✅ Application works properly

## Files Available

- `quick_fix_foreign_key_violation.sql` - **Quick fix (recommended)**
- `fix_foreign_key_violation.sql` - **Diagnostic approach**
- `fix_transfer_pitches_teams_relationship.sql` - **Complete relationship fix**

## Next Steps

1. **Run the quick fix script**
2. **Test creating a transfer pitch**
3. **If still having issues, run the complete relationship fix**
4. **Apply RLS policy fixes if needed**

The foreign key constraint violation should be resolved after running the appropriate fix script.
