CREATE OR REPLACE FUNCTION get_user_profile(p_user_id UUID)
RETURNS TABLE(
  id UUID, 
  display_name TEXT, 
  bio TEXT, 
  university TEXT, 
  verification_status TEXT, 
  profile_picture_url TEXT, 
  auth_provider TEXT, 
  created_at TIMESTAMP WITH TIME ZONE, 
  updated_at TIMESTAMP WITH TIME ZONE, 
  post_count BIGINT, 
  reaction_count BIGINT, 
  is_blocked BOOLEAN, 
  is_muted BOOLEAN, 
  is_own_profile BOOLEAN, 
  social_links JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  -- Verify auth
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.bio,
    p.university,
    p.verification_status,
    p.profile_picture_url,
    p.auth_provider,
    p.created_at,
    p.updated_at,
    -- Count posts
    (SELECT COUNT(*) FROM posts WHERE user_id = p.id),
    -- Count reactions received on all posts
    (SELECT COUNT(*) FROM reactions r 
     JOIN posts pt ON r.post_id = pt.id 
     WHERE pt.user_id = p.id),
    -- Check if requesting user has blocked this profile
    EXISTS (
      SELECT 1 FROM blocked_users 
      WHERE blocker_id = v_user_id AND blocked_id = p.id
    ),
    -- Check if requesting user has muted this profile using muted_entities
    EXISTS (
      SELECT 1 FROM muted_entities
      WHERE user_id = v_user_id AND entity_id = p.id AND entity_type = 'user'
    ),
    -- Check if this is the user's own profile
    (p.id = v_user_id) AS is_own_profile,
    -- Include social links
    p.social_links
  FROM profiles p
  WHERE p.id = p_user_id
  AND p.is_deleted = false;
END;
$$; 