const pageImages = [
  ...Array.from({ length: 10 }, (_, index) => index + 1),
  13,
  14,
].map(
  (pageNumber) =>
    `assets/ostrov-page-${String(pageNumber).padStart(2, "0")}.png?v=3`
);

const mobileCoverImage = "assets/ostrov_cover%2069.jpg";

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

const panelCloseButtons = [
  ...document.querySelectorAll("[data-close-panel]"),
];

const storyFragments = [
  ...document.querySelectorAll(".story-fragment"),
];

const mobileStoryTrigger = document.querySelector(
  "#story-mobile-trigger"
);

const preorderButton = document.querySelector(
  "#preorder-open-secondary"
);

const externalOrder = document.querySelector("#external-order");
const orderPlaceholder = document.querySelector("#order-placeholder");

const isCompactBook = window.matchMedia(
  "(max-width: 1024px), (hover: none) and (pointer: coarse)"
).matches;

const initialBookPage = 0;

const spreadCount = Math.ceil(pageImages.length / 2);

/*
  MOBILE / TABLET:

  body[data-book-state="vellum"]
      ↓ tap
  body[data-book-state="cover"]
      ↓ tap
  body[data-book-state="open"]

  Внутри самого ридера используются только индексы 1...spreadCount.
  Индекс 0 больше не используется как отдельная внутренняя обложка.
*/
const mobileSpreadCount = spreadCount + 1;

let pageFlip = null;
let mobileReader = null;

let mobileSpreadIndex = 1;
let mobileTurning = false;
let mobilePointerStart = null;

let activePanelTrigger = null;
let activeStoryFragment = null;


/* -------------------------------------------------------
   PRELOAD JOURNAL PAGES
------------------------------------------------------- */

pageImages.forEach((src) => {
  const image = new Image();
  image.src = src;
});


/* -------------------------------------------------------
   STATUS
------------------------------------------------------- */

function updateSpreadStatus(pageIndex = 0) {
  if (isCompactBook) {
    const safeIndex = Math.max(1, pageIndex);

    spreadStatus.textContent =
      `Разворот ${safeIndex} из ${spreadCount}`;

    return;
  }

  const spreadIndex = Math.floor(pageIndex / 2);

  spreadStatus.textContent =
    `Разворот ${spreadIndex + 1} из ${spreadCount}`;
}


/* -------------------------------------------------------
   MOBILE / TABLET READER
------------------------------------------------------- */

function renderMobileSpread(surface, spreadIndex) {
  const images = surface.querySelectorAll("img");

  /*
    Теперь мобильный reader НЕ содержит отдельную обложку.

    spreadIndex = 1
    -> ostrov-page-01 + ostrov-page-02

    spreadIndex = 2
    -> ostrov-page-03 + ostrov-page-04

    и т.д.
  */

  surface.classList.remove("is-cover");

  spreadWindow.classList.remove("is-mobile-cover");
  openBook.classList.remove("is-mobile-cover");

  images.forEach((image, side) => {
    const pageIndex = (spreadIndex - 1) * 2 + side;
    const src = pageImages[pageIndex];

    if (src) {
      image.src = src;

      image.alt =
        `Страница ${pageIndex + 1} журнала «Остров»`;

      image.style.display = "";
    } else {
      image.removeAttribute("src");
      image.alt = "";
      image.style.display = "none";
    }
  });
}


function resetMobileReader() {
  if (!mobileReader) return;

  /*
    Каждый раз при открытии журнала начинаем
    С ПЕРВОГО РАЗВОРОТА, а не с обложки.
  */
  mobileSpreadIndex = 1;
  mobileTurning = false;

  renderMobileSpread(
    mobileReader.base,
    mobileSpreadIndex
  );

  mobileReader.turn.className = "mobile-page-turn";

  updateSpreadStatus(mobileSpreadIndex);
}


function turnMobileSpread(step) {
  if (!mobileReader || mobileTurning) return;

  /*
    КРИТИЧЕСКИ ВАЖНО:

    минимальный индекс теперь 1.

    Поэтому внутри открытого журнала невозможно
    вернуться на старую внутреннюю обложку.
  */
  const nextIndex = Math.max(
    1,
    Math.min(
      mobileSpreadCount - 1,
      mobileSpreadIndex + step
    )
  );

  if (nextIndex === mobileSpreadIndex) return;

  mobileTurning = true;

  mobileReader.turn.className = "mobile-page-turn";

  /*
    Сначала готовим новый разворот снизу.
  */
  renderMobileSpread(
    mobileReader.base,
    nextIndex
  );

  /*
    Старый разворот кладём наверх
    и анимируем его уход.
  */
  renderMobileSpread(
    mobileReader.turn,
    mobileSpreadIndex
  );

  mobileReader.turn
    .querySelectorAll("img")
    .forEach((image) => {
      image.alt = "";
    });

  /*
    Форсируем reflow,
    чтобы CSS-анимация гарантированно запустилась.
  */
  void mobileReader.turn.offsetWidth;

  mobileReader.turn.classList.add(
    step > 0
      ? "is-turning-next"
      : "is-turning-prev"
  );

  mobileSpreadIndex = nextIndex;

  updateSpreadStatus(mobileSpreadIndex);

  window.setTimeout(() => {
    if (!mobileReader) return;

    mobileReader.turn.className =
      "mobile-page-turn";

    mobileTurning = false;
  }, 700);
}


function ensureMobileReader() {
  if (mobileReader) return;

  const stack = document.createElement("div");
  const base = document.createElement("div");
  const turn = document.createElement("div");

  pageFlipElement.classList.add(
    "mobile-page-reader"
  );

  stack.className = "mobile-page-stack";
  base.className = "mobile-page-base";
  turn.className = "mobile-page-turn";

  /*
    В каждом развороте две картинки:
    левая и правая страницы.
  */
  [base, turn].forEach((surface) => {
    for (let side = 0; side < 2; side += 1) {
      const image = document.createElement("img");

      image.draggable = false;

      surface.append(image);
    }
  });

  stack.append(base, turn);

  pageFlipElement.append(stack);

  mobileReader = {
    stack,
    base,
    turn,
  };

  resetMobileReader();


  /* ---------------------------------------------------
     TOUCH / POINTER
  --------------------------------------------------- */

  pageFlipElement.addEventListener(
    "pointerdown",
    (event) => {
      if (body.dataset.bookState !== "open") {
        return;
      }

      mobilePointerStart = {
        x: event.clientX,
        y: event.clientY,
        id: event.pointerId,
      };

      pageFlipElement.setPointerCapture?.(
        event.pointerId
      );
    }
  );


  pageFlipElement.addEventListener(
    "pointerup",
    (event) => {
      if (
        !mobilePointerStart ||
        mobilePointerStart.id !== event.pointerId
      ) {
        return;
      }

      const deltaX =
        event.clientX - mobilePointerStart.x;

      const deltaY =
        event.clientY - mobilePointerStart.y;

      const bounds =
        pageFlipElement.getBoundingClientRect();

      mobilePointerStart = null;


      /*
        SWIPE
      */
      if (
        Math.abs(deltaX) > 28 &&
        Math.abs(deltaX) > Math.abs(deltaY)
      ) {
        turnMobileSpread(
          deltaX < 0 ? 1 : -1
        );

        return;
      }


      /*
        TAP

        Правая половина -> вперёд
        Левая половина -> назад
      */
      if (
        Math.abs(deltaX) < 12 &&
        Math.abs(deltaY) < 12
      ) {
        turnMobileSpread(
          event.clientX >
            bounds.left + bounds.width / 2
            ? 1
            : -1
        );
      }
    }
  );


  pageFlipElement.addEventListener(
    "pointercancel",
    () => {
      mobilePointerStart = null;
    }
  );
}


/* -------------------------------------------------------
   DESKTOP PAGE FLIP
------------------------------------------------------- */

function ensurePageFlip() {
  /*
    Mobile/tablet используют наш собственный
    двухстраничный reader.
  */
  if (isCompactBook) {
    ensureMobileReader();
    return;
  }

  if (pageFlip) return;


  const pageElements = pageImages.map(
    (src, index) => {
      const page =
        document.createElement("div");

      const image =
        document.createElement("img");

      page.className = "book-page";

      image.src = src;

      image.alt =
        `Страница ${index + 1} журнала «Остров»`;

      image.draggable = false;

      page.append(image);

      pageFlipElement.append(page);

      return page;
    }
  );


  pageFlip = new St.PageFlip(
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

      startPage: initialBookPage,

      autoSize: false,

      maxShadowOpacity: 0.42,

      showCover: false,

      mobileScrollSupport: false,

      swipeDistance: 16,

      useMouseEvents: true,
    }
  );


  pageFlip.on(
    "flip",
    (event) => {
      updateSpreadStatus(event.data);
    }
  );

  pageFlip.loadFromHTML(pageElements);
}


/* -------------------------------------------------------
   STORY TEXT
------------------------------------------------------- */

function clearStoryReveals() {
  storyFragments.forEach((fragment) => {
    fragment.classList.remove("is-revealed");
  });

  activeStoryFragment?.blur();

  activeStoryFragment = null;
}


function toggleStoryReveal(fragment) {
  const shouldReveal =
    !fragment.classList.contains("is-revealed");

  clearStoryReveals();

  if (!shouldReveal) return;

  activeStoryFragment = fragment;

  fragment.classList.add("is-revealed");
}


storyFragments.forEach((fragment) => {
  fragment.addEventListener(
    "click",
    () => {
      toggleStoryReveal(fragment);
    }
  );


  fragment.addEventListener(
    "keydown",
    (event) => {
      if (
        !["Enter", " "].includes(event.key)
      ) {
        return;
      }

      event.preventDefault();

      toggleStoryReveal(fragment);
    }
  );
});


/* -------------------------------------------------------
   OPEN PUBLICATION

   MOBILE / TABLET:
   vellum -> cover -> journal

   DESKTOP:
   old behaviour remains:
   cover -> journal
------------------------------------------------------- */

function openPublication() {
  if (body.dataset.bookState === "open") {
    return;
  }

  clearStoryReveals();


  /*
    MOBILE + TABLET

    Первый тап:
    КАЛЬКА -> ОБЛОЖКА
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


  /*
    Второй тап на mobile/tablet:

    ОБЛОЖКА -> ЖУРНАЛ

    На desktop сюда попадаем сразу.
  */
  body.dataset.bookState = "open";

  openBook.setAttribute(
    "aria-hidden",
    "false"
  );

  coverToggle.setAttribute(
    "aria-label",
    "Закрыть журнал"
  );


  /*
    Гарантируем, что compact reader
    начинает именно с первого разворота.
  */
  if (isCompactBook) {
    mobileSpreadIndex = 1;
  }


  window.requestAnimationFrame(() => {
    ensurePageFlip();

    if (
      isCompactBook &&
      mobileReader
    ) {
      resetMobileReader();
    }
  });
}


/* -------------------------------------------------------
   CLOSE PUBLICATION
------------------------------------------------------- */

function closePublication() {
  if (body.dataset.bookState !== "open") {
    return;
  }


  /*
    После закрытия возвращаемся не к cover,
    а в самое начало — к кальке.
  */
  body.dataset.bookState = "vellum";


  openBook.setAttribute(
    "aria-hidden",
    "true"
  );


  /*
    Desktop.
  */
  pageFlip?.turnToPage(initialBookPage);


  /*
    Mobile/tablet.
  */
  resetMobileReader();


  updateSpreadStatus(
    isCompactBook
      ? 1
      : initialBookPage
  );


  coverToggle.setAttribute(
    "aria-label",
    isCompactBook
      ? "Показать обложку"
      : "Открыть журнал"
  );
}


/* -------------------------------------------------------
   COVER BUTTON
------------------------------------------------------- */

coverToggle.addEventListener(
  "click",
  openPublication
);


/* -------------------------------------------------------
   CLICK OUTSIDE OPEN JOURNAL
------------------------------------------------------- */

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
      body.dataset.bookState !== "open"
    ) {
      return;
    }


    /*
      Нажатия внутри книги
      НЕ закрывают журнал.
    */
    if (
      event
        .composedPath()
        .includes(openBook) ||
      event.target.closest("button, a")
    ) {
      return;
    }


    closePublication();
  }
);


/* -------------------------------------------------------
   PANELS
------------------------------------------------------- */

function closePanels({
  returnFocus = true,
} = {}) {
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


  activePanelTrigger = null;
}


function openPanel(panel, trigger) {
  closePanels({
    returnFocus: false,
  });


  clearStoryReveals();


  activePanelTrigger = trigger;


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


  window.setTimeout(() => {
    panel
      .querySelector("[data-close-panel]")
      ?.focus();
  }, 100);
}


mobileStoryTrigger.addEventListener(
  "click",
  () => {
    openPanel(
      aboutPanel,
      mobileStoryTrigger
    );
  }
);


preorderButton.addEventListener(
  "click",
  () => {
    openPanel(
      preorderPanel,
      preorderButton
    );
  }
);


panelCloseButtons.forEach((button) => {
  button.addEventListener(
    "click",
    () => {
      closePanels();
    }
  );
});


[aboutPanel, preorderPanel].forEach(
  (panel) => {
    panel.addEventListener(
      "click",
      (event) => {
        if (event.target === panel) {
          closePanels();
        }
      }
    );
  }
);


/* -------------------------------------------------------
   KEYBOARD
------------------------------------------------------- */

document.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Escape") {
      if (activeStoryFragment) {
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
      body.dataset.bookState !== "open" ||
      body.classList.contains(
        "about-open"
      ) ||
      body.classList.contains(
        "preorder-open"
      )
    ) {
      return;
    }


    if (event.key === "ArrowRight") {
      if (isCompactBook) {
        turnMobileSpread(1);
      } else {
        pageFlip?.flipNext("bottom");
      }
    }


    if (event.key === "ArrowLeft") {
      if (isCompactBook) {
        turnMobileSpread(-1);
      } else {
        pageFlip?.flipPrev("bottom");
      }
    }
  }
);


/* -------------------------------------------------------
   OUTSIDE STORY CLICK
------------------------------------------------------- */

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


/* -------------------------------------------------------
   EXTERNAL ORDER
------------------------------------------------------- */

externalOrder.addEventListener(
  "click",
  (event) => {
    if (
      externalOrder.getAttribute("href") !==
      "#"
    ) {
      return;
    }


    event.preventDefault();


    orderPlaceholder.textContent =
      "Добавим ссылку Interbok, как только она будет готова.";
  }
);


/* -------------------------------------------------------
   INITIAL STATE
------------------------------------------------------- */

if (isCompactBook) {
  /*
    Mobile/tablet начинается с КАЛЬКИ.
  */
  body.dataset.bookState = "vellum";

  mobileSpreadIndex = 1;

  updateSpreadStatus(1);

  coverToggle.setAttribute(
    "aria-label",
    "Показать обложку"
  );
} else {
  /*
    Desktop сохраняем старое поведение.
  */
  updateSpreadStatus(
    initialBookPage
  );

  coverToggle.setAttribute(
    "aria-label",
    "Открыть журнал"
  );
}