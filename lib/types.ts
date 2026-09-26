export type ViewType = 'Pool' | 'Ocean' | 'Garden' | 'City';

export type BedType = 'King' | 'Queen' | 'Twin Beds';

export type CleaningStatus = 'DIRTY' | 'CLEANING' | 'INSPECTION' | 'READY';

export type PriorityLevel = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';

/** Physical attributes of one room — what the guest compares. */
export interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  category: string;
  pricePerNight: number; // in INR
  viewType: ViewType;
  areaSqM: number;
  balcony: boolean;
  bathtub: boolean;
  bedType: BedType;
  maxGuests: number;
  amenities: string[];
  images: string[];
  /** Current housekeeping state of the physical room. */
  status: CleaningStatus;
  /** Computed per request: true if any night of the requested stay is already taken. */
  isBooked: boolean;
  gridX: number;
  gridY: number;
}

export interface Booking {
  id: string;
  roomId: string;
  roomNumber: string;
  guestName: string;
  guestEmail: string;
  checkInDate: string; // YYYY-MM-DD, property-local
  checkOutDate: string; // YYYY-MM-DD, exclusive
  nights: number;
  /** Instant the guest is expected; 12:00 with early check-in, 14:00 otherwise. */
  arrivalAt: string;
  isEarlyCheckIn: boolean;
  earlyCheckInFee: number;
  totalPrice: number;
  createdAt: string;
}

export interface DamageReport {
  item: string;
  description: string;
  severity: 'MINOR' | 'MAJOR';
  reportedAt: string;
}

/**
 * One room turnover. Stores only facts (times, status); priority and
 * buffer are derived at read time by lib/priority.ts so they never go stale.
 */
export interface HousekeepingTask {
  id: string;
  roomId: string;
  roomNumber: string;
  floor: number;
  category: string;
  status: CleaningStatus;
  /** When the previous guest leaves (or left). Cleaning can't start before this. */
  checkoutAt: string | null;
  /** When the next guest arrives, or null if nobody is booked in yet. */
  nextArrivalAt: string | null;
  nextGuestName: string | null;
  isEarlyCheckIn: boolean;
  cleaningEstMinutes: number;
  assignedStaff: string | null;
  notes: string | null;
  damageReport: DamageReport | null;
  updatedAt: string;
}

export interface QueueItem extends HousekeepingTask {
  priority: PriorityLevel;
  bufferMinutes: number | null;
  remainingWorkMinutes: number;
}

export interface NotificationLog {
  id: string;
  type: 'SMS' | 'WHATSAPP';
  recipient: string;
  message: string;
  timestamp: string;
}

export interface FilterOptions {
  floor: number | 'ALL';
  category: string | 'ALL';
  viewType: ViewType | 'ALL';
  balconyOnly: boolean;
  bathtubOnly: boolean;
  maxPrice: number;
}

export interface StayDates {
  checkIn: string;
  checkOut: string;
}

export interface StaffSession {
  username: string;
  displayName: string;
  role: 'admin' | 'staff';
}

export interface StaffMember {
  username: string;
  displayName: string;
  createdAt: string;
}
