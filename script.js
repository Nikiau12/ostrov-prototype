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

function ensurePageFlip() {
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
    minWidth: isCompactBook ? 260 : 150,
    maxWidth: 822,
    minHeight: isCompactBook ? 373 : 215,
    maxHeight: 1180,
    drawShadow: true,
    flippingTime: 900,
    usePortrait: true,
    startPage: initialBookPage,
    autoSize: true,
    maxShadowOpacity: .42,
    showCover: false,
    mobileScrollSupport: false,
    swipeDistance: isCompactBook ? 8 : 16,
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

function removeVellum() {
  if (body.dataset.bookState !== "vellum") return;
  body.dataset.bookState = "cover";
  coverToggle.setAttribute("aria-label", "Открыть книгу");
  bookActionLabel.textContent = "открыть книгу";
}

function openPublication() {
  if (body.dataset.bookState === "vellum") {
    removeVellum();
    return;
  }
  if (body.dataset.bookState !== "cover") return;

  clearStoryReveals();
  body.dataset.bookState = "open";
  openBook.setAttribute("aria-hidden", "false");
  window.requestAnimationFrame(ensurePageFlip);
}

function closePublication() {
  if (body.dataset.bookState !== "open") return;
  body.dataset.bookState = "cover";
  openBook.setAttribute("aria-hidden", "true");
  pageFlip?.turnToPage(initialBookPage);
  updateSpreadStatus(initialBookPage);
  coverToggle.setAttribute("aria-label", "Открыть книгу");
  bookActionLabel.textContent = "открыть книгу";
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
  if (event.key === "ArrowRight") pageFlip?.flipNext("bottom");
  if (event.key === "ArrowLeft") pageFlip?.flipPrev("bottom");
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
