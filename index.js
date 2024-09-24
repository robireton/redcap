export async function version (endpoint, token) {
  const params = new URLSearchParams()
  params.append('content', 'version')
  params.append('token', token)
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return await response.text()
}

export async function project (endpoint, token) {
  const params = new URLSearchParams()
  params.append('content', 'project')
  params.append('format', 'json')
  params.append('token', token)
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return await response.json()
}

export async function metadata (endpoint, token) {
  const params = new URLSearchParams()
  params.append('content', 'metadata')
  params.append('format', 'json')
  params.append('token', token)
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return await response.json()
}

export async function records (endpoint, token) {
  const params = new URLSearchParams()
  params.append('content', 'record')
  params.append('format', 'json')
  params.append('type', 'flat')
  // params.append('type', 'eav')
  params.append('token', token)
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return await response.json()
}

export async function events (endpoint, token) {
  const params = new URLSearchParams()
  params.append('content', 'event')
  params.append('format', 'json')
  params.append('token', token)
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return await response.json()
}

export async function arms (endpoint, token) {
  const params = new URLSearchParams()
  params.append('content', 'arm')
  params.append('format', 'json')
  params.append('token', token)
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return await response.json()
}

export async function fields (endpoint, token) {
  const params = new URLSearchParams()
  params.append('content', 'exportFieldNames')
  params.append('format', 'json')
  params.append('token', token)
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return await response.json()
}

export async function instruments (endpoint, token) {
  const params = new URLSearchParams()
  params.append('content', 'instrument')
  params.append('format', 'json')
  params.append('token', token)
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return await response.json()
}

export async function mapping (endpoint, token) {
  const params = new URLSearchParams()
  params.append('content', 'formEventMapping')
  params.append('format', 'json')
  params.append('token', token)
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return await response.json()
}

export async function repeating (endpoint, token) {
  const params = new URLSearchParams()
  params.append('content', 'repeatingFormsEvents')
  params.append('format', 'json')
  params.append('token', token)
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return await response.json()
}
