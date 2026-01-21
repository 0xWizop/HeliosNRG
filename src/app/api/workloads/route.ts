import { NextRequest, NextResponse } from 'next/server';
import { getAllWorkloads, getWorkloadsByDataset, saveNormalizedWorkloads } from '@/lib/db/sqlite';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get('datasetId');
    
    const workloads = datasetId 
      ? getWorkloadsByDataset(datasetId)
      : getAllWorkloads();
    
    return NextResponse.json({ workloads });
  } catch (error) {
    console.error('Error fetching workloads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workloads' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workloads } = body;
    
    if (!Array.isArray(workloads)) {
      return NextResponse.json(
        { error: 'workloads must be an array' },
        { status: 400 }
      );
    }
    
    saveNormalizedWorkloads(workloads);
    return NextResponse.json({ success: true, count: workloads.length });
  } catch (error) {
    console.error('Error saving workloads:', error);
    return NextResponse.json(
      { error: 'Failed to save workloads' },
      { status: 500 }
    );
  }
}
