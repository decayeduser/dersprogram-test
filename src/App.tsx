/**
 * ÖğretmenMasası.exe — Öğretmen Ders Çizelgesi, Öğrenci Sınav Takibi & Finansal Gelir Defteri
 * Tamamen yerel ve çevrimdışı masaüstü motoru, 30 dakikalık sürükle-bırak yapışma ve Ctrl+Z geri alma desteği.
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Users,
  DollarSign,
  HardDrive,
  FolderOpen,
  Award,
  Undo2,
  Sparkles,
} from 'lucide-react';
import {
  Student,
  TeacherClass,
  TeacherProfile,
  ActiveTab,
} from './types';
import { syncEngine } from './utils/syncEngine';
import { sound } from './utils/soundEffects';

import { WindowTitleBar } from './components/desktop/WindowTitleBar';
import { WindowStatusBar } from './components/desktop/WindowStatusBar';
import {
  AboutModal,
  ShortcutsModal,
  LauncherDownloadModal,
  ExportBackupModal,
  ImportBackupModal,
} from './components/desktop/DesktopMenuBarModals';
import { CommandPalette } from './components/desktop/CommandPalette';
import { TeacherCalendarView } from './components/calendar/TeacherCalendarView';
import { StudentRosterView } from './components/students/StudentRosterView';
import { TestResultsHub } from './components/results/TestResultsHub';
import { FinancialAnalyticsView } from './components/analytics/FinancialAnalyticsView';

export default function App() {
  // Local Database Subscriptions & State
  const [profile, setProfile] = useState<TeacherProfile>(() => syncEngine.getProfile());
  const [students, setStudents] = useState<Student[]>(() => syncEngine.getStudents());
  const [classes, setClasses] = useState<TeacherClass[]>(() => syncEngine.getClasses());

  // Undo System State
  const [canUndo, setCanUndo] = useState<boolean>(() => syncEngine.canUndo());
  const [undoCount, setUndoCount] = useState<number>(() => syncEngine.getUndoStackCount());
  const [lastUndoDesc, setLastUndoDesc] = useState<string | null>(() =>
    syncEngine.getLastUndoDescription()
  );
  const [lastUndoMessage, setLastUndoMessage] = useState<string | null>(null);

  // UI Navigation & View State
  const [activeTab, setActiveTab] = useState<ActiveTab>('calendar');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isWindowedMode, setIsWindowedMode] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Modals
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isLauncherDownloadOpen, setIsLauncherDownloadOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Quick Action Triggers
  const [triggerNewClass, setTriggerNewClass] = useState(false);
  const [triggerNewStudent, setTriggerNewStudent] = useState(false);

  // Subscribe to LocalOfflineEngine updates
  useEffect(() => {
    const unsubscribe = syncEngine.subscribe(() => {
      setProfile({ ...syncEngine.getProfile() });
      setStudents([...syncEngine.getStudents()]);
      setClasses([...syncEngine.getClasses()]);
      setCanUndo(syncEngine.canUndo());
      setUndoCount(syncEngine.getUndoStackCount());
      setLastUndoDesc(syncEngine.getLastUndoDescription());
      if (syncEngine.lastUndoMessage) {
        setLastUndoMessage(syncEngine.lastUndoMessage);
        const timer = setTimeout(() => setLastUndoMessage(null), 3000);
        return () => clearTimeout(timer);
      }
    });
    return unsubscribe;
  }, []);

  // UNDO Action Handler (Ctrl+Z)
  const handleUndo = () => {
    const desc = syncEngine.undo();
    if (desc) {
      sound.playTaskComplete();
      setLastUndoMessage(`Geri alındı: ${desc}`);
      setTimeout(() => setLastUndoMessage(null), 3000);
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || tag === 'select';

      // Global Undo (Ctrl+Z / Cmd+Z)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setActiveTab('calendar');
        setTriggerNewClass(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        setActiveTab('students');
        setTriggerNewStudent(true);
      } else if (!isInput) {
        if (e.key === '1') setActiveTab('calendar');
        if (e.key === '2') setActiveTab('students');
        if (e.key === '3') setActiveTab('scores');
        if (e.key === '4') setActiveTab('analytics');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResetData = () => {
    if (window.confirm('Yerel veritabanı örnek öğretmen ders ve öğrenci kayıtlarına sıfırlansın mı?')) {
      syncEngine.resetToSampleData();
    }
  };

  // Class Actions
  const handleAddClass = (classData: Omit<TeacherClass, 'id'>) => {
    syncEngine.addClass(classData);
  };

  const handleAddRecurringClasses = (
    classData: Omit<TeacherClass, 'id'>,
    weeksCount: number,
    modifyPast: boolean
  ) => {
    syncEngine.addClassWithRecurringWeeks(classData, weeksCount, modifyPast);
  };

  const handleMoveClass = (
    id: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string
  ) => {
    syncEngine.moveClass(id, newDate, newStartTime, newEndTime);
  };

  const handleUpdateClass = (id: string, updates: Partial<TeacherClass>) => {
    syncEngine.updateClass(id, updates);
  };

  const handleDeleteClass = (id: string) => {
    syncEngine.deleteClass(id);
  };

  const handleBatchUpdateClasses = (
    classIds: string[],
    updates: Partial<TeacherClass>,
    propagateToSeries: boolean
  ) => {
    syncEngine.batchUpdateClasses(classIds, updates, propagateToSeries);
  };

  // Student Actions
  const handleAddStudent = (studentData: Omit<Student, 'id' | 'joinedDate'>) => {
    syncEngine.addStudent(studentData);
  };

  const handleUpdateStudent = (id: string, updates: Partial<Student>) => {
    syncEngine.updateStudent(id, updates);
  };

  const handleDeleteStudent = (id: string) => {
    syncEngine.deleteStudent(id);
    if (selectedStudentId === id) {
      setSelectedStudentId(null);
    }
  };

  // Month Earnings calculation for status bar
  const currentMonthStr = `${new Date().getFullYear()}-${(new Date().getMonth() + 1)
    .toString()
    .padStart(2, '0')}`;
  const monthEarnings = classes
    .filter((c) => c.date.startsWith(currentMonthStr))
    .reduce((sum, c) => sum + c.totalEarnings, 0);

  const storageUsageBytes = syncEngine.getStorageUsageBytes();

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans">
      {/* Minimized Window State */}
      {isMinimized ? (
        <div className="m-auto text-center space-y-4 p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-sm">
          <img
            src="/src/assets/images/desktop_app_icon_1792329731004.jpg"
            alt="Öğretmen Masası Logo"
            className="w-16 h-16 mx-auto rounded-xl ring-2 ring-sky-500/40"
          />
          <div>
            <h3 className="text-base font-bold text-white">ÖğretmenMasası.exe Küçültüldü</h3>
            <p className="text-xs text-slate-400 mt-1">
              Arka plan iş parçacığı aktif; yerel ders defteri korunuyor.
            </p>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold shadow-md transition-colors cursor-pointer"
          >
            Pencereyi Geri Yükle
          </button>
        </div>
      ) : (
        /* Executable Window Frame Container */
        <div
          className={`flex flex-col h-full w-full transition-all duration-200 ${
            isWindowedMode
              ? 'p-3 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 items-center justify-center'
              : ''
          }`}
        >
          <div
            className={`flex flex-col bg-slate-900 overflow-hidden shadow-2xl transition-all duration-200 ${
              isWindowedMode
                ? 'w-full max-w-[1440px] h-[92vh] rounded-xl border border-slate-700/80 ring-1 ring-white/10'
                : 'w-full h-full'
            }`}
          >
            {/* 1. Native Windows Desktop Title Bar (with Undo & Local status) */}
            <WindowTitleBar
              canUndo={canUndo}
              undoCount={undoCount}
              lastUndoDesc={lastUndoDesc}
              onUndo={handleUndo}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              onOpenNewClass={() => {
                setActiveTab('calendar');
                setTriggerNewClass(true);
              }}
              onOpenNewStudent={() => {
                setActiveTab('students');
                setTriggerNewStudent(true);
              }}
              onOpenAbout={() => setIsAboutOpen(true)}
              onOpenShortcuts={() => setIsShortcutsOpen(true)}
              onOpenExportModal={() => setIsExportOpen(true)}
              onOpenImportModal={() => setIsImportOpen(true)}
              onOpenLauncherDownload={() => setIsLauncherDownloadOpen(true)}
              onResetData={handleResetData}
              onSelectTab={setActiveTab}
              isWindowedMode={isWindowedMode}
              onToggleWindowedMode={() => setIsWindowedMode(!isWindowedMode)}
              onMinimizeWindow={() => setIsMinimized(true)}
            />

            {/* 2. Workspace Body: Left Sidebar + Main Content Viewport */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Sidebar Navigation (250px) */}
              <aside className="w-60 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between select-none shrink-0 text-xs">
                {/* Top Section: App Header (No teacher card) & Primary Nav */}
                <div className="p-3 space-y-4">
                  {/* Clean App Header (Teacher avatar/card completely removed) */}
                  <div className="p-3 bg-gradient-to-r from-sky-950/50 via-slate-850 to-slate-850 border border-slate-800 rounded-lg">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-600/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold text-xs shadow-inner">
                        ÖM
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-100 text-xs tracking-tight truncate flex items-center gap-1.5">
                          <span>Öğretmen Masası</span>
                          <span className="text-[10px] text-sky-400 font-mono bg-sky-950 px-1 py-0.2 rounded border border-sky-800">
                            .exe
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          Ders & Sınav Takip Sistemi
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-slate-800/80 font-mono text-[10px]">
                      <div>
                        <span className="text-slate-500 block uppercase">ÖĞRENCİ</span>
                        <span className="text-slate-200 font-semibold">{students.length} Kayıtlı</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase">ÜCRET TÜRÜ</span>
                        <span className="text-emerald-400 font-semibold">Ders Başı (₺)</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Navigation Menu */}
                  <nav className="space-y-1">
                    <button
                      onClick={() => setActiveTab('calendar')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md font-medium transition-colors cursor-pointer ${
                        activeTab === 'calendar'
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Takvim & Gün Planı</span>
                      </div>
                      <span className="text-[10px] font-mono opacity-60">1</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('students')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md font-medium transition-colors cursor-pointer ${
                        activeTab === 'students'
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4" />
                        <span>Öğrenciler & Profiller</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
                          {students.length}
                        </span>
                        <span className="text-[10px] font-mono opacity-60">2</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('scores')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md font-medium transition-colors cursor-pointer ${
                        activeTab === 'scores'
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Award className="w-4 h-4 text-purple-400" />
                        <span>Sınav & Deneme Sonuçları</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded-full bg-purple-950/80 text-purple-300 text-[10px] font-mono border border-purple-800/50">
                          {classes.filter((c) => c.score !== undefined).length}
                        </span>
                        <span className="text-[10px] font-mono opacity-60">3</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('analytics')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md font-medium transition-colors cursor-pointer ${
                        activeTab === 'analytics'
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <DollarSign className="w-4 h-4" />
                        <span>Gelir & Finansal Analiz</span>
                      </div>
                      <span className="text-[10px] font-mono opacity-60">4</span>
                    </button>
                  </nav>

                  {/* Quick Student Directory in Sidebar */}
                  <div className="pt-3 border-t border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
                        ÖĞRENCİLER ({students.length})
                      </span>
                      <button
                        onClick={() => {
                          setActiveTab('students');
                          setSelectedStudentId(null);
                        }}
                        className="text-[10px] text-sky-400 hover:text-sky-300 cursor-pointer"
                      >
                        Tümü
                      </button>
                    </div>

                    <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                      {students.map((student) => (
                        <div
                          key={student.id}
                          onClick={() => {
                            setSelectedStudentId(student.id);
                            setActiveTab('students');
                          }}
                          className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                            selectedStudentId === student.id && activeTab === 'students'
                              ? 'bg-sky-950/60 text-white border border-sky-600/60'
                              : 'hover:bg-slate-800/80 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: student.color }}
                            />
                            <span className="truncate text-xs font-medium">{student.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 shrink-0">
                            ₺{student.defaultClassFee}/ders
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Quick Tools & Desktop Launcher (No cloud saving or sync) */}
                <div className="p-3 border-t border-slate-800 space-y-2 bg-slate-900/60">
                  {/* Snapping & Undo Quick Panel */}
                  <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold flex items-center gap-1.5">
                        <HardDrive className="w-3 h-3" />
                        <span>Yerel Depo Aktif</span>
                      </span>

                      <button
                        onClick={handleUndo}
                        disabled={!canUndo}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                          canUndo
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 cursor-pointer'
                            : 'bg-slate-800 text-slate-500 border-slate-700 opacity-60 cursor-not-allowed'
                        }`}
                        title="Son yapılan işlemi geri al"
                      >
                        <Undo2 className="w-2.5 h-2.5" />
                        <span>Geri Al</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-tight">
                      Dersleri çizelgede sürükleyin; 30 dakikalık aralıklara (:00, :30) kendiliğinden kilitlenir.
                    </p>
                  </div>

                  {/* Desktop Runner Shortcut */}
                  <button
                    onClick={() => setIsLauncherDownloadOpen(true)}
                    className="w-full py-1.5 px-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded flex items-center justify-center gap-1.5 border border-slate-750 text-[11px] transition-colors cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Yerel .exe Olarak Çalıştır</span>
                  </button>
                </div>
              </aside>

              {/* Main Content Viewport */}
              <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-900">
                {activeTab === 'calendar' && (
                  <TeacherCalendarView
                    classes={classes}
                    students={students}
                    onAddClass={handleAddClass}
                    onAddRecurringClasses={handleAddRecurringClasses}
                    onMoveClass={handleMoveClass}
                    onUpdateClass={handleUpdateClass}
                    onDeleteClass={handleDeleteClass}
                    onBatchUpdateClasses={handleBatchUpdateClasses}
                    onSelectStudent={(studentId) => {
                      setSelectedStudentId(studentId);
                      setActiveTab('students');
                    }}
                    canUndo={canUndo}
                    onUndo={handleUndo}
                    lastUndoMessage={lastUndoMessage}
                  />
                )}

                {activeTab === 'students' && (
                  <StudentRosterView
                    students={students}
                    classes={classes}
                    selectedStudentId={selectedStudentId}
                    onSelectStudentId={setSelectedStudentId}
                    onAddStudent={handleAddStudent}
                    onUpdateStudent={handleUpdateStudent}
                    onDeleteStudent={handleDeleteStudent}
                    onUpdateClass={handleUpdateClass}
                    onAddClassForStudent={() => {
                      setActiveTab('calendar');
                    }}
                  />
                )}

                {activeTab === 'scores' && (
                  <TestResultsHub
                    classes={classes}
                    students={students}
                    onUpdateClass={handleUpdateClass}
                    onSelectStudent={(studentId) => {
                      setSelectedStudentId(studentId);
                      setActiveTab('students');
                    }}
                  />
                )}

                {activeTab === 'analytics' && (
                  <FinancialAnalyticsView
                    classes={classes}
                    students={students}
                    onSelectStudent={(studentId) => {
                      setSelectedStudentId(studentId);
                      setActiveTab('students');
                    }}
                  />
                )}
              </main>
            </div>

            {/* 3. Window Status Bar (No cloud sync) */}
            <WindowStatusBar
              storageUsageBytes={storageUsageBytes}
              totalStudentsCount={students.length}
              totalClassesCount={classes.length}
              monthEarnings={monthEarnings}
              canUndo={canUndo}
              onUndo={handleUndo}
              onOpenAnalytics={() => setActiveTab('analytics')}
            />
          </div>
        </div>
      )}

      {/* Global Desktop Modals (No SyncCenter modal) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        students={students}
        classes={classes}
        onSelectTab={setActiveTab}
        onSelectStudent={setSelectedStudentId}
        onOpenNewClass={() => {
          setActiveTab('calendar');
        }}
        onOpenNewStudent={() => {
          setActiveTab('students');
        }}
        onUndo={handleUndo}
        onOpenLauncherDownload={() => setIsLauncherDownloadOpen(true)}
        onOpenExportModal={() => setIsExportOpen(true)}
      />

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
      <LauncherDownloadModal
        isOpen={isLauncherDownloadOpen}
        onClose={() => setIsLauncherDownloadOpen(false)}
      />
      <ExportBackupModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <ImportBackupModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={() => {
          sound.playTaskComplete();
        }}
      />
    </div>
  );
}
