import "dotenv/config";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const apply = process.argv.includes("--apply");
const databaseUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!databaseUrl || !supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "DATABASE_URL, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY are required in server/.env.",
  );
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function listAuthUsers() {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) return users;
  }
}

async function main() {
  const { rows: profiles } = await pool.query(
    `select id, email, password_hash, role, is_archived, auth_user_id
       from profiles
      order by created_at, id`,
  );
  const authUsers = await listAuthUsers();
  const authByEmail = new Map(
    authUsers
      .filter((user) => user.email)
      .map((user) => [user.email.toLowerCase(), user]),
  );

  const summary = {
    profiles: profiles.length,
    alreadyMapped: 0,
    existingAuthUsers: 0,
    usersToCreate: 0,
    archivedUsers: 0,
    unsupportedPasswordHashes: 0,
  };

  for (const profile of profiles) {
    if (profile.auth_user_id) {
      summary.alreadyMapped += 1;
      continue;
    }

    const normalizedEmail = profile.email.trim().toLowerCase();
    if (!/^\$2[aby]\$\d{2}\$/.test(profile.password_hash)) {
      summary.unsupportedPasswordHashes += 1;
      continue;
    }
    let authUser = authByEmail.get(normalizedEmail);
    if (authUser) summary.existingAuthUsers += 1;
    else summary.usersToCreate += 1;
    if (profile.is_archived) summary.archivedUsers += 1;

    if (!apply) continue;

    if (!authUser) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password_hash: profile.password_hash,
        email_confirm: true,
        app_metadata: { legacy_profile_id: profile.id },
      });
      if (error) throw new Error(`Could not migrate profile ${profile.id}: ${error.message}`);
      authUser = data.user;
      authByEmail.set(normalizedEmail, authUser);
    }

    if (profile.is_archived) {
      const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
        ban_duration: "876000h",
      });
      if (error) throw new Error(`Could not disable archived profile ${profile.id}: ${error.message}`);
    }

    const result = await pool.query(
      `update profiles
          set auth_user_id = $1, updated_at = now()
        where id = $2 and auth_user_id is null`,
      [authUser.id, profile.id],
    );
    if (result.rowCount !== 1) {
      throw new Error(`Profile ${profile.id} was concurrently changed; migration stopped.`);
    }
  }

  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", ...summary }, null, 2));
  if (summary.unsupportedPasswordHashes) {
    console.log(
      `${summary.unsupportedPasswordHashes} profile(s) were skipped because their password hash is not supported; use a controlled password-reset flow.`,
    );
  }
  if (!apply) console.log("No accounts or profile rows were changed. Re-run with --apply after review.");
}

try {
  await main();
} finally {
  await pool.end();
}
