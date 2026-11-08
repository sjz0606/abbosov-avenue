(() => {
  "use strict";
  const C = window.AA_CONFIG, P = window.AA_PRODUCTS, I = window.AA_I18N;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const byId = Object.fromEntries(P.map(p => [p.id, p]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem("aa." + k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem("aa." + k, JSON.stringify(v)); } catch {} }
  };
  let lang = store.get("lang", (navigator.language || "").startsWith("uz") ? "uz" : "ru");
  let cart = store.get("cart2", []).filter(l => byId[l.id]);
  let filter = "all";

  const t = (k, vars) => {
    let s = (I[lang] && I[lang][k]) ?? I.ru[k] ?? k;
    if (vars) for (const v in vars) s = s.replace("{" + v + "}", vars[v]);
    return s;
  };
  const L = o => (o && typeof o === "object") ? (o[lang] ?? o.ru) : o;
  const money = n => new Intl.NumberFormat("ru-RU").format(n).replace(/ | /g, " ") + " " + L(C.currency);
  const priceOf = p => p.price == null ? t("price.ask") : money(p.price);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- i18n ---------- */
  function applyLang() {
    document.documentElement.lang = lang;
    $$("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$("[data-lang]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    syncSound();
    renderFallback(); renderChips(); renderGrid(); renderBag(); renderDays(); buildWardrobe(false); renderDates(); renderOpenNow();
    document.dispatchEvent(new CustomEvent("aa:lang", { detail: lang }));
  }
  $$("[data-lang]").forEach(b => b.addEventListener("click", () => { lang = b.dataset.lang; store.set("lang", lang); applyLang(); }));
  window.AA = { t: k => t(k), L: o => L(o), priceOf: p => priceOf(p), products: P, open: id => openProduct(id), get lang() { return lang; } };

  /* ---------- header ---------- */
  const burger = $("#burger"), nav = $("#nav"), top = $(".top"), hero = $(".hero");
  burger.addEventListener("click", () => {
    const open = burger.getAttribute("aria-expanded") !== "true";
    burger.setAttribute("aria-expanded", String(open)); nav.classList.toggle("is-open", open); top.classList.toggle("is-menu", open);
  });
  nav.addEventListener("click", e => { if (e.target.closest("a")) { burger.setAttribute("aria-expanded", "false"); nav.classList.remove("is-open"); top.classList.remove("is-menu"); } });
  const onScroll = () => top.classList.toggle("is-solid", scrollY > hero.offsetHeight - 80);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- hero video ---------- */
  const hv = $("#heroVideo"), hs = $("#heroSound");
  if (reduced) { hv.removeAttribute("autoplay"); hv.pause(); }
  function syncSound() { hs.textContent = hv.muted ? t("sound.on") : t("sound.off"); hs.setAttribute("aria-pressed", String(!hv.muted)); }
  hs.addEventListener("click", () => { hv.muted = !hv.muted; if (!hv.muted) hv.play().catch(() => {}); syncSound(); });
  new IntersectionObserver(([e]) => { if (reduced) return; e.isIntersecting ? hv.play().catch(() => {}) : hv.pause(); }).observe(hv);

  /* ---------- reels: ko'rinishda yuklanadi va o'ynaydi ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) { if (!v.src) v.src = v.dataset.src; if (!reduced) v.play().catch(() => {}); }
    else v.pause();
  }), { threshold: .35 });
  $$(".reel").forEach(reel => {
    const v = $("video", reel);
    io.observe(v);
    reel.tabIndex = 0; reel.setAttribute("role", "button");
    reel.addEventListener("click", () => {
      $$(".reel").forEach(o => { if (o !== reel) { $("video", o).muted = true; o.classList.remove("is-sound"); } });
      if (!v.src) v.src = v.dataset.src;
      v.muted = !v.muted; v.play().catch(() => {});
      reel.classList.toggle("is-sound", !v.muted);
    });
    reel.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); reel.click(); } });
  });

  /* ---------- 3D lookbook uchun zaxira lenta (WebGL bo'lmasa) ---------- */
  function renderFallback() {
    const ids = ["suit-brown", "blazer-navy", "denim-overshirt", "jacket-beige", "knit-polo", "puffer", "suit-olive", "tee-black"];
    $("#ringFallback").innerHTML = ids.map(id => byId[id]).map(p =>
      `<li><button type="button" data-open="${p.id}"><img src="${p.img}-sm.jpg" alt="" loading="lazy"><span>${esc(L(p.name))}</span></button></li>`).join("");
  }
  $("#ringFallback").addEventListener("click", e => { const b = e.target.closest("[data-open]"); if (b) openProduct(b.dataset.open); });

  /* ---------- toast ---------- */
  let toastT;
  function toast(msg) { const el = $("#toast"); el.textContent = msg; el.classList.add("is-on"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("is-on"), 2400); }

  /* ---------- catalog ---------- */
  const CATS = ["suits", "jackets", "knit", "outer", "shoes"];
  function renderChips() {
    $("#chips").innerHTML = ["all", ...CATS.filter(c => P.some(p => p.cat === c))].map(c =>
      `<button type="button" class="chip" data-cat="${c}" aria-pressed="${c === filter}">${esc(c === "all" ? t("cat.all") : t("cats." + c))}</button>`).join("");
  }
  $("#chips").addEventListener("click", e => { const b = e.target.closest("[data-cat]"); if (!b) return; filter = b.dataset.cat; renderChips(); renderGrid(); });

  function renderGrid() {
    const list = P.filter(p => filter === "all" || p.cat === filter);
    $("#grid").innerHTML = list.map(p => `
      <li class="card">
        <button type="button" class="card__btn" data-open="${p.id}">
          <span class="card__img"><img src="${p.img}-sm.jpg" alt="" loading="lazy" width="640" height="853">${p.isNew ? `<span class="card__new">${esc(t("card.new"))}</span>` : ""}</span>
          <span class="card__name">${esc(L(p.name))}</span>
          <span class="card__price${p.price == null ? " is-ask" : ""}">${esc(priceOf(p))}</span>
        </button>
      </li>`).join("");
  }
  $("#grid").addEventListener("click", e => { const b = e.target.closest("[data-open]"); if (b) openProduct(b.dataset.open); });

  // kartochkalarda yengil 3D qiyalik (faqat sichqoncha bilan)
  if (!reduced && matchMedia("(hover: hover)").matches) {
    $("#grid").addEventListener("pointermove", e => {
      const c = e.target.closest(".card__img"); if (!c) return;
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
    });
    $("#grid").addEventListener("pointerout", e => { const c = e.target.closest(".card__img"); if (c && !c.contains(e.relatedTarget)) c.style.transform = ""; });
  }

  /* ---------- dialogs ---------- */
  function openDialog(d) { if (!d.open) d.showModal(); document.body.classList.add("is-locked"); }
  function closeDialog(d) { if (d.open) d.close(); }
  $$("dialog").forEach(d => {
    d.addEventListener("close", () => {
      $$("video", d).forEach(v => v.pause());
      if (!$$("dialog").some(x => x.open)) document.body.classList.remove("is-locked");
    });
    d.addEventListener("click", e => { if (e.target === d || e.target.closest("[data-close]")) closeDialog(d); });
  });

  /* ---------- product ---------- */
  let cur = null, curSize = null;
  function openProduct(id) {
    cur = byId[id]; if (!cur) return; curSize = null;
    $("#pdMedia").innerHTML = cur.video && !reduced
      ? `<video src="${cur.video}" poster="${cur.img}.jpg" autoplay muted loop playsinline></video>`
      : `<img src="${cur.img}.jpg" alt="${esc(L(cur.name))}">`;
    $("#pdName").textContent = L(cur.name);
    $("#pdPrice").textContent = priceOf(cur);
    $("#pdDesc").textContent = L(cur.desc);
    $("#pdSizes").innerHTML = cur.sizes.map(s => `<button type="button" class="sz" aria-pressed="false" data-s="${s}">${s}</button>`).join("");
    $("#sizeGuide").hidden = true; $("#sizeGuide").textContent = t(cur.cat === "shoes" ? "guide.shoes" : "guide.cloth");
    $("#pdErr").textContent = "";
    openDialog($("#pd"));
  }
  $("#pdSizes").addEventListener("click", e => {
    const b = e.target.closest("[data-s]"); if (!b) return;
    curSize = b.dataset.s; $$("#pdSizes .sz").forEach(x => x.setAttribute("aria-pressed", String(x === b))); $("#pdErr").textContent = "";
  });
  $("#sizeGuideBtn").addEventListener("click", () => { const g = $("#sizeGuide"); g.hidden = !g.hidden; });
  $("#pdAdd").addEventListener("click", () => {
    if (!curSize) { $("#pdErr").textContent = t("err.size"); $("#pdSizes .sz")?.focus(); return; }
    addToCart(cur.id, curSize, 1); closeDialog($("#pd")); toast(t("pd.added") + ": " + L(cur.name));
  });

  /* ---------- cart ---------- */
  function addToCart(id, size, qty) {
    const key = id + "|" + (size ?? "");
    const line = cart.find(l => l.key === key);
    if (line) line.qty += qty; else cart.push({ key, id, size, qty });
    saveCart();
  }
  function saveCart() { store.set("cart2", cart); renderBag(); }
  const cartTotal = () => cart.reduce((s, l) => s + (byId[l.id].price || 0) * l.qty, 0);
  const askCount = () => cart.filter(l => byId[l.id].price == null).length;
  function renderBag() {
    const n = cart.reduce((s, l) => s + l.qty, 0);
    $("#bagCount").textContent = n; $("#bagCount").classList.toggle("is-on", n > 0);
    $("#bagEmpty").hidden = n > 0; $("#oform").hidden = n === 0;
    $("#bagList").innerHTML = cart.map(l => {
      const p = byId[l.id];
      return `<li class="bl">
        <img src="${p.img}-sm.jpg" alt="">
        <div class="bl__body">
          <p class="bl__name">${esc(L(p.name))}</p>
          <p class="bl__meta">${esc(t("msg.size"))}: ${esc(l.size || "—")}</p>
          <div class="bl__row">
            <div class="qty" role="group" aria-label="${esc(t("qty"))}">
              <button type="button" data-q="-1" data-k="${esc(l.key)}" aria-label="−1">−</button><span>${l.qty}</span><button type="button" data-q="1" data-k="${esc(l.key)}" aria-label="+1">+</button>
            </div>
            <span>${esc(p.price == null ? t("price.ask") : money(p.price * l.qty))}</span>
          </div>
          <button type="button" class="link" data-rm="${esc(l.key)}">${esc(t("remove"))}</button>
        </div>
      </li>`;
    }).join("");
    $("#bagTotal").textContent = money(cartTotal());
    $("#bagDeliv").textContent = askCount() ? t("o.ask", { n: askCount() }) : "";
  }
  $("#bagList").addEventListener("click", e => {
    const q = e.target.closest("[data-q]"), r = e.target.closest("[data-rm]");
    if (q) { const l = cart.find(x => x.key === q.dataset.k); l.qty += +q.dataset.q; if (l.qty < 1) cart = cart.filter(x => x !== l); saveCart(); }
    if (r) { cart = cart.filter(x => x.key !== r.dataset.rm); saveCart(); }
  });
  $("#bagOpen").addEventListener("click", () => openDialog($("#bag")));
  $("#oform").addEventListener("change", e => { if (e.target.name === "how") $("#addrField").hidden = e.target.value !== "delivery"; });

  /* ---------- phone / validation ---------- */
  function normPhone(v) { let d = v.replace(/\D/g, ""); if (d.length === 9) d = "998" + d; return /^998\d{9}$/.test(d) ? "+" + d : null; }
  function fmtPhone(v) {
    let d = v.replace(/\D/g, ""); if (!d.startsWith("998")) d = "998" + d.replace(/^9?9?8?/, ""); d = d.slice(0, 12);
    return "+" + [d.slice(0, 3), d.slice(3, 5), d.slice(5, 8), d.slice(8, 10), d.slice(10, 12)].filter(Boolean).join(" ");
  }
  $$('input[type="tel"]').forEach(i => {
    i.addEventListener("focus", () => { if (!i.value) i.value = "+998 "; });
    i.addEventListener("input", e => { if (e.inputType && e.inputType.startsWith("delete")) return; i.value = fmtPhone(i.value); });
    i.addEventListener("blur", () => { if (i.value.replace(/\D/g, "") === "998") i.value = ""; });
  });
  function check(form, errEl, extra) {
    const nm = form.elements["name"], ph = form.elements["phone"];
    const name = nm.value.trim(), phone = normPhone(ph.value);
    let msg = "", bad = null;
    if (!name) { msg = t("err.name"); bad = nm; }
    else if (!phone) { msg = t("err.phone"); bad = ph; }
    else if (extra) { const r = extra(); if (r) [msg, bad] = r; }
    $$("input", form).forEach(x => x.removeAttribute("aria-invalid"));
    errEl.textContent = msg;
    if (bad) { bad.setAttribute("aria-invalid", "true"); bad.focus(); return null; }
    return { name, phone };
  }

  /* ---------- sending ---------- */
  async function send(kind, title, text, payload) {
    let ok = false;
    if (C.ORDER_ENDPOINT) {
      try {
        const r = await fetch(C.ORDER_ENDPOINT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ kind, lang, text, ...payload, at: new Date().toISOString() }) });
        ok = r.ok;
      } catch { ok = false; }
    }
    if (!ok) { try { await Promise.race([navigator.clipboard.writeText(text), new Promise(r => setTimeout(r, 700))]); } catch {} }
    $("#doneH").textContent = title;
    $("#doneP").textContent = ok ? t("done.sent") : t("done.copy");
    $("#doneTxt").textContent = text; $("#doneTxt").hidden = ok; $("#doneTg").hidden = ok;
    $$("dialog[open]").forEach(closeDialog);
    openDialog($("#done"));
    return ok;
  }

  $("#oform").addEventListener("submit", async e => {
    e.preventDefault(); const f = e.target;
    const v = check(f, $("#oErr"), () => f.how.value === "delivery" && !f.addr.value.trim() ? [t("err.addr"), f.addr] : null);
    if (!v) return;
    const lines = cart.map(l => { const p = byId[l.id]; return `• ${L(p.name)} — ${t("msg.size")} ${l.size || "?"} × ${l.qty} — ${p.price == null ? t("price.ask") : money(p.price * l.qty)}`; });
    const how = f.how.value === "delivery" ? `${t("msg.delivery")}: ${f.addr.value.trim()}` : t("msg.pickup");
    const text = [t("msg.order"), ...lines, `${t("total")}: ${money(cartTotal())}${askCount() ? " + " + t("price.ask").toLowerCase() : ""}`, "", `${v.name}, ${v.phone}`, how, f.comment.value.trim()].join("\n").trim();
    const ok = await send("order", t("done.orderH"), text, { name: v.name, phone: v.phone, items: cart });
    if (ok) { cart = []; saveCart(); f.reset(); }
  });

  /* ---------- wardrobe builder ---------- */
  let days = 5, lastKit = [];
  function renderDays() {
    $("#days").innerHTML = [1, 2, 3, 4, 5, 6].map(n => `<label class="day"><input type="radio" name="days" value="${n}" ${n === days ? "checked" : ""}><span>${n}</span></label>`).join("");
  }
  $("#days").addEventListener("change", e => { days = +e.target.value; buildWardrobe(true); });
  $("#bform").addEventListener("change", e => { if (e.target.name !== "days") buildWardrobe(true); });

  function plan(d, code, travel, winter) {
    const kit = [];
    const add = (id, qty = 1) => { const x = kit.find(i => i.id === id); if (x) x.qty = Math.max(x.qty, qty); else kit.push({ id, qty }); };
    const tees = Math.max(2, Math.min(5, d));
    if (code === "suit") {
      add("suit-brown"); if (d >= 3) add("suit-olive");
      add("knit-polo"); add("tee-black", Math.max(1, tees - 2));
      add("sneaker-brown"); if (d >= 4) add("sneaker-navy");
    } else if (code === "smart") {
      add("blazer-navy"); if (d >= 3) add("jacket-beige"); if (d >= 5) add("suit-brown");
      add("knit-polo"); add("tees-set"); add("tee-black", Math.max(1, tees - 3));
      add("sneaker-navy"); if (d >= 3) add("sneaker-grey");
    } else {
      add("denim-overshirt"); add("tees-set"); add("tee-black", Math.max(1, tees - 3));
      if (d >= 3) add("knit-polo"); if (d >= 4) add("blazer-navy");
      add("sneaker-grey"); if (d >= 4) add("sneaker-navy");
    }
    if (travel) { add("suit-olive"); add("sneaker-navy"); }
    if (winter) add("puffer");
    return kit;
  }
  // obrazlar soni: ustki qatlam × ichki kiyim × shim × poyabzal
  function looks(kit) {
    const n = cat => kit.filter(k => byId[k.id].cat === cat).length;
    const layers = n("suits") + n("jackets") + n("outer") + 1;
    const tops = n("knit") + (kit.some(k => k.id === "tees-set") ? 4 : 0);
    const bottoms = Math.max(1, n("suits") + (kit.some(k => k.id === "denim-overshirt") ? 1 : 0));
    return layers * Math.max(1, tops) * bottoms * Math.max(1, n("shoes"));
  }
  function buildWardrobe(animate) {
    const f = $("#bform");
    const kit = plan(days, f.code.value, f.travel.checked, f.winter.checked);
    lastKit = kit;
    const known = kit.filter(k => byId[k.id].price != null), ask = kit.length - known.length;
    const sum = known.reduce((s, k) => s + byId[k.id].price * k.qty, 0);
    $("#rLooks").textContent = looks(kit);
    $("#rItems").textContent = kit.reduce((s, k) => s + k.qty, 0);
    $("#rTotal").textContent = (sum ? t("b.from", { x: money(sum) }) : "") + (ask ? t("b.plusAsk", { n: ask }) : "");
    const rail = $("#rail");
    rail.innerHTML = kit.map((k, i) => {
      const p = byId[k.id];
      return `<button type="button" class="hang" data-open="${p.id}" style="--i:${i}">
        <span class="hang__img"><img src="${p.img}-sm.jpg" alt="" loading="lazy">${k.qty > 1 ? `<span class="hang__q">×${k.qty}</span>` : ""}</span>
        <span class="hang__name">${esc(L(p.name))}</span>
      </button>`;
    }).join("");
    if (animate && !reduced) { rail.classList.remove("is-swing"); void rail.offsetWidth; rail.classList.add("is-swing"); }
  }
  $("#rail").addEventListener("click", e => { const b = e.target.closest("[data-open]"); if (b) openProduct(b.dataset.open); });
  $("#bToBag").addEventListener("click", () => {
    lastKit.forEach(k => addToCart(k.id, null, k.qty));
    toast(t("b.added", { n: lastKit.reduce((s, k) => s + k.qty, 0) })); openDialog($("#bag"));
  });
  $("#bToStylist").addEventListener("click", () => {
    const f = $("#bform");
    const code = t({ suit: "b.suit", smart: "b.smart", casual: "b.casual" }[f.code.value]);
    const text = [t("b.stylistMsg"), `${t("b.q1")} ${days}`, code, f.travel.checked ? t("b.travel") : "", f.winter.checked ? t("b.winter") : "", "",
      ...lastKit.map(k => `• ${L(byId[k.id].name)}${k.qty > 1 ? " ×" + k.qty : ""}`)].filter(Boolean).join("\n");
    send("stylist", t("done.stylistH"), text, { kit: lastKit });
  });

  /* ---------- fitting (Toshkent vaqti, UTC+5) ---------- */
  const tashNow = () => { const n = new Date(); return new Date(n.getTime() + (n.getTimezoneOffset() + 300) * 60000); };
  let selDate = null, selSlot = null;
  function renderDates() {
    const now = tashNow(), fmt = new Intl.DateTimeFormat(lang === "uz" ? "uz-Latn-UZ" : "ru-RU", { weekday: "short", day: "numeric" });
    const list = [];
    for (let i = 0; i < 8 && list.length < 7; i++) {
      const d = new Date(now); d.setDate(now.getDate() + i);
      if (i === 0 && now.getHours() >= Math.max(...C.fittingSlots)) continue;
      list.push(d);
    }
    if (!selDate || !list.some(d => d.toDateString() === selDate)) selDate = list[0].toDateString();
    const tom = new Date(now.getTime() + 864e5).toDateString();
    $("#dates").innerHTML = list.map(d => {
      const ds = d.toDateString(), label = ds === now.toDateString() ? t("f.today") : ds === tom ? t("f.tomorrow") : "";
      return `<label class="date"><input type="radio" name="date" value="${ds}" ${ds === selDate ? "checked" : ""}><span><b>${esc(fmt.format(d))}</b>${label ? `<small>${esc(label)}</small>` : ""}</span></label>`;
    }).join("");
    renderSlots();
  }
  function renderSlots() {
    const now = tashNow(), isToday = selDate === now.toDateString();
    $("#slots").innerHTML = C.fittingSlots.map(h => {
      const past = isToday && h <= now.getHours(); if (past && selSlot === h) selSlot = null;
      return `<label class="slot"><input type="radio" name="slot" value="${h}" ${past ? "disabled" : ""} ${selSlot === h ? "checked" : ""}><span>${String(h).padStart(2, "0")}:00</span></label>`;
    }).join("");
  }
  $("#dates").addEventListener("change", e => { selDate = e.target.value; renderSlots(); });
  $("#slots").addEventListener("change", e => { selSlot = +e.target.value; $("#fErr").textContent = ""; });
  $("#fform").addEventListener("submit", e => {
    e.preventDefault(); const f = e.target;
    const v = check(f, $("#fErr"), () => selSlot == null ? [t("err.slot"), $("#slots input:not(:disabled)")] : null);
    if (!v) return;
    const d = new Date(selDate);
    const dStr = new Intl.DateTimeFormat(lang === "uz" ? "uz-Latn-UZ" : "ru-RU", { weekday: "long", day: "numeric", month: "long" }).format(d);
    const svc = t({ fit: "f.s1", suit: "f.s2", alter: "f.s3" }[f.service.value]);
    const text = [t("msg.fit"), `${dStr}, ${String(selSlot).padStart(2, "0")}:00`, svc, `${v.name}, ${v.phone}`].join("\n");
    send("fitting", t("done.fitH"), text, { name: v.name, phone: v.phone, date: d.toISOString().slice(0, 10), hour: selSlot, service: f.service.value })
      .then(ok => { if (ok) { f.reset(); selSlot = null; renderSlots(); } });
  });

  function renderOpenNow() {
    const h = tashNow().getHours(), open = h >= C.hours.open && h < C.hours.close;
    const el = $("#openNow"); el.textContent = open ? t("bo.open") : t("bo.closed"); el.classList.toggle("is-open", open);
  }

  $("#cform").addEventListener("submit", e => {
    e.preventDefault(); const f = e.target;
    const v = check(f, $("#cErr")); if (!v) return;
    const text = [t("msg.job"), `${v.name}, ${v.phone}`, f.exp.value.trim()].filter(Boolean).join("\n");
    send("job", t("done.jobH"), text, { name: v.name, phone: v.phone, exp: f.exp.value.trim() }).then(ok => ok && f.reset());
  });

  applyLang();
  setInterval(renderOpenNow, 60000);
})();
