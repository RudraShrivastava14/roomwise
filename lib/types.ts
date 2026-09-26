export type ViewType = 'Pool' | 'Ocean' | 'Garden' | 'City';

export type BedType = 'King' | 'Queen' | 'Twin Beds';

export type CleaningStatus = 'DIRTY' | 'CLEANING' | 'INSPECTION' | 'READY';

export type PriorityLevel = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';

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
  status: CleaningStatus;
  isBooked: boolean;
  gridX: number;
  gridY: number;
}

export interface Booking {
  id: string;
  roomId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  scheduledCheckInTime: string;
  scheduledCheckOutTime: string;
  isEarlyCheckIn: boolean;
  earlyCheckInFee: number;
  totalPrice: number;
  createdAt: string;
  status: 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT';
}

export interface HousekeepingTask {
  id: string;
  roomId: string;
  roomNumber: string;
  floor: number;
  category: string;
  status: CleaningStatus;
  priority: PriorityLevel;
  checkoutTime: string;
  nextCheckInTime: string;
  isEarlyCheckIn?: boolean;
  cleaningEstMinutes: number;
  bufferMinutesRemaining: number;
  assignedStaff: string | null;
  notes: string | null;
  damageReport?: {
    item: string;
    description: string;
    severity: 'MINOR' | 'MAJOR';
    reportedAt: string;
  } | null;
  updatedAt: string;
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
