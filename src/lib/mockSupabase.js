// ============================================
// MOCK SUPABASE CLIENT — Tabelas Vazias (localStorage)
// ============================================
// Simula o Supabase client para rodar localmente sem backend.
// Dados persistidos no localStorage.

const STORAGE_KEY = 'logcontrol-mock-db';
const SESSION_KEY = 'logcontrol-mock-session';
const VERSION_KEY = 'logcontrol-mock-version';
const MOCK_VERSION = 2; // Incrementar quando o schema mudar para resetar dados antigos

// ---- Schema das tabelas (todas iniciam vazias) ----
function getDefaultTables() {
  return {
    users: [],
    produtos: [],
    fornecedores: [],
    locais: [],
    movimentacoes: [],
    notificacoes: [],
    logs: [],
    inventarios: [],
    inventario_itens: [],
  };
}

// ---- Persistência no localStorage ----
function loadDB() {
  // Verifica versão — se mudou, reseta tudo (limpa dados antigos incompatíveis)
  const storedVersion = localStorage.getItem(VERSION_KEY);
  if (storedVersion !== String(MOCK_VERSION)) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.setItem(VERSION_KEY, String(MOCK_VERSION));
    console.log('[MOCK] Versão atualizada — dados resetados');
    return getDefaultTables();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const defaults = getDefaultTables();
      for (const key of Object.keys(defaults)) {
        if (!parsed[key]) parsed[key] = [];
      }
      return parsed;
    }
  } catch { /* corrupted, reset */ }
  return getDefaultTables();
}

function saveDB(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

let db = loadDB();

// ---- Auto-seed: cria admin padrão se não existe nenhum usuário ----
if (db.users.length === 0) {
  const defaultAdmin = {
    id: 'mock-admin-001',
    nome: 'Admin Local',
    email: 'admin@local.dev',
    role: 'ADMIN',
    ativo: true,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
  };
  db.users.push(defaultAdmin);
  saveDB(db);
  console.log('[MOCK] Usuário admin criado: admin@local.dev (senha: qualquer 8+ chars)');
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ---- Session helpers ----
function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSession(session) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

let currentSession = loadSession();

// ---- Auto-login: se não há sessão, cria uma para o admin padrão ----
if (!currentSession && db.users.length > 0) {
  const admin = db.users.find(u => u.role === 'ADMIN') || db.users[0];
  currentSession = {
    access_token: 'mock-token-auto-' + Date.now(),
    refresh_token: 'mock-refresh-auto-' + Date.now(),
    user: {
      id: admin.id,
      email: admin.email,
      user_metadata: { nome: admin.nome },
      created_at: admin.criado_em,
    },
  };
  saveSession(currentSession);
  console.log('[MOCK] Auto-login como:', admin.email);
}

const authListeners = [];

function notifyAuthListeners(event, session) {
  authListeners.forEach(cb => {
    try { cb(event, session); } catch { /* ignore */ }
  });
}

// ---- Resolve foreign key joins ----
function resolveJoins(row, selectStr, tables) {
  if (!selectStr || !selectStr.includes(':')) return row;
  const result = { ...row };
  // Pattern: alias:table(col1, col2, ...)
  const joinRegex = /(\w+):(\w+)\(([^)]+)\)/g;
  let match;
  while ((match = joinRegex.exec(selectStr)) !== null) {
    const [, alias, table, cols] = match;
    const fkCol = alias + '_id';
    const fkValue = row[fkCol];
    if (fkValue && tables[table]) {
      const related = tables[table].find(r => r.id === fkValue);
      if (related) {
        const fields = cols.split(',').map(c => c.trim());
        const picked = {};
        fields.forEach(f => { if (f in related) picked[f] = related[f]; });
        result[alias] = picked;
      } else {
        result[alias] = null;
      }
    } else {
      result[alias] = null;
    }
  }
  return result;
}

// ---- Query Builder (simula a API do Supabase) ----
function createQueryBuilder(tableName) {
  let table = tableName;
  let operation = null; // select, insert, update, delete
  let selectStr = '*';
  let filters = [];
  let orderCols = [];
  let limitVal = null;
  let rangeFrom = null;
  let rangeTo = null;
  let insertData = null;
  let updateData = null;
  let isSingle = false;
  let countOption = null;
  let headOnly = false;

  function applyFilter(rows, f) {
    switch (f.op) {
      case 'eq': return rows.filter(r => r[f.col] === f.val);
      case 'neq': return rows.filter(r => r[f.col] !== f.val);
      case 'gt': return rows.filter(r => r[f.col] > f.val);
      case 'gte': return rows.filter(r => r[f.col] >= f.val);
      case 'lt': return rows.filter(r => r[f.col] < f.val);
      case 'lte': return rows.filter(r => r[f.col] <= f.val);
      case 'ilike': {
        const pattern = f.val.replace(/%/g, '').toLowerCase();
        return rows.filter(r => (r[f.col] || '').toLowerCase().includes(pattern));
      }
      case 'in': return rows.filter(r => f.val.includes(r[f.col]));
      case 'not_is': return rows.filter(r => r[f.col] !== f.val);
      case 'or': {
        // Parse: "col1.op.val,col2.op.val"
        const conditions = f.val.split(',').map(s => s.trim());
        return rows.filter(r => conditions.some(cond => {
          const parts = cond.split('.');
          if (parts.length >= 3) {
            const col = parts[0];
            const op = parts[1];
            const val = parts.slice(2).join('.');
            if (op === 'ilike') {
              const pattern = val.replace(/%/g, '').toLowerCase();
              return (r[col] || '').toLowerCase().includes(pattern);
            }
            if (op === 'eq') return r[col] == val;
          }
          return false;
        }));
      }
      default: return rows;
    }
  }

  const builder = {
    select(str, opts) {
      operation = 'select';
      selectStr = str || '*';
      if (opts?.count) countOption = opts.count;
      if (opts?.head) headOnly = true;
      return builder;
    },
    insert(data) {
      operation = 'insert';
      insertData = Array.isArray(data) ? data : [data];
      return builder;
    },
    update(data) {
      operation = 'update';
      updateData = data;
      return builder;
    },
    delete() {
      operation = 'delete';
      return builder;
    },
    eq(col, val) { filters.push({ op: 'eq', col, val }); return builder; },
    neq(col, val) { filters.push({ op: 'neq', col, val }); return builder; },
    gt(col, val) { filters.push({ op: 'gt', col, val }); return builder; },
    gte(col, val) { filters.push({ op: 'gte', col, val }); return builder; },
    lt(col, val) { filters.push({ op: 'lt', col, val }); return builder; },
    lte(col, val) { filters.push({ op: 'lte', col, val }); return builder; },
    ilike(col, val) { filters.push({ op: 'ilike', col, val }); return builder; },
    in(col, val) { filters.push({ op: 'in', col, val }); return builder; },
    not(col, op, val) { filters.push({ op: 'not_is', col, val }); return builder; },
    or(expr) { filters.push({ op: 'or', val: expr }); return builder; },
    order(col, opts) { orderCols.push({ col, ...opts }); return builder; },
    limit(n) { limitVal = n; return builder; },
    range(from, to) { rangeFrom = from; rangeTo = to; return builder; },
    single() { isSingle = true; return builder; },

    then(resolve, reject) {
      try {
        const result = execute();
        resolve(result);
      } catch (err) {
        if (reject) reject(err);
        else resolve({ data: null, error: err });
      }
    },
  };

  function execute() {
    db = loadDB();

    if (operation === 'select') {
      let rows = [...(db[table] || [])];

      // Apply filters
      for (const f of filters) {
        rows = applyFilter(rows, f);
      }

      const totalCount = countOption ? rows.length : undefined;

      // Apply ordering
      for (const o of [...orderCols].reverse()) {
        const col = o.col;
        const asc = o.ascending !== false;
        rows.sort((a, b) => {
          const av = a[col], bv = b[col];
          if (av == null && bv == null) return 0;
          if (av == null) return o.nullsFirst === false ? 1 : -1;
          if (bv == null) return o.nullsFirst === false ? -1 : 1;
          if (av < bv) return asc ? -1 : 1;
          if (av > bv) return asc ? 1 : -1;
          return 0;
        });
      }

      // Apply range/limit
      if (rangeFrom != null && rangeTo != null) {
        rows = rows.slice(rangeFrom, rangeTo + 1);
      } else if (limitVal) {
        rows = rows.slice(0, limitVal);
      }

      // Resolve joins
      rows = rows.map(r => resolveJoins(r, selectStr, db));

      if (headOnly) {
        return { data: null, error: null, count: totalCount };
      }
      if (isSingle) {
        return { data: rows[0] || null, error: rows[0] ? null : { message: 'No rows found', code: 'PGRST116' }, count: totalCount };
      }
      return { data: rows, error: null, count: totalCount };
    }

    if (operation === 'insert') {
      const inserted = insertData.map(row => ({
        id: row.id || uuid(),
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
        ...row,
      }));
      db[table] = [...(db[table] || []), ...inserted];
      saveDB(db);
      if (isSingle) return { data: inserted[0], error: null };
      return { data: inserted, error: null };
    }

    if (operation === 'update') {
      let rows = [...(db[table] || [])];
      const updated = [];
      rows = rows.map(row => {
        let match = true;
        for (const f of filters) {
          const filtered = applyFilter([row], f);
          if (filtered.length === 0) { match = false; break; }
        }
        if (match) {
          const newRow = { ...row, ...updateData, atualizado_em: new Date().toISOString() };
          updated.push(newRow);
          return newRow;
        }
        return row;
      });
      db[table] = rows;
      saveDB(db);
      if (isSingle) return { data: updated[0] || null, error: null };
      return { data: updated, error: null };
    }

    if (operation === 'delete') {
      let rows = [...(db[table] || [])];
      const remaining = rows.filter(row => {
        for (const f of filters) {
          const filtered = applyFilter([row], f);
          if (filtered.length === 0) return true;
        }
        return false;
      });
      const deleted = rows.length - remaining.length;
      db[table] = remaining;
      saveDB(db);
      return { data: null, error: null, count: deleted };
    }

    return { data: null, error: { message: 'No operation specified' } };
  }

  return builder;
}

// ---- Mock Supabase Client ----
export const supabase = {
  from(tableName) {
    return createQueryBuilder(tableName);
  },

  auth: {
    async signUp({ email, password, options }) {
      db = loadDB();
      const exists = db.users.find(u => u.email === email);
      if (exists) {
        return { data: { user: null, session: null }, error: { message: 'Usuário já existe' } };
      }

      const userId = uuid();
      const user = {
        id: userId,
        email,
        user_metadata: options?.data || {},
        created_at: new Date().toISOString(),
      };

      const session = {
        access_token: 'mock-token-' + uuid(),
        refresh_token: 'mock-refresh-' + uuid(),
        user,
      };

      currentSession = session;
      saveSession(session);
      notifyAuthListeners('SIGNED_IN', session);
      return { data: { user, session }, error: null };
    },

    async signInWithPassword({ email, password }) {
      db = loadDB();
      const userRow = db.users.find(u => u.email === email && u.ativo !== false);
      if (!userRow) {
        return { data: { user: null, session: null }, error: { message: 'Credenciais inválidas' } };
      }

      // In mock mode, accept any password of 8+ chars
      if (!password || password.length < 8) {
        return { data: { user: null, session: null }, error: { message: 'Senha deve ter no mínimo 8 caracteres' } };
      }

      const user = {
        id: userRow.id,
        email: userRow.email,
        user_metadata: { nome: userRow.nome },
        created_at: userRow.criado_em,
      };

      const session = {
        access_token: 'mock-token-' + uuid(),
        refresh_token: 'mock-refresh-' + uuid(),
        user,
      };

      currentSession = session;
      saveSession(session);
      notifyAuthListeners('SIGNED_IN', session);
      return { data: { user, session }, error: null };
    },

    async signOut() {
      currentSession = null;
      saveSession(null);
      notifyAuthListeners('SIGNED_OUT', null);
      return { error: null };
    },

    async getSession() {
      return { data: { session: currentSession }, error: null };
    },

    async getUser() {
      return { data: { user: currentSession?.user || null }, error: null };
    },

    async updateUser({ password }) {
      // Just accept the password update in mock mode
      return { data: { user: currentSession?.user }, error: null };
    },

    onAuthStateChange(callback) {
      authListeners.push(callback);
      // Fire initial event
      if (currentSession) {
        setTimeout(() => callback('INITIAL_SESSION', currentSession), 0);
      }
      return {
        data: {
          subscription: {
            unsubscribe() {
              const idx = authListeners.indexOf(callback);
              if (idx > -1) authListeners.splice(idx, 1);
            },
          },
        },
      };
    },
  },

  storage: {
    from(bucket) {
      return {
        async upload(path, file) {
          // Simulate storage with object URL
          const url = URL.createObjectURL(file);
          return { data: { path }, error: null };
        },
        getPublicUrl(path) {
          return { data: { publicUrl: `https://mock-storage.local/${path}` } };
        },
      };
    },
  },

  async rpc(fnName, params) {
    if (fnName === 'log_auth_event') {
      return { data: null, error: null };
    }
    if (fnName === 'verificar_vencimentos') {
      return { data: { total_alertas: 0 }, error: null };
    }
    return { data: null, error: null };
  },
};
