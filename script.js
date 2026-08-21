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

let currentSpread = 0;
let turning = false;
let activePanelTrigger = null;
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

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (body.classList.contains("about-open") || body.classList.contains("preorder-open")) closePanels();
    else closePublication();
    return;
  }
  if (body.dataset.bookState !== "open" || body.classList.contains("about-open") || body.classList.contains("preorder-open")) return;
  if (event.key === "ArrowRight") turnTo(currentSpread + 1);
  if (event.key === "ArrowLeft") turnTo(currentSpread - 1);
});

document.querySelector("#external-order").addEventListener("click", (event) => {
  event.preventDefault();
  document.querySelector("#order-placeholder").textContent = "Здесь будет ссылка на страницу предзаказа.";
});

renderStaticSpread(currentSpread);
