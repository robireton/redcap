export default class REDCapAPI {
  #endpoint
  #token

  constructor (endpoint, token) {
    if (!(typeof endpoint === 'string' || endpoint instanceof URL || endpoint instanceof Request)) throw new TypeError('bad endpoint')
    if (typeof token !== 'string' || token.length === 0) throw new TypeError('bad token')
    this.#endpoint = ((typeof endpoint === 'string') ? (new URL(endpoint)) : endpoint)
    this.#token = token
  }

  async #post (options, headers) {
    // build a fresh object: the caller’s options must not gain our token
    const response = await fetch(this.#endpoint, {
      method: 'POST',
      headers,
      body: makeParams({ ...options, token: this.#token })
    })
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
    return response
  }

  async #call (options, headers = { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' }) {
    return await (await this.#post({ ...options, format: 'json' }, headers)).json()
  }

  async version () {
    return await (await this.#post({ content: 'version' }, { 'Content-Type': 'application/x-www-form-urlencoded' })).text()
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
    return await this.#call({ ...options, content: 'metadata' })
  }

  async records (options = {}) {
    return await this.#call({ type: 'flat', ...options, content: 'record' })
  }

  async events (options = {}) {
    return await this.#call({ ...options, content: 'event' })
  }

  async arms (options = {}) {
    return await this.#call({ ...options, content: 'arm' })
  }

  async fields (options = {}) {
    return await this.#call({ ...options, content: 'exportFieldNames' })
  }

  async mapping (options = {}) {
    return await this.#call({ ...options, content: 'formEventMapping' })
  }

  async write (data, options = {}) {
    return await this.#call({
      type: 'flat',
      ...options,
      content: 'record',
      data: JSON.stringify(Array.isArray(data) ? data : [data])
    })
  }

  async file (options = {}) {
    if (!('record' in options)) throw new TypeError('options must specify “record”')
    if (!('field' in options)) throw new TypeError('options must specify “field”')
    const response = await this.#post(
      { ...options, content: 'file', action: 'export' },
      { 'Content-Type': 'application/x-www-form-urlencoded' }
    )
    const [type, ...params] = (response.headers.get('content-type') ?? '').split(';').map(s => s.trim())
    const filename = params.find(param => /^name\s*=/i.test(param))
    return new File(
      [await response.blob()],
      filename ? unquote(filename.slice(1 + filename.indexOf('=')).trim()) : `${options.record}-${options.field}`,
      { type }
    )
  }

  async upload (file, options = {}) {
    if (!(file instanceof File)) throw new TypeError('file must be an instance of File')
    if (!('record' in options)) throw new TypeError('options must specify “record”')
    if (!('field' in options)) throw new TypeError('options must specify “field”')
    const data = new FormData()
    for (const [name, value] of Object.entries({ ...options, token: this.#token, content: 'file', action: 'import' })) {
      data.append(name, value)
    }
    data.append('file', file)
    const response = await fetch(this.#endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: data
    })
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  }
}

function unquote (s) {
  return s.startsWith('"') && s.endsWith('"') ? s.slice(1, -1) : s
}

function makeParams (options) {
  const params = new URLSearchParams()
  for (const [option, value] of Object.entries(options)) {
    if (Array.isArray(value)) {
      value.forEach((element, index) => params.append(`${option}[${index}]`, element))
    } else {
      params.append(option, value)
    }
  }
  return params
}
