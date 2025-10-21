// src/scripts/nav-page.ts
// Keep only what's used on this demo page

const onDomReady = (fn: () => void) =>
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", fn, { once: true })
    : fn();

/* MAIN MENU ASSET SUPPORT FORM */
function sentSupportFormSidebar() {
  const panel = document.querySelector<HTMLElement>("#supportPanel");
  const cb = document.querySelector<HTMLInputElement>("#toggleSidebarOptions");
  if (!panel || !cb) return;

  // prevent re-init
  if (panel.dataset.sfsInit === "1" && panel.dataset.sfsFormInit === "1")
    return;

  const $ = <T extends Element = HTMLElement>(
    sel: string,
    root: Element | Document = panel
  ) => root.querySelector<T>(sel)!;
  const $$ = (sel: string, root: Element | Document = panel) =>
    Array.from(root.querySelectorAll(sel));

  const formWrap = () =>
    $("#supportFormContent") ||
    $("#sendForm, form.sendEmailForm")?.parentElement ||
    panel;
  const form = () =>
    $("#sendForm, form.sendEmailForm") as HTMLFormElement | null;
  const successBox = () => $("#supportSuccess");
  const errorBox = () => $("#supportError");

  const showForm = () => {
    formWrap()?.classList.remove("hidden");
    successBox()?.classList.add("hidden");
    errorBox()?.classList.add("hidden");
  };
  const showSuccess = () => {
    formWrap()?.classList.add("hidden");
    successBox()?.classList.remove("hidden");
    errorBox()?.classList.add("hidden");
  };
  const showError = () => {
    formWrap()?.classList.add("hidden");
    successBox()?.classList.add("hidden");
    errorBox()?.classList.remove("hidden");
  };

  const hardReset = () => {
    const f = form();
    if (f) {
      f.querySelectorAll<HTMLInputElement>("input[type='hidden']").forEach(
        (h) => {
          if (/^EMSApi\.Api\./.test(h.name)) h.remove();
        }
      );
      f.reset();
    }
    $$(".attachment-files-list").forEach((c: any) => (c.innerHTML = ""));
    $("#description-error")?.classList.add("hidden");
    showForm();
  };

  // ---- open/close wiring (once) ----
  if (!panel.dataset.sfsInit) {
    panel.dataset.sfsInit = "1";

    const opener = document.querySelector<HTMLLabelElement>(
      'label[for="toggleSidebarOptions"]'
    );
    const syncAria = () =>
      opener?.setAttribute("aria-expanded", cb.checked ? "true" : "false");

    opener?.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    opener?.addEventListener(
      "mousedown",
      (e) => {
        e.stopPropagation();
        setTimeout(syncAria);
      },
      true
    );
    opener?.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        setTimeout(syncAria);
      },
      true
    );

    document.addEventListener(
      "click",
      (e) => {
        const t = e.target as Element;
        if (
          t.closest("#toggleSidebarOptions") ||
          t.closest('label[for="toggleSidebarOptions"]')
        )
          return;
        const clickedInside =
          panel.contains(t) ||
          (typeof (e as any).composedPath === "function" &&
            (e as any).composedPath().includes(panel));
        if (cb.checked && !clickedInside) {
          cb.checked = false;
          cb.dispatchEvent(new Event("change", { bubbles: true }));
          hardReset();
        }
      },
      true
    );

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && cb.checked) {
        cb.checked = false;
        cb.dispatchEvent(new Event("change", { bubbles: true }));
        hardReset();
      }
    });

    $(".support-panel__close")?.addEventListener("click", () => {
      setTimeout(hardReset);
    });

    cb.addEventListener("change", () => {
      if (cb.checked) showForm();
      syncAria();
    });
    syncAria();
  }

  // ---- form + attachments (once) ----
  if (!panel.dataset.sfsFormInit) {
    const f = form();
    if (!f) return;
    panel.dataset.sfsFormInit = "1";

    // hidden iframe sink
    let sink = document.getElementById(
      "supportFormSink"
    ) as HTMLIFrameElement | null;
    if (!sink) {
      sink = document.createElement("iframe");
      sink.id = "supportFormSink";
      sink.name = "supportFormSink";
      sink.style.display = "none";
      document.body.appendChild(sink);
    }
    f.setAttribute("target", "supportFormSink");

    // stop overlay-close from file label
    $$(".fileInput").forEach((inp: HTMLInputElement) => {
      const lbl = inp.closest("label");
      if (lbl)
        ["mousedown", "click"].forEach((evt) =>
          lbl.addEventListener(evt, (e) => e.stopPropagation(), true)
        );
    });

    const listEls = $$(".attachment-files-list") as HTMLElement[];
    const mkHidden = (n: string, v: string) => {
      const i = document.createElement("input");
      i.type = "hidden";
      i.name = n;
      i.value = v;
      f.appendChild(i);
      return i;
    };

    $$(".fileInput").forEach((inp: HTMLInputElement, i: number) => {
      inp.addEventListener("change", () => {
        const list = listEls[i];
        if (!list) return;

        let idx = Array.from(listEls).reduce(
          (sum, el) => sum + el.querySelectorAll(".file-attachment").length,
          0
        );

        Array.from(inp.files || []).forEach((file) => {
          const fr = new FileReader();
          fr.onload = (ev) => {
            const b64 =
              String((ev.target as FileReader).result).split(",")[1] || "";
            const h1 = mkHidden(
              `EMSApi.Api.Json.sendEmail.string.files.${idx}.content`,
              b64
            );
            const h2 = mkHidden(
              `EMSApi.Api.Json.sendEmail.string.files.${idx}.contentType`,
              file.type || ""
            );
            const h3 = mkHidden(
              `EMSApi.Api.Json.sendEmail.string.files.${idx}.disposition`,
              "attachment"
            );
            const h4 = mkHidden(
              `EMSApi.Api.Json.sendEmail.string.files.${idx}.filename`,
              file.name || "file"
            );

            const row = document.createElement("div");
            row.className = "flex align-center mt-2 file-attachment";
            row.id = `fileContainer${idx}`;
            row.innerHTML = `<p>${file.name}</p><button type="button" aria-label="Remove"><i class="icon-Trash-Empty-Filled font-lg" aria-hidden="true"></i></button>`;

            const btn = row.querySelector("button")!;
            btn.addEventListener("mousedown", (e) => e.stopPropagation(), true);
            btn.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              row.remove();
              h1.remove();
              h2.remove();
              h3.remove();
              h4.remove();
            });

            list.appendChild(row);
            idx++;
          };
          fr.readAsDataURL(file);
        });

        inp.value = "";
      });
    });

    f.addEventListener("submit", (e) => {
      e.preventDefault();

      const desc =
        (
          document.getElementById("description") as HTMLTextAreaElement
        )?.value.trim() || "";
      if (desc.length < 10) {
        document
          .getElementById("description-error")
          ?.classList.remove("hidden");
        (
          document.getElementById("description") as HTMLTextAreaElement
        )?.focus();
        return;
      }
      document.getElementById("description-error")?.classList.add("hidden");

      const email =
        (document.getElementById("email") as HTMLInputElement)?.value || "";
      const topic =
        (document.getElementById("topic") as HTMLSelectElement)?.value ||
        "Other";
      const phone =
        (document.getElementById("phone") as HTMLInputElement)?.value || "-";
      const account = f.dataset.account || "-";
      const clientCode = f.dataset.clientCode || "-";
      const timestamp = f.dataset.timestamp || "";
      const timezone = f.dataset.timezone || "";
      const mailbox = f.dataset.mailbox || "";
      const supportEmail = f.dataset.supportEmail || "";

      const safe = (s: string) =>
        String(s).replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const html = `<html><body>
        <p><strong>Email:</strong> ${safe(email)}</p>
        <p><strong>Phone:</strong> ${safe(phone)}</p>
        <p><strong>Topic:</strong> ${safe(topic)}</p>
        <p><strong>Description:</strong></p>
        <div>${safe(desc).replace(/\n/g, "<br>")}</div>
        <hr><p><strong>Submitted at:</strong> ${safe(timestamp)} (${safe(
        timezone
      )})</p>
        <p><strong>Client Code / Account:</strong> ${safe(clientCode)} / ${safe(
        account
      )}</p>
      </body></html>`;

      const hid = (n: string, v: string) => {
        const i = document.createElement("input");
        i.type = "hidden";
        i.name = n;
        i.value = v;
        f.appendChild(i);
      };
      hid("EMSApi.Api.Post.sendEmail", "api/v2/message");
      hid(
        "EMSApi.Api.Json.sendEmail.string.subject",
        `[Support Request] ${topic} — ${email}`
      );
      hid("EMSApi.Api.Json.sendEmail.string.type", "email");
      hid("EMSApi.Api.Json.sendEmail.string.bodies.0.contentType", "text/html");
      hid("EMSApi.Api.Json.sendEmail.string.bodies.0.content", btoa(html));

      hid("EMSApi.Api.Json.sendEmail.string.contacts.0.address", mailbox);
      hid("EMSApi.Api.Json.sendEmail.string.contacts.0.name", mailbox);
      hid("EMSApi.Api.Json.sendEmail.string.contacts.0.type", "from");

      hid("EMSApi.Api.Json.sendEmail.string.contacts.1.address", supportEmail);
      hid("EMSApi.Api.Json.sendEmail.string.contacts.1.name", supportEmail);
      hid("EMSApi.Api.Json.sendEmail.string.contacts.1.type", "to");

      showSuccess();

      let responded = false;
      const sinkEl = document.getElementById(
        "supportFormSink"
      ) as HTMLIFrameElement;
      const onLoad = () => {
        responded = true;
        sinkEl.removeEventListener("load", onLoad);
        hardReset();
        successBox()?.classList.remove("hidden");
        formWrap()?.classList.add("hidden");
      };
      sinkEl.addEventListener("load", onLoad);

      setTimeout(() => {
        if (!responded) showError();
      }, 8000);
      f.submit();
    });
  }
}

/* MENU ASSET TOPNAV STICKY */
function initTopnavAutoOffset() {
  const nav = document.querySelector<HTMLElement>("nav.menu.menu--topnav");
  if (!nav || nav.dataset.topnavOffsetInit === "1") return;
  nav.dataset.topnavOffsetInit = "1";

  const root = document.documentElement;
  let last = -1;
  let scheduled = false;

  const measureAndSet = () => {
    scheduled = false;
    const h = Math.round(nav.getBoundingClientRect().height);
    if (h > 0 && h !== last) {
      last = h;
      root.style.setProperty("--topnav-height", h + "px");
    }
  };
  const schedule = () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(measureAndSet);
    }
  };

  const ro = new ResizeObserver(schedule);
  ro.observe(nav);

  addEventListener("resize", schedule);
  (document as any).fonts?.ready?.then(schedule);
  if (document.readyState === "complete") schedule();
  else addEventListener("load", schedule, { once: true });
}

/* COMPANY SIDEBAR ACCOUNT SWITCHING (single source of truth) */
function initializeCompanySidebarAccountSwitcher() {
  const wrapper = document.querySelector(
    ".company-sidebar"
  ) as HTMLElement | null;
  const selectedLocation = wrapper?.querySelector(
    "#selectedLocation2"
  ) as HTMLElement | null;
  const selectedAccountInput = wrapper?.querySelector(
    "#selectedAccount2"
  ) as HTMLInputElement | null;
  const postActionRedirectInput = wrapper?.querySelector(
    "#postActionRedirect2"
  ) as HTMLInputElement | null;
  const accountSwitchForm = wrapper?.querySelector(
    "#accountSwitchForm2"
  ) as HTMLFormElement | null;
  const locationList = wrapper?.querySelector(
    "#locationList2"
  ) as HTMLElement | null;

  const searchWrapper = document.querySelector(
    "#accountSearchWrapper"
  ) as HTMLElement | null;
  const searchInput = searchWrapper?.querySelector(
    "#accountSearchInput"
  ) as HTMLInputElement | null;
  const resultList = searchWrapper?.querySelector(
    "#accountSearchResults"
  ) as HTMLElement | null;

  if (
    !wrapper ||
    !locationList ||
    !selectedLocation ||
    !selectedAccountInput ||
    !postActionRedirectInput ||
    !accountSwitchForm
  )
    return;
  if (wrapper.dataset.switchInit === "1") return;
  wrapper.dataset.switchInit = "1";

  function getBaseURL() {
    return window.location.origin;
  }
  function extractBasePathFromURL() {
    const validPaths = [
      "start-main-page",
      "start-main-ems-page",
      "start-CRM-page",
      "start-ecommerce-page",
      "start-invoicing-page",
      "start-page",
      "start-POS-page",
      "start-support-page",
    ];
    const segments = window.location.pathname.split("/");
    return validPaths.find((p) => segments.includes(p)) || "start-main-page";
  }
  function getClientLanguageAndPage() {
    const segments = window.location.pathname.split("/");
    const language = segments.find((s) => /^[a-z]{2}$/.test(s)) || "en";
    const currentPage = extractBasePathFromURL();
    return { language, currentPage };
  }

  function switchAccount(newClientCode: string) {
    localStorage.setItem("selectedAccount", newClientCode);
    const { language, currentPage } = getClientLanguageAndPage();
    const baseLoginURL = `https://go.erply.com/?clientCode=${newClientCode}`;
    const basePlatformURL = getBaseURL();
    const newTargetURL = `${basePlatformURL}/${newClientCode}/${language}/${currentPage}`;

    selectedLocation.innerText = newClientCode;
    selectedAccountInput.value = newClientCode;
    postActionRedirectInput.value = `${baseLoginURL}&target=${encodeURIComponent(
      newTargetURL
    )}`;
    accountSwitchForm.submit();
  }

  wrapper.addEventListener("click", (event) => {
    const t = event.target as Element;
    const selectedItem = t.closest(".location-item") as HTMLElement | null;
    const triggerBtn = t.closest(
      ".account-switch-trigger"
    ) as HTMLElement | null;
    const newClientCode =
      selectedItem?.dataset.number || triggerBtn?.dataset.number || null;
    if (newClientCode) switchAccount(newClientCode);
  });

  if (searchInput && resultList) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim().toLowerCase();
      resultList.innerHTML = "";
      if (!query) return;

      const accounts = wrapper.querySelectorAll<HTMLElement>(
        ".searchable-account, .location-item"
      );
      accounts.forEach((acc) => {
        const name = (acc.dataset.name || "").toLowerCase();
        const number = (acc.dataset.number || "").toLowerCase();
        if (name.includes(query) || number.includes(query)) {
          const li = document.createElement("li");
          li.className = "location-item";
          li.dataset.number = acc.dataset.number || "";
          li.innerHTML = `<span class="account-name">${
            acc.dataset.name || ""
          }</span><span class="account-number">#${
            acc.dataset.number || ""
          }</span>`;
          resultList.appendChild(li);
        }
      });
    });
  }

  // Hide current account in list
  const currentAccount = selectedLocation.dataset.session;
  if (currentAccount) {
    wrapper.querySelectorAll<HTMLElement>(".location-item").forEach((item) => {
      item.style.display = item.dataset.number === currentAccount ? "none" : "";
    });
  }
}

/* THIN COMPANY SIDEBAR - 3 LEVEL MENU */
function initializeSidebarSubmenus() {
  const root = document.querySelector(".company-sidebar");
  if (!root || (root as HTMLElement).dataset.submenusInit === "1") return;
  (root as HTMLElement).dataset.submenusInit = "1";

  document.querySelectorAll<HTMLElement>(".nested-submenu").forEach((sub) => {
    sub.classList.remove("submenu--locked", "submenu--visible");
    sub.style.display = "none";
  });

  document
    .querySelectorAll<HTMLElement>(".company-sidebar__item--has-submenu")
    .forEach((item) => {
      const trigger = item.querySelector(
        ".company-sidebar__trigger, .thin-sidebar-item"
      ) as HTMLElement | null;
      if (!trigger) return;

      const submenuId = trigger.getAttribute("data-submenu-id");
      const externalSubmenu = submenuId
        ? document.getElementById(submenuId)
        : null;
      const inlineSubmenu = item.querySelector(
        ".company-sidebar__submenu, .company-sidebar__submenu--below"
      ) as HTMLElement | null;
      const submenu = (externalSubmenu || inlineSubmenu) as HTMLElement | null;
      if (!submenu) return;

      let hideTimeout: any;
      const isDesktop = () => window.innerWidth > 1024;

      const showSubmenu = () => {
        if (!submenu.classList.contains("submenu--below")) {
          if (submenuId && isDesktop()) {
            const itemRect = trigger.getBoundingClientRect();
            const parentRect = trigger
              .closest(".thin-sidebar-icons")
              ?.getBoundingClientRect();
            const topOffset = itemRect.top - (parentRect?.top || 0);
            submenu.style.top = `${topOffset}px`;
          } else {
            submenu.style.top = "";
          }
        } else {
          submenu.style.top = "";
        }
        submenu.classList.add("submenu--visible");
        submenu.style.display = "";
        item.classList.add("item--hovered");
        clearTimeout(hideTimeout);
      };

      const hideSubmenu = () => {
        if (submenu.classList.contains("submenu--locked")) return;
        hideTimeout = setTimeout(() => {
          submenu.classList.remove("submenu--visible");
          item.classList.remove("item--hovered");
        }, 150);
      };

      const lockSubmenu = () => {
        const isNested =
          item.closest(".company-sidebar__submenu--below") !== null;
        if (!isNested) {
          document
            .querySelectorAll<HTMLElement>(
              ".company-sidebar__item--has-submenu > .company-sidebar__submenu--below.submenu--locked, .company-sidebar__item--has-submenu > .company-sidebar__submenu--below.submenu--visible"
            )
            .forEach((other) => {
              other.classList.remove("submenu--locked", "submenu--visible");
              other.style.display = "none";
            });
          document
            .querySelectorAll<HTMLElement>(
              ".company-sidebar__item.item--hovered"
            )
            .forEach((otherItem) => {
              otherItem.classList.remove("item--hovered");
            });
        }
        if (!isNested) submenu.classList.add("submenu--locked");
        item.classList.add("item--hovered");
        showSubmenu();
      };

      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        if ((e.target as Element).closest("#accountSearchWrapper")) return;

        const isNested =
          item.closest(".company-sidebar__submenu--below") !== null;
        const isOpen = submenu.classList.contains("submenu--locked");
        if (isOpen) {
          submenu.classList.remove("submenu--locked", "submenu--visible");
          submenu.style.display = "none";
          item.classList.remove("item--hovered");
        } else {
          lockSubmenu();
        }
      });
    });

  // Close everything on outside click
  document.addEventListener("click", (event) => {
    const t = event.target as Element;
    const isInside =
      t.closest(".company-sidebar__item--has-submenu") ||
      t.closest(".company-sidebar__submenu") ||
      t.closest(".company-sidebar__submenu--below");
    if (!isInside) {
      document
        .querySelectorAll<HTMLElement>(".submenu--locked, .submenu--visible")
        .forEach((submenu) => {
          submenu.classList.remove("submenu--locked", "submenu--visible");
          submenu.style.display = "none";
        });
      document
        .querySelectorAll<HTMLElement>(".company-sidebar__item.item--hovered")
        .forEach((item) => {
          item.classList.remove("item--hovered");
        });
    }
  });

  // Close thin sidebar radios on outside click
  document.addEventListener("click", (event) => {
    const isInsideThin =
      (event.target as Element).closest(".sidebar-group") ||
      (event.target as Element).closest(".sub-menu_down");
    if (!isInsideThin) {
      document
        .querySelectorAll<HTMLInputElement>('input[name="aside_menu"]')
        .forEach((radio) => {
          radio.checked = false;
        });
    }
  });
}

/* Optional utility – keeps “has-scroll” class in sync for the thin app list */
function adjustMenuAssetScrollbar() {
  const el = document.querySelector<HTMLElement>(
    "aside.extra-thin-sidebar.extra-thin-sidebar--second .thin-sidebar-icons"
  );
  if (!el || el.dataset.scrollInit === "1") return;
  el.dataset.scrollInit = "1";

  const hasOverflow = () =>
    el.scrollHeight - el.clientHeight > 1 &&
    getComputedStyle(el).overflowY !== "visible";

  const update = () => el.classList.toggle("has-scroll", hasOverflow());

  requestAnimationFrame(() => {
    update();
    setTimeout(update, 50);
  });
  addEventListener("resize", update);
  new MutationObserver(update).observe(el, {
    childList: true,
    subtree: true,
    attributes: true,
  });
  if ("ResizeObserver" in window) new ResizeObserver(update).observe(el);
  (document as any).fonts?.ready?.then(update).catch(() => {});
}

/** PUBLIC: call this from the Astro page */
export function initNavCaseStudy() {
  onDomReady(() => {
    sentSupportFormSidebar();
    initTopnavAutoOffset();
    initializeCompanySidebarAccountSwitcher();
    initializeSidebarSubmenus();
    adjustMenuAssetScrollbar();
    initDotMenus();

    // One clean handler for sidebar/topnav flip (demo)
    if (!(document.body as any).dataset.toggleBound) {
      addEventListener("click", (e) => {
        const btn = (e.target as HTMLElement).closest("[data-toggle-menu]");
        if (!btn) return;
        document.body.classList.toggle("menu--sidebar");
        document.body.classList.toggle("menu--topnav");

        // ensure offset updates when switching into topnav
        initTopnavAutoOffset();
      });
      (document.body as any).dataset.toggleBound = "1";
    }
  });
  function px(n: number) {
    return `${Math.max(0, Math.round(n || 0))}px`;
  }
  function w(el?: Element | null) {
    if (!el) return 0;
    const r = (el as HTMLElement).getBoundingClientRect();
    return r.width || 0;
  }

  function updateRails() {
    const body = document.body;

    // left thin rail (company icons)
    const thinLeft = document.querySelector(".company-sidebar");

    // main menu: only count it when it's actually a sidebar
    const nav = document.querySelector("nav.menu");
    const menuIsSidebar =
      body.classList.contains("menu--sidebar") &&
      nav?.classList.contains("menu--sidebar");

    // right thin rail (app switcher)
    const thinRight = document.querySelector(".extra-thin-sidebar--second");

    const leftRails = w(thinLeft) + (menuIsSidebar ? w(nav) : 0);
    const rightRail = w(thinRight);

    document.documentElement.style.setProperty("--left-rails", px(leftRails));
    document.documentElement.style.setProperty("--right-rail", px(rightRail));
  }

  // keep vars fresh whenever things change size or mode
  const ro = new ResizeObserver(updateRails);
  [".company-sidebar", "nav.menu", ".extra-thin-sidebar--second"].forEach(
    (sel) => {
      const el = document.querySelector(sel);
      if (el) ro.observe(el);
    }
  );

  // watch class flips (sidebar <-> topnav)
  new MutationObserver(updateRails).observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });
  const navEl = document.querySelector("nav.menu");
  if (navEl)
    new MutationObserver(updateRails).observe(navEl, {
      attributes: true,
      attributeFilter: ["class"],
    });

  // run once + after your demo toggle clicks
  addEventListener("load", updateRails);
  addEventListener("resize", updateRails);
  document.addEventListener("click", (e) => {
    if ((e.target as Element).closest("[data-toggle-menu]")) {
      requestAnimationFrame(updateRails);
    }
  });
  updateRails();
}

function setRailsVars() {
  const thinLeft = document.querySelector<HTMLElement>(".company-sidebar");
  const mainMenu = document.querySelector<HTMLElement>(
    "nav.menu.menu--sidebar"
  ); // only wide when sidebar mode
  const thinRight = document.querySelector<HTMLElement>(
    ".extra-thin-sidebar--second"
  );

  const w = (el?: HTMLElement | null) =>
    el ? Math.round(el.getBoundingClientRect().width) : 0;

  const leftRails = w(thinLeft) + w(mainMenu); // thin-left + main sidebar (0 in topnav mode)
  const rightRail = w(thinRight);

  document.documentElement.style.setProperty("--left-rails", leftRails + "px");
  document.documentElement.style.setProperty("--right-rail", rightRail + "px");
}

// keep it updated on resize, sidebar toggle, etc.
const ro = new ResizeObserver(setRailsVars);
[".company-sidebar", "nav.menu", ".extra-thin-sidebar--second"].forEach(
  (sel) => {
    const el = document.querySelector(sel);
    if (el) ro.observe(el);
  }
);

addEventListener("resize", setRailsVars);
addEventListener("load", setRailsVars);

// also run after your “[data-toggle-menu]” click flips classes
document.addEventListener("click", (e) => {
  if ((e.target as Element).closest("[data-toggle-menu]")) {
    requestAnimationFrame(setRailsVars);
  }
});

// run once on init
setRailsVars();
