import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { WebsiteSettings, CommissionSettings } from '../types';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import {
  subscribeCommissionSettings,
  submitCommissionRequest
} from '../services/firestoreService';
import { INITIAL_COMMISSION_SETTINGS } from '../data/initialData';

interface CommissionPageProps {
  settings: WebsiteSettings;
  isAdmin: boolean;
  onOpenAdmin: () => void;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
  onReplayIntro?: () => void;
}

export function CommissionPage({
  settings,
  isAdmin,
  onOpenAdmin,
  isAudioPlaying,
  onToggleAudio,
  onReplayIntro
}: CommissionPageProps) {
  const navigate = useNavigate();

  const [commSettings, setCommSettings] = useState<CommissionSettings>(
    INITIAL_COMMISSION_SETTINGS
  );

  // Simplified Slot Booking Form State (Strictly the 3 requested fields)
  const [formData, setFormData] = useState({
    clientName: '',
    contactPlatform: 'Facebook' as 'Facebook' | 'Discord',
    contactHandle: '',
    roughBrief: '',
    isUrgent: false,
    desiredTimeline: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const unsub = subscribeCommissionSettings((data) => {
      if (data) {
        setCommSettings(data);
      }
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.clientName.trim()) {
      setErrorMessage('Vui lòng nhập tên hoặc biệt danh của bạn.');
      return;
    }

    if (!formData.contactHandle.trim()) {
      setErrorMessage(
        `Vui lòng nhập thông tin liên hệ ${formData.contactPlatform} để Táo có thể nhắn tin cho bạn.`
      );
      return;
    }

    if (!formData.roughBrief.trim()) {
      setErrorMessage('Vui lòng trình bày sơ lược một chút về idea của bạn.');
      return;
    }

    if (!formData.desiredTimeline.trim()) {
      setErrorMessage('Vui lòng cho biết thời gian bạn mong muốn Táo hoàn thành comm này.');
      return;
    }

    setIsSubmitting(true);
    try {
      const contactCombined = `[${formData.contactPlatform.toUpperCase()}] ${formData.contactHandle.trim()}`;
      await submitCommissionRequest({
        clientName: formData.clientName.trim(),
        contactPlatform: formData.contactPlatform,
        contactMethod: contactCombined,
        roughBrief: formData.roughBrief.trim(),
        desiredTimeline: formData.desiredTimeline.trim(),
        isUrgent: formData.isUrgent
      });

      setSubmitSuccess(true);
      setFormData({
        clientName: '',
        contactPlatform: 'Facebook',
        contactHandle: '',
        roughBrief: '',
        isUrgent: false,
        desiredTimeline: ''
      });
    } catch (err) {
      console.error(err);
      setErrorMessage('Có lỗi xảy ra khi gửi form đăng ký slot. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#141416] font-content flex flex-col selection:bg-[#141416] selection:text-white">
      {/* Top Global Navbar */}
      <Navbar
        settings={settings}
        onOpenAdmin={onOpenAdmin}
        isAdmin={isAdmin}
        isAudioPlaying={isAudioPlaying}
        onToggleAudio={onToggleAudio}
        siteTitle={settings.siteTitle}
        logoUrl={settings.logoUrl}
        onReplayIntro={onReplayIntro}
      />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-8 pt-8 sm:pt-14 pb-28">
        {/* SINGLE EDITORIAL SLOT BOOKING CARD */}
        <section className="bg-white rounded-[28px] sm:rounded-[36px] border border-black/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.04)] p-6 sm:p-12 relative overflow-hidden">
          {/* Top Coordinate Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-black/[0.06] text-[10px] tracking-[0.22em] uppercase text-neutral-500">
            <span>COMMISSION SLOT // TAOIUOI</span>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F4EE] border border-black/[0.06] font-medium text-[#141416]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    commSettings.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span>
                  {commSettings.statusBadgeText ||
                    (commSettings.isOpen ? 'ĐANG MỞ ĐĂNG KÝ SLOT' : 'TẠM ĐÓNG NHẬN SLOT')}
                </span>
              </span>
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin?tab=commissions')}
                  className="px-3 py-1 rounded-full bg-[#141416] text-white text-[10px] tracking-wider uppercase hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Quản lý Slot
                </button>
              )}
            </div>
          </div>

          {/* Form Header */}
          <div className="mt-7 sm:mt-9 mb-8 space-y-3">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase text-[#7F1D1D] font-semibold">
              <span>♦</span>
              <span>Creator Roleplay AI · TAOIUOI</span>
            </div>
            <h1 className="font-editorial italic text-3xl sm:text-4xl text-[#141416] tracking-tight leading-tight">
              {commSettings.announcementTitle || 'Đăng ký Slot Commission Roleplay AI'}
            </h1>
            <p className="font-serif text-xs sm:text-[14px] text-neutral-600 leading-[1.9]">
              {commSettings.announcementContent ||
                'Điền thông tin liên hệ, trình bày sơ lược về idea của bạn và thời gian mong muốn hoàn thành. Sau khi nhận được form, Táo sẽ chủ động liên hệ qua Discord hoặc Facebook để trao đổi chi tiết và báo giá phù hợp.'}
            </p>
          </div>

          {/* Success State */}
          {submitSuccess ? (
            <div className="p-8 sm:p-10 rounded-3xl bg-[#FAF9F6] border border-black/[0.08] text-center space-y-5 my-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <span className="text-[10px] tracking-[0.25em] uppercase text-emerald-700 font-semibold block">
                  ĐÃ GHI NHẬN SLOT COMMISSION
                </span>
                <h3 className="font-editorial italic text-2xl sm:text-3xl text-[#141416]">
                  Cảm ơn bạn đã gửi thông tin đặt slot!
                </h3>
                <p className="font-serif text-xs sm:text-[13px] text-neutral-600 leading-relaxed">
                  Táo đã nhận được thông tin liên hệ và idea sơ bộ của bạn. Táo sẽ sớm phản hồi qua{' '}
                  <strong>Discord / Facebook</strong> bạn đã cung cấp để trao đổi cụ thể và báo giá nhé.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSubmitSuccess(false)}
                  className="px-6 py-2.5 rounded-full bg-[#141416] text-white text-xs tracking-wider uppercase font-medium hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  Điền thêm một slot khác
                </button>
              </div>
            </div>
          ) : !commSettings.isOpen ? (
            <div className="p-8 sm:p-10 rounded-3xl bg-[#FAF9F6] border border-black/[0.08] text-center space-y-3 my-4">
              <Clock className="w-6 h-6 text-neutral-500 mx-auto" />
              <h3 className="font-editorial italic text-2xl text-[#141416]">
                Hiện tại Táo đang tạm đóng nhận slot Commission mới
              </h3>
              <p className="font-serif text-xs sm:text-[13px] text-neutral-500 max-w-md mx-auto leading-relaxed">
                Bạn vui lòng quay lại sau khi đợt slot hiện tại hoàn tất nhé!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8 pt-2">
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                  {errorMessage}
                </div>
              )}

              {/* =========================================================
                  01. THÔNG TIN LIÊN HỆ (DISCORD HOẶC FACEBOOK)
              ========================================================= */}
              <div className="p-5 sm:p-7 rounded-2xl bg-[#FAF9F6] border border-black/[0.07] space-y-5">
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                  <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#141416]">
                    01 // THÔNG TIN LIÊN HỆ CỦA BẠN
                  </span>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                    Discord hoặc Facebook
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tên / Biệt danh */}
                  <div>
                    <label className="block text-xs font-medium text-[#141416] mb-1.5">
                      Tên hoặc biệt danh của bạn <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      placeholder="VD: Minh Anh / @minhanh..."
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-black/15 text-xs sm:text-sm text-[#141416] outline-none focus:border-[#141416] transition-colors"
                    />
                  </div>

                  {/* Chọn nền tảng Discord / Facebook */}
                  <div>
                    <label className="block text-xs font-medium text-[#141416] mb-1.5">
                      Kênh liên hệ nhận báo giá <span className="text-rose-600">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {(['Facebook', 'Discord'] as const).map((platform) => {
                        const active = formData.contactPlatform === platform;
                        return (
                          <button
                            key={platform}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, contactPlatform: platform })
                            }
                            className={`py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wider uppercase border transition-all cursor-pointer ${
                              active
                                ? 'bg-[#141416] text-white border-[#141416] shadow-sm'
                                : 'bg-white text-neutral-600 border-black/15 hover:border-black/40'
                            }`}
                          >
                            {platform}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Link Facebook hoặc Username Discord */}
                <div>
                  <label className="block text-xs font-medium text-[#141416] mb-1.5">
                    {formData.contactPlatform === 'Facebook'
                      ? 'Link trang cá nhân Facebook của bạn'
                      : 'Tên người dùng (Username / ID) Discord của bạn'}{' '}
                    <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactHandle}
                    onChange={(e) => setFormData({ ...formData, contactHandle: e.target.value })}
                    placeholder={
                      formData.contactPlatform === 'Facebook'
                        ? 'VD: https://facebook.com/username...'
                        : 'VD: username_discord (nhớ mở lời mời kết bạn / tin nhắn chờ)...'
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-black/15 text-xs sm:text-sm text-[#141416] outline-none focus:border-[#141416] transition-colors"
                  />
                </div>
              </div>

              {/* =========================================================
                  02. BRIEF THÔ SƠ (IDEA CỦA BẠN)
              ========================================================= */}
              <div className="p-5 sm:p-7 rounded-2xl bg-[#FAF9F6] border border-black/[0.07] space-y-4">
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                  <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#141416]">
                    02 // BRIEF THÔ SƠ (IDEA CỦA BẠN)
                  </span>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                    Tóm tắt ý tưởng
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#141416] mb-1">
                    Trình bày một chút về idea nhân vật / kịch bản roleplay của bạn{' '}
                    <span className="text-rose-600">*</span>
                  </label>
                  <p className="text-[11px] text-neutral-500 font-serif mb-2.5 leading-relaxed">
                    Bạn chỉ cần phác thảo sơ bộ về nhân vật, mối quan hệ hoặc vibe câu chuyện bạn đang nghĩ tới. Chi tiết sâu hơn sẽ trao đổi trực tiếp cùng Táo sau khi nhận slot.
                  </p>
                  <textarea
                    rows={5}
                    required
                    value={formData.roughBrief}
                    onChange={(e) => setFormData({ ...formData, roughBrief: e.target.value })}
                    placeholder="Chia sẻ sơ lược về idea của bạn tại đây..."
                    className="w-full px-4 py-3 rounded-xl bg-white border border-black/15 text-xs sm:text-sm text-[#141416] font-serif leading-relaxed outline-none focus:border-[#141416] transition-colors"
                  />
                </div>
              </div>

              {/* =========================================================
                  03. THỜI GIAN BẠN MUỐN TÁO HOÀN THÀNH COMM NÀY
              ========================================================= */}
              <div className="p-5 sm:p-7 rounded-2xl bg-[#FAF9F6] border border-black/[0.07] space-y-5">
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                  <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#141416]">
                    03 // THỜI GIAN MONG MUỐN HOÀN THÀNH
                  </span>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                    Tiến độ &amp; Mức độ gấp
                  </span>
                </div>

                {/* Tuỳ chọn: Thong thả hay Cần gấp */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-[#141416]">
                    Bạn có cần gấp comm này không?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isUrgent: false })}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        !formData.isUrgent
                          ? 'bg-[#141416] text-white border-[#141416]'
                          : 'bg-white text-[#141416] border-black/15 hover:border-black/35'
                      }`}
                    >
                      <div className="text-xs font-semibold">Không gấp (Tiến độ thông thường)</div>
                      <div
                        className={`text-[11px] mt-0.5 font-serif ${
                          !formData.isUrgent ? 'text-neutral-300' : 'text-neutral-500'
                        }`}
                      >
                        Sắp xếp theo thứ tự slot của Táo
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isUrgent: true })}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        formData.isUrgent
                          ? 'bg-[#7F1D1D] text-white border-[#7F1D1D]'
                          : 'bg-white text-[#141416] border-black/15 hover:border-black/35'
                      }`}
                    >
                      <div className="text-xs font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Cần gấp (Ưu tiên hoàn thành sớm)</span>
                      </div>
                      <div
                        className={`text-[11px] mt-0.5 font-serif ${
                          formData.isUrgent ? 'text-rose-100' : 'text-neutral-500'
                        }`}
                      >
                        Lưu ý: Đơn cần gấp sẽ có mức báo giá khác
                      </div>
                    </button>
                  </div>
                </div>

                {/* Nhập cụ thể thời gian mong muốn */}
                <div>
                  <label className="block text-xs font-medium text-[#141416] mb-1.5">
                    Thời gian cụ thể bạn muốn Táo hoàn thành comm này?{' '}
                    <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.desiredTimeline}
                    onChange={(e) =>
                      setFormData({ ...formData, desiredTimeline: e.target.value })
                    }
                    placeholder="VD: Thong thả trong 1-2 tuần / Cần gấp trước ngày... / Càng sớm càng tốt..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-black/15 text-xs sm:text-sm text-[#141416] outline-none focus:border-[#141416] transition-colors"
                  />
                  <p className="mt-2 text-[11px] text-neutral-500 font-serif italic">
                    * Lưu ý: Tùy theo độ chi tiết của brief và việc bạn cần gấp hay không, Táo sẽ báo giá cụ thể khi nhắn tin trao đổi.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-[11px] text-neutral-500 font-serif">
                  Thông tin của bạn được gửi trực tiếp và bảo mật tới TAOIUOI.
                </span>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3.5 rounded-full bg-[#141416] hover:bg-neutral-800 disabled:opacity-50 text-white text-xs tracking-[0.16em] uppercase font-semibold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Đang gửi...' : 'Gửi Đăng Ký Slot'}</span>
                </button>
              </div>
            </form>
          )}
        </section>
      </main>

      {/* Clean Minimal Footer */}
      <Footer
        settings={settings}
        onOpenAdmin={onOpenAdmin}
        onReplayIntro={onReplayIntro}
      />
    </div>
  );
}
