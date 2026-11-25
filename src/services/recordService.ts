import { supabase, isSupabaseConfigured, SUPABASE_URL } from '../lib/supabase';

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

export interface SyncStatus {
  source: 'supabase' | 'localStorage';
  isConfigured: boolean;
  isConnected: boolean;
  lastError: string | null;
  errorCode: string | null;
  lastSyncedAt: string | null;
}

const LOCAL_STORAGE_KEY = 'pygrade_student_records';

const currentSyncStatus: SyncStatus = {
  source: 'localStorage',
  isConfigured: isSupabaseConfigured,
  isConnected: false,
  lastError: null,
  errorCode: null,
  lastSyncedAt: null,
};

export function getSyncStatus(): SyncStatus {
  return { ...currentSyncStatus };
}

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
 * Menguji koneksi langsung ke tabel student_records di Supabase.
 */
export async function testSupabaseConnection(): Promise<{
  ok: boolean;
  message: string;
  code?: string;
  hint?: string;
}> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      message: 'Klien Supabase belum dikonfigurasi (URL atau Anon Key kosong).',
    };
  }

  try {
    const { error, status } = await supabase
      .from('student_records')
      .select('nim')
      .limit(1);

    if (error) {
      currentSyncStatus.lastError = error.message;
      currentSyncStatus.errorCode = error.code ?? String(status);
      currentSyncStatus.isConnected = false;
      return {
        ok: false,
        code: error.code,
        message: error.message,
        hint: error.hint || (error.code === '42501' ? 'Izin role anon belum diberikan pada tabel student_records atau kebijakan RLS belum aktif.' : undefined),
      };
    }

    currentSyncStatus.isConnected = true;
    currentSyncStatus.lastError = null;
    currentSyncStatus.errorCode = null;
    return {
      ok: true,
      message: `Terhubung sukses ke Supabase (${SUPABASE_URL})`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    currentSyncStatus.lastError = msg;
    currentSyncStatus.isConnected = false;
    return {
      ok: false,
      message: `Error jaringan/koneksi: ${msg}`,
    };
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

  // 1. Simpan salinan ke localStorage browser lokal
  if (existingIndex >= 0) {
    currentList[existingIndex] = updatedRecord;
  } else {
    currentList.unshift(updatedRecord);
  }
  saveLocalRecords(currentList);

  // 2. Simpan ke Supabase jika terkonfigurasi
  if (!isSupabaseConfigured) {
    currentSyncStatus.source = 'localStorage';
    currentSyncStatus.lastError = 'Supabase tidak terkonfigurasi, data disimpan di localStorage.';
    return updatedRecord;
  }

  try {
    const { error, status } = await supabase
      .from('student_records')
      .upsert(updatedRecord, { onConflict: 'nim' });

    if (error) {
      currentSyncStatus.lastError = error.message;
      currentSyncStatus.errorCode = error.code ?? String(status);
      currentSyncStatus.isConnected = false;
      currentSyncStatus.source = 'localStorage';

      console.error('[PyGrade Supabase Upsert Gagal]', {
        kode: error.code,
        pesan: error.message,
        petunjuk: error.hint,
        penjelasan:
          error.code === '42501'
            ? 'Penyebab: Hak akses role "anon" atau RLS policy pada tabel student_records di Supabase belum diizinkan.'
            : error.message,
      });
    } else {
      currentSyncStatus.lastError = null;
      currentSyncStatus.errorCode = null;
      currentSyncStatus.isConnected = true;
      currentSyncStatus.source = 'supabase';
      currentSyncStatus.lastSyncedAt = new Date().toISOString();
      console.info(`[PyGrade Supabase] Berhasil sinkronisasi nilai mahasiswa (${updatedRecord.nim}) ke Cloud Supabase.`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    currentSyncStatus.lastError = msg;
    currentSyncStatus.isConnected = false;
    currentSyncStatus.source = 'localStorage';
    console.warn('[PyGrade Supabase] Perangkat offline, data tersimpan di cache browser lokal:', err);
  }

  return updatedRecord;
}

/**
 * Mengambil seluruh data mahasiswa dari tabel student_records diurutkan
 * berdasarkan updated_at descending (dengan fallback ke localStorage jika offline atau izin ditolak).
 */
export async function fetchAllRecords(): Promise<StudentRecord[]> {
  const result = await fetchRecordsWithStatus();
  return result.records;
}

/**
 * Mengambil seluruh data mahasiswa beserta status sinkronisasi Supabase saat ini.
 */
export async function fetchRecordsWithStatus(): Promise<{
  records: StudentRecord[];
  status: SyncStatus;
}> {
  if (!isSupabaseConfigured) {
    currentSyncStatus.source = 'localStorage';
    currentSyncStatus.lastError = 'Supabase belum dikonfigurasi.';
    return { records: getLocalRecords(), status: { ...currentSyncStatus } };
  }

  try {
    const { data, error, status } = await supabase
      .from('student_records')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      currentSyncStatus.lastError = error.message;
      currentSyncStatus.errorCode = error.code ?? String(status);
      currentSyncStatus.isConnected = false;
      currentSyncStatus.source = 'localStorage';

      console.error('[PyGrade Supabase Select Gagal]', {
        kode: error.code,
        pesan: error.message,
        petunjuk: error.hint,
        penjelasan:
          error.code === '42501'
            ? 'Penyebab: Role "anon" belum memiliki hak SELECT pada tabel public.student_records. Jalankan GRANT SELECT ON public.student_records TO anon.'
            : error.message,
      });

      return { records: getLocalRecords(), status: { ...currentSyncStatus } };
    }

    // Berhasil membaca dari Cloud Supabase
    currentSyncStatus.lastError = null;
    currentSyncStatus.errorCode = null;
    currentSyncStatus.isConnected = true;
    currentSyncStatus.source = 'supabase';
    currentSyncStatus.lastSyncedAt = new Date().toISOString();

    const cloudRecords = (data ?? []) as StudentRecord[];
    // Simpan salinan terbaru dari cloud ke cache browser
    saveLocalRecords(cloudRecords);

    return { records: cloudRecords, status: { ...currentSyncStatus } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    currentSyncStatus.lastError = msg;
    currentSyncStatus.isConnected = false;
    currentSyncStatus.source = 'localStorage';
    console.warn('[PyGrade Supabase] Gagal terhubung ke Cloud Supabase, beralih ke cache lokal:', err);
    return { records: getLocalRecords(), status: { ...currentSyncStatus } };
  }
}
