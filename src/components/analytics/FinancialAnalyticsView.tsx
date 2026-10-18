import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Clock,
  Award,
  Download,
  BookOpen,
} from 'lucide-react';
import { TeacherClass, Student, TimeHorizon } from '../../types';
import { AnimatedCounter } from '../common/AnimatedCounter';

interface FinancialAnalyticsViewProps {
  classes: TeacherClass[];
  students: Student[];
  onSelectStudent: (studentId: string) => void;
}

export const FinancialAnalyticsView: React.FC<FinancialAnalyticsViewProps> = ({
  classes,
  students,
  onSelectStudent,
}) => {
  const [horizon, setHorizon] = useState<TimeHorizon>('month');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('all');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}`;
  const currentYearStr = `${now.getFullYear()}`;

  // Filter classes by Time Horizon
  const horizonClasses = useMemo(() => {
    let list = classes;
    if (horizon === 'day') {
      list = list.filter((c) => c.date === todayStr);
    } else if (horizon === 'month') {
      list = list.filter((c) => c.date.startsWith(currentMonthStr));
    } else if (horizon === 'year') {
      list = list.filter((c) => c.date.startsWith(currentYearStr));
    }

    if (selectedStudentFilter !== 'all') {
      list = list.filter((c) => c.studentId === selectedStudentFilter);
    }
    return list;
  }, [classes, horizon, todayStr, currentMonthStr, currentYearStr, selectedStudentFilter]);

  // Variables calculations (Paid per class!)
  const totalMoneyEarned = useMemo(() => {
    return horizonClasses.reduce((sum, c) => sum + c.totalEarnings, 0);
  }, [horizonClasses]);

  const totalMinutesTaught = useMemo(() => {
    return horizonClasses.reduce((sum, c) => sum + c.durationMinutes, 0);
  }, [horizonClasses]);

  const totalHoursTaught = totalMinutesTaught / 60;
  const totalClassesCount = horizonClasses.length;
  const averageClassFee = totalClassesCount > 0 ? totalMoneyEarned / totalClassesCount : 0;

  const scoreClasses = horizonClasses.filter((c) => c.score !== undefined);
  const averageStudentScore =
    scoreClasses.length > 0
      ? (scoreClasses.reduce((sum, c) => sum + (c.score || 0), 0) / scoreClasses.length).toFixed(1)
      : null;

  // Student-by-Student Summary Table
  const studentSummaries = useMemo(() => {
    return students.map((student) => {
      const studentClassList = horizonClasses.filter((c) => c.studentId === student.id);
      const money = studentClassList.reduce((sum, c) => sum + c.totalEarnings, 0);
      const minutes = studentClassList.reduce((sum, c) => sum + c.durationMinutes, 0);
      const sScores = studentClassList.filter((c) => c.score !== undefined);
      const avgScore =
        sScores.length > 0
          ? (sScores.reduce((sum, c) => sum + (c.score || 0), 0) / sScores.length).toFixed(1)
          : null;

      return {
        student,
        classCount: studentClassList.length,
        hours: minutes / 60,
        money,
        avgScore,
      };
    });
  }, [students, horizonClasses]);

  const handleExportCSV = () => {
    const headers = [
      'Tarih',
      'Öğrenci Adı',
      'Ders / Konu',
      'Süre (Dk)',
      'Ders Başı Ücret (TL)',
      'Toplam Ücret (TL)',
      'Sınav Notu (%)',
    ];
    const rows = horizonClasses.map((c) => [
      c.date,
      `"${c.studentName}"`,
      `"${c.subject}"`,
      c.durationMinutes,
      c.classFee,
      c.totalEarnings,
      c.score !== undefined ? c.score : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OgretmenMasasi-Finans-Raporu-${horizon}-${todayStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getHorizonLabel = () => {
    switch (horizon) {
      case 'day':
        return 'GÜNLÜK ÖZET (BUGÜN)';
      case 'month':
        return 'AYLIK ÖZET (BU AY)';
      case 'year':
        return 'YILLIK ÖZET (BU YIL)';
      default:
        return 'TÜM ZAMANLAR ÖZETİ';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-y-auto p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span>Öğretmen Gelir, Zaman & Ders İstatistikleri</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Öğretmenin ders başı kazandığı ücretler, verilen ders süreleri ve öğrenci sınav ortalamaları.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Horizon Filter */}
          <div className="flex items-center bg-slate-850 p-1 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setHorizon('day')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                horizon === 'day'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Günlük Özet
            </button>
            <button
              onClick={() => setHorizon('month')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                horizon === 'month'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Aylık Özet
            </button>
            <button
              onClick={() => setHorizon('year')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                horizon === 'year'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Yıllık Özet
            </button>
            <button
              onClick={() => setHorizon('all')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                horizon === 'all'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tüm Zamanlar
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>CSV Defterini İndir</span>
          </button>
        </div>
      </div>

      {/* CORE STATS GRID WITH ANIMATED COUNTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Variable 1: Total Money Got */}
        <div className="bg-slate-850 border border-slate-800 p-4 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono uppercase text-[10px]">TOPLAM KAZANILAN PARA</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            <AnimatedCounter value={totalMoneyEarned} prefix="₺" />
          </div>
          <div className="text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
            Ders başı sabit ücret modeli
          </div>
        </div>

        {/* Variable 2: Total Classes & Average Class Fee */}
        <div className="bg-slate-850 border border-slate-800 p-4 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono uppercase text-[10px]">VERİLEN DERS SAYISI</span>
            <BookOpen className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-sky-400">
            <AnimatedCounter value={totalClassesCount} suffix=" ders" />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-slate-800/80 text-slate-400">
            <span>Ort. Ücret: ₺{averageClassFee.toFixed(0)}/ders</span>
            <span>{totalHoursTaught.toFixed(1)} sa</span>
          </div>
        </div>

        {/* Variable 3: Total Teaching Time Spent */}
        <div className="bg-slate-850 border border-slate-800 p-4 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono uppercase text-[10px]">HARCANAN DERS ZAMANI</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300">
            <AnimatedCounter value={totalHoursTaught} decimals={1} suffix=" saat" />
          </div>
          <div className="text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
            Toplam {totalMinutesTaught} dakika birebir ders
          </div>
        </div>

        {/* Variable 4: Student Scores & Class Performance */}
        <div className="bg-slate-850 border border-slate-800 p-4 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono uppercase text-[10px]">ÖĞRENCİ SINAV ORTALAMASI</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">
            {averageStudentScore ? (
              <AnimatedCounter value={Number(averageStudentScore)} decimals={1} prefix="%" />
            ) : (
              'Not Yok'
            )}
          </div>
          <div className="text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
            {scoreClasses.length} sınav/deneme kaydı incelendi
          </div>
        </div>
      </div>

      {/* STUDENT-BY-STUDENT BREAKDOWN TABLE */}
      <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white">
              {getHorizonLabel()} — Öğrenci Bazlı Kazanç & Zaman Dağılımı
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Her öğrenciye verilen toplam ders sayısı, harcanan saatler, alınan ücretler ve sınav ortalamaları.
            </p>
          </div>

          <span className="text-xs font-mono text-slate-400">
            {studentSummaries.filter((s) => s.classCount > 0).length} / {students.length} öğrenci aktif
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-800 font-mono text-[11px] text-slate-400 uppercase">
              <tr>
                <th className="py-2.5 px-3">Öğrenci</th>
                <th className="py-2.5 px-3">Alan / Ders</th>
                <th className="py-2.5 px-3">Ders Sayısı</th>
                <th className="py-2.5 px-3">Verilen Süre</th>
                <th className="py-2.5 px-3">Ders Başı Ücret</th>
                <th className="py-2.5 px-3">Toplam Ücret</th>
                <th className="py-2.5 px-3">Sınav Ortalaması</th>
                <th className="py-2.5 px-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-sans">
              {studentSummaries.map((item) => (
                <tr key={item.student.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.student.color }}
                      />
                      <span className="font-bold text-white">{item.student.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{item.student.subject}</td>
                  <td className="py-2.5 px-3 font-mono">{item.classCount} ders</td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-sky-400">
                    {item.hours.toFixed(1)} saat
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">
                    ₺{item.student.defaultClassFee}/ders
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                    ₺{item.money.toLocaleString('tr-TR')}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold">
                    {item.avgScore ? (
                      <span className="text-purple-400">%{item.avgScore}</span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => onSelectStudent(item.student.id)}
                      className="text-xs text-sky-400 hover:text-sky-300 font-medium"
                    >
                      Öğrenci Profilini Aç →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CHRONOLOGICAL SESSION LOG */}
      <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white pb-3 border-b border-slate-800">
          Tarih Sıralı Ders Defteri ({horizonClasses.length} Ders Oturumu)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-800 font-mono text-[11px] text-slate-400 uppercase">
              <tr>
                <th className="py-2.5 px-3">Tarih</th>
                <th className="py-2.5 px-3">Öğrenci</th>
                <th className="py-2.5 px-3">Ders / Konu</th>
                <th className="py-2.5 px-3">Saat</th>
                <th className="py-2.5 px-3">Süre</th>
                <th className="py-2.5 px-3">Ders Başı Ücret</th>
                <th className="py-2.5 px-3">Sınav Notu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-sans">
              {horizonClasses.map((cls) => (
                <tr key={cls.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-white whitespace-nowrap">{cls.date}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{cls.studentName}</td>
                  <td className="py-2.5 px-3 text-slate-300">{cls.subject}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">
                    {cls.startTime} - {cls.endTime}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-sky-400">{cls.durationMinutes} dk</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                    ₺{cls.classFee.toLocaleString('tr-TR')}
                  </td>
                  <td className="py-2.5 px-3 font-mono">
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
    </div>
  );
};
