/* 0) 로그인 보호 */
if (sessionStorage.getItem("loggedIn") !== "1") location.href = "Baekilmong.html";

/* 관리자 / 삭제권한 설정 */
const IS_MOD =
  sessionStorage.getItem("retroAccess") === "1" ||
  (sessionStorage.getItem("userId") === "seojay" &&
   sessionStorage.getItem("userPw") === "1234");


/* 1) Supabase 설정 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL = "https://kvyqgxtmerggkpbcynbr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2eXFneHRtZXJnZ2twYmN5bmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5Nzk1MDEsImV4cCI6MjA3NzU1NTUwMX0.SQRbiORMhEsSsstEDXpTju1HPQ_ykA4TsxVhdnCq7eo";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ✅ [추가] 익명 로그인 보장 + UID/작성자명 확보
let { data: { session } } = await supabase.auth.getSession();
if (!session) {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error("anonymous sign-in error:", error);
    alert("익명 로그인 실패: " + error.message);
  } else {
    session = data.session;
  }
}
const { data: userData } = await supabase.auth.getUser();
const MY_UID = userData?.user?.id || null;


// ✅ 전역 잠금: true면 전체 읽기 전용 + 삭제/이동/리사이즈 비활성
const LOCK_ALL = true;



// 작성자 표시는 브라우저 세션에서 가져오고, 없으면 '익명'
const AUTHOR = sessionStorage.getItem("userName")
            || sessionStorage.getItem("userId")
            || "익명";


// notes.html 안 로그아웃/UID교체 버튼에 바인딩
document.getElementById("signOutBtn")?.addEventListener("click", async () => {
  try { await supabase.auth.signOut(); } catch(e){ console.warn(e); }

  ["loggedIn","userId","userName","userPw","userBaseName","retroAccess"]
    .forEach(k => sessionStorage.removeItem(k));

  const { error } = await supabase.auth.signInAnonymously();
  if (error) { alert("익명 재로그인 실패: " + error.message); return; }

  location.reload(); // MY_UID 갱신
});
           
/* 2) 기본 DOM */
const board = document.getElementById("board");
const addBtn = document.getElementById("addNoteBtn");
const palette = document.getElementById("palette");
if (!board)  alert("#board 엘리먼트가 없음 (notes.html 확인)");
if (!addBtn) alert("#addNoteBtn 엘리먼트가 없음 (notes.html 확인)");
if (!palette) console.warn("palette가 없어서 색 선택 비활성");

let currentColor = "paper-yellow";
palette?.querySelectorAll("button").forEach((b, i) => {
  b.classList.toggle("is-active", i === 0);
  b.addEventListener("click", () => {
    palette.querySelectorAll("button").forEach(x => x.classList.remove("is-active"));
    b.classList.add("is-active");
    currentColor = b.dataset.color;
  });
});

/* 3) CRUD */
// 기존 createNote() 전체를 아래로 교체
// ⬇⬇ 기존 createNote() 전체를 이걸로 교체
async function createNote(x = 40, y = 40, color = currentColor, initialText = "") {
  // if (LOCK_ALL) { alert("지금은 메모 생성이 잠겨 있습니다."); return null; }

  const { data, error } = await supabase
    .from("notes")
    .insert({
      x, y, color,
      text: String(initialText).slice(0, 2000),
      width: 400,
      height: 140,
      author: AUTHOR
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    alert("메모 생성 실패: " + (error.message || error));
    return null;
  }
  return data?.id;
}

function spawnDraftNote(x, y, color = currentColor) {
  const el = document.createElement("div");
  el.className = `note ${color} is-draft`;
  el.style.transform = `translate(${x}px, ${y}px)`;
  el.style.width = "400px";

  el.innerHTML = `
   <button class="del" style="display:none"></button>
   <textarea placeholder="여기에 메모를 적어주세요 (Enter 저장, Esc 취소)"></textarea>
   <div class="meta">작성 중… Enter 저장 · Esc 취소</div>
  `;

  board.appendChild(el);

  const ta = el.querySelector("textarea");
  ta.focus();

  // 자동 높이
  const grow = () => {
    ta.style.height = "auto";
    ta.style.height = Math.max(96, ta.scrollHeight) + "px";
    el.style.height = (ta.scrollHeight + 44) + "px"; // 44는 패딩/메타 여유
  };
  ta.addEventListener("input", grow);
  grow();
  
  // 저장(Enter) / 취소(Esc)
  const commit = async () => {
    const text = (ta.value || "").trim();
    if (!text) { cancel(); return; }
  
    // INSERT
    const id = await createNote(x, y, color, text);
    if (id) {
      // 저장 후 전체 새로 렌더 → 권한 로직에 따라 잠금/편집 여부 자동 반영
      const fresh = await loadNotes();
      renderAll(fresh);
      el.remove();
    } else {
      // 실패 시 드래프트 유지
      ta.focus();
    }
  };

  const cancel = () => {
    el.remove();
  };

  ta.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  });

  // 포커스 나가면 자동 저장(원치 않으면 제거)
  ta.addEventListener("blur", commit);
}

async function loadNotes() {
  const { data, error } = await supabase
    .from("notes")
    .select("id,x,y,width,height,color,text,author,created_at,user_id") // ✅ user_id 포함
    .order("created_at", { ascending: true });
  if (error) console.error(error);
  return data || [];
}

async function patchNote(id, patch) {
  const { error } = await supabase.from("notes").update(patch).eq("id", id);
  if (error) console.warn(error);
}

async function removeNote(id) {
  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", Number(id));        // 🔧 bigint 컬럼에 숫자로 비교
  if (error) {
    alert("삭제 실패: " + error.message);
    return false;
  }
  return true;
}


/* 5) 렌더 + 리사이즈 + 드래그 */
(async function initNotes() {
  // 0) 연결 핑
  const ping = await supabase
    .from("notes")
    .select("id", { count: "exact", head: true });
  if (ping.error) {
    console.error("Supabase 연결 오류:", ping.error);
    alert("Supabase 연결 오류: " + ping.error.message);
  } else {
    console.log("✅ Supabase 연결 OK, rows:", ping.count ?? "(unknown)");
  }

  // 1) 첫 로드
  const first = await loadNotes();
  console.log("초기 note 개수:", first.length);
  renderAll(first);

  // 2) Realtime 수신(켜져 있으면 실시간 반영)
  supabase
    .channel("notes-rt")
    .on("postgres_changes",
      { event: "*", schema: "public", table: "notes" },
      async (payload) => {
        console.log("RT 이벤트:", payload.eventType, payload.new?.id ?? payload.old?.id);
        const fresh = await loadNotes();
        renderAll(fresh);
      }
    )
    .subscribe((status) => console.log("RT 상태:", status));
})();

function renderAll(notes) {
  const map = new Map(notes.map(n => [String(n.id), n]));
  const existing = new Map([...board.querySelectorAll(".note")].map(n => [n.dataset.id, n]));

  // 1) 사라진 노트 제거
  existing.forEach((el, id) => { if (!map.has(id)) el.remove(); });

  // 2) 노트 렌더/업데이트
  map.forEach(n => {
    const id = String(n.id);
    let el = existing.get(id);

    // 새로 만들기
    if (!el) {
      el = document.createElement("div");
      el.className = `note ${n.color}`;
      el.dataset.id = id;
      el.innerHTML = `
        <button class="del">삭제</button>
        <textarea placeholder="여기에 메모를 적어주세요" readonly></textarea>
        <div class="meta">익명 · 실시간 저장</div>
      `;
      board.appendChild(el);
    }

    const ta  = el.querySelector("textarea");
    const del = el.querySelector(".del");

    // 공통 값 반영
    el.className = `note ${n.color}`;
    ta.value = n.text || "";
    el.style.transform = `translate(${n.x}px, ${n.y}px)`;
    el.style.width = (n.width || 240) + "px";
    el.style.removeProperty("height");
    autoGrowNote(el, n, { save: false });

    // 권한 계산
    const isMine        = !!MY_UID && n.user_id === MY_UID;
    const canType       = IS_MOD || isMine;     // 텍스트 편집 권한
    const canMoveResize = true;                 // ✅ 모두 이동/리사이즈 가능
    const canDelete     = IS_MOD || isMine;     // 본인 또는 관리자만 삭제

    console.log({
      id: n.id,
      note_user: n.user_id,
      my_uid: MY_UID,
      isMine,
      IS_MOD,
      canType,
      canDelete
    });

    // 삭제 버튼 가시성 + 안전장치
    if (del) {
      del.style.display = canDelete ? "inline-block" : "none";
      if (!del.dataset.bound) {
        del.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (!canDelete) return;
          if (!confirm("이 메모를 삭제할까요?")) return;
          const ok = await removeNote(id);
          if (ok) el.remove();
        });
        del.dataset.bound = "1";
      }
    }

    // 텍스트 편집 권한
    if (canType) {
     ta.readOnly = false;
     ta.style.pointerEvents = "auto";
     if (!ta.dataset.bound) {
       ta.addEventListener("input", debounce(async () => {
         await patchNote(n.id, { text: ta.value });
         autoGrowNote(el, n, { save: true });
        }, 180));
        ta.dataset.bound = "1";
      }
    } else {
     ta.readOnly = true;
     ta.style.pointerEvents = "none";
    }

    // 이동/리사이즈 권한 (모두 허용)
    if (canMoveResize && !el.dataset.dragBound) {
     enableDrag(el, n);
     el.dataset.dragBound = "1";
    }
    if (canMoveResize && !el.dataset.resizeBound) {
     enableResize(el, n);
     el.dataset.resizeBound = "1";
    }
  });

}


/* 6) 리사이즈 */
 function enableResize(el, note) {
   // 1) 가로 폭 변경 감지 → width 저장 (세로는 autoGrowNote가 처리)
   const ro = new ResizeObserver(
     debounce(async () => {
       const rect = el.getBoundingClientRect();
       await patchNote(note.id, { width: Math.round(rect.width) });
     }, 200)
   );
   ro.observe(el);
 }

/* 7) 드래그 */
function enableDrag(el, note) {
  let sx = 0, sy = 0, nx = Number(note.x) || 0, ny = Number(note.y) || 0, dragging = false;

  const onDown = (e) => {
    if (e.target.tagName === "TEXTAREA" || e.target.classList.contains("del")) return;
    dragging = true;
    el.style.cursor = "grabbing";
    const cx = (e.touches ? e.touches[0].clientX : e.clientX);
    const cy = (e.touches ? e.touches[0].clientY : e.clientY);
    sx = cx - nx; sy = cy - ny;
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp, { once: true });
    window.addEventListener("touchend", onUp, { once: true });
  };

  const onMove = (e) => {
    if (!dragging) return;
    const cx = (e.touches ? e.touches[0].clientX : e.clientX);
    const cy = (e.touches ? e.touches[0].clientY : e.clientY);
    nx = Math.max(0, Math.min(board.clientWidth - el.offsetWidth, cx - sx));
    ny = Math.max(0, Math.min(board.clientHeight - el.offsetHeight, cy - sy));
    el.style.transform = `translate(${nx}px, ${ny}px)`;
    e.preventDefault?.();
  };

  const onUp = async () => {
    dragging = false;
    el.style.cursor = "grab";
    await patchNote(note.id, { x: nx, y: ny });
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("touchmove", onMove);
  };

  el.addEventListener("mousedown", onDown);
  el.addEventListener("touchstart", onDown, { passive: true });
}

/* 8) 유틸 */
function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}


// ── 4:44 감지 + 테스트 파라미터 지원 ───────────────────────────
// 사용법:
//   1) 항상 강제:        notes.html?omen=on
//   2) 특정 시각 강제:   notes.html?omen=17:50   (시:분, 로컬시간 기준)
//   3) 기본:             새벽 04:44에만 발동
const OMEN_PARAM = new URLSearchParams(location.search).get("omen");

function isOmenTimeNow() {
  const now = new Date();

  // 테스트 모드: ?omen=on  → 무조건 발동
  if (OMEN_PARAM === "on") return true;

  // 테스트 모드: ?omen=HH:MM
  if (OMEN_PARAM && /^\d{1,2}:\d{2}$/.test(OMEN_PARAM)) {
    const [hh, mm] = OMEN_PARAM.split(":").map(Number);
    return now.getHours() === hh && now.getMinutes() === mm;
  }

  // 기본 모드: 04:44
  return now.getHours() === 4 && now.getMinutes() === 44;
}

// 실행
function shouldTriggerOmenOncePerSession() {
  return isOmenTimeNow();
}



// ── 오버레이 실행 (사진 → 지지직 → 검은 화면 + ㅋㅋㅋ 타이핑) ──
async function runOmenOverlay() {
  const overlay = document.getElementById("omenOverlay");
  const imgEl   = document.getElementById("omenImg");
  const textEl  = document.getElementById("omenText");
  if (!overlay || !imgEl || !textEl) return;

  // 오버레이 표시
  overlay.classList.add("show");
  overlay.setAttribute("aria-hidden","false");

  // 이미지가 로드되지 않았더라도 애니메이션은 진행되게 fallback
  if (!imgEl.complete) {
    try {
      await new Promise((res) => {
        imgEl.addEventListener("load", res, { once:true });
        imgEl.addEventListener("error", res, { once:true }); // 에러라도 계속 진행
      });
    } catch(_) {}
  }

  // 0.9초 후부터 검은 화면 위에 빨간 "ㅋㅋ..." 타이핑 시작
  const startTypingAt = 900;
  const stepMs = 16;           // 타이핑 속도
  const fillMs = 2600;         // 화면 가득 채우는 총 시간
  const chunk  = "ㅋㅋ";       // 한 번에 추가할 문자열

  setTimeout(() => {
    textEl.classList.add("show");
    textEl.textContent = "";
    let acc = "";
    const targetSteps = Math.ceil(fillMs / stepMs);
    let i = 0;
    const timer = setInterval(() => {
      acc += chunk;
      textEl.textContent = acc;
      i++;
      if (i >= targetSteps) clearInterval(timer);
    }, stepMs);
  }, startTypingAt);

  // 총 3.6초 후 오버레이 닫고 원래 화면으로 복귀
  await new Promise(r => setTimeout(r, 3600));
  overlay.classList.remove("show");
  overlay.setAttribute("aria-hidden","true");
}



// ── 텍스트 길이에 맞추어 노트 높이 자동 조절 ─────────────────────────────
function autoGrowNote(el, note, { save = true } = {}) {
  const ta = el.querySelector("textarea");
  if (!ta) return;

  // textarea 세로 자동
  ta.style.height = "auto";
  const textH = Math.max(96, ta.scrollHeight);
  ta.style.height = textH + "px";

  // 카드 높이 = 텍스트 + 여분(패딩/메타)
  const EXTRA = 44;
  const cardH = textH + EXTRA;

  el.style.height = cardH + "px";

  if (save && note?.id) {
    patchNote(note.id, { height: cardH });
  }
}


// 더블클릭 생성
board?.addEventListener("dblclick", async (e) => {
  if (shouldTriggerOmenOncePerSession()) {
    await runOmenOverlay();
    return; // 생성 취소
  }
  const rect = board.getBoundingClientRect();
  const x = e.clientX - rect.left - 120;
  const y = e.clientY - rect.top  - 20;
  spawnDraftNote(x, y, currentColor);
});

// 버튼 생성
addBtn?.addEventListener("click", async () => {
    if (shouldTriggerOmenOncePerSession()) {
    await runOmenOverlay();
    return; // 생성 취소
  }
  const x = Math.max(0, board.clientWidth  / 2 - 120);
  const y = Math.max(0, board.clientHeight / 2 - 60);
  spawnDraftNote(x, y, currentColor);   // ✅ 같은 UX
});

window.supabase = supabase;
