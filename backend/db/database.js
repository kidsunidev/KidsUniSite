/**
 * Kids University — Supabase Database Client
 * Replaces NeDB with Supabase (PostgreSQL)
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL  = process.env.SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

const db = {
  find: async (table, filters = {}, opts = {}) => {
    let q = supabase.from(table).select(opts.select || '*');
    for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
    if (opts.order) q = q.order(opts.order, { ascending: opts.asc ?? false });
    if (opts.limit) q = q.limit(opts.limit);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  findOne: async (table, filters = {}, opts = {}) => {
    let q = supabase.from(table).select(opts.select || '*');
    for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    return data;
  },

  insert: async (table, row) => {
    const { data, error } = await supabase.from(table).insert(row).select().single();
    if (error) throw error;
    return data;
  },

  update: async (table, filters = {}, updates = {}) => {
    let q = supabase.from(table).update(updates);
    for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
    const { data, error } = await q.select().single();
    if (error) throw error;
    return data;
  },

  upsert: async (table, row, conflictCol) => {
    const { data, error } = await supabase
      .from(table).upsert(row, { onConflict: conflictCol }).select().single();
    if (error) throw error;
    return data;
  },

  delete: async (table, filters = {}) => {
    let q = supabase.from(table).delete();
    for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
    const { error } = await q;
    if (error) throw error;
    return true;
  },

  count: async (table, filters = {}) => {
    let q = supabase.from(table).select('*', { count: 'exact', head: true });
    for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
    const { count, error } = await q;
    if (error) throw error;
    return count;
  },

  client: supabase,
};

async function initDB() {
  console.log('🔌 Connecting to Supabase…');
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    const count = await db.count('users');
    console.log(`✅ Supabase connected — ${count} users in database\n`);
  } catch (err) {
    console.error('❌ Supabase connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = { db, initDB };
