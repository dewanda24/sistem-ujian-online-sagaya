"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ExcelImportForm } from "@/features/question-bank/components/excel-import-form";
import { WordImportForm } from "@/features/question-bank/components/word-import-form";
import type { SelectOption } from "@/lib/master-data/queries";
import { cn } from "@/lib/utils";
import { ImportPreviewForm } from "./import-preview-form";
import {
  importTemplates,
  type TemplateType,
} from "../templates";

type CategoryOption = SelectOption & {
  subject_id?: string;
};

type ImportModule =
  | TemplateType
  | "questions-excel"
  | "questions-word";

type ImportWizardProps = {
  canManageQuestions: boolean;
  notice?: string;
  message?: string;
  subjects: SelectOption[];
  categories: CategoryOption[];
};

const masterModules: Array<{ value: TemplateType; label: string }> = [
  { value: "students", label: "Siswa" },
  { value: "teachers", label: "Guru" },
  { value: "classes", label: "Kelas" },
  { value: "subjects", label: "Mata Pelajaran" },
  { value: "student-class-assignments", label: "Penugasan Siswa-Kelas" },
  {
    value: "teacher-subject-assignments",
    label: "Penugasan Guru-Mata Pelajaran-Kelas",
  },
];

const questionModules: Array<{ value: ImportModule; label: string }> = [
  { value: "questions-excel", label: "Bank Soal Excel/CSV" },
  { value: "questions-word", label: "Bank Soal Word" },
];

export function ImportWizard({
  canManageQuestions,
  notice,
  message,
  subjects,
  categories,
}: ImportWizardProps) {
  const modules = useMemo(
    () => [
      ...masterModules,
      ...(canManageQuestions ? questionModules : []),
    ],
    [canManageQuestions],
  );
  const [selectedModule, setSelectedModule] = useState<ImportModule>(
    modules[0]?.value ?? "students",
  );
  const selectedLabel =
    modules.find((module) => module.value === selectedModule)?.label ??
    "Siswa";
  const templateType =
    selectedModule === "questions-excel"
      ? "questions"
      : isTemplateType(selectedModule)
        ? selectedModule
        : null;
  const template = templateType ? importTemplates[templateType] : null;

  return (
    <section className="space-y-4">
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Pilih Modul</span>
            <select
              value={selectedModule}
              onChange={(event) =>
                setSelectedModule(event.target.value as ImportModule)
              }
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              {modules.map((module) => (
                <option key={module.value} value={module.value}>
                  {module.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3">
            <div>
              <h2 className="text-base font-semibold">{selectedLabel}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Ikuti urutan: pilih modul, unduh template, unggah file,
                validasi, pratinjau, import, lalu unduh hasil.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {template ? (
                <Link
                  href={`/api/templates/${templateType}`}
                  className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Unduh Template
                </Link>
              ) : (
                <Link
                  href="/api/templates/questions-word"
                  className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Unduh Template Word
                </Link>
              )}
              <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
                Import hanya aktif setelah data valid
              </span>
              {selectedModule === "questions-excel" ||
              selectedModule === "questions-word" ? (
                <span className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-medium text-emerald-700">
                  Hasil masuk sebagai belum diterbitkan
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {template ? (
          <div className="mt-4 rounded-md border bg-muted/30 p-3">
            <div className="text-xs font-medium uppercase text-muted-foreground">
              Kolom wajib
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {template.columns.map((column) => (
                <span
                  key={column.key}
                  className="rounded-md border bg-background px-2 py-1 text-xs"
                >
                  {column.key}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div>
        <StepRail />

        {isMasterModule(selectedModule) ? (
          <ImportPreviewForm
            key={selectedModule}
            moduleType={selectedModule}
            hideModuleSelector
          />
        ) : null}

        {selectedModule === "questions-excel" ? (
          <ExcelImportForm
            notice={notice}
            message={message}
            hideTemplateLink
          />
        ) : null}

        {selectedModule === "questions-word" ? (
          <WordImportForm
            subjects={subjects}
            categories={categories}
            notice={notice}
            message={message}
            hideTemplateLink
          />
        ) : null}
      </div>
    </section>
  );
}

function StepRail() {
  const steps = [
    "Pilih Modul",
    "Template",
    "Unggah",
    "Validasi",
    "Pratinjau",
    "Import",
    "Hasil",
  ];

  return (
    <div className="mb-5 grid gap-2 md:grid-cols-7">
      {steps.map((step, index) => (
        <div
          key={step}
          className={cn(
            "rounded-md border px-3 py-2 text-xs",
            index === 0 ? "bg-primary text-primary-foreground" : "bg-background",
          )}
        >
          <div className="font-semibold">{index + 1}</div>
          <div className="mt-1 truncate">{step}</div>
        </div>
      ))}
    </div>
  );
}

function isMasterModule(value: ImportModule): value is TemplateType {
  return masterModules.some((module) => module.value === value);
}

function isTemplateType(value: ImportModule): value is TemplateType {
  return value === "questions" || isMasterModule(value);
}
