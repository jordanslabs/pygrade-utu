import { useEffect } from 'react';
import {
  ArrowUpRight,
  Award,
  Code2,
  GraduationCap,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { AuthUser, UserRole } from '../services/authService';

interface NavbarProps {
  user: AuthUser | null;
  onOpenAuth: (role?: UserRole) => void;
  onLogout: () => void;
  onOpenLecturerDashboard: () => void;
  onOpenGrader: (problemId?: string) => void;
  onOpenSus: () => void;
  isMenuOpen: boolean;
  onToggleMenu: (open: boolean) => void;
  isEligibleForCertificate?: boolean;
  onOpenCertificate?: () => void;
}

export function Navbar({
  user,
  onOpenAuth,
  onLogout,
  onOpenLecturerDashboard,
  onOpenGrader,
  onOpenSus,
  isMenuOpen,
  onToggleMenu,
  isEligibleForCertificate = false,
  onOpenCertificate,
}: NavbarProps) {
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onToggleMenu(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isMenuOpen, onToggleMenu]);

  const navLinks = [
    { label: 'Modul', href: '#modul' },
    { label: 'Peringkat', href: '#leaderboard' },
    { label: 'Arsitektur', href: '#arsitektur' },
    { label: 'Evaluasi', href: '#evaluasi' },
  ];

  return (
    <>
      <header className="relative z-20 flex items-center justify-between gap-2 sm:gap-4 px-3.5 py-3.5 sm:px-8 lg:px-10 xl:px-12 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        {/* Kolom 1 (Kiri): Navigasi desktop halus */}
        <nav
          aria-label="Navigasi utama"
          className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-normal text-white/80 min-w-0 justify-start"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap shrink-0 py-1 text-white/80 hover:text-white transition-colors duration-150 border-b border-transparent hover:border-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5790e6] rounded-xs"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Kolom 2 (Tengah): Logo terminal < > + PYGRADE (bebas overlap) */}
        <div className="flex items-center lg:justify-center shrink-0">
          <a
            href="#"
            className="flex items-center gap-1.5 sm:gap-2.5 text-white whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5790e6] rounded-md px-1"
            aria-label="PyGrade UTU Beranda"
          >
            <span className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-[#5790e6]">
              <Code2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            </span>
            <span className="text-xs sm:text-base uppercase tracking-[0.15em] sm:tracking-[0.2em] font-medium text-white">
              PYGRADE
            </span>
          </a>
        </div>

        {/* Kolom 3 (Kanan): Profil/Login User + Tombol Mulai Coding + Menu Layar Penuh */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0 min-w-0 ml-auto lg:ml-0">
          {/* Status Login User */}
          {!user ? (
            <button
              type="button"
              onClick={() => onOpenAuth('mahasiswa')}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-medium text-white hover:bg-white/20 transition-colors whitespace-nowrap shrink-0"
            >
              <LogIn className="h-3.5 w-3.5 text-[#8fb8f3]" />
              <span>Masuk / Login</span>
            </button>
          ) : user.role === 'mahasiswa' ? (
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0">
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs text-white max-w-[150px] sm:max-w-[200px] lg:max-w-[240px] xl:max-w-none min-w-0">
                <GraduationCap className="h-3.5 w-3.5 text-[#5790e6] shrink-0" />
                <span className="font-medium max-w-[80px] sm:max-w-[100px] lg:max-w-[120px] xl:max-w-[130px] truncate">
                  {user.nama}
                </span>
                <span className="opacity-65 font-mono text-[10px] sm:text-[11px] hidden xl:inline shrink-0">
                  ({user.nim})
                </span>
              </div>

              {isEligibleForCertificate && onOpenCertificate && (
                <button
                  type="button"
                  onClick={onOpenCertificate}
                  title="Klaim & Lihat e-Sertifikat Kelulusan"
                  className="inline-flex items-center gap-1 rounded-full border border-amber-300/40 bg-amber-400/20 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-400/30 transition-colors shadow-xs shrink-0"
                >
                  <Award className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                  <span className="hidden min-[480px]:inline">e-Sertifikat</span>
                </button>
              )}

              <button
                type="button"
                onClick={onLogout}
                title="Keluar dari sesi"
                className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs text-white/80 hover:bg-rose-500/20 hover:text-rose-200 hover:border-rose-400/40 transition-colors shrink-0"
              >
                <LogOut className="h-3 w-3 shrink-0" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0">
              <button
                type="button"
                onClick={onOpenLecturerDashboard}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#2563c9] px-3 py-1.5 sm:px-3.5 sm:py-1.5 text-xs sm:text-sm font-medium text-white hover:bg-[#3171d8] transition-colors shadow-sm whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                <span>Dashboard Rekap</span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                title="Keluar dari sesi dosen"
                className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs text-white/80 hover:bg-rose-500/20 hover:text-rose-200 hover:border-rose-400/40 transition-colors shrink-0"
              >
                <LogOut className="h-3 w-3 shrink-0" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          )}

          {/* Sembunyikan "Mulai Coding" pada layar mobile karena sudah ada tombol utama di Hero Section */}
          <button
            type="button"
            onClick={() => onOpenGrader()}
            className="group hidden sm:inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[#0f2f63] hover:bg-[#eaf1fd] transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5790e6]"
          >
            <span>Mulai Coding</span>
            <ArrowUpRight
              className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={() => onToggleMenu(true)}
            aria-label="Buka menu navigasi layar penuh"
            aria-expanded={isMenuOpen}
            className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/15 transition-colors duration-150 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5790e6]"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Fullscreen Navigation Overlay */}
      {isMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu Navigasi PyGrade UTU"
          className="fixed inset-0 z-50 bg-[#0f2f63] text-white animate-overlay-fade flex flex-col justify-between p-6 sm:p-12 lg:p-16"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-[#5790e6]">
                <Code2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-base uppercase tracking-[0.2em] font-medium">
                PYGRADE
              </span>
            </div>

            <button
              type="button"
              onClick={() => onToggleMenu(false)}
              aria-label="Tutup menu navigasi"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5790e6]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 my-auto py-8">
            <nav aria-label="Menu layar penuh" className="lg:col-span-7 flex flex-col gap-4">
              {[
                { num: '01', label: 'Daftar Modul Praktikum', href: '#modul' },
                { num: '02', label: 'Papan Peringkat Kelas', href: '#leaderboard' },
                { num: '03', label: 'Arsitektur & Sandbox', href: '#arsitektur' },
                { num: '04', label: 'Metrik Evaluasi Penelitian', href: '#evaluasi' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => onToggleMenu(false)}
                  className="group flex items-baseline justify-between border-b border-white/15 pb-4 text-2xl sm:text-4xl font-medium tracking-tight text-white/90 hover:text-white transition-colors"
                >
                  <span className="flex items-baseline gap-4">
                    <span className="font-mono text-sm text-[#5790e6] tabular-nums">
                      {item.num}
                    </span>
                    <span>{item.label}</span>
                  </span>
                  <ArrowUpRight
                    className="h-6 w-6 text-white/50 transition-transform duration-150 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-white"
                    aria-hidden="true"
                  />
                </a>
              ))}
            </nav>

            <div className="lg:col-span-5 flex flex-col justify-end gap-6 lg:border-l lg:border-white/15 lg:pl-12">
              {/* User Profile in Overlay */}
              <div className="space-y-2">
                <p className="text-sm text-[#5790e6]">Status Autentikasi Pengguna</p>
                {user ? (
                  <div className="rounded-xl border border-white/15 bg-white/10 p-4 space-y-1">
                    <p className="text-xs text-white/60">
                      Masuk sebagai{' '}
                      <span className="font-semibold text-white uppercase">
                        {user.role}
                      </span>
                    </p>
                    <p className="text-base font-medium text-white">{user.nama}</p>
                    {user.role === 'mahasiswa' && (
                      <p className="font-mono text-xs text-[#8fb8f3]">NIM: {user.nim}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-base text-white/75 leading-relaxed">
                    Masuk dengan identitas mahasiswa untuk menyimpan rekap nilai praktikum atau sebagai dosen untuk melihat dasbor hasil kelas.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {!user ? (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleMenu(false);
                      onOpenAuth('mahasiswa');
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-[#2563c9] px-6 py-3 text-sm font-medium text-white hover:bg-[#3171d8] transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Masuk / Login</span>
                  </button>
                ) : user.role === 'dosen' ? (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleMenu(false);
                      onOpenLecturerDashboard();
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-[#2563c9] px-6 py-3 text-sm font-medium text-white hover:bg-[#3171d8] transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Buka Dashboard Rekap</span>
                  </button>
                ) : null}

                {user && user.role === 'mahasiswa' && isEligibleForCertificate && onOpenCertificate && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleMenu(false);
                      onOpenCertificate();
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-amber-300/50 bg-amber-400/20 px-6 py-3 text-sm font-medium text-amber-200 hover:bg-amber-400/30 transition-colors"
                  >
                    <Award className="h-4 w-4 text-amber-300" />
                    <span>Lihat e-Sertifikat Kelulusan</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onToggleMenu(false);
                    onOpenGrader();
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-[#0f2f63] hover:bg-[#eaf1fd] transition-colors"
                >
                  <span>Buka Editor Python</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onToggleMenu(false);
                    onOpenSus();
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
                >
                  <span>Isi Kuesioner SUS</span>
                </button>

                {user && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleMenu(false);
                      onLogout();
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-rose-400/40 bg-rose-500/20 px-6 py-3 text-sm font-medium text-rose-200 hover:bg-rose-500/30 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Keluar</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-white/15 pt-6 text-xs sm:text-sm text-white/60">
            <span>PyGrade UTU — Program Studi Teknologi Informasi</span>
            <span>Fakultas Teknik, Universitas Teuku Umar, Meulaboh</span>
          </div>
        </div>
      )}
    </>
  );
}
