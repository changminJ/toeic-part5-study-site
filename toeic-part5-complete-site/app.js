const data = window.TOEIC_PART5_DATA;
const letters = ["A", "B", "C", "D"];
const numberToLetter = { "1": "A", "2": "B", "3": "C", "4": "D" };
const RANDOM_QUESTIONS_PER_MODULE = 2;
const RANDOM_SESSION_KEY = "toeicPart5RandomSession";
const AUTO_ADVANCE_MS = 180;
const REVIEW_ADVANCE_MS = 650;
let autoAdvanceTimer = null;
const bankLabels = Object.fromEntries(data.banks.map((bank) => [bank.key, bank.label]));

function rawBankQuestions(module, bankKey) {
  if (bankKey === "base") return module.questions;
  return module.practice && module.practice[bankKey] ? module.practice[bankKey] : [];
}

const allQuestions = data.modules.flatMap((module, moduleIndex) =>
  data.banks.flatMap((bank) => rawBankQuestions(module, bank.key).map((question) => ({
    ...question,
    moduleTitle: module.title,
    moduleIndex,
    bank: bank.key,
    bankLabel: bank.label,
  })))
);
const questionById = new Map(allQuestions.map((question) => [question.id, question]));
const state = {
  moduleIndex: 0,
  questionIndex: 0,
  bank: "base",
  mode: "all",
  answers: JSON.parse(localStorage.getItem("toeicPart5Answers") || "{}"),
  randomSession: JSON.parse(localStorage.getItem(RANDOM_SESSION_KEY) || "null"),
};

const els = {
  moduleList: document.getElementById("moduleList"),
  studyPanel: document.getElementById("studyPanel"),
  questionMeta: document.getElementById("questionMeta"),
  questionText: document.getElementById("questionText"),
  options: document.getElementById("options"),
  feedback: document.getElementById("feedback"),
  prev: document.getElementById("prevQuestion"),
  next: document.getElementById("nextQuestion"),
  progress: document.getElementById("questionProgress"),
  qStatus: document.getElementById("questionStatus"),
  mode: document.getElementById("modeSelect"),
  bank: document.getElementById("bankSelect"),
  startRandom: document.getElementById("startRandom"),
  retryRandom: document.getElementById("retryRandom"),
  clearRandom: document.getElementById("clearRandom"),
  resetModule: document.getElementById("resetModule"),
  resetAll: document.getElementById("resetAll"),
  statAnswered: document.getElementById("statAnswered"),
  statCorrect: document.getElementById("statCorrect"),
  statWrong: document.getElementById("statWrong"),
  statAccuracy: document.getElementById("statAccuracy"),
};

function saveAnswers() {
  localStorage.setItem("toeicPart5Answers", JSON.stringify(state.answers));
}

function saveRandomSession() {
  if (state.randomSession) {
    localStorage.setItem(RANDOM_SESSION_KEY, JSON.stringify(state.randomSession));
  } else {
    localStorage.removeItem(RANDOM_SESSION_KEY);
  }
}

function activeAnswers() {
  return state.mode === "random" && state.randomSession ? state.randomSession.answers : state.answers;
}

function saveActiveAnswers() {
  if (state.mode === "random" && state.randomSession) {
    saveRandomSession();
  } else {
    saveAnswers();
  }
}

function shuffle(items) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createRandomSession() {
  const selectedIds = data.modules.flatMap((module) =>
    shuffle(rawBankQuestions(module, state.bank)).slice(0, RANDOM_QUESTIONS_PER_MODULE).map((question) => question.id)
  );
  state.randomSession = {
    id: `random-${Date.now()}`,
    bank: state.bank,
    bankLabel: bankLabels[state.bank],
    createdAt: new Date().toISOString(),
    questionIds: shuffle(selectedIds),
    answers: {},
  };
  saveRandomSession();
  state.mode = "random";
  els.mode.value = "random";
  state.questionIndex = 0;
  render();
}

function randomQuestions() {
  if (!state.randomSession) return [];
  return state.randomSession.questionIds.map((id) => questionById.get(id)).filter(Boolean);
}

function isRandomComplete() {
  const questions = randomQuestions();
  return Boolean(questions.length) && questions.every((question) => state.randomSession.answers[question.id]);
}

function moduleQuestions(module) {
  if (state.mode === "random") {
    return randomQuestions();
  }
  if (state.mode === "mistakes") {
    return allQuestions.filter((q) => state.answers[q.id] && !state.answers[q.id].correct);
  }
  if (state.mode === "unanswered") {
    return rawBankQuestions(module, state.bank).filter((q) => !state.answers[q.id]);
  }
  return rawBankQuestions(module, state.bank);
}

function totals() {
  if (state.mode === "random" && state.randomSession) {
    const questions = randomQuestions();
    const answered = questions.filter((q) => state.randomSession.answers[q.id]);
    const correct = answered.filter((q) => state.randomSession.answers[q.id].correct);
    const wrong = answered.length - correct.length;
    const accuracy = answered.length ? Math.round((correct.length / answered.length) * 100) : 0;
    els.statAnswered.textContent = `${answered.length}/${questions.length} 랜덤`;
    els.statCorrect.textContent = `${correct.length} 정답`;
    els.statWrong.textContent = `${wrong} 오답`;
    els.statAccuracy.textContent = `${accuracy}%`;
    return;
  }
  const all = state.mode === "mistakes"
    ? allQuestions
    : data.modules.flatMap((m) => rawBankQuestions(m, state.bank));
  const answered = all.filter((q) => state.answers[q.id]);
  const correct = answered.filter((q) => state.answers[q.id].correct);
  const wrong = answered.length - correct.length;
  const accuracy = answered.length ? Math.round((correct.length / answered.length) * 100) : 0;
  els.statAnswered.textContent = `${answered.length} 풀이`;
  els.statCorrect.textContent = `${correct.length} 정답`;
  els.statWrong.textContent = `${wrong} 오답`;
  els.statAccuracy.textContent = `${accuracy}%`;
}

function renderModules() {
  els.moduleList.innerHTML = "";
  data.modules.forEach((module, idx) => {
    const bankQuestions = rawBankQuestions(module, state.bank);
    const answered = bankQuestions.filter((q) => state.answers[q.id]).length;
    const wrong = bankQuestions.filter((q) => state.answers[q.id] && !state.answers[q.id].correct).length;
    const button = document.createElement("button");
    button.className = `moduleButton${idx === state.moduleIndex ? " active" : ""}`;
    button.innerHTML = `<span>${module.title}</span><span class="moduleCount">${answered}/${bankQuestions.length} 풀이 · 오답 ${wrong}</span>`;
    button.addEventListener("click", () => {
      state.moduleIndex = idx;
      state.questionIndex = 0;
      if (state.mode === "mistakes" || state.mode === "random") {
        state.mode = "all";
        els.mode.value = "all";
      }
      render();
    });
    els.moduleList.appendChild(button);
  });
}

function renderTable(rows) {
  return `<table class="gridTable">${rows.map((row, rowIdx) => `<tr>${row.map((cell) => rowIdx === 0 ? `<th>${cell}</th>` : `<td>${cell}</td>`).join("")}</tr>`).join("")}</table>`;
}

function renderStudy(module) {
  const time = module.timeMarkers && module.timeMarkers.length
    ? `<h3>자주 나오는 시간표현</h3>${renderTable(module.timeMarkers)}`
    : "";
  els.studyPanel.innerHTML = `
    <h2>${module.title}</h2>
    <p class="goal">${module.goal}</p>
    <p class="goal">현재 문항 난도: ${bankLabels[state.bank]} · ${rawBankQuestions(module, state.bank).length}문항</p>
    <h3>이론</h3>
    ${renderTable(module.theory)}
    ${time}
    <div class="studyColumns">
      <section>
        <h3>외워야 할 것</h3>
        <ul class="miniList">${module.memorize.map((x) => `<li>${x}</li>`).join("")}</ul>
      </section>
      <section>
        <h3>함정</h3>
        <ul class="miniList">${module.traps.map((x) => `<li>${x}</li>`).join("")}</ul>
      </section>
    </div>
  `;
}

function renderRandomStudy() {
  const questions = randomQuestions();
  const sessionLabel = state.randomSession && state.randomSession.bankLabel ? state.randomSession.bankLabel : bankLabels[state.bank];
  if (!state.randomSession || !questions.length) {
    els.studyPanel.innerHTML = `
      <h2>랜덤 회차 30문항</h2>
      <p class="goal">새 랜덤 회차 뽑기를 누르면 현재 난도(${bankLabels[state.bank]})에서 15개 유형별 2문항씩 총 30문항을 섞어서 풀 수 있다.</p>
    `;
    return;
  }
  const answered = questions.filter((q) => state.randomSession.answers[q.id]);
  const correct = answered.filter((q) => state.randomSession.answers[q.id].correct);
  const wrong = answered.length - correct.length;
  const rows = [["유형", "출제", "정답", "오답"]].concat(data.modules.map((module, idx) => {
    const moduleQuestions = questions.filter((q) => q.moduleIndex === idx);
    const moduleAnswered = moduleQuestions.filter((q) => state.randomSession.answers[q.id]);
    const moduleCorrect = moduleAnswered.filter((q) => state.randomSession.answers[q.id].correct);
    return [
      module.title,
      `${moduleQuestions.length}`,
      `${moduleCorrect.length}`,
      `${moduleAnswered.length - moduleCorrect.length}`,
    ];
  }));
  const completeMessage = isRandomComplete()
    ? '<p class="goal">회차 완료. 틀린 유형을 확인하고 아래 문항을 넘기면서 해설을 보면 된다.</p>'
    : '<p class="goal">각 유형에서 2문항씩 출제된다. 답을 고르면 자동으로 다음 문항으로 넘어간다.</p>';
  els.studyPanel.innerHTML = `
    <h2>랜덤 회차 30문항</h2>
    <p class="goal">회차 난도: ${sessionLabel}</p>
    ${completeMessage}
    <div class="randomSummary">
      <div class="randomStat"><span>푼 문항</span><strong>${answered.length}/${questions.length}</strong></div>
      <div class="randomStat"><span>정답</span><strong>${correct.length}</strong></div>
      <div class="randomStat"><span>오답</span><strong>${wrong}</strong></div>
      <div class="randomStat"><span>정답률</span><strong>${answered.length ? Math.round((correct.length / answered.length) * 100) : 0}%</strong></div>
    </div>
    ${renderTable(rows)}
  `;
}

function currentQuestion() {
  const module = data.modules[state.moduleIndex];
  const questions = moduleQuestions(module);
  if (!questions.length) return { module, questions, question: null };
  if (state.questionIndex >= questions.length) state.questionIndex = questions.length - 1;
  if (state.questionIndex < 0) state.questionIndex = 0;
  return { module, questions, question: questions[state.questionIndex] };
}

function renderQuestion() {
  const { module, questions, question } = currentQuestion();
  if (!question) {
    const emptyText = state.mode === "random"
      ? "아직 랜덤 회차가 없습니다. 새 랜덤 회차 뽑기를 눌러 시작하세요."
      : state.mode === "mistakes"
      ? "틀린 문항이 없습니다. 와다다 풀이에서 더 풀면 여기에 오답이 모입니다."
      : "현재 유형에 남은 미풀이 문제가 없습니다.";
    els.questionMeta.textContent = state.mode === "random" ? "랜덤 회차" : state.mode === "mistakes" ? "오답노트" : module.title;
    els.questionText.textContent = emptyText;
    els.progress.textContent = "0 / 0";
    els.qStatus.textContent = state.mode === "random" ? " · 회차 없음" : state.mode === "mistakes" ? " · 오답 없음" : " · 미풀이 없음";
    els.options.innerHTML = "";
    els.feedback.classList.add("hidden");
    els.feedback.innerHTML = "";
    return;
  }
  const answers = activeAnswers();
  const record = answers[question.id];
  const moduleTitle = question.moduleTitle || module.title;
  const bankLabel = question.bankLabel || bankLabels[state.bank];
  els.questionMeta.textContent = `${moduleTitle} · ${bankLabel} · ${question.number}`;
  els.questionText.textContent = question.text;
  els.progress.textContent = `${state.questionIndex + 1} / ${questions.length}`;
  els.qStatus.textContent = record
    ? (state.mode === "random" && isRandomComplete() ? " · 회차 완료, 해설 확인 가능" : record.correct ? " · 정답 처리됨" : " · 오답 처리됨")
    : " · 1/2/3/4 키 선택 가능";
  els.options.innerHTML = "";
  question.options.forEach((text, idx) => {
    const letter = letters[idx];
    const btn = document.createElement("button");
    btn.className = "option";
    if (record) {
      if (letter === question.answer) btn.classList.add("correct");
      if (letter === record.selected && !record.correct) btn.classList.add("wrong");
    }
    btn.innerHTML = `<span class="optionLetter">${letter}</span><span>${text}</span>`;
    btn.addEventListener("click", () => chooseAnswer(question, letter));
    els.options.appendChild(btn);
  });
  renderFeedback(question, record && record.selected);
}

function renderFeedback(question, selected) {
  const shouldShow = state.mode === "mistakes" || (state.mode === "random" && isRandomComplete());
  if (!selected || !shouldShow) {
    els.feedback.classList.add("hidden");
    els.feedback.innerHTML = "";
    return;
  }
  const correct = question.answer;
  const selectedFeedback = question.feedback[selected];
  const all = letters.map((letter) => `<p><strong>${letter}.</strong> ${question.feedback[letter]}</p>`).join("");
  els.feedback.classList.remove("hidden");
  els.feedback.innerHTML = `
    <h3>${selected === correct ? "정답" : "오답"}: ${selected} 선택</h3>
    <p>${selectedFeedback}</p>
    <h3>모든 선지 해설</h3>
    ${all}
  `;
}

function chooseAnswer(question, letter) {
  const answers = activeAnswers();
  answers[question.id] = {
    selected: letter,
    correct: letter === question.answer,
    answeredAt: new Date().toISOString(),
  };
  saveActiveAnswers();
  render();
  if (autoAdvanceTimer) window.clearTimeout(autoAdvanceTimer);
  autoAdvanceTimer = window.setTimeout(() => {
    const { questions, question: activeQuestion } = currentQuestion();
    const stillOnAnsweredQuestion = activeQuestion && activeQuestion.id === question.id;
    if (stillOnAnsweredQuestion && state.questionIndex < questions.length - 1) {
      state.questionIndex += 1;
      render();
    } else if (!stillOnAnsweredQuestion) {
      render();
    }
  }, state.mode === "mistakes" ? REVIEW_ADVANCE_MS : AUTO_ADVANCE_MS);
}

function move(delta) {
  const { questions } = currentQuestion();
  if (!questions.length) return;
  state.questionIndex = Math.min(Math.max(state.questionIndex + delta, 0), questions.length - 1);
  renderQuestion();
}

function resetModule() {
  const module = data.modules[state.moduleIndex];
  rawBankQuestions(module, state.bank).forEach((q) => delete state.answers[q.id]);
  saveAnswers();
  state.mode = "all";
  els.mode.value = "all";
  state.questionIndex = 0;
  render();
}

function resetAll() {
  state.answers = {};
  state.randomSession = null;
  saveAnswers();
  saveRandomSession();
  state.mode = "all";
  els.mode.value = "all";
  state.questionIndex = 0;
  render();
}

function retryRandom() {
  if (!state.randomSession) {
    createRandomSession();
    return;
  }
  state.bank = state.randomSession.bank || state.bank;
  els.bank.value = state.bank;
  state.randomSession.answers = {};
  saveRandomSession();
  state.mode = "random";
  els.mode.value = "random";
  state.questionIndex = 0;
  render();
}

function clearRandom() {
  state.randomSession = null;
  saveRandomSession();
  if (state.mode === "random") {
    state.mode = "all";
    els.mode.value = "all";
  }
  state.questionIndex = 0;
  render();
}

function render() {
  renderModules();
  const { module } = currentQuestion();
  if (state.mode === "random") {
    renderRandomStudy();
  } else {
    renderStudy(module);
  }
  renderQuestion();
  totals();
}

els.prev.addEventListener("click", () => move(-1));
els.next.addEventListener("click", () => move(1));
els.mode.addEventListener("change", (event) => {
  if (event.target.value === "random" && !state.randomSession) {
    createRandomSession();
    return;
  }
  if (event.target.value === "random" && state.randomSession) {
    state.bank = state.randomSession.bank || state.bank;
    els.bank.value = state.bank;
  }
  state.mode = event.target.value;
  state.questionIndex = 0;
  render();
});
els.bank.addEventListener("change", (event) => {
  state.bank = event.target.value;
  if (state.mode === "random") {
    state.mode = "all";
    els.mode.value = "all";
  }
  state.questionIndex = 0;
  render();
});
els.startRandom.addEventListener("click", createRandomSession);
els.retryRandom.addEventListener("click", retryRandom);
els.clearRandom.addEventListener("click", clearRandom);
els.resetModule.addEventListener("click", resetModule);
els.resetAll.addEventListener("click", resetAll);
document.addEventListener("keydown", (event) => {
  const tag = document.activeElement ? document.activeElement.tagName : "";
  if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const key = numberToLetter[event.key];
  if (key) {
    const { question } = currentQuestion();
    if (question) {
      event.preventDefault();
      chooseAnswer(question, key);
    }
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    move(1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    move(-1);
  }
});

render();
