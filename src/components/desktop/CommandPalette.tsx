import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Calendar,
  Users,
  DollarSign,
  Download,
  Plus,
  ArrowRight,
  Award,
  Undo2,
} from 'lucide-react';
import { Student, TeacherClass, ActiveTab } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  classes: TeacherClass[];
  onSelectTab: (tab: ActiveTab) => void;
  onSelectStudent: (studentId: string) => void;
  onOpenNewClass: () => void;
  onOpenNewStudent: () => void;
  onUndo: () => void;
  onOpenLauncherDownload: () => void;
  onOpenExportModal: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  students,
  classes,
  onSelectTab,
  onSelectStudent,
  onOpenNewClass,
  onOpenNewStudent,
  onUndo,
  onOpenLauncherDownload,
  onOpenExportModal,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const systemActions = [
    {
      id: 'act-undo',
      title: 'Son Yapılan İşlemi Geri Al (Undo)',
      category: 'Düzen',
      icon: <Undo2 className="w-4 h-4 text-amber-400" />,
      run: () => onUndo(),
    },
    {
      id: 'tab-cal',
      title: 'Takvim & Günlük Programı Aç (Günü Büyüt / Çizelge)',
      category: 'Gezinme',
      icon: <Calendar className="w-4 h-4 text-sky-400" />,
      run: () => onSelectTab('calendar'),
    },
    {
      id: 'tab-students',
      title: 'Öğrenci Listesi & Birebir Profilleri Aç',
      category: 'Gezinme',
      icon: <Users className="w-4 h-4 text-emerald-400" />,
      run: () => onSelectTab('students'),
    },
    {
      id: 'tab-scores',
      title: 'Öğrenci Sınav & Test Sonuçları Merkezini Aç',
      category: 'Gezinme',
      icon: <Award className="w-4 h-4 text-purple-400" />,
      run: () => onSelectTab('scores'),
    },
    {
      id: 'tab-analytics',
      title: 'Gelir, Süre ve Ders İstatistiklerini Aç (Gün/Ay/Yıl)',
      category: 'Gezinme',
      icon: <DollarSign className="w-4 h-4 text-emerald-400" />,
      run: () => onSelectTab('analytics'),
    },
    {
      id: 'act-new-class',
      title: 'Yeni Özel Ders Planla',
      category: 'Dersler',
      icon: <Plus className="w-4 h-4 text-sky-400" />,
      run: () => onOpenNewClass(),
    },
    {
      id: 'act-new-student',
      title: 'Rehbere Yeni Öğrenci Kaydet',
      category: 'Öğrenciler',
      icon: <Plus className="w-4 h-4 text-emerald-400" />,
      run: () => onOpenNewStudent(),
    },
    {
      id: 'act-download-launcher',
      title: 'Masaüstü .exe / .bat Başlatıcı Dosyasını İndir',
      category: 'Masaüstü',
      icon: <Download className="w-4 h-4 text-emerald-400" />,
      run: () => onOpenLauncherDownload(),
    },
    {
      id: 'act-export-json',
      title: 'Tüm Ders & Öğrenci Veritabanını İndir (.json)',
      category: 'Yedekleme',
      icon: <Download className="w-4 h-4 text-slate-400" />,
      run: () => onOpenExportModal(),
    },
  ];

  const studentActions = students.map((s) => ({
    id: `student-${s.id}`,
    title: `${s.name} — ${s.subject} (${s.gradeLevel})`,
    category: 'Öğrenciler',
    icon: (
      <span
        className="w-3.5 h-3.5 rounded-full shrink-0"
        style={{ backgroundColor: s.color }}
      />
    ),
    run: () => {
      onSelectStudent(s.id);
      onSelectTab('students');
    },
  }));

  const allActions = [...systemActions, ...studentActions];

  const filtered = query.trim()
    ? allActions.filter((a) =>
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.category.toLowerCase().includes(query.toLowerCase())
      )
    : allActions;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].run();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-start justify-center pt-20 px-4 z-50 select-none animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-850">
          <Search className="w-4 h-4 text-sky-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Komut veya öğrenci ara... (Örn: geri al, matematik, yeni ders)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm text-slate-100 focus:outline-none placeholder-slate-500"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Eşleşen komut veya öğrenci kaydı bulunamadı.
            </div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.run();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-sky-600 text-white'
                      : 'hover:bg-slate-800/80 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {item.icon}
                    <span className="font-medium truncate">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-sky-700 text-sky-100'
                          : 'bg-slate-850 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {item.category}
                    </span>
                    <ArrowRight className="w-3 h-3 opacity-60" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between font-mono">
          <span>Seçmek için ↑↓, çalıştırmak için Enter</span>
          <span>Öğretmen Masası (.exe)</span>
        </div>
      </div>
    </div>
  );
};
