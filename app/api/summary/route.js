import { getAllRequests } from "../../../lib/requests";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const requests = await getAllRequests();

    const open = requests.filter((r) => r.status !== "Complete");
    const open_requests = open.length;
    const urgent_open = open.filter((r) => r.priority === "Urgent").length;

    // "This month" = the month of the most recent request in the data (not today's month).
    let completed_this_month = 0;
    if (requests.length > 0) {
      const latest = new Date(
        Math.max(...requests.map((r) => new Date(r.created_at).getTime()))
      );
      const year = latest.getUTCFullYear();
      const month = latest.getUTCMonth();

      completed_this_month = requests.filter((r) => {
        const created = new Date(r.created_at);
        return (
          r.status === "Complete" &&
          created.getUTCFullYear() === year &&
          created.getUTCMonth() === month
        );
      }).length;
    }

    return Response.json(
      { open_requests, urgent_open, completed_this_month },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/summary failed:", error);
    return Response.json(
      { error: "Could not load the summary. Please try again." },
      { status: 500 }
    );
  }
}
