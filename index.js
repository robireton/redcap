function makeParams (options) {
  const params = new URLSearchParams()
  for (const [option, value] of Object.entries(options)) {
    if (Array.isArray(value)) {
      value.forEach((element, index) => params.append(`${option}[${index}]`, element))
    } else {
      params.append(option, value)
    }
  }
  if (process.env.NODE_ENV === 'debug') console.log(params)
  return params
}

export default class REDCapAPI {
  #endpoint
  #token

  constructor (endpoint, token) {
    if (!(typeof endpoint === 'string' || endpoint instanceof URL || endpoint instanceof Request)) throw new TypeError('bad endpoint')
    if (typeof token !== 'string' || token.length === 0) throw new TypeError('bad token')
    this.#endpoint = ((typeof endpoint === 'string') ? (new URL(endpoint)) : endpoint)
    this.#token = token
  }

  async #call (options, headers = { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' }) {
    options.format = 'json'
    options.token = this.#token
    const response = await fetch(this.#endpoint, {
      method: 'POST',
      headers,
      body: makeParams(options)
    })
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
    return await response.json()
  }

  async version () {
    const response = await fetch(this.#endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: makeParams({ content: 'version', token: this.#token })
    })
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
    return await response.text()
  }

  async project () {
    return await this.#call({ content: 'project' })
  }

  async instruments () {
    return await this.#call({ content: 'instrument' })
  }

  async repeating () {
    return await this.#call({ content: 'repeatingFormsEvents' })
  }

  async metadata (options = {}) {
    options.content = 'metadata'
    return await this.#call(options)
  }

  async records (options = {}) {
    options.content = 'record'
    if (!('type' in options)) options.type = 'flat'
    return await this.#call(options)
  }

  async events (options = {}) {
    options.content = 'event'
    return await this.#call(options)
  }

  async arms (options = {}) {
    options.content = 'arm'
    return await this.#call(options)
  }

  async fields (options = {}) {
    options.content = 'exportFieldNames'
    return await this.#call(options)
  }

  async mapping (options = {}) {
    options.content = 'formEventMapping'
    return await this.#call(options)
  }

  async write (data, options = {}) {
    options.content = 'record'
    if (!('type' in options)) options.type = 'flat'
    options.data = JSON.stringify(Array.isArray(data) ? data : [data])
    return await this.#call(options)
  }
}
