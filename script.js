const coverToggle = document.querySelector("#cover-toggle");
const notePopover = document.querySelector("#note-popover");
const noteNumber = document.querySelector("#note-number");
const noteCopy = document.querySelector("#note-copy");
const noteClose = document.querySelector("#note-close");
const noteTriggers = [...document.querySelectorAll(".footnote-trigger")];
const readOpen = document.querySelector("#read-open");
const preorderOpen = document.querySelector("#preorder-open");
const readingPanel = document.querySelector("#about");
const preorderPanel = document.querySelector("#preorder");
const panelCloseButtons = [...document.querySelectorAll("[data-close-panel]")];

const notes = {
  language: {
    number: "Примечание 1",
    copy:
      "«Остров» задуман местом, где язык существует вне своего фонетического статуса языка определённой группы лиц. Он может существовать в любой лингвистической системе, включая наречие соли или ила, но сейчас набирается и выходит из-под пресса на русском — его лагунном диалекте, наиболее изолированном и редком.",
  },
  authors: {
    number: "Примечание 2",
    copy:
      "Остров не делит авторов на эмигрантов и оставшихся, камней и животных: он остаётся в складках между любой дихотомией, в тени за сердцем.",
  },
};

let activeTrigger = null;
let activePanelTrigger = null;

coverToggle.addEventListener("click", () => {
  if (document.body.classList.contains("cover-open")) return;
  document.body.classList.add("cover-open");
  coverToggle.setAttribute("aria-pressed", "true");
  coverToggle.setAttribute("aria-label", "Обложка первого выпуска «Острова» проявлена");
});

function closePanels({ returnFocus = true } = {}) {
  document.body.classList.remove("reading-open", "preorder-open");
  readingPanel.setAttribute("aria-hidden", "true");
  preorderPanel.setAttribute("aria-hidden", "true");
  closeNote();

  if (returnFocus && activePanelTrigger) activePanelTrigger.focus();
  activePanelTrigger = null;
}

function openPanel(panel, trigger) {
  closePanels({ returnFocus: false });
  activePanelTrigger = trigger;
  const isReading = panel === readingPanel;
  document.body.classList.add(isReading ? "reading-open" : "preorder-open");
  panel.setAttribute("aria-hidden", "false");
  window.setTimeout(() => panel.querySelector("[data-close-panel]").focus(), 120);
}

readOpen.addEventListener("click", () => openPanel(readingPanel, readOpen));
preorderOpen.addEventListener("click", () => openPanel(preorderPanel, preorderOpen));
panelCloseButtons.forEach((button) => button.addEventListener("click", () => closePanels()));

[readingPanel, preorderPanel].forEach((panel) => {
  panel.addEventListener("click", (event) => {
    if (event.target === panel) closePanels();
  });
});

function closeNote({ returnFocus = false } = {}) {
  notePopover.hidden = true;
  noteTriggers.forEach((trigger) => trigger.setAttribute("aria-expanded", "false"));
  if (returnFocus && activeTrigger) activeTrigger.focus();
  activeTrigger = null;
}

function placeNote(trigger) {
  if (window.matchMedia("(max-width: 560px)").matches) return;

  const rect = trigger.getBoundingClientRect();
  const popoverWidth = Math.min(380, window.innerWidth - 32);
  const left = Math.min(
    Math.max(16, rect.left + rect.width / 2 - popoverWidth / 2),
    window.innerWidth - popoverWidth - 16,
  );

  notePopover.style.left = `${left}px`;
  notePopover.style.top = `${Math.min(rect.bottom + 14, window.innerHeight - notePopover.offsetHeight - 16)}px`;
}

noteTriggers.forEach((trigger) => {
  trigger.setAttribute("aria-expanded", "false");
  trigger.addEventListener("click", () => {
    if (activeTrigger === trigger && !notePopover.hidden) {
      closeNote({ returnFocus: true });
      return;
    }

    const note = notes[trigger.dataset.note];
    activeTrigger = trigger;
    noteNumber.textContent = note.number;
    noteCopy.textContent = note.copy;
    noteTriggers.forEach((item) => item.setAttribute("aria-expanded", String(item === trigger)));
    notePopover.hidden = false;
    requestAnimationFrame(() => placeNote(trigger));
  });
});

noteClose.addEventListener("click", () => closeNote({ returnFocus: true }));

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!notePopover.hidden) {
    closeNote({ returnFocus: true });
  } else if (
    document.body.classList.contains("reading-open") ||
    document.body.classList.contains("preorder-open")
  ) {
    closePanels();
  }
});

document.addEventListener("click", (event) => {
  if (
    !notePopover.hidden &&
    !notePopover.contains(event.target) &&
    !event.target.closest(".footnote-trigger")
  ) {
    closeNote();
  }
});

window.addEventListener("resize", () => {
  if (activeTrigger && !notePopover.hidden) placeNote(activeTrigger);
});

document.querySelector("#external-order").addEventListener("click", (event) => {
  event.preventDefault();
  document.querySelector("#order-placeholder").textContent =
    "Здесь будет ссылка на страницу предзаказа.";
});
