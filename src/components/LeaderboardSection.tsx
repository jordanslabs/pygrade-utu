import { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Crown,
  Medal,
  RefreshCw,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import {
  fetchRecordsWithStatus,
  type StudentRecord,
  type SyncStatus,
} from '../services/recordService';

interface LeaderboardSectionProps {
  currentStudentNim?: string;
  refreshTrigger?: number;
}

export function LeaderboardSection({
  currentStudentNim,
  refreshTrigger,
}: LeaderboardSectionProps) {
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const { records: data, status } = await fetchRecordsWithStatus();
      setSyncStatus(status);

      // Urutkan: rata_rata tertinggi descending, tie-breaker: updated_at tercepat ascending
      const sorted = [...data].sort((a, b) => {
        if (b.rata_rata !== a.rata_rata) {
          return b.rata_rata - a.rata_rata;
        }
        return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      });

      setRecords(sorted);
      setLastRefreshed(new Date());
    } catch (e) {
      console.warn('Gagal memuat papan peringkat:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [refreshTrigger]);

  // Fungsi penyamaran NIM untuk privasi audiens kelas / proyektor
  const maskNim = (nim: string, isSelf: boolean): string => {
    if (isSelf) return nim;
    if (nim.length >= 8) {
      return `${nim.slice(0, 6)}***${nim.slice(-3)}`;
    }
    if (nim.length > 4) {
      return `${nim.slice(0, 3)}***${nim.slice(-2)}`;
    }
    return `${nim}***`;
  };

  // Fungsi penyamaran nama untuk proyektor kelas
  const maskName = (name: string, isSelf: boolean): string => {
    if (isSelf) return name;
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].length > 3 ? `${parts[0].slice(0, 3)}***` : parts[0];
    }
    const first = parts[0];
    const secondInitial = parts[1][0] ?? '';
    return `${first} ${secondInitial}***`;
  };

  const top10 = records.slice(0, 10);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-white shadow-sm ring-2 ring-amber-200">
            <Crown className="h-4 w-4" />
          </span>
        );
      case 2:
        return (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-800 shadow-sm ring-2 ring-slate-200">
            <Medal className="h-4 w-4" />
          </span>
        );
      case 3:
        return (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-sm ring-2 ring-amber-400/40">
            <Award className="h-4 w-4" />
          </span>
        );
      default:
        return (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#0f2f63]/5 font-mono text-xs font-semibold text-[#0f2f63]">
            {rank}
          </span>
        );
    }
  };

  return (
    <section
      id="leaderboard"
      aria-labelledby="leaderboard-heading"
      className="rounded-[2rem] bg-white border border-[#e6e8ec] px-5 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16 shadow-xs"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#e6e8ec]">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2563c9]">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span>Papan Peringkat Real-Time</span>
          </div>
          <h2
            id="leaderboard-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight text-[#0f2f63]"
          >
            Papan Peringkat Praktikum Kelas
          </h2>
          <p className="text-xs sm:text-sm text-[#0f2f63]/70 leading-relaxed">
            Daftar 10 mahasiswa terbaik berdasarkan nilai rata-rata modul praktikum Python dan
            kecepatan penyelesaian tugas. Data tersinkronisasi otomatis dari database cloud Supabase.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {syncStatus && (
            <div className="text-[11px] text-[#0f2f63]/60 hidden sm:block text-right">
              <span className="block font-medium">
                {syncStatus.source === 'supabase' && syncStatus.isConnected
                  ? '🟢 Live Cloud Supabase'
                  : '🟡 Penyimpanan Lokal'}
              </span>
              <span className="text-[10px] font-mono">
                Update: {lastRefreshed.toLocaleTimeString('id-ID')}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={loadLeaderboard}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#e6e8ec] bg-white px-4 py-2 text-xs sm:text-sm font-medium text-[#0f2f63] hover:bg-[#f4f4f4] transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-[#2563c9]' : ''}`}
            />
            <span>Perbarui Peringkat</span>
          </button>
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="mt-6">
        {top10.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e6e8ec] bg-[#f4f4f4]/40 p-8 sm:p-12 text-center space-y-2">
            <Users className="h-8 w-8 text-[#0f2f63]/30 mx-auto" />
            <p className="text-sm font-medium text-[#0f2f63]">
              Belum ada data praktikum yang tercatat
            </p>
            <p className="text-xs text-[#0f2f63]/60 max-w-sm mx-auto">
              Selesaikan modul pertama pada editor Python untuk memunculkan peringkat Anda di papan ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#e6e8ec]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#f4f4f4] text-[#0f2f63]/75 font-medium border-b border-[#e6e8ec]">
                <tr>
                  <th scope="col" className="px-4 py-3.5 text-center w-16">
                    Posisi
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Mahasiswa (Identitas Terproteksi)
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center">
                    Modul Lulus
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center">
                    Rata-Rata Nilai
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right hidden md:table-cell">
                    Waktu Selesai
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6e8ec] bg-white">
                {top10.map((record, index) => {
                  const rank = index + 1;
                  const isSelf = Boolean(
                    currentStudentNim && record.nim === currentStudentNim
                  );

                  // Hitung jumlah modul yang lulus (skor >= 70)
                  const passedModulesCount = [
                    record.modul_1,
                    record.modul_2,
                    record.modul_3,
                    record.modul_4,
                  ].filter((s) => s >= 70).length;

                  return (
                    <tr
                      key={record.nim}
                      className={`transition-colors ${
                        isSelf
                          ? 'bg-[#eaf1fd]/70 font-medium'
                          : rank <= 3
                          ? 'hover:bg-amber-50/30'
                          : 'hover:bg-[#f4f4f4]/60'
                      }`}
                    >
                      {/* Peringkat */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center">
                          {getRankBadge(rank)}
                        </div>
                      </td>

                      {/* Nama & NIM */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-[#0f2f63] truncate">
                                {maskName(record.nama, isSelf)}
                              </span>
                              {isSelf && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-[#2563c9] px-2 py-0.5 text-[10px] font-semibold text-white">
                                  <Sparkles className="h-2.5 w-2.5" />
                                  Anda
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[11px] text-[#0f2f63]/60 block">
                              NIM: {maskNim(record.nim, isSelf)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Modul Lulus */}
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="font-medium text-xs text-[#0f2f63]">
                            {passedModulesCount} / 4
                          </span>
                          <div className="flex items-center gap-1">
                            {[record.modul_1, record.modul_2, record.modul_3, record.modul_4].map(
                              (s, i) => (
                                <span
                                  key={i}
                                  title={`Modul 0${i + 1}: ${s} poin`}
                                  className={`h-2 w-2 rounded-full ${
                                    s >= 70
                                      ? 'bg-emerald-500'
                                      : s > 0
                                      ? 'bg-amber-400'
                                      : 'bg-gray-200'
                                  }`}
                                />
                              )
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Skor Rata-Rata */}
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`font-mono text-base sm:text-lg font-bold tabular-nums ${
                              record.rata_rata >= 85
                                ? 'text-emerald-700'
                                : record.rata_rata >= 70
                                ? 'text-[#2563c9]'
                                : 'text-amber-700'
                            }`}
                          >
                            {record.rata_rata}
                          </span>
                          <span className="text-[10px] text-gray-400">/100</span>
                        </div>
                      </td>

                      {/* Waktu Selesai */}
                      <td className="px-4 py-3 text-right hidden md:table-cell text-xs text-[#0f2f63]/60 font-mono">
                        {new Date(record.updated_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#0f2f63]/60 px-1">
          <p>
            *Identitas NIM dan nama mahasiswa disamarkan untuk menjaga privasi akademik saat ditampilkan pada proyektor presentasi kelas.
          </p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Lulus (&ge; 70)
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Perlu Remedial
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-gray-200" />
              Belum Dikerjakan
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
