import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RoomWise — Unit-Level Booking & Housekeeping Dispatch Micro-SaaS',
  description: 'Giving guests control over which physical room they book while giving hotel staff operational visibility to prioritize turnover.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
