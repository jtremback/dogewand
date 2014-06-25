CREATE EXTENSION "uuid-ossp";

CREATE TABLE users (
  user_id serial PRIMARY KEY,
  balance bigint NOT NULL DEFAULT 0 CHECK (balance >= 0)
);

CREATE TABLE accounts (
  account_id serial PRIMARY KEY,
  user_id int REFERENCES users,
  uniqid text NOT NULL,
  provider text NOT NULL,
  display_name text NOT NULL,
  UNIQUE (uniqid, provider)
);

CREATE TYPE tip_state AS ENUM ('created', 'claimed', 'canceled');
CREATE TABLE tips (
  tip_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipper_id int NOT NULL REFERENCES accounts,
  tippee_id int NOT NULL REFERENCES accounts,
  amount bigint NOT NULL CHECK (amount > 0),
  state tip_state NOT NULL DEFAULT 'created'
);

CREATE TABLE deposits (
  txid varchar(64) PRIMARY KEY,
  address varchar(34) NOT NULL REFERENCES addresses,
  amount bigint NOT NULL
);

CREATE TABLE addresses (
  address varchar(34) PRIMARY KEY,
  user_id int REFERENCES users
);

-- populate with stuff
-- 1
INSERT INTO users (balance)
VALUES (2340);

-- 2
INSERT INTO users (balance)
VALUES (123);

-- 3
INSERT INTO users (balance)
VALUES (567);

-- 1
INSERT INTO accounts (user_id, uniqid, provider, display_name)
VALUES (1, 'arya.stark', 'farcebook', 'Arya Stark');

-- 2
INSERT INTO accounts (user_id, uniqid, provider, display_name)
VALUES (1, '@aryastark', 'twatter', 'Arya Stark');

-- 3
INSERT INTO accounts (user_id, uniqid, provider, display_name)
VALUES (1, 'aryast$rk', 'yotub', 'Arya');

-- 4
INSERT INTO accounts (user_id, uniqid, provider, display_name)
VALUES (2, 'the.hound', 'farcebook', 'The Hound');

-- 5
INSERT INTO accounts (user_id, uniqid, provider, display_name)
VALUES (2, '@thehound', 'twatter', 'The Hound');

-- 6
INSERT INTO accounts (user_id, uniqid, provider, display_name)
VALUES (NULL, '@tywin', 'twatter', 'Tywin Lannister');

-- 1
INSERT INTO tips (tipper_id, tippee_id, amount)
VALUES (3, 4, 100);

-- 2
INSERT INTO tips (tipper_id, tippee_id, amount)
VALUES (2, 5, 10);

-- 3
INSERT INTO tips (tipper_id, tippee_id, amount)
VALUES (5, 2, 35);

-- 4
INSERT INTO tips (tipper_id, tippee_id, amount)
VALUES (1, 6, 30);



INSERT INTO deposits (txid, address, amount, blockhash)
VALUES ($1, $2, $3, $4)


SELECT user_id FROM accounts
WHERE uniqid = $1 AND provider = $2

UPDATE accounts
SET user_id = $1
WHERE user_id = $2 -- Must be authed in here, either from req.user or account supplied from passport


UPDATE users
SET balance = balance + $1
WHERE user_id = (
  SELECT user_id FROM addresses
  WHERE address = $2
)



BEGIN;
UPDATE accounts
SET name = $3 WHERE uniqid = $1 AND provider = $2;

INSERT INTO accounts (uniqid, provider, name)
SELECT $1, $2, $3
WHERE NOT EXISTS (
  SELECT 1 FROM accounts
  WHERE uniqid = $1 AND provider = $2
);

SELECT * FROM accounts
WHERE uniqid = $1 AND provider = $2;
COMMIT;



BEGIN;
UPDATE accounts
SET display_name = 'blintzen' WHERE uniqid = 'the.hound' AND provider = 'farcebook';

INSERT INTO accounts (uniqid, provider, display_name)
SELECT 'the.hound', 'farcebook', 'blintzen'
WHERE NOT EXISTS (
  SELECT 1 FROM accounts
  WHERE uniqid = 'the.hound' AND provider = 'farcebook'
);

SELECT * FROM accounts
WHERE uniqid = 'the.hound' AND provider = 'farcebook';
COMMIT;



-- --
-- WITH a AS (
--   UPDATE accounts
--   SET display_name = 'flintzen' WHERE uniqid = 'dingum' AND provider = 'ringum'
--   RETURNING *
-- ), b AS (
--   INSERT INTO users (balance)
--   SELECT 0
--   WHERE NOT EXISTS (
--     SELECT user_id FROM a
--   )
--   RETURNING user_id
-- ), c AS (
--   UPDATE accounts
--   SET user_id = (SELECT user_id FROM b) WHERE uniqid = 'dingum' AND provider = 'ringum'
--   RETURNING *
-- )

-- INSERT INTO accounts (uniqid, provider, display_name, user_id)
-- SELECT 'dingum', 'ringum', 'flintzen', user_id FROM b
-- WHERE NOT EXISTS (
--   SELECT 1 FROM accounts
--   WHERE uniqid = 'dingum' AND provider = 'ringum'
-- );

WITH u AS (
  INSERT INTO users (balance)
  VALUES (0)
  RETURNING user_id
)
UPDATE accounts
SET user_id = (SELECT user_id FROM u)
WHERE account_id = $1
RETURNING user_id



SELECT * FROM users
INNER JOIN accounts ON accounts.user_id = users.user_id
WHERE users.user_id=(
  SELECT user_id FROM accounts
  WHERE uniqid = 'dingum' AND provider = 'ringum'
);


SELECT * FROM users
INNER JOIN accounts ON accounts.user_id = users.user_id
WHERE users.user_id=$1


-- auth
BEGIN;
INSERT INTO accounts (uniqid, provider, name)
SELECT $1, $2, $3
WHERE NOT EXISTS (
  SELECT 1 FROM accounts
  WHERE uniqid = $1 AND provider = $2
);
SELECT * FROM accounts
WHERE uniqid = $1 AND provider = $2;

SELECT * FROM users u, accounts a
WHERE a.user_id = u.user_id

COMMIT;

-- amount, user, uniqid, provider, name
-- example of create tip
BEGIN;
UPDATE users SET balance = balance - $2 WHERE user_id = $1;

WITH te AS (
  SELECT accountInsertOrSelect($3, $4, $5) AS account_id
), tr AS (
  SELECT account_id FROM accounts WHERE user_id = $1 AND provider = $4 LIMIT 1 )
INSERT INTO tips (tipper_id, tippee_id, amount)
VALUES ((SELECT account_id FROM te), (SELECT account_id from tr), $2);
RETURNING tip_id
COMMIT;


-- working resolve!
-- BEGIN;
WITH tip AS (
  UPDATE tips t
  SET state = CASE WHEN t.tippee_id = a.account_id THEN 'claimed'::tip_state
                   WHEN t.tipper_id = a.account_id THEN 'canceled'::tip_state
                   END
  FROM accounts a WHERE user_id = $1 AND tip_id = $2 AND state = 'created'::tip_state
  AND (t.tippee_id = a.account_id OR t.tipper_id = a.account_id)
  RETURNING *
)
UPDATE users
SET balance = balance + (SELECT amount FROM tip)
WHERE user_id = $1
RETURNING balance
-- COMMIT;



drop function if exists accountInsertOrSelect (text, text, text);
-- uniqid, provider, name
CREATE FUNCTION accountInsertOrSelect (text, text, text)
RETURNS int
AS $$
DECLARE _id int;
BEGIN
LOOP
  SELECT account_id INTO _id FROM accounts
  WHERE uniqid = $1
  AND provider = $2;
  IF found THEN
    RETURN _id;
  END IF;
  BEGIN
    INSERT INTO accounts (uniqid, provider, display_name)
    VALUES ($1, $2, $3)
    RETURNING account_id INTO _id;
    RETURN _id;
  EXCEPTION WHEN unique_violation THEN
  END;
END LOOP;
END
$$ LANGUAGE plpgsql;


drop function if exists accountInsertOrUpdate (text, text, text);
-- uniqid, provider, name
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