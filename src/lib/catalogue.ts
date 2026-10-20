import type { Guitar, GuitarDraft } from '../types';
import { dataUrlToJpegBlob } from '../photos';
import {
  classifyDraftPhotos,
  draftToRow,
  mapGuitarRow,
  type GuitarRow,
} from './mapGuitar';
import { getSupabase, PHOTO_BUCKET, SIGNED_URL_TTL_SECONDS } from './supabase';

function throwIfError(
  error: { message: string; code?: string } | null,
  fallback: string,
): void {
  if (!error) return;
  if (error.code === 'PGRST205') {
    throw new Error(
      'The guitars table is not in this Supabase project yet. Paste supabase/migrations/20260919120000_guitars_and_photos.sql into the SQL editor and run it, then run supabase/migrations/20261018120000_inventory_guitars_and_amps.sql.',
    );
  }
  if (
    error.code === 'PGRST204' ||
    /schema cache/i.test(error.message) ||
    /column .* does not exist/i.test(error.message)
  ) {
    throw new Error(
      'The catalogue is missing inventory columns. Paste supabase/migrations/20261018120000_inventory_guitars_and_amps.sql into the Supabase SQL editor and run it, then reload.',
    );
  }
  throw new Error(error.message || fallback);
}

async function signPhotoPaths(paths: string[]): Promise<string[]> {
  if (paths.length === 0) return [];
  const { data, error } = await getSupabase()
    .storage.from(PHOTO_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  throwIfError(error, 'Could not load guitar photos.');
  return (data ?? []).map((item, index) => item.signedUrl || paths[index]);
}

async function hydrate(row: GuitarRow): Promise<Guitar> {
  const paths = row.photos ?? [];
  const urls = await signPhotoPaths(paths);
  return mapGuitarRow(row, urls);
}

async function uploadDataUrl(userId: string, guitarId: string, dataUrl: string): Promise<string> {
  const blob = await dataUrlToJpegBlob(dataUrl);
  const path = `${userId}/${guitarId}/${crypto.randomUUID()}.jpg`;
  const { error } = await getSupabase().storage.from(PHOTO_BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
    cacheControl: '3600',
  });
  throwIfError(error, 'Could not upload a photo.');
  return path;
}

async function removePhotoPaths(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await getSupabase().storage.from(PHOTO_BUCKET).remove(paths);
  throwIfError(error, 'Could not remove a photo.');
}

async function persistPhotoPlan(
  userId: string,
  guitarId: string,
  draftPhotos: string[],
  existing?: Guitar,
): Promise<string[]> {
  const plan = classifyDraftPhotos(draftPhotos, existing);
  const nextPaths: string[] = [];
  for (const item of plan) {
    if (item.type === 'keep') nextPaths.push(item.path);
    else nextPaths.push(await uploadDataUrl(userId, guitarId, item.dataUrl));
  }

  const previous = existing?.photoPaths ?? [];
  const removed = previous.filter((path) => !nextPaths.includes(path));
  await removePhotoPaths(removed);
  return nextPaths;
}

export async function listGuitars(): Promise<Guitar[]> {
  const { data, error } = await getSupabase()
    .from('guitars')
    .select('*')
    .order('created_at', { ascending: false });
  throwIfError(error, 'Could not load the catalogue.');
  const rows = (data ?? []) as GuitarRow[];
  return Promise.all(rows.map(hydrate));
}

export async function createGuitar(
  userId: string,
  draft: GuitarDraft,
  id?: string,
): Promise<Guitar> {
  const guitarId = id ?? crypto.randomUUID();
  const photoPaths = await persistPhotoPlan(userId, guitarId, draft.photos);
  const row = draftToRow(draft, userId, guitarId, photoPaths);
  const { data, error } = await getSupabase().from('guitars').insert(row).select('*').single();
  if (error) {
    await removePhotoPaths(photoPaths);
    throwIfError(error, 'Could not save that item.');
  }
  return hydrate(data as GuitarRow);
}

export async function saveGuitar(
  userId: string,
  existing: Guitar,
  draft: GuitarDraft,
): Promise<Guitar> {
  const photoPaths = await persistPhotoPlan(userId, existing.id, draft.photos, existing);
  const row = draftToRow(draft, userId, existing.id, photoPaths);
  const { data, error } = await getSupabase()
    .from('guitars')
    .update({
      name: row.name,
      make: row.make,
      model: row.model,
      year: row.year,
      serial_number: row.serial_number,
      item_kind: row.item_kind,
      type: row.type,
      colour: row.colour,
      strings: row.strings,
      pickup_config: row.pickup_config,
      purchase_date: row.purchase_date,
      purchase_price: row.purchase_price,
      estimated_value: row.estimated_value,
      condition_notes: row.condition_notes,
      notes: row.notes,
      photos: row.photos,
      status: row.status,
      list_price: row.list_price,
      floor_price: row.floor_price,
      value_range: row.value_range,
      insurance_low: row.insurance_low,
      insurance_high: row.insurance_high,
      insurance_value: row.insurance_value,
      insurance_basis: row.insurance_basis,
      insurance_confidence: row.insurance_confidence,
      quantity: row.quantity,
      details: row.details,
      sold_date: row.sold_date,
      sold_price: row.sold_price,
    })
    .eq('id', existing.id)
    .select('*')
    .single();
  throwIfError(error, 'Could not update that item.');
  return hydrate(data as GuitarRow);
}

export async function removeGuitar(guitar: Guitar): Promise<void> {
  const { error } = await getSupabase().from('guitars').delete().eq('id', guitar.id);
  throwIfError(error, 'Could not delete that item.');
  await removePhotoPaths(guitar.photoPaths);
}

export async function importGuitar(userId: string, guitar: Guitar): Promise<void> {
  const { data: existing, error: lookupError } = await getSupabase()
    .from('guitars')
    .select('id')
    .eq('id', guitar.id)
    .maybeSingle();
  throwIfError(lookupError, 'Could not check the cloud catalogue.');
  if (existing) return;

  await createGuitar(userId, draftFromGuitar(guitar), guitar.id);
}

function draftFromGuitar(guitar: Guitar): GuitarDraft {
  return {
    name: guitar.name ?? '',
    make: guitar.make,
    model: guitar.model,
    year: guitar.year,
    serialNumber: guitar.serialNumber,
    itemKind: guitar.itemKind ?? 'guitar',
    type: guitar.type,
    colour: guitar.colour,
    strings: guitar.strings ?? (guitar.itemKind === 'amp' ? null : 6),
    pickupConfig: guitar.pickupConfig ?? '',
    purchaseDate: guitar.purchaseDate,
    purchasePrice: guitar.purchasePrice,
    estimatedValue: guitar.estimatedValue,
    conditionNotes: guitar.conditionNotes,
    notes: guitar.notes,
    photos: guitar.photos,
    status: guitar.status ?? 'keeping',
    listPrice: guitar.listPrice ?? null,
    floorPrice: guitar.floorPrice ?? null,
    valueRange: guitar.valueRange ?? '',
    insuranceLow: guitar.insuranceLow ?? null,
    insuranceHigh: guitar.insuranceHigh ?? null,
    insuranceValue: guitar.insuranceValue ?? '',
    insuranceBasis: guitar.insuranceBasis ?? '',
    insuranceConfidence: guitar.insuranceConfidence ?? '',
    quantity: guitar.quantity ?? 1,
    details: guitar.details ?? '',
    soldDate: guitar.soldDate ?? '',
    soldPrice: guitar.soldPrice ?? null,
  };
}

/** Insert inventory rows with no photos. One request so a failure does not leave a partial import. */
export async function importInventory(userId: string, drafts: GuitarDraft[]): Promise<number> {
  if (drafts.length === 0) return 0;
  const rows = drafts.map((draft) => draftToRow(draft, userId, crypto.randomUUID(), []));
  const { error } = await getSupabase().from('guitars').insert(rows);
  throwIfError(error, 'Could not import the inventory.');
  return rows.length;
}
