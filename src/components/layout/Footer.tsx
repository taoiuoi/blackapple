import { WebsiteSettings } from '../../types';

interface FooterProps {
  settings: WebsiteSettings;
  onNavigate?: (sectionId: string) => void;
  onOpenAdmin?: () => void;
  onReplayIntro?: () => void;
}

export function Footer({ settings }: FooterProps) {
  return (
    <footer className="w-full bg-[#030304] border-t border-white/[0.06] text-neutral-400 pt-16 pb-28 sm:pt-20 sm:pb-32 px-6 sm:px-12 font-sans select-none relative">
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* 1. Brand Monogram & Title */}
        <div className="space-y-2.5">
          <div className="inline-flex items-center justify-center text-neutral-500 mb-1">
            <span className="text-[10px] tracking-[0.3em] uppercase font-mono text-neutral-500">✦ ARCHIVE ✦</span>
          </div>

          <h3 className="font-editorial text-lg sm:text-xl font-medium tracking-[0.35em] text-neutral-100 uppercase">
            {settings.siteTitle || 'BLACK APPLE'}
          </h3>

          <p className="font-serif italic text-xs sm:text-sm text-neutral-500 tracking-wider">
            Hồ sơ tác phẩm &amp; Vũ trụ sáng tác
          </p>
        </div>

        {/* Delicate Hairline Divider with Breathing Room */}
        <div className="w-16 h-[1px] bg-white/10 my-8 sm:my-10" />

        {/* 2. Chỗ ghi cre (Credit & Copyright) - Thoáng đãng, thanh thoát */}
        <div className="max-w-xl mx-auto px-4">
          <p className="text-neutral-400 text-xs sm:text-[13px] leading-relaxed font-light tracking-wide">
            {settings.footerText || '© 2026 BLACK APPLE. Mọi quyền tác phẩm và hồ sơ nhân vật được bảo lưu bởi TAOIUOI.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
