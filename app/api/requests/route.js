import { getAllRequests, createRequest } from "../../../lib/requests";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const requests = await getAllRequests();
    return Response.json({ requests }, { status: 200 });
  } catch (error) {
    console.error("GET /api/requests failed:", error);
    return Response.json(
      { error: "Could not load requests. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "The request body must be valid JSON." },
        { status: 400 }
      );
    }

    const clean = (value) => (typeof value === "string" ? value.trim() : "");
    const fields = {
      requester_name: clean(body?.requester_name),
      location: clean(body?.location),
      description: clean(body?.description),
      priority: clean(body?.priority),
    };

    const error = validateNewRequest(fields);
    if (error) {
      return Response.json({ error }, { status: 400 });
    }

    const saved = await createRequest(fields);

    return Response.json({ request: saved }, { status: 201 });
  } catch (error) {
    console.error("POST /api/requests failed:", error);
    return Response.json(
      { error: "Could not save the request. Please try again." },
      { status: 500 }
    );
  }
}

const LOCATIONS = ["Minneapolis", "Chicago", "Denver", "Austin"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const MAX_DESCRIPTION_LENGTH = 500;

// Returns a plain-English error message naming the field to fix, or null if
// everything is valid. Expects values that are already trimmed.
function validateNewRequest({ requester_name, location, description, priority }) {
  if (!requester_name) return "Requester name is required.";
  if (!location) return "Location is required.";
  if (!description) return "Description is required.";
  if (!priority) return "Priority is required.";

  if (!LOCATIONS.includes(location)) {
    return "Location must be Minneapolis, Chicago, Denver, or Austin.";
  }
  if (!PRIORITIES.includes(priority)) {
    return "Priority must be Low, Medium, High, or Urgent.";
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer (it is currently ${description.length}).`;
  }

  return null;
}
