# Profile Creation Race Condition Fix

## Issue
The profile creation was happening multiple times for the same user, causing duplicate key constraint violations even though the profile was being created successfully.

## Root Cause
1. **Race Conditions**: Multiple profile creation attempts happening simultaneously
2. **Auth Triggers**: Database triggers creating profiles while the app also tries to create them
3. **No Duplicate Prevention**: No mechanism to prevent multiple creation attempts for the same user

## Fix Applied

### 1. **Improved Profile Creation Logic**
- **Reduced retry attempts** from 5 to 3 to minimize race conditions
- **Used UPSERT instead of INSERT** to handle conflicts gracefully
- **Better error handling** for duplicate key scenarios

### 2. **Added Duplicate Prevention**
- **Profile creation tracking**: Added `profileCreationAttempts` Set to track ongoing creation attempts
- **Wait and retry**: If a creation is already in progress, wait and try to fetch the existing profile
- **Cleanup**: Properly remove users from the tracking set when done

### 3. **Enhanced Error Handling**
- **UPSERT with conflict resolution**: Uses `onConflict: 'user_id'` to handle duplicates
- **Fallback to fetch**: If upsert fails, tries to fetch the existing profile
- **Graceful degradation**: Returns existing profile instead of failing

## Code Changes

### Before:
```typescript
// Multiple retry attempts with INSERT
for (let attempt = 1; attempt <= 5; attempt++) {
  // ... fetch attempts
}

// Direct INSERT that could fail
const { data, error } = await supabase
  .from('profiles')
  .insert(profileData)
  .select()
  .single();
```

### After:
```typescript
// Check for ongoing creation attempts
if (profileCreationAttempts.has(userId)) {
  // Wait and fetch existing profile
}

// Mark creation attempt
profileCreationAttempts.add(userId);

// Use UPSERT to handle conflicts
const { data, error } = await supabase
  .from('profiles')
  .upsert(profileData, { 
    onConflict: 'user_id',
    ignoreDuplicates: false 
  })
  .select()
  .single();

// Cleanup
finally {
  profileCreationAttempts.delete(userId);
}
```

## Benefits

1. **No More Duplicate Key Errors**: UPSERT handles conflicts gracefully
2. **Prevents Race Conditions**: Tracking prevents multiple simultaneous attempts
3. **Better Performance**: Reduced retry attempts and smarter logic
4. **Graceful Fallbacks**: Always returns a profile if one exists
5. **Cleaner Code**: Simplified logic with better error handling

## Testing

After the fix:
1. **Clear browser cache**
2. **Hard refresh the application** (Ctrl+F5)
3. **Try signing up with a new email**
4. **Try signing up with an existing email**
5. **Check console logs** - should see "Profile found after waiting" or "Profile created successfully"

## Expected Results

- ✅ **No more duplicate key constraint violations**
- ✅ **Profile creation works reliably**
- ✅ **Existing users can sign in normally**
- ✅ **New users can sign up successfully**
- ✅ **Better performance and fewer retries**

## Files Modified

- `src/contexts/AuthContext.tsx` - **Improved profile creation logic**

The race condition issue should now be resolved, and profile creation should work smoothly without duplicate key errors.
