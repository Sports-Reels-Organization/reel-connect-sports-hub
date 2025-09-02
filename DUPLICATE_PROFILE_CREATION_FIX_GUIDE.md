# Duplicate Profile Creation Fix Guide

## Issue
```
409 (Conflict) - duplicate key value violates unique constraint "profiles_user_id_key"
```

## Root Cause
The error occurs when trying to create a profile with a `user_id` that already exists in the `profiles` table. This happens when:

1. **Multiple Profile Creation Attempts**: The profile creation process runs multiple times
2. **Race Conditions**: Auth triggers and manual profile creation happen simultaneously
3. **Existing User**: A user tries to sign up again with the same email
4. **Database Triggers**: Auth triggers create profiles while the app also tries to create them

## Solutions

### Option 1: Database Cleanup (Immediate Fix)
**Run `fix_duplicate_profile_creation.sql`**

This script will:
- ✅ **Identify duplicate profiles**
- ✅ **Keep the oldest profile for each user_id**
- ✅ **Delete duplicate entries**
- ✅ **Verify cleanup was successful**

**Steps:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste contents of `fix_duplicate_profile_creation.sql`
3. Execute the script

### Option 2: Improve Profile Creation Logic
The AuthContext already has some handling for this (lines 188-204), but we can improve it.

**Current Logic:**
```typescript
if (error.code === '23505') {
  // Try to fetch the existing profile
  const { data: retryFetch } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (retryFetch) {
    return retryFetch;
  }
}
```

**Improved Logic:**
```typescript
if (error.code === '23505') {
  // Profile already exists, fetch it
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (existingProfile) {
    console.log('Using existing profile:', existingProfile);
    return existingProfile;
  }
}
```

### Option 3: Use UPSERT Instead of INSERT
Replace the profile creation with an upsert operation:

```typescript
const { data, error } = await supabase
  .from('profiles')
  .upsert(profileData, { 
    onConflict: 'user_id',
    ignoreDuplicates: false 
  })
  .select()
  .single();
```

## Prevention

### 1. Check Before Creating
Always check if a profile exists before creating:

```typescript
const { data: existingProfile } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)
  .single();

if (existingProfile) {
  return existingProfile;
}
```

### 2. Use Database Triggers
Ensure your database has proper triggers to create profiles automatically:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, user_type)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'team');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### 3. Handle Race Conditions
Add proper error handling and retry logic:

```typescript
const createProfileWithRetry = async (userId: string, userData: any, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error && error.code === '23505') {
        // Profile already exists, fetch it
        const { data: existing } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (existing) return existing;
      }

      if (data) return data;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

## Testing After Fix

1. **Clear browser cache**
2. **Hard refresh the application** (Ctrl+F5)
3. **Try signing up with a new email**
4. **Try signing up with an existing email**
5. **Check that no duplicate key errors occur**

## Expected Results

After running the database cleanup:
- ✅ No more duplicate profile entries
- ✅ Profile creation works without conflicts
- ✅ Existing users can sign in normally
- ✅ New users can sign up successfully

## Files Available

- `fix_duplicate_profile_creation.sql` - **Database cleanup (recommended)**
- `DUPLICATE_PROFILE_CREATION_FIX_GUIDE.md` - **This guide**

## Recommendation

**Run the database cleanup script first** (`fix_duplicate_profile_creation.sql`). This will resolve the immediate issue by removing duplicate profiles. The AuthContext already has some handling for this error, so it should work better after the cleanup.

The duplicate profile creation issue should be resolved after running the cleanup script.
