'use client';

import React, { useState } from 'react';
import { CleaningStatus, PriorityLevel, NotificationLog, QueueItem } from '../lib/types';
import { StaffData } from '../lib/store';
import { formatPropertyTime } from '../lib/time';
import { HIGH_BUFFER_MAX, URGENT_BUFFER_MAX } from '../lib/priority';
import { DamageReportModal } from './DamageReportModal';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  Check,
  ShieldAlert,
  Sparkles,
  Filter,
  UserCheck,
  Download,
  Printer,
  Zap,
  MessageSquare,
  Bell,
  X,
  RotateCcw,
  LogOut,
  Loader2,
  Hourglass,
} from 'lucide-react';

interface StaffViewProps {
  data: StaffData;
  refreshError: string | null;
  latestToast: NotificationLog | null;
  onUpdateStatus: (taskId: string, newStatus: CleaningStatus) => Promise<void>;
  onAddDamageReport: (taskId: string, item: string, description: string, severity: 'MINOR' | 'MAJOR') => Promise<void>;
  onExportCSV: () => void;
  onResetDemo: () => Promise<void>;
  onLogout: () => void;
}

/** Human wording for the computed slack before the next guest arrives. */
function describeBuffer(task: QueueItem): { text: string; className: string } {
  if (task.status === 'READY') return { text: 'Ready — nothing left to do', className: 'text-emerald-400' };
  if (task.bufferMinutes === null) return { text: 'No guest booked in yet', className: 'text-slate-400' };
  if (task.bufferMinutes < 0) return { text: `Will be ${-task.bufferMinutes} min late for arrival`, className: 'text-red-400 font-bold' };
  return { text: `${task.bufferMinutes} min of slack`, className: task.bufferMinutes <= URGENT_BUFFER_MAX ? 'text-red-300 font-bold' : 'text-slate-200' };
}

export const StaffView: React.FC<StaffViewProps> = ({
  data,
  refreshError,
  latestToast,
  onUpdateStatus,
  onAddDamageReport,
  onExportCSV,
  onResetDemo,
  onLogout,
}) => {
  const { rooms, queue: tasks, notifications } = data;
  const [selectedTaskForDamage, setSelectedTaskForDamage] = useState<QueueItem | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [filterFloor, setFilterFloor] = useState<number | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<CleaningStatus | 'ALL'>('ALL');
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);

  // KPIs
  const totalRooms = rooms.length;
  const readyRooms = rooms.filter(r => r.status === 'READY').length;
  const readinessPercent = totalRooms ? Math.round((readyRooms / totalRooms) * 100) : 0;

  const openTasks = tasks.filter(t => t.status !== 'READY');
  const urgentTasks = openTasks.filter(t => t.priority === 'URGENT').length;
  const lateTasks = openTasks.filter(t => t.bufferMinutes !== null && t.bufferMinutes < 0).length;
  const earlyCheckInTasks = openTasks.filter(t => t.isEarlyCheckIn).length;
  const floors = Array.from(new Set(rooms.map(r => r.floor))).sort((a, b) => b - a);

  // The server already sorted by least slack; filtering keeps that order.
  const filteredTasks = tasks.filter(t => {
    if (filterFloor !== 'ALL' && t.floor !== filterFloor) return false;
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    return true;
  });

  const advance = async (task: QueueItem, to: CleaningStatus) => {
    setBusyTaskId(task.id);
    setActionError(null);
    try {
      await onUpdateStatus(task.id, to);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset the shared demo data? Bookings made by anyone will be removed.')) return;
    setResetting(true);
    setActionError(null);
    try {
      await onResetDemo();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setResetting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getPriorityBadgeStyle = (priority: PriorityLevel) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'NORMAL':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  const getStatusBadgeStyle = (status: CleaningStatus) => {
    switch (status) {
      case 'DIRTY':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'CLEANING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'INSPECTION':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'READY':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* Floating Simulated SMS/WhatsApp Toast Notification */}
      {latestToast && (
        <div className="fixed top-20 right-6 z-50 max-w-sm bg-slate-900 border-2 border-amber-500/80 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-fade-in flex items-start space-x-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-1">
            <div className="font-bold text-amber-300 flex items-center justify-between">
              <span>{latestToast.type} (simulated)</span>
              <span className="text-[10px] text-slate-400 font-normal">{formatPropertyTime(latestToast.timestamp)}</span>
            </div>
            <p className="text-slate-200 leading-snug">{latestToast.message}</p>
            <div className="text-[10px] text-slate-400 font-mono">To: {latestToast.recipient}</div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full">
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Housekeeping & Room Readiness Operations Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
              Housekeeping Priority Dispatch Queue
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Ordered by slack: time until the next guest arrives, minus waiting for checkout, minus cleaning + inspection left.
              Under {URGENT_BUFFER_MAX} min is URGENT, under {HIGH_BUFFER_MAX} min is HIGH. Updates every 15 seconds.
            </p>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowNotificationDrawer(!showNotificationDrawer)}
              className="relative bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 font-semibold transition-colors flex items-center space-x-1.5"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>SMS Logs ({notifications.length})</span>
            </button>

            <button
              onClick={onExportCSV}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3.5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2.5 rounded-xl border border-slate-700 font-semibold transition-colors flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </button>

            <button
              onClick={handleReset}
              disabled={resetting}
              title="Reset shared demo data (times re-anchored to now)"
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 font-semibold transition-colors flex items-center space-x-1.5 disabled:opacity-60"
            >
              {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              <span>Reset demo</span>
            </button>

            <button
              onClick={onLogout}
              title="Sign out"
              className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2.5 rounded-xl border border-slate-700 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Operational KPI Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
            <div className="text-xs text-slate-400">Total Room Readiness</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{readinessPercent}%</div>
            <div className="text-[10px] text-slate-500">{readyRooms} of {totalRooms} rooms inspected</div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
            <div className="text-xs text-slate-400">Urgent Turnovers</div>
            <div className="text-2xl font-black text-red-400 mt-1">{urgentTasks}</div>
            <div className="text-[10px] text-red-400/80 font-medium">≤ {URGENT_BUFFER_MAX} min of slack</div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
            <div className="text-xs text-slate-400">Will Be Late</div>
            <div className="text-2xl font-black text-red-500 mt-1">{lateTasks}</div>
            <div className="text-[10px] text-slate-500">Not enough time left — tell the front desk</div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
            <div className="text-xs text-slate-400">Early Check-Ins Pending</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{earlyCheckInTasks}</div>
            <div className="text-[10px] text-amber-300/80 font-medium">Guests arriving at 12:00 PM</div>
          </div>
        </div>
      </div>

      {/* Notification Log Drawer Overlay */}
      {showNotificationDrawer && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Dispatch Log <span className="text-slate-400 font-normal">(simulated — no real SMS is sent)</span></h3>
            </div>
            <button
              onClick={() => setShowNotificationDrawer(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {notifications.map(notif => (
              <div key={notif.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex justify-between gap-3">
                <div>
                  <span className="font-bold text-amber-400 mr-2">[{notif.type}]</span>
                  <span className="text-slate-200">{notif.message}</span>
                  <div className="text-[10px] text-slate-400 mt-0.5">Recipient: {notif.recipient}</div>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0">{formatPropertyTime(notif.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Housekeeping Priority Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center space-x-2 text-sm font-bold text-white">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span>Priority Dispatch Queue ({filteredTasks.length} tasks)</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <select
              value={filterFloor}
              onChange={e => setFilterFloor(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="ALL">All Floors</option>
              {floors.map(f => (
                <option key={f} value={f}>Floor {f}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="DIRTY">DIRTY</option>
              <option value="CLEANING">CLEANING</option>
              <option value="INSPECTION">INSPECTION</option>
              <option value="READY">READY</option>
            </select>
          </div>
        </div>

        {(actionError || refreshError) && (
          <p role="alert" className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError ?? `Live refresh failed: ${refreshError}. Showing the last loaded data.`}</span>
          </p>
        )}

        {/* Task Cards Grid / List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-10">No rooms match these filters.</p>
          )}
          {filteredTasks.map(task => (
            <div
              key={task.id}
              className={`bg-slate-950 border rounded-2xl p-5 transition-all shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                task.priority === 'URGENT'
                  ? 'border-red-500/50 bg-red-950/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Left Column: Room info & priority */}
              <div className="space-y-2 max-w-md">
                <div className="flex items-center space-x-3">
                  <span className="text-xl font-black text-white">Room {task.roomNumber}</span>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
                    Floor {task.floor} • {task.category}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border uppercase tracking-wider ${getPriorityBadgeStyle(
                      task.priority
                    )}`}
                  >
                    {task.priority} Priority
                  </span>
                </div>

                {/* Early Check-In Badge */}
                {task.isEarlyCheckIn && (
                  <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Paid early check-in</span>
                  </div>
                )}

                <div className="text-xs text-slate-300 flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Checkout: <strong className="text-slate-100">{formatPropertyTime(task.checkoutAt)}</strong></span>
                  </span>
                  <span>|</span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>
                      Next arrival: <strong className="text-sky-300">{formatPropertyTime(task.nextArrivalAt)}</strong>
                      {task.nextGuestName && <span className="text-slate-400"> ({task.nextGuestName})</span>}
                    </span>
                  </span>
                </div>

                <div className="text-xs flex items-center space-x-1.5">
                  <Hourglass className="w-3.5 h-3.5 text-slate-400" />
                  <span className={describeBuffer(task).className}>{describeBuffer(task).text}</span>
                  {task.status !== 'READY' && (
                    <span className="text-slate-500">· ~{task.remainingWorkMinutes} min of work left</span>
                  )}
                </div>

                {task.notes && (
                  <p className="text-xs text-slate-400 bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 italic">
                    {task.notes}
                  </p>
                )}

                {task.damageReport && (
                  <div className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-300 p-2.5 rounded-xl flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>Damage Flagged:</strong> {task.damageReport.item} — {task.damageReport.description}
                    </div>
                  </div>
                )}
              </div>

              {/* Middle Column: Current Status & Assigned Housekeeper */}
              <div className="flex flex-col items-start md:items-center justify-center space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Current Status</span>
                <span
                  className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border ${getStatusBadgeStyle(
                    task.status
                  )}`}
                >
                  {task.status}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Assigned: <strong className="text-slate-200">{task.assignedStaff || 'Unassigned'}</strong>
                </span>
              </div>

              {/* Right Column: One-Tap Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {task.status === 'DIRTY' && (
                  <button
                    onClick={() => advance(task, 'CLEANING')}
                    disabled={busyTaskId === task.id}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Cleaning</span>
                  </button>
                )}

                {task.status === 'CLEANING' && (
                  <button
                    onClick={() => advance(task, 'INSPECTION')}
                    disabled={busyTaskId === task.id}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center space-x-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Send for Inspection</span>
                  </button>
                )}

                {task.status === 'INSPECTION' && (
                  <button
                    onClick={() => advance(task, 'READY')}
                    disabled={busyTaskId === task.id}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Ready for Guest</span>
                  </button>
                )}

                {task.status === 'READY' && (
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/30 flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Ready for Check-In</span>
                  </span>
                )}

                <button
                  onClick={() => setSelectedTaskForDamage(task)}
                  title="Report damaged item or maintenance flag"
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-amber-400 p-2.5 rounded-xl text-xs font-medium transition-colors"
                >
                  <ShieldAlert className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Damage Report Modal */}
      <DamageReportModal
        task={selectedTaskForDamage}
        isOpen={!!selectedTaskForDamage}
        onClose={() => setSelectedTaskForDamage(null)}
        onSubmitReport={onAddDamageReport}
      />
    </div>
  );
};
