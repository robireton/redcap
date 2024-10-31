# REDCap API

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![current version](https://img.shields.io/npm/v/@robireton/redcap)](https://www.npmjs.com/package/@robireton/redcap)
[![install size](https://packagephobia.com/badge?p=@robireton/redcap)](https://packagephobia.com/result?p=@robireton/redcap)

*an opinionated, , JSON-only, zero-dependency REDCap API implementation as an ECMAScript module*

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
| `options` | an object with optional parameters for REDCap API calls |

## Exports

### *async* function `getVersion` (endpoint, token)

returns the current REDCap version number as plain text (e.g., 4.13.18, 5.12.2, 6.0.0)

### *async* function `getProject` (endpoint, token)

### *async* function `getMetadata` (endpoint, token, options = {})

### *async* function `getRecords` (endpoint, token, options = {})

### *async* function `getEvents` (endpoint, token, options = {})

### *async* function `getArms` (endpoint, token, options = {})

### *async* function `getFields` (endpoint, token, options = {})

### *async* function `getInstruments` (endpoint, token)

### *async* function `getMapping` (endpoint, token, options = {})

### *async* function `getRepeating` (endpoint, token)

### *async* function `putRecords` (endpoint, token, data, options = {})
