CREATE OR REPLACE FUNCTION get_conversation_full_details(conversation_id_param UUID)
RETURNS TABLE(
  id UUID, 
  type TEXT, 
  chatroom_name TEXT, 
  photo TEXT, 
  post_id UUID, 
  post_title TEXT, 
  post_content TEXT, 
  created_at TIMESTAMP WITH TIME ZONE, 
  updated_at TIMESTAMP WITH TIME ZONE, 
  participants JSONB, 
  participant_count BIGINT, 
  current_user_role TEXT, 
  current_user_joined_at TIMESTAMP WITH TIME ZONE, 
  can_join BOOLEAN, 
  conversation_exists BOOLEAN,
  is_muted BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_row public.posts%ROWTYPE;
  conv_exists BOOLEAN;
  result_id UUID;
  result_type TEXT;
  result_chatroom_name TEXT;
  result_photo TEXT;
  result_post_id UUID;
  result_post_title TEXT;
  result_post_content TEXT;
  result_created_at TIMESTAMPTZ;
  result_updated_at TIMESTAMPTZ;
  result_participants JSONB;
  result_participant_count BIGINT;
  result_current_user_role TEXT;
  result_current_user_joined_at TIMESTAMPTZ;
  result_can_join BOOLEAN;
  result_conversation_exists BOOLEAN;
  result_is_muted BOOLEAN;
BEGIN
  -- Check if conversation exists
  SELECT EXISTS(SELECT 1 FROM public.conversations c WHERE c.id = conversation_id_param) INTO conv_exists;
  
  IF NOT conv_exists THEN
    result_id := NULL;
    result_type := NULL;
    result_chatroom_name := NULL;
    result_photo := NULL;
    result_post_id := NULL;
    result_post_title := NULL;
    result_post_content := NULL;
    result_created_at := NULL;
    result_updated_at := NULL;
    result_participants := NULL;
    result_participant_count := 0;
    result_current_user_role := NULL;
    result_current_user_joined_at := NULL;
    result_can_join := FALSE;
    result_conversation_exists := FALSE;
    result_is_muted := FALSE;
    
    id := result_id;
    type := result_type;
    chatroom_name := result_chatroom_name;
    photo := result_photo;
    post_id := result_post_id;
    post_title := result_post_title;
    post_content := result_post_content;
    created_at := result_created_at;
    updated_at := result_updated_at;
    participants := result_participants;
    participant_count := result_participant_count;
    current_user_role := result_current_user_role;
    current_user_joined_at := result_current_user_joined_at;
    can_join := result_can_join;
    conversation_exists := result_conversation_exists;
    is_muted := result_is_muted;
    
    RETURN NEXT;
    RETURN;
  END IF;

  -- Get post details if they exist
  SELECT p.* INTO post_row 
  FROM public.posts p
  JOIN public.conversations c ON c.post_id = p.id
  WHERE c.id = conversation_id_param;

  -- Return conversation with all details
  RETURN QUERY
  WITH participant_details AS (
    SELECT 
      jsonb_agg(
        jsonb_build_object(
          'user_id', p.id,
          'display_name', p.display_name,
          'profile_picture_url', p.profile_picture_url,
          'role', cp.role,
          'joined_at', cp.created_at,
          'email', p.login_email
        )
      ) AS participants,
      COUNT(*) AS participant_count
    FROM public.conversation_participants cp
    JOIN public.profiles p ON p.id = cp.user_id
    WHERE cp.conversation_id = conversation_id_param
    GROUP BY cp.conversation_id
  ),
  current_user_membership AS (
    SELECT 
      cp.role AS current_user_role,
      cp.created_at AS current_user_joined_at
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_id_param 
    AND cp.user_id = auth.uid()
  ),
  muted_status AS (
    SELECT EXISTS (
      SELECT 1 FROM public.muted_entities me
      WHERE me.user_id = auth.uid()
      AND me.entity_id = conversation_id_param
      AND me.entity_type = 'chatroom'
    ) AS is_muted
  )
  SELECT 
    c.id,
    c.type,
    c.chatroom_name,
    c.photo,
    c.post_id,
    post_row.title AS post_title,
    post_row.content AS post_content,
    c.created_at,
    c.updated_at,
    COALESCE(pd.participants, '[]'::jsonb) AS participants,
    COALESCE(pd.participant_count, 0) AS participant_count,
    cum.current_user_role,
    cum.current_user_joined_at,
    -- Logic for determining if a user can join the chatroom
    CASE 
      WHEN cum.current_user_role IS NULL AND c.type = 'chatroom' THEN TRUE
      ELSE FALSE
    END AS can_join,
    TRUE AS conversation_exists,
    ms.is_muted
  FROM public.conversations c
  LEFT JOIN participant_details pd ON TRUE
  LEFT JOIN current_user_membership cum ON TRUE
  LEFT JOIN muted_status ms ON TRUE
  WHERE c.id = conversation_id_param;
END;
$$; 