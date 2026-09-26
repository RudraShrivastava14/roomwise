'use client';

import React, { useState } from 'react';
import { useRoomWiseStore } from '../lib/store';
import { Room } from '../lib/types';
import { Navbar } from '../components/Navbar';
import { GuestView } from '../components/GuestView';
import { StaffView } from '../components/StaffView';
import { RoomComparisonModal } from '../components/RoomComparisonModal';
import { BookingModal } from '../components/BookingModal';
import { Hotel } from 'lucide-react';

export default function Home() {
  const {
    isLoaded,
    rooms,
    tasks,
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
    resetDemoData,
  } = useRoomWiseStore();

  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<Room | null>(null);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center animate-pulse">
          <Hotel className="w-6 h-6 text-sky-400" />
        </div>
        <p className="text-xs text-slate-400">Loading RoomWise Engine...</p>
      </div>
    );
  }

  const comparedRooms = rooms.filter(r => comparedRoomIds.includes(r.id));

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Header Navigation */}
      <Navbar
        activeMode={activeMode}
        onModeChange={setActiveMode}
        comparedCount={comparedRoomIds.length}
        onOpenCompare={() => setIsCompareModalOpen(true)}
        onResetDemo={resetDemoData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeMode === 'GUEST' ? (
          <GuestView
            rooms={rooms}
            comparedRoomIds={comparedRoomIds}
            onToggleCompare={toggleCompareRoom}
            onClearCompare={clearCompare}
            onOpenCompareModal={() => setIsCompareModalOpen(true)}
            onSelectBook={(room) => setSelectedRoomForBooking(room)}
          />
        ) : (
          <StaffView
            rooms={rooms}
            tasks={tasks}
            notifications={notifications}
            latestToast={latestToast}
            onUpdateStatus={updateTaskStatus}
            onAddDamageReport={addDamageReport}
            onExportCSV={exportScheduleCSV}
            onResetDemo={resetDemoData}
          />
        )}
      </main>

      {/* Side-by-side Room Comparison Modal */}
      <RoomComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        comparedRooms={comparedRooms}
        onSelectBook={(room) => {
          setIsCompareModalOpen(false);
          setSelectedRoomForBooking(room);
        }}
      />

      {/* Room Reservation Checkout Modal */}
      <BookingModal
        room={selectedRoomForBooking}
        isOpen={!!selectedRoomForBooking}
        onClose={() => setSelectedRoomForBooking(null)}
        onConfirmBooking={(roomId, name, email, checkIn, checkOut, isEarlyCheckIn) =>
          createBooking(roomId, name, email, checkIn, checkOut, isEarlyCheckIn)
        }
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8 text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Hotel className="w-4 h-4 text-sky-400" />
            <span className="font-bold text-white">RoomWise Micro-SaaS</span>
            <span>— Unit-Level Booking Transparency & Housekeeping Dispatch Engine</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-slate-500">Built for Boutique Hotels & Resorts</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
