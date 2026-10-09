(() => {
  const root = document.documentElement;
  const motion = root.classList.contains("m");
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const nav = $(".nav");

  
  const split = (el) => {
    if (el.dataset.done) return;
    el.dataset.done = "1";
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, ""));
    let i = 0;
    const lines = [];
    let line = document.createElement("span"); line.className = "ln"; line.setAttribute("aria-hidden", "true");
    for (const node of [...el.childNodes]) {
      if (node.nodeType === 1 && node.tagName === "BR") { lines.push(line); line = document.createElement("span"); line.className = "ln"; line.setAttribute("aria-hidden", "true"); continue; }
      const text = node.textContent;
      const wrap = node.nodeType === 1 ? node.cloneNode(false) : null;
      const target = wrap || line;
      for (const c of text) {
        if (/\s/.test(c)) continue;
        const s = document.createElement("span"); s.className = "ch"; s.textContent = c; s.style.setProperty("--i", i++);
        target.append(s);
      }
      if (wrap) line.append(wrap);
    }
    lines.push(line);
    el.replaceChildren(...lines);
  };
  if (motion) $$("[data-split]").forEach(split);

  
  if (motion && "IntersectionObserver" in window) {
    $$(".works, .rooms, .registry, .rows").forEach((g) => [...g.children].forEach((c, i) => c.style.setProperty("--i", i)));
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }, { rootMargin: "0px 0px -10% 0px" });
    $$("[data-r], [data-split]").forEach((el) => { if (!el.closest(".hero")) io.observe(el); });
    requestAnimationFrame(() => $$(".hero [data-split]").forEach((el, k) => { el.style.setProperty("--d0", `${160 + k * 260}ms`); el.classList.add("in"); }));
  }

  
  const sections = $$("[data-section]");
  const links = $$(".nav [data-to]");
  const navScene = () => {
    const line = nav.offsetHeight + 1;
    nav.dataset.scrolled = String(scrollY > 20);
    nav.dataset.hero = String(scrollY < innerHeight * .7);
    const toned = document.elementsFromPoint?.(innerWidth / 2, line + 2)?.find((el) => el.closest?.("[data-tone]"))?.closest("[data-tone]");
    nav.dataset.tone = toned?.dataset.tone || "light";
    let cur = null;
    for (const s of sections) if (s.getBoundingClientRect().top <= innerHeight * .4) cur = s;
    const ids = cur ? [cur.dataset.section, cur.dataset.group] : [];
    links.forEach((a) => ids.includes(a.dataset.to) ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current"));
    const max = root.scrollHeight - innerHeight;
    nav.style.setProperty("--p", max > 0 ? (scrollY / max).toFixed(4) : 0);
  };

  
  const plates = $$(".plate").map((fig) => ({
    fig, last: -1,
    parts: $$(".plate__world [data-t0]", fig).map((el) => ({ el, t0: +el.dataset.t0, t1: Math.max(+el.dataset.t1, +el.dataset.t0 + .004), last: -1 })),
  }));
  const draw = (pl, p) => {
    if (Math.abs(p - pl.last) < .0015) return;
    pl.last = p;
    pl.fig.style.setProperty("--pe", easeInOut(clamp(p / .92)).toFixed(4));
    const q = clamp(p / .85);
    for (const part of pl.parts) {
      const a = clamp((q - part.t0) / (part.t1 - part.t0));
      if (a === part.last) continue;
      part.last = a;
      part.el.style.setProperty("--a", a.toFixed(3));
    }
  };
  const plateScene = () => {
    for (const pl of plates) {
      const r = pl.fig.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) continue;
      draw(pl, motion ? clamp((innerHeight - (r.top + r.height / 2)) / (innerHeight * .62)) : 1);
    }
  };
  if (!motion) plates.forEach((pl) => draw(pl, 1));

  
  const strip = $("[data-strip]");
  let stripScene = () => {};
  if (strip && motion) {
    const stick = $(".strip__stick", strip), track = $(".strip__track", strip);
    const count = $(".strip__count b", strip), boards = $$(".board", strip);
    let top = 0, travel = 0, active = -1;
    const narrow = matchMedia("(max-width: 720px)");
    const measure = () => {
      if (narrow.matches) { strip.style.removeProperty("--travel"); return; }
      travel = Math.max(0, track.scrollWidth - innerWidth + 2 * parseFloat(getComputedStyle(root).getPropertyValue("--edge")));
      strip.style.setProperty("--travel", `${travel}px`);
      top = strip.getBoundingClientRect().top + scrollY;
    };
    stripScene = () => {
      if (narrow.matches) return;
      const p = clamp((scrollY - top) / Math.max(1, travel));
      track.style.transform = `translate3d(${(-p * travel).toFixed(1)}px,0,0)`;
      const mid = innerWidth / 2 + p * travel;
      let best = 0, bd = Infinity;
      boards.forEach((b, i) => { const d = Math.abs(b.offsetLeft + b.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
      if (best !== active) { active = best; count.textContent = String(best + 1).padStart(2, "0"); }
    };
    addEventListener("resize", measure);
    addEventListener("load", measure);
    document.fonts?.ready.then(measure);
    measure();
  }

  
  const preview = $(".idx__preview");
  if (preview && matchMedia("(hover: hover)").matches) {
    const img = $("img", preview);
    let x = 0, y = 0, tx = 0, ty = 0, on = false, raf = 0;
    const tick = () => { tx += (x - tx) * .14; ty += (y - ty) * .14; preview.style.left = `${tx}px`; preview.style.top = `${ty}px`; if (on || Math.abs(x - tx) > .5) raf = requestAnimationFrame(tick); else raf = 0; };
    $$(".idx__list a").forEach((a) => {
      a.addEventListener("pointerenter", (e) => { img.src = a.dataset.preview; on = true; preview.classList.add("is-on"); x = e.clientX; y = e.clientY; if (!raf) tick(); });
      a.addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; });
      a.addEventListener("pointerleave", () => { on = false; preview.classList.remove("is-on"); });
    });
  }

  
  $$("[data-band]").forEach((band) => {
    const meta = document.createElement("div"); meta.className = "band__meta"; meta.hidden = true;
    meta.innerHTML = `<p class="band__count"><b>01</b> / ${String(band.children.length).padStart(2, "0")}</p><i class="band__bar"><b></b></i>`;
    band.after(meta);
    const num = $("b", meta), items = [...band.children];
    const update = () => {
      const max = band.scrollWidth - band.clientWidth;
      meta.hidden = max < 8 || getComputedStyle(band).overflowX === "visible";
      if (meta.hidden) return;
      meta.style.setProperty("--p", clamp(Math.abs(band.scrollLeft) / max).toFixed(3));
      const r = band.getBoundingClientRect(), mid = r.left + Math.min(r.width, innerWidth - r.left) / 2;
      let best = 0, bd = Infinity;
      items.forEach((el, i) => { const b = el.getBoundingClientRect(); const d = Math.abs(b.left + b.width / 2 - mid); if (d < bd) { bd = d; best = i; } });
      num.textContent = String(best + 1).padStart(2, "0");
    };
    band.addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    addEventListener("load", update);
    document.fonts?.ready.then(update);
    update();
  });

  
  if (motion && matchMedia("(hover: hover)").matches) {
    $$("[data-tilt]").forEach((el) => {
      const card = $(".zoom", el);
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.transform = `rotateX(${(.5 - y) * 7}deg) rotateY(${(x - .5) * 9}deg)`;
      });
      el.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  
  $$("[data-drag]").forEach((g) => {
    let x0 = 0, s0 = 0, moved = 0, down = false;
    g.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse" || e.button !== 0) return; down = true; moved = 0; x0 = e.clientX; s0 = g.scrollLeft; });
    addEventListener("pointermove", (e) => { if (!down) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) { g.classList.add("is-dragging"); moved = Math.abs(dx); } g.scrollLeft = s0 - dx; });
    addEventListener("pointerup", () => { if (!down) return; down = false; requestAnimationFrame(() => g.classList.remove("is-dragging")); });
    g.addEventListener("click", (e) => { if (moved > 4) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
  });

  
  let lenis = null;
  if (motion && window.Lenis && !matchMedia("(pointer: coarse)").matches) lenis = new Lenis({ lerp: .1, wheelMultiplier: 1, autoRaf: true });
  const scrollToEl = (el, offset = -nav.offsetHeight) => {
    if (lenis) lenis.scrollTo(el, { offset, duration: 1.4 });
    else scrollTo({ top: el.getBoundingClientRect().top + scrollY + offset, behavior: motion ? "smooth" : "auto" });
  };
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href^='#']");
    if (!a) return;
    const target = document.getElementById(a.getAttribute("href").slice(1));
    if (!target) return;
    e.preventDefault();
    if (a.getAttribute("href") === "#top") scrollToEl(document.body, 0); else scrollToEl(target);
    history.replaceState(null, "", a.getAttribute("href"));
  });

  
  const reader = $(".reader"), body = reader?.querySelector(".reader__content");
  let opener = null;
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-reader]");
    if (!btn || !reader) return;
    const tpl = document.getElementById(btn.dataset.reader);
    if (!tpl) return;
    opener = btn; body.replaceChildren(tpl.content.cloneNode(true)); reader.showModal(); lenis?.stop(); reader.scrollTop = 0;
  });
  reader?.querySelector(".reader__close").addEventListener("click", () => reader.close());
  reader?.addEventListener("click", (e) => { if (e.target === reader) reader.close(); });
  reader?.addEventListener("close", () => { lenis?.start(); opener?.focus(); });
  $(".lightbox")?.addEventListener("close", () => lenis?.start());
  document.addEventListener("click", (e) => { if (e.target.closest("[data-zoom]")) lenis?.stop(); });

  
  let queued = false;
  const render = () => { queued = false; navScene(); plateScene(); stripScene(); };
  const request = () => { if (!queued) { queued = true; requestAnimationFrame(render); } };
  addEventListener("scroll", request, { passive: true });
  addEventListener("resize", request);
  addEventListener("load", request);
  request();
})();
