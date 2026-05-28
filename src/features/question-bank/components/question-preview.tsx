type QuestionPreviewProps = {
  question: {
    content: string;
    explanation?: string | null;
    question_options?: Array<{
      id: string;
      option_label: string;
      option_text: string;
      is_correct: boolean;
      order_number: number;
    }> | null;
  };
};

export function QuestionPreview({ question }: QuestionPreviewProps) {
  const options = [...(question.question_options ?? [])].sort(
    (a, b) => a.order_number - b.order_number,
  );

  return (
    <details className="rounded-md border bg-background p-3">
      <summary className="cursor-pointer text-sm font-medium">Preview</summary>
      <div className="mt-3 space-y-3 text-sm">
        <div className="whitespace-pre-wrap leading-6">{question.content}</div>
        {options.length ? (
          <div className="grid gap-2">
            {options.map((option) => (
              <div
                key={option.id}
                className="flex gap-2 rounded-md border px-3 py-2"
              >
                <span className="font-semibold">{option.option_label}.</span>
                <span className="flex-1">{option.option_text}</span>
                {option.is_correct ? (
                  <span className="text-xs font-medium text-emerald-700">
                    Benar
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
        {question.explanation ? (
          <div className="rounded-md bg-muted p-3 text-muted-foreground">
            {question.explanation}
          </div>
        ) : null}
      </div>
    </details>
  );
}
