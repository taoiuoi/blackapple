import { useState, useEffect } from 'react';
import { Send, MessageCircleHeart, CheckCircle, Shield, Trash2, Check, RefreshCw } from 'lucide-react';
import { Confession } from '../../types';
import {
  subscribeConfessions,
  submitConfession,
  updateConfession,
  deleteConfession
} from '../../services/firestoreService';

interface ConfessionSectionProps {
  isAdmin: boolean;
}

export function ConfessionSection({ isAdmin }: ConfessionSectionProps) {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [senderName, setSenderName] = useState('');
  const [targetChar, setTargetChar] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [replyInput, setReplyInput] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeConfessions((list) => {
      setConfessions(list);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setIsSubmitting(true);
      await submitConfession(senderName, content, targetChar);
      setContent('');
      setSenderName('');
      setTargetChar('');
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      setIsSubmitting(false);
      alert('Không thể gửi confession. Vui lòng thử lại sau.');
    }
  };

  const handleApprove = async (id: string, currentApproved: boolean) => {
    await updateConfession(id, { approved: !currentApproved });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Xóa lời tâm sự này?')) {
      await deleteConfession(id);
    }
  };

  const handleSaveReply = async (id: string) => {
    const text = replyInput[id];
    if (text === undefined) return;
    await updateConfession(id, { reply: text.trim() });
    setActiveReplyId(null);
  };

  // Filter: normal users see approved only, admin sees all
  const displayList = isAdmin ? confessions : confessions.filter((c) => c.approved);

  return (
    <section id="confessions" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs text-neutral-500 uppercase tracking-widest block mb-1">
          Góp ý & Tâm sự độc giả
        </span>
        <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-neutral-100">
          Góc Confession & Góp ý
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 mt-2 font-sans">
          Nơi bạn gửi gắm cảm xúc tới các nhân vật như Ngụy Tứ Việt, Klaus Voheis, hoặc đóng góp ý kiến xây dựng vũ trụ BLACK APPLE.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Submission Form */}
        <div className="lg:col-span-5 bg-[#0e0e13] border border-neutral-800/90 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-800">
            <MessageCircleHeart className="w-5 h-5 text-neutral-400" />
            <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">
              Gửi tâm sự mới
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 font-sans">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Tên hoặc biệt danh của bạn
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Để trống nếu muốn ẩn danh"
                className="w-full bg-[#14141a] border border-neutral-700/80 rounded-lg px-3.5 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-400"
                style={{ fontSize: '16px' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Gửi tới ai? (Tùy chọn)
              </label>
              <input
                type="text"
                value={targetChar}
                onChange={(e) => setTargetChar(e.target.value)}
                placeholder="Ví dụ: Ngụy Tứ Việt, Tác giả Voheis..."
                className="w-full bg-[#14141a] border border-neutral-700/80 rounded-lg px-3.5 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-400"
                style={{ fontSize: '16px' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Nội dung lời nhắn / Góp ý *
              </label>
              <textarea
                required
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Chia sẻ cảm xúc của bạn khi theo dõi câu chuyện..."
                className="w-full bg-[#14141a] border border-neutral-700/80 rounded-lg px-3.5 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-400 resize-none"
                style={{ fontSize: '16px' }}
              />
            </div>

            {submitSuccess && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Đã gửi thành công! Tâm sự của bạn sẽ được hiển thị sau khi duyệt.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-neutral-200 hover:bg-white text-neutral-900 font-semibold text-xs rounded-lg transition-colors shadow flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Đang gửi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Gửi lời tâm sự
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Confessions Feed */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-xs text-neutral-400">
            <span>Danh sách tâm sự ({displayList.length})</span>
            {isAdmin && (
              <span className="text-amber-400 text-[11px] font-medium flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Chế độ duyệt của Quản trị viên
              </span>
            )}
          </div>

          {displayList.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-neutral-800 rounded-xl bg-[#0c0c10] text-xs text-neutral-500">
              Chưa có lời tâm sự nào được duyệt. Hãy gửi lời tâm sự đầu tiên bên cạnh!
            </div>
          ) : (
            displayList.map((item) => (
              <div
                key={item.id}
                className={`p-5 bg-[#0e0e13] border rounded-xl space-y-3 transition-colors ${
                  item.approved ? 'border-neutral-800/90' : 'border-amber-900/60 bg-amber-950/10'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-200">{item.sender}</span>
                    {item.characterTarget && (
                      <>
                        <span className="text-neutral-500">gửi tới</span>
                        <span className="text-neutral-300 font-medium font-editorial">
                          {item.characterTarget}
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-500">
                    {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans whitespace-pre-line">
                  {item.content}
                </p>

                {/* Author's Reply */}
                {item.reply && (
                  <div className="p-3 bg-neutral-900/90 border-l-2 border-neutral-300 rounded-r-lg text-xs text-neutral-300">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                      Phản hồi từ Tác giả:
                    </span>
                    <p className="font-sans">{item.reply}</p>
                  </div>
                )}

                {/* Admin Controls */}
                {isAdmin && (
                  <div className="pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(item.id, item.approved)}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 ${
                          item.approved
                            ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>{item.approved ? 'Bỏ duyệt' : 'Duyệt công khai'}</span>
                      </button>

                      <button
                        onClick={() => setActiveReplyId(item.id)}
                        className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[11px]"
                      >
                        {item.reply ? 'Sửa phản hồi' : 'Viết phản hồi'}
                      </button>
                    </div>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>

                    {/* Inline reply form */}
                    {activeReplyId === item.id && (
                      <div className="w-full mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={replyInput[item.id] !== undefined ? replyInput[item.id] : item.reply || ''}
                          onChange={(e) => setReplyInput({ ...replyInput, [item.id]: e.target.value })}
                          placeholder="Nhập phản hồi từ tác giả..."
                          className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white"
                          style={{ fontSize: '16px' }}
                        />
                        <button
                          onClick={() => handleSaveReply(item.id)}
                          className="px-3 py-1.5 bg-neutral-200 text-neutral-900 rounded font-semibold text-xs"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={() => setActiveReplyId(null)}
                          className="px-2 py-1.5 text-xs text-neutral-400"
                        >
                          Hủy
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
