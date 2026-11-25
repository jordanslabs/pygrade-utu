import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Cpu,
  HelpCircle,
  Lightbulb,
  Lock,
  Play,
  RotateCcw,
  Send,
  Server,
  Sliders,
  Sparkles,
  Terminal,
  X,
  XCircle,
} from 'lucide-react';
import type { Difficulty, Problem } from '../data/problems';
import type { UserRole } from '../services/authService';
import {
  evaluatePythonSubmission,
  type EvaluationResult,
  type VerdictStatus,
} from '../utils/pythonEvaluator';

type ExecutionMode = 'local' | 'backend';
type ProblemTab = 'materi' | 'praktik';

interface AutoGraderModalProps {
  isOpen: boolean;
  problems: Problem[];
  activeProblemId: string;
  onSelectProblem: (problemId: string) => void;
  onClose: () => void;
  onScoreUpdate: (problemId: string, score: number) => void;
  userRole?: UserRole;
  executionMode?: ExecutionMode;
  onExecutionModeChange?: (mode: ExecutionMode) => void;
  backendUrl?: string;
  onBackendUrlChange?: (url: string) => void;
}

function getDifficultyClasses(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'Mudah':
      return 'bg-[#0b6e97]/20 text-[#8fe1ff] border-[#0b6e97]/40';
    case 'Sedang':
      return 'bg-[#2563c9]/25 text-[#a7c8ff] border-[#5790e6]/40';
    case 'Sulit':
      return 'bg-amber-500/20 text-amber-200 border-amber-400/35';
  }
}

function getVerdictTheme(verdict: VerdictStatus) {
  switch (verdict) {
    case 'ACCEPTED':
      return {
        container: 'bg-emerald-50 border-emerald-200 text-emerald-950',
        label: 'bg-emerald-600 text-white',
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />,
      };
    case 'WRONG ANSWER':
      return {
        container: 'bg-amber-50 border-amber-200 text-amber-950',
        label: 'bg-amber-600 text-white',
        icon: <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />,
      };
    case 'SYNTAX ERROR':
    case 'RUNTIME ERROR':
      return {
        container: 'bg-rose-50 border-rose-200 text-rose-950',
        label: 'bg-rose-600 text-white',
        icon: <XCircle className="h-4 w-4 text-rose-600 shrink-0" aria-hidden="true" />,
      };
  }
}

export function AutoGraderModal({
  isOpen,
  problems,
  activeProblemId,
  onSelectProblem,
  onClose,
  onScoreUpdate,
  userRole,
  executionMode: controlledMode,
  onExecutionModeChange,
  backendUrl: controlledUrl,
  onBackendUrlChange,
}: AutoGraderModalProps) {
  const activeProblem =
    problems.find((p) => p.id === activeProblemId) ?? problems[0];

  const [activeTab, setActiveTab] = useState<ProblemTab>('materi');
  const [codeByProblem, setCodeByProblem] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const p of problems) {
      initial[p.id] = p.starterCode;
    }
    return initial;
  });

  const [internalMode, setInternalMode] = useState<ExecutionMode>('local');
  const [internalUrl, setInternalUrl] = useState('http://localhost:8000/api/evaluate');

  const executionMode = controlledMode ?? internalMode;
  const setExecutionMode = (m: ExecutionMode) => {
    if (onExecutionModeChange) onExecutionModeChange(m);
    else setInternalMode(m);
  };

  const backendUrl = controlledUrl ?? internalUrl;
  const setBackendUrl = (u: string) => {
    if (onBackendUrlChange) onBackendUrlChange(u);
    else setInternalUrl(u);
  };

  const [isEngineSettingsOpen, setIsEngineSettingsOpen] = useState(false);
  const [backendNotice, setBackendNotice] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [resultsByProblem, setResultsByProblem] = useState<
    Record<string, EvaluationResult | null>
  >({});

  // Pelacak Percobaan & Petunjuk Bertingkat
  const [attemptsByProblem, setAttemptsByProblem] = useState<Record<string, number>>({});
  const [unlockedHintStage, setUnlockedHintStage] = useState<Record<string, number>>({});
  const [isHintPanelOpen, setIsHintPanelOpen] = useState(false);
  const [activeHintTab, setActiveHintTab] = useState<1 | 2 | 3>(1);

  const currentAttempt = attemptsByProblem[activeProblem.id] ?? 0;
  const currentHintStage = unlockedHintStage[activeProblem.id] ?? 0;

  const handleOpenHint = () => {
    if (currentHintStage === 0) {
      setUnlockedHintStage((prev) => ({
        ...prev,
        [activeProblem.id]: 1,
      }));
      setActiveHintTab(1);
    } else {
      setActiveHintTab(currentHintStage as 1 | 2 | 3);
    }
    setIsHintPanelOpen(true);
  };

  const handleUnlockNextHint = () => {
    const nextStage = Math.min(3, currentHintStage + 1);
    setUnlockedHintStage((prev) => ({
      ...prev,
      [activeProblem.id]: nextStage,
    }));
    setActiveHintTab(nextStage as 1 | 2 | 3);
  };

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const engineSettingsRef = useRef<HTMLDivElement | null>(null);

  const currentCode = codeByProblem[activeProblem.id] ?? activeProblem.starterCode;
  const currentResult = resultsByProblem[activeProblem.id] ?? null;
  const lineCount = Math.max(12, currentCode.split('\n').length);

  // Reset tab to "materi" whenever active problem changes
  useEffect(() => {
    setActiveTab('materi');
  }, [activeProblemId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEngineSettingsOpen) {
          setIsEngineSettingsOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, isEngineSettingsOpen]);

  // Click outside listener for engine settings popover
  useEffect(() => {
    if (!isEngineSettingsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (engineSettingsRef.current && !engineSettingsRef.current.contains(e.target as Node)) {
        setIsEngineSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEngineSettingsOpen]);

  if (!isOpen) return null;

  const handleCodeChange = (next: string) => {
    setCodeByProblem((prev) => ({ ...prev, [activeProblem.id]: next }));
  };

  const handleResetCode = () => {
    setCodeByProblem((prev) => ({
      ...prev,
      [activeProblem.id]: activeProblem.starterCode,
    }));
    setResultsByProblem((prev) => ({ ...prev, [activeProblem.id]: null }));
    setBackendNotice(null);
  };

  const handleEditorScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleEditorKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();

    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;

    if (e.shiftKey) {
      // Unindent current line by up to 4 spaces
      const lineStart = currentCode.lastIndexOf('\n', start - 1) + 1;
      const linePrefix = currentCode.slice(lineStart, lineStart + 4);
      let removeCount = 0;
      while (removeCount < linePrefix.length && linePrefix[removeCount] === ' ') {
        removeCount++;
      }
      if (removeCount > 0) {
        const updated =
          currentCode.slice(0, lineStart) + currentCode.slice(lineStart + removeCount);
        handleCodeChange(updated);
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = Math.max(lineStart, start - removeCount);
            textareaRef.current.selectionEnd = Math.max(lineStart, end - removeCount);
          }
        });
      }
      return;
    }

    const updated = currentCode.slice(0, start) + '    ' + currentCode.slice(end);
    handleCodeChange(updated);
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = start + 4;
        textareaRef.current.selectionEnd = start + 4;
      }
    });
  };

  const runEvaluation = async (mode: 'sample' | 'submit') => {
    setIsRunning(true);
    setBackendNotice(null);

    // Catat penambahan jumlah percobaan untuk modul aktif
    setAttemptsByProblem((prev) => ({
      ...prev,
      [activeProblem.id]: (prev[activeProblem.id] ?? 0) + 1,
    }));

    if (executionMode === 'backend') {
      try {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 1400);
        const resp = await fetch(backendUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problem_id: activeProblem.id,
            code: currentCode,
            mode,
            timeout_sec: 2,
          }),
          signal: controller.signal,
        });
        window.clearTimeout(timer);

        if (resp.ok) {
          const data = (await resp.json()) as EvaluationResult;
          setResultsByProblem((prev) => ({ ...prev, [activeProblem.id]: data }));
          if (mode === 'submit') {
            onScoreUpdate(activeProblem.id, data.score);
          }
          setIsRunning(false);
          return;
        }
        setBackendNotice(
          `Server FastAPI merespons status ${resp.status}. Evaluasi dialihkan otomatis ke Sandbox Browser Lokal.`
        );
      } catch {
        setBackendNotice(
          'Server FastAPI + Docker belum aktif pada endpoint lokal. Evaluasi tetap dijalankan menggunakan Sandbox Browser Lokal.'
        );
      }
    }

    const result = evaluatePythonSubmission(currentCode, activeProblem, mode);
    setResultsByProblem((prev) => ({ ...prev, [activeProblem.id]: result }));
    if (mode === 'submit') {
      onScoreUpdate(activeProblem.id, result.score);
    }
    setIsRunning(false);
  };

  const publicTestCase = activeProblem.testCases.find((tc) => tc.isPublic) ?? activeProblem.testCases[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="autograder-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#081730]/75 p-2 sm:p-4 animate-overlay-fade"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-modal-enter flex flex-col w-full max-w-[1360px] h-[94vh] rounded-[1.5rem] bg-white shadow-2xl border border-[#e6e8ec] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#0f2f63] text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 shrink-0">
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            {/* Quick switcher 01 - 04 */}
            <div
              role="group"
              aria-label="Pemilih cepat soal praktikum"
              className="flex items-center gap-1 rounded-lg bg-white/10 p-1"
            >
              {problems.map((p) => {
                const isActive = p.id === activeProblem.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelectProblem(p.id);
                      setBackendNotice(null);
                    }}
                    aria-pressed={isActive}
                    aria-label={`Pilih Modul ${p.number}: ${p.title}`}
                    className={`px-2.5 py-1 rounded-md font-mono text-xs font-medium transition-colors tabular-nums ${
                      isActive
                        ? 'bg-white text-[#0f2f63]'
                        : 'text-white/75 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {p.number}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2.5 min-w-0">
              <h2
                id="autograder-modal-title"
                className="text-sm sm:text-base font-medium text-white truncate"
              >
                {activeProblem.title}
              </h2>
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap shrink-0 ${getDifficultyClasses(
                  activeProblem.difficulty
                )}`}
              >
                {activeProblem.difficulty}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 ml-auto">
            {/* Active Engine Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 border border-white/10">
              <Cpu className="h-3.5 w-3.5 text-[#5790e6]" aria-hidden="true" />
              <span>
                {executionMode === 'local' ? 'Sandbox Browser Lokal' : 'Backend FastAPI'}
              </span>
            </div>

            {/* Engine Settings Trigger (ONLY visible for Dosen / Penguji) */}
            {userRole === 'dosen' && (
              <div className="relative" ref={engineSettingsRef}>
                <button
                  type="button"
                  onClick={() => setIsEngineSettingsOpen((prev) => !prev)}
                  aria-expanded={isEngineSettingsOpen}
                  title="Pengaturan Engine (Penguji)"
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5790e6] ${
                    isEngineSettingsOpen || executionMode === 'backend'
                      ? 'border-[#5790e6] bg-[#2563c9] text-white'
                      : 'border-white/15 bg-white/10 text-white/90 hover:bg-white/20'
                  }`}
                >
                  <Sliders className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden md:inline">Pengaturan Engine (Penguji)</span>
                </button>

                {/* Popover Card */}
                {isEngineSettingsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-[#e6e8ec] p-4 text-[#0f2f63] z-50 space-y-3.5 animate-modal-enter">
                    <div className="flex items-center justify-between border-b border-[#e6e8ec] pb-2.5">
                      <div className="flex items-center gap-2 font-medium text-xs sm:text-sm">
                        <Cpu className="h-4 w-4 text-[#2563c9]" aria-hidden="true" />
                        <span>Pengaturan Engine Eksekusi</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEngineSettingsOpen(false)}
                        className="text-[#0f2f63]/50 hover:text-[#0f2f63] p-1 rounded-md"
                        aria-label="Tutup pengaturan engine"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <p className="font-medium text-[#0f2f63]/80">Mode Eksekusi:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setExecutionMode('local');
                            setBackendNotice(null);
                          }}
                          className={`px-3 py-2 rounded-xl border text-left flex flex-col gap-0.5 transition-colors ${
                            executionMode === 'local'
                              ? 'border-[#2563c9] bg-[#eaf1fd] text-[#2563c9] font-medium'
                              : 'border-[#e6e8ec] bg-white text-[#0f2f63]/70 hover:bg-[#f4f4f4]'
                          }`}
                        >
                          <span className="font-semibold text-xs">Sandbox Browser</span>
                          <span className="text-[10px] opacity-75">Default (Cepat & Mandiri)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setExecutionMode('backend')}
                          className={`px-3 py-2 rounded-xl border text-left flex flex-col gap-0.5 transition-colors ${
                            executionMode === 'backend'
                              ? 'border-[#0b6e97] bg-[#e3f4fc] text-[#0b6e97] font-medium'
                              : 'border-[#e6e8ec] bg-white text-[#0f2f63]/70 hover:bg-[#f4f4f4]'
                          }`}
                        >
                          <span className="font-semibold text-xs">FastAPI + Docker</span>
                          <span className="text-[10px] opacity-75">Pengujian Komparatif</span>
                        </button>
                      </div>
                    </div>

                    {executionMode === 'backend' && (
                      <div className="space-y-1.5 pt-1 text-xs">
                        <label htmlFor="popover-fastapi-endpoint" className="font-medium text-[#0f2f63]/80">
                          Endpoint FastAPI:
                        </label>
                        <input
                          id="popover-fastapi-endpoint"
                          type="url"
                          value={backendUrl}
                          onChange={(e) => setBackendUrl(e.target.value)}
                          className="w-full rounded-md border border-[#e6e8ec] bg-[#f4f4f4] px-2.5 py-1.5 font-mono text-xs text-[#0f2f63] focus:outline-none focus:ring-2 focus:ring-[#2563c9]"
                        />
                        <p className="text-[11px] text-[#0f2f63]/60 leading-tight">
                          Jika server FastAPI lokal tidak aktif, eksekusi otomatis dialihkan ke Sandbox Browser.
                        </p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-[#e6e8ec] flex justify-end">
                      <button
                        type="button"
                        onClick={() => setIsEngineSettingsOpen(false)}
                        className="rounded-lg bg-[#0f2f63] px-3.5 py-1.5 text-xs text-white font-medium hover:bg-[#194285]"
                      >
                        Selesai
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup workspace auto-grader"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5790e6]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Workspace Split Grid */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto lg:overflow-hidden">
          {/* Panel Kiri: 2 Tab Tahapan Belajar ("1. Pelajari Konsep" & "2. Tantangan Praktik") */}
          <aside className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#e6e8ec] bg-[#f4f4f4]/60 flex flex-col overflow-hidden">
            {/* Tab Navigation Header */}
            <div className="flex border-b border-[#e6e8ec] bg-white sticky top-0 z-10 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('materi')}
                className={`flex-1 py-3 px-3 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'materi'
                    ? 'border-[#2563c9] text-[#2563c9] bg-[#eaf1fd]/40 font-semibold'
                    : 'border-transparent text-[#0f2f63]/60 hover:text-[#0f2f63] hover:bg-[#f4f4f4]'
                }`}
              >
                <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>1. Pelajari Konsep</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('praktik')}
                className={`flex-1 py-3 px-3 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'praktik'
                    ? 'border-[#2563c9] text-[#2563c9] bg-[#eaf1fd]/40 font-semibold'
                    : 'border-transparent text-[#0f2f63]/60 hover:text-[#0f2f63] hover:bg-[#f4f4f4]'
                }`}
              >
                <Terminal className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>2. Tantangan Praktik</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'materi' ? (
                /* Tab 1: Pelajari Konsep */
                <div className="p-5 sm:p-6 space-y-6">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-[#2563c9]">
                      Materi Modul {activeProblem.number} · {activeProblem.topic}
                    </p>
                    <h3 className="text-xl font-medium text-[#0f2f63] leading-snug">
                      Konsep Dasar &amp; Panduan Belajar
                    </h3>
                    <p className="text-xs text-[#0f2f63]/70 leading-relaxed">
                      Pahami poin teori dan contoh kode berikut sebelum mulai menyelesaikan tantangan praktik pada editor.
                    </p>
                  </div>

                  {/* Poin Konsep Inti */}
                  <div className="space-y-3 pt-3 border-t border-[#e6e8ec]">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0f2f63]/75 flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5 text-[#2563c9]" aria-hidden="true" />
                      <span>Ringkasan Konsep Inti</span>
                    </h4>
                    <div className="space-y-2">
                      {activeProblem.materi.ringkasan.map((poin, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 rounded-xl bg-white border border-[#e6e8ec] p-3 text-xs sm:text-sm text-[#0f2f63]"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2563c9]/10 text-[11px] font-semibold text-[#2563c9]">
                            {idx + 1}
                          </span>
                          <p className="leading-relaxed">{poin}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contoh Kode Analogi */}
                  <div className="space-y-2 pt-1">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0f2f63]/75">
                      Contoh Kode Analogi
                    </h4>
                    <div className="rounded-xl bg-[#081730] border border-white/10 p-4 text-xs font-mono text-[#eef4ff] overflow-x-auto shadow-inner">
                      <pre className="whitespace-pre">{activeProblem.materi.contohKode}</pre>
                    </div>
                    <p className="text-[11px] text-[#0f2f63]/55 italic">
                      *Contoh di atas merupakan analogi logika serupa dan bukan kunci jawaban langsung soal ini.
                    </p>
                  </div>

                  {/* Tips & Kesalahan Umum Pemula */}
                  <div className="space-y-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 p-4">
                    <h4 className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" aria-hidden="true" />
                      <span>Tips Penting untuk Pemula</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-amber-950/90 list-disc pl-4 leading-relaxed">
                      {activeProblem.materi.tipsPemula.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Bottom Action CTA */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('praktik')}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2563c9] px-5 py-3 text-sm font-medium text-white hover:bg-[#1d52ad] transition-all shadow-sm group"
                    >
                      <span>Saya Paham, Lanjut ke Praktik</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Tab 2: Tantangan Praktik */
                <div className="p-5 sm:p-6 space-y-6">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[#2563c9]">
                      Modul {activeProblem.number} · {activeProblem.topic}
                    </p>
                    <h3 className="text-xl font-medium text-[#0f2f63] leading-snug">
                      {activeProblem.title}
                    </h3>
                    <p className="text-sm text-[#0f2f63]/80 leading-relaxed">
                      {activeProblem.description}
                    </p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-[#e6e8ec]">
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-medium text-[#0f2f63]/65">
                        Spesifikasi Format Input
                      </h4>
                      <p className="text-sm text-[#0f2f63] bg-white border border-[#e6e8ec] rounded-xl p-3.5 leading-relaxed">
                        {activeProblem.inputFormat}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-xs font-medium text-[#0f2f63]/65">
                        Spesifikasi Format Output
                      </h4>
                      <p className="text-sm text-[#0f2f63] bg-white border border-[#e6e8ec] rounded-xl p-3.5 leading-relaxed">
                        {activeProblem.outputFormat}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-xs font-medium text-[#0f2f63]/65">
                        Batasan &amp; Ketentuan
                      </h4>
                      <ul className="space-y-1.5 text-sm text-[#0f2f63]/80 list-disc pl-5">
                        {activeProblem.constraints.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Guided Hint Card (3 Tahap Bantuan) */}
                  <div className="rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-600 shrink-0" />
                        <h4 className="font-semibold text-xs text-amber-950">
                          Bantuan Pedagogis Bertingkat (3 Tahap)
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono font-medium text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full">
                        {currentHintStage === 0 ? 'Terkunci' : `Tahap ${currentHintStage}/3 Terbuka`}
                      </span>
                    </div>
                    <p className="text-xs text-amber-900/80 leading-relaxed">
                      Mengalami kendala logika atau penulisan kode? Dapatkan petunjuk bertahap tanpa langsung melihat kunci jawaban.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenHint}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-amber-700 transition-colors shadow-xs"
                    >
                      <Lightbulb className="h-3.5 w-3.5" />
                      <span>
                        {currentHintStage === 0
                          ? 'Butuh Petunjuk? (Buka Tahap 1/3)'
                          : `Lihat Petunjuk (Tahap ${currentHintStage}/3)`}
                      </span>
                    </button>
                  </div>

                  {/* Public Test Case #1 Preview */}
                  <div className="space-y-2.5 pt-4 border-t border-[#e6e8ec]">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-medium text-[#0f2f63]/65">
                        Contoh Public Test Case #1
                      </h4>
                      <span className="text-xs text-[#0b6e97] font-medium">
                        + 3 Hidden Test Cases
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white border border-[#e6e8ec] p-3.5 space-y-1">
                        <p className="text-[11px] text-[#0f2f63]/55 font-medium">Input (stdin)</p>
                        <pre className="font-mono text-xs text-[#0f2f63] whitespace-pre-wrap">
                          {publicTestCase.input}
                        </pre>
                      </div>
                      <div className="rounded-xl bg-white border border-[#e6e8ec] p-3.5 space-y-1">
                        <p className="text-[11px] text-[#0f2f63]/55 font-medium">
                          Output Diharapkan (stdout)
                        </p>
                        <pre className="font-mono text-xs text-[#0b6e97] font-medium whitespace-pre-wrap">
                          {publicTestCase.expectedOutput}
                        </pre>
                      </div>
                    </div>
                    <p className="text-xs text-[#0f2f63]/60">
                      Keterangan: {publicTestCase.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Panel Kanan: Editor Kode (Atas) + Konsol Umpan Balik (Bawah) */}
          <div className="lg:col-span-7 flex flex-col min-h-[540px] lg:min-h-0">
            {/* Panel Kanan Atas: Editor Kode (#081730) */}
            <div className="flex flex-col flex-1 min-h-[260px] bg-[#081730] text-white">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#0a1d3b] shrink-0">
                <div className="flex items-center gap-2 text-xs font-mono text-[#8fb8f3] min-w-0">
                  <Terminal className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">solusi_modul_{activeProblem.number}.py</span>
                  <span className="text-white/40 hidden sm:inline">
                    · Tab = 4 spasi
                  </span>
                  {currentAttempt > 0 && (
                    <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] text-amber-200 border border-white/10 font-sans font-semibold shrink-0">
                      Attempt #{currentAttempt}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenHint}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      currentHintStage > 0
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/35 hover:bg-amber-400/30'
                        : 'bg-white/10 text-white/90 border border-white/15 hover:bg-white/20'
                    }`}
                    title="Buka petunjuk bertingkat untuk modul ini"
                  >
                    <Lightbulb className="h-3.5 w-3.5 text-amber-300" />
                    <span>
                      {currentHintStage === 0
                        ? 'Butuh Petunjuk? (Hint 1/3)'
                        : `Petunjuk (${currentHintStage}/3)`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetCode}
                    className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white/80 hover:bg-white/15 hover:text-white transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">Reset Kode</span>
                  </button>
                </div>
              </div>

              <div className="relative flex-1 flex min-h-0 overflow-hidden">
                {/* Line Numbers Gutter */}
                <div
                  ref={gutterRef}
                  aria-hidden="true"
                  className="w-12 shrink-0 select-none overflow-hidden bg-[#061226] border-r border-white/10 py-3.5 pr-3 text-right font-mono text-xs leading-6 text-white/35 tabular-nums"
                >
                  {Array.from({ length: lineCount }, (_, idx) => (
                    <div key={idx + 1}>{idx + 1}</div>
                  ))}
                </div>

                {/* Code Textarea */}
                <label htmlFor="python-code-editor" className="sr-only">
                  Editor kode Python untuk Modul {activeProblem.number}
                </label>
                <textarea
                  id="python-code-editor"
                  ref={textareaRef}
                  value={currentCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  onKeyDown={handleEditorKeyDown}
                  onScroll={handleEditorScroll}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  className="flex-1 w-full h-full resize-none bg-[#081730] text-[#eef4ff] font-mono text-xs sm:text-[13px] leading-6 p-3.5 focus:outline-none caret-[#5790e6]"
                />
              </div>
            </div>

            {/* Panel Kanan Bawah: Konsol Umpan Balik Instan */}
            <div className="flex flex-col h-[46%] min-h-[250px] border-t border-[#e6e8ec] bg-white">
              {/* Console Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-3 bg-[#f4f4f4] border-b border-[#e6e8ec] shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#0f2f63]">
                    Konsol Umpan Balik Instan
                  </span>
                  {currentAttempt > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#0f2f63]/10 px-2 py-0.5 text-[11px] font-mono font-medium text-[#0f2f63]">
                      Percobaan ke-{currentAttempt}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isRunning}
                    onClick={() => runEvaluation('sample')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#0f2f63]/20 bg-white px-3.5 py-2 text-xs font-medium text-[#0f2f63] hover:border-[#2563c9] hover:text-[#2563c9] disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Jalankan Sampel</span>
                  </button>

                  <button
                    type="button"
                    disabled={isRunning}
                    onClick={() => runEvaluation('submit')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563c9] px-4 py-2 text-xs font-medium text-white hover:bg-[#1d52ad] disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    <Send className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Submit &amp; Nilai Otomatis</span>
                  </button>
                </div>
              </div>

              {/* Console Output Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {backendNotice && (
                  <div className="rounded-lg border border-[#5790e6]/40 bg-[#eaf1fd] px-3.5 py-2 text-xs text-[#0f2f63]">
                    {backendNotice}
                  </div>
                )}

                {!currentResult ? (
                  <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center px-4 py-6 text-[#0f2f63]/55 space-y-1.5">
                    <Terminal className="h-6 w-6 text-[#5790e6]" aria-hidden="true" />
                    <p className="text-sm font-medium text-[#0f2f63]/80">
                      Belum ada hasil eksekusi untuk Modul {activeProblem.number}
                    </p>
                    <p className="text-xs max-w-md">
                      Klik &ldquo;Jalankan Sampel&rdquo; untuk menguji Public Test Case #1 atau
                      &ldquo;Submit &amp; Nilai Otomatis&rdquo; untuk menilai keempat test case.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Verdict Summary Banner */}
                    {(() => {
                      const theme = getVerdictTheme(currentResult.verdict);
                      return (
                        <div
                          data-testid="verdict-banner"
                          className={`rounded-xl border p-3.5 space-y-2 ${theme.container}`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {theme.icon}
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-medium ${theme.label}`}
                              >
                                {currentResult.verdict}
                              </span>
                              <span className="text-xs font-medium opacity-80">
                                {currentResult.mode === 'sample'
                                  ? 'Uji Sampel Publik'
                                  : 'Penilaian Penuh (4 Test Cases)'}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
                              {currentAttempt > 0 && (
                                <span className="inline-flex items-center gap-1 rounded bg-[#0f2f63]/10 px-2 py-0.5 text-[11px] font-semibold text-[#0f2f63]">
                                  Percobaan #{currentAttempt}
                                </span>
                              )}
                              <span className="font-medium">
                                Skor: {currentResult.score}/100
                              </span>
                              <span className="inline-flex items-center gap-1 opacity-75">
                                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                {currentResult.executionTimeMs} ms
                              </span>
                            </div>
                          </div>

                          <p className="text-xs sm:text-sm leading-relaxed">
                            {currentResult.diagnosis}
                          </p>
                        </div>
                      );
                    })()}

                    {/* Per Test-Case Results */}
                    {currentResult.testResults.length > 0 && (
                      <div className="space-y-2.5">
                        {currentResult.testResults.map((tr) => (
                          <div
                            key={tr.testCaseId}
                            className="rounded-xl border border-[#e6e8ec] bg-[#f4f4f4]/50 p-3.5 space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-xs font-medium text-[#0f2f63]">
                                {tr.passed ? (
                                  <CheckCircle2
                                    className="h-4 w-4 text-emerald-600 shrink-0"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <XCircle
                                    className="h-4 w-4 text-rose-600 shrink-0"
                                    aria-hidden="true"
                                  />
                                )}
                                <span>
                                  Test Case #{tr.testCaseId}{' '}
                                  {tr.isPublic ? '(Publik)' : '(Hidden)'}
                                </span>
                                {!tr.isPublic && (
                                  <Lock
                                    className="h-3 w-3 text-[#0f2f63]/45"
                                    aria-hidden="true"
                                  />
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                                <span
                                  className={
                                    tr.passed
                                      ? 'text-emerald-700 font-medium'
                                      : 'text-rose-700 font-medium'
                                  }
                                >
                                  {tr.passed ? 'LOLOS' : tr.status}
                                </span>
                                <span className="text-[#0f2f63]/55">
                                  {tr.executionTimeMs} ms
                                </span>
                              </div>
                            </div>

                            {tr.isPublic ? (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                                <div className="rounded-lg bg-white border border-[#e6e8ec] p-2.5">
                                  <p className="text-[#0f2f63]/60 mb-1 font-sans text-[11px] font-semibold">
                                    Input (stdin)
                                  </p>
                                  <pre className="whitespace-pre-wrap text-[#0f2f63]">
                                    {tr.input}
                                  </pre>
                                </div>
                                <div className="rounded-lg bg-emerald-50/70 border border-emerald-200 p-2.5">
                                  <p className="text-emerald-800 mb-1 font-sans text-[11px] font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                    Output Diharapkan (Expected)
                                  </p>
                                  <pre className="whitespace-pre-wrap text-emerald-800 font-bold">
                                    {tr.expectedOutput}
                                  </pre>
                                </div>
                                <div
                                  className={`rounded-lg p-2.5 border ${
                                    tr.passed
                                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                                      : 'bg-rose-50/80 border-rose-300 text-rose-800'
                                  }`}
                                >
                                  <p
                                    className={`mb-1 font-sans text-[11px] font-semibold flex items-center gap-1 ${
                                      tr.passed ? 'text-emerald-800' : 'text-rose-800'
                                    }`}
                                  >
                                    {tr.passed ? (
                                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                    ) : (
                                      <XCircle className="h-3 w-3 text-rose-600" />
                                    )}
                                    Output Aktual Anda (Actual)
                                  </p>
                                  <pre className="whitespace-pre-wrap font-bold">
                                    {tr.errorMessage
                                      ? tr.errorMessage
                                      : tr.actualOutput !== ''
                                      ? tr.actualOutput
                                      : '(Output kosong / tidak ada yang dicetak)'}
                                  </pre>
                                </div>
                              </div>
                            ) : tr.passed ? (
                              <div className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-2">
                                <span className="font-medium">
                                  Kasus uji tersembunyi berhasil diselesaikan dengan benar.
                                </span>
                              </div>
                            ) : (
                              /* Educational hint for failed hidden test case */
                              <div className="flex flex-col gap-2 text-xs bg-amber-50/80 border border-amber-300 rounded-xl p-3.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 font-medium text-amber-900">
                                    <Lightbulb className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />
                                    <span className="font-semibold">Petunjuk Kasus Uji Tersembunyi:</span>
                                  </div>
                                  <span className="text-[10px] font-mono font-medium bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded">
                                    Kasus Tersembunyi Gagal
                                  </span>
                                </div>
                                <p className="text-amber-950 text-xs leading-relaxed">
                                  {tr.errorMessage
                                    ? tr.errorMessage
                                    : `Petunjuk: Periksa kembali penanganan skenario "${tr.description}". Pastikan alur logika dan batasan kondisi kode Anda mencakup kasus ini.`}
                                </p>
                                {tr.actualOutput && (
                                  <div className="rounded-lg bg-white/90 border border-amber-200 p-2 text-[11px] font-mono text-[#0f2f63]">
                                    <span className="text-gray-500 font-sans block text-[10px]">
                                      Output yang dicetak program Anda:
                                    </span>
                                    <span className="text-rose-700 font-bold">{tr.actualOutput}</span>
                                  </div>
                                )}
                                <p className="text-[11px] text-amber-800/70 pt-0.5">
                                  (Nilai input dan expected output angka dirahasiakan untuk melatih kemampuan penelusuran mandiri).
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Petunjuk Bertingkat (Guided Hints) */}
        {isHintPanelOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="hint-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#081730]/75 p-3 sm:p-4 animate-overlay-fade"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsHintPanelOpen(false);
            }}
          >
            <div className="animate-modal-enter w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-[#e6e8ec] overflow-hidden flex flex-col text-[#0f2f63]">
              {/* Header */}
              <div className="bg-[#0f2f63] text-white px-5 py-4 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    <Lightbulb className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 id="hint-modal-title" className="text-sm sm:text-base font-semibold text-white">
                      Petunjuk Bertingkat · Modul {activeProblem.number}
                    </h3>
                    <p className="text-[11px] text-[#8fb8f3]">
                      {activeProblem.topic} · Tahap {currentHintStage} dari 3 Terbuka
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsHintPanelOpen(false)}
                  className="h-8 w-8 rounded-lg border border-white/15 bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  aria-label="Tutup petunjuk"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Stages Tabs */}
              <div className="flex border-b border-[#e6e8ec] bg-[#f4f4f4] p-1.5 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveHintTab(1)}
                  className={`flex-1 py-2 px-2 rounded-lg font-medium transition-colors text-center ${
                    activeHintTab === 1
                      ? 'bg-white text-[#0f2f63] shadow-xs'
                      : 'text-[#0f2f63]/70 hover:text-[#0f2f63]'
                  }`}
                >
                  1. Konsep Logika
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (currentHintStage >= 2) setActiveHintTab(2);
                  }}
                  disabled={currentHintStage < 2}
                  className={`flex-1 py-2 px-2 rounded-lg font-medium transition-colors text-center flex items-center justify-center gap-1 ${
                    activeHintTab === 2
                      ? 'bg-white text-[#0f2f63] shadow-xs'
                      : currentHintStage < 2
                      ? 'text-gray-400 opacity-60 cursor-not-allowed'
                      : 'text-[#0f2f63]/70 hover:text-[#0f2f63]'
                  }`}
                >
                  {currentHintStage < 2 && <Lock className="h-3 w-3 shrink-0" />}
                  <span>2. Sintaks</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (currentHintStage >= 3) setActiveHintTab(3);
                  }}
                  disabled={currentHintStage < 3}
                  className={`flex-1 py-2 px-2 rounded-lg font-medium transition-colors text-center flex items-center justify-center gap-1 ${
                    activeHintTab === 3
                      ? 'bg-white text-[#0f2f63] shadow-xs'
                      : currentHintStage < 3
                      ? 'text-gray-400 opacity-60 cursor-not-allowed'
                      : 'text-[#0f2f63]/70 hover:text-[#0f2f63]'
                  }`}
                >
                  {currentHintStage < 3 && <Lock className="h-3 w-3 shrink-0" />}
                  <span>3. Alur I/O</span>
                </button>
              </div>

              {/* Tab Body */}
              <div className="p-5 space-y-4">
                {activeHintTab === 1 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2563c9]">
                      <span className="flex h-5 w-5 rounded-full bg-[#2563c9]/10 items-center justify-center text-[11px]">1</span>
                      <span>Tahap 1: Alur Logika Penyelesaian</span>
                    </div>
                    <div className="rounded-xl bg-[#f4f6fa] border border-[#e6e8ec] p-4 text-xs sm:text-sm text-[#0f2f63] leading-relaxed">
                      {activeProblem.hints.tahap1}
                    </div>
                    {currentHintStage < 2 && (
                      <button
                        type="button"
                        onClick={handleUnlockNextHint}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2.5 text-xs transition-colors shadow-xs"
                      >
                        <Lightbulb className="h-4 w-4" />
                        <span>Buka Petunjuk Lanjutan (Tahap 2: Struktur Sintaks) →</span>
                      </button>
                    )}
                  </div>
                )}

                {activeHintTab === 2 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0b6e97]">
                      <span className="flex h-5 w-5 rounded-full bg-[#0b6e97]/10 items-center justify-center text-[11px]">2</span>
                      <span>Tahap 2: Kata Kunci &amp; Struktur Sintaks</span>
                    </div>
                    <div className="rounded-xl bg-[#eaf4f9] border border-[#0b6e97]/30 p-4 text-xs sm:text-sm text-[#0f2f63] leading-relaxed font-mono">
                      <p className="font-sans leading-relaxed">{activeProblem.hints.tahap2}</p>
                    </div>
                    {currentHintStage < 3 && (
                      <button
                        type="button"
                        onClick={handleUnlockNextHint}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2.5 text-xs transition-colors shadow-xs"
                      >
                        <Lightbulb className="h-4 w-4" />
                        <span>Buka Petunjuk Terakhir (Tahap 3: Contoh Alur I/O) →</span>
                      </button>
                    )}
                  </div>
                )}

                {activeHintTab === 3 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">
                      <span className="flex h-5 w-5 rounded-full bg-emerald-100 items-center justify-center text-[11px]">3</span>
                      <span>Tahap 3: Ilustrasi Membaca Input &amp; Output</span>
                    </div>
                    <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-4 text-xs sm:text-sm text-emerald-950 leading-relaxed">
                      {activeProblem.hints.tahap3}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-800 bg-white border border-emerald-200 rounded-lg p-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Seluruh 3 tahap petunjuk telah terbuka. Silakan coba terapkan di editor kode!</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-[#f4f4f4] px-5 py-3 border-t border-[#e6e8ec] flex items-center justify-between text-xs">
                <span className="text-[#0f2f63]/60 italic">
                  *Petunjuk dirancang untuk mengarahkan alur pikir secara mandiri.
                </span>
                <button
                  type="button"
                  onClick={() => setIsHintPanelOpen(false)}
                  className="rounded-lg bg-[#0f2f63] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#194285]"
                >
                  Tutup Petunjuk
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
