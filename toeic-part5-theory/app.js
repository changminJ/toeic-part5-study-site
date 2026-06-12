const data = window.TOEIC_THEORY;
const THEME_KEY = "toeicTheoryTheme";

const els = {
  content: document.getElementById("content"),
  toc: document.getElementById("toc"),
  filter: document.getElementById("filter"),
  theme: document.getElementById("themeToggle"),
  expandAll: document.getElementById("expandAll"),
  collapseAll: document.getElementById("collapseAll"),
  toTop: document.getElementById("toTop"),
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function highlight(s, q) {
  const esc = escapeHtml(s);
  if (!q) return esc;
  try {
    const re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
    return esc.replace(re, "<mark>$1</mark>");
  } catch (e) { return esc; }
}
function moduleId(m) { return "type-" + m.index; }

function renderTable(rows, q) {
  if (!rows || !rows.length) return "";
  return `<table class="gridTable">${rows.map((row, ri) =>
    `<tr>${row.map((cell) => ri === 0 ? `<th>${highlight(cell, q)}</th>` : `<td>${highlight(cell, q)}</td>`).join("")}</tr>`
  ).join("")}</table>`;
}
function renderList(items, q, cls) {
  return `<ul class="miniList ${cls || ""}">${items.map((x) => `<li>${highlight(x, q)}</li>`).join("")}</ul>`;
}

function bodyHTML(m, q) {
  const time = m.timeMarkers && m.timeMarkers.length
    ? `<h3 class="blockTitle">⏱ 자주 나오는 시간·문맥 표현</h3>${renderTable(m.timeMarkers, q)}` : "";
  return `
    <p class="goal">🎯 ${highlight(m.goal, q)}</p>
    <h3 class="blockTitle">📘 이론</h3>${renderTable(m.theory, q)}
    ${time}
    <div class="columns">
      <section><h3 class="blockTitle">✅ 외워야 할 것</h3>${renderList(m.memorize, q, "")}</section>
      <section><h3 class="blockTitle">⚠️ 함정</h3>${renderList(m.traps, q, "traps")}</section>
    </div>`;
}

function moduleText(m) {
  const parts = [m.title, m.goal];
  (m.theory || []).forEach((r) => parts.push(r.join(" ")));
  (m.timeMarkers || []).forEach((r) => parts.push(r.join(" ")));
  (m.memorize || []).forEach((x) => parts.push(x));
  (m.traps || []).forEach((x) => parts.push(x));
  return parts.join("  ").toLowerCase();
}

function render(q) {
  els.content.innerHTML = "";
  const ql = (q || "").trim().toLowerCase();
  let shown = 0;
  data.modules.forEach((m) => {
    if (ql && !moduleText(m).includes(ql)) return;
    shown += 1;
    const card = document.createElement("article");
    card.className = "typeCard";
    card.id = moduleId(m);
    card.innerHTML =
      `<div class="typeHead"><span class="typeNum">${m.index}</span><h2>${highlight(m.title.replace(/^\d+유형\.\s*/, ""), q)}</h2><span class="chev">▾</span></div>` +
      `<div class="typeBody">${bodyHTML(m, ql ? q.trim() : "")}</div>`;
    card.querySelector(".typeHead").addEventListener("click", () => card.classList.toggle("collapsed"));
    els.content.appendChild(card);
  });
  if (!shown) els.content.innerHTML = `<p class="noMatch">"${escapeHtml(q)}"에 해당하는 이론이 없습니다.</p>`;
  if (ql) data.modules.forEach((m) => { const c = document.getElementById(moduleId(m)); if (c) c.classList.remove("collapsed"); });
}

function renderToc() {
  els.toc.innerHTML = "";
  data.modules.forEach((m) => {
    const a = document.createElement("a");
    a.href = "#" + moduleId(m);
    a.textContent = m.title;
    a.dataset.target = moduleId(m);
    a.addEventListener("click", () => {
      const c = document.getElementById(moduleId(m));
      if (c) c.classList.remove("collapsed");
    });
    els.toc.appendChild(a);
  });
}

function setTheme(t) {
  document.documentElement.dataset.theme = t;
  els.theme.textContent = t === "dark" ? "☀️" : "🌙";
  localStorage.setItem(THEME_KEY, t);
}

els.theme.addEventListener("click", () =>
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
els.filter.addEventListener("input", (e) => render(e.target.value));
els.expandAll.addEventListener("click", () =>
  document.querySelectorAll(".typeCard").forEach((c) => c.classList.remove("collapsed")));
els.collapseAll.addEventListener("click", () =>
  document.querySelectorAll(".typeCard").forEach((c) => c.classList.add("collapsed")));
els.toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

window.addEventListener("scroll", () => {
  els.toTop.classList.toggle("show", window.scrollY > 400);
  let active = null;
  data.modules.forEach((m) => {
    const c = document.getElementById(moduleId(m));
    if (c && c.getBoundingClientRect().top <= 120) active = moduleId(m);
  });
  els.toc.querySelectorAll("a").forEach((a) => a.classList.toggle("active", a.dataset.target === active));
});

setTheme(localStorage.getItem(THEME_KEY) || "light");
renderToc();
render("");
