const spreads = [
  { src: "assets/odyssey-spread-01.png", alt: "Титульный разворот книги" },
  { src: "assets/odyssey-spread-02.png", alt: "Первый разворот текста Одиссеи" },
  { src: "assets/odyssey-spread-03.png", alt: "Разворот страниц 8 и 9" },
  { src: "assets/odyssey-spread-04.png", alt: "Разворот страниц 10 и 11" },
];

const body = document.body;
const hero = document.querySelector(".hero");
const objectStage = document.querySelector("#object-stage");
const coverToggle = document.querySelector("#cover-toggle");
const bookAction = document.querySelector("#book-action");
const bookActionLabel = document.querySelector("#book-action-label");
const openBook = document.querySelector("#open-book");
const spreadWindow = document.querySelector("#spread-window");
const staticLeftImage = document.querySelector("#static-left-image");
const staticRightImage = document.querySelector("#static-right-image");
const turningLeaf = document.querySelector("#turning-leaf");
const leafFront = document.querySelector(".leaf-face--front");
const leafBack = document.querySelector(".leaf-face--back");
const leafFrontImage = document.querySelector("#leaf-front-image");
const leafBackImage = document.querySelector("#leaf-back-image");
const spreadStatus = document.querySelector("#spread-status");
const pagePrevious = document.querySelector("#page-previous");
const pageNext = document.querySelector("#page-next");
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

let currentSpread = 0;
let turning = false;
let activePanelTrigger = null;
let activeNoteTrigger = null;
let pointerStartX = null;

spreads.forEach(({ src }) => {
  const image = new Image();
  image.src = src;
});

function setFaceHalf(face, half) {
  face.classList.remove("page-half--left", "page-half--right");
  face.classList.add(`page-half--${half}`);
}

function renderStaticSpread(index) {
  staticLeftImage.src = spreads[index].src;
  staticRightImage.src = spreads[index].src;
  spreadStatus.textContent = `Разворот ${index + 1} из ${spreads.length}`;
  pagePrevious.disabled = index === 0;
  pageNext.disabled = index === spreads.length - 1;
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
  renderStaticSpread(currentSpread);
}

function closePublication() {
  if (body.dataset.bookState !== "open" || turning) return;
  body.dataset.bookState = "cover";
  openBook.setAttribute("aria-hidden", "true");
  currentSpread = 0;
  renderStaticSpread(currentSpread);
  coverToggle.setAttribute("aria-label", "Открыть книгу");
  bookActionLabel.textContent = "открыть книгу";
}

coverToggle.addEventListener("click", openPublication);
bookAction.addEventListener("click", openPublication);

function turnTo(index) {
  if (turning || index < 0 || index >= spreads.length || index === currentSpread) return;
  turning = true;
  const forward = index > currentSpread;

  turningLeaf.classList.remove("is-forward", "is-backward");

  if (forward) {
    staticLeftImage.src = spreads[currentSpread].src;
    staticRightImage.src = spreads[index].src;
    leafFrontImage.src = spreads[currentSpread].src;
    leafBackImage.src = spreads[index].src;
    setFaceHalf(leafFront, "right");
    setFaceHalf(leafBack, "left");
  } else {
    staticLeftImage.src = spreads[index].src;
    staticRightImage.src = spreads[currentSpread].src;
    leafFrontImage.src = spreads[currentSpread].src;
    leafBackImage.src = spreads[index].src;
    setFaceHalf(leafFront, "left");
    setFaceHalf(leafBack, "right");
  }

  void turningLeaf.offsetWidth;
  turningLeaf.classList.add(forward ? "is-forward" : "is-backward");

  window.setTimeout(() => {
    currentSpread = index;
    renderStaticSpread(currentSpread);
    turningLeaf.classList.remove("is-forward", "is-backward");
    turning = false;
  }, 1080);
}

pagePrevious.addEventListener("click", () => turnTo(currentSpread - 1));
pageNext.addEventListener("click", () => turnTo(currentSpread + 1));

spreadWindow.addEventListener("pointerdown", (event) => {
  pointerStartX = event.clientX;
});

spreadWindow.addEventListener("pointerup", (event) => {
  if (pointerStartX === null) return;
  const distance = event.clientX - pointerStartX;
  pointerStartX = null;
  if (Math.abs(distance) < 42) return;
  turnTo(currentSpread + (distance < 0 ? 1 : -1));
});

hero.addEventListener("click", (event) => {
  if (body.dataset.bookState !== "open") return;
  if (event.target.closest("#object-stage") || event.target.closest("button, a")) return;
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
  if (event.key === "ArrowRight") turnTo(currentSpread + 1);
  if (event.key === "ArrowLeft") turnTo(currentSpread - 1);
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

renderStaticSpread(currentSpread);
