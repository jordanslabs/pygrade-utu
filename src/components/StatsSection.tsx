export function StatsSection() {
  const metrics = [
    {
      value: '16',
      label: 'Total Test Cases',
      detail: '4 kasus uji per modul (1 publik + 3 hidden)',
    },
    {
      value: '< 2s',
      label: 'Batas Waktu Eksekusi',
      detail: 'Proteksi otomatis terhadap infinite loop',
    },
    {
      value: '3',
      label: 'Tingkat Kesulitan',
      detail: 'Bertahap dari Mudah, Sedang, hingga Sulit',
    },
    {
      value: 'SUS',
      label: 'Standar Evaluasi Kebergunaan',
      detail: '10 butir kuesioner baku skala Likert 1–5',
    },
  ];

  return (
    <section
      id="evaluasi"
      aria-labelledby="evaluasi-heading"
      className="rounded-[2rem] bg-[#0f2f63] text-white px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-10 border-b border-white/15">
        <div className="space-y-2">
          <p className="text-sm text-[#8fb8f3]">Parameter Pengujian & Evaluasi</p>
          <h2
            id="evaluasi-heading"
            className="text-2xl sm:text-3xl font-medium tracking-[-0.02em] text-white"
          >
            Dirancang untuk Akurasi Praktikum & Riset Kebergunaan
          </h2>
        </div>
        <p className="text-sm text-white/65 max-w-sm">
          Setiap indikator terukur langsung di dalam platform untuk mendukung evaluasi pembelajaran
          pemrograman dasar.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pt-10">
        {metrics.map((metric, idx) => (
          <div
            key={metric.label}
            className={`space-y-2.5 ${
              idx > 0 ? 'lg:border-l lg:border-white/15 lg:pl-8' : ''
            }`}
          >
            <p className="text-4xl sm:text-5xl font-medium tracking-tight text-white tabular-nums">
              {metric.value}
            </p>
            <p className="text-base font-medium text-[#8fb8f3]">{metric.label}</p>
            <p className="text-xs sm:text-sm text-white/65 leading-relaxed">{metric.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
