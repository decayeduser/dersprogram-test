export interface StudentScoreRecord {
  id: string;
  date: string;
  assessmentName: string;
  score: number; // 0 - 100
  maxScore: number;
  weight?: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gradeLevel: string; // e.g. '12. Sınıf (YKS Sayısal)'
  subject: string; // e.g. 'İleri Matematik & Geometri'
  defaultClassFee: number; // Ders başı sabit ücret (₺ / ders)
  status: 'active' | 'inactive';
  joinedDate: string;
  color: string;
  notes?: string;
}

export interface TeacherClass {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  classFee: number; // Ders başı ücret (₺)
  totalEarnings: number; // Ders başı ücret ile aynıdır
  score?: number; // 0 - 100 sınav/test puanı
  scoreLabel?: string; // Sınav adı (ör. 'Türev & İntegral Denemesi')
  recurringSeriesId?: string;
  // Deprecated/optional fields for storage migration
  paymentStatus?: 'paid' | 'pending' | 'unbilled';
  attendance?: 'attended' | 'scheduled';
  lessonNotes?: string;
}

export interface TeacherProfile {
  name: string;
  title: string;
  defaultClassFee: number;
  currency: string;
}

export interface UndoAction {
  id: string;
  description: string;
  timestamp: number;
  previousState: {
    classes: TeacherClass[];
    students: Student[];
  };
}

export type ActiveTab = 'calendar' | 'students' | 'scores' | 'analytics';
export type TimeHorizon = 'day' | 'month' | 'year' | 'all';
