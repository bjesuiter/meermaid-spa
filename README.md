# Meermaid

A small, browser-only Mermaid diagram renderer built with SolidJS 2.0 RC. Paste Mermaid syntax and see the diagram update as you type.

Live at [bjesuiter.github.io/meermaid-spa](https://bjesuiter.github.io/meermaid-spa/).

## Run locally

```sh
pnpm install
pnpm dev
```

Run the development server in the background:

```sh
pnpm dev:bg
pnpm dev:status
pnpm dev:logs
pnpm dev:stop
```

`dev:bg` replaces an existing `meermaid-spa` process and waits until Vite opens its port.

## Build

```sh
pnpm build
```

The production files are written to `dist/`.
