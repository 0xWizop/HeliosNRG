import { NextRequest, NextResponse } from 'next/server';
import { getAssumptionSets, saveAssumptionSet, getDefaultAssumptionSet } from '@/lib/db/sqlite';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const defaultOnly = searchParams.get('default') === 'true';
    
    if (defaultOnly) {
      const defaultSet = getDefaultAssumptionSet();
      return NextResponse.json({ assumptionSet: defaultSet });
    }
    
    const assumptionSets = getAssumptionSets();
    return NextResponse.json({ assumptionSets });
  } catch (error) {
    console.error('Error fetching assumptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assumptions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    saveAssumptionSet(body);
    return NextResponse.json({ success: true, id: body.id });
  } catch (error) {
    console.error('Error saving assumption set:', error);
    return NextResponse.json(
      { error: 'Failed to save assumption set' },
      { status: 500 }
    );
  }
}
