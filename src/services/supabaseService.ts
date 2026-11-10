import { supabase } from '../lib/supabase';
import {
  Comment,
  Character,
  Genre,
  UpcomingSubscriber,
  CommissionRequest,
  CommissionSettings,
  CommissionStatus
} from '../types';
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

function getDeletedCommentIds(): Set<string> {
  try {
    const list = getCache<string[]>('ba_deleted_comment_ids') || [];
    return new Set(list);
  } catch (_) {
    return new Set();
  }
}

function markCommentDeletedLocal(commentId: string, characterId?: string): void {
  try {
    const deletedSet = getDeletedCommentIds();
    deletedSet.add(commentId);
    setCache('ba_deleted_comment_ids', Array.from(deletedSet));

    if (characterId) {
      const sbKey = `ba_sb_comments_${characterId}`;
      const sbCached = getCache<Comment[]>(sbKey);
      if (sbCached) {
        setCache(
          sbKey,
          sbCached.filter((c) => c.id !== commentId)
        );
      }
      const fsKey = `ba_cache_comments_${characterId}`;
      const fsCached = getCache<Comment[]>(fsKey);
      if (fsCached) {
        setCache(
          fsKey,
          fsCached.filter((c) => c.id !== commentId)
        );
      }
    }

    // Also scan all comment caches in localStorage in case characterId wasn't passed
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('ba_sb_comments_') || k.startsWith('ba_cache_comments_'))) {
        const list = getCache<Comment[]>(k);
        if (Array.isArray(list) && list.some((c) => c.id === commentId)) {
          setCache(
            k,
            list.filter((c) => c.id !== commentId)
          );
        }
      }
    }
  } catch (_) {}
}

// ---------------- COMMENTS (LƯU BÚT ĐỘC GIẢ) ----------------

export async function getCommentsForCharacter(characterId: string): Promise<Comment[]> {
  const cacheKey = `ba_sb_comments_${characterId}`;
  const deletedSet = getDeletedCommentIds();
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('character_id', characterId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] Could not fetch comments, using cache:', error.message);
      return (getCache<Comment[]>(cacheKey) || []).filter((c) => !deletedSet.has(c.id));
    }

    const comments: Comment[] = (data || [])
      .filter((row) => !deletedSet.has(row.id))
      .map((row) => ({
        id: row.id,
        characterId: row.character_id,
        authorName: row.author_name,
        content: row.content,
        createdAt: row.created_at,
        likes: Number(row.likes || 0),
        adminReply: row.admin_reply || undefined
      }));

    // Fetch any admin replies stored in character_stats commreply_*
    try {
      const { data: replyRows } = await supabase
        .from('character_stats')
        .select('id, name')
        .like('id', 'commreply_%');

      if (replyRows && replyRows.length > 0) {
        const replyMap = new Map<string, string>();
        replyRows.forEach((r) => {
          const cId = r.id.replace(/^commreply_/, '');
          if (r.name) replyMap.set(cId, r.name);
        });

        comments.forEach((c) => {
          if (!c.adminReply && replyMap.has(c.id)) {
            c.adminReply = replyMap.get(c.id);
          }
        });
      }
    } catch (_) {}

    setCache(cacheKey, comments);
    return comments;
  } catch (err) {
    console.warn('[Supabase] Network/fetch error for comments:', err);
    return (getCache<Comment[]>(cacheKey) || []).filter((c) => !deletedSet.has(c.id));
  }
}

export function subscribeCommentsSupabase(
  characterId: string,
  callback: (comments: Comment[]) => void
) {
  const cacheKey = `ba_sb_comments_${characterId}`;
  const deletedSet = getDeletedCommentIds();
  const initialCache = (getCache<Comment[]>(cacheKey) || []).filter((c) => !deletedSet.has(c.id));
  callback(initialCache);

  // Fetch latest comments from Supabase
  getCommentsForCharacter(characterId).then((latest) => {
    if (latest) {
      callback(latest);
    }
  });

  // Subscribe to real-time additions/deletions on the comments table
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
  content: string,
  customId?: string
): Promise<Comment> {
  const newComment: Comment = {
    id: customId || `comm-${Date.now()}`,
    characterId,
    authorName: authorName.trim() || 'Người đọc vô danh',
    content: content.trim(),
    createdAt: new Date().toISOString(),
    likes: 0
  };

  // Optimistic UI update
  const cacheKey = `ba_sb_comments_${characterId}`;
  const cached = getCache<Comment[]>(cacheKey) || [];
  setCache(cacheKey, [newComment, ...cached.filter((c) => c.id !== newComment.id)]);

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

  return newComment;
}

export async function replyCommentSupabase(
  commentId: string,
  adminReply: string,
  characterId?: string
): Promise<void> {
  const rowId = `commreply_${commentId}`;
  const trimmed = adminReply.trim();

  // Optimistic local cache update
  if (characterId) {
    const cacheKey = `ba_sb_comments_${characterId}`;
    const cached = getCache<Comment[]>(cacheKey) || [];
    const updated = cached.map((c) =>
      c.id === commentId ? { ...c, adminReply: trimmed || undefined } : c
    );
    setCache(cacheKey, updated);
  }

  try {
    if (!trimmed) {
      // If empty string, delete reply
      await supabase.from('character_stats').delete().eq('id', rowId);
    } else {
      await supabase.from('character_stats').upsert({
        id: rowId,
        name: trimmed,
        views: 0,
        roleplay_clicks: 0,
        updated_at: new Date().toISOString()
      });
    }
  } catch (err) {
    console.warn('[Supabase] Error updating comment reply:', err);
  }
}

export async function deleteCommentSupabase(commentId: string, characterId?: string): Promise<void> {
  markCommentDeletedLocal(commentId, characterId);
  try {
    await supabase.from('comments').delete().eq('id', commentId);
  } catch (err) {
    console.warn('[Supabase] Exception during comment deletion:', err);
  }
  try {
    await supabase.from('character_stats').delete().eq('id', `commreply_${commentId}`);
  } catch (_) {}
}

export async function fetchAllCommentsSupabase(): Promise<Comment[]> {
  const deletedSet = getDeletedCommentIds();
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data
      .filter((row) => !deletedSet.has(row.id))
      .map((row) => ({
        id: row.id,
        characterId: row.character_id,
        authorName: row.author_name,
        content: row.content,
        createdAt: row.created_at,
        likes: Number(row.likes || 0)
      }));
  } catch (_) {
    return [];
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
      if (
        row.id.startsWith('setting_') ||
        row.id.startsWith('commreq_') ||
        row.id.startsWith('cheer_')
      ) {
        return;
      }
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

// ---------------- HOT CHARACTER SPOTLIGHT (CHARACTER HOT TRONG TUẦN) ----------------
export async function fetchHotCharacterSpotlightSupabase(): Promise<{ hotCharacterId: string; awardTitle?: string } | null> {
  try {
    const { data, error } = await supabase
      .from('character_stats')
      .select('name')
      .eq('id', 'setting_hot_character')
      .maybeSingle();

    if (error || !data?.name) return null;

    try {
      const parsed = JSON.parse(data.name);
      return {
        hotCharacterId: parsed.hotCharacterId || parsed.id,
        awardTitle: parsed.awardTitle || parsed.title
      };
    } catch (_) {
      return { hotCharacterId: data.name };
    }
  } catch (err) {
    console.warn('[Supabase] Could not fetch hot character setting:', err);
    return null;
  }
}

export async function saveHotCharacterSpotlightSupabase(
  hotCharacterId: string,
  awardTitle?: string
): Promise<void> {
  try {
    await supabase.from('character_stats').upsert({
      id: 'setting_hot_character',
      name: JSON.stringify({
        hotCharacterId,
        awardTitle: awardTitle || 'HONORARY SPOTLIGHT',
        updatedAt: new Date().toISOString()
      }),
      views: 0,
      roleplay_clicks: 0,
      updated_at: new Date().toISOString()
    });
  } catch (err) {
    console.warn('[Supabase] Could not save hot character setting:', err);
  }
}

// ---------------- COMMISSIONS (CẤU HÌNH & ĐƠN ĐĂNG KÝ SLOT COMMISSION) ----------------

export async function fetchCommissionSettingsSupabase(): Promise<CommissionSettings | null> {
  try {
    const { data, error } = await supabase
      .from('character_stats')
      .select('name')
      .eq('id', 'setting_commission_config')
      .maybeSingle();

    if (error || !data?.name) return null;

    try {
      const parsed = JSON.parse(data.name);
      if (parsed && typeof parsed === 'object') {
        return parsed as CommissionSettings;
      }
      return null;
    } catch (_) {
      return null;
    }
  } catch (err) {
    console.warn('[Supabase] Could not fetch commission settings:', err);
    return null;
  }
}

export async function saveCommissionSettingsSupabase(
  settings: CommissionSettings
): Promise<void> {
  try {
    await supabase.from('character_stats').upsert({
      id: 'setting_commission_config',
      name: JSON.stringify({
        ...settings,
        updatedAt: new Date().toISOString()
      }),
      views: 0,
      roleplay_clicks: 0,
      updated_at: new Date().toISOString()
    });
  } catch (err) {
    console.warn('[Supabase] Could not save commission settings:', err);
  }
}

export async function fetchCommissionRequestsSupabase(): Promise<CommissionRequest[]> {
  try {
    const { data, error } = await supabase
      .from('character_stats')
      .select('id, name, updated_at')
      .like('id', 'commreq_%');

    if (error || !data) return [];

    const requests: CommissionRequest[] = [];
    for (const row of data) {
      if (!row.name) continue;
      try {
        const parsed = JSON.parse(row.name);
        if (parsed && !parsed.deleted && parsed.id && parsed.clientName) {
          requests.push(parsed as CommissionRequest);
        }
      } catch (_) {}
    }

    requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return requests;
  } catch (err) {
    console.warn('[Supabase] Could not fetch commission requests:', err);
    return [];
  }
}

export async function submitCommissionRequestSupabase(
  item: CommissionRequest
): Promise<void> {
  try {
    await supabase.from('character_stats').upsert({
      id: `commreq_${item.id}`,
      name: JSON.stringify(item),
      views: 0,
      roleplay_clicks: 0,
      updated_at: new Date().toISOString()
    });
  } catch (err) {
    console.warn('[Supabase] Could not submit commission request:', err);
  }
}

export async function updateCommissionStatusSupabase(
  id: string,
  status: CommissionStatus,
  adminNotes?: string
): Promise<void> {
  try {
    const rowId = id.startsWith('commreq_') ? id : `commreq_${id}`;
    const { data } = await supabase
      .from('character_stats')
      .select('name')
      .eq('id', rowId)
      .maybeSingle();

    if (data?.name) {
      const parsed = JSON.parse(data.name) as CommissionRequest;
      const updated: CommissionRequest = {
        ...parsed,
        status,
        updatedAt: new Date().toISOString(),
        ...(adminNotes !== undefined ? { adminNotes } : {})
      };
      await supabase.from('character_stats').upsert({
        id: rowId,
        name: JSON.stringify(updated),
        views: 0,
        roleplay_clicks: 0,
        updated_at: new Date().toISOString()
      });
    }
  } catch (err) {
    console.warn('[Supabase] Could not update commission status:', err);
  }
}

export async function deleteCommissionRequestSupabase(id: string): Promise<void> {
  try {
    const cleanId = id.replace(/^commreq_/, '');
    const rowId = `commreq_${cleanId}`;
    await supabase.from('character_stats').upsert({
      id: rowId,
      name: JSON.stringify({
        id: cleanId,
        deleted: true,
        updatedAt: new Date().toISOString()
      }),
      views: 0,
      roleplay_clicks: 0,
      updated_at: new Date().toISOString()
    });
  } catch (err) {
    console.warn('[Supabase] Could not delete commission request:', err);
  }
}


