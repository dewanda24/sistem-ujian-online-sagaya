export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <p className="text-muted-foreground">
          Selamat datang di Sistem Ujian Online SMP
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-background p-6">
          <h3 className="text-sm text-muted-foreground">Total User</h3>

          <p className="mt-2 text-3xl font-bold">120</p>
        </div>

        <div className="rounded-xl border bg-background p-6">
          <h3 className="text-sm text-muted-foreground">Ujian Aktif</h3>

          <p className="mt-2 text-3xl font-bold">4</p>
        </div>

        <div className="rounded-xl border bg-background p-6">
          <h3 className="text-sm text-muted-foreground">Siswa Online</h3>

          <p className="mt-2 text-3xl font-bold">87</p>
        </div>
      </div>
    </div>
  );
}
