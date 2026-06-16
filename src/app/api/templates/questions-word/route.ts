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
          paragraph("Untuk soal matematika, tulis rumus inline dengan $...$ dan rumus besar dengan $$...$$."),
          paragraph(""),
          paragraph("1. Hitung nilai $\\frac{3}{4}+\\frac{1}{2}$ pada pecahan berikut."),
          paragraph("Rumus blok juga bisa ditulis seperti ini:"),
          paragraph("$$\\frac{3}{4}+\\frac{1}{2}=\\frac{5}{4}$$"),
          paragraph(""),
          paragraph("A. $\\frac{4}{4}$"),
          paragraph("B. $\\frac{5}{4}$"),
          paragraph("C. $\\frac{6}{4}$"),
          paragraph("D. $\\frac{7}{4}$"),
          paragraph(""),
          paragraph("Jawaban: B"),
          paragraph(""),
          paragraph("Pembahasan:"),
          paragraph("Samakan penyebut: $\\frac{3}{4}+\\frac{2}{4}=\\frac{5}{4}$."),
          paragraph(""),
          paragraph("---"),
          paragraph(""),
          paragraph("2. Jika $2x+5=17$, nilai $x$ adalah ..."),
          paragraph(""),
          paragraph("A. $4$"),
          paragraph("B. $5$"),
          paragraph("C. $6$"),
          paragraph("D. $7$"),
          paragraph(""),
          paragraph("Jawaban: C"),
          paragraph(""),
          paragraph("Pembahasan:"),
          paragraph("$2x=12$, jadi $x=6$."),
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
