import { useState } from 'react';
import { Search, Filter, Eye, Heart, ArrowUpRight, Plus, Edit3, Image as ImageIcon } from 'lucide-react';
import { Character, Genre } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface CharacterShowcaseProps {
  characters: Character[];
  genres: Genre[];
  onSelectCharacter: (char: Character) => void;
  isAdmin: boolean;
  onAddCharacter: () => void;
  onEditCharacter: (char: Character) => void;
  onRequestChangeImage: (char: Character, field: 'avatarUrl' | 'coverUrl' | 'posterUrl') => void;
}

export function CharacterShowcase({
  characters,
  genres,
  onSelectCharacter,
  isAdmin,
  onAddCharacter,
  onEditCharacter,
  onRequestChangeImage
}: CharacterShowcaseProps) {
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered list
  const filtered = characters.filter((char) => {
    const matchesGenre =
      selectedGenre === 'all' || (char.genreIds && char.genreIds.includes(selectedGenre));
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      char.name.toLowerCase().includes(query) ||
      char.code.toLowerCase().includes(query) ||
      char.tagline.toLowerCase().includes(query);
    return matchesGenre && matchesSearch;
  });

  return (
    <section id="characters" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
            <span className="font-editorial italic">Hồ sơ lưu trữ</span>
            <span>·</span>
            <span>Vũ trụ sáng tác</span>
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-neutral-100">
            Hồ sơ nhân vật & Tác phẩm
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xl font-sans">
            Tuyển tập nhân vật trung tâm trong vũ trụ BLACK APPLE. Được biên soạn chi tiết kèm văn án, mỹ học thị giác và chỉ số thuộc tính.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={onAddCharacter}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-white text-neutral-900 rounded-lg text-xs font-semibold tracking-wide transition-colors self-start md:self-auto shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm nhân vật mới</span>
          </button>
        )}
      </div>

      {/* Controls: Genre Segmented Bar & Search Input */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mb-8">
        {/* Interactive Genre Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#101014] border border-neutral-800/90 rounded-xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedGenre('all')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              selectedGenre === 'all'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Tất cả ({characters.length})
          </button>
          {genres.map((g) => {
            const count = characters.filter((c) => c.genreIds && c.genreIds.includes(g.id)).length;
            return (
              <button
                key={g.id}
                onClick={() => setSelectedGenre(g.id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedGenre === g.id
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {g.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên, mã số, bối cảnh..."
            className="w-full bg-[#121217] border border-neutral-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
            style={{ fontSize: '16px' }}
          />
        </div>
      </div>

      {/* Grid of Characters */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-neutral-800 rounded-xl bg-[#0c0c10]">
          <p className="text-sm text-neutral-400 font-sans">Không tìm thấy nhân vật phù hợp với bộ lọc hiện tại.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((char) => (
            <div
              key={char.id}
              className="group relative bg-[#0e0e13] border border-neutral-800/90 hover:border-neutral-700/80 rounded-xl overflow-hidden transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-black/60"
            >
              {/* Top Media Area with Poster/Avatar */}
              <div className="relative h-64 sm:h-72 overflow-hidden bg-neutral-950">
                <ImageWithFallback
                  src={char.coverUrl || char.posterUrl || char.avatarUrl}
                  alt={char.name}
                  objectPosition={char.posterObjectPosition || '50% 30%'}
                  className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e13] via-transparent to-transparent opacity-90" />

                {/* Top Code Badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/75 backdrop-blur-md rounded border border-white/10 text-xs font-serif text-neutral-300">
                  #{char.code}
                </div>

                {/* Admin Quick Action Button on Card */}
                {isAdmin && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={() => onRequestChangeImage(char, 'coverUrl')}
                      className="p-1.5 bg-black/80 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-700 text-xs shadow"
                      title="Thay URL ảnh bìa (Direct URL)"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEditCharacter(char)}
                      className="p-1.5 bg-black/80 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-700 text-xs shadow"
                      title="Chỉnh sửa toàn bộ hồ sơ"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Avatar Circle Overlap */}
                <div className="absolute -bottom-5 left-5 w-14 h-14 rounded-full border-2 border-neutral-900 bg-neutral-900 overflow-hidden shadow-lg">
                  <ImageWithFallback
                    src={char.avatarUrl}
                    alt={char.name}
                    objectPosition="center"
                    className="w-full h-full"
                  />
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 pt-8 flex-1 flex flex-col justify-between">
                <div>
                  {/* Unboxed Metadata as per frontend-design */}
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500 mb-1.5">
                    <span>{char.profileData.role || 'Nhân vật'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{char.profileData.status || 'Hoạt động'}</span>
                  </div>

                  {/* Character Name in Editorial Font */}
                  <h3 className="font-editorial text-xl font-bold text-neutral-100 group-hover:text-white transition-colors">
                    {char.name}
                  </h3>

                  {/* Tagline */}
                  <p className="text-xs text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {char.tagline}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {char.views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" /> {char.likes || 0}
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectCharacter(char)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300 hover:text-white group-hover:translate-x-0.5 transition-all"
                  >
                    <span>Khám phá</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
