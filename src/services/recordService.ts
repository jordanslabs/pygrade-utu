import { supabase } from '../lib/supabase';

export interface StudentRecord {
  nim: string;
  nama: string;
  modul_1: number;
  modul_2: number;
  modul_3: number;
  modul_4: number;
  rata_rata: number;
  skor_sus: number | null;
  grade_sus: string | null;
  updated_at: string;
}

const LOCAL_STORAGE_KEY = 'pygrade_student_records';

export function getLocalRecords(): StudentRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalRecords(records: StudentRecord[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.warn('Gagal menyimpan cache lokal student_records:', e);
  }
}

/**
 * Melakukan upsert data mahasiswa ke tabel student_records di Supabase
 * sekaligus menyimpan salinan cadangannya ke localStorage.
 */
export async function upsertStudentRecord(
  record: Partial<StudentRecord> & { nim: string; nama?: string }
): Promise<StudentRecord> {
  const currentList = getLocalRecords();
  const existingIndex = currentList.findIndex((r) => r.nim === record.nim);
  const existing = existingIndex >= 0 ? currentList[existingIndex] : null;

  const m1 = record.modul_1 !== undefined ? record.modul_1 : (existing?.modul_1 ?? 0);
  const m2 = record.modul_2 !== undefined ? record.modul_2 : (existing?.modul_2 ?? 0);
  const m3 = record.modul_3 !== undefined ? record.modul_3 : (existing?.modul_3 ?? 0);
  const m4 = record.modul_4 !== undefined ? record.modul_4 : (existing?.modul_4 ?? 0);
  const rata_rata = Math.round((m1 + m2 + m3 + m4) / 4);

  const updatedRecord: StudentRecord = {
    nim: record.nim,
    nama: record.nama ?? existing?.nama ?? 'Mahasiswa',
    modul_1: m1,
    modul_2: m2,
    modul_3: m3,
    modul_4: m4,
    rata_rata,
    skor_sus: record.skor_sus !== undefined ? record.skor_sus : (existing?.skor_sus ?? null),
    grade_sus: record.grade_sus !== undefined ? record.grade_sus : (existing?.grade_sus ?? null),
    updated_at: new Date().toISOString(),
  };

  // 1. Simpan salinan ke localStorage
  if (existingIndex >= 0) {
    currentList[existingIndex] = updatedRecord;
  } else {
    currentList.unshift(updatedRecord);
  }
  saveLocalRecords(currentList);

  // 2. Simpan ke Supabase (dengan graceful error handling jika offline)
  try {
    const { error } = await supabase
      .from('student_records')
      .upsert(updatedRecord, { onConflict: 'nim' });

    if (error) {
      console.warn('Peringatan Supabase upsert:', error.message);
    }
  } catch (err) {
    console.warn('Koneksi Supabase offline, data tersimpan di penyimpanan lokal:', err);
  }

  return updatedRecord;
}

/**
 * Mengambil seluruh data mahasiswa dari tabel student_records diurutkan
 * berdasarkan updated_at descending (dengan fallback ke localStorage jika offline).
 */
export async function fetchAllRecords(): Promise<StudentRecord[]> {
  try {
    const { data, error } = await supabase
      .from('student_records')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data && data.length > 0) {
      saveLocalRecords(data as StudentRecord[]);
      return data as StudentRecord[];
    }
  } catch (err) {
    console.warn('Gagal terhubung ke Supabase, menggunakan data lokal:', err);
  }

  return getLocalRecords();
}
