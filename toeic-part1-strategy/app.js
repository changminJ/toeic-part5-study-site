const data = window.TOEIC_PART1;
const THEME_KEY = "toeicPart1Theme";

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
  const re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
  return esc.replace(re, "<mark>$1</mark>");
}
function partId(p) { return "part-" + p.key; }
function renderTable(rows, q) {
  return `<table class="gridTable">${rows.map((row, ri) =>
    `<tr>${row.map((c) => ri === 0 ? `<th>${highlight(c, q)}</th>` : `<td>${highlight(c, q)}</td>`).join("")}</tr>`
  ).join("")}</table>`;
}
function renderList(items, q) {
  return `<ul class="miniList">${items.map((x) => `<li>${highlight(x, q)}</li>`).join("")}</ul>`;
}
function blockHTML(b, q) {
  return `<h3 class="blockTitle">${highlight(b.title, q)}</h3>${b.type === "table" ? renderTable(b.rows, q) : renderList(b.items, q)}`;
}
function partText(p) {
  const chunks = [p.title, p.goal, p.marker];
  p.blocks.forEach((b) => {
    chunks.push(b.title);
    if (b.type === "table") b.rows.forEach((r) => chunks.push(r.join(" ")));
    else b.items.forEach((x) => chunks.push(x));
  });
  return chunks.join(" ").toLowerCase();
}
function render(q) {
  const query = (q || "").trim();
  const ql = query.toLowerCase();
  els.content.innerHTML = "";
  let shown = 0;
  data.parts.forEach((p) => {
    if (ql && !partText(p).includes(ql)) return;
    shown += 1;
    const card = document.createElement("article");
    card.className = "typeCard";
    card.id = partId(p);
    card.innerHTML =
      `<div class="typeHead"><span class="typeNum">${escapeHtml(p.marker)}</span><h2>${highlight(p.title, query)}</h2><span class="chev">▾</span></div>` +
      `<div class="typeBody"><p class="goal">${highlight(p.goal, query)}</p>${p.blocks.map((b) => blockHTML(b, query)).join("")}</div>`;
    card.querySelector(".typeHead").addEventListener("click", () => card.classList.toggle("collapsed"));
    els.content.appendChild(card);
  });
  if (!shown) els.content.innerHTML = `<p class="noMatch">"${escapeHtml(query)}"에 해당하는 전략이 없습니다.</p>`;
}
function renderToc() {
  els.toc.innerHTML = "";
  data.parts.forEach((p) => {
    const a = document.createElement("a");
    a.href = "#" + partId(p);
    a.textContent = p.title;
    a.dataset.target = partId(p);
    a.addEventListener("click", () => {
      const c = document.getElementById(partId(p));
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

els.theme.addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
els.filter.addEventListener("input", (e) => render(e.target.value));
els.expandAll.addEventListener("click", () => document.querySelectorAll(".typeCard").forEach((c) => c.classList.remove("collapsed")));
els.collapseAll.addEventListener("click", () => document.querySelectorAll(".typeCard").forEach((c) => c.classList.add("collapsed")));
els.toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
window.addEventListener("scroll", () => {
  els.toTop.classList.toggle("show", window.scrollY > 400);
  let active = null;
  data.parts.forEach((p) => {
    const c = document.getElementById(partId(p));
    if (c && c.getBoundingClientRect().top <= 120) active = partId(p);
  });
  els.toc.querySelectorAll("a").forEach((a) => a.classList.toggle("active", a.dataset.target === active));
});

setTheme(localStorage.getItem(THEME_KEY) || "light");
renderToc();
render("");
