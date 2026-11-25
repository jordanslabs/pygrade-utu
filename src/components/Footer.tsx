import { ArrowRight, ClipboardCheck, Code2 } from 'lucide-react';

interface FooterProps {
  onOpenGrader: (problemId?: string) => void;
  onOpenSus: () => void;
  lastSusScore: number | null;
}

export function Footer({ onOpenGrader, onOpenSus, lastSusScore }: FooterProps) {
  return (
    <footer className="rounded-[2rem] bg-[#0f2f63] text-white px-6 py-14 sm:px-10 sm:py-20 lg:px-14">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 pb-14 border-b border-white/15">
        <div className="space-y-4 max-w-2xl">
          <p className="text-sm text-[#8fb8f3]">Portal Praktikum & Evaluasi</p>
          <h2
            className="text-3xl sm:text-5xl font-medium tracking-[-0.025em] leading-[1.08] text-white"
            style={{ textWrap: 'balance' }}
          >
            Siap Menguji Kode Python Anda?
          </h2>
          <p className="text-sm sm:text-base text-white/70 max-w-xl leading-relaxed">
            Jalankan solusi praktikum Anda secara instan melalui mesin auto-grading atau bantu
            pengembangan sistem dengan mengisi kuesioner System Usability Scale (SUS).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3.5 shrink-0">
          <button
            type="button"
            onClick={() => onOpenGrader()}
            className="group inline-flex items-center gap-2.5 rounded-full bg-white px-6 sm:px-7 py-3.5 text-sm font-medium text-[#0f2f63] hover:bg-[#eaf1fd] transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5790e6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f2f63]"
          >
            <span>Buka Editor Python</span>
            <ArrowRight
              className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={onOpenSus}
            className="inline-flex items-center gap-2.5 rounded-full border border-white/35 bg-transparent px-6 sm:px-7 py-3.5 text-sm font-medium text-white hover:bg-white/10 transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5790e6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f2f63]"
          >
            <ClipboardCheck className="h-4 w-4 text-[#8fb8f3]" aria-hidden="true" />
            <span>
              {lastSusScore !== null
                ? `Isi Kuesioner SUS (Skor: ${lastSusScore})`
                : 'Isi Kuesioner SUS'}
            </span>
          </button>
        </div>
      </div>

      <div className="pt-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs sm:text-sm text-white/65">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-[#5790e6] shrink-0">
            <Code2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <p className="text-white/85 font-normal">
            PyGrade UTU — Program Studi Teknologi Informasi, Fakultas Teknik, Universitas Teuku
            Umar, Meulaboh
          </p>
        </div>

        <nav aria-label="Tautan footer" className="flex items-center gap-6 shrink-0">
          <a href="#modul" className="hover:text-white transition-colors whitespace-nowrap">
            Modul
          </a>
          <a href="#arsitektur" className="hover:text-white transition-colors whitespace-nowrap">
            Arsitektur
          </a>
          <a href="#evaluasi" className="hover:text-white transition-colors whitespace-nowrap">
            Evaluasi
          </a>
        </nav>
      </div>
    </footer>
  );
}
