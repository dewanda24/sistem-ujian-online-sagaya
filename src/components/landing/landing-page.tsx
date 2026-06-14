import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  ClipboardList,
  DatabaseZap,
  FileCheck2,
  GraduationCap,
  HelpCircle,
  Layers3,
  LockKeyhole,
  MonitorCheck,
  School,
  ShieldCheck,
  Sparkles,
  Star,
  UserCog,
  UsersRound,
} from "lucide-react";

import { DashboardMockup } from "./dashboard-mockup";

type IconItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type DemoRoleItem = IconItem & {
  href: string;
};

const navItems = [
  { label: "Beranda", href: "#beranda" },
  { label: "Demo", href: "#demo" },
  { label: "Fitur", href: "#fitur" },
  { label: "Modul", href: "#modul" },
  { label: "Screenshot", href: "#screenshot" },
  { label: "FAQ", href: "#faq" },
  { label: "Kontak", href: "#kontak" },
] as const;

const features: IconItem[] = [
  {
    title: "Ujian Online CBT",
    description: "Pelaksanaan ujian berbasis komputer dengan token, jadwal, dan kontrol sesi yang tertata.",
    icon: MonitorCheck,
  },
  {
    title: "Bank Soal Digital",
    description: "Kelola soal, stimulus, kategori, import dokumen, dan paket ujian dari satu ruang kerja.",
    icon: BookOpenCheck,
  },
  {
    title: "Akses Sesuai Peran",
    description: "Akses khusus untuk super admin, admin sekolah, guru, siswa, pengawas, dan kepala sekolah.",
    icon: UsersRound,
  },
  {
    title: "Anti Kecurangan",
    description: "Pemantauan ujian, token, catatan aktivitas, dan kontrol pengawas membantu menjaga integritas.",
    icon: ShieldCheck,
  },
  {
    title: "Analitik & Laporan",
    description: "Nilai otomatis, rekap kelas, laporan mapel, dan data hasil siap dipakai untuk evaluasi.",
    icon: BarChart3,
  },
  {
    title: "Multi Sekolah",
    description: "Arsitektur data mendukung pengelolaan beberapa sekolah dengan ruang lingkup yang jelas.",
    icon: Building2,
  },
];

const examFlow: IconItem[] = [
  { title: "Import Data", description: "Masukkan data sekolah, kelas, guru, siswa, dan mapel.", icon: DatabaseZap },
  { title: "Buat Soal", description: "Susun bank soal dan paket ujian sesuai kebutuhan.", icon: ClipboardList },
  { title: "Jadwalkan Ujian", description: "Atur sesi, durasi, kelas peserta, dan token ujian.", icon: Layers3 },
  { title: "Ujian Berlangsung", description: "Siswa mengerjakan, pengawas memantau ujian secara langsung.", icon: MonitorCheck },
  { title: "Nilai Otomatis", description: "Sistem mengolah jawaban objektif dan skor akhir.", icon: CheckCircle2 },
  { title: "Laporan Hasil", description: "Rekap hasil dapat dilihat dan diunduh oleh pihak terkait.", icon: FileCheck2 },
];

const modules: IconItem[] = [
  { title: "Super Admin", description: "Mengelola sekolah, kesiapan sistem, dan pemantauan global.", icon: UserCog },
  { title: "Admin Sekolah", description: "Mengatur data sekolah, pengguna, ujian, laporan, dan catatan aktivitas sekolah.", icon: School },
  { title: "Guru", description: "Membuat soal, menyusun paket, memantau kelas, dan koreksi manual.", icon: GraduationCap },
  { title: "Siswa", description: "Mengakses jadwal, ujian aktif, riwayat, dan hasil ujian.", icon: BookOpenCheck },
  { title: "Pengawas", description: "Mengelola token, pemantauan ujian, dan bantuan saat pelaksanaan.", icon: LockKeyhole },
];

const demoRoles: DemoRoleItem[] = [
  {
    title: "Admin Sekolah",
    description: "Lihat pengelolaan data sekolah, pengguna, jadwal ujian, dan rekap operasional.",
    icon: School,
    href: "/login?demo=admin",
  },
  {
    title: "Guru",
    description: "Coba alur bank soal, paket ujian, penjadwalan, monitoring kelas, dan koreksi.",
    icon: GraduationCap,
    href: "/login?demo=teacher",
  },
  {
    title: "Siswa",
    description: "Masuk ke ujian aktif, kerjakan soal demo, simpan jawaban, dan kumpulkan ujian.",
    icon: BookOpenCheck,
    href: "/login?demo=student",
  },
  {
    title: "Pengawas",
    description: "Pantau peserta, status ujian, token, dan bantuan pelaksanaan sesi demo.",
    icon: LockKeyhole,
    href: "/login?demo=proctor",
  },
  {
    title: "Kepala Sekolah",
    description: "Tinjau ringkasan laporan dan progres ujian dari sudut pandang pimpinan sekolah.",
    icon: BarChart3,
    href: "/login?demo=principal",
  },
];

const faqItems = [
  {
    question: "Apakah Sagaya cocok untuk ujian sekolah harian sampai semester?",
    answer: "Ya. Sagaya dirancang untuk CBT sekolah, mulai dari penilaian harian, simulasi, ujian tengah semester, hingga ujian akhir.",
  },
  {
    question: "Apakah guru bisa import soal dari file?",
    answer: "Bisa. Sistem sudah mendukung alur bank soal dan import dokumen agar guru tidak perlu memasukkan semua soal satu per satu.",
  },
  {
    question: "Bagaimana dengan akses siswa dan pengawas?",
    answer: "Setiap peran memiliki dashboard dan menu sendiri, sehingga siswa fokus mengerjakan ujian dan pengawas fokus membantu pelaksanaan.",
  },
  {
    question: "Apakah laporan hasil ujian tersedia otomatis?",
    answer: "Nilai objektif dihitung otomatis dan laporan dapat digunakan untuk evaluasi siswa, kelas, mata pelajaran, dan paket ujian.",
  },
] as const;

const beforeItems = ["Data tersebar di banyak file", "Koreksi ujian memakan waktu", "Pemantauan ujian sulit dilakukan", "Laporan harus direkap manual"] as const;
const afterItems = ["Data sekolah terpusat", "Nilai objektif otomatis", "Pengawas memantau ujian aktif", "Laporan siap dianalisis"] as const;

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#F8FAFC] text-[#0F172A]">
      <section className="landing-grid relative bg-white" id="beranda">
        <div className="landing-blob absolute -left-28 top-20 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
        <div className="landing-blob landing-blob-delay absolute right-0 top-6 h-96 w-96 rounded-full bg-sky-200/50 blur-3xl" />

        <nav className="relative z-20 mx-auto flex max-w-[1200px] items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2563EB] font-black text-white shadow-lg shadow-blue-600/25">
              S
            </span>
            <span className="text-xl font-black tracking-wide text-[#0F172A]">SAGAYA</span>
          </Link>

          <div className="hidden items-center gap-7 rounded-full border border-slate-200/80 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur md:flex">
            {navItems.map((item) => (
              <a className="transition hover:text-[#2563EB]" href={item.href} key={item.label}>
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link className="hidden rounded-full px-5 py-3 text-sm font-bold text-slate-700 transition hover:text-[#2563EB] sm:inline-flex" href="/login">
              Login
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 sm:px-5"
              href="/login?demo=true"
            >
              Coba Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-[1200px] gap-12 px-4 pb-20 pt-10 sm:px-6 sm:pb-24 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:pb-32 lg:pt-16">
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-[#2563EB]">
              <Sparkles className="h-4 w-4" />
              Sistem Ujian Online Sekolah
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight text-[#0F172A] sm:text-5xl lg:text-6xl">
              Ujian Online Jadi Mudah, Aman & Terintegrasi
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Sagaya membantu sekolah mengelola CBT, bank soal, jadwal, pengawas, penilaian, dan laporan dalam satu sistem yang rapi untuk semua peran.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2563EB] px-7 py-4 text-sm font-black text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700"
                href="/login?demo=true"
              >
                Coba Demo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-4 text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-[#2563EB]"
                href="#kontak"
              >
                Hubungi Kami
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-5" aria-label="Kepercayaan pengguna">
              <div className="flex -space-x-3">
                {["bg-blue-500", "bg-sky-400", "bg-emerald-400", "bg-slate-700"].map((color) => (
                  <span className={`h-11 w-11 rounded-full border-4 border-white ${color}`} key={color} />
                ))}
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div>
                <p className="text-sm font-black text-[#0F172A]">100+ sekolah</p>
                <div className="mt-1 flex items-center gap-1 text-sm font-bold text-slate-600">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  rating 4.9/5
                </div>
              </div>
            </div>
          </div>

          <div className="relative pt-6 lg:pt-10" id="screenshot">
            <DashboardMockup />
          </div>
        </div>
      </section>

      <section className="bg-white py-20" id="demo">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#2563EB]">Mode Demo</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-[#0F172A] sm:text-4xl">
                Coba Sagaya dari lima sudut pandang sekolah.
              </h2>
              <p className="mt-4 leading-8 text-slate-600">
                Demo memakai akun siap pakai, data contoh, dan pembatasan perubahan operasional agar eksplorasi tetap aman.
              </p>
              <Link
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-[#2563EB] px-7 py-4 text-sm font-black text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700"
                href="/login?demo=true"
              >
                Buka Mode Demo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {demoRoles.map((role) => (
                <DemoRoleCard item={role} key={role.title} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 lg:px-8" id="fitur">
        <SectionHeading
          kicker="Fitur Utama"
          title="Semua yang dibutuhkan sekolah untuk ujian digital."
          description="Dibuat untuk alur kerja sekolah: data tertata, peran jelas, pelaksanaan terpantau, dan hasil mudah dibaca."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard item={feature} key={feature.title} />
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <SectionHeading
            kicker="Masalah vs Solusi"
            title="Dari proses manual ke sistem yang terkoneksi."
            description="Sagaya memangkas pekerjaan berulang tanpa mengubah kebutuhan inti sekolah."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <ComparisonCard title="Sebelum Sagaya" items={beforeItems} tone="slate" />
            <ComparisonCard title="Dengan Sagaya" items={afterItems} tone="blue" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          kicker="Alur Ujian"
          title="Enam langkah dari data sampai laporan."
          description="Alur ringkas untuk admin, guru, pengawas, dan siswa agar ujian berjalan lebih terkendali."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {examFlow.map((step, index) => (
            <FlowCard index={index + 1} item={step} key={step.title} />
          ))}
        </div>
      </section>

      <section className="bg-white py-20" id="modul">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <SectionHeading
            kicker="Modul Sistem"
            title="Dashboard berbeda untuk setiap peran."
            description="Setiap pengguna melihat menu sesuai tanggung jawabnya, sehingga operasional sekolah lebih fokus."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {modules.map((module) => (
              <ModuleCard item={module} key={module.title} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 lg:px-8" id="faq">
        <SectionHeading
          kicker="FAQ"
          title="Pertanyaan yang sering muncul."
          description="Jawaban cepat sebelum sekolah mulai mencoba Sagaya."
        />
        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {faqItems.map((item) => (
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-600/10" key={item.question}>
              <div className="mb-4 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
                  <HelpCircle className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-black text-[#0F172A]">{item.question}</h3>
              </div>
              <p className="leading-7 text-slate-600">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8" id="kontak">
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[2rem] bg-[#0F172A] px-6 py-14 text-white shadow-2xl shadow-slate-950/20 sm:px-10 lg:px-16">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
          <div className="absolute -bottom-24 left-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-blue-200">Siap mulai?</p>
              <h2 className="max-w-3xl text-3xl font-black leading-tight sm:text-4xl">
                Jadikan ujian sekolah lebih rapi, aman, dan mudah dipantau.
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-slate-300">
                Masuk sebagai demo atau hubungi tim untuk menyesuaikan alur Sagaya dengan kebutuhan sekolah.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-black text-[#2563EB] transition hover:-translate-y-0.5" href="/login?demo=true">
                Coba Demo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link className="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10" href="/login">
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2563EB] font-black text-white">S</span>
            <div>
              <p className="font-black text-[#0F172A]">SAGAYA</p>
              <p>Sistem Ujian Online Sekolah</p>
            </div>
          </div>
          <p>© 2026 Sagaya. Semua hak dilindungi.</p>
        </div>
      </footer>
    </main>
  );
}

function SectionHeading({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#2563EB]">{kicker}</p>
      <h2 className="mt-3 text-3xl font-black leading-tight text-[#0F172A] sm:text-4xl">{title}</h2>
      <p className="mt-4 leading-8 text-slate-600">{description}</p>
    </div>
  );
}

function FeatureCard({ item }: { item: IconItem }) {
  const Icon = item.icon;

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-600/10">
      <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-black text-[#0F172A]">{item.title}</h3>
      <p className="mt-3 leading-7 text-slate-600">{item.description}</p>
    </article>
  );
}

function DemoRoleCard({ item }: { item: DemoRoleItem }) {
  const Icon = item.icon;

  return (
    <Link
      className="group rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-100 hover:bg-white hover:shadow-xl hover:shadow-blue-600/10"
      href={item.href}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
          <Icon className="h-6 w-6" />
        </span>
        <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#2563EB]" />
      </div>
      <h3 className="text-lg font-black text-[#0F172A]">{item.title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
    </Link>
  );
}

function ComparisonCard({ title, items, tone }: { title: string; items: readonly string[]; tone: "slate" | "blue" }) {
  const isBlue = tone === "blue";

  return (
    <article className={`rounded-[2rem] border p-7 shadow-sm ${isBlue ? "border-blue-100 bg-blue-50/70" : "border-slate-200 bg-slate-50"}`}>
      <h3 className="mb-6 text-2xl font-black text-[#0F172A]">{title}</h3>
      <div className="space-y-4">
        {items.map((item) => (
          <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm" key={item}>
            <CheckCircle2 className={`h-5 w-5 shrink-0 ${isBlue ? "text-[#22C55E]" : "text-slate-400"}`} />
            <span className="font-semibold text-slate-700">{item}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function FlowCard({ index, item }: { index: number; item: IconItem }) {
  const Icon = item.icon;

  return (
    <article className="group rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-600/10">
      <div className="mb-6 flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2563EB] text-sm font-black text-white">
          {String(index).padStart(2, "0")}
        </span>
        <Icon className="h-6 w-6 text-slate-300 transition group-hover:text-[#2563EB]" />
      </div>
      <h3 className="text-lg font-black text-[#0F172A]">{item.title}</h3>
      <p className="mt-3 leading-7 text-slate-600">{item.description}</p>
    </article>
  );
}

function ModuleCard({ item }: { item: IconItem }) {
  const Icon = item.icon;

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-600/10">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-black text-[#0F172A]">{item.title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
    </article>
  );
}
