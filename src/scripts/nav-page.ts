/* Minimal, framework-agnostic wiring for your demo UI
   Safe to call multiple times (guards prevent double-binding) */

/* ---------- tiny utils ---------- */
const ready = (fn: () => void) =>
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", fn, { once: true })
    : fn();

const $ = <T extends Element = HTMLElement>(
  s: string,
  r: ParentNode | Document = document
) => r.querySelector<T>(s) as T | null;
const $$ = <T extends Element = HTMLElement>(
  s: string,
  r: ParentNode | Document = document
) => Array.from(r.querySelectorAll<T>(s));

/* Focus the trigger after ESC without showing a ring */
// Suppress any focus ring for a single animation frame
function quietProgrammaticFocus(el: HTMLElement | null) {
  if (!el) return;
  document.documentElement.classList.add("suppress-focus-ring");
  el.focus({ preventScroll: true });
  requestAnimationFrame(() => {
    document.documentElement.classList.remove("suppress-focus-ring");
  });
}

// (optional) find a truly focusable child inside a trigger
function getFocusable(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null;
  const selector = [
    "button",
    "a[href]",
    'input:not([type="hidden"])',
    "select",
    "textarea",
    "[tabindex]:not([tabindex='-1'])",
    "label[for]",
  ].join(",");
  return (
    el.matches(selector) ? el : el.querySelector(selector)
  ) as HTMLElement | null;
}

/* ---------- public init ---------- */
export function initNavLite() {
  if ((document.body as any)._navLiteInit) return; // avoid rebinding in SPA swaps
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

/* ---------- 0) Sidebar <-> Topnav toggle ---------- */
function wireLayoutToggle() {
  if ((document.body as any)._navLiteLayout) return;
  (document.body as any)._navLiteLayout = true;

  // flip body + .menu
  document.addEventListener("click", (e) => {
    const btn = (e.target as Element | null)?.closest("[data-toggle-menu]");
    if (!btn) return;

    document.body.classList.toggle("menu--sidebar");
    document.body.classList.toggle("menu--topnav");

    const nav = document.querySelector(".menu");
    nav?.classList.toggle("menu--sidebar");
    nav?.classList.toggle("menu--topnav");

    (btn as HTMLElement).classList.toggle("is-open");
  });

  // keyboard support
  document.addEventListener("keydown", (e) => {
    const targetEl = e.target as Element | null;
    if (!targetEl?.closest("[data-toggle-menu]")) return;
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    (targetEl as HTMLElement).click();
  });
}

/* ---------- 0.5) Main nav groups (third-level) ---------- */
function wireCaretOpeners() {
  if ((document.body as any)._navLiteCarets) return;
  (document.body as any)._navLiteCarets = true;

  const groups = $<HTMLElement>(".menu")
    ? ($$(".menu .sidebar-group[data-caret]") as HTMLElement[])
    : [];

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

  // Click outside closes any open group (capture to run early)
  document.addEventListener(
    "click",
    (e) => {
      const t = e.target as Element;
      if (
        t.closest(".menu .sidebar-group") ||
        t.closest(".menu .sub-menu_down")
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
    true
  );
}

/* ---------- 1) Mobile hamburger → overlay ---------- */
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

  document.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Escape") setState(false);
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) setState(false);
  });

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

/* ---------- 2) Company submenus (toggle, outside, ESC) ---------- */
function wireCompanySubmenus() {
  const roots = $$(".company-sidebar") as HTMLElement[];
  if (!roots.length) return;
  if ((document.body as any)._navLiteCompany) return;
  (document.body as any)._navLiteCompany = true;

  const initRoot = (root: HTMLElement) => {
    if (root.dataset.subInit === "1") return;
    root.dataset.subInit = "1";

    let lastOpener: HTMLElement | null = null;

    const closeAll = (exceptSubmenu: HTMLElement | null = null) => {
      $$(
        ".company-sidebar__submenu, .company-sidebar__submenu--below",
        root
      ).forEach((el) => {
        if (exceptSubmenu && el === exceptSubmenu) return;
        el.classList.remove("submenu--open", "submenu--locked");
        (el as HTMLElement).style.display = "none";
        const owner = el.closest(
          ".company-sidebar__item--has-submenu"
        ) as HTMLElement | null;
        owner?.classList.remove("item--hovered");
        const trig = owner?.querySelector(
          ".company-sidebar__trigger"
        ) as HTMLElement | null;
        trig?.setAttribute("aria-expanded", "false");
      });
    };

    // reset start state
    closeAll(null);

    // wire each item
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
        if (!item.closest(".company-sidebar__submenu--below"))
          closeAll(submenu);
        submenu.classList.add("submenu--open", "submenu--locked");
        submenu.style.display = "block";
        item.classList.add("item--hovered");
        trigger.setAttribute("aria-expanded", "true");
        lastOpener = trigger;
      };

      const close = () => {
        submenu.classList.remove("submenu--open", "submenu--locked");
        submenu.style.display = "none";
        item.classList.remove("item--hovered");
        trigger.setAttribute("aria-expanded", "false");
      };

      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        (submenu.classList.contains("submenu--open") ? close : open)();
      });

      trigger.addEventListener("keydown", (e) => {
        const k = (e as KeyboardEvent).key;
        if (k === "Enter" || k === " ") {
          e.preventDefault();
          trigger.click();
        }
      });
    });

    // outside click: close everything
    document.addEventListener("click", (e) => {
      if (!root.contains(e.target as Node)) closeAll(null);
    });

    // ESC: close everything and return focus silently to the last opener
    document.addEventListener("keydown", (e) => {
      if ((e as KeyboardEvent).key !== "Escape") return;
      const hadOpen =
        $$(
          ".company-sidebar__submenu.submenu--open, .company-sidebar__submenu--below.submenu--open",
          root
        ).length > 0;
      closeAll(null);
      if (hadOpen)
        quietProgrammaticFocus(getFocusable(lastOpener) || lastOpener);
    });
  };

  roots.forEach(initRoot);
}

/* ---------- 3) Support panel (left overlay with form) ---------- */
function wireSupportPanel() {
  const cb = $("#toggleSidebarOptions") as HTMLInputElement | null;
  const panel = $("#supportPanel") as HTMLElement | null;
  const opener = $(
    'label[for="toggleSidebarOptions"]'
  ) as HTMLLabelElement | null;
  if (!cb || !panel || !opener) return;

  const reflect = () => {
    opener.setAttribute("aria-expanded", cb.checked ? "true" : "false");
    panel.hidden = false; // node stays; CSS handles visibility via :checked
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

/* ---------- 4) Company search (filters + opens/closes) ---------- */
function wireCompanySearch() {
  const wrap = document.getElementById(
    "accountSearchWrapper"
  ) as HTMLElement | null;
  if (!wrap) return;

  const input = document.getElementById(
    "accountSearchInput"
  ) as HTMLInputElement | null;
  const results = document.getElementById(
    "accountSearchResults"
  ) as HTMLElement | null;
  const submenu = document.getElementById(
    "accountSearchWrapperContainer"
  ) as HTMLElement | null; // panel
  const item = wrap.closest(
    ".company-sidebar__item--has-submenu"
  ) as HTMLElement | null;
  const trigger = item?.querySelector(
    ".company-sidebar__trigger"
  ) as HTMLElement | null;
  const root = item?.closest(".company-sidebar") as HTMLElement | null;

  // pool of accounts to search from the left sidebar
  const pool = Array.from(
    (root || document).querySelectorAll<HTMLElement>(
      ".searchable-account, .location-item"
    )
  );

  if (!input || !results || !submenu || !item || !trigger) return;

  const closeOthers = () => {
    if (!root) return;
    $$(
      ".company-sidebar__submenu.submenu--open, .company-sidebar__submenu--below.submenu--open",
      root
    ).forEach((el) => {
      if (el === submenu) return;
      el.classList.remove("submenu--open", "submenu--locked");
      (el as HTMLElement).style.display = "none";
      const owner = el.closest(
        ".company-sidebar__item--has-submenu"
      ) as HTMLElement | null;
      owner?.classList.remove("item--hovered");
      const trig = owner?.querySelector(
        ".company-sidebar__trigger"
      ) as HTMLElement | null;
      trig?.setAttribute("aria-expanded", "false");
    });
  };

  const setOpenState = (open: boolean) => {
    if (open) {
      closeOthers();
      submenu.classList.add("submenu--open", "submenu--locked");
      submenu.style.display = "block";
      item.classList.add("item--hovered");
      trigger.setAttribute("aria-expanded", "true");
    } else {
      submenu.classList.remove("submenu--open", "submenu--locked");
      submenu.style.display = "none";
      item.classList.remove("item--hovered");
      trigger.setAttribute("aria-expanded", "false");
    }
  };

  const renderNoResults = (query: string) => {
    const li = document.createElement("li");
    li.className = "no-results";
    li.setAttribute("aria-live", "polite");
    li.textContent = `No results for “${query}”.`;
    results.appendChild(li);
  };

  const renderMatches = (q: string) => {
    const query = q.trim().toLowerCase();
    results.innerHTML = "";

    if (!query) {
      setOpenState(false);
      return;
    }

    let matches = 0;
    pool.forEach((el) => {
      const name = (el.dataset.name || "").toLowerCase();
      const num = (el.dataset.number || "").toLowerCase();
      if (name.includes(query) || num.includes(query)) {
        const li = document.createElement("li");
        li.className = "location-item";
        li.dataset.number = el.dataset.number || "";
        li.innerHTML = `
          <span class="account-name">${el.dataset.name || ""}</span>
          <span class="account-number">#${el.dataset.number || ""}</span>
        `;
        results.appendChild(li);
        matches++;
      }
    });

    if (matches === 0) renderNoResults(q);
    setOpenState(true); // keep panel visible + icon blue while searching
  };

  input.addEventListener("input", () => renderMatches(input.value));

  results.addEventListener("click", (e) => {
    const li = (e.target as Element).closest(
      ".location-item"
    ) as HTMLElement | null;
    if (!li) return;
    input.value = li.dataset.number || "";
    // setOpenState(false); // uncomment if you want to close after selection
  });

  input.addEventListener("focus", () => setOpenState(true));
  input.addEventListener("blur", () => {
    if (!input.value.trim()) setOpenState(false);
  });
}
