import { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  ListMusic,
  ChevronDown,
  ChevronUp,
  Music,
  Loader2
} from 'lucide-react';
import { MusicTrack } from '../../types';
import {
  extractYouTubeId,
  resolvePlayableAudioUrl
} from '../../services/firestoreService';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface AudioPlayerBarProps {
  tracks: MusicTrack[];
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTrackIndex: number;
  onSelectTrackIndex: (index: number) => void;
}

// Exact 15 official tracks (00:00 -> end) of https://youtu.be/pZEMAZyeFiE ("Instantly Hooked, Insanely Good Vibe - afteraw")
// Uses the official afteraw - Topic releases which have external website embedding enabled (200 OK)
const AFTERAW_PZE_TRACK_IDS: string[] = [
  '_Ij7V7EhgD0', // 00:00 - Paint and Glue
  '3hBPhNTErIA', // 02:58 - Gold Along the Border
  'A2M_FGbVeLI', // 06:15 - Twenty Square Feet
  'T0HWBoG8N9A', // 09:36 - Copper World
  'FPhbjhUqxrM', // 11:52 - Grey and Iron
  'VNbh7sQVAQU', // 15:04 - Straight to the Workbench
  'aIdIhPHG-MA', // 18:02 - Ten Past Nine
  'ASKc5tk09Nw', // 21:08 - Quiet Universe
  'uJWCyqg7q4g', // 24:19 - Building My Own Town
  'IuSPx8UOLSo', // 27:24 - Small Worlds After Nine
  '-CC1wrBqbUY', // 30:51 - Brushlight in the Rain
  '2mhaf156PEE', // 33:42 - This Room Is Mine
  'AfiI9IrrldI', // 36:54 - Primer Grey at Midnight
  'pWyxKBRV2ao', // 39:48 - Rivets After Work
  'HHGHMXNRTq4'  // 42:03 - After the Shutters Close
];

export function AudioPlayerBar({
  tracks,
  isPlaying,
  onTogglePlay,
  currentTrackIndex,
  onSelectTrackIndex
}: AudioPlayerBarProps) {
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [resolvedMp3Url, setResolvedMp3Url] = useState<string>('');
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [ytReady, setYtReady] = useState<boolean>(false);
  const [subTrackIndex, setSubTrackIndex] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytPlayerReadyRef = useRef<boolean>(false);
  const ytInitializingRef = useRef<boolean>(false);
  const loadedVideoIdRef = useRef<string | null>(null);
  const ytContainerId = 'ba-youtube-audio-engine';

  const currentTrack = tracks[currentTrackIndex] || tracks[0];
  const rawYoutubeId = currentTrack ? extractYouTubeId(currentTrack.audioUrl) : null;

  // Reset subTrackIndex when switching main tracks
  useEffect(() => {
    setSubTrackIndex(0);
  }, [currentTrackIndex, rawYoutubeId]);

  const effectiveYoutubeId =
    rawYoutubeId === 'pZEMAZyeFiE'
      ? AFTERAW_PZE_TRACK_IDS[subTrackIndex] || AFTERAW_PZE_TRACK_IDS[0]
      : rawYoutubeId;
  const isYouTubeTrack = Boolean(effectiveYoutubeId);

  // Refs to avoid stale closures inside YT.Player callbacks & global gesture listeners
  const isPlayingRef = useRef<boolean>(isPlaying);
  const isMutedRef = useRef<boolean>(isMuted);
  const isYouTubeTrackRef = useRef<boolean>(isYouTubeTrack);
  const desiredVideoIdRef = useRef<string | null>(effectiveYoutubeId);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isYouTubeTrackRef.current = isYouTubeTrack;
    desiredVideoIdRef.current = effectiveYoutubeId;
  }, [isYouTubeTrack, effectiveYoutubeId]);

  const handleNext = () => {
    if (tracks.length === 0) return;
    setProgress(0);
    const nextIdx = (currentTrackIndex + 1) % tracks.length;
    onSelectTrackIndex(nextIdx);
  };

  const handlePrev = () => {
    if (tracks.length === 0) return;
    setProgress(0);
    const prevIdx = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    onSelectTrackIndex(prevIdx);
  };

  const handleTrackEnded = () => {
    if (rawYoutubeId === 'pZEMAZyeFiE') {
      if (subTrackIndex < AFTERAW_PZE_TRACK_IDS.length - 1) {
        setSubTrackIndex((prev) => prev + 1);
      } else {
        // Repeat the 1-hour playlist from 00:00 ("Paint and Glue") as indicated in video description ("🔁Repeat")
        setSubTrackIndex(0);
      }
      return;
    }
    handleNext();
  };

  const handleNextRef = useRef(handleTrackEnded);
  useEffect(() => {
    handleNextRef.current = handleTrackEnded;
  });

  // 1. Load YouTube IFrame API script once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.YT && window.YT.Player) {
      setYtReady(true);
      return;
    }

    const existingScript = document.getElementById('youtube-iframe-api-script');
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevCallback) prevCallback();
      setYtReady(true);
    };

    if (!existingScript) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.body.appendChild(tag);
    }

    // Fallback poll in case onYouTubeIframeAPIReady already fired
    const poll = window.setInterval(() => {
      if (window.YT && window.YT.Player) {
        setYtReady(true);
        window.clearInterval(poll);
      }
    }, 250);
    return () => window.clearInterval(poll);
  }, []);

  // 2. Global Auto-Play Gesture Unlock (Starts music on first click/touch/key if browser blocked initial unmuted autoplay)
  useEffect(() => {
    const unlockAudioOnGesture = () => {
      if (!isPlayingRef.current) return;

      if (isYouTubeTrackRef.current) {
        if (ytPlayerReadyRef.current && ytPlayerRef.current) {
          try {
            const state =
              typeof ytPlayerRef.current.getPlayerState === 'function'
                ? ytPlayerRef.current.getPlayerState()
                : -1;
            if (!isMutedRef.current && typeof ytPlayerRef.current.unMute === 'function') {
              ytPlayerRef.current.unMute();
              ytPlayerRef.current.setVolume(100);
            }
            if (state !== 1) {
              ytPlayerRef.current.playVideo();
            }
          } catch (_) {}
        }
      } else if (audioRef.current && audioRef.current.paused && audioRef.current.src) {
        audioRef.current.play().catch(() => {});
      }
    };

    window.addEventListener('click', unlockAudioOnGesture, { passive: true });
    window.addEventListener('pointerdown', unlockAudioOnGesture, { passive: true });
    window.addEventListener('touchstart', unlockAudioOnGesture, { passive: true });
    window.addEventListener('keydown', unlockAudioOnGesture, { passive: true });

    return () => {
      window.removeEventListener('click', unlockAudioOnGesture);
      window.removeEventListener('pointerdown', unlockAudioOnGesture);
      window.removeEventListener('touchstart', unlockAudioOnGesture);
      window.removeEventListener('keydown', unlockAudioOnGesture);
    };
  }, []);

  // 3. Resolve direct MP3 or Firestore-chunked MP3 URL when currentTrack is NOT YouTube
  useEffect(() => {
    let active = true;
    if (!currentTrack || isYouTubeTrack) {
      setResolvedMp3Url('');
      setIsLoadingAudio(false);
      return;
    }

    setIsLoadingAudio(true);
    resolvePlayableAudioUrl(currentTrack)
      .then((url) => {
        if (!active) return;
        setResolvedMp3Url(url);
        setIsLoadingAudio(false);
      })
      .catch(() => {
        if (!active) return;
        setResolvedMp3Url(currentTrack.audioUrl);
        setIsLoadingAudio(false);
      });

    return () => {
      active = false;
    };
  }, [currentTrack?.id, currentTrack?.audioUrl, isYouTubeTrack]);

  // 4. Initialize or update YouTube Player when playing a YouTube track
  useEffect(() => {
    if (!ytReady) return;

    if (!isYouTubeTrack || !effectiveYoutubeId) {
      if (ytPlayerReadyRef.current && ytPlayerRef.current) {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch (_) {}
      }
      return;
    }

    // If player is already ready, load or cue the new videoId cleanly
    if (ytPlayerReadyRef.current && ytPlayerRef.current) {
      try {
        if (loadedVideoIdRef.current !== effectiveYoutubeId) {
          loadedVideoIdRef.current = effectiveYoutubeId;
          if (isPlayingRef.current) {
            ytPlayerRef.current.loadVideoById(effectiveYoutubeId);
            ytPlayerRef.current.playVideo();
          } else {
            ytPlayerRef.current.cueVideoById(effectiveYoutubeId);
          }
        } else if (isPlayingRef.current) {
          ytPlayerRef.current.playVideo();
        }
      } catch (_) {}
      return;
    }

    // Prevent duplicate instantiation while YT.Player is still mounting its iframe
    if (ytInitializingRef.current) return;
    ytInitializingRef.current = true;
    loadedVideoIdRef.current = effectiveYoutubeId;

    try {
      ytPlayerRef.current = new window.YT.Player(ytContainerId, {
        height: '113',
        width: '200',
        videoId: effectiveYoutubeId,
        playerVars: {
          autoplay: isPlayingRef.current ? 1 : 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0
        },
        events: {
          onReady: (event: any) => {
            ytPlayerReadyRef.current = true;
            try {
              if (isMutedRef.current) {
                event.target.mute();
              } else {
                event.target.unMute();
                event.target.setVolume(100);
              }

              const targetVid = desiredVideoIdRef.current;
              if (targetVid && targetVid !== loadedVideoIdRef.current) {
                loadedVideoIdRef.current = targetVid;
                if (isPlayingRef.current) {
                  event.target.loadVideoById(targetVid);
                } else {
                  event.target.cueVideoById(targetVid);
                }
              }

              if (isPlayingRef.current) {
                event.target.playVideo();
              }
            } catch (_) {}
          },
          onStateChange: (event: any) => {
            // YT.PlayerState.ENDED === 0
            if (event.data === 0) {
              handleNextRef.current();
            }
          },
          onError: (event: any) => {
            const errCode = event?.data;
            if (errCode === 100 || errCode === 101 || errCode === 150) {
              const fallbackId = AFTERAW_PZE_TRACK_IDS[0];
              if (loadedVideoIdRef.current !== fallbackId) {
                loadedVideoIdRef.current = fallbackId;
                try {
                  event.target.loadVideoById(fallbackId);
                  if (isPlayingRef.current) {
                    event.target.playVideo();
                  }
                } catch (_) {}
              }
            }
          }
        }
      });
    } catch (err) {
      ytInitializingRef.current = false;
      console.warn('Không thể khởi tạo trình phát YouTube:', err);
    }
  }, [ytReady, effectiveYoutubeId, isYouTubeTrack]);

  // 5. Sync Play/Pause state for both HTML5 Audio and YouTube Player
  useEffect(() => {
    if (isYouTubeTrack) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (ytPlayerReadyRef.current && ytPlayerRef.current) {
        try {
          if (isPlaying) {
            ytPlayerRef.current.playVideo();
          } else {
            ytPlayerRef.current.pauseVideo();
          }
        } catch (_) {}
      }
    } else {
      if (ytPlayerReadyRef.current && ytPlayerRef.current) {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch (_) {}
      }
      if (!audioRef.current || !resolvedMp3Url) return;
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex, isYouTubeTrack, resolvedMp3Url]);

  // 6. Progress polling for YouTube tracks
  useEffect(() => {
    if (!isYouTubeTrack || !isPlaying) return;
    const interval = window.setInterval(() => {
      if (
        ytPlayerReadyRef.current &&
        ytPlayerRef.current &&
        typeof ytPlayerRef.current.getCurrentTime === 'function' &&
        typeof ytPlayerRef.current.getDuration === 'function'
      ) {
        try {
          const cur = ytPlayerRef.current.getCurrentTime();
          const dur = ytPlayerRef.current.getDuration();
          if (dur > 0) {
            setProgress((cur / dur) * 100);
          }
        } catch (_) {}
      }
    }, 600);
    return () => window.clearInterval(interval);
  }, [isYouTubeTrack, isPlaying, effectiveYoutubeId]);

  const handleTimeUpdate = () => {
    if (!isYouTubeTrack && audioRef.current && audioRef.current.duration) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
    if (ytPlayerReadyRef.current && ytPlayerRef.current) {
      try {
        if (nextMuted) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(100);
        }
      } catch (_) {}
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));

    if (isYouTubeTrack) {
      if (
        ytPlayerReadyRef.current &&
        ytPlayerRef.current &&
        typeof ytPlayerRef.current.getDuration === 'function' &&
        typeof ytPlayerRef.current.seekTo === 'function'
      ) {
        try {
          const dur = ytPlayerRef.current.getDuration();
          if (dur > 0) {
            ytPlayerRef.current.seekTo(ratio * dur, true);
            setProgress(ratio * 100);
          }
        } catch (_) {}
      }
    } else if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = ratio * audioRef.current.duration;
      setProgress(ratio * 100);
    }
  };

  if (!currentTrack) return null;

  return (
    <>
      {/* Persistent HTML5 Audio Element for Direct MP3 / Uploaded MP3 Chunks */}
      <audio
        ref={audioRef}
        src={resolvedMp3Url || undefined}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
        autoPlay={isPlaying && !isYouTubeTrack}
        preload="auto"
      />

      {/* Persistent 200x113 In-Viewport YouTube Audio Mount (Meets YT minimum viewport check without visual intrusion) */}
      <div
        className="fixed bottom-0 right-0 w-[200px] h-[113px] opacity-[0.01] pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div id={ytContainerId} />
      </div>

      {isMinimized ? (
        <div className="fixed bottom-3 right-3 z-40">
          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/90 border border-white/20 text-neutral-300 hover:text-white shadow-xl backdrop-blur-md text-[11px] font-serif transition-all cursor-pointer"
            title="Mở rộng thanh nhạc"
          >
            <Music
              className={`w-3.5 h-3.5 ${
                isPlaying ? 'animate-pulse text-white' : 'text-neutral-500'
              }`}
            />
            <span className="max-w-[140px] truncate">{currentTrack.title}</span>
            <ChevronUp className="w-3 h-3 text-neutral-400" />
          </button>
        </div>
      ) : (
        <>
          {/* Upward Compact Playlist Popup */}
          {isPlaylistOpen && (
            <div className="fixed bottom-12 right-2 sm:right-6 z-40 w-72 sm:w-80 max-h-64 bg-[#0a0a0e]/95 backdrop-blur-xl border border-white/[0.1] rounded-xl shadow-2xl p-2.5 overflow-y-auto animate-fadeIn text-neutral-300 font-serif">
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/[0.06] mb-1.5 text-[11px] text-neutral-400">
                <span>Danh sách phát ({tracks.length})</span>
                <button
                  onClick={() => setIsPlaylistOpen(false)}
                  className="text-neutral-500 hover:text-white text-xs cursor-pointer"
                >
                  Đóng
                </button>
              </div>
              <div className="space-y-0.5">
                {tracks.map((t, idx) => {
                  const isYt = Boolean(extractYouTubeId(t.audioUrl));
                  const isUploadedFile =
                    t.audioUrl?.startsWith('firestore-chunked://') || Boolean(t.chunkCount);
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        onSelectTrackIndex(idx);
                        if (!isPlaying) onTogglePlay();
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        idx === currentTrackIndex
                          ? 'bg-white/10 text-white font-medium'
                          : 'hover:bg-white/[0.04] text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <span className="block truncate">{t.title}</span>
                        <span className="text-[10px] text-neutral-500 block truncate">
                          {t.artist} · {isYt ? 'YouTube Audio' : isUploadedFile ? 'File MP3' : 'MP3 Stream'}
                        </span>
                      </div>
                      {idx === currentTrackIndex && isPlaying && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Slim, Low-Profile Bottom Docked Player */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#050507]/95 backdrop-blur-md border-t border-white/[0.08] text-neutral-300 select-none">
            {/* Hairline Interactive Progress Bar at top edge */}
            <div
              onClick={handleSeek}
              className="absolute top-0 left-0 right-0 h-[3px] bg-white/[0.08] hover:h-[5px] cursor-pointer transition-all group"
              title="Tua nhạc"
            >
              <div
                className="h-full bg-neutral-200 group-hover:bg-white transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="max-w-6xl mx-auto px-3 sm:px-6 h-10 sm:h-11 flex items-center justify-between gap-3 text-xs">
              {/* Left: Track Information */}
              <div className="min-w-0 flex items-center gap-2 sm:gap-3 flex-1">
                <div className="w-6 h-6 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center shrink-0">
                  {isLoadingAudio ? (
                    <Loader2 className="w-3 h-3 text-neutral-300 animate-spin" />
                  ) : (
                    <Music
                      className={`w-3 h-3 ${
                        isPlaying ? 'text-neutral-200 animate-pulse' : 'text-neutral-500'
                      }`}
                    />
                  )}
                </div>
                <div className="min-w-0 truncate font-serif">
                  <span className="text-white text-[11px] sm:text-xs font-normal tracking-wide truncate inline">
                    {currentTrack.title}
                  </span>
                  <span className="text-neutral-500 text-[10px] sm:text-[11px] ml-2 hidden sm:inline">
                    — {currentTrack.artist}
                  </span>
                </div>
              </div>

              {/* Center/Right: Compact Controls */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  onClick={handlePrev}
                  className="p-1 text-neutral-400 hover:text-white rounded transition-colors cursor-pointer"
                  aria-label="Bài trước"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={onTogglePlay}
                  className="p-1.5 bg-white text-neutral-900 rounded-full hover:bg-neutral-200 transition-transform active:scale-95 shadow-sm cursor-pointer"
                  aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
                >
                  {isPlaying ? (
                    <Pause className="w-3 h-3 fill-neutral-900" />
                  ) : (
                    <Play className="w-3 h-3 fill-neutral-900 ml-0.5" />
                  )}
                </button>

                <button
                  onClick={handleNext}
                  className="p-1 text-neutral-400 hover:text-white rounded transition-colors cursor-pointer"
                  aria-label="Bài tiếp"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>

                <div className="w-[1px] h-3 bg-white/[0.1] mx-1 hidden sm:block" />

                <button
                  onClick={toggleMute}
                  className="p-1 text-neutral-400 hover:text-white rounded transition-colors hidden sm:block cursor-pointer"
                  aria-label={isMuted ? 'Bật âm' : 'Tắt tiếng'}
                >
                  {isMuted ? (
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  onClick={() => setIsPlaylistOpen(!isPlaylistOpen)}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    isPlaylistOpen
                      ? 'text-white bg-white/10'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  aria-label="Danh sách phát"
                >
                  <ListMusic className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 text-neutral-500 hover:text-neutral-300 rounded transition-colors cursor-pointer"
                  title="Thu nhỏ thanh nhạc"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
