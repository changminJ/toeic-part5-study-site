const data = window.SEOAH_PART5_DATA;
const letters = ["A", "B", "C", "D"];
const numberToLetter = { "1": "A", "2": "B", "3": "C", "4": "D" };
const ANSWERS_KEY = "seoahPart5Answers";
const PREFS_KEY = "seoahPart5Prefs";

const allQuestions = data.modules.flatMap((m, mi) =>
  m.questions.map((q) => ({ ...q, moduleKey: m.key, moduleTitle: m.title, moduleIndex: mi }))
);
const questionById = new Map(allQuestions.map((q) => [q.id, q]));

const prefs = Object.assign({ instant: true, auto: false }, JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"));
const state = {
  moduleIndex: 0,
  questionIndex: 0,
  mode: "all",
  answers: JSON.parse(localStorage.getItem(ANSWERS_KEY) || "{}"),
};
let autoTimer = null;

const els = {
  moduleList: document.getElementById("moduleList"),
  meta: document.getElementById("questionMeta"),
  text: document.getElementById("questionText"),
  options: document.getElementById("options"),
  feedback: document.getElementById("feedback"),
  prev: document.getElementById("prevQuestion"),
  next: document.getElementById("nextQuestion"),
  progress: document.getElementById("questionProgress"),
  qStatus: document.getElementById("questionStatus"),
  mode: document.getElementById("modeSelect"),
  instant: document.getElementById("instantFeedback"),
  auto: document.getElementById("autoAdvance"),
  resetModule: document.getElementById("resetModule"),
  resetAll: document.getElementById("resetAll"),
  srcLink: document.getElementById("srcLink"),
  statAnswered: document.getElementById("statAnswered"),
  statCorrect: document.getElementById("statCorrect"),
  statWrong: document.getElementById("statWrong"),
  statAccuracy: document.getElementById("statAccuracy"),
  theme: document.getElementById("themeToggle"),
};

const THEME_KEY = "seoahPart5Theme";
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  if (els.theme) els.theme.textContent = t === "dark" ? "☀️" : "🌙";
  localStorage.setItem(THEME_KEY, t);
}
if (els.theme) els.theme.addEventListener("click", () =>
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
setTheme(localStorage.getItem(THEME_KEY) || "light");

function savePrefs() { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); }
function saveAnswers() { localStorage.setItem(ANSWERS_KEY, JSON.stringify(state.answers)); }

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function renderStem(text) {
  return escapeHtml(text).replace(/_{3,}/g, '<span class="blank">_____</span>');
}

function currentModule() { return data.modules[state.moduleIndex]; }

function modeQuestions() {
  const m = currentModule();
  if (state.mode === "mistakes") {
    return allQuestions.filter((q) => state.answers[q.id] && !state.answers[q.id].correct);
  }
  const list = m.questions.map((q) => questionById.get(q.id));
  if (state.mode === "unanswered") return list.filter((q) => !state.answers[q.id]);
  return list;
}

function renderModules() {
  els.moduleList.innerHTML = "";
  data.modules.forEach((m, idx) => {
    const answered = m.questions.filter((q) => state.answers[q.id]).length;
    const wrong = m.questions.filter((q) => state.answers[q.id] && !state.answers[q.id].correct).length;
    const btn = document.createElement("button");
    btn.className = `moduleButton${idx === state.moduleIndex && state.mode !== "mistakes" ? " active" : ""}`;
    btn.innerHTML = `<span>${m.title}</span><span class="moduleCount">${answered}/${m.questions.length} 풀이 · 오답 ${wrong}</span>`;
    btn.addEventListener("click", () => {
      state.moduleIndex = idx;
      state.questionIndex = 0;
      if (state.mode === "mistakes") { state.mode = "all"; els.mode.value = "all"; }
      render();
    });
    els.moduleList.appendChild(btn);
  });
}

function stats() {
  const pool = state.mode === "mistakes" ? allQuestions : currentModule().questions;
  const answered = pool.filter((q) => state.answers[q.id]);
  const correct = answered.filter((q) => state.answers[q.id].correct);
  const wrong = answered.length - correct.length;
  const acc = answered.length ? Math.round((correct.length / answered.length) * 100) : 0;
  els.statAnswered.textContent = `${answered.length} 풀이`;
  els.statCorrect.textContent = `${correct.length} 정답`;
  els.statWrong.textContent = `${wrong} 오답`;
  els.statAccuracy.textContent = `${acc}%`;
}

function current() {
  const questions = modeQuestions();
  if (!questions.length) return { questions, question: null };
  if (state.questionIndex >= questions.length) state.questionIndex = questions.length - 1;
  if (state.questionIndex < 0) state.questionIndex = 0;
  return { questions, question: questions[state.questionIndex] };
}

function renderQuestion() {
  const { questions, question } = current();
  els.srcLink.href = currentModule().source || "#";
  if (!question) {
    const msg = state.mode === "mistakes"
      ? "아직 틀린 문제가 없습니다. 와다다 풀이에서 더 풀면 오답이 여기 모입니다."
      : state.mode === "unanswered"
      ? "이 세트는 다 풀었습니다. 다른 세트나 오답노트로 가보세요."
      : "문제가 없습니다.";
    els.meta.innerHTML = "";
    els.text.innerHTML = `<span class="empty">${msg}</span>`;
    els.options.innerHTML = "";
    els.progress.textContent = "0 / 0";
    els.qStatus.textContent = "";
    els.feedback.classList.add("hidden");
    return;
  }
  const record = state.answers[question.id];
  els.meta.innerHTML =
    `<span class="tag num">${question.moduleTitle.split(" ")[1] || ""} #${question.num}</span>` +
    (question.type ? `<span class="tag">${escapeHtml(question.type)}</span>` : "") +
    (question.key ? `<span class="tag key">${escapeHtml(question.key)}</span>` : "");
  els.text.innerHTML = renderStem(question.text);
  els.progress.textContent = `${state.questionIndex + 1} / ${questions.length}`;
  els.qStatus.textContent = record ? (record.correct ? " · 정답 처리됨" : " · 오답 처리됨") : " · 1·2·3·4 키로 선택";

  els.options.innerHTML = "";
  const reveal = record && (prefs.instant || state.mode !== "all");
  question.options.forEach((text, idx) => {
    const letter = letters[idx];
    const btn = document.createElement("button");
    btn.className = "option";
    if (reveal) {
      if (letter === question.answer) btn.classList.add("correct");
      if (record && letter === record.selected && !record.correct) btn.classList.add("wrong");
    }
    btn.innerHTML = `<span class="optionLetter">${letter}</span><span>${escapeHtml(text)}</span>`;
    btn.addEventListener("click", () => choose(question, letter));
    els.options.appendChild(btn);
  });
  renderFeedback(question, record);
}

function renderFeedback(question, record) {
  const show = record && (prefs.instant || state.mode !== "all");
  if (!show) { els.feedback.classList.add("hidden"); els.feedback.innerHTML = ""; return; }
  const ok = record.selected === question.answer;
  const rows = letters.map((L) => {
    const isAns = L === question.answer;
    return `<div class="fbRow${isAns ? " correct" : ""}"><span class="fbLetter">${L}</span><span class="fbText">${escapeHtml(question.feedback[L] || "")}</span></div>`;
  }).join("");
  els.feedback.classList.remove("hidden");
  els.feedback.innerHTML =
    `<p class="verdict ${ok ? "ok" : "no"}">${ok ? "✅ 정답" : "❌ 오답"} · 정답 ${question.answer} (당신: ${record.selected})</p>` +
    (question.key ? `<p class="keyline">💡 ${escapeHtml(question.key)}</p>` : "") +
    `<h3>보기별 해설</h3>${rows}` +
    (question.changeNote ? `<p class="changeNote">검수 메모: ${escapeHtml(question.changeNote)}</p>` : "");
}

function choose(question, letter) {
  state.answers[question.id] = { selected: letter, correct: letter === question.answer, answeredAt: new Date().toISOString() };
  saveAnswers();
  render();
  if (autoTimer) clearTimeout(autoTimer);
  if (prefs.auto && letter === question.answer) {
    autoTimer = setTimeout(() => {
      const { questions, question: q } = current();
      if (q && q.id === question.id && state.questionIndex < questions.length - 1) {
        state.questionIndex += 1;
        render();
      }
    }, 500);
  }
}

function move(delta) {
  const { questions } = current();
  if (!questions.length) return;
  state.questionIndex = Math.min(Math.max(state.questionIndex + delta, 0), questions.length - 1);
  renderQuestion();
  stats();
}

function resetModule() {
  currentModule().questions.forEach((q) => delete state.answers[q.id]);
  saveAnswers();
  if (state.mode === "mistakes") { state.mode = "all"; els.mode.value = "all"; }
  state.questionIndex = 0;
  render();
}
function resetAll() {
  if (!confirm("모든 풀이 기록을 지웁니다. 계속할까요?")) return;
  state.answers = {};
  saveAnswers();
  state.questionIndex = 0;
  render();
}

function render() {
  renderModules();
  renderQuestion();
  stats();
}

els.prev.addEventListener("click", () => move(-1));
els.next.addEventListener("click", () => move(1));
els.mode.addEventListener("change", (e) => { state.mode = e.target.value; state.questionIndex = 0; render(); });
els.resetModule.addEventListener("click", resetModule);
els.resetAll.addEventListener("click", resetAll);
els.instant.checked = prefs.instant;
els.auto.checked = prefs.auto;
els.instant.addEventListener("change", (e) => { prefs.instant = e.target.checked; savePrefs(); render(); });
els.auto.addEventListener("change", (e) => { prefs.auto = e.target.checked; savePrefs(); });

document.addEventListener("keydown", (e) => {
  const tag = document.activeElement ? document.activeElement.tagName : "";
  if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const L = numberToLetter[e.key];
  if (L) {
    const { question } = current();
    if (question) { e.preventDefault(); choose(question, L); }
  } else if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
  else if (e.key.toLowerCase() === "f") {
    const { question } = current();
    const record = question && state.answers[question.id];
    if (record) { prefs.instant = !prefs.instant; els.instant.checked = prefs.instant; savePrefs(); render(); }
  }
});

render();
