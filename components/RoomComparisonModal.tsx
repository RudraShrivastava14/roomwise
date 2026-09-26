'use client';

import React from 'react';
import { Room } from '../lib/types';
import { X, Sparkles, Check, ArrowRight, Bath, Sun, Maximize2, Waves, Building } from 'lucide-react';

interface RoomComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparedRooms: Room[];
  onSelectBook: (room: Room) => void;
}

export const RoomComparisonModal: React.FC<RoomComparisonModalProps> = ({
  isOpen,
  onClose,
  comparedRooms,
  onSelectBook,
}) => {
  if (!isOpen || comparedRooms.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Side-by-Side Room Spec Comparison</h2>
              <p className="text-xs text-slate-400">
                Comparing {comparedRooms.length} physical room units. Highlighted specs show unique key advantages.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Matrix Content Table */}
        <div className="overflow-x-auto p-6 flex-1">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="p-4 bg-slate-950/60 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider w-1/4 rounded-tl-xl">
                  Specification
                </th>
                {comparedRooms.map(room => (
                  <th key={room.id} className="p-4 bg-slate-950/90 border-b border-slate-800 text-center w-1/3">
                    <div className="space-y-2">
                      <div className="text-lg font-black text-white">Room {room.roomNumber}</div>
                      <div className="text-xs font-medium text-sky-400">{room.category}</div>
                      <div className="text-base font-extrabold text-slate-100">
                        ₹{room.pricePerNight.toLocaleString('en-IN')}{' '}
                        <span className="text-xs font-normal text-slate-400">/ night</span>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {/* Row: View Type */}
              <tr>
                <td className="p-4 text-slate-300 font-medium bg-slate-950/30 flex items-center space-x-2">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>View Orientation</span>
                </td>
                {comparedRooms.map(room => (
                  <td
                    key={room.id}
                    className={`p-4 text-center font-semibold ${
                      room.viewType === 'Pool' || room.viewType === 'Ocean'
                        ? 'text-cyan-400 bg-cyan-950/20'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border border-slate-700 bg-slate-800">
                      {room.viewType} View
                    </span>
                  </td>
                ))}
              </tr>

              {/* Row: Area Sq M */}
              <tr>
                <td className="p-4 text-slate-300 font-medium bg-slate-950/30 flex items-center space-x-2">
                  <Maximize2 className="w-4 h-4 text-emerald-400" />
                  <span>Room Area</span>
                </td>
                {comparedRooms.map(room => (
                  <td key={room.id} className="p-4 text-center font-bold text-slate-100">
                    {room.areaSqM} m²
                  </td>
                ))}
              </tr>

              {/* Row: Balcony */}
              <tr>
                <td className="p-4 text-slate-300 font-medium bg-slate-950/30 flex items-center space-x-2">
                  <Sun className="w-4 h-4 text-sky-400" />
                  <span>Private Balcony</span>
                </td>
                {comparedRooms.map(room => (
                  <td key={room.id} className="p-4 text-center">
                    {room.balcony ? (
                      <span className="inline-flex items-center text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                        <Check className="w-3.5 h-3.5 mr-1" /> Yes (Balcony Included)
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">No Balcony</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row: Bathtub */}
              <tr>
                <td className="p-4 text-slate-300 font-medium bg-slate-950/30 flex items-center space-x-2">
                  <Bath className="w-4 h-4 text-teal-400" />
                  <span>Soaking Bathtub</span>
                </td>
                {comparedRooms.map(room => (
                  <td key={room.id} className="p-4 text-center">
                    {room.bathtub ? (
                      <span className="inline-flex items-center text-xs font-extrabold text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/30">
                        <Check className="w-3.5 h-3.5 mr-1" /> Yes (Deep Bathtub)
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">Standard Shower Only</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row: Bed & Floor */}
              <tr>
                <td className="p-4 text-slate-300 font-medium bg-slate-950/30">Floor & Bed Configuration</td>
                {comparedRooms.map(room => (
                  <td key={room.id} className="p-4 text-center text-xs text-slate-300">
                    Floor {room.floor} • {room.bedType} Bed
                  </td>
                ))}
              </tr>

              {/* Row: Amenities Highlights */}
              <tr>
                <td className="p-4 text-slate-300 font-medium bg-slate-950/30">Included Amenities</td>
                {comparedRooms.map(room => (
                  <td key={room.id} className="p-4 text-center">
                    <div className="flex flex-wrap justify-center gap-1">
                      {room.amenities.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row: Action CTA */}
              <tr>
                <td className="p-4 bg-slate-950/60 rounded-bl-xl text-slate-400 font-semibold text-xs uppercase">
                  Select Unit
                </td>
                {comparedRooms.map(room => (
                  <td key={room.id} className="p-4 text-center">
                    <button
                      onClick={() => {
                        onClose();
                        onSelectBook(room);
                      }}
                      disabled={room.isBooked}
                      className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center space-x-1 ${
                        room.isBooked
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/20'
                      }`}
                    >
                      <span>{room.isBooked ? 'Booked for your dates' : `Reserve Room ${room.roomNumber}`}</span>
                      {!room.isBooked && <ArrowRight className="w-3.5 h-3.5 ml-1" />}
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
