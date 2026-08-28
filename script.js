const pageImages = [
  ...Array.from(
    { length: 10 },
    (_, index) => index + 1
  ),
  13,
  14,
].map(
  (pageNumber) =>
    `assets/ostrov-page-${String(pageNumber).padStart(2, "0")}.png?v=3`
);


const body =
  document.body;

const hero =
  document.querySelector(".hero");

const openDismiss =
  document.querySelector("#open-dismiss");

const coverToggle =
  document.querySelector("#cover-toggle");

const openBook =
  document.querySelector("#open-book");

const pageFlipElement =
  document.querySelector("#page-flip");

const spreadStatus =
  document.querySelector("#spread-status");

const aboutPanel =
  document.querySelector("#about");

const preorderPanel =
  document.querySelector("#preorder");

const panelCloseButtons = [
  ...document.querySelectorAll(
    "[data-close-panel]"
  ),
];

const storyFragments = [
  ...document.querySelectorAll(
    ".story-fragment"
  ),
];

const mobileStoryTrigger =
  document.querySelector(
    "#story-mobile-trigger"
  );

const preorderButton =
  document.querySelector(
    "#preorder-open-secondary"
  );

const externalOrder =
  document.querySelector(
    "#external-order"
  );

const orderPlaceholder =
  document.querySelector(
    "#order-placeholder"
  );


/*
  Все устройства до 1024px
  используют compact reader.

  Также touch-устройства с coarse pointer.
*/
const isCompactBook =
  window.matchMedia(
    "(max-width: 1024px), (hover: none) and (pointer: coarse)"
  ).matches;


const initialBookPage = 0;

const spreadCount =
  Math.ceil(
    pageImages.length / 2
  );


let pageFlip = null;

let mobileReader = null;

let mobileSpreadIndex = 0;

let mobileTurning = false;

let mobilePointerStart = null;

let activePanelTrigger = null;

let activeStoryFragment = null;


/* ======================================================
   PRELOAD
====================================================== */

pageImages.forEach(
  (src) => {

    const image =
      new Image();

    image.src = src;

  }
);


/* ======================================================
   STATUS
====================================================== */

function updateSpreadStatus(
  pageIndex = 0
) {

  if (isCompactBook) {

    spreadStatus.textContent =
      `Разворот ${
        pageIndex + 1
      } из ${spreadCount}`;

    return;
  }


  const spreadIndex =
    Math.floor(
      pageIndex / 2
    );


  spreadStatus.textContent =
    `Разворот ${
      spreadIndex + 1
    } из ${spreadCount}`;

}


/* ======================================================
   MOBILE / TABLET READER
====================================================== */

function renderMobileSpread(
  surface,
  spreadIndex
) {

  const images =
    surface.querySelectorAll("img");


  images.forEach(
    (image, side) => {

      const pageIndex =
        spreadIndex * 2 + side;

      const src =
        pageImages[pageIndex];


      if (src) {

        image.src = src;

        image.alt =
          `Страница ${
            pageIndex + 1
          } журнала «Остров»`;

        image.style.display =
          "";

      } else {

        image.removeAttribute(
          "src"
        );

        image.alt = "";

        image.style.display =
          "none";

      }

    }
  );

}


/*
  При каждом открытии mobile/tablet
  начинаем с страниц 1 + 2.
*/
function resetMobileReader() {

  if (!mobileReader) {
    return;
  }


  mobileSpreadIndex = 0;

  mobileTurning = false;


  renderMobileSpread(
    mobileReader.base,
    mobileSpreadIndex
  );


  mobileReader.turn.className =
    "mobile-page-turn";


  updateSpreadStatus(
    mobileSpreadIndex
  );

}


/*
  Перелистывание.

  Индекс начинается с 0:
  0 = страницы 1 + 2
  1 = страницы 3 + 4
  ...
*/
function turnMobileSpread(
  step
) {

  if (
    !mobileReader ||
    mobileTurning
  ) {
    return;
  }


  const nextIndex =
    Math.max(
      0,
      Math.min(
        spreadCount - 1,
        mobileSpreadIndex + step
      )
    );


  if (
    nextIndex ===
    mobileSpreadIndex
  ) {
    return;
  }


  mobileTurning = true;


  mobileReader.turn.className =
    "mobile-page-turn";


  /*
    Новый разворот снизу.
  */
  renderMobileSpread(
    mobileReader.base,
    nextIndex
  );


  /*
    Старый разворот сверху.
  */
  renderMobileSpread(
    mobileReader.turn,
    mobileSpreadIndex
  );


  mobileReader.turn
    .querySelectorAll("img")
    .forEach(
      (image) => {
        image.alt = "";
      }
    );


  /*
    Принудительный reflow.
  */
  void mobileReader.turn.offsetWidth;


  mobileReader.turn.classList.add(
    step > 0
      ? "is-turning-next"
      : "is-turning-prev"
  );


  mobileSpreadIndex =
    nextIndex;


  updateSpreadStatus(
    mobileSpreadIndex
  );


  window.setTimeout(
    () => {

      if (!mobileReader) {
        return;
      }


      mobileReader.turn.className =
        "mobile-page-turn";


      mobileTurning = false;

    },
    700
  );

}


/*
  Создаём mobile reader только один раз.
*/
function ensureMobileReader() {

  if (mobileReader) {
    return;
  }


  const stack =
    document.createElement("div");

  const base =
    document.createElement("div");

  const turn =
    document.createElement("div");


  pageFlipElement.classList.add(
    "mobile-page-reader"
  );


  stack.className =
    "mobile-page-stack";

  base.className =
    "mobile-page-base";

  turn.className =
    "mobile-page-turn";


  [base, turn].forEach(
    (surface) => {

      for (
        let side = 0;
        side < 2;
        side += 1
      ) {

        const image =
          document.createElement(
            "img"
          );


        image.draggable = false;


        surface.append(image);

      }

    }
  );


  stack.append(
    base,
    turn
  );


  pageFlipElement.append(
    stack
  );


  mobileReader = {
    stack,
    base,
    turn,
  };


  resetMobileReader();


  /* --------------------------------------------------
     TOUCH START
  -------------------------------------------------- */

  pageFlipElement.addEventListener(
    "pointerdown",
    (event) => {

      if (
        body.dataset.bookState !==
        "open"
      ) {
        return;
      }


      mobilePointerStart = {
        x: event.clientX,
        y: event.clientY,
        id: event.pointerId,
      };


      pageFlipElement
        .setPointerCapture?.(
          event.pointerId
        );

    }
  );


  /* --------------------------------------------------
     TOUCH END
  -------------------------------------------------- */

  pageFlipElement.addEventListener(
    "pointerup",
    (event) => {

      if (
        !mobilePointerStart ||
        mobilePointerStart.id !==
          event.pointerId
      ) {
        return;
      }


      const deltaX =
        event.clientX -
        mobilePointerStart.x;


      const deltaY =
        event.clientY -
        mobilePointerStart.y;


      const bounds =
        pageFlipElement
          .getBoundingClientRect();


      mobilePointerStart =
        null;


      /*
        SWIPE
      */
      if (
        Math.abs(deltaX) > 28 &&
        Math.abs(deltaX) >
          Math.abs(deltaY)
      ) {

        turnMobileSpread(
          deltaX < 0
            ? 1
            : -1
        );

        return;
      }


      /*
        TAP

        правая половина -> вперёд
        левая половина -> назад
      */
      if (
        Math.abs(deltaX) < 12 &&
        Math.abs(deltaY) < 12
      ) {

        turnMobileSpread(
          event.clientX >
          bounds.left +
            bounds.width / 2
            ? 1
            : -1
        );

      }

    }
  );


  pageFlipElement.addEventListener(
    "pointercancel",
    () => {

      mobilePointerStart =
        null;

    }
  );

}


/* ======================================================
   DESKTOP READER
====================================================== */

function ensurePageFlip() {

  /*
    Телефон/планшет.
  */
  if (isCompactBook) {

    ensureMobileReader();

    return;
  }


  /*
    Desktop уже создан.
  */
  if (pageFlip) {
    return;
  }


  const pageElements =
    pageImages.map(
      (src, index) => {

        const page =
          document.createElement(
            "div"
          );

        const image =
          document.createElement(
            "img"
          );


        page.className =
          "book-page";


        image.src =
          src;


        image.alt =
          `Страница ${
            index + 1
          } журнала «Остров»`;


        image.draggable =
          false;


        page.append(
          image
        );


        pageFlipElement.append(
          page
        );


        return page;

      }
    );


  pageFlip =
    new St.PageFlip(
      pageFlipElement,
      {

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

        startPage:
          initialBookPage,

        autoSize: false,

        maxShadowOpacity:
          .42,

        showCover: false,

        mobileScrollSupport:
          false,

        swipeDistance:
          16,

        useMouseEvents:
          true,

      }
    );


  pageFlip.on(
    "flip",
    (event) => {

      updateSpreadStatus(
        event.data
      );

    }
  );


  pageFlip.loadFromHTML(
    pageElements
  );

}


/* ======================================================
   STORY
====================================================== */

function clearStoryReveals() {

  storyFragments.forEach(
    (fragment) => {

      fragment.classList.remove(
        "is-revealed"
      );

    }
  );


  activeStoryFragment?.blur();


  activeStoryFragment =
    null;

}


function toggleStoryReveal(
  fragment
) {

  const shouldReveal =
    !fragment.classList.contains(
      "is-revealed"
    );


  clearStoryReveals();


  if (!shouldReveal) {
    return;
  }


  activeStoryFragment =
    fragment;


  fragment.classList.add(
    "is-revealed"
  );

}


storyFragments.forEach(
  (fragment) => {

    fragment.addEventListener(
      "click",
      () => {

        toggleStoryReveal(
          fragment
        );

      }
    );


    fragment.addEventListener(
      "keydown",
      (event) => {

        if (
          ![
            "Enter",
            " ",
          ].includes(
            event.key
          )
        ) {
          return;
        }


        event.preventDefault();


        toggleStoryReveal(
          fragment
        );

      }
    );

  }
);


/* ======================================================
   OPEN PUBLICATION
====================================================== */

function openPublication() {

  /*
    Уже открыт.
  */
  if (
    body.dataset.bookState ===
    "open"
  ) {
    return;
  }


  clearStoryReveals();


  /*
    ===============================================
    DESKTOP

    Клик сразу открывает журнал.

    MOBILE/TABLET

    Первый тап снимает кальку и показывает чистую
    обложку, второй открывает журнал.
    ===============================================
  */

  if (
    isCompactBook &&
    body.dataset.bookState === "vellum"
  ) {
    body.dataset.bookState = "cover";

    coverToggle.setAttribute(
      "aria-label",
      "Открыть журнал"
    );

    return;
  }

  body.dataset.bookState =
    "open";


  openBook.setAttribute(
    "aria-hidden",
    "false"
  );


  coverToggle.setAttribute(
    "aria-label",
    "Закрыть журнал"
  );


  window.requestAnimationFrame(
    () => {

      ensurePageFlip();


      /*
        Mobile/tablet всегда открываем
        с первого разворота.
      */
      if (
        isCompactBook &&
        mobileReader
      ) {

        resetMobileReader();

      }

    }
  );

}


/* ======================================================
   CLOSE PUBLICATION
====================================================== */

function closePublication() {

  if (
    body.dataset.bookState !==
    "open"
  ) {
    return;
  }


  body.dataset.bookState =
    "vellum";


  openBook.setAttribute(
    "aria-hidden",
    "true"
  );


  /*
    Desktop.
  */
  pageFlip?.turnToPage(
    initialBookPage
  );


  /*
    Mobile/tablet.
  */
  resetMobileReader();


  updateSpreadStatus(
    0
  );


  coverToggle.setAttribute(
    "aria-label",
    isCompactBook
      ? "Показать обложку журнала"
      : "Открыть журнал"
  );

}


/* ======================================================
   COVER
====================================================== */

coverToggle.addEventListener(
  "click",
  openPublication
);


/* ======================================================
   CLOSE BY BACKGROUND
====================================================== */

openDismiss.addEventListener(
  "click",
  closePublication
);


openDismiss.addEventListener(
  "pointerdown",
  (event) => {

    event.preventDefault();

    closePublication();

  }
);


hero.addEventListener(
  "click",
  (event) => {

    if (
      body.dataset.bookState !==
      "open"
    ) {
      return;
    }


    /*
      Клик внутри журнала его не закрывает.
    */
    if (
      event
        .composedPath()
        .includes(
          openBook
        ) ||
      event.target.closest(
        "button, a"
      )
    ) {
      return;
    }


    closePublication();

  }
);


/* ======================================================
   PANELS
====================================================== */

function closePanels(
  {
    returnFocus = true,
  } = {}
) {

  body.classList.remove(
    "about-open",
    "preorder-open"
  );


  aboutPanel.setAttribute(
    "aria-hidden",
    "true"
  );


  preorderPanel.setAttribute(
    "aria-hidden",
    "true"
  );


  if (
    returnFocus &&
    activePanelTrigger
  ) {

    activePanelTrigger.focus();

  }


  activePanelTrigger =
    null;

}


function openPanel(
  panel,
  trigger
) {

  closePanels({
    returnFocus: false,
  });


  clearStoryReveals();


  activePanelTrigger =
    trigger;


  const isAbout =
    panel === aboutPanel;


  body.classList.add(
    isAbout
      ? "about-open"
      : "preorder-open"
  );


  panel.setAttribute(
    "aria-hidden",
    "false"
  );


  window.setTimeout(
    () => {

      panel
        .querySelector(
          "[data-close-panel]"
        )
        ?.focus();

    },
    100
  );

}


mobileStoryTrigger
  .addEventListener(
    "click",
    () => {

      openPanel(
        aboutPanel,
        mobileStoryTrigger
      );

    }
  );


preorderButton
  .addEventListener(
    "click",
    () => {

      openPanel(
        preorderPanel,
        preorderButton
      );

    }
  );


panelCloseButtons.forEach(
  (button) => {

    button.addEventListener(
      "click",
      () => {

        closePanels();

      }
    );

  }
);


[
  aboutPanel,
  preorderPanel,
].forEach(
  (panel) => {

    panel.addEventListener(
      "click",
      (event) => {

        if (
          event.target === panel
        ) {

          closePanels();

        }

      }
    );

  }
);


/* ======================================================
   KEYBOARD
====================================================== */

document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Escape"
    ) {

      if (
        activeStoryFragment
      ) {

        clearStoryReveals();

      } else if (
        body.classList.contains(
          "about-open"
        ) ||
        body.classList.contains(
          "preorder-open"
        )
      ) {

        closePanels();

      } else {

        closePublication();

      }


      return;

    }


    if (
      body.dataset.bookState !==
        "open" ||
      body.classList.contains(
        "about-open"
      ) ||
      body.classList.contains(
        "preorder-open"
      )
    ) {
      return;
    }


    if (
      event.key ===
      "ArrowRight"
    ) {

      if (isCompactBook) {

        turnMobileSpread(1);

      } else {

        pageFlip?.flipNext(
          "bottom"
        );

      }

    }


    if (
      event.key ===
      "ArrowLeft"
    ) {

      if (isCompactBook) {

        turnMobileSpread(-1);

      } else {

        pageFlip?.flipPrev(
          "bottom"
        );

      }

    }

  }
);


/* ======================================================
   STORY OUTSIDE CLICK
====================================================== */

document.addEventListener(
  "click",
  (event) => {

    if (
      activeStoryFragment &&
      !event.target.closest(
        ".story-fragment"
      )
    ) {

      clearStoryReveals();

    }

  }
);


/* ======================================================
   ORDER
====================================================== */

externalOrder.addEventListener(
  "click",
  (event) => {

    if (
      externalOrder.getAttribute(
        "href"
      ) !== "#"
    ) {
      return;
    }


    event.preventDefault();


    orderPlaceholder.textContent =
      "Добавим ссылку Interbok, как только она будет готова.";

  }
);


/* ======================================================
   INITIAL STATE
====================================================== */

body.dataset.bookState =
  "vellum";


updateSpreadStatus(
  0
);


coverToggle.setAttribute(
  "aria-label",
  isCompactBook
    ? "Показать обложку журнала"
    : "Открыть журнал"
);
