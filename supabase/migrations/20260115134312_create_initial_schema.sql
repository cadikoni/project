/*
  # Food Waste Reduction App - Initial Schema

  ## Overview
  This migration creates the core database schema for a food waste reduction application.
  It includes tables for user profiles, food categories, food items, waste tracking, 
  community shares, and notifications.

  ## New Tables

  ### 1. `profiles`
  User profile information extending auth.users
  - `id` (uuid, primary key) - References auth.users
  - `full_name` (text) - User's full name
  - `avatar_url` (text, nullable) - Profile picture URL
  - `location` (text, nullable) - User's location for community sharing
  - `notification_enabled` (boolean) - Push notification preference
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last profile update

  ### 2. `food_categories`
  Predefined categories for food items
  - `id` (uuid, primary key)
  - `name` (text) - Category name (e.g., "Dairy", "Produce", "Meat")
  - `icon` (text) - Icon identifier for UI
  - `color` (text) - Color code for UI
  - `created_at` (timestamptz)

  ### 3. `food_items`
  User's food inventory
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References profiles
  - `category_id` (uuid) - References food_categories
  - `name` (text) - Food item name
  - `quantity` (integer) - Quantity in stock
  - `unit` (text) - Unit of measurement (e.g., "kg", "pieces", "liters")
  - `purchase_date` (date) - When item was purchased
  - `expiration_date` (date) - When item expires
  - `barcode` (text, nullable) - Barcode for quick scanning
  - `storage_location` (text) - Where item is stored (e.g., "Fridge", "Pantry")
  - `notes` (text, nullable) - Additional notes
  - `status` (text) - Item status: "fresh", "expiring_soon", "expired", "consumed", "wasted"
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `waste_tracking`
  Track wasted food items for analytics
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References profiles
  - `food_item_id` (uuid, nullable) - References food_items
  - `item_name` (text) - Name of wasted item
  - `category_id` (uuid) - References food_categories
  - `quantity` (integer) - Quantity wasted
  - `unit` (text) - Unit of measurement
  - `reason` (text) - Reason for waste (e.g., "expired", "spoiled", "excess")
  - `wasted_date` (date) - When item was wasted
  - `estimated_value` (numeric) - Estimated monetary value lost
  - `created_at` (timestamptz)

  ### 5. `community_shares`
  Share surplus food with community
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References profiles (sharer)
  - `food_item_id` (uuid, nullable) - References food_items
  - `title` (text) - Share listing title
  - `description` (text) - Details about the food
  - `quantity` (integer) - Available quantity
  - `unit` (text) - Unit of measurement
  - `pickup_location` (text) - Where to collect the food
  - `available_until` (timestamptz) - When offer expires
  - `image_url` (text, nullable) - Photo of the food
  - `status` (text) - Status: "available", "claimed", "completed", "cancelled"
  - `claimed_by` (uuid, nullable) - References profiles (claimer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. `notifications`
  User notifications for expiring items and community shares
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References profiles
  - `title` (text) - Notification title
  - `message` (text) - Notification content
  - `type` (text) - Type: "expiration_warning", "community_share", "waste_reminder"
  - `reference_id` (uuid, nullable) - Related record ID
  - `read` (boolean) - Whether notification has been read
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Community shares are publicly readable but only editable by creator
  - Food categories are publicly readable
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text NOT NULL,
  avatar_url text,
  location text,
  notification_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create food_categories table
CREATE TABLE IF NOT EXISTS food_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  icon text NOT NULL,
  color text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE food_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view food categories"
  ON food_categories FOR SELECT
  TO authenticated
  USING (true);

-- Insert default categories
INSERT INTO food_categories (name, icon, color) VALUES
  ('Dairy', 'milk', '#3B82F6'),
  ('Produce', 'apple', '#10B981'),
  ('Meat', 'beef', '#EF4444'),
  ('Seafood', 'fish', '#06B6D4'),
  ('Grains', 'wheat', '#F59E0B'),
  ('Bakery', 'croissant', '#D97706'),
  ('Beverages', 'coffee', '#8B5CF6'),
  ('Frozen', 'snowflake', '#6366F1'),
  ('Pantry', 'package', '#84CC16'),
  ('Other', 'utensils', '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- Create food_items table
CREATE TABLE IF NOT EXISTS food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES food_categories ON DELETE RESTRICT,
  name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'pieces',
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  expiration_date date NOT NULL,
  barcode text,
  storage_location text NOT NULL DEFAULT 'Pantry',
  notes text,
  status text NOT NULL DEFAULT 'fresh' CHECK (status IN ('fresh', 'expiring_soon', 'expired', 'consumed', 'wasted')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own food items"
  ON food_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food items"
  ON food_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food items"
  ON food_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own food items"
  ON food_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create waste_tracking table
CREATE TABLE IF NOT EXISTS waste_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  food_item_id uuid REFERENCES food_items ON DELETE SET NULL,
  item_name text NOT NULL,
  category_id uuid NOT NULL REFERENCES food_categories ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'pieces',
  reason text NOT NULL CHECK (reason IN ('expired', 'spoiled', 'excess', 'other')),
  wasted_date date NOT NULL DEFAULT CURRENT_DATE,
  estimated_value numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE waste_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own waste tracking"
  ON waste_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own waste tracking"
  ON waste_tracking FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own waste tracking"
  ON waste_tracking FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create community_shares table
CREATE TABLE IF NOT EXISTS community_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  food_item_id uuid REFERENCES food_items ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'pieces',
  pickup_location text NOT NULL,
  available_until timestamptz NOT NULL,
  image_url text,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'completed', 'cancelled')),
  claimed_by uuid REFERENCES profiles ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE community_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available community shares"
  ON community_shares FOR SELECT
  TO authenticated
  USING (status = 'available' OR auth.uid() = user_id OR auth.uid() = claimed_by);

CREATE POLICY "Users can insert own community shares"
  ON community_shares FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own community shares"
  ON community_shares FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = claimed_by)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = claimed_by);

CREATE POLICY "Users can delete own community shares"
  ON community_shares FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('expiration_warning', 'community_share', 'waste_reminder', 'system')),
  reference_id uuid,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_food_items_user_id ON food_items(user_id);
CREATE INDEX IF NOT EXISTS idx_food_items_expiration ON food_items(expiration_date);
CREATE INDEX IF NOT EXISTS idx_food_items_status ON food_items(status);
CREATE INDEX IF NOT EXISTS idx_waste_tracking_user_id ON waste_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_waste_tracking_date ON waste_tracking(wasted_date);
CREATE INDEX IF NOT EXISTS idx_community_shares_status ON community_shares(status);
CREATE INDEX IF NOT EXISTS idx_community_shares_available_until ON community_shares(available_until);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
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
