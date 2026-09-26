'use client';

import React from 'react';
import { Room } from '../lib/types';
import { Maximize2, Check, Sparkles, Bed, Eye, Bath, Waves, Sun, Building, ShieldCheck } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  isCompared: boolean;
  onToggleCompare: (id: string) => void;
  onSelectBook: (room: Room) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  isCompared,
  onToggleCompare,
  onSelectBook,
}) => {
  const getViewIcon = (view: string) => {
    switch (view) {
      case 'Pool':
        return <Waves className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Ocean':
        return <Sun className="w-3.5 h-3.5 text-blue-400" />;
      case 'Garden':
        return <Sun className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Building className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getViewBadgeStyle = (view: string) => {
    switch (view) {
      case 'Pool':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'Ocean':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Garden':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  return (
    <div
      className={`group relative bg-slate-800/90 border rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
        isCompared ? 'border-sky-500 ring-2 ring-sky-500/40 bg-slate-800' : 'border-slate-700/70 hover:border-slate-600'
      }`}
    >
      {/* Image Banner & Overlay Badges */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-950">
        <img
          src={room.images[0] || 'https://images.unsplash.com/photo-1618773928121-c32242e63f39'}
          alt={`Room ${room.roomNumber}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40" />

        {/* Room Number & Floor Badge */}
        <div className="absolute top-3 left-3 flex items-center space-x-2">
          <span className="bg-slate-900/90 backdrop-blur-md text-white font-extrabold text-sm px-3 py-1 rounded-lg border border-slate-700/80 shadow-md">
            Room {room.roomNumber}
          </span>
          <span className="bg-slate-800/80 backdrop-blur-md text-slate-300 text-xs px-2.5 py-1 rounded-lg border border-slate-700">
            Floor {room.floor}
          </span>
        </div>

        {/* View Type Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-lg border backdrop-blur-md ${getViewBadgeStyle(
              room.viewType
            )}`}
          >
            {getViewIcon(room.viewType)}
            <span>{room.viewType} View</span>
          </span>
        </div>

        {/* Price Tag */}
        <div className="absolute bottom-3 left-3">
          <div className="text-white font-bold text-lg flex items-baseline space-x-1">
            <span>₹{room.pricePerNight.toLocaleString('en-IN')}</span>
            <span className="text-xs text-slate-300 font-normal">/ night</span>
          </div>
        </div>

        {/* Availability Badge */}
        <div className="absolute bottom-3 right-3">
          {room.isBooked ? (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Booked for your dates
            </span>
          ) : (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Available
            </span>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 space-y-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-sky-400 mb-1">
            {room.category}
          </div>
          <p className="text-xs text-slate-400 line-clamp-1">
            Exact physical unit on Floor {room.floor} with dedicated amenities.
          </p>
        </div>

        {/* Key Spec Grid */}
        <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 text-xs">
          <div className="flex flex-col items-center justify-center p-1 text-center">
            <Maximize2 className="w-3.5 h-3.5 text-slate-400 mb-1" />
            <span className="font-semibold text-slate-200">{room.areaSqM} m²</span>
            <span className="text-[10px] text-slate-400">Area</span>
          </div>
          <div className="flex flex-col items-center justify-center p-1 text-center border-x border-slate-700/50">
            <Sun className="w-3.5 h-3.5 text-amber-400 mb-1" />
            <span className="font-semibold text-slate-200">{room.balcony ? 'Yes' : 'No'}</span>
            <span className="text-[10px] text-slate-400">Balcony</span>
          </div>
          <div className="flex flex-col items-center justify-center p-1 text-center">
            <Bath className="w-3.5 h-3.5 text-sky-400 mb-1" />
            <span className="font-semibold text-slate-200">{room.bathtub ? 'Yes' : 'No'}</span>
            <span className="text-[10px] text-slate-400">Bathtub</span>
          </div>
        </div>

        {/* Amenities Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {room.amenities.slice(0, 3).map((amenity, idx) => (
            <span
              key={idx}
              className="text-[11px] bg-slate-700/40 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700"
            >
              {amenity}
            </span>
          ))}
          {room.amenities.length > 3 && (
            <span className="text-[11px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
              +{room.amenities.length - 3} more
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex items-center space-x-2 border-t border-slate-700/60">
          <button
            onClick={() => onToggleCompare(room.id)}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
              isCompared
                ? 'bg-sky-500/20 text-sky-300 border-sky-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isCompared ? 'Comparing' : 'Compare'}</span>
          </button>

          <button
            onClick={() => onSelectBook(room)}
            disabled={room.isBooked}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
              room.isBooked
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600'
                : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/20'
            }`}
          >
            {room.isBooked ? 'Booked for these dates' : 'Book This Room'}
          </button>
        </div>
      </div>
    </div>
  );
};
