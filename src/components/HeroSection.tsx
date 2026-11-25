import { ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { Navbar } from './Navbar';
import type { AuthUser, UserRole } from '../services/authService';

interface HeroSectionProps {
  user: AuthUser | null;
  onOpenAuth: (role?: UserRole) => void;
  onLogout: () => void;
  onOpenLecturerDashboard: () => void;
  onOpenGrader: (problemId?: string) => void;
  onOpenSus: () => void;
  isMenuOpen: boolean;
  onToggleMenu: (open: boolean) => void;
  solvedCount: number;
  totalProblems: number;
  isEligibleForCertificate?: boolean;
  onOpenCertificate?: () => void;
}

export function HeroSection({
  user,
  onOpenAuth,
  onLogout,
  onOpenLecturerDashboard,
  onOpenGrader,
  onOpenSus,
  isMenuOpen,
  onToggleMenu,
  solvedCount,
  totalProblems,
  isEligibleForCertificate,
  onOpenCertificate,
}: HeroSectionProps) {
  return (
    <section
      aria-label="Hero PyGrade UTU"
      className="relative overflow-hidden rounded-[2rem] bg-[#0f2f63] text-white min-h-[600px] lg:min-h-[680px] flex flex-col justify-between"
    >
      {/* Subtle architectural grid lines & depth lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 88% 8%, rgba(37, 99, 201, 0.34), transparent 46%), radial-gradient(circle at 28% 96%, rgba(11, 110, 151, 0.28), transparent 44%)',
        }}
      />

      {/* Transparent Header inside Hero card */}
      <Navbar
        user={user}
        onOpenAuth={onOpenAuth}
        onLogout={onLogout}
        onOpenLecturerDashboard={onOpenLecturerDashboard}
        onOpenGrader={onOpenGrader}
        onOpenSus={onOpenSus}
        isMenuOpen={isMenuOpen}
        onToggleMenu={onToggleMenu}
        isEligibleForCertificate={isEligibleForCertificate}
        onOpenCertificate={onOpenCertificate}
      />

      {/* Main Editorial Hero Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-between px-6 pt-10 pb-8 sm:px-10 sm:pt-14 sm:pb-12 lg:px-14 lg:pt-16 lg:pb-14 gap-12">
        <div className="max-w-4xl space-y-6">
          <p className="text-xs sm:text-sm text-[#8fb8f3] font-normal tracking-wide">
            Program Studi Teknologi Informasi · Fakultas Teknik · Universitas Teuku Umar
          </p>

          <h1
            className="text-5xl sm:text-7xl lg:text-[5.5rem] font-medium leading-[0.98] tracking-[-0.03em] text-white"
            style={{ textWrap: 'balance' }}
          >
            CODE. TEST. PASS.
          </h1>

          <div className="max-w-2xl space-y-3 pt-2">
            <p className="text-xl sm:text-2xl font-medium text-white/95 leading-snug">
              Umpan Balik Instan, Belajar Lebih Mandiri
            </p>
            <p className="text-sm sm:text-base text-white/75 leading-relaxed max-w-xl">
              Platform praktikum pemrograman Python terisolasi berbasis evaluasi test case
              otomatis. Dirancang khusus untuk membantu mahasiswa Teknologi Informasi UTU
              memvalidasi logika program secara objektif, cepat, dan terukur.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => onOpenGrader('modul-01')}
              className="group inline-flex items-center gap-3 rounded-full bg-[#2563c9] px-7 py-3.5 text-sm sm:text-base font-medium text-white hover:bg-[#3171d8] transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5790e6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f2f63]"
            >
              <span>Mulai Praktikum Sekarang</span>
              <ArrowRight
                className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </button>

            <a
              href="#modul"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white transition-colors whitespace-nowrap"
            >
              <span>Lihat 4 Modul Soal</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Bottom row: Left progress text + Right Glassmorphism Status Card */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:text-sm text-white/65">
            <span>Python 3 Standard I/O</span>
            <span aria-hidden="true">·</span>
            <span>Evaluasi 1 Publik + 3 Hidden Test Cases</span>
            {solvedCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#8fb8f3] font-medium tabular-nums">
                  Progres Sesi: {solvedCount}/{totalProblems} Modul Lulus
                </span>
              </>
            )}
          </div>

          {/* Glassmorphism Status Card in bottom corner */}
          <div className="w-full lg:w-[440px] rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-md p-5 sm:p-6">
            <div className="grid grid-cols-2 gap-4 pb-5 border-b border-white/15">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[#8fb8f3]">
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="text-xs font-normal">Akurasi Penilaian</span>
                </div>
                <p className="text-lg sm:text-xl font-medium text-white tabular-nums">
                  100% Terverifikasi
                </p>
                <p className="text-xs text-white/65">Berbasis Test-Case</p>
              </div>

              <div className="space-y-1.5 border-l border-white/15 pl-4">
                <div className="flex items-center gap-2 text-[#8fb8f3]">
                  <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="text-xs font-normal">Kecepatan Mesin</span>
                </div>
                <p className="text-lg sm:text-xl font-medium text-white tabular-nums">
                  0.2s Rata-rata
                </p>
                <p className="text-xs text-white/65">Evaluasi Sandbox</p>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-white/65">Siap mencoba soal perdana?</p>
                <p className="text-sm font-medium text-white truncate">
                  Modul 01 · Variabel &amp; Operator
                </p>
              </div>
              <a
                href="#modul"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenGrader('modul-01');
                }}
                className="group inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-xs font-medium text-white hover:bg-white hover:text-[#0f2f63] transition-colors duration-150 whitespace-nowrap shrink-0"
              >
                <span>Buka Soal</span>
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
