(() => {
  const box = document.querySelector(".lightbox");
  if (!box || typeof box.showModal !== "function") return;
  let triggers = [];
  const visible = () => [...document.querySelectorAll("[data-zoom]")].filter((t) => t.offsetParent !== null);

  const stage = box.querySelector(".lightbox__stage");
  const cap = box.querySelector(".lightbox__cap");
  const src = box.querySelector(".lightbox__src");
  const count = box.querySelector(".lightbox__count");
  let index = 0;

  const picture = (t) => {
    const base = t.dataset.zoom;
    const widths = (t.dataset.widths || "").split(/\s+/).filter(Boolean).map(Number);
    const srcset = (ext) => widths.map((w) => `${base}-${w}.${ext} ${w}w`).join(", ");
    const pic = document.createElement("picture");
    for (const [ext, type] of [["avif", "image/avif"]]) {
      const s = document.createElement("source");
      s.type = type;
      s.srcset = srcset(ext);
      s.sizes = "100vw";
      pic.append(s);
    }
    const img = document.createElement("img");
    img.src = t.getAttribute("href");
    img.alt = t.dataset.caption || "";
    img.decoding = "async";
    pic.append(img);
    return pic;
  };

  const show = (i) => {
    index = (i + triggers.length) % triggers.length;
    const t = triggers[index];
    stage.replaceChildren(picture(t));
    cap.textContent = t.dataset.caption || "";
    src.textContent = t.dataset.source || "";
    count.textContent = `${index + 1} / ${triggers.length}`;
  };

  const open = (i) => {
    show(i);
    box.dataset.single = String(triggers.length < 2);
    box.showModal();
    requestAnimationFrame(() => box.classList.add("is-shown"));
  };

  const close = () => {
    box.classList.remove("is-shown");
    box.close();
  };

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-zoom]");
    if (!t) return;
    e.preventDefault();
    triggers = visible().filter((x) => x.dataset.group === t.dataset.group);
    open(triggers.indexOf(t));
  });
  box.querySelector(".lightbox__close").addEventListener("click", close);
  box.querySelector(".lightbox__prev").addEventListener("click", () => show(index - 1));
  box.querySelector(".lightbox__next").addEventListener("click", () => show(index + 1));
  box.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });
  box.addEventListener("click", (e) => {
    if (e.target === box || e.target === stage) close();
  });
  box.addEventListener("close", () => box.classList.remove("is-shown"));
})();
