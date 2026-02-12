// Legacy dev API stub (removed from production)

async function removed() {
  return new Response(JSON.stringify({ error: 'Endpoint removed from production' }), { status: 404 });
}

export async function GET() { return removed(); }
export async function POST() { return removed(); }
export async function PUT() { return removed(); }
export async function DELETE() { return removed(); }
