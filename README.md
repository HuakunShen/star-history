# star-history

[![CI Build & Test](https://github.com/HuakunShen/star-history/actions/workflows/ci.yml/badge.svg)](https://github.com/HuakunShen/star-history/actions/workflows/ci.yml)

This is a simple tool to show the star history of any GitHub repository.

PocketBase is used for caching.

## Usage

Send a `GET` request to `https://star-history.`

## Develop

Put `pocketbase` executable in the root directory.

Add a `.env` with `GITHUB_TOKEN` in it.

```bash
bun install
bun dev # this will start both `pocketbase serve` and `tsup --watch`
```

`tsup --watch` watch `index.ts` and build it to `pb_hooks/index.cjs`.

PocketBase will automatically reload the hook. Everything is auto reloaded.
