# JEV Dungeon Escape

A small turn-based browser game: collect three energy cores and reach the exit while a guardian hunts you. Play a free, offline demo or bring your own TypeSafe API key for a live JEV opponent. Plain JavaScript + Node.js; no dependencies, build step, database, or external assets.

## Run

1. Install Node.js 22 or newer.
2. Extract this archive and open a terminal in `jev-dungeon-escape`.
3. Run `node server.mjs` (or `npm start` if npm is installed).
4. Open **http://127.0.0.1:3000**. Use this exact address.

Move with arrows, WASD, or the on-screen buttons. Space waits. Walls block movement. Collect all three diamonds, then enter the green exit. The guardian moves after every second valid player turn. Touching it loses immediately. New escape resets the board. Demo mode uses shortest-path pursuit and never contacts TypeSafe.

## Live JEV / bring your own key

Obtain your key from [TypeSafe](https://typesafe.ai/), choose **JEV · live decisions**, and enter it in the password field. Each guardian turn sends one request to TypeSafe; API usage may incur charges under your account. Failed requests leave the guardian turn pending; use Retry or start a new run. There are no automatic retries or silent demo fallbacks. Clear key removes it from the field; closing/reloading the page discards it. New escape keeps the field for convenience.

### Confirmed API contract

Verified against the [official System One reference](https://docs.typesafe.ai/api/system-one) on November 8, 2026:

```http
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer YOUR_KEY
Content-Type: application/json
```

```json
{
  "model": "jev-latest",
  "state": {"player": {"x": 1, "y": 1}, "guardian": {"x": 9, "y": 7}},
  "questions": {
    "up": {"type": "noul", "instructions": "Is moving up the best next move to catch the player?"}
  }
}
```

This abbreviated example illustrates the contract; `jev.mjs` supplies the map, cores, candidate positions, and one named `noul` question per legal move. It reads `answers.<move>.noul` (a number in [0,1]) and selects the highest value. These independently evaluated probabilities need not sum to one and are not win probabilities. Ties follow the stable direction order. The game engine validates actions and applies all movement; JEV never executes code. The alias `jev-latest` may change over time. Telemetry displays the model returned by the provider.

### Key handling and trust

- Key remains in the page's password input and transient HTTP request memory. No local/session storage, cookies, analytics, database, key environment variables, or request logging.
- Browser sends it in an Authorization header to the local Node server, which forwards it only to the fixed HTTPS TypeSafe endpoint. Redirects are rejected. Key never enters model state or prompts.
- Local server listens only on `127.0.0.1`, validates Host and Origin, limits JSON body size and concurrent requests, restricts static file routes, sets CSP/no-store headers, and sanitizes provider/network failures.
- This is a **local-first app**. The browser user and the local server process can access the supplied key in memory. TypeSafe receives the key and game state. Use only a server you trust; do not put secrets into the game state.
- Do not expose this local server directly to the internet or set up a public reverse proxy. A public deployment needs HTTPS, appropriate origin checks, authentication, abuse controls, request timeouts and log redaction at every proxy. GitHub Pages alone cannot run the Node API.
- `.gitignore` excludes `.env` files, but the app does not need an `.env`. Never commit API keys.

## Tests

```sh
node --test
```

Tests cover movement, collection, escape/capture, terminal states, a complete winnable demo route, the official request shape, legal score selection, provider error redaction, malformed responses, and real local HTTP validation. Provider calls are mocked: no key or paid request is needed. Live service authentication has not been tested with a real key.

## Publish to GitHub

Source repository: [AdityaVardhanY12/supreme-succotash](https://github.com/AdityaVardhanY12/supreme-succotash). CI runs the tests on pushes and pull requests. See [PUBLISH.md](PUBLISH.md) for instructions to publish future updates.

## Layout

- `server.mjs`: local HTTP server and BYOK proxy
- `jev.mjs`: TypeSafe request construction and validated decision selection
- `public/game.js`: shared deterministic game rules and demo agent
- `public/`: responsive, keyboard-accessible browser interface
- `test/`: dependency-free Node tests

MIT licensed. Independent demo; no affiliation with TypeSafe AI. No credentials are included.
