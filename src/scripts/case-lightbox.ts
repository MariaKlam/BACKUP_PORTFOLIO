// Re-usable lightbox initializer
export default function initLightbox(scopeSelector = ".tokens-case") {
  const scope = document.querySelector(scopeSelector);
  if (!scope) return; // nothing to do on this page

  // Guard against double-initialization
  if (scope.dataset.lbSetup === "1") return;
  scope.dataset.lbSetup = "1";

  const lb = scope.querySelector(".tokens-lightbox");
  if (!lb) return; // no lightbox markup, bail

  const imgEl = lb.querySelector(".tokens-lightbox__img");
  const titleEl = lb.querySelector(".tokens-lightbox__title");
  const capEl = lb.querySelector(".tokens-lightbox__cap");
  const closeBtn = lb.querySelector(".tokens-lightbox__close");
  const prevBtn = lb.querySelector(".tokens-lightbox__prev");
  const nextBtn = lb.querySelector(".tokens-lightbox__next");

  const tiles = Array.from(scope.querySelectorAll(".shot-tile"));
  let currentIndex = -1;
  let lastFocus = null;

  const extractDataFrom = (el) => {
    const carrier = el.closest("[data-full],[data-cap],[data-title]") || el;
    const img = el.tagName === "IMG" ? el : carrier.querySelector("img");
    const src =
      carrier.getAttribute("data-full") || img?.currentSrc || img?.src || "";
    const title = carrier.getAttribute("data-title") || img?.alt || "";
    const cap = carrier.getAttribute("data-cap") || img?.title || "";
    return { src, title, cap };
  };

  function openLightbox(index) {
    currentIndex = index;
    const { src, title, cap } = extractDataFrom(tiles[index]);
    lastFocus = document.activeElement;
    imgEl.src = src;
    titleEl.textContent = title;
    capEl.innerHTML = cap;
    lb.classList.add("is-open");
    document.documentElement.classList.add("tokens-lightbox-open");
    closeBtn?.focus?.();
  }

  function closeLightbox() {
    lb.classList.remove("is-open");
    document.documentElement.classList.remove("tokens-lightbox-open");
    imgEl.src = "";
    titleEl.textContent = "";
    capEl.textContent = "";
    lastFocus?.focus?.();
  }

  const showNext = () => {
    if (currentIndex !== -1) openLightbox((currentIndex + 1) % tiles.length);
  };
  const showPrev = () => {
    if (currentIndex !== -1)
      openLightbox((currentIndex - 1 + tiles.length) % tiles.length);
  };

  // Open on any .shot-tile (or its img) click
  scope.addEventListener("click", (e) => {
    const tile = e.target.closest(".shot-tile");
    if (!tile || !scope.contains(tile)) return;
    e.preventDefault();
    const idx = tiles.indexOf(tile);
    if (idx > -1) openLightbox(idx);
  });

  closeBtn?.addEventListener("click", closeLightbox);
  prevBtn?.addEventListener("click", showPrev);
  nextBtn?.addEventListener("click", showNext);
  lb.addEventListener("click", (e) => {
    if (e.target === lb) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") showNext();
    if (e.key === "ArrowLeft") showPrev();
  });
}
