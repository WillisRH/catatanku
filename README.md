# Catatanku 📝

Catatanku adalah aplikasi pencatat jurnal digital yang dirancang dengan estetika premium dan pengalaman pengguna yang mendalam. Berfokus pada keindahan visual dan kemudahan penggunaan, Catatanku memungkinkan Anda mengabadikan momen dan pikiran dengan sentuhan personal melalui tema dinamis dan integrasi AI.

![Hero Image](https://raw.githubusercontent.com/WillisRH/catatanku/main/public/og-image.png)

## ✨ Fitur Utama

- **Tema Dinamis & Ambient**: Pilih dari berbagai tema (Cinta, Alam, Galaksi, Kota Malam, dll.) yang mengubah seluruh suasana aplikasi, lengkap dengan latar belakang SVG yang elegan.
- **Mood Tracking**: Dokumentasikan perasaan Anda setiap hari dengan emoji mood yang intuitif.
- **Ekspor Cerdas**: Simpan catatan Anda dalam format **PDF** yang rapi (dengan latar belakang tema yang tetap terjaga) atau **TXT**, keduanya dengan penamaan berkas otomatis sesuai judul catatan.
- **Keamanan Passkey**: Login modern dan aman menggunakan otentikasi biometrik (Windows Hello, Fingerprint, FaceID).
- **Asisten AI (Gemini)**: Integrasi dengan Google Gemini untuk membantu Anda merangkum atau memperluas konten catatan.
- **Desain Responsif**: Pengalaman premium yang konsisten baik di perangkat seluler maupun desktop.

## 🚀 Teknologi

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Database**: [Prisma](https://www.prisma.io/) (PostgreSQL/Supabase/PlanetScale)
- **Otentikasi**: [NextAuth.js](https://next-auth.js.org/) & WebAuthn (Passkeys)
- **Styling**: Vanilla CSS & Tailwind CSS (Custom Implementation)
- **AI**: [Google Gemini API](https://ai.google.dev/)
- **Deployment**: [Vercel](https://vercel.com/)

## 🛠️ Instalasi Lokal

1. Clone repositori:
   ```bash
   git clone https://github.com/WillisRH/catatanku.git
   cd catatanku
   ```

2. Instal dependensi:
   ```bash
   npm install
   ```

3. Konfigurasi Environment Variables:
   Buat file `.env` di direktori root dan sesuaikan dengan `.env.example`:
   ```env
   DATABASE_URL="..."
   NEXTAUTH_SECRET="..."
   GITHUB_ID="..."
   GITHUB_SECRET="..."
   GOOGLE_ID="..."
   GOOGLE_SECRET="..."
   GEMINI_API_KEY="..."
   ```

4. Jalankan migrasi database:
   ```bash
   npx prisma db push
   ```

5. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```

## 📄 Lisensi

Proyek ini berada di bawah lisensi MIT.

---
Dibuat dengan ❤️ oleh [WillisRH](https://github.com/WillisRH)
