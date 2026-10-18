import React, { useState, useMemo } from 'react';
import {
  User,
  Plus,
  Search,
  DollarSign,
  Clock,
  Award,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Mail,
  Phone,
  BookOpen,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Student, TeacherClass } from '../../types';
import { sound } from '../../utils/soundEffects';
import { AnimatedCounter } from '../common/AnimatedCounter';

interface StudentRosterViewProps {
  students: Student[];
  classes: TeacherClass[];
  selectedStudentId: string | null;
  onSelectStudentId: (id: string | null) => void;
  onAddStudent: (student: Omit<Student, 'id' | 'joinedDate'>) => void;
  onUpdateStudent: (id: string, updates: Partial<Student>) => void;
  onDeleteStudent: (id: string) => void;
  onUpdateClass: (id: string, updates: Partial<TeacherClass>) => void;
  onAddClassForStudent: (studentId: string) => void;
}

export const StudentRosterView: React.FC<StudentRosterViewProps> = ({
  students,
  classes,
  selectedStudentId,
  onSelectStudentId,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onUpdateClass,
  onAddClassForStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeHorizon, setTimeHorizon] = useState<'day' | 'month' | 'year' | 'all'>('month');

  // Modals
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isRecordScoreOpen, setIsRecordScoreOpen] = useState(false);

  // Student Form State (Pay per class!)
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formGradeLevel, setFormGradeLevel] = useState('12. Sınıf (YKS Sayısal)');
  const [formSubject, setFormSubject] = useState('AYT Matematik & Geometri');
  const [formFee, setFormFee] = useState(850);
  const [formNotes, setFormNotes] = useState('');
  const [formColor, setFormColor] = useState('#3B82F6');

  // Score Recording Form State
  const [scoreAssessmentLabel, setScoreAssessmentLabel] = useState('');
  const [scoreValue, setScoreValue] = useState<number>(90);
  const [scoreDate, setScoreDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [scoreNotes, setScoreNotes] = useState('');

  const activeStudentId = selectedStudentId || (students.length > 0 ? students[0].id : null);
  const activeStudent = students.find((s) => s.id === activeStudentId);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.gradeLevel.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  // All classes for active student
  const studentClasses = useMemo(() => {
    if (!activeStudentId) return [];
    return classes.filter((c) => c.studentId === activeStudentId);
  }, [classes, activeStudentId]);

  // Date filtering for active student in Day / Month / Year
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthPrefix = `${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}`;
  const currentYearPrefix = `${now.getFullYear()}`;

  const horizonFilteredClasses = useMemo(() => {
    if (timeHorizon === 'day') {
      return studentClasses.filter((c) => c.date === todayStr);
    } else if (timeHorizon === 'month') {
      return studentClasses.filter((c) => c.date.startsWith(currentMonthPrefix));
    } else if (timeHorizon === 'year') {
      return studentClasses.filter((c) => c.date.startsWith(currentYearPrefix));
    }
    return studentClasses;
  }, [studentClasses, timeHorizon, todayStr, currentMonthPrefix, currentYearPrefix]);

  // Financial & Time Metrics for this student (Per class fee)
  const studentMoneyGot = useMemo(() => {
    return horizonFilteredClasses.reduce((sum, c) => sum + c.totalEarnings, 0);
  }, [horizonFilteredClasses]);

  const studentPaidMoney = useMemo(() => {
    return horizonFilteredClasses
      .filter((c) => c.paymentStatus === 'paid')
      .reduce((sum, c) => sum + c.totalEarnings, 0);
  }, [horizonFilteredClasses]);

  const studentPendingMoney = useMemo(() => {
    return horizonFilteredClasses
      .filter((c) => c.paymentStatus === 'pending' || c.paymentStatus === 'unbilled')
      .reduce((sum, c) => sum + c.totalEarnings, 0);
  }, [horizonFilteredClasses]);

  const studentTotalMinutes = useMemo(() => {
    return horizonFilteredClasses.reduce((sum, c) => sum + c.durationMinutes, 0);
  }, [horizonFilteredClasses]);

  const studentScoreClasses = useMemo(() => {
    return studentClasses.filter((c) => c.score !== undefined);
  }, [studentClasses]);

  const averageStudentScore = useMemo(() => {
    if (studentScoreClasses.length === 0) return null;
    const total = studentScoreClasses.reduce((sum, c) => sum + (c.score || 0), 0);
    return (total / studentScoreClasses.length).toFixed(1);
  }, [studentScoreClasses]);

  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormGradeLevel('12. Sınıf (YKS)');
    setFormSubject('AYT Matematik & Geometri');
    setFormFee(850);
    setFormNotes('');
    setFormColor('#3B82F6');
    setIsAddStudentOpen(true);
  };

  const handleOpenEditStudent = (s: Student) => {
    setEditingStudent(s);
    setFormName(s.name);
    setFormEmail(s.email);
    setFormPhone(s.phone || '');
    setFormGradeLevel(s.gradeLevel);
    setFormSubject(s.subject);
    setFormFee(s.defaultClassFee);
    setFormNotes(s.notes || '');
    setFormColor(s.color);
    setIsAddStudentOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingStudent) {
      onUpdateStudent(editingStudent.id, {
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim() || undefined,
        gradeLevel: formGradeLevel,
        subject: formSubject.trim(),
        defaultClassFee: formFee,
        notes: formNotes.trim() || undefined,
        color: formColor,
      });
      sound.playTaskComplete();
    } else {
      onAddStudent({
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim() || undefined,
        gradeLevel: formGradeLevel,
        subject: formSubject.trim(),
        defaultClassFee: formFee,
        status: 'active',
        notes: formNotes.trim() || undefined,
        color: formColor,
      });
      sound.playTaskComplete();
    }

    setIsAddStudentOpen(false);
  };

  const handleRecordNewScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudentId || !scoreAssessmentLabel.trim()) return;

    const matchingClass = studentClasses.find((c) => c.date === scoreDate);
    if (matchingClass) {
      onUpdateClass(matchingClass.id, {
        score: scoreValue,
        scoreLabel: scoreAssessmentLabel.trim(),
        lessonNotes: scoreNotes ? `${matchingClass.lessonNotes || ''} | ${scoreNotes}` : matchingClass.lessonNotes,
      });
    } else {
      const latest = studentClasses[0];
      if (latest) {
        onUpdateClass(latest.id, {
          score: scoreValue,
          scoreLabel: scoreAssessmentLabel.trim(),
          lessonNotes: scoreNotes,
        });
      }
    }

    sound.playTaskComplete();
    setIsRecordScoreOpen(false);
    setScoreAssessmentLabel('');
    setScoreNotes('');
  };

  const COLOR_PALETTES = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#8B5CF6',
    '#EC4899',
    '#06B6D4',
    '#EF4444',
  ];

  return (
    <div className="flex h-full bg-slate-900 overflow-hidden divide-x divide-slate-800">
      {/* LEFT: STUDENT ROSTER DIRECTORY */}
      <div className="w-80 bg-slate-900 flex flex-col shrink-0 text-xs overflow-hidden">
        <div className="p-3 border-b border-slate-800 space-y-2.5 bg-slate-900/90 shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200 text-xs">
              Öğrenci Listesi ({students.length})
            </span>
            <button
              onClick={handleOpenAddStudent}
              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni Öğrenci</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="İsim, sınıf veya ders ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-850 border border-slate-700 pl-8 pr-3 py-1 rounded text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Student Cards List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredStudents.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Eşleşen öğrenci bulunamadı.
            </div>
          ) : (
            filteredStudents.map((student) => {
              const isSelected = student.id === activeStudentId;
              const studClasses = classes.filter((c) => c.studentId === student.id);
              const totalHours = studClasses.reduce((sum, c) => sum + c.durationMinutes, 0) / 60;
              const totalRevenue = studClasses.reduce((sum, c) => sum + c.totalEarnings, 0);

              return (
                <div
                  key={student.id}
                  onClick={() => onSelectStudentId(student.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-sky-950/40 border-sky-600 shadow-sm'
                      : 'bg-slate-850/60 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: student.color }}
                      />
                      <span className="font-bold text-white text-xs truncate">
                        {student.name}
                      </span>
                    </div>

                    <span className="font-mono text-emerald-400 font-bold text-[11px] shrink-0">
                      ₺{totalRevenue.toLocaleString('tr-TR')}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 truncate mt-1">
                    {student.subject}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2 pt-1.5 border-t border-slate-800/80">
                    <span>{student.gradeLevel.split(' ')[0]}</span>
                    <span>
                      {studClasses.length} ders ({totalHours.toFixed(1)} sa) · ₺{student.defaultClassFee}/ders
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: INDIVIDUAL STUDENT DEEP-DIVE PROFILE */}
      <div className="flex-1 bg-slate-900 overflow-y-auto p-6 space-y-6">
        {!activeStudent ? (
          <div className="py-16 text-center text-slate-500">
            Öğrenci detaylarını ve sınav/ücret kayıtlarını görmek için soldan bir öğrenci seçin.
          </div>
        ) : (
          <>
            {/* 1. Student Profile Header */}
            <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-md"
                  style={{ backgroundColor: activeStudent.color }}
                >
                  {activeStudent.name.charAt(0)}
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      {activeStudent.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono">
                      {activeStudent.gradeLevel}
                    </span>
                  </div>

                  <div className="text-xs text-sky-400 font-medium mt-0.5">
                    {activeStudent.subject}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                    {activeStudent.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>{activeStudent.email}</span>
                      </span>
                    )}
                    {activeStudent.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{activeStudent.phone}</span>
                      </span>
                    )}
                    <span className="font-mono text-emerald-400 font-semibold">
                      Ders Başı Ücret: ₺{activeStudent.defaultClassFee} / ders
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onAddClassForStudent(activeStudent.id)}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ders Planla</span>
                </button>
                <button
                  onClick={() => handleOpenEditStudent(activeStudent)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Profili Düzenle</span>
                </button>
              </div>
            </div>

            {/* 2. TIME HORIZON SELECTOR (GÜN / AY / YIL / TÜMÜ) */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  {activeStudent.name}'e Verilen Ders Zamanı & Alınan Ücret Özeti
                </h3>
                <span className="text-[11px] text-slate-400">
                  Dönemsel bazda toplam kazanılan para ve verilen ders süresini seçin:
                </span>
              </div>

              <div className="flex items-center bg-slate-850 p-1 rounded-lg border border-slate-700 text-xs">
                <button
                  onClick={() => setTimeHorizon('day')}
                  className={`px-3 py-1 font-medium rounded transition-colors ${
                    timeHorizon === 'day'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Bugün (Gün)
                </button>
                <button
                  onClick={() => setTimeHorizon('month')}
                  className={`px-3 py-1 font-medium rounded transition-colors ${
                    timeHorizon === 'month'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Bu Ay (Ay)
                </button>
                <button
                  onClick={() => setTimeHorizon('year')}
                  className={`px-3 py-1 font-medium rounded transition-colors ${
                    timeHorizon === 'year'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Bu Yıl (Yıl)
                </button>
                <button
                  onClick={() => setTimeHorizon('all')}
                  className={`px-3 py-1 font-medium rounded transition-colors ${
                    timeHorizon === 'all'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tüm Zamanlar
                </button>
              </div>
            </div>

            {/* 3. FOUR CORE KPI CARDS FOR THIS STUDENT WITH ANIMATED COUNTERS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-850 border border-slate-800 p-4 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-mono uppercase">
                  TOPLAM KAZANÇ
                </span>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  <AnimatedCounter value={studentMoneyGot} prefix="₺" />
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {timeHorizon === 'day' ? 'Bugün' : timeHorizon === 'month' ? 'Bu ay' : timeHorizon === 'year' ? 'Bu yıl' : 'Tüm zamanlar'}
                </div>
              </div>

              <div className="bg-slate-850 border border-slate-800 p-4 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-mono uppercase">
                  VERİLEN BİREBİR SÜRE
                </span>
                <div className="text-xl font-bold font-mono text-sky-400">
                  <AnimatedCounter value={studentTotalMinutes / 60} decimals={1} suffix=" saat" />
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {horizonFilteredClasses.length} ders oturumu
                </div>
              </div>

              <div className="bg-slate-850 border border-slate-800 p-4 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-mono uppercase">
                  TOPLAM DERS SAYISI
                </span>
                <div className="text-xl font-bold font-mono text-amber-400">
                  <AnimatedCounter value={horizonFilteredClasses.length} suffix=" ders" />
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Ders Başı: ₺{activeStudent.defaultClassFee}/ders
                </div>
              </div>

              <div className="bg-slate-850 border border-slate-800 p-4 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-mono uppercase">
                  ÖĞRENCİ SINAV ORTALAMASI
                </span>
                <div className="text-xl font-bold font-mono text-purple-400">
                  {averageStudentScore ? (
                    <AnimatedCounter value={Number(averageStudentScore)} decimals={1} prefix="%" />
                  ) : (
                    'Not Yok'
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {studentScoreClasses.length} sınav/deneme kaydı
                </div>
              </div>
            </div>

            {/* 4. STUDENT TEST SCORES & ACADEMIC PROGRESS */}
            <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">
                    {activeStudent.name}'in Sınav, Deneme & Test Sonuçları
                  </h3>
                </div>

                <button
                  onClick={() => setIsRecordScoreOpen(true)}
                  className="px-3 py-1 bg-purple-600/90 hover:bg-purple-600 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Sınav Notu Ekle</span>
                </button>
              </div>

              {studentScoreClasses.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">
                  Bu öğrenci için henüz girilmiş bir sınav notu bulunmuyor. Not girmek için yukarıdaki
                  butona tıklayın.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {studentScoreClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-white">
                          {cls.scoreLabel || 'Deneme Değerlendirmesi'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Tarih: {cls.date} · Konu: {cls.subject}
                        </div>
                        {/* Score progress bar */}
                        <div className="h-1.5 w-36 bg-slate-800 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full ${
                              cls.score! >= 90 ? 'bg-emerald-500' : cls.score! >= 75 ? 'bg-sky-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${cls.score}%` }}
                          />
                        </div>
                        {cls.lessonNotes && (
                          <div className="text-[11px] text-slate-300 mt-1 italic">
                            "{cls.lessonNotes}"
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-mono text-base font-bold tabular-nums px-2 py-0.5 rounded ${
                            cls.score! >= 90
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : cls.score! >= 75
                              ? 'text-sky-400 bg-sky-500/10'
                              : 'text-amber-400 bg-amber-500/10'
                          }`}
                        >
                          %{cls.score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. COMPLETE SCHEDULE & CLASS HISTORY FOR THIS STUDENT */}
            <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">
                    Ders Geçmişi & Gelecek Program ({studentClasses.length} Ders)
                  </h3>
                </div>

                <button
                  onClick={() => onAddClassForStudent(activeStudent.id)}
                  className="text-xs text-sky-400 hover:text-sky-300 font-medium"
                >
                  + Yeni Ders Planla
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 border-b border-slate-800 font-mono text-[11px] text-slate-400 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Tarih</th>
                      <th className="py-2.5 px-3">Saat & Süre</th>
                      <th className="py-2.5 px-3">Konu</th>
                      <th className="py-2.5 px-3">Ders Başı Ücret</th>
                      <th className="py-2.5 px-3">Sınav / Test Notu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-sans">
                    {studentClasses.map((cls) => (
                      <tr key={cls.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-white whitespace-nowrap">
                          {cls.date}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                          {cls.startTime} - {cls.endTime} ({cls.durationMinutes} dk)
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">{cls.subject}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                          ₺{cls.classFee.toLocaleString('tr-TR')}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold whitespace-nowrap">
                          {cls.score !== undefined ? (
                            <span className="text-purple-400 font-bold bg-purple-950/40 border border-purple-800/50 px-2 py-0.5 rounded text-xs">
                              {cls.scoreLabel ? `${cls.scoreLabel}: ` : ''}%{cls.score}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL: ADD / EDIT STUDENT */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-850 border-b border-slate-700">
              <h3 className="text-sm font-semibold text-white">
                {editingStudent ? 'Öğrenci Profilini Düzenle' : 'Yeni Öğrenci Kaydet'}
              </h3>
              <button
                onClick={() => setIsAddStudentOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Öğrenci Adı Soyadı</label>
                <input
                  type="text"
                  required
                  placeholder="ör. Ali Yılmaz"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">E-posta</label>
                  <input
                    type="email"
                    required
                    placeholder="ogrenci@eposta.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Telefon</label>
                  <input
                    type="text"
                    placeholder="+90 5xx xxx xx xx"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Sınıf / Seviye</label>
                  <input
                    type="text"
                    required
                    placeholder="ör. 12. Sınıf YKS"
                    value={formGradeLevel}
                    onChange={(e) => setFormGradeLevel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Ders Başı Ücret (₺)</label>
                  <input
                    type="number"
                    min={100}
                    step={50}
                    required
                    value={formFee}
                    onChange={(e) => setFormFee(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 font-mono text-emerald-400 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Ders / Alan</label>
                <input
                  type="text"
                  required
                  placeholder="ör. AYT Matematik & Geometri"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Renk Etiketi</label>
                <div className="flex items-center gap-2 pt-1">
                  {COLOR_PALETTES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        formColor === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Öğretmen Özel Notları</label>
                <textarea
                  rows={2}
                  placeholder="Öğrencinin öğrenme hızı, hedef üniversite, zayıf/güçlü konular..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100 text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                {editingStudent ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`${editingStudent.name} adlı öğrenciyi silmek istediğinize emin misiniz?`)) {
                        onDeleteStudent(editingStudent.id);
                        setIsAddStudentOpen(false);
                      }
                    }}
                    className="text-rose-400 hover:text-rose-300 text-xs"
                  >
                    Öğrenciyi Sil
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddStudentOpen(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium"
                  >
                    {editingStudent ? 'Değişiklikleri Kaydet' : 'Öğrenciyi Kaydet'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD SCORE */}
      {isRecordScoreOpen && activeStudent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-850 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">
                  {activeStudent.name} İçin Sınav Notu Gir
                </h3>
              </div>
              <button
                onClick={() => setIsRecordScoreOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordNewScore} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Sınav / Test Başlığı</label>
                <input
                  type="text"
                  required
                  placeholder="ör. 12. Sınıf İntegral & Türev Deneme Sınavı"
                  value={scoreAssessmentLabel}
                  onChange={(e) => setScoreAssessmentLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Başarı Yüzdesi (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={scoreValue}
                    onChange={(e) => setScoreValue(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 font-mono text-purple-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Sınav Tarihi</label>
                  <input
                    type="date"
                    required
                    value={scoreDate}
                    onChange={(e) => setScoreDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Değerlendirme Notu</label>
                <textarea
                  rows={2}
                  placeholder="ör. Temel integrallerde hatasız; trigonometrik dönüşümlerde formül tekrarı gerekli."
                  value={scoreNotes}
                  onChange={(e) => setScoreNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRecordScoreOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium"
                >
                  Notu Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
