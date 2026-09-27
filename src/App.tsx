import { createEffect, createSignal, onCleanup } from "solid-js";
import mermaid from "mermaid";

const sample = `flowchart LR
  Idea[Paste Mermaid code] --> Render{Valid syntax?}
  Render -->|Yes| Diagram[See your diagram]
  Render -->|No| Fix[Fix the highlighted issue]
  Fix --> Render`;

const sourceStorageKey = "meermaid.source";

function loadSource() {
  try {
    return localStorage.getItem(sourceStorageKey) ?? sample;
  } catch {
    return sample;
  }
}

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "strict",
  theme: "base",
  themeVariables: {
    background: "#f8faf9",
    primaryColor: "#dbe7ff",
    primaryTextColor: "#172025",
    primaryBorderColor: "#3859a8",
    lineColor: "#526068",
    secondaryColor: "#e7eee8",
    tertiaryColor: "#fff4cf",
    fontFamily: "IBM Plex Mono, ui-monospace, monospace",
  },
});

export default function App() {
  const [source, setSource] = createSignal(loadSource());
  const [svg, setSvg] = createSignal("");
  const [error, setError] = createSignal("");
  const [isRendering, setIsRendering] = createSignal(false);
  const [pasteLabel, setPasteLabel] = createSignal("Paste");
  const [zoom, setZoom] = createSignal(1);
  const [pan, setPan] = createSignal({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = createSignal(false);
  const [preview, setPreview] = createSignal<HTMLDivElement>();
  let renderId = 0;
  let dragStart: { x: number; y: number; panX: number; panY: number } | undefined;

  const clampZoom = (value: number) => Math.min(3, Math.max(0.25, value));
  const zoomBy = (amount: number) => setZoom((current) => clampZoom(current + amount));
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const zoomWithWheel = (event: WheelEvent) => {
    if (!event.metaKey && !event.ctrlKey) return;
    event.preventDefault();
    setZoom((current) => clampZoom(current * (event.deltaY < 0 ? 1.1 : 1 / 1.1)));
  };

  const startPan = (event: PointerEvent) => {
    if (!event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    preview()?.setPointerCapture(event.pointerId);
    dragStart = { x: event.clientX, y: event.clientY, panX: pan().x, panY: pan().y };
    setIsPanning(true);
  };

  const movePan = (event: PointerEvent) => {
    if (!dragStart) return;
    setPan({
      x: dragStart.panX + event.clientX - dragStart.x,
      y: dragStart.panY + event.clientY - dragStart.y,
    });
  };

  const stopPan = () => {
    dragStart = undefined;
    setIsPanning(false);
  };

  createEffect(
    () => preview(),
    (element) => {
      if (!element) return;
      element.addEventListener("wheel", zoomWithWheel, { passive: false });
      onCleanup(() => element.removeEventListener("wheel", zoomWithWheel));
    },
  );

  createEffect(
    () => source(),
    (code) => {
      try {
        localStorage.setItem(sourceStorageKey, code);
      } catch {
        // Rendering still works when browser storage is unavailable.
      }
    },
  );

  createEffect(
    () => source().trim(),
    (code) => {
      const id = ++renderId;
      const diagramId = `diagram-${id}`;
      setIsRendering(true);

      const timer = window.setTimeout(async () => {
        if (!code) {
          setSvg("");
          setError("");
          setIsRendering(false);
          return;
        }

        try {
          const result = await mermaid.render(diagramId, code);
          if (id !== renderId) return;
          setSvg(result.svg);
          setError("");
        } catch (cause) {
          document.getElementById(diagramId)?.remove();
          if (id !== renderId) return;
          setError(readError(cause));
        } finally {
          if (id === renderId) setIsRendering(false);
        }
      }, 280);

      return () => window.clearTimeout(timer);
    },
  );

  const paste = async () => {
    try {
      setSource(await navigator.clipboard.readText());
      setPasteLabel("Pasted");
      window.setTimeout(() => setPasteLabel("Paste"), 1400);
    } catch {
      setPasteLabel("Use ⌘V");
      window.setTimeout(() => setPasteLabel("Paste"), 1800);
    }
  };

  return (
    <main class="app-shell">
      <header class="masthead">
        <a class="wordmark" href={import.meta.env.BASE_URL} aria-label="Meermaid home">
          <span class="mark" aria-hidden="true">
            <svg viewBox="0 0 29 29" width="29" height="29" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true" tabindex="-1">
              <path d="M5 17V9l9.5 8L24 9v8M5 21c3-3 6-3 9.5 0s6.5 3 9.5 0" />
            </svg>
          </span>
          <span>Meermaid</span>
        </a>
        <p>Mermaid in. Diagram out.</p>
        <a class="github-link" href="https://github.com/bjesuiter/meermaid-spa">
          <img src="https://api.iconify.design/simple-icons/github.svg?color=%23172025" width="16" height="16" alt="" />
          <span>Source ↗</span>
        </a>
      </header>

      <section class="intro" aria-labelledby="page-title">
        <svg class="sea-horizon" viewBox="0 0 400 110" width="400" height="110" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" aria-hidden="true" tabindex="-1">
          <circle class="sea-sun" cx="300" cy="43" r="23" />
          <path d="M14 76c38-12 67-12 108 0s73 12 113 0 80-12 151 0M58 88c30-7 52-6 83 2s67 8 103-1 74-9 109-1M186 101c33 3 51-4 75-5s38 0 53 3" />
          <path class="sea-birds" d="M178 30q9-8 18 0 9-8 18 0M230 17q6-5 12 0 6-5 12 0" />
        </svg>
        <p class="eyebrow">A small diagram workbench</p>
        <h1 id="page-title">Turn syntax into shape.</h1>
        <p>Paste Mermaid code on the left. Your diagram appears on the right as you type.</p>
      </section>

      <section class="workbench">
        <article class="panel editor-panel">
          <div class="panel-bar">
            <div>
              <span class="panel-index">Input</span>
              <h2>Mermaid code</h2>
            </div>
            <div class="actions">
              <button type="button" onClick={paste}>{pasteLabel()}</button>
              <button type="button" onClick={() => setSource("")}>Clear</button>
            </div>
          </div>
          <div class="editor-wrap">
            <span class="line-number" aria-hidden="true">01</span>
            <textarea
              aria-label="Mermaid code"
              value={source()}
              onInput={(event) => setSource(event.currentTarget.value)}
              spellcheck={false}
              wrap="off"
            />
          </div>
        </article>

        <article class="panel preview-panel">
          <div class="panel-bar">
            <div>
              <span class="panel-index">Output</span>
              <h2>Diagram</h2>
            </div>
            <div class="preview-tools">
              <div class="zoom-controls" aria-label="Diagram zoom controls">
                <button type="button" onClick={() => zoomBy(-0.1)} aria-label="Zoom out" title="Zoom out">−</button>
                <output aria-label={`Zoom level: ${Math.round(zoom() * 100)} percent`}>{Math.round(zoom() * 100)}%</output>
                <button type="button" onClick={() => zoomBy(0.1)} aria-label="Zoom in" title="Zoom in">+</button>
                <button type="button" onClick={resetView} class="reset-view" title="Reset view">Reset</button>
              </div>
              <span
                class={[
                  "status",
                  {
                    busy: isRendering(),
                    invalid: Boolean(error()),
                    idle: !source().trim(),
                  },
                ]}
              >
                {isRendering()
                  ? "Rendering"
                  : !source().trim()
                    ? "Waiting"
                    : error()
                      ? "Check syntax"
                      : "Live"}
              </span>
            </div>
          </div>
          <div
            class={isPanning() ? "preview panning" : "preview"}
            aria-live="polite"
            ref={setPreview}
            onPointerDown={startPan}
            onPointerMove={movePan}
            onPointerUp={stopPan}
            onPointerCancel={stopPan}
          >
            {error() ? (
              <div class="error-card" role="alert">
                <span>Syntax error</span>
                <p>{error()}</p>
              </div>
            ) : svg() ? (
              <div
                class="diagram"
                style={{ transform: `translate(${pan().x}px, ${pan().y}px) scale(${zoom()})` }}
                innerHTML={svg()}
              />
            ) : (
              <div class="empty-state">
                <span aria-hidden="true">↗</span>
                <p>Paste some Mermaid code to begin.</p>
              </div>
            )}
          </div>
        </article>
      </section>

      <div class="tideline" aria-hidden="true">
        <svg viewBox="0 0 1440 76" width="1440" height="76" fill="none" stroke="currentColor" stroke-width="1" preserveAspectRatio="xMidYMid slice" aria-hidden="true" tabindex="-1">
          <path d="M1 20c120-20 180-20 300 0s180 20 300 0 180-20 300 0 180 20 300 0 180-20 239-9" />
          <path d="M1 33c120-20 180-20 300 0s180 20 300 0 180-20 300 0 180 20 300 0 180-20 239-9" opacity=".65" />
          <path d="M1 46c120-20 180-20 300 0s180 20 300 0 180-20 300 0 180 20 300 0 180-20 239-9" opacity=".35" />
        </svg>
        <span>Meer <span lang="de">/meːɐ̯/</span> · German for sea</span>
      </div>

      <footer>
        <span>Built with Solid 2.0 RC</span>
        <span>Runs entirely in your browser</span>
      </footer>
    </main>
  );
}

function readError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : String(cause);
  return message.split("\n").find((line) => line.trim()) ?? "The diagram could not be rendered.";
}
