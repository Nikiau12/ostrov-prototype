const pageImages = Array.from({ length: 10 }, (_, index) =>
  `assets/ostrov-page-${String(index + 1).padStart(2, "0")}.png`
);

const body = document.body;
const hero = document.querySelector(".hero");
const openDismiss = document.querySelector("#open-dismiss");
const coverToggle = document.querySelector("#cover-toggle");
const bookAction = document.querySelector("#book-action");
const bookActionLabel = document.querySelector("#book-action-label");
const openBook = document.querySelector("#open-book");
const pageFlipElement = document.querySelector("#page-flip");
const spreadStatus = document.querySelector("#spread-status");
const aboutPanel = document.querySelector("#about");
const preorderPanel = document.querySelector("#preorder");
const panelCloseButtons = [...document.querySelectorAll("[data-close-panel]")];
const storyFragments = [...document.querySelectorAll(".story-fragment")];
const mobileStoryTrigger = document.querySelector("#story-mobile-trigger");
const preorderButton = document.querySelector("#preorder-open-secondary");
const externalOrder = document.querySelector("#external-order");
const orderPlaceholder = document.querySelector("#order-placeholder");
const isCompactBook = window.matchMedia("(max-width: 760px)").matches;
const initialBookPage = 0;

let pageFlip = null;
let mobileReader = null;
let mobilePageIndex = initialBookPage;
let mobileTurning = false;
let mobilePointerStart = null;
let activePanelTrigger = null;
let activeStoryFragment = null;

pageImages.forEach((src) => {
  const image = new Image();
  image.src = src;
});

function updateSpreadStatus(pageIndex = 0) {
  spreadStatus.textContent = isCompactBook
    ? `Страница ${pageIndex + 1} из ${pageImages.length}`
    : `Разворот ${Math.floor(pageIndex / 2) + 1} из ${pageImages.length / 2}`;
}

function resetMobileReader() {
  if (!mobileReader) return;
  mobilePageIndex = initialBookPage;
  mobileTurning = false;
  mobileReader.base.src = pageImages[mobilePageIndex];
  mobileReader.base.alt = `Страница ${mobilePageIndex + 1} журнала «Остров»`;
  mobileReader.turn.className = "mobile-page-turn";
  updateSpreadStatus(mobilePageIndex);
}

function turnMobilePage(step) {
  if (!mobileReader || mobileTurning) return;
  const nextIndex = Math.max(0, Math.min(pageImages.length - 1, mobilePageIndex + step));
  if (nextIndex === mobilePageIndex) return;

  mobileTurning = true;
  mobileReader.base.src = pageImages[nextIndex];
  mobileReader.base.alt = `Страница ${nextIndex + 1} журнала «Остров»`;
  mobileReader.turn.src = pageImages[mobilePageIndex];
  mobileReader.turn.alt = "";
  mobileReader.turn.className = "mobile-page-turn";
  void mobileReader.turn.offsetWidth;
  mobileReader.turn.classList.add(step > 0 ? "is-turning-next" : "is-turning-prev");
  mobilePageIndex = nextIndex;
  updateSpreadStatus(mobilePageIndex);

  window.setTimeout(() => {
    if (!mobileReader) return;
    mobileReader.turn.className = "mobile-page-turn";
    mobileTurning = false;
  }, 560);
}

function ensureMobileReader() {
  if (mobileReader) return;

  const stack = document.createElement("div");
  const base = document.createElement("img");
  const turn = document.createElement("img");

  pageFlipElement.classList.add("mobile-page-reader");
  stack.className = "mobile-page-stack";
  base.className = "mobile-page-base";
  turn.className = "mobile-page-turn";
  base.draggable = false;
  turn.draggable = false;
  stack.append(base, turn);
  pageFlipElement.append(stack);
  mobileReader = { stack, base, turn };
  resetMobileReader();

  pageFlipElement.addEventListener("pointerdown", (event) => {
    if (body.dataset.bookState !== "open") return;
    mobilePointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
    pageFlipElement.setPointerCapture?.(event.pointerId);
  });

  pageFlipElement.addEventListener("pointerup", (event) => {
    if (!mobilePointerStart || mobilePointerStart.id !== event.pointerId) return;
    const deltaX = event.clientX - mobilePointerStart.x;
    const deltaY = event.clientY - mobilePointerStart.y;
    const bounds = pageFlipElement.getBoundingClientRect();
    mobilePointerStart = null;

    if (Math.abs(deltaX) > 28 && Math.abs(deltaX) > Math.abs(deltaY)) {
      turnMobilePage(deltaX < 0 ? 1 : -1);
      return;
    }

    if (Math.abs(deltaX) < 12 && Math.abs(deltaY) < 12) {
      turnMobilePage(event.clientX > bounds.left + bounds.width / 2 ? 1 : -1);
    }
  });

  pageFlipElement.addEventListener("pointercancel", () => {
    mobilePointerStart = null;
  });
}

function ensurePageFlip() {
  if (isCompactBook) {
    ensureMobileReader();
    return;
  }
  if (pageFlip) return;

  const pageElements = pageImages.map((src, index) => {
    const page = document.createElement("div");
    const image = document.createElement("img");

    page.className = "book-page";
    image.src = src;
    image.alt = `Страница ${index + 1} журнала «Остров»`;
    image.draggable = false;
    page.append(image);
    pageFlipElement.append(page);
    return page;
  });

  pageFlip = new St.PageFlip(pageFlipElement, {
    width: 822,
    height: 1180,
    size: "stretch",
    minWidth: 150,
    maxWidth: 822,
    minHeight: 215,
    maxHeight: 1180,
    drawShadow: true,
    flippingTime: 900,
    usePortrait: true,
    startPage: initialBookPage,
    autoSize: false,
    maxShadowOpacity: .42,
    showCover: false,
    mobileScrollSupport: false,
    swipeDistance: 16,
    useMouseEvents: true,
  });

  pageFlip.on("flip", (event) => updateSpreadStatus(event.data));
  pageFlip.loadFromHTML(pageElements);
}

function clearStoryReveals() {
  storyFragments.forEach((fragment) => fragment.classList.remove("is-revealed"));
  activeStoryFragment?.blur();
  activeStoryFragment = null;
}

function toggleStoryReveal(fragment) {
  const shouldReveal = !fragment.classList.contains("is-revealed");
  clearStoryReveals();
  if (!shouldReveal) return;
  activeStoryFragment = fragment;
  fragment.classList.add("is-revealed");
}

storyFragments.forEach((fragment) => {
  fragment.addEventListener("click", () => toggleStoryReveal(fragment));
  fragment.addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    toggleStoryReveal(fragment);
  });
});

function openPublication() {
  if (body.dataset.bookState === "open") return;

  clearStoryReveals();
  body.dataset.bookState = "open";
  openBook.setAttribute("aria-hidden", "false");
  window.requestAnimationFrame(ensurePageFlip);
}

function closePublication() {
  if (body.dataset.bookState !== "open") return;
  body.dataset.bookState = "vellum";
  openBook.setAttribute("aria-hidden", "true");
  pageFlip?.turnToPage(initialBookPage);
  resetMobileReader();
  updateSpreadStatus(initialBookPage);
  coverToggle.setAttribute("aria-label", "Открыть журнал");
  bookActionLabel.textContent = "листать журнал";
}

coverToggle.addEventListener("click", openPublication);
bookAction.addEventListener("click", openPublication);
openDismiss.addEventListener("click", closePublication);
openDismiss.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  closePublication();
});

hero.addEventListener("click", (event) => {
  if (body.dataset.bookState !== "open") return;
  if (event.composedPath().includes(openBook) || event.target.closest("button, a")) return;
  closePublication();
});

function closePanels({ returnFocus = true } = {}) {
  body.classList.remove("about-open", "preorder-open");
  aboutPanel.setAttribute("aria-hidden", "true");
  preorderPanel.setAttribute("aria-hidden", "true");
  if (returnFocus && activePanelTrigger) activePanelTrigger.focus();
  activePanelTrigger = null;
}

function openPanel(panel, trigger) {
  closePanels({ returnFocus: false });
  clearStoryReveals();
  activePanelTrigger = trigger;
  const isAbout = panel === aboutPanel;
  body.classList.add(isAbout ? "about-open" : "preorder-open");
  panel.setAttribute("aria-hidden", "false");
  window.setTimeout(() => panel.querySelector("[data-close-panel]").focus(), 100);
}

mobileStoryTrigger.addEventListener("click", () => openPanel(aboutPanel, mobileStoryTrigger));
preorderButton.addEventListener("click", () => openPanel(preorderPanel, preorderButton));
panelCloseButtons.forEach((button) => button.addEventListener("click", () => closePanels()));

[aboutPanel, preorderPanel].forEach((panel) => {
  panel.addEventListener("click", (event) => {
    if (event.target === panel) closePanels();
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (activeStoryFragment) clearStoryReveals();
    else if (body.classList.contains("about-open") || body.classList.contains("preorder-open")) closePanels();
    else closePublication();
    return;
  }

  if (body.dataset.bookState !== "open" || body.classList.contains("about-open") || body.classList.contains("preorder-open")) return;
  if (event.key === "ArrowRight") isCompactBook ? turnMobilePage(1) : pageFlip?.flipNext("bottom");
  if (event.key === "ArrowLeft") isCompactBook ? turnMobilePage(-1) : pageFlip?.flipPrev("bottom");
});

document.addEventListener("click", (event) => {
  if (activeStoryFragment && !event.target.closest(".story-fragment")) clearStoryReveals();
});

externalOrder.addEventListener("click", (event) => {
  if (externalOrder.getAttribute("href") !== "#") return;
  event.preventDefault();
  orderPlaceholder.textContent = "Добавим ссылку Interbok, как только она будет готова.";
});

updateSpreadStatus(initialBookPage);
