const DATA = window.VOCAB_DATA;
const WORDS = DATA.words;
const byId = new Map(WORDS.map((w) => [w.id, w]));
const KNOWN_KEY = "vocabKnown";
const THEME_KEY = "vocabTheme";
const CATS = ["전체", "⭐ 북마크", "단어·표현", "문장", "패러프레이징", "Part 5", "전치사", "혼동어", "LC"];

const state = {
  mode: "card",
  filter: "전체",
  index: 0,
  order: [],
  known: JSON.parse(localStorage.getItem(KNOWN_KEY) || "{}"),
  bookmarks: JSON.parse(localStorage.getItem("vocabBookmarks") || "{}"),
  quiz: null,
};

const els = {
  stat: document.getElementById("stat"),
  theme: document.getElementById("themeToggle"),
  chips: document.getElementById("chips"),
  modeTabs: document.getElementById("modeTabs"),
  cardView: document.getElementById("cardView"),
  quizView: document.getElementById("quizView"),
  flash: document.getElementById("flash"),
  cat: document.getElementById("cFront"),
  term: document.getElementById("term"),
  meaning: document.getElementById("meaning"),
  forms: document.getElementById("forms"),
  prev: document.getElementById("prev"),
  next: document.getElementById("next"),
  shuffle: document.getElementById("shuffle"),
  know: document.getElementById("know"),
  dontKnow: document.getElementById("dontKnow"),
  progress: document.getElementById("progress"),
  quizQ: document.getElementById("quizQ"),
  quizOpts: document.getElementById("quizOpts"),
  quizFb: document.getElementById("quizFb"),
  quizProg: document.getElementById("quizProg"),
  listView: document.getElementById("listView"),
};

function saveKnown() { localStorage.setItem(KNOWN_KEY, JSON.stringify(state.known)); }
function saveBookmarks() { localStorage.setItem("vocabBookmarks", JSON.stringify(state.bookmarks)); }
function isSentence(w) { return w.cat === "예문" || w.cat === "문장" || w.kind === "sentence"; }
function labelCat(w) { return isSentence(w) ? "문장" : w.cat; }
function filtered() {
  return WORDS.filter((w) => {
    if (state.filter === "전체") return true;
    if (state.filter === "⭐ 북마크") return !!state.bookmarks[w.id];
    if (state.filter === "단어·표현") return !isSentence(w) && w.cat !== "패러프레이징";
    if (state.filter === "문장") return isSentence(w);
    return w.cat === state.filter;
  });
}
function pool() {
  let p = filtered();
  if (state.mode === "review") p = p.filter((w) => !state.known[w.id]);
  return p;
}
function shuffleArr(a) {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; }
  return x;
}
function rebuildOrder(shuffle) {
  const ids = pool().map((w) => w.id);
  state.order = shuffle ? shuffleArr(ids) : ids;
  state.index = 0;
}

function updateStat() {
  const f = filtered();
  const known = f.filter((w) => state.known[w.id]).length;
  els.stat.textContent = `외움 ${known} / ${f.length}`;
}

function escapeHtml(s) { return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }

function renderChips() {
  els.chips.innerHTML = "";
  CATS.forEach((c) => {
    const b = document.createElement("button");
    b.textContent = c;
    if (c === state.filter) b.classList.add("active");
    b.addEventListener("click", () => { state.filter = c; rebuildOrder(false); render(); });
    els.chips.appendChild(b);
  });
}

function renderCard() {
  els.cardView.classList.remove("hidden");
  els.quizView.classList.add("hidden");
  els.listView.classList.add("hidden");
  els.flash.classList.remove("flipped");
  const ids = state.order;
  if (!ids.length) {
    els.term.textContent = state.mode === "review" ? "다 외웠어요! 🎉" : "단어가 없습니다.";
    els.cat.textContent = ""; els.meaning.textContent = ""; els.forms.textContent = "";
    els.progress.textContent = "0 / 0";
    return;
  }
  if (state.index >= ids.length) state.index = ids.length - 1;
  const w = byId.get(ids[state.index]);
  els.cat.textContent = labelCat(w) + (state.known[w.id] ? " · 외움" : "");
  els.term.textContent = w.term;
  els.meaning.textContent = w.meaning;
  els.forms.textContent = w.forms;
  els.progress.textContent = `${state.index + 1} / ${ids.length}`;
}

function mark(known) {
  const ids = state.order;
  if (!ids.length) return;
  const id = ids[state.index];
  if (known) state.known[id] = true; else delete state.known[id];
  saveKnown();
  if (state.index < ids.length - 1) state.index += 1;
  else if (state.mode === "review") { rebuildOrder(false); }
  render();
}
function move(d) {
  if (!state.order.length) return;
  state.index = Math.min(Math.max(state.index + d, 0), state.order.length - 1);
  render();
}

/* ---- quiz ---- */
function newQuiz() {
  const p = filtered();
  if (p.length < 4) { state.quiz = { done: true }; return; }
  const w = p[Math.floor(Math.random() * p.length)];
  const distract = shuffleArr(WORDS.filter((x) => x.id !== w.id)).slice(0, 3);
  const opts = shuffleArr([w, ...distract]);
  state.quiz = { w, opts, answered: false, score: state.quiz ? state.quiz.score : 0, total: state.quiz ? state.quiz.total : 0 };
}
function renderQuiz() {
  els.cardView.classList.add("hidden");
  els.listView.classList.add("hidden");
  els.quizView.classList.remove("hidden");
  const q = state.quiz;
  if (q && q.done) { els.quizQ.textContent = "퀴즈는 단어 4개 이상일 때 가능"; els.quizOpts.innerHTML = ""; els.quizFb.textContent = ""; els.quizProg.textContent = ""; return; }
  els.quizQ.textContent = q.w.meaning;
  els.quizFb.textContent = "";
  els.quizProg.textContent = `점수 ${q.score} / ${q.total}`;
  els.quizOpts.innerHTML = "";
  q.opts.forEach((o) => {
    const b = document.createElement("button");
    b.innerHTML = escapeHtml(o.term);
    b.addEventListener("click", () => pickOption(o, b));
    els.quizOpts.appendChild(b);
  });
}
function pickOption(o, btn) {
  const q = state.quiz;
  if (q.answered) return;
  q.answered = true; q.total += 1;
  const correct = o.id === q.w.id;
  if (correct) { q.score += 1; btn.classList.add("correct"); els.quizFb.textContent = "✅ 정답"; }
  else {
    btn.classList.add("wrong"); els.quizFb.textContent = `❌ 정답: ${q.w.term}`;
    [...els.quizOpts.children].forEach((b) => { if (b.textContent === q.w.term) b.classList.add("correct"); });
  }
  [...els.quizOpts.children].forEach((b) => (b.disabled = true));
  els.quizProg.textContent = `점수 ${q.score} / ${q.total}`;
  setTimeout(() => { newQuiz(); renderQuiz(); }, correct ? 700 : 1400);
}

function renderList() {
  els.cardView.classList.add("hidden");
  els.quizView.classList.add("hidden");
  els.listView.classList.remove("hidden");
  els.listView.classList.toggle("covered", !!state.listCovered);
  const items = filtered().filter((w) => w.cat !== "패러프레이징");
  if (!items.length) { els.listView.innerHTML = '<p class="progress">단어가 없습니다.</p>'; return; }
  const rows = items.map((w) =>
    '<div class="liRow' + (state.known[w.id] ? " known" : "") + (state.bookmarks[w.id] ? " bookmarked" : "") + '">' +
      '<span class="liTerm">' + escapeHtml(w.term) + '</span>' +
      '<span class="liMean">' + escapeHtml(w.meaning) + '</span>' +
      '<button class="bmBtn" data-id="' + w.id + '">' + (state.bookmarks[w.id] ? "⭐" : "☆") + '</button>' +
    '</div>'
  ).join("");
  const btn = '<button class="coverBtn" id="coverBtn">' + (state.listCovered ? "👁 뜻 열기" : "🙈 뜻 가리기") + '</button>';
  const hint = items.length + '개 · 단어→뜻' + (state.listCovered ? ' (탭하면 보기)' : '');
  const floatBtn = '<button class="coverBtn coverFloat">' + (state.listCovered ? "👁 뜻 열기" : "🙈 뜻 가리기") + '</button>';
  els.listView.innerHTML = '<div class="listBar"><span class="listHint">' + hint + '</span>' + btn + '</div><div class="listTable">' + rows + '</div>' + floatBtn;
}

function render() {
  renderChips();
  [...els.modeTabs.children].forEach((b) => b.classList.toggle("active", b.dataset.mode === state.mode));
  updateStat();
  if (state.mode === "list") renderList();
  else if (state.mode === "quiz") renderQuiz();
  else renderCard();
}

function setTheme(t) { document.documentElement.dataset.theme = t; els.theme.textContent = t === "dark" ? "☀️" : "🌙"; localStorage.setItem(THEME_KEY, t); }

els.flash.addEventListener("click", () => els.flash.classList.toggle("flipped"));
els.prev.addEventListener("click", () => move(-1));
els.next.addEventListener("click", () => move(1));
els.shuffle.addEventListener("click", () => { rebuildOrder(true); render(); });
els.know.addEventListener("click", () => mark(true));
els.dontKnow.addEventListener("click", () => mark(false));
els.listView.addEventListener("click", (e) => {
  const bm = e.target.closest(".bmBtn");
  if (bm) {
    const id = bm.getAttribute("data-id");
    if (state.bookmarks[id]) delete state.bookmarks[id]; else state.bookmarks[id] = true;
    saveBookmarks();
    if (state.filter === "⭐ 북마크") { render(); }
    else { bm.textContent = state.bookmarks[id] ? "⭐" : "☆"; const r = bm.closest(".liRow"); if (r) r.classList.toggle("bookmarked", !!state.bookmarks[id]); }
    return;
  }
  const cb = e.target.closest(".coverBtn");
  if (cb) { state.listCovered = !state.listCovered; try { localStorage.setItem("vocabListCover", state.listCovered ? "1" : "0"); } catch (_) {} render(); return; }
  if (state.listCovered) { const row = e.target.closest(".liRow"); if (row) row.classList.toggle("revealed"); }
});
els.theme.addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
[...els.modeTabs.children].forEach((b) => b.addEventListener("click", () => {
  state.mode = b.dataset.mode;
  if (state.mode === "quiz") { state.quiz = null; newQuiz(); }
  else rebuildOrder(state.mode === "review");
  render();
}));
document.addEventListener("keydown", (e) => {
  if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
  if (state.mode === "quiz") return;
  if (e.key === " ") { e.preventDefault(); els.flash.classList.toggle("flipped"); }
  else if (e.key === "ArrowRight") move(1);
  else if (e.key === "ArrowLeft") move(-1);
  else if (e.key.toLowerCase() === "j") mark(true);
  else if (e.key.toLowerCase() === "f") mark(false);
});

setTheme(localStorage.getItem(THEME_KEY) || "light");
try { state.listCovered = localStorage.getItem("vocabListCover") === "1"; } catch (e) {}
rebuildOrder(false);
render();
