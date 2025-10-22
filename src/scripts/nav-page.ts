/* Minimal, framework-agnostic wiring for your demo UI
   Safe to call multiple times (guards prevent double-binding) */

const ready = (fn: () => void) =>
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", fn, { once: true })
    : fn();

const $ = <T extends Element = HTMLElement>(
  s: string,
  r: ParentNode = document
) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(
  s: string,
  r: ParentNode = document
) => Array.from(r.querySelectorAll<T>(s));

export function initNavLite() {
  // avoid rebinding when Astro rehydrates / swaps pages
  if ((document.body as any)._navLiteInit) return;
  (document.body as any)._navLiteInit = true;

  ready(() => {
    wireLayoutToggle();
    wireCaretOpeners();
    wireHamburger();
    wireCompanySubmenus();
    wireSupportPanel();
    wireCompanySearch();
  });
}

/* 0) Sidebar <-> Topnav toggle (covers both of your first two inline scripts) */
function wireLayoutToggle() {
  if ((document.body as any)._navLiteLayout) return;
  (document.body as any)._navLiteLayout = true;

  document.addEventListener("click", (e) => {
    const btn = (e.target as Element).closest("[data-toggle-menu]");
    if (!btn) return;

    // flip on <body>
    document.body.classList.toggle("menu--sidebar");
    document.body.classList.toggle("menu--topnav");

    // also flip the .menu element (your second inline block did this)
    const nav = document.querySelector(".menu");
    nav?.classList.toggle("menu--sidebar");
    nav?.classList.toggle("menu--topnav");
  });
}

/* 0.5) Section caret open/close (for .sidebar-group[data-caret]) */
/* 0.5) Main nav groups (third-level) */
function wireCaretOpeners() {
  if ((document.body as any)._navLiteCarets) return;
  (document.body as any)._navLiteCarets = true;

  const groups = Array.from(
    document.querySelectorAll<HTMLElement>(".menu .sidebar-group[data-caret]")
  );
  const headers = groups
    .map((g) => g.querySelector<HTMLElement>(".sidebar__item")!)
    .filter(Boolean);

  groups.forEach((group, idx) => {
    const label = group.querySelector<HTMLElement>(".sidebar__item");
    const panel = group.querySelector<HTMLElement>(".sub-menu_down");
    if (!label || !panel) return;

    if (!panel.id) panel.id = `menu-sub-${idx}`;
    label.setAttribute("role", "button");
    label.setAttribute("tabindex", "0");
    label.setAttribute("aria-controls", panel.id);
    label.setAttribute("aria-expanded", "false");

    const open = () => {
      groups.forEach((g) => {
        if (g !== group) {
          g.classList.remove("is-open");
          g.querySelector<HTMLElement>(".sidebar__item")?.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      });
      group.classList.add("is-open");
      label.setAttribute("aria-expanded", "true");
    };
    const close = () => {
      group.classList.remove("is-open");
      label.setAttribute("aria-expanded", "false");
    };
    const toggle = () =>
      group.classList.contains("is-open") ? close() : open();

    label.addEventListener("click", toggle);
    label.addEventListener("keydown", (e) => {
      const k = (e as KeyboardEvent).key;
      if (k === "Enter" || k === " ") {
        e.preventDefault();
        toggle();
      }
      if (k === "Escape") {
        e.preventDefault();
        close();
      }
      if (k === "ArrowDown" || k === "ArrowUp" || k === "Home" || k === "End") {
        e.preventDefault();
        let i = headers.indexOf(label);
        if (k === "ArrowDown") i = (i + 1) % headers.length;
        if (k === "ArrowUp") i = (i - 1 + headers.length) % headers.length;
        if (k === "Home") i = 0;
        if (k === "End") i = headers.length - 1;
        headers[i]?.focus();
      }
    });
  });

  // Click outside closes any open group
  // add/replace this part inside wireCaretOpeners()
  document.addEventListener(
    "click",
    (e) => {
      const t = e.target as Element;
      if (
        t.closest(".menu .sidebar-group") || // header area
        t.closest(".menu .sub-menu_down") // the panel itself
      )
        return;

      groups.forEach((g) => {
        g.classList.remove("is-open");
        g.querySelector<HTMLElement>(".sidebar__item")?.setAttribute(
          "aria-expanded",
          "false"
        );
      });
    },
    true // capture so it fires before bubbling clicks
  );
}

/* 1) Mobile hamburger → overlay (replaces your IIFE inline block) */
function wireHamburger() {
  if ((document.body as any)._navLiteHamburger) return;
  (document.body as any)._navLiteHamburger = true;

  const btn = document.querySelector<HTMLLabelElement>(
    ".master-menu_mobile-header .master-hamburger-button"
  );
  const overlay = document.querySelector<HTMLElement>(".mobile-menu-overlay");
  if (!btn || !overlay) return;

  const setState = (open: boolean) => {
    document.body.classList.toggle("mobile-open", open);
    btn.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", String(open));
  };

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    setState(!document.body.classList.contains("mobile-open"));
  });

  // close on ESC
  document.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Escape") setState(false);
  });

  // close on backdrop click (not when clicking inside panels)
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) setState(false);
  });

  // also close if clicking anywhere outside overlay while open
  document.addEventListener(
    "click",
    (e) => {
      if (!document.body.classList.contains("mobile-open")) return;
      const t = e.target as Element;
      if (
        t.closest(".mobile-menu-overlay") ||
        t.closest(".master-hamburger-button")
      )
        return;
      setState(false);
    },
    true
  );
}

/* 2) Company thin-sidebar: open/close subsections (Settings, Help, Language, etc.) */
/* 2) Company thin-sidebar: open/close subsections (Settings, Help, Language, etc.) */
function wireCompanySubmenus() {
  const roots = $$(".company-sidebar") as HTMLElement[];
  if (!roots.length) return;

  // Already wired?
  if ((document.body as any)._navLiteCompany) return;
  (document.body as any)._navLiteCompany = true;

  // Per-root setup
  const initRoot = (root: HTMLElement) => {
    if (root.dataset.subInit === "1") return;
    root.dataset.subInit = "1";

    // Start hidden
    $$(
      ".company-sidebar__submenu, .company-sidebar__submenu--below",
      root
    ).forEach((el) => {
      el.classList.remove("submenu--open", "submenu--locked");
      (el as HTMLElement).style.display = "none";
    });

    // Toggle per item
    $$(".company-sidebar__item--has-submenu", root).forEach((item) => {
      const trigger = $(
        ".company-sidebar__trigger, .thin-sidebar-item",
        item
      ) as HTMLElement | null;
      const submenu = $(
        ".company-sidebar__submenu, .company-sidebar__submenu--below",
        item
      ) as HTMLElement | null;
      if (!trigger || !submenu) return;

      const open = () => {
        // Close OTHER top-level menus in the same root
        if (!item.closest(".company-sidebar__submenu--below")) {
          $$(
            ".company-sidebar__submenu.submenu--open, .company-sidebar__submenu--below.submenu--open",
            root
          ).forEach((el) => {
            if (el !== submenu) {
              el.classList.remove("submenu--open", "submenu--locked");
              (el as HTMLElement).style.display = "none";
            }
          });
          $$(".company-sidebar__item.item--hovered", root).forEach((i) =>
            i.classList.remove("item--hovered")
          );
        }
        submenu.classList.add("submenu--open", "submenu--locked");
        submenu.style.display = "block";
        item.classList.add("item--hovered");
      };

      const close = () => {
        submenu.classList.remove("submenu--open", "submenu--locked");
        submenu.style.display = "none";
        item.classList.remove("item--hovered");
      };

      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        submenu.classList.contains("submenu--open") ? close() : open();
      });

      trigger.addEventListener("keydown", (e) => {
        const k = (e as KeyboardEvent).key;
        if (k === "Enter" || k === " ") {
          e.preventDefault();
          trigger.click();
        }
      });
    });
  };

  roots.forEach(initRoot);

  // ---- Global closers (affect ALL roots) ----
  const closeAllEverywhere = () => {
    $$(
      ".company-sidebar__submenu.submenu--open, .company-sidebar__submenu--below.submenu--open"
    ).forEach((el) => {
      el.classList.remove("submenu--open", "submenu--locked");
      (el as HTMLElement).style.display = "none";
    });
    $$(".company-sidebar__item.item--hovered").forEach((i) =>
      i.classList.remove("item--hovered")
    );
  };

  // Close on outside click: outside BOTH sidebars
  document.addEventListener(
    "click",
    (e) => {
      const t = e.target as Node;
      const clickedInsideAny = roots.some((r) => r.contains(t));
      if (!clickedInsideAny) closeAllEverywhere();
    },
    true
  ); // capture so it runs before bubbled handlers

  // ESC closes everywhere
  document.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Escape") closeAllEverywhere();
  });
}

/* 3) Support panel (left overlay with form) */
function wireSupportPanel() {
  const cb = $("#toggleSidebarOptions") as HTMLInputElement | null;
  const panel = $("#supportPanel") as HTMLElement | null;
  const opener = $(
    'label[for="toggleSidebarOptions"]'
  ) as HTMLLabelElement | null;
  if (!cb || !panel || !opener) return;

  const reflect = () => {
    opener.setAttribute("aria-expanded", cb.checked ? "true" : "false");
    panel.hidden = false; // keep node in DOM; visibility handled by CSS via :checked
  };
  cb.addEventListener("change", reflect);
  reflect();

  // Close on outside click
  document.addEventListener(
    "click",
    (e) => {
      if (!cb.checked) return;
      const t = e.target as Element;
      if (
        t.closest("#supportPanel") ||
        t.closest('label[for="toggleSidebarOptions"]')
      )
        return;
      cb.checked = false;
      cb.dispatchEvent(new Event("change", { bubbles: true }));
    },
    true
  );

  // ESC closes
  document.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Escape" && cb.checked) {
      cb.checked = false;
      cb.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  // Don’t let file input labels close the overlay
  $$(".fileInput", panel).forEach((inp) => {
    const lbl = (inp as HTMLInputElement).closest("label");
    if (!lbl) return;
    ["mousedown", "click"].forEach((evt) =>
      lbl.addEventListener(evt, (ev) => ev.stopPropagation(), true)
    );
  });
}

/* 4) Company search (filters small list and mirrors into results UL) */
function wireCompanySearch() {
  const wrap = $("#accountSearchWrapper") as HTMLElement | null;
  if (!wrap) return;
  const input = $("#accountSearchInput", wrap) as HTMLInputElement | null;
  const results = $("#accountSearchResults", wrap) as HTMLElement | null;
  const pool = $$(
    ".searchable-account, .location-item",
    $(".company-sidebar") || undefined
  ) as HTMLElement[];
  if (!input || !results) return;

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    results.innerHTML = "";
    if (!q) return;

    pool.forEach((el) => {
      const name = (el.dataset.name || "").toLowerCase();
      const num = (el.dataset.number || "").toLowerCase();
      if (name.includes(q) || num.includes(q)) {
        const li = document.createElement("li");
        li.className = "location-item";
        li.dataset.number = el.dataset.number || "";
        li.innerHTML = `<span class="account-name">${
          el.dataset.name || ""
        }</span>
                        <span class="account-number">#${
                          el.dataset.number || ""
                        }</span>`;
        results.appendChild(li);
      }
    });
  });

  results.addEventListener("click", (e) => {
    const li = (e.target as Element).closest(
      ".location-item"
    ) as HTMLElement | null;
    if (!li) return;
    input.value = `${li.dataset.number || ""}`;
  });
}
