CREATE OR REPLACE FUNCTION get_posts_with_reactions_optimized(
  university_input TEXT,
  channel_input TEXT,
  page_number INTEGER,
  category_input TEXT DEFAULT NULL,
  sort_by TEXT DEFAULT 'new'
) 
RETURNS JSONB[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  posts_per_page INTEGER := 10;
  offset_value INTEGER := (page_number - 1) * posts_per_page;
  sort_value TEXT := COALESCE(sort_by, 'new');
  reaction_order TEXT[] := ARRAY['like', 'heart', 'laugh', 'wow', 'sad', 'angry']; -- Order for reactions
  result JSONB[];
BEGIN
  current_user_id := auth.uid();
  
  WITH filtered_posts AS (
    SELECT 
      p.id AS post_id,
      p.user_id,
      p.title,
      p.content,
      p.category,
      p.created_at,
      p.updated_at,
      p.is_edited,
      p.image_url,
      p.channel_type,
      u.display_name,
      u.profile_picture_url,
      p.user_id = current_user_id AS is_own_post,
      c.id AS conversation_id
    FROM 
      public.posts p
    JOIN 
      public.profiles u ON p.user_id = u.id
    LEFT JOIN
      public.conversations c ON c.post_id = p.id
    LEFT JOIN
      public.post_reaction_summaries prs ON p.id = prs.post_id
    WHERE 
      (p.channel_type = channel_input)
      AND (university_input = 'all' OR p.university = university_input)
      AND (category_input IS NULL OR p.category = category_input)
      -- Filter out posts from blocked users and hidden posts
      AND NOT EXISTS (SELECT 1 FROM public.blocked_users b 
                     WHERE (b.blocker_id = current_user_id AND b.blocked_id = p.user_id)
                        OR (b.blocked_id = current_user_id AND b.blocker_id = p.user_id))
      -- Filter out posts from muted users using muted_entities instead of muted_users
      AND NOT EXISTS (SELECT 1 FROM public.muted_entities m 
                     WHERE m.user_id = current_user_id 
                     AND m.entity_id = p.user_id
                     AND m.entity_type = 'user')
      AND NOT EXISTS (SELECT 1 FROM public.hidden_posts hp
                     WHERE hp.user_id = current_user_id AND hp.post_id = p.id)
    ORDER BY 
      CASE WHEN sort_value = 'new' THEN p.created_at END DESC NULLS LAST,
      CASE WHEN sort_value = 'top' THEN COALESCE(prs.total_count, 0) END DESC NULLS LAST,
      CASE WHEN sort_value = 'hot' THEN (
        SELECT COUNT(*) FROM public.reactions 
        WHERE post_id = p.id AND created_at > now() - interval '24 hours'
      ) END DESC NULLS LAST,
      p.created_at DESC
    LIMIT posts_per_page
    OFFSET offset_value
  ),
  user_reactions AS (
    SELECT 
      fp.post_id,
      r.type AS user_reaction
    FROM 
      filtered_posts fp
    LEFT JOIN 
      public.reactions r ON fp.post_id = r.post_id AND r.user_id = current_user_id
  ),
  user_states AS (
    SELECT
      fp.post_id,
      EXISTS (SELECT 1 FROM public.saved_posts sp WHERE sp.user_id = current_user_id AND sp.post_id = fp.post_id) AS is_saved,
      EXISTS (SELECT 1 FROM public.hidden_posts hp WHERE hp.user_id = current_user_id AND hp.post_id = fp.post_id) AS is_hidden
    FROM
      filtered_posts fp
  )
  SELECT 
    array_agg(
      CASE 
        -- For CampusGeneral and Forum - return full data with reactions
        WHEN fp.channel_type IN ('CampusGeneral', 'Forum') THEN
          jsonb_build_object(
            'post_id', fp.post_id,
            'user_id', fp.user_id,
            'title', fp.title,
            'content', fp.content,
            'category', fp.category,
            'created_at', fp.created_at,
            'updated_at', fp.updated_at,
            'is_edited', fp.is_edited,
            'image_url', fp.image_url,
            'conversation_id', fp.conversation_id,
            'display_name', fp.display_name,
            'profile_picture_url', fp.profile_picture_url,
            'is_own_post', fp.is_own_post,
            'total_reactions', COALESCE(prs.total_count, 0),
            'user_reaction', ur.user_reaction,
            'is_saved', COALESCE(us.is_saved, false),
            'is_hidden', COALESCE(us.is_hidden, false),
            'reaction_counts', jsonb_build_object(
              'like', COALESCE(prs.like_count, 0),
              'heart', COALESCE(prs.heart_count, 0),
              'laugh', COALESCE(prs.laugh_count, 0),
              'wow', COALESCE(prs.wow_count, 0),
              'sad', COALESCE(prs.sad_count, 0),
              'angry', COALESCE(prs.angry_count, 0)
            ),
            -- Get top 2 reactions for the post
            'top_reactions', (
              SELECT jsonb_agg(jsonb_build_object('type', reaction_type, 'count', reaction_count))
              FROM (
                SELECT 
                  reaction_type,
                  reaction_count
                FROM (VALUES
                  ('like', COALESCE(prs.like_count, 0)),
                  ('heart', COALESCE(prs.heart_count, 0)),
                  ('laugh', COALESCE(prs.laugh_count, 0)),
                  ('wow', COALESCE(prs.wow_count, 0)),
                  ('sad', COALESCE(prs.sad_count, 0)),
                  ('angry', COALESCE(prs.angry_count, 0))
                ) AS reaction_data(reaction_type, reaction_count)
                WHERE reaction_count > 0
                ORDER BY reaction_count DESC, 
                        array_position(reaction_order, reaction_type)
                LIMIT 2
              ) subquery
            )
          )
        -- For CampusCommunity and Community - return limited data without reactions
        ELSE
          jsonb_build_object(
            'post_id', fp.post_id,
            'user_id', fp.user_id,
            'title', fp.title,
            'content', fp.content,
            'category', fp.category,
            'created_at', fp.created_at,
            'is_edited', fp.is_edited,
            'image_url', fp.image_url,
            'is_saved', COALESCE(us.is_saved, false),
            'is_hidden', COALESCE(us.is_hidden, false),
            'is_own_post', fp.is_own_post,
            'display_name', fp.display_name,
            'profile_picture_url', fp.profile_picture_url,
            'channel_type', fp.channel_type
          )
      END
    ) INTO result
  FROM 
    filtered_posts fp
  LEFT JOIN 
    user_reactions ur ON fp.post_id = ur.post_id
  LEFT JOIN
    user_states us ON fp.post_id = us.post_id
  LEFT JOIN
    post_reaction_summaries prs ON fp.post_id = prs.post_id;

  RETURN result;
END;
$$; 