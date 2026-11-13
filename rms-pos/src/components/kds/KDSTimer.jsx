import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function KDSTimer({ createdAt }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Thresholds: Normal <= 15m (Green), Warning 15-24m (Amber), Critical >= 25m (Pulsing Red)
  let colorClasses = 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/30';
  let isPulsing = false;

  if (minutes >= 25) {
    colorClasses = 'text-[#EF4444] bg-[#EF4444]/20 border-[#EF4444]/50 animate-pulse';
    isPulsing = true;
  } else if (minutes >= 15) {
    colorClasses = 'text-[#F59E0B] bg-[#F59E0B]/15 border-[#F59E0B]/40';
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-black ${colorClasses}`}>
      <Clock className={`w-4 h-4 ${isPulsing ? 'animate-bounce' : ''}`} />
      <span className="text-2xl tracking-wider">{formatted}</span>
    </div>
  );
}
