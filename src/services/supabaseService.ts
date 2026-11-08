import { supabase } from '../lib/supabase';
import { Comment, Character, Genre, UpcomingSubscriber } from '../types';
import { INITIAL_CHARACTERS, INITIAL_GENRES } from '../data/initialData';

// Cache helpers for instant 0ms offline delivery
function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (_) {}
}

// ---------------- COMMENTS (LƯU BÚT ĐỘC GIẢ) ----------------

export async function getCommentsForCharacter(characterId: string): Promise<Comment[]> {
  const cacheKey = `ba_sb_comments_${characterId}`;
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('character_id', characterId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] Could not fetch comments, using cache:', error.message);
      return getCache<Comment[]>(cacheKey) || [];
    }

    const comments: Comment[] = (data || []).map((row) => ({
      id: row.id,
      characterId: row.character_id,
      authorName: row.author_name,
      content: row.content,
      createdAt: row.created_at,
      likes: Number(row.likes || 0)
    }));

    setCache(cacheKey, comments);
    return comments;
  } catch (err) {
    console.warn('[Supabase] Network/fetch error for comments:', err);
    return getCache<Comment[]>(cacheKey) || [];
  }
}

export function subscribeCommentsSupabase(
  characterId: string,
  callback: (comments: Comment[]) => void
) {
  const cacheKey = `ba_sb_comments_${characterId}`;
  const initialCache = getCache<Comment[]>(cacheKey) || [];
  callback(initialCache);

  // Fetch latest comments from Supabase
  getCommentsForCharacter(characterId).then((latest) => {
    if (latest && latest.length > 0) {
      callback(latest);
    }
  });

  // Subscribe to real-time additions on the comments table
  const channel = supabase
    .channel(`comments-realtime-${characterId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `character_id=eq.${characterId}`
      },
      () => {
        getCommentsForCharacter(characterId).then(callback);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function submitCommentSupabase(
  characterId: string,
  authorName: string,
  content: string
): Promise<void> {
  const newComment: Comment = {
    id: `comm-${Date.now()}`,
    characterId,
    authorName: authorName.trim() || 'Người đọc vô danh',
    content: content.trim(),
    createdAt: new Date().toISOString(),
    likes: 0
  };

  // Optimistic UI update
  const cacheKey = `ba_sb_comments_${characterId}`;
  const cached = getCache<Comment[]>(cacheKey) || [];
  setCache(cacheKey, [newComment, ...cached]);

  try {
    const { error } = await supabase.from('comments').insert({
      id: newComment.id,
      character_id: characterId,
      author_name: newComment.authorName,
      content: newComment.content,
      likes: 0,
      created_at: newComment.createdAt
    });

    if (error) {
      console.warn('[Supabase] Error inserting comment to remote database:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase] Exception during comment submission:', err);
  }
}

// ---------------- CHARACTER STATS (LƯỢT XEM VÀ LƯỢT NHẤP LINK) ----------------

export async function fetchCharacterStatsSupabase(): Promise<Record<string, { views: number; roleplayClicks: number }>> {
  try {
    const { data, error } = await supabase.from('character_stats').select('id, views, roleplay_clicks');
    if (error || !data) {
      return {};
    }
    const result: Record<string, { views: number; roleplayClicks: number }> = {};
    data.forEach((row) => {
      result[row.id] = {
        views: Number(row.views || 0),
        roleplayClicks: Number(row.roleplay_clicks || 0)
      };
    });
    return result;
  } catch (_) {
    return {};
  }
}

export async function incrementCharacterViewsSupabase(characterId: string): Promise<void> {
  try {
    // 1. Try atomic PostgreSQL RPC first
    const { error: rpcError } = await supabase.rpc('increment_views', { char_id: characterId });
    if (!rpcError) return;

    // 2. Graceful fallback if RPC has not been created yet
    const { data } = await supabase
      .from('character_stats')
      .select('views')
      .eq('id', characterId)
      .maybeSingle();

    if (data) {
      await supabase
        .from('character_stats')
        .update({
          views: (Number(data.views) || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', characterId);
    } else {
      await supabase.from('character_stats').insert({
        id: characterId,
        name: characterId,
        views: 1,
        roleplay_clicks: 0
      });
    }
  } catch (err) {
    console.warn('[Supabase] Could not increment character views:', err);
  }
}

export async function incrementRoleplayClicksSupabase(characterId: string): Promise<void> {
  try {
    // 1. Try atomic PostgreSQL RPC first
    const { error: rpcError } = await supabase.rpc('increment_roleplay_clicks', { char_id: characterId });
    if (!rpcError) return;

    // 2. Graceful fallback if RPC has not been created yet
    const { data } = await supabase
      .from('character_stats')
      .select('roleplay_clicks')
      .eq('id', characterId)
      .maybeSingle();

    if (data) {
      await supabase
        .from('character_stats')
        .update({
          roleplay_clicks: (Number(data.roleplay_clicks) || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', characterId);
    } else {
      await supabase.from('character_stats').insert({
        id: characterId,
        name: characterId,
        views: 0,
        roleplay_clicks: 1
      });
    }
  } catch (err) {
    console.warn('[Supabase] Could not increment roleplay clicks:', err);
  }
}

// ---------------- GENRES (THỂ LOẠI) ----------------

export async function fetchGenresSupabase(): Promise<Genre[]> {
  try {
    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .order('order', { ascending: true });

    if (error || !data || data.length === 0) {
      return INITIAL_GENRES;
    }

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      order: row.order ?? 99
    }));
  } catch (_) {
    return INITIAL_GENRES;
  }
}

// ---------------- UPCOMING CHARACTER SUBSCRIBERS (DANH SÁCH CHỜ VIP) ----------------

export async function submitUpcomingSubscriptionSupabase(
  characterId: string,
  characterName: string,
  email: string,
  readerName?: string,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Email không hợp lệ' };
  }

  const subId = `sub-${Date.now()}`;
  const now = new Date().toISOString();

  // Cache locally
  const cacheKey = `ba_upcoming_subs_${characterId}`;
  const localList = getCache<UpcomingSubscriber[]>(cacheKey) || [];
  const newSub: UpcomingSubscriber = {
    id: subId,
    characterId,
    characterName,
    email: cleanEmail,
    readerName: readerName?.trim() || 'Độc giả yêu mến',
    note: note?.trim() || '',
    createdAt: now
  };
  setCache(cacheKey, [newSub, ...localList]);

  try {
    const { error } = await supabase.from('upcoming_subscribers').insert({
      id: subId,
      character_id: characterId,
      character_name: characterName,
      email: cleanEmail,
      reader_name: newSub.readerName,
      note: newSub.note,
      created_at: now
    });

    if (error) {
      console.warn('[Supabase] Warning inserting subscriber:', error.message);
    }
    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase] Exception inserting subscriber:', err);
    return { success: true }; // Local cache saved
  }
}

export async function fetchUpcomingSubscribersSupabase(): Promise<UpcomingSubscriber[]> {
  try {
    const { data, error } = await supabase
      .from('upcoming_subscribers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      characterId: row.character_id,
      characterName: row.character_name,
      email: row.email,
      readerName: row.reader_name,
      note: row.note,
      createdAt: row.created_at
    }));
  } catch (_) {
    return [];
  }
}

// ---------------- UPCOMING CHEERS SYNC (SUPABASE) ----------------
export async function syncUpcomingCheerSupabase(characterId: string = 'nguu-thanh-anh'): Promise<void> {
  try {
    // 1. Log cheer event to upcoming_subscribers with note
    await supabase.from('upcoming_subscribers').insert({
      id: `cheer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      character_id: characterId,
      character_name: 'Ngưu Thánh Anh',
      email: 'reader@cheer.local',
      reader_name: 'Độc giả ngóng chờ',
      note: '✦ Tín hiệu ngóng chờ nhân vật khởi chiếu',
      created_at: new Date().toISOString()
    });

    // 2. Increment stats record
    const { data } = await supabase
      .from('character_stats')
      .select('id, views, roleplay_clicks')
      .eq('id', characterId)
      .maybeSingle();

    if (!data) {
      await supabase.from('character_stats').insert({
        id: characterId,
        name: 'Ngưu Thánh Anh',
        views: 1,
        roleplay_clicks: 0
      });
    }
  } catch (err) {
    console.warn('[Supabase] Could not sync cheer record:', err);
  }
}

