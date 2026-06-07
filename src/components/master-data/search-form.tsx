import { Search } from "lucide-react";

interface SearchFormProps {
  placeholder?: string;
  defaultValue?: string;
}

export function SearchForm({ placeholder = "Cari data", defaultValue }: SearchFormProps) {
  return (
    <form className="flex w-full gap-2 sm:max-w-sm">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
        <input
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white pl-9 pr-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
        />
      </div>
      <button
        type="submit"
        className="h-10 rounded-xl bg-[#2563EB] px-4 text-sm font-medium text-white hover:bg-blue-700"
      >
        Cari
      </button>
    </form>
  );
}
