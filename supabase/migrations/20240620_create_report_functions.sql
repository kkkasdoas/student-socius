-- Create a function to submit a report
CREATE OR REPLACE FUNCTION public.submit_report(
  p_reporter_id UUID,
  p_reported_entity_id BIGINT,
  p_type report_type,
  p_reason VARCHAR(50),
  p_reporter_note TEXT DEFAULT NULL,
  p_message_id BIGINT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_report_id BIGINT;
  v_entity_exists BOOLEAN := FALSE;
BEGIN
  -- Validate reporter_id
  IF p_reporter_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_reporter_id) THEN
    RETURN json_build_object('success', FALSE, 'message', 'Invalid reporter_id');
  END IF;

  -- Validate reported_entity_id exists based on type
  CASE p_type
    WHEN 'chatroom' THEN
      SELECT EXISTS(SELECT 1 FROM conversations WHERE id = p_reported_entity_id::TEXT AND type = 'chatroom') INTO v_entity_exists;
    WHEN 'message' THEN
      SELECT EXISTS(SELECT 1 FROM messages WHERE id = p_reported_entity_id::TEXT) INTO v_entity_exists;
    WHEN 'profile' THEN
      SELECT EXISTS(SELECT 1 FROM profiles WHERE id = p_reported_entity_id::TEXT) INTO v_entity_exists;
    WHEN 'post' THEN
      SELECT EXISTS(SELECT 1 FROM posts WHERE id = p_reported_entity_id::TEXT) INTO v_entity_exists;
  END CASE;

  IF NOT v_entity_exists THEN
    RETURN json_build_object('success', FALSE, 'message', 'Invalid entity_id for the specified type');
  END IF;

  -- Validate message_id if provided
  IF p_message_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM messages WHERE id = p_message_id::TEXT) THEN
    RETURN json_build_object('success', FALSE, 'message', 'Invalid message_id');
  END IF;

  -- Insert the report
  INSERT INTO reports (reporter_id, reported_entity_id, type, reason, reporter_note, message_id)
  VALUES (p_reporter_id, p_reported_entity_id, p_type, p_reason, p_reporter_note, p_message_id)
  RETURNING report_id INTO v_report_id;

  RETURN json_build_object(
    'success', TRUE,
    'report_id', v_report_id,
    'message', 'Report submitted successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 