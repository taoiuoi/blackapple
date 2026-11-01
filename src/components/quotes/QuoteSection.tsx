import { useState } from 'react';
import { Quote as QuoteIcon, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Quote } from '../../types';

interface QuoteSectionProps {
  quotes: Quote[];
  isAdmin: boolean;
  onAddQuote: () => void;
  onDeleteQuote: (id: string) => void;
}

export function QuoteSection({
  quotes,
  isAdmin,
  onAddQuote,
  onDeleteQuote
}: QuoteSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!quotes || quotes.length === 0) return null;

  const current = quotes[currentIndex] || quotes[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % quotes.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + quotes.length) % quotes.length);
  };

  return (
    <section id="quotes" className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="relative bg-[#0d0d12] border border-neutral-800/90 rounded-2xl p-8 sm:p-14 text-center overflow-hidden shadow-2xl">
        {/* Subtle Background Glyph */}
        <div className="absolute top-6 left-8 opacity-5 text-neutral-100 select-none pointer-events-none">
          <QuoteIcon className="w-24 h-24" />
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-800/80 text-xs text-neutral-500">
          <span className="uppercase tracking-widest font-editorial italic text-neutral-400">
            Trích dẫn & Triết học Vũ trụ
          </span>
          <div className="flex items-center gap-3">
            <span>{currentIndex + 1} / {quotes.length}</span>
            {isAdmin && (
              <button
                onClick={onAddQuote}
                className="text-xs text-neutral-300 hover:text-white flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm trích dẫn</span>
              </button>
            )}
          </div>
        </div>

        {/* Big Quote Body in Playfair Display (Compliant with Section 1.2) */}
        <div className="my-6 min-h-[120px] flex items-center justify-center">
          <blockquote className="font-editorial italic text-xl sm:text-2xl md:text-3xl text-neutral-100 leading-relaxed font-normal max-w-3xl">
            "{current.content}"
          </blockquote>
        </div>

        {/* Author / Character Attribution */}
        <div className="mt-8 flex flex-col items-center">
          <cite className="not-italic text-sm font-semibold text-neutral-200">
            {current.author}
          </cite>
          {current.source && (
            <span className="text-xs text-neutral-500 mt-1 font-sans">
              Trích từ: {current.source}
            </span>
          )}
        </div>

        {/* Navigation arrows & delete if admin */}
        <div className="mt-8 pt-6 border-t border-neutral-800/80 flex items-center justify-between">
          <button
            onClick={handlePrev}
            className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
            aria-label="Trích dẫn trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {isAdmin && (
            <button
              onClick={() => onDeleteQuote(current.id)}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa câu này</span>
            </button>
          )}

          <button
            onClick={handleNext}
            className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
            aria-label="Trích dẫn tiếp theo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
