import React, { useMemo } from 'react';

interface FormattedSynopsisProps {
  text: string;
}

interface TextSegment {
  content: string;
  isQuote: boolean;
}

// Matches quoted dialogue across curly (“…”), straight ("…"), mixed (“…"), guillemets («…»), and CJK quotes (「…」)
const DIALOGUE_QUOTE_REGEX = /(?:“[^”"\n]+[”"]|"[^"\n”]+["”]|«[^»\n]+»|「[^」\n]+」)/g;

function tokenizeParagraph(paragraph: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  for (const match of paragraph.matchAll(DIALOGUE_QUOTE_REGEX)) {
    const matchIndex = match.index ?? 0;
    const matchedText = match[0];

    if (matchIndex > lastIndex) {
      segments.push({
        content: paragraph.slice(lastIndex, matchIndex),
        isQuote: false
      });
    }

    segments.push({
      content: matchedText,
      isQuote: true
    });

    lastIndex = matchIndex + matchedText.length;
  }

  if (lastIndex < paragraph.length) {
    segments.push({
      content: paragraph.slice(lastIndex),
      isQuote: false
    });
  }

  return segments.length > 0 ? segments : [{ content: paragraph, isQuote: false }];
}

export const FormattedSynopsis: React.FC<FormattedSynopsisProps> = ({ text }) => {
  const paragraphs = useMemo(() => {
    const normalized = text.replace(/\r\n/g, '\n').trim();
    if (!normalized) return [];
    return normalized
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const segments = tokenizeParagraph(line);
        const hasAnyQuote = segments.some((s) => s.isQuote);
        const isStandaloneDialogue =
          hasAnyQuote && segments.every((s) => s.isQuote || s.content.trim() === '');
        return {
          raw: line,
          segments,
          isStandaloneDialogue
        };
      });
  }, [text]);

  return (
    <div className="space-y-4 sm:space-y-[18px] text-[13px] sm:text-[14.5px] text-neutral-700 leading-[2.05] font-serif max-w-[600px] mx-auto">
      {paragraphs.map((para, pIdx) => {
        if (para.isStandaloneDialogue) {
          const quoteSegments = para.segments.filter((s) => s.isQuote);
          return (
            <blockquote
              key={pIdx}
              className="relative pl-4 sm:pl-5 py-1 my-1.5"
            >
              <span
                aria-hidden="true"
                className="synopsis-dialogue-bar absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full opacity-80"
              />
              <p className="font-serif italic font-bold text-[13.5px] sm:text-[15.5px] leading-[1.95] tracking-[0.01em] space-y-0.5">
                {quoteSegments.length > 1 ? (
                  quoteSegments.map((seg, qIdx) => (
                    <span
                      key={qIdx}
                      className={`synopsis-dialogue-ombre ${
                        qIdx === 0
                          ? 'block text-[12px] sm:text-[13.5px] opacity-85'
                          : 'block'
                      }`}
                    >
                      {seg.content}
                    </span>
                  ))
                ) : (
                  <span className="synopsis-dialogue-ombre">
                    {para.raw}
                  </span>
                )}
              </p>
            </blockquote>
          );
        }

        return (
          <p key={pIdx} className="font-serif font-normal text-neutral-700 leading-[2.05]">
            {para.segments.map((seg, sIdx) =>
              seg.isQuote ? (
                <span
                  key={sIdx}
                  className="synopsis-dialogue-ombre italic font-bold tracking-[0.01em]"
                >
                  {seg.content}
                </span>
              ) : (
                <React.Fragment key={sIdx}>{seg.content}</React.Fragment>
              )
            )}
          </p>
        );
      })}
    </div>
  );
};
