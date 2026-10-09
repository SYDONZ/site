(() => {
  const root = document.documentElement;
  if (root.classList.contains("m")) {
    const paras = [...document.querySelectorAll("[data-para] img")];
    let queued = false;
    const render = () => {
      queued = false;
      for (const img of paras) {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) continue;
        const k = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        img.style.setProperty("--py", `${(-k * 24).toFixed(1)}px`);
      }
    };
    const request = () => { if (!queued) { queued = true; requestAnimationFrame(render); } };
    addEventListener("scroll", request, { passive: true });
    addEventListener("resize", request);
    request();
  }
  document.querySelector("[data-pc]")?.addEventListener("click", () => { try { sessionStorage.setItem("pc", "1"); } catch {} });
})();
