# REDCap API

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![current version](https://img.shields.io/npm/v/@robireton/redcap)](https://www.npmjs.com/package/@robireton/redcap)
[![install size](https://packagephobia.com/badge?p=@robireton/redcap)](https://packagephobia.com/result?p=@robireton/redcap)


*an opinionated, zero-dependency REDCap API implementation as an ECMAScript module*

## Usage

### import everything
```js
import * as redcap from '@robireton/redcap'
```

### Common Parameters

| name | value |
| ---- | ----- |
| `endpoint` | a URL or string to connect to – *e.g.* `https://redcap.server.org/api/` |
| `token` | the API token specific to your REDCap project and username (each token is unique to each user for each project) |

## Exports

### *async* function `version` (endpoint, token)

### *async* function `project` (endpoint, token)

### *async* function `metadata` (endpoint, token)

### *async* function `records` (endpoint, token)

### *async* function `events` (endpoint, token)

### *async* function `arms` (endpoint, token)

### *async* function `fields` (endpoint, token)

### *async* function `instruments` (endpoint, token)

### *async* function `mapping` (endpoint, token)

### *async* function `repeating` (endpoint, token)
