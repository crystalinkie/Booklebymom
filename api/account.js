// 다른 기기에서 다시 로그인하기: 닉네임 + 숫자 6자리 비밀번호
//
// POST /api/account
//   { action: 'set-pin', pin }            (Authorization: Bearer <로그인한 사용자 토큰>)
//      → 지금 계정에 비밀번호를 만들어요. 계정과 데이터는 그대로예요.
//   { action: 'login', nickname, pin }
//      → 닉네임으로 계정을 찾아 비밀번호가 맞으면 로그인 토큰을 돌려줘요.
//
// 5번 틀리면 그 닉네임은 10분 동안 로그인을 막아요 (supabase/login-pin.sql 의 login_attempts 표).
// 환경 변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (이미 있는 값)

const DOMAIN = '@login.bookle.my'; // 실제로 메일을 보내지 않는 내부용 주소예요
const MAX_FAILS = 5;
const LOCK_MIN = 10;

const nickKey = (n) => String(n || '').toLowerCase().replace(/\s+/g, '');
const pwOf = (pin) => `bookle-${pin}`; // Supabase 최소 길이를 맞추려고 앞에 붙여요 (저장은 Supabase가 암호화)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    return res.status(500).json({ error: '서버 설정(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)이 비어 있어요.' });

  const base = new URL(process.env.SUPABASE_URL.trim()).origin;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY.trim();
  const H = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const pin = String(body.pin || '');
  if (!/^\d{6}$/.test(pin)) return res.status(400).json({ error: '비밀번호는 숫자 6자리예요.' });

  try {
    /* ---------- 비밀번호 만들기 / 바꾸기 ---------- */
    if (body.action === 'set-pin') {
      const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      if (!token) return res.status(401).json({ error: '로그인이 필요해요.' });
      const me = await fetch(`${base}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
      if (!me.ok) return res.status(401).json({ error: '로그인이 풀렸어요. 앱을 새로고침해주세요.' });
      const u = await me.json();
      const up = await fetch(`${base}/auth/v1/admin/users/${u.id}`, {
        method: 'PUT', headers: H,
        body: JSON.stringify({ email: `u-${u.id}${DOMAIN}`, password: pwOf(pin), email_confirm: true }),
      });
      if (!up.ok) return res.status(500).json({ error: '비밀번호를 저장하지 못했어요. (' + (await up.text()).slice(0, 160) + ')' });
      return res.status(200).json({ ok: true });
    }

    /* ---------- 닉네임 + 비밀번호로 로그인 ---------- */
    if (body.action === 'login') {
      const k = nickKey(body.nickname);
      if (!k) return res.status(400).json({ error: '닉네임을 적어주세요.' });

      // 잠겨 있는지 확인 (표가 아직 없으면 잠금 없이 진행)
      let rec = null, tableOk = true;
      const lr = await fetch(`${base}/rest/v1/login_attempts?nick_key=eq.${encodeURIComponent(k)}&select=fails,locked_until`, { headers: H });
      if (lr.ok) rec = (await lr.json())[0] || null; else tableOk = false;
      if (rec?.locked_until && new Date(rec.locked_until) > new Date()) {
        const m = Math.ceil((new Date(rec.locked_until) - new Date()) / 60000);
        return res.status(429).json({ error: `여러 번 틀려서 잠시 막아뒀어요. ${m}분 뒤에 다시 시도해주세요.` });
      }

      // 닉네임으로 계정 찾기 (띄어쓰기·대소문자 무시)
      const pr = await fetch(`${base}/rest/v1/profiles?select=id,nickname`, { headers: H });
      const list = pr.ok ? await pr.json() : [];
      const hit = (Array.isArray(list) ? list : []).find((p) => nickKey(p.nickname) === k);

      let session = null;
      if (hit) {
        const t = await fetch(`${base}/auth/v1/token?grant_type=password`, {
          method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: `u-${hit.id}${DOMAIN}`, password: pwOf(pin) }),
        });
        if (t.ok) session = await t.json();
      }

      const save = (row) => tableOk && fetch(`${base}/rest/v1/login_attempts?on_conflict=nick_key`, {
        method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ nick_key: k, updated_at: new Date().toISOString(), ...row }),
      }).catch(() => {});

      if (session?.access_token) {
        if (rec) await save({ fails: 0, locked_until: null });
        return res.status(200).json({ access_token: session.access_token, refresh_token: session.refresh_token });
      }

      await sleep(700); // 빠르게 여러 번 넣어보는 걸 늦춰요
      const fails = (rec?.fails || 0) + 1;
      if (fails >= MAX_FAILS) {
        await save({ fails: 0, locked_until: new Date(Date.now() + LOCK_MIN * 60000).toISOString() });
        return res.status(429).json({ error: `${MAX_FAILS}번 틀려서 ${LOCK_MIN}분 동안 막아뒀어요. 잠시 후 다시 시도해주세요.` });
      }
      await save({ fails, locked_until: null });
      return res.status(401).json({
        error: `닉네임이나 비밀번호가 맞지 않아요. (${MAX_FAILS - fails}번 더 틀리면 잠시 막혀요)`,
        hint: '비밀번호를 만든 적이 없다면, 처음 쓰던 기기에서 내 프로필 → 프로필 편집에서 먼저 만들어주세요.',
      });
    }

    return res.status(400).json({ error: 'action 이 올바르지 않아요.' });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
