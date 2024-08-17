# star-history

[![CI Build & Test](https://github.com/HuakunShen/star-history/actions/workflows/ci.yml/badge.svg)](https://github.com/HuakunShen/star-history/actions/workflows/ci.yml)

This is a simple tool to show the star history of any GitHub repository.

PocketBase is used for caching.

## Usage

Send a `GET` request to `https://star-history.pockethost.io/star-history/<username>/<repo>`

e.g. `https://star-history.pockethost.io/star-history/tauri-apps/tauri`

If you request a repo with lots of stars (e.g. 80k stars), it may take a while to get the result if it's the first time the repo is requested.

You could get timeout error if the request takes too long, but the request is still being processed. Come back in a few minutes and try again.

After the first request, the result will be cached and the next request will be instant.

The GitHub Token can only send 5000 requests per hour. If it reaches the limit, the request will fail.
You can add your own GitHub Token with `github_token` query parameter. Append `?github_token=<your_token>` to the URL.

## Develop

Put `pocketbase` executable in the root directory.

Add a `.env` with `GITHUB_TOKEN` in it.

```bash
bun install
bun dev # this will start both `pocketbase serve` and `tsup --watch`
```

`tsup --watch` watch `index.ts` and build it to `pb_hooks/index.cjs`.

PocketBase will automatically reload the hook. Everything is auto reloaded.
