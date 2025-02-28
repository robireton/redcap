import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import REDCapAPI from './api.js'
import REDCapProjectInformation from './info.js'
import REDCapField from './field.js'
import REDCapInstrument from './instrument.js'

const info = (data, ...args) => (process.env.NODE_ENV === 'debug') && console.log(data, ...args)

export default class REDCapProject {
  #ready = false
  #fsBase
  #api
  #info
  #instruments
  #fields
  #events
  #repeating
  #data

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

  async populate () {
    // Project Information
    info('loading project information')
    this.#info = new REDCapProjectInformation(this.#fsBase ? JSON.parse(await readFile(path.resolve(this.#fsBase, 'project.json'), { encoding: 'utf8' })) : await this.#api.project())

    // Project Metadata (Data Dictionary)
    info('loading metadata')
    this.#fields = new Map((this.#fsBase ? JSON.parse(await readFile(path.resolve(this.#fsBase, 'metadata.json'), { encoding: 'utf8' })) : await this.#api.metadata()).map(record => ([record.field_name, new REDCapField(record)])))

    if (this.#info.isLongitudinal) {
      info('loading events')
      this.#events = new Map(((this.#fsBase ? JSON.parse(await readFile(path.resolve(this.#fsBase, 'events.json'), { encoding: 'utf8' })) : await this.#api.events()).map(record => ([record.unique_event_name, record]))))
    }

    info('loading data')
    this.#data = (this.#fsBase ? JSON.parse(await readFile(path.resolve(this.#fsBase, 'records-eav.json'), { encoding: 'utf8' })) : await this.#api.records({ type: 'eav' }))

    // Project Instruments
    info('loading instrument list')
    const instruments = this.#fsBase ? JSON.parse(await readFile(path.resolve(this.#fsBase, 'instruments.json'), { encoding: 'utf8' })) : await this.#api.instruments()

    info('populating instrument data')
    this.#instruments = new Map(instruments.map(i => ([i.instrument_name, new REDCapInstrument(i.instrument_name, i.instrument_label, this.#fields.values().filter(f => f.instrument === i.instrument_name), this.#data)])))

    info('ready')
    this.#ready = true
  }

  get info () {
    if (!this.#ready) throw new Error('project not ready')
    return this.#info
  }

  get instruments () {
    if (!this.#ready) throw new Error('project not ready')
    return this.#instruments
  }

  get fields () {
    if (!this.#ready) throw new Error('project not ready')
    return this.#fields
  }

  get events () {
    if (!this.#ready) throw new Error('project not ready')
    return this.#events
  }

  get repeating () {
    if (!this.#ready) throw new Error('project not ready')
    return this.#repeating
  }

  get data () {
    if (!this.#ready) throw new Error('project not ready')
    return this.#data
  }

  // need to combine records with same “key”, not concat them
  // get records () {
  //   return this.#instruments.values().reduce((a, c) => a.concat(c.records), [])
  // }

  getInstrument (name) {
    return this.#instruments.get(name)
  }
}
