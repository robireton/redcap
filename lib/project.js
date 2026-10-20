import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import REDCapAPI from './api.js'
import REDCapProjectInformation from './info.js'
import REDCapField from './field.js'
import REDCapInstrument from './instrument.js'

const info = (data, ...args) => (process.env.NODE_ENV === 'debug') && console.log(data, ...args)

export default class REDCapProject {
  #ready = false
  #fsBase
  #api // REDCapAPI
  #arms // Array { arm_num, name }
  #data // Array of observations (REDCap “eav” format)
  #events // Array of { event_name, arm_num, unique_event_name, custom_event_label, event_id }
  #fields // Array of REDCapField
  #info // REDCapProjectInformation
  #instruments // Map of name => REDCapInstrument
  #mapping // Array of { arm_num, unique_event_name, form }
  #repeating // Array of { event_name, form_name, custom_form_label }

  constructor (endpoint, token) {
    const base = path.resolve(endpoint, token)
    if (existsSync(base)) {
      info(`using filesystem at ‘${base}’`)
      this.#fsBase = base
    } else {
      info(`using API at ‘${endpoint}’`)
      this.#api = new REDCapAPI(endpoint, token)
    }
  }

  async populate ({ batchSize } = {}) {
    // Project Information
    info('loading project information')
    this.#info = new REDCapProjectInformation(this.#fsBase ? JSON.parse(await readFile(path.resolve(this.#fsBase, 'project.json'), { encoding: 'utf8' })) : await this.#api.project())

    // Project Metadata (Data Dictionary)
    info('loading metadata')
    this.#fields = (this.#fsBase ? JSON.parse(await readFile(path.resolve(this.#fsBase, 'metadata.json'), { encoding: 'utf8' })) : await this.#api.metadata()).map(record => new REDCapField(record))

    if (this.#info.isLongitudinal) {
      info('loading events')
      this.#events = this.#fsBase ? JSON.parse(await readFile(path.resolve(this.#fsBase, 'events.json'), { encoding: 'utf8' })) : await this.#api.events()
      info('loading arms')
      this.#arms = this.#fsBase ? JSON.parse(await readFile(path.resolve(this.#fsBase, 'arms.json'), { encoding: 'utf8' })) : await this.#api.arms()
      info('loading mapping')
      this.#mapping = this.#fsBase ? JSON.parse(await readFile(path.resolve(this.#fsBase, 'formEventMapping.json'), { encoding: 'utf8' })) : await this.#api.mapping()
    }

    if (this.#info.hasRepeatingInstrumentsOrEvents) {
      info('loading repeating')
      this.#repeating = this.#fsBase ? JSON.parse(await readFile(path.resolve(this.#fsBase, 'repeatingFormsEvents.json'), { encoding: 'utf8' })) : await this.#api.repeating()
    }

    info('loading data')
    // in batches: a whole large project will not fit in one string
    this.#data = []
    for await (const batch of this.#fsBase ? this.#readRecords() : this.#api.recordBatches({ type: 'eav' }, { batchSize, idField: this.#fields[0].name })) {
      for (const observation of batch) this.#data.push(observation)
    }

    // Project Instruments
    info('loading instrument list')
    const instruments = this.#fsBase ? JSON.parse(await readFile(path.resolve(this.#fsBase, 'instruments.json'), { encoding: 'utf8' })) : await this.#api.instruments()

    info('populating instrument data')
    this.#instruments = new Map(instruments.map(i => ([i.instrument_name, new REDCapInstrument(i.instrument_name, i.instrument_label, this.#fields.filter(f => f.instrument === i.instrument_name), this.#data)])))

    info('ready')
    this.#ready = true
  }

  // records-eav.json, or else every *.json in records-eav/ (one batch per file)
  async * #readRecords () {
    const file = path.resolve(this.#fsBase, 'records-eav.json')
    if (existsSync(file)) {
      yield JSON.parse(await readFile(file, { encoding: 'utf8' }))
      return
    }
    const folder = path.resolve(this.#fsBase, 'records-eav')
    for (const name of (await readdir(folder)).filter(name => name.endsWith('.json')).sort()) {
      yield JSON.parse(await readFile(path.resolve(folder, name), { encoding: 'utf8' }))
    }
  }

  // Array getters hand back a copy so a caller cannot reorder or splice the
  // project's own state. The copy is shallow: the objects in it are shared.
  get arms () {
    if (!this.#ready) throw new Error('project not ready')
    if (!this.#info.isLongitudinal) throw new Error('project not longitudinal')
    return Array.from(this.#arms) // Array { arm_num, name }
  }

  get data () {
    if (!this.#ready) throw new Error('project not ready')
    return Array.from(this.#data) // Array of observations (REDCap “eav” format)
  }

  get events () {
    if (!this.#ready) throw new Error('project not ready')
    if (!this.#info.isLongitudinal) throw new Error('project not longitudinal')
    return Array.from(this.#events) // Array of { event_name, arm_num, unique_event_name, custom_event_label, event_id }
  }

  get fields () {
    if (!this.#ready) throw new Error('project not ready')
    return Array.from(this.#fields) // Array of REDCapField
  }

  get info () {
    if (!this.#ready) throw new Error('project not ready')
    return this.#info // REDCapProjectInformation
  }

  get instruments () {
    if (!this.#ready) throw new Error('project not ready')
    return Array.from(this.#instruments.values()) // Array of REDCapInstrument
  }

  get mapping () {
    if (!this.#ready) throw new Error('project not ready')
    if (!this.#info.isLongitudinal) throw new Error('project not longitudinal')
    return Array.from(this.#mapping) // Array of { arm_num, unique_event_name, form }
  }

  get repeating () {
    if (!this.#ready) throw new Error('project not ready')
    if (!this.#info.hasRepeatingInstrumentsOrEvents) throw new Error('project does not have repeating instruments or events')
    return Array.from(this.#repeating) // Array of { event_name, form_name, custom_form_label }
  }

  // need to combine records with same “key”, not concat them
  // get records () {
  //   return this.#instruments.values().reduce((a, c) => a.concat(c.records), [])
  // }

  getInstrument (name) { // name is a string matching an instrument_name
    if (!this.#ready) throw new Error('project not ready')
    return this.#instruments.get(name) // REDCapInstrument
  }
}
