# REDCap

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![current version](https://img.shields.io/npm/v/@robireton/redcap)](https://www.npmjs.com/package/@robireton/redcap)
[![install size](https://packagephobia.com/badge?p=@robireton/redcap)](https://packagephobia.com/result?p=@robireton/redcap)

classes for interacting with [REDCap](https://projectredcap.org/) projects

* [REDCapAPI](#redcapapi)
* [REDCapProject](#redcapproject)
* [REDCapProjectInformation](#redcapprojectinformation)
* [REDCapField](#redcapfield)
* [REDCapInstrument](#redcapinstrument)
* [REDCapDatetime](#redcapdatetime)

## REDCapAPI

*an opinionated, JSON-only, zero-dependency REDCap API implementation as an ECMAScript module*

### Example
```js
import REDCapAPI from '@robireton/redcap/api'

const endpoint = process.env.REDCAP_ENDPOINT
const token = process.env.REDCAP_TOKEN

const project = new REDCapAPI(endpoint, token)
console.log(await project.metadata())
```

### Constructor

#### `REDCapAPI`(*endpoint*, *token*)

| name | value |
| ---- | ----- |
| `endpoint` | a URL or string to connect to – *e.g.* `https://redcap.server.org/api/` |
| `token` | the API token specific to your REDCap project and username (each token is unique to each user for each project) |


### Instance methods

| name | value |
| ---- | ----- |
| `options` | an optional object with extra parameters for REDCap API calls |

#### *async* `version`()

returns the current REDCap version number as plain text (e.g., 4.13.18, 5.12.2, 6.0.0)

#### *async*  `project` ()

returns an object with the following fields:

* `project_id`
* `project_title`
* `creation_time`
* `production_time`
* `in_production`
* `project_language`
* `purpose`
* `purpose_other`
* `project_notes`
* `custom_record_label`
* `secondary_unique_field`
* `is_longitudinal`
* `has_repeating_instruments_or_events`
* `surveys_enabled`
* `scheduling_enabled`
* `record_autonumbering_enabled`
* `randomization_enabled`
* `ddp_enabled`
* `project_irb_number`
* `project_grant_number`
* `project_pi_firstname`
* `project_pi_lastname`
* `display_today_now_button`
* `missing_data_codes`
* `external_modules`
* `bypass_branching_erase_field_prompt`

#### *async*  `metadata` (*options*)

returns an array of data dictionary objects

##### options
* `fields`: an array of field names specifying specific fields you wish to pull (default: all fields)
* `forms`: an array of form names specifying specific data collection instruments for which you wish to pull metadata (default: all instruments)

#### *async*  `records` (*options*)

returns an array of record objects

##### options
* `type`: `flat` (default) — *one record per row* or `eav` — *one data point per row*
* `records`: an array of record names specifying specific fields you wish to pull (default: all records)
* `fields`: an array of field names specifying specific fields you wish to pull (default: all fields)
* `forms`: an array of form names specifying specific data collection instruments for which you wish to pull metadata (default: all instruments)
* `events`: an array of unique event names that you wish to pull records for (longitudinal projects only)
* more… *c.f.* full REDCap API specification

#### *async*  `events` (*options*)
#### *async*  `arms` (*options*)
#### *async*  `fields` (*options*)

Returns an array of the export/import-specific version of field name objects for all fields (or for one field, if desired). Each object will contain: `original_field_name`, `choice_value`, and `export_field_name`. The `choice_value` attribute represents the raw coded value for a checkbox choice. For non-checkbox fields, the `choice_value` attribute will always be blank/empty. The `export_field_name` attribute represents the export/import-specific version of that field name.

#### *async*  `instruments` ()

returns an array of instrument (Data Entry Form) objects

#### *async*  `mapping` (*options*)
#### *async*  `repeating` ()
#### *async*  `write` (data, *options*)
#### *async*  `file` (*options*)
#### *async*  `upload` (file, *options*)


## REDCapProject

*class for working with project structure and data; uses [REDCapAPI](#redcapapi) or local JSON files*

### Example
```js
import REDCapAPI from '@robireton/redcap/project'

const endpoint = process.env.REDCAP_ENDPOINT
const token = process.env.REDCAP_TOKEN

const project = new REDCapProject(endpoint, token)
await project.populate()

console.log(project.info.title)
for (const instrument of project.instruments) {
  console.log(instrument.label)
  for (const record of instrument.records) {
    …
  }
}
```

### Constructor

#### `REDCapProject`(*endpoint*, *token*)

| name | value |
| ---- | ----- |
| `endpoint` | a URL or string to connect to – *e.g.* `https://redcap.server.org/api/` |
| `token` | the API token specific to your REDCap project and username (each token is unique to each user for each project) |

Alternately, if `endpoint`/`token` resolves to an existing filesystem folder with appropriately-named JSON files, these will be used instead of [REDCapAPI](#redcapapi).

### Instance methods

#### *async* `populate` ()

This must be run before any instance members are accessible.

#### `getInstrument` (*name*)

returns a [REDCapInstrument](#redcapinstrument) object, which includes the records

## REDCapProjectInformation

## REDCapField

## REDCapInstrument

## REDCapDatetime
