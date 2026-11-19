import { Character, CreatorProfile, WebsiteSettings } from '../types';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { HomeConfessionSection } from '../components/home/HomeConfessionSection';
import noirWaveBgUrl from '../assets/images/noir-wave-bg.webp';
import { resolveDirectImageUrl } from '../utils/imageOptimizer';

interface ConfessionsPageProps {
  characters?: Character[];
  creatorProfile?: CreatorProfile;
  settings: WebsiteSettings;
  isAdmin: boolean;
  onOpenAdmin: () => void;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
  onReplayIntro?: () => void;
}

export function ConfessionsPage({
  characters = [],
  creatorProfile,
  settings,
  isAdmin,
  onOpenAdmin,
  isAudioPlaying,
  onToggleAudio,
  onReplayIntro
}: ConfessionsPageProps) {
  return (
    <div className="min-h-screen bg-[#020203] text-[#f4f4f6] font-content flex flex-col selection:bg-white selection:text-black relative overflow-x-hidden">
      {/* Matching Noir Wave Backdrop */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transform-gpu">
        <img
          src={noirWaveBgUrl}
          alt="Noir Wave Atmosphere Background"
          decoding="async"
          onError={(e) => {
            const target = e.currentTarget;
            const fallback = resolveDirectImageUrl('/assets/noir-wave-bg.jpg');
            if (target.src !== fallback) {
              target.src = fallback;
            }
          }}
          className="w-full h-full object-cover object-center opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020203]/85 via-black/55 to-[#020203]/95" />
      </div>

      <div className="relative z-10">
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
      </div>

      <main className="relative z-10 flex-1 pb-20">
        <HomeConfessionSection
          characters={characters}
          creatorProfile={creatorProfile}
          isAdmin={isAdmin}
          standalone={true}
        />
      </main>

      <div className="relative z-10">
        <Footer
          settings={settings}
          onNavigate={() => {}}
          onOpenAdmin={onOpenAdmin}
          onReplayIntro={onReplayIntro}
        />
      </div>
    </div>
  );
}
