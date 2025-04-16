-- Drop the existing function first
DROP FUNCTION IF EXISTS get_conversation_by_id(UUID);

-- Create optimized function
CREATE OR REPLACE FUNCTION get_conversation_by_id(conversation_id_param UUID)
RETURNS TABLE (
  id UUID,
  type TEXT,
  chatroom_name TEXT,
  photo TEXT,
  participant_count INTEGER,
  participants JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  conv_type TEXT;
BEGIN
  -- Get the authenticated user's ID
  current_user_id := auth.uid();
  
  -- First check the conversation type
  SELECT c.type INTO conv_type
  FROM public.conversations c
  WHERE c.id = conversation_id_param;
  
  IF conv_type = 'private' THEN
    -- For private conversations, include participants
    RETURN QUERY
    SELECT 
      c.id,
      c.type,
      c.chatroom_name,
      c.photo,
      COUNT(cp.user_id)::INTEGER AS participant_count,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'display_name', p.display_name,
            'profile_picture_url', p.profile_picture_url
          )
        )
        FROM public.conversation_participants cp_inner
        JOIN public.profiles p ON cp_inner.user_id = p.id
        WHERE cp_inner.conversation_id = c.id
      ) AS participants
    FROM 
      public.conversations c
    LEFT JOIN 
      public.conversation_participants cp ON c.id = cp.conversation_id
    WHERE 
      c.id = conversation_id_param
    GROUP BY 
      c.id;
  ELSE
    -- For chatrooms/group chats, don't include participants
    RETURN QUERY
    SELECT 
      c.id,
      c.type,
      c.chatroom_name,
      c.photo,
      COUNT(cp.user_id)::INTEGER AS participant_count,
      NULL::JSONB AS participants
    FROM 
      public.conversations c
    LEFT JOIN 
      public.conversation_participants cp ON c.id = cp.conversation_id
    WHERE 
      c.id = conversation_id_param
    GROUP BY 
      c.id;
  END IF;
END;
$$; 