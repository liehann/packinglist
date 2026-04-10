import React from 'react';
import { 
  Shirt, Smartphone, Laptop, BatteryCharging, Headphones, Camera, 
  Ticket, Wallet, Droplet, Pill, Baby, Book, Apple, 
  Footprints, BaggageClaim, Package 
} from 'lucide-react';

export const COLOR_PALETTE = [
  '#fed7aa', // orange
  '#bfdbfe', // blue
  '#bbf7d0', // green
  '#a5f3fc', // cyan
  '#e9d5ff', // purple
  '#fbcfe8', // pink
  '#fecaca', // red
  '#fef08a'  // yellow
];

export const getCategoryColor = (categoryName: string) => {
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
};

export const matchIcon = (name: string, size = 22) => {
  const n = name.toLowerCase();
  if (n.includes('shirt') || n.includes('pant') || n.includes('sock') || n.includes('jacket') || n.includes('coat') || n.includes('clothes') || n.includes('underwear')) return <Shirt size={size} strokeWidth={1.5} />;
  if (n.includes('phone') || n.includes('ipad') || n.includes('tablet')) return <Smartphone size={size} strokeWidth={1.5} />;
  if (n.includes('laptop') || n.includes('mac') || n.includes('computer')) return <Laptop size={size} strokeWidth={1.5} />;
  if (n.includes('charg') || n.includes('cable') || n.includes('plug') || n.includes('usb') || n.includes('adapt') || n.includes('power')) return <BatteryCharging size={size} strokeWidth={1.5} />;
  if (n.includes('headphone') || n.includes('earpod') || n.includes('airpod') || n.includes('audio')) return <Headphones size={size} strokeWidth={1.5} />;
  if (n.includes('camera') || n.includes('lens')) return <Camera size={size} strokeWidth={1.5} />;
  if (n.includes('passport') || n.includes('id') || n.includes('ticket') || n.includes('document')) return <Ticket size={size} strokeWidth={1.5} />;
  if (n.includes('wallet') || n.includes('cash') || n.includes('money') || n.includes('card')) return <Wallet size={size} strokeWidth={1.5} />;
  if (n.includes('tooth') || n.includes('shampoo') || n.includes('soap') || n.includes('wash') || n.includes('lotion')) return <Droplet size={size} strokeWidth={1.5} />;
  if (n.includes('med') || n.includes('pill') || n.includes('band') || n.includes('aid')) return <Pill size={size} strokeWidth={1.5} />;
  if (n.includes('diaper') || n.includes('wipe') || n.includes('stroller') || n.includes('crib') || n.includes('kid') || n.includes('baby')) return <Baby size={size} strokeWidth={1.5} />;
  if (n.includes('book') || n.includes('read')) return <Book size={size} strokeWidth={1.5} />;
  if (n.includes('snack') || n.includes('food') || n.includes('eat') || n.includes('water')) return <Apple size={size} strokeWidth={1.5} />;
  if (n.includes('shoe') || n.includes('boot') || n.includes('sneaker')) return <Footprints size={size} strokeWidth={1.5} />;
  if (n.includes('bag') || n.includes('pack') || n.includes('suit') || n.includes('luggage')) return <BaggageClaim size={size} strokeWidth={1.5} />;
  return <Package size={size} strokeWidth={1.5} />;
};
