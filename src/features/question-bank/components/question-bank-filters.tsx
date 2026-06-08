import type { SelectOption } from "@/lib/master-data/queries";

interface QuestionBankFiltersProps {
  subjects: SelectOption[];
  categories?: Array<SelectOption & { subject_id?: string }>;
  defaults: {
    q?: string;
    subject_id?: string;
    category_id?: string;
    type?: string;
    difficulty?: string;
    status?: string;
  };
  includeQuestionFilters?: boolean;
}

export function QuestionBankFilters({
  subjects,
  categories = [],
  defaults,
  includeQuestionFilters = false,
}: QuestionBankFiltersProps) {
  return (
    <form className="grid gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-6">
      <input
        name="q"
        defaultValue={defaults.q}
        placeholder="Cari"
        className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
      />
      <select
        name="subject_id"
        defaultValue={defaults.subject_id ?? ""}
        className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
      >
        <option value="">Semua mapel</option>
        {subjects.map((subject) => (
          <option key={subject.value} value={subject.value}>
            {subject.label}
          </option>
        ))}
      </select>
      {includeQuestionFilters ? (
        <>
          <select
            name="category_id"
            defaultValue={defaults.category_id ?? ""}
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
          >
            <option value="">Semua kategori</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          <select
            name="type"
            defaultValue={defaults.type ?? ""}
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
          >
            <option value="">Semua tipe</option>
            <option value="multiple_choice">Pilihan ganda</option>
            <option value="essay">Essay</option>
          </select>
          <select
            name="status"
            defaultValue={defaults.status ?? ""}
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
          >
            <option value="">Semua status</option>
            <option value="draft">Draft</option>
            <option value="published">Sudah Diterbitkan</option>
            <option value="archived">Archived</option>
          </select>
        </>
      ) : null}
      <button className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8]">
        Filter
      </button>
    </form>
  );
}
