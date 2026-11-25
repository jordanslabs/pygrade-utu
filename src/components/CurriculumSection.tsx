import { ArrowRight, Award, CheckCircle2, Circle, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import type { Difficulty, Problem } from '../data/problems';
import type { AuthUser } from '../services/authService';

interface CurriculumSectionProps {
  problems: Problem[];
  solvedScores: Record<string, number>;
  onSelectProblem: (problemId: string) => void;
  user: AuthUser | null;
  onOpenCertificate: () => void;
}

function getDifficultyStyle(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'Mudah':
      return 'text-[#0b6e97] bg-[#0b6e97]/10 border-[#0b6e97]/20';
    case 'Sedang':
      return 'text-[#2563c9] bg-[#2563c9]/10 border-[#2563c9]/20';
    case 'Sulit':
      return 'text-[#0f2f63] bg-[#0f2f63]/10 border-[#0f2f63]/20';
  }
}

export function CurriculumSection({
  problems,
  solvedScores,
  onSelectProblem,
  user,
  onOpenCertificate,
}: CurriculumSectionProps) {
  // Hitung jumlah modul yang lulus (syarat: skor >= 70)
  const passedModules = problems.filter((p) => (solvedScores[p.id] ?? 0) >= 70);
  const passedCount = passedModules.length;
  const isEligibleForCertificate = passedCount === problems.length && problems.length > 0;
  const progressPercent = Math.round((passedCount / (problems.length || 1)) * 100);

  return (
    <section
      id="modul"
      aria-labelledby="modul-heading"
      className="rounded-[2rem] bg-[#f4f4f4] border border-[#e6e8ec] px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-10 border-b border-[#e6e8ec]">
        <div className="space-y-3 max-w-2xl">
          <p className="text-sm font-medium text-[#2563c9]">Kurikulum Praktikum Dasar</p>
          <h2
            id="modul-heading"
            className="text-3xl sm:text-4xl lg:text-[2.75rem] font-medium tracking-[-0.025em] text-[#0f2f63] leading-tight"
          >
            Daftar Modul Praktikum Python
          </h2>
        </div>
        <p className="text-sm sm:text-base text-[#0f2f63]/70 max-w-md leading-relaxed">
          Pilih salah satu modul di bawah untuk langsung membuka workspace editor dan menguji
          kode Anda terhadap 1 kasus publik dan 3 kasus uji tersembunyi.
        </p>
      </div>

      {/* Banner Progres e-Sertifikat Praktikum (Khusus Mahasiswa yang Sudah Login) */}
      {user && user.role === 'mahasiswa' && (
        isEligibleForCertificate ? (
          <div className="mt-8 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-emerald-50/50 p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm shrink-0">
                  <Award className="h-6 w-6" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-[#0f2f63]">
                      Selamat! Anda Telah Lulus Praktikum Python
                    </h3>
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                      <Sparkles className="h-3 w-3" />
                      4/4 Modul Selesai
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#0f2f63]/70">
                    Seluruh 4 modul praktikum telah diselesaikan dengan nilai di atas batas kelulusan (&ge; 70).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenCertificate}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0f2f63] to-[#2563c9] hover:from-[#163b78] hover:to-[#3171d8] text-white px-5 py-2.5 text-xs sm:text-sm font-medium shadow-md transition-all hover:scale-[1.02] shrink-0"
              >
                <Award className="h-4 w-4 text-amber-300" />
                <span>Klaim &amp; Lihat e-Sertifikat</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Progress Bar & Module Badges */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between text-xs font-medium text-[#0f2f63]">
                <span className="text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Semua Modul Terpenuhi (100%)
                </span>
                <span className="font-mono text-emerald-800">4 / 4 Modul Lulus</span>
              </div>
              <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: '100%' }}
                />
              </div>

              {/* 4 Module Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {problems.map((p) => {
                  const score = solvedScores[p.id] ?? 0;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 rounded-lg bg-emerald-50/80 border border-emerald-200 px-2.5 py-1.5 text-xs text-emerald-900"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate font-medium">{p.number} ({score})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-[#e6e8ec] bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0f2f63]/5 text-[#0f2f63] border border-[#0f2f63]/10 shrink-0">
                  <Award className="h-5 w-5 text-[#2563c9]" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-base sm:text-lg font-bold text-[#0f2f63]">
                    Progres e-Sertifikat Praktikum Python
                  </h3>
                  <p className="text-xs sm:text-sm text-[#0f2f63]/70">
                    Selesaikan 4 modul dengan skor minimal 70 pada masing-masing modul untuk mendapatkan e-Sertifikat resmi.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-400 px-4 py-2.5 text-xs sm:text-sm font-medium cursor-not-allowed shrink-0"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Selesaikan Semua Modul untuk Klaim e-Sertifikat</span>
              </button>
            </div>

            {/* Progress Bar & Indicators */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between text-xs font-medium text-[#0f2f63]">
                <span className="text-[#0f2f63]/70">
                  Progres Kelulusan ({progressPercent}%)
                </span>
                <span className="font-mono text-[#2563c9]">
                  {passedCount} / {problems.length} Modul Lulus (Skor &ge; 70)
                </span>
              </div>
              <div className="h-2.5 w-full bg-[#f4f4f4] rounded-full overflow-hidden border border-[#e6e8ec]">
                <div
                  className="h-full bg-[#2563c9] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* 4 Module Checklist Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {problems.map((p) => {
                  const score = solvedScores[p.id] ?? 0;
                  const passed = score >= 70;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${
                        passed
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium'
                          : score > 0
                          ? 'bg-amber-50 border border-amber-200 text-amber-900'
                          : 'bg-[#f4f4f4] border border-[#e6e8ec] text-gray-500'
                      }`}
                    >
                      {passed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      )}
                      <span className="truncate">
                        {p.number}: {passed ? `Lulus (${score})` : score > 0 ? `Skor: ${score}` : 'Belum Lulus'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )
      )}

      <div className="mt-8 space-y-3">
        {problems.map((problem) => {
          const score = solvedScores[problem.id];
          const isPassed = score === 100;

          return (
            <button
              key={problem.id}
              type="button"
              onClick={() => onSelectProblem(problem.id)}
              className="group w-full text-left rounded-2xl bg-white border border-[#e6e8ec] px-5 py-6 sm:px-8 sm:py-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2563c9]/40 hover:shadow-[0_12px_32px_-12px_rgba(15,47,99,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563c9]"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-start sm:items-center gap-5 sm:gap-7 min-w-0">
                  <span className="font-mono text-2xl sm:text-3xl font-medium text-[#5790e6] tabular-nums shrink-0 leading-none pt-1 sm:pt-0">
                    {problem.number}
                  </span>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h3 className="text-lg sm:text-xl font-medium text-[#0f2f63] group-hover:text-[#2563c9] transition-colors">
                        {problem.title}
                      </h3>
                      {isPassed && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0b6e97]">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Lulus 100</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#0f2f63]/65 leading-relaxed line-clamp-2 max-w-2xl">
                      {problem.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 sm:gap-6 shrink-0 pl-11 sm:pl-14 md:pl-0">
                  <div className="flex items-center gap-3 text-xs sm:text-sm">
                    <span
                      className={`inline-flex items-center rounded-md border px-2.5 py-1 font-medium whitespace-nowrap ${getDifficultyStyle(
                        problem.difficulty
                      )}`}
                    >
                      {problem.difficulty}
                    </span>
                    <span className="text-[#0f2f63]/65 whitespace-nowrap tabular-nums">
                      {problem.testCases.length} Test Cases
                    </span>
                  </div>

                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e6e8ec] text-[#0f2f63] group-hover:border-[#2563c9] group-hover:bg-[#2563c9] group-hover:text-white transition-colors duration-150 shrink-0">
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
