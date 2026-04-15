// ============================================================
// PERTANYAAN KUESIONER KEBIASAAN DIGITAL
// Bobot: password=30%, otp=25%, sharing=25%, awareness=20%
// Skor per jawaban: 0=aman, 25=rendah risk, 50=sedang, 75=tinggi, 100=sangat tinggi
// ============================================================

const ASSESSMENT_QUESTIONS = {
    password: {
        label: "Keamanan Password",
        weight: 0.30,
        color: "#2563eb",
        questions: [
            {
                id: "p1",
                text: "Seberapa sering Anda menggunakan password yang sama untuk beberapa akun berbeda?",
                options: [
                    { text: "Tidak pernah — setiap akun memiliki password unik", score: 0, risk: "low" },
                    { text: "Jarang — hanya untuk akun tidak penting", score: 25, risk: "low" },
                    { text: "Kadang-kadang — beberapa akun berbagi password", score: 50, risk: "medium" },
                    { text: "Sering — sebagian besar akun pakai password sama", score: 75, risk: "high" },
                    { text: "Selalu — satu password untuk semua akun", score: 100, risk: "high" }
                ]
            },
            {
                id: "p2",
                text: "Bagaimana format password yang biasa Anda gunakan?",
                options: [
                    { text: "Minimal 12 karakter dengan huruf, angka, dan simbol", score: 0, risk: "low" },
                    { text: "8-12 karakter dengan huruf dan angka", score: 25, risk: "low" },
                    { text: "Kata biasa dengan angka di belakang (mis. nama123)", score: 50, risk: "medium" },
                    { text: "Kata atau nama sederhana tanpa modifikasi", score: 75, risk: "high" },
                    { text: "Tanggal lahir, 1234, atau password", score: 100, risk: "high" }
                ]
            },
            {
                id: "p3",
                text: "Seberapa sering Anda mengganti password akun penting?",
                options: [
                    { text: "Setiap 1-3 bulan secara rutin", score: 0, risk: "low" },
                    { text: "Setiap 3-6 bulan", score: 25, risk: "low" },
                    { text: "Sekali dalam setahun", score: 50, risk: "medium" },
                    { text: "Hanya jika ada masalah keamanan", score: 75, risk: "high" },
                    { text: "Tidak pernah mengganti password", score: 100, risk: "high" }
                ]
            },
            {
                id: "p4",
                text: "Bagaimana cara Anda menyimpan/mengingat password?",
                options: [
                    { text: "Menggunakan password manager terpercaya", score: 0, risk: "low" },
                    { text: "Menghafal semua password tanpa dicatat", score: 15, risk: "low" },
                    { text: "Disimpan di catatan terenkripsi", score: 25, risk: "low" },
                    { text: "Disimpan di notes HP atau dokumen biasa", score: 65, risk: "medium" },
                    { text: "Ditulis di kertas atau dicatat sembarangan", score: 100, risk: "high" }
                ]
            },
            {
                id: "p5",
                text: "Pernahkah Anda berbagi password dengan orang lain (keluarga, teman)?",
                options: [
                    { text: "Tidak pernah sama sekali", score: 0, risk: "low" },
                    { text: "Pernah, tapi segera ganti setelahnya", score: 20, risk: "low" },
                    { text: "Hanya dengan keluarga inti yang sangat dipercaya", score: 40, risk: "medium" },
                    { text: "Dengan beberapa orang yang dipercaya", score: 70, risk: "high" },
                    { text: "Sering berbagi password dengan orang lain", score: 100, risk: "high" }
                ]
            }
        ]
    },
    otp: {
        label: "OTP & Autentikasi",
        weight: 0.25,
        color: "#16a34a",
        questions: [
            {
                id: "o1",
                text: "Apakah Anda mengaktifkan Two-Factor Authentication (2FA) pada akun penting?",
                options: [
                    { text: "Ya, di semua akun penting (email, bank, medsos)", score: 0, risk: "low" },
                    { text: "Ya, di sebagian besar akun penting", score: 20, risk: "low" },
                    { text: "Hanya di beberapa akun saja", score: 50, risk: "medium" },
                    { text: "Pernah aktifkan tapi kemudian dinonaktifkan", score: 70, risk: "high" },
                    { text: "Tidak pernah menggunakan 2FA", score: 100, risk: "high" }
                ]
            },
            {
                id: "o2",
                text: "Apa yang Anda lakukan jika menerima OTP yang tidak diminta?",
                options: [
                    { text: "Abaikan, laporkan ke provider, ganti password segera", score: 0, risk: "low" },
                    { text: "Abaikan dan ganti password", score: 15, risk: "low" },
                    { text: "Abaikan saja tanpa tindakan lanjut", score: 50, risk: "medium" },
                    { text: "Bingung, mungkin tetap masukkan kode", score: 80, risk: "high" },
                    { text: "Masukkan kode OTP tersebut", score: 100, risk: "high" }
                ]
            },
            {
                id: "o3",
                text: "Pernahkah Anda memberikan kode OTP kepada siapapun (termasuk yang mengaku CS bank)?",
                options: [
                    { text: "Tidak pernah — tahu bahwa OTP bersifat rahasia", score: 0, risk: "low" },
                    { text: "Tidak pernah, tapi tidak tahu alasannya", score: 20, risk: "low" },
                    { text: "Pernah sekali karena tidak tahu", score: 65, risk: "medium" },
                    { text: "Pernah beberapa kali", score: 85, risk: "high" },
                    { text: "Sering memberikan OTP jika diminta", score: 100, risk: "high" }
                ]
            },
            {
                id: "o4",
                text: "Bagaimana cara Anda menerima kode OTP yang paling sering digunakan?",
                options: [
                    { text: "Authenticator app (Google Auth, Authy)", score: 0, risk: "low" },
                    { text: "Email dengan verifikasi berlapis", score: 25, risk: "low" },
                    { text: "SMS ke nomor pribadi yang aman", score: 40, risk: "medium" },
                    { text: "SMS ke nomor yang dipakai bersama", score: 75, risk: "high" },
                    { text: "Tidak pernah pakai OTP/2FA", score: 100, risk: "high" }
                ]
            },
            {
                id: "o5",
                text: "Seberapa cepat Anda menggunakan kode OTP yang diterima?",
                options: [
                    { text: "Langsung digunakan dan tidak disimpan", score: 0, risk: "low" },
                    { text: "Digunakan dalam beberapa menit", score: 20, risk: "low" },
                    { text: "Terkadang disimpan di notes sementara", score: 55, risk: "medium" },
                    { text: "Sering screenshot kode OTP", score: 80, risk: "high" },
                    { text: "Selalu screenshot dan simpan OTP", score: 100, risk: "high" }
                ]
            }
        ]
    },
    sharing: {
        label: "Kebiasaan Berbagi Data",
        weight: 0.25,
        color: "#d97706",
        questions: [
            {
                id: "s1",
                text: "Seberapa sering Anda membaca kebijakan privasi sebelum mendaftar aplikasi?",
                options: [
                    { text: "Selalu membaca dengan teliti", score: 0, risk: "low" },
                    { text: "Sering membaca, terutama poin penting", score: 20, risk: "low" },
                    { text: "Kadang-kadang scroll sebentar", score: 50, risk: "medium" },
                    { text: "Jarang, langsung klik setuju", score: 75, risk: "high" },
                    { text: "Tidak pernah membaca, selalu skip", score: 100, risk: "high" }
                ]
            },
            {
                id: "s2",
                text: "Informasi apa yang biasa Anda bagikan di media sosial?",
                options: [
                    { text: "Sangat minimal, tidak ada info personal sensitif", score: 0, risk: "low" },
                    { text: "Nama dan foto umum saja, dengan privasi ketat", score: 20, risk: "low" },
                    { text: "Informasi umum dengan pengaturan teman saja", score: 40, risk: "medium" },
                    { text: "Cukup banyak termasuk lokasi dan aktivitas harian", score: 70, risk: "high" },
                    { text: "Semua info pribadi termasuk data sensitif secara publik", score: 100, risk: "high" }
                ]
            },
            {
                id: "s3",
                text: "Bagaimana Anda memperlakukan permintaan data dari aplikasi pihak ketiga?",
                options: [
                    { text: "Selalu review izin dan tolak yang tidak relevan", score: 0, risk: "low" },
                    { text: "Selektif, tolak izin yang mencurigakan", score: 20, risk: "low" },
                    { text: "Kadang review, tapi sering setuju semua", score: 55, risk: "medium" },
                    { text: "Langsung setuju semua izin tanpa review", score: 80, risk: "high" },
                    { text: "Tidak tahu cara melihat izin aplikasi", score: 100, risk: "high" }
                ]
            },
            {
                id: "s4",
                text: "Seberapa sering Anda mengisi formulir online dengan data asli?",
                options: [
                    { text: "Hanya di platform resmi dan terpercaya", score: 0, risk: "low" },
                    { text: "Dengan verifikasi platform terlebih dahulu", score: 20, risk: "low" },
                    { text: "Tergantung situasi, terkadang tanpa verifikasi", score: 50, risk: "medium" },
                    { text: "Cukup sering tanpa memeriksa keamanan platform", score: 75, risk: "high" },
                    { text: "Selalu isi data asli di semua formulir online", score: 100, risk: "high" }
                ]
            },
            {
                id: "s5",
                text: "Bagaimana kebiasaan Anda menggunakan WiFi publik?",
                options: [
                    { text: "Tidak pernah, atau selalu pakai VPN", score: 0, risk: "low" },
                    { text: "Pakai WiFi publik tapi tidak untuk transaksi sensitif", score: 25, risk: "low" },
                    { text: "Kadang akses email atau medsos via WiFi publik", score: 55, risk: "medium" },
                    { text: "Sering transaksi online via WiFi publik", score: 80, risk: "high" },
                    { text: "Selalu pakai WiFi publik termasuk untuk banking", score: 100, risk: "high" }
                ]
            }
        ]
    },
    awareness: {
        label: "Kesadaran Keamanan",
        weight: 0.20,
        color: "#7c3aed",
        questions: [
            {
                id: "a1",
                text: "Bagaimana Anda mengenali email atau pesan phishing?",
                options: [
                    { text: "Sangat paham, bisa identifikasi berbagai teknik phishing", score: 0, risk: "low" },
                    { text: "Cukup paham, mengenali tanda-tanda umum", score: 20, risk: "low" },
                    { text: "Tahu sedikit, kadang masih tidak yakin", score: 50, risk: "medium" },
                    { text: "Kurang paham, sering ragu-ragu", score: 75, risk: "high" },
                    { text: "Tidak tahu cara mengenali phishing", score: 100, risk: "high" }
                ]
            },
            {
                id: "a2",
                text: "Seberapa rutin Anda memperbarui sistem operasi dan aplikasi?",
                options: [
                    { text: "Selalu update segera saat tersedia", score: 0, risk: "low" },
                    { text: "Update rutin dalam 1-2 hari", score: 15, risk: "low" },
                    { text: "Update dalam beberapa minggu", score: 40, risk: "medium" },
                    { text: "Update hanya jika perlu atau dipaksa", score: 70, risk: "high" },
                    { text: "Jarang atau tidak pernah update", score: 100, risk: "high" }
                ]
            },
            {
                id: "a3",
                text: "Apakah Anda menggunakan antivirus atau keamanan tambahan di perangkat?",
                options: [
                    { text: "Ya, antivirus terpercaya yang selalu update", score: 0, risk: "low" },
                    { text: "Menggunakan fitur keamanan bawaan OS", score: 20, risk: "low" },
                    { text: "Pernah install tapi tidak rutin update", score: 55, risk: "medium" },
                    { text: "Tidak ada antivirus, bergantung keberuntungan", score: 80, risk: "high" },
                    { text: "Tidak tahu cara install atau tidak peduli", score: 100, risk: "high" }
                ]
            },
            {
                id: "a4",
                text: "Apa yang Anda lakukan setelah selesai menggunakan perangkat publik (warnet, komputer kantor)?",
                options: [
                    { text: "Logout semua akun, hapus history dan cookies", score: 0, risk: "low" },
                    { text: "Logout semua akun dengan teliti", score: 15, risk: "low" },
                    { text: "Logout akun utama saja", score: 50, risk: "medium" },
                    { text: "Sering lupa logout, tutup browser saja", score: 80, risk: "high" },
                    { text: "Tidak pernah logout, langsung tinggal", score: 100, risk: "high" }
                ]
            },
            {
                id: "a5",
                text: "Seberapa sering Anda memeriksa aktivitas atau riwayat login akun-akun penting?",
                options: [
                    { text: "Rutin setiap minggu", score: 0, risk: "low" },
                    { text: "Setiap bulan", score: 20, risk: "low" },
                    { text: "Hanya jika ada notifikasi mencurigakan", score: 50, risk: "medium" },
                    { text: "Sangat jarang, hampir tidak pernah", score: 75, risk: "high" },
                    { text: "Tidak tahu cara memeriksa aktivitas akun", score: 100, risk: "high" }
                ]
            }
        ]
    }
};