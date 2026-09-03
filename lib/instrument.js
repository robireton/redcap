import REDCapField from './field.js'

// Which of these an EAV row carries depends on the project, not on the row, so
// the set is decided once per instrument rather than per observation.
const PINS = ['redcap_event_name', 'redcap_repeat_instrument', 'redcap_repeat_instance']

const blank = v => v === '' || v === null || v === undefined

// REDCap omits blanks from an EAV export, but a blank that does arrive should
// read as “no value” rather than as 0 or NaN.
const number = (value, parse) => {
  if (blank(value)) return null
  const n = parse(value)
  return Number.isNaN(n) ? null : n
}

export default class REDCapInstrument {
  #name
  #label
  #fields
  #records

  constructor (name, label, fields, observations = []) {
    this.#name = name
    this.#label = label
    this.#fields = new Map([...fields.map(f => ([f.name, f])), [`${name}_complete`, new REDCapField({ field_name: `${name}_complete`, form_name: name, field_type: 'text', text_validation_type_or_show_slider_number: 'integer' })]])

    const pins = ['record', ...PINS.filter(pin => observations.some(o => pin in o))]
    // JSON rather than a delimiter: record names are free text unless
    // autonumbered, so any separator could appear inside one.
    const identify = o => JSON.stringify(pins.map(pin => blank(o[pin]) ? null : o[pin]))

    const records = new Map()
    for (const o of observations) {
      if (!this.#fields.has(o.field_name)) continue
      if ('redcap_repeat_instrument' in o && o.redcap_repeat_instrument !== '' && o.redcap_repeat_instrument !== this.#name) continue
      const key = identify(o)

      if (!records.has(key)) {
        records.set(key, Object.fromEntries([...pins.map(pin => [pin, blank(o[pin]) ? null : o[pin]]), ...this.#fields.values().map(field => [field.name, null])]))
      }

      const field = this.#fields.get(o.field_name)
      switch (field.type) {
        case 'checkbox':
          if (records.get(key)[o.field_name] === null) records.get(key)[o.field_name] = []
          records.get(key)[o.field_name].push({ option: o.value, label: field.choices.get(o.value) })
          break

        case 'radio':
        case 'dropdown':
          records.get(key)[o.field_name] = { option: o.value, label: field.choices.get(o.value) }
          break

        case 'yesno':
        case 'truefalse':
          records.get(key)[o.field_name] = o.value === '1'
          break

        case 'calc':
        case 'slider':
          records.get(key)[o.field_name] = number(o.value, Number)
          break

        case 'text':
          switch (field.text_validation_type_or_show_slider_number) {
            case 'integer':
              records.get(key)[o.field_name] = number(o.value, Number.parseInt)
              break

            case 'number':
            case 'number_1dp':
            case 'number_2dp':
              records.get(key)[o.field_name] = number(o.value, Number.parseFloat)
              break

            case 'date_dmy':
            case 'date_mdy':
            case 'date_ymd':
              // note: all of these seem to be in yyyy-mm-dd from the API
              records.get(key)[o.field_name] = o.value
              break

            default:
              records.get(key)[o.field_name] = o.value
          }
          break

        default:
          records.get(key)[o.field_name] = o.value
      }
    }
    this.#records = Array.from(records.values())
  }

  get name () {
    return this.#name
  }

  get label () {
    return this.#label
  }

  get fields () {
    return Array.from(this.#fields.values())
  }

  get records () {
    return this.#records
  }
}
