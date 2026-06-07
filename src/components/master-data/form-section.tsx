import type { ReactNode } from "react";

interface FormSectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="rounded-xl border border-[#E2E8F0] bg-white p-4 text-[#0F172A] shadow-sm sm:p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[#64748B]">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}
