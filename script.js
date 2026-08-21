const spreads = [
  { src: "assets/odyssey-spread-01.png", alt: "Титульный разворот книги" },
  { src: "assets/odyssey-spread-02.png", alt: "Первый разворот текста Одиссеи" },
  { src: "assets/odyssey-spread-03.png", alt: "Разворот страниц 8 и 9" },
  { src: "assets/odyssey-spread-04.png", alt: "Разворот страниц 10 и 11" },
];
const body = document.body;
const coverToggle = document.querySelector("#cover-toggle");
const bookAction = document.querySelector("#book-action");
const bookActionLabel = document.querySelector("#book-action-label");
const openBook = document.querySelector("#open-book");
const spreadWindow = document.querySelector("#spread-window");
const spreadImage = document.querySelector("#spread-image");
const spreadNumber = document.querySelector("#spread-number");
const previousButton = document.querySelector("#previous-button");
const nextButton = document.querySelector("#next-button");
const pagePrevious = document.querySelector("#page-previous");
const pageNext = document.querySelector("#page-next");
const aboutPanel = document.querySelector("#about");
const preorderPanel = document.querySelector("#preorder");
const panelCloseButtons = [...document.querySelectorAll("[data-close-panel]")];
let currentSpread = 0;
let turning = false;
let activePanelTrigger = null;

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
  updateNavigation();
}
coverToggle.addEventListener("click", openPublication);
bookAction.addEventListener("click", openPublication);

function updateNavigation() {
  spreadNumber.textContent = String(currentSpread + 1);
  previousButton.disabled = currentSpread === 0;
  pagePrevious.disabled = currentSpread === 0;
  nextButton.disabled = currentSpread === spreads.length - 1;
  pageNext.disabled = currentSpread === spreads.length - 1;
}
function turnTo(index) {
  if (turning || index < 0 || index >= spreads.length || index === currentSpread) return;
  turning = true;
  const direction = index > currentSpread ? "next" : "previous";
  spreadWindow.classList.add(`turn-${direction}`);
  window.setTimeout(() => {
    currentSpread = index;
    spreadImage.src = spreads[index].src;
    spreadImage.alt = spreads[index].alt;
    updateNavigation();
  }, 260);
  window.setTimeout(() => {
    spreadWindow.classList.remove(`turn-${direction}`);
    turning = false;
  }, 580);
}
previousButton.addEventListener("click", () => turnTo(currentSpread - 1));
pagePrevious.addEventListener("click", () => turnTo(currentSpread - 1));
nextButton.addEventListener("click", () => turnTo(currentSpread + 1));
pageNext.addEventListener("click", () => turnTo(currentSpread + 1));

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
  if (event.key === "Escape") return closePanels();
  if (body.dataset.bookState !== "open" || body.classList.contains("about-open") || body.classList.contains("preorder-open")) return;
  if (event.key === "ArrowRight") turnTo(currentSpread + 1);
  if (event.key === "ArrowLeft") turnTo(currentSpread - 1);
});
document.querySelector("#external-order").addEventListener("click", (event) => {
  event.preventDefault();
  document.querySelector("#order-placeholder").textContent = "Здесь будет ссылка на страницу предзаказа.";
});
updateNavigation();
