// ============================================
// SUPABASE CLIENT — Com fallback para Mock Local
// ============================================
// Para rodar local sem Supabase: defina VITE_MOCK_MODE=true no .env.local
// Para usar Supabase real: remova VITE_MOCK_MODE ou defina como false

const useMock = import.meta.env.VITE_MOCK_MODE === 'true';

let supabase;

if (useMock) {
  const mock = await import('./mockSupabase.js');
  supabase = mock.supabase;
  console.log('%c[MOCK MODE] Rodando com dados locais (localStorage)', 'color: #F59E0B; font-weight: bold;');
} else {
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórios no .env.local');
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export { supabase };
