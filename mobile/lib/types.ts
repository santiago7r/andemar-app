export type TourCategory = 'playa' | 'isla' | 'montana';
export type UserRole = 'traveler' | 'seller';

export interface Tour {
  id: string;
  slug: string;
  title: string;
  category: TourCategory;
  location: string;
  price_cop: number;
  rating: number;
  cover_color: string;
  video_360_url: string | null;
  includes: string[];
  description: string | null;
  commission_pct: number;
  active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  referral_code: string;
  is_admin: boolean;
  created_at: string;
}

// Fila de la vista seller_commissions (supabase/schema.sql)
export interface SellerCommission {
  seller_id: string;
  tour_id: string;
  tour_title: string;
  commission_pct: number;
  bookings_confirmed: number;
  commission_cop: number;
}
