import 'server-only';
import { Db, MongoClient } from 'mongodb';
import { Booking, HousekeepingTask, NotificationLog } from '../types';
import { buildSeed, RoomDoc } from '../seed';

/** Stored documents use the domain `id` as Mongo's `_id`. */
type Doc<T extends { id: string }> = Omit<T, 'id'> & { _id: string };

export interface RoomNightDoc {
  roomId: string;
  night: string;
  bookingId: string;
}

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super('MONGODB_URI is not set');
  }
}

// Reuse one client across hot reloads and serverless invocations.
const globalForMongo = globalThis as unknown as { _mongoClient?: Promise<MongoClient>; _dbReady?: Promise<void> };

function client(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new DatabaseNotConfiguredError();
  if (!globalForMongo._mongoClient) {
    globalForMongo._mongoClient = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 })
      .connect()
      .catch(err => {
        globalForMongo._mongoClient = undefined; // let the next request retry
        throw err;
      });
  }
  return globalForMongo._mongoClient;
}

export async function getDb(): Promise<Db> {
  const db = (await client()).db(process.env.MONGODB_DB || 'roomwise');
  if (!globalForMongo._dbReady) {
    globalForMongo._dbReady = prepare(db).catch(err => {
      globalForMongo._dbReady = undefined;
      throw err;
    });
  }
  await globalForMongo._dbReady;
  return db;
}

/** Creates indexes and seeds demo data on first use of an empty database. */
async function prepare(db: Db) {
  // One document per occupied room-night; the unique index is what makes
  // double-booking impossible even under concurrent requests.
  await db.collection('room_nights').createIndex({ roomId: 1, night: 1 }, { unique: true });
  await db.collection('room_nights').createIndex({ bookingId: 1 });
  await db.collection('tasks').createIndex({ roomId: 1 }, { unique: true });
  await db.collection('notifications').createIndex({ timestamp: -1 });

  if ((await db.collection('rooms').estimatedDocumentCount()) === 0) {
    await seedDatabase(db);
  }
}

export async function seedDatabase(db: Db) {
  const seed = buildSeed();
  await Promise.all(
    ['rooms', 'tasks', 'bookings', 'room_nights', 'notifications'].map(name => db.collection(name).deleteMany({}))
  );
  await db.collection<Doc<RoomDoc>>('rooms').insertMany(seed.rooms.map(toDoc));
  await db.collection<Doc<HousekeepingTask>>('tasks').insertMany(seed.tasks.map(toDoc));
  await db.collection<Doc<Booking>>('bookings').insertMany(seed.bookings.map(toDoc));
  await db.collection<RoomNightDoc>('room_nights').insertMany(seed.roomNights);
  await db.collection<Doc<NotificationLog>>('notifications').insertMany(seed.notifications.map(toDoc));
}

export function collections(db: Db) {
  return {
    rooms: db.collection<Doc<RoomDoc>>('rooms'),
    tasks: db.collection<Doc<HousekeepingTask>>('tasks'),
    bookings: db.collection<Doc<Booking>>('bookings'),
    roomNights: db.collection<RoomNightDoc>('room_nights'),
    notifications: db.collection<Doc<NotificationLog>>('notifications'),
  };
}

export function toDoc<T extends { id: string }>({ id, ...rest }: T): Doc<T> {
  return { _id: id, ...rest } as Doc<T>;
}

export function fromDoc<T extends { id: string }>({ _id, ...rest }: Doc<T>): T {
  return { id: _id, ...rest } as unknown as T;
}

export async function logNotification(db: Db, n: Omit<NotificationLog, 'id' | 'timestamp'>) {
  const doc: NotificationLog = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...n,
  };
  await collections(db).notifications.insertOne(toDoc(doc));
  return doc;
}
