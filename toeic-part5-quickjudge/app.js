/* TOEIC Part 5 — 보기 4갈래 즉결 drill */
(function () {
  "use strict";

  var BUCKETS = ["어형변화", "동사형태", "연결어", "어휘"];
  var TIPS = {
    "어형변화": "빈칸 <b>앞뒤 자리</b>만 봐, 해석 X. (관사/소유격 뒤=명사, be/부사 자리…)",
    "동사형태": "<b>수 → 태 → 시제</b> 순서로 깎아내.",
    "연결어": "뒤 <b>구조</b>를 봐: 명사구=전치사 · 절=접속사 · 완전문장 둘=접속부사.",
    "어휘": "<b>문맥·collocation</b>으로. 모르면 찍고 넘겨."
  };
  var THEME_KEY = "quickjudgeTheme";
  var STATS_KEY = "quickjudgeStats";

  var ALL = (window.QUICKJUDGE && window.QUICKJUDGE.items) ? window.QUICKJUDGE.items : [];

  // ---- state ----
  var mode = "all";        // "all" | "1" | "2"
  var order = [];          // array of indices into `queue`
  var queue = [];          // filtered items
  var pos = 0;             // current position in order
  var locked = false;      // answered current?
  var qStart = 0;          // performance.now() at question show
  var advTimer = null;

  var stats = { attempts: 0, correct: 0, streak: 0, bestStreak: 0, totalTime: 0 };

  // ---- dom ----
  var el = {
    themeToggle: document.getElementById("themeToggle"),
    modeRow: document.getElementById("modeRow"),
    shuffleBtn: document.getElementById("shuffleBtn"),
    restartBtn: document.getElementById("restartBtn"),
    statStreak: document.getElementById("statStreak"),
    statAcc: document.getElementById("statAcc"),
    statTime: document.getElementById("statTime"),
    statProg: document.getElementById("statProg"),
    qcard: document.getElementById("qcard"),
    qBadge: document.getElementById("qBadge"),
    distLine: document.getElementById("distLine"),
    stem: document.getElementById("stem"),
    options: document.getElementById("options"),
    buckets: document.getElementById("buckets"),
    feedback: document.getElementById("feedback"),
    fbHead: document.getElementById("fbHead"),
    fbTip: document.getElementById("fbTip"),
    fbAnswer: document.getElementById("fbAnswer"),
    nextBtn: document.getElementById("nextBtn"),
    done: document.getElementById("done"),
    doneSummary: document.getElementById("doneSummary"),
    doneRestart: document.getElementById("doneRestart")
  };
  var bkBtns = Array.prototype.slice.call(el.buckets.querySelectorAll(".bk"));

  // ---- utils ----
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function shuffleArr(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // ---- theme ----
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    el.themeToggle.textContent = (t === "dark") ? "☀️" : "🌙";
  }
  function initTheme() {
    var t = "light";
    try { t = localStorage.getItem(THEME_KEY) || "light"; } catch (e) {}
    if (t !== "dark") t = "light";
    applyTheme(t);
  }
  el.themeToggle.addEventListener("click", function () {
    var t = (document.documentElement.dataset.theme === "dark") ? "light" : "dark";
    applyTheme(t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
  });

  // ---- stats persistence ----
  function loadStats() {
    try {
      var raw = localStorage.getItem(STATS_KEY);
      if (raw) {
        var o = JSON.parse(raw);
        if (o && typeof o === "object") {
          stats.attempts = o.attempts || 0;
          stats.correct = o.correct || 0;
          stats.bestStreak = o.bestStreak || 0;
          stats.totalTime = o.totalTime || 0;
        }
      }
    } catch (e) {}
  }
  function saveStats() {
    try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch (e) {}
  }

  // ---- queue building ----
  function buildQueue() {
    queue = ALL.filter(function (it) {
      if (mode === "all") return true;
      return String(it.tan) === mode;
    });
    order = [];
    for (var i = 0; i < queue.length; i++) order.push(i);
    pos = 0;
  }

  function distCounts(list) {
    var d = { "어형변화": 0, "동사형태": 0, "연결어": 0, "어휘": 0 };
    list.forEach(function (it) { if (d[it.bucket] != null) d[it.bucket]++; });
    return d;
  }

  // ---- render ----
  function renderStem(stem) {
    // split on the _____ blank
    var parts = String(stem).split(/_{2,}/);
    var html = "";
    for (var i = 0; i < parts.length; i++) {
      html += esc(parts[i]);
      if (i < parts.length - 1) html += '<span class="blank">_____</span>';
    }
    return html;
  }

  function renderStats() {
    el.statStreak.textContent = String(stats.streak);
    if (stats.attempts > 0) {
      el.statAcc.textContent = Math.round((stats.correct / stats.attempts) * 100) + "%";
      el.statTime.textContent = (stats.totalTime / stats.attempts / 1000).toFixed(1) + "초";
    } else {
      el.statAcc.textContent = "—";
      el.statTime.textContent = "—";
    }
    el.statProg.textContent = (Math.min(pos + 1, queue.length)) + " / " + queue.length;
  }

  function renderQuestion() {
    locked = false;
    el.feedback.className = "feedback hidden";
    el.done.className = "done hidden";
    el.qcard.classList.remove("hidden");
    el.buckets.classList.remove("hidden", "locked");
    bkBtns.forEach(function (b) { b.classList.remove("correct", "wrongPick"); });

    if (pos >= order.length) { showDone(); return; }
    var it = queue[order[pos]];

    el.qBadge.textContent = it.tan + "탄 " + it.num + "번";
    var d = distCounts(queue);
    el.distLine.textContent = "어형 " + d["어형변화"] + " · 동사 " + d["동사형태"] +
      " · 연결어 " + d["연결어"] + " · 어휘 " + d["어휘"];
    el.stem.innerHTML = renderStem(it.stem);

    var letters = ["A", "B", "C", "D"];
    var oh = "";
    for (var i = 0; i < 4; i++) {
      oh += '<div class="opt"><span class="optLtr">' + letters[i] + '</span>' +
        '<span class="optText">' + esc(it.options[i]) + '</span></div>';
    }
    el.options.innerHTML = oh;

    renderStats();
    qStart = (window.performance && performance.now) ? performance.now() : Date.now();
  }

  // ---- answering ----
  function answer(picked) {
    if (locked) return;
    if (pos >= order.length) return;
    locked = true;
    var now = (window.performance && performance.now) ? performance.now() : Date.now();
    var dt = now - qStart;
    var it = queue[order[pos]];
    var correctBucket = it.bucket;
    var isRight = (picked === correctBucket);

    stats.attempts++;
    stats.totalTime += dt;
    if (isRight) {
      stats.correct++;
      stats.streak++;
      if (stats.streak > stats.bestStreak) stats.bestStreak = stats.streak;
    } else {
      stats.streak = 0;
    }
    saveStats();

    // highlight bucket buttons
    el.buckets.classList.add("locked");
    bkBtns.forEach(function (b) {
      var bk = b.getAttribute("data-bucket");
      if (bk === correctBucket) b.classList.add("correct");
      else if (bk === picked) b.classList.add("wrongPick");
    });

    // highlight the answer option
    var ansIdx = ["A", "B", "C", "D"].indexOf(it.answer);
    var optEls = el.options.querySelectorAll(".opt");
    if (ansIdx >= 0 && optEls[ansIdx]) optEls[ansIdx].classList.add("isAnswer");

    // feedback panel
    el.feedback.className = "feedback " + (isRight ? "ok" : "bad");
    el.fbHead.textContent = isRight
      ? ("정답! → " + correctBucket + " (" + (dt / 1000).toFixed(1) + "초)")
      : ("아쉽! 정답은 " + correctBucket);
    el.fbTip.innerHTML = "한 방 → " + TIPS[correctBucket];
    el.fbAnswer.innerHTML = '실제 정답 <span class="ansLtr">' + esc(it.answer) + "</span> · " +
      esc(it.key || "");

    renderStats();

    // auto-advance
    if (advTimer) clearTimeout(advTimer);
    advTimer = setTimeout(next, isRight ? 700 : 1600);
  }

  function next() {
    if (advTimer) { clearTimeout(advTimer); advTimer = null; }
    pos++;
    if (pos >= order.length) { showDone(); return; }
    renderQuestion();
  }

  function showDone() {
    el.qcard.classList.add("hidden");
    el.buckets.classList.add("hidden");
    el.feedback.className = "feedback hidden";
    el.done.className = "done";
    var acc = stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0;
    var avg = stats.attempts > 0 ? (stats.totalTime / stats.attempts / 1000).toFixed(1) : "0.0";
    el.doneSummary.innerHTML = "누적 정확도 <b>" + acc + "%</b> · 평균 <b>" + avg +
      "초</b> · 최고 연속 <b>" + stats.bestStreak + "</b>";
    renderStats();
  }

  // ---- controls ----
  function restart(shuffle) {
    buildQueue();
    if (shuffle) shuffleArr(order);
    stats.streak = 0;
    renderQuestion();
  }

  el.modeRow.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest(".seg") : null;
    if (!btn) return;
    var m = btn.getAttribute("data-mode");
    if (!m) return;
    mode = m;
    Array.prototype.forEach.call(el.modeRow.querySelectorAll(".seg"), function (b) {
      b.classList.toggle("active", b === btn);
    });
    restart(false);
  });
  el.shuffleBtn.addEventListener("click", function () { restart(true); });
  el.restartBtn.addEventListener("click", function () { restart(false); });
  el.doneRestart.addEventListener("click", function () { restart(false); });
  el.nextBtn.addEventListener("click", next);

  el.buckets.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest(".bk") : null;
    if (!btn) return;
    answer(btn.getAttribute("data-bucket"));
  });

  // keyboard: 1/2/3/4 -> buckets in order; Enter/Space/ArrowRight -> next
  document.addEventListener("keydown", function (e) {
    var k = e.key;
    if (k === "1" || k === "2" || k === "3" || k === "4") {
      var idx = parseInt(k, 10) - 1;
      if (!locked) answer(BUCKETS[idx]);
      e.preventDefault();
    } else if (k === "Enter" || k === " " || k === "ArrowRight") {
      if (locked) { next(); e.preventDefault(); }
    }
  });

  // ---- boot ----
  initTheme();
  loadStats();
  stats.streak = 0;
  buildQueue();
  renderQuestion();

  // expose for tests
  window.__QJ = {
    answer: answer,
    next: next,
    state: function () { return { mode: mode, pos: pos, locked: locked, queueLen: queue.length, stats: stats }; },
    buckets: BUCKETS
  };
})();
