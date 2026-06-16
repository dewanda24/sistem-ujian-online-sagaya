import * as XLSX from "xlsx";

import { excelImportColumns } from "@/features/question-bank/excel-import";
import { requirePermission } from "@/lib/auth/require-permission";

export async function GET() {
  await requirePermission("question_bank.manage");

  const example = {
    subject_code: "MTK",
    category: "Aljabar",
    type: "multiple_choice",
    difficulty: "medium",
    content:
      "Hasil dari $x^2$ jika $x = 3$ adalah ...\nContoh rumus blok: $$\\frac{3}{4}+\\frac{1}{2}=\\frac{5}{4}$$",
    option_a: "$6$",
    option_b: "$9$",
    option_c: "$12$",
    option_d: "$15$",
    correct_answer: "B",
    explanation: "$3^2 = 9$",
    point: "1",
    stimulus_title: "Teks Aljabar Singkat",
    stimulus_content: "Gunakan informasi pada soal untuk menjawab.",
  };
  const worksheet = XLSX.utils.json_to_sheet([example], {
    header: [...excelImportColumns],
  });
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Bank Soal");
  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  }) as Buffer;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="template-bank-soal-excel.xlsx"',
    },
  });
}
