const pageImages = Array.from({ length: 8 }, (_, index) =>
  `assets/odyssey-page-${String(index + 1).padStart(2, "0")}.png`
);

const body = document.body;
const hero = document.querySelector(".hero");
const objectStage = document.querySelector("#object-stage");
const coverToggle = document.querySelector("#cover-toggle");
const bookAction = document.querySelector("#book-action");
const bookActionLabel = document.querySelector("#book-action-label");
const openBook = document.querySelector("#open-book");
const pageFlipElement = document.querySelector("#page-flip");
const spreadStatus = document.querySelector("#spread-status");
const aboutPanel = document.querySelector("#about");
const preorderPanel = document.querySelector("#preorder");
const panelCloseButtons = [...document.querySelectorAll("[data-close-panel]")];
const notePopover = document.querySelector("#note-popover");
const noteNumber = document.querySelector("#note-number");
const noteCopy = document.querySelector("#note-copy");
const noteClose = document.querySelector("#note-close");
const noteTriggers = [...document.querySelectorAll(".footnote-trigger")];

const notes = {
  language: {
    number: "Примечание 1",
    copy: "«Остров» задуман местом, где язык существует вне своего фонетического статуса языка определённой группы лиц. Он может существовать в любой лингвистической системе, включая наречие соли или ила, но сейчас набирается и выходит из-под пресса на русском — его лагунном диалекте, наиболее изолированном и редком.",
  },
  authors: {
    number: "Примечание 2",
    copy: "Остров не делит авторов на эмигрантов и оставшихся, камней и животных: он остаётся в складках между любой дихотомией, в тени за сердцем.",
  },
};

let pageFlip = null;
let activePanelTrigger = null;
let activeNoteTrigger = null;

pageImages.forEach((src) => {
  const image = new Image();
  image.src = src;
});

function updateSpreadStatus(pageIndex = 0) {
  spreadStatus.textContent = `Разворот ${Math.floor(pageIndex / 2) + 1} из 4`;
}

function ensurePageFlip() {
  if (pageFlip) return;
  const pageElements = pageImages.map((src, index) => {
    const page = document.createElement("div");
    const image = document.createElement("img");

    page.className = "book-page";
    image.src = src;
    image.alt = `Страница ${index + 1} фрагмента «Одиссеи»`;
    image.draggable = false;
    page.append(image);
    pageFlipElement.append(page);
    return page;
  });

  pageFlip = new St.PageFlip(pageFlipElement, {
    width: 748,
    height: 1033,
    size: "stretch",
    minWidth: 240,
    maxWidth: 748,
    minHeight: 331,
    maxHeight: 1033,
    drawShadow: true,
    flippingTime: 860,
    usePortrait: false,
    startPage: 0,
    autoSize: true,
    maxShadowOpacity: .42,
    showCover: false,
    mobileScrollSupport: false,
    swipeDistance: 16,
    useMouseEvents: true,
  });
  pageFlip.on("flip", (event) => updateSpreadStatus(event.data));
  pageFlip.loadFromHTML(pageElements);
}

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
  body.dataset.bookState = "open";
  openBook.setAttribute("aria-hidden", "false");
  window.requestAnimationFrame(ensurePageFlip);
}

function closePublication() {
  if (body.dataset.bookState !== "open") return;
  body.dataset.bookState = "cover";
  openBook.setAttribute("aria-hidden", "true");
  pageFlip?.turnToPage(0);
  updateSpreadStatus(0);
  coverToggle.setAttribute("aria-label", "Открыть книгу");
  bookActionLabel.textContent = "открыть книгу";
}

coverToggle.addEventListener("click", openPublication);
bookAction.addEventListener("click", openPublication);

hero.addEventListener("click", (event) => {
  if (body.dataset.bookState !== "open") return;
  if (event.composedPath().includes(objectStage) || event.target.closest("button, a")) return;
  closePublication();
});

function closePanels({ returnFocus = true } = {}) {
  body.classList.remove("about-open", "preorder-open");
  aboutPanel.setAttribute("aria-hidden", "true");
  preorderPanel.setAttribute("aria-hidden", "true");
  closeNote();
  if (returnFocus && activePanelTrigger) activePanelTrigger.focus();
  activePanelTrigger = null;
}

function openPanel(panel, trigger) {
  closePanels({ returnFocus: false });
  activePanelTrigger = trigger;
  const isAbout = panel === aboutPanel;
  body.classList.add(isAbout ? "about-open" : "preorder-open");
  panel.setAttribute("aria-hidden", "false");
  window.setTimeout(() => panel.querySelector("[data-close-panel]").focus(), 100);
}

document.querySelector("#about-open").addEventListener("click", (event) => openPanel(aboutPanel, event.currentTarget));
[document.querySelector("#preorder-open"), document.querySelector("#preorder-open-secondary")].forEach((button) => {
  button.addEventListener("click", () => openPanel(preorderPanel, button));
});
panelCloseButtons.forEach((button) => button.addEventListener("click", () => closePanels()));
[aboutPanel, preorderPanel].forEach((panel) => panel.addEventListener("click", (event) => {
  if (event.target === panel) closePanels();
}));

function closeNote({ returnFocus = false } = {}) {
  notePopover.hidden = true;
  noteTriggers.forEach((trigger) => trigger.setAttribute("aria-expanded", "false"));
  if (returnFocus && activeNoteTrigger) activeNoteTrigger.focus();
  activeNoteTrigger = null;
}

function placeNote(trigger) {
  if (window.matchMedia("(max-width: 620px)").matches) return;
  const rect = trigger.getBoundingClientRect();
  const width = Math.min(380, window.innerWidth - 32);
  const left = Math.min(Math.max(16, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 16);
  const top = Math.min(rect.bottom + 14, window.innerHeight - notePopover.offsetHeight - 16);
  notePopover.style.left = `${left}px`;
  notePopover.style.top = `${Math.max(16, top)}px`;
}

noteTriggers.forEach((trigger) => {
  trigger.setAttribute("aria-expanded", "false");
  trigger.addEventListener("click", () => {
    if (activeNoteTrigger === trigger && !notePopover.hidden) {
      closeNote({ returnFocus: true });
      return;
    }
    const note = notes[trigger.dataset.note];
    activeNoteTrigger = trigger;
    noteNumber.textContent = note.number;
    noteCopy.textContent = note.copy;
    noteTriggers.forEach((item) => item.setAttribute("aria-expanded", String(item === trigger)));
    notePopover.hidden = false;
    requestAnimationFrame(() => placeNote(trigger));
  });
});

noteClose.addEventListener("click", () => closeNote({ returnFocus: true }));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!notePopover.hidden) closeNote({ returnFocus: true });
    else if (body.classList.contains("about-open") || body.classList.contains("preorder-open")) closePanels();
    else closePublication();
    return;
  }
  if (body.dataset.bookState !== "open" || body.classList.contains("about-open") || body.classList.contains("preorder-open")) return;
  if (event.key === "ArrowRight") pageFlip?.flipNext("bottom");
  if (event.key === "ArrowLeft") pageFlip?.flipPrev("bottom");
});

document.addEventListener("click", (event) => {
  if (!notePopover.hidden && !notePopover.contains(event.target) && !event.target.closest(".footnote-trigger")) closeNote();
});

window.addEventListener("resize", () => {
  if (activeNoteTrigger && !notePopover.hidden) placeNote(activeNoteTrigger);
});

document.querySelector("#external-order").addEventListener("click", (event) => {
  event.preventDefault();
  document.querySelector("#order-placeholder").textContent = "Здесь будет ссылка на страницу предзаказа.";
});

updateSpreadStatus();
