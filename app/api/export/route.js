import { getAllRequests } from "../../../lib/requests";

export const dynamic = "force-dynamic";

const COLUMNS = [
  "id",
  "created_at",
  "requester_name",
  "location",
  "description",
  "priority",
  "status",
];

// Formats one value as a CSV field.
function toCsvField(value) {
  let text = String(value ?? "");

  // A value starting with = + - or @ can run as a formula when opened in
  // Excel or Google Sheets. Prefixing a ' makes the spreadsheet show it as text.
  if (/^[=+\-@]/.test(text)) {
    text = "'" + text;
  }

  // Quote the field if it contains a comma, quote or line break; double any quotes.
  if (/[",\r\n]/.test(text)) {
    text = '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

export async function GET() {
  try {
    const requests = await getAllRequests(); // already newest first

    const lines = [
      COLUMNS.join(","),
      ...requests.map((r) => COLUMNS.map((col) => toCsvField(r[col])).join(",")),
    ];
    const csv = lines.join("\r\n") + "\r\n";

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="morrowlane-requests.csv"',
      },
    });
  } catch (error) {
    console.error("GET /api/export failed:", error);
    return Response.json(
      { error: "Could not export requests. Please try again." },
      { status: 500 }
    );
  }
}
