import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Info,
  Lock,
  Mail,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { type AuthUser, type UserRole, saveStoredUser } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  initialRole?: UserRole;
  promptMessage?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  initialRole = 'mahasiswa',
  promptMessage,
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<UserRole>(initialRole);

  // Form State Mahasiswa
  const [nama, setNama] = useState('');
  const [nim, setNim] = useState('');

  // Form State Dosen
  const [email, setEmail] = useState('');
  const [kodeAkses, setKodeAkses] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialRole);
      setErrorMessage(null);
    }
  }, [isOpen, initialRole]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmitMahasiswa = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanNama = nama.trim();
    const cleanNim = nim.trim();

    if (!cleanNama) {
      setErrorMessage('Silakan masukkan Nama Lengkap Anda.');
      return;
    }
    if (!cleanNim) {
      setErrorMessage('Silakan masukkan Nomor Induk Mahasiswa (NIM).');
      return;
    }

    const user: AuthUser = {
      role: 'mahasiswa',
      nama: cleanNama,
      nim: cleanNim,
    };

    saveStoredUser(user);
    onLoginSuccess(user);
    onClose();
  };

  const handleSubmitDosen = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanKode = kodeAkses.trim();

    if (!cleanEmail || !cleanKode) {
      setErrorMessage('Email dan Kode Akses Dosen wajib diisi.');
      return;
    }

    // Validasi akun demo dosen/penguji
    if (cleanEmail === 'dosen@utu.ac.id' && cleanKode === 'UTU2026') {
      const user: AuthUser = {
        role: 'dosen',
        nama: 'Dosen / Penguji Riset',
        email: cleanEmail,
      };
      saveStoredUser(user);
      onLoginSuccess(user);
      onClose();
    } else {
      setErrorMessage(
        'Kredensial Dosen salah. Gunakan email: dosen@utu.ac.id dan kode: UTU2026.'
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#081730]/80 p-3 sm:p-4 animate-overlay-fade"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-modal-enter flex flex-col w-full max-w-md rounded-[1.5rem] bg-white shadow-2xl border border-[#e6e8ec] overflow-hidden">
        {/* Header */}
        <div className="bg-[#0f2f63] text-white px-6 py-5 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-widest text-[#8fb8f3]">
              Portal Autentikasi UTU
            </span>
            <h2 id="auth-modal-title" className="text-xl font-medium text-white">
              Masuk ke PyGrade UTU
            </h2>
            <p className="text-xs text-white/70">
              Pilih peran Anda untuk melanjutkan ke sesi praktikum atau panel rekap.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup jendela login"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white hover:bg-white/20 transition-colors shrink-0"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Optional Prompt Message Banner */}
        {promptMessage && (
          <div className="bg-[#eaf1fd] border-b border-[#5790e6]/30 px-6 py-2.5 flex items-center gap-2 text-xs text-[#0f2f63]">
            <Info className="h-4 w-4 text-[#2563c9] shrink-0" aria-hidden="true" />
            <span className="leading-snug">{promptMessage}</span>
          </div>
        )}

        {/* Role Tabs */}
        <div className="flex border-b border-[#e6e8ec] bg-[#f4f4f4]/60">
          <button
            type="button"
            onClick={() => {
              setActiveTab('mahasiswa');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 px-3 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'mahasiswa'
                ? 'border-[#2563c9] text-[#2563c9] bg-white font-semibold'
                : 'border-transparent text-[#0f2f63]/60 hover:text-[#0f2f63]'
            }`}
          >
            <GraduationCap className="h-4 w-4 shrink-0" />
            <span>Mahasiswa</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('dosen');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 px-3 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'dosen'
                ? 'border-[#2563c9] text-[#2563c9] bg-white font-semibold'
                : 'border-transparent text-[#0f2f63]/60 hover:text-[#0f2f63]'
            }`}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Dosen / Penguji</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900"
            >
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'mahasiswa' ? (
            /* Form Mahasiswa */
            <form onSubmit={handleSubmitMahasiswa} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="auth-nama" className="text-xs font-medium text-[#0f2f63]">
                  Nama Lengkap Mahasiswa
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-[#0f2f63]/40" />
                  <input
                    id="auth-nama"
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Cut Riska"
                    className="w-full rounded-xl border border-[#e6e8ec] bg-white pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#0f2f63] focus:outline-none focus:ring-2 focus:ring-[#2563c9]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="auth-nim" className="text-xs font-medium text-[#0f2f63]">
                  Nomor Induk Mahasiswa (NIM)
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3.5 top-3 h-4 w-4 text-[#0f2f63]/40" />
                  <input
                    id="auth-nim"
                    type="text"
                    required
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    placeholder="Contoh: 210590304001"
                    className="w-full rounded-xl border border-[#e6e8ec] bg-white pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#0f2f63] font-mono focus:outline-none focus:ring-2 focus:ring-[#2563c9]"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-[#f4f4f4] border border-[#e6e8ec] p-3 text-[11px] text-[#0f2f63]/75 leading-relaxed">
                Skor pengerjaan modul praktikum dan kuesioner evaluasi Anda akan otomatis disinkronkan ke pangkalan data penelitian Prodi TI UTU.
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-[#2563c9] py-3 text-xs sm:text-sm font-medium text-white hover:bg-[#1d52ad] transition-colors shadow-sm"
              >
                Masuk sebagai Mahasiswa
              </button>
            </form>
          ) : (
            /* Form Dosen / Penguji */
            <form onSubmit={handleSubmitDosen} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="auth-email" className="text-xs font-medium text-[#0f2f63]">
                  Email Resmi Dosen / Penguji
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#0f2f63]/40" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dosen@utu.ac.id"
                    className="w-full rounded-xl border border-[#e6e8ec] bg-white pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#0f2f63] focus:outline-none focus:ring-2 focus:ring-[#2563c9]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="auth-kode" className="text-xs font-medium text-[#0f2f63]">
                  Kode Akses Penguji
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#0f2f63]/40" />
                  <input
                    id="auth-kode"
                    type="password"
                    required
                    value={kodeAkses}
                    onChange={(e) => setKodeAkses(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[#e6e8ec] bg-white pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#0f2f63] font-mono focus:outline-none focus:ring-2 focus:ring-[#2563c9]"
                  />
                </div>
              </div>

              {/* Demo Account Hint */}
              <div className="rounded-xl bg-[#eaf1fd] border border-[#5790e6]/40 p-3 space-y-1 text-[11px] text-[#0f2f63]">
                <div className="flex items-center gap-1.5 font-semibold text-[#2563c9]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Kredensial Akses Demo Penguji:</span>
                </div>
                <p>
                  Email: <code className="font-mono bg-white px-1 py-0.5 rounded border border-[#5790e6]/30">dosen@utu.ac.id</code>
                </p>
                <p>
                  Kode Akses: <code className="font-mono bg-white px-1 py-0.5 rounded border border-[#5790e6]/30">UTU2026</code>
                </p>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-[#0f2f63] py-3 text-xs sm:text-sm font-medium text-white hover:bg-[#194285] transition-colors shadow-sm"
              >
                Masuk ke Panel Dosen
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
