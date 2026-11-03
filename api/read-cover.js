// 표지 사진에서 제목·작가 읽기 — POST /api/read-cover  { image: base64, mediaType }
// Claude(비전)에게 사진만 보고 보이는 글자를 읽게 해요. 응답: { title, author, isbn }
// 환경 변수: ANTHROPIC_API_KEY (필수), ANTHROPIC_MODEL (선택)

export const config = { api: { bodyParser: { sizeLimit: '6mb' } } };

const PROMPT = `이 사진은 서점에서 찍은 어린이 영어 그림책이에요(표지, 책등, 뒷면 중 하나).
사진에서 직접 보이는 글자만 근거로 책 제목과 작가, ISBN(뒷면에 있으면)을 읽어주세요.
추측하지 말고 안 보이면 빈 문자열로 두세요.
다른 말 없이 JSON 하나로만 답하세요: {"title":"", "author":"", "isbn":""}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: '표지 읽기가 아직 설정되지 않았어요.' });

  const { image, mediaType } = req.body || {};
  if (!image || typeof image !== 'string' || image.length > 8_000_000) {
    return res.status(400).json({ error: '사진이 없거나 너무 커요.' });
  }
  const type = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mediaType) ? mediaType : 'image/jpeg';

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: type, data: image } },
            { type: 'text', text: PROMPT },
          ],
        }],
      }),
    });
    if (!r.ok) return res.status(502).json({ error: '표지를 읽지 못했어요.' });
    const data = await r.json();
    const text = (data.content || []).map((c) => c.text || '').join('');
    const m = text.match(/\{[\s\S]*\}/);
    const out = m ? JSON.parse(m[0]) : {};
    return res.status(200).json({
      title: String(out.title || '').slice(0, 200),
      author: String(out.author || '').slice(0, 200),
      isbn: String(out.isbn || '').replace(/[^0-9Xx]/g, ''),
    });
  } catch (e) {
    return res.status(502).json({ error: '표지를 읽지 못했어요.' });
  }
}
