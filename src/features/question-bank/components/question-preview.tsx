import { QuestionMathRenderer } from "@/features/question-bank/components/question-math-renderer";
import { QuestionMediaPreview } from "@/features/question-bank/components/question-media-preview";

type QuestionPreviewProps = {
  question: {
    content: string;
    explanation?: string | null;
    question_stimuli?: {
      title?: string | null;
      content?: string | null;
      media_url?: string | null;
      media_type?: string | null;
    } | null;
    stimulus_question_count?: number | null;
    question_attachments?: Array<{
      id: string;
      media_type: string;
      url: string;
      file_name?: string | null;
      caption?: string | null;
      order_number: number;
    }> | null;
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
  const attachments = [...(question.question_attachments ?? [])].sort(
    (a, b) => a.order_number - b.order_number,
  );

  return (
    <details className="rounded-md border bg-background p-3">
      <summary className="cursor-pointer text-sm font-medium">Pratinjau</summary>
      <div className="mt-3 space-y-3 text-sm">
        {question.question_stimuli ? (
          <div className="rounded-md border border-dashed p-3">
            <div className="font-medium">{question.question_stimuli.title}</div>
            <QuestionMathRenderer
              content={question.question_stimuli.content}
              className="mt-2 text-muted-foreground"
            />
            <QuestionMediaPreview
              mediaType={question.question_stimuli.media_type}
              url={question.question_stimuli.media_url}
              title={question.question_stimuli.title}
              className="mt-2"
            />
            {Number(question.stimulus_question_count ?? 0) > 1 ? (
              <div className="mt-2 text-xs font-medium text-emerald-700">
                Stimulus ini digunakan oleh beberapa soal.
              </div>
            ) : null}
          </div>
        ) : null}
        <QuestionMathRenderer content={question.content} className="leading-6" />
        {attachments.length ? (
          <div className="grid gap-2">
            {attachments.map((attachment) => (
              <QuestionMediaPreview
                key={attachment.id}
                mediaType={attachment.media_type}
                url={attachment.url}
                title={attachment.file_name}
                caption={attachment.caption}
              />
            ))}
          </div>
        ) : null}
        {options.length ? (
          <div className="grid gap-2">
            {options.map((option) => (
              <div
                key={option.id}
                className="flex gap-2 rounded-md border px-3 py-2"
              >
                <span className="font-semibold">{option.option_label}.</span>
                <span className="flex-1">
                  <QuestionMathRenderer content={option.option_text} />
                </span>
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
            <QuestionMathRenderer content={question.explanation} />
          </div>
        ) : null}
      </div>
    </details>
  );
}
