import React, { useState, useRef, useEffect } from 'react';
import {
  Minus,
  Square,
  Copy,
  X,
  Search,
  HardDrive,
  Keyboard,
  Info,
  Download,
  Upload,
  Volume2,
  VolumeX,
  FolderOpen,
  Undo2,
  Calendar,
  Users,
  Award,
  DollarSign,
} from 'lucide-react';
import { sound } from '../../utils/soundEffects';

interface WindowTitleBarProps {
  canUndo: boolean;
  undoCount: number;
  lastUndoDesc: string | null;
  onUndo: () => void;
  onOpenCommandPalette: () => void;
  onOpenNewClass: () => void;
  onOpenNewStudent: () => void;
  onOpenAbout: () => void;
  onOpenShortcuts: () => void;
  onOpenExportModal: () => void;
  onOpenImportModal: () => void;
  onOpenLauncherDownload: () => void;
  onResetData: () => void;
  onSelectTab: (tab: any) => void;
  isWindowedMode: boolean;
  onToggleWindowedMode: () => void;
  onMinimizeWindow: () => void;
}

export const WindowTitleBar: React.FC<WindowTitleBarProps> = ({
  canUndo,
  undoCount,
  lastUndoDesc,
  onUndo,
  onOpenCommandPalette,
  onOpenNewClass,
  onOpenNewStudent,
  onOpenAbout,
  onOpenShortcuts,
  onOpenExportModal,
  onOpenImportModal,
  onOpenLauncherDownload,
  onResetData,
  onSelectTab,
  isWindowedMode,
  onToggleWindowedMode,
  onMinimizeWindow,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [soundActive, setSoundActive] = useState<boolean>(sound.getSoundEnabled());
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSound = () => {
    const next = !soundActive;
    sound.setSoundEnabled(next);
    setSoundActive(next);
    if (next) sound.playTaskComplete();
  };

  const handleMenuClick = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const closeMenu = () => setActiveMenu(null);

  return (
    <header className="h-10 bg-slate-900 border-b border-slate-800 text-slate-300 flex items-center justify-between px-3 select-none text-xs shrink-0 relative z-40">
      {/* Left: Window Icon, Title, and Desktop App Menu Bar */}
      <div className="flex items-center gap-3" ref={menuRef}>
        <div className="flex items-center gap-2">
          <img
            src="/src/assets/images/desktop_app_icon_1792329731004.jpg"
            alt="Öğretmen Masası Logo"
            referrerPolicy="no-referrer"
            className="w-5 h-5 rounded object-cover shadow-sm ring-1 ring-slate-700/60"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <span className="font-semibold text-slate-100 tracking-tight text-xs flex items-center gap-1.5 whitespace-nowrap">
            ÖğretmenMasası<span className="text-slate-400 font-mono text-[11px]">.exe</span>
          </span>
        </div>

        {/* Desktop Menu Bar */}
        <nav className="hidden md:flex items-center text-slate-300 font-medium">
          {/* Dosya Menüsü */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('file')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                activeMenu === 'file' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              Dosya
            </button>
            {activeMenu === 'file' && (
              <div className="absolute top-full left-0 mt-1 w-60 bg-slate-900 border border-slate-700 rounded-md shadow-2xl py-1 text-slate-200 z-50 text-xs">
                <button
                  onClick={() => {
                    closeMenu();
                    onOpenNewClass();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-sky-600 hover:text-white flex items-center justify-between"
                >
                  <span>Yeni Ders Planla...</span>
                  <span className="text-[10px] text-slate-400 font-mono">Ctrl+N</span>
                </button>
                <button
                  onClick={() => {
                    closeMenu();
                    onOpenNewStudent();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-sky-600 hover:text-white flex items-center justify-between"
                >
                  <span>Yeni Öğrenci Ekle...</span>
                  <span className="text-[10px] text-slate-400 font-mono">Ctrl+U</span>
                </button>
                <button
                  onClick={() => {
                    closeMenu();
                    if (canUndo) onUndo();
                  }}
                  disabled={!canUndo}
                  className={`w-full text-left px-3 py-1.5 flex items-center justify-between ${
                    canUndo ? 'hover:bg-amber-600 hover:text-white cursor-pointer' : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  <span>Son İşlemi Geri Al</span>
                  <span className="text-[10px] text-slate-400 font-mono">Ctrl+Z</span>
                </button>
                <div className="my-1 border-t border-slate-800" />
                <button
                  onClick={() => {
                    closeMenu();
                    onOpenExportModal();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-sky-600 hover:text-white flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Veritabanını Dışa Aktar (.json)</span>
                </button>
                <button
                  onClick={() => {
                    closeMenu();
                    onOpenImportModal();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-sky-600 hover:text-white flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>Yedekten Geri Yükle...</span>
                </button>
                <button
                  onClick={() => {
                    closeMenu();
                    onOpenLauncherDownload();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-sky-600 hover:text-white flex items-center gap-2"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Masaüstü Başlatıcı (.bat / .exe)</span>
                </button>
                <div className="my-1 border-t border-slate-800" />
                <button
                  onClick={() => {
                    closeMenu();
                    onResetData();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-rose-900/40 text-rose-300 hover:text-rose-200"
                >
                  Örnek Verilere Sıfırla
                </button>
              </div>
            )}
          </div>

          {/* Düzen Menüsü */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('edit')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                activeMenu === 'edit' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              Düzen
            </button>
            {activeMenu === 'edit' && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-slate-900 border border-slate-700 rounded-md shadow-2xl py-1 text-slate-200 z-50 text-xs">
                <button
                  onClick={() => {
                    closeMenu();
                    if (canUndo) onUndo();
                  }}
                  disabled={!canUndo}
                  className={`w-full text-left px-3 py-1.5 flex items-center justify-between ${
                    canUndo ? 'hover:bg-sky-600 hover:text-white' : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Geri Al</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Ctrl+Z</span>
                </button>
                <div className="my-1 border-t border-slate-800" />
                <div className="px-3 py-1 text-[11px] text-slate-400">
                  İpucu: Dersleri çizelgede sürükleyerek her yarım saate (:00, :30) anında kilitleyebilirsiniz.
                </div>
              </div>
            )}
          </div>

          {/* Görünüm Menüsü */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('view')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                activeMenu === 'view' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              Görünüm
            </button>
            {activeMenu === 'view' && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-slate-900 border border-slate-700 rounded-md shadow-2xl py-1 text-slate-200 z-50 text-xs">
                <button
                  onClick={() => {
                    closeMenu();
                    onSelectTab('calendar');
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-sky-600 hover:text-white flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    Takvim & Gün Planı
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">1</span>
                </button>
                <button
                  onClick={() => {
                    closeMenu();
                    onSelectTab('students');
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-sky-600 hover:text-white flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    Öğrenciler & Profiller
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">2</span>
                </button>
                <button
                  onClick={() => {
                    closeMenu();
                    onSelectTab('scores');
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-sky-600 hover:text-white flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-purple-400" />
                    Sınav & Deneme Sonuçları
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">3</span>
                </button>
                <button
                  onClick={() => {
                    closeMenu();
                    onSelectTab('analytics');
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-sky-600 hover:text-white flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    Gelir & Finansal Analiz
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">4</span>
                </button>
                <div className="my-1 border-t border-slate-800" />
                <button
                  onClick={() => {
                    closeMenu();
                    onToggleWindowedMode();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-sky-600 hover:text-white"
                >
                  {isWindowedMode ? 'Tam Ekran Görünüm' : 'Pencereli Düzen (.exe)'}
                </button>
              </div>
            )}
          </div>

          {/* Araçlar Menüsü */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('tools')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                activeMenu === 'tools' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              Araçlar
            </button>
            {activeMenu === 'tools' && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-slate-900 border border-slate-700 rounded-md shadow-2xl py-1 text-slate-200 z-50 text-xs">
                <button
                  onClick={() => {
                    closeMenu();
                    toggleSound();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-sky-600 hover:text-white flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    {soundActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    Ses Efektleri
                  </span>
                  <span className="text-[10px] text-slate-400">{soundActive ? 'AÇIK' : 'KAPALI'}</span>
                </button>
                <button
                  onClick={() => {
                    closeMenu();
                    onOpenCommandPalette();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-sky-600 hover:text-white flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5" />
                    Hızlı Arama & Komutlar
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Ctrl+K</span>
                </button>
              </div>
            )}
          </div>

          {/* Yardım Menüsü */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('help')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                activeMenu === 'help' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              Yardım
            </button>
            {activeMenu === 'help' && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-slate-900 border border-slate-700 rounded-md shadow-2xl py-1 text-slate-200 z-50 text-xs">
                <button
                  onClick={() => {
                    closeMenu();
                    onOpenShortcuts();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-sky-600 hover:text-white flex items-center gap-2"
                >
                  <Keyboard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Klavye Kısayolları</span>
                </button>
                <button
                  onClick={() => {
                    closeMenu();
                    onOpenAbout();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-sky-600 hover:text-white flex items-center gap-2"
                >
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Hakkında & Kılavuz (v5.0)</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Center: Command Palette Trigger */}
      <div className="hidden lg:flex items-center">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-md text-slate-400 hover:text-slate-200 transition-colors w-64 justify-between"
        >
          <span className="flex items-center gap-2 text-xs truncate">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Öğrenci, ders veya sınav ara...</span>
          </span>
          <kbd className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-400 border border-slate-700">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Undo Action Button & Window Controls */}
      <div className="flex items-center gap-2">
        {/* Undo Button */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors border ${
            canUndo
              ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 cursor-pointer shadow-xs animate-in fade-in'
              : 'bg-slate-850 text-slate-500 border-slate-800 opacity-60 cursor-not-allowed'
          }`}
          title={canUndo ? `Geri Al (Ctrl+Z): ${lastUndoDesc}` : 'Geri alınacak işlem yok'}
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span className="font-semibold">Geri Al</span>
          <kbd className="text-[10px] bg-slate-900 px-1 py-0.2 rounded font-mono text-slate-400 border border-slate-750">
            Ctrl+Z
          </kbd>
          {undoCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-200 text-[10px] flex items-center justify-center font-mono">
              {undoCount}
            </span>
          )}
        </button>

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-850 border border-slate-800 text-[11px] font-mono text-slate-400">
          <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          <span>Yerel Depo (.exe)</span>
        </div>

        {/* Windows Controls */}
        <div className="flex items-center ml-1 border-l border-slate-800 pl-1">
          <button
            onClick={onMinimizeWindow}
            className="w-9 h-8 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Küçült"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onToggleWindowedMode}
            className="w-9 h-8 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title={isWindowedMode ? 'Tam Ekran Görünüm' : 'Pencereli Masaüstü Düzeni (.exe)'}
          >
            {isWindowedMode ? <Square className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>

          <button
            onClick={onMinimizeWindow}
            className="w-9 h-8 flex items-center justify-center hover:bg-rose-600 text-slate-400 hover:text-white transition-colors"
            title="Kapat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
