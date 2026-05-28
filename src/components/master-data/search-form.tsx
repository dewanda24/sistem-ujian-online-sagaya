import { Search } from "lucide-react";

interface SearchFormProps {
  placeholder?: string;
  defaultValue?: string;
}

export function SearchForm({ placeholder = "Cari data", defaultValue }: SearchFormProps) {
  return (
    <form className="flex w-full gap-2 sm:max-w-sm">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />
      </div>
      <button
        type="submit"
        className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
      >
        Cari
      </button>
    </form>
  );
}
