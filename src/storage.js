import { supabase } from './supabaseClient';

// Drop-in replacement for the local IndexedDB storage.js.
// Same function names/shapes as before (loadRecords/saveRecords) so
// App.jsx's data flow barely changes — only the underlying persistence
// mechanism is different.

/**
 * Load all QA/SA records for the current logged-in user.
 * Returns an array of record objects, or [] if none / not logged in.
 */
export async function loadRecords() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return [];

  const { data, error } = await supabase
    .from('records')
    .select('data')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to load records from Supabase', error);
    return [];
  }
  return (data || []).map((row) => row.data);
}

/**
 * Persist the full records array. Because Supabase is row-based (not a
 * single blob like IndexedDB), this diffs against what's already stored:
 * upserts everything present, deletes anything no longer in the array.
 */
export async function saveRecords(records) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return;
  const userId = userData.user.id;

  try {
    // Fetch existing IDs to know what to delete.
    const { data: existing } = await supabase
      .from('records')
      .select('id')
      .eq('user_id', userId);
    const existingIds = new Set((existing || []).map((r) => r.id));
    const currentIds = new Set(records.map((r) => r.id));

    // Upsert all current records.
    const rows = records.map((r) => ({
      id: r.id,
      user_id: userId,
      module: r.module,
      data: r,
    }));
    if (rows.length > 0) {
      const { error: upsertError } = await supabase.from('records').upsert(rows);
      if (upsertError) console.error('Failed to save records to Supabase', upsertError);
    }

    // Delete records that were removed locally.
    const toDelete = [...existingIds].filter((id) => !currentIds.has(id));
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('records')
        .delete()
        .in('id', toDelete)
        .eq('user_id', userId);
      if (deleteError) console.error('Failed to delete removed records from Supabase', deleteError);
    }
  } catch (err) {
    console.error('saveRecords failed', err);
  }
}

export async function clearRecords() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return;
  await supabase.from('records').delete().eq('user_id', userData.user.id);
}

// --- Plant ID library ---

export async function openPlantLibrary() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return [];

  const { data, error } = await supabase
    .from('plant_library')
    .select('id, date, image_src, result')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load plant library from Supabase', error);
    return [];
  }
  return (data || []).map((row) => ({
    id: row.id,
    date: row.date,
    imageSrc: row.image_src,
    result: row.result,
  }));
}

export async function savePlantLibrary(lib) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return;
  const userId = userData.user.id;

  try {
    const { data: existing } = await supabase
      .from('plant_library')
      .select('id')
      .eq('user_id', userId);
    const existingIds = new Set((existing || []).map((r) => r.id));
    const currentIds = new Set(lib.map((e) => e.id));

    const rows = lib.map((e) => ({
      id: e.id,
      user_id: userId,
      date: e.date,
      image_src: e.imageSrc,
      result: e.result,
    }));
    if (rows.length > 0) {
      const { error: upsertError } = await supabase.from('plant_library').upsert(rows);
      if (upsertError) console.error('Failed to save plant library to Supabase', upsertError);
    }

    const toDelete = [...existingIds].filter((id) => !currentIds.has(id));
    if (toDelete.length > 0) {
      await supabase.from('plant_library').delete().in('id', toDelete).eq('user_id', userId);
    }
  } catch (err) {
    console.error('savePlantLibrary failed', err);
  }
}
