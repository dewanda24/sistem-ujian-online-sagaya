import katex from "katex";

import { cn } from "@/lib/utils";

type QuestionMathRendererProps = {
  content?: string | null;
  className?: string;
};

const blockDelimiterPattern = /(\$\$[\s\S]+?\$\$)/g;
const inlineDelimiterPattern = /(\$[^$\n]+\$)/g;
const mathCommandPattern =
  /\\(?:frac|sqrt|sum|prod|int|lim|pi|theta|alpha|beta|gamma|delta|Delta|Omega|sin|cos|tan|log|ln|cdot|times|div|leq|geq|neq|approx|pm|infty)\b/;

export function QuestionMathRenderer({
  content,
  className,
}: QuestionMathRendererProps) {
  const value = content?.trimEnd() ?? "";

  if (!value.trim()) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {renderBlocks(value)}
    </div>
  );
}

function renderBlocks(value: string) {
  const blocks = value.split(blockDelimiterPattern).filter(Boolean);

  return blocks.map((block, blockIndex) => {
    if (block.startsWith("$$") && block.endsWith("$$")) {
      return (
        <MathFormula
          key={`block-${blockIndex}`}
          formula={block.slice(2, -2)}
          displayMode
        />
      );
    }

    return block.split(/\r?\n/).map((line, lineIndex) => {
      const key = `line-${blockIndex}-${lineIndex}`;

      if (!line.trim()) {
        return <br key={key} />;
      }

      if (isBareMathLine(line)) {
        return (
          <MathFormula
            key={key}
            formula={line.trim()}
            displayMode={false}
            className="py-1"
          />
        );
      }

      return (
        <p key={key} className="whitespace-pre-wrap">
          {renderInlineMath(line, key)}
        </p>
      );
    });
  });
}

function renderInlineMath(line: string, keyPrefix: string) {
  return line.split(inlineDelimiterPattern).filter(Boolean).map((part, index) => {
    if (part.startsWith("$") && part.endsWith("$")) {
      return (
        <MathFormula
          key={`${keyPrefix}-inline-${index}`}
          formula={part.slice(1, -1)}
          displayMode={false}
          inline
        />
      );
    }

    return part;
  });
}

function MathFormula({
  formula,
  displayMode,
  inline = false,
  className,
}: {
  formula: string;
  displayMode: boolean;
  inline?: boolean;
  className?: string;
}) {
  const html = katex.renderToString(formula.trim(), {
    displayMode,
    throwOnError: false,
    strict: false,
    trust: false,
  });
  const Component = inline ? "span" : "div";

  return (
    <Component
      className={cn(
        displayMode ? "overflow-x-auto py-2" : "inline-block max-w-full overflow-x-auto align-middle",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function isBareMathLine(line: string) {
  const trimmed = line.trim();

  return mathCommandPattern.test(trimmed);
}
