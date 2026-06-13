import Link from "next/link";
import { Plus } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ActionToast } from "@/components/master-data/action-toast";
import { ExamPackageTable } from "@/features/exams/components/exam-package-table";
import { getExamReadinessSummary } from "@/features/exams/readiness";
import {
  getExamPackages,
  getScopedSubjectOptions,
} from "@/features/exams/queries";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    subject_id?: string;
    status?: string;
    notice?: string;
    message?: string;
  }>;
};

export default async function ExamPackagesPage({ searchParams }: PageProps) {
  await requirePermission("exam_packages.view");
  const params = await searchParams;
  const filters = {
    q: params.q,
    subject_id: params.subject_id,
    status: params.status,
  };
  const [subjects, packages, readiness] = await Promise.all([
    getScopedSubjectOptions(),
    getExamPackages(filters),
    getExamReadinessSummary(),
  ]);

  return (
    <div className="space-y-5">
      <ActionToast status={params.notice} message={params.message} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <DashboardPageHeader
          title="Paket Ujian"
          description="Kelola paket ujian secara ringkas. Pembuatan paket dan pemilihan soal dipisahkan agar halaman daftar tetap mudah dipindai."
        />
        <Link
          href="/dashboard/exams/packages/create"
          className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#1D4ED8]"
        >
          <Plus className="size-4" />
          Buat Paket
        </Link>
      </div>

      <form className="grid gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm md:grid-cols-4">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Cari paket"
          className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
        />
        <select
          name="subject_id"
          defaultValue={params.subject_id ?? ""}
          className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
        >
          <option value="">Semua mapel</option>
          {subjects.map((subject) => (
            <option key={subject.value} value={subject.value}>
              {subject.label}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
        >
          <option value="">Semua status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <button className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8]">
          Filter
        </button>
      </form>

      <section className="grid gap-3 md:grid-cols-3">
        <ReadinessMetric
          title="Paket Siap"
          value={`${readiness.readyPackageCount}/${readiness.packageCount}`}
          description="Paket tanpa blocker publish."
        />
        <ReadinessMetric
          title="Jadwal Siap"
          value={`${readiness.readyScheduleCount}/${readiness.scheduleCount}`}
          description="Jadwal tanpa blocker pelaksanaan."
        />
        <ReadinessMetric
          title="Masalah Ujian"
          value={String(readiness.issues.length)}
          description={readiness.issues[0]?.title ?? "Tidak ada masalah readiness."}
          href={readiness.issues[0]?.href}
        />
      </section>

      <ExamPackageTable packages={packages} />
    </div>
  );
}

function ReadinessMetric({
  title,
  value,
  description,
  href,
}: {
  title: string;
  value: string;
  description: string;
  href?: string;
}) {
  const content = (
    <div className="h-full rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-[#64748B]">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-[#0F172A]">{value}</p>
      <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#64748B]">
        {description}
      </p>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
