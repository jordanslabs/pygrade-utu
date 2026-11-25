import { useEffect, useRef, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Download,
  Printer,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { AuthUser } from '../services/authService';
import type { Problem } from '../data/problems';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  problems: Problem[];
  solvedScores: Record<string, number>;
}

export function CertificateModal({
  isOpen,
  onClose,
  user,
  problems,
  solvedScores,
}: CertificateModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Periksa nilai dan predikat
  const scores = problems.map((p) => solvedScores[p.id] ?? 0);
  const averageScore = Math.round(
    scores.reduce((a, b) => a + b, 0) / (problems.length || 1)
  );

  const getPredicate = (avg: number) => {
    if (avg >= 90) return 'Dengan Pujian (Cum Laude)';
    if (avg >= 80) return 'Sangat Memuaskan';
    return 'Memuaskan';
  };

  const predicate = getPredicate(averageScore);

  const studentNim = user && 'nim' in user ? user.nim : 'UTU2026';
  const studentNama = user?.nama ?? 'Mahasiswa';

  const issueDateFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const certificateNumber = `PYG-UTU-2026-${studentNim}`;

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Render Sertifikat pada Canvas (1920 x 1358 px) untuk download PNG berkualitas tinggi
  useEffect(() => {
    if (!isOpen || !user) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1920;
    const H = 1358;
    canvas.width = W;
    canvas.height = H;

    // 1. Background Gading Bersih
    ctx.fillStyle = '#faf9f5';
    ctx.fillRect(0, 0, W, H);

    // 2. Subtle Watermark Logo / Lingkaran Geometris di Tengah
    ctx.save();
    ctx.strokeStyle = 'rgba(15, 47, 99, 0.03)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 280, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 240, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 3. Bingkai Luar (Biru Navy Formal #0f294a)
    ctx.strokeStyle = '#0f294a';
    ctx.lineWidth = 16;
    ctx.strokeRect(36, 36, W - 72, H - 72);

    // 4. Bingkai Dalam (Aksen Emas #d4af37)
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.strokeRect(58, 58, W - 116, H - 116);

    // Garis ornamen tipis ketiga
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(68, 68, W - 136, H - 136);

    // 5. Ornamen Sudut (Corner Brackets Emas)
    const corners = [
      { x: 58, y: 58 },
      { x: W - 58, y: 58 },
      { x: 58, y: H - 58 },
      { x: W - 58, y: H - 58 },
    ];
    ctx.fillStyle = '#d4af37';
    corners.forEach((c) => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Header Institusi
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f294a';
    ctx.font = 'bold 24px "Onest", "Segoe UI", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText(
      'PROGRAM STUDI TEKNOLOGI INFORMASI · FAKULTAS TEKNIK',
      W / 2,
      140
    );

    ctx.fillStyle = '#2563c9';
    ctx.font = '600 28px "Onest", "Segoe UI", sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('UNIVERSITAS TEUKU UMAR', W / 2, 180);

    // Garis Pemisah Emas di Header
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 200, 210);
    ctx.lineTo(W / 2 + 200, 210);
    ctx.stroke();

    // 7. Judul Sertifikat
    ctx.fillStyle = '#0f294a';
    ctx.font = 'bold 56px "Onest", "Segoe UI", serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('SERTIFIKAT KELULUSAN', W / 2, 290);

    ctx.fillStyle = '#b48318';
    ctx.font = 'bold 28px "Onest", "Segoe UI", sans-serif';
    ctx.letterSpacing = '1.5px';
    ctx.fillText('PRAKTIKUM PEMROGRAMAN PYTHON', W / 2, 335);

    ctx.fillStyle = '#6b7280';
    ctx.font = '18px "JetBrains Mono", monospace';
    ctx.letterSpacing = '1px';
    ctx.fillText(`Nomor Registrasi: ${certificateNumber}`, W / 2, 375);

    // 8. Teks Penghargaan & Penerima
    ctx.fillStyle = '#374151';
    ctx.font = 'italic 24px "Onest", "Segoe UI", serif';
    ctx.letterSpacing = '0px';
    ctx.fillText('Diberikan dengan penuh apresiasi kepada:', W / 2, 450);

    // Nama Mahasiswa
    ctx.fillStyle = '#0f294a';
    ctx.font = 'bold 54px "Onest", "Segoe UI", sans-serif';
    ctx.fillText(studentNama, W / 2, 530);

    // Garis Emas Penegasan Nama
    const textWidth = ctx.measureText(studentNama).width;
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W / 2 - Math.max(textWidth / 2 + 40, 240), 555);
    ctx.lineTo(W / 2 + Math.max(textWidth / 2 + 40, 240), 555);
    ctx.stroke();

    // NIM Mahasiswa
    ctx.fillStyle = '#1d4ed8';
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.fillText(`NIM: ${studentNim}`, W / 2, 600);

    // 9. Paragraf Pernyataan Capaian
    ctx.fillStyle = '#1f2937';
    ctx.font = '22px "Onest", "Segoe UI", sans-serif';
    ctx.fillText(
      'Telah berhasil menyelesaikan dan lulus seluruh 4 modul evaluasi pemrograman Python',
      W / 2,
      670
    );
    ctx.fillText(
      'berbasis Automated Test Case pada platform laboratorium terisolasi PyGrade UTU dengan hasil:',
      W / 2,
      705
    );

    // 10. Kartu Nilai & Predikat di Tengah
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    const badgeW = 680;
    const badgeH = 100;
    const badgeX = (W - badgeW) / 2;
    const badgeY = 745;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0f294a';
    ctx.font = 'bold 32px "Onest", "Segoe UI", sans-serif';
    ctx.fillText(`Nilai Akhir: ${averageScore} / 100`, W / 2, 790);

    ctx.fillStyle = '#059669';
    ctx.font = '600 20px "Onest", "Segoe UI", sans-serif';
    ctx.fillText(`Predikat: ${predicate}`, W / 2, 825);

    // 11. Footer: Stempel Verifikasi Digital (Kiri) & Tanda Tangan (Kanan)
    // Sisi Kiri: Badge Verifikasi
    const stampX = 340;
    const stampY = 1060;
    ctx.save();
    ctx.strokeStyle = '#0b6e97';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(stampX, stampY, 70, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(stampX, stampY, 62, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#0b6e97';
    ctx.font = 'bold 13px "Onest", sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('PYGRADE ENGINE', stampX, stampY - 18);
    ctx.fillText('VERIFIED PASS', stampX, stampY + 2);
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText('AUTOGRADE UTU', stampX, stampY + 22);
    ctx.restore();

    ctx.fillStyle = '#4b5563';
    ctx.font = '14px "Onest", sans-serif';
    ctx.fillText('Terverifikasi Sistem Otomatis', stampX, 1165);
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('SHA256: VALID-AUTHENTIC', stampX, 1185);

    // Sisi Kanan: Tanda Tangan Dosen / Koordinator
    const sigX = W - 380;
    ctx.fillStyle = '#374151';
    ctx.font = '20px "Onest", "Segoe UI", sans-serif';
    ctx.fillText(`Meulaboh, ${issueDateFormatted}`, sigX, 980);
    ctx.fillText('Koordinator Praktikum Pemrograman,', sigX, 1010);

    // Placeholder tanda tangan rapi
    ctx.strokeStyle = '#0f294a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sigX - 120, 1120);
    ctx.lineTo(sigX + 120, 1120);
    ctx.stroke();

    ctx.fillStyle = '#0f294a';
    ctx.font = 'bold 20px "Onest", sans-serif';
    ctx.fillText('Tim Dosen Pemrograman Python', sigX, 1150);

    ctx.fillStyle = '#6b7280';
    ctx.font = '16px "Onest", sans-serif';
    ctx.fillText('Program Studi Teknologi Informasi UTU', sigX, 1175);
  }, [isOpen, user, problems, solvedScores, averageScore, predicate, issueDateFormatted, certificateNumber]);

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas || !user) return;
    setIsExporting(true);

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = `e-Sertifikat-PyGrade-${studentNim}.png`;
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('Gagal mengunduh gambar sertifikat:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || !user) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="certificate-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#081730]/85 p-2 sm:p-4 animate-overlay-fade overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-modal-enter relative flex flex-col w-full max-w-[1080px] max-h-[96vh] rounded-[1.5rem] bg-white shadow-2xl border border-[#e6e8ec] overflow-hidden my-auto">
        {/* Header Modal */}
        <div className="bg-[#0f2f63] text-white px-5 sm:px-8 py-4 flex items-center justify-between gap-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Award className="h-4 w-4" />
            </span>
            <div>
              <h2
                id="certificate-modal-title"
                className="text-base sm:text-xl font-medium text-white"
              >
                e-Sertifikat Kelulusan Praktikum
              </h2>
              <p className="text-xs text-white/70">
                Resmi diterbitkan oleh Program Studi Teknologi Informasi · Universitas Teuku Umar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition-colors"
              title="Cetak atau Simpan PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cetak PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563c9] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#3171d8] transition-colors shadow-sm disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isExporting ? 'Memproses...' : 'Unduh (.PNG)'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup pratinjau sertifikat"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white hover:bg-white/20 transition-colors ml-1"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Certificate Display Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#f4f6fa] flex flex-col items-center justify-center">
          {/* Certificate Card Preview (Interactive & Responsive) */}
          <div
            id="certificate-print-area"
            className="w-full max-w-[940px] min-h-[520px] sm:min-h-0 sm:aspect-[1.414/1] bg-[#faf9f5] rounded-xl border-[6px] sm:border-[12px] border-[#0f294a] shadow-xl p-4 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden text-[#0f294a] select-none"
            style={{
              boxShadow:
                '0 20px 40px -15px rgba(15,47,99,0.2), 0 0 0 3px #d4af37, inset 0 0 0 2px #d4af37',
            }}
          >
            {/* Watermark Logo Background */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.035]"
            >
              <div className="w-[380px] h-[380px] rounded-full border-[18px] border-[#0f294a] flex items-center justify-center">
                <Award className="w-56 h-56 text-[#0f294a]" />
              </div>
            </div>

            {/* Corner Gold Accents */}
            <span className="absolute top-2 left-2 w-3 h-3 rounded-full bg-[#d4af37]" />
            <span className="absolute top-2 right-2 w-3 h-3 rounded-full bg-[#d4af37]" />
            <span className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-[#d4af37]" />
            <span className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-[#d4af37]" />

            {/* Header Sertifikat */}
            <div className="text-center space-y-1 relative z-10">
              <p className="text-[10px] sm:text-xs font-bold tracking-[0.2em] text-[#0f294a] uppercase">
                Program Studi Teknologi Informasi · Fakultas Teknik
              </p>
              <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-[#2563c9] uppercase">
                Universitas Teuku Umar
              </p>
              <div className="w-24 sm:w-36 h-0.5 bg-[#d4af37] mx-auto my-1.5 opacity-80" />

              <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0f294a] pt-1 sm:pt-2 font-serif">
                SERTIFIKAT KELULUSAN
              </h1>
              <p className="text-xs sm:text-sm font-bold text-[#b48318] tracking-wider uppercase">
                Praktikum Pemrograman Python
              </p>
              <p className="font-mono text-[9px] sm:text-[11px] text-[#6b7280]">
                Nomor Registrasi: {certificateNumber}
              </p>
            </div>

            {/* Body Sertifikat */}
            <div className="text-center space-y-2 sm:space-y-3 my-auto relative z-10 py-1 sm:py-3">
              <p className="text-xs sm:text-sm italic text-gray-600 font-serif">
                Diberikan dengan penuh apresiasi kepada:
              </p>
              <div className="space-y-1">
                <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-[#0f294a] tracking-normal border-b-2 border-[#d4af37] pb-1 inline-block max-w-[90%]">
                  {studentNama}
                </h2>
                <p className="font-mono text-xs sm:text-sm font-semibold text-[#1d4ed8]">
                  NIM: {studentNim}
                </p>
              </div>

              <p className="text-[11px] sm:text-xs text-gray-700 max-w-xl mx-auto leading-relaxed pt-1">
                Telah berhasil menyelesaikan dan lulus seluruh 4 modul evaluasi praktikum
                pemrograman Python berbasis <em>Automated Test Case</em> pada platform laboratorium
                terisolasi PyGrade UTU dengan hasil:
              </p>

              {/* Box Nilai Rata-Rata */}
              <div className="inline-flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-1.5 sm:px-6 sm:py-2.5 shadow-xs">
                <div className="text-center">
                  <span className="text-[10px] sm:text-xs text-gray-500 block uppercase font-medium">
                    Nilai Akhir
                  </span>
                  <span className="text-base sm:text-xl font-bold text-[#0f294a] tabular-nums">
                    {averageScore} / 100
                  </span>
                </div>
                <div className="w-px h-7 bg-gray-200" />
                <div className="text-left">
                  <span className="text-[10px] sm:text-xs text-gray-500 block uppercase font-medium">
                    Predikat Kelulusan
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-700">
                    {predicate}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Sertifikat */}
            <div className="flex items-end justify-between pt-2 sm:pt-4 relative z-10 border-t border-gray-200/80">
              {/* Badge Verifikasi Digital (Kiri) */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-[#0b6e97] bg-white flex items-center justify-center text-[#0b6e97] shadow-xs shrink-0">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="text-left">
                  <p className="text-[9px] sm:text-[11px] font-bold text-[#0b6e97] leading-tight">
                    TERVERIFIKASI SISTEM
                  </p>
                  <p className="text-[8px] sm:text-[10px] text-gray-500 leading-tight">
                    PyGrade Auto-Grader Engine
                  </p>
                  <p className="font-mono text-[7px] sm:text-[9px] text-gray-400 leading-tight">
                    Credential Verified
                  </p>
                </div>
              </div>

              {/* Tanda Tangan Koordinator (Kanan) */}
              <div className="text-right space-y-1">
                <p className="text-[9px] sm:text-xs text-gray-600">
                  Meulaboh, {issueDateFormatted}
                </p>
                <p className="text-[9px] sm:text-xs font-medium text-gray-700">
                  Koordinator Praktikum Pemrograman,
                </p>
                <div className="w-28 sm:w-40 h-8 sm:h-10 border-b border-gray-400 mx-auto ml-auto" />
                <p className="text-[9px] sm:text-xs font-bold text-[#0f294a]">
                  Tim Dosen Pemrograman Python
                </p>
                <p className="text-[8px] sm:text-[10px] text-gray-500">
                  Prodi Teknologi Informasi UTU
                </p>
              </div>
            </div>
          </div>

          {/* Hidden Canvas untuk Export PNG 1920x1358 Resolusi Tinggi */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Action Footer Mobile Notice */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500 text-center">
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Sertifikat Digital Otomatis Sah &amp; Terverifikasi
            </span>
            <span>·</span>
            <span>Gunakan tombol "Cetak PDF" untuk menyimpan berkas resmi dalam format dokumen.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
