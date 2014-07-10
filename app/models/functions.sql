DROP FUNCTION IF EXISTS accountInsertOrSelect (text, text, text);
CREATE FUNCTION accountInsertOrSelect (text, text, text)
RETURNS RECORD
AS $$
DECLARE result RECORD;
BEGIN
LOOP
  SELECT * INTO result FROM accounts
  WHERE uniqid = $1
  AND provider = $2;
  IF found THEN
    RETURN result;
  END IF;
  BEGIN
    INSERT INTO accounts (uniqid, provider, display_name)
    VALUES ($1, $2, $3)
    RETURNING * INTO result;
    RETURN result;
  EXCEPTION WHEN unique_violation THEN
  END;
END LOOP;
END
$$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS accountInsertOrUpdate (text, text, text);
CREATE FUNCTION accountInsertOrUpdate (text, text, text)
RETURNS RECORD
AS $$
DECLARE result RECORD;
BEGIN
LOOP
  UPDATE accounts
  SET display_name = $3
  WHERE uniqid = $1
  AND provider = $2
  RETURNING * INTO result;
  IF found THEN
    RETURN result;
  END IF;
  BEGIN
    INSERT INTO accounts (uniqid, provider, display_name)
    VALUES ($1, $2, $3)
    RETURNING * INTO result;
    RETURN result;
  EXCEPTION WHEN unique_violation THEN
  END;
END LOOP;
END
$$ LANGUAGE plpgsql;
