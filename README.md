# REDCap API

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![current version](https://img.shields.io/npm/v/@robireton/redcap)](https://www.npmjs.com/package/@robireton/redcap)
[![install size](https://packagephobia.com/badge?p=@robireton/redcap)](https://packagephobia.com/result?p=@robireton/redcap)

*an opinionated, , JSON-only, zero-dependency REDCap API implementation as an ECMAScript module*

## Example
```js
import REDCapAPI from '@robireton/redcap'

const endpoint = process.env.REDCAP_ENDPOINT
const token = process.env.REDCAP_TOKEN

const myProject = new REDCapAPI(endpoint, token)
console.log(await myProject.metadata())
```

## Constructor

### `REDCapAPI`(*endpoint*, *token*)

| name | value |
| ---- | ----- |
| `endpoint` | a URL or string to connect to – *e.g.* `https://redcap.server.org/api/` |
| `token` | the API token specific to your REDCap project and username (each token is unique to each user for each project) |


## Instance methods

| name | value |
| ---- | ----- |
| `options` | an optional object with extra parameters for REDCap API calls |

### *async* `version`()

returns the current REDCap version number as plain text (e.g., 4.13.18, 5.12.2, 6.0.0)

### *async*  `project` ()
### *async*  `metadata` (*options*)
### *async*  `records` (*options*)
### *async*  `events` (*options*)
### *async*  `arms` (*options*)
### *async*  `fields` (*options*)
### *async*  `instruments` ()
### *async*  `mapping` (*options*)
### *async*  `repeating` ()
### *async*  `write` (data, *options*)
