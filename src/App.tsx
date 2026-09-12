import { createEffect, createSignal } from "solid-js";
import mermaid from "mermaid";

const sample = `flowchart LR
  Idea[Paste Mermaid code] --> Render{Valid syntax?}
  Render -->|Yes| Diagram[See your diagram]
  Render -->|No| Fix[Fix the highlighted issue]
  Fix --> Render`;

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
  const [source, setSource] = createSignal(sample);
  const [svg, setSvg] = createSignal("");
  const [error, setError] = createSignal("");
  const [isRendering, setIsRendering] = createSignal(false);
  const [pasteLabel, setPasteLabel] = createSignal("Paste");
  let renderId = 0;

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
          <span class="mark" aria-hidden="true">M</span>
          <span>Meermaid</span>
        </a>
        <p>Mermaid in. Diagram out.</p>
        <a class="github-link" href="https://github.com/bjesuiter/meermaid-spa">
          Source ↗
        </a>
      </header>

      <section class="intro" aria-labelledby="page-title">
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
          <div class="preview" aria-live="polite">
            {error() ? (
              <div class="error-card" role="alert">
                <span>Syntax error</span>
                <p>{error()}</p>
              </div>
            ) : svg() ? (
              <div class="diagram" innerHTML={svg()} />
            ) : (
              <div class="empty-state">
                <span aria-hidden="true">↗</span>
                <p>Paste some Mermaid code to begin.</p>
              </div>
            )}
          </div>
        </article>
      </section>

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
