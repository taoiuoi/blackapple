import React, { useState, useEffect, useMemo } from 'react';
import {
  Send,
  CornerDownRight,
  Trash2,
  Check,
  X,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { Character, Confession, CreatorProfile } from '../../types';
import {
  subscribeConfessions,
  submitConfession,
  replyConfession,
  deleteConfession
} from '../../services/firestoreService';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface HomeConfessionSectionProps {
  characters?: Character[];
  creatorProfile?: CreatorProfile;
  isAdmin: boolean;
  standalone?: boolean;
}

type FilterMode = 'all' | 'replied' | 'unreplied';

function formatConfessionDate(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export const HomeConfessionSection: React.FC<HomeConfessionSectionProps> = ({
  characters = [],
  creatorProfile,
  isAdmin,
  standalone = false
}) => {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Anonymous submission form state
  const [senderName, setSenderName] = useState('');
  const [targetTopic, setTargetTopic] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Filter & pagination state
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [showAll, setShowAll] = useState(standalone);

  // Creator reply & delete inline state
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyDraftMap, setReplyDraftMap] = useState<Record<string, string>>({});
  const [savingReplyId, setSavingReplyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeConfessions((list) => {
      setConfessions(list);
      setHasLoaded(true);
    });
    return () => unsub();
  }, []);

  const creatorName = creatorProfile?.penName || 'Táo';

  const repliedCount = useMemo(
    () => confessions.filter((c) => Boolean(c.reply && c.reply.trim())).length,
    [confessions]
  );
  const unrepliedCount = confessions.length - repliedCount;

  const filteredList = useMemo(() => {
    if (filterMode === 'replied') {
      return confessions.filter((c) => Boolean(c.reply && c.reply.trim()));
    }
    if (filterMode === 'unreplied') {
      return confessions.filter((c) => !c.reply || !c.reply.trim());
    }
    return confessions;
  }, [confessions, filterMode]);

  const INITIAL_VISIBLE = standalone ? 24 : 6;
  const visibleList = showAll ? filteredList : filteredList.slice(0, INITIAL_VISIBLE);
  const hiddenCount = Math.max(0, filteredList.length - visibleList.length);

  const quickTargetOptions = useMemo(() => {
    const base = [`Creator ${creatorName}`];
    const charNames = characters
      .filter((c) => !c.isUpcoming)
      .slice(0, 5)
      .map((c) => c.name);
    return [...base, ...charNames];
  }, [characters, creatorName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSubmitFeedback(null);
      const created = await submitConfession(
        senderName,
        trimmedContent,
        targetTopic.trim() || `Creator ${creatorName}`
      );
      // Ensure immediate presence at top even before async snapshot resolves
      setConfessions((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
      setSenderName('');
      setTargetTopic('');
      setContent('');
      setFilterMode('all');
      setSubmitFeedback({
        type: 'success',
        message: 'Đã gửi ẩn danh và hiển thị công khai ngay lập tức.'
      });
      setTimeout(() => setSubmitFeedback(null), 5000);
    } catch (_) {
      setSubmitFeedback({
        type: 'error',
        message: 'Không thể gửi confession lúc này. Bạn vui lòng thử lại.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReplyEditor = (item: Confession) => {
    if (activeReplyId === item.id) {
      setActiveReplyId(null);
      return;
    }
    setActiveReplyId(item.id);
    setConfirmDeleteId(null);
    setReplyDraftMap((prev) => ({
      ...prev,
      [item.id]: prev[item.id] !== undefined ? prev[item.id] : item.reply || ''
    }));
  };

  const handleSaveReply = async (item: Confession, explicitText?: string) => {
    const textToSave =
      explicitText !== undefined ? explicitText : replyDraftMap[item.id] ?? item.reply ?? '';
    try {
      setSavingReplyId(item.id);
      await replyConfession(item.id, textToSave, item);
      const trimmed = textToSave.trim();
      const now = new Date().toISOString();
      setConfessions((prev) =>
        prev.map((c) =>
          c.id === item.id
            ? {
                ...c,
                reply: trimmed,
                repliedAt: trimmed ? now : '',
                updatedAt: now
              }
            : c
        )
      );
      setActiveReplyId(null);
    } finally {
      setSavingReplyId(null);
    }
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      setDeletingId(id);
      setConfessions((prev) => prev.filter((item) => item.id !== id));
      await deleteConfession(id);
      setConfirmDeleteId(null);
      if (activeReplyId === id) setActiveReplyId(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section
      id="confession"
      aria-labelledby="home-confession-heading"
      className={`relative w-[90%] mx-auto ${
        standalone
          ? 'max-w-[980px] py-8 sm:py-14'
          : 'max-w-[460px] lg:max-w-[960px] mt-14 sm:mt-20 mb-14 sm:mb-24'
      }`}
    >
      {/* Editorial Section Masthead */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-white/[0.1] mb-7 sm:mb-9">
        <div className="space-y-1.5 max-w-xl">
          <p className="text-[10px] sm:text-[11px] tracking-[0.22em] uppercase text-neutral-400 font-sans">
            <span className="font-serif text-neutral-300">— 匿名信箱</span>
            <span className="mx-2 text-neutral-600" aria-hidden="true">·</span>
            <span>Hòm thư ẩn danh</span>
          </p>
          <h2
            id="home-confession-heading"
            className="font-editorial italic text-2xl sm:text-3xl text-white tracking-wide [text-wrap:balance]"
          >
            Confession &amp; Hỏi Đáp Tới Creator
          </h2>
          <p className="text-xs sm:text-[13.5px] text-neutral-300/90 font-light leading-relaxed">
            Gửi câu hỏi, cảm nghĩ hoặc lời tâm sự ẩn danh trực tiếp tới Creator {creatorName}. Tin nhắn tự động hiển thị ngay để mọi người cùng đọc và theo dõi phản hồi.
          </p>
        </div>

        {/* Clean Unboxed Archival Metrics */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-neutral-400 font-sans shrink-0 tabular-nums">
          <span>
            <strong className="text-white font-semibold">{confessions.length}</strong> lá thư
          </span>
          <span className="text-neutral-600" aria-hidden="true">·</span>
          <span>
            <strong className="text-[#e7d7b9] font-semibold">{repliedCount}</strong> đã phản hồi
          </span>
          {isAdmin && (
            <>
              <span className="text-neutral-600" aria-hidden="true">·</span>
              <span className="text-neutral-200 font-medium">Quyền Creator đang bật</span>
            </>
          )}
        </div>
      </div>

      {/* Main 2-Column Editorial Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-9 items-start">
        {/* LEFT COLUMN: Anonymous Confession Composer */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <div className="relative rounded-[22px] lens-crystal-panel p-5 sm:p-6 overflow-hidden">
            <div className="pb-4 mb-5 border-b border-white/[0.1] space-y-1">
              <h3 className="font-editorial text-lg sm:text-xl text-white tracking-wide">
                Viết lời nhắn ẩn danh
              </h3>
              <p className="text-xs text-neutral-400 font-light">
                Không cần đăng nhập · Tự động đăng tải ngay
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Optional Alias */}
              <div>
                <label
                  htmlFor="cfs-sender-input"
                  className="block text-xs text-neutral-300 mb-1.5 font-medium"
                >
                  Danh xưng hoặc bút danh <span className="text-neutral-500 font-normal">(tùy chọn)</span>
                </label>
                <input
                  id="cfs-sender-input"
                  type="text"
                  maxLength={100}
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Bỏ trống để gửi dưới tên Ẩn danh"
                  className="w-full rounded-xl bg-black/45 border border-white/15 focus:border-white/55 px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-500 outline-none transition-colors"
                />
              </div>

              {/* Optional Target / Topic */}
              <div>
                <label
                  htmlFor="cfs-target-input"
                  className="block text-xs text-neutral-300 mb-1.5 font-medium"
                >
                  Chủ đề hoặc nhân vật muốn hỏi <span className="text-neutral-500 font-normal">(tùy chọn)</span>
                </label>
                <input
                  id="cfs-target-input"
                  type="text"
                  maxLength={100}
                  value={targetTopic}
                  onChange={(e) => setTargetTopic(e.target.value)}
                  placeholder={`VD: Creator ${creatorName}, Ngưu Thánh Anh, pass...`}
                  className="w-full rounded-xl bg-black/45 border border-white/15 focus:border-white/55 px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-500 outline-none transition-colors"
                />
                {quickTargetOptions.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {quickTargetOptions.map((label) => {
                      const isSelected = targetTopic.trim().toLowerCase() === label.toLowerCase();
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setTargetTopic(isSelected ? '' : label)}
                          className={`px-2.5 py-1 rounded-md text-[11px] transition-colors cursor-pointer whitespace-nowrap ${
                            isSelected
                              ? 'bg-white text-[#0b0b0d] font-medium'
                              : 'bg-white/[0.05] text-neutral-300 hover:bg-white/[0.12] hover:text-white'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Required Content */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="cfs-content-input"
                    className="block text-xs text-neutral-300 font-medium"
                  >
                    Câu hỏi hoặc tâm sự <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[11px] text-neutral-500 tabular-nums">
                    {content.length} / 2000
                  </span>
                </div>
                <textarea
                  id="cfs-content-input"
                  required
                  rows={5}
                  maxLength={2000}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Hỏi về nhân vật, văn án, commission, hoặc gửi đôi dòng tâm sự tới Creator..."
                  className="w-full rounded-xl bg-black/45 border border-white/15 focus:border-white/55 px-3.5 py-3 text-sm text-white placeholder:text-neutral-500 outline-none resize-y min-h-[120px] leading-relaxed transition-colors"
                />
              </div>

              {/* Status Feedback (Always icon + explicit label) */}
              {submitFeedback && (
                <div
                  role="status"
                  className={`flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-xs leading-relaxed border ${
                    submitFeedback.type === 'success'
                      ? 'bg-emerald-950/50 border-emerald-500/35 text-emerald-200'
                      : 'bg-rose-950/50 border-rose-500/35 text-rose-200'
                  }`}
                >
                  {submitFeedback.type === 'success' ? (
                    <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  )}
                  <span>{submitFeedback.message}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="w-full min-h-[44px] py-2.5 px-5 rounded-full bg-white hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed text-[#0b0b0d] text-xs font-semibold tracking-[0.14em] uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Đang gửi...' : 'Gửi confession ngay'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Public Q&A & Confession Archive */}
        <div className="lg:col-span-7 space-y-5">
          {/* Interactive Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label="Lọc confession"
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.1]"
            >
              <button
                type="button"
                role="tab"
                aria-selected={filterMode === 'all'}
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap cursor-pointer tabular-nums ${
                  filterMode === 'all'
                    ? 'bg-white text-[#0b0b0d] font-semibold'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                Tất cả ({confessions.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filterMode === 'replied'}
                onClick={() => setFilterMode('replied')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap cursor-pointer tabular-nums ${
                  filterMode === 'replied'
                    ? 'bg-white text-[#0b0b0d] font-semibold'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                Đã trả lời ({repliedCount})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filterMode === 'unreplied'}
                onClick={() => setFilterMode('unreplied')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap cursor-pointer tabular-nums ${
                  filterMode === 'unreplied'
                    ? 'bg-white text-[#0b0b0d] font-semibold'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                Chờ phản hồi ({unrepliedCount})
              </button>
            </div>
          </div>

          {/* Confession Cards List */}
          {!hasLoaded && confessions.length === 0 ? (
            <div className="space-y-4">
              {[0, 1].map((skeleton) => (
                <div
                  key={skeleton}
                  className="rounded-[18px] bg-[#0b0b0f]/70 border border-white/[0.08] p-6 animate-pulse space-y-3"
                >
                  <div className="h-3 w-40 bg-white/10 rounded" />
                  <div className="h-4 w-full bg-white/10 rounded" />
                  <div className="h-4 w-3/4 bg-white/10 rounded" />
                </div>
              ))}
            </div>
          ) : visibleList.length === 0 ? (
            <div className="rounded-[18px] bg-[#0b0b0f]/65 border border-white/[0.1] px-6 py-14 text-center space-y-2">
              <p className="font-editorial italic text-lg text-neutral-200">
                {filterMode === 'replied'
                  ? 'Chưa có lá thư nào được phản hồi.'
                  : filterMode === 'unreplied'
                  ? 'Tất cả confession hiện tại đều đã được Creator phản hồi.'
                  : 'Hòm thư đang chờ lá thư đầu tiên từ bạn.'}
              </p>
              <p className="text-xs text-neutral-400 font-light">
                Bạn có thể gửi câu hỏi hoặc lời nhắn ẩn danh ở khung bên cạnh.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleList.map((item, idx) => {
                const sequenceNumber = String(filteredList.length - idx).padStart(2, '0');
                const hasReply = Boolean(item.reply && item.reply.trim());
                const isReplying = activeReplyId === item.id;
                const isConfirmingDelete = confirmDeleteId === item.id;
                const draftValue =
                  replyDraftMap[item.id] !== undefined ? replyDraftMap[item.id] : item.reply || '';

                return (
                  <article
                    key={item.id}
                    className="rounded-[18px] bg-[#0b0b0f]/80 border border-white/[0.11] hover:border-white/[0.2] p-5 sm:p-6 transition-colors duration-200"
                  >
                    {/* Header Metadata Row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-400 min-w-0">
                        <span className="font-mono text-[11px] text-neutral-500 tabular-nums">
                          #{sequenceNumber}
                        </span>
                        <span className="text-neutral-600" aria-hidden="true">·</span>
                        <span className="text-white font-medium truncate max-w-[180px]">
                          {item.sender || 'Ẩn danh'}
                        </span>
                        {item.characterTarget && (
                          <>
                            <span className="text-neutral-600" aria-hidden="true">·</span>
                            <span className="font-editorial italic text-neutral-300 truncate max-w-[180px]">
                              Gửi tới {item.characterTarget}
                            </span>
                          </>
                        )}
                        <span className="text-neutral-600" aria-hidden="true">·</span>
                        <time className="text-[11px] text-neutral-500 tabular-nums">
                          {formatConfessionDate(item.createdAt)}
                        </time>
                      </div>

                      {/* Creator Moderation Controls (Reply + Delete) */}
                      {isAdmin && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenReplyEditor(item)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer whitespace-nowrap ${
                              isReplying || hasReply
                                ? 'bg-[#e7d7b9]/15 text-[#f0e2c6] hover:bg-[#e7d7b9]/25'
                                : 'bg-white/[0.06] text-neutral-300 hover:bg-white/[0.12] hover:text-white'
                            }`}
                            title={hasReply ? 'Chỉnh sửa phản hồi của Creator' : 'Trả lời confession này'}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{hasReply ? 'Sửa trả lời' : 'Trả lời'}</span>
                          </button>

                          {!isConfirmingDelete ? (
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmDeleteId(item.id);
                                setActiveReplyId(null);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-950/70 text-neutral-400 hover:text-rose-200 text-[11px] transition-colors cursor-pointer whitespace-nowrap"
                              title="Xóa confession gây nhiễu hoặc loãng"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Xóa</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 bg-rose-950/70 border border-rose-500/40 rounded-lg px-2 py-1">
                              <button
                                type="button"
                                disabled={deletingId === item.id}
                                onClick={() => handleConfirmDelete(item.id)}
                                className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap"
                              >
                                {deletingId === item.id ? 'Đang xóa...' : 'Xác nhận xóa'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="p-1 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                                aria-label="Hủy xóa"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Confession Content */}
                    <p className="text-[13.5px] sm:text-[14.5px] text-neutral-100 font-light leading-[1.7] whitespace-pre-line break-words">
                      {item.content}
                    </p>

                    {/* Public Creator Reply Display */}
                    {hasReply && !isReplying && (
                      <div className="mt-4 pt-4 border-t border-white/[0.09] space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            <CornerDownRight className="w-3.5 h-3.5 text-[#d9c39e] shrink-0" />
                            {creatorProfile?.avatarUrl && (
                              <div className="w-5 h-5 rounded-full overflow-hidden border border-white/25 shrink-0 bg-neutral-900">
                                <ImageWithFallback
                                  src={creatorProfile.avatarUrl}
                                  alt={`Creator ${creatorName}`}
                                  targetWidth={80}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <span className="font-serif font-semibold text-[#f0e2c6] tracking-wide">
                              Creator {creatorName}
                            </span>
                            <span className="text-neutral-600" aria-hidden="true">·</span>
                            <span className="text-[11px] text-neutral-400">Phản hồi</span>
                            {item.repliedAt && (
                              <>
                                <span className="text-neutral-600" aria-hidden="true">·</span>
                                <time className="text-[11px] text-neutral-500 tabular-nums">
                                  {formatConfessionDate(item.repliedAt)}
                                </time>
                              </>
                            )}
                          </div>
                        </div>
                        <p className="text-[13px] sm:text-[14px] text-[#f5efe4] leading-[1.7] whitespace-pre-line break-words pl-5">
                          {item.reply}
                        </p>
                      </div>
                    )}

                    {/* Inline Creator Reply Editor */}
                    {isAdmin && isReplying && (
                      <div className="mt-4 pt-4 border-t border-white/[0.12] space-y-3">
                        <div className="flex items-center justify-between text-xs text-neutral-300">
                          <span className="font-serif text-[#f0e2c6]">
                            Phản hồi công khai dưới tên Creator {creatorName}
                          </span>
                          <span className="text-[11px] text-neutral-500 tabular-nums">
                            {draftValue.length} / 2000
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          maxLength={2000}
                          value={draftValue}
                          onChange={(e) =>
                            setReplyDraftMap((prev) => ({
                              ...prev,
                              [item.id]: e.target.value
                            }))
                          }
                          placeholder="Nhập câu trả lời của Creator để tất cả độc giả cùng đọc..."
                          className="w-full rounded-xl bg-black/55 border border-white/20 focus:border-white/55 px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-500 outline-none resize-y leading-relaxed"
                          autoFocus
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            {hasReply && (
                              <button
                                type="button"
                                disabled={savingReplyId === item.id}
                                onClick={() => handleSaveReply(item, '')}
                                className="text-xs text-rose-300 hover:text-rose-200 underline underline-offset-4 transition-colors cursor-pointer"
                              >
                                Gỡ phản hồi này
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveReplyId(null)}
                              className="px-3.5 py-2 rounded-lg border border-white/15 text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              disabled={savingReplyId === item.id || !draftValue.trim()}
                              onClick={() => handleSaveReply(item)}
                              className="px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 disabled:opacity-50 text-[#0b0b0d] text-xs font-semibold transition-colors cursor-pointer"
                            >
                              {savingReplyId === item.id ? 'Đang lưu...' : 'Đăng phản hồi'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}

              {/* Expand / Collapse More Confessions */}
              {!standalone && filteredList.length > INITIAL_VISIBLE && (
                <button
                  type="button"
                  onClick={() => setShowAll((prev) => !prev)}
                  className="w-full py-3 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs text-neutral-200 font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      <span>Thu gọn bớt</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      <span>Xem thêm {hiddenCount} confession cũ hơn</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
