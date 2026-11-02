import { useState, useEffect } from 'react';
import { Send, MessageCircleHeart, CheckCircle, Shield, Trash2, Check, RefreshCw } from 'lucide-react';
import { Confession, WebsiteSettings } from '../types';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import {
  subscribeConfessions,
  submitConfession,
  updateConfession,
  deleteConfession
} from '../services/firestoreService';

interface ConfessionsPageProps {
  settings: WebsiteSettings;
  isAdmin: boolean;
  onOpenAdmin: () => void;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
}

export function ConfessionsPage({
  settings,
  isAdmin,
  onOpenAdmin,
  isAudioPlaying,
  onToggleAudio
}: ConfessionsPageProps) {
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
      alert('Không thể gửi lời nhắn.');
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

  const displayList = isAdmin ? confessions : confessions.filter((c) => c.approved);

  return (
    <div className="min-h-screen bg-[#030304] text-[#f4f4f6] font-content flex flex-col selection:bg-white selection:text-black">
      <Navbar
        onOpenAdmin={onOpenAdmin}
        isAdmin={isAdmin}
        isAudioPlaying={isAudioPlaying}
        onToggleAudio={onToggleAudio}
        siteTitle={settings.siteTitle}
        logoUrl={settings.logoUrl}
      />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 sm:px-12 py-12 sm:py-20 space-y-16 pb-32">
        <div className="border-b border-white/[0.08] pb-8">
          <span className="text-xs font-times italic text-neutral-400 block mb-1">
            Lưu bút độc giả
          </span>
          <h1 className="font-editorial text-3xl sm:text-5xl font-light tracking-wide text-white uppercase">
            Góp ý & Tâm sự
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 font-light mt-2 max-w-lg leading-relaxed">
            Nơi gửi gắm những cảm xúc, suy tư và tình cảm tới các nhân vật trong vũ trụ BLACK APPLE.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
          
          {/* Submission Form */}
          <div className="md:col-span-5 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4">
            <div className="flex items-center gap-2 mb-2 text-xs font-serif tracking-wider uppercase text-white">
              <MessageCircleHeart className="w-4 h-4 text-neutral-400" />
              <span>Gửi lời nhắn mới</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Tên hoặc bút danh</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Ẩn danh"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Gửi tới ai? (Tùy chọn)</label>
                <input
                  type="text"
                  value={targetChar}
                  onChange={(e) => setTargetChar(e.target.value)}
                  placeholder="Ngụy Tứ Việt, Klaus Voheis..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Nội dung *</label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Viết tâm sự của bạn..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-white resize-none"
                  style={{ fontSize: '16px' }}
                />
              </div>

              {submitSuccess && (
                <p className="text-xs text-emerald-400 flex items-center gap-1.5 font-light">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Đã gửi thành công, lời nhắn sẽ hiển thị sau khi duyệt.</span>
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-full bg-white text-black hover:bg-neutral-200 text-xs font-semibold tracking-wider uppercase transition-colors"
              >
                {isSubmitting ? 'ĐANG GỬI...' : 'GỬI TÂM SỰ'}
              </button>
            </form>
          </div>

          {/* Confessions List */}
          <div className="md:col-span-7 space-y-4">
            {displayList.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-white/10 rounded-xl text-xs text-neutral-400 font-serif">
                Chưa có lời tâm sự nào. Hãy là người đầu tiên!
              </div>
            ) : (
              displayList.map((item) => (
                <div
                  key={item.id}
                  className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.01] space-y-3"
                >
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{item.sender}</span>
                      {item.characterTarget && (
                        <>
                          <span className="text-neutral-600">→</span>
                          <span className="font-editorial italic text-neutral-200">{item.characterTarget}</span>
                        </>
                      )}
                    </div>
                    <span className="text-xs font-times text-neutral-400">
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed whitespace-pre-line">
                    {item.content}
                  </p>

                  {item.reply && (
                    <div className="p-3 rounded-lg bg-white/[0.03] border-l border-white/40 text-xs text-neutral-300">
                      <span className="text-xs font-times italic text-neutral-400 block mb-1">
                        Phản hồi từ tác giả:
                      </span>
                      <p className="font-light">{item.reply}</p>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                      <button
                        onClick={() => handleApprove(item.id, item.approved)}
                        className="text-[11px] text-neutral-400 hover:text-white"
                      >
                        {item.approved ? 'Bỏ duyệt' : 'Duyệt công khai'}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-neutral-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

        </div>
      </main>

      <Footer settings={settings} onNavigate={() => {}} onOpenAdmin={onOpenAdmin} />
    </div>
  );
}
