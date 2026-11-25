import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ClipboardCheck,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  calculateSusScore,
  LIKERT_LABELS,
  SUS_QUESTIONS,
  type SusResult,
} from '../utils/susCalculator';

interface SusSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: SusResult) => void;
}

export function SusSurveyModal({ isOpen, onClose, onComplete }: SusSurveyModalProps) {
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [result, setResult] = useState<SusResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const answeredCount = Object.keys(responses).length;
  const totalQuestions = SUS_QUESTIONS.length;

  const handleSelect = (questionId: number, value: number) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
    if (validationError) setValidationError(null);
  };

  const handleSubmit = () => {
    const missing = SUS_QUESTIONS.filter((q) => responses[q.id] === undefined);
    if (missing.length > 0) {
      setValidationError(
        `Masih ada ${missing.length} pernyataan yang belum dijawab (Nomor: ${missing
          .map((m) => m.id)
          .join(', ')}). Lengkapi seluruh 10 pernyataan untuk menghitung skor SUS.`
      );
      return;
    }

    const computed = calculateSusScore(responses);
    setResult(computed);
    setValidationError(null);
    onComplete(computed);
  };

  const handleReset = () => {
    setResponses({});
    setResult(null);
    setValidationError(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sus-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#081730]/75 p-2 sm:p-4 animate-overlay-fade"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-modal-enter flex flex-col w-full max-w-3xl max-h-[92vh] rounded-[1.5rem] bg-white shadow-2xl border border-[#e6e8ec] overflow-hidden">
        {/* Header */}
        <div className="bg-[#0f2f63] text-white px-5 sm:px-7 py-5 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#8fb8f3]">
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              <span>Instrumen Evaluasi Kebergunaan</span>
            </div>
            <h2 id="sus-modal-title" className="text-lg sm:text-xl font-medium text-white">
              Kuesioner System Usability Scale (SUS)
            </h2>
            <p className="text-xs sm:text-sm text-white/70">
              Nilai pengalaman Anda menggunakan PyGrade UTU pada skala 1 (Sangat Tidak Setuju)
              hingga 5 (Sangat Setuju).
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup kuesioner SUS"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white hover:bg-white/20 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5790e6]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {result ? (
            /* Result Summary State */
            <div data-testid="sus-result-panel" className="space-y-6">
              <div className="rounded-2xl bg-[#0f2f63] text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[#8fb8f3]">
                    Skor Akhir SUS
                  </p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl sm:text-6xl font-medium tabular-nums">
                      {result.score}
                    </span>
                    <span className="text-base text-white/60">/ 100</span>
                  </div>
                  <p className="text-sm text-white/80">{result.adjective}</p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-3 border-t sm:border-t-0 sm:border-l border-white/15 pt-4 sm:pt-0 sm:pl-6">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-[#5790e6]" aria-hidden="true" />
                    <span className="text-2xl font-medium">Grade {result.grade}</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium ${
                      result.isAcceptable
                        ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/35'
                        : 'bg-rose-500/20 text-rose-200 border border-rose-400/35'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{result.acceptabilityLabel}</span>
                  </span>
                </div>
              </div>

              {/* Benchmark Gauge */}
              <div className="rounded-2xl bg-[#f4f4f4] border border-[#e6e8ec] p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#0f2f63]/75">
                  <span>0 (Terendah)</span>
                  <span className="font-medium text-[#2563c9]">
                    Ambang Batas Kelayakan: 68
                  </span>
                  <span>100 (Tertinggi)</span>
                </div>
                <div className="relative h-3 w-full rounded-full bg-[#e6e8ec] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      result.isAcceptable ? 'bg-[#2563c9]' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, result.score))}%` }}
                  />
                  <div
                    aria-hidden="true"
                    className="absolute top-0 bottom-0 w-0.5 bg-[#0f2f63]"
                    style={{ left: '68%' }}
                  />
                </div>
                <p className="text-xs text-[#0f2f63]/70 leading-relaxed">
                  {result.isAcceptable
                    ? 'Skor berada pada atau di atas ambang batas standar industri (68), menandakan PyGrade UTU layak dan mudah digunakan oleh mahasiswa.'
                    : 'Skor berada di bawah ambang batas standar industri (68), menandakan antarmuka dan alur praktikum masih memerlukan penyempurnaan.'}
                </p>
              </div>

              {/* Formula Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-[#e6e8ec] p-4 space-y-1">
                  <p className="text-xs text-[#0f2f63]/60">
                    Kontribusi Item Ganjil (Skor − 1)
                  </p>
                  <p className="text-xl font-medium text-[#0f2f63] tabular-nums">
                    {result.positiveContribution} / 20
                  </p>
                </div>
                <div className="rounded-xl border border-[#e6e8ec] p-4 space-y-1">
                  <p className="text-xs text-[#0f2f63]/60">
                    Kontribusi Item Genap (5 − Skor)
                  </p>
                  <p className="text-xl font-medium text-[#0f2f63] tabular-nums">
                    {result.negativeContribution} / 20
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Questionnaire Form State */
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f4f4f4] border border-[#e6e8ec] px-4 py-3 text-xs text-[#0f2f63]/75">
                <span>1 = Sangat Tidak Setuju · 3 = Netral · 5 = Sangat Setuju</span>
                <span className="font-mono font-medium text-[#2563c9] tabular-nums">
                  {answeredCount} / {totalQuestions} terjawab
                </span>
              </div>

              {validationError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs sm:text-sm text-rose-900"
                >
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="space-y-3.5">
                {SUS_QUESTIONS.map((q) => {
                  const selected = responses[q.id];
                  const isMissingHighlighted = validationError !== null && selected === undefined;

                  return (
                    <fieldset
                      key={q.id}
                      className={`rounded-2xl border p-4 sm:p-5 transition-colors ${
                        isMissingHighlighted
                          ? 'border-rose-300 bg-rose-50/40'
                          : 'border-[#e6e8ec] bg-white'
                      }`}
                    >
                      <legend className="sr-only">
                        Pernyataan {q.id}: {q.text}
                      </legend>
                      <div className="flex items-start gap-3 mb-4">
                        <span className="font-mono text-xs font-medium text-[#2563c9] tabular-nums pt-0.5 shrink-0">
                          {String(q.id).padStart(2, '0')}
                        </span>
                        <p className="text-sm text-[#0f2f63] leading-relaxed">{q.text}</p>
                      </div>

                      <div className="grid grid-cols-5 gap-2 pl-0 sm:pl-7">
                        {[1, 2, 3, 4, 5].map((val) => {
                          const isChecked = selected === val;
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleSelect(q.id, val)}
                              aria-pressed={isChecked}
                              aria-label={`Pernyataan ${q.id} skor ${val} (${LIKERT_LABELS[val]})`}
                              className={`flex flex-col items-center justify-center rounded-xl border py-2.5 px-1 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563c9] ${
                                isChecked
                                  ? 'border-[#2563c9] bg-[#2563c9] text-white'
                                  : 'border-[#e6e8ec] bg-[#f4f4f4]/60 text-[#0f2f63] hover:border-[#5790e6] hover:bg-[#eaf1fd]'
                              }`}
                            >
                              <span className="font-mono text-sm font-medium tabular-nums">
                                {val}
                              </span>
                              <span
                                className={`hidden sm:block text-[10px] mt-0.5 leading-tight ${
                                  isChecked ? 'text-white/85' : 'text-[#0f2f63]/55'
                                }`}
                              >
                                {val === 1
                                  ? 'Sangat Tdk Setuju'
                                  : val === 5
                                  ? 'Sangat Setuju'
                                  : val === 3
                                  ? 'Netral'
                                  : val === 2
                                  ? 'Tdk Setuju'
                                  : 'Setuju'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-7 py-4 bg-[#f4f4f4] border-t border-[#e6e8ec] flex flex-wrap items-center justify-between gap-3 shrink-0">
          {result ? (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-full border border-[#0f2f63]/20 bg-white px-5 py-2.5 text-sm font-medium text-[#0f2f63] hover:border-[#2563c9] hover:text-[#2563c9] transition-colors"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Isi Ulang Kuesioner</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-full bg-[#0f2f63] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#194285] transition-colors"
              >
                <span>Selesai</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs sm:text-sm text-[#0f2f63]/65 hover:text-[#0f2f63] transition-colors"
              >
                Bersihkan Pilihan
              </button>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-[#0f2f63]/20 bg-white px-5 py-2.5 text-sm font-medium text-[#0f2f63] hover:bg-[#e6e8ec]/50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-full bg-[#2563c9] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#1d52ad] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563c9]"
                >
                  Hitung Skor SUS
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
