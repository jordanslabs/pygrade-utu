import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { Difficulty, Problem } from '../data/problems';

interface CurriculumSectionProps {
  problems: Problem[];
  solvedScores: Record<string, number>;
  onSelectProblem: (problemId: string) => void;
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
}: CurriculumSectionProps) {
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
