const defaultHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/x-www-form-urlencoded'
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
  if (process.env.VERBOSE) console.log(params)
  return params
}

export async function getVersion (endpoint, token) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: makeParams({ content: 'version', token })
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return await response.text()
}

export async function getProject (endpoint, token) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: defaultHeaders,
    body: makeParams({ content: 'project', format: 'json', token })
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return await response.json()
}

export async function getMetadata (endpoint, token, options = {}) {
  options.token = token
  options.content = 'metadata'
  options.format = 'json'

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: defaultHeaders,
    body: makeParams(options)
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return await response.json()
}

export async function getRecords (endpoint, token, options = {}) {
  options.token = token
  options.content = 'record'
  options.format = 'json'
  if (!('type' in options)) options.type = 'flat'

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: defaultHeaders,
    body: makeParams(options)
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return await response.json()
}

export async function getEvents (endpoint, token, options = {}) {
  options.token = token
  options.content = 'event'
  options.format = 'json'

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: defaultHeaders,
    body: makeParams(options)
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return await response.json()
}

export async function getArms (endpoint, token, options = {}) {
  options.token = token
  options.content = 'arm'
  options.format = 'json'

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: defaultHeaders,
    body: makeParams(options)
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return await response.json()
}

export async function getFields (endpoint, token, options = {}) {
  options.token = token
  options.content = 'exportFieldNames'
  options.format = 'json'

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: defaultHeaders,
    body: makeParams(options)
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return await response.json()
}

export async function getInstruments (endpoint, token) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: defaultHeaders,
    body: makeParams({ content: 'instrument', format: 'json', token })
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return await response.json()
}

export async function getMapping (endpoint, token, options = {}) {
  options.token = token
  options.content = 'formEventMapping'
  options.format = 'json'

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: defaultHeaders,
    body: makeParams(options)
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return await response.json()
}

export async function getRepeating (endpoint, token) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: defaultHeaders,
    body: makeParams({ content: 'repeatingFormsEvents', format: 'json', token })
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return await response.json()
}

export async function putRecords (endpoint, token, data, options = {}) {
  options.token = token
  options.content = 'record'
  options.format = 'json'
  if (!('type' in options)) options.type = 'flat'
  options.data = JSON.stringify(Array.isArray(data) ? data : [data])

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: defaultHeaders,
    body: makeParams(options)
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return await response.json()
}
