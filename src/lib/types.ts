export type UserRole = "customer" | "vendor" | "admin";
export type VendorStatus = "pending" | "approved" | "suspended" | "rejected";
export type BookingStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "in_progress"
  | "completed"
  | "cancelled";
export type PaymentStatus = "created" | "paid" | "failed" | "refunded";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface ServiceCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  base_price_hint: number | null;
  active: boolean;
}

export interface Vendor {
  id: string;
  owner_id: string;
  business_name: string;
  description: string | null;
  status: VendorStatus;
  address_line: string | null;
  city: string;
  state: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  contact_phone: string | null;
  contact_email: string | null;
  logo_url: string | null;
  rating_avg: number;
  rating_count: number;
  created_at: string;
}

export interface VendorService {
  id: string;
  vendor_id: string;
  category_id: string;
  title: string;
  price: number;
  duration_minutes: number | null;
  active: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  customer_id: string;
  vendor_id: string;
  vendor_service_id: string;
  status: BookingStatus;
  scheduled_at: string;
  service_address: string | null;
  pet_name: string | null;
  pet_type: string | null;
  notes: string | null;
  amount: number;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  created_at: string;
}
