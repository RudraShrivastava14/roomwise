'use client';

import React, { useState, useMemo } from 'react';
import { Room, FilterOptions } from '../lib/types';
import { RoomCard } from './RoomCard';
import { FloorPlan } from './FloorPlan';
import { SlidersHorizontal, LayoutGrid, Layers, Sparkles, Filter, Check, RefreshCw } from 'lucide-react';

interface GuestViewProps {
  rooms: Room[];
  comparedRoomIds: string[];
  onToggleCompare: (roomId: string) => void;
  onClearCompare: () => void;
  onOpenCompareModal: () => void;
  onSelectBook: (room: Room) => void;
}

export const GuestView: React.FC<GuestViewProps> = ({
  rooms,
  comparedRoomIds,
  onToggleCompare,
  onClearCompare,
  onOpenCompareModal,
  onSelectBook,
}) => {
  const [viewMode, setViewMode] = useState<'GRID' | 'FLOORPLAN'>('FLOORPLAN');
  const [selectedFloor, setSelectedFloor] = useState<number>(4);

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    floor: 'ALL',
    category: 'ALL',
    viewType: 'ALL',
    balconyOnly: false,
    bathtubOnly: false,
    maxPrice: 15000,
  });

  const comparedRooms = useMemo(
    () => rooms.filter(r => comparedRoomIds.includes(r.id)),
    [rooms, comparedRoomIds]
  );

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      if (filters.floor !== 'ALL' && room.floor !== filters.floor) return false;
      if (filters.category !== 'ALL' && room.category !== filters.category) return false;
      if (filters.viewType !== 'ALL' && room.viewType !== filters.viewType) return false;
      if (filters.balconyOnly && !room.balcony) return false;
      if (filters.bathtubOnly && !room.bathtub) return false;
      if (room.pricePerNight > filters.maxPrice) return false;
      return true;
    });
  }, [rooms, filters]);

  const resetFilters = () => {
    setFilters({
      floor: 'ALL',
      category: 'ALL',
      viewType: 'ALL',
      balconyOnly: false,
      bathtubOnly: false,
      maxPrice: 15000,
    });
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner & Value Proposition */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Unit-Level Booking Engine</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Choose Your Exact Physical Hotel Room.
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Stop guessing what room you'll get at check-in. Inspect floor plans, compare exact views, square footage, balconies, and soaking tubs side-by-side before reserving.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-6">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('FLOORPLAN')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'FLOORPLAN'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Interactive Floor Plan Layout</span>
            </button>

            <button
              onClick={() => setViewMode('GRID')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'GRID'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Room Grid View</span>
            </button>
          </div>

          <div className="text-xs text-slate-400">
            Showing <strong className="text-white">{filteredRooms.length}</strong> rooms at Grand Azure Resort
          </div>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-sky-400" />
            <span>Filter Specs & Amenities</span>
          </div>

          <button
            onClick={resetFilters}
            className="text-xs text-slate-400 hover:text-sky-400 flex items-center space-x-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {/* Floor Filter */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Floor Level</label>
            <select
              value={filters.floor}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  floor: e.target.value === 'ALL' ? 'ALL' : Number(e.target.value),
                }))
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Floors</option>
              <option value="4">Floor 4</option>
              <option value="3">Floor 3</option>
            </select>
          </div>

          {/* View Filter */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">View Orientation</label>
            <select
              value={filters.viewType}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  viewType: e.target.value as any,
                }))
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Views</option>
              <option value="Pool">Pool View</option>
              <option value="Ocean">Ocean View</option>
              <option value="Garden">Garden View</option>
              <option value="City">City View</option>
            </select>
          </div>

          {/* Balcony Checkbox */}
          <div className="flex items-center space-x-2 pt-5">
            <input
              type="checkbox"
              id="balconyOnly"
              checked={filters.balconyOnly}
              onChange={e => setFilters(prev => ({ ...prev, balconyOnly: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-sky-500"
            />
            <label htmlFor="balconyOnly" className="text-slate-300 font-medium cursor-pointer">
              Must Have Balcony
            </label>
          </div>

          {/* Bathtub Checkbox */}
          <div className="flex items-center space-x-2 pt-5">
            <input
              type="checkbox"
              id="bathtubOnly"
              checked={filters.bathtubOnly}
              onChange={e => setFilters(prev => ({ ...prev, bathtubOnly: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-sky-500"
            />
            <label htmlFor="bathtubOnly" className="text-slate-300 font-medium cursor-pointer">
              Must Have Bathtub
            </label>
          </div>

          {/* Max Price Slider */}
          <div>
            <div className="flex justify-between text-slate-400 font-medium mb-1">
              <span>Max Price</span>
              <span className="text-white font-bold">₹{filters.maxPrice.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={4000}
              max={15000}
              step={500}
              value={filters.maxPrice}
              onChange={e => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
              className="w-full accent-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Main Display: Floor Plan or Grid */}
      {viewMode === 'FLOORPLAN' ? (
        <FloorPlan
          rooms={filteredRooms}
          selectedFloor={selectedFloor}
          onSelectFloor={setSelectedFloor}
          comparedRoomIds={comparedRoomIds}
          onToggleCompare={onToggleCompare}
          onSelectRoom={onSelectBook}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              isCompared={comparedRoomIds.includes(room.id)}
              onToggleCompare={onToggleCompare}
              onSelectBook={onSelectBook}
            />
          ))}
        </div>
      )}

      {/* Sticky Bottom Comparison Drawer */}
      {comparedRooms.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border-2 border-sky-500/80 rounded-2xl shadow-2xl p-4 backdrop-blur-xl flex items-center space-x-4 max-w-2xl w-full mx-auto animate-bounce-short">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-extrabold text-sm">
              {comparedRooms.length}
            </div>
            <div className="text-xs">
              <div className="font-bold text-white">Rooms Selected for Comparison</div>
              <div className="text-slate-400">
                {comparedRooms.map(r => `Room ${r.roomNumber}`).join(', ')}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-auto">
            <button
              onClick={onClearCompare}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              Clear All
            </button>

            <button
              onClick={onOpenCompareModal}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Compare Specs Side-by-Side</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
