/**
 * 북클 책 시트 → Supabase 동기화 (Google Apps Script)
 *
 * 시트 메뉴 "북클"
 *   - 시트 준비하기 : 머리글, 나이대·별점·공개 드롭다운을 만들어요 (처음 한 번)
 *   - 앱에 반영하기 : ISBN으로 알라딘(없으면 카카오)에서 제목·작가·출판사·표지를 채우고
 *                     Supabase books 테이블에 올려요. 같은 ISBN은 덮어써요.
 *
 * 스크립트 속성 (확장 프로그램 → Apps Script → 프로젝트 설정 → 스크립트 속성)
 *   SUPABASE_URL          https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY  service_role 키 (절대 공유 금지)
 *   CURATOR_USER_ID       내 북클 계정 id (auth.users 의 uuid)
 *   ALADIN_TTB_KEY        알라딘 TTB 키
 *   KAKAO_REST_API_KEY    (선택) 알라딘에 없을 때 쓰는 카카오 REST 키
 */

const SHEET_NAME = '책';
const HEADERS = ['ISBN', '나이대', '별점', '소개', '이렇게 읽어주세요', '공개',
                 '제목(자동)', '작가(자동)', '출판사(자동)', '표지(자동)', '상태(자동)'];
const COL = { isbn: 0, age: 1, rating: 2, summary: 3, howTo: 4, published: 5,
              title: 6, author: 7, publisher: 8, cover: 9, status: 10 };
const AGE_MAP = { '0–2세': '0-2', '3–4세': '3-4', '5–6세': '5-6', '7세+': '7+' };

function onOpen() {
  SpreadsheetApp.getUi().createMenu('북클')
    .addItem('앱에 반영하기', 'syncToApp')
    .addSeparator()
    .addItem('시트 준비하기', 'setupSheet')
    .addToUi();
}

/* ---------- 시트 준비 ---------- */
function setupSheet() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    .setFontWeight('bold').setBackground('#E8EEF9');
  sh.setFrozenRows(1);
  const rows = Math.max(sh.getMaxRows() - 1, 500);

  const dd = (list) => SpreadsheetApp.newDataValidation().requireValueInList(list, true).setAllowInvalid(false).build();
  sh.getRange(2, COL.age + 1, rows).setDataValidation(dd(Object.keys(AGE_MAP)));
  sh.getRange(2, COL.rating + 1, rows).setDataValidation(dd(['5', '4', '3', '2', '1']));
  sh.getRange(2, COL.published + 1, rows).setDataValidation(dd(['Y', 'N']));
  sh.getRange(2, COL.isbn + 1, rows).setNumberFormat('@');            // ISBN 앞자리 0 보호
  sh.getRange(2, COL.summary + 1, rows, 2).setWrap(true);
  sh.getRange(2, COL.title + 1, rows, 5).setBackground('#F4F5F2').setFontColor('#6A746C');

  [140, 80, 60, 320, 380, 50, 220, 160, 120, 160, 160]
    .forEach((w, i) => sh.setColumnWidth(i + 1, w));
  SpreadsheetApp.getUi().alert('준비됐어요. ISBN·나이대·별점·소개·읽어주는 법을 적고 [북클 → 앱에 반영하기]를 누르세요.');
}

/* ---------- 동기화 ---------- */
function syncToApp() {
  const p = PropertiesService.getScriptProperties().getProperties();
  const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'CURATOR_USER_ID', 'ALADIN_TTB_KEY'].filter(k => !p[k]);
  if (missing.length) {
    SpreadsheetApp.getUi().alert('스크립트 속성이 비어 있어요: ' + missing.join(', '));
    return;
  }
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const last = sh.getLastRow();
  if (last < 2) return;
  const range = sh.getRange(2, 1, last - 1, HEADERS.length);
  const rows = range.getValues();
  const now = Utilities.formatDate(new Date(), 'Asia/Seoul', 'MM/dd HH:mm');

  const payload = [], rowIdx = [];
  rows.forEach((r, i) => {
    const isbn = String(r[COL.isbn]).replace(/[^0-9Xx]/g, '');
    if (!isbn) return;

    const age = AGE_MAP[r[COL.age]];
    const rating = Number(r[COL.rating]);
    const summary = String(r[COL.summary]).trim();
    if (!age || !rating || !summary) { r[COL.status] = '⚠ 나이대·별점·소개를 채워주세요'; return; }

    // 제목·표지가 비어 있을 때만 검색 (이미 채워진 줄은 API를 다시 부르지 않아요)
    if (!r[COL.title] || !r[COL.cover]) {
      const info = lookupAladin(isbn, p.ALADIN_TTB_KEY) || lookupKakao(isbn, p.KAKAO_REST_API_KEY);
      if (!info) { r[COL.status] = '⚠ ISBN으로 책을 찾지 못했어요'; return; }
      r[COL.title] = info.title; r[COL.author] = info.author;
      r[COL.publisher] = info.publisher; r[COL.cover] = info.cover;
      Utilities.sleep(150); // API 예의상 살짝 쉬어요
    }

    payload.push({
      isbn,
      title: r[COL.title],
      author: r[COL.author],
      publisher: r[COL.publisher],
      cover: r[COL.cover],
      age, rating, summary,
      how_to: String(r[COL.howTo]).trim(),               // 셀 안 줄바꿈 = 팁 하나씩
      published: String(r[COL.published] || 'Y').toUpperCase() !== 'N',
      curated: true,
      user_id: p.CURATOR_USER_ID,
      updated_at: new Date().toISOString(),
    });
    rowIdx.push(i);
  });

  if (payload.length) {
    const res = UrlFetchApp.fetch(p.SUPABASE_URL + '/rest/v1/books?on_conflict=user_id,isbn', {
      method: 'post',
      contentType: 'application/json',
      headers: {
        apikey: p.SUPABASE_SERVICE_KEY,
        Authorization: 'Bearer ' + p.SUPABASE_SERVICE_KEY,
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });
    const ok = res.getResponseCode() < 300;
    const msg = ok ? '✓ 반영됨 ' + now : '⚠ 업로드 실패 (' + res.getResponseCode() + ')';
    rowIdx.forEach(i => { rows[i][COL.status] = msg; });
    if (!ok) Logger.log(res.getContentText());
  }

  range.setValues(rows);
  SpreadsheetApp.getActive().toast(payload.length + '권을 앱에 반영했어요', '북클', 5);
}

/* ---------- 책 정보 찾기 ---------- */
function lookupAladin(isbn, key) {
  const type = isbn.length === 13 ? 'ISBN13' : 'ISBN';
  const url = 'https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?ttbkey=' + encodeURIComponent(key) +
    '&itemIdType=' + type + '&ItemId=' + isbn + '&output=js&Version=20131101&Cover=Big';
  try {
    const txt = UrlFetchApp.fetch(url, { muteHttpExceptions: true }).getContentText().trim().replace(/;$/, '');
    const it = (JSON.parse(txt).item || [])[0];
    if (!it) return null;
    return {
      title: it.title,
      author: String(it.author || '').replace(/\s*\((지은이|그림|옮긴이|글)\)/g, '').trim(),
      publisher: it.publisher || '',
      cover: it.cover || '',
    };
  } catch (e) { return null; }
}

function lookupKakao(isbn, key) {
  if (!key) return null;
  try {
    const res = UrlFetchApp.fetch('https://dapi.kakao.com/v3/search/book?target=isbn&query=' + isbn,
      { headers: { Authorization: 'KakaoAK ' + key }, muteHttpExceptions: true });
    const d = (JSON.parse(res.getContentText()).documents || [])[0];
    if (!d) return null;
    return { title: d.title, author: (d.authors || []).join(' · '), publisher: d.publisher || '', cover: d.thumbnail || '' };
  } catch (e) { return null; }
}
