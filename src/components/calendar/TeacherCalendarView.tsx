import React, { useState, useMemo, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Filter,
  Edit2,
  Trash2,
  Repeat,
  ZoomIn,
  ArrowLeft,
  GripVertical,
  Undo2,
  Award,
  Sparkles,
  Check,
} from 'lucide-react';
import { TeacherClass, Student } from '../../types';
import { sound } from '../../utils/soundEffects';
import { AnimatedCounter } from '../common/AnimatedCounter';

interface TeacherCalendarViewProps {
  classes: TeacherClass[];
  students: Student[];
  onAddClass: (classData: Omit<TeacherClass, 'id'>) => void;
  onAddRecurringClasses: (
    classData: Omit<TeacherClass, 'id'>,
    weeksCount: number,
    modifyPast: boolean
  ) => void;
  onMoveClass: (
    id: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string
  ) => void;
  onUpdateClass: (id: string, updates: Partial<TeacherClass>) => void;
  onDeleteClass: (id: string) => void;
  onBatchUpdateClasses: (
    classIds: string[],
    updates: Partial<TeacherClass>,
    propagateToSeries: boolean
  ) => void;
  onSelectStudent: (studentId: string) => void;
  canUndo: boolean;
  onUndo: () => void;
  lastUndoMessage: string | null;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 to 21:00
const TURKISH_DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const TURKISH_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

interface DragSnapState {
  classId: string;
  studentName: string;
  subject: string;
  color: string;
  durationMinutes: number;
  targetDateStr: string;
  targetStartTime: string;
  targetEndTime: string;
  topPx: number;
  heightPx: number;
}

export const TeacherCalendarView: React.FC<TeacherCalendarViewProps> = ({
  classes,
  students,
  onAddClass,
  onAddRecurringClasses,
  onMoveClass,
  onUpdateClass,
  onDeleteClass,
  onBatchUpdateClasses,
  onSelectStudent,
  canUndo,
  onUndo,
  lastUndoMessage,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDayDateStr, setSelectedDayDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('all');
  const [viewFormat, setViewFormat] = useState<'week' | 'month' | 'dayZoom'>('week');

  // Modals & Mass Edit
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<TeacherClass | null>(null);
  const [isMassEditModalOpen, setIsMassEditModalOpen] = useState(false);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  // Add/Edit Form State
  const [formStudentId, setFormStudentId] = useState<string>(students[0]?.id || '');
  const [formSubject, setFormSubject] = useState<string>('AYT Matematik');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formStartTime, setFormStartTime] = useState<string>('14:00');
  const [formEndTime, setFormEndTime] = useState<string>('15:30');
  const [formClassFee, setFormClassFee] = useState<number>(850);
  const [formScore, setFormScore] = useState<number | undefined>(undefined);
  const [formScoreLabel, setFormScoreLabel] = useState<string>('');

  // Recurring options: "add classes for all weeks after, don't change past but user can change it"
  const [formIsRecurring, setFormIsRecurring] = useState<boolean>(true);
  const [formRecurringWeeks, setFormRecurringWeeks] = useState<number>(8); // 8 weeks default
  const [formPreservePast, setFormPreservePast] = useState<boolean>(true); // don't change past, but user can change

  // Mass Edit Fields (Class Fee only)
  const [massClassFee, setMassClassFee] = useState<number | ''>('');
  const [massPropagateSeries, setMassPropagateSeries] = useState<boolean>(true);

  // Drag & Drop Snapping State
  const [dragSnap, setDragSnap] = useState<DragSnapState | null>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Calculate Monday of current week
  const currentWeekStart = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }, [currentDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentWeekStart]);

  const filteredClasses = useMemo(() => {
    if (selectedStudentFilter === 'all') return classes;
    return classes.filter((c) => c.studentId === selectedStudentFilter);
  }, [classes, selectedStudentFilter]);

  // Selected Day's Classes
  const selectedDayClasses = useMemo(() => {
    return filteredClasses.filter((c) => c.date === selectedDayDateStr);
  }, [filteredClasses, selectedDayDateStr]);

  // Day Summary Metrics (Paid per class)
  const dayTotalEarnings = useMemo(() => {
    return selectedDayClasses.reduce((sum, c) => sum + c.totalEarnings, 0);
  }, [selectedDayClasses]);

  const dayTotalMinutes = useMemo(() => {
    return selectedDayClasses.reduce((sum, c) => sum + c.durationMinutes, 0);
  }, [selectedDayClasses]);

  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewFormat === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (viewFormat === 'dayZoom') {
      next.setDate(next.getDate() - 1);
      setSelectedDayDateStr(next.toISOString().split('T')[0]);
    } else {
      next.setDate(next.getDate() - 7);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewFormat === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (viewFormat === 'dayZoom') {
      next.setDate(next.getDate() + 1);
      setSelectedDayDateStr(next.toISOString().split('T')[0]);
    } else {
      next.setDate(next.getDate() + 7);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDayDateStr(now.toISOString().split('T')[0]);
  };

  // ZOOM INTO DAY
  const handleDayClickZoom = (dateStr: string) => {
    setSelectedDayDateStr(dateStr);
    setCurrentDate(new Date(dateStr + 'T00:00:00'));
    setViewFormat('dayZoom');
    sound.playTaskComplete();
  };

  const handleOpenAddModal = (dateStr?: string) => {
    setEditingClass(null);
    const targetDate = dateStr || selectedDayDateStr;
    setFormDate(targetDate);
    const stud = students[0];
    setFormStudentId(stud?.id || '');
    setFormSubject(stud?.subject || 'Matematik');
    setFormClassFee(stud?.defaultClassFee || 850);
    setFormStartTime('14:00');
    setFormEndTime('15:30');
    setFormScore(undefined);
    setFormScoreLabel('');
    setFormIsRecurring(true);
    setFormRecurringWeeks(8);
    setFormPreservePast(true);
    setIsAddClassModalOpen(true);
  };

  const handleOpenEditModal = (cls: TeacherClass) => {
    setEditingClass(cls);
    setFormStudentId(cls.studentId);
    setFormSubject(cls.subject);
    setFormDate(cls.date);
    setFormStartTime(cls.startTime);
    setFormEndTime(cls.endTime);
    setFormClassFee(cls.classFee);
    setFormScore(cls.score);
    setFormScoreLabel(cls.scoreLabel || '');
    setFormIsRecurring(false);
    setIsAddClassModalOpen(true);
  };

  const calculateDuration = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const mins = endH * 60 + endM - (startH * 60 + startM);
    return Math.max(30, mins);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === formStudentId);
    const studentName = student ? student.name : 'Öğrenci';
    const durationMinutes = calculateDuration(formStartTime, formEndTime);

    if (editingClass) {
      onUpdateClass(editingClass.id, {
        studentId: formStudentId,
        studentName,
        subject: formSubject,
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        durationMinutes,
        classFee: formClassFee,
        totalEarnings: formClassFee,
        score: formScore !== undefined && !isNaN(formScore) ? Number(formScore) : undefined,
        scoreLabel: formScoreLabel.trim() || undefined,
      });
      sound.playTaskComplete();
    } else {
      const classData: Omit<TeacherClass, 'id'> = {
        studentId: formStudentId,
        studentName,
        subject: formSubject,
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        durationMinutes,
        classFee: formClassFee,
        totalEarnings: formClassFee,
        score: formScore !== undefined && !isNaN(formScore) ? Number(formScore) : undefined,
        scoreLabel: formScoreLabel.trim() || undefined,
      };

      if (formIsRecurring && formRecurringWeeks > 0) {
        onAddRecurringClasses(classData, formRecurringWeeks, !formPreservePast);
      } else {
        onAddClass(classData);
      }
      sound.playTaskComplete();
    }

    setIsAddClassModalOpen(false);
  };

  // Mass Edit Handlers
  const toggleSelectClass = (id: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllDayClasses = () => {
    const dayIds = selectedDayClasses.map((c) => c.id);
    const allSelected = dayIds.every((id) => selectedClassIds.includes(id));
    if (allSelected) {
      setSelectedClassIds((prev) => prev.filter((id) => !dayIds.includes(id)));
    } else {
      setSelectedClassIds((prev) => Array.from(new Set([...prev, ...dayIds])));
    }
  };

  const handleExecuteMassEdit = () => {
    if (selectedClassIds.length === 0) return;

    const updates: Partial<TeacherClass> = {};
    if (massClassFee !== '') {
      updates.classFee = Number(massClassFee);
      updates.totalEarnings = Number(massClassFee);
    }

    onBatchUpdateClasses(selectedClassIds, updates, massPropagateSeries);
    sound.playTaskComplete();
    setIsMassEditModalOpen(false);
    setSelectedClassIds([]);
    setMassClassFee('');
  };

  const getStudentColor = (studentId: string) => {
    return students.find((s) => s.id === studentId)?.color || '#3B82F6';
  };

  // ==========================================
  // DRAG & DROP WITH 30-MINUTE SNAPPING (:00, :30)
  // ==========================================
  const handleDragStart = (e: React.DragEvent, cls: TeacherClass) => {
    e.dataTransfer.setData('text/plain', cls.id);
    e.dataTransfer.effectAllowed = 'move';
    const studentColor = getStudentColor(cls.studentId);

    setDragSnap({
      classId: cls.id,
      studentName: cls.studentName,
      subject: cls.subject,
      color: studentColor,
      durationMinutes: cls.durationMinutes,
      targetDateStr: cls.date,
      targetStartTime: cls.startTime,
      targetEndTime: cls.endTime,
      topPx: ((parseInt(cls.startTime.split(':')[0]) - 8) * 60 + parseInt(cls.startTime.split(':')[1])) / 60 * 56,
      heightPx: (cls.durationMinutes / 60) * 56,
    });
  };

  const handleColumnDragOver = (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (!dragSnap) return;

    const columnRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetY = e.clientY - columnRect.top;

    // Calculate minutes from 8:00
    const rawMinutes = (offsetY / 56) * 60;
    // SNAP TO STRICT 30-MINUTE INTERVALS (:00, :30)
    const snappedMinutes = Math.max(0, Math.min(810, Math.round(rawMinutes / 30) * 30));

    const snapH = 8 + Math.floor(snappedMinutes / 60);
    const snapM = snappedMinutes % 60 === 0 ? '00' : '30';
    const targetStartTime = `${String(snapH).padStart(2, '0')}:${snapM}`;

    // End time keeping duration
    const endTotalMinutes = snappedMinutes + dragSnap.durationMinutes;
    const endH = 8 + Math.floor(endTotalMinutes / 60);
    const endM = endTotalMinutes % 60 === 0 ? '00' : '30';
    const targetEndTime = `${String(endH).padStart(2, '0')}:${endM}`;

    const topPx = (snappedMinutes / 60) * 56;
    const heightPx = (dragSnap.durationMinutes / 60) * 56;

    if (
      dragSnap.targetDateStr !== targetDateStr ||
      dragSnap.targetStartTime !== targetStartTime
    ) {
      setDragSnap((prev) =>
        prev
          ? {
              ...prev,
              targetDateStr,
              targetStartTime,
              targetEndTime,
              topPx,
              heightPx,
            }
          : null
      );
    }
  };

  const handleColumnDrop = (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    if (!dragSnap) return;

    onMoveClass(
      dragSnap.classId,
      dragSnap.targetDateStr,
      dragSnap.targetStartTime,
      dragSnap.targetEndTime
    );

    sound.playTaskComplete();
    setDragSnap(null);
  };

  const handleDragEnd = () => {
    setDragSnap(null);
  };

  // Month grid days
  const monthGridDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];
    const prevMonthDays = new Date(year, month, 0).getDate();

    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        date: d,
        dateStr: d.toISOString().split('T')[0],
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        dateStr: d.toISOString().split('T')[0],
        isCurrentMonth: true,
      });
    }

    const remaining = 35 - (days.length % 35);
    if (remaining < 7 && remaining > 0) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        days.push({
          date: d,
          dateStr: d.toISOString().split('T')[0],
          isCurrentMonth: false,
        });
      }
    }

    return days;
  }, [currentDate]);

  return (
    <div className="flex h-full bg-slate-900 overflow-hidden divide-x divide-slate-800 relative">
      {/* Undo Notification Floating Toast */}
      {lastUndoMessage && (
        <div className="absolute top-14 right-8 z-40 bg-slate-850/95 border border-amber-500/50 shadow-2xl rounded-xl px-4 py-2.5 flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-top-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="text-xs font-medium text-slate-200">{lastUndoMessage}</span>
          {canUndo && (
            <button
              onClick={onUndo}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-xs"
            >
              <Undo2 className="w-3 h-3" />
              <span>Geri Al</span>
            </button>
          )}
        </div>
      )}

      {/* MAIN VIEW CANVAS */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Control Bar */}
        <div className="px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            {viewFormat === 'dayZoom' && (
              <button
                onClick={() => setViewFormat('week')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-sky-400 hover:text-sky-300 rounded text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Haftalık Görünüme Dön</span>
              </button>
            )}

            <div className="flex items-center bg-slate-800 rounded-md p-0.5 border border-slate-700">
              <button
                onClick={handlePrev}
                className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors"
                title="Önceki"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              >
                Bugün
              </button>
              <button
                onClick={handleNext}
                className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors"
                title="Sonraki"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-sky-400" />
              <span>
                {viewFormat === 'dayZoom'
                  ? `${new Date(selectedDayDateStr + 'T00:00:00').toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      weekday: 'long',
                    })} (Yakınlaştırılmış Gün)`
                  : viewFormat === 'month'
                  ? `${TURKISH_MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                  : `${weekDays[0].getDate()} ${
                      TURKISH_MONTHS[weekDays[0].getMonth()]
                    } – ${weekDays[6].getDate()} ${
                      TURKISH_MONTHS[weekDays[6].getMonth()]
                    } ${weekDays[6].getFullYear()}`}
              </span>
            </h2>

            {/* Quick 30-min Snapping Hint */}
            <span className="hidden xl:inline text-[11px] font-mono text-emerald-400/90 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
              🎯 30 dk Yapışma Aktif (:00 & :30)
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5 text-xs">
            {/* Student Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedStudentFilter}
                onChange={(e) => setSelectedStudentFilter(e.target.value)}
                className="bg-slate-850 border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="all">Tüm Öğrenciler ({students.length})</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.subject})
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Segmented Control */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-md border border-slate-700 text-xs">
              <button
                onClick={() => setViewFormat('week')}
                className={`px-3 py-1 font-medium rounded transition-colors ${
                  viewFormat === 'week'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Haftalık Çizelge
              </button>
              <button
                onClick={() => setViewFormat('month')}
                className={`px-3 py-1 font-medium rounded transition-colors ${
                  viewFormat === 'month'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Aylık Takvim
              </button>
              <button
                onClick={() => setViewFormat('dayZoom')}
                className={`px-3 py-1 font-medium rounded flex items-center gap-1 transition-colors ${
                  viewFormat === 'dayZoom'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ZoomIn className="w-3 h-3" />
                <span>Günü Büyüt</span>
              </button>
            </div>

            {/* Mass Edit Trigger */}
            {selectedClassIds.length > 0 && (
              <button
                onClick={() => setIsMassEditModalOpen(true)}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs animate-pulse"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>Toplu Ücret Düzenle ({selectedClassIds.length} Ders)</span>
              </button>
            )}

            {/* Add Class */}
            <button
              onClick={() => handleOpenAddModal()}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ders Ekle</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: DAY ZOOM-IN FULL IMMERSIVE VIEW */}
        {viewFormat === 'dayZoom' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900 animate-fadeIn">
            {/* Zoomed Day Hero Banner */}
            <div className="bg-gradient-to-r from-slate-850 via-slate-850 to-sky-950/40 border border-slate-750 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase bg-sky-900/60 text-sky-300 border border-sky-700/60 px-2 py-0.5 rounded font-semibold tracking-wider flex items-center gap-1">
                    <ZoomIn className="w-3 h-3 text-sky-400" />
                    <span>YAKINLAŞTIRILMIŞ GÜN ODAĞI</span>
                  </span>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => setViewFormat('week')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded text-[11px] font-medium flex items-center gap-1 transition-colors border border-slate-700"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Haftalık Çizelgeye Dön</span>
                    </button>
                    <button
                      onClick={() => setViewFormat('month')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-medium transition-colors border border-slate-700"
                    >
                      Aylık Takvime Dön
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handlePrev}
                    className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700"
                    title="Önceki Gün"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <h2 className="text-xl font-bold text-white">
                    {new Date(selectedDayDateStr + 'T00:00:00').toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      weekday: 'long',
                    })}
                  </h2>

                  <button
                    onClick={handleNext}
                    className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700"
                    title="Sonraki Gün"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-400">
                  Öğretmen ders başı sabit ücretlendirilir. Günün derslerini ve sınav notlarını doğrudan yönetebilirsiniz.
                </p>
              </div>

              {/* Day Metrics Strip with Animated Counters */}
              <div className="flex items-center gap-3">
                <div className="bg-slate-900/90 border border-slate-750 px-4 py-2.5 rounded-xl font-mono text-center">
                  <span className="text-[10px] text-slate-400 block uppercase">GÜNLÜK TOPLAM KAZANÇ</span>
                  <div className="text-xl font-bold text-emerald-400">
                    <AnimatedCounter value={dayTotalEarnings} prefix="₺" />
                  </div>
                </div>
                <div className="bg-slate-900/90 border border-slate-750 px-4 py-2.5 rounded-xl font-mono text-center">
                  <span className="text-[10px] text-slate-400 block uppercase">DERS SAYISI / SÜRE</span>
                  <div className="text-xl font-bold text-sky-400">
                    <AnimatedCounter value={selectedDayClasses.length} suffix=" ders" />{' '}
                    <span className="text-xs text-slate-400 font-sans">
                      ({(dayTotalMinutes / 60).toFixed(1)} sa)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenAddModal(selectedDayDateStr)}
                  className="px-4 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Bu Güne Ders Ekle</span>
                </button>
              </div>
            </div>

            {/* Zoomed Day Classes Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200">
                  Bugün Verilen Dersler ({selectedDayClasses.length})
                </span>
                {selectedDayClasses.length > 0 && (
                  <button
                    onClick={selectAllDayClasses}
                    className="hover:text-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    <span>
                      {selectedDayClasses.every((c) => selectedClassIds.includes(c.id))
                        ? 'Seçimleri Kaldır'
                        : 'Tümünü Seç (Toplu Ücret Güncelle)'}
                    </span>
                  </button>
                )}
              </div>

              {selectedDayClasses.length === 0 ? (
                <div className="py-16 text-center text-slate-500 bg-slate-850/50 border border-dashed border-slate-800 rounded-2xl space-y-3">
                  <CalendarIcon className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm">Bu tarihe planlanmış herhangi bir özel ders bulunmuyor.</p>
                  <button
                    onClick={() => handleOpenAddModal(selectedDayDateStr)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                  >
                    + Bu Güne Ders Planla
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedDayClasses.map((cls) => {
                    const studentColor = getStudentColor(cls.studentId);
                    const isSelected = selectedClassIds.includes(cls.id);

                    return (
                      <div
                        key={cls.id}
                        className={`bg-slate-850 border rounded-xl p-5 space-y-4 transition-all shadow-md ${
                          isSelected
                            ? 'border-amber-500 ring-2 ring-amber-500/40'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Header: Student, Selection, Actions */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectClass(cls.id)}
                              className="mt-1 rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full shrink-0"
                                  style={{ backgroundColor: studentColor }}
                                />
                                <button
                                  onClick={() => onSelectStudent(cls.studentId)}
                                  className="font-bold text-white text-sm hover:text-sky-400 hover:underline truncate text-left"
                                >
                                  {cls.studentName}
                                </button>
                              </div>
                              <span className="text-xs text-sky-400 block truncate mt-0.5">
                                {cls.subject}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleOpenEditModal(cls)}
                              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                              title="Dersi Düzenle"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteClass(cls.id)}
                              className="p-1.5 hover:bg-rose-900/40 text-slate-500 hover:text-rose-400 rounded transition-colors"
                              title="Dersi Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Financial Card (Pay per class only, no paid/unpaid) */}
                        <div className="bg-slate-900/90 border border-slate-750 p-3 rounded-lg grid grid-cols-2 gap-3 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block">SAAT & SÜRE</span>
                            <span className="text-slate-200 font-semibold">
                              {cls.startTime} - {cls.endTime} ({cls.durationMinutes} dk)
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block">DERS BAŞI ÜCRET</span>
                            <span className="text-emerald-400 font-bold text-sm">
                              ₺{cls.classFee.toLocaleString('tr-TR')} / ders
                            </span>
                          </div>
                        </div>

                        {/* Test / Exam Score Card */}
                        <div className="pt-2 border-t border-slate-800">
                          {cls.score !== undefined ? (
                            <div className="bg-purple-950/30 border border-purple-800/40 p-3 rounded-lg flex items-center justify-between">
                              <div className="min-w-0">
                                <span className="text-[10px] uppercase font-mono text-purple-300 font-semibold block flex items-center gap-1">
                                  <Award className="w-3.5 h-3.5" />
                                  <span>{cls.scoreLabel || 'Sınav / Test Puanı'}</span>
                                </span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-mono text-lg font-bold text-purple-400">
                                  %{cls.score}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenEditModal(cls)}
                              className="w-full text-center py-1.5 text-xs text-slate-400 hover:text-purple-300 hover:bg-slate-800/80 rounded transition-colors border border-dashed border-slate-800"
                            >
                              + Bu ders için deneme / test notu kaydet
                            </button>
                          )}
                        </div>

                        {cls.recurringSeriesId && (
                          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                            <Repeat className="w-3 h-3 text-sky-400" />
                            <span>Haftalık tekrarlanan seri dersi</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: WEEKLY TIMETABLE CANVAS WITH DRAG & 30-MIN SNAPPING */}
        {viewFormat === 'week' && (
          <div
            ref={gridContainerRef}
            className="flex-1 overflow-y-auto flex flex-col min-w-[780px] bg-slate-900 select-none relative"
            onDragEnd={handleDragEnd}
          >
            {/* Week Header Row */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-800 bg-slate-850/90 sticky top-0 z-20 shrink-0 text-xs shadow-sm">
              <div className="py-2.5 px-2 text-center text-slate-500 font-mono text-[10px] border-r border-slate-800">
                SAAT
              </div>
              {weekDays.map((d, idx) => {
                const dateStr = d.toISOString().split('T')[0];
                const isToday = d.toDateString() === new Date().toDateString();
                const isSelected = dateStr === selectedDayDateStr;
                const dayClasses = filteredClasses.filter((c) => c.date === dateStr);
                const dayEarnings = dayClasses.reduce((sum, c) => sum + c.totalEarnings, 0);

                return (
                  <div
                    key={idx}
                    onClick={() => handleDayClickZoom(dateStr)}
                    className={`py-2 px-2 text-center border-r border-slate-800 last:border-r-0 cursor-pointer transition-colors group relative ${
                      isSelected
                        ? 'bg-sky-950/40 ring-1 ring-inset ring-sky-500'
                        : isToday
                        ? 'bg-slate-850'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">
                      {TURKISH_DAYS[idx]}
                    </div>
                    <div
                      className={`text-sm font-bold inline-block px-1.5 py-0.5 rounded my-0.5 ${
                        isToday ? 'bg-sky-600 text-white' : 'text-slate-200'
                      }`}
                    >
                      {d.getDate()}
                    </div>
                    {dayClasses.length > 0 && (
                      <div className="text-[10px] font-mono font-medium text-emerald-400">
                        ₺{dayEarnings.toLocaleString('tr-TR')}
                      </div>
                    )}
                    <span className="opacity-0 group-hover:opacity-100 absolute bottom-0.5 right-1 text-[9px] text-sky-400 flex items-center gap-0.5">
                      <ZoomIn className="w-2.5 h-2.5" /> Büyüt
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Timetable Grid with 56px hour rows and 28px 30-min snapping slots */}
            <div className="relative grid grid-cols-[60px_repeat(7,1fr)] divide-x divide-slate-800 grow">
              {/* Left Hour Ruler */}
              <div className="divide-y divide-slate-800/80 bg-slate-900/60 font-mono text-[11px] text-slate-500 select-none">
                {HOURS.map((h) => (
                  <div key={h} className="h-14 pr-2 pt-1 text-right relative">
                    <span>{h}:00</span>
                    <span className="absolute right-2 top-7 text-[9px] text-slate-600 font-mono">
                      :30
                    </span>
                  </div>
                ))}
              </div>

              {/* 7 Week Day Columns (Drop targets) */}
              {weekDays.map((dayDate, dayIdx) => {
                const dateStr = dayDate.toISOString().split('T')[0];
                const dayClasses = filteredClasses.filter((c) => c.date === dateStr);
                const isSelected = dateStr === selectedDayDateStr;
                const isDragTarget = dragSnap && dragSnap.targetDateStr === dateStr;

                return (
                  <div
                    key={dayIdx}
                    onDragOver={(e) => handleColumnDragOver(e, dateStr)}
                    onDrop={(e) => handleColumnDrop(e, dateStr)}
                    onClick={() => handleDayClickZoom(dateStr)}
                    className={`relative divide-y divide-slate-800/60 h-[784px] cursor-pointer transition-colors ${
                      isSelected ? 'bg-sky-950/10' : 'hover:bg-slate-850/20'
                    } ${isDragTarget ? 'bg-sky-950/20 ring-1 ring-sky-500/40' : ''}`}
                  >
                    {/* Hour grid lines */}
                    {HOURS.map((h) => (
                      <div key={h} className="h-14 border-t border-slate-800/50 relative">
                        {/* 30-min dashed snapping guideline */}
                        <div className="absolute top-7 left-0 right-0 border-t border-slate-800/30 border-dashed" />
                      </div>
                    ))}

                    {/* Drag Snap Ghost Preview (locks on 30-min mark) */}
                    {isDragTarget && dragSnap && (
                      <div
                        style={{
                          top: `${dragSnap.topPx}px`,
                          height: `${Math.max(28, dragSnap.heightPx)}px`,
                          borderLeftColor: dragSnap.color,
                        }}
                        className="absolute left-1 right-1 rounded border-l-4 border-2 border-dashed border-sky-400 bg-sky-900/40 shadow-xl z-30 pointer-events-none p-1.5 flex flex-col justify-between animate-pulse"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs truncate">
                            {dragSnap.studentName}
                          </span>
                          <span className="text-[10px] bg-sky-500 text-white font-mono px-1 rounded font-bold">
                            30 DK KİLİTLENDİ
                          </span>
                        </div>
                        <div className="font-mono text-[10px] text-sky-200 font-semibold">
                          {dragSnap.targetStartTime} - {dragSnap.targetEndTime}
                        </div>
                      </div>
                    )}

                    {/* Classes in this Column */}
                    {dayClasses.map((cls) => {
                      const [startH, startM] = cls.startTime.split(':').map(Number);
                      const startMinutes = (startH - 8) * 60 + startM;
                      const topPx = (startMinutes / 60) * 56;
                      const heightPx = (cls.durationMinutes / 60) * 56;
                      const studentColor = getStudentColor(cls.studentId);
                      const isMultiSelected = selectedClassIds.includes(cls.id);
                      const isBeingDragged = dragSnap && dragSnap.classId === cls.id;

                      return (
                        <div
                          key={cls.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, cls)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDayClickZoom(dateStr);
                          }}
                          style={{
                            top: `${Math.max(0, topPx)}px`,
                            height: `${Math.max(28, heightPx)}px`,
                            borderLeftColor: studentColor,
                          }}
                          className={`absolute left-1 right-1 rounded p-1.5 border-l-4 bg-slate-850/95 hover:bg-slate-800 border border-slate-700 shadow-md cursor-grab active:cursor-grabbing transition-all overflow-hidden z-10 flex flex-col justify-between group ${
                            isMultiSelected ? 'ring-2 ring-amber-400' : ''
                          } ${isBeingDragged ? 'opacity-40 scale-95' : ''}`}
                          title="Sürükleyip bırakarak 30 dakikalık aralıklara kilitleyin"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-white text-xs truncate flex items-center gap-1">
                                <GripVertical className="w-3 h-3 text-slate-500 group-hover:text-sky-400 shrink-0 cursor-grab" />
                                <span className="truncate">{cls.studentName}</span>
                              </span>
                              <span className="font-mono text-[10px] text-emerald-400 font-bold shrink-0">
                                ₺{cls.classFee}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-300 truncate mt-0.5">
                              {cls.subject}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-0.5">
                            <span>
                              {cls.startTime} - {cls.endTime}
                            </span>
                            {cls.score !== undefined && (
                              <span className="px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-semibold">
                                %{cls.score}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 3: MONTH GRID */}
        {viewFormat === 'month' && (
          <div className="p-4 space-y-2 h-full flex flex-col overflow-y-auto">
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-400 py-1 bg-slate-850 rounded">
              {TURKISH_DAYS.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 grow">
              {monthGridDays.map((cell, idx) => {
                const dayClasses = filteredClasses.filter((c) => c.date === cell.dateStr);
                const dayEarnings = dayClasses.reduce((sum, c) => sum + c.totalEarnings, 0);
                const isSelected = cell.dateStr === selectedDayDateStr;
                const isToday = cell.date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={idx}
                    onClick={() => handleDayClickZoom(cell.dateStr)}
                    className={`min-h-[92px] p-1.5 rounded border flex flex-col justify-between cursor-pointer transition-colors group ${
                      isSelected
                        ? 'bg-sky-950/30 border-sky-500 ring-1 ring-sky-500'
                        : cell.isCurrentMonth
                        ? 'bg-slate-850/60 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/30 border-slate-900 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold px-1 py-0.5 rounded ${
                          isToday
                            ? 'bg-sky-600 text-white'
                            : cell.isCurrentMonth
                            ? 'text-slate-300'
                            : 'text-slate-600'
                        }`}
                      >
                        {cell.date.getDate()}
                      </span>
                      {dayClasses.length > 0 && (
                        <span className="text-[10px] font-mono font-bold text-emerald-400">
                          ₺{dayEarnings.toLocaleString('tr-TR')}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 my-1 overflow-hidden">
                      {dayClasses.slice(0, 2).map((cls) => (
                        <div
                          key={cls.id}
                          className="text-[10px] px-1 py-0.5 rounded truncate bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: getStudentColor(cls.studentId) }}
                          />
                          <span className="truncate">{cls.studentName}</span>
                        </div>
                      ))}
                      {dayClasses.length > 2 && (
                        <div className="text-[9px] text-slate-400 text-right pr-1">
                          +{dayClasses.length - 2} ders daha
                        </div>
                      )}
                    </div>

                    <div className="text-[9px] text-slate-500 text-right font-mono flex items-center justify-between">
                      <span className="text-sky-400/80 group-hover:underline text-[9px]">Günü Aç →</span>
                      <span>{dayClasses.length > 0 ? `${dayClasses.length} ders` : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD / EDIT CLASS MODAL WITH RECURRING WEEKS */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-850 border-b border-slate-700">
              <h3 className="text-sm font-semibold text-white">
                {editingClass ? 'Dersi & Sınav Notunu Yapılandır' : 'Yeni Ders Planla'}
              </h3>
              <button
                onClick={() => setIsAddClassModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Öğrenci</label>
                  <select
                    value={formStudentId}
                    onChange={(e) => {
                      setFormStudentId(e.target.value);
                      const s = students.find((item) => item.id === e.target.value);
                      if (s) {
                        setFormSubject(s.subject);
                        setFormClassFee(s.defaultClassFee);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-sky-500"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Ders / Konu</label>
                  <input
                    type="text"
                    required
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Tarih</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100 focus:outline-none focus:border-sky-500 text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Başlangıç</label>
                  <input
                    type="time"
                    step="1800"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-sky-500 text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Bitiş</label>
                  <input
                    type="time"
                    step="1800"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-sky-500 text-[11px]"
                  />
                </div>
              </div>

              {/* Ders Başı Ücret */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Ders Başı Ücret (₺ / ders):
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  required
                  value={formClassFee}
                  onChange={(e) => setFormClassFee(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-emerald-400 font-bold font-mono focus:outline-none focus:border-sky-500 text-sm"
                />
              </div>

              {/* RECURRING WEEKS SCHEDULER: Add for all weeks after, preserve past */}
              {!editingClass && (
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2.5">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-sky-300">
                    <input
                      type="checkbox"
                      checked={formIsRecurring}
                      onChange={(e) => setFormIsRecurring(e.target.checked)}
                      className="rounded border-slate-700 text-sky-500 focus:ring-0"
                    />
                    <span>Gelecek Haftalara Otomatik Ekle (Haftalık Seri)</span>
                  </label>

                  {formIsRecurring && (
                    <div className="space-y-2 pt-1 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Gelecek Kaç Hafta Boyunca?</span>
                        <select
                          value={formRecurringWeeks}
                          onChange={(e) => setFormRecurringWeeks(Number(e.target.value))}
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                        >
                          <option value={4}>4 Hafta (1 Ay)</option>
                          <option value={8}>8 Hafta (2 Ay - Önerilen)</option>
                          <option value={12}>12 Hafta (Dönem Boyu)</option>
                          <option value={16}>16 Hafta (4 Ay)</option>
                          <option value={24}>24 Hafta (Yarım Yıl)</option>
                        </select>
                      </div>

                      <label className="flex items-start gap-2 text-[11px] text-slate-400 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={formPreservePast}
                          onChange={(e) => setFormPreservePast(e.target.checked)}
                          className="mt-0.5 rounded border-slate-700 text-sky-500 focus:ring-0"
                        />
                        <span>
                          Geçmiş haftaları değiştirme (sadece seçilen tarihten sonraki haftalara ekle)
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Sınav / Test Notu (Opsiyonel) */}
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-2">
                <span className="text-[11px] font-mono text-purple-400 uppercase font-bold block flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>Sınav / Deneme Notu (Opsiyonel)</span>
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Sınav adı (Örn: Limit & Süreklilik)"
                      value={formScoreLabel}
                      onChange={(e) => setFormScoreLabel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-sky-500 text-xs"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Puan (%)"
                      value={formScore !== undefined ? formScore : ''}
                      onChange={(e) =>
                        setFormScore(e.target.value !== '' ? Number(e.target.value) : undefined)
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-purple-400 font-mono text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Summary Indicator */}
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 flex items-center justify-between font-mono text-xs">
                <span className="text-slate-400">Bu ders için öğretmen kazancı:</span>
                <span className="text-emerald-400 font-bold text-sm">
                  ₺{formClassFee.toLocaleString('tr-TR')} (Ders Başı Sabit)
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded text-xs transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-medium transition-colors"
                >
                  {editingClass ? 'Dersi Güncelle' : 'Dersi Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MASS EDIT MODAL */}
      {isMassEditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-850 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">
                  Toplu Ücret Güncelleme ({selectedClassIds.length} Ders Seçildi)
                </h3>
              </div>
              <button
                onClick={() => setIsMassEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-300">
              <p className="text-slate-300 leading-relaxed">
                Seçilen derslerin ders başı ücretini tek seferde topluca güncelleyin ve isterseniz gelecek haftaların tüm serisine uygulayın.
              </p>

              <div className="space-y-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">
                    Yeni Ders Başı Ücret (₺ / ders):
                  </label>
                  <input
                    type="number"
                    step="50"
                    placeholder="Değiştirmemek için boş bırakın"
                    value={massClassFee}
                    onChange={(e) =>
                      setMassClassFee(e.target.value !== '' ? Number(e.target.value) : '')
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-100 font-mono text-emerald-400"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <label className="flex items-start gap-2 text-xs text-sky-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={massPropagateSeries}
                      onChange={(e) => setMassPropagateSeries(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-sky-500 focus:ring-0"
                    />
                    <span>
                      Bu değişikliği seçilen derslerin gelecekteki TÜM haftalık serilerine de uygula!
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMassEditModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded text-xs transition-colors"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteMassEdit}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium transition-colors shadow-sm"
                >
                  Toplu Ücreti Uygula
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
