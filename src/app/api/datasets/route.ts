import { NextRequest, NextResponse } from 'next/server';
import { getDatasets, saveDataset } from '@/lib/db/sqlite';

export async function GET() {
  try {
    const datasets = getDatasets();
    return NextResponse.json({ datasets });
  } catch (error) {
    console.error('Error fetching datasets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch datasets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    saveDataset(body);
    return NextResponse.json({ success: true, id: body.id });
  } catch (error) {
    console.error('Error saving dataset:', error);
    return NextResponse.json(
      { error: 'Failed to save dataset' },
      { status: 500 }
    );
  }
}
