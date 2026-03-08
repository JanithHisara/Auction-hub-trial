import { getSupabaseClient } from '../shared/supabase-client';
import { publishToDevice } from '../shared/mqtt-publisher';
import {
  buildNfcSuccessSchema,
  buildNfcErrorSchema,
} from '../shared/display-schema-mapper';
import type {
  NfcScanPayload,
  DeviceRow,
  NfcCardRow,
  UserRow,
  AuctionRow,
  GemRow,
} from '../shared/types';

export async function handler(event: NfcScanPayload): Promise<void> {
  const { device_id, nfc_uid } = event;
  console.log(`NFC scan: device=${device_id}, nfc_uid=${nfc_uid}`);

  const supabase = await getSupabaseClient();

  // 1. Verify device exists and is active
  const { data: device, error: deviceError } = await supabase
    .from('devices')
    .select('*')
    .eq('device_id', device_id)
    .single();

  if (deviceError || !device) {
    console.error('Device not found:', device_id);
    await publishToDevice(device_id, 'state', buildNfcErrorSchema(
      null, nfc_uid, 1, 'Device Not Registered', 'This device is not registered in the system',
    ));
    return;
  }

  const deviceRow = device as DeviceRow;

  if (deviceRow.status !== 'active') {
    await publishToDevice(device_id, 'state', buildNfcErrorSchema(
      deviceRow, nfc_uid, 2, 'Device Inactive', 'This device is currently inactive',
    ));
    return;
  }

  // 2. Look up NFC card mapping
  const { data: nfcCards, error: nfcError } = await supabase
    .from('nfc_cards')
    .select('*')
    .eq('nfc_uid', nfc_uid)
    .eq('is_active', true);

  if (nfcError || !nfcCards || nfcCards.length === 0) {
    await publishToDevice(device_id, 'state', buildNfcErrorSchema(
      deviceRow, nfc_uid, 3, 'Card Not Recognized', 'This NFC card is not registered',
    ));
    return;
  }

  // Pick the card with an assigned auction; fall back to the first active card
  const nfcCard = (nfcCards as NfcCardRow[]).find(c => c.auction_id) || nfcCards[0] as NfcCardRow;

  if (!nfcCard.auction_id) {
    await publishToDevice(device_id, 'state', buildNfcErrorSchema(
      deviceRow, nfc_uid, 4, 'No Auction Assigned', 'This card has no auction assigned. Contact an administrator.',
    ));
    return;
  }

  // 3. Get user details
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, role, display_name, phone')
    .eq('id', nfcCard.user_id)
    .single();

  if (userError || !user) {
    await publishToDevice(device_id, 'state', buildNfcErrorSchema(
      deviceRow, nfc_uid, 5, 'User Not Found', 'The user associated with this card was not found',
    ));
    return;
  }

  const userRow = user as UserRow;

  // 4. Get auction details
  const { data: auction, error: auctionError } = await supabase
    .from('auctions')
    .select('id, name, status, auction_type, auction_start, auction_end')
    .eq('id', nfcCard.auction_id)
    .single();

  if (auctionError || !auction) {
    await publishToDevice(device_id, 'state', buildNfcErrorSchema(
      deviceRow, nfc_uid, 6, 'Auction Not Found', 'The assigned auction does not exist',
    ));
    return;
  }

  const auctionRow = auction as AuctionRow;

  if (auctionRow.status !== 'live') {
    await publishToDevice(device_id, 'state', buildNfcErrorSchema(
      deviceRow, nfc_uid, 7, 'Auction Not Live',
      `Auction "${auctionRow.name}" is currently ${auctionRow.status}`,
    ));
    return;
  }

  // 5. Verify auction registration
  const { data: registration } = await supabase
    .from('auction_registrations')
    .select('id, approval_status')
    .eq('auction_id', nfcCard.auction_id)
    .eq('user_id', nfcCard.user_id)
    .single();

  if (!registration) {
    await publishToDevice(device_id, 'state', buildNfcErrorSchema(
      deviceRow, nfc_uid, 8, 'Not Registered', 'You are not registered for this auction',
    ));
    return;
  }

  if (registration.approval_status !== 'approved') {
    await publishToDevice(device_id, 'state', buildNfcErrorSchema(
      deviceRow, nfc_uid, 9, 'Registration Pending',
      `Your registration is ${registration.approval_status}`,
    ));
    return;
  }

  // 6. Get auction items
  const { data: gems } = await supabase
    .from('gems')
    .select('id, name, description, starting_price, current_price, min_bid_increment, status, end_time, round_end_time, auction_id')
    .eq('auction_id', nfcCard.auction_id)
    .order('start_time', { ascending: true });

  const gemRows = (gems || []) as GemRow[];

  // 7. Get registration count
  const { count: registeredCount } = await supabase
    .from('auction_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('auction_id', nfcCard.auction_id)
    .eq('approval_status', 'approved');

  // 8. Create/update device session
  // End any existing active session for this device
  await supabase
    .from('device_sessions')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('device_id', device_id)
    .eq('status', 'active');

  await supabase
    .from('device_sessions')
    .insert({
      device_id,
      nfc_uid,
      user_id: nfcCard.user_id,
      auction_id: nfcCard.auction_id,
      status: 'active',
    });

  // Update device last_seen_at
  await supabase
    .from('devices')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('device_id', device_id);

  // 9. Build and publish success state
  const displayState = buildNfcSuccessSchema(
    deviceRow,
    userRow,
    nfc_uid,
    auctionRow,
    gemRows,
    gemRows.length,
    registeredCount || 0,
  );

  await publishToDevice(device_id, 'state', displayState);
  console.log(`NFC scan success: user=${userRow.email}, auction=${auctionRow.name}`);
}
