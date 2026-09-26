import 'server-only';
import { MongoServerError } from 'mongodb';
import { Booking, GuestSession, HousekeepingTask, Room } from '../types';
import { RoomDoc } from '../seed';
import { BookingInput } from '../validation';
import { expectedArrival, quote } from '../booking-rules';
import { stayNights } from '../time';
import { collections, fromDoc, getDb, logNotification, toDoc } from './db';
import { HttpError } from './http';

const DUPLICATE_KEY = 11000;

/** All rooms, flagged as booked if any night of the requested stay is taken. */
export async function roomsForStay(checkIn: string, checkOut: string): Promise<Room[]> {
  const db = await getDb();
  const { rooms, roomNights } = collections(db);
  const [roomDocs, taken] = await Promise.all([
    rooms.find().sort({ floor: -1, roomNumber: 1 }).toArray(),
    roomNights.distinct('roomId', { night: { $in: stayNights(checkIn, checkOut) } }),
  ]);
  const takenSet = new Set(taken);
  return roomDocs.map(d => ({ ...fromDoc<RoomDoc>(d), isBooked: takenSet.has(d._id) }));
}

/**
 * Reserves an exact room. Each night is claimed by inserting into
 * room_nights, whose unique (roomId, night) index rejects a second claim —
 * so two guests racing for Room 403 can't both succeed.
 */
export async function createBooking(input: BookingInput, guest: GuestSession, now = new Date()): Promise<Booking> {
  const db = await getDb();
  const { rooms, bookings, roomNights } = collections(db);

  const roomDoc = await rooms.findOne({ _id: input.roomId });
  if (!roomDoc) throw new HttpError(404, 'That room does not exist');
  const room = fromDoc<RoomDoc>(roomDoc);

  const bookingId = `bk_${now.getTime()}_${Math.random().toString(36).slice(2, 7)}`;
  const nights = stayNights(input.checkIn, input.checkOut);

  try {
    await roomNights.insertMany(
      nights.map(night => ({ roomId: room.id, night, bookingId })),
      { ordered: true }
    );
  } catch (err) {
    await roomNights.deleteMany({ bookingId });
    if (err instanceof MongoServerError && err.code === DUPLICATE_KEY) {
      throw new HttpError(409, `Room ${room.roomNumber} is already booked for at least one of these nights. Please pick other dates or another room.`);
    }
    throw err;
  }

  const { earlyCheckInFee, totalPrice } = quote(room.pricePerNight, input.checkIn, input.checkOut, input.isEarlyCheckIn);
  const booking: Booking = {
    id: bookingId,
    roomId: room.id,
    roomNumber: room.roomNumber,
    guestName: guest.name,
    guestEmail: guest.email,
    checkInDate: input.checkIn,
    checkOutDate: input.checkOut,
    nights: nights.length,
    arrivalAt: expectedArrival(input.checkIn, input.isEarlyCheckIn, now),
    isEarlyCheckIn: input.isEarlyCheckIn,
    earlyCheckInFee,
    totalPrice,
    createdAt: now.toISOString(),
  };

  try {
    await bookings.insertOne(toDoc(booking));
  } catch (err) {
    await roomNights.deleteMany({ bookingId }); // release the nights we claimed
    throw err;
  }

  await attachArrivalToTurnover(booking, room, now);
  return booking;
}

/**
 * Points the room's turnover task at this guest if they are now the next
 * arrival. Priority is not set here — lib/priority.ts derives it from times.
 */
async function attachArrivalToTurnover(booking: Booking, room: RoomDoc, now: Date) {
  const db = await getDb();
  const { tasks } = collections(db);
  const existing = await tasks.findOne({ roomId: room.id });

  const current = existing?.nextArrivalAt ? new Date(existing.nextArrivalAt) : null;
  const isNextArrival = !current || current < now || new Date(booking.arrivalAt) < current;
  if (existing && !isNextArrival) return;

  const arrivalFields = {
    nextArrivalAt: booking.arrivalAt,
    nextGuestName: booking.guestName,
    isEarlyCheckIn: booking.isEarlyCheckIn,
  };

  if (existing) {
    await tasks.updateOne({ _id: existing._id }, { $set: arrivalFields });
  } else {
    const task: HousekeepingTask = {
      id: `task_${room.id}`,
      roomId: room.id,
      roomNumber: room.roomNumber,
      floor: room.floor,
      category: room.category,
      status: room.status,
      checkoutAt: null,
      ...arrivalFields,
      cleaningEstMinutes: 35,
      assignedTo: null,
      assignedStaff: null,
      notes: null,
      damageReport: null,
      updatedAt: now.toISOString(),
    };
    await tasks.insertOne(toDoc(task));
  }

  // The admin plans the day; the assignee (if any) also needs to know the deadline moved.
  const assignee = existing?.assignedTo ?? null;
  await logNotification(db, {
    type: 'WHATSAPP',
    to: assignee ?? 'admin',
    recipient: existing?.assignedStaff ?? 'Admin',
    message: `Room ${room.roomNumber}${assignee ? '' : ' (not assigned yet)'}: ${booking.guestName} booked this exact room, arriving ${new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(booking.arrivalAt))}${booking.isEarlyCheckIn ? ' (paid early check-in)' : ''}.`,
  });
}

/** A signed-in guest's own bookings, newest stay first. */
export async function bookingsFor(email: string): Promise<Booking[]> {
  const db = await getDb();
  const docs = await collections(db).bookings.find({ guestEmail: email }).sort({ checkInDate: -1 }).limit(50).toArray();
  return docs.map(d => fromDoc<Booking>(d));
}
