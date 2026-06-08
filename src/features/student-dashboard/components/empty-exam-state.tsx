import { CalendarDays } from "lucide-react";

export function EmptyExamState() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center sm:p-8">
      <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
        <CalendarDays className="size-6" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-950">
        Belum ada ujian aktif hari ini.
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        Kalau ujian sudah masuk waktunya, tombol mulai akan muncul di halaman ini.
      </p>
    </div>
  );
}
