'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Booking, CleaningStatus, NotificationLog, QueueItem, Room, StaffMember, StaffSession, StayDates } from './types';
import { addDays, formatPropertyTime, propertyDate } from './time';

const STAFF_POLL_MS = 15_000;
const MAX_COMPARE = 3;

export interface StaffData {
  rooms: Room[];
  queue: QueueItem[];
  notifications: NotificationLog[];
  generatedAt: string;
}

export interface BookingRequest {
  roomId: string;
  guestName: string;
  guestEmail: string;
  isEarlyCheckIn: boolean;
}

/** fetch wrapper: always resolves to parsed JSON or throws an Error with a user-facing message. */
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      cache: 'no-store',
    });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body as T;
}

export function useRoomWiseStore() {
  const [activeMode, setActiveMode] = useState<'GUEST' | 'STAFF'>('GUEST');

  // ---- Guest side ----
  const [stay, setStay] = useState<StayDates>(() => {
    const today = propertyDate();
    return { checkIn: today, checkOut: addDays(today, 1) };
  });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [comparedRoomIds, setComparedRoomIds] = useState<string[]>([]);

  const loadRooms = useCallback(async () => {
    setRoomsLoading(true);
    try {
      const qs = new URLSearchParams({ checkIn: stay.checkIn, checkOut: stay.checkOut });
      const data = await api<{ rooms: Room[] }>(`/api/rooms?${qs}`);
      setRooms(data.rooms);
      setRoomsError(null);
    } catch (err) {
      setRoomsError((err as Error).message);
    } finally {
      setRoomsLoading(false);
    }
  }, [stay]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const toggleCompareRoom = (roomId: string) => {
    setComparedRoomIds(prev => {
      if (prev.includes(roomId)) return prev.filter(id => id !== roomId);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, roomId];
    });
  };
  const clearCompare = () => setComparedRoomIds([]);

  const createBooking = async (req: BookingRequest): Promise<Booking> => {
    try {
      const { booking } = await api<{ booking: Booking }>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({ ...req, ...stay }),
      });
      return booking;
    } finally {
      // Refresh availability whether we won or lost a race for the room.
      loadRooms();
    }
  };

  // ---- Staff side ----
  /** undefined = still checking, null = signed out. */
  const [staff, setStaff] = useState<StaffSession | null | undefined>(undefined);
  const [staffData, setStaffData] = useState<StaffData | null>(null);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [latestToast, setLatestToast] = useState<NotificationLog | null>(null);
  const lastSeenNotif = useRef<string | null>(null);

  useEffect(() => {
    api<{ staff: StaffSession | null }>('/api/auth/me')
      .then(d => setStaff(d.staff))
      .catch(() => setStaff(null));
  }, []);

  const loadStaff = useCallback(async () => {
    try {
      const data = await api<StaffData>('/api/staff/queue');
      setStaffData(data);
      setStaffError(null);

      const newest = data.notifications[0];
      if (newest && lastSeenNotif.current && newest.id !== lastSeenNotif.current) {
        setLatestToast(newest);
        setTimeout(() => setLatestToast(t => (t?.id === newest.id ? null : t)), 5000);
      }
      lastSeenNotif.current = newest?.id ?? null;
    } catch (err) {
      const message = (err as Error).message;
      if (message === 'Staff login required') setStaff(null);
      setStaffError(message);
    }
  }, []);

  // Poll while the dashboard is open so bookings made on another device show up.
  useEffect(() => {
    if (activeMode !== 'STAFF' || !staff) return;
    loadStaff();
    const id = setInterval(loadStaff, STAFF_POLL_MS);
    return () => clearInterval(id);
  }, [activeMode, staff, loadStaff]);

  const login = async (username: string, password: string) => {
    const data = await api<{ staff: StaffSession }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setStaff(data.staff);
  };

  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setStaff(null);
    setStaffData(null);
    setTeam([]);
    lastSeenNotif.current = null;
  };

  // ---- Admin: team management ----
  const [team, setTeam] = useState<StaffMember[]>([]);

  const loadTeam = useCallback(async () => {
    const data = await api<{ staff: StaffMember[] }>('/api/staff/users');
    setTeam(data.staff);
  }, []);

  const addStaffMember = async (member: { username: string; displayName: string; password: string }) => {
    await api('/api/staff/users', { method: 'POST', body: JSON.stringify(member) });
    await loadTeam();
  };

  const removeStaffMember = async (username: string) => {
    await api(`/api/staff/users/${encodeURIComponent(username)}`, { method: 'DELETE' });
    await loadTeam();
  };

  const updateTaskStatus = async (taskId: string, status: CleaningStatus) => {
    try {
      await api(`/api/staff/tasks/${encodeURIComponent(taskId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } finally {
      await loadStaff();
    }
  };

  const addDamageReport = async (taskId: string, item: string, description: string, severity: 'MINOR' | 'MAJOR') => {
    await api(`/api/staff/tasks/${encodeURIComponent(taskId)}/damage`, {
      method: 'POST',
      body: JSON.stringify({ item, description, severity }),
    });
    await loadStaff();
  };

  const resetDemoData = async () => {
    await api('/api/staff/reset', { method: 'POST' });
    clearCompare();
    await Promise.all([loadStaff(), loadRooms()]);
  };

  const exportScheduleCSV = () => {
    if (!staffData) return;
    const headers = ['Room', 'Floor', 'Priority', 'Status', 'Slack (min)', 'Checkout', 'Next arrival', 'Next guest', 'Early check-in', 'Assigned', 'Est. clean (min)', 'Notes'];
    const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = staffData.queue.map(t => [
      t.roomNumber,
      t.floor,
      t.priority,
      t.status,
      t.bufferMinutes ?? '',
      formatPropertyTime(t.checkoutAt),
      formatPropertyTime(t.nextArrivalAt),
      t.nextGuestName,
      t.isEarlyCheckIn ? 'YES' : 'NO',
      t.assignedStaff ?? 'Unassigned',
      t.cleaningEstMinutes,
      t.notes,
    ]);
    const csv = [headers, ...rows].map(r => r.map(cell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `housekeeping_queue_${propertyDate()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    activeMode,
    setActiveMode,
    // guest
    stay,
    setStay,
    rooms,
    roomsLoading,
    roomsError,
    reloadRooms: loadRooms,
    comparedRoomIds,
    toggleCompareRoom,
    clearCompare,
    createBooking,
    // staff
    staff,
    team,
    loadTeam,
    addStaffMember,
    removeStaffMember,
    staffData,
    staffError,
    reloadStaff: loadStaff,
    latestToast,
    login,
    logout,
    updateTaskStatus,
    addDamageReport,
    resetDemoData,
    exportScheduleCSV,
  };
}
