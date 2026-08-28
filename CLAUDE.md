# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`@robireton/redcap` — a zero-dependency ESM npm library of classes for interacting with [REDCap](https://projectredcap.org/) research projects via its JSON API. Node built-ins only (fetch, fs); no runtime dependencies. There is no build step and no test suite.

## Commands

- Lint: `npx eslint .` (config is [eslint.config.js](eslint.config.js), using neostandard — the successor to standard style: no semicolons, 2-space indent, space before function parens)

## Architecture

Every class is exported both from [index.js](index.js) and as an individual subpath export (e.g. `@robireton/redcap/api`) — when adding a new module under `lib/`, update `index.js` and the `exports` and `files` maps in [package.json](package.json).

Two layers:

1. **REDCapAPI** ([lib/api.js](lib/api.js)) — thin, stateless HTTP wrapper over the REDCap API. Every method POSTs form-encoded params to a single endpoint with a per-project `token`, distinguished by a `content` parameter (`record`, `metadata`, `instrument`, …), always requesting JSON.

2. **REDCapProject** ([lib/project.js](lib/project.js)) — stateful model of a whole project. Its constructor takes the same `(endpoint, token)` pair; if `path.resolve(endpoint, token)` is an existing directory, it reads canonically-named JSON files from that folder (`project.json`, `metadata.json`, `records-eav.json`, `instruments.json`, etc.) instead of calling the API — this filesystem mode doubles as the offline/testing path. `await populate()` must be called before any getter; getters throw `'project not ready'` otherwise. Longitudinal-only data (arms, events, mapping) and repeating-forms data are fetched conditionally based on project info flags.

Supporting value classes wrap raw REDCap objects in private fields with getters:

- **REDCapField** ([lib/field.js](lib/field.js)) — one data-dictionary entry; parses `select_choices_or_calculations` into a `choices` Map for checkbox/radio/dropdown fields.
- **REDCapInstrument** ([lib/instrument.js](lib/instrument.js)) — one form plus its records. Its constructor does the heavy lifting: it groups the project's EAV-format observations into flat record objects keyed by record/event/repeat-instance, and converts values by field type (checkbox → array of `{option, label}`, radio/dropdown → `{option, label}`, yesno/truefalse → boolean, calc/slider/validated numbers → Number). It also synthesizes the implicit `<form>_complete` field.
- **REDCapProjectInformation** ([lib/info.js](lib/info.js)) — project settings with camelCase getters (e.g. `isLongitudinal`).
- **REDCapDatetime** ([lib/datetime.js](lib/datetime.js)) — `Date` subclass that parses/formats REDCap's `YYYY-MM-DD hh:mm:ss` format.

Records flow as REDCap "eav" format (one observation per row) internally; `REDCapInstrument` is where they become flat per-record objects.

Debug logging in `REDCapProject` prints only when `NODE_ENV=debug`.

[README.md](README.md) is the public API documentation — keep it in sync with API changes.
