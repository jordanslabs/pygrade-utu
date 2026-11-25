export interface SusQuestion {
  id: number;
  text: string;
  polarity: 'positive' | 'negative';
}

export interface SusResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  adjective: string;
  isAcceptable: boolean;
  acceptabilityLabel: 'Acceptable' | 'Not Acceptable';
  positiveContribution: number;
  negativeContribution: number;
}

export const SUS_QUESTIONS: SusQuestion[] = [
  {
    id: 1,
    text: 'Saya rasa saya akan sering menggunakan sistem PyGrade UTU ini dalam kegiatan praktikum.',
    polarity: 'positive',
  },
  {
    id: 2,
    text: 'Saya merasa sistem ini terlalu rumit padahal seharusnya dapat dibuat lebih sederhana.',
    polarity: 'negative',
  },
  {
    id: 3,
    text: 'Saya merasa sistem PyGrade UTU mudah digunakan sejak pertama kali dicoba.',
    polarity: 'positive',
  },
  {
    id: 4,
    text: 'Saya merasa membutuhkan bantuan teknis atau asisten dosen untuk dapat menggunakan sistem ini.',
    polarity: 'negative',
  },
  {
    id: 5,
    text: 'Saya merasa berbagai fitur di dalam sistem ini (editor, tombol uji, dan umpan balik) terintegrasi dengan baik.',
    polarity: 'positive',
  },
  {
    id: 6,
    text: 'Saya merasa terdapat terlalu banyak ketidakkonsistenan pada antarmuka maupun alur kerja sistem ini.',
    polarity: 'negative',
  },
  {
    id: 7,
    text: 'Saya membayangkan sebagian besar mahasiswa Teknologi Informasi akan cepat mempelajari cara menggunakan sistem ini.',
    polarity: 'positive',
  },
  {
    id: 8,
    text: 'Saya merasa sistem ini sangat membingungkan atau merepotkan saat digunakan untuk menguji kode.',
    polarity: 'negative',
  },
  {
    id: 9,
    text: 'Saya merasa sangat percaya diri saat menggunakan platform auto-grading ini secara mandiri.',
    polarity: 'positive',
  },
  {
    id: 10,
    text: 'Saya harus mempelajari banyak hal terlebih dahulu sebelum dapat mulai mengerjakan soal di sistem ini.',
    polarity: 'negative',
  },
];

export const LIKERT_LABELS: Record<number, string> = {
  1: 'Sangat Tidak Setuju',
  2: 'Tidak Setuju',
  3: 'Netral',
  4: 'Setuju',
  5: 'Sangat Setuju',
};

/**
 * Menghitung skor baku System Usability Scale (SUS):
 * - Item ganjil (1, 3, 5, 7, 9): skor - 1
 * - Item genap (2, 4, 6, 8, 10): 5 - skor
 * - Skor akhir = total kontribusi * 2.5 (rentang 0 - 100)
 * - Acceptable jika skor >= 68
 */
export function calculateSusScore(responses: Record<number, number>): SusResult {
  let positiveContribution = 0;
  let negativeContribution = 0;

  for (const question of SUS_QUESTIONS) {
    const raw = responses[question.id];
    if (typeof raw !== 'number' || raw < 1 || raw > 5) {
      throw new Error(`Jawaban untuk pernyataan nomor ${question.id} belum lengkap atau tidak valid.`);
    }

    if (question.id % 2 === 1) {
      positiveContribution += raw - 1;
    } else {
      negativeContribution += 5 - raw;
    }
  }

  const totalContribution = positiveContribution + negativeContribution;
  const score = Number((totalContribution * 2.5).toFixed(1));

  let grade: SusResult['grade'];
  let adjective: string;

  if (score >= 85) {
    grade = 'A';
    adjective = 'Sangat Baik (Excellent)';
  } else if (score >= 74) {
    grade = 'B';
    adjective = 'Baik (Good)';
  } else if (score >= 68) {
    grade = 'C';
    adjective = 'Cukup Baik (OK)';
  } else if (score >= 51) {
    grade = 'D';
    adjective = 'Kurang (Marginal)';
  } else {
    grade = 'F';
    adjective = 'Buruk (Poor)';
  }

  const isAcceptable = score >= 68;

  return {
    score,
    grade,
    adjective,
    isAcceptable,
    acceptabilityLabel: isAcceptable ? 'Acceptable' : 'Not Acceptable',
    positiveContribution,
    negativeContribution,
  };
}
