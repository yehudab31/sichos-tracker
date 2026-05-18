/*
  # Admin read policy for user_sicha_progress

  Allows the admin account (yehuda646@gmail.com) to read all rows
  in user_sicha_progress so the admin stats view can aggregate data.

  1. Changes
    - Add SELECT policy "Admin can read all progress" on user_sicha_progress
      scoped to the admin's user id via auth.jwt() email claim
*/

CREATE POLICY "Admin can read all progress"
  ON user_sicha_progress
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'email') = 'yehuda646@gmail.com'
  );
