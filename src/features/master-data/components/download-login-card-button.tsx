"use client";

import { Download } from "lucide-react";

type LoginCardStudent = {
  full_name: string;
  email: string;
  username: string;
  nis: string;
  nisn: string;
  class_name: string;
  academic_year: string;
};

type DownloadLoginCardButtonProps = {
  student: LoginCardStudent;
  password: string;
  loginUrl: string;
  label?: string;
};

type DownloadLoginCardsButtonProps = {
  students: LoginCardStudent[];
  password: string;
  loginUrl: string;
  filename: string;
  label: string;
};

type PdfPage = {
  stream: string;
};

type TextOptions = {
  size?: number;
  font?: "F1" | "F2";
  color?: string;
};

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const CARD_WIDTH = 255;
const CARD_HEIGHT = 218;
const CARD_GAP = 18;
const PAGE_MARGIN_X = 32;
const PAGE_MARGIN_Y = 36;
const CARDS_PER_PAGE = 6;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizePdfText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfText(value: string) {
  return normalizePdfText(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function colorCommand(color: string) {
  if (color === "muted") {
    return "0.38 0.42 0.49 rg";
  }

  if (color === "light") {
    return "0.75 0.78 0.84 rg";
  }

  return "0.07 0.09 0.14 rg";
}

function drawText(
  x: number,
  y: number,
  text: string,
  { size = 10, font = "F1", color = "default" }: TextOptions = {},
) {
  return `BT /${font} ${size} Tf ${colorCommand(color)} ${x} ${y} Td (${escapePdfText(
    text,
  )}) Tj ET\n`;
}

function estimateMaxChars(width: number, size: number) {
  return Math.max(8, Math.floor(width / (size * 0.52)));
}

function wrapText(value: string, width: number, size: number) {
  const maxChars = estimateMaxChars(width, size);
  const words = normalizePdfText(value).split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
      continue;
    }

    current = next;
  }

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : ["-"];
}

function drawWrappedText(
  x: number,
  y: number,
  width: number,
  text: string,
  options: TextOptions = {},
  maxLines = 2,
) {
  const size = options.size ?? 10;
  const lineHeight = size + 3;
  const lines = wrapText(text, width, size).slice(0, maxLines);

  return lines
    .map((line, index) =>
      drawText(x, y - index * lineHeight, line, options),
    )
    .join("");
}

function drawLoginCard(
  student: LoginCardStudent,
  password: string,
  loginUrl: string,
  x: number,
  y: number,
) {
  const nisLabel =
    [student.nis, student.nisn].filter(Boolean).join(" / ") || "-";
  const classLabel = `${student.class_name}${
    student.academic_year ? ` - ${student.academic_year}` : ""
  }`;
  const contentX = x + 16;
  const valueX = x + 88;
  let stream = "";

  stream += `q 0.82 0.84 0.88 RG 1 w ${x} ${y} ${CARD_WIDTH} ${CARD_HEIGHT} re S Q\n`;
  stream += drawText(contentX, y + CARD_HEIGHT - 24, "KARTU LOGIN SISWA", {
    size: 8,
    font: "F2",
    color: "muted",
  });
  stream += drawWrappedText(
    contentX,
    y + CARD_HEIGHT - 45,
    CARD_WIDTH - 32,
    student.full_name,
    { size: 14, font: "F2" },
    2,
  );
  stream += drawWrappedText(
    contentX,
    y + CARD_HEIGHT - 80,
    CARD_WIDTH - 32,
    classLabel,
    { size: 9, color: "muted" },
    2,
  );
  stream += `q 0.90 0.91 0.94 RG 0.6 w ${contentX} ${y + 120} ${
    CARD_WIDTH - 32
  } 0 m ${x + CARD_WIDTH - 16} ${y + 120} l S Q\n`;

  const rows = [
    ["Email", student.email],
    ["Username", student.username],
    ["Password", password],
    ["NIS/NISN", nisLabel],
    ["Login", loginUrl],
  ];
  let rowY = y + 101;

  for (const [label, value] of rows) {
    stream += drawText(contentX, rowY, label, { size: 9, color: "muted" });
    stream += drawWrappedText(valueX, rowY, CARD_WIDTH - 105, value, {
      size: 9,
      font: "F2",
    });
    rowY -= 22;
  }

  stream += `q 0.90 0.91 0.94 RG 0.6 w ${contentX} ${y + 26} ${
    CARD_WIDTH - 32
  } 0 m ${x + CARD_WIDTH - 16} ${y + 26} l S Q\n`;
  stream += drawWrappedText(
    contentX,
    y + 12,
    CARD_WIDTH - 32,
    "Simpan kartu ini dengan aman. Password dapat diganti/reset oleh admin.",
    { size: 7, color: "muted" },
    1,
  );

  return stream;
}

function buildPdfPages(
  students: LoginCardStudent[],
  password: string,
  loginUrl: string,
) {
  const pages: PdfPage[] = [];

  for (let index = 0; index < students.length; index += CARDS_PER_PAGE) {
    const pageStudents = students.slice(index, index + CARDS_PER_PAGE);
    let stream = "";

    pageStudents.forEach((student, pageIndex) => {
      const column = pageIndex % 2;
      const row = Math.floor(pageIndex / 2);
      const x = PAGE_MARGIN_X + column * (CARD_WIDTH + CARD_GAP);
      const y =
        PAGE_HEIGHT -
        PAGE_MARGIN_Y -
        CARD_HEIGHT -
        row * (CARD_HEIGHT + CARD_GAP);

      stream += drawLoginCard(student, password, loginUrl, x, y);
    });

    pages.push({ stream });
  }

  return pages;
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

function buildPdfBlob(
  students: LoginCardStudent[],
  password: string,
  loginUrl: string,
) {
  const pages = buildPdfPages(students, password, loginUrl);
  const objects: string[] = [];

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("");

  const pageObjectNumbers: number[] = [];

  for (const page of pages) {
    const contentObjectNumber = objects.length + 1;
    objects.push(`<< /Length ${byteLength(page.stream)} >>\nstream\n${page.stream}endstream`);

    const pageObjectNumber = objects.length + 1;
    pageObjectNumbers.push(pageObjectNumber);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /Contents ${contentObjectNumber} 0 R >>`,
    );
  }

  objects[1] = `<< /Type /Pages /Kids [${pageObjectNumbers
    .map((objectNumber) => `${objectNumber} 0 R`)
    .join(" ")}] /Count ${pageObjectNumbers.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

function downloadPdf(
  students: LoginCardStudent[],
  password: string,
  loginUrl: string,
  filename: string,
) {
  const blob = buildPdfBlob(students, password, loginUrl);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${slugify(filename)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function DownloadLoginCardButton({
  student,
  password,
  loginUrl,
  label = "Download PDF",
}: DownloadLoginCardButtonProps) {
  function downloadCard() {
    downloadPdf(
      [student],
      password,
      loginUrl,
      `kartu-login-${student.username || student.full_name}`,
    );
  }

  return (
    <button
      type="button"
      onClick={downloadCard}
      className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
    >
      <Download className="size-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

export function DownloadLoginCardsButton({
  students,
  password,
  loginUrl,
  filename,
  label,
}: DownloadLoginCardsButtonProps) {
  function downloadCards() {
    downloadPdf(students, password, loginUrl, filename);
  }

  return (
    <button
      type="button"
      onClick={downloadCards}
      disabled={students.length === 0}
      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Download className="size-4" aria-hidden="true" />
      {label}
    </button>
  );
}
