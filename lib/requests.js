import { readFile } from "fs/promises";
import path from "path";

const SEED_PATH = path.join(process.cwd(), "data", "seed-requests.csv");

// Parse CSV text into an array of row arrays.
// Handles quoted fields containing commas, newlines, and escaped quotes ("").
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((value) => value.trim() !== ""));
}

// Load the seed requests and assign ids in chronological order (oldest = 1).
async function loadSeedRequests() {
  const text = await readFile(SEED_PATH, "utf8");
  const [header, ...records] = parseCsv(text);
  const columns = header.map((name) => name.trim());

  return records
    .map((values) =>
      Object.fromEntries(columns.map((col, i) => [col, (values[i] ?? "").trim()]))
    )
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map((record, index) => ({
      id: index + 1,
      created_at: record.created_at,
      requester_name: record.requester_name,
      location: record.location,
      description: record.description,
      priority: record.priority,
      status: record.status,
    }));
}

// In-memory store: seeded from the CSV the first time it's needed, then new
// requests are added to it. Kept on globalThis so every API route shares the
// same list. It lives only as long as the server process does.
async function getStore() {
  if (!globalThis.__requestStore) {
    globalThis.__requestStore = loadSeedRequests();
  }
  return globalThis.__requestStore;
}

// Returns every request, newest first.
export async function getAllRequests() {
  const requests = await getStore();
  return [...requests].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
}

// Saves a new request with status "New" and returns it.
export async function createRequest({ requester_name, location, description, priority }) {
  const requests = await getStore();
  const nextId = requests.reduce((max, r) => Math.max(max, r.id), 0) + 1;

  const request = {
    id: nextId,
    created_at: new Date().toISOString(),
    requester_name,
    location,
    description,
    priority,
    status: "New",
  };

  requests.push(request);
  return request;
}

// Updates one request's status. Returns the updated request, or null if no
// request has that id.
export async function updateRequestStatus(id, status) {
  const requests = await getStore();
  const request = requests.find((r) => r.id === id);
  if (!request) return null;

  request.status = status;
  return request;
}
