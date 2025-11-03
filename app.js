/**********************
 * 로그인 / 회원가입 (로그인 페이지 한정)
 **********************/
const loginBtn = document.getElementById("loginBtn");
const openSignupBtn = document.getElementById("openSignupBtn");
const signupPop = document.getElementById("signupPop");
const closeSignup = document.getElementById("closeSignup");
const signupForm = document.getElementById("signupForm");
const signupCancel = document.getElementById("signupCancel");


function openSignup() {
  if (!signupPop) return;
  signupPop.classList.add("show");
  signupPop.setAttribute("aria-hidden", "false");
}
function closeSignupPop() {
  if (!signupPop) return;
  signupPop.classList.remove("show");
  signupPop.setAttribute("aria-hidden", "true");
}

openSignupBtn && openSignupBtn.addEventListener("click", openSignup);
closeSignup && closeSignup.addEventListener("click", closeSignupPop);
signupCancel && signupCancel.addEventListener("click", closeSignupPop);

// 공통 유틸
function idToEmail(id) {
  return `${id}@acct.baekilmong.com`.toLowerCase();
}


// ✅ 회원가입 제출
signupForm &&
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("suName").value.trim();
    const id = document.getElementById("suId").value.trim();
    const pw = document.getElementById("suPw").value;

    const msg = document.getElementById("signupMsg");

    if (!name || !id || !pw) {
      msg.textContent = "모든 항목을 입력해주세요.";
      return;
    }
    if (id.length < 3) {
      msg.textContent = "아이디는 3자 이상이어야 합니다.";
      return;
    }
    if (pw.length < 4) {
      msg.textContent = "비밀번호는 4자 이상이어야 합니다.";
      return;
    }

    const users = loadUsers();
    if (users[id]) {
      msg.textContent = "이미 사용 중인 아이디입니다.";
      return;
    }

    users[id] = { name, pw };
    saveUsers(users);

    msg.textContent = "가입 완료! 이제 로그인할 수 있어요.";
    // UX: 아이디 자동 채워주기
    const username = document.getElementById("username");
    username && (username.value = id);
    closeSignupPop();
  });

// ✅ 로그인
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    const id = document.getElementById("username").value.trim();
    const pw = document.getElementById("password").value;
    const err = document.getElementById("loginError");

    // 1) 관리자(특수 계정) 먼저 체크
    if (id === "yongj1111" && pw === "Dydajflgodks!111") {
      sessionStorage.setItem("loggedIn", "1");
      sessionStorage.setItem("userId", id);
      sessionStorage.setItem("userName", "이자헌"); // 메인에서 사용
      sessionStorage.setItem("userPw", pw); 
      sessionStorage.setItem("userBaseName", "이자헌"); 
      sessionStorage.setItem("retroAccess", "0"); 
      window.location.href = "main.html";
      return;
    }

    // 2) 일반 가입자 체크 (localStorage DB)
    const users = loadUsers();
    const user = users[id];
    if (user && user.pw === pw) {
      sessionStorage.setItem("loggedIn", "1");
      sessionStorage.setItem("userId", id);
      sessionStorage.setItem("userName", user.name);
      sessionStorage.setItem("userPw", pw); 
      sessionStorage.setItem("userBaseName", user.name); 
      sessionStorage.removeItem("retroAccess");
      window.location.href = "main.html";
    } else {
      err.textContent = "아이디 또는 비밀번호가 일치하지 않습니다.";
    }
  });
}

// ⛔️ supabase import/생성 제거!
// 가벼운 로그아웃만 유지
document.getElementById("signOutBtn")?.addEventListener("click", () => {
  ["loggedIn","userId","userName","userPw","userBaseName","retroAccess"]
    .forEach(k => sessionStorage.removeItem(k));

  // 장바구니/가입DB는 건드리지 않음
  // sessionStorage.removeItem("cart");      // 필요시만

  location.href = "Baekilmong.html";
});

/**********************
 * 프로필 정보 세팅
 * - 기본 규칙:
 *   • 회원가입 계정: 직급=사원 / 부서=현장탐사팀 / 소속=A~R 랜덤
 *   • 특수 이름/등급 매핑은 아래 테이블 우선 적용
 **********************/
(function hydrateProfileDetails() {
  const nameEl = document.getElementById("profileName");
  const rankEl = document.getElementById("profileRank");
  const deptEl = document.getElementById("profileDept");
  const teamEl = document.getElementById("profileTeam");
  if (!nameEl || !rankEl || !deptEl || !teamEl) return;

  // 세션에서 이름 읽기
  const rawShownName = sessionStorage.getItem("userName") || "게스트";
  const baseName =
    sessionStorage.getItem("userBaseName") ||
    rawShownName.replace(/\s*과장님$/, ""); // 혹시 모를 과장님 접미사 제거

  // A~R 조 목록
  const TEAMS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    .split("")
    .slice(0, 18) // A~R (0~17)
    .map(c => `${c}조`);

  // 기본값(회원가입 계정용)
  let rank = "사원";
  let dept = "현장탐사팀";
  let team = TEAMS[Math.floor(Math.random() * TEAMS.length)];

  // ===== 고정 매핑 (우선 적용) =====
  // 전부 '현장탐사팀' 기준, 별도 부서 명시된 건 override
  const FIXED = {
    // 팀 배정 + 직급(괄호) 기입돼 있는 명단
    "백석주": { rank: "과장", dept: "현장탐사팀", team: "A조" },
    "진나솔": { rank: "대리", dept: "현장탐사팀", team: "A조" },
    "이석종": { rank: "대리", dept: "현장탐사팀", team: "A조" },
    "이성해": { rank: "대리", dept: "현장탐사팀", team: "B조" },
    "강도준": { rank: "대리", dept: "현장탐사팀", team: "C조" },

    "김솔음": { rank: "사원", dept: "현장탐사팀", team: "D조" },
    "이자헌": { rank: "과장", dept: "현장탐사팀", team: "D조" },
    "은하제": { rank: "대리", dept: "현장탐사팀", team: "D조" },

    // F조: 등급 미표기 → 기본 '사원' 처리
    "백사헌": { rank: "사원", dept: "현장탐사팀", team: "F조" },
    "장허운": { rank: "사원", dept: "현장탐사팀", team: "F조" },

    // I/J/R 조
    "강이학": { rank: "사원", dept: "현장탐사팀", team: "I조" },
    "이재진": { rank: "사원", dept: "현장탐사팀", team: "J조" },
    "고영은": { rank: "사원", dept: "현장탐사팀", team: "R조" },

    // 별도 부서/직급 (임원/연구/행정 등)
    "J3":     { rank: "경비반장", dept: "경비팀",   team: "■■■" },
    "곽제강": { rank: "과장",     dept: "연구팀",   team: "연구 1팀" },
    "이병진": { rank: "과장",     dept: "행정지원팀", team: "매뉴얼 심사" },
    "호유원": { rank: "이사",     dept: "임원진",   team: "-" },
    "청달래": { rank: "상무이사",  dept: "임원진",   team: "-" },

    // 특수 표기 요구
    "이강헌": { rank: "대?리",   dept: "현장탐사팀", team: "■조" },
  };

  // 기본 적용
  if (FIXED[baseName]) {
    rank = FIXED[baseName].rank;
    dept = FIXED[baseName].dept;
    team = FIXED[baseName].team;
  }

  // 이름 표기
  nameEl.textContent = rawShownName;

  // ===== 특수 케이스: 박민성 =====
  // - 직급: <i><s>주임</s></i>
  // - 부서: <i><s>현장탐사팀</s></i> <span class="alt-note">보안팀</span>
  // - 소속: <i><s>D조</s></i>
  if (baseName === "박민성") {
    rankEl.innerHTML = `<span class="strike-italic">주임</span>`;
    deptEl.innerHTML = `<span class="strike-italic">현장탐사팀</span><span class="alt-note"> 보안팀</span>`;
    teamEl.innerHTML = `<span class="strike-italic">D조</span>`;
    return;
  }

  // 일반 출력(기본 또는 고정 매핑 적용 결과)
  rankEl.textContent = rank;
  deptEl.textContent = dept;
  teamEl.textContent = team;
})();


/**********************
 * 공통: 유저 DB 관리
 **********************/
const DB_KEY = "bkm_users"; // { [id]: { name, pw } }

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY)) || {};
  } catch {
    return {};
  }
}
function saveUsers(users) {
  localStorage.setItem(DB_KEY, JSON.stringify(users));
}


/**********************
 * 메인 페이지: 상품/배너 + 정렬 + 카테고리 필터
 **********************/
const productRoot = document.getElementById("productRoot");
if (productRoot) {
  // (선택) 로그인 보호
  if (sessionStorage.getItem("loggedIn") !== "1") {
    // window.location.href = "index.html";
  }

  // 1) 상품 데이터 (tags 추가: new | inhouse | best | long 등)
  let products = [
    { id:1, name:"BESPOKE 스팀 9600 로봇청소기", brand:"삼성전자",     price:140, img:"assets/로봇청소기.png", tags:["new"] },
    { id:2, name:"소원권",   brand:"백일몽주식회사",     price:500000, img:"assets/소원권.png", tags:["inhouse"] },
    { id:3, name:"그린티 씨드 세럼", brand:"Innisfree", price:10,  img:"assets/그린티세럼.jpg", tags:["new"] },
    { id:4, name:"벽걸이 CD 플레이어",    brand:"MUJI",      price:44,  img:"assets/CDP.jpg", tags:["new","best"] },
    { id:5, name:'탈모약',       brand:"백일몽주식회사", price:100, img:"assets/탈모약.png", tags:["inhouse"] },
    { id:6, name:"AirPods Pro 3",        brand:"Apple",    price:75, img:"assets/에어팟프로.jpg", tags:["new"] },
    { id:7, name:"각막 재생 물약",        brand:"백일몽주식회사",    price:1280, img:"assets/각막재생물약.png", tags:["new","inhouse"] },
    { id:8, name:"사막방울뱀_독",        brand:"백일몽주식회사",    price:170000, img:"assets/사막방울뱀.png", tags:["inhouse"] },
    { id:9, name:"재생 물약",        brand:"백일몽주식회사",    price:10000, img:"assets/재생물약.png", tags:["inhouse"] },
    { id:10, name:"문지기 물약",        brand:"백일몽주식회사",    price:3000, img:"assets/문지기물약.png", tags:["inhouse"] },
    { id:11, name:"폭발 물약(D)",        brand:"백일몽주식회사",    price:35, img:"assets/폭탄물약.png", tags:["inhouse"] },
    { id:12, name:"폭로 물약",        brand:"백일몽주식회사",    price:40, img:"assets/폭로물약.png", tags:["inhouse", "new"] },
    { id:13, name:"스마일 스티커",        brand:"백일몽주식회사",    price:44, img:"assets/스마일스티커.png", tags:["inhouse", "new"] },
    { id:14, name:"다이슨 에어랩",        brand:"Dyson Korea",    price:80, img:"assets/다이슨.jpg", tags:["new"] },
    { id:15, name:"LG 전자레인지",        brand:"LG 전자",    price:100, img:"assets/전자레인지.jpg", tags:["new","best"] },
    { id:16, name:"뷰티레스트 시트러스 | 슈퍼싱글",        brand:"SIMMONS",    price:400, img:"assets/시몬스.jpg", tags:["new"] },
    { id:17, name:"Fit Max 4도어 냉장고",        brand:"LG 전자",    price:500, img:"assets/냉장고.png", tags:["new"] },
    { id:18, name:"전자동 커피머신",        brand:"제니퍼룸",    price:100, img:"assets/커피머신.png", tags:["best"] },
    { id:19, name:"어벤투스 100ml",        brand:"CREED",    price:100, img:"assets/크리드.png", tags:["new","best"] },
    { id:20, name:"퓨리케어360도 공기청정기",        brand:"LG 전자",    price:90, img:"assets/공기청정기.jpg", tags:["new","best"] }
  ];

  // 2) 상태: 필터 + 정렬 (초기 필터는 'new'로, 원하는 값으로 바꿔도 됨)
  let currentFilter = "new";   // "new" | "inhouse" | "best" | "long" | "all"
  let currentSort   = "name";  // "name" | "high" | "low"

  // 3) 필터 함수
  function getFiltered(list, filterKey){
    if (!filterKey || filterKey === "all") return list;
    return list.filter(p => Array.isArray(p.tags) && p.tags.includes(filterKey));
  }

  // 4) 정렬 함수 (이름 가나다/영문 + 숫자 자연 정렬)
  const koCollator = new Intl.Collator(['ko','en'], { numeric:true, sensitivity:'base' });
  function getSorted(list, sortKey) {
    const arr = [...list];
    if (sortKey === "name") return arr.sort((a,b) => koCollator.compare(a.name, b.name));
    if (sortKey === "high") return arr.sort((a,b) => b.price - a.price);
    if (sortKey === "low")  return arr.sort((a,b) => a.price - b.price);
    return arr;
  }

  // 5) 렌더 함수 (필터 → 정렬 → 렌더)
  function render() {
    const filtered = getFiltered(products, currentFilter);
    const sorted   = getSorted(filtered, currentSort);

    productRoot.innerHTML = `
      <section class="grid" aria-label="상품 목록">
        ${sorted.map(p => `
          <article class="product">
            <img class="product__img" src="${p.img}" alt='${p.brand} ${p.name}' />
            <div class="product__body">
              <div class="brand">${p.brand}</div>
              <div class="name">${p.name}</div>
              <div class="price"><strong>${p.price.toLocaleString()}p</strong></div>
              <button class="btn add-to-cart" data-id="${p.id}">장바구니 담기</button>
            </div>
          </article>
        `).join("")}
      </section>
    `;

    // 정렬 버튼 active 토글
    document.querySelectorAll(".sort-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.sort === currentSort);
    });
    // 필터 pill active 토글
    document.querySelectorAll(".benefit-line .pill").forEach(pill => {
      pill.classList.toggle("active", pill.dataset.filter === currentFilter);
    });
  }


/**********************
 * 포인트 등록 화면 토글 (업데이트)
 **********************/
// 요소 캐싱
const pointsLink    = document.querySelector('.mall-gnb a:nth-child(1)'); // 포인트 등록
const logoLink      = document.querySelector('.logo');                    // 빨간 로고
const pointsSection = document.getElementById('pointsSection');

const heroSection   = document.querySelector('.hero');                    // 배너
const productWrap   = document.getElementById('productRoot')?.closest('.container'); // 상품 그리드 감싸는 컨테이너
const benefitLine   = document.querySelector('.benefit-line');            // "신규등록/자사제품/득가/장기" 필터들
const sortBar       = document.querySelector('.sort-bar');                // 정렬 버튼들

function enterPointsMode(){
  // 메인 UI 숨김
  heroSection?.classList.add('hide');
  productWrap?.classList.add('hide');
  benefitLine?.classList.add('hide');
  sortBar?.classList.add('hide');

  // 포인트 등록 노출
  pointsSection?.classList.remove('hide');

  // 스크롤 맨 위로
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function exitPointsMode(){
  // 메인 UI 표시
  heroSection?.classList.remove('hide');
  productWrap?.classList.remove('hide');
  benefitLine?.classList.remove('hide');
  sortBar?.classList.remove('hide');

  // 포인트 등록 숨김 + 폼 리셋
  pointsSection?.classList.add('hide');
  try {
    document.getElementById('pointsForm')?.reset();
    document.querySelectorAll('.grade-btn').forEach(b=>b.classList.remove('active'));
    document.getElementById('gradeInput') && (document.getElementById('gradeInput').value = '');
    document.getElementById('pointsMsg') && (document.getElementById('pointsMsg').textContent = '');
  } catch(e){}
}

// 네비의 "포인트 등록" 클릭 → 등록 화면으로
pointsLink?.addEventListener('click', (e)=>{
  e.preventDefault();
  enterPointsMode();
});

// 빨간 로고 클릭 → 메인으로 복귀
logoLink?.addEventListener('click', (e)=>{
  e.preventDefault();
  exitPointsMode();
});

/**********************
 * 포인트 등록 폼 로직
 **********************/
const gradeBtns   = document.querySelectorAll('.grade-btn');
const gradeInput  = document.getElementById('gradeInput');
const pointsForm  = document.getElementById('pointsForm');
const submitBtn   = document.getElementById('pointsSubmit');
const msgEl       = document.getElementById('pointsMsg');
const fileInput   = document.getElementById('regFile');

// 등급 선택
gradeBtns.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    gradeBtns.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    gradeInput.value = btn.dataset.grade;
  });
});

// 파일 확장자 검증(accept로 1차, 코드로 2차)
fileInput?.addEventListener('change', ()=>{
  const file = fileInput.files?.[0];
  if (file && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    msgEl.textContent = 'PDF 파일만 첨부할 수 있습니다.';
    fileInput.value = '';
    setTimeout(()=> msgEl.textContent = '', 2000);
  }
});

// 제출
pointsForm?.addEventListener('submit', (e)=>{
  e.preventDefault();
  msgEl.textContent = '';

  const name = document.getElementById('regName').value.trim();
  const grade = gradeInput.value;
  const file = fileInput.files?.[0];

  if (!grade) { msgEl.textContent = '등급을 선택하세요.'; return; }
  if (!name)  { msgEl.textContent = '이름을 입력하세요.'; return; }
  if (!file)  { msgEl.textContent = 'PDF 파일을 첨부하세요.'; return; }

  // 1초 로딩 표시
  submitBtn.disabled = true;
  const oldText = submitBtn.textContent;
  submitBtn.textContent = '등록 중...';

  setTimeout(()=>{
    // 완료 처리
    msgEl.style.color = '#9ae6b4';
    msgEl.textContent = '제출되었습니다.';

  handleSubmitSuccess(grade, file?.name || '');
  
    // 폼 초기화
    gradeBtns.forEach(b=>b.classList.remove('active'));
    gradeInput.value = '';
    pointsForm.reset();

    // 버튼 원상복구
    submitBtn.disabled = false;
    submitBtn.textContent = oldText;

    // 1.5초 후 메시지 지움
    setTimeout(()=> msgEl.textContent = '', 1500);
  }, 1000);
});

/* ===== 게시판 데이터/렌더 ===== */
const PAGE_SIZE = 10;
const boardListEl = document.querySelector('.points-list');
const pagerEl     = document.getElementById('pointsPager');

let boardItems = [];   // { title, status } 배열
let currentPage = 1;

// 기존 목록 상태(진행/승인/거절) 부여
(function seedFromDOM(){
  if (!boardListEl) return;

  // 초기 상태 순서 (아래부터 위로 표시될 순서이므로 reverse 주의!)
  const fixedStatuses = [
    '진행',  // 맨 위
    '승인',
    '승인',
    '승인',
    '승인',
    '승인',
    '승인',
    '거절',
    '승인',
    '승인'   // 맨 아래
  ]

  const titles = [...boardListEl.querySelectorAll('li')].map(li=>{
    const t = (li.textContent || '').trim();
    return t || '무제';
  });

  boardItems = titles.map((t, i)=>({
    title: t,
    status: fixedStatuses[i] || '진행'   // 개수 초과 시 기본값 '진행'
  }));

  renderBoard(1);
})();


function renderBoard(page = 1){
  if (!boardListEl) return;

  const totalPages = Math.max(1, Math.ceil(boardItems.length / PAGE_SIZE));
  currentPage = Math.min(Math.max(1, page), totalPages);

  const start = (currentPage-1) * PAGE_SIZE;
  const slice = boardItems.slice(start, start + PAGE_SIZE);

  const statusClass = s => ({
    '진행':'status--progress',
    '심사중':'status--pending',
    '승인':'status--approved',
    '거절':'status--rejected'
  }[s] || 'status--progress');

  boardListEl.innerHTML = slice.map(item => `
    <li>
      <span class="title">${item.title}</span>
      <span class="status ${statusClass(item.status)}">${item.status}</span>
    </li>
  `).join('');

  renderPager(totalPages);
}

function renderPager(totalPages){
  if (!pagerEl) return;

  const windowSize = 5;
  let start = Math.max(1, currentPage - Math.floor(windowSize/2));
  let end   = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  let html = `
    <button class="page-btn" data-nav="prev" ${currentPage===1?'disabled':''}>‹</button>
  `;
  for (let p=start; p<=end; p++){
    html += `<button class="page-btn ${p===currentPage?'is-active':''}" data-page="${p}">${p}</button>`;
  }
  html += `
    <button class="page-btn" data-nav="next" ${currentPage===totalPages?'disabled':''}>›</button>
  `;

  pagerEl.innerHTML = html;

  pagerEl.querySelectorAll('.page-btn').forEach(btn=>{
    const p = Number(btn.dataset.page);
    const nav = btn.dataset.nav;
    btn.addEventListener('click', ()=>{
      if (nav === 'prev') renderBoard(currentPage-1);
      else if (nav === 'next') renderBoard(currentPage+1);
      else if (p) renderBoard(p);
    });
  });
}

/* ===== 등록 완료 시 리스트에 추가 ===== */
function addNewBoardItem(grade, fileName){
  if (!boardListEl) return;
  const clean = (fileName||'무제').replace(/\.pdf$/i,'');
  const title = `[${grade}] ${clean}`;
  const status = (grade === 'S') ? '심사중' : '진행';

  boardItems.unshift({ title, status }); // 최신글 맨 위
  renderBoard(1); // 1페이지로 갱신
}

// 제출 성공 지점에서 호출해줄 헬퍼
function handleSubmitSuccess(grade, fileName){
  addNewBoardItem(grade, fileName);
}



/**********************
 * 지급 포인트 팝업
 **********************/
const openPointTable  = document.getElementById('openPointTable');
const pointTablePop   = document.getElementById('pointTablePop');
const closePointTable = document.getElementById('closePointTable');

openPointTable?.addEventListener('click', ()=> pointTablePop.classList.add('show'));
closePointTable?.addEventListener('click', ()=> pointTablePop.classList.remove('show'));
pointTablePop?.querySelector('.points-pop__backdrop')
  ?.addEventListener('click', ()=> pointTablePop.classList.remove('show'));

/* 보조: 감추기에 쓰는 .hide */
document.head.insertAdjacentHTML('beforeend', `
  <style>.hide{display:none !important}</style>
`);





/**********************
 * 장바구니 로직
 **********************/
let cart = JSON.parse(sessionStorage.getItem("cart") || "[]");

const cartBtn   = document.getElementById("cartBtn");
const cartPopup = document.getElementById("cartPopup");
const cartList  = document.getElementById("cartList");
const cartTotal = document.getElementById("cartTotal");
const closeCart = document.getElementById("closeCart");

// 장바구니 열고 닫기
cartBtn?.addEventListener("click", () => {
  cartPopup.classList.toggle("show");
});
closeCart?.addEventListener("click", () => {
  cartPopup.classList.remove("show");
});

// 상품 추가
function addToCart(product) {
  const existing = cart.find((item) => item.id === product.id);
  if (existing) existing.qty++;
  else cart.push({ ...product, qty: 1 });
  renderCart();
}

// 상품 삭제
function removeFromCart(id) {
  const index = cart.findIndex(item => item.id === id);
  if (index !== -1) {
    // 수량이 1보다 크면 감소, 아니면 삭제
    if (cart[index].qty > 1) {
      cart[index].qty--;
    } else {
      cart.splice(index, 1);
    }
  }
  renderCart();
}


// 장바구니 렌더링
function renderCart() {
  cartList.innerHTML = cart.map(item => `
    <li>
      <span>${item.name} × ${item.qty}</span>
      <span>
        ${(item.price * item.qty).toLocaleString()}p
        <button class="remove-btn" data-id="${item.id}">✕</button>
      </span>
    </li>
  `).join("");

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  cartTotal.textContent = total.toLocaleString();

  // 저장 (새로고침 후 유지)
  sessionStorage.setItem("cart", JSON.stringify(cart));

  // ✅ 삭제 버튼 이벤트 연결
  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      removeFromCart(id);
    });
  });
}


// ✅ 이벤트 위임: 상품 영역에서 클릭 잡아내기 (render 유무와 무관)
const productRoot = document.getElementById("productRoot");
productRoot?.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-to-cart");
  if (!btn) return;

  const id = Number(btn.dataset.id);
  const product = (typeof products !== "undefined") 
    ? products.find(p => p.id === id)
    : null;

  if (product) {
    addToCart(product);
    // 간단알림
    alert(`${product.name}이(가) 장바구니에 담겼습니다.`);
  }
});

// 페이지 로드시 장바구니 복원 렌더
renderCart();


/**********************
 * 내 계정 팝업 로직
 **********************/
const profileBtn = document.getElementById("profileBtn");
const profilePopup = document.getElementById("profilePopup");
const closeProfile = document.getElementById("closeProfile");

profileBtn?.addEventListener("click", () => {
  // 장바구니 팝업과 동시에 열리지 않게
  cartPopup?.classList.remove("show");
  profilePopup.classList.toggle("show");
});

closeProfile?.addEventListener("click", () => {
  profilePopup.classList.remove("show");
});



  // 6) 정렬 버튼 이벤트 (한 번만 바인딩)
  document.querySelectorAll(".sort-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      currentSort = btn.dataset.sort;  // name | high | low
      render();
    });
  });

  // 7) 필터 pill 이벤트 (한 번만 바인딩)
// 팝업 열기/닫기
const longPopup = document.getElementById("longPopup");
function openLongPopup(){
  if(!longPopup) return;
  longPopup.classList.add("is-open");
  longPopup.setAttribute("aria-hidden","false");
}
function closeLongPopup(){
  if(!longPopup) return;
  longPopup.classList.remove("is-open");
  longPopup.setAttribute("aria-hidden","true");
}
longPopup?.querySelectorAll("[data-close]").forEach(el=>{
  el.addEventListener("click", closeLongPopup);
});
document.addEventListener("keydown", (e)=>{
  if(e.key === "Escape") closeLongPopup();
});

// pill 클릭
document.querySelectorAll(".benefit-line .pill").forEach(pill => {
  pill.addEventListener("click", () => {
    const key = pill.dataset.filter;   // new | inhouse | best | long
    if (key === "long") {              // 장기 → 팝업만
      openLongPopup();
      return;
    }
    currentFilter = key;               // 나머지는 필터 후 렌더
    render();
  });
});


  // 8) 첫 렌더
  render();

  // 7) 환영 토스트 (한 번만)
/**********************
 * 메인 페이지(복지몰) 진입 시 사용자명/토스트 세팅
 * - 특수 계정: "환영합니다. 이자헌 과장님"
 * - 일반 회원: "환영합니다. <등록이름> 사원님"
 *   (프로필 팝업의 이름은 접미사 없이 '등록이름' 그대로 표시)
 **********************/
(function hydrateProfileAndWelcome() {
  const profileNameEl = document.getElementById("profileName");
  const welcomeToast = document.getElementById("welcomeToast");

  // 로그인 페이지 등에서는 해당 요소가 없으므로 바로 종료
  if (!profileNameEl && !welcomeToast) return;

  // 세션에서 값 읽기
  const rawName = sessionStorage.getItem("userName"); // 일반 회원: "홍길동", 특수 계정: "이자헌 과장님"
  const hasRetroAccess = sessionStorage.getItem("retroAccess") === "0"; // 특수 계정 여부

  // 프로필 팝업의 이름은 '등록 이름' 그대로 (특수 계정은 기존처럼 "이자헌 과장님"이 들어감)
  if (profileNameEl) {
    profileNameEl.textContent = rawName || "게스트";
  }

  // 토스트 문구 구성
  if (welcomeToast) {
    const baseName = rawName || "게스트";

    // ===== 고정 매핑 (직급/부서/소속 정보) =====
    const FIXED = {
     "백석주": { rank: "과장" },
     "진나솔": { rank: "대리" },
     "이석종": { rank: "대리" },
     "이성해": { rank: "대리" },
     "강도준": { rank: "대리" },
     "김솔음": { rank: "사원" },
     "이자헌": { rank: "과장" },
     "은하제": { rank: "대리" },
     "백사헌": { rank: "사원" },
     "장허운": { rank: "사원" },
     "강이학": { rank: "사원" },
     "이재진": { rank: "사원" },
     "고영은": { rank: "사원" },
     "J3":     { rank: "경비반장" },
     "곽제강": { rank: "과장" },
     "이병진": { rank: "과장" },
     "호유원": { rank: "이사" },
     "청달래": { rank: "상무이사" },
     "이강헌": { rank: "대?리" },
     "박민성": { rank: "■■" },
    };

    // ===== 직급 접미사 자동 처리 =====
    let finalRank = "사원"; // 기본값
    if (FIXED[baseName]) {
      finalRank = FIXED[baseName].rank;
    }

    // 직급 뒤에 '님' 붙이기 (단, 박민성 같은 특이 케이스는 예외)
    let postfix = "님";
    if (baseName === "박민성") postfix = ""; // 주임은 '님' 없음

    let toastName;
    if (hasRetroAccess) {
      // ✅ 특수 계정 (retroAccess=1)
      toastName = "이자헌 과장님";
    } else {
      toastName = `${baseName} ${finalRank}${postfix}`;
    }

    // 출력
    welcomeToast.textContent = `환영합니다. ${toastName}`;
    welcomeToast.classList.add("show");
    welcomeToast.setAttribute("aria-hidden", "false");

    // 3초 후 자연스럽게 사라지게
    setTimeout(() => {
      welcomeToast.classList.remove("show");
      welcomeToast.setAttribute("aria-hidden", "true");
    }, 3000);
  }
})();



  // 8) 배너 자동 전환
  const track = document.getElementById("heroTrack");
  const dots = document.querySelectorAll(".hero .dot");
  const firstClone = track.children[0]?.cloneNode(true);
  if (firstClone) track.appendChild(firstClone);
  let idx = 0, timer;
  function go(i) {
    idx = i;
    track.scrollTo({ left: track.clientWidth * idx, behavior: "smooth" });

    // 마지막 복제 슬라이드 → 원래 1번으로 부드럽게 리셋
    if (idx === dots.length) {
      setTimeout(() => {
        track.scrollTo({ left: 0, behavior: "auto" });
        idx = 0;
        dots.forEach((d, k) => d.classList.toggle("is-active", k === idx));
      }, 700);
    } else {
      dots.forEach((d, k) => d.classList.toggle("is-active", k === idx));
    }
  }

  function autoplay() {
    clearInterval(timer);
    timer = setInterval(() => go(idx + 1), 5000); // 5초마다 전환
  }

  dots.forEach((d, i) => {
    d.addEventListener("click", () => {
      go(i);
      autoplay();
    });
  });

  window.addEventListener("load", () => {
    go(0);
    autoplay();
  });
  window.addEventListener("resize", () => go(idx));
}

/**********************
 * 뒤로가기 화살표 버튼 5회 → 우측 GIF + 말풍선 노출
 * ✅ 관리자 계정(retroAccess=0)일 때만 활성화
 **********************/
const backBtn = document.getElementById("backBtn");
const edgeAd = document.getElementById("edgeAd");
const edgeBubble = document.getElementById("edgeBubble");
const warpOverlay = document.getElementById("warpOverlay");

// ✅ 관리자 여부 확인
const hasRetroAccess = sessionStorage.getItem("retroAccess") === "0";

// ✅ 일반 회원이면 전 기능 비활성화 (보이지 않게)
if (!hasRetroAccess) {
  // 혹시 남아있는 흔적이 있으면 즉시 숨김
  edgeAd?.classList.remove("show");
  edgeBubble?.classList.remove("show");
} else {
  /************* 관리자 전용 블록 시작 *************/
  function openEdgeAd() {
    edgeAd?.classList.add("show");
    edgeBubble?.classList.add("show");
  }
  function closeEdgeAd() {
    edgeAd?.classList.remove("show");
    edgeBubble?.classList.remove("show");
  }

  // 클릭하면 닫히게(원치 않으면 제거)
  edgeAd && edgeAd.addEventListener("click", closeEdgeAd);

  // ESC로 닫기
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeEdgeAd();
  });

  // ✅ 말풍선 클릭(또는 Enter/Space 키) 시 새 페이지로 이동
  function goRetro() {
    const target = "a97-l108_i105-e101_n110.s115_h104-o111.p112.html";

    // 오버레이가 없다면 바로 이동 (폴백)
    if (!warpOverlay) {
      window.location.href = target;
      return;
    }

    // 🔄 상태 초기화 후 강제 리플로우로 애니메이션 보장
    warpOverlay.classList.remove("show", "break");
    void warpOverlay.offsetWidth;

    // 1️⃣ 오버레이 표시
    warpOverlay.classList.add("show");

    // 2️⃣ 살짝 기다렸다가 깨짐 시작
    setTimeout(() => {
      warpOverlay.classList.add("break");
    }, 400); // 0.4초 후 깨짐 시작

    // 3️⃣ 애니메이션이 끝난 다음 페이지 이동
    setTimeout(() => {
      window.location.href = target;
    }, 2200); // 전체 효과 약 2.2초
  }

  if (edgeBubble) {
    edgeBubble.addEventListener("click", goRetro);
    edgeBubble.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") goRetro();
    });
  }

  let backClicks = 0;
  let lastClickAt = 0;
  const REQUIRED_CLICKS = 5;
  const CLICK_WINDOW = 1500;

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      const now = Date.now();
      backClicks = (now - lastClickAt <= CLICK_WINDOW) ? backClicks + 1 : 1;
      lastClickAt = now;
      if (backClicks >= REQUIRED_CLICKS) {
        backClicks = 0;
        openEdgeAd(); // ✅ GIF와 말풍선 동시 오픈
      }
    });
  }
  /************* 관리자 전용 블록 끝 *************/
}




/*************************
 * 등괴록을담 → 전환 + 외부이동
 *************************/
// 링크 잡기 (네비의 두 번째 <a>)
const weirdLink = document.querySelector('.mall-gnb a:nth-child(2)');
const redir = document.getElementById('redirOverlay');
const errStack = document.getElementById('errStack');
const redirOK = document.getElementById('redirOK');
const redirNo = document.getElementById('redirNo');
const redirWelcome = document.getElementById('redirWelcome');
const redirURL = "https://namu.wiki/w/%EA%B4%B4%EB%8B%B4%EC%97%90%20%EB%96%A8%EC%96%B4%EC%A0%B8%EB%8F%84%20%EC%B6%9C%EA%B7%BC%EC%9D%84%20%ED%95%B4%EC%95%BC%20%ED%95%98%EB%8A%94%EA%B5%AC%EB%82%98/%EC%84%A4%EC%A0%95/%EA%B4%B4%EB%8B%B4/%EC%96%B4%EB%91%A0";

function spawnErrorWindows() {
  const N = 100; // 총 에러창 개수
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const avoidRadius = 100;

  for (let i = 0; i < N; i++) {
    const delay = Math.random() * 850; // ✅ 0~0.6초 사이 랜덤 지연
    setTimeout(() => {
      let x, y, tries = 0;
      do {
        x = 40 + Math.random() * (window.innerWidth - 360);
        y = 40 + Math.random() * (window.innerHeight - 240);
        tries++;
      } while (Math.hypot(x - centerX, y - centerY) < avoidRadius && tries < 10);

      const w = document.createElement('div');
      w.className = 'err-win';
      w.style.left = `${x}px`;
      w.style.top  = `${y}px`;
      w.style.zIndex = 100 + i;
      w.innerHTML = `
        <div class="err-title">ERROR
          <button class="x" style="margin-left:auto;background:#ff3b30;color:#fff;border:2px solid #06101a;cursor:pointer;width:24px;height:22px;font-weight:800">✕</button>
        </div>
        <div class="err-body-sm">ERROR.</div>
        <button class="err-ok">OK</button>
      `;
      w.querySelector('.err-ok').addEventListener('click', ()=> w.remove());
      w.querySelector('.x').addEventListener('click', ()=> w.remove());
      errStack.appendChild(w);
    }, delay);
  }
}



function startRedirSequence(e){
  e.preventDefault();
  if (!redir) return;
  redir.classList.add('show');

  // 빨간 스캔이 다 차오르는 타이밍에 팝업들 띄우기
  setTimeout(() => {
    spawnErrorWindows();
    redir.classList.add('ready');
  }, 950);
}

// 예. 버튼 → 에러들 제거 → 환영 → 2초 후 이동
function proceedRedir() {
  // 모든 에러창 제거
  errStack.innerHTML = '';
  const center = document.querySelector('.err-modal');
  if (center) center.style.display = 'none';

  const userName = '이름';
  const welcomeInner = redirWelcome?.querySelector('.welcome-inner');

  // 초기 텍스트 구성
  if (welcomeInner) {
    welcomeInner.innerHTML = `
      <div>어서오세요</div>
      <div id="typingLine"></div>
    `;
  }

  // 화면 표시
  redirWelcome.classList.add('show');

  // 타이핑 효과 실행
  const typingLine = document.getElementById('typingLine');
  const text = `${userName}님!`; // 타이핑할 문자열
  let i = 0;

  function typeChar() {
    if (i < text.length) {
      const current = text[i] === userName[0] ? `<em>${text[i]}</em>` : text[i];
      typingLine.innerHTML += current;
      i++;
      setTimeout(typeChar, 120); // 타자 속도
    }
  }

  // “어서오세요”는 먼저 뜨고, 0.5초 뒤 타이핑 시작
  setTimeout(typeChar, 500);

  // 2.5초 뒤 페이지 이동
  setTimeout(() => { window.location.href = redirURL; }, 2500);
}



// ■■■ 버튼 클릭 → 혼돈 시퀀스 실행
redirNo?.addEventListener('click', startChaosSequence);

// ====== ■■■ 버튼(혼돈) 시퀀스 추가 ======
const chaosLines = [
  "세상은■■야!우리는그속에적힌■■하나에불과하구나!",
  "제발보지마세요저를보지마세요저를■■마세요",
  "저는가치 있어요저는흥미로워아니??나는없잖아?이게뭐야이게?뭐야?이름님?",
  "-** 아아아아!아아아아!아아아아!",
  "해탈은 없다 열반은 없다",
  "이는 세간의 진리로다 영원한 해방이 다가온다 말법의 종말에 이르거든 고통과 실성과 광기를 바치고 사리를 뱉고 영생하리 그것이 도의 실상이며 무상의 가치를 지닌 법이니라",
  "-** 죽음을 준비할 것",
  "숙 여 라",
  "거 대 한 의 지 가",
  "■■ ■■ ■■ ■■ ■■■■ ■■■ ■■■■",
  "이해할 수 없음에 감사하라! 이해하는 순간 돌이킬 수 없다!",
  "말 하 라",
  "오 심연의 속삭임이여. 깊다, 너무 깊다참매혹적이구나우리는도망쳐야한다그러나도망칠수없으니까???????참으로매혹적이고불경하니까????경배해야해??????",
  "지산의 복 받으세요!",
  "아아아아아!",
  "산산백지산복주시옵게대리자야".repeat(4),
  "-** 이름님 초대 연구",
  "-** 백일몽이 알아냈다 들이닥쳤다 또 속임수였다 이름님을 빼앗기기 전에 빼돌려 가장 사람이 많을 장소에 숨겼다",
  "ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ",
  "아니야아니야아니야아니야아니야아니야아니야아니야아니야아니야아니야",
  "-** 도 망 가",
  "받들어라",
  "■■ ■■ ■■?■■ ■■■ ■■ ■■ ■ ■?■■■ ■■■",
  ".-.  ..-  -.     .-  .--  .-  -.--     .-  -.  -..     -.  .  ...-  .  .-.     -.-.  ---  --  .     -...  .-  -.-.  -.-",
  ".--.  .-..  .  .-  ...  .     ...  .-  ...-  .     --  .  --..--     .--.  .-..  .  .-  ...  .     ...  .-  ...-  .     --  .  --..--     --.  .  -     --  .     ---  ..-  -     ---  ..-.     ....  .  .-.  .",
  "살려주세요".repeat(8),
  "나를 ■?록하지마"
];

function startChaosSequence(e) {
  e?.preventDefault?.();
  const redir = document.getElementById('redirOverlay');
  const errStack = document.getElementById('errStack');
  if (!redir || !errStack) return;

  const center = document.querySelector('#redirOverlay .err-modal');
  if (center){
    center.classList.add('fadeout');       // 애니메이션으로 사라짐
    setTimeout(()=> center.remove(), 280); // 완전히 제거
  }

  // 1) 기존 팝업 정리
  errStack.innerHTML = '';

  // 2) 리본(배너) 와다다
  const bannerCount = 20;
  for (let i=0;i<bannerCount;i++){
    setTimeout(()=> {
      const b = document.createElement('div');
      b.className = 'chaos-banner';
      b.style.top = (10 + Math.random()*80) + 'vh';
      b.style.height = (32 + Math.random()*36) + 'px';
      b.textContent = chaosLines[Math.floor(Math.random()*chaosLines.length)].replace(/^-?\*\*/,'').trim();
      const dur = 700 + Math.floor(Math.random()*700);
      b.style.animation = `banner-stretch ${dur}ms cubic-bezier(.2,.9,.2,1) forwards`;
      b.style.zIndex = 40000 + i;
      document.body.appendChild(b);
      setTimeout(()=> b.remove(), dur + 250);
    }, i * 90 + Math.random()*120);
  }

  // 3) 화면 가득 텍스트
  setTimeout(()=> {
    const cols = 18;
    for (let i=0;i<cols*6;i++){
      const t = document.createElement('div');
      t.className = 'chaos-text';
      let txt = chaosLines[Math.floor(Math.random()*chaosLines.length)];
      let italic = false;
      if (txt.startsWith('-**')) { italic = true; txt = txt.replace(/^-?\*\*\s*/,''); }
      const bigWords = ["숙 여 라","말 하 라","아아아아아!","거 대 한 의 지 가"];
      let isBig = bigWords.some(w => txt.includes(w) || txt.trim() === w);

      t.textContent = txt;
      t.style.left = (Math.random()*80) + '%';
      t.style.top  = (Math.random()*90) + '%';
      t.style.fontSize = isBig ? (24 + Math.random()*64) + 'px' : (10 + Math.random()*28) + 'px';
      if (italic) t.classList.add('chaos-italic');
      if (isBig) t.classList.add('chaos-big');

      const delay = Math.random()*800;
      t.style.animation = `text-pop 400ms ease ${delay}ms forwards`;
      t.style.opacity = 0;
      t.style.zIndex = 40000 + (i % 100);
      document.body.appendChild(t);

      // 유지 후 점멸/사라짐
      setTimeout(()=> {
        t.style.transition = "opacity 900ms ease, transform 900ms ease";
        t.style.opacity = 0.06 + Math.random()*0.9;
      }, 4000 + Math.random()*2000);
      setTimeout(()=> { t.remove(); }, 4000 + Math.random()*2500);
    }
  }, 1100);

  // 4) 버튼 피드백(짧은 플래시)
  setTimeout(()=> {
    redir.classList.add('flash');
    setTimeout(()=> redir.classList.remove('flash'), 220);
  }, 100);

  // 5) 일정 시간 구경시킨 뒤 → 포스트 이펙트 실행
  setTimeout(()=>{
    playPostFxThenReturn();  // ← 여기서 CRT → 소용돌이 → 복귀
  }, 10000); // ✅ 10초 정도 감상 후 전환 (원하면 8000~12000 사이로 조절)
}


// 바인딩
// weirdLink?.addEventListener('click', startRedirSequence);
// 이스터에그: 4번 연속 클릭해야 전환
let eggClicks = 0;
let lastEggAt = 0;
const EGG_REQUIRED = 4;      // 필요 클릭 수
const EGG_WINDOW  = 1200;    // 각 클릭 사이 허용 간격(ms) — 필요하면 조절

function onWeirdLinkClick(e){
  e.preventDefault(); // 한 번 눌러도 이동하지 않게
  const now = Date.now();

  // 시간 간격 안에 들어오면 누적, 아니면 다시 1부터
  eggClicks = (now - lastEggAt <= EGG_WINDOW) ? eggClicks + 1 : 1;
  lastEggAt = now;

  // 4번째에서 발동
  if (eggClicks >= EGG_REQUIRED){
    eggClicks = 0;
    startRedirSequence(e);
  }
}

weirdLink?.addEventListener('click', onWeirdLinkClick);


redirOK?.addEventListener('click', proceedRedir);
redirNo?.addEventListener('click', startChaosSequence);


// 중앙 모달의 우측 상단 X 도 닫히지 않도록(연출상 유지) 막아두고 싶다면 주석 해제해서 무동작 처리
document.querySelector('.err-modal .x')?.addEventListener('click', (e)=> e.preventDefault());

/* ===== 포스트 이펙트(CRT → 소용돌이 → 복귀) ===== */
function playPostFxThenReturn(){
  // 기존 카오스 잔재 정리(검은 화면만 남기기)
  document.querySelectorAll('.chaos-text,.chaos-banner').forEach(el=>el.remove());

  // 오버레이 만들기(한 번만)
  let post = document.getElementById('postFx');
  if(!post){
    post = document.createElement('div');
    post.id = 'postFx';
    post.className = 'postfx';
    post.innerHTML = `<div class="crt"></div><div class="vortex"></div>`;
    document.body.appendChild(post);
  }

  // CRT 3초
  post.classList.add('show');

  // 3초 후 → 소용돌이 1.25초
  setTimeout(()=>{
    post.classList.add('vortex-on');

    // 소용돌이 끝나면 메인으로 복귀(오버레이/리디렉션 정리)
    setTimeout(()=>{
      const redir = document.getElementById('redirOverlay');
      if (redir){
        redir.classList.remove('show','ready');
        redir.style.display = 'none';   // ✅ 완전히 숨기기
        const errStack = document.getElementById('errStack');
        if (errStack) errStack.innerHTML = '';
      }


      // 포스트 이펙트 제거
      post.classList.remove('vortex-on','show');
      // 필요 시 DOM에서 완전히 제거하고 싶으면 아래 주석 해제
      // post.remove();

      // ★ 메인으로 "복귀"만 원하면 여기서 끝.
      // 만약 강제로 새로고침/이동 원하면 아래 중 택1:
      // window.location.reload();
      window.location.href = "main.html";

    }, 1250); // vortex 시간
  }, 3000);   // CRT 시간
}

document.getElementById("loginBtn").addEventListener("click", ()=>{
  const bgm = new Audio("music.mp3");
  bgm.loop = true;
  bgm.volume = 0.4;
  bgm.play();
});

