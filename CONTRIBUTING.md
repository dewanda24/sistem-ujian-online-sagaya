# 🤝 Panduan Kontribusi (Contributing Guide)

Terima kasih telah tertarik untuk berkontribusi pada pengembangan **Sistem Ujian Online Sagaya (CBT)**!

---

## 🌿 Standar Branching

- `main` / `master`: Branch produksi (stable).
- `feat/<nama-fitur>`: Penambahan fitur baru (contoh: `feat/live-chat-proctor`).
- `fix/<nama-bug>`: Perbaikan bug (contoh: `fix/exam-timer-sync`).
- `chore/<keterangan>`: Perawatan kode, dependensi, atau konfigurasi.

---

## 📝 Konvensi Commit (Conventional Commits)

Gunakan format commit pesan standar:
- `feat:` Menambahkan fitur baru.
- `fix:` Memperbaiki bug atau anomali logic.
- `docs:` Perubahan atau penambahan dokumentasi.
- `style:` Format styling, semicolon, whitespace (tidak mengubah logic).
- `refactor:` Restrukturisasi kode tanpa mengubah fungsionalitas.
- `test:` Menambahkan atau memperbaiki automated tests.
- `chore:` Pembaruan build script, dependensi, config.

*Contoh:*
```bash
git commit -m "feat(exam-room): add single session heartbeat conflict detector"
```

---

## 🧪 Validasi Sebelum Pull Request

Sebelum membuat PR, pastikan semua pengecekan lokal lolos:

```bash
# 1. Cek konfigurasi env
npm run check:env

# 2. Cek linting ESLint
npm run lint

# 3. Cek type-safety TypeScript
npx tsc --noEmit

# 4. Cek produksi build
npm run build
```

Semua Pull Request akan divalidasi otomatis oleh **GitHub Actions CI**.
