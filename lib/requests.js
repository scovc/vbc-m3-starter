import { createClient } from "@supabase/supabase-js";

// Requests are stored in the "requests" table in Supabase, so every server
// instance (on a laptop or on Netlify) reads and writes the same data.
// Table setup and seed data: supabase/setup.sql.

const TABLE = "requests";
const COLUMNS = "id, created_at, requester_name, location, description, priority, status";

// Created on first use and reused after that. Reads the keys at request time
// so a missing key gives a clear error in the logs instead of a build failure.
function getClient() {
  if (!globalThis.__supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "SUPABASE_URL and SUPABASE_ANON_KEY must be set (in .env.local locally, or in Netlify's environment variables)."
      );
    }
    globalThis.__supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return globalThis.__supabase;
}

// Turns a Supabase error into a thrown Error so the route's try/catch returns
// a clean 500 and logs what actually went wrong.
function check({ data, error }, action) {
  if (error) {
    throw new Error(`Supabase could not ${action}: ${error.message}`);
  }
  return data;
}

// Returns every request, newest first.
export async function getAllRequests() {
  const result = await getClient()
    .from(TABLE)
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  return check(result, "load requests");
}

// Saves a new request with status "New" and returns it. The database assigns
// the id and created_at.
export async function createRequest({ requester_name, location, description, priority }) {
  const result = await getClient()
    .from(TABLE)
    .insert({ requester_name, location, description, priority, status: "New" })
    .select(COLUMNS)
    .single();
  return check(result, "save the request");
}

// Updates one request's status. Returns the updated request, or null if no
// request has that id.
export async function updateRequestStatus(id, status) {
  const result = await getClient()
    .from(TABLE)
    .update({ status })
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle();
  return check(result, "update the request");
}
