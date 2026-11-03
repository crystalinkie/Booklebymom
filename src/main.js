// Bookle — 연령별 영어 그림책 추천 + 엄마표 영어 가이드
// 화면 로직은 프로토타입에서 그대로 옮겼고, 데이터는 backend.js(Supabase)로 저장해요.
import './styles.css';
import * as api from './backend.js';

const AGES=[
  {k:'0-2',label:'0–2Y',sub:'첫 보드북 · 플랩북',tone:'--a1'},
  {k:'3-4',label:'3–4Y',sub:'반복 문장 · 말놀이',tone:'--a2'},
  {k:'5-6',label:'5–6Y',sub:'이야기 그림책',tone:'--a3'},
  {k:'7+',label:'7Y+',sub:'얼리 리더스',tone:'--a4'}
];
const HUES=[32,14,44,78,352,120];
const ICON={
  heart:'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/></svg>',
  comment:'<svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20.5 12a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.1-4.2A8.5 8.5 0 1 1 20.5 12z"/></svg>',
  back:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  x:'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  undo:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>',
  flip:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/></svg>',
  up:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>',
  down:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  share:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M21 3L10 14"/><path d="M21 3l-7 18-4-7-7-4z"/></svg>',
  camera:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.6"/></svg>',
  search:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
  plus:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  close:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};

/* 등급: 등록한 책 수 기준 */
const TIERS=[
  {min:0,name:'',c:'#B9A693'},
  {min:1,key:'oak',name:'Oak 곰',c:'#9C7A4E',g:['#E3C796','#C9A26B'],dark:'#5A3E1E'},
  {min:10,key:'bronze',name:'Bronze 곰',c:'#B06F38',g:['#F0B27A','#9A5626'],dark:'#552B0E'},
  {min:50,key:'silver',name:'Silver 곰',c:'#8E99A6',g:['#FBFCFD','#A3AEBA'],dark:'#3F4852'},
  {min:100,key:'gold',name:'Gold 곰',c:'#D4A017',g:['#FFE58A','#D29A00'],dark:'#6B4A00'},
  {min:200,key:'diamond',name:'Diamond 곰',c:'#E58FB6',g:['#FFEAF3','#7CCBEA'],dark:'#1C5873'}
];
/* 등급 곰 얼굴 배지 */
function bear(t,size){
  if(!t||!t.key)return '';
  const id='bg-'+t.key, d=t.dark;
  const extra=t.key==='oak'
    ? `<g clip-path="url(#cl-${t.key})" fill="none" stroke="${d}" stroke-opacity=".45" stroke-width=".8"><ellipse cx="16" cy="18.5" rx="9.5" ry="8.6"/><ellipse cx="16" cy="18.8" rx="7.2" ry="6.4"/><ellipse cx="16" cy="19.2" rx="4.8" ry="4.2" stroke-dasharray="3 1.5"/></g>
       <circle cx="8" cy="9" r="2.3" fill="none" stroke="${d}" stroke-opacity=".45" stroke-width=".7"/><circle cx="24" cy="9" r="2.3" fill="none" stroke="${d}" stroke-opacity=".45" stroke-width=".7"/>
       <g transform="translate(16 6.6) rotate(-12)"><path d="M0 0.5V-3" stroke="#4E7A34" stroke-width="1.1" stroke-linecap="round"/><path d="M0 -2.4C-1.6 -2.6 -1.4 -4.2 -2.6 -4.4C-2 -5.2 -1.2 -5 -1 -5.8C-.4 -6.6 .4 -6.6 1 -5.8C1.2 -5 2 -5.2 2.6 -4.4C1.4 -4.2 1.6 -2.6 0 -2.4Z" fill="#7FAE57" stroke="#fff" stroke-width=".9"/></g>`
    : t.key==='diamond'
    ? `<g clip-path="url(#cl-${t.key})" stroke="#fff" stroke-opacity=".75" stroke-width=".8" fill="none"><path d="M5 12l11 6 11-6M16 18v11M9 7l7 11 7-11"/></g><path d="M26.5 3.2l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" fill="#FFD1E3" stroke="#E58FB6" stroke-width=".6"/><path d="M4.5 4.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" fill="#FFD1E3" stroke="#E58FB6" stroke-width=".5"/><circle cx="23" cy="24" r="1.1" fill="#FFB8D4"/>`
    : `<ellipse cx="11" cy="12.5" rx="4" ry="2.2" fill="#fff" fill-opacity=".35" transform="rotate(-25 11 12.5)"/>`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true" style="display:block;flex:none">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.g[0]}"/><stop offset="1" stop-color="${t.g[1]}"/></linearGradient>
    <clipPath id="cl-${t.key}"><circle cx="16" cy="18" r="11"/></clipPath></defs>
    <g stroke="#fff" stroke-width="1.6"><circle cx="8" cy="9" r="5" fill="url(#${id})"/><circle cx="24" cy="9" r="5" fill="url(#${id})"/><circle cx="16" cy="18" r="11" fill="url(#${id})"/></g>
    <circle cx="8" cy="9" r="2.3" fill="${d}" fill-opacity=".45"/><circle cx="24" cy="9" r="2.3" fill="${d}" fill-opacity=".45"/>
    ${extra}
    <ellipse cx="16" cy="22.2" rx="5.6" ry="4.2" fill="#fff" fill-opacity=".55"/>
    <ellipse cx="16" cy="20.6" rx="2.1" ry="1.5" fill="${d}"/>
    <circle cx="11.6" cy="16.2" r="1.35" fill="${d}"/><circle cx="20.4" cy="16.2" r="1.35" fill="${d}"/>
  </svg>`;
}

/* 연령별 표지 일러스트 — 북클 테디베어와 곱슬 강아지 (갈색 스케치 선) */
const ART=(()=>{
  const L='#6B3F26', TED='#E8C9A2', TED2='#F6E6CF', DOG='#EEC594', DOG2='#F8E3C6', PAGE='#FFF8EC';
  const st=(w=1.7)=>`stroke="${L}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  /* 손으로 그린 느낌: 같은 선을 살짝 어긋나게 한 번 더 */
  const sk=(shape)=>shape+`<g transform="translate(.7 -.5)" opacity=".45">${shape.replace(/fill="[^"]*"/g,'fill="none"').replace(/stroke-width="[\d.]+"/g,'stroke-width=".8"')}</g>`;
  /* 곱슬 털 외곽: 타원 둘레를 작은 호로 이어요 */
  const cloud=(cx,cy,rx,ry,n,b,fill)=>{let d='';for(let k=0;k<=n;k++){const a=k/n*Math.PI*2-Math.PI/2,x=(cx+rx*Math.cos(a)).toFixed(1),y=(cy+ry*Math.sin(a)).toFixed(1);d+=k?`A${b} ${b} 0 0 1 ${x} ${y}`:`M${x} ${y}`}return sk(`<path d="${d}Z" fill="${fill}" ${st()}/>`)};
  const hatch=(pts)=>`<path d="${pts}" fill="none" stroke="${L}" stroke-width=".9" stroke-linecap="round" opacity=".55"/>`;
  const teddy=(withArms=true)=>
    sk(`<circle cx="-15" cy="-15" r="7" fill="${TED}" ${st()}/><circle cx="15" cy="-15" r="7" fill="${TED}" ${st()}/>`)+
    `<circle cx="-15" cy="-15" r="3.4" fill="${TED2}" ${st(1)}/><circle cx="15" cy="-15" r="3.4" fill="${TED2}" ${st(1)}/>`+
    sk(`<ellipse cx="0" cy="26" rx="15" ry="14" fill="${TED}" ${st()}/>`)+
    `<ellipse cx="0" cy="27" rx="8" ry="8.5" fill="${TED2}" ${st(1)}/>`+
    sk(`<ellipse cx="-11" cy="38" rx="7.5" ry="6" fill="${TED}" ${st()}/><ellipse cx="11" cy="38" rx="7.5" ry="6" fill="${TED}" ${st()}/>`)+
    `<ellipse cx="-11" cy="38.5" rx="4.2" ry="3.4" fill="${TED2}" ${st(1)}/><ellipse cx="11" cy="38.5" rx="4.2" ry="3.4" fill="${TED2}" ${st(1)}/>`+
    sk(`<circle cx="0" cy="-2" r="16" fill="${TED}" ${st()}/>`)+
    hatch('M9 -12l3 4M11 -9l3 3.5M12 -5l2.5 3M-12 -10l-2.5 3M8 20l3 3M9 25l3 2.5M-10 22l-2 3')+
    `<ellipse cx="0" cy="5" rx="7.5" ry="6" fill="${TED2}" ${st(1.4)}/>`+
    `<ellipse cx="0" cy="2.6" rx="3" ry="2.2" fill="${L}"/><path d="M0 4.6V7M-2.6 7.4Q0 9 2.6 7.4" fill="none" ${st(1.2)}/>`+
    `<circle cx="-6.2" cy="-4.5" r="1.9" fill="${L}"/><circle cx="6.2" cy="-4.5" r="1.9" fill="${L}"/><circle cx="-5.6" cy="-5.1" r=".6" fill="#fff"/><circle cx="6.8" cy="-5.1" r=".6" fill="#fff"/>`+
    (withArms?sk(`<ellipse cx="-16" cy="22" rx="5" ry="8.5" transform="rotate(28 -16 22)" fill="${TED}" ${st()}/><ellipse cx="16" cy="22" rx="5" ry="8.5" transform="rotate(-28 16 22)" fill="${TED}" ${st()}/>`):'');
  const pup=()=>
    cloud(-15,6,6.5,11,9,2.6,DOG)+cloud(15,6,6.5,11,9,2.6,DOG)+
    cloud(0,26,14,13,14,3,DOG)+
    cloud(-8,38,5,4,7,2,DOG)+cloud(8,38,5,4,7,2,DOG)+
    cloud(0,-15,8.5,6.5,10,2.4,DOG)+
    cloud(0,-1,14,13.5,16,2.8,DOG)+
    hatch('M-9 -8q1.5-1.5 3 0M4 -9q1.5-1.5 3 0M-11 10q1.5 1.5 3 0M7 11q1.5 1.5 3 0M-6 24q1.5 1.5 3 0M3 29q1.5 1.5 3 0')+
    `<ellipse cx="0" cy="5" rx="6.5" ry="5" fill="${DOG2}" ${st(1.3)}/>`+
    `<ellipse cx="0" cy="3" rx="2.6" ry="2" fill="#2B1A10"/><path d="M-2.4 6.5Q0 8 2.4 6.5" fill="none" ${st(1.1)}/><path d="M-1.6 7.2Q0 11.5 1.6 7.2Z" fill="#E98A93" ${st(.9)}/>`+
    `<circle cx="-5.5" cy="-2.5" r="1.9" fill="#2B1A10"/><circle cx="5.5" cy="-2.5" r="1.9" fill="#2B1A10"/><circle cx="-4.9" cy="-3.1" r=".6" fill="#fff"/><circle cx="6.1" cy="-3.1" r=".6" fill="#fff"/>`;
  const openBook=(w,col,y=20)=>sk(`<path d="M${-w} ${y}Q${-w/2} ${y-5} 0 ${y}Q${w/2} ${y-5} ${w} ${y}L${w} ${y+12}Q${w/2} ${y+8} 0 ${y+12}Q${-w/2} ${y+8} ${-w} ${y+12}Z" fill="${col}" ${st()}/>`)+
    `<path d="M${-w+2} ${y-.5}Q${-w/2} ${y-4.5} 0 ${y-.5}Q${w/2} ${y-4.5} ${w-2} ${y-.5}L${w-2} ${y+10}Q${w/2} ${y+6.5} 0 ${y+10}Q${-w/2} ${y+6.5} ${-w+2} ${y+10}Z" fill="${PAGE}" ${st(1.3)}/>`+
    hatch(`M0 ${y-.5}V${y+10}M${-w*.7} ${y+2.5}Q${-w*.35} ${y+.5} -3 ${y+2.5}M${-w*.7} ${y+5.5}Q${-w*.35} ${y+3.5} -3 ${y+5.5}M3 ${y+2.5}Q${w*.35} ${y+.5} ${w*.7} ${y+2.5}M3 ${y+5.5}Q${w*.35} ${y+3.5} ${w*.7} ${y+5.5}`);
  const pawsT=(y=29)=>sk(`<ellipse cx="-12" cy="${y}" rx="4" ry="3.4" fill="${TED}" ${st()}/><ellipse cx="12" cy="${y}" rx="4" ry="3.4" fill="${TED}" ${st()}/>`);
  const pawsD=(y=29)=>cloud(-12,y,4,3.4,7,1.8,DOG)+cloud(12,y,4,3.4,7,1.8,DOG);
  const note=(x,y,r=0)=>`<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 0V-11L7 -13V-2" fill="none" ${st(1.6)}/><ellipse cx="-2.2" cy=".5" rx="3" ry="2.3" fill="${L}"/><ellipse cx="4.8" cy="-1.5" rx="3" ry="2.3" fill="${L}"/></g>`;
  const star=(x,y,sc=1)=>`<path transform="translate(${x} ${y}) scale(${sc})" d="M0 -5L1.4 -1.4L5 0L1.4 1.4L0 5L-1.4 1.4L-5 0L-1.4 -1.4Z" fill="#F2C14E" stroke="${L}" stroke-width="1"/>`;
  const heart=(x,y,sc=1)=>`<path transform="translate(${x} ${y}) scale(${sc})" d="M0 4C-6 0 -5 -5 -2.5 -5C-1 -5 0 -4 0 -3C0 -4 1 -5 2.5 -5C5 -5 6 0 0 4Z" fill="#E98A93" stroke="${L}" stroke-width="1"/>`;
  const svg=(inner)=>`<svg viewBox="0 0 120 100" width="120" height="100" aria-hidden="true">${inner}</svg>`;
  return {
    '0-2':svg(`<g transform="translate(62 44) scale(1.12)">${teddy(false)}
        ${sk(`<rect x="-10" y="15" width="20" height="17" rx="4" fill="#E9A24B" ${st()}/>`)}<circle cx="-3.5" cy="21.5" r="2.6" fill="${PAGE}"/><path d="M1.5 26L4.5 19.5L7.5 26Z" fill="${PAGE}"/>${pawsT(24)}</g>
      ${star(20,28,1.2)}${heart(104,18,1.1)}`),
    '3-4':svg(`<g transform="translate(58 44) scale(1.12)">${pup()}${openBook(15,'#8BB174')}${pawsD(28)}</g>
      ${note(98,32,8)}${note(18,26,-10)}`),
    '5-6':svg(`<g transform="translate(35 46) scale(.98)">${teddy(false)}</g>
      <g transform="translate(86 46) scale(.98)">${pup()}</g>
      <g transform="translate(60 48) scale(1.12)">${openBook(27,'#C9786A',21)}</g>
      <g transform="translate(60 48) scale(1.12)">${sk(`<ellipse cx="-23" cy="29" rx="4" ry="3.4" fill="${TED}" ${st()}/>`)}${cloud(23,29,4,3.4,7,1.8,DOG)}</g>`),
    '7+':svg(`<g transform="translate(60 44) scale(1.12)">${teddy(false)}
        <circle cx="-6.2" cy="-4.5" r="4.6" fill="none" ${st(1.5)}/><circle cx="6.2" cy="-4.5" r="4.6" fill="none" ${st(1.5)}/><path d="M-1.6 -4.8H1.6" ${st(1.5)}/>
        ${sk(`<rect x="-15" y="30.5" width="30" height="4.5" rx="1" fill="#6F8FB3" ${st()}/>`)}${openBook(15,'#6F8FB3')}${pawsT(28)}</g>
      ${star(20,24,1)}`)
  };
})();

/* 프로필 사진 위에서 사진을 안고 있는 등급 곰. 등록 전에는 선만 있는 곰 */
function hugBear(t){
  const outline=!t.key, gid='hg-'+(t.key||'none');
  const fill=outline?'#7A5134':`url(#${gid})`, line=outline?'#FBF1DE':'#fff', d=outline?'#FBF1DE':t.dark;
  const sw=outline?1.6:1.8, dash=outline?' stroke-dasharray="3 2.2"':'';
  const st=`stroke="${line}" stroke-width="${sw}" stroke-linejoin="round"${dash}`;
  const extra=outline?'':t.key==='oak'
      ? `<g transform="translate(32 4.5) rotate(-12)"><path d="M0 1V-3" stroke="#4E7A34" stroke-width="1.3" stroke-linecap="round"/><path d="M0 -2.4C-1.8 -2.6 -1.6 -4.6 -3 -4.8C-2.3 -5.8 -1.4 -5.6 -1.2 -6.5C-.5 -7.4 .5 -7.4 1.2 -6.5C1.4 -5.6 2.3 -5.8 3 -4.8C1.6 -4.6 1.8 -2.6 0 -2.4Z" fill="#7FAE57" stroke="#fff" stroke-width="1"/></g>
         <g fill="none" stroke="${d}" stroke-opacity=".4" stroke-width=".8"><ellipse cx="32" cy="19" rx="9" ry="8"/><ellipse cx="32" cy="19.4" rx="5.6" ry="5" stroke-dasharray="3 1.5"/></g>`
      : t.key==='diamond'
      ? `<g stroke="#fff" stroke-opacity=".8" stroke-width=".8" fill="none"><path d="M21 14l11 6 11-6M32 20v12M25 9l7 11 7-11"/></g><path d="M50 4l1 2.3 2.3 1-2.3 1-1 2.3-1-2.3-2.3-1 2.3-1z" fill="#FFD1E3" stroke="#E58FB6" stroke-width=".7"/><path d="M13 3.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z" fill="#FFD1E3" stroke="#E58FB6" stroke-width=".6"/><circle cx="40" cy="27" r="1.3" fill="#FFB8D4"/><circle cx="23" cy="13" r=".9" fill="#FFB8D4"/>`
      : `<ellipse cx="26" cy="12" rx="4.5" ry="2.4" fill="#fff" fill-opacity=".4" transform="rotate(-25 26 12)"/>`;
  return `<svg viewBox="0 0 64 44" width="64" height="44" aria-hidden="true">
    ${outline?'':`<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.g[0]}"/><stop offset="1" stop-color="${t.g[1]}"/></linearGradient></defs>`}
    <circle cx="21" cy="9" r="6" fill="${fill}" ${st}/><circle cx="43" cy="9" r="6" fill="${fill}" ${st}/>
    <circle cx="32" cy="20" r="14" fill="${fill}" ${st}/>
    ${extra}
    <ellipse cx="32" cy="25.5" rx="6" ry="4.6" fill="${outline?'#7A5134':'#fff'}" fill-opacity=".55" ${outline?st:''}/>
    <ellipse cx="32" cy="24" rx="2.3" ry="1.7" fill="${d}"/>
    <circle cx="27" cy="18.5" r="1.7" fill="${d}"/><circle cx="37" cy="18.5" r="1.7" fill="${d}"/>
    <ellipse cx="13" cy="37" rx="7" ry="5.4" fill="${fill}" ${st} transform="rotate(-20 13 37)"/>
    <ellipse cx="51" cy="37" rx="7" ry="5.4" fill="${fill}" ${st} transform="rotate(20 51 37)"/>
    <path d="M9.5 38.5l1.6-3M13 39.5l.8-3.4M54.5 38.5l-1.6-3M51 39.5l-.8-3.4" stroke="${d}" stroke-opacity=".5" stroke-width="1" stroke-linecap="round"/>
  </svg>`;
}

/* 예시 책 — 실제 등록된 책이 부족한 연령대에만 보여요 */
const SAMPLES=[
 {id:'s1',tags:['animals'],age:'0-2',title:'Brown Bear, Brown Bear, What Do You See?',author:'Bill Martin Jr. · Eric Carle',rating:5,hue:32,
  summary:'갈색 곰, 빨간 새, 노란 오리… 색깔 동물이 차례로 나오면서 같은 질문과 대답이 리듬처럼 반복돼요. 처음 영어책으로 가장 많이 추천되는 책이에요.',
  howTo:'"Brown bear, brown bear, what do you see?"를 노래하듯 리듬을 살려 읽어주세요.\n페이지를 넘기기 전에 잠깐 멈추고 다음 동물이 누굴지 같이 기다려요.\n동물 색깔을 손가락으로 짚으며 "Red! Yellow!" 하고 색 이름을 함께 말해요.\n익숙해지면 아이가 "I see a…" 뒷부분을 채우게 해보세요.'},
 {id:'s2',tags:['animals'],age:'0-2',title:'Dear Zoo',author:'Rod Campbell',rating:5,hue:85,
  summary:'동물원에 애완동물을 보내달라고 편지를 쓰는데, 상자를 열 때마다 너무 크고 무서운 동물이 나와요. 플랩을 들추는 재미가 있는 보드북이에요.',
  howTo:'플랩을 열기 전에 상자를 톡톡 두드리며 "Who\'s inside?" 하고 물어요.\n동물이 나오면 소리와 몸짓을 크게 흉내 내주세요.\n"He was too big!"처럼 반복되는 문장은 아이와 같이 외쳐요.'},
 {id:'s3',tags:['animals'],age:'3-4',title:"We're Going on a Bear Hunt",author:'Michael Rosen · Helen Oxenbury',rating:5,hue:120,
  summary:'가족이 곰을 찾아 풀밭, 강, 진흙, 숲을 지나가는 모험 이야기예요. "Swishy swashy" 같은 소리 흉내말이 가득해 몸으로 읽기 좋아요.',
  howTo:'장면마다 나오는 소리말(swishy swashy, squelch squerch)을 몸동작과 함께 읽어요.\n"We can\'t go over it. We can\'t go under it."은 아이와 주고받듯 읽어주세요.\n곰을 만나는 장면에서는 목소리를 낮추고 천천히, 도망치는 장면은 빠르게!\n다 읽고 나면 거실에서 이불·쿠션으로 곰 사냥 놀이로 이어가보세요.'},
 {id:'s4',tags:['animals'],age:'3-4',title:'Pete the Cat: I Love My White Shoes',author:'Eric Litwin · James Dean',rating:4,hue:18,
  summary:'새 흰 신발을 신은 고양이 피트가 딸기, 블루베리 더미를 밟아 신발 색이 계속 바뀌어도 노래하며 즐겁게 걸어가요.',
  howTo:'"I love my white shoes" 부분은 노래로 불러주세요. 멜로디가 쉬워서 금방 따라 해요.\n신발 색이 바뀌기 전에 "What color?" 하고 먼저 물어보세요.\n"Did Pete cry? Goodness, no!"는 아이가 대답하게 해주세요.'},
 {id:'s5',tags:['animals'],age:'5-6',title:'The Gruffalo',author:'Julia Donaldson · Axel Scheffler',rating:5,hue:18,
  summary:'꾀 많은 생쥐가 숲속 포식자들을 피하려고 무시무시한 상상 속 괴물 그루팔로를 지어내는데, 진짜 그루팔로가 나타나요. 운율이 살아있는 이야기책이에요.',
  howTo:'라임(운율)이 맞는 단어 끝을 살짝 힘줘서 읽으면 리듬이 살아나요.\n그루팔로 생김새를 읽을 때마다 아이가 그림에서 해당 부위를 찾아보게 해요.\n생쥐가 꾀를 내는 장면에서 "What will mouse say?" 하고 예측해보세요.\n다 읽고 나면 그루팔로를 직접 그려보는 활동으로 마무리해요.'},
 {id:'s6',tags:['animals'],age:'5-6',title:'We Are in a Book!',author:'Mo Willems',rating:5,hue:350,
  summary:'코끼리 제럴드와 돼지 피기가 자기들이 책 속에 있다는 걸 알아채고, 읽고 있는 독자에게 말을 거는 유쾌한 책이에요. 말풍선 대화로만 되어 있어요.',
  howTo:'엄마·아빠가 제럴드, 아이가 피기를 맡아 역할극처럼 읽어보세요.\n"Banana!"가 나오는 장면은 아이가 직접 소리 내 읽게 해주세요. 정말 좋아해요.\n말풍선 크기에 따라 목소리 크기를 바꿔 읽어요.'},
 {id:'s7',tags:['animals'],age:'7+',title:'Frog and Toad Are Friends',author:'Arnold Lobel',rating:5,hue:85,
  summary:'개구리와 두꺼비, 두 친구의 짧은 일상 이야기 다섯 편이 담긴 얼리 리더스예요. 한 챕터씩 끊어 읽기 좋아요.',
  howTo:'하루에 한 이야기씩, 잠자리에서 읽기 좋아요.\n처음엔 부모가 읽고, 두 번째부터는 대화 부분을 아이가 맡아 읽게 해보세요.\n읽고 나서 "If you were Toad, what would you do?" 하고 생각을 물어봐요.'},
 {id:'s8',tags:['animals'],age:'7+',title:'Mercy Watson to the Rescue',author:'Kate DiCamillo',rating:4,hue:350,
  summary:'버터 바른 토스트를 사랑하는 돼지 머시가 한밤중 사고를 일으키며 소동을 벌이는 이야기. 컬러 삽화가 많은 챕터북 입문용이에요.',
  howTo:'챕터가 짧아서 하루 2~3챕터씩 나눠 읽어요.\n어려운 단어는 멈추지 말고 그림을 보며 뜻을 추측하게 해주세요.\n다 읽은 날은 버터 토스트를 같이 만들어 먹으며 이야기를 나눠요.'},
 {id:'s9',tags:['christmas','animals'],age:'0-2',title:'Dear Santa',author:'Rod Campbell',rating:5,hue:352,
  summary:'산타에게 선물을 부탁하는 편지를 쓰고, 도착한 상자를 하나씩 열어보는 플랩북이에요. 「Dear Zoo」와 같은 작가라 반복 구조가 익숙해요.',
  howTo:'상자 플랩을 열기 전에 "What could it be?" 하고 같이 궁금해해요.\n선물이 나오면 "Too big!", "Too noisy!"처럼 이유를 표정으로 크게 말해줘요.\n마지막 선물은 아이가 직접 열게 해주세요.'},
 {id:'s10',tags:['christmas','animals'],age:'3-4',title:'Bear Stays Up for Christmas',author:'Karma Wilson · Jane Chapman',rating:5,hue:120,
  summary:'겨울잠을 자야 하는 곰이 친구들 도움으로 깨어 있으면서 함께 크리스마스를 준비해요. 운율이 살아 있고, 곰이 끝까지 졸지 않으려 애쓰는 모습이 귀여워요.',
  howTo:'"But the bear stays awake!"처럼 반복되는 줄은 아이와 같이 외쳐요.\n곰이 하품하는 장면에서는 같이 하품 흉내를 내요.\n다 읽고 나면 친구에게 줄 선물을 그려보는 놀이로 이어가요.'},
 {id:'s11',tags:['christmas'],age:'5-6',title:"The Night Before Christmas",author:'Clement C. Moore',rating:5,hue:200,
  summary:'크리스마스이브 밤, 조용한 집에 산타와 순록 썰매가 찾아오는 장면을 그린 오래된 크리스마스 시예요. 여러 그림 작가 버전이 있어 마음에 드는 그림으로 고르면 돼요.',
  howTo:'라임이 맞는 줄 끝을 살짝 힘줘서 읽으면 시의 리듬이 살아요.\n순록 이름(Dasher, Dancer…)이 나오면 손가락으로 하나씩 세어봐요.\n잠자리에서 조명을 낮추고 속삭이듯 읽어주면 분위기가 좋아요.'},
 {id:'s12',tags:['christmas'],age:'7+',title:'How the Grinch Stole Christmas!',author:'Dr. Seuss',rating:5,hue:85,
  summary:'크리스마스를 싫어하는 그린치가 마을의 선물을 몽땅 훔치지만, 마을 사람들은 선물 없이도 노래하며 크리스마스를 맞아요. 크리스마스의 의미를 이야기 나누기 좋아요.',
  howTo:'그린치 대사는 낮고 심술궂은 목소리로, 마을 사람들 노래는 밝게 읽어요.\n그린치 마음이 바뀌는 장면에서 멈추고 "Why did his heart grow?" 하고 물어봐요.\n챕터북 전 단계라 아이가 쉬운 줄을 직접 읽어보게 해주세요.'}
].map(b=>({...b,sample:true,uid:'sample',at:0,likes:{}}));

let books=[];            // 등록된 책 (db 또는 이 화면 안에서만)
let comments={};         // bookId -> [{uid,text,at}]
let localComments={};    // 예시 책/오프라인용
let names={me:'나',sample:'북클 예시'};
let uid='guest', canWrite=true, db=null, live=false;
let profiles={}, profileUid=null, profTab='mine', zTop=14, detailFromProfile=false;
let curAge=null, idx=0, flippedId=null, dragging=false, pendingRender=false;

const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ageOf=k=>AGES.find(a=>a.k===k)||AGES[0];
/* 같은 책 = 카드 하나. ISBN이 있으면 ISBN, 없으면 정리한 제목으로 묶어요.
   books 에는 '추천 한 건'씩 저장되고, 화면은 묶은 책(group)을 보여줘요. */
const normTitle=t=>String(t||'').toLowerCase().replace(/^(the|a|an)\s+/,'').replace(/[^a-z0-9가-힣]/g,'');
const bookKey=b=>b.isbn?'i'+String(b.isbn).replace(/\D/g,''):'t'+normTitle(b.title);
function mergeGroup(recs,sample){
  recs=recs.slice().sort((a,b)=>(a.at||0)-(b.at||0));
  const c=recs[0], likes={};
  recs.forEach(r=>Object.entries(r.likes||{}).forEach(([k,v])=>{if(v)likes[k]=true}));
  const rated=recs.filter(r=>r.rating);
  const tags=[...new Set(recs.flatMap(r=>r.tags||[]))];
  return {...c, recs, likes, tags, key:bookKey(c), sample:!!sample,
    cover:(recs.find(r=>r.cover)||{}).cover||'',
    photos:recs.flatMap(r=>r.photos||[]).sort((x,y)=>(x.at||0)-(y.at||0)),
    rating:rated.length?Math.round(rated.reduce((t,r)=>t+r.rating,0)/rated.length*10)/10:0,
    at:Math.max(...recs.map(r=>r.at||0))};
}
function allGroups(){
  const m=new Map(); books.forEach(b=>{const k=bookKey(b);(m.get(k)||m.set(k,[]).get(k)).push(b)});
  const real=[...m.values()].map(r=>mergeGroup(r,false));
  /* 진짜 책이 한 권이라도 올라오면 예시 책은 숨겨요 (예시는 빈 앱을 채우는 용도) */
  if(real.length) return {real, samples:[]};
  return {real, samples:SAMPLES.map(s=>mergeGroup([s],true))};
}
const likeCount=b=>Object.values(b.likes||{}).filter(Boolean).length;
const isLiked=b=>!!(b.likes&&b.likes[uid]);
const cmts=b=>{const ids=(b.recs||[b]).map(r=>r.id);const src=b.sample||!db?localComments:comments;return ids.flatMap(id=>src[id]||[]).sort((x,y)=>(x.at||0)-(y.at||0))};
const nameOf=id=>(profiles[id]&&profiles[id].nickname)?profiles[id].nickname:id===uid?(names[id]&&names[id]!=='나'?names[id]:'나'):(names[id]||'이웃');
const initial=id=>(nameOf(id)||'?').trim().charAt(0);
const coverBg=h=>`hsl(${h} 36% 75%)`, coverInk=h=>`hsl(${h} 38% 18%)`, coverShape=h=>`hsl(${(h+20)%360} 45% 89%)`;
const coverSrc=b=>b.cover||'';
const coverImg=(b,cls)=>{const u=coverSrc(b);return u?`<img class="${cls||'cimg'}" src="${esc(u)}" alt="${esc(b.title)} 표지" loading="lazy" draggable="false">`:''};
const photoOf=id=>{const p=profiles[id]||{};return p.photoUrl||p.photoLocal||''};
const regCount=id=>id==='sample'?0:books.filter(b=>b.uid===id).length;
const tierOf=id=>{const n=regCount(id);let i=0;TIERS.forEach((t,k)=>{if(n>=t.min)i=k});return {...TIERS[i],lv:i,n,next:TIERS[i+1]||null}};
const av=(id,cls)=>{const ph=photoOf(id), t=tierOf(id), big=(cls||'').includes('xl');
  return `<button type="button" class="avatar${cls?' '+cls:''}${t.lv?' ring':''}" style="--tc:${t.c}" data-profile="${esc(id)}" aria-label="${esc(nameOf(id))} 프로필 보기${t.lv?', '+t.name+' 등급':''}">${ph?`<img src="${esc(ph)}" alt="">`:esc(initial(id))}${big?`<span class="hug" title="${t.lv?t.name:'아직 등급이 없어요'}">${hugBear(t)}</span>${t.lv?`<span class="tpill">${t.name}</span>`:''}`:(cls||'').includes('me')?`<span class="hug sm" title="${t.lv?t.name:'아직 등급이 없어요'}">${hugBear(t)}</span>`:t.lv?`<span class="tb" title="${t.name}">${bear(t,22)}</span>`:''}</button>`};
const stars=n=>'★'.repeat(n)+'<span style="opacity:.25">'+'★'.repeat(5-n)+'</span>';
function ago(t){if(!t)return'';const m=(Date.now()-t)/6e4;if(m<1)return'방금';if(m<60)return Math.floor(m)+'분 전';if(m<1440)return Math.floor(m/60)+'시간 전';return Math.floor(m/1440)+'일 전'}
function toast(msg){const t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,1900)}

function deckFor(age){
  const G=allGroups(), real=G.real.filter(g=>g.age===age).sort((a,b)=>(b.at||0)-(a.at||0));
  return real.length>=3?real:real.concat(G.samples.filter(g=>g.age===age));
}

/* ---------- HOME ---------- */
const SHELVES=[{tag:'christmas',title:'크리스마스를 기다리며 읽어볼까요?'},{tag:'animals',title:'동물 친구들이 좋아요'}];
const TAGS=[{k:'christmas',label:'크리스마스·겨울'},{k:'animals',label:'동물 친구'}];
const miniHTML=b=>`<button class="mini" data-open="${b.id}">
  <div class="mc${coverSrc(b)?' has-img':''}" style="background:${coverBg(b.hue)};color:${coverInk(b.hue)}">${coverSrc(b)?coverImg(b):esc(b.title)}</div>
  <span class="mt">${ageOf(b.age).label} · ${b.recs.length>1?b.recs.length+'명 추천':esc(nameOf(b.uid))}</span></button>`;
/* ---------- 홈 다시 그리기: 스크롤·터치 중에는 잠깐 미뤄요 (아이폰에서 스크롤이 끊기는 문제) ---------- */
let homeTouch=false, homeScrollAt=0, homeLater=null;
function renderHome(){
  const busy=homeTouch||Date.now()-homeScrollAt<700;
  if(busy){ clearTimeout(homeLater); homeLater=setTimeout(renderHome,350); return }
  clearTimeout(homeLater); homeLater=null; renderHomeNow();
}
(()=>{const H=document.getElementById('home'); if(!H)return;
  H.addEventListener('touchstart',()=>{homeTouch=true},{passive:true});
  const up=()=>{homeTouch=false; homeScrollAt=Date.now()};
  H.addEventListener('touchend',up,{passive:true}); H.addEventListener('touchcancel',up,{passive:true});
  H.addEventListener('scroll',()=>{homeScrollAt=Date.now()},{passive:true,capture:true});
})();
function renderHomeNow(){
  const hadFocus=document.activeElement&&document.activeElement.id==='h-q';
  const G=allGroups();
  /* 한 책은 홈에서 한 섹션에만 보여요. 우선순위: 테마 책장(SHELVES 순서: 크리스마스 → 동물) → 새로 등록된 책 */
  const used=new Set();
  const shelfItems=SHELVES.map(sh=>{const items=[...G.real,...G.samples].filter(g=>g.tags.includes(sh.tag)&&!used.has(g.key))
    .sort((a,b)=>(a.sample?1:0)-(b.sample?1:0)||AGES.findIndex(x=>x.k===a.age)-AGES.findIndex(x=>x.k===b.age));
    items.forEach(g=>used.add(g.key)); return {sh,items}});
  const recent=G.real.filter(g=>!used.has(g.key)).sort((a,b)=>(b.at||0)-(a.at||0)).slice(0,10);
  const list=G.real.length?recent:G.samples.filter(g=>!used.has(g.key)).slice(0,6);
  const __html=`
    <div class="brand">
      <h1>Bookle<em class="tagline">Selected with mama's love</em></h1>
      ${signedIn()?`<div style="display:flex;align-items:center;gap:10px">${av(uid,'me')}</div>`:`<button class="pill" id="h-login">로그인</button>`}
    </div>
    <form class="hsearch" id="h-form" role="search">
      <span class="hs-ic">${ICON.search}</span>
      <input type="search" id="h-q" placeholder="제목, 저자로 검색" autocomplete="off" enterkeyhint="search" value="${esc(homeQ)}" aria-label="책 검색">
      <button type="button" class="hs-cam" id="h-snap" aria-label="사진으로 찾기 (표지·바코드)">${ICON.camera}</button>
    </form>
    <div id="h-results" ${homeQ?'':'hidden'}>${homeQ?homeResultsHTML(homeQ):''}</div>
    <div id="h-rest" class="hrest" ${homeQ?'hidden':''}>
    ${guideCardHTML()}
    <div>
      <h2 class="sec-title">연령별로 넘겨보기</h2>
      <div class="ages">${(()=>{const ca=profiles[uid]&&profiles[uid].childAge;return ca?[ageOf(ca),...AGES.filter(x=>x.k!==ca)]:AGES})().map(a=>{
        const mineAge=profiles[uid]&&profiles[uid].childAge===a.k;
        const real=G.real.filter(b=>b.age===a.k).length;
        const hs=deckFor(a.k).slice(0,3).map(b=>b.hue);
        return `<button class="age${mineAge?' mine':''}" style="background:var(${a.tone})" data-age="${a.k}">${mineAge?'<span class="mytag">우리 아이</span>':''}
          <div><div class="lbl">${a.label.replace('Y','<small class="yy">Y</small>').replace('+','<small class="yp">+</small>')}</div><div class="sub">${a.sub}</div></div>
          ${real?`<div class="count">${real}권 등록됨</div>`:''}
        </button>`}).join('')}</div>
    </div>
    ${list.length?`<div>
      <h2 class="sec-title">새로 등록된 책</h2>
      <div class="recent">${list.map(b=>`<button class="mini" data-open="${b.id}">
        <div class="mc${coverSrc(b)?' has-img':''}" style="background:${coverBg(b.hue)};color:${coverInk(b.hue)}">${coverSrc(b)?coverImg(b):esc(b.title)}</div>
        <span class="mt">${ageOf(b.age).label} · ${b.recs.length>1?b.recs.length+'명 추천':esc(nameOf(b.uid))}</span></button>`).join('')}</div>
    </div>`:''}
    ${shelfItems.map(({sh,items})=>{
      return items.length?`<div><h2 class="sec-title">${sh.title}</h2><div class="recent">${items.map(miniHTML).join('')}</div></div>`:''}).join('')}
    ${!G.real.length&&!homeQ?`<div class="note">아직 등록된 책이 없어서 <b>예시 책</b>을 보여드리고 있어요. 아래 <b>책 등록</b>으로 우리 아이가 좋아한 책을 처음으로 올려주세요.</div>`:''}
    ${legalFooter()}
    </div>
    `;
  /* 바뀐 게 없으면 다시 그리지 않아요. 다시 그릴 때는 가로 책 줄 위치를 지켜요 */
  const H=$('#home'), sig=__html.replace(/kb\d+/g,'');   // 곰 그림의 내부 id는 매번 달라서 빼고 비교
  if(H.__sig!==sig){
    const keep=[...H.querySelectorAll('.recent')].map(r=>r.scrollLeft), top=H.scrollTop;
    H.innerHTML=__html; H.__sig=sig;
    [...H.querySelectorAll('.recent')].forEach((r,k)=>{if(keep[k])r.scrollLeft=keep[k]});
    if(H.scrollTop!==top)H.scrollTop=top;
  }
  $('#homefab').innerHTML=canWrite||!db?`<button class="fab" id="fab">${ICON.plus}책 등록</button>`:'';
  if(hadFocus){const q=$('#h-q');q.focus();q.setSelectionRange(q.value.length,q.value.length)}
}
$('#homefab').addEventListener('click',e=>{if(e.target.closest('#fab'))openRegister()});
$('#home').addEventListener('click',e=>{
  const fg=e.target.closest('[data-gid]'); if(fg){openBook(freshBook(fg.dataset.gid));return}
  const hc=e.target.closest('[data-hcat]'); if(hc){openRegister({...homeCat[+hc.dataset.hcat]});return}
  if(e.target.closest('[data-hact="snap"]')){photoFind();return}
  const a=e.target.closest('[data-age]'); if(a){openDeck(a.dataset.age,0);return}
  const o=e.target.closest('[data-open]'); if(o){const b=freshBook(o.dataset.open); if(b){openDeck(b.age,Math.max(0,deckFor(b.age).findIndex(x=>x.id===b.id)))}return}
  if(e.target.closest('#h-snap')) photoFind();
  if(e.target.closest('#h-likes')){openProfile(uid);profTab='liked';renderProfile();return}
  if(e.target.closest('#h-login')) requireLogin(()=>{},'로그인하면 좋아요·댓글·책 등록을 할 수 있어요.');
});

/* ---------- 홈 검색 (글자 + 사진) ---------- */
let homeQ='', homeCat=[], remoteCache={}, remoteTimer=null;
function queueRemote(q){
  if(!db)return; q=q.trim(); if(q.length<2||q in remoteCache)return;
  clearTimeout(remoteTimer); remoteTimer=setTimeout(async()=>{ try{ remoteCache[q]=await api.searchBooks(q) }catch(_){ remoteCache[q]=[] } if(homeQ.trim()===q)updateHomeSearch() },350);
}
function searchGroups(q){
  const G=allGroups(), all=[...G.real,...G.samples], t=q.toLowerCase().trim(), nt=normTitle(q);
  return all.filter(g=>(nt&&normTitle(g.title).includes(nt))||String(g.author||'').toLowerCase().includes(t)||(g.isbn&&String(g.isbn).includes(t.replace(/\D/g,'')||'x')))
    .sort((a,b)=>(a.sample?1:0)-(b.sample?1:0)||(b.recs.length-a.recs.length));
}
function foundRow(g){return `<button class="found" data-gid="${g.id}"><span class="fc" style="background:${coverBg(g.hue)};color:${coverInk(g.hue)}">${coverSrc(g)?`<img src="${esc(coverSrc(g))}" alt="">`:esc(g.title)}</span>
  <div><b>${esc(g.title)}</b><span>${esc(g.author||'')}</span><span>${ageOf(g.age).label} · ${g.sample?'북클 예시':g.recs.length>1?`이웃 ${g.recs.length}명 추천`:esc(nameOf(g.uid))+'님 추천'} · ★ ${g.rating||'-'}</span></div>${ICON.back.replace('M15 5l-7 7 7 7','M9 5l7 7-7 7')}</button>`}
function homeResultsHTML(q){
  const hits=searchGroups(q), have=new Set(hits.map(g=>normTitle(g.title)));
  const nt=normTitle(q), t=q.toLowerCase();
  const pool=db?(remoteCache[q.trim()]||[]):DEMO_CATALOG;
  const cat=pool.filter(c=>!have.has(normTitle(c.title))&&(db||(nt&&normTitle(c.title).includes(nt))||c.author.toLowerCase().includes(t))).slice(0,5); homeCat=cat;
  let h='';
  if(hits.length)h+=`<div class="blk"><h4>북클에 있는 책 ${hits.length}</h4><div class="recs">${hits.slice(0,20).map(foundRow).join('')}</div></div>`;
  if(cat.length)h+=`<div class="blk"><h4>아직 추천이 없는 책</h4><div class="recs">${cat.map((c,i)=>`<button class="found" data-hcat="${i}"><span class="fc" style="background:${coverBg(HUES[i%HUES.length])};color:${coverInk(HUES[i%HUES.length])}">${c.cover?`<img src="${esc(c.cover)}" alt="">`:esc(c.title)}</span><div><b>${esc(c.title)}</b><span>${esc(c.author)} · ${esc(c.publisher)}</span></div><span class="pill primary" style="padding:7px 12px;font-size:13px;flex:none">첫 추천하기</span></button>`).join('')}</div></div>`;
  if(db&&!(q.trim() in remoteCache))h+=`<p class="lfine">찾는 중…</p>`;
  if(!hits.length&&!cat.length&&(!db||(q.trim() in remoteCache)))h+=`<div class="pempty">"${esc(q)}"에 맞는 책이 없어요.<br>영어 제목으로 찾거나, 표지·바코드를 찍어보세요.<button class="pill" data-hact="snap">${ICON.camera}</button></div>`;
  return h;
}
function updateHomeSearch(){
  const r=$('#h-results'), rest=$('#h-rest'); if(!r)return;
  r.hidden=!homeQ; rest.hidden=!!homeQ; r.innerHTML=homeQ?homeResultsHTML(homeQ):'';
}
function openBook(g){
  if(!g)return; if(profileUid){profileUid=null;$('#profile').hidden=true}
  if(guideOpen){guideOpen=false;$('#guide').hidden=true}
  openDeck(g.age,Math.max(0,deckFor(g.age).findIndex(x=>x.id===g.id)));
  setTimeout(()=>{const c=$('#deck .card.cur'); if(c)openDetail(c,freshBook(g.id)||g)},120);
}
$('#home').addEventListener('input',e=>{if(e.target.id==='h-q'){homeQ=e.target.value;updateHomeSearch();queueRemote(homeQ)}});
$('#home').addEventListener('submit',e=>{if(e.target.id==='h-form'){e.preventDefault();$('#h-q').blur()}});

/* ---------- 우리 아이 영어 가이드 (엄마표 영어 단계) ----------
   아이 생일(연·월)로 지금 개월 수를 계산하고, 그 시기에 맞는 단계를 보여줘요.
   내용은 일반적인 엄마표 영어 흐름이에요. 아이마다 속도가 달라요. */
const STAGES=[
 {n:1,kid:'아기곰',from:0,to:12,name:'소리 샤워',tag:'영어 소리에 익숙해지는 시기',books:['0-2'],
  about:'뜻보다 소리의 리듬과 억양에 먼저 익숙해지는 때예요. 엄마 목소리와 표정에 가장 크게 반응해요.',
  how:['영어 동요와 자장가를 몇 곡 정해 매일 반복해 들려줘요','기저귀 갈기, 목욕처럼 매일 하는 일을 짧은 영어로 말해줘요 ("Diaper time!", "Splash, splash!")','그림이 큰 보드북을 소리 내어 읽어줘요. 끝까지 안 읽어도 괜찮아요','손유희(Twinkle Twinkle, Itsy Bitsy Spider)로 노래와 동작을 함께 해요'],
  routine:[['아침','"Good morning" 노래로 하루 시작'],['낮','보드북 1권 같이 넘겨보기'],['잠자리','영어 자장가 1곡']],
  check:['매일 영어 노래 1곡 들려주기','보드북 1권 같이 넘겨보기','일상 표현 3개 영어로 말해보기']},
 {n:2,kid:'아장아장곰',from:12,to:24,name:'첫 단어',tag:'그림과 단어를 연결하는 시기',books:['0-2'],
  about:'손가락으로 가리키며 이름을 궁금해하는 때예요. 같은 책을 계속 읽어달라고 하는 게 자연스러워요.',
  how:['사물 그림책을 보며 "Where\'s the dog?" 하고 같이 찾아요','플랩북을 들추며 "Peekaboo!" 놀이를 해요','율동 동요(Head, Shoulders, Knees and Toes)로 몸 단어를 익혀요','아이가 가리키는 것을 바로 영어로 이름 말해줘요'],
  routine:[['아침','율동 동요 1곡'],['낮','플랩북 들추기 놀이'],['저녁','목욕하며 몸 단어 말하기']],
  check:['동물·음식 단어 10개 들려주기','좋아하는 책 반복해서 읽기','가리키는 것에 영어로 답해주기']},
 {n:3,kid:'꼬마곰',from:24,to:36,name:'반복 문장',tag:'패턴 문장을 따라 하는 시기',books:['0-2','3-4'],
  about:'같은 문장이 반복되는 책을 좋아하고, 문장 끝을 스스로 채우려고 해요.',
  how:['「Brown Bear」처럼 문장이 반복되는 패턴북을 골라요','익숙해지면 문장 끝을 비워두고 아이가 채우게 해요','노래가 있는 책은 노래로 불러주며 읽어요','가게놀이처럼 짧은 역할놀이를 해요 ("Here you are!", "Thank you!")'],
  routine:[['아침','노래책 1권'],['낮','역할놀이 5분'],['잠자리','패턴북 같이 외치며 읽기']],
  check:['패턴 문장 하나 같이 말해보기','영어 노래 하나 끝까지 부르기','역할놀이 한 번 해보기']},
 {n:4,kid:'유치원곰',from:36,to:60,name:'이야기 듣기',tag:'짧은 이야기를 즐기는 시기',books:['3-4','5-6'],
  about:'처음·중간·끝이 있는 이야기를 따라가고, "왜?"를 많이 물어요.',
  how:['이야기 그림책을 하루 1~2권 읽어요','읽기 전에 표지를 보며 "What do you think will happen?" 하고 물어봐요','읽고 나서 쉬운 질문 하나로 이야기를 나눠요','영상은 이미 읽은 책의 read-aloud나 노래로 연결해요'],
  routine:[['낮','이야기책 1권 + 질문 하나'],['오후','책 장면 따라 하기 놀이'],['잠자리','좋아하는 책 다시 읽기']],
  check:['이야기책 1권 끝까지 읽기','읽기 전 표지 보고 예측해보기','책 속 장면 하나 따라 해보기']},
 {n:5,kid:'어린이곰',from:60,to:84,name:'글자와 소리',tag:'알파벳 소리와 친해지는 시기',books:['5-6'],
  about:'글자에 관심이 생기고, 같은 소리로 끝나는 말(라임)을 재미있어해요.',
  how:['알파벳 소리 노래로 글자마다 나는 소리를 익혀요','집 안 물건의 첫소리를 찾는 놀이를 해요 ("B, b, ball!")','책에서 자주 나오는 단어(the, I, a)를 손가락으로 짚어봐요','라임이 많은 책에서 같은 소리 나는 단어를 찾아요'],
  routine:[['아침','알파벳 소리 노래'],['낮','첫소리 찾기 놀이'],['잠자리','라임 책 읽기']],
  check:['알파벳 소리 5개 익히기','첫소리 찾기 놀이 한 번','책에서 아는 단어 3개 짚어보기']},
 {n:6,kid:'책벌레곰',from:84,to:999,name:'스스로 읽기',tag:'얼리 리더스로 혼자 읽기 시작',books:['7+'],
  about:'쉬운 문장을 소리 내어 읽기 시작해요. 다 읽었다는 성취감이 가장 큰 동력이에요.',
  how:['쉬운 리더스를 아이가 소리 내어 읽고, 엄마는 들어줘요','한 쪽씩 번갈아 읽어요','챕터북은 하루 한 챕터씩 잠자리에 읽어줘요','다 읽은 책은 스티커나 기록으로 남겨요'],
  routine:[['오후','리더스 1권 소리 내어 읽기'],['저녁','번갈아 읽기'],['잠자리','챕터북 한 챕터']],
  check:['리더스 1권 혼자 읽기','번갈아 읽기 한 번','읽은 책 기록 남기기']}
];
/* 아이 나이에 따라 자라는 '우리 아이 곰' (등급 곰과 별개) — 입체 봉제 테디 */
let _kbId=0;
function kidBear(n,faceOnly){
  const id='kb'+(++_kbId), u=k=>`url(#${id}${k})`;
  const sc=[.74,.83,.9,.96,1,1][n-1];
  const defs=`<defs>
    <radialGradient id="${id}f" cx=".36" cy=".28" r=".9"><stop offset="0" stop-color="#EBBE8C"/><stop offset=".45" stop-color="#C28650"/><stop offset=".85" stop-color="#8A5428"/><stop offset="1" stop-color="#6B3E1C"/></radialGradient>
    <radialGradient id="${id}d" cx=".35" cy=".25" r=".95"><stop offset="0" stop-color="#D49A62"/><stop offset=".6" stop-color="#9E6331"/><stop offset="1" stop-color="#673A19"/></radialGradient>
    <radialGradient id="${id}m" cx=".45" cy=".3" r=".8"><stop offset="0" stop-color="#FFF7EA"/><stop offset=".7" stop-color="#F0D3AC"/><stop offset="1" stop-color="#D9AF7E"/></radialGradient>
    <radialGradient id="${id}p" cx=".45" cy=".35" r=".75"><stop offset="0" stop-color="#F8E4C9"/><stop offset="1" stop-color="#C99462"/></radialGradient>
    <radialGradient id="${id}n" cx=".38" cy=".28" r=".85"><stop offset="0" stop-color="#7A5038"/><stop offset="1" stop-color="#1E1009"/></radialGradient>
    <radialGradient id="${id}s" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#2A160A" stop-opacity=".42"/><stop offset="1" stop-color="#2A160A" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}e" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#4A3020"/><stop offset="1" stop-color="#0E0703"/></radialGradient>
    <linearGradient id="${id}k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBE1EB"/><stop offset="1" stop-color="#E29BB6"/></linearGradient>
    <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#A8C994"/><stop offset="1" stop-color="#5A844A"/></linearGradient>
    <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9BBBE0"/><stop offset="1" stop-color="#46668F"/></linearGradient>
    <linearGradient id="${id}o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F5C784"/><stop offset="1" stop-color="#C47B37"/></linearGradient>
    <filter id="${id}z" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="1.8" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="${id}bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>
  </defs>`;
  const fur=(inner)=>`<g filter="${u('z')}">${inner}</g>`;
  const ao=(cx,cy,rx,ry,o=.32)=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#3A1E0B" opacity="${o}" filter="${u('bl')}"/>`;
  /* 팔: 어깨(x,y)에서 시작해 각도 a(도, 0=아래)로 뻗는 소시지 모양. 어깨가 몸 안에 묻혀 붙어 보여요 */
  const arm=(x,y,a,len=21,w=6.8,extra='',cls='')=>`<g transform="translate(${x} ${y}) rotate(${a})"><g ${cls?`class="${cls}"`:''}>
      ${fur(`<path d="M${-w} 0Q${-w} ${-w} 0 ${-w}Q${w} ${-w} ${w} 0Q${w+1} ${len*.6} ${w*.6} ${len}Q0 ${len+w*1.1} ${-w*.6} ${len}Q${-w-1} ${len*.6} ${-w} 0Z" fill="${u('d')}"/>`)}
      <ellipse cx="0" cy="${len-1}" rx="${w*.62}" ry="${w*.5}" fill="${u('p')}" opacity=".9"/>${extra}</g></g>`;
  const eye=(x)=>`<g class="kb-blink"><ellipse cx="${x}" cy="45" rx="3.3" ry="3.6" fill="${u('e')}"/><ellipse cx="${x+1.1}" cy="43.6" rx="1.2" ry="1.3" fill="#fff"/><circle cx="${x-1.1}" cy="46.6" r=".5" fill="#fff" opacity=".7"/></g>`;
  const eyes=n===6?'':eye(51)+eye(69);
  const mouth=n===3?`<path d="M56.6 59.6Q60 66.4 63.4 59.6Z" fill="#5A2416"/><path d="M58 62.6Q60 64.6 62 62.6" fill="#E88E8E"/>`
    :`<path d="M60 56V58.3M56.4 58.6Q58.2 60.7 60 58.4Q61.8 60.7 63.6 58.6" fill="none" stroke="#3A2212" stroke-width="1.3" stroke-linecap="round"/>`;
  const shadow=`<ellipse cx="60" cy="116" rx="31" ry="5" fill="${u('s')}"/>`;
  const legs=fur(`<ellipse cx="46" cy="108.5" rx="9.6" ry="6.8" fill="${u('d')}"/><ellipse cx="74" cy="108.5" rx="9.6" ry="6.8" fill="${u('d')}"/>`)+
    `<ellipse cx="46" cy="109.4" rx="5.4" ry="4" fill="${u('p')}"/><ellipse cx="74" cy="109.4" rx="5.4" ry="4" fill="${u('p')}"/>
     <g fill="#B98657" opacity=".55"><circle cx="43" cy="107.2" r="1"/><circle cx="46" cy="106.6" r="1"/><circle cx="49" cy="107.2" r="1"/><circle cx="71" cy="107.2" r="1"/><circle cx="74" cy="106.6" r="1"/><circle cx="77" cy="107.2" r="1"/></g>`;
  const body=fur(`<ellipse cx="60" cy="90" rx="21.5" ry="20.5" fill="${u('f')}"/>`)+
    `<ellipse cx="60" cy="93" rx="12.5" ry="13" fill="${u('m')}" opacity=".88"/>
     <path d="M60 81V105" stroke="#9B6A38" stroke-width=".9" stroke-dasharray="1.8 1.8" opacity=".5"/>
     ${ao(60,71.5,15,4.5,.38)}`;
  const head=fur(`<circle cx="41" cy="30" r="9.4" fill="${u('d')}"/><circle cx="79" cy="30" r="9.4" fill="${u('d')}"/>`)+
    `<circle cx="41.6" cy="30.6" r="5.2" fill="${u('p')}"/><circle cx="78.4" cy="30.6" r="5.2" fill="${u('p')}"/>`+
    fur(`<circle cx="60" cy="48" r="23.5" fill="${u('f')}"/>`)+
    `<ellipse cx="51" cy="35" rx="9.5" ry="5" fill="#fff" opacity=".16" transform="rotate(-22 51 35)"/>
     <path d="M76 38Q81 47 77 58" stroke="#FFE6C2" stroke-opacity=".25" stroke-width="2.5" fill="none" stroke-linecap="round"/>
     ${ao(60,62.5,10,3,.22)}
     <ellipse cx="60" cy="56.5" rx="11.2" ry="8.6" fill="${u('m')}"/>
     <path d="M55.6 51.2Q60 49.2 64.4 51.2Q64.2 55.2 60 55.8Q55.8 55.2 55.6 51.2Z" fill="${u('n')}"/><ellipse cx="58.4" cy="51.3" rx="1.7" ry=".85" fill="#fff" opacity=".6"/>
     <ellipse cx="45" cy="56" rx="4" ry="2.4" fill="#F09C8E" opacity=".4"/><ellipse cx="75" cy="56" rx="4" ry="2.4" fill="#F09C8E" opacity=".4"/>${eyes}${mouth}`;
  const book=(fill,w=17)=>`<g transform="translate(0 1)">${ao(60,99,w,3,.3)}<path d="M${60-w} 84Q${60-w/2} 79 60 84Q${60+w/2} 79 ${60+w} 84L${60+w} 98Q${60+w/2} 93 60 98Q${60-w/2} 93 ${60-w} 98Z" fill="${fill}"/>
    <path d="M${62-w} 83.5Q${60-w/2} 79.8 60 83.5Q${60+w/2} 79.8 ${58+w} 83.5L${58+w} 96Q${60+w/2} 92.2 60 96Q${60-w/2} 92.2 ${62-w} 96Z" fill="#FFFBF2"/>
    <path d="M60 83.5V96" stroke="#C9B28F" stroke-width="1"/><path d="M${64-w} 87Q${60-w/2} 85 58 87M${64-w} 90Q${60-w/2} 88 58 90M62 87Q${60+w/2} 85 ${56+w} 87M62 90Q${60+w/2} 88 ${56+w} 90" stroke="#C9B28F" stroke-width=".8" fill="none"/></g>`;
  const note=(x,y,d)=>`<g class="kb-float" style="animation-delay:${d}s" fill="#8A5A34"><path d="M${x} ${y}V${y-11}L${x+7} ${y-13}V${y-2}" fill="none" stroke="#8A5A34" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="${x-2.2}" cy="${y+.5}" rx="3" ry="2.3"/><ellipse cx="${x+4.8}" cy="${y-1.5}" rx="3" ry="2.3"/></g>`;
  /* 팔 자세 */
  const restL=arm(43,80,42,21,7), restR=arm(77,80,-42,21,7);
  const paw=(x,y)=>fur(`<ellipse cx="${x}" cy="${y}" rx="5.8" ry="5" fill="${u('d')}"/>`)+`<ellipse cx="${x}" cy="${y+.6}" rx="3.4" ry="2.8" fill="${u('p')}" opacity=".9"/>`;
  const holdL=paw(42,92), holdR=paw(78,92); // 책 양끝을 쥔 앞발
  const behindHold=arm(46,80,35,15)+arm(74,80,-35,15);
  const wave=(extra='')=>arm(76,79,-145,21,6.8,extra,'kb-wave');
  let back='',front='',top='',armsBack='';
  if(n===1){
    top=`<path d="M35 41Q36 16 60 15Q84 16 85 41Q73 30 60 30Q47 30 35 41Z" fill="${u('k')}"/><path d="M37 38Q48 28 60 28Q72 28 83 38" stroke="#fff" stroke-opacity=".6" stroke-width="1.4" fill="none" stroke-dasharray="2 2"/><circle cx="60" cy="14" r="4.2" fill="#F3B7CB"/><ellipse cx="50" cy="22" rx="6" ry="2.5" fill="#fff" opacity=".35" transform="rotate(-18 50 22)"/>
      <circle cx="60" cy="61.5" r="5.4" fill="#BFE3F1"/><circle cx="60" cy="61.5" r="2.4" fill="#fff" opacity=".85"/>`;
    armsBack=restL+wave(`<path d="M0 20V34" stroke="#E2B24F" stroke-width="3" stroke-linecap="round"/><circle cx="0" cy="38.5" r="6.8" fill="#F5CF6B"/><circle cx="-2" cy="36.5" r="2" fill="#fff" opacity=".7"/>`);
  } else if(n===2){
    back=`<g><circle cx="25" cy="107" r="9.5" fill="${u('b')}"/><path d="M16 105Q25 100 34 105" stroke="#fff" stroke-opacity=".7" stroke-width="1.6" fill="none"/><circle cx="22" cy="103" r="2.2" fill="#fff" opacity=".6"/></g>`;
    armsBack=restL+wave();
  } else if(n===3){
    armsBack=restL+wave(); top=note(98,40,0)+note(18,34,.8);
  } else if(n===4){
    back=`<rect x="32" y="69" width="56" height="36" rx="11" fill="${u('o')}"/><rect x="36" y="72" width="48" height="6" rx="3" fill="#fff" opacity=".18"/>`;
    armsBack=behindHold; front=`<path d="M46 72L44 99M74 72L76 99" stroke="#A8642C" stroke-width="3.6" stroke-linecap="round"/>`+book(u('g'))+holdL+holdR;
  } else if(n===5){
    back=`<g class="kb-float"><text x="15" y="40" font-size="17" font-weight="800" fill="#8A5A34" font-family="Georgia,serif">A</text></g><g class="kb-float" style="animation-delay:.9s"><text x="98" y="31" font-size="15" font-weight="800" fill="#8A5A34" font-family="Georgia,serif">b</text></g>`;
    armsBack=restL+wave(`<path d="M0 19V36" stroke="#F2C14E" stroke-width="5" stroke-linecap="round"/><path d="M0 36V41" stroke="#3A2212" stroke-width="2.2" stroke-linecap="round"/>`);
    front=`<g><rect x="67" y="96" width="15" height="15" rx="3" fill="${u('b')}"/><rect x="68.5" y="97.5" width="12" height="3" rx="1.5" fill="#fff" opacity=".25"/><text x="74.5" y="107.8" text-anchor="middle" font-size="10" font-weight="800" fill="#fff" font-family="Georgia,serif">C</text></g>`;
  } else {
    top=`<path d="M48 46.5Q51 48.6 54 46.5M66 46.5Q69 48.6 72 46.5" fill="none" stroke="#1C0F07" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="51" cy="45.5" r="6.2" fill="#fff" fill-opacity=".14" stroke="#C9A24B" stroke-width="1.6"/><circle cx="69" cy="45.5" r="6.2" fill="#fff" fill-opacity=".14" stroke="#C9A24B" stroke-width="1.6"/><path d="M57.2 45.5H62.8" stroke="#C9A24B" stroke-width="1.6"/>`;
    armsBack=behindHold; front=`<rect x="41" y="97" width="38" height="5.5" rx="1.5" fill="#3F5F89"/>`+book(u('b'),19)+paw(40,92)+paw(80,92);
  }
  if(faceOnly) return `<svg viewBox="25 9 70 70" aria-hidden="true">${defs}<g class="kb-bob">${head}${n===3?'':top}</g></svg>`;
  return `<svg viewBox="0 0 120 120" aria-hidden="true">${defs}${shadow}<g transform="translate(60 118) scale(${sc}) translate(-60 -118)"><g class="kb-bob">${back}${armsBack}${legs}${body}${head}${top}${front}</g></g></svg>`;
}
/* 연구 근거를 반영한 단계별 상세 — 읽어주는 법 · 재미 붙이기 · 피할 것 · 근거 */
const SRC={
  aap:{l:'미국소아과학회 2024 공동읽기 권고',u:'https://www.healthychildren.org/English/news/Pages/beyond-literacy-shared-reading-starting-in-infancy-offers-lifelong-benefits.aspx'},
  kuhl:{l:'Kuhl 외 2003, PNAS',u:'https://www.washington.edu/news/2003/07/14/social-interaction-plays-key-role-in-how-infants-learn-language-studies-show/'},
  horst:{l:'Horst 외 2011, Frontiers in Psychology',u:'https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2011.00017/pdf'},
  dr:{l:'Pillinger & Vardy 2022 대화식 읽기 리뷰',u:'https://reachoutandread.org/pillinger_2022_a-story-so-far-a-systematic-review-of-the-dialogic-reading-literature'},
  piasta:{l:'Piasta 외 2012, Child Development',u:'https://www.readingrockets.org/resources/resource-library/increasing-young-childrens-contact-print-during-shared-reading'},
  munzer:{l:'Munzer 외 2019, Pediatrics',u:'https://www.sciencedaily.com/releases/2019/03/190325080459.htm'},
  sonn:{l:'Sonnenschein & Munsterman 2002',u:'https://sedl.org/connections/resources/citations/280.html'},
  hoff:{l:'Hoff 2015, 이중언어 입력 연구 리뷰',u:'https://www.fau.edu/newsdesk/articles/Bilingual-development-in-children-081715.php'}
};
const STAGE_PLUS={
 1:{read:['목소리를 높고 느리게, 표정은 크게 해요. 아기는 과장된 말투에 더 오래 집중해요','그림을 손가락으로 짚으며 이름과 소리를 함께 말해요 ("A dog! Woof woof!")','아기가 옹알이하면 대답하듯 받아줘요. 주고받는 게 읽기의 전부예요','한두 페이지만 보고 덮어도 괜찮아요. 아기가 고개를 돌리면 오늘은 끝'],
    fun:['입에 넣고 만져도 되는 보드북·헝겊책을 장난감 바구니에 같이 둬요','아기가 오래 쳐다보는 페이지에서 멈춰 그 그림 이야기를 더 해줘요','매일 같은 시간(잠자리 등)에 같은 노래와 책으로 "책 시간" 신호를 만들어요'],
    avoid:['영어 영상·오디오를 틀어두는 것으로 대신하기. 9개월 아기 실험에서 사람이 직접 읽어준 경우에만 소리를 익혔어요','끝까지 읽히려고 아기를 붙잡아 두기'],
    why:[['출생부터 함께 읽기를 시작하고, 서로 즐거운 시간이 되게 하라고 권해요','aap'],['같은 원어민 중국어도 사람과 직접 만날 때만 배웠고, 영상·오디오로는 배우지 못했어요','kuhl']]},
 2:{read:['아이가 가리키면 바로 영어 이름으로 답해요. 아이가 이끄는 대로 따라가요','질문은 "Where\'s the duck?"처럼 가리키기로 답할 수 있게 해요','아이가 한 단어를 말하면 두세 단어로 늘려 되말해요 (Ball → Big red ball!)','같은 책을 또 읽어달라면 기꺼이 읽어줘요. 반복이 곧 배움이에요'],
    fun:['두 권을 보여주고 아이가 고르게 해요. 고른 책은 더 오래 봐요','플랩·촉감·소리처럼 손으로 하는 책을 골라요','책 속 물건을 실제로 가져와 비교해요 ("Ball! Here\'s your ball!")'],
    avoid:['"이거 영어로 뭐야?" 하고 시험처럼 묻기','종이책 대신 효과음 많은 전자책 위주로 읽기. 부모와 아이의 대화가 줄어요'],
    why:[['같은 책을 반복해 들은 아이가 새 단어를 더 잘 기억했어요','horst'],['전자책을 읽을 때 부모와 아이의 말과 상호작용이 종이책보다 적었어요','munzer']]},
 3:{read:['문장 끝을 비우고 기다려요 ("Brown bear, brown bear, what do you ___?")','아이가 말하면 칭찬하고 조금 늘려 되말한 뒤, 아이가 따라 하게 해요 (대화식 읽기 PEER)','같은 패턴은 노래하듯 리듬을 살려 함께 외쳐요','뜻은 그림으로 전하고, 한국어 해석은 꼭 필요할 때 한 번만 해요'],
    fun:['아이 이름을 넣어 문장을 바꿔요 ("Jiwoo, Jiwoo, what do you see?")','책 장면을 몸으로 따라 해요 (곰처럼 걷기, 문 두드리기)','좋아하는 책은 외출 가방에 넣어 어디서나 읽어요'],
    avoid:['매번 새 책만 읽기. 이 시기는 같은 책을 여러 번 읽을수록 좋아요','틀린 말을 바로 고치기. 대신 바른 문장으로 다시 말해줘요'],
    why:[['아이가 이야기꾼이 되고 어른이 묻고 넓혀주는 대화식 읽기가 말하기와 이해에 도움이 됐고, 어린 연령에서 효과가 더 뚜렷했어요','dr'],['같은 책 반복이 단어 기억을 도와요','horst']]},
 4:{read:['질문을 섞어요: 기억("What happened to the bear?"), 열린 질문("Tell me about this page"), 연결("Have you been to a zoo?")','한 페이지에 질문은 하나 정도. 이야기 흐름을 끊지 않아요','등장인물마다 목소리를 바꿔 읽어요','아이 대답이 한국어여도 괜찮아요. 영어로 받아서 다시 말해줘요'],
    fun:['읽기 전에 표지로 "무슨 이야기일까?" 맞히기 게임을 해요','도서관·서점에서 아이가 직접 책을 골라요','책 장면으로 역할놀이를 하고, 다음 날 그 책을 다시 읽어요'],
    avoid:['질문 폭탄으로 시험 보듯 읽기','아이가 지루해하는데 끝까지 읽기. 즐거움이 다음 읽기의 동기예요'],
    why:[['함께 읽는 시간의 정서적 분위기가 아이의 읽기 동기와 이어졌고, 읽는 횟수는 초기 문해력과 이어졌어요. 자주, 그리고 즐겁게','sonn'],['대화식 읽기는 표현·이해 언어에 긍정적이었어요','dr']]},
 5:{read:['제목과 큰 글씨를 손가락으로 짚으며 읽어요 ("This says STOP!")','말풍선, 소리 나는 말(BOOM!)처럼 눈에 띄는 글자를 가리켜요','글자 짚기는 한 번 읽을 때 한두 번만 가볍게. 이야기 즐거움이 먼저예요','같은 소리로 끝나는 단어가 나오면 잠깐 멈춰 같이 말해봐요 (cat, hat)'],
    fun:['책에서 아는 단어 찾기 보물찾기를 해요','라임 사냥: 같은 소리 나는 단어를 찾으면 스티커','역할 바꾸기: 아이가 그림을 보고 엄마에게 이야기를 들려줘요'],
    avoid:['그림책 시간을 파닉스 학습지처럼 바꾸기','발음을 하나하나 지적하기'],
    why:[['읽어줄 때 글자에 아이 시선을 모아준 그룹이 이후 읽기·철자 실력이 더 좋았어요','piasta']]},
 6:{read:['한 쪽씩 번갈아 읽어요. 엄마가 어려운 쪽을 맡아요','막히면 3초 기다렸다가 그림이나 첫소리로 힌트를 줘요','혼자 읽기 시작해도 잠자리 읽어주기는 계속해요','내용 이야기는 한국어로 해도 괜찮아요. 이해와 즐거움이 먼저예요'],
    fun:['시리즈 책으로 "다음 권" 기대감을 만들어요','다 읽은 책은 책장 지도나 스티커로 남겨요','아이가 동생이나 인형에게 읽어주는 시간을 만들어요'],
    avoid:['레벨 올리기 경쟁으로 만들기','영어를 위해 한국어 책 읽기를 줄이기. 모국어도 함께 키워요'],
    why:[['즐거운 분위기가 읽기 동기로 이어져요','sonn'],['엄마가 쓰는 비원어민 영어만으로는 입력이 부족할 수 있어, 원어민이 쓴 그림책·음원으로 보완하고 모국어는 계속 쓰는 게 좋아요','hoff']]}
};
STAGES.forEach(x=>Object.assign(x,STAGE_PLUS[x.n]));
const birthOf=()=>{const p=profiles[uid]; if(p&&p.childBirth)return p.childBirth; try{return localStorage.getItem('bookle.birth')||''}catch(_){return ''}};
function monthsOld(b){ if(!/^\d{4}-\d{2}$/.test(b||''))return null; const [y,m]=b.split('-').map(Number), n=new Date(); const v=(n.getFullYear()-y)*12+(n.getMonth()+1-m); return v<0?null:v }
const stageOf=mo=>STAGES.find(x=>mo>=x.from&&mo<x.to)||STAGES[STAGES.length-1];
const ageKeyFromMonths=mo=>mo<36?'0-2':mo<60?'3-4':mo<84?'5-6':'7+';
const moLabel=mo=>mo<24?`${mo}개월`:`${Math.floor(mo/12)}살 ${mo%12?mo%12+'개월':''}`.trim();
const rangeLabel=st=>st.to>=999?`${Math.floor(st.from/12)}세 이상`:st.from<24?`${st.from}–${st.to}개월`:`${st.from/12}–${st.to/12}세`;
let guideChecks={}, guideOpen=false, guideExpand=null;
function loadChecks(){ try{guideChecks=JSON.parse(localStorage.getItem('bookle.guide')||'{}')}catch(_){guideChecks={}} }
async function saveChecks(){
  try{localStorage.setItem('bookle.guide',JSON.stringify(guideChecks))}catch(_){}
  if(db&&signedIn()){try{await api.saveGuide(guideChecks)}catch(_){}}
}
/* 연령 타일 네 개 가운데에 놓이는 우리 아이 곰 얼굴 */
function ageCenterHTML(){
  const mo=monthsOld(birthOf()), st=mo===null?null:stageOf(mo);
  return `<button class="agecenter${st?'':' empty'}" id="g-open" aria-label="${st?st.kid+' · '+st.n+'단계 '+st.name+' · 영어 가이드 보기':'아이 생일을 넣고 우리 아이 곰 만나기'}">
    <span class="acface">${kidBear(st?st.n:1,true)}</span>
    <span class="acname">${st?st.kid:'우리 아이 곰'}</span></button>`;
}
/* ---------- 개인정보 처리방침 · 이용약관 · 문의 ---------- */
const CONTACT_EMAIL='onseojae@gmail.com';
const legalFooter=()=>`<p class="legal"><a href="/privacy.html" target="_blank" rel="noopener">개인정보 처리방침</a><span>·</span><a href="/terms.html" target="_blank" rel="noopener">이용약관</a><span>·</span><a href="mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('[북클] 문의')}">문의하기</a></p>`;
function guideCardHTML(){
  const b=birthOf(), mo=monthsOld(b);
  if(mo===null) return `<div class="gcard"><div class="gtop"><b>우리 아이 영어 가이드</b></div>
    <div class="gmain"><p class="gsub" style="flex:1">아이 생일을 넣으면 아기곰부터 책벌레곰까지, 지금 시기의 우리 아이 곰과 그에 맞는 엄마표 영어 방법을 보여드려요.</p><div class="kb kb-home">${kidBear(1)}</div></div>
    <div class="gbirth"><input type="month" id="g-birth" aria-label="아이 생일 (연·월)" max="${new Date().toISOString().slice(0,7)}"><button class="pill primary" id="g-go">시작하기</button></div></div>`;
  const st=stageOf(mo), wk=Math.floor(Date.now()/6048e5), tip=st.how[wk%st.how.length];
  const pct=st.to>=999?100:Math.round((mo-st.from)/(st.to-st.from)*100);
  const done=Object.values(guideChecks[st.n]||{}).filter(Boolean).length;
  const sc=sceneNow(), art=sceneArt(sc.k);
  /* 최소 영역: 곰 얼굴 · 우리 아이 단계 · 가이드 보기 한 줄 */
  return `<button class="gmini" id="g-open" aria-label="${st.kid} · ${st.n}단계 ${st.name} · 영어 가이드 보기">
    <span class="gm-face">${kidBear(st.n,true)}</span>
    <span class="gm-txt"><b>${st.kid}</b><small>${st.n}단계 · ${st.name}</small></span>
    <span class="gm-go">가이드 보기<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></span>
  </button>`;
}
/* ---------- 시간대별 곰의 하루 ---------- */
const SCENES=[
  {k:'night',from:20,to:23,label:'잠자리 책 시간',say:['One more story?','Good night, moon~','Read it again!']},
  {k:'sleep',from:23,to:30,label:'쿨쿨 자는 중',say:['Zzz…','Sweet dreams…','Night night…']},
  {k:'morning',from:6,to:10,label:'좋은 아침, 기상!',say:['Good morning!','Rise and shine!','Hello, sunshine!']},
  {k:'play',from:10,to:14,label:'신나는 놀이 시간',say:["Let's play!",'Catch the ball!','One, two, three!']},
  {k:'snack',from:14,to:17,label:'냠냠 간식 시간',say:['Yummy, yummy!','Cookie, please!','More milk, please!']},
  {k:'bath',from:17,to:20,label:'첨벙첨벙 목욕 시간',say:['Splash, splash!','Bubbles! Pop, pop!','Rub-a-dub-dub!']}
];
function sceneNow(d=new Date()){ let h=d.getHours(); if(h<6)h+=24; return SCENES.find(s=>h>=s.from&&h<s.to)||SCENES[0] }
/* 장면 그림: 330×158 좌표, 곰은 가운데(x 96–234, 바닥 y 156)에 서 있어요 */
function sceneArt(k){
  const L='#6B3F26';
  const star=(x,y,r=2.2,d=0)=>`<path class="sc-twinkle" style="animation-delay:${d}s" transform="translate(${x} ${y})" d="M0 ${-r*2}L${r*.55} ${-r*.55}L${r*2} 0L${r*.55} ${r*.55}L0 ${r*2}L${-r*.55} ${r*.55}L${-r*2} 0L${-r*.55} ${-r*.55}Z" fill="#FFE9A8"/>`;
  const svg=(inner,cls='')=>`<svg class="${cls}" viewBox="0 0 330 158" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${inner}</svg>`;
  const S={};
  if(k==='night'||k==='sleep'){
    S.bg=svg(`<defs><radialGradient id="lampG" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFD98A" stop-opacity=".55"/><stop offset="1" stop-color="#FFD98A" stop-opacity="0"/></radialGradient></defs>
      <rect x="22" y="18" width="70" height="62" rx="8" fill="#2E3A63" stroke="#C9A574" stroke-width="4"/><path d="M57 18V80M22 49H92" stroke="#C9A574" stroke-width="3"/>
      <circle cx="74" cy="34" r="9" fill="#FFF1C4"/><circle cx="78" cy="31" r="8" fill="#2E3A63"/>${star(36,30,1.6,0)}${star(46,66,1.4,.8)}${star(82,62,1.6,1.4)}
      ${k==='night'?`<circle cx="276" cy="58" r="44" fill="url(#lampG)"/><path d="M262 92L290 92L284 66L268 66Z" fill="#F3C978" stroke="${L}" stroke-width="1.4"/><rect x="273" y="92" width="6" height="22" fill="#8A5E3C"/><rect x="264" y="112" width="24" height="5" rx="2" fill="#8A5E3C"/>`:''}
      <path d="M92 54Q165 30 238 54V112H92Z" fill="#9C6B45" stroke="${L}" stroke-width="1.6"/><path d="M104 60Q165 42 226 60" stroke="#C99A6C" stroke-width="2" fill="none"/>
      <rect x="112" y="70" width="106" height="34" rx="16" fill="#FFF7EA" stroke="${L}" stroke-opacity=".35"/>`);
    S.fg=svg(`<path d="M70 158V122Q120 108 165 118Q210 108 260 122V158Z" fill="#E7A7B5" stroke="${L}" stroke-width="1.6"/>
      <path d="M70 128Q120 114 165 124Q210 114 260 128" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-dasharray="5 5" fill="none"/>
      <g fill="#fff" opacity=".55"><circle cx="100" cy="140" r="3"/><circle cx="135" cy="148" r="3"/><circle cx="195" cy="146" r="3"/><circle cx="230" cy="138" r="3"/></g>
      ${k==='night'?`<g transform="translate(165 116)"><path d="M-20 0Q-10 -6 0 0Q10 -6 20 0L20 13Q10 8 0 13Q-10 8 -20 13Z" fill="#6F8FB3" stroke="${L}" stroke-width="1.3"/><path d="M-18 -.5Q-9 -5 0 -.5Q9 -5 18 -.5L18 11Q9 7 0 11Q-9 7 -18 11Z" fill="#FFFBF2"/><path d="M0 -.5V11" stroke="#C9B28F"/></g>`
        :`<g class="sc-zzz" fill="#FFF1C4" font-family="Georgia,serif" font-weight="700"><text x="236" y="92" font-size="18">Z</text><text x="254" y="74" font-size="14">z</text><text x="268" y="60" font-size="10">z</text></g>`}`,'fg');
  } else if(k==='morning'){
    S.bg=svg(`<defs><linearGradient id="skyM" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD9A8"/><stop offset="1" stop-color="#FFF4E2"/></linearGradient></defs>
      <rect x="18" y="16" width="86" height="72" rx="8" fill="url(#skyM)" stroke="#C9A574" stroke-width="4"/>
      <g class="sc-sun"><circle cx="61" cy="78" r="18" fill="#FFB85C"/><g stroke="#FFB85C" stroke-width="3" stroke-linecap="round"><path d="M61 52V46M38 62L33 58M84 62L89 58M30 78H24M92 78H98"/></g></g>
      <path d="M18 88V88" /><rect x="18" y="80" width="86" height="8" fill="#9BC38A" opacity=".8"/>
      <path d="M8 12Q24 50 14 96L4 96V12Z" fill="#F2B8B8" opacity=".9"/><path d="M114 12Q98 50 108 96L118 96V12Z" fill="#F2B8B8" opacity=".9"/>
      <g fill="none" stroke="${L}" stroke-width="1.4" stroke-linecap="round" class="sc-bird"><path d="M250 34q5-5 10 0q5-5 10 0"/><path d="M276 50q4-4 8 0q4-4 8 0"/></g>
      <g transform="translate(262 108)"><rect x="-14" y="-14" width="28" height="28" rx="6" fill="#FFF7EA" stroke="${L}" stroke-width="1.4"/><circle r="9" fill="#fff" stroke="${L}" stroke-width="1.2"/><path d="M0 0V-6M0 0L4 2" stroke="${L}" stroke-width="1.4" stroke-linecap="round"/><path d="M-12 -14L-16 -19M12 -14L16 -19" stroke="${L}" stroke-width="1.6" stroke-linecap="round"/></g>`);
    S.fg=svg(`<g class="sc-sparkle">${star(118,40,2.4,0)}${star(214,30,2,0.6)}${star(226,70,1.6,1.1)}</g>`,'fg');
  } else if(k==='play'){
    S.bg=svg(`<g class="sc-cloud"><path d="M40 40a12 12 0 0 1 22-6a10 10 0 0 1 18 6a8 8 0 0 1 0 16H42a8 8 0 0 1-2-16z" fill="#fff" opacity=".9"/></g>
      <g class="sc-cloud2"><path d="M240 28a10 10 0 0 1 18-5a8 8 0 0 1 15 5a7 7 0 0 1 0 13h-31a7 7 0 0 1-2-13z" fill="#fff" opacity=".85"/></g>
      <circle cx="292" cy="30" r="14" fill="#FFD36B"/>
      <path d="M0 132Q80 118 165 126Q250 118 330 132V158H0Z" fill="#B9D59A"/>
      <g transform="translate(52 120)"><path d="M0 0L-8 34M0 0L8 34" stroke="#8A5E3C" stroke-width="3"/><path d="M-18 10H18" stroke="#8A5E3C" stroke-width="3"/></g>`);
    S.fg=svg(`<g transform="translate(232 128)"><rect x="0" y="0" width="20" height="20" rx="3" fill="#F2A65A" stroke="${L}" stroke-width="1.3"/><text x="10" y="15" text-anchor="middle" font-size="12" font-weight="800" fill="#fff" font-family="Georgia,serif">A</text>
      <rect x="22" y="2" width="18" height="18" rx="3" fill="#8FB0D6" stroke="${L}" stroke-width="1.3"/><text x="31" y="15.5" text-anchor="middle" font-size="11" font-weight="800" fill="#fff" font-family="Georgia,serif">B</text>
      <rect x="10" y="-18" width="18" height="18" rx="3" fill="#A8C994" stroke="${L}" stroke-width="1.3"/><text x="19" y="-4.5" text-anchor="middle" font-size="11" font-weight="800" fill="#fff" font-family="Georgia,serif">C</text></g>
      <g class="sc-bounce"><circle cx="86" cy="140" r="12" fill="#E86E6E" stroke="${L}" stroke-width="1.3"/><path d="M75 138Q86 132 97 138" stroke="#fff" stroke-width="2" fill="none"/></g>`,'fg');
  } else if(k==='snack'){
    S.bg=svg(`<rect x="22" y="22" width="60" height="44" rx="4" fill="#FFF7EA" stroke="#C9A574" stroke-width="3"/><path d="M30 58L44 40L54 52L62 44L74 58Z" fill="#A8C994"/><circle cx="66" cy="34" r="5" fill="#F3C978"/>
      <g transform="translate(272 40)"><circle r="20" fill="#FFF7EA" stroke="#C9A574" stroke-width="3"/><path d="M0 0V-12M0 0L8 5" stroke="${L}" stroke-width="2" stroke-linecap="round"/></g>`);
    S.fg=svg(`<path d="M86 124H244L236 158H94Z" fill="#C99A6C" stroke="${L}" stroke-width="1.6"/><rect x="80" y="116" width="170" height="10" rx="4" fill="#B98657" stroke="${L}" stroke-width="1.6"/>
      <g transform="translate(212 92)"><path d="M-9 0H9L7 24H-7Z" fill="#fff" stroke="${L}" stroke-width="1.4"/><path d="M-8 8H8L7 24H-7Z" fill="#FFF7EA"/><path d="M-5 4V18" stroke="#fff" stroke-width="2" opacity=".8"/></g>
      <g transform="translate(120 110)"><ellipse rx="22" ry="5" fill="#fff" stroke="${L}" stroke-width="1.3"/><g class="sc-bounce2"><circle cx="-6" cy="-6" r="8" fill="#D9A15E" stroke="${L}" stroke-width="1.2"/><circle cx="-9" cy="-8" r="1.3" fill="#5A3519"/><circle cx="-3" cy="-4" r="1.3" fill="#5A3519"/><circle cx="8" cy="-5" r="7" fill="#E2B070" stroke="${L}" stroke-width="1.2"/><circle cx="7" cy="-6" r="1.2" fill="#5A3519"/></g></g>`,'fg');
  } else { // bath
    S.bg=svg(`<defs><pattern id="tile" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#E8F2F4"/><path d="M22 0V22H0" fill="none" stroke="#C9DDE2" stroke-width="1.5"/></pattern></defs>
      <rect x="0" y="0" width="330" height="158" fill="url(#tile)"/>
      <g transform="translate(246 26)"><path d="M0 0H24V8" stroke="#A7B8BD" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="24" cy="12" rx="10" ry="5" fill="#C9D6DA"/></g>`);
    S.fg=svg(`<g class="sc-bubbles" fill="#fff" stroke="#BFD9E0" stroke-width="1"><circle cx="110" cy="70" r="6"/><circle cx="226" cy="58" r="8"/><circle cx="246" cy="88" r="5"/><circle cx="92" cy="96" r="4"/></g>
      <path d="M66 112H264V122Q264 156 232 156H98Q66 156 66 122Z" fill="#FFFFFF" stroke="${L}" stroke-width="1.6"/>
      <path d="M70 114Q86 100 100 112Q112 98 128 110Q146 96 162 110Q178 96 196 110Q212 98 228 112Q244 100 260 114" fill="#fff" stroke="#BFD9E0" stroke-width="1.4"/>
      <g fill="#fff" stroke="#BFD9E0" stroke-width="1"><circle cx="96" cy="106" r="7"/><circle cx="150" cy="102" r="9"/><circle cx="214" cy="104" r="8"/><circle cx="238" cy="108" r="6"/></g>
      <path d="M86 156V164M244 156V164" stroke="${L}" stroke-width="3"/>
      <g transform="translate(240 102)" class="sc-bounce"><ellipse cx="0" cy="0" rx="9" ry="7" fill="#FFD84D" stroke="${L}" stroke-width="1.2"/><circle cx="6" cy="-7" r="5.5" fill="#FFD84D" stroke="${L}" stroke-width="1.2"/><path d="M11 -7L15 -6L11 -5Z" fill="#F29B38"/><circle cx="7" cy="-8" r="1" fill="${L}"/></g>`,'fg');
  }
  return S;
}

let _scK=sceneNow().k; setInterval(()=>{const k=sceneNow().k; if(k!==_scK){_scK=k; if(!curAge&&!homeQ)renderHome()}},300000);
const PET_TALK={1:['Peekaboo!','Twinkle, twinkle~','Ba-ba-ba!'],2:['Where\'s the ball?','Ball! Ball!','Again! Again!'],3:['What do you see?','Brown bear, brown bear~','I see a duck!'],4:['Read it again!','What happens next?','Once upon a time…'],5:['B, b, ball!','Cat, hat, bat!','I can read “the”!'],6:['One more chapter!','I read it myself!','The end. Next book?']};
document.addEventListener('click',e=>{
  const pet=e.target.closest('#g-pet'); if(!pet)return;
  const mo=monthsOld(birthOf()); const st=mo===null?STAGES[0]:stageOf(mo);
  const sc=sceneNow(), lines=sc.k==='sleep'?sc.say:[...sc.say,...PET_TALK[st.n]], b=$('#g-bubble'); b.textContent=lines[(lines.indexOf(b.textContent)+1)%lines.length]; b.classList.remove('idle'); b.hidden=false;
  pet.classList.remove('jump'); void pet.offsetWidth; pet.classList.add('jump'); const card=pet.closest('.gpet'); if(card)card.classList.add('tapped');
  const h=document.createElement('span'); h.className='gheart'; h.textContent='♥'; h.style.left=(45+Math.random()*10)+'%'; pet.parentNode.appendChild(h); setTimeout(()=>h.remove(),1100);
  clearTimeout(b._t); b._t=setTimeout(()=>{b.textContent='Touch me!';b.classList.add('idle')},2600);
});
function openGuide(){ loadChecks(); guideOpen=true; guideExpand=null; const v=$('#guide'); v.style.zIndex=++zTop; v.hidden=false; renderGuide(); v.scrollTop=0 }
function closeGuide(){ guideOpen=false; $('#guide').hidden=true; renderHome() }
function guideBody(x,ck){return `<div class="gbody">
          <div class="blk"><h4>이 시기 아이는</h4><p>${x.about}</p></div>
          <div class="blk"><h4>이렇게 읽어주면 좋아해요</h4><ol class="howto">${x.read.map(t=>`<li><span>${esc(t)}</span></li>`).join('')}</ol></div>
          <div class="blk"><h4>책에 재미 붙이기</h4><ul class="gfun">${x.fun.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div>
          <div class="blk"><h4>책 밖에서도 해보기</h4><ul class="gfun">${x.how.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div>
          <div class="blk"><h4>하루 10분 루틴</h4><div class="groutine">${x.routine.map(([t,d])=>`<div><small>${t}</small><span>${esc(d)}</span></div>`).join('')}</div></div>
          <div class="blk gavoid"><h4>이건 피해요</h4><ul class="gfun">${x.avoid.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div>
          <div class="blk"><h4>이번 단계 체크리스트</h4><div class="gchecks">${x.check.map((t,i)=>`<label class="gck"><input type="checkbox" data-ck="${x.n}:${i}" ${ck[i]?'checked':''}><span>${esc(t)}</span></label>`).join('')}</div></div>
          <div class="blk gwhy"><h4>왜 그런가요 · 연구에서는</h4>${x.why.map(([t,k])=>`<p>${esc(t)} <a href="${SRC[k].u}" target="_blank" rel="noopener">${SRC[k].l}</a></p>`).join('')}</div>
          <div class="blk"><h4>이 시기 추천 책</h4><div class="recent">${x.books.flatMap(a=>deckFor(a)).slice(0,8).map(miniHTML).join('')}</div></div>
        </div>`}
function renderGuide(){
  const v=$('#guide'); if(!guideOpen)return;
  const mo=monthsOld(birthOf()), cur=mo===null?STAGES[0]:stageOf(mo), keep=v.scrollTop;
  const open=guideExpand??cur.n;
  v.innerHTML=`<div class="phero ghero"><div class="topbar"><button class="iconbtn" data-gact="close" aria-label="뒤로">${ICON.back}</button><h2>우리 아이 영어 가이드</h2></div>
      <div class="gmain"><div class="gnow"><small>${mo===null?'아이 생일을 넣어주세요':moLabel(mo)+' · 우리 아이는 지금 '+cur.kid}</small><b>${cur.n}단계 ${cur.name}</b><span>${cur.tag}</span></div><div class="kb kb-hero">${kidBear(cur.n)}</div></div>
      <div class="gsteps">${STAGES.map(x=>`<i class="${x.n<cur.n?'past':x.n===cur.n?'now':''}"></i>`).join('')}</div>
      <label class="gedit">아이 생일 <input type="month" id="g-birth2" value="${esc(birthOf())}" max="${new Date().toISOString().slice(0,7)}"></label></div>
    <div class="glist">${(mo===null?STAGES:[cur]).map(x=>{const isOpen=mo!==null||x.n===open, ck=guideChecks[x.n]||{}, solo=mo!==null;
      if(solo) return `<div class="gsolo">${guideBody(x,ck)}</div>`;
      return `<section class="gitem${x.n===cur.n?' cur':''}${x.n<cur.n?' past':''}">
        <button class="ghead" data-gx="${x.n}" aria-expanded="${isOpen}"><span class="kb kb-sm">${kidBear(x.n)}</span><span class="gt"><small class="gkidn">${x.n}단계 · ${x.kid}</small><b>${x.name}</b><small>${rangeLabel(x)} · ${x.tag}</small></span>${x.n===cur.n?'<span class="gchip now">지금</span>':''}</button>
        ${isOpen?guideBody(x,ck):''}</section>`}).join('')}
      <p class="lfine" style="padding:6px 4px 30px">부모·아이 함께 읽기 연구를 바탕으로 정리한 일반적인 흐름이에요. 연구 대부분은 영어권 아이 대상이라 엄마표 영어에 맞게 옮겼어요. 아이마다 속도가 달라서 앞뒤 단계를 오가도 괜찮아요.</p></div>`;
  v.scrollTop=keep;
}
async function setBirth(b){
  if(!/^\d{4}-\d{2}$/.test(b||'')){toast('아이 생일을 연·월로 골라주세요');return false}
  if(monthsOld(b)===null){toast('미래 날짜는 고를 수 없어요');return false}
  try{localStorage.setItem('bookle.birth',b)}catch(_){}
  if(signedIn()){ await saveProfile({childBirth:b,childAge:ageKeyFromMonths(monthsOld(b))}) }
  return true;
}
document.addEventListener('click',async e=>{
  if(e.target.closest('#g-open')||(e.target.closest('.gpet')&&!e.target.closest('#g-pet'))){openGuide();return}
  if(e.target.closest('#g-go')){const ok=await setBirth($('#g-birth').value); if(ok){renderHome();openGuide()} return}
});
$('#guide').addEventListener('click',e=>{
  const t=e.target.closest('[data-gact],[data-gx],[data-open]'); if(!t)return;
  if(t.dataset.gact==='close')closeGuide();
  else if(t.dataset.gx){const n=+t.dataset.gx; guideExpand=(guideExpand??(stageOf(monthsOld(birthOf())??0).n))===n?0:n; renderGuide()}
  else if(t.dataset.open){const g=freshBook(t.dataset.open); guideOpen=false; $('#guide').hidden=true; openBook(g)}
});
$('#guide').addEventListener('change',async e=>{
  if(e.target.matches('[data-ck]')){const [n,i]=e.target.dataset.ck.split(':'); guideChecks[n]={...(guideChecks[n]||{}),[i]:e.target.checked}; saveChecks();
    if(e.target.checked){const st=STAGES[n-1]; if(Object.values(guideChecks[n]).filter(Boolean).length===st.check.length)toast(`${st.n}단계 체크리스트를 모두 해냈어요!`)} return}
  if(e.target.id==='g-birth2'){ if(await setBirth(e.target.value)){guideExpand=null;renderGuide()} }
});

/* ---------- DECK ---------- */
function openDeck(age,i){curAge=age;idx=i;flippedId=null;$('#home').hidden=true;$('#deck').hidden=false;renderDeck(true)}
function closeDeck(){curAge=null;$('#deck').hidden=true;$('#home').hidden=false;renderHome()}

function cardHTML(b,cur){
  const liked=isLiked(b), n=likeCount(b), c=cmts(b).length, a=ageOf(b.age);
  return `<div class="card${cur?' cur':''}${flippedId===b.id?' flipped':''}" data-id="${b.id}">
    <div class="flipper">
      <div class="face front">
        <div class="phead">${av(b.uid)}
          <div class="who" data-profile="${esc(b.uid)}" role="button" tabindex="0"><b>${esc(nameOf(b.uid))}</b><span>${tierOf(b.uid).lv?`<span class="tname">${bear(tierOf(b.uid),15)}${tierOf(b.uid).name}</span> · `:''}${a.label} ${b.recs&&b.recs.length>1?`· ${b.recs.length}명 추천`:'추천'}${b.at?' · '+ago(b.at):''}</span></div>
          ${b.sample?'<span class="tag">예시</span>':''}</div>
        <div class="cover${coverSrc(b)?' has-img':''}" style="background:${coverBg(b.hue)};color:${coverInk(b.hue)}">
          <div class="shape" style="background:${coverShape(b.hue)}"></div>
          ${coverSrc(b)?coverImg(b):`<div class="ct" style="position:relative">${esc(b.title)}</div>
          <div class="ca" style="position:relative">${esc(b.author||'')}</div>`}
          <span class="hint">${ICON.up}${signedIn()?'눌러서 자세히 보기':'가입하고 자세히 보기'}</span>
        </div>
        <div class="actions">
          <button class="iconbtn ${liked?'liked':''}" data-act="like" aria-label="좋아요">${ICON.heart}</button>
          <button class="iconbtn" data-act="comments" aria-label="댓글">${ICON.comment}</button>
          <button class="iconbtn" data-act="share" aria-label="공유">${ICON.share}</button>
        </div>
        <div class="pmeta">
          <button class="linkbtn" data-act="likers" style="color:var(--ink);font-weight:700;font-size:14px">좋아요 ${n}개</button>
          <div class="cap"><b>${esc(nameOf(b.uid))}</b> ${esc(b.summary)}</div>
          ${b.recs&&b.recs.length>1?`<div class="recline">${b.recs.slice(1,4).map(r=>`<span class="mini-av">${photoOf(r.uid)?`<img src="${esc(photoOf(r.uid))}" alt="">`:esc(initial(r.uid))}</span>`).join('')}<span><b>${esc(nameOf(b.recs[1].uid))}</b>님${b.recs.length>2?` 외 ${b.recs.length-2}명`:''}도 추천했어요</span></div>`:''}
          <button class="linkbtn" data-act="comments">${c?`댓글 ${c}개 모두 보기`:'첫 댓글 남기기'}</button>
        </div>
      </div>
    </div></div>`;
}

let lastScroll=0, renderTimer=null, settleTimer=null, pos=0, reps=1;
function renderDeck(full){
  if(!curAge)return;
  if(!full&&Date.now()-lastScroll<350){clearTimeout(renderTimer);renderTimer=setTimeout(()=>renderDeck(),380);return}
  const list=deckFor(curAge), a=ageOf(curAge), n=list.length;
  if(full||!$('#deck .stage')){
    $('#deck').innerHTML=`<div class="topbar"><button class="iconbtn" data-act="home" aria-label="홈으로">${ICON.back}</button>
      <h2>${a.label} 책장</h2><span class="prog"></span>${canWrite?`<button class="iconbtn" data-act="register" aria-label="책 등록">${ICON.plus}</button>`:''}</div>
      <div class="stage"></div>
      <div class="dots"></div>
      <div class="controls">
        <button class="cbtn small" data-act="prev" aria-label="이전 책">${ICON.back}</button>
        <button class="cbtn heart" data-act="likecur" aria-label="좋아요">${ICON.heart}</button>
        <button class="cbtn small" data-act="next" aria-label="다음 책">${ICON.back.replace('M15 5l-7 7 7 7','M9 5l7 7-7 7')}</button>
      </div>`;
  }
  const prevReps=reps; reps=n>1?3:1;
  idx=Math.max(0,Math.min(idx,n-1));
  if(full||prevReps!==reps) pos=(reps===3?n:0)+idx; else pos=(reps===3?n:0)+idx;
  const stage=$('#deck .stage'); const old=stage.querySelector('.track'); const keep=old&&!full&&prevReps===reps?old.scrollLeft:null;
  let html=''; for(let r=0;r<reps;r++) html+=list.map((bk,i)=>cardHTML(bk,r*n+i===pos)).join('');
  stage.innerHTML=`<div class="track">${html}</div>`;
  const track=stage.querySelector('.track');
  if(keep!==null)track.scrollLeft=keep; else center(pos,false);
  track.addEventListener('scroll',()=>{lastScroll=Date.now();syncCurrent();clearTimeout(settleTimer);settleTimer=setTimeout(recenter,140)},{passive:true});
  syncCurrent(true);
}
function center(p,smooth){
  const track=$('#deck .track'); if(!track)return; const c=track.children[p]; if(!c)return;
  const left=c.offsetLeft-(track.clientWidth-c.clientWidth)/2;
  if(smooth)track.scrollTo({left,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}); else track.scrollLeft=left;
}
/* 무한 루프: 앞/뒤 복제 세트에 들어가면 가운데 세트의 같은 카드로 조용히 옮겨요 */
function recenter(){
  const track=$('#deck .track'); if(!track||reps!==3)return;
  const n=deckFor(curAge).length; const setW=track.children[n].offsetLeft-track.children[0].offsetLeft;
  let shift=0; if(pos<n)shift=setW; else if(pos>=2*n)shift=-setW;
  if(!shift)return;
  track.style.scrollSnapType='none'; track.scrollLeft+=shift; track.style.scrollSnapType='';
  syncCurrent(true);
}
function syncCurrent(force){
  const track=$('#deck .track'); if(!track)return;
  const list=deckFor(curAge), n=list.length, mid=track.scrollLeft+track.clientWidth/2;
  let best=0,bd=1e9; [...track.children].forEach((c,i)=>{const d=Math.abs(c.offsetLeft+c.clientWidth/2-mid);if(d<bd){bd=d;best=i}});
  const newIdx=best%n;
  if(best!==pos||force){
    if(newIdx!==idx){
      if(n>1&&idx===n-1&&newIdx===0&&best>pos)toast('한 바퀴 다 봤어요 · 다시 첫 책이에요');
      flippedId=null;track.querySelectorAll('.card.flipped').forEach(c=>c.classList.remove('flipped'));
    }
    pos=best; idx=newIdx; [...track.children].forEach((c,i)=>c.classList.toggle('cur',i===pos));
  }
  $('#deck .prog').textContent=`${idx+1} / ${n}`;
  const dots=$('#deck .dots'); if(dots)dots.innerHTML=n<=12?list.map((_,i)=>`<i class="${i===idx?'on':''}"></i>`).join(''):'';
  const h=$('#deck [data-act="likecur"]'); if(h){const bk=list[idx]; h.classList.toggle('liked',!!(bk&&isLiked(bk)))}
}
function goTo(p){center(p,true)}
function flip(card,b){card.classList.toggle('flipped');flippedId=card.classList.contains('flipped')?b.id:null;if(flippedId){card.querySelector('.back').scrollTop=0}}
$('#deck').addEventListener('click',e=>{
  const list=deckFor(curAge), cardEl=e.target.closest('.card'), cb=cardEl&&list.find(x=>x.id===cardEl.dataset.id);
  if(e.target.closest('.recline')&&cb){openDetail(cardEl,cb);return}
  if(cardEl&&!cardEl.classList.contains('cur')){goTo([...cardEl.parentNode.children].indexOf(cardEl));return}
  const btn=e.target.closest('[data-act]');
  if(!btn){ if(cb&&e.target.closest('.cover,.cap'))openDetail(cardEl,cb); return }
  const act=btn.dataset.act;
  if(act==='home')closeDeck();
  else if(act==='prev')goTo(pos-1);
  else if(act==='next')goTo(pos+1);
  else if(act==='likecur'){const bk=list[idx]; if(bk){toggleLike(bk);btn.classList.add('pop')}}
  else if(act==='register')openRegister();
  else if(act==='flip'&&cb)flip(cardEl,cb);
  else if(act==='like'&&cb)toggleLike(cb);
  else if(act==='comments'&&cb)openComments(cb);
  else if(act==='likers'&&cb)openLikers(cb);
  else if(act==='share'&&cb)openShare(cb);
});
document.addEventListener('keydown',e=>{if(!$('#sheet').hidden)return;if(detailBook&&(!profileUid||+$('#detail').style.zIndex>+$('#profile').style.zIndex)){if(e.key==='Escape')closeDetail();return}if(profileUid){if(e.key==='Escape')closeProfile();return}if(!curAge)return;if(e.key==='ArrowRight')goTo(pos+1);if(e.key==='ArrowLeft')goTo(pos-1)});

/* ---------- DETAIL (틴더식 펼치기) ---------- */
let detailBook=null;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function rectInset(el){const a=$('#app').getBoundingClientRect(), r=el.getBoundingClientRect();return `inset(${Math.max(0,r.top-a.top)}px ${Math.max(0,a.right-r.right)}px ${Math.max(0,a.bottom-r.bottom)}px ${Math.max(0,r.left-a.left)}px round 24px)`}
function freshBook(id){const G=allGroups();return [...G.real,...G.samples].find(g=>g.id===id||g.recs.some(r=>r.id===id))}
/* ---------- 후속 활동 · 책 사진 ---------- */
const myRec=b=>b&&!b.sample&&(b.recs||[b]).find(r=>r.uid===uid)||null;
function photosHTML(b){
  const ph=b.photos||[], mine=myRec(b);
  if(!ph.length&&!mine)return '';
  return `<div class="blk"><h4>후속 활동 · 책 사진${ph.length?' '+ph.length:''}</h4>
    <div class="dphotos">${ph.map((x,i)=>`<button class="dph" data-dact="photo" data-i="${i}" aria-label="사진 크게 보기"><img src="${esc(x.url)}" alt="${esc(x.caption||b.title+' 사진')}" loading="lazy"></button>`).join('')}
    ${mine?`<label class="dph add"><span class="plus">+</span><span>사진 추가</span><input type="file" accept="image/*" multiple data-photo-input hidden></label>`:''}</div>
    ${!ph.length&&mine?'<p class="phint">책 장면이나 아이와 한 놀이 사진을 올려보세요. 다른 엄빠들에게 큰 도움이 돼요.</p>':''}</div>`;
}
async function addPhotos(b,files){
  const mine=myRec(b); if(!mine||!files.length)return;
  const imgs=files.filter(f=>/^image\//.test(f.type)).slice(0,10);
  if(!imgs.length){toast('이미지 파일만 올릴 수 있어요');return}
  toast(`사진 ${imgs.length}장을 올리는 중…`);
  let ok=0;
  for(const f of imgs){
    try{ const blob=await shrinkImage(f,1400);
      if(db){ await api.addBookPhoto(mine.id,blob) }
      else { (mine.photos=mine.photos||[]).push({id:'l'+Date.now()+ok,uid,url:URL.createObjectURL(blob),caption:'',at:Date.now()}) }
      ok++;
    }catch(x){ console.error('addBookPhoto',x) }
  }
  if(db)await reload(); else refresh();
  toast(ok?`사진 ${ok}장을 올렸어요`:'사진을 올리지 못했어요. 잠시 후 다시 시도해주세요.');
}
function openPhoto(b,i){
  const ph=b.photos||[]; if(!ph.length)return;
  let k=Math.max(0,Math.min(i,ph.length-1));
  const lb=document.createElement('div'); lb.className='lightbox'; lb.setAttribute('role','dialog'); lb.setAttribute('aria-label','사진 보기');
  const draw=()=>{const x=ph[k], own=x.uid===uid&&!String(x.id).startsWith('l');
    lb.innerHTML=`<button class="lb-x" data-lb="close" aria-label="닫기">${ICON.close}</button>
      <img src="${esc(x.url)}" alt="${esc(x.caption||b.title+' 사진')}">
      <div class="lb-bar">${ph.length>1?`<button data-lb="prev" aria-label="이전 사진">‹</button><span>${k+1} / ${ph.length}</span><button data-lb="next" aria-label="다음 사진">›</button>`:'<span></span>'}
      ${own?'<button class="lb-del" data-lb="del">삭제</button>':''}</div>
      <p class="lb-who">${esc(nameOf(x.uid))}님이 올린 사진</p>`};
  draw(); document.body.appendChild(lb);
  let sx=null; lb.addEventListener('touchstart',e=>{sx=e.touches[0].clientX},{passive:true});
  lb.addEventListener('touchend',e=>{if(sx===null)return;const dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>50&&ph.length>1){k=(k+(dx<0?1:-1)+ph.length)%ph.length;draw()}},{passive:true});
  lb.addEventListener('click',async e=>{const t=e.target.closest('[data-lb]');
    if(!t){if(e.target===lb)lb.remove();return}
    const a=t.dataset.lb;
    if(a==='close')lb.remove();
    else if(a==='prev'){k=(k-1+ph.length)%ph.length;draw()}
    else if(a==='next'){k=(k+1)%ph.length;draw()}
    else if(a==='del'){ if(!confirmInline(t))return; try{await api.deleteBookPhoto(ph[k].id,ph[k].url);lb.remove();await reload();toast('사진을 삭제했어요')}catch(x){console.error(x);toast('삭제하지 못했어요')} }
  });
}
/* 브라우저 확인창 대신, 버튼을 한 번 더 누르면 실행돼요 */
function confirmInline(btn){ if(btn.dataset.armed){return true} btn.dataset.armed='1'; btn.textContent='한 번 더 누르면 삭제'; setTimeout(()=>{if(btn.isConnected){delete btn.dataset.armed;btn.textContent='삭제'}},3000); return false }
function renderDetail(){
  const d=$('#detail'); if(!detailBook)return;
  const b=freshBook(detailBook.id)||detailBook, a=ageOf(b.age), liked=isLiked(b), n=likeCount(b), cl=cmts(b);
  const keep=d.scrollTop;
  d.innerHTML=`<div class="dcover${coverSrc(b)?' has-img':''}" style="background:${coverBg(b.hue)};color:${coverInk(b.hue)}">
      <div class="shape" style="background:${coverShape(b.hue)}"></div><span class="grab"></span>
      ${coverSrc(b)?coverImg(b):`<div class="ct">${esc(b.title)}</div><div class="ca">${esc(b.author||'')}</div>`}</div>
    <button class="dclose" data-dact="close" aria-label="목록으로 돌아가기">${ICON.down}</button>
    <div class="dbody">
      <div class="phead">${av(b.uid)}
        <div class="who" data-profile="${esc(b.uid)}" role="button" tabindex="0"><b>${esc(nameOf(b.uid))}님의 추천</b><span>${a.label}${b.recs.length>1?' · 이웃 '+b.recs.length+'명 추천':''}${b.at?' · '+ago(b.at):''}</span></div>${b.sample?'<span class="tag">예시</span>':''}</div>
      <div><h3>${esc(b.title)}</h3><div class="au">${esc(b.author||'')}${b.publisher?' · '+esc(b.publisher):''}</div></div>
      <div class="facts">
        <div class="fact"><span>나이대</span><b>${a.label}</b></div>
        <div class="fact"><span>평점${b.recs.length>1?' · '+b.recs.length+'명':''}</span><b><span class="stars">${stars(Math.round(b.rating||0))}</span>${b.recs.length>1?` <small style="font-size:13px">${b.rating}</small>`:''}</b></div>
      </div>
      <div class="blk"><h4>어떤 책이에요</h4><p>${esc(b.summary)}</p></div>
      <div class="blk"><h4>이렇게 읽어주세요</h4>
        <ol class="howto">${(b.howTo||'').split('\n').map(x=>x.trim()).filter(Boolean).map(x=>`<li><span>${esc(x)}</span></li>`).join('')||'<li><span>등록한 분이 아직 팁을 남기지 않았어요.</span></li>'}</ol></div>
      ${photosHTML(b)}
      ${b.recs.length>1?`<div class="blk"><h4>이웃들의 추천 ${b.recs.length-1}</h4><div class="recs">${b.recs.slice(1).map(r=>`<div class="rec">
        <div class="phead" style="padding:0">${av(r.uid)}<div class="who" data-profile="${esc(r.uid)}" role="button" tabindex="0"><b>${esc(nameOf(r.uid))}</b><span>${tierOf(r.uid).lv?`<span class="tname">${bear(tierOf(r.uid),14)}${tierOf(r.uid).name}</span> · `:''}${ageOf(r.age).label} · ${ago(r.at)}</span></div><span class="stars" style="font-size:13px">${stars(r.rating||0)}</span></div>
        <p>${esc(r.summary)}</p>
        ${(r.howTo||'').trim()?`<ol class="howto">${r.howTo.split('\n').map(x=>x.trim()).filter(Boolean).map(x=>`<li><span>${esc(x)}</span></li>`).join('')}</ol>`:''}</div>`).join('')}</div></div>`:''}
      <div class="blk"><h4>댓글 ${cl.length}</h4>
        <div class="dpeek">${cl.slice(-2).map(c=>`<div class="cm">${av(c.uid)}<div><p><b>${esc(nameOf(c.uid))}</b> ${esc(c.text)}</p><small>${ago(c.at)}</small></div></div>`).join('')}
        <button class="linkbtn" data-dact="comments">${cl.length?`댓글 ${cl.length}개 모두 보기`:'첫 댓글 남기기'}</button></div></div>
    </div>
    <div class="dbar">
      <button class="iconbtn ${liked?'liked':''}" data-dact="like" aria-label="좋아요">${ICON.heart}</button><button class="cnt" data-dact="likers" aria-label="좋아요한 사람 보기">${n}</button>
      <button class="iconbtn" data-dact="comments" aria-label="댓글">${ICON.comment}</button><span class="cnt">${cl.length}</span>
      <button class="iconbtn" data-dact="share" aria-label="공유">${ICON.share}</button>
      <span class="pullhint">아래로 당기면 목록으로</span>
    </div>`;
  d.scrollTop=keep;
}
function openDetail(cardEl,b){
  if(!signedIn()){ requireLogin(()=>openBook(freshBook(b.id)||b),'책의 자세한 소개와 읽어주는 법은 가입하면 볼 수 있어요. 1분이면 돼요.','detail:'+b.id); return }
  detailFromProfile=!!cardEl.closest('#profile'); $('#detail').style.zIndex=++zTop;
  detailBook=b; const d=$('#detail'); d.scrollTop=0; renderDetail(); d.scrollTop=0; d.hidden=false;
  d.style.transform=''; d.style.borderRadius='';
  if(reduced()){d.style.clipPath='none';return}
  d.style.transition='none'; d.style.clipPath=rectInset(cardEl.querySelector('.face')||cardEl); void d.offsetHeight;
  d.style.transition='clip-path .42s cubic-bezier(.3,.75,.2,1)'; d.style.clipPath='inset(0px 0px 0px 0px round 0px)';
}
function closeDetail(){
  const d=$('#detail'); if(d.hidden)return;
  const card=(detailFromProfile&&profileUid?$(`#profile [data-bid="${detailBook.id}"]`):null)||$('#deck .card.cur'), done=()=>{d.hidden=true;d.style.clipPath='';d.style.transform='';d.style.transition='';detailBook=null;renderDeck()};
  if(reduced()||!card){done();return}
  d.style.transition='clip-path .34s cubic-bezier(.4,0,.2,1), transform .34s cubic-bezier(.4,0,.2,1)';
  d.style.transform=''; d.style.clipPath=rectInset(card.querySelector('.face')||card);
  setTimeout(()=>{d.scrollTop=0},40); setTimeout(done,350);
}
(()=>{
  const d=$('#detail'); let ty=null, tdy=0;
  d.addEventListener('click',e=>{const t=e.target.closest('[data-dact]'); if(!t||!detailBook)return; const b=freshBook(detailBook.id)||detailBook;
    if(t.dataset.dact==='close')closeDetail(); else if(t.dataset.dact==='like')toggleLike(b); else if(t.dataset.dact==='comments')openComments(b); else if(t.dataset.dact==='likers')openLikers(b); else if(t.dataset.dact==='share')openShare(b); else if(t.dataset.dact==='photo')openPhoto(b,+t.dataset.i)});
  d.addEventListener('change',e=>{const inp=e.target.closest('[data-photo-input]'); if(!inp||!detailBook)return; addPhotos(freshBook(detailBook.id)||detailBook,[...(inp.files||[])]); inp.value=''});
  d.addEventListener('touchstart',e=>{ty=d.scrollTop<=0?e.touches[0].clientY:null;tdy=0},{passive:true});
  d.addEventListener('touchmove',e=>{
    if(ty===null)return; tdy=e.touches[0].clientY-ty;
    if(tdy>0&&d.scrollTop<=0){e.preventDefault();d.style.transition='none';d.style.transform=`translateY(${tdy*.55}px) scale(${1-Math.min(tdy,320)/2600})`;d.style.clipPath=`inset(0px 0px 0px 0px round ${Math.min(24,tdy/5)}px)`}
    else if(tdy<0){ty=null;d.style.transform=''}
  },{passive:false});
  d.addEventListener('touchend',()=>{if(ty===null)return;ty=null;
    if(tdy>110)closeDetail(); else {d.style.transition='transform .25s ease, clip-path .25s ease';d.style.transform='';d.style.clipPath='inset(0px 0px 0px 0px round 0px)'}});
})();

/* ---------- LOGIN · ONBOARDING ----------
   둘러보기는 누구나. 좋아요·댓글·등록·프로필처럼 '쓰기'를 할 때만 로그인해요.
   카카오·Apple은 Supabase OAuth, 이메일은 6자리 인증 코드(OTP)예요. */
const signedIn=()=>!!(profiles[uid]&&profiles[uid].nickname);
let pendingAfterLogin=null;
function requireLogin(fn,why,kind){ if(signedIn()){fn();return} pendingAfterLogin=fn; try{kind?sessionStorage.setItem('bookle.pending',kind):sessionStorage.removeItem('bookle.pending')}catch(_){} openLogin(why) }
/* 카카오·Apple 로그인은 페이지를 떠났다 돌아오므로, 하려던 일을 이름으로 기억했다가 이어서 해요 */
function resumePending(){
  let k=''; try{k=sessionStorage.getItem('bookle.pending')||'';sessionStorage.removeItem('bookle.pending')}catch(_){}
  if(!k)return null;
  const [t,id]=k.split(':');
  if(t==='like')return ()=>{const b=freshBook(id); if(b){openBook(b); setTimeout(()=>toggleLike(freshBook(id)||b,true),500)}};
  if(t==='comments')return ()=>{const b=freshBook(id); if(b)openComments(b)};
  if(t==='detail')return ()=>{const b=freshBook(id); if(b)openBook(b)};
  if(t==='register')return ()=>openRegister();
  if(t==='profile')return ()=>openProfile(uid);
  return null;
}
const KAKAO_ICON='<svg width="18" height="18" viewBox="0 0 24 24" fill="#191919"><path d="M12 3.5c-5 0-9 3.1-9 7 0 2.5 1.7 4.7 4.2 6l-1 3.7c-.1.3.3.6.6.4l4.3-2.9h.9c5 0 9-3.1 9-7s-4-7.2-9-7.2z"/></svg>';
const APPLE_ICON='<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9s-2-.9-3.4-.9c-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8s2 .8 3.4.8 2.2-1.3 3.1-2.5c1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1zM13.9 4.9c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z"/></svg>';
const SHOW_OAUTH=false;
/* 이메일 인증은 SMTP(Resend) 연결 후 다시 켜요. false면 이메일 없이 '시작하기' → 닉네임 입력만 받아요. */
const SHOW_EMAIL=false;
/* Supabase 오류 메시지를 사람이 읽을 수 있는 말로 바꿔요 (원문도 작게 함께 보여줘요) */
function otpErrorText(e){
  const m=String((e&&(e.message||e.error_description))||e||''), st=e&&e.status, l=m.toLowerCase();
  let t='코드를 보내지 못했어요. 잠시 후 다시 시도해주세요.';
  if(st===429||l.includes('rate limit')||l.includes('security purposes')) t='잠깐만요! 메일을 너무 자주 요청했어요. 1분쯤 뒤에 다시 시도해주세요.';
  else if(l.includes('not authorized')) t='아직 테스트 기간이라 등록된 이메일로만 가입할 수 있어요.';
  else if(l.includes('signups not allowed')||l.includes('signup')&&l.includes('disabled')) t='지금은 새 가입을 받지 않고 있어요.';
  else if(l.includes('invalid')&&l.includes('email')) t='이메일 주소를 확인해주세요.';
  else if(l.includes('sending')) t='메일 발송 서버에 문제가 있어요. 잠시 후 다시 시도해주세요.';
  return m?`${t}<br><small style="opacity:.7">(${esc(m)})</small>`:t;
}
/* 가입 방법이 하나(이메일 없이 바로 시작)일 때는 안내 팝업 없이 곧장 프로필 입력으로 가요 */
async function quickStart(){
  if(signedIn()){finishLogin();return}
  if(!db){openOnboarding();return}
  try{
    const u=await api.signInAnon(); uid=u.id; await reload();
    const g=await api.loadGuide().catch(()=>null); if(g)guideChecks={...guideChecks,...g};
  }catch(x){ console.error('signInAnon',x); toast('시작하지 못했어요. 잠시 후 다시 시도해주세요.'+(x&&x.message?' ('+x.message+')':'')); return }
  signedIn()?finishLogin():openOnboarding();
}
function openLogin(why){
  if(!SHOW_OAUTH&&!SHOW_EMAIL){quickStart();return}
  const s=$('#sheet'); s.hidden=false;
  s.innerHTML=`<div class="scrim" data-close><div class="sheet" role="dialog" aria-label="로그인">
    <div class="shead"><span class="steps"><i class="on"></i><i></i></span><button class="iconbtn" data-close aria-label="닫기">${ICON.close}</button></div>
    <div class="login">
      <div class="lhero">${bear(TIERS[1],56)}<h3 class="lwelcome">Welcome to Bookle</h3></div>
      <!-- 카카오·Apple 로그인은 파일럿 이후에 다시 켜요 (SHOW_OAUTH=true) -->
      ${SHOW_OAUTH?`<button class="sbtn kakao" id="lg-kakao">${KAKAO_ICON}카카오로 3초 만에 시작하기</button>
      <button class="sbtn apple" id="lg-apple">${APPLE_ICON}Apple로 계속하기</button>`:''}
      ${SHOW_EMAIL?`<button class="pill primary" id="lg-email" style="padding:14px;width:100%">이메일로 시작하기</button>`
        :`<button class="pill primary" id="lg-start" style="padding:14px;width:100%">시작하기</button><p class="err" id="lg-err" hidden></p>`}
    </div></div></div>`;
  const go=()=>{ if(signedIn()){finishLogin();return} openOnboarding() };
  const oauth=async(p,btn)=>{ if(!db){go();return} btn.disabled=true; try{await api.signInOAuth(p)}catch(e){btn.disabled=false; toast(p==='kakao'?'카카오 로그인을 시작하지 못했어요. 잠시 후 다시 시도해주세요.':'Apple 로그인을 시작하지 못했어요.')} };
  if(SHOW_OAUTH){ $('#lg-kakao').onclick=e=>oauth('kakao',e.currentTarget); $('#lg-apple').onclick=e=>oauth('apple',e.currentTarget); } if(SHOW_EMAIL){ $('#lg-email').onclick=()=>signedIn()?finishLogin():openEmail(); return }
  $('#lg-start').onclick=async e=>{
    if(signedIn()){finishLogin();return}
    if(!db){openOnboarding();return}
    const btn=e.currentTarget, err=$('#lg-err'); btn.disabled=true; btn.textContent='잠시만요…'; err.hidden=true;
    try{
      const u=await api.signInAnon(); uid=u.id; await reload();
      const g=await api.loadGuide().catch(()=>null); if(g)guideChecks={...guideChecks,...g};
    }catch(x){ console.error('signInAnon',x); btn.disabled=false; btn.textContent='시작하기';
      err.innerHTML='시작하지 못했어요. 잠시 후 다시 시도해주세요.'+(x&&x.message?`<br><small style="opacity:.7">(${esc(x.message)})</small>`:''); err.hidden=false; return }
    signedIn()?finishLogin():openOnboarding();
  };
}
/* 이메일 인증 (인스타식 6자리 코드, 비밀번호 없음) */
function openEmail(){
  const s=$('#sheet'); s.hidden=false;
  s.innerHTML=`<div class="scrim" data-close><div class="sheet" role="dialog" aria-label="이메일 가입">
    <div class="shead"><span class="steps"><i class="on"></i><i></i></span><button class="iconbtn" data-close aria-label="닫기">${ICON.close}</button></div>
    <form class="sbody" id="emform" novalidate>
      <div><h3 style="margin:0;font-family:var(--f-display);font-weight:700;font-size:24px">이메일로 가입하기</h3><p style="margin:4px 0 0;color:var(--muted);font-size:14px">입력한 주소로 6자리 인증 코드를 보내드려요. 비밀번호는 필요 없어요.</p></div>
      <div class="field"><label for="em-addr">이메일</label><input type="text" id="em-addr" inputmode="email" autocomplete="email" placeholder="name@example.com"></div>
      <div class="field" id="em-codebox" hidden><label for="em-code">인증 코드 <span class="help" id="em-sent"></span></label><input type="text" id="em-code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="6자리 숫자" style="letter-spacing:.4em;font-size:20px;text-align:center">
        ${db?'':'<p class="note" style="margin:6px 0 0">미리보기 모드라 메일이 가지 않아요. 데모 코드 <b id="em-demo"></b>를 입력하세요.</p>'}
        <button type="button" class="textlink" id="em-resend" style="align-self:flex-start">코드 다시 받기</button></div>
      <p class="err" id="em-err" hidden></p>
      <button class="pill primary" type="submit" id="em-btn" style="padding:14px">인증 코드 받기</button>
    </form></div></div>`;
  let code='', sent=false;
  const send=async()=>{
    const addr=$('#em-addr').value.trim(), btn=$('#em-btn');
    if(db){ btn.disabled=true; try{await api.sendOtp(addr)}catch(e){btn.disabled=false; const err=$('#em-err'); err.innerHTML=otpErrorText(e); err.hidden=false; console.error('sendOtp',e); return} btn.disabled=false }
    else { code=String(Math.floor(100000+Math.random()*900000)); $('#em-demo').textContent=code }
    sent=true; $('#em-sent').textContent=addr+'로 보냈어요';$('#em-codebox').hidden=false;btn.textContent='확인';$('#em-code').value='';$('#em-code').focus();
  };
  $('#em-resend').onclick=async()=>{await send();toast('새 코드를 보냈어요')};
  $('#emform').addEventListener('submit',async e=>{
    e.preventDefault(); const err=$('#em-err'); err.hidden=true;
    const addr=$('#em-addr').value.trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)){err.textContent='이메일 주소를 확인해주세요. 예: name@example.com';err.hidden=false;return}
    if(!sent){await send();return}
    const tok=$('#em-code').value.trim();
    if(!/^\d{6}$/.test(tok)){err.textContent='메일로 받은 6자리 숫자를 입력해주세요.';err.hidden=false;return}
    if(db){
      const btn=$('#em-btn'); btn.disabled=true;
      try{ const u=await api.verifyOtp(addr,tok); uid=u.id; await reload(); const g=await api.loadGuide().catch(()=>null); if(g)guideChecks={...guideChecks,...g}; }
      catch(e){ btn.disabled=false; console.error('verifyOtp',e); err.innerHTML='코드가 맞지 않거나 시간이 지났어요. 메일의 6자리 숫자를 다시 확인해주세요.'+(e&&e.message?`<br><small style="opacity:.7">(${esc(e.message)})</small>`:'');err.hidden=false;return }
    } else if(tok!==code){err.textContent='코드가 맞지 않아요. 메일의 6자리 숫자를 다시 확인해주세요.';err.hidden=false;return}
    signedIn()?finishLogin():openOnboarding();
  });
  setTimeout(()=>{try{$('#em-addr').focus()}catch(_){}},50);
}

/* 좋아요한 사람 목록 (인스타식) */
function openLikers(b){
  const ids=Object.keys(b.likes||{}).filter(k=>b.likes[k]);
  const s=$('#sheet'); s.hidden=false;
  s.innerHTML=`<div class="scrim" data-close><div class="sheet" role="dialog" aria-label="좋아요">
    <div class="shead"><h3>좋아요 ${ids.length}</h3><button class="iconbtn" data-close aria-label="닫기">${ICON.close}</button></div>
    <div class="sbody">${ids.length?ids.map(id=>{const t=tierOf(id);return `<div class="phead" style="padding:0">${av(id)}
      <div class="who" data-profile="${esc(id)}" role="button" tabindex="0"><b>${esc(nameOf(id))}${id===uid?' (나)':''}</b><span>${t.lv?`<span class="tname">${bear(t,14)}${t.name}</span> · `:''}등록한 책 ${t.n}권</span></div></div>`}).join('')
      :`<div class="pempty">아직 좋아요가 없어요.<br>첫 번째로 좋아요를 눌러보세요.</div>`}</div></div></div>`;
}

function openOnboarding(){
  const st={age:null}; let file=null, prev=null; const canPhoto=true;
  const meName=names[uid]&&names[uid]!=='나'?names[uid]:'';
  const s=$('#sheet'); s.hidden=false;
  s.innerHTML=`<div class="scrim" data-close><div class="sheet ob" role="dialog" aria-label="프로필 만들기">
    <div class="shead ob-head"><span></span><button class="iconbtn" data-close aria-label="닫기">${ICON.close}</button></div>
    <form class="sbody" id="obform" novalidate>
      <div><h3 class="lwelcome" style="margin:0">Welcome to Bookle</h3><p style="margin:4px 0 0;color:var(--muted);font-size:14px">동네 이웃에게 보이는 정보예요.</p></div>
      <div class="avedit"><div class="avatar" id="ob-av" style="width:84px;height:84px;font-size:30px">${esc((meName||'?').charAt(0))}</div>
        ${canPhoto?`<label class="textlink" for="ob-photo">프로필 사진 추가 (선택)</label><input type="file" id="ob-photo" accept="image/*">`:''}</div>
      <div class="field"><label for="ob-nick">닉네임</label><input type="text" id="ob-nick" maxlength="20" value="${esc(meName)}" placeholder="예: 영등포 하준맘"></div>
      <div class="field"><label for="ob-birth">아이 생일 <span class="help">연·월만, 지금 시기에 맞는 영어 가이드를 보여드려요 (선택)</span></label><input type="month" id="ob-birth" max="${new Date().toISOString().slice(0,7)}" value="${esc(birthOf())}"></div>
      <div class="field"><span class="lab">우리 아이 나이대 <span class="help">홈에서 이 나이대 책을 먼저 보여드려요</span></span>
        <div class="seg" id="ob-age">${AGES.map(a=>`<button type="button" data-v="${a.k}" aria-pressed="false">${a.label}</button>`).join('')}</div></div>
      <p class="err" id="ob-err" hidden></p>
      <button class="pill primary" type="submit" style="padding:14px">북클 시작하기</button>
      <p class="lfine ob-legal">시작하면 북클 <a href="/terms.html" target="_blank" rel="noopener">이용약관</a>과 <a href="/privacy.html" target="_blank" rel="noopener">개인정보 처리방침</a>에 동의하게 돼요.</p>
    </form></div></div>`;
  $('#ob-birth').addEventListener('change',e=>{const m=monthsOld(e.target.value); if(m===null)return; st.age=ageKeyFromMonths(m); [...$('#ob-age').children].forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===st.age))});
  $('#ob-age').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;st.age=b.dataset.v;[...$('#ob-age').children].forEach(x=>x.setAttribute('aria-pressed',x===b))});
  const inp=$('#ob-photo'); if(inp)inp.addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];if(!f)return;if(!/^image\//.test(f.type)){toast('이미지 파일만 올릴 수 있어요');return}
    file=f;if(prev)URL.revokeObjectURL(prev);prev=URL.createObjectURL(f);$('#ob-av').innerHTML=`<img src="${prev}" alt="프로필 사진" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`});
  $('#obform').addEventListener('submit',async e=>{
    e.preventDefault(); const nick=$('#ob-nick').value.trim(), err=$('#ob-err');
    if(!nick){err.textContent='닉네임을 적어주세요.';err.hidden=false;return}
    const ob=$('#ob-birth').value, obm=monthsOld(ob); if(!st.age&&obm!==null)st.age=ageKeyFromMonths(obm);
    if(!st.age){err.textContent='우리 아이 생일이나 나이대를 골라주세요.';err.hidden=false;return}
    const btn=$('#obform button[type=submit]'); btn.disabled=true; btn.textContent='만드는 중…';
    const data={nickname:nick,childAge:st.age,bio:'',...(obm!==null?{childBirth:ob}:{})}; if(obm!==null){try{localStorage.setItem('bookle.birth',ob)}catch(_){}}
    try{ if(file){const blob=await shrinkImage(file,480); if(db){data.photoUrl=await api.uploadAvatar(blob)} else data.photoLocal=URL.createObjectURL(blob)} }
    catch(x){ console.error('uploadAvatar',x); btn.disabled=false; btn.textContent='북클 시작하기'; err.innerHTML='사진을 올리지 못했어요. 다른 사진으로 해보거나, 사진 없이 시작해주세요.'+(x&&x.message?`<br><small style="opacity:.7">(${esc(x.message)})</small>`:''); err.hidden=false; file=null; return }
    const ok=await saveProfile(data);
    if(ok)finishLogin(true); else {btn.disabled=false;btn.textContent='북클 시작하기'; err.innerHTML='프로필을 저장하지 못했어요.'+(lastSaveErr?`<br><small style="opacity:.7">(${esc(lastSaveErr)})</small>`:''); err.hidden=false}
  });
}
function finishLogin(isNew){
  const fn=pendingAfterLogin; closeSheet(); if(isNew)toast(`환영해요, ${nameOf(uid)}님!`); refresh(); if(fn)setTimeout(fn,isNew?500:0);
}

/* ---------- PROFILE ---------- */
document.addEventListener('click',e=>{const t=e.target.closest('[data-profile]'); if(!t)return; if(t.closest('.avedit'))return; e.stopPropagation(); e.preventDefault(); openProfile(t.dataset.profile)},true);
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('.who[data-profile]'))openProfile(e.target.dataset.profile)});
function openProfile(id){
  if(id===uid&&!signedIn()){requireLogin(()=>openProfile(uid),'내 서재를 만들려면 로그인해주세요.','profile');return}
  if(!$('#sheet').hidden)closeSheet();
  if(detailBook){ const d=$('#detail'); d.hidden=true; d.style.clipPath=''; detailBook=null; }
  profileUid=id; profTab='mine'; const v=$('#profile'); v.style.zIndex=++zTop; v.hidden=false; renderProfile(); v.scrollTop=0;
}
function closeProfile(){ profileUid=null; $('#profile').hidden=true; if(curAge)renderDeck(); else renderHome(); }
function renderProfile(){
  const v=$('#profile'), id=profileUid; if(!id)return;
  const mine=id===uid, p=profiles[id]||{}, keep=v.scrollTop;
  const regs=(id==='sample'?SAMPLES:books.filter(b=>b.uid===id)).slice().sort((a,b)=>(b.at||0)-(a.at||0));
  const G=allGroups(); const liked=[...G.real,...G.samples].filter(b=>b.likes&&b.likes[id]);
  const recv=regs.reduce((t,b)=>t+likeCount(b),0); // 내 추천 문서에 직접 눌린 좋아요
  const list=profTab==='mine'?regs:liked;
  const bio=id==='sample'?'북클이 고른 연령별 추천 그림책이에요. 실제 등록된 책이 쌓이면 이 예시는 줄어들어요.':(p.bio||(mine?'아직 소개가 없어요. 아이 나이나 좋아하는 책 취향을 적어보세요.':''));
  v.innerHTML=`<div class="phero"><div class="topbar"><button class="iconbtn" data-pact="close" aria-label="뒤로">${ICON.back}</button><h2>${esc(nameOf(id))}</h2></div>
    <div class="prof-top" style="padding-block:6px 10px">${av(id,'xl')}
      <div class="pside"><div class="pname script">${esc(nameOf(id))}</div>
      <div class="pstats"><div><b>${regs.length}</b><span>등록한 책</span></div><div><b>${recv}</b><span>받은 좋아요</span></div><div><b>${liked.length}</b><span>좋아요한 책</span></div></div></div></div>
    ${bio?`<p class="pbio${!p.bio&&mine?' dim':''}">${esc(bio)}</p>`:''}
    ${mine&&canWrite?`<button class="pill pedit" data-pact="edit">프로필 편집</button>`:''}</div>
    ${id==='sample'?'':(()=>{const t=tierOf(id);const pct=t.next?Math.round((t.n-t.min)/(t.next.min-t.min)*100):100;
      return `<div class="tier" style="--tc:${t.c}"><div class="trow"><span style="display:flex;align-items:center;gap:8px">${t.lv?bear(t,30):''}<b class="tname">${t.lv?t.name:'첫 책을 등록하면 Oak 곰이 돼요'}</b></span><small>${t.next?`${t.next.name}까지 ${t.next.min-t.n}권`:'최고 등급이에요'}</small></div>
        <div class="tbar"><i style="width:${pct}%"></i></div>
        <div class="tsteps">${TIERS.slice(1).map((x,k)=>`<span class="${k+1===t.lv?'on':''}">${bear(x,32)}<span>${x.name.replace(' 곰','')}<br>${x.min}권+</span></span>`).join('')}</div><p class="tnote">등록한 책 수에 따라 프로필 사진 위 곰이 바뀌어요</p></div>`})()}
    <div class="ptabs" role="tablist"><button role="tab" data-ptab="mine" aria-selected="${profTab==='mine'}">등록한 책 ${regs.length}</button><button role="tab" data-ptab="liked" aria-selected="${profTab==='liked'}">좋아요한 책 ${liked.length}</button></div>
    ${list.length?`<div class="pgrid">${list.map(b=>`<button class="ptile" data-bid="${b.id}" style="background:${coverBg(b.hue)};color:${coverInk(b.hue)}">${b.cover?`<img src="${esc(b.cover)}" alt="${esc(b.title)}">`:esc(b.title)}<span class="pa">${ageOf(b.age).label}</span></button>`).join('')}</div>`
      :`<div class="pempty">${profTab==='mine'?(mine?'아직 등록한 책이 없어요. 우리 아이가 좋아한 책을 첫 번째로 올려보세요.':'아직 등록한 책이 없어요.'):'아직 좋아요한 책이 없어요.'}${mine&&profTab==='mine'&&canWrite?'<button class="pill primary" data-pact="register">책 등록하기</button>':''}</div>`}${legalFooter()}`;
  v.scrollTop=keep;
}
$('#profile').addEventListener('click',e=>{
  const t=e.target.closest('[data-pact],[data-ptab],[data-bid]'); if(!t)return;
  if(t.dataset.pact==='close')closeProfile();
  else if(t.dataset.pact==='edit')openProfileEdit();
  else if(t.dataset.pact==='register')openRegister();
  else if(t.dataset.ptab){profTab=t.dataset.ptab;renderProfile()}
  else if(t.dataset.bid){const b=freshBook(t.dataset.bid); if(b)openDetail(t,b)}
});
function shrinkImage(file,max){return new Promise((res,rej)=>{const img=new Image();const u=URL.createObjectURL(file);
  img.onload=()=>{const k=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(b=>b?res(b):rej(new Error('encode')),'image/jpeg',.88)};
  img.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('decode'))};img.src=u})}
function openProfileEdit(){
  const p=profiles[uid]||{}; let file=null, prev=null;
  const canPhoto=true;
  const s=$('#sheet'); s.hidden=false;
  s.innerHTML=`<div class="scrim" data-close><div class="sheet" role="dialog" aria-label="프로필 편집">
    <div class="shead"><h3>프로필 편집</h3><button class="iconbtn" data-close aria-label="닫기">${ICON.close}</button></div>
    <form class="sbody" id="pform" novalidate>
      <div class="avedit"><div class="avatar" id="p-av">${photoOf(uid)?`<img src="${esc(photoOf(uid))}" alt="">`:esc(initial(uid))}</div>
        ${canPhoto?`<label class="textlink" for="p-photo">사진 변경</label><input type="file" id="p-photo" accept="image/*">`:'<span class="help" style="font-size:12px;color:var(--muted)">사진은 기여자 이상으로 초대받은 사람만 올릴 수 있어요</span>'}</div>
      <div class="field"><label for="p-nick">닉네임</label><input type="text" id="p-nick" maxlength="20" value="${esc(p.nickname||(names[uid]&&names[uid]!=='나'?names[uid]:''))}" placeholder="예: 영등포 하준맘"></div>
      <div class="field"><label for="p-birth">아이 생일 <span class="help">연·월 (영어 가이드에 쓰여요)</span></label><input type="month" id="p-birth" value="${esc(p.childBirth||birthOf())}" max="${new Date().toISOString().slice(0,7)}"></div>
      <div class="field"><span class="lab">우리 아이 나이대</span><div class="seg" id="p-age">${AGES.map(a=>`<button type="button" data-v="${a.k}" aria-pressed="${(p.childAge||'')===a.k}">${a.label}</button>`).join('')}</div></div>
      <div class="field"><label for="p-bio">소개</label><textarea id="p-bio" maxlength="150" placeholder="예: 5살 딸 키우는 엄마예요. 잠자리 영어 그림책 같이 나눠요">${esc(p.bio||'')}</textarea></div>
      <p class="err" id="p-err" hidden></p>
      <button class="pill primary" type="submit" style="padding:14px">저장</button>
      ${db?'<button type="button" class="textlink" id="p-logout" style="align-self:center;color:var(--muted)">로그아웃</button>':''}
    </form></div></div>`;
  const lo=$('#p-logout'); if(lo)lo.onclick=async()=>{await api.signOut();location.href='/'};
  let childAge=p.childAge||'';
  $('#p-age').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;childAge=b.dataset.v;[...$('#p-age').children].forEach(x=>x.setAttribute('aria-pressed',x===b))});
  const inp=$('#p-photo');
  if(inp)inp.addEventListener('change',e=>{const f=e.target.files&&e.target.files[0]; if(!f)return; if(!/^image\//.test(f.type)){toast('이미지 파일만 올릴 수 있어요');return}
    file=f; if(prev)URL.revokeObjectURL(prev); prev=URL.createObjectURL(f); $('#p-av').innerHTML=`<img src="${prev}" alt="새 프로필 사진">`});
  $('#pform').addEventListener('submit',async e=>{
    e.preventDefault(); const nick=$('#p-nick').value.trim(), bio=$('#p-bio').value.trim(), err=$('#p-err');
    if(!nick){err.textContent='닉네임을 적어주세요.';err.hidden=false;return}
    const btn=$('#pform button[type=submit]'); btn.disabled=true; btn.textContent='저장 중…';
    const pb=$('#p-birth').value, pbm=monthsOld(pb); if(pbm!==null){childAge=ageKeyFromMonths(pbm);try{localStorage.setItem('bookle.birth',pb)}catch(_){}}
    const data={nickname:nick,bio,childAge,...(pbm!==null?{childBirth:pb}:{})};
    try{
      if(file){ const blob=await shrinkImage(file,480);
        if(db){data.photoUrl=await api.uploadAvatar(blob)} else data.photoLocal=URL.createObjectURL(blob); }
    }catch(x){console.error('uploadAvatar',x);btn.disabled=false;btn.textContent='저장';err.innerHTML='사진을 올리지 못했어요. 다른 사진으로 다시 시도해주세요.'+(x&&x.message?`<br><small style="opacity:.7">(${esc(x.message)})</small>`:'');err.hidden=false;return}
    const ok=await saveProfile(data);
    if(ok){closeSheet();toast('프로필을 저장했어요')} else {btn.disabled=false;btn.textContent='저장'}
  });
}
async function saveProfile(data){
  const next={...(profiles[uid]||{}),...data,at:Date.now()};
  if(!db){profiles[uid]=next;refresh();return true}
  delete next.photoLocal;
  try{await api.saveProfile(next);profiles[uid]=next;refresh();return true}
  catch(err){console.error('saveProfile',err); lastSaveErr=String((err&&err.message)||err||''); toast('프로필을 저장하지 못했어요. 잠시 후 다시 시도해주세요.');return false}
}
let lastSaveErr='';

/* ---------- SHARE (카톡 공유) ----------
   카카오 SDK로 표지 카드를 보내고, 안 되면 기기 공유 → 링크 복사 순서로 대신해요.
   링크(/book/아이디)를 열면 그 책 상세가 바로 떠요. */
const shareLink=g=>/^[A-Za-z0-9-]+$/.test(g.id)?location.origin+'/book/'+g.id:location.origin;
const KAKAO_KEY=import.meta.env.VITE_KAKAO_JS_KEY;
function kakaoReady(){try{const K=window.Kakao; if(!K||!KAKAO_KEY)return null; if(!K.isInitialized())K.init(KAKAO_KEY); return K}catch(_){return null}}
const shareText=g=>`[북클] ${g.title}\n${g.recs.length>1?`이웃 ${g.recs.length}명이`:nameOf(g.uid)+'님이'} 추천한 ${ageOf(g.age).label} 영어 그림책이에요.\n${shareLink(g)}`;
async function copyText(txt,fallbackSel){
  try{await navigator.clipboard.writeText(txt);return true}
  catch(_){const el=$(fallbackSel); if(el){el.hidden=false;el.focus();el.select()} return false}
}
function openShare(b){
  const g=freshBook(b.id)||b;
  const s=$('#sheet'); s.hidden=false;
  s.innerHTML=`<div class="scrim" data-close><div class="sheet" role="dialog" aria-label="공유">
    <div class="shead"><h3>이 책 공유하기</h3><button class="iconbtn" data-close aria-label="닫기">${ICON.close}</button></div>
    <div class="sbody">
      <div class="kpreview"><div class="kcover" style="background:${coverBg(g.hue)};color:${coverInk(g.hue)}">${coverSrc(g)?coverImg(g):`<span>${esc(g.title)}</span>`}</div>
        <div class="ktext"><b>${esc(g.title)}</b><span>${g.recs.length>1?`이웃 ${g.recs.length}명이`:esc(nameOf(g.uid))+'님이'} 추천한 ${ageOf(g.age).label} 영어 그림책</span><small>북클 · 자세히 보기</small></div></div>
      <button class="sbtn kakao" id="sh-kakao">${KAKAO_ICON}카카오톡으로 보내기</button>
      <button class="sbtn" id="sh-copy" style="border:1px solid var(--line)">링크 복사</button>
      <textarea id="sh-fallback" readonly hidden style="min-height:90px">${esc(shareText(g))}</textarea>
      <p class="lfine">받은 사람이 링크를 열면 이 책 상세가 바로 열려요.</p>
    </div></div></div>`;
  $('#sh-kakao').onclick=async()=>{
    const K=kakaoReady(), url=shareLink(g), who=g.recs.length>1?`이웃 ${g.recs.length}명이`:nameOf(g.uid)+'님이';
    if(K){ try{ K.Share.sendDefault({objectType:'feed',content:{title:g.title,description:`${who} 추천한 ${ageOf(g.age).label} 영어 그림책`,imageUrl:g.cover||location.origin+'/og.png',imageWidth:400,imageHeight:560,link:{mobileWebUrl:url,webUrl:url}},social:{likeCount:likeCount(g),commentCount:cmts(g).length},buttons:[{title:'책 보러 가기',link:{mobileWebUrl:url,webUrl:url}}]}); return }catch(_){} }
    if(navigator.share){ try{ await navigator.share({title:g.title,text:shareText(g),url}); return }catch(_){} }
    const ok=await copyText(shareText(g),'#sh-fallback');toast(ok?'메시지를 복사했어요. 카톡에 붙여넣어 주세요':'아래 내용을 길게 눌러 복사해주세요')};
  $('#sh-copy').onclick=async()=>{const ok=await copyText(shareLink(g),'#sh-fallback');toast(ok?'링크를 복사했어요':'아래 내용을 길게 눌러 복사해주세요')};
}
/* 공유 링크로 들어오면 그 책을 바로 열어요 */
let hashDone='';
function openFromHash(){
  const m=location.pathname.match(/^\/book\/([A-Za-z0-9-]+)\/?$/)||location.hash.match(/^#book-([A-Za-z0-9-]+)$/); if(!m||hashDone===m[1])return;
  const g=freshBook(m[1]); if(!g)return;
  hashDone=m[1];
  if(!$('#sheet').hidden)closeSheet();
  if(profileUid){profileUid=null;$('#profile').hidden=true}
  if(detailBook){$('#detail').hidden=true;detailBook=null}
  const i=deckFor(g.age).findIndex(x=>x.id===g.id);
  openDeck(g.age,Math.max(0,i));
  setTimeout(()=>{const c=$('#deck .card.cur'); if(c)openDetail(c,freshBook(g.id)||g)},120);
}
window.addEventListener('hashchange',()=>{hashDone='';openFromHash()});

/* ---------- DATA ACTIONS ---------- */
async function toggleLike(b,forceOn){ if(!signedIn()){requireLogin(()=>toggleLike(b,true),'마음에 드는 책에 좋아요를 누르려면 로그인해주세요.','like:'+b.id);return} lastScroll=0;
  if(!canWrite&&!b.sample){toast('보기 전용으로 공유된 책장이에요');return}
  const g=freshBook(b.id)||b, recs=g.recs||[g];
  const on=forceOn?true:!isLiked(g);
  // 켤 때는 대표 추천에 기록, 끌 때는 내가 눌러둔 모든 추천에서 지워요
  const targets=on?[recs[0]]:recs.filter(r=>r.likes&&r.likes[uid]);
  targets.forEach(r=>{r.likes={...(r.likes||{}),[uid]:on}}); refresh();
  if(g.sample||!db)return;
  try{for(const r of targets)await api.setLike(r.id,on)}catch(err){targets.forEach(r=>{r.likes={...(r.likes||{}),[uid]:!on}});refresh();toast('좋아요를 저장하지 못했어요. 잠시 후 다시 눌러주세요.')}
}
async function addComment(b,text){
  const c={bookId:b.id,uid,text,at:Date.now()};
  if(b.sample||!db){(localComments[b.id]=localComments[b.id]||[]).push(c);refresh();return true}
  try{await api.addComment(c.bookId,text);(comments[c.bookId]=comments[c.bookId]||[]).push(c);refresh();return true}catch(err){toast('댓글을 저장하지 못했어요. 잠시 후 다시 시도해주세요.');return false}
}
async function addBook(data){
  const doc={...data,uid,at:Date.now(),likes:{}};
  if(!db){books.push({...doc,id:'l'+Date.now()});refresh();return true}
  try{await api.addBook(doc);await reload();return true}catch(err){toast('등록하지 못했어요. 다시 시도해주세요.');return false}
}
function refresh(){ if(guideOpen)renderGuide(); openFromHash(); if(profileUid)renderProfile(); if(curAge&&!detailBook)renderDeck(); else if(!curAge)renderHome(); if(detailBook)renderDetail(); if(sheetBook)renderCommentList(); }

/* ---------- COMMENTS SHEET ---------- */
let sheetBook=null;
function openComments(b){
  sheetBook=b;
  const s=$('#sheet');s.hidden=false;
  s.innerHTML=`<div class="scrim" data-close><div class="sheet" role="dialog" aria-label="댓글">
    <div class="shead"><h3>댓글</h3><button class="iconbtn" data-close aria-label="닫기">${ICON.close}</button></div>
    <div class="sbody" id="clist"></div>
    ${!signedIn()?`<div class="cform ask"><button class="pill primary" id="c-login" type="button">로그인하고 댓글 달기</button></div>`:canWrite||b.sample?`<form class="cform" id="cform"><input type="text" id="cinput" placeholder="${esc(b.title)}에 댓글 달기" maxlength="300" autocomplete="off"><button class="pill primary" type="submit">게시</button></form>`:''}
  </div></div>`;
  renderCommentList();
  const cl=$('#c-login'); if(cl)cl.onclick=()=>requireLogin(()=>openComments(b),'댓글을 남기려면 로그인해주세요.','comments:'+b.id);
  const f=$('#cform'); if(f)f.addEventListener('submit',async e=>{e.preventDefault();const i=$('#cinput');const t=i.value.trim();if(!t)return;i.value='';await addComment(b,t);renderCommentList();const l=$('#clist');l.scrollTop=l.scrollHeight});
}
function renderCommentList(){
  const l=$('#clist'); if(!l||!sheetBook)return;
  const b=freshBook(sheetBook.id)||sheetBook;
  const list=cmts(b);
  l.innerHTML=`<div class="cm">${av(b.uid)}<div><p><b>${esc(nameOf(b.uid))}</b> ${esc(b.summary)}</p><small>${b.sample?'예시':ago(b.at)}</small></div></div>`+
    (list.length?list.map(c=>`<div class="cm">${av(c.uid)}<div><p><b>${esc(nameOf(c.uid))}</b> ${esc(c.text)}</p><small>${ago(c.at)}</small></div></div>`).join('')
      :`<p style="color:var(--muted);margin:0;font-size:14px">아직 댓글이 없어요. 이 책을 읽어본 경험을 나눠주세요.</p>`);
}
function closeSheet(){pendingAfterLogin=null;$('#sheet').hidden=true;$('#sheet').innerHTML='';sheetBook=null}
$('#sheet').addEventListener('click',e=>{if(e.target.matches('[data-close]')||e.target.closest('button[data-close]'))closeSheet()});

/* ---------- REGISTER SHEET ---------- */
function openRegister(preset){ requireLogin(()=>openRegisterRaw(preset),'우리 아이가 좋아한 책을 올리려면 로그인해주세요.','register') }
function openRegisterRaw(preset){
  sheetBook=null;
  const st={age:curAge||'0-2',rating:5,hue:HUES[Math.floor(Math.random()*HUES.length)]};
  const s=$('#sheet');s.hidden=false;
  s.innerHTML=`<div class="scrim" data-close><div class="sheet reg" role="dialog" aria-label="책 등록">
    <div class="shead"><h3>우리 아이가 좋아한 책 등록</h3><button class="iconbtn" data-close aria-label="닫기">${ICON.close}</button></div>
    <form class="sbody" id="rform" novalidate>
      <div id="r-search" class="field">
        <div class="sbar"><input type="text" id="r-q" placeholder="책 제목이나 작가로 검색" autocomplete="off" aria-label="책 검색"><button type="button" class="iconbtn" id="r-snap" aria-label="사진으로 찾기" style="border:1px solid var(--line);border-radius:12px;width:46px;height:46px">${ICON.camera}</button><button type="button" class="pill primary" id="r-go">검색</button></div>
        <div class="results" id="r-results"></div>
        <button type="button" class="textlink" id="r-manual" style="align-self:flex-start">찾는 책이 없나요? 직접 입력하기</button>
      </div>
      <div id="r-detail" class="sbody" style="padding:0;overflow:visible" hidden>
      <div class="picked" id="r-picked" hidden></div>
      <div class="note" id="r-dup" hidden></div>
      <div class="field"><label for="r-title">책 제목</label><input type="text" id="r-title" placeholder="예: Goodnight Moon" maxlength="120"></div>
      <div class="field"><label for="r-author">작가</label><input type="text" id="r-author" placeholder="예: Margaret Wise Brown" maxlength="80"></div>
      <div class="field"><label for="r-pub">출판사</label><input type="text" id="r-pub" maxlength="80"></div>
      <div class="field"><span class="lab">나이대</span><div class="seg" id="r-age">${AGES.map(a=>`<button type="button" data-v="${a.k}" aria-pressed="${a.k===st.age}">${a.label}</button>`).join('')}</div></div>
      <div class="field"><span class="lab">주제 <span class="help">선택하면 홈의 주제별 줄에도 나와요</span></span><div class="seg" id="r-tags" style="grid-template-columns:repeat(2,1fr)">${TAGS.map(t=>`<button type="button" data-v="${t.k}" aria-pressed="false">${t.label}</button>`).join('')}</div></div>
      <div class="field"><span class="lab">평점</span><div class="rate" id="r-rate">${[1,2,3,4,5].map(n=>`<button type="button" data-v="${n}" class="${n<=st.rating?'on':''}" aria-label="${n}점">★</button>`).join('')}</div></div>
      <div class="field"><label for="r-sum">내용 간략히 <span class="help">카드 앞면 캡션에도 보여요</span></label><textarea id="r-sum" maxlength="400" placeholder="어떤 이야기인지, 아이가 어떤 부분을 좋아했는지"></textarea></div>
      <div class="field"><label for="r-how">이렇게 읽어주세요 <span class="help">한 줄에 팁 하나씩 적으면 순서대로 정리돼요</span></label><textarea id="r-how" maxlength="1200" style="min-height:120px" placeholder="반복 문장은 노래하듯 읽어요&#10;페이지 넘기기 전에 다음 장면을 예측해봐요"></textarea></div>
      <div class="field"><span class="lab">표지 색 <span class="help">검색 결과에 표지가 없을 때 쓰여요</span></span><div class="swatches" id="r-hue">${HUES.map(h=>`<button type="button" data-v="${h}" style="background:${coverBg(h)}" aria-pressed="${h===st.hue}" aria-label="표지 색"></button>`).join('')}</div></div>
      <p class="err" id="r-err" hidden></p>
      <button class="pill primary" type="submit" style="padding:14px">등록하기</button>
      </div>
    </form></div></div>`;
  const pick=(id,key,cb)=>$(id).addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;st[key]=key==='age'?b.dataset.v:+b.dataset.v;cb()});
  const syncSeg=id=>[...$(id).children].forEach(x=>x.setAttribute('aria-pressed',x.dataset.v==String(st[id==='#r-age'?'age':'hue'])));
  pick('#r-age','age',()=>syncSeg('#r-age'));
  pick('#r-hue','hue',()=>syncSeg('#r-hue'));
  st.tags=[]; $('#r-tags').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.v;st.tags=st.tags.includes(k)?st.tags.filter(x=>x!==k):[...st.tags,k];b.setAttribute('aria-pressed',st.tags.includes(k))});
  pick('#r-rate','rating',()=>[...$('#r-rate').children].forEach(x=>x.classList.toggle('on',+x.dataset.v<=st.rating)));
  let found=[];
  const showDetail=b=>{ st.remoteCover=b&&b.cover||'';
    $('#r-search').hidden=true; $('#r-detail').hidden=false;
    const pk=$('#r-picked');
    if(b){ $('#r-title').value=b.title; $('#r-author').value=b.author; $('#r-pub').value=b.publisher||''; st.source=b.source;
      pk.innerHTML=`${b.cover?`<img class="rc" src="${esc(b.cover)}" alt="" style="object-fit:cover">`:`<i class="rc" style="background:${coverBg(st.hue)}"></i>`}<div><b>${esc(b.title)}</b><span>${esc(b.author)} · ${esc(b.publisher||'')}</span></div><button type="button" class="textlink" id="r-again">다시 찾기</button>`; pk.hidden=false;
    } else { pk.innerHTML=`<div><b>직접 입력</b><span>검색에 없는 책이에요</span></div><button type="button" class="textlink" id="r-again">다시 찾기</button>`; pk.hidden=false; st.source='manual'; $('#r-title').focus(); }
    $('#r-again').onclick=()=>{$('#r-detail').hidden=true;$('#r-search').hidden=false;$('#r-q').focus()};
    st.isbn=b&&b.isbn||''; checkDup();
  };
  const checkDup=()=>{
    const key=bookKey({isbn:st.isbn,title:$('#r-title').value}), g=allGroups().real.find(x=>x.key===key), box=$('#r-dup');
    st.dup=g||null; st.mineDup=!!(g&&g.recs.some(r=>r.uid===uid));
    if(!g||!$('#r-title').value.trim()){box.hidden=true;return}
    box.hidden=false;
    box.innerHTML=st.mineDup?`<b>이미 추천한 책이에요.</b> 같은 책은 한 번만 추천할 수 있어요.`
      :`<b>이웃 ${g.recs.length}명이 이미 추천한 책이에요.</b> 내 추천은 같은 카드에 더해져요. 나이대는 이 책의 기존 나이대(${ageOf(g.age).label})로 맞췄어요.`;
    if(!st.mineDup){st.age=g.age;syncSeg('#r-age')}
  };
  $('#r-title').addEventListener('change',checkDup);
  const doSearch=async()=>{
    const q=$('#r-q').value.trim(), box=$('#r-results'); if(!q){box.innerHTML='';return}
    box.innerHTML='<p style="margin:0;color:var(--muted);font-size:13px">찾는 중…</p>';
    found=await searchBooks(q);
    box.innerHTML=found.length?found.map((b,i)=>`<button type="button" class="res" data-i="${i}">${b.cover?`<img class="rc" src="${esc(b.cover)}" alt="" style="object-fit:cover">`:`<i class="rc" style="background:${coverBg(HUES[i%HUES.length])}"></i>`}<div><b>${esc(b.title)}</b><span>${esc(b.author)} · ${esc(b.publisher)}</span></div></button>`).join('')
      :'<p style="margin:0;color:var(--muted);font-size:13px">검색 결과가 없어요. 영어 제목으로 다시 찾거나 직접 입력해주세요.</p>';
  };
  $('#r-go').onclick=doSearch;
  $('#r-q').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();doSearch()}});
  $('#r-results').addEventListener('click',e=>{const r=e.target.closest('.res');if(r)showDetail(found[+r.dataset.i])});
  $('#r-manual').onclick=()=>showDetail(null);
  $('#r-snap').onclick=()=>photoFind();
  if(preset&&preset.title){showDetail(preset)} else setTimeout(()=>{try{$('#r-q').focus()}catch(_){}},50);
  $('#rform').addEventListener('submit',async e=>{
    e.preventDefault();
    const title=$('#r-title').value.trim(), summary=$('#r-sum').value.trim(), err=$('#r-err');
    if(!title||!summary){err.textContent='책 제목과 내용 소개를 적어주세요.';err.hidden=false;return}
    if($('#r-detail').hidden)return;
    checkDup(); if(st.mineDup){err.textContent='이미 추천한 책이에요. 다른 책을 골라주세요.';err.hidden=false;return}
    const btn=e.submitter||$('#rform button[type=submit]'); btn.disabled=true; const tierBefore=tierOf(uid).lv;
    const ok=await addBook({tags:st.tags||[],isbn:st.isbn||'',cover:st.remoteCover||'',title,author:$('#r-author').value.trim(),publisher:$('#r-pub').value.trim(),source:st.source||'manual',summary,howTo:$('#r-how').value.trim(),age:st.age,rating:st.rating,hue:st.hue});
    if(ok){const wasDup=!!st.dup;closeSheet();const before=tierBefore;setTimeout(()=>{const t=tierOf(uid);toast(t.lv>before?`${t.name} 등급이 됐어요! 등록한 책 ${t.n}권`:wasDup?'이웃들의 추천에 내 추천을 더했어요':'책장에 등록됐어요')},400);openDeck(st.age,0)} else {btn.disabled=false}
  });
}

/* ---------- 사진으로 책 찾기 ----------
   1) 바코드(ISBN)를 먼저 읽어요: 브라우저 BarcodeDetector → 없으면 ZXing
   2) 바코드가 없으면 표지 사진을 서버(Claude 비전)로 보내 제목·작가를 읽어요
   3) 북클에 이미 추천된 책이면 바로 보여주고, 아니면 '내가 첫 추천하기'로 이어줘요
   ISBN 조회는 /api/book-search?isbn=, 표지 읽기는 /api/read-cover 예요. */
let sampleCap=true; // 표지 읽기는 /api/read-cover (서버의 Claude 비전)
function photoFind(){
  const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.setAttribute('capture','environment');
  inp.style.cssText='position:fixed;left:-9999px'; document.body.appendChild(inp);
  inp.onchange=()=>{const f=inp.files&&inp.files[0]; inp.remove(); if(f)runPhotoFind(f)};
  inp.click();
}
function loadZXing(){return import('@zxing/library')}
async function readBarcode(blob){
  const url=URL.createObjectURL(blob);
  try{
    if('BarcodeDetector' in window){
      const det=new BarcodeDetector({formats:['ean_13','ean_8','upc_a']});
      const img=await createImageBitmap(blob); const r=await det.detect(img);
      const hit=r.find(x=>/^97[89]\d{10}$/.test(x.rawValue))||r[0]; if(hit)return hit.rawValue;
    }
    const Z=await loadZXing(); const reader=new Z.BrowserMultiFormatReader();
    const res=await reader.decodeFromImageUrl(url); return res&&res.getText?res.getText():'';
  }catch(_){return ''} finally{URL.revokeObjectURL(url)}
}
async function readCover(blob){
  try{ const out=await api.readCover(blob); return out&&(out.title||out.isbn)?out:null }
  catch(_){ return null }
}
function matchBooks(isbn,title){
  const G=allGroups(), all=[...G.real,...G.samples], nt=normTitle(title);
  const same=g=>(isbn&&g.isbn&&String(g.isbn).replace(/\D/g,'')===isbn)||(nt.length>2&&(normTitle(g.title).includes(nt)||nt.includes(normTitle(g.title))));
  const inBookle=all.filter(same).sort((a,b)=>(b.sample?0:1)-(a.sample?0:1));
  const cat=!db&&nt.length>2?DEMO_CATALOG.filter(c=>normTitle(c.title).includes(nt)||nt.includes(normTitle(c.title))):[];
  return {inBookle, cat};
}
async function runPhotoFind(file){
  const s=$('#sheet'); s.hidden=false; sheetBook=null;
  const thumb=URL.createObjectURL(file);
  const frame=body=>`<div class="scrim" data-close><div class="sheet" role="dialog" aria-label="사진으로 찾기">
    <div class="shead"><h3>사진으로 찾기</h3><button class="iconbtn" data-close aria-label="닫기">${ICON.close}</button></div>
    <div class="sbody">${body}</div></div></div>`;
  const head=msg=>`<div class="snaphead"><img class="snapimg" src="${thumb}" alt="찍은 사진">${msg}</div>`;
  s.innerHTML=frame(head(`<div style="display:flex;gap:10px;align-items:center"><span class="spin"></span><p>책을 알아보는 중이에요…</p></div>`));
  let blob; try{blob=await shrinkImage(file,1400)}catch(_){blob=file}
  let isbn=(await readBarcode(blob)).replace(/\D/g,''), read=null, how='바코드';
  let m=isbn?matchBooks(isbn,''):{inBookle:[],cat:[]};
  if(!m.inBookle.length){
    if(!isbn)how='표지';
    if(!$('#sheet').hidden)s.innerHTML=frame(head(`<div style="display:flex;gap:10px;align-items:center"><span class="spin"></span><p>${isbn?`바코드 ${isbn}을 읽었어요. 표지 글자도 확인하는 중…`:'표지에서 제목을 읽는 중…'}</p></div>`));
    read=await readCover(blob);
    if(read){ if(!isbn&&read.isbn)isbn=String(read.isbn).replace(/\D/g,''); m=matchBooks(isbn,read.title||''); }
  }
  if(!m.inBookle.length&&(isbn||(read&&read.title))){ try{ const r=await searchBooks(isbn||read.title); if(r.length)m.cat=r }catch(_){} }
  if($('#sheet').hidden)return; // 그 사이 닫았으면 그만
  const title=read&&read.title, author=read&&read.author;
  const found=g=>`<button class="found" data-gid="${g.id}"><span class="fc" style="background:${coverBg(g.hue)};color:${coverInk(g.hue)}">${coverSrc(g)?`<img src="${esc(coverSrc(g))}" alt="">`:esc(g.title)}</span>
      <div><b>${esc(g.title)}</b><span>${ageOf(g.age).label} · ${g.sample?'북클 예시':g.recs.length>1?`이웃 ${g.recs.length}명 추천`:esc(nameOf(g.uid))+'님 추천'} · <span class="stars" style="display:inline">★</span> ${g.rating||'-'}</span></div>${ICON.back.replace('M15 5l-7 7 7 7','M9 5l7 7-7 7')}</button>`;
  const catRow=(c,i)=>`<button class="found" data-cat="${i}"><span class="fc" style="background:${coverBg(HUES[i%HUES.length])};color:${coverInk(HUES[i%HUES.length])}">${esc(c.title)}</span><div><b>${esc(c.title)}</b><span>${esc(c.author)} · ${esc(c.publisher)}</span></div><span class="pill primary" style="padding:7px 12px;font-size:13px;flex:none">첫 추천하기</span></button>`;
  const what=title?`<p><b>${esc(title)}</b>${author?`<br><span style="color:var(--muted)">${esc(author)}</span>`:''}<br><small style="color:var(--muted)">${how}로 찾았어요${isbn?` · ISBN ${isbn}`:''}</small></p>`
    :isbn?`<p><b>ISBN ${isbn}</b><br><small style="color:var(--muted)">바코드로 읽었어요</small></p>`:`<p><b>책을 알아보지 못했어요</b><br><small style="color:var(--muted)">제목이 잘 보이게 표지를 정면으로, 또는 뒷면 바코드를 가까이 찍어주세요.</small></p>`;
  let body=head(what);
  if(m.inBookle.length) body+=`<div class="blk"><h4>북클에 있는 책이에요</h4><div class="recs">${m.inBookle.slice(0,3).map(found).join('')}</div></div>`;
  else if(m.cat.length) body+=`<div class="blk"><h4>아직 북클에 추천이 없어요</h4><div class="recs">${m.cat.slice(0,3).map(catRow).join('')}</div></div>`;
  else if(title||isbn) body+=`<div class="note">아직 북클에 없는 책이에요.${!sampleCap?'':''} 아이에게 읽어보고 좋았다면 첫 추천을 남겨주세요.</div>
    <button class="pill primary" id="ph-reg">이 책 추천하기</button>`;
  body+=`<div style="display:flex;gap:8px"><button class="pill" id="ph-again" style="flex:1">다시 찍기</button><button class="pill" id="ph-text" style="flex:1">제목으로 검색</button></div>
`;
  s.innerHTML=frame(body);
  s.querySelectorAll('[data-gid]').forEach(b=>b.onclick=e=>{e.stopPropagation();const g=freshBook(b.dataset.gid);closeSheet();openBook(g)});
  s.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{const c=m.cat[+b.dataset.cat];closeSheet();openRegister({...c,isbn:c.isbn||isbn})});
  const rg=$('#ph-reg'); if(rg)rg.onclick=()=>{closeSheet();openRegister({title:title||'',author:author||'',publisher:'',isbn,source:'photo'})};
  $('#ph-again').onclick=()=>{closeSheet();photoFind()};
  $('#ph-text').onclick=()=>{closeSheet();openRegister()};
}

/* ---------- BOOK SEARCH ----------
   /api/book-search(알라딘 → 카카오)로 찾아요. 결과의 cover(표지 URL)가 책 카드 표지로 저장돼요.
   아래 목록은 서버 검색이 안 될 때(미리보기 모드)만 쓰는 예시예요. */
const DEMO_CATALOG=[
 ['Goodnight Moon','Margaret Wise Brown','HarperCollins'],
 ['Brown Bear, Brown Bear, What Do You See?','Bill Martin Jr. · Eric Carle','Henry Holt'],
 ['The Very Hungry Caterpillar','Eric Carle','Philomel Books'],
 ['Dear Zoo','Rod Campbell','Macmillan'],
 ["Where's Spot?",'Eric Hill','Puffin'],
 ['Chicka Chicka Boom Boom','Bill Martin Jr. · John Archambault','Beach Lane Books'],
 ['Guess How Much I Love You','Sam McBratney','Candlewick'],
 ["We're Going on a Bear Hunt",'Michael Rosen · Helen Oxenbury','Walker Books'],
 ['Pete the Cat: I Love My White Shoes','Eric Litwin · James Dean','HarperCollins'],
 ['Press Here','Hervé Tullet','Chronicle Books'],
 ['The Gruffalo','Julia Donaldson · Axel Scheffler','Macmillan'],
 ['Room on the Broom','Julia Donaldson · Axel Scheffler','Macmillan'],
 ['We Are in a Book!','Mo Willems','Hyperion'],
 ["Don't Let the Pigeon Drive the Bus!",'Mo Willems','Hyperion'],
 ['Where the Wild Things Are','Maurice Sendak','HarperCollins'],
 ['Corduroy','Don Freeman','Viking'],
 ['Frog and Toad Are Friends','Arnold Lobel','HarperCollins'],
 ['Mercy Watson to the Rescue','Kate DiCamillo','Candlewick']
].map(([title,author,publisher],i)=>({title,author,publisher,source:i%2?'kakao':'aladin'}));
async function searchBooks(q){
  if(db){ try{ return await api.searchBooks(q) }catch(_){ /* 서버 검색이 안 되면 아래 예시 목록으로 */ } }
  const t=q.toLowerCase().replace(/[^a-z0-9가-힣 ]/g,'');
  return DEMO_CATALOG.filter(b=>(b.title+' '+b.author).toLowerCase().replace(/[^a-z0-9가-힣 ]/g,'').includes(t)).slice(0,10);
}

/* ---------- LIVE DATA ---------- */
/* ---------- 표지 자동 채우기 ----------
   ISBN만 있고 표지(cover)가 비어 있는 책은 /api/book-search?isbn= (알라딘 → 카카오)로 표지·제목·작가를 찾아 채워요.
   ISBN이 없는 예시 책은 제목+작가로 찾아요. 찾은 결과는 이 기기에 저장해서 다음부터는 바로 보여줘요. */
const COVER_KEY='bookle.covers.v1';
let coverCache={}; try{coverCache=JSON.parse(localStorage.getItem(COVER_KEY)||'{}')||{}}catch(_){coverCache={}}
const coverPending=new Set();
const lookupKey=b=>{const i=String(b.isbn||'').replace(/[^0-9Xx]/g,''); return i?'i'+i:(b.title?'t'+normTitle(b.title):'')};
function applyCovers(list){
  let changed=false;
  list.forEach(b=>{ const k=lookupKey(b), c=k&&coverCache[k]; if(!c)return;
    if(!b.cover&&c.cover){b.cover=c.cover;changed=true}
    if(!b.title&&c.title){b.title=c.title;changed=true}
    if(!b.author&&c.author){b.author=c.author;changed=true}
    if(!b.publisher&&c.publisher){b.publisher=c.publisher;changed=true} });
  return changed;
}
async function fillCovers(){
  const list=[...books,...SAMPLES];
  if(applyCovers(list))refresh();
  const todo=[...new Map(list.filter(b=>!b.cover||!b.title).map(b=>[lookupKey(b),b])).entries()]
    .filter(([k])=>k&&!(k in coverCache)&&!coverPending.has(k)).slice(0,60);
  if(!todo.length)return;
  let i=0, got=false;
  const worker=async()=>{ while(i<todo.length){ const [k,b]=todo[i++]; coverPending.add(k);
    try{ const q=k[0]==='i'?'isbn='+encodeURIComponent(k.slice(1)):'q='+encodeURIComponent((b.title+' '+String(b.author||'').split(/[·,]/)[0]).trim());
      const r=await fetch('/api/book-search?'+q); if(!r.ok)throw 0;
      const it=((await r.json()).items||[]).find(x=>x.cover)||null;
      coverCache[k]=it?{cover:it.cover,title:it.title||'',author:it.author||'',publisher:it.publisher||''}:{}; got=true;
    }catch(_){ /* 다음 방문 때 다시 시도 */ } finally{ coverPending.delete(k) } } };
  await Promise.all([worker(),worker(),worker()]);
  if(got){ try{localStorage.setItem(COVER_KEY,JSON.stringify(coverCache))}catch(_){}; if(applyCovers(list))refresh() }
}
async function reload(){
  if(!db){ fillCovers(); return }
  try{ const d=await api.loadAll(); books=d.books; comments=d.comments; profiles=d.profiles; live=true }
  catch(e){ console.error(e); toast('책장을 불러오지 못했어요. 인터넷 연결을 확인해주세요.') }
  applyCovers(books); refresh(); fillCovers();
}
(async()=>{
  renderHome(); openFromHash();
  if(!api.enabled){ console.info('[Bookle] Supabase 설정이 없어 미리보기 모드로 실행해요.'); refresh(); fillCovers(); return }
  db=api;
  const u=await api.init().catch(()=>null);
  if(u){ uid=u.id; const nm=api.userName(); if(nm)names[uid]=nm }
  await reload();
  if(u){
    const g=await api.loadGuide().catch(()=>null); if(g){guideChecks={...guideChecks,...g}}
    /* 프로필 입력은 자세히 보기·좋아요·등록 등을 누를 때만 띄워요 (홈 첫 화면에서는 안 띄움) */
    if(signedIn()){ const fn=resumePending(); if(fn)setTimeout(fn,300) }
  }
  api.subscribe(reload);
  refresh();
})();
