import { NextRequest, NextResponse } from 'next/server';
import { getScenarios, saveScenario } from '@/lib/db/sqlite';

export async function GET() {
  try {
    const scenarios = getScenarios();
    return NextResponse.json({ scenarios });
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenarios' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    saveScenario(body);
    return NextResponse.json({ success: true, id: body.id });
  } catch (error) {
    console.error('Error saving scenario:', error);
    return NextResponse.json(
      { error: 'Failed to save scenario' },
      { status: 500 }
    );
  }
}
