import {
  Student,
  TeacherClass,
  TeacherProfile,
} from '../types';
import {
  INITIAL_STUDENTS,
  INITIAL_CLASSES,
  INITIAL_TEACHER_PROFILE,
} from '../data/initialData';

const STORAGE_KEY_DATA = 'ogretmenmasasi_data_v5';

export interface TeacherDatabase {
  profile: TeacherProfile;
  students: Student[];
  classes: TeacherClass[];
  lastModified: string;
}

interface HistorySnapshot {
  description: string;
  classes: TeacherClass[];
  students: Student[];
}

export class LocalOfflineEngine {
  private db: TeacherDatabase;
  private undoStack: HistorySnapshot[] = [];
  private listeners: Set<() => void> = new Set();
  public lastUndoMessage: string | null = null;

  constructor() {
    this.db = this.loadLocalDatabase();
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(undoMessage?: string) {
    if (undoMessage) {
      this.lastUndoMessage = undoMessage;
    }
    this.listeners.forEach((cb) => cb());
  }

  private loadLocalDatabase(): TeacherDatabase {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DATA);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Yerel veritabanı okunamadı, varsayılana sıfırlanıyor', e);
    }

    const initial: TeacherDatabase = {
      profile: INITIAL_TEACHER_PROFILE,
      students: INITIAL_STUDENTS,
      classes: INITIAL_CLASSES,
      lastModified: new Date().toISOString(),
    };
    this.saveLocalDatabase(initial);
    return initial;
  }

  private saveLocalDatabase(db: TeacherDatabase) {
    try {
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(db));
    } catch (e) {
      console.error('Yerel depolama hatası', e);
    }
  }

  private pushUndo(description: string) {
    // Keep max 40 undo steps
    this.undoStack.push({
      description,
      classes: JSON.parse(JSON.stringify(this.db.classes)),
      students: JSON.parse(JSON.stringify(this.db.students)),
    });
    if (this.undoStack.length > 40) {
      this.undoStack.shift();
    }
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public getUndoStackCount(): number {
    return this.undoStack.length;
  }

  public getLastUndoDescription(): string | null {
    if (this.undoStack.length === 0) return null;
    return this.undoStack[this.undoStack.length - 1].description;
  }

  public undo(): string | null {
    if (this.undoStack.length === 0) return null;
    const last = this.undoStack.pop()!;
    this.db.classes = last.classes;
    this.db.students = last.students;
    this.db.lastModified = new Date().toISOString();
    this.saveLocalDatabase(this.db);
    this.notify(`Geri alındı: ${last.description}`);
    return last.description;
  }

  // --- Getters ---
  public getProfile(): TeacherProfile {
    return this.db.profile;
  }

  public getStudents(): Student[] {
    return this.db.students;
  }

  public getClasses(): TeacherClass[] {
    return this.db.classes;
  }

  public getStorageUsageBytes(): number {
    try {
      const dbStr = localStorage.getItem(STORAGE_KEY_DATA) || '';
      return new Blob([dbStr]).size;
    } catch {
      return 18500;
    }
  }

  // --- Classes CRUD ---

  /**
   * Add a single class with undo tracking
   */
  public addClass(classData: Omit<TeacherClass, 'id'>, customDesc?: string): TeacherClass {
    this.pushUndo(customDesc || `${classData.studentName} için yeni ders eklendi`);

    const newClass: TeacherClass = {
      ...classData,
      id: `cls-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      totalEarnings: classData.classFee,
    };

    this.db.classes = [newClass, ...this.db.classes];
    this.db.lastModified = new Date().toISOString();
    this.saveLocalDatabase(this.db);
    this.notify(`${classData.studentName} dersi eklendi`);
    return newClass;
  }

  /**
   * Add class and repeat for all subsequent weeks (e.g. next 4, 8, 12 weeks).
   * Past classes are preserved by default, but user can choose to modify past if requested.
   */
  public addClassWithRecurringWeeks(
    classData: Omit<TeacherClass, 'id'>,
    weeksCount: number = 8,
    modifyPast: boolean = false
  ): TeacherClass[] {
    const seriesId = `series-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const studentName = classData.studentName;

    this.pushUndo(
      `${studentName} için ${weeksCount + 1} haftalık seri ders eklendi`
    );

    const createdClasses: TeacherClass[] = [];
    const baseDate = new Date(classData.date + 'T00:00:00');

    // Create the base class
    const firstClass: TeacherClass = {
      ...classData,
      id: `cls-${Date.now()}-0`,
      totalEarnings: classData.classFee,
      recurringSeriesId: seriesId,
    };
    createdClasses.push(firstClass);

    // Create for all subsequent weeks (7 days, 14 days, 21 days...)
    for (let i = 1; i <= weeksCount; i++) {
      const nextDate = new Date(baseDate);
      nextDate.setDate(nextDate.getDate() + i * 7);
      const dateStr = nextDate.toISOString().split('T')[0];

      createdClasses.push({
        ...classData,
        id: `cls-${Date.now()}-${i}`,
        date: dateStr,
        totalEarnings: classData.classFee,
        recurringSeriesId: seriesId,
      });
    }

    this.db.classes = [...createdClasses, ...this.db.classes];
    this.db.lastModified = new Date().toISOString();
    this.saveLocalDatabase(this.db);
    this.notify(`${studentName} için ${createdClasses.length} haftalık ders planlandı`);
    return createdClasses;
  }

  /**
   * Drag & drop move class with snap to exact 30-min mark
   */
  public moveClass(
    id: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string
  ): boolean {
    const cls = this.db.classes.find((c) => c.id === id);
    if (!cls) return false;

    // Don't record undo if nothing changed
    if (cls.date === newDate && cls.startTime === newStartTime && cls.endTime === newEndTime) {
      return false;
    }

    this.pushUndo(`${cls.studentName} dersi ${newDate} ${newStartTime}'a taşındı`);

    const [startH, startM] = newStartTime.split(':').map(Number);
    const [endH, endM] = newEndTime.split(':').map(Number);
    const durationMinutes = Math.max(30, (endH * 60 + endM) - (startH * 60 + startM));

    cls.date = newDate;
    cls.startTime = newStartTime;
    cls.endTime = newEndTime;
    cls.durationMinutes = durationMinutes;

    this.db.lastModified = new Date().toISOString();
    this.saveLocalDatabase(this.db);
    this.notify(`${cls.studentName} dersi ${newStartTime}'a taşındı`);
    return true;
  }

  public updateClass(id: string, updates: Partial<TeacherClass>): TeacherClass | null {
    const idx = this.db.classes.findIndex((c) => c.id === id);
    if (idx === -1) return null;

    const current = this.db.classes[idx];
    this.pushUndo(`${current.studentName} dersi güncellendi`);

    const classFee = updates.classFee !== undefined ? updates.classFee : current.classFee;
    const totalEarnings = classFee;

    const updated: TeacherClass = {
      ...current,
      ...updates,
      classFee,
      totalEarnings,
    };

    this.db.classes[idx] = updated;
    this.db.lastModified = new Date().toISOString();
    this.saveLocalDatabase(this.db);
    this.notify(`${current.studentName} dersi güncellendi`);
    return updated;
  }

  public deleteClass(id: string): boolean {
    const cls = this.db.classes.find((c) => c.id === id);
    if (!cls) return false;

    this.pushUndo(`${cls.studentName} (${cls.date}) dersi silindi`);
    this.db.classes = this.db.classes.filter((c) => c.id !== id);
    this.db.lastModified = new Date().toISOString();
    this.saveLocalDatabase(this.db);
    this.notify(`${cls.studentName} dersi silindi`);
    return true;
  }

  public batchUpdateClasses(
    classIds: string[],
    updates: Partial<TeacherClass>,
    propagateToSeries: boolean = false
  ): number {
    this.pushUndo(`${classIds.length} ders toplu güncellendi`);

    let affectedCount = 0;
    const targetSeriesIds = new Set<string>();

    if (propagateToSeries) {
      this.db.classes.forEach((cls) => {
        if (classIds.includes(cls.id) && cls.recurringSeriesId) {
          targetSeriesIds.add(cls.recurringSeriesId);
        }
      });
    }

    this.db.classes = this.db.classes.map((cls) => {
      const isDirectMatch = classIds.includes(cls.id);
      const isSeriesMatch =
        propagateToSeries && cls.recurringSeriesId && targetSeriesIds.has(cls.recurringSeriesId);

      if (isDirectMatch || isSeriesMatch) {
        affectedCount++;
        const classFee = updates.classFee !== undefined ? updates.classFee : cls.classFee;
        return {
          ...cls,
          ...updates,
          classFee,
          totalEarnings: classFee,
        };
      }
      return cls;
    });

    this.db.lastModified = new Date().toISOString();
    this.saveLocalDatabase(this.db);
    this.notify(`${affectedCount} ders toplu olarak güncellendi`);
    return affectedCount;
  }

  // --- Students CRUD ---
  public addStudent(studentData: Omit<Student, 'id' | 'joinedDate'>): Student {
    this.pushUndo(`Yeni öğrenci eklendi: ${studentData.name}`);

    const newStudent: Student = {
      ...studentData,
      id: `stud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      joinedDate: new Date().toISOString().split('T')[0],
    };

    this.db.students = [newStudent, ...this.db.students];
    this.db.lastModified = new Date().toISOString();
    this.saveLocalDatabase(this.db);
    this.notify(`${newStudent.name} sisteme eklendi`);
    return newStudent;
  }

  public updateStudent(id: string, updates: Partial<Student>): Student | null {
    const idx = this.db.students.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    this.pushUndo(`Öğrenci güncellendi: ${this.db.students[idx].name}`);
    const updated: Student = {
      ...this.db.students[idx],
      ...updates,
    };

    this.db.students[idx] = updated;

    // Update student name in existing classes if changed
    if (updates.name) {
      this.db.classes = this.db.classes.map((c) =>
        c.studentId === id ? { ...c, studentName: updates.name! } : c
      );
    }

    this.db.lastModified = new Date().toISOString();
    this.saveLocalDatabase(this.db);
    this.notify(`${updated.name} güncellendi`);
    return updated;
  }

  public deleteStudent(id: string): boolean {
    const s = this.db.students.find((item) => item.id === id);
    if (!s) return false;

    this.pushUndo(`Öğrenci silindi: ${s.name}`);
    this.db.students = this.db.students.filter((item) => item.id !== id);
    this.db.classes = this.db.classes.filter((c) => c.studentId !== id);
    this.db.lastModified = new Date().toISOString();
    this.saveLocalDatabase(this.db);
    this.notify(`${s.name} ve ilgili dersleri silindi`);
    return true;
  }

  // --- Profile & Data Reset ---
  public updateProfile(updates: Partial<TeacherProfile>) {
    this.db.profile = { ...this.db.profile, ...updates };
    this.db.lastModified = new Date().toISOString();
    this.saveLocalDatabase(this.db);
    this.notify('Profil güncellendi');
  }

  public resetToSampleData() {
    this.pushUndo('Örnek verilere sıfırlandı');
    this.db = {
      profile: INITIAL_TEACHER_PROFILE,
      students: INITIAL_STUDENTS,
      classes: INITIAL_CLASSES,
      lastModified: new Date().toISOString(),
    };
    this.saveLocalDatabase(this.db);
    this.notify('Veriler ilk haline sıfırlandı');
  }

  public exportDatabaseJson(): string {
    return JSON.stringify(this.db, null, 2);
  }

  public exportDatabaseAsJson(): string {
    return this.exportDatabaseJson();
  }

  public importDatabaseJson(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.students && parsed.classes) {
        this.pushUndo('Yedekten geri yüklendi');
        this.db = {
          profile: parsed.profile || INITIAL_TEACHER_PROFILE,
          students: parsed.students,
          classes: parsed.classes,
          lastModified: new Date().toISOString(),
        };
        this.saveLocalDatabase(this.db);
        this.notify('Yedek başarıyla yüklendi');
        return true;
      }
    } catch (e) {
      console.error('Yedek okuma hatası', e);
    }
    return false;
  }

  public importDatabaseFromJson(jsonStr: string): boolean {
    return this.importDatabaseJson(jsonStr);
  }

  public generateWindowsLauncherScript(): string {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000';
    return `@echo off
:: ========================================================
:: OgretmenMasasi.exe Desktop Standalone Runner
:: ========================================================
title OgretmenMasasi.exe - Ogretmen Calisma Masasi
echo Baslatiliyor: OgretmenMasasi.exe Masaustu Penceresi...

:: Try launching in Chrome/Edge App Mode (Frameless Executable Style)
start "" msedge.exe --app="${currentUrl}" --window-size=1400,900 || start "" chrome.exe --app="${currentUrl}" --window-size=1400,900 || start "" "${currentUrl}"

exit
`;
  }
}

export const syncEngine = new LocalOfflineEngine();
