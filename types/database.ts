export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  location?: string;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface FoodCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  created_at: string;
}

export type FoodItemStatus = 'fresh' | 'expiring_soon' | 'expired' | 'consumed' | 'wasted';

export interface FoodItem {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  quantity: number;
  unit: string;
  purchase_date: string;
  expiration_date: string;
  barcode?: string;
  storage_location: string;
  notes?: string;
  status: FoodItemStatus;
  created_at: string;
  updated_at: string;
  category?: FoodCategory;
}

export type WasteReason = 'expired' | 'spoiled' | 'excess' | 'other';

export interface WasteTracking {
  id: string;
  user_id: string;
  food_item_id?: string;
  item_name: string;
  category_id: string;
  quantity: number;
  unit: string;
  reason: WasteReason;
  wasted_date: string;
  estimated_value: number;
  created_at: string;
  category?: FoodCategory;
}

export type CommunityShareStatus = 'available' | 'claimed' | 'completed' | 'cancelled';

export interface CommunityShare {
  id: string;
  user_id: string;
  food_item_id?: string;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  pickup_location: string;
  available_until: string;
  image_url?: string;
  status: CommunityShareStatus;
  claimed_by?: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export type NotificationType = 'expiration_warning' | 'community_share' | 'waste_reminder' | 'system';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  reference_id?: string;
  read: boolean;
  created_at: string;
}
