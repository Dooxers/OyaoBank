(() => {
  "use strict";

  /* =========================================================
     Oyao Bank (Demo): a design practice project.
     All names, balances and transactions are made up.
     Nothing here connects to a real bank or moves real money.
     ========================================================= */

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const money = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
  const fmt = (n) => money.format(n);
  const DAY = 86400000;

  const CATS = {
    Food:      { color: "#fbbf24" },
    Transport: { color: "#60a5fa" },
    Bills:     { color: "#f472b6" },
    Shopping:  { color: "#a78bfa" },
    Fun:       { color: "#34d399" },
    Transfer:  { color: "#94a3b8" },
    Income:    { color: "#5eead4" },
  };

  const CONTACTS = ["Sam Reyes", "Mia Cruz", "Leo Tan", "Ana Lim"];
  const BILLERS = ["City Electric", "Water District", "Internet Plan", "Mobile Load"];

  // Fictional merchants only
  const SEED = [
    { name: "Kape Corner",              cat: "Food",      amt: -185,    d: 0 },
    { name: "Ride Go",                  cat: "Transport", amt: -142,    d: 1 },
    { name: "Mart Express",             cat: "Shopping",  amt: -1260.5, d: 1 },
    { name: "Monthly Pay (Demo Co.)",   cat: "Income",    amt: 28000,   d: 2 },
    { name: "Streamly Subscription",    cat: "Fun",       amt: -249,    d: 2 },
    { name: "City Electric",            cat: "Bills",     amt: -2140,   d: 3 },
    { name: "Noodle House",             cat: "Food",      amt: -320,    d: 3 },
    { name: "Freelance Payment",        cat: "Income",    amt: 4500,    d: 4 },
    { name: "Ride Go",                  cat: "Transport", amt: -98,     d: 4 },
    { name: "Pocket Pharmacy",          cat: "Shopping",  amt: -540,    d: 5 },
    { name: "Water District",           cat: "Bills",     amt: -620,    d: 6 },
    { name: "Cinema Hub",               cat: "Fun",       amt: -450,    d: 6 },
    { name: "Bakery Lane",              cat: "Food",      amt: -95,     d: 7 },
    { name: "Transfer from Sam",        cat: "Income",    amt: 1000,    d: 9 },
    { name: "Internet Plan",            cat: "Bills",     amt: -1499,   d: 12 },
    { name: "Book Nook",                cat: "Shopping",  amt: -780,    d: 15 },
  ];

  const START_BALANCE = 12450.75;
  let nextId = 1;
  let state;

  function freshState() {
    const now = Date.now();
    nextId = 1;
    return {
      balance: START_BALANCE,
      hidden: false,
      filter: "all",
      query: "",
      view: "home",
      tx: SEED.map((t, i) => ({
        id: nextId++,
        name: t.name,
        cat: t.cat,
        amount: t.amt,
        time: now - t.d * DAY - ((i * 17) % 90) * 60000,
      })),
    };
  }

  /* ---------- Helpers ---------- */
  function startOfDay(ts) {
    const d = new Date(ts);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  function dayLabel(ts) {
    const diff = Math.round((startOfDay(Date.now()) - startOfDay(ts)) / DAY);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return new Date(ts).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  }

  function makeRow(t, i) {
    const li = document.createElement("li");
    li.className = "tx" + (t.fresh ? " fresh" : "");
    li.style.setProperty("--i", String(Math.min(i, 12)));

    const color = (CATS[t.cat] || CATS.Transfer).color;
    const ic = document.createElement("span");
    ic.className = "tx-ic";
    ic.textContent = t.name.trim().charAt(0).toUpperCase();
    ic.style.background = color + "26";
    ic.style.color = color;

    const info = document.createElement("div");
    info.className = "tx-info";
    const name = document.createElement("span");
    name.className = "tx-name";
    name.textContent = t.name;
    const meta = document.createElement("span");
    meta.className = "tx-meta";
    meta.textContent = `${t.cat} · ${dayLabel(t.time)}`;
    info.append(name, meta);

    const amt = document.createElement("span");
    amt.className = "tx-amt" + (t.amount > 0 ? " in" : "");
    amt.textContent = (t.amount > 0 ? "+" : "−") + fmt(Math.abs(t.amount));

    li.append(ic, info, amt);
    t.fresh = false;
    return li;
  }

  /* ---------- Balance (count-up) ---------- */
  let shown = 0;
  let raf = 0;

  function setBalance(animate = true) {
    const el = $("#balance");
    cancelAnimationFrame(raf);

    if (state.hidden) {
      el.textContent = "₱ ••••••";
      shown = state.balance;
      return;
    }
    if (!animate || reduced) {
      el.textContent = fmt(state.balance);
      shown = state.balance;
      return;
    }

    const from = shown;
    const to = state.balance;
    const t0 = performance.now();
    const dur = 900;

    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      shown = from + (to - from) * e;
      el.textContent = fmt(shown);
      if (p < 1) raf = requestAnimationFrame(step);
      else { shown = to; el.textContent = fmt(to); }
    };
    raf = requestAnimationFrame(step);
  }

  /* ---------- Renderers ---------- */
  function renderStats() {
    const since = Date.now() - 30 * DAY;
    let income = 0;
    let spent = 0;
    state.tx.forEach((t) => {
      if (t.time < since) return;
      if (t.amount > 0) income += t.amount;
      else spent += -t.amount;
    });
    $("#stat-in").textContent = fmt(income);
    $("#stat-out").textContent = fmt(spent);
  }

  function renderRecent() {
    const ul = $("#recent");
    ul.replaceChildren();
    state.tx.slice(0, 6).forEach((t, i) => ul.appendChild(makeRow(t, i)));
  }

  function renderActivity() {
    const ul = $("#activity");
    ul.replaceChildren();

    const q = state.query.trim().toLowerCase();
    const list = state.tx.filter((t) => {
      if (state.filter === "in" && t.amount <= 0) return false;
      if (state.filter === "out" && t.amount >= 0) return false;
      if (q && !(t.name.toLowerCase().includes(q) || t.cat.toLowerCase().includes(q))) return false;
      return true;
    });

    if (!list.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "No matching activity.";
      ul.appendChild(li);
      return;
    }

    let lastLabel = "";
    list.forEach((t, i) => {
      const label = dayLabel(t.time);
      if (label !== lastLabel) {
        const h = document.createElement("li");
        h.className = "day";
        h.textContent = label;
        ul.appendChild(h);
        lastLabel = label;
      }
      ul.appendChild(makeRow(t, i));
    });
  }

  function svgEl(name, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  function renderInsights() {
    const since = Date.now() - 30 * DAY;
    const byCat = {};
    let total = 0;
    state.tx.forEach((t) => {
      if (t.amount < 0 && t.time >= since) {
        byCat[t.cat] = (byCat[t.cat] || 0) + -t.amount;
        total += -t.amount;
      }
    });
    const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

    /* Donut */
    const svg = $("#donut");
    svg.replaceChildren();
    const R = 48;
    const C = 2 * Math.PI * R;
    svg.appendChild(svgEl("circle", { class: "track", cx: 60, cy: 60, r: R }));

    let offset = 0;
    const arcs = [];
    entries.forEach(([cat, val]) => {
      const len = total ? (val / total) * C : 0;
      const c = svgEl("circle", {
        cx: 60, cy: 60, r: R,
        stroke: (CATS[cat] || CATS.Transfer).color,
        "stroke-dasharray": `0 ${C}`,
        "stroke-dashoffset": String(-offset),
        "stroke-linecap": "butt",
      });
      svg.appendChild(c);
      arcs.push({ c, len });
      offset += len;
    });
    // gentle gap between segments
    requestAnimationFrame(() => requestAnimationFrame(() => {
      arcs.forEach(({ c, len }) => {
        const gap = arcs.length > 1 ? 1.5 : 0;
        c.setAttribute("stroke-dasharray", `${Math.max(len - gap, 0)} ${C}`);
      });
    }));

    $("#donut-total").textContent = fmt(total);

    const legend = $("#legend");
    legend.replaceChildren();
    entries.forEach(([cat, val]) => {
      const li = document.createElement("li");
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.style.background = (CATS[cat] || CATS.Transfer).color;
      const n = document.createElement("span");
      n.className = "l-name";
      n.textContent = cat;
      const v = document.createElement("span");
      v.className = "l-val";
      v.textContent = fmt(val);
      const p = document.createElement("span");
      p.className = "l-pct";
      p.textContent = total ? Math.round((val / total) * 100) + "%" : "0%";
      li.append(dot, n, v, p);
      legend.appendChild(li);
    });

    /* Weekly bars */
    const bars = $("#bars");
    bars.replaceChildren();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const day = startOfDay(Date.now() - i * DAY);
      let sum = 0;
      state.tx.forEach((t) => {
        if (t.amount < 0 && startOfDay(t.time) === day) sum += -t.amount;
      });
      days.push({ day, sum, today: i === 0 });
    }
    const max = Math.max(...days.map((d) => d.sum), 1);
    const weekSum = days.reduce((a, d) => a + d.sum, 0);
    $("#week-total").textContent = fmt(weekSum) + " spent";

    const barEls = [];
    days.forEach((d) => {
      const col = document.createElement("div");
      col.className = "bar-col" + (d.today ? " today" : "");
      const label = new Date(d.day).toLocaleDateString("en-PH", { weekday: "short" });
      col.title = `${label}: ${fmt(d.sum)}`;

      const track = document.createElement("div");
      track.className = "bar-track";
      const bar = document.createElement("div");
      bar.className = "bar";
      track.appendChild(bar);

      const l = document.createElement("span");
      l.className = "bar-label";
      l.textContent = label;

      col.append(track, l);
      bars.appendChild(col);
      barEls.push({ bar, pct: (d.sum / max) * 100 });
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      barEls.forEach(({ bar, pct }) => { bar.style.height = Math.max(pct, 2) + "%"; });
    }));
  }

  function renderAll(animateBalance = true) {
    setBalance(animateBalance);
    renderStats();
    renderRecent();
    renderActivity();
    if (state.view === "insights") renderInsights();
  }

  /* ---------- Header ---------- */
  function renderHeader() {
    const h = new Date().getHours();
    const part = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    $("#greeting").textContent = `${part}, Demo User`;
    $("#date").textContent = new Date().toLocaleDateString("en-PH", {
      weekday: "long", month: "long", day: "numeric",
    });
  }

  /* ---------- Navigation ---------- */
  function setView(name) {
    state.view = name;
    $$(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
    $$("[data-view]").forEach((b) => {
      const on = b.dataset.view === name;
      b.classList.toggle("active", on);
      if (on) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    if (name === "insights") renderInsights();
    if (name === "activity") renderActivity();
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }

  $$("[data-view]").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
  $$("[data-view-link]").forEach((b) => b.addEventListener("click", () => setView(b.dataset.viewLink)));

  /* ---------- Theme ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    $("#theme").setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
    $("#theme use").setAttribute("href", t === "dark" ? "#i-sun" : "#i-moon");
    try { localStorage.setItem("oyao-pay-theme", t); } catch (e) { /* ignore */ }
  }
  $("#theme").addEventListener("click", () => {
    applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
  });

  /* ---------- Balance visibility ---------- */
  $("#toggle-balance").addEventListener("click", (e) => {
    state.hidden = !state.hidden;
    const btn = e.currentTarget;
    btn.setAttribute("aria-pressed", String(state.hidden));
    btn.setAttribute("aria-label", state.hidden ? "Show balance" : "Hide balance");
    $("use", btn).setAttribute("href", state.hidden ? "#i-eye-off" : "#i-eye");
    shown = state.balance;
    setBalance(false);
  });

  /* ---------- Card tilt ---------- */
  const card = $("#card");
  if (!reduced && matchMedia("(hover: hover)").matches) {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--ry", ((x - 0.5) * 14).toFixed(2) + "deg");
      card.style.setProperty("--rx", ((0.5 - y) * 14).toFixed(2) + "deg");
      card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  }

  /* ---------- Activity filters ---------- */
  $("#search").addEventListener("input", (e) => {
    state.query = e.target.value;
    renderActivity();
  });
  $$(".chip[data-filter]").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.filter = chip.dataset.filter;
      $$(".chip[data-filter]").forEach((c) => {
        const on = c === chip;
        c.classList.toggle("active", on);
        c.setAttribute("aria-pressed", String(on));
      });
      renderActivity();
    });
  });

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3400);
  }

  /* ---------- Action sheet ---------- */
  const modal = $("#modal");
  const form = $("#tx-form");
  const errEl = $("#form-error");
  let mode = null;
  let lastFocus = null;

  const MODES = {
    send:    { title: "Send money",  cta: "Send",         recipient: true,  biller: false, deduct: true },
    topup:   { title: "Top up",      cta: "Add money",    recipient: false, biller: false, deduct: false },
    bill:    { title: "Pay a bill",  cta: "Pay bill",     recipient: false, biller: true,  deduct: true },
    request: { title: "Request money", cta: "Send request", recipient: true, biller: false, deduct: false },
  };

  CONTACTS.forEach((n) => $("#recipient").add(new Option(n, n)));
  BILLERS.forEach((n) => $("#biller").add(new Option(n, n)));

  function openModal(m) {
    mode = m;
    const cfg = MODES[m];
    $("#modal-title").textContent = cfg.title;
    $("#submit").textContent = cfg.cta;
    $("#f-recipient").hidden = !cfg.recipient;
    $("#f-biller").hidden = !cfg.biller;
    errEl.textContent = "";
    form.reset();
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    requestAnimationFrame(() => {
      modal.classList.add("open");
      $("#amount").focus();
    });
  }

  function closeModal() {
    modal.classList.remove("open");
    document.body.classList.remove("modal-open");
    setTimeout(() => {
      modal.hidden = true;
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }, 200);
  }

  $$("[data-action]").forEach((b) => b.addEventListener("click", () => openModal(b.dataset.action)));
  $$("[data-close]").forEach((b) => b.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });
  $$("#quick [data-amt]").forEach((b) => {
    b.addEventListener("click", () => { $("#amount").value = b.dataset.amt; errEl.textContent = ""; });
  });

  function showErr(msg) {
    errEl.textContent = msg;
    $("#amount").focus();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const amount = Math.round(parseFloat($("#amount").value) * 100) / 100;

    if (!Number.isFinite(amount) || amount <= 0) return showErr("Enter an amount greater than zero.");
    if (amount > 1000000) return showErr("The demo limit is ₱1,000,000 per action.");

    const cfg = MODES[mode];
    if (cfg.deduct && amount > state.balance) return showErr("Not enough demo balance.");

    let name, cat, signed;
    if (mode === "send") {
      name = "Sent to " + $("#recipient").value; cat = "Transfer"; signed = -amount;
    } else if (mode === "bill") {
      name = $("#biller").value; cat = "Bills"; signed = -amount;
    } else if (mode === "topup") {
      name = "Demo top-up"; cat = "Income"; signed = amount;
    } else {
      toast(`Request for ${fmt(amount)} sent to ${$("#recipient").value} (demo).`);
      closeModal();
      return;
    }

    state.tx.unshift({ id: nextId++, name, cat, amount: signed, time: Date.now(), fresh: true });
    state.balance = Math.round((state.balance + signed) * 100) / 100;
    closeModal();
    renderAll(true);
    toast("Done (demo). No real money moved.");
  });

  /* ---------- Reset ---------- */
  $("#reset").addEventListener("click", () => {
    state = freshState();
    shown = 0;
    const btn = $("#toggle-balance");
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", "Hide balance");
    $("use", btn).setAttribute("href", "#i-eye");
    $("#search").value = "";
    $$(".chip[data-filter]").forEach((c) => {
      const on = c.dataset.filter === "all";
      c.classList.toggle("active", on);
      c.setAttribute("aria-pressed", String(on));
    });
    renderAll(true);
    toast("Demo reset to the sample data.");
  });

  /* ---------- Init ---------- */
  state = freshState();
  applyTheme(document.documentElement.getAttribute("data-theme") || "dark");
  renderHeader();
  renderAll(true);
})();