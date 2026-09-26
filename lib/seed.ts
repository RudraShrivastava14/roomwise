import { Booking, HousekeepingTask, NotificationLog, Room } from './types';
import { addDays, propertyDate } from './time';

export type RoomDoc = Omit<Room, 'isBooked'>;

/** Grand Azure Resort — demo property. Statuses are overwritten by buildSeed(). */
const ROOMS: RoomDoc[] = [
  {
    id: 'room_401',
    roomNumber: '401',
    floor: 4,
    category: 'Deluxe Room',
    pricePerNight: 5000,
    viewType: 'City',
    areaSqM: 30,
    balcony: false,
    bathtub: false,
    bedType: 'King',
    maxGuests: 2,
    amenities: ['Wi-Fi 6', 'Smart TV 55"', 'Nespresso Machine', 'Work Desk', 'Rain Shower'],
    images: [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
    ],
    status: 'READY',
    gridX: 10,
    gridY: 20,
  },
  {
    id: 'room_402',
    roomNumber: '402',
    floor: 4,
    category: 'Deluxe Room',
    pricePerNight: 5000,
    viewType: 'Garden',
    areaSqM: 31,
    balcony: true,
    bathtub: false,
    bedType: 'King',
    maxGuests: 2,
    amenities: ['Wi-Fi 6', 'Smart TV 55"', 'Garden View Balcony', 'Mini Bar', 'Rain Shower'],
    images: [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
    ],
    status: 'DIRTY',
    gridX: 40,
    gridY: 20,
  },
  {
    id: 'room_403',
    roomNumber: '403',
    floor: 4,
    category: 'Deluxe Room',
    pricePerNight: 5000,
    viewType: 'Pool',
    areaSqM: 32,
    balcony: true,
    bathtub: true,
    bedType: 'King',
    maxGuests: 2,
    amenities: ['Wi-Fi 6', 'Smart TV 55"', 'Pool View Balcony', 'Deep Soak Bathtub', 'Nespresso Machine', 'Mini Bar'],
    images: [
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
    ],
    status: 'DIRTY',
    gridX: 70,
    gridY: 20,
  },
  {
    id: 'room_404',
    roomNumber: '404',
    floor: 4,
    category: 'Ocean View Suite',
    pricePerNight: 8500,
    viewType: 'Ocean',
    areaSqM: 48,
    balcony: true,
    bathtub: true,
    bedType: 'King',
    maxGuests: 3,
    amenities: ['Panoramic Ocean Balcony', 'Jacuzzi Bathtub', 'Living Lounge Area', 'Wi-Fi 6', 'Premium Soundbar', 'Pillow Menu'],
    images: [
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
    ],
    status: 'CLEANING',
    gridX: 70,
    gridY: 60,
  },
  {
    id: 'room_301',
    roomNumber: '301',
    floor: 3,
    category: 'Deluxe Room',
    pricePerNight: 4800,
    viewType: 'City',
    areaSqM: 29,
    balcony: false,
    bathtub: false,
    bedType: 'Twin Beds',
    maxGuests: 2,
    amenities: ['Wi-Fi 6', 'Twin Single Beds', 'Work Desk', 'Rain Shower'],
    images: [
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80'
    ],
    status: 'READY',
    gridX: 10,
    gridY: 20,
  },
  {
    id: 'room_302',
    roomNumber: '302',
    floor: 3,
    category: 'Deluxe Room',
    pricePerNight: 4900,
    viewType: 'Garden',
    areaSqM: 30,
    balcony: true,
    bathtub: false,
    bedType: 'Queen',
    maxGuests: 2,
    amenities: ['Wi-Fi 6', 'Queen Size Bed', 'Garden Terrace', 'Mini Bar'],
    images: [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80'
    ],
    status: 'INSPECTION',
    gridX: 40,
    gridY: 20,
  },
  {
    id: 'room_303',
    roomNumber: '303',
    floor: 3,
    category: 'Premium Suite',
    pricePerNight: 7500,
    viewType: 'Pool',
    areaSqM: 42,
    balcony: true,
    bathtub: true,
    bedType: 'King',
    maxGuests: 3,
    amenities: ['Poolside View', 'Marble Bathtub', 'Private Terrace', 'Cocktail Bar', 'Wi-Fi 6'],
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
    ],
    status: 'READY',
    gridX: 70,
    gridY: 20,
  }
];

interface TurnoverSeed {
  roomId: string;
  status: HousekeepingTask['status'];
  checkoutInMin: number;
  /** Minutes from now until the next guest arrives, or null if nobody is booked tonight. */
  arrivalInMin: number | null;
  guest: string | null;
  isEarlyCheckIn: boolean;
  cleaningEstMinutes: number;
  /** Demo housekeeper username (see DEMO_STAFF in lib/server/db.ts), or null = admin must assign. */
  assignedTo: 'ramesh' | 'sunita' | null;
  notes: string | null;
  startedMinAgo?: number;
}

/**
 * Times are relative to "now" so the demo queue always shows a realistic
 * morning rush, whenever a reviewer opens it.
 */
const TURNOVERS: TurnoverSeed[] = [
  {
    // Previous guest hasn't left yet and the next one paid for early check-in: tightest window.
    roomId: 'room_301', status: 'DIRTY', checkoutInMin: 20, arrivalInMin: 75, guest: 'Priya Nair',
    isEarlyCheckIn: true, cleaningEstMinutes: 30, assignedTo: null, notes: 'Due out soon. Early check-in guest — needs someone assigned.',
  },
  {
    roomId: 'room_302', status: 'INSPECTION', checkoutInMin: -150, arrivalInMin: 45, guest: 'Arjun Mehta',
    isEarlyCheckIn: false, cleaningEstMinutes: 30, assignedTo: 'ramesh', notes: null,
  },
  {
    roomId: 'room_402', status: 'DIRTY', checkoutInMin: -90, arrivalInMin: 100, guest: 'Vikram Rao',
    isEarlyCheckIn: false, cleaningEstMinutes: 40, assignedTo: 'ramesh', notes: null,
  },
  {
    roomId: 'room_404', status: 'CLEANING', checkoutInMin: -120, arrivalInMin: 240, guest: 'Meera Iyer',
    isEarlyCheckIn: false, cleaningEstMinutes: 50, assignedTo: 'sunita', notes: 'Suite deep clean.', startedMinAgo: 15,
  },
  {
    // Vacated but not rebooked yet — the room a demo guest will usually pick.
    roomId: 'room_403', status: 'DIRTY', checkoutInMin: -30, arrivalInMin: null, guest: null,
    isEarlyCheckIn: false, cleaningEstMinutes: 35, assignedTo: null, notes: null,
  },
];

const DEMO_STAFF_NAMES = { ramesh: 'Ramesh K.', sunita: 'Sunita P.' } as const;

export interface SeedData {
  rooms: RoomDoc[];
  tasks: HousekeepingTask[];
  bookings: Booking[];
  roomNights: { roomId: string; night: string; bookingId: string }[];
  notifications: NotificationLog[];
}

export function buildSeed(now: Date = new Date()): SeedData {
  const iso = (offsetMin: number) => new Date(now.getTime() + offsetMin * 60_000).toISOString();
  const today = propertyDate(now);
  const byId = new Map(ROOMS.map(r => [r.id, r]));

  const tasks: HousekeepingTask[] = TURNOVERS.map(t => {
    const room = byId.get(t.roomId)!;
    return {
      id: `task_${t.roomId}`,
      roomId: t.roomId,
      roomNumber: room.roomNumber,
      floor: room.floor,
      category: room.category,
      status: t.status,
      checkoutAt: iso(t.checkoutInMin),
      nextArrivalAt: t.arrivalInMin === null ? null : iso(t.arrivalInMin),
      nextGuestName: t.guest,
      isEarlyCheckIn: t.isEarlyCheckIn,
      cleaningEstMinutes: t.cleaningEstMinutes,
      assignedTo: t.assignedTo,
      assignedStaff: t.assignedTo ? DEMO_STAFF_NAMES[t.assignedTo] : null,
      notes: t.notes,
      damageReport: null,
      updatedAt: iso(-(t.startedMinAgo ?? 0)),
    };
  });

  const statusByRoom = new Map(TURNOVERS.map(t => [t.roomId, t.status]));
  const rooms = ROOMS.map(r => ({ ...r, status: statusByRoom.get(r.id) ?? 'READY' }));

  const bookings: Booking[] = TURNOVERS.filter(t => t.guest && t.arrivalInMin !== null).map(t => {
    const room = byId.get(t.roomId)!;
    const fee = t.isEarlyCheckIn ? 1000 : 0;
    return {
      id: `bk_seed_${room.roomNumber}`,
      roomId: room.id,
      roomNumber: room.roomNumber,
      guestName: t.guest!,
      guestEmail: `${t.guest!.split(' ')[0].toLowerCase()}@example.com`,
      checkInDate: today,
      checkOutDate: addDays(today, 2),
      nights: 2,
      arrivalAt: iso(t.arrivalInMin!),
      isEarlyCheckIn: t.isEarlyCheckIn,
      earlyCheckInFee: fee,
      totalPrice: room.pricePerNight * 2 + fee,
      createdAt: iso(-24 * 60),
    };
  });

  const roomNights = bookings.flatMap(b => [
    { roomId: b.roomId, night: today, bookingId: b.id },
    { roomId: b.roomId, night: addDays(today, 1), bookingId: b.id },
  ]);

  const notifications: NotificationLog[] = [
    {
      id: 'notif_seed_1',
      type: 'WHATSAPP',
      to: 'ramesh',
      recipient: 'Ramesh K.',
      message: 'Room 402 assigned to you by Admin. Next guest arrives soon.',
      timestamp: iso(-40),
    },
    {
      id: 'notif_seed_2',
      type: 'WHATSAPP',
      to: 'admin',
      recipient: 'Admin',
      message: 'Room 302: Ramesh K. finished cleaning. Waiting for your inspection.',
      timestamp: iso(-12),
    },
    {
      id: 'notif_seed_3',
      type: 'WHATSAPP',
      to: 'admin',
      recipient: 'Admin',
      message: 'Room 301: next guest has paid early check-in and nobody is assigned yet.',
      timestamp: iso(-5),
    },
  ];

  return { rooms, tasks, bookings, roomNights, notifications };
}
