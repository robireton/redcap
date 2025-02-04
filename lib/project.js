import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import REDCapAPI from './api.js'
import REDCapProjectInformation from './info.js'
import REDCapField from './field.js'

const info = (data, ...args) => (process.env.NODE_ENV === 'debug') && console.log(data, ...args)

export default class REDCapProject {
  #ready = false
  #fsBase
  #api
  #project
  #instruments
  #fields
  #events
  #repeating
  #records

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
    this.#project = new REDCapProjectInformation(this.#fsBase ? JSON.parse(await readFile(path.resolve(this.#fsBase, 'project.json'), { encoding: 'utf8' })) : await this.#api.project())

    // Project Instruments
    this.#instruments = new Map((this.#fsBase ? JSON.parse(await readFile(path.resolve(this.#fsBase, 'instruments.json'), { encoding: 'utf8' })) : await this.#api.instruments()).map(instrument => ([instrument.instrument_name, instrument.instrument_label])))

    // Project Metadata (Data Dictionary)
    this.#fields = new Map((this.#fsBase ? JSON.parse(await readFile(path.resolve(this.#fsBase, 'metadata.json'), { encoding: 'utf8' })) : await this.#api.metadata()).map(record => ([record.field_name, new REDCapField(record)])))

    if (this.#project.isLongitudinal) {
      this.#events = new Map(((this.#fsBase ? JSON.parse(await readFile(path.resolve(this.#fsBase, 'events.json'), { encoding: 'utf8' })) : await this.#api.events()).map(record => ([record.unique_event_name, record]))))
    }

    this.#records = (this.#fsBase ? JSON.parse(await readFile(path.resolve(this.#fsBase, 'records-flat.json'), { encoding: 'utf8' })) : await this.#api.records()).map(tidy)
    this.#ready = true
  }

  get project () {
    if (!this.#ready) throw new Error('project not ready')
    return this.#project
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

  get records () {
    if (!this.#ready) throw new Error('project not ready')
    return this.#records
  }
}

function tidy (o) {
  return Object.fromEntries(
    Array.from(
      Object.entries(o)
    ).map(
      ([k, v]) => [k, typeof v === 'string' ? (v === '' ? null : v.trim()) : v]
    )
  )
}
