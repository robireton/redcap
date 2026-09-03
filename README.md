# REDCap

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-neostandard-brightgreen.svg)](https://github.com/neostandard/neostandard)
[![current version](https://img.shields.io/npm/v/@robireton/redcap)](https://www.npmjs.com/package/@robireton/redcap)
[![install size](https://packagephobia.com/badge?p=@robireton/redcap)](https://packagephobia.com/result?p=@robireton/redcap)

classes for interacting with [REDCap](https://projectredcap.org/) research projects via its JSON API

requires Node.js 22 or later. No runtime dependencies — Node built-ins only.

```sh
npm install @robireton/redcap
```

## Two layers

**[REDCapAPI](#redcapapi)** is a thin, stateless wrapper over the REDCap API. Every method POSTs form-encoded parameters to a single endpoint and returns whatever REDCap sends back, unchanged. Reach for it when you want the raw API.

**[REDCapProject](#redcapproject)** is a stateful model of an entire project. One `populate()` call fetches project information, the data dictionary, the instrument list and all records, then hands them back as typed objects — records become flat JavaScript objects with converted values rather than REDCap's raw strings. Reach for it when you want to work with the data.

The remaining classes are value wrappers the project layer hands you: [REDCapProjectInformation](#redcapprojectinformation), [REDCapInstrument](#redcapinstrument), [REDCapField](#redcapfield) and [REDCapDatetime](#redcapdatetime).

Every class is available from the package root or as its own subpath:

```js
import { REDCapProject, REDCapAPI } from '@robireton/redcap'
// or
import REDCapProject from '@robireton/redcap/project'
```

| subpath | class |
| ------- | ----- |
| `@robireton/redcap/api` | [REDCapAPI](#redcapapi) |
| `@robireton/redcap/project` | [REDCapProject](#redcapproject) |
| `@robireton/redcap/info` | [REDCapProjectInformation](#redcapprojectinformation) |
| `@robireton/redcap/instrument` | [REDCapInstrument](#redcapinstrument) |
| `@robireton/redcap/field` | [REDCapField](#redcapfield) |
| `@robireton/redcap/datetime` | [REDCapDatetime](#redcapdatetime) |

## REDCapProject

*a whole project — structure and data — from the API or from local JSON files*

```js
import REDCapProject from '@robireton/redcap/project'

const project = new REDCapProject(process.env.REDCAP_ENDPOINT, process.env.REDCAP_TOKEN)
await project.populate()

console.log(project.info.title)
for (const instrument of project.instruments) {
  console.log(instrument.label)
  for (const record of instrument.records) {
    console.log(record)
  }
}
```

### `REDCapProject` (*endpoint*, *token*)

| name | value |
| ---- | ----- |
| `endpoint` | a URL or string to connect to – *e.g.* `https://redcap.server.org/api/` |
| `token` | the API token specific to your REDCap project and username (each token is unique to each user for each project) |

If `endpoint`/`token` resolves to an existing directory, the project reads local JSON files from it instead of calling the API — see [offline mode](#offline-mode).

### *async* `populate` ()

Fetches everything. **Must be awaited before any other member is used**; every getter and `getInstrument` throws `project not ready` until it resolves.

Longitudinal-only data (events, arms, form-event mapping) is fetched only when `info.isLongitudinal`, and repeating-forms data only when `info.hasRepeatingInstrumentsOrEvents`.

### Instance members

| name | value |
| ---- | ----- |
| `info` | a [REDCapProjectInformation](#redcapprojectinformation) |
| `instruments` | Array of [REDCapInstrument](#redcapinstrument) |
| `fields` | Array of [REDCapField](#redcapfield) — the whole data dictionary |
| `data` | Array of raw observations in REDCap “eav” format, one data point per element |
| `arms` | Array of `{ arm_num, name }` — **longitudinal only** |
| `events` | Array of `{ event_name, arm_num, unique_event_name, custom_event_label, event_id }` — **longitudinal only** |
| `mapping` | Array of `{ arm_num, unique_event_name, form }` — **longitudinal only** |
| `repeating` | Array of `{ event_name, form_name, custom_form_label }` — **projects with repeating instruments or events only** |

#### `getInstrument` (*name*)

Returns the [REDCapInstrument](#redcapinstrument) whose `instrument_name` is *name*, or `undefined` if the project has no such instrument.

#### Errors

| condition | error |
| --------- | ----- |
| any member used before `populate()` | `project not ready` |
| `arms`, `events` or `mapping` on a project that is not longitudinal | `project not longitudinal` |
| `repeating` on a project without repeating instruments or events | `project does not have repeating instruments or events` |

Every array member returns a **copy**, so reordering or splicing what you get back leaves the project intact. The copy is shallow: the objects inside it are shared, and mutating one does change the project's state.

### Offline mode

If `path.resolve(endpoint, token)` is an existing directory, `REDCapProject` reads canonically-named JSON files from it instead of calling the API. This is the offline and testing path — each file is exactly what the corresponding [REDCapAPI](#redcapapi) method returns.

```js
// reads ./exports/my-study/*.json
const project = new REDCapProject('./exports', 'my-study')
await project.populate()
```

| file | contents | required |
| ---- | -------- | -------- |
| `project.json` | `api.project()` | always |
| `metadata.json` | `api.metadata()` | always |
| `instruments.json` | `api.instruments()` | always |
| `records-eav.json` | `api.records({ type: 'eav' })` | always |
| `events.json` | `api.events()` | longitudinal projects |
| `arms.json` | `api.arms()` | longitudinal projects |
| `formEventMapping.json` | `api.mapping()` | longitudinal projects |
| `repeatingFormsEvents.json` | `api.repeating()` | projects with repeating instruments or events |

Set `NODE_ENV=debug` to log each load step to the console.

## REDCapProjectInformation

*project settings, with camelCase getters over REDCap's snake_case fields*

Text settings return `null` rather than an empty string when unset. Flags return a real boolean whether REDCap sends `1`, `"1"` or `true` — worth knowing because `Boolean("0")` is `true`, so a naive reading of a string-valued flag is inverted.

| name | value |
| ---- | ----- |
| `id` | project ID number |
| `title` | project title, or `null` |
| `creationTime` | `Date`, or `null` if unset |
| `productionTime` | `Date`, or `null` — **a project still in development has none** |
| `inProduction` | boolean |
| `language` | string, or `null` |
| `purpose` | number — REDCap's purpose code (`0`–`4`), not a flag |
| `purposeOther` | string, or `null` |
| `notes` | string, or `null` |
| `customRecordLabel` | string, or `null` |
| `secondaryUniqueField` | string, or `null` |
| `isLongitudinal` | boolean |
| `hasRepeatingInstrumentsOrEvents` | boolean |
| `surveysEnabled` | boolean |
| `schedulingEnabled` | boolean |
| `recordAutonumberingEnabled` | boolean |
| `randomizationEnabled` | boolean |
| `ddpEnabled` | boolean |
| `irbNumber` | string, or `null` |
| `grantNumber` | string, or `null` |
| `piFirstname` | string, or `null` |
| `piLastname` | string, or `null` |
| `displayTodayNowButton` | boolean |
| `missingDataCodes` | string, or `null` |
| `externalModules` | string, or `null` |
| `bypassBranchingEraseFieldPrompt` | boolean |

## REDCapInstrument

*one form, its fields, and its records*

This is where REDCap's one-data-point-per-row “eav” export becomes flat record objects with converted values.

### `REDCapInstrument` (*name*, *label*, *fields*, *observations*)

| name | value |
| ---- | ----- |
| `name` | the `instrument_name` |
| `label` | the `instrument_label` |
| `fields` | Array of [REDCapField](#redcapfield) belonging to this instrument |
| `observations` | Array of eav-format observations; rows for other fields and for other repeating instruments are ignored |

You do not normally construct one yourself — [REDCapProject](#redcapproject) builds them during `populate()`.

### Instance members

| name | value |
| ---- | ----- |
| `name` | the `instrument_name` |
| `label` | the `instrument_label` |
| `fields` | Array of [REDCapField](#redcapfield), including the synthesized `<name>_complete` field |
| `records` | Array of record objects |

### Record objects

A record is a plain object. It always has a `record` key, and additionally carries `redcap_event_name`, `redcap_repeat_instrument` and `redcap_repeat_instance` when the project uses them. Which of those keys appear is decided once per project, from all of its observations rather than per row, so a record does not split in two because REDCap included a column on some of its rows and omitted it on others. Empty values become `null`.

Beyond those, a record has one key per field on the instrument, plus REDCap's implicit `<name>_complete` field. A field with nothing reported is `null`.

```js
{
  record: '1',
  redcap_event_name: 'baseline_arm_1',
  redcap_repeat_instrument: 'visit',
  redcap_repeat_instance: '2',
  visit_date: '2023-10-16',
  systolic: 134,
  adverse: true,
  sex: { option: '2', label: 'Female' },
  symptoms: [ { option: '1', label: 'Cough' } ],
  visit_complete: 2
}
```

### Value conversion

| field type | value |
| ---------- | ----- |
| `checkbox` | Array of `{ option, label }`, one per checked box — `null` if none |
| `radio`, `dropdown` | `{ option, label }` |
| `yesno`, `truefalse` | boolean — `true` only when the stored value is `"1"` |
| `calc`, `slider` | Number, or `null` if blank or unparseable |
| `text` validated `integer` | Number, or `null` if blank or unparseable |
| `text` validated `number`, `number_1dp`, `number_2dp` | Number, or `null` if blank or unparseable |
| `text` validated `date_dmy`, `date_mdy`, `date_ymd` | string as exported — the API returns all three as `yyyy-mm-dd` |
| anything else — `text`, `notes`, `file`, `descriptive`, … | string as exported |
| `<name>_complete` | Number — `0` incomplete, `1` unverified, `2` complete |

For `checkbox`, `radio` and `dropdown`, `label` is looked up in the field's [choices](#choices) and is `undefined` when the stored value is not one of them.

> [!NOTE]
> A **missing data code** (`NA`, `UNK`, …) is not yet recognized as such. Depending on the field type it currently reads as `null`, as the raw code, or — for `yesno` — as `false`. See [#21](https://github.com/robireton/redcap/issues/21).

## REDCapField

*one entry from the data dictionary*

Most getters pass the raw value through under REDCap's own name. The exceptions are `name`, `instrument`, `type`, `label` and `note`, which are shorter aliases, and `choices`, which is parsed.

| name | REDCap field |
| ---- | ------------ |
| `name` | `field_name` |
| `instrument` | `form_name` |
| `type` | `field_type` |
| `label` | `field_label` |
| `note` | `field_note` |
| `choices` | parsed from `select_choices_or_calculations` — see below |
| `section_header` | `section_header` |
| `select_choices_or_calculations` | raw, unparsed |
| `text_validation_type_or_show_slider_number` | *as named* |
| `text_validation_min` | *as named* |
| `text_validation_max` | *as named* |
| `identifier` | *as named* |
| `branching_logic` | *as named* |
| `required_field` | *as named* |
| `custom_alignment` | *as named* |
| `question_number` | *as named* |
| `matrix_group_name` | *as named* |
| `matrix_ranking` | *as named* |
| `field_annotation` | *as named* |

### `choices`

For `checkbox`, `radio` and `dropdown` fields, a `Map` of option code to label. For every other field type, `undefined` — including `calc`, whose calculation stays in `select_choices_or_calculations`.

```js
// select_choices_or_calculations: '1, Male | 2, Female'
field.choices.get('2') // 'Female'
```

Parsing splits each entry on its **first** comma, so a label may contain commas (`1, Yes, definitely`) but an option code may not. Entries that cannot yield both a code and a label — an empty segment from a trailing `|`, or an entry with no comma at all — are skipped rather than throwing, so one malformed row does not make a whole data dictionary unreadable. Codes and labels are trimmed.

## REDCapDatetime

*a `Date` that speaks REDCap's datetime format*

```js
import REDCapDatetime from '@robireton/redcap/datetime'

const when = new REDCapDatetime('2024-03-01 14:30')
when.getFullYear()  // 2024 — it is a Date
String(when)        // '2024-03-01 14:30:00'
```

### `REDCapDatetime` (*value*)

Given a single string, parses it as a REDCap datetime. Given anything else — nothing, a timestamp, a `Date`, or `year, month, day…` components — behaves exactly like [`Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date).

### *static* `parse` (*string*)

Returns a timestamp in milliseconds. Accepts the three precisions REDCap produces, since a `date_*` field carries no time and only a `datetime_seconds_*` field carries seconds:

| format | example | from |
| ------ | ------- | ---- |
| `YYYY-MM-DD` | `2024-03-01` | `date_*` fields |
| `YYYY-MM-DD hh:mm` | `2024-03-01 14:30` | `datetime_*` fields |
| `YYYY-MM-DD hh:mm:ss` | `2024-03-01 14:30:45` | `datetime_seconds_*` fields |

A `T` may replace the space, and surrounding whitespace is ignored. Absent components default to zero. Values are interpreted in the **local** time zone. Anything else throws a `TypeError`.

Out-of-range dates are not rejected: as with `Date`, `2025-02-30` rolls over into March.

### `toString` ()

Formats as `YYYY-MM-DD hh:mm:ss`, always with seconds.

## REDCapAPI

*an opinionated, JSON-only, zero-dependency REDCap API implementation*

```js
import REDCapAPI from '@robireton/redcap/api'

const api = new REDCapAPI(process.env.REDCAP_ENDPOINT, process.env.REDCAP_TOKEN)
console.log(await api.metadata())
```

### `REDCapAPI` (*endpoint*, *token*)

| name | value |
| ---- | ----- |
| `endpoint` | a URL or string to connect to – *e.g.* `https://redcap.server.org/api/` |
| `token` | the API token specific to your REDCap project and username (each token is unique to each user for each project) |

Both are validated; a bad endpoint or an empty token throws a `TypeError`.

### Instance methods

Every method is `async`. Those taking *options* accept an object of extra REDCap API parameters — any parameter in the full REDCap API specification may be passed — and array values are serialized as `name[0]`, `name[1]`, … A request REDCap rejects throws an `Error` carrying the HTTP status.

Your options object is never modified. The token and the other request parameters are not written into it, so the same object is safe to log, to keep, and to reuse across calls.

#### *async* `version` ()

The REDCap version number as plain text, *e.g.* `14.0.1`.

#### *async* `project` ()

Project settings — the raw form of [REDCapProjectInformation](#redcapprojectinformation), with fields `project_id`, `project_title`, `creation_time`, `production_time`, `in_production`, `project_language`, `purpose`, `purpose_other`, `project_notes`, `custom_record_label`, `secondary_unique_field`, `is_longitudinal`, `has_repeating_instruments_or_events`, `surveys_enabled`, `scheduling_enabled`, `record_autonumbering_enabled`, `randomization_enabled`, `ddp_enabled`, `project_irb_number`, `project_grant_number`, `project_pi_firstname`, `project_pi_lastname`, `display_today_now_button`, `missing_data_codes`, `external_modules` and `bypass_branching_erase_field_prompt`.

#### *async* `metadata` (*options*)

An array of data dictionary objects.

* `fields`: array of field names to pull (default: all)
* `forms`: array of instrument names to pull metadata for (default: all)

#### *async* `records` (*options*)

An array of record objects.

* `type`: `flat` (default) — one record per row — or `eav` — one data point per row
* `records`: array of record names to pull (default: all)
* `fields`: array of field names to pull (default: all)
* `forms`: array of instrument names to pull (default: all)
* `events`: array of unique event names to pull (longitudinal projects only)
* more… *c.f.* full REDCap API specification

#### *async* `instruments` ()

An array of instrument (data entry form) objects.

#### *async* `events` (*options*)
#### *async* `arms` (*options*)
#### *async* `mapping` (*options*)
#### *async* `repeating` ()

Event, arm, form-event-mapping and repeating-forms definitions.

#### *async* `fields` (*options*)

The export/import-specific version of field names, for all fields or one. Each object contains `original_field_name`, `choice_value` and `export_field_name`. `choice_value` is the raw coded value for a checkbox choice, and is empty for non-checkbox fields.

#### *async* `write` (*data*, *options*)

Imports records. *data* may be one record object or an array of them; a single object is wrapped for you. Defaults to `type: 'flat'`.

#### *async* `file` (*options*)

Exports a file, returned as a [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File). Requires `record` and `field` in *options*; either one missing throws a `TypeError`.

The filename and MIME type come from the response's `content-type` header. If it offers no filename, the file is named `<record>-<field>`.

#### *async* `upload` (*file*, *options*)

Imports a [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) as multipart form data. Requires `record` and `field` in *options*. Throws a `TypeError` if *file* is not a `File`, or if either option is missing.

## Development

There is no build step.

```sh
npm run lint   # eslint, using neostandard
npm test       # node --test
```

Tests use Node's built-in test runner and assertions only; the API tests run a real HTTP server on an ephemeral port rather than mocking `fetch`. `test/fixtures/` holds synthetic REDCap projects that exercise the [offline mode](#offline-mode) path end to end.

When adding a module under `lib/`, export it from `index.js` and add it to both the `exports` and `files` maps in `package.json` — a test enforces that those stay in sync.

## License

[MIT](LICENSE)
