"use client";

import { useMemo, useState } from "react";

import {
  importTemplates,
  type TemplateType,
} from "@/features/import-export/templates";

type PreviewRow = Record<string, string>;

const templateTypes: TemplateType[] = [
  "students",
  "teachers",
  "classes",
  "questions",
];

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());

  return values;
}

function parseCsv(text: string) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [] as string[], rows: [] as PreviewRow[] };
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);

    return headers.reduce<PreviewRow>((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });

  return { headers, rows };
}

export function ImportPreviewForm() {
  const [templateType, setTemplateType] = useState<TemplateType>("students");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [error, setError] = useState("");
  const template = importTemplates[templateType];
  const requiredHeaders = useMemo(
    () => template.columns.map((column) => column.key),
    [template],
  );
  const missingHeaders = requiredHeaders.filter(
    (header) => !headers.includes(header),
  );
  const rowErrors = rows.flatMap((row, index) =>
    requiredHeaders
      .filter((header) => !row[header])
      .map((header) => `Baris ${index + 2}: ${header} kosong`),
  );
  const isValid = headers.length > 0 && missingHeaders.length === 0 && rowErrors.length === 0;

  async function handleFile(file?: File) {
    setError("");
    setHeaders([]);
    setRows([]);

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("File harus berformat CSV.");
      return;
    }

    const parsed = parseCsv(await file.text());
    setHeaders(parsed.headers);
    setRows(parsed.rows);
  }

  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold">Import Staging Preview</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Validasi struktur CSV sebelum import otomatis diaktifkan. Data tidak
          disimpan ke database.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[220px_1fr]">
        <select
          value={templateType}
          onChange={(event) => {
            setTemplateType(event.target.value as TemplateType);
            setHeaders([]);
            setRows([]);
            setError("");
          }}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          {templateTypes.map((type) => (
            <option key={type} value={type}>
              {importTemplates[type].title}
            </option>
          ))}
        </select>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => handleFile(event.target.files?.[0])}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-md border p-3 text-sm">
          <div className="text-xs text-muted-foreground">Template</div>
          <div className="font-medium">{template.title}</div>
        </div>
        <div className="rounded-md border p-3 text-sm">
          <div className="text-xs text-muted-foreground">Rows</div>
          <div className="font-medium">{rows.length}</div>
        </div>
        <div className="rounded-md border p-3 text-sm">
          <div className="text-xs text-muted-foreground">Status</div>
          <div className={isValid ? "font-medium text-emerald-700" : "font-medium text-amber-700"}>
            {isValid ? "Valid preview" : "Perlu validasi"}
          </div>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {missingHeaders.length ? (
        <p className="mt-3 text-sm text-red-600">
          Header belum lengkap: {missingHeaders.join(", ")}
        </p>
      ) : null}
      {rowErrors.length ? (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {rowErrors.slice(0, 8).map((item) => (
            <div key={item}>{item}</div>
          ))}
          {rowErrors.length > 8 ? <div>+{rowErrors.length - 8} error lain.</div> : null}
        </div>
      ) : null}

      {rows.length ? (
        <div className="mt-4 overflow-hidden rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  {headers.map((header) => (
                    <th key={header} className="px-3 py-2 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.slice(0, 20).map((row, index) => (
                  <tr key={index}>
                    {headers.map((header) => (
                      <td key={header} className="px-3 py-2">
                        {row[header] || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
