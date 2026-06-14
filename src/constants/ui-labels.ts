export const UI_LABELS = {
  navigation: {
    home: "Beranda",
    system: "Pengaturan Sistem",
    users: "Pengguna",
    roles: "Hak Akses",
    permissions: "Izin Akses",
    auditLogs: "Catatan Aktivitas",
    readiness: "Kesiapan Sistem",
    settings: "Pengaturan",
    backup: "Cadangan Data",
    masterData: "Data Sekolah",
    questionBank: "Bank Soal",
    allQuestions: "Semua Soal",
    addQuestion: "Tambah Soal",
    questionCategories: "Kategori Soal",
    exams: "Ujian",
    examPackages: "Paket Ujian",
    examSchedules: "Jadwal Ujian",
    examMonitoring: "Monitoring Ujian",
    reports: "Laporan",
    examResults: "Hasil Ujian",
    gradeRecap: "Analitik Nilai",
    importExport: "Impor & Ekspor",
    importData: "Impor Data",
    exportData: "Unduh Data",
    profile: "Profil",
    myClasses: "Kelas Saya",
    activeExams: "Ujian Berlangsung",
    schedule: "Jadwal",
    resultHistory: "Riwayat Hasil",
  },
  actions: {
    create: "Tambah",
    update: "Ubah",
    delete: "Hapus",
    view: "Lihat",
    preview: "Pratinjau",
    publish: "Terbitkan",
    unpublish: "Batalkan Terbit",
    archive: "Arsipkan",
    restore: "Pulihkan",
    submitExam: "Selesaikan Ujian",
    resetAttempt: "Mulai Ulang Pengerjaan",
    exportData: "Unduh Data",
    importCsv: "Impor File Excel/CSV",
    search: "Cari",
    previous: "Sebelumnya",
    next: "Berikutnya",
    retry: "Coba lagi",
    copyToken: "Salin Token",
    generateToken: "Buat Token Baru",
  },
  tables: {
    searchPlaceholder: "Cari data...",
    columns: "Kolom",
    rows: "Baris",
    page: "Halaman",
    dataCount: "data",
    no: "No",
  },
  messages: {
    noData: "Belum ada data",
    noSearchResult: "Data tidak ditemukan",
    noSearchResultDescription: "Coba gunakan kata kunci lain atau hapus filter.",
    dataWillAppear: "Data akan muncul setelah ditambahkan.",
    dataCreated: "Data berhasil ditambahkan",
    dataUpdated: "Data berhasil diperbarui",
    dataDeleted: "Data berhasil dihapus",
    loadFailed: "Data tidak dapat dimuat",
    unexpectedError: "Terjadi kesalahan. Silakan coba lagi.",
    loadingData: "Memuat data",
    loadingDescription: "Sebentar, data sedang disiapkan.",
  },
  statuses: {
    active: "Aktif",
    inactive: "Tidak Aktif",
    scheduled: "Terjadwal",
    in_progress: "Sedang Ujian",
    submitted: "Sudah Dikumpulkan",
    finalized: "Nilai Final",
    auto_scored: "Dinilai Otomatis",
    needs_manual_grading: "Perlu Koreksi Esai",
    draft: "Belum Diterbitkan",
    published: "Sudah Diterbitkan",
    archived: "Diarsipkan",
    assigned: "Belum Mulai",
    pending: "Menunggu",
    expired: "Waktu Habis",
    cancelled: "Dibatalkan",
    finished: "Selesai",
    ready: "Siap",
    absent: "Tidak Hadir",
    locked: "Dikunci",
    unlocked: "Aktif",
    not_started: "Belum Dikerjakan",
    late: "Terlambat",
  },
  roles: {
    super_admin: "Super Admin",
    admin: "Admin Sekolah",
    principal: "Kepala Sekolah",
    teacher: "Guru",
    student: "Siswa",
    proctor: "Pengawas Ujian",
  },
} as const;

export type UiStatusKey = keyof typeof UI_LABELS.statuses;
export type UiRoleKey = keyof typeof UI_LABELS.roles;

export function getStatusLabel(value?: string | null) {
  if (!value) {
    return "Tidak Diketahui";
  }

  return (
    UI_LABELS.statuses[value as UiStatusKey] ??
    value
      .split("_")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

export function getRoleLabel(value?: string | null) {
  if (!value) {
    return "Pengguna";
  }

  return UI_LABELS.roles[value as UiRoleKey] ?? value;
}
