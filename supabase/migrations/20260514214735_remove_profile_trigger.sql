/*
  # Remove auto-create profile trigger

  The trigger on auth.users that auto-creates a profiles row was causing
  signup failures. Removing the trigger so signup only relies on
  Supabase Auth with no custom side-effects.

  1. Changes
    - Drop the trigger `on_auth_user_created` from auth.users
    - Drop the function `handle_new_user()`
*/

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
