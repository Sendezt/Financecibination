# Product Requirement Document (PRD): Sendezt API (Financecibination)

Sendezt API (Financecibination) adalah RESTful API backend yang dirancang untuk mendukung sistem manajemen keuangan pribadi (*Personal Finance Management*). Platform ini memungkinkan pengguna untuk melacak portofolio rekening (kas, bank, e-wallet), mencatat pemasukan dan pengeluaran secara real-time, melakukan transfer antar rekening dengan konsistensi data yang tinggi, serta menyajikan data statistik keuangan harian, mingguan, dan bulanan.

---

## 1. Pendahuluan & Tujuan Proyek
Tujuan utama dari pengembangan Sendezt API ini adalah:
1. **Autentikasi & Otorisasi Pengguna:** Menyediakan sistem registrasi dan login yang aman berbasis JSON Web Token (JWT).
2. **Manajemen Rekening Fleksibel:** Memungkinkan pengguna untuk menambahkan dan melacak beberapa rekening keuangan dalam satu akun pengguna.
3. **Pencatatan Transaksi:** Menyediakan pencatatan pemasukan (*income*) dan pengeluaran (*expense*) yang terikat ke rekening spesifik.
4. **Transfer Antar Rekening yang Aman:** Memastikan perpindahan saldo antar rekening berjalan secara atomik (semua berhasil atau semua gagal) menggunakan transaksi database PostgreSQL melalui RPC Supabase.
5. **Visualisasi & Analitik Data:** Menyediakan endpoint statistik keuangan berkala (bulanan, mingguan, harian) untuk memudahkan visualisasi data di sisi frontend.
6. **Retensi & Pembersihan Data:** Menyediakan fungsi otomatisasi pembersihan log transaksi lama (> 1 tahun) guna mengoptimalkan performa database.

---

## 2. Arsitektur & Teknologi Utama
Backend ini dibangun menggunakan teknologi modern untuk menjamin performa, keamanan, dan kemudahan penyebaran:
*   **Runtime & Framework:** Node.js & Express.js.
*   **Database Client:** Supabase JS Client (`@supabase/supabase-js`) terhubung ke PostgreSQL.
*   **Autentikasi:** JWT (`jsonwebtoken`) dan Hashing Password menggunakan `bcryptjs`.
*   **Zona Waktu:** Penanganan tanggal menggunakan `luxon` dengan penyesuaian zona waktu **Asia/Jakarta**.
*   **Rate Limiting:** Membatasi request menggunakan `express-rate-limit` (maksimal 1000 request per 15 menit per IP) untuk mencegah penyalahgunaan API.
*   **Deployment:** Mendukung Vercel Serverless Function menggunakan `serverless-http` dan konfigurasi `vercel.json`.

---

## 3. Spesifikasi Skema Database
Sistem database PostgreSQL di Supabase menggunakan skema relasional berikut:

### a. Tabel `pengguna` (User)
Menyimpan data pengguna yang terdaftar pada sistem.
| Nama Kolom | Tipe Data | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | UUID / Serial | Primary Key, Gen Random | ID unik pengguna |
| `full_name` | VARCHAR | NOT NULL | Nama lengkap pengguna |
| `email` | VARCHAR | NOT NULL, UNIQUE | Alamat email unik untuk login |
| `password` | VARCHAR | NOT NULL | Password yang di-hash dengan bcrypt |
| `wa_number` | VARCHAR | NOT NULL | Nomor WhatsApp pengguna |

### b. Tabel `accounts` (Rekening)
Menyimpan jenis rekening atau dompet keuangan yang dimiliki oleh pengguna.
| Nama Kolom | Tipe Data | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | UUID / Serial | Primary Key | ID unik rekening |
| `user_id` | UUID / Serial | Foreign Key -> `pengguna.id` | Pemilik rekening |
| `name` | VARCHAR | NOT NULL | Nama rekening (contoh: BCA, OVO, Tunai) |
| `saldo` | NUMERIC | DEFAULT 0 | Saldo berjalan ter-cached |
| `last_updated` | TIMESTAMPTZ | DEFAULT NOW() | Waktu terakhir saldo dihitung & diupdate |

### c. Tabel `finance` (Transaksi Keuangan)
Mencatat detail riwayat transaksi masuk dan keluar dari setiap rekening.
| Nama Kolom | Tipe Data | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | UUID / Serial | Primary Key | ID unik transaksi |
| `account_id` | UUID / Serial | Foreign Key -> `accounts.id` | Rekening yang terpengaruh |
| `amount` | NUMERIC | NOT NULL | Nominal transaksi |
| `mutation_type`| VARCHAR | CHECK ('masuk', 'keluar') | Jenis transaksi (Pemasukan/Pengeluaran) |
| `note` | TEXT | NULLABLE | Catatan opsional transaksi |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu pencatatan transaksi |

### d. Tabel `transfers` (Riwayat Transfer)
Mencatat transaksi transfer dana antar rekening milik pengguna.
| Nama Kolom | Tipe Data | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | UUID / Serial | Primary Key | ID unik riwayat transfer |
| `user_id` | UUID / Serial | Foreign Key -> `pengguna.id` | Pengguna yang melakukan transfer |
| `from_account_id`| UUID / Serial| Foreign Key -> `accounts.id` | Rekening pengirim dana |
| `to_account_id` | UUID / Serial | Foreign Key -> `accounts.id` | Rekening penerima dana |
| `amount` | NUMERIC | NOT NULL | Nominal transfer |
| `deskripsi` | TEXT | NULLABLE | Deskripsi atau alasan transfer |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu eksekusi transfer |

### e. Fungsi Database (RPC): `transfer_saldo`
Untuk menjaga integritas data selama transfer dana, digunakan prosedur tersimpan di PostgreSQL dengan parameter:
- `p_user_id`: UUID pengguna pengirim.
- `p_from_account`: UUID rekening asal.
- `p_to_account`: UUID rekening tujuan.
- `p_amount`: Nominal uang yang ditransfer.
- `p_deskripsi`: Catatan transfer.

Fungsi ini berjalan dalam blok transaksi tunggal:
1. Memvalidasi kecukupan saldo di rekening asal (`from_account_id`).
2. Mengurangi nominal transfer dari saldo rekening asal.
3. Menambahkan nominal transfer ke saldo rekening tujuan (`to_account_id`).
4. Memasukkan entri ke tabel `transfers` (Riwayat Transfer).
*Catatan: Transaksi transfer sengaja tidak dicatat sebagai mutasi (masuk/keluar) di tabel `finance` agar tidak memengaruhi pelaporan mutasi transaksi reguler.*

---

## 4. Struktur Endpoint API & Alur Fungsional

### A. Endpoint Publik (Tanpa Autentikasi)

#### 1. Autentikasi (`/api/auth`)
*   **`POST /api/auth/register`**
    *   **Deskripsi:** Mendaftarkan pengguna baru ke sistem.
    *   **Payload:** `{ full_name, email, password, wa_number }`
    *   **Hasil:** Hashing password menggunakan bcrypt lalu menyimpan data pengguna ke tabel `pengguna`.
*   **`POST /api/auth/login`**
    *   **Deskripsi:** Memvalidasi akun dan menghasilkan JWT token.
    *   **Payload:** `{ email, password }`
    *   **Hasil:** Token JWT bertipe Bearer yang valid selama 7 hari jika kredensial cocok.

#### 2. Pembersihan Data Sistem (`/api/cleanUp`)
*   **`GET /api/cleanUp`**
    *   **Deskripsi:** Menghapus data transaksi `finance` yang berumur lebih dari 1 tahun secara otomatis.
    *   **Hasil:** Penghapusan massal data usang demi menghemat penyimpanan database.

---

### B. Endpoint Terproteksi (Memerlukan Bearer Token JWT)
Semua endpoint di bawah ini mewajibkan header: `Authorization: Bearer <token_jwt>`.

#### 1. Manajemen Rekening
*   **`POST /api/tambahRekening`**
    *   **Deskripsi:** Menambahkan rekening baru untuk pengguna saat ini.
    *   **Payload:** `{ name }`
    *   **Hasil:** Rekening baru disimpan ke tabel `accounts` dengan inisialisasi saldo 0.
*   **`GET /api/getAccount`**
    *   **Deskripsi:** Mengambil semua rekening milik pengguna beserta saldo berjalannya saat ini.
*   **`GET /api/getSaldo`**
    *   **Deskripsi:** Mengambil akumulasi total nominal transaksi masuk dan keluar serta saldo akhir masing-masing rekening.
    *   **Sistem Update Saldo:** API ini akan membaca data baru dari tabel `finance` setelah tanggal `last_updated`, mengkalkulasi saldo baru secara dinamis, memperbarui kolom `saldo` di tabel `accounts`, dan menyajikan hasil terbaru ke client.

#### 2. Pencatatan Keuangan (`/api/finance`)
*   **`POST /api/finance/pemasukan`**
    *   **Deskripsi:** Mencatat pemasukan dana baru pada rekening tertentu.
    *   **Payload:** `{ name, amount, note, created_at }`
*   **`POST /api/finance/pengeluaran`**
    *   **Deskripsi:** Mencatat pengeluaran dana baru pada rekening tertentu.
    *   **Payload:** `{ name, amount, note, created_at }`

#### 3. Statistik & Analitik Keuangan (`/api/finance/...`)
*   **`GET /api/finance/total-pemasukan-bulanan`**
    *   **Query Params:** `?month=XX&year=XXXX`
    *   **Deskripsi:** Menghitung total pemasukan bulanan untuk periode tertentu.
*   **`GET /api/finance/total-pengeluaran-bulanan`**
    *   **Query Params:** `?month=XX&year=XXXX`
    *   **Deskripsi:** Menghitung total pengeluaran bulanan untuk periode tertentu.
*   **`GET /api/finance/total-pemasukan-mingguan`**
    *   **Deskripsi:** Menghitung total pemasukan mingguan (custom/berjalan).
*   **`GET /api/finance/total-pengeluaran-mingguan`**
    *   **Deskripsi:** Menghitung total pengeluaran mingguan (custom/berjalan).
*   **`GET /api/finance/autototal-pemasukan-harian`**
    *   **Deskripsi:** Otomatis menghitung total pemasukan hari ini.
*   **`GET /api/finance/autototal-pengeluaran-harian`**
    *   **Deskripsi:** Otomatis menghitung total pengeluaran hari ini.
*   **`GET /api/finance/autototal-pemasukan-mingguan`**
    *   **Deskripsi:** Otomatis menghitung total pemasukan minggu ini.
*   **`GET /api/finance/autototal-pengeluaran-mingguan`**
    *   **Deskripsi:** Otomatis menghitung total pengeluaran minggu ini.
*   **`GET /api/finance/autototal-pemasukan-bulanan`**
    *   **Deskripsi:** Otomatis menghitung total pemasukan bulan ini.
*   **`GET /api/finance/autototal-pengeluaran-bulanan`**
    *   **Deskripsi:** Otomatis menghitung total pengeluaran bulan ini.
*   **`GET /api/finance/total-transaksi`**
    *   **Deskripsi:** Mengambil ringkasan total pemasukan dan pengeluaran harian selama 7 hari terakhir (periode bergulir) untuk disajikan dalam bentuk grafik/tren di frontend.

#### 4. Mutasi Transaksi (`/api/mutasi`)
*   **`GET /api/mutasi`**
    *   **Deskripsi:** Mengambil daftar seluruh log transaksi `finance` dari semua rekening pengguna dalam 7 hari terakhir. Output menyertakan nama rekening (`account_name`) dan tanggal lokal terformat (`yyyy-MM-dd HH:mm:ss`).

#### 5. Transfer Saldo (`/api/transfer`)
*   **`POST /api/transfer`**
    *   **Deskripsi:** Melakukan pemindahan dana antar rekening pengguna.
    *   **Payload:** `{ from_account_id, to_account_id, amount, deskripsi }`
*   **`GET /api/transfer/riwayat`**
    *   **Deskripsi:** Mengambil data riwayat transfer yang dilakukan oleh pengguna selama 28 hari (4 minggu) terakhir.

---

## 5. Kebutuhan Non-Fungsional

### A. Keamanan (Security)
*   **Enkripsi Kata Sandi:** Menggunakan `bcryptjs` dengan salt factor minimal 10 sebelum disimpan ke database.
*   **Pengamanan Endpoint:** Menerapkan middleware JWT verifikator pada semua endpoint sensitif. Token yang rusak, dimodifikasi, atau kedaluwarsa akan langsung ditolak dengan kode status `401` atau `403`.
*   **Proteksi Rate Limit:** Meminimalisir ancaman DoS / brute force login dengan menetapkan limit 1000 request per 15 menit dari alamat IP yang sama.

### B. Konsistensi Data (Data Consistency)
*   Menggunakan pemrosesan berbasis transaksi database (Supabase RPC) untuk fitur transfer antar rekening, guna memastikan saldo pengirim dan penerima diperbarui secara bersamaan tanpa anomali data jika terjadi kegagalan jaringan di tengah jalan.

### C. Ketersediaan & Skalabilitas (Deployment & Scaling)
*   Backend siap dideploy di platform serverless seperti Vercel, memungkinkan penskalaan otomatis dari nol hingga kapasitas tinggi secara on-demand dengan konfigurasi rute di file `vercel.json`.

---

## 6. Cara Menjalankan Aplikasi Secara Lokal

1.  **Instalasi Dependensi:**
    ```bash
    npm install
    ```
2.  **Konfigurasi Environment Variable (`.env`):**
    Buat file `.env` di root direktori dengan konfigurasi berikut:
    ```env
    PORT=3000
    SUPABASE_URL=https://your-project-id.supabase.co
    SUPABASE_KEY=your-supabase-anon-key
    JWT_SECRET_KEY=your-secure-jwt-secret
    ```
3.  **Menjalankan Server:**
    ```bash
    npm start # atau node server.js
    ```
