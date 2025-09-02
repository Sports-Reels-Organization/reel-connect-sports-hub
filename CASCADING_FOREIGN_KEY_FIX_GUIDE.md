# Cascading Foreign Key Constraint Fix Guide

## Issue
```
ERROR: update or delete on table "transfer_pitches" violates foreign key constraint "contracts_pitch_id_fkey" on table "contracts"
```

## Root Cause
The `contracts` table has a foreign key constraint (`contracts_pitch_id_fkey`) that references `transfer_pitches.id`. When you try to delete records from `transfer_pitches`, PostgreSQL prevents it because there are contracts that depend on those records.

## The Problem Chain
```
contracts.pitch_id → transfer_pitches.id
transfer_pitches.team_id → teams.id (INVALID)
transfer_pitches.player_id → players.id (INVALID)
```

## Solutions

### Option 1: Safe Fix (Recommended)
**Use `safe_fix_foreign_key_violation.sql`**

This approach:
- ✅ **Preserves all contracts**
- ✅ **Sets invalid references to NULL** instead of deleting
- ✅ **Maintains data integrity**
- ✅ **No data loss**

**Steps:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste contents of `safe_fix_foreign_key_violation.sql`
3. Execute the script

### Option 2: Complete Cleanup
**Use `fix_cascading_foreign_key_violation.sql`**

This approach:
- ⚠️ **Deletes contracts** that reference invalid transfer_pitches
- ✅ **Deletes invalid transfer_pitches**
- ⚠️ **May cause data loss**

**Only use this if:**
- The contracts referencing invalid pitches are test data
- You're okay with losing those contracts
- You want a completely clean database

## Why This Happens

1. **Cascading Constraints**: `contracts` → `transfer_pitches` → `teams`/`players`
2. **Invalid Data**: `transfer_pitches` has `team_id`/`player_id` that don't exist
3. **Constraint Protection**: PostgreSQL prevents deletion to maintain referential integrity

## Prevention

### Before Creating Transfer Pitches
Always validate that `team_id` and `player_id` exist:

```typescript
// Verify team exists
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

### Database Design
Consider adding `ON DELETE CASCADE` to foreign key constraints if you want automatic cleanup:

```sql
ALTER TABLE contracts 
ADD CONSTRAINT contracts_pitch_id_fkey 
FOREIGN KEY (pitch_id) REFERENCES transfer_pitches(id) ON DELETE CASCADE;
```

## Testing After Fix

1. **Clear browser cache**
2. **Hard refresh the application** (Ctrl+F5)
3. **Try creating a new transfer pitch**
4. **Check that it works without errors**
5. **Verify contracts are still intact**

## Expected Results

After running the safe fix:
- ✅ No more foreign key constraint violations
- ✅ Transfer pitches can be created successfully
- ✅ All contracts remain intact
- ✅ Invalid references are set to NULL
- ✅ Application works properly

## Files Available

- `safe_fix_foreign_key_violation.sql` - **Safe fix (recommended)**
- `fix_cascading_foreign_key_violation.sql` - **Complete cleanup (may cause data loss)**
- `CASCADING_FOREIGN_KEY_FIX_GUIDE.md` - **This guide**

## Recommendation

**Use the safe fix first** (`safe_fix_foreign_key_violation.sql`). It will resolve the constraint violation without losing any data. If you need a completely clean database later, you can run the complete cleanup script.

The safe fix should resolve your immediate issue while preserving all existing data.
