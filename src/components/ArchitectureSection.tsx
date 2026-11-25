import { ArrowRight, Cpu, ShieldCheck, Terminal, Timer } from 'lucide-react';

export function ArchitectureSection() {
  const pipelineSteps = [
    {
      step: '01',
      title: 'In-Browser Code Editor',
      desc: 'Mahasiswa menuliskan solusi Python langsung pada editor terstruktur dengan penomoran baris dan indentasi otomatis 4 spasi.',
    },
    {
      step: '02',
      title: 'Test-Case Evaluator',
      desc: 'Mesin memvalidasi sintaksis, menyuntikkan aliran stdin tiap kasus uji, lalu membandingkan stdout aktual secara presisi.',
    },
    {
      step: '03',
      title: 'Docker Sandbox Isolation',
      desc: 'Arsitektur siap integrasi kontainer terisolasi dengan pembatasan memori, pemutusan jaringan, serta timeout ketat 2 detik.',
    },
  ];

  return (
    <section
      id="arsitektur"
      aria-labelledby="arsitektur-heading"
      className="rounded-[2rem] bg-white border border-[#e6e8ec] px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-10">
        <div className="space-y-3 max-w-2xl">
          <p className="text-sm font-medium text-[#0b6e97]">Arsitektur Sistem & Keamanan</p>
          <h2
            id="arsitektur-heading"
            className="text-3xl sm:text-4xl lg:text-[2.75rem] font-medium tracking-[-0.025em] text-[#0f2f63] leading-tight"
          >
            Alur Eksekusi & Sandbox Terisolasi
          </h2>
        </div>
        <p className="text-sm sm:text-base text-[#0f2f63]/70 max-w-md leading-relaxed">
          Setiap pengiriman kode melewati tiga tahapan verifikasi terstandardisasi guna menjamin
          keamanan proses eksekusi dan objektivitas nilai.
        </p>
      </div>

      {/* 3-Step Horizontal Flow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-10 border-b border-[#e6e8ec]">
        {pipelineSteps.map((item, idx) => (
          <div
            key={item.step}
            className="relative rounded-2xl bg-[#f4f4f4] border border-[#e6e8ec] p-6 flex flex-col justify-between gap-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-medium text-[#2563c9] tabular-nums">
                Tahap {item.step}
              </span>
              {idx < pipelineSteps.length - 1 && (
                <ArrowRight
                  className="hidden md:block h-4 w-4 text-[#0f2f63]/35"
                  aria-hidden="true"
                />
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-[#0f2f63]">{item.title}</h3>
              <p className="text-sm text-[#0f2f63]/70 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 2 Illustrative Technical Visual Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-10">
        {/* Visual Card 1: Mesin Validasi Standard I/O */}
        <article className="rounded-2xl border border-[#e6e8ec] bg-[#f4f4f4] p-6 sm:p-8 flex flex-col justify-between gap-6 transition-transform duration-200 hover:-translate-y-0.5">
          <div className="space-y-2.5">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f2f63] text-white">
              <Terminal className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-xl sm:text-2xl font-medium text-[#0f2f63]">
              Mesin Validasi Standard I/O (stdin/stdout)
            </h3>
            <p className="text-sm text-[#0f2f63]/70 leading-relaxed">
              Setiap kasus uji menyuntikkan data masukan melalui standard input dan membandingkan
              hasil cetakan baris demi baris terhadap kunci jawaban yang telah dinormalisasi.
            </p>
          </div>

          {/* Schematic I/O Stream Diagram */}
          <div className="rounded-xl bg-[#081730] p-5 text-white font-mono text-xs space-y-3 border border-[#0f2f63]">
            <div className="flex items-center justify-between text-[#8fb8f3] border-b border-white/10 pb-2.5">
              <span>Pipeline Standard I/O</span>
              <span>Test Case #1 (Publik)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-1">
                <p className="text-[11px] text-white/55">stdin</p>
                <p className="text-white font-medium whitespace-pre">5000&#10;3</p>
              </div>

              <div className="rounded-lg bg-[#2563c9]/25 border border-[#5790e6]/40 p-3 space-y-1 text-center">
                <p className="text-[11px] text-[#8fb8f3]">Python Runtime</p>
                <p className="text-white">harga * jumlah</p>
              </div>

              <div className="rounded-lg bg-[#0b6e97]/25 border border-[#0b6e97]/50 p-3 space-y-1">
                <p className="text-[11px] text-[#8fb8f3]">stdout == expected</p>
                <p className="text-emerald-300 font-medium">15000</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-white/65">
              <span>Normalisasi trailing whitespace aktif</span>
              <span className="text-emerald-300 font-medium">VERDICT: ACCEPTED</span>
            </div>
          </div>
        </article>

        {/* Visual Card 2: Isolasi Kontainer & Pembatasan Waktu */}
        <article className="rounded-2xl border border-[#e6e8ec] bg-[#f4f4f4] p-6 sm:p-8 flex flex-col justify-between gap-6 transition-transform duration-200 hover:-translate-y-0.5">
          <div className="space-y-2.5">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b6e97] text-white">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-xl sm:text-2xl font-medium text-[#0f2f63]">
              Isolasi Kontainer & Pembatasan Waktu (Timeout 2s)
            </h3>
            <p className="text-sm text-[#0f2f63]/70 leading-relaxed">
              Melindungi server praktikum maupun peramban dari perulangan tak berujung (infinite
              loop) dan konsumsi memori berlebih dengan batas eksekusi maksimal 2 detik per soal.
            </p>
          </div>

          {/* Schematic Sandbox Guardrails Diagram */}
          <div className="rounded-xl bg-[#081730] p-5 text-white font-mono text-xs space-y-3 border border-[#0f2f63]">
            <div className="flex items-center justify-between text-[#8fb8f3] border-b border-white/10 pb-2.5">
              <span>Profil Keamanan Sandbox</span>
              <span>FastAPI + Docker Ready</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#5790e6]">
                  <Timer className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="text-[11px]">Batas Waktu</span>
                </div>
                <p className="text-base font-medium text-white tabular-nums">2.000 ms</p>
                <p className="text-[11px] text-white/55">Auto-kill infinite loop</p>
              </div>

              <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#5790e6]">
                  <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="text-[11px]">Isolasi Sumber Daya</span>
                </div>
                <p className="text-base font-medium text-white tabular-nums">128 MB RAM</p>
                <p className="text-[11px] text-white/55">Network disabled (--network=none)</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-white/65">
              <span>Deteksi dini SyntaxError & RuntimeError</span>
              <span className="text-[#8fb8f3] font-medium">ISOLATED</span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
