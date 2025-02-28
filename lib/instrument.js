import REDCapField from './field.js'

export default class REDCapInstrument {
  #name
  #label
  #fields
  #records

  constructor (name, label, fields, observations = []) {
    this.#name = name
    this.#label = label
    this.#fields = new Map([...fields.map(f => ([f.name, f])), [`${name}_complete`, new REDCapField({ field_name: `${name}_complete`, form_name: name, field_type: 'text', text_validation_type_or_show_slider_number: 'integer' })]])
    const records = new Map()
    for (const o of observations) {
      if (!this.#fields.has(o.field_name)) continue
      if ('redcap_repeat_instrument' in o && o.redcap_repeat_instrument !== '' && o.redcap_repeat_instrument !== this.#name) continue
      const pins = ['record']
      if ('redcap_event_name' in o) pins.push('redcap_event_name')
      if ('redcap_repeat_instrument' in o) pins.push('redcap_repeat_instrument')
      if ('redcap_repeat_instance' in o) pins.push('redcap_repeat_instance')
      const key = pins.map(pin => o[pin]).join(':')

      if (!records.has(key)) {
        records.set(key, Object.fromEntries([...pins.map(pin => [pin, o[pin] === '' ? null : o[pin]]), ...this.#fields.values().map(field => [field.name, null])]))
      }

      switch (this.#fields.get(o.field_name).type) {
        case 'checkbox':
          if (records.get(key)[o.field_name] === null) records.get(key)[o.field_name] = []
          records.get(key)[o.field_name].push({ option: o.value, label: this.#fields.get(o.field_name).choices.get(o.value) })
          break

        case 'radio':
        case 'dropdown':
          records.get(key)[o.field_name] = { option: o.value, label: this.#fields.get(o.field_name).choices.get(o.value) }
          break

        case 'yesno':
        case 'truefalse':
          records.get(key)[o.field_name] = o.value === '1'
          break

        case 'calc':
        case 'slider':
          records.get(key)[o.field_name] = Number(o.value)
          break

        case 'text':
          switch (this.#fields.get(o.field_name).text_validation_type_or_show_slider_number) {
            case 'integer':
              records.get(key)[o.field_name] = Number.parseInt(o.value)
              break

            case 'number':
            case 'number_1dp':
            case 'number_2dp':
              records.get(key)[o.field_name] = Number.parseFloat(o.value)
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
    return this.#fields.values()
  }

  get records () {
    return this.#records
  }
}
