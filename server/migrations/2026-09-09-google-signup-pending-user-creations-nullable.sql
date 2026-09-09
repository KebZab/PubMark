-- Self-service "Sign in with Google" signups (POST /api/auth/google/register)
-- insert into pending_user_creations with no authenticated admin behind
-- them, unlike POST /api/users which always has req.auth.sub.
ALTER TABLE pending_user_creations ALTER COLUMN created_by DROP NOT NULL;
