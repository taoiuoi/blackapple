-- 1. BẢNG THỐNG KÊ LƯỢT XEM VÀ LƯỢT NHẤP LINK
CREATE TABLE IF NOT EXISTS public.character_stats (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    views BIGINT DEFAULT 0,
    roleplay_clicks BIGINT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.character_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on character_stats" ON public.character_stats;
CREATE POLICY "Allow public read on character_stats" ON public.character_stats FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public update on character_stats" ON public.character_stats;
CREATE POLICY "Allow public update on character_stats" ON public.character_stats FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public insert on character_stats" ON public.character_stats;
CREATE POLICY "Allow public insert on character_stats" ON public.character_stats FOR INSERT WITH CHECK (true);

-- Nạp số liệu lượt xem và lượt nhấp link hiện tại từ Firebase:
INSERT INTO public.character_stats (id, name, views, roleplay_clicks) VALUES ('dong-ky', 'Đông Kỷ', 945, 268) ON CONFLICT (id) DO UPDATE SET views = EXCLUDED.views, roleplay_clicks = EXCLUDED.roleplay_clicks;
INSERT INTO public.character_stats (id, name, views, roleplay_clicks) VALUES ('phan-quy-man', 'Phan Quý Mẫn', 541, 188) ON CONFLICT (id) DO UPDATE SET views = EXCLUDED.views, roleplay_clicks = EXCLUDED.roleplay_clicks;
INSERT INTO public.character_stats (id, name, views, roleplay_clicks) VALUES ('gian-di-ninh', 'Giản Dĩ Ninh', 526, 111) ON CONFLICT (id) DO UPDATE SET views = EXCLUDED.views, roleplay_clicks = EXCLUDED.roleplay_clicks;
INSERT INTO public.character_stats (id, name, views, roleplay_clicks) VALUES ('nguy-tu-viet', 'Ngụy Tứ Việt', 137, 7) ON CONFLICT (id) DO UPDATE SET views = EXCLUDED.views, roleplay_clicks = EXCLUDED.roleplay_clicks;
INSERT INTO public.character_stats (id, name, views, roleplay_clicks) VALUES ('chu-lac-thien', 'Chu Lạc Thiên', 87, 19) ON CONFLICT (id) DO UPDATE SET views = EXCLUDED.views, roleplay_clicks = EXCLUDED.roleplay_clicks;
INSERT INTO public.character_stats (id, name, views, roleplay_clicks) VALUES ('luc-tu-hien', 'Lục Từ Hiên', 83, 23) ON CONFLICT (id) DO UPDATE SET views = EXCLUDED.views, roleplay_clicks = EXCLUDED.roleplay_clicks;

-- HÀM TĂNG LƯỢT XEM VÀ LƯỢT NHẤP LINK AN TOÀN (ATOMIC RPC)
CREATE OR REPLACE FUNCTION public.increment_views(char_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.character_stats (id, name, views, roleplay_clicks)
  VALUES (char_id, char_id, 1, 0)
  ON CONFLICT (id) DO UPDATE
  SET views = public.character_stats.views + 1,
      updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_roleplay_clicks(char_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.character_stats (id, name, views, roleplay_clicks)
  VALUES (char_id, char_id, 0, 1)
  ON CONFLICT (id) DO UPDATE
  SET roleplay_clicks = public.character_stats.roleplay_clicks + 1,
      updated_at = NOW();
END;
$$;

-- 2. BẢNG BÌNH LUẬN (LƯU BÚT ĐỘC GIẢ)
CREATE TABLE IF NOT EXISTS public.comments (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    likes BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on comments" ON public.comments;
CREATE POLICY "Allow public read on comments" ON public.comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on comments" ON public.comments;
CREATE POLICY "Allow public insert on comments" ON public.comments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete on comments" ON public.comments;
CREATE POLICY "Allow public delete on comments" ON public.comments FOR DELETE USING (true);

-- Nạp 18 bình luận hiện tại từ Firebase:
INSERT INTO public.comments (id, character_id, author_name, content, likes, created_at) VALUES ('comm-1793878025325', 'gian-di-ninh', 'Yuu', 'Anh biết yêu rồi ảnh dè chừng mình lắm ý,làm gì cũng hỏi trước sợ mình phật ý thôi lk', 0, '2026-11-05T11:27:05.326Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.comments (id, character_id, author_name, content, likes, created_at) VALUES ('comm-1793965865608', 'gian-di-ninh', '.', 'Cứu tui với giải ko ra😭', 0, '2026-11-06T11:51:05.608Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.comments (id, character_id, author_name, content, likes, created_at) VALUES ('comm-1793974934091', 'gian-di-ninh', '..', '.', 0, '2026-11-06T14:22:14.091Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.comments (id, character_id, author_name, content, likes, created_at) VALUES ('comm-1794041241995', 'dong-ky', 'Uyển Đình', '…', 0, '2026-11-07T08:47:21.995Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.comments (id, character_id, author_name, content, likes, created_at) VALUES ('comm-1794041252958', 'dong-ky', 'Uyển Đình', 'Ghét hắn', 0, '2026-11-07T08:47:32.958Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.comments (id, character_id, author_name, content, likes, created_at) VALUES ('comm-1794043848548', 'dong-ky', 'Ká', 'Mê cổ trang, mê anh nìii🫶', 0, '2026-11-07T09:30:48.548Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.comments (id, character_id, author_name, content, likes, created_at) VALUES ('comm-1794051415444', 'dong-ky', 'Cờ him bé', 'TẠI SAO LẠI NGON NHƯ VẬYYYYYYY', 0, '2026-11-07T11:36:55.444Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.comments (id, character_id, author_name, content, likes, created_at) VALUES ('comm-1794063263845', 'dong-ky', 'Kimmanh', 'Văn nhã bại hoại, quá ngonn', 0, '2026-11-07T14:54:23.845Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.comments (id, character_id, author_name, content, likes, created_at) VALUES ('comm-1794063277166', 'dong-ky', 'Kimmanh', 'Văn nhã bại hoại, quá ngonn', 0, '2026-11-07T14:54:37.166Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.comments (id, character_id, author_name, content, likes, created_at) VALUES ('comm-1794069956760', 'dong-ky', 'Machiwii', 'Cốt truyện cuốn vcl', 0, '2026-11-07T16:45:56.760Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.comments (id, character_id, author_name, content, likes, created_at) VALUES ('comm-1794124861044', 'dong-ky', 'Ngọc Thanh', 'H QUÁ MƯỢT QUÁ ĐỈNH', 0, '2026-11-08T08:01:01.044Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.comments (id, character_id, author_name, content, likes, created_at) VALUES ('comm-1794128945247', 'dong-ky', 'Lylieng', 'Mlemmm', 0, '2026-11-08T09:09:05.247Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.comments (id, character_id, author_name, content, likes, created_at) VALUES ('comm-1794132920420', 'dong-ky', 'Yuun', 'Rỉ', 0, '2026-11-08T10:15:20.420Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.comments (id, character_id, author_name, content, likes, created_at) VALUES ('comm-1794135296797', 'dong-ky', 'Giselle', 'Táo ơi, e thích prompt của táo lắm lun, e chơi char Mẫn rùi sau đó qua thử anh này, prompt đỉnh lắm n mà e chơi cảm giác văn chưa được sâu, kiểu nó cứ bị chung chung chứ ch được sâu sắc lắm ạ, văn hơi ngắn nếu em áp lệnh thì nó bị hỏi nhiều quá, em cũng ko bit sao nữa n e chỉ muốn feefback chút xíu cho táo, em vẫn thích char táo lắm ạaa', 0, '2026-11-08T10:54:56.797Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.comments (id, character_id, author_name, content, likes, created_at) VALUES ('comm-1794135954963', 'gian-di-ninh', 'Riika', 'Tha thiết muốn biết mk là gì , mò quài ko ra 😭', 0, '2026-11-08T11:05:54.963Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.comments (id, character_id, author_name, content, likes, created_at) VALUES ('comm-1794136177515', 'dong-ky', 'Hi Hi', 'Lần đầu em biết tới sốp qua char này, đậm đà, chuẩn vị, đúng gu iem 😋', 0, '2026-11-08T11:09:37.515Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.comments (id, character_id, author_name, content, likes, created_at) VALUES ('comm-1794141007528', 'phan-quy-man', 'Lê Nguy Ánh Ninh', 'bon appetit', 0, '2026-11-08T12:30:07.528Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.comments (id, character_id, author_name, content, likes, created_at) VALUES ('comm-1794145824347', 'dong-ky', 'Lệ Ly', 'mê~~', 0, '2026-11-08T13:50:24.347Z') ON CONFLICT (id) DO NOTHING;

-- 3. BẢNG THỂ LOẠI (GENRES)
CREATE TABLE IF NOT EXISTS public.genres (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    "order" INT DEFAULT 99,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on genres" ON public.genres;
CREATE POLICY "Allow public read on genres" ON public.genres FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on genres" ON public.genres;
CREATE POLICY "Allow public insert on genres" ON public.genres FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on genres" ON public.genres;
CREATE POLICY "Allow public update on genres" ON public.genres FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete on genres" ON public.genres;
CREATE POLICY "Allow public delete on genres" ON public.genres FOR DELETE USING (true);

-- Nạp thể loại hiện tại từ Firebase:
INSERT INTO public.genres (id, name, description, "order") VALUES ('bat-nat', 'Bắt nạt', '', 9) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('bdsm', 'BDSM', '', 21) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('co-thai', 'Có thai', '', 23) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('co-trang', 'Cổ trang', '', 22) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('cuoi-truoc-yeu-sau', 'Cưới trước yêu sau', '', 5) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('cuong-ep', 'Cưỡng ép', '', 24) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('guong-vo-lai-lanh', 'Gương vỡ lại lành', '', 17) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('hai-huoc', 'Hài hước', '', 11) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('hanh-ha-the-xac-lan-tinh-than', 'Hành hạ thể xác lẫn tinh thần', '', 26) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('hon-nhan-sap--at', 'Hôn nhân sắp đặt', '', 4) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('nguoc', 'Ngược', '', 28) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('nguoc-tam', 'Ngược tâm', '', 6) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('nguoi-yeu-cu', 'Người yêu cũ', '', 16) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('noi-gian', 'Nội gián', '', 14) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('noi-loan', 'Nổi loạn', '', 19) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('nsforw', 'NSforW', '', 7) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('plot-an', 'Plot ẩn', '', 15) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('r18', 'R18', '', 13) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('r21', 'R21', '', 20) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('sat-thu-ngam', 'Sát thủ ngầm', '', 13) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('thanh-xuan-ai-hoc', 'Thanh xuân đại học', '', 10) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('thanh-xuan-vuon-truong', 'Thanh xuân vườn trường', '', 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('thao-tung-tam-ly', 'Thao túng tâm lý', '', 25) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('theo-uoi-user', 'Theo đuổi User', '', 12) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('tinh-duc-cuong-buc', 'Tình dục cưỡng bức', '', 27) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('tra-nam', 'Tra nam', '', 3) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('trum-truong', 'Trùm trường', '', 18) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('user-cam', 'User câm', '', 29) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('van-nha-bai-hoai', 'Văn nhã bại hoại', '', 30) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.genres (id, name, description, "order") VALUES ('viet-nam-xua', 'Việt Nam xưa', '', 2) ON CONFLICT (id) DO NOTHING;

-- 4. BẢNG ĐỘC GIẢ ĐĂNG KÝ HÓNG NHÂN VẬT MỚI (VIP WAITING LIST)
CREATE TABLE IF NOT EXISTS public.upcoming_subscribers (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL,
    character_name TEXT NOT NULL,
    email TEXT NOT NULL,
    reader_name TEXT DEFAULT 'Độc giả yêu mến',
    note TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.upcoming_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on upcoming_subscribers" ON public.upcoming_subscribers;
CREATE POLICY "Allow public read on upcoming_subscribers" ON public.upcoming_subscribers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on upcoming_subscribers" ON public.upcoming_subscribers;
CREATE POLICY "Allow public insert on upcoming_subscribers" ON public.upcoming_subscribers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete on upcoming_subscribers" ON public.upcoming_subscribers;
CREATE POLICY "Allow public delete on upcoming_subscribers" ON public.upcoming_subscribers FOR DELETE USING (true);

