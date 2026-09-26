'use client';

import { useState, useEffect } from 'react';
import { Room, HousekeepingTask, Booking, PriorityLevel, CleaningStatus, NotificationLog } from './types';
import { INITIAL_ROOMS, INITIAL_TASKS, INITIAL_NOTIFICATIONS } from './mock-data';

const STORAGE_KEY_ROOMS = 'roomwise_rooms_v2';
const STORAGE_KEY_TASKS = 'roomwise_tasks_v2';
const STORAGE_KEY_BOOKINGS = 'roomwise_bookings_v2';
const STORAGE_KEY_NOTIFS = 'roomwise_notifs_v2';

export function useRoomWiseStore() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [comparedRoomIds, setComparedRoomIds] = useState<string[]>([]);
  const [activeMode, setActiveMode] = useState<'GUEST' | 'STAFF'>('GUEST');
  const [latestToast, setLatestToast] = useState<NotificationLog | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state from LocalStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedRooms = localStorage.getItem(STORAGE_KEY_ROOMS);
    const savedTasks = localStorage.getItem(STORAGE_KEY_TASKS);
    const savedBookings = localStorage.getItem(STORAGE_KEY_BOOKINGS);
    const savedNotifs = localStorage.getItem(STORAGE_KEY_NOTIFS);

    if (savedRooms && savedTasks) {
      try {
        setRooms(JSON.parse(savedRooms));
        setTasks(JSON.parse(savedTasks));
        if (savedBookings) setBookings(JSON.parse(savedBookings));
        if (savedNotifs) setNotifications(JSON.parse(savedNotifs));
      } catch (err) {
        setRooms(INITIAL_ROOMS);
        setTasks(INITIAL_TASKS);
        setNotifications(INITIAL_NOTIFICATIONS);
      }
    } else {
      setRooms(INITIAL_ROOMS);
      setTasks(INITIAL_TASKS);
      setNotifications(INITIAL_NOTIFICATIONS);
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(rooms));
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
  }, [rooms, tasks, bookings, notifications, isLoaded]);

  // Toast trigger helper
  const triggerNotification = (type: 'SMS' | 'WHATSAPP', recipient: string, message: string) => {
    const newNotif: NotificationLog = {
      id: `notif_${Date.now()}`,
      type,
      recipient,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setNotifications(prev => [newNotif, ...prev]);
    setLatestToast(newNotif);

    // Auto dismiss toast after 5s
    setTimeout(() => {
      setLatestToast(prev => (prev?.id === newNotif.id ? null : prev));
    }, 5000);
  };

  const toggleCompareRoom = (roomId: string) => {
    setComparedRoomIds(prev => {
      if (prev.includes(roomId)) {
        return prev.filter(id => id !== roomId);
      }
      if (prev.length >= 3) {
        alert('You can compare a maximum of 3 rooms side-by-side.');
        return prev;
      }
      return [...prev, roomId];
    });
  };

  const clearCompare = () => setComparedRoomIds([]);

  // Create booking with optional Early Check-In (+₹1,000)
  const createBooking = (
    roomId: string,
    guestName: string,
    guestEmail: string,
    checkInDate: string,
    checkOutDate: string,
    isEarlyCheckIn: boolean = false
  ) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return null;

    const earlyCheckInFee = isEarlyCheckIn ? 1000 : 0;
    const totalPrice = room.pricePerNight + earlyCheckInFee;
    const checkInTimeStr = isEarlyCheckIn ? '12:00 PM' : '02:00 PM';

    const newBooking: Booking = {
      id: `bk_${Date.now()}`,
      roomId,
      guestName,
      guestEmail,
      guestPhone: '+91 98765 43210',
      checkInDate,
      checkOutDate,
      scheduledCheckInTime: checkInTimeStr,
      scheduledCheckOutTime: '11:00 AM',
      isEarlyCheckIn,
      earlyCheckInFee,
      totalPrice,
      createdAt: new Date().toISOString(),
      status: 'CONFIRMED'
    };

    // Update Room status
    const updatedRooms = rooms.map(r => {
      if (r.id === roomId) {
        return { ...r, isBooked: true, status: 'DIRTY' as CleaningStatus };
      }
      return r;
    });

    // Escalation priority logic
    const taskPriority: PriorityLevel = isEarlyCheckIn ? 'URGENT' : 'HIGH';
    const assignedStaff = isEarlyCheckIn ? 'Sunita P. (Senior Staff)' : 'Ramesh K.';

    // Check if task exists or create new
    const existingTask = tasks.find(t => t.roomId === roomId);
    let updatedTasks: HousekeepingTask[];

    if (existingTask) {
      updatedTasks = tasks.map(t => {
        if (t.roomId === roomId) {
          return {
            ...t,
            status: 'DIRTY' as CleaningStatus,
            priority: taskPriority,
            isEarlyCheckIn,
            nextCheckInTime: checkInTimeStr,
            assignedStaff,
            notes: isEarlyCheckIn
              ? `⚡ PAID EARLY CHECK-IN (${checkInTimeStr} arrival by ${guestName}). High urgency turnover!`
              : `New booking confirmed for ${guestName}. Check-in at ${checkInTimeStr}.`
          };
        }
        return t;
      });
    } else {
      const newTask: HousekeepingTask = {
        id: `task_${roomId}_${Date.now()}`,
        roomId,
        roomNumber: room.roomNumber,
        floor: room.floor,
        category: room.category,
        status: 'DIRTY',
        priority: taskPriority,
        isEarlyCheckIn,
        checkoutTime: '11:00 AM',
        nextCheckInTime: checkInTimeStr,
        cleaningEstMinutes: 35,
        bufferMinutesRemaining: isEarlyCheckIn ? 15 : 60,
        assignedStaff,
        notes: isEarlyCheckIn
          ? `⚡ PAID EARLY CHECK-IN (${checkInTimeStr} arrival by ${guestName}). High urgency turnover!`
          : `Newly reserved by ${guestName}. Priority preparation required.`,
        updatedAt: new Date().toISOString()
      };
      updatedTasks = [newTask, ...tasks];
    }

    setRooms(updatedRooms);
    setTasks(updatedTasks);
    setBookings(prev => [newBooking, ...prev]);

    // Send Automated Dispatch SMS Notification
    const notifMsg = isEarlyCheckIn
      ? `⚡ URGENT AUTOMATED SMS to ${assignedStaff}: Room ${room.roomNumber} purchased Early Check-In (${checkInTimeStr}). Priority cleaning dispatched!`
      : `📱 AUTOMATED SMS to ${assignedStaff}: Room ${room.roomNumber} reserved by ${guestName}. Scheduled check-in at 2:00 PM.`;

    triggerNotification('SMS', assignedStaff, notifMsg);

    return newBooking;
  };

  // Staff status update
  const updateTaskStatus = (taskId: string, newStatus: CleaningStatus, staffName?: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: newStatus,
          assignedStaff: staffName !== undefined ? staffName : t.assignedStaff,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });

    const updatedRooms = rooms.map(r => {
      if (r.id === task.roomId) {
        return { ...r, status: newStatus };
      }
      return r;
    });

    setTasks(updatedTasks);
    setRooms(updatedRooms);

    // Notification trigger on status change
    if (newStatus === 'READY') {
      triggerNotification(
        'WHATSAPP',
        'Front Desk Supervisor',
        `✅ Room ${task.roomNumber} marked READY for check-in by ${staffName || task.assignedStaff || 'Housekeeping'}.`
      );
    } else if (newStatus === 'CLEANING') {
      triggerNotification(
        'SMS',
        staffName || task.assignedStaff || 'Housekeeper',
        `🧹 Cleaning started for Room ${task.roomNumber}. Est duration: ${task.cleaningEstMinutes} mins.`
      );
    }
  };

  // Add damage report
  const addDamageReport = (taskId: string, item: string, description: string, severity: 'MINOR' | 'MAJOR') => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          damageReport: {
            item,
            description,
            severity,
            reportedAt: new Date().toISOString()
          },
          notes: `[DAMAGE REPORTED]: ${item} - ${description}`
        };
      }
      return t;
    }));

    triggerNotification(
      'SMS',
      'Maintenance Supervisor',
      `⚠️ MAINTENANCE ALERT: Damage reported on Room ${tasks.find(t => t.id === taskId)?.roomNumber}: ${item} (${severity} severity).`
    );
  };

  // Export Housekeeping Dispatch Schedule as CSV
  const exportScheduleCSV = () => {
    const headers = [
      'Task ID',
      'Room Number',
      'Floor',
      'Category',
      'Priority',
      'Status',
      'Early Check-In',
      'Checkout Time',
      'Next Check-In',
      'Assigned Housekeeper',
      'Est Cleaning (Mins)',
      'Notes'
    ];

    const rows = tasks.map(t => [
      t.id,
      t.roomNumber,
      t.floor,
      `"${t.category}"`,
      t.priority,
      t.status,
      t.isEarlyCheckIn ? 'YES' : 'NO',
      t.checkoutTime,
      t.nextCheckInTime,
      `"${t.assignedStaff || 'Unassigned'}"`,
      t.cleaningEstMinutes,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `housekeeping_dispatch_schedule_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset Demo
  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY_ROOMS);
    localStorage.removeItem(STORAGE_KEY_TASKS);
    localStorage.removeItem(STORAGE_KEY_BOOKINGS);
    localStorage.removeItem(STORAGE_KEY_NOTIFS);
    setRooms(INITIAL_ROOMS);
    setTasks(INITIAL_TASKS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setBookings([]);
    setComparedRoomIds([]);
    setLatestToast(null);
    alert('Demo data and notifications reset to default state.');
  };

  return {
    isLoaded,
    rooms,
    tasks,
    bookings,
    notifications,
    latestToast,
    comparedRoomIds,
    activeMode,
    setActiveMode,
    toggleCompareRoom,
    clearCompare,
    createBooking,
    updateTaskStatus,
    addDamageReport,
    exportScheduleCSV,
    resetDemoData
  };
}
