export type CsvParseResult = {
  headers: string[];
  rows: Array<Record<string, string>>;
};

export function parseCsvLine(line: string) {
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

export function parseCsvText(text: string): CsvParseResult {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);

    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });

  return { headers, rows };
}

export function getMissingCsvHeaders(headers: string[], requiredHeaders: string[]) {
  const normalizedHeaders = new Set(headers.map((header) => header.trim()));

  return requiredHeaders.filter((header) => !normalizedHeaders.has(header));
}

export function rowsToCsv(rows: Array<Record<string, string | number | boolean | null | undefined>>) {
  const headers = Array.from(
    rows.reduce<Set<string>>((keys, row) => {
      for (const key of Object.keys(row)) {
        keys.add(key);
      }

      return keys;
    }, new Set<string>()),
  );

  if (headers.length === 0) {
    return "";
  }

  const escape = (value: unknown) =>
    `"${String(value ?? "").replaceAll('"', '""')}"`;

  return [
    headers.map(escape).join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
  ].join("\n");
}
