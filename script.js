const pageImages = [
  ...Array.from({ length: 10 }, (_, index) => index + 1),
  13,
  14,
].map((pageNumber) =>
  `assets/ostrov-page-${String(pageNumber).padStart(2, "0")}.png?v=3`
);
const mobileCoverImage = "assets/ostrov-cover-69.jpg";

const body = document.body;
const hero = document.querySelector(".hero");
const openDismiss = document.querySelector("#open-dismiss");
const coverToggle = document.querySelector("#cover-toggle");
const openBook = document.querySelector("#open-book");
const pageFlipElement = document.querySelector("#page-flip");
const spreadWindow = document.querySelector("#spread-window");
const spreadStatus = document.querySelector("#spread-status");
const aboutPanel = document.querySelector("#about");
const preorderPanel = document.querySelector("#preorder");
const panelCloseButtons = [...document.querySelectorAll("[data-close-panel]")];
const storyFragments = [...document.querySelectorAll(".story-fragment")];
const mobileStoryTrigger = document.querySelector("#story-mobile-trigger");
const preorderButton = document.querySelector("#preorder-open-secondary");
const externalOrder = document.querySelector("#external-order");
const orderPlaceholder = document.querySelector("#order-placeholder");
const isCompactBook = window.matchMedia("(max-width: 1024px), (hover: none) and (pointer: coarse)").matches;
const initialBookPage = 0;
const spreadCount = Math.ceil(pageImages.length / 2);
const mobileSpreadCount = spreadCount + 1;

let pageFlip = null;
let mobileReader = null;
let mobileSpreadIndex = 0;
let mobileTurning = false;
let mobilePointerStart = null;
let activePanelTrigger = null;
let activeStoryFragment = null;

pageImages.forEach((src) => {
  const image = new Image();
  image.src = src;
});

function updateSpreadStatus(pageIndex = 0) {
  if (isCompactBook && pageIndex === 0) {
    spreadStatus.textContent = "Обложка журнала";
    return;
  }
  const spreadIndex = isCompactBook ? pageIndex : Math.floor(pageIndex / 2);
  const visibleSpreadIndex = isCompactBook ? spreadIndex : spreadIndex + 1;
  spreadStatus.textContent = `Разворот ${visibleSpreadIndex} из ${spreadCount}`;
}

function renderMobileSpread(surface, spreadIndex) {
  const images = surface.querySelectorAll("img");
  const isCover = spreadIndex === 0;
  surface.classList.toggle("is-cover", isCover);
 if (surface.classList.contains("mobile-page-base")) {
  spreadWindow.classList.toggle("is-mobile-cover", isCover);
  openBook.classList.toggle("is-mobile-cover", isCover);
}

  if (isCover) {
    images[0].src = mobileCoverImage;
    images[0].alt = "Фотообложка первого номера «Острова» без кальки";
    images[1].removeAttribute("src");
    images[1].alt = "";
    return;
  }

  images.forEach((image, side) => {
    const pageIndex = (spreadIndex - 1) * 2 + side;
    image.src = pageImages[pageIndex];
    image.alt = `Страница ${pageIndex + 1} журнала «Остров»`;
  });
}

function resetMobileReader() {
  if (!mobileReader) return;
  mobileSpreadIndex = 1;
  mobileTurning = false;
  renderMobileSpread(mobileReader.base, mobileSpreadIndex);
  mobileReader.turn.className = "mobile-page-turn";
  updateSpreadStatus(mobileSpreadIndex);
}

function turnMobileSpread(step) {
  if (!mobileReader || mobileTurning) return;
  const nextIndex = Math.max(0, Math.min(mobileSpreadCount - 1, mobileSpreadIndex + step));
  if (nextIndex === mobileSpreadIndex) return;

  mobileTurning = true;
  mobileReader.turn.className = "mobile-page-turn";
  renderMobileSpread(mobileReader.base, nextIndex);
  renderMobileSpread(mobileReader.turn, mobileSpreadIndex);
  mobileReader.turn.querySelectorAll("img").forEach((image) => { image.alt = ""; });
  void mobileReader.turn.offsetWidth;
  mobileReader.turn.classList.add(step > 0 ? "is-turning-next" : "is-turning-prev");
  mobileSpreadIndex = nextIndex;
  updateSpreadStatus(mobileSpreadIndex);

  window.setTimeout(() => {
    if (!mobileReader) return;
    mobileReader.turn.className = "mobile-page-turn";
    mobileTurning = false;
  }, 700);
}

function ensureMobileReader() {
  if (mobileReader) return;

  const stack = document.createElement("div");
  const base = document.createElement("div");
  const turn = document.createElement("div");

  pageFlipElement.classList.add("mobile-page-reader");
  stack.className = "mobile-page-stack";
  base.className = "mobile-page-base";
  turn.className = "mobile-page-turn";
  [base, turn].forEach((surface) => {
    for (let side = 0; side < 2; side += 1) {
      const image = document.createElement("img");
      image.draggable = false;
      surface.append(image);
    }
  });
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
      turnMobileSpread(deltaX < 0 ? 1 : -1);
      return;
    }

    if (Math.abs(deltaX) < 12 && Math.abs(deltaY) < 12) {
      turnMobileSpread(event.clientX > bounds.left + bounds.width / 2 ? 1 : -1);
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
    flippingTime: 1050,
    usePortrait: false,
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
}

coverToggle.addEventListener("click", openPublication);
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
  if (event.key === "ArrowRight") isCompactBook ? turnMobileSpread(1) : pageFlip?.flipNext("bottom");
  if (event.key === "ArrowLeft") isCompactBook ? turnMobileSpread(-1) : pageFlip?.flipPrev("bottom");
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
