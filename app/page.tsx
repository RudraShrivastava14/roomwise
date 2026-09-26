'use client';

import React, { useState } from 'react';
import { useRoomWiseStore } from '../lib/store';
import { Room } from '../lib/types';
import { Navbar } from '../components/Navbar';
import { GuestView } from '../components/GuestView';
import { StaffView } from '../components/StaffView';
import { StaffLogin } from '../components/StaffLogin';
import { ErrorPanel } from '../components/ErrorPanel';
import { RoomComparisonModal } from '../components/RoomComparisonModal';
import { BookingModal } from '../components/BookingModal';
import { Hotel, Loader2 } from 'lucide-react';

export default function Home() {
  const store = useRoomWiseStore();
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<Room | null>(null);

  const comparedRooms = store.rooms.filter(r => store.comparedRoomIds.includes(r.id));

  const renderStaff = () => {
    if (store.staff === undefined) return <Spinner label="Checking session..." />;
    if (!store.staff) return <StaffLogin onLogin={store.login} />;
    if (!store.staffData) {
      return store.staffError ? (
        <ErrorPanel message={store.staffError} onRetry={store.reloadStaff} />
      ) : (
        <Spinner label="Loading housekeeping queue..." />
      );
    }
    return (
      <StaffView
        staff={store.staff}
        team={store.team}
        onLoadTeam={store.loadTeam}
        onAddStaff={store.addStaffMember}
        onRemoveStaff={store.removeStaffMember}
        onAssign={store.assignTask}
        data={store.staffData}
        refreshError={store.staffError}
        latestToast={store.latestToast}
        onUpdateStatus={store.updateTaskStatus}
        onAddDamageReport={store.addDamageReport}
        onExportCSV={store.exportScheduleCSV}
        onResetDemo={store.resetDemoData}
        onLogout={store.logout}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar
        activeMode={store.activeMode}
        onModeChange={store.setActiveMode}
        comparedCount={store.comparedRoomIds.length}
        onOpenCompare={() => setIsCompareModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {store.activeMode === 'GUEST' ? (
          <GuestView
            rooms={store.rooms}
            loading={store.roomsLoading}
            error={store.roomsError}
            onRetry={store.reloadRooms}
            stay={store.stay}
            onStayChange={store.setStay}
            comparedRoomIds={store.comparedRoomIds}
            onToggleCompare={store.toggleCompareRoom}
            onClearCompare={store.clearCompare}
            onOpenCompareModal={() => setIsCompareModalOpen(true)}
            onSelectBook={room => setSelectedRoomForBooking(room)}
          />
        ) : (
          renderStaff()
        )}
      </main>

      <RoomComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        comparedRooms={comparedRooms}
        onSelectBook={room => {
          setIsCompareModalOpen(false);
          setSelectedRoomForBooking(room);
        }}
      />

      <BookingModal
        room={selectedRoomForBooking}
        stay={store.stay}
        isOpen={!!selectedRoomForBooking}
        onClose={() => setSelectedRoomForBooking(null)}
        onConfirmBooking={store.createBooking}
      />

      <footer className="bg-slate-900 border-t border-slate-800 py-8 text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Hotel className="w-4 h-4 text-sky-400" />
            <span className="font-bold text-white">RoomWise</span>
            <span>— guests choose the exact room; housekeeping gets it ready in time.</span>
          </div>
          <span className="text-slate-500">Demo property: Grand Azure Resort (fictional)</span>
        </div>
      </footer>
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-3 text-slate-400">
      <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
      <p className="text-xs">{label}</p>
    </div>
  );
}
