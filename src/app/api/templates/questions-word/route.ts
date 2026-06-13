import { Document, Packer, Paragraph, TextRun } from "docx";

import { requirePermission } from "@/lib/auth/require-permission";

export async function GET() {
  await requirePermission("question_bank.manage");

  const doc = new Document({
    sections: [
      {
        children: [
          heading("Template Import Soal Word"),
          paragraph("Gunakan format resmi berikut. Jangan mengubah pola nomor, pilihan, Jawaban, dan Pembahasan."),
          paragraph(""),
          paragraph("1. Pertanyaan soal ditulis di sini"),
          paragraph(""),
          paragraph("A. Pilihan A"),
          paragraph("B. Pilihan B"),
          paragraph("C. Pilihan C"),
          paragraph("D. Pilihan D"),
          paragraph(""),
          paragraph("Jawaban: A"),
          paragraph(""),
          paragraph("Pembahasan:"),
          paragraph("Tulis pembahasan di sini"),
          paragraph(""),
          paragraph("---"),
          paragraph(""),
          paragraph("2. Pertanyaan soal berikutnya"),
          paragraph(""),
          paragraph("A. Pilihan A"),
          paragraph("B. Pilihan B"),
          paragraph("C. Pilihan C"),
          paragraph("D. Pilihan D"),
          paragraph(""),
          paragraph("Jawaban: C"),
          paragraph(""),
          paragraph("Pembahasan:"),
          paragraph("Tulis pembahasan di sini"),
          paragraph(""),
          paragraph("---"),
          paragraph(""),
          paragraph("3. Contoh soal essay"),
          paragraph("Tipe: Essay"),
          paragraph("Jelaskan proses terjadinya hujan."),
          paragraph(""),
          paragraph("Jawaban:"),
          paragraph("Pedoman jawaban dapat ditulis di sini"),
          paragraph(""),
          paragraph("Pembahasan:"),
          paragraph("Pembahasan essay optional."),
        ],
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition":
        'attachment; filename="template-bank-soal-word.docx"',
    },
  });
}

function heading(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 32 })],
  });
}

function paragraph(text: string) {
  return new Paragraph({
    children: [new TextRun(text)],
  });
}
