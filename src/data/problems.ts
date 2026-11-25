export type Difficulty = 'Mudah' | 'Sedang' | 'Sulit';

export interface TestCase {
  id: number;
  isPublic: boolean;
  input: string;
  expectedOutput: string;
  description: string;
}

export interface ProblemMateri {
  ringkasan: string[];
  contohKode: string;
  tipsPemula: string[];
}

export interface Problem {
  id: string;
  number: string;
  title: string;
  topic: string;
  difficulty: Difficulty;
  summary: string;
  description: string;
  materi: ProblemMateri;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  starterCode: string;
  referenceSolution: string;
  testCases: TestCase[];
}

export const PROBLEMS: Problem[] = [
  {
    id: 'modul-01',
    number: '01',
    title: 'Variabel & Operator Dasar',
    topic: 'Kalkulator Total Belanja Kantin',
    difficulty: 'Mudah',
    summary:
      'Membaca harga satuan dan jumlah barang menggunakan input(), lalu menghitung total pembayaran menggunakan operator perkalian (*).',
    description:
      'Kantin Universitas Teuku Umar memerlukan program kasir sederhana untuk menghitung total belanja mahasiswa. Buatlah program Python yang membaca harga satuan barang (baris pertama) dan jumlah barang yang dibeli (baris kedua), kemudian cetak total harga yang harus dibayar (harga * jumlah).',
    materi: {
      ringkasan: [
        'Variabel digunakan untuk menyimpan data, seperti harga satuan dan jumlah barang.',
        'int(input()) digunakan untuk membaca masukan bilangan bulat dari pengguna per baris.',
        'Operator perkalian (*) digunakan untuk menghitung total biaya (harga dikali jumlah barang).',
      ],
      contohKode: `# Contoh analogi: Menghitung total harga tiket bioskop
harga_tiket = int(input())   # Membaca harga satu tiket
jumlah_tiket = int(input())  # Membaca banyaknya tiket yang dibeli

# Hitung total biaya dengan operator perkalian (*)
total_bayar = harga_tiket * jumlah_tiket

# Cetak total harga
print(total_bayar)`,
      tipsPemula: [
        'Fungsi input() membaca data per baris: input() pertama otomatis membaca harga satuan, dan input() kedua otomatis membaca jumlah barang.',
        'Di sistem auto-grader, input() dibaca otomatis dari sistem tanpa perlu menulis teks di dalam kurung seperti input("Masukkan harga: "). Jika ditulis, teks tersebut akan dianggap output yang salah.',
      ],
    },
    inputFormat: 'Dua baris input: baris pertama berisi bilangan bulat harga satuan barang, dan baris kedua berisi bilangan bulat jumlah barang.',
    outputFormat: 'Satu baris berisi bilangan bulat total harga yang harus dibayar.',
    constraints: ['1 <= harga <= 1000000', '1 <= jumlah <= 1000'],
    starterCode: `# Modul 01: Kalkulator Total Belanja Kantin
harga = int(input())
jumlah = int(input())

# TODO: Hitung total belanja (harga dikalikan dengan jumlah)
total = 0

print(total)`,
    referenceSolution: `harga = int(input())
jumlah = int(input())
total = harga * jumlah
print(total)`,
    testCases: [
      {
        id: 1,
        isPublic: true,
        input: '5000\n3',
        expectedOutput: '15000',
        description: 'Total belanja 3 botol seharga 5000',
      },
      {
        id: 2,
        isPublic: false,
        input: '12000\n2',
        expectedOutput: '24000',
        description: 'Total belanja 2 porsi seharga 12000',
      },
      {
        id: 3,
        isPublic: false,
        input: '7500\n4',
        expectedOutput: '30000',
        description: 'Total belanja 4 item seharga 7500',
      },
      {
        id: 4,
        isPublic: false,
        input: '10000\n1',
        expectedOutput: '10000',
        description: 'Total belanja 1 item seharga 10000',
      },
    ],
  },
  {
    id: 'modul-02',
    number: '02',
    title: 'Percabangan Logika (If-Elif-Else)',
    topic: 'Penentu Status Kelulusan Praktikum',
    difficulty: 'Mudah',
    summary:
      'Menerapkan struktur percabangan if-elif-else untuk menentukan status kelulusan praktikum berdasarkan rentang nilai mahasiswa.',
    description:
      'Laboratorium Komputer UTU ingin menentukan status kelulusan mahasiswa pada praktikum pemrograman. Program membaca satu bilangan bulat nilai (0–100). Jika nilai >= 70 cetak LULUS, jika nilai >= 50 cetak REMEDIAL, dan jika nilai < 50 cetak TIDAK LULUS.',
    materi: {
      ringkasan: [
        'Percabangan if-elif-else mengevaluasi kondisi secara berurutan dari atas ke bawah.',
        'Kondisi pertama yang bernilai True akan dijalankan, lalu sisa kondisi lainnya diabaikan.',
        'Gunakan operator perbandingan >= untuk memeriksa batas nilai kelulusan.',
      ],
      contohKode: `# Contoh analogi: Menentukan kategori usia tiket wahana
usia = int(input())

if usia >= 17:
    print("DEWASA")
elif usia >= 12:
    print("REMAJA")
else:
    print("ANAK-ANAK")`,
      tipsPemula: [
        'Perhatikan urutan kondisi: periksa nilai >= 70 terlebih dahulu sebelum nilai >= 50 agar nilai tinggi tidak keliru masuk ke status remedial.',
        'Perhatikan penulisan teks output: gunakan huruf kapital persis sesuai instruksi soal (LULUS, REMEDIAL, TIDAK LULUS).',
      ],
    },
    inputFormat: 'Satu baris berisi sebuah bilangan bulat yang menyatakan nilai praktikum mahasiswa.',
    outputFormat: 'Satu baris berisi teks status: LULUS, REMEDIAL, atau TIDAK LULUS.',
    constraints: ['0 <= nilai <= 100'],
    starterCode: `# Modul 02: Penentu Status Kelulusan Praktikum
nilai = int(input())

# TODO: Lengkapi struktur if-elif-else di bawah ini:
# - Jika nilai >= 70: cetak LULUS
# - Jika nilai >= 50: cetak REMEDIAL
# - Selain itu: cetak TIDAK LULUS

if nilai >= 70:
    print("LULUS")
# TODO: Tambahkan elif di sini untuk nilai >= 50
else:
    print("TIDAK LULUS")`,
    referenceSolution: `nilai = int(input())
if nilai >= 70:
    print("LULUS")
elif nilai >= 50:
    print("REMEDIAL")
else:
    print("TIDAK LULUS")`,
    testCases: [
      {
        id: 1,
        isPublic: true,
        input: '85',
        expectedOutput: 'LULUS',
        description: 'Nilai di atas 70 dinyatakan LULUS',
      },
      {
        id: 2,
        isPublic: false,
        input: '70',
        expectedOutput: 'LULUS',
        description: 'Nilai batas tepat 70 dinyatakan LULUS',
      },
      {
        id: 3,
        isPublic: false,
        input: '60',
        expectedOutput: 'REMEDIAL',
        description: 'Nilai antara 50 sampai 69 dinyatakan REMEDIAL',
      },
      {
        id: 4,
        isPublic: false,
        input: '40',
        expectedOutput: 'TIDAK LULUS',
        description: 'Nilai di bawah 50 dinyatakan TIDAK LULUS',
      },
    ],
  },
  {
    id: 'modul-03',
    number: '03',
    title: 'Perulangan & Akumulasi (For/While)',
    topic: 'Total Penjumlahan Deret 1 sampai N',
    difficulty: 'Sedang',
    summary:
      'Menggunakan perulangan for range() dan variabel akumulator untuk menghitung penjumlahan beruntun dari 1 hingga n.',
    description:
      'Buatlah program Python yang membaca sebuah bilangan bulat positif n, lalu menghitung dan mencetak hasil penjumlahan seluruh bilangan bulat mulai dari 1 hingga n (1 + 2 + 3 + ... + n).',
    materi: {
      ringkasan: [
        'Perulangan for i in range(1, n + 1) berulang dari angka 1 hingga n secara inklusif.',
        'Variabel total = 0 disiapkan sebagai penampung (akumulator) sebelum loop dimulai.',
        'Perintah total += i (atau total = total + i) menambahkan nilai i ke akumulator pada setiap putaran perulangan.',
      ],
      contohKode: `# Contoh analogi: Menghitung total tabungan harian bertingkat dari hari 1 sampai n
n = int(input())
total_tabungan = 0  # Inisialisasi awal

for hari in range(1, n + 1):
    total_tabungan += hari  # Tambahkan nominal hari ini ke tabungan

print(total_tabungan)`,
      tipsPemula: [
        'Ingat bahwa fungsi range(1, n) berhenti di n - 1. Gunakan range(1, n + 1) agar bilangan n ikut dijumlahkan.',
        'Pastikan perintah print(total) berada di luar blok perulangan for (tidak diindentasi) agar hasil akhir dicetak sekali.',
      ],
    },
    inputFormat: 'Satu baris berisi sebuah bilangan bulat positif n.',
    outputFormat: 'Satu baris berisi bilangan bulat total penjumlahan dari 1 hingga n.',
    constraints: ['1 <= n <= 10000'],
    starterCode: `# Modul 03: Total Penjumlahan Deret 1 sampai N
n = int(input())
total = 0

# TODO: Gunakan perulangan for untuk menjumlahkan angka dari 1 sampai n
# Petunjuk: gunakan range(1, n + 1) dan tambahkan ke variabel total

print(total)`,
    referenceSolution: `n = int(input())
total = 0
for i in range(1, n + 1):
    total += i
print(total)`,
    testCases: [
      {
        id: 1,
        isPublic: true,
        input: '4',
        expectedOutput: '10',
        description: 'Penjumlahan 1 + 2 + 3 + 4 = 10',
      },
      {
        id: 2,
        isPublic: false,
        input: '1',
        expectedOutput: '1',
        description: 'Kasus dasar N = 1',
      },
      {
        id: 3,
        isPublic: false,
        input: '5',
        expectedOutput: '15',
        description: 'Penjumlahan deret hingga N = 5',
      },
      {
        id: 4,
        isPublic: false,
        input: '10',
        expectedOutput: '55',
        description: 'Penjumlahan deret hingga N = 10',
      },
    ],
  },
  {
    id: 'modul-04',
    number: '04',
    title: 'Fungsi Def & Pengolahan List',
    topic: 'Fungsi Menghitung Jumlah Mahasiswa Lulus',
    difficulty: 'Sulit',
    summary:
      'Mendefinisikan fungsi Python untuk menelusuri data di dalam list menggunakan loop for dan mengembalikan jumlah data yang memenuhi syarat.',
    description:
      'Dosen praktikum memerlukan fungsi pembantu untuk merekap hasil ujian kelas. Diberikan satu baris daftar nilai mahasiswa yang dipisahkan spasi. Lengkapilah fungsi hitung_lulus(daftar_nilai) agar menghitung dan mengembalikan (return) banyaknya mahasiswa yang memperoleh nilai >= 70.',
    materi: {
      ringkasan: [
        'Fungsi dibuat menggunakan sintaks def nama_fungsi(parameter): dan mengembalikan nilai dengan kata kunci return.',
        'List dapat ditelusuri per elemen menggunakan perulangan for nilai in daftar_nilai:.',
        'Gunakan variabel penghitung (counter) seperti jumlah = 0 yang bertambah satu (jumlah += 1) saat nilai >= 70.',
      ],
      contohKode: `# Contoh analogi: Fungsi untuk menghitung berapa banyak angka positif di dalam list
def hitung_positif(daftar_angka):
    jumlah = 0
    for x in daftar_angka:
        if x > 0:
            jumlah += 1
    return jumlah

# Input: sebaris angka dipisahkan spasi
data = list(map(int, input().split()))
hasil = hitung_positif(data)
print(hasil)`,
      tipsPemula: [
        'Fungsi harus mengembalikan nilai menggunakan return, bukan langsung mencetaknya dengan print di dalam fungsi.',
        'Pastikan syarat kelulusan menggunakan operator >= 70 (inklusif), bukan > 70 agar nilai tepat 70 tetap terhitung lulus.',
      ],
    },
    inputFormat: 'Satu baris berisi sekumpulan bilangan bulat nilai mahasiswa yang dipisahkan oleh spasi.',
    outputFormat: 'Satu baris berisi sebuah bilangan bulat yang menyatakan jumlah mahasiswa yang lulus (nilai >= 70).',
    constraints: ['1 <= jumlah elemen <= 100', '0 <= setiap nilai <= 100'],
    starterCode: `# Modul 04: Fungsi Menghitung Jumlah Mahasiswa Lulus
def hitung_lulus(daftar_nilai):
    jumlah_lulus = 0
    # TODO: Telusuri setiap nilai di dalam daftar_nilai
    # Jika nilai >= 70, tambahkan 1 ke variabel jumlah_lulus

    return jumlah_lulus

# Bagian di bawah ini membaca input dan memanggil fungsi Anda
data = list(map(int, input().split()))
print(hitung_lulus(data))`,
    referenceSolution: `def hitung_lulus(daftar_nilai):
    jumlah_lulus = 0
    for nilai in daftar_nilai:
        if nilai >= 70:
            jumlah_lulus += 1
    return jumlah_lulus

data = list(map(int, input().split()))
print(hitung_lulus(data))`,
    testCases: [
      {
        id: 1,
        isPublic: true,
        input: '60 75 80 50 90',
        expectedOutput: '3',
        description: '3 mahasiswa memiliki nilai >= 70',
      },
      {
        id: 2,
        isPublic: false,
        input: '80 90 100',
        expectedOutput: '3',
        description: 'Semua mahasiswa lulus',
      },
      {
        id: 3,
        isPublic: false,
        input: '40 55 69',
        expectedOutput: '0',
        description: 'Tidak ada mahasiswa yang lulus',
      },
      {
        id: 4,
        isPublic: false,
        input: '70',
        expectedOutput: '1',
        description: 'Tepat satu mahasiswa pada batas lulus 70',
      },
    ],
  },
];
