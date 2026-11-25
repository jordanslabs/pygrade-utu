import { useEffect, useState } from 'react';
import { PROBLEMS } from './data/problems';
import { HeroSection } from './components/HeroSection';
import { CurriculumSection } from './components/CurriculumSection';
import { ArchitectureSection } from './components/ArchitectureSection';
import { StatsSection } from './components/StatsSection';
import { Footer } from './components/Footer';
import { AutoGraderModal } from './components/AutoGraderModal';
import { SusSurveyModal } from './components/SusSurveyModal';
import { AuthModal } from './components/AuthModal';
import { LecturerDashboardModal } from './components/LecturerDashboardModal';
import { CertificateModal } from './components/CertificateModal';
import {
  type AuthUser,
  type UserRole,
  getStoredUser,
  saveStoredUser,
} from './services/authService';
import {
  getLocalRecords,
  upsertStudentRecord,
} from './services/recordService';
import type { SusResult } from './utils/susCalculator';

type PendingAction =
  | { type: 'grader'; problemId?: string }
  | { type: 'sus' }
  | null;

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authRole, setAuthRole] = useState<UserRole>('mahasiswa');
  const [authPromptMessage, setAuthPromptMessage] = useState<string | undefined>(undefined);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const [isGraderOpen, setIsGraderOpen] = useState(false);
  const [activeProblemId, setActiveProblemId] = useState<string>(PROBLEMS[0].id);
  const [isSusOpen, setIsSusOpen] = useState(false);
  const [isLecturerDashboardOpen, setIsLecturerDashboardOpen] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Engine configuration lifted to App so Dosen dashboard can control it
  const [executionMode, setExecutionMode] = useState<'local' | 'backend'>('local');
  const [backendUrl, setBackendUrl] = useState('http://localhost:8000/api/evaluate');

  const [solvedScores, setSolvedScores] = useState<Record<string, number>>({});
  const [lastSusScore, setLastSusScore] = useState<number | null>(null);

  // Restore scores for logged in student
  useEffect(() => {
    if (user && user.role === 'mahasiswa') {
      const records = getLocalRecords();
      const existing = records.find((r) => r.nim === user.nim);
      if (existing) {
        setSolvedScores({
          'modul-01': existing.modul_1,
          'modul-02': existing.modul_2,
          'modul-03': existing.modul_3,
          'modul-04': existing.modul_4,
        });
        if (existing.skor_sus !== null) {
          setLastSusScore(existing.skor_sus);
        }
      }
    } else if (!user) {
      setSolvedScores({});
      setLastSusScore(null);
    }
  }, [user]);

  const handleOpenAuth = (role: UserRole = 'mahasiswa') => {
    setAuthRole(role);
    setAuthPromptMessage(undefined);
    setIsAuthOpen(true);
  };

  const handleLogout = () => {
    saveStoredUser(null);
    setUser(null);
    setIsGraderOpen(false);
    setIsSusOpen(false);
    setIsLecturerDashboardOpen(false);
    setIsCertificateOpen(false);
  };

  const handleOpenGrader = (problemId?: string) => {
    if (problemId) {
      setActiveProblemId(problemId);
    }

    if (!user) {
      setAuthRole('mahasiswa');
      setAuthPromptMessage(
        'Silakan masuk terlebih dahulu dengan identitas Mahasiswa untuk memulai praktikum dan menyimpan hasil kode Anda.'
      );
      setPendingAction({ type: 'grader', problemId });
      setIsAuthOpen(true);
      return;
    }

    setIsGraderOpen(true);
  };

  const handleOpenSus = () => {
    if (!user) {
      setAuthRole('mahasiswa');
      setAuthPromptMessage(
        'Silakan masuk terlebih dahulu dengan identitas Mahasiswa untuk mengisi kuesioner evaluasi System Usability Scale (SUS).'
      );
      setPendingAction({ type: 'sus' });
      setIsAuthOpen(true);
      return;
    }

    setIsSusOpen(true);
  };

  const handleLoginSuccess = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);

    // Execute pending action if any
    if (pendingAction) {
      if (pendingAction.type === 'grader') {
        if (pendingAction.problemId) {
          setActiveProblemId(pendingAction.problemId);
        }
        setIsGraderOpen(true);
      } else if (pendingAction.type === 'sus') {
        setIsSusOpen(true);
      }
      setPendingAction(null);
    }
  };

  const handleScoreUpdate = (problemId: string, score: number) => {
    setSolvedScores((prev) => {
      const updated = {
        ...prev,
        [problemId]: Math.max(prev[problemId] ?? 0, score),
      };

      // Auto-sync to Supabase & localStorage if user is Mahasiswa
      if (user && user.role === 'mahasiswa') {
        const modulField =
          problemId === 'modul-01'
            ? 'modul_1'
            : problemId === 'modul-02'
            ? 'modul_2'
            : problemId === 'modul-03'
            ? 'modul_3'
            : 'modul_4';

        upsertStudentRecord({
          nim: user.nim,
          nama: user.nama,
          [modulField]: Math.max(prev[problemId] ?? 0, score),
        });
      }

      return updated;
    });
  };

  const handleSusComplete = (result: SusResult) => {
    setLastSusScore(result.score);

    // Auto-sync SUS score to Supabase & localStorage if user is Mahasiswa
    if (user && user.role === 'mahasiswa') {
      upsertStudentRecord({
        nim: user.nim,
        nama: user.nama,
        skor_sus: result.score,
        grade_sus: result.grade,
      });
    }
  };

  const solvedCount = Object.values(solvedScores).filter((s) => s === 100).length;
  const passedModulesCount = PROBLEMS.filter((p) => (solvedScores[p.id] ?? 0) >= 70).length;
  const isEligibleForCertificate =
    user?.role === 'mahasiswa' && passedModulesCount === PROBLEMS.length && PROBLEMS.length > 0;

  return (
    <div className="min-h-screen bg-white p-2 sm:p-3 overflow-x-hidden">
      <div className="mx-auto max-w-[1440px] space-y-2 sm:space-y-3">
        <main className="space-y-2 sm:space-y-3">
          <HeroSection
            user={user}
            onOpenAuth={handleOpenAuth}
            onLogout={handleLogout}
            onOpenLecturerDashboard={() => setIsLecturerDashboardOpen(true)}
            onOpenGrader={handleOpenGrader}
            onOpenSus={handleOpenSus}
            isMenuOpen={isMenuOpen}
            onToggleMenu={setIsMenuOpen}
            solvedCount={solvedCount}
            totalProblems={PROBLEMS.length}
            isEligibleForCertificate={isEligibleForCertificate}
            onOpenCertificate={() => setIsCertificateOpen(true)}
          />

          <CurriculumSection
            problems={PROBLEMS}
            solvedScores={solvedScores}
            onSelectProblem={(id) => handleOpenGrader(id)}
            user={user}
            onOpenCertificate={() => setIsCertificateOpen(true)}
          />

          <ArchitectureSection />

          <StatsSection />
        </main>

        <Footer
          onOpenGrader={handleOpenGrader}
          onOpenSus={handleOpenSus}
          lastSusScore={lastSusScore}
        />
      </div>

      {/* Modal Auto-Grader */}
      <AutoGraderModal
        isOpen={isGraderOpen}
        problems={PROBLEMS}
        activeProblemId={activeProblemId}
        onSelectProblem={setActiveProblemId}
        onClose={() => setIsGraderOpen(false)}
        onScoreUpdate={handleScoreUpdate}
        userRole={user?.role}
        executionMode={executionMode}
        onExecutionModeChange={setExecutionMode}
        backendUrl={backendUrl}
        onBackendUrlChange={setBackendUrl}
      />

      {/* Modal Kuesioner SUS */}
      <SusSurveyModal
        isOpen={isSusOpen}
        onClose={() => setIsSusOpen(false)}
        onComplete={handleSusComplete}
      />

      {/* Modal Autentikasi Mahasiswa / Dosen */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setPendingAction(null);
        }}
        onLoginSuccess={handleLoginSuccess}
        initialRole={authRole}
        promptMessage={authPromptMessage}
      />

      {/* Modal Dashboard Rekap Khusus Dosen / Penguji */}
      <LecturerDashboardModal
        isOpen={isLecturerDashboardOpen}
        onClose={() => setIsLecturerDashboardOpen(false)}
        executionMode={executionMode}
        onExecutionModeChange={setExecutionMode}
        backendUrl={backendUrl}
        onBackendUrlChange={setBackendUrl}
      />

      {/* Modal e-Sertifikat Kelulusan */}
      <CertificateModal
        isOpen={isCertificateOpen}
        onClose={() => setIsCertificateOpen(false)}
        user={user}
        problems={PROBLEMS}
        solvedScores={solvedScores}
      />
    </div>
  );
}
