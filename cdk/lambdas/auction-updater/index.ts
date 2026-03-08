import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getSupabaseClient } from '../shared/supabase-client';
import { publishToDevice } from '../shared/mqtt-publisher';
import { buildAuctionUpdateSchema } from '../shared/display-schema-mapper';
import type {
  SupabaseWebhookPayload,
  DeviceRow,
  DeviceSessionRow,
  AuctionRow,
  GemRow,
} from '../shared/types';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const body = JSON.parse(event.body || '{}') as SupabaseWebhookPayload;
    console.log(`Webhook: type=${body.type}, table=${body.table}`);

    const supabase = await getSupabaseClient();

    // Determine auction_id from the changed record
    let auctionId: string | null = null;
    const record = body.record || body.old_record;

    if (!record) {
      return { statusCode: 200, body: JSON.stringify({ message: 'No record data' }) };
    }

    if (body.table === 'auctions') {
      auctionId = record.id as string;
    } else if (body.table === 'gems') {
      auctionId = record.auction_id as string;
    } else if (body.table === 'bids') {
      // Look up auction_id from the gem
      const gemId = record.gem_id as string;
      const { data: gem } = await supabase
        .from('gems')
        .select('auction_id')
        .eq('id', gemId)
        .single();
      auctionId = gem?.auction_id ?? null;
    }

    if (!auctionId) {
      return { statusCode: 200, body: JSON.stringify({ message: 'Could not determine auction' }) };
    }

    // Find all active device sessions for this auction
    const { data: sessions } = await supabase
      .from('device_sessions')
      .select('*')
      .eq('auction_id', auctionId)
      .eq('status', 'active');

    if (!sessions || sessions.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ message: 'No active device sessions' }) };
    }

    // Get auction details
    const { data: auction } = await supabase
      .from('auctions')
      .select('id, name, status, auction_type, auction_start, auction_end')
      .eq('id', auctionId)
      .single();

    if (!auction) {
      return { statusCode: 200, body: JSON.stringify({ message: 'Auction not found' }) };
    }

    const auctionRow = auction as AuctionRow;

    // Get auction items
    const { data: gems } = await supabase
      .from('gems')
      .select('id, name, description, starting_price, current_price, min_bid_increment, status, end_time, round_end_time, auction_id')
      .eq('auction_id', auctionId)
      .order('start_time', { ascending: true });

    const gemRows = (gems || []) as GemRow[];

    // Get unique device_ids from sessions
    const deviceIds = [...new Set((sessions as DeviceSessionRow[]).map(s => s.device_id))];

    // Get device info for all devices
    const { data: devices } = await supabase
      .from('devices')
      .select('*')
      .in('device_id', deviceIds);

    const deviceMap = new Map((devices || []).map((d: DeviceRow) => [d.device_id, d]));

    // Publish update to each device
    const publishPromises = deviceIds.map(async (deviceId) => {
      const device = deviceMap.get(deviceId);
      if (!device) return;

      const updateSchema = buildAuctionUpdateSchema(
        'auction_items',
        'success',
        device,
        auctionRow,
        gemRows,
        gemRows.length,
      );

      await publishToDevice(deviceId, 'auction/update', updateSchema);
    });

    await Promise.all(publishPromises);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Updated ${deviceIds.length} device(s)`,
        auction_id: auctionId,
      }),
    };
  } catch (error) {
    console.error('Auction updater error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
