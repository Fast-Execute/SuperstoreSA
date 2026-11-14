import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/supabase/server';
import { getSupabaseServiceKey, getSupabaseUrl } from '@/lib/config';

const supabase = createClient(getSupabaseUrl(), getSupabaseServiceKey());

// Orders hold customer names, phone numbers and addresses, so only admins may read them.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { authorized } = await requireAdmin();
  if (!authorized) {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), order_supplier_links(*)')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ order: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to fetch order.' },
      { status: 404 }
    );
  }
}
