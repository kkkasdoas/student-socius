CREATE OR REPLACE FUNCTION test_uid() RETURNS uuid AS $$ BEGIN RETURN auth.uid(); END; $$ LANGUAGE plpgsql;
