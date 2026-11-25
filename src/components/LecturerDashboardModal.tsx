import { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Cpu,
  Download,
  GraduationCap,
  RefreshCw,
  Search,
  Server,
  Sliders,
  Users,
  X,
} from 'lucide-react';
import { fetchAllRecords, type StudentRecord } from '../services/recordService';

interface LecturerDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  executionMode: 'local' | 'backend';
  onExecutionModeChange: (mode: 'local' | 'backend') => void;
  backendUrl: string;
  onBackendUrlChange: (url: string) => void;
}

export function LecturerDashboardModal({
  isOpen,
  onClose,
  executionMode,
  onExecutionModeChange,
  backendUrl,
  onBackendUrlChange,
}: LecturerDashboardModalProps) {
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEngineConfigOpen, setIsEngineConfigOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllRecords();
      setRecords(data);
    } catch {
      // Fallback already handled inside fetchAllRecords
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter records by search query
  const filteredRecords = records.filter((r) => {
    const q = searchQuery.toLowerCase();
    return r.nama.toLowerCase().includes(q) || r.nim.toLowerCase().includes(q);
  });

  // Calculate stats
  const totalStudents = records.length;
  const avgPracticalScore =
    totalStudents > 0
      ? Math.round(records.reduce((acc, r) => acc + r.rata_rata, 0) / totalStudents)
      : 0;

  const susRecords = records.filter((r) => r.skor_sus !== null && r.skor_sus !== undefined);
  const avgSusScore =
    susRecords.length > 0
      ? Number((susRecords.reduce((acc, r) => acc + (r.skor_sus ?? 0), 0) / susRecords.length).toFixed(1))
      : null;

  const handleDownloadCsv = () => {
    if (records.length === 0) {
      setNotice('Belum ada data mahasiswa untuk diunduh.');
      return;
    }

    const headers = [
      'NIM',
      'Nama Mahasiswa',
      'Modul 01',
      'Modul 02',
      'Modul 03',
      'Modul 04',
      'Rata-Rata Nilai',
      'Skor SUS',
      'Grade SUS',
      'Terakhir Diperbarui',
    ];

    const rows = records.map((r) => [
      `"${r.nim}"`,
      `"${r.nama.replace(/"/g, '""')}"`,
      r.modul_1,
      r.modul_2,
      r.modul_3,
      r.modul_4,
      r.rata_rata,
      r.skor_sus !== null ? r.skor_sus : '',
      `"${r.grade_sus ?? ''}"`,
      `"${new Date(r.updated_at).toLocaleString('id-ID')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `rekap_praktikum_dan_sus_utu_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotice('File rekap CSV berhasil diunduh.');
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lecturer-dashboard-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#081730]/80 p-2 sm:p-4 animate-overlay-fade"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-modal-enter flex flex-col w-full max-w-[1300px] h-[92vh] rounded-[1.5rem] bg-white shadow-2xl border border-[#e6e8ec] overflow-hidden">
        {/* Header */}
        <div className="bg-[#0f2f63] text-white px-5 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-xs font-mono text-[#8fb8f3]">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              <span>Panel Dosen &amp; Penguji Riset · Universitas Teuku Umar</span>
            </div>
            <h2
              id="lecturer-dashboard-title"
              className="text-lg sm:text-2xl font-medium text-white truncate"
            >
              Dashboard Rekap Praktikum &amp; Evaluasi SUS
            </h2>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsEngineConfigOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/20 transition-colors"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Konfigurasi Engine</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup dashboard dosen"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Engine Configuration Dropdown Drawer (Specifically for Lecturer/Examiner) */}
        {isEngineConfigOpen && (
          <div className="bg-[#f4f4f4] border-b border-[#e6e8ec] px-5 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs text-[#0f2f63]">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-semibold text-xs text-[#0f2f63] flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-[#2563c9]" />
                Mode Eksekusi Mahasiswa:
              </span>

              <div className="flex items-center gap-1 rounded-lg bg-white p-1 border border-[#e6e8ec]">
                <button
                  type="button"
                  onClick={() => onExecutionModeChange('local')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    executionMode === 'local'
                      ? 'bg-[#2563c9] text-white shadow-xs'
                      : 'text-[#0f2f63]/70 hover:text-[#0f2f63]'
                  }`}
                >
                  Sandbox Browser Lokal (Default)
                </button>
                <button
                  type="button"
                  onClick={() => onExecutionModeChange('backend')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    executionMode === 'backend'
                      ? 'bg-[#0b6e97] text-white shadow-xs'
                      : 'text-[#0f2f63]/70 hover:text-[#0f2f63]'
                  }`}
                >
                  Backend FastAPI + Docker
                </button>
              </div>
            </div>

            {executionMode === 'backend' && (
              <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                <Server className="h-3.5 w-3.5 text-[#0b6e97] shrink-0" />
                <label htmlFor="lecturer-backend-url" className="font-medium whitespace-nowrap">
                  Endpoint:
                </label>
                <input
                  id="lecturer-backend-url"
                  type="url"
                  value={backendUrl}
                  onChange={(e) => onBackendUrlChange(e.target.value)}
                  className="flex-1 max-w-sm rounded-md border border-[#e6e8ec] bg-white px-2.5 py-1 font-mono text-xs text-[#0f2f63] focus:outline-none focus:ring-2 focus:ring-[#2563c9]"
                />
              </div>
            )}
          </div>
        )}

        {/* Dashboard Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
          {notice && (
            <div className="rounded-xl border border-[#5790e6]/40 bg-[#eaf1fd] px-4 py-2.5 text-xs text-[#0f2f63] flex items-center justify-between">
              <span>{notice}</span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="text-[#0f2f63]/50 hover:text-[#0f2f63]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Stats Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-[#e6e8ec] bg-[#f4f4f4]/60 p-5 space-y-1">
              <div className="flex items-center justify-between text-[#0f2f63]/60 text-xs">
                <span>Total Mahasiswa Terdaftar</span>
                <Users className="h-4 w-4 text-[#2563c9]" />
              </div>
              <p className="text-3xl sm:text-4xl font-medium text-[#0f2f63] tabular-nums">
                {totalStudents}
              </p>
              <p className="text-[11px] text-[#0f2f63]/55">Tersinkronisasi dengan Supabase</p>
            </div>

            <div className="rounded-2xl border border-[#e6e8ec] bg-[#f4f4f4]/60 p-5 space-y-1">
              <div className="flex items-center justify-between text-[#0f2f63]/60 text-xs">
                <span>Rata-Rata Nilai Praktikum</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-3xl sm:text-4xl font-medium text-[#0f2f63] tabular-nums">
                {avgPracticalScore} <span className="text-sm text-[#0f2f63]/50">/ 100</span>
              </p>
              <p className="text-[11px] text-[#0f2f63]/55">Rata-rata 4 modul tugas coding</p>
            </div>

            <div className="rounded-2xl border border-[#e6e8ec] bg-[#f4f4f4]/60 p-5 space-y-1">
              <div className="flex items-center justify-between text-[#0f2f63]/60 text-xs">
                <span>Rata-Rata Skor Usability (SUS)</span>
                <Award className="h-4 w-4 text-[#5790e6]" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl sm:text-4xl font-medium text-[#0f2f63] tabular-nums">
                  {avgSusScore !== null ? avgSusScore : '-'}
                </p>
                {avgSusScore !== null && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                      avgSusScore >= 68
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {avgSusScore >= 68 ? 'Acceptable' : 'Under Threshold'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#0f2f63]/55">
                {susRecords.length} responden telah mengisi kuesioner
              </p>
            </div>
          </div>

          {/* Action & Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#0f2f63]/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan Nama atau NIM..."
                className="w-full rounded-xl border border-[#e6e8ec] bg-white pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#0f2f63] focus:outline-none focus:ring-2 focus:ring-[#2563c9]"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={loadData}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-[#e6e8ec] bg-white px-4 py-2.5 text-xs sm:text-sm font-medium text-[#0f2f63] hover:bg-[#f4f4f4] transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? 'animate-spin text-[#2563c9]' : ''}`}
                />
                <span>Refresh Data</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCsv}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563c9] px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-medium text-white hover:bg-[#1d52ad] transition-colors shadow-sm"
              >
                <Download className="h-4 w-4" />
                <span>Unduh Rekap (.CSV)</span>
              </button>
            </div>
          </div>

          {/* Student Records Table */}
          <div className="rounded-2xl border border-[#e6e8ec] bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#f4f4f4] border-b border-[#e6e8ec] text-[#0f2f63]/75 font-semibold text-xs">
                  <tr>
                    <th scope="col" className="py-3 px-4">
                      No
                    </th>
                    <th scope="col" className="py-3 px-4">
                      NIM
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Nama Mahasiswa
                    </th>
                    <th scope="col" className="py-3 px-4 text-center">
                      Modul 01
                    </th>
                    <th scope="col" className="py-3 px-4 text-center">
                      Modul 02
                    </th>
                    <th scope="col" className="py-3 px-4 text-center">
                      Modul 03
                    </th>
                    <th scope="col" className="py-3 px-4 text-center">
                      Modul 04
                    </th>
                    <th scope="col" className="py-3 px-4 text-center">
                      Rata-Rata
                    </th>
                    <th scope="col" className="py-3 px-4 text-center">
                      Skor SUS
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Waktu Update
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e8ec]">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-[#0f2f63]/50">
                        {isLoading
                          ? 'Sedang memuat data dari Supabase...'
                          : searchQuery
                          ? 'Tidak ada mahasiswa yang cocok dengan kata kunci pencarian.'
                          : 'Belum ada data mahasiswa yang tersimpan. Data akan otomatis masuk saat mahasiswa mengerjakan modul atau mengisi kuesioner SUS.'}
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r, idx) => (
                      <tr key={r.nim} className="hover:bg-[#f4f4f4]/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs text-[#0f2f63]/60">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-[#0f2f63]">
                          {r.nim}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#0f2f63]">{r.nama}</td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                              r.modul_1 === 100
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.modul_1 > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'text-[#0f2f63]/40'
                            }`}
                          >
                            {r.modul_1}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                              r.modul_2 === 100
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.modul_2 > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'text-[#0f2f63]/40'
                            }`}
                          >
                            {r.modul_2}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                              r.modul_3 === 100
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.modul_3 > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'text-[#0f2f63]/40'
                            }`}
                          >
                            {r.modul_3}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                              r.modul_4 === 100
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.modul_4 > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'text-[#0f2f63]/40'
                            }`}
                          >
                            {r.modul_4}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-[#0f2f63]">
                          {r.rata_rata}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          {r.skor_sus !== null ? (
                            <span
                              className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                                (r.skor_sus ?? 0) >= 68
                                  ? 'bg-blue-100 text-blue-900'
                                  : 'bg-rose-100 text-rose-900'
                              }`}
                            >
                              {r.skor_sus} {r.grade_sus ? `(${r.grade_sus})` : ''}
                            </span>
                          ) : (
                            <span className="text-xs text-[#0f2f63]/30">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#0f2f63]/60">
                          {new Date(r.updated_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: 'short',
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
