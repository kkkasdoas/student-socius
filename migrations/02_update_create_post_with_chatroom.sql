CREATE OR REPLACE FUNCTION create_post_with_chatroom(
  p_user_id UUID,
  p_title TEXT,
  p_content TEXT,
  p_university TEXT,
  p_image_url TEXT DEFAULT NULL,
  p_channel_type TEXT DEFAULT 'CampusGeneral', 
  p_category TEXT DEFAULT NULL,
  p_chatroom_name TEXT DEFAULT NULL,
  p_chatroom_photo TEXT DEFAULT NULL
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_id UUID;
  conversation_id UUID;
  conversation_created BOOLEAN;
BEGIN
  -- Insert post record
  INSERT INTO public.posts (
    user_id, 
    title, 
    content, 
    university, 
    image_url, 
    channel_type, 
    category
  ) VALUES (
    p_user_id,
    p_title,
    p_content,
    p_university,
    p_image_url,
    p_channel_type,
    p_category
  ) RETURNING id INTO post_id;
  
  -- Only create a chatroom if channel_type is CampusGeneral or Forum
  IF p_channel_type IN ('CampusGeneral', 'Forum') THEN
    -- Create chatroom (conversation)
    INSERT INTO public.conversations (
      type, 
      chatroom_name, 
      photo, 
      post_id
    ) VALUES (
      'chatroom',
      p_chatroom_name,
      p_chatroom_photo,
      post_id
    ) RETURNING id INTO conversation_id;
    
    -- Add the post creator as an admin participant
    INSERT INTO public.conversation_participants (
      conversation_id, 
      user_id, 
      role
    ) VALUES (
      conversation_id,
      p_user_id,
      'admin'
    );
    
    conversation_created := TRUE;
  ELSE
    -- No chatroom created for other channel types
    conversation_id := NULL;
    conversation_created := FALSE;
  END IF;
  
  -- Return the post and conversation IDs along with status
  RETURN jsonb_build_object(
    'post_id', post_id, 
    'conversation_id', conversation_id,
    'conversation_created', conversation_created
  );
END;
$$; 