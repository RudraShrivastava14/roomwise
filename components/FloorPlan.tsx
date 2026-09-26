'use client';

import React from 'react';
import { Room } from '../lib/types';
import { Layers, Sparkles, CheckCircle2, ShieldAlert, Waves, Sun, Building } from 'lucide-react';

interface FloorPlanProps {
  rooms: Room[];
  selectedFloor: number;
  onSelectFloor: (floor: number) => void;
  comparedRoomIds: string[];
  onToggleCompare: (roomId: string) => void;
  onSelectRoom: (room: Room) => void;
}

export const FloorPlan: React.FC<FloorPlanProps> = ({
  rooms,
  selectedFloor,
  onSelectFloor,
  comparedRoomIds,
  onToggleCompare,
  onSelectRoom,
}) => {
  const floorRooms = rooms.filter(r => r.floor === selectedFloor);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Floor Selection Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-sky-400 text-xs font-semibold uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Interactive Floor Level Layout</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
            Select Your Physical Room on Floor {selectedFloor}
          </h2>
          <p className="text-xs text-slate-400">
            Hover or click on individual room blueprints to inspect specs, amenities, and view orientation.
          </p>
        </div>

        {/* Floor Pills */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
          {[4, 3].map(floor => (
            <button
              key={floor}
              onClick={() => onSelectFloor(floor)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedFloor === floor
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Floor {floor} Layout
            </button>
          ))}
        </div>
      </div>

      {/* Visual Blueprint Container */}
      <div className="relative bg-slate-950/80 border-2 border-dashed border-slate-800 rounded-2xl p-6 min-h-[380px] flex flex-col justify-between overflow-hidden shadow-inner">
        {/* Architectural Corridor Label */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-800/80 backdrop-blur-md px-4 py-1 rounded-full border border-slate-700 text-[11px] font-mono text-slate-400 uppercase tracking-widest">
          ◄ Main Corridor / Ocean Facing Terrace ►
        </div>

        {/* Room Blueprints Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 pb-6">
          {floorRooms.map(room => {
            const isComparing = comparedRoomIds.includes(room.id);
            return (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room)}
                className={`relative group bg-slate-900/90 border-2 rounded-2xl p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1.5 shadow-xl ${
                  isComparing
                    ? 'border-sky-500 ring-2 ring-sky-500/40 bg-sky-950/20'
                    : room.isBooked
                    ? 'border-slate-800 opacity-90'
                    : 'border-slate-700 hover:border-sky-400/80'
                }`}
              >
                {/* Visual Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-black text-white group-hover:text-sky-400 transition-colors">
                      Room {room.roomNumber}
                    </span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {room.category}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                    ₹{room.pricePerNight.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Specs List */}
                <div className="space-y-1.5 text-xs text-slate-300 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">View Orientation:</span>
                    <span className="font-semibold text-slate-100 flex items-center space-x-1">
                      <span>{room.viewType}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Floor Space:</span>
                    <span className="font-semibold text-slate-100">{room.areaSqM} m²</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Balcony / Bathtub:</span>
                    <span className="font-semibold text-slate-100">
                      {room.balcony ? 'Balcony' : 'No Balcony'} • {room.bathtub ? 'Bathtub' : 'Shower'}
                    </span>
                  </div>
                </div>

                {/* Room Blueprint Visual Icon Box */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] font-mono text-slate-400">
                    {room.isBooked ? (
                      <span className="text-amber-300 font-semibold">Booked for your dates</span>
                    ) : (
                      <span className="text-emerald-300 font-semibold">Available</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleCompare(room.id);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-colors ${
                      isComparing
                        ? 'bg-sky-500 text-white border-sky-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {isComparing ? 'Comparing' : '+ Compare'}
                  </button>
                </div>

                {/* Status Indicator Bar */}
                <div
                  className={`absolute top-0 left-1/2 -translate-x-1/2 h-1 w-20 rounded-b-md ${
                    room.isBooked ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Legend Footer */}
        <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400 gap-2">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Available for your dates</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>Booked for your dates</span>
            </span>
          </div>

          <p className="text-[11px] italic text-slate-500">
            *Click any room box to inspect full photo gallery & reserve.
          </p>
        </div>
      </div>
    </div>
  );
};
