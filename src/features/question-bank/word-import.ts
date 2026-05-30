export type WordImportQuestionType = "multiple_choice" | "essay";

export type WordImportQuestion = {
  local_id: string;
  number: number;
  type: WordImportQuestionType;
  content: string;
  options: Record<"A" | "B" | "C" | "D", string>;
  correct_option: string;
  explanation: string;
  errors: string[];
  warnings: string[];
};

const optionLabels = ["A", "B", "C", "D"] as const;

export function parseOfficialWordTemplate(text: string): WordImportQuestion[] {
  const normalizedLines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line !== "---");
  const blocks: Array<{ number: number; lines: string[] }> = [];
  let current: { number: number; lines: string[] } | null = null;

  for (const line of normalizedLines) {
    const match = line.match(/^(\d+)\.\s*(.*)$/);

    if (match) {
      if (current) {
        blocks.push(current);
      }

      current = {
        number: Number(match[1]),
        lines: [match[2] ?? ""],
      };
      continue;
    }

    if (current) {
      current.lines.push(line);
    }
  }

  if (current) {
    blocks.push(current);
  }

  if (blocks.length === 0) {
    return [
      {
        local_id: "word-1",
        number: 1,
        type: "multiple_choice",
        content: "",
        options: { A: "", B: "", C: "", D: "" },
        correct_option: "",
        explanation: "",
        errors: ["Format soal tidak sesuai template"],
        warnings: [],
      },
    ];
  }

  return blocks.map((block, index) => normalizeQuestion(block, index));
}

export function validateWordImportQuestion(
  question: Omit<WordImportQuestion, "errors" | "warnings">,
) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!question.content.trim()) {
    errors.push("Pertanyaan belum diisi");
  }

  if (question.type === "multiple_choice") {
    for (const label of optionLabels) {
      if (!question.options[label]?.trim()) {
        errors.push(`Pilihan ${label} masih kosong`);
      }
    }

    if (!optionLabels.includes(question.correct_option as "A" | "B" | "C" | "D")) {
      errors.push("Jawaban benar tidak valid");
    } else if (!question.options[question.correct_option as "A" | "B" | "C" | "D"]?.trim()) {
      errors.push("Opsi jawaban benar masih kosong");
    }
  }

  if (question.type === "essay" && question.correct_option.trim()) {
    warnings.push("Jawaban essay akan disimpan sebagai pembahasan/pedoman.");
  }

  return { errors, warnings };
}

function normalizeQuestion(
  block: { number: number; lines: string[] },
  index: number,
): WordImportQuestion {
  const options = { A: "", B: "", C: "", D: "" };
  let type: WordImportQuestionType = "multiple_choice";
  let correctOption = "";
  const contentLines: string[] = [];
  const explanationLines: string[] = [];
  const answerLines: string[] = [];
  let mode: "content" | "explanation" | "answer" = "content";

  for (const line of block.lines) {
    const typeMatch = line.match(/^Tipe\s*:\s*(.+)$/i);
    const optionMatch = line.match(/^([A-D])\.\s*(.*)$/i);
    const answerMatch = line.match(/^Jawaban\s*:\s*(.*)$/i);
    const explanationMatch = line.match(/^Pembahasan\s*:?\s*(.*)$/i);

    if (typeMatch) {
      type = typeMatch[1]?.trim().toLowerCase() === "essay"
        ? "essay"
        : "multiple_choice";
      continue;
    }

    if (optionMatch) {
      const label = optionMatch[1]?.toUpperCase() as "A" | "B" | "C" | "D";

      options[label] = optionMatch[2]?.trim() ?? "";
      mode = "content";
      continue;
    }

    if (answerMatch) {
      const answer = answerMatch[1]?.trim() ?? "";

      if (type === "essay") {
        answerLines.push(answer);
        mode = "answer";
      } else {
        correctOption = answer.toUpperCase().slice(0, 1);
        mode = "content";
      }
      continue;
    }

    if (explanationMatch) {
      const explanation = explanationMatch[1]?.trim() ?? "";

      if (explanation) {
        explanationLines.push(explanation);
      }

      mode = "explanation";
      continue;
    }

    if (mode === "explanation") {
      explanationLines.push(line);
    } else if (mode === "answer") {
      answerLines.push(line);
    } else {
      contentLines.push(line);
    }
  }

  const explanation = [
    ...answerLines.filter(Boolean).map((line) => `Jawaban: ${line}`),
    ...explanationLines,
  ].join("\n");
  const baseQuestion = {
    local_id: `word-${block.number || index + 1}-${index}`,
    number: block.number || index + 1,
    type,
    content: contentLines.join("\n").trim(),
    options,
    correct_option: correctOption,
    explanation,
  };
  const validation = validateWordImportQuestion(baseQuestion);

  return {
    ...baseQuestion,
    errors: validation.errors,
    warnings: validation.warnings,
  };
}
