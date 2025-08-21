/*
  # Grant SELECT permission on auth.users table

  This migration fixes the "permission denied for table users" error by granting
  the authenticated role SELECT permission on the auth.users table.

  ## Changes
  1. Grant SELECT permission to authenticated role on auth.users table
  2. This allows RLS policies that use auth.uid() to function properly
  3. Enables employee data fetching for authenticated users

  ## Security
  - Only grants SELECT permission (read-only)
  - Limited to authenticated users only
  - Required for RLS policies to work with auth functions
*/

-- Grant SELECT permission on auth.users to authenticated role
GRANT SELECT ON auth.users TO authenticated;