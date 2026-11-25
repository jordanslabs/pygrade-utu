-- ==============================================================================
-- PyGrade UTU - Skema Database & Kebijakan Hak Akses (RLS) Supabase
-- Tabel: public.student_records
-- ==============================================================================
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Buat Tabel student_records jika belum ada
CREATE TABLE IF NOT EXISTS public.student_records (
    nim VARCHAR(50) PRIMARY KEY,
    nama VARCHAR(255) NOT NULL DEFAULT 'Mahasiswa',
    modul_1 INT4 NOT NULL DEFAULT 0,
    modul_2 INT4 NOT NULL DEFAULT 0,
    modul_3 INT4 NOT NULL DEFAULT 0,
    modul_4 INT4 NOT NULL DEFAULT 0,
    rata_rata INT4 NOT NULL DEFAULT 0,
    skor_sus NUMERIC(5, 2) DEFAULT NULL,
    grade_sus VARCHAR(10) DEFAULT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Pastikan hak akses dasar tabel diberikan kepada role anon dan authenticated
-- Ini adalah penyebab utama error Postgres 42501 (permission denied for table student_records)
GRANT ALL ON TABLE public.student_records TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE public.student_records ENABLE ROW LEVEL SECURITY;

-- 4. Hapus kebijakan lama jika ada (idempoten)
DROP POLICY IF EXISTS "Public student_records select" ON public.student_records;
DROP POLICY IF EXISTS "Public student_records insert" ON public.student_records;
DROP POLICY IF EXISTS "Public student_records update" ON public.student_records;
DROP POLICY IF EXISTS "Public student_records delete" ON public.student_records;

-- 5. Buat kebijakan RLS untuk akses publik (anon & authenticated)
-- Izinkan siapapun membaca data rekap nilai praktikum dan evaluasi SUS
CREATE POLICY "Public student_records select"
ON public.student_records
FOR SELECT
TO anon, authenticated
USING (true);

-- Izinkan mahasiswa mengirim/menyimpan nilai baru (INSERT)
CREATE POLICY "Public student_records insert"
ON public.student_records
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Izinkan mahasiswa memperbarui nilai modul atau skor SUS (UPDATE / UPSERT)
CREATE POLICY "Public student_records update"
ON public.student_records
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Izinkan dosen atau admin menghapus record jika diperlukan (DELETE)
CREATE POLICY "Public student_records delete"
ON public.student_records
FOR DELETE
TO anon, authenticated
USING (true);

-- ==============================================================================
-- Verifikasi: Pastikan role anon dapat mengakses tabel
-- ==============================================================================
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'student_records';
