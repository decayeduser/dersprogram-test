import React, { useState, useMemo } from 'react';
import {
  Award,
  Search,
  Plus,
  Filter,
  TrendingUp,
  User,
  Calendar,
  CheckCircle2,
  BookOpen,
  ArrowUpDown,
  Download,
  Flame,
  Check,
} from 'lucide-react';
import { TeacherClass, Student } from '../../types';
import { sound } from '../../utils/soundEffects';
import { AnimatedCounter } from '../common/AnimatedCounter';

interface TestResultsHubProps {
  classes: TeacherClass[];
  students: Student[];
  onUpdateClass: (id: string, updates: Partial<TeacherClass>) => void;
  onSelectStudent: (studentId: string) => void;
}

export const TestResultsHub: React.FC<TestResultsHubProps> = ({
  classes,
  students,
  onUpdateClass,
  onSelectStudent,
}) => {
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'scoreHigh' | 'scoreLow'>('date');
  const [isAddScoreModalOpen, setIsAddScoreModalOpen] = useState(false);

  // New Score Form
  const [targetStudentId, setTargetStudentId] = useState(students[0]?.id || '');
  const [scoreLabel, setScoreLabel] = useState('');
  const [scoreValue, setScoreValue] = useState<number>(90);
  const [scoreDate, setScoreDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [scoreNotes, setScoreNotes] = useState('');

  // Collect all scored sessions
  const scoredClasses = useMemo(() => {
    return classes.filter((c) => c.score !== undefined);
  }, [classes]);

  // Filtered & Sorted Scored Classes
  const displayScores = useMemo(() => {
    let list = scoredClasses.filter((c) => {
      const matchStudent = selectedStudentFilter === 'all' || c.studentId === selectedStudentFilter;
      const matchQuery =
        c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.scoreLabel && c.scoreLabel.toLowerCase().includes(searchQuery.toLowerCase())) ||
        c.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStudent && matchQuery;
    });

    if (sortBy === 'date') {
      list = [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortBy === 'scoreHigh') {
      list = [...list].sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (sortBy === 'scoreLow') {
      list = [...list].sort((a, b) => (a.score || 0) - (b.score || 0));
    }

    return list;
  }, [scoredClasses, selectedStudentFilter, searchQuery, sortBy]);

  // Overall Performance Metrics
  const averageScore = useMemo(() => {
    if (displayScores.length === 0) return 0;
    const total = displayScores.reduce((sum, c) => sum + (c.score || 0), 0);
    return Math.round((total / displayScores.length) * 10) / 10;
  }, [displayScores]);

  const maxScore = useMemo(() => {
    if (displayScores.length === 0) return 0;
    return Math.max(...displayScores.map((c) => c.score || 0));
  }, [displayScores]);

  const highPerformersCount = useMemo(() => {
    return displayScores.filter((c) => (c.score || 0) >= 85).length;
  }, [displayScores]);

  // Student Rankings
  const studentRankings = useMemo(() => {
    return students
      .map((student) => {
        const studentScores = scoredClasses.filter((c) => c.studentId === student.id);
        const count = studentScores.length;
        const avg =
          count > 0
            ? Math.round(
                (studentScores.reduce((sum, c) => sum + (c.score || 0), 0) / count) * 10
              ) / 10
            : null;
        const best = count > 0 ? Math.max(...studentScores.map((c) => c.score || 0)) : null;

        return {
          student,
          count,
          avg,
          best,
        };
      })
      .filter((item) => item.count > 0)
      .sort((a, b) => (b.avg || 0) - (a.avg || 0));
  }, [students, scoredClasses]);

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 80) return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
    if (score >= 70) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  const getLetterGrade = (score: number) => {
    if (score >= 90) return 'AA';
    if (score >= 85) return 'BA';
    if (score >= 80) return 'BB';
    if (score >= 75) return 'CB';
    if (score >= 70) return 'CC';
    if (score >= 60) return 'DC';
    return 'FF';
  };

  const handleCreateScore = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === targetStudentId);
    if (!student || !scoreLabel.trim()) return;

    // Attach to an existing class or find most relevant session
    const existing = classes.find(
      (c) => c.studentId === targetStudentId && c.date === scoreDate
    );

    if (existing) {
      onUpdateClass(existing.id, {
        score: scoreValue,
        scoreLabel: scoreLabel.trim(),
        lessonNotes: scoreNotes ? `${existing.lessonNotes || ''} | ${scoreNotes}` : existing.lessonNotes,
      });
    } else {
      const anySession = classes.find((c) => c.studentId === targetStudentId);
      if (anySession) {
        onUpdateClass(anySession.id, {
          score: scoreValue,
          scoreLabel: scoreLabel.trim(),
          lessonNotes: scoreNotes,
        });
      }
    }

    sound.playTaskComplete();
    setIsAddScoreModalOpen(false);
    setScoreLabel('');
    setScoreNotes('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-y-auto p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-400" />
            <span>Öğrenci Sınav, Deneme & Test Sonuçları Merkezi</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Öğrencilerin konu tarama testleri, deneme sınavları ve akademik başarı grafikleri.
          </p>
        </div>

        <button
          onClick={() => setIsAddScoreModalOpen(true)}
          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Yeni Sınav Notu Gir</span>
        </button>
      </div>

      {/* KPI METRICS CARDS WITH ANIMATED COUNTER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-850 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-400 font-mono uppercase">
            GENEL SINAV ORTALAMASI
          </span>
          <div className="text-2xl font-bold font-mono text-purple-400">
            <AnimatedCounter value={averageScore} decimals={1} prefix="%" />
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {displayScores.length} sınav değerlendirmesi
          </div>
        </div>

        <div className="bg-slate-850 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-400 font-mono uppercase">
            EN YÜKSEK ALINAN PUAN
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            <AnimatedCounter value={maxScore} prefix="%" />
          </div>
          <div className="text-[10px] text-emerald-400/80 font-mono">
            Mükemmel başarı seviyesi
          </div>
        </div>

        <div className="bg-slate-850 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-400 font-mono uppercase">
            YÜKSEK BAŞARI (≥ %85)
          </span>
          <div className="text-2xl font-bold font-mono text-sky-400">
            <AnimatedCounter value={highPerformersCount} suffix=" sınav" />
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Hedeflenen net aralığında
          </div>
        </div>

        <div className="bg-slate-850 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-400 font-mono uppercase">
            DEĞERLENDİRİLEN ÖĞRENCİ
          </span>
          <div className="text-2xl font-bold font-mono text-amber-400">
            <AnimatedCounter value={studentRankings.length} suffix=" öğrenci" />
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Aktif not kaydı olanlar
          </div>
        </div>
      </div>

      {/* FILTER & SORT BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-850 p-3 rounded-xl border border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Öğrenci veya sınav adı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-700 pl-8 pr-3 py-1 rounded text-xs text-slate-200 focus:outline-none focus:border-sky-500 w-52"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStudentFilter}
              onChange={(e) => setSelectedStudentFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 cursor-pointer"
            >
              <option value="all">Tüm Öğrenciler ({students.length})</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Sıralama:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 cursor-pointer"
          >
            <option value="date">Tarihe Göre (En Yeni)</option>
            <option value="scoreHigh">Puana Göre (En Yüksek)</option>
            <option value="scoreLow">Puana Göre (En Düşük)</option>
          </select>
        </div>
      </div>

      {/* VISUAL TEST RESULTS CARDS GRID */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
          Sınav & Deneme Sonuç Kartları ({displayScores.length})
        </h3>

        {displayScores.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-slate-850/50 border border-dashed border-slate-800 rounded-xl">
            Arama kriterlerine uygun sınav kaydı bulunamadı.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayScores.map((cls) => {
              const student = students.find((s) => s.id === cls.studentId);
              const score = cls.score || 0;
              const letterGrade = getLetterGrade(score);

              return (
                <div
                  key={cls.id}
                  className="bg-slate-850 border border-slate-800 hover:border-slate-750 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all shadow-xs"
                >
                  <div className="space-y-2">
                    {/* Header: Student & Letter Grade */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: student?.color || '#3B82F6' }}
                        />
                        <button
                          onClick={() => onSelectStudent(cls.studentId)}
                          className="font-bold text-white text-xs hover:text-sky-400 hover:underline truncate"
                        >
                          {cls.studentName}
                        </button>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${getScoreBadgeColor(
                          score
                        )}`}
                      >
                        {letterGrade} · %{score}
                      </span>
                    </div>

                    <h4 className="font-semibold text-slate-100 text-xs">
                      {cls.scoreLabel || 'Deneme Sınavı'}
                    </h4>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <span>{cls.subject}</span>
                      <span>·</span>
                      <span>{cls.date}</span>
                    </div>

                    {/* Visual Score Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Başarı Oranı</span>
                        <span className="font-bold text-white">%{score} / %100</span>
                      </div>
                      <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            score >= 90
                              ? 'bg-emerald-500'
                              : score >= 80
                              ? 'bg-sky-500'
                              : score >= 70
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>

                    {cls.lessonNotes && (
                      <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 text-[11px] text-slate-300 italic">
                        "{cls.lessonNotes}"
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Ders Süresi: {cls.durationMinutes} dk</span>
                    <button
                      onClick={() => onSelectStudent(cls.studentId)}
                      className="text-sky-400 hover:text-sky-300 font-semibold"
                    >
                      Öğrenci Profiline Git →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* STUDENT LEADERBOARD & ACADEMIC RANKING */}
      <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white pb-3 border-b border-slate-800">
          Öğrenci Akademik Başarı Sıralaması (Sınav Ortalamaları)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-800 font-mono text-[11px] text-slate-400 uppercase">
              <tr>
                <th className="py-2.5 px-3">Sıra</th>
                <th className="py-2.5 px-3">Öğrenci</th>
                <th className="py-2.5 px-3">Ders / Alan</th>
                <th className="py-2.5 px-3">Sınav Sayısı</th>
                <th className="py-2.5 px-3">Ortalama Puan</th>
                <th className="py-2.5 px-3">En Yüksek Puan</th>
                <th className="py-2.5 px-3">Harf Notu</th>
                <th className="py-2.5 px-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-sans">
              {studentRankings.map((rank, idx) => (
                <tr key={rank.student.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-400">{idx + 1}.</td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: rank.student.color }}
                      />
                      <span className="font-bold text-white">{rank.student.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{rank.student.subject}</td>
                  <td className="py-2.5 px-3 font-mono">{rank.count} sınav</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-purple-400 whitespace-nowrap">
                    %{rank.avg}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                    %{rank.best}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border ${getScoreBadgeColor(
                        rank.avg || 0
                      )}`}
                    >
                      {getLetterGrade(rank.avg || 0)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => onSelectStudent(rank.student.id)}
                      className="text-xs text-sky-400 hover:text-sky-300 font-medium"
                    >
                      Tüm Sınavları Gör →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD SCORE */}
      {isAddScoreModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-850 border-b border-slate-700">
              <h3 className="text-sm font-semibold text-white">Yeni Sınav / Test Notu Gir</h3>
              <button
                onClick={() => setIsAddScoreModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateScore} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Öğrenci Seçin</label>
                <select
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.subject})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Sınav / Test Adı</label>
                <input
                  type="text"
                  required
                  placeholder="ör. Türev Uygulamaları ve Teğet Denklemi Denemesi"
                  value={scoreLabel}
                  onChange={(e) => setScoreLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Sınav Puanı (%)</label>
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
                  <label className="block text-slate-300 mb-1 font-medium">Tarih</label>
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
                <label className="block text-slate-300 mb-1 font-medium">Öğretmen Değerlendirme Notu</label>
                <textarea
                  rows={2}
                  placeholder="Eksik kalınan sorular, iyi yapılan kazanımlar..."
                  value={scoreNotes}
                  onChange={(e) => setScoreNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddScoreModalOpen(false)}
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
