---
name: run-client
description: Run, start, launch, build, screenshot, or drive the Moss storefront (client/) — a React 19 + Vite 8 app. Use when asked to run the client, verify a frontend change in a real browser, take a screenshot of the storefront, or smoke-test the client build.
---

# Run: client (Moss storefront)

React 19 + Vite 8 storefront. Driven with **`agent-browser`**
(`C:\Users\slavi\bin\agent-browser.exe`, on PATH as `agent-browser`) — this
user's preferred browser-automation CLI, with Playwright as documented
fallback. Do not reach for `chromium-cli` (not installed on this machine) or
Playwright MCP (fails to spawn here — `spawn npx ENOENT`, likely a PATH gap
in the MCP subprocess manager, not worth chasing).

Paths below are relative to `client/`.

## Prerequisites

```bash
npm install
```

`agent-browser` must already be installed and on PATH — verify with:

```bash
agent-browser --version
```

## Build

```bash
npm run build
```

Verified working — produces `dist/`. No config patches needed.

## Run (agent path)

```bash
# 1. Launch the dev server in the background and wait until it actually serves
npm run dev > /tmp/moss-client-dev.log 2>&1 &
timeout 30 bash -c 'until curl -sf http://localhost:5173 >/dev/null 2>&1; do sleep 1; done'

# 2. Drive it
agent-browser open http://localhost:5173
agent-browser snapshot -i -c              # full interactive-element tree, no scrolling needed
agent-browser fill @e19 "smoke-test@example.com"   # refs are per-snapshot — re-snapshot if the page changed
agent-browser get value @e19
agent-browser scrollintoview "#contact-us button"  # prefer a CSS selector over a stale ref (see Gotchas)
agent-browser screenshot subscribe-check.png
agent-browser console                     # check for errors before declaring success
agent-browser close

# 3. Stop the dev server — npm's wrapper does not forward SIGTERM to the
#    real vite process, so kill by the port's listener, not npm's $!
port_pid=$(netstat -ano | grep ':5173' | grep LISTENING | awk '{print $5}' | head -1)
[ -n "$port_pid" ] && powershell -Command "Stop-Process -Id $port_pid -Force"
```

`@e19` (email input) and the `#contact-us button` (Subscribe section's
"Sign Up" button) are stable anchors for this app's one form. For any other
element, run `agent-browser snapshot -i -c` first and read its ref from the
output — the tree covers the whole page, not just the current viewport, so
no scrolling is needed just to find something.

Screenshots save to the working directory the command was run from — delete
them after use (or redirect into a scratch path) rather than leaving them in
`client/`; they are not build artifacts and should not be committed.

## Run (human path)

```bash
npm run dev
```

Opens on <http://localhost:5173>. `Ctrl-C` to stop — this one *does*
receive the signal directly since it's not backgrounded.

## Test

```bash
npm test          # vitest run — single pass
npm run test:watch
```

## Gotchas

- **`agent-browser find text "X" ... scrollintoview` is invalid** —
  `scrollintoview` is not a chainable subaction on `find`. Use
  `agent-browser scrollintoview <ref-or-css-selector>` as its own command
  instead.
- **Large pixel `scroll down <px>` overshoots.** A blind
  `agent-browser scroll down 3500` landed in the wrong section entirely.
  Prefer `scrollintoview` with a ref or selector when you need a specific
  element on screen.
- **Refs go stale across interactions, not just navigations.** A ref
  captured from a snapshot taken before a `fill` didn't reliably resolve to
  the right element afterward. Re-snapshot immediately before using a ref,
  or just pass a CSS selector to whichever command needs it — selectors
  don't expire.
- **Vite's dev server has no single reliable "ready" log line to grep
  across versions.** Poll the port with `curl -sf` instead of parsing
  stdout or sleeping a fixed duration.
- **Pre-existing console errors, unrelated to whatever change you're
  checking:** duplicate React list keys in multiple sections, an invalid
  `src` attribute passed to an SVG element, and a missing-key warning
  specifically from `Footer`. All present on a clean `npm run dev` with no
  interaction. Don't mistake these for something your change caused —
  but also don't assume they're fine just because they're old.
- **Several product images in `client/src/assets/images/` are 5–13MB
  unoptimized** (seen via `npm run build` output). Way outside this
  project's own bundle budget. Unrelated to running the app, but you'll see
  it in build output and it's worth knowing it's a known, unaddressed gap
  rather than something you introduced.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `curl` poll loop times out | Check `/tmp/moss-client-dev.log` — usually port 5173 already in use from a previous unclosed session. Find and kill it: `netstat -ano \| grep ':5173' \| grep LISTENING`, then `Stop-Process -Id <pid> -Force`. |
| `agent-browser` commands hang or error on a stale session | Run `agent-browser close --all` and re-`open`. |
