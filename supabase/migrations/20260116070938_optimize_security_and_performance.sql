/*
  # Security and Performance Optimization

  ## Summary
  This migration addresses performance and security issues identified by Supabase:
  1. Adds missing indexes on foreign key columns for optimal query performance
  2. Optimizes RLS policies to use subqueries for auth.uid() to prevent row-by-row re-evaluation
  3. Fixes function search_path mutability issue
  4. Improves overall database performance and security

  ## Changes Made

  ### 1. Add Missing Foreign Key Indexes
  These indexes improve query performance when filtering by foreign key relationships:
  - food_items.category_id
  - community_shares.user_id, food_item_id, claimed_by
  - waste_tracking.food_item_id, category_id

  ### 2. Optimize RLS Policies
  Replace auth.uid() with (select auth.uid()) in all policies to prevent row-level re-evaluation.
  This is a Postgres optimization that improves performance at scale.

  ### 3. Function Search Path Security
  Fix the update_updated_at_column function to use immutable search_path.
*/

-- 1. Add missing indexes on foreign keys for performance
CREATE INDEX IF NOT EXISTS idx_food_items_category_id ON food_items(category_id);
CREATE INDEX IF NOT EXISTS idx_community_shares_user_id ON community_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_community_shares_food_item_id ON community_shares(food_item_id);
CREATE INDEX IF NOT EXISTS idx_community_shares_claimed_by ON community_shares(claimed_by);
CREATE INDEX IF NOT EXISTS idx_waste_tracking_food_item_id ON waste_tracking(food_item_id);
CREATE INDEX IF NOT EXISTS idx_waste_tracking_category_id ON waste_tracking(category_id);

-- 2. Store the current uid in a variable for use in policies
-- We'll drop and recreate the function with CASCADE, then recreate all triggers

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_items_updated_at
  BEFORE UPDATE ON food_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_shares_updated_at
  BEFORE UPDATE ON community_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. Optimize RLS policies to use (select auth.uid()) for better performance

-- Profiles table policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

-- Food items table policies
DROP POLICY IF EXISTS "Users can view own food items" ON food_items;
CREATE POLICY "Users can view own food items"
  ON food_items FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own food items" ON food_items;
CREATE POLICY "Users can insert own food items"
  ON food_items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own food items" ON food_items;
CREATE POLICY "Users can update own food items"
  ON food_items FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own food items" ON food_items;
CREATE POLICY "Users can delete own food items"
  ON food_items FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Waste tracking table policies
DROP POLICY IF EXISTS "Users can view own waste tracking" ON waste_tracking;
CREATE POLICY "Users can view own waste tracking"
  ON waste_tracking FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own waste tracking" ON waste_tracking;
CREATE POLICY "Users can insert own waste tracking"
  ON waste_tracking FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own waste tracking" ON waste_tracking;
CREATE POLICY "Users can delete own waste tracking"
  ON waste_tracking FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Community shares table policies
DROP POLICY IF EXISTS "Anyone can view available community shares" ON community_shares;
CREATE POLICY "Anyone can view available community shares"
  ON community_shares FOR SELECT
  TO authenticated
  USING (status = 'available' OR user_id = (SELECT auth.uid()) OR claimed_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own community shares" ON community_shares;
CREATE POLICY "Users can insert own community shares"
  ON community_shares FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own community shares" ON community_shares;
CREATE POLICY "Users can update own community shares"
  ON community_shares FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()) OR claimed_by = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()) OR claimed_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own community shares" ON community_shares;
CREATE POLICY "Users can delete own community shares"
  ON community_shares FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Notifications table policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- 4. Analyze tables to update query planner statistics
ANALYZE profiles;
ANALYZE food_items;
ANALYZE food_categories;
ANALYZE waste_tracking;
ANALYZE community_shares;
ANALYZE notifications;
