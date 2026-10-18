import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Clock,
  DollarSign,
  Users,
  Undo2,
  BookOpen,
} from 'lucide-react';

interface WindowStatusBarProps {
  storageUsageBytes: number;
  totalStudentsCount: number;
  totalClassesCount: number;
  monthEarnings: number;
  canUndo: boolean;
  onUndo: () => void;
  onOpenAnalytics: () => void;
}

export const WindowStatusBar: React.FC<WindowStatusBarProps> = ({
  storageUsageBytes,
  totalStudentsCount,
  totalClassesCount,
  monthEarnings,
  canUndo,
  onUndo,
  onOpenAnalytics,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <footer className="h-7 bg-slate-900 border-t border-slate-800 text-slate-400 text-[11px] font-mono px-3 flex items-center justify-between select-none shrink-0 z-30">
      {/* Left items: Offline Local DB, Storage & Undo status */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <HardDrive className="w-3 h-3" />
          <span>YEREL DEPO (.EXE AKTİF)</span>
        </span>

        <span className="text-slate-700">|</span>

        <span className="flex items-center gap-1.5">
          <span>DİSK: {formatBytes(storageUsageBytes)}</span>
        </span>

        <span className="hidden sm:inline text-slate-700">|</span>

        {canUndo ? (
          <button
            onClick={onUndo}
            className="hidden sm:flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors font-medium"
            title="Son işlemi geri al (Ctrl+Z)"
          >
            <Undo2 className="w-3 h-3" />
            <span>GERİ AL (Ctrl+Z)</span>
          </button>
        ) : (
          <span className="hidden sm:inline text-slate-500">
            KİLİT: 30 DK YAPIŞMA AKTİF
          </span>
        )}
      </div>

      {/* Right items: Month Revenue, Active Students, Total Classes, Clock */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenAnalytics}
          className="hidden md:flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
        >
          <DollarSign className="w-3 h-3" />
          <span>BU AY KAZANÇ: ₺{monthEarnings.toLocaleString('tr-TR')}</span>
        </button>

        <span className="hidden md:inline text-slate-700">|</span>

        <span className="hidden sm:flex items-center gap-1 text-slate-300">
          <BookOpen className="w-3 h-3 text-sky-400" />
          <span>{totalClassesCount} DERS</span>
        </span>

        <span className="hidden sm:inline text-slate-700">|</span>

        <span className="flex items-center gap-1 text-slate-300">
          <Users className="w-3 h-3 text-sky-400" />
          <span>{totalStudentsCount} ÖĞRENCİ</span>
        </span>

        <span className="text-slate-700">|</span>

        <span className="flex items-center gap-1.5 text-slate-300">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{timeStr}</span>
        </span>
      </div>
    </footer>
  );
};
