import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(projectDir, "../ostrov-tilda-scroll-section.html");
const assetBase =
  "https://cdn.jsdelivr.net/gh/Nikiau12/ostrov-prototype@9a01c22cd71ca998ee6418a5651a4097225de962/";

const [htmlSource, cssSource, scriptSource] = await Promise.all([
  readFile(resolve(projectDir, "index.html"), "utf8"),
  readFile(resolve(projectDir, "styles.css"), "utf8"),
  readFile(resolve(projectDir, "script.js"), "utf8"),
]);

const bridgeScript = `
const notifyTildaHost = () => {
  const isBlocking =
    body.dataset.bookState === "open" ||
    body.classList.contains("about-open") ||
    body.classList.contains("preorder-open");

  window.parent.postMessage(
    { source: "ostrov-book", type: "interaction-state", blocking: isBlocking },
    "*"
  );
};

const hostStateObserver = new MutationObserver(notifyTildaHost);
hostStateObserver.observe(body, {
  attributes: true,
  attributeFilter: ["class", "data-book-state"],
});

window.addEventListener("pagehide", () => {
  window.parent.postMessage(
    { source: "ostrov-book", type: "interaction-state", blocking: false },
    "*"
  );
});

notifyTildaHost();
`;

let embeddedDocument = htmlSource
  .replace(
    /<title>/,
    `<base href="${assetBase}" />\n    <title>`
  )
  .replace(
    /<link rel="stylesheet" href="styles\.css\?v=\d+" \/>/,
    `<style>${cssSource}</style>`
  )
  .replace(
    /<script src="script\.js\?v=\d+"><\/script>/,
    `<script>${scriptSource}\n${bridgeScript}<\/script>`
  );

const serializedDocument = JSON.stringify(embeddedDocument).replace(
  /<\/script/gi,
  "<\\/script"
);

const sectionMarkup = `<meta charset="UTF-8" />
<section class="ostrov-book-section" id="ostrov-book-section" aria-label="Остров — литературный объект № 1">
  <iframe id="ostrov-section-frame" title="Остров — литературный объект № 1" allowfullscreen></iframe>
</section>

<style>
  .ostrov-book-section {
    position: relative;
    isolation: isolate;
    width: 100%;
    height: 100vh;
    height: 100svh;
    min-height: 0;
    overflow: clip;
    background: #050505;
    scroll-snap-align: start;
  }

  .ostrov-book-section iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
    background: #050505;
  }

  html.ostrov-interaction-open,
  html.ostrov-interaction-open body {
    overflow: hidden !important;
    overscroll-behavior: none;
  }

</style>

<script>
(() => {
  const frame = document.getElementById("ostrov-section-frame");
  const root = document.documentElement;

  frame.srcdoc = ${serializedDocument};

  const setInteractionLock = (locked) => {
    root.classList.toggle("ostrov-interaction-open", locked);
    document.body.classList.toggle("ostrov-interaction-open", locked);
  };

  window.addEventListener("message", (event) => {
    if (event.source !== frame.contentWindow) return;
    if (event.data?.source !== "ostrov-book") return;
    if (event.data?.type !== "interaction-state") return;

    setInteractionLock(Boolean(event.data.blocking));
  });

  window.addEventListener("pagehide", () => setInteractionLock(false));
})();
</script>
`;

await writeFile(outputPath, sectionMarkup, "utf8");
console.log(outputPath);
