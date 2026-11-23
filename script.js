/* =========================================================
   체리블러쉬 — script.js
   1) 데이터  2) 저장소  3) 화면 공통  4) 슬라이드
   5) 상품 목록·상세  6) 장바구니  7) 회원  8) 주문·체험 결제  9) 마이페이지
   ========================================================= */
'use strict';

/* =========================================================
   1. 데이터 — 다음 주 데이터베이스 테이블로 옮길 부분
   ========================================================= */
const CATEGORIES = ['폰케이스', '에어팟케이스', '충전잭 키링', '스마트톡'];

const PRODUCTS = [
  { id: 1, name: '체리 퀼팅 퍼피 케이스', category: '폰케이스', price: 21900, stock: 30, image: 'img/case-puffy.jpg', badge: 'BEST', description: '도톰한 퀼팅이 손에 착 감기는 말랑 실리콘 케이스예요. 크롬 카메라 링이 렌즈를 지켜줘요.' },
  { id: 2, name: '하트 버블 실리콘 케이스', category: '폰케이스', price: 19900, stock: 25, image: 'img/case-heart.jpg', badge: 'NEW', description: '볼록한 하트 버블이 가득한 밀크 핑크 케이스. 부드러운 무광 촉감이에요.' },
  { id: 3, name: '체리 프린트 젤리 케이스', category: '폰케이스', price: 17900, stock: 4, image: 'img/case-cherry.jpg', badge: '', description: '크림 바탕에 체리를 콕콕 찍은 유광 젤리 케이스. 선명한 프린트가 오래가요.' },
  { id: 4, name: '로즈 웨이브 실리콘 케이스', category: '폰케이스', price: 18900, stock: 20, image: 'img/case-rib.jpg', badge: 'NEW', description: '물결 무늬 굴곡이 그립감을 높여 주는 로즈 핑크 케이스예요.' },
  { id: 5, name: '하트 블러쉬 에어팟케이스', category: '에어팟케이스', price: 13900, stock: 40, image: 'img/pods-heart.jpg', badge: 'BEST', description: '말랑한 실리콘에 통통한 하트를 올렸어요. 금색 고리로 가방에 걸 수 있어요.' },
  { id: 6, name: '리본 밀크 에어팟케이스', category: '에어팟케이스', price: 14900, stock: 20, image: 'img/pods-bow.jpg', badge: 'NEW', description: '밀크 화이트 컬러에 입체 리본 장식. 무선 충전을 지원해요.' },
  { id: 7, name: '하트 퐁당 충전잭 키링', category: '충전잭 키링', price: 8900, stock: 50, image: 'img/key-heart.jpg', badge: 'BEST', description: '충전 단자에 꽂는 실리콘 먼지마개와 아크릴 하트 참. C타입 전용이에요.' },
  { id: 8, name: '체리밤 스마트톡', category: '스마트톡', price: 11900, stock: 35, image: 'img/grip-cherry.jpg', badge: '', description: '아이보리 바탕에 콕콕 체리. 접었다 펴는 거치대 겸 그립톡이에요.' }
];

// 회원 등급: 누적 구매금액(minAmount) 이상이면 해당 등급, 결제금액의 rate만큼 적립
const GRADES = [
  { id: 1, name: '블라썸', minAmount: 0, rate: 0.01 },
  { id: 2, name: '블러쉬', minAmount: 100000, rate: 0.03 },
  { id: 3, name: '로즈', minAmount: 300000, rate: 0.05 },
  { id: 4, name: '퀸', minAmount: 600000, rate: 0.07 }
];

const SETTINGS = {
  signupPoint: 3000,      // 가입 축하 포인트
  freeShippingOver: 30000,
  shippingFee: 3000,
  minPointUse: 1000       // 포인트 최소 사용 금액
};

/* =========================================================
   2. 저장소 (지금은 브라우저 localStorage → 다음 주 DB로 교체)
   ========================================================= */
const KEYS = { members: 'cb_members', session: 'cb_session', cart: 'cb_cart', orders: 'cb_orders', stock: 'cb_stock' };
const memory = {};
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return key in memory ? memory[key] : fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { memory[key] = value; }
  }
};

const state = {
  category: '전체',
  query: '',
  sort: 'recommend',
  members: store.get(KEYS.members, []),
  sessionId: store.get(KEYS.session, null),
  cart: store.get(KEYS.cart, []),            // [{ productId, qty }]
  orders: store.get(KEYS.orders, []),
  stock: store.get(KEYS.stock, {})           // 주문으로 바뀐 재고 { productId: 남은수량 }
};

const saveMembers = () => store.set(KEYS.members, state.members);
const saveOrders = () => store.set(KEYS.orders, state.orders);
const saveStock = () => store.set(KEYS.stock, state.stock);
const saveCart = () => { store.set(KEYS.cart, state.cart); renderCartCount(); };

/* =========================================================
   3. 화면 공통 도우미
   ========================================================= */
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const won = n => Math.round(n).toLocaleString('ko-KR') + '원';
const pt = n => Math.round(n).toLocaleString('ko-KR') + 'P';
const pad = n => String(n).padStart(2, '0');
const digits = s => String(s || '').replace(/\D/g, '');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = t => { const d = new Date(t); return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtPhone = s => { const d = digits(s).slice(0, 11); return d.length < 4 ? d : d.length < 8 ? `${d.slice(0, 3)}-${d.slice(3)}` : `${d.slice(0, 3)}-${d.slice(3, -4)}-${d.slice(-4)}`; };

const productById = id => PRODUCTS.find(p => p.id === id);
const stockOf = p => (p.id in state.stock ? state.stock[p.id] : p.stock);
const currentMember = () => state.members.find(m => m.id === state.sessionId) || null;

function gradeOf(member) {
  const amount = member ? member.totalPurchase : 0;
  return [...GRADES].reverse().find(g => amount >= g.minAmount) || GRADES[0];
}
const nextGradeOf = member => GRADES.find(g => g.minAmount > (member ? member.totalPurchase : 0)) || null;

function toast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 2400);
}

async function hashPassword(pw) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('cherryblush:' + pw));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    let h = 0; for (const c of 'cherryblush:' + pw) h = (h * 31 + c.charCodeAt(0)) | 0; return 'h' + h;
  }
}

/* 모달 · 서랍 열고 닫기 */
const overlay = $('#overlay');
let openLayers = [];
function openLayer(el) {
  if (!openLayers.includes(el)) openLayers.push(el);
  el.classList.add('show');
  overlay.classList.add('show');
  document.body.classList.add('lock');
}
function closeLayer(el) {
  el.classList.remove('show');
  openLayers = openLayers.filter(x => x !== el);
  if (!openLayers.length) { overlay.classList.remove('show'); document.body.classList.remove('lock'); }
}
const closeAll = () => [...openLayers].forEach(closeLayer);
overlay.addEventListener('click', () => openLayers.length && closeLayer(openLayers[openLayers.length - 1]));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && openLayers.length) closeLayer(openLayers[openLayers.length - 1]); });

/* 화면 전체에서 쓰는 버튼(data-속성) 처리 */
document.addEventListener('click', e => {
  const closeBtn = e.target.closest('[data-close]');
  if (closeBtn) { closeLayer(closeBtn.closest('.modal, .drawer')); return; }

  const catBtn = e.target.closest('[data-cat]');
  if (catBtn) { closeAll(); setCategory(catBtn.dataset.cat); $('#products').scrollIntoView({ behavior: 'smooth' }); return; }

  const detailBtn = e.target.closest('[data-detail]');
  if (detailBtn) { openDetail(Number(detailBtn.dataset.detail)); return; }

  const openBtn = e.target.closest('[data-open]');
  if (openBtn) {
    const what = openBtn.dataset.open;
    if (what === 'login' || what === 'signup') openAuth(what);
    if (what === 'mypage') openMyPage();
  }
});

/* =========================================================
   4. 메인 슬라이드 — 사진 4장, 6초마다 교차(페이드)
   ========================================================= */
(function initSlider() {
  const slider = $('#slider');
  const slides = $$('.slide', slider);
  const dotsWrap = $('#dots');
  const INTERVAL = 6000;
  let index = 0;
  let timer = null;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('aria-label', `${i + 1}번 슬라이드`);
    dot.addEventListener('click', () => show(i));
    dotsWrap.appendChild(dot);
  });
  const dots = $$('.dot', dotsWrap);

  function show(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, k) => { s.classList.toggle('is-active', k === index); s.setAttribute('aria-hidden', k !== index); });
    dots.forEach((d, k) => d.classList.toggle('is-active', k === index));
    start();
  }
  function start() { clearInterval(timer); timer = setInterval(() => show(index + 1), INTERVAL); }
  function stop() { clearInterval(timer); }

  $('#prevSlide').addEventListener('click', () => show(index - 1));
  $('#nextSlide').addEventListener('click', () => show(index + 1));
  slider.addEventListener('mouseenter', stop);
  slider.addEventListener('mouseleave', start);
  slider.addEventListener('focusin', stop);
  slider.addEventListener('focusout', start);

  let startX = 0;
  slider.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  slider.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
  });
  start();
})();

/* =========================================================
   5. 상품 목록 · 검색 · 분류 필터 · 상세
   ========================================================= */
function renderNav() {
  $('#navMenu').innerHTML = ['전체', ...CATEGORIES]
    .map(c => `<button type="button" data-cat="${c}" class="${c === state.category ? 'active' : ''}">${c}</button>`).join('');
}

function renderCategoryCards() {
  $('#catCards').innerHTML = CATEGORIES.map(c => {
    const list = PRODUCTS.filter(p => p.category === c);
    return `<button class="cat" type="button" data-cat="${c}">
      <img src="${list[0].image}" alt="" width="72" height="72">
      <div><strong>${c}</strong><span>${list.length}개 상품</span></div>
    </button>`;
  }).join('');
}

function setCategory(category) {
  state.category = category;
  renderNav();
  renderProducts();
}

function filteredProducts() {
  const q = state.query.toLowerCase();
  const list = PRODUCTS.filter(p =>
    (state.category === '전체' || p.category === state.category) &&
    (!q || (p.name + p.category + p.description).toLowerCase().includes(q)));
  const sorters = {
    recommend: (a, b) => a.id - b.id,
    low: (a, b) => a.price - b.price,
    high: (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name, 'ko')
  };
  return list.sort(sorters[state.sort]);
}

function renderProducts() {
  const list = filteredProducts();
  const rate = gradeOf(currentMember()).rate;
  $('#resultInfo').textContent = `${state.category} ${list.length}개${state.query ? ` · "${state.query}" 검색 결과` : ''}`;
  $('#productGrid').innerHTML = list.length ? list.map(p => {
    const stock = stockOf(p);
    const badge = stock === 0 ? '<span class="badge soldout">품절</span>'
      : p.badge ? `<span class="badge ${p.badge === 'NEW' ? 'new' : ''}">${p.badge}</span>` : '';
    return `<article class="card ${stock === 0 ? 'is-soldout' : ''}">
      <button class="card-media" type="button" data-detail="${p.id}" aria-label="${esc(p.name)} 상세 보기">
        <img src="${p.image}" alt="${esc(p.name)}" loading="lazy" width="800" height="800">${badge}
      </button>
      <div class="card-body">
        <p class="card-cat">${p.category}</p>
        <button class="card-name" type="button" data-detail="${p.id}">${esc(p.name)}</button>
        <p class="card-price">${won(p.price)}</p>
        <p class="card-meta"><span>적립 <b>${pt(Math.floor(p.price * rate))}</b></span>${stock > 0 && stock <= 5 ? `<span class="low">${stock}개 남음</span>` : ''}</p>
      </div>
    </article>`;
  }).join('') : '<p class="empty">찾는 상품이 없어요. 다른 단어로 검색해 보세요.</p>';
}

$('#searchForm').addEventListener('submit', e => {
  e.preventDefault();
  state.query = $('#searchInput').value.trim();
  renderProducts();
  $('#products').scrollIntoView({ behavior: 'smooth' });
});
$('#searchInput').addEventListener('input', e => {
  state.query = e.target.value.trim();
  renderProducts();
});
$('#sortSelect').addEventListener('change', e => { state.sort = e.target.value; renderProducts(); });

function openDetail(id) {
  const p = productById(id);
  if (!p) return;
  const stock = stockOf(p);
  const member = currentMember();
  const rate = gradeOf(member).rate;
  let qty = 1;

  $('#detailBody').innerHTML = `
    <div class="detail">
      <div class="detail-media"><img src="${p.image}" alt="${esc(p.name)}" width="800" height="800"></div>
      <div>
        <p class="card-cat">${p.category}</p>
        <h2>${esc(p.name)}</h2>
        <p class="price">${won(p.price)}</p>
        <p class="desc">${esc(p.description)}</p>
        <p class="stock">${stock === 0 ? '<b class="low">품절된 상품이에요</b>' : `재고 ${stock}개`}</p>
        <div class="qty"><button type="button" id="qtyMinus" aria-label="수량 줄이기">−</button><span id="qtyNum">1</span><button type="button" id="qtyPlus" aria-label="수량 늘리기">+</button></div>
        <div class="detail-total"><span>총 상품금액</span><b id="detailSum">${won(p.price)}</b></div>
        <p class="earn">${member ? `${esc(member.name)}님(${gradeOf(member).name}) ` : '회원 '}적립 예정 <span id="detailEarn">${pt(Math.floor(p.price * rate))}</span>${member ? '' : ' · 로그인 후 적립'}</p>
        <div class="detail-actions">
          <button class="btn btn-line" type="button" id="addCart" ${stock === 0 ? 'disabled' : ''}>장바구니</button>
          <button class="btn btn-point" type="button" id="buyNow" ${stock === 0 ? 'disabled' : ''}>바로 구매</button>
        </div>
      </div>
    </div>`;

  const update = () => {
    $('#qtyNum').textContent = qty;
    $('#detailSum').textContent = won(p.price * qty);
    $('#detailEarn').textContent = pt(Math.floor(p.price * qty * rate));
  };
  $('#qtyMinus').onclick = () => { qty = Math.max(1, qty - 1); update(); };
  $('#qtyPlus').onclick = () => {
    if (qty >= stock) { toast(`재고가 ${stock}개 남아 있어요`); return; }
    qty += 1; update();
  };
  $('#addCart').onclick = () => { if (addToCart(p.id, qty)) { toast('장바구니에 담았어요'); closeLayer($('#detailModal')); } };
  $('#buyNow').onclick = () => { if (addToCart(p.id, qty)) { closeLayer($('#detailModal')); openCheckout(); } };
  openLayer($('#detailModal'));
}

/* =========================================================
   6. 장바구니 — 수량 바꾸기 · 삭제 · 합계
   ========================================================= */
function addToCart(productId, qty) {
  const p = productById(productId);
  const item = state.cart.find(i => i.productId === productId);
  const already = item ? item.qty : 0;
  if (already + qty > stockOf(p)) { toast(`재고가 부족해요 (남은 재고 ${stockOf(p)}개)`); return false; }
  if (item) item.qty += qty; else state.cart.push({ productId, qty });
  saveCart();
  return true;
}

const cartSubtotal = () => state.cart.reduce((sum, i) => sum + productById(i.productId).price * i.qty, 0);
const shippingOf = subtotal => (subtotal === 0 || subtotal >= SETTINGS.freeShippingOver ? 0 : SETTINGS.shippingFee);

function renderCartCount() {
  const n = state.cart.reduce((s, i) => s + i.qty, 0);
  const el = $('#cartCount');
  el.textContent = n;
  el.hidden = n === 0;
}

function renderCart() {
  if (!state.cart.length) {
    $('#cartBody').innerHTML = '<div class="cart-empty"><p>장바구니가 비어 있어요.</p></div>';
    $('#cartFoot').innerHTML = '<button class="btn btn-soft btn-block" type="button" data-cat="전체">상품 보러 가기</button>';
    return;
  }
  $('#cartBody').innerHTML = state.cart.map((i, k) => {
    const p = productById(i.productId);
    return `<div class="cart-item">
      <img src="${p.image}" alt="" width="76" height="76">
      <div class="info">
        <p class="name">${esc(p.name)}</p>
        <p class="unit">${won(p.price)}</p>
        <div class="bottom">
          <div class="qty"><button type="button" data-qty="${k}" data-step="-1" aria-label="수량 줄이기">−</button><span>${i.qty}</span><button type="button" data-qty="${k}" data-step="1" aria-label="수량 늘리기">+</button></div>
          <b>${won(p.price * i.qty)}</b>
        </div>
      </div>
      <button class="remove" type="button" data-remove="${k}">삭제</button>
    </div>`;
  }).join('');

  const subtotal = cartSubtotal();
  const shipping = shippingOf(subtotal);
  const member = currentMember();
  $('#cartFoot').innerHTML = `
    <div class="sum"><span>상품 합계</span><span>${won(subtotal)}</span></div>
    <div class="sum"><span>배송비</span><span>${shipping ? won(shipping) : '무료'}</span></div>
    <div class="sum total"><span>결제 예정 금액</span><b>${won(subtotal + shipping)}</b></div>
    <p class="earn">${member ? `${gradeOf(member).name} 등급 적립 예정 ${pt(Math.floor(subtotal * gradeOf(member).rate))}` : '로그인하면 포인트가 적립돼요'}</p>
    <button class="btn btn-point btn-block" type="button" id="goCheckout" style="margin-top:12px">주문하기</button>`;
  $('#goCheckout').onclick = () => { closeLayer($('#cartDrawer')); openCheckout(); };
}

$('#cartBody').addEventListener('click', e => {
  const qtyBtn = e.target.closest('[data-qty]');
  const removeBtn = e.target.closest('[data-remove]');
  if (qtyBtn) {
    const item = state.cart[Number(qtyBtn.dataset.qty)];
    const next = item.qty + Number(qtyBtn.dataset.step);
    const max = stockOf(productById(item.productId));
    if (next < 1) return;
    if (next > max) { toast(`재고가 ${max}개 남아 있어요`); return; }
    item.qty = next;
  }
  if (removeBtn) state.cart.splice(Number(removeBtn.dataset.remove), 1);
  if (qtyBtn || removeBtn) { saveCart(); renderCart(); }
});
$('#cartBtn').addEventListener('click', () => { renderCart(); openLayer($('#cartDrawer')); });

/* =========================================================
   7. 회원가입 · 로그인 · 로그아웃
   ========================================================= */
let afterLogin = null;   // 로그인 뒤 이어서 할 일 (예: 주문서 열기)

function renderUserArea() {
  const m = currentMember();
  $('#userArea').innerHTML = m
    ? `<button class="user-chip" type="button" data-open="mypage" aria-label="마이페이지"><span class="grade">${gradeOf(m).name}</span><span class="nm">${esc(m.name)}님</span><span class="pt">${pt(m.points)}</span></button>`
    : `<button class="btn btn-sm btn-soft" type="button" data-open="login">로그인</button>`;
}

function openAuth(tab) {
  switchAuthTab(tab);
  openLayer($('#authModal'));
}
function switchAuthTab(tab) {
  $$('#authTabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  $('#loginForm').hidden = tab !== 'login';
  $('#signupForm').hidden = tab !== 'signup';
  $('#authTitle').textContent = tab === 'login' ? '로그인' : '회원가입';
  $('#loginError').textContent = '';
  $('#signupError').textContent = '';
}
$('#authTabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) switchAuthTab(b.dataset.tab); });
$('#suPhone').addEventListener('input', e => { e.target.value = fmtPhone(e.target.value); });

$('#signupForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name = $('#suName').value.trim();
  const email = $('#suEmail').value.trim().toLowerCase();
  const pw = $('#suPw').value;
  const pw2 = $('#suPw2').value;
  const phone = fmtPhone($('#suPhone').value);
  const fail = (input, msg) => { $$('#signupForm input').forEach(i => i.classList.remove('invalid')); if (input) input.classList.add('invalid'); $('#signupError').textContent = msg; };

  if (!name) return fail($('#suName'), '이름을 입력해 주세요.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail($('#suEmail'), '이메일 형식을 확인해 주세요.');
  if (state.members.some(m => m.email === email)) return fail($('#suEmail'), '이미 가입된 이메일이에요.');
  if (pw.length < 8) return fail($('#suPw'), '비밀번호는 8자 이상이어야 해요.');
  if (pw !== pw2) return fail($('#suPw2'), '비밀번호가 서로 달라요.');
  if (digits(phone).length < 10) return fail($('#suPhone'), '휴대폰 번호를 확인해 주세요.');
  if (!$('#suAgree').checked) return fail(null, '필수 약관에 동의해 주세요.');

  const now = Date.now();
  const member = {
    id: 'M' + now,
    name, email, phone,
    password: await hashPassword(pw),
    points: SETTINGS.signupPoint,
    totalPurchase: 0,
    pointHistory: [{ date: now, amount: SETTINGS.signupPoint, reason: '회원가입 축하 포인트' }],
    joinedAt: now
  };
  state.members.push(member);
  saveMembers();
  loginAs(member);
  e.target.reset();
  toast(`${name}님 환영해요! ${pt(SETTINGS.signupPoint)}가 지급됐어요`);
});

$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('#loginEmail').value.trim().toLowerCase();
  const member = state.members.find(m => m.email === email);
  if (!member || member.password !== await hashPassword($('#loginPw').value)) {
    $('#loginError').textContent = '이메일 또는 비밀번호가 맞지 않아요.';
    return;
  }
  loginAs(member);
  e.target.reset();
  toast(`${member.name}님, 반가워요`);
});

function loginAs(member) {
  state.sessionId = member.id;
  store.set(KEYS.session, member.id);
  closeLayer($('#authModal'));
  refresh();
  if (afterLogin) { const next = afterLogin; afterLogin = null; next(); }
}

function logout() {
  state.sessionId = null;
  store.set(KEYS.session, null);
  closeAll();
  refresh();
  toast('로그아웃했어요');
}

/* =========================================================
   8. 주문서 · 체험 결제 (실제 결제 없이 주문 내역만 저장)
   ========================================================= */
function openCheckout() {
  if (!state.cart.length) { toast('장바구니가 비어 있어요'); return; }
  const member = currentMember();
  if (!member) {
    toast('주문은 로그인 후 할 수 있어요');
    afterLogin = openCheckout;
    openAuth('login');
    return;
  }
  const grade = gradeOf(member);
  const subtotal = cartSubtotal();
  const shipping = shippingOf(subtotal);
  const last = member.lastAddress || {};

  $('#checkoutBody').innerHTML = `
    <form id="checkoutForm" novalidate>
      <div class="checkout-grid">
        <div>
          <div class="box">
            <h4>배송지</h4>
            <div class="row">
              <div class="field"><label for="rcvName">받는 분 *</label><input id="rcvName" value="${esc(last.name || member.name)}"></div>
              <div class="field"><label for="rcvPhone">연락처 *</label><input id="rcvPhone" inputmode="numeric" value="${esc(last.phone || member.phone)}"></div>
            </div>
            <div class="field"><label for="rcvAddr">주소 *</label><input id="rcvAddr" placeholder="도로명 주소" value="${esc(last.address || '')}"></div>
            <div class="field"><label for="rcvAddr2">상세 주소 *</label><input id="rcvAddr2" placeholder="동 · 호수" value="${esc(last.detail || '')}"></div>
            <div class="field"><label for="rcvMemo">배송 메모</label>
              <select id="rcvMemo"><option value="">선택 안 함</option><option>문 앞에 놓아주세요</option><option>경비실에 맡겨주세요</option><option>배송 전 연락 부탁드려요</option></select></div>
          </div>
          <div class="box">
            <h4>포인트 사용 <span class="muted">(보유 ${pt(member.points)})</span></h4>
            <div class="row">
              <div class="field"><label for="usePoint" class="sr-only">사용할 포인트</label><input id="usePoint" inputmode="numeric" placeholder="0"></div>
              <button class="btn btn-line" type="button" id="useAllPoint">전액 사용</button>
            </div>
            <p class="muted">${pt(SETTINGS.minPointUse)} 이상부터 사용할 수 있어요.</p>
          </div>
          <div class="box">
            <h4>결제 수단 <span class="muted">(체험 결제 — 실제로 돈이 나가지 않아요)</span></h4>
            <div class="pays">
              <label><input type="radio" name="pay" value="카드" checked><span>신용카드</span></label>
              <label><input type="radio" name="pay" value="간편결제"><span>간편결제</span></label>
              <label><input type="radio" name="pay" value="무통장입금"><span>무통장입금</span></label>
            </div>
          </div>
        </div>
        <div>
          <div class="box">
            <h4>주문 상품</h4>
            ${state.cart.map(i => { const p = productById(i.productId); return `<div class="mini"><img src="${p.image}" alt="" width="48" height="48"><div class="grow">${esc(p.name)}<div class="muted">${i.qty}개</div></div><b>${won(p.price * i.qty)}</b></div>`; }).join('')}
            <div style="border-top:1px solid var(--line);margin:10px 0 4px"></div>
            <div class="sum"><span>상품 합계</span><span>${won(subtotal)}</span></div>
            <div class="sum"><span>배송비</span><span>${shipping ? won(shipping) : '무료'}</span></div>
            <div class="sum"><span>포인트 사용</span><span class="minus" id="sumPoint">-0원</span></div>
            <div class="sum total"><span>최종 결제 금액</span><b id="sumTotal">${won(subtotal + shipping)}</b></div>
            <p class="earn" id="sumEarn"></p>
            <label class="check"><input type="checkbox" id="agreeOrder"> <span>주문 내용을 확인했어요. (체험 결제)</span></label>
            <p class="error" id="checkoutError"></p>
            <button class="btn btn-point btn-block" type="submit" id="payBtn">체험 결제하기</button>
          </div>
        </div>
      </div>
    </form>`;

  let usedPoint = 0;
  const recalc = () => {
    let want = Number(digits($('#usePoint').value));
    want = Math.min(want, member.points, subtotal);           // 상품 합계까지만 사용
    usedPoint = want >= SETTINGS.minPointUse ? want : 0;
    const total = subtotal + shipping - usedPoint;
    $('#sumPoint').textContent = '-' + won(usedPoint);
    $('#sumTotal').textContent = won(total);
    $('#payBtn').textContent = `${won(total)} 체험 결제하기`;
    $('#sumEarn').textContent = `${grade.name} 등급 ${Math.round(grade.rate * 100)}% 적립 예정 ${pt(Math.floor((subtotal - usedPoint) * grade.rate))}`;
  };
  $('#usePoint').addEventListener('input', e => { const d = digits(e.target.value); e.target.value = d ? Number(d).toLocaleString('ko-KR') : ''; recalc(); });
  $('#usePoint').addEventListener('change', e => {
    if (Number(digits(e.target.value)) > 0 && usedPoint === 0) toast(`포인트는 ${pt(SETTINGS.minPointUse)} 이상부터 쓸 수 있어요`);
    e.target.value = usedPoint ? usedPoint.toLocaleString('ko-KR') : '';
  });
  $('#useAllPoint').onclick = () => { $('#usePoint').value = Math.min(member.points, subtotal).toLocaleString('ko-KR'); recalc(); };
  $('#rcvPhone').addEventListener('input', e => { e.target.value = fmtPhone(e.target.value); });
  $('#checkoutForm').addEventListener('submit', e => { e.preventDefault(); placeOrder(usedPoint); });
  recalc();
  openLayer($('#checkoutModal'));
}

function placeOrder(usedPoint) {
  const member = currentMember();
  const fields = [['#rcvName', '받는 분'], ['#rcvPhone', '연락처'], ['#rcvAddr', '주소'], ['#rcvAddr2', '상세 주소']];
  $$('#checkoutForm input').forEach(i => i.classList.remove('invalid'));
  for (const [sel, label] of fields) {
    if (!$(sel).value.trim()) { $(sel).classList.add('invalid'); $(sel).focus(); $('#checkoutError').textContent = `${label}을(를) 입력해 주세요.`; return; }
  }
  if (digits($('#rcvPhone').value).length < 10) { $('#rcvPhone').classList.add('invalid'); $('#checkoutError').textContent = '연락처를 확인해 주세요.'; return; }
  if (!$('#agreeOrder').checked) { $('#checkoutError').textContent = '주문 확인에 체크해 주세요.'; return; }
  for (const i of state.cart) {
    const p = productById(i.productId);
    if (i.qty > stockOf(p)) { $('#checkoutError').textContent = `${p.name} 재고가 부족해요.`; return; }
  }

  const gradeBefore = gradeOf(member);
  const subtotal = cartSubtotal();
  const shipping = shippingOf(subtotal);
  const total = subtotal + shipping - usedPoint;
  const earned = Math.floor((subtotal - usedPoint) * gradeBefore.rate);
  const now = new Date();
  const order = {
    id: `CB${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${String(now.getTime()).slice(-6)}`,
    memberId: member.id,
    items: state.cart.map(i => { const p = productById(i.productId); return { productId: p.id, name: p.name, price: p.price, qty: i.qty }; }),
    subtotal, shipping, usedPoint, total,
    earnedPoint: earned,
    gradeName: gradeBefore.name,
    receiver: { name: $('#rcvName').value.trim(), phone: fmtPhone($('#rcvPhone').value), address: $('#rcvAddr').value.trim(), detail: $('#rcvAddr2').value.trim(), memo: $('#rcvMemo').value },
    payMethod: document.querySelector('input[name="pay"]:checked').value,
    status: '주문완료(체험결제)',
    orderedAt: now.getTime()
  };

  // 재고 차감
  order.items.forEach(i => { state.stock[i.productId] = stockOf(productById(i.productId)) - i.qty; });
  // 포인트 · 누적 구매금액 · 최근 배송지
  if (usedPoint) { member.points -= usedPoint; member.pointHistory.unshift({ date: order.orderedAt, amount: -usedPoint, reason: `주문 사용 (${order.id})` }); }
  if (earned) { member.points += earned; member.pointHistory.unshift({ date: order.orderedAt, amount: earned, reason: `${gradeBefore.name} ${Math.round(gradeBefore.rate * 100)}% 적립 (${order.id})` }); }
  member.totalPurchase += total;
  member.lastAddress = { name: order.receiver.name, phone: order.receiver.phone, address: order.receiver.address, detail: order.receiver.detail };

  state.orders.unshift(order);
  state.cart = [];
  saveOrders(); saveStock(); saveMembers(); saveCart();
  closeLayer($('#checkoutModal'));
  showDone(order, gradeBefore, gradeOf(member));
  refresh();
}

function showDone(order, before, after) {
  const member = currentMember();
  $('#doneBody').innerHTML = `
    <div class="done">
      <div class="icon">✓</div>
      <h4>주문이 완료됐어요</h4>
      <p class="muted">체험 결제라 실제로 결제되지 않았어요.</p>
      <p class="order-no">주문번호 ${order.id}</p>
    </div>
    <div class="box">
      <div class="sum"><span>결제 금액</span><b>${won(order.total)}</b></div>
      ${order.usedPoint ? `<div class="sum"><span>사용 포인트</span><span class="minus">-${pt(order.usedPoint)}</span></div>` : ''}
      <div class="sum"><span>적립 포인트</span><span>+${pt(order.earnedPoint)}</span></div>
      <div class="sum"><span>보유 포인트</span><span>${pt(member.points)}</span></div>
      ${after.id !== before.id ? `<p class="earn">축하해요! ${before.name} → <b>${after.name}</b> 등급으로 올랐어요</p>` : ''}
    </div>
    <div class="row" style="flex-direction:row">
      <button class="btn btn-line" type="button" data-close>쇼핑 계속하기</button>
      <button class="btn btn-point" type="button" id="toMyOrders">주문 내역 보기</button>
    </div>`;
  $('#toMyOrders').onclick = () => { closeLayer($('#doneModal')); openMyPage(); };
  openLayer($('#doneModal'));
}

/* =========================================================
   9. 마이페이지 — 회원 정보 · 등급 · 포인트 · 주문 내역
   ========================================================= */
function openMyPage() {
  const member = currentMember();
  if (!member) { openAuth('login'); return; }
  const grade = gradeOf(member);
  const next = nextGradeOf(member);
  const orders = state.orders.filter(o => o.memberId === member.id);
  const progress = next ? Math.min(100, ((member.totalPurchase - grade.minAmount) / (next.minAmount - grade.minAmount)) * 100) : 100;

  $('#myBody').innerHTML = `
    <div class="me-card">
      <div class="grow">
        <p><b style="font-size:18px">${esc(member.name)}님</b> · ${grade.name} 등급 (${Math.round(grade.rate * 100)}% 적립)</p>
        <p class="muted">${esc(member.email)} · ${esc(member.phone)}</p>
        <div class="progress"><i style="width:${progress}%"></i></div>
        <p class="muted">${next ? `${next.name} 등급까지 ${won(next.minAmount - member.totalPurchase)} 남았어요` : '최고 등급이에요'} · 누적 구매 ${won(member.totalPurchase)}</p>
      </div>
      <div class="points"><span class="muted">보유 포인트</span><b>${pt(member.points)}</b></div>
    </div>

    <h4 class="subtitle">주문 내역 (${orders.length})</h4>
    ${orders.length ? orders.map(o => `
      <div class="order-card">
        <div class="top"><div><b>${o.id}</b><p class="muted">${fmtDate(o.orderedAt)} · ${o.payMethod} · ${won(o.total)}</p></div><span class="status">${o.status}</span></div>
        ${o.items.map(i => { const p = productById(i.productId); return `<div class="mini"><img src="${p ? p.image : ''}" alt="" width="48" height="48"><div class="grow">${esc(i.name)}<div class="muted">${won(i.price)} × ${i.qty}개</div></div></div>`; }).join('')}
        <p class="muted" style="margin-top:6px">배송지: ${esc(o.receiver.address)} ${esc(o.receiver.detail)} · 적립 +${pt(o.earnedPoint)}</p>
      </div>`).join('') : '<p class="notice">아직 주문 내역이 없어요.</p>'}

    <h4 class="subtitle">포인트 내역</h4>
    <ul class="log">${member.pointHistory.map(h => `<li><span>${esc(h.reason)}<br><span class="muted">${fmtDate(h.date)}</span></span><span class="${h.amount > 0 ? 'plus' : 'use'}">${h.amount > 0 ? '+' : ''}${pt(h.amount)}</span></li>`).join('')}</ul>

    <div style="text-align:right;margin-top:16px"><button class="btn btn-sm btn-line" type="button" id="logoutBtn">로그아웃</button></div>`;
  $('#logoutBtn').onclick = logout;
  openLayer($('#myModal'));
}

/* =========================================================
   10. 회원 등급 안내 · 처음 실행
   ========================================================= */
function renderGrades() {
  const member = currentMember();
  const mine = member ? gradeOf(member).id : null;
  $('#gradeCards').innerHTML = GRADES.map((g, i) => `
    <div class="grade-card ${g.id === mine ? 'mine' : ''}">
      <p class="lv">LEVEL ${i + 1}</p>
      <h4>${g.name}</h4>
      <p class="rate">${Math.round(g.rate * 100)}%</p>
      <p>${g.minAmount ? `누적 구매 ${won(g.minAmount)} 이상` : '가입 즉시'}</p>
      ${g.id === mine ? '<span class="me">내 등급</span>' : ''}
    </div>`).join('');
}

function refresh() {
  renderUserArea();
  renderCartCount();
  renderNav();
  renderProducts();
  renderGrades();
}

renderCategoryCards();
refresh();
