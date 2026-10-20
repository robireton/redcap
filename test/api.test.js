import { test } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { once } from 'node:events'

import REDCapAPI from '../lib/api.js'

// Stand up a real server on an ephemeral port so the tests exercise fetch,
// request bodies and response headers for real — no mocking library needed.
async function withServer (handler, run) {
  const requests = []
  const server = http.createServer(async (req, res) => {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = Buffer.concat(chunks)
    const request = { method: req.method, headers: req.headers, body }
    requests.push(request)
    handler(request, res)
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  try {
    return await run(`http://127.0.0.1:${server.address().port}/api/`, requests)
  } finally {
    server.close()
    await once(server, 'close')
  }
}

// echoes the received form-encoded parameters back as JSON
function echo (request, res) {
  const params = new URLSearchParams(request.body.toString('utf8'))
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(Object.fromEntries(params)))
}

const sent = requests => Object.fromEntries(new URLSearchParams(requests.at(-1).body.toString('utf8')))

test('does not mutate the caller’s options or leak the token into them', async () => {
  await withServer(echo, async (endpoint, requests) => {
    const api = new REDCapAPI(endpoint, 'SECRET')
    const options = { fields: ['a', 'b'] }
    await api.metadata(options)

    assert.deepEqual(options, { fields: ['a', 'b'] }, 'options should be untouched')
    assert.ok(!('token' in options), 'the token must not be written into the caller’s object')
    assert.ok(!('format' in options))
    assert.ok(!('content' in options))
    assert.equal(sent(requests).token, 'SECRET', 'the token should still be sent')
  })
})

test('an options object is reusable across calls without carrying stale keys', async () => {
  await withServer(echo, async (endpoint, requests) => {
    const api = new REDCapAPI(endpoint, 'SECRET')
    const options = {}
    await api.records(options)
    await api.metadata(options)

    assert.deepEqual(options, {})
    assert.equal(sent(requests).content, 'metadata', 'the second call must not inherit content=record')
    assert.ok(!('type' in sent(requests)), 'the second call must not inherit type=flat')
  })
})

test('records defaults to flat and lets the caller override', async () => {
  await withServer(echo, async (endpoint, requests) => {
    const api = new REDCapAPI(endpoint, 'SECRET')

    await api.records()
    assert.equal(sent(requests).type, 'flat')
    assert.equal(sent(requests).content, 'record')

    await api.records({ type: 'eav' })
    assert.equal(sent(requests).type, 'eav')
  })
})

test('array options serialize with indexed names', async () => {
  await withServer(echo, async (endpoint, requests) => {
    const api = new REDCapAPI(endpoint, 'SECRET')
    await api.metadata({ fields: ['age', 'sex'], forms: ['demographics'] })

    const params = sent(requests)
    assert.equal(params['fields[0]'], 'age')
    assert.equal(params['fields[1]'], 'sex')
    assert.equal(params['forms[0]'], 'demographics')
  })
})

test('write wraps a single record and serializes as JSON', async () => {
  await withServer(echo, async (endpoint, requests) => {
    const api = new REDCapAPI(endpoint, 'SECRET')

    await api.write({ record_id: '1' })
    assert.deepEqual(JSON.parse(sent(requests).data), [{ record_id: '1' }])
    assert.equal(sent(requests).type, 'flat')

    await api.write([{ record_id: '1' }, { record_id: '2' }])
    assert.equal(JSON.parse(sent(requests).data).length, 2)
  })
})

test('every content type requests JSON except version', async () => {
  await withServer((request, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('14.0.1')
  }, async (endpoint, requests) => {
    const api = new REDCapAPI(endpoint, 'SECRET')
    assert.equal(await api.version(), '14.0.1')

    const params = sent(requests)
    assert.equal(params.content, 'version')
    assert.equal(params.token, 'SECRET')
    assert.ok(!('format' in params), 'version is plain text, not JSON')
  })
})

// a tiny REDCap: record 1 repeats, so the ID export returns it twice
function batchServer (request, res) {
  const params = Object.fromEntries(new URLSearchParams(request.body.toString('utf8')))
  let body
  if (params.content === 'metadata') {
    body = [{ field_name: 'study_id' }, { field_name: 'age' }]
  } else if (!('records[0]' in params)) {
    body = ['1', '1', '2', '3', '4', '5'].map(id => ({ [params['fields[0]']]: id }))
  } else {
    body = Object.keys(params).filter(key => key.startsWith('records[')).map(key => ({ study_id: params[key] }))
  }
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

const collect = async batches => {
  const result = []
  for await (const batch of batches) result.push(batch.map(record => record.study_id))
  return result
}

const parsed = request => Object.fromEntries(new URLSearchParams(request.body.toString('utf8')))

test('recordBatches exports unique record IDs in batches', async () => {
  await withServer(batchServer, async (endpoint, requests) => {
    const api = new REDCapAPI(endpoint, 'SECRET')
    const options = { type: 'eav', filterLogic: '[age] > 30', events: ['baseline_arm_1'], forms: ['demographics'], fields: ['age'] }
    const batches = await collect(api.recordBatches(options, { batchSize: 2 }))

    assert.deepEqual(batches, [['1', '2'], ['3', '4'], ['5']])
    assert.deepEqual(options, { type: 'eav', filterLogic: '[age] > 30', events: ['baseline_arm_1'], forms: ['demographics'], fields: ['age'] })

    const [metadata, ids, ...exports] = requests.map(parsed)
    assert.equal(metadata.content, 'metadata')

    assert.equal(ids.content, 'record')
    assert.equal(ids.type, 'flat', 'the ID export must be flat to read the ID field')
    assert.equal(ids['fields[0]'], 'study_id', 'the ID field defaults to the first metadata field')
    assert.ok(!('fields[1]' in ids))
    assert.ok(!('forms[0]' in ids), 'forms would add columns to the ID export')
    assert.equal(ids.filterLogic, '[age] > 30')
    assert.equal(ids['events[0]'], 'baseline_arm_1')

    assert.equal(exports.length, 3)
    for (const params of exports) {
      assert.equal(params.type, 'eav')
      assert.equal(params.filterLogic, '[age] > 30')
      assert.equal(params['forms[0]'], 'demographics')
      assert.equal(params['fields[0]'], 'age')
    }
  })
})

test('recordBatches uses a given idField without fetching metadata', async () => {
  await withServer(batchServer, async (endpoint, requests) => {
    const api = new REDCapAPI(endpoint, 'SECRET')
    await collect(api.recordBatches({}, { idField: 'study_id' }))

    assert.equal(parsed(requests[0]).content, 'record')
    assert.equal(parsed(requests[0])['fields[0]'], 'study_id')
    assert.equal(requests.length, 2, 'one ID export and one batch under the default size')
  })
})

test('recordBatches batches the caller’s own records without an ID export', async () => {
  await withServer(batchServer, async (endpoint, requests) => {
    const api = new REDCapAPI(endpoint, 'SECRET')
    const batches = await collect(api.recordBatches({ records: ['7', '8', '7', '9'] }, { batchSize: 2 }))

    assert.deepEqual(batches, [['7', '8'], ['9']])
    assert.equal(requests.length, 2)
  })
})

test('recordBatches rejects a bad batchSize', async () => {
  const api = new REDCapAPI('https://example.invalid/api/', 'SECRET')
  for (const batchSize of [0, -1, 1.5, '10']) {
    await assert.rejects(() => api.recordBatches({}, { batchSize }).next(), RangeError)
  }
})

test('a non-ok response throws with the status', async () => {
  await withServer((request, res) => {
    res.writeHead(403, 'Forbidden')
    res.end('nope')
  }, async endpoint => {
    const api = new REDCapAPI(endpoint, 'SECRET')
    await assert.rejects(() => api.project(), /403/)
  })
})

test('file() reads the filename from a bare content type', async () => {
  await withServer((request, res) => {
    res.writeHead(200, { 'Content-Type': 'application/pdf; name="consent.pdf"' })
    res.end('%PDF-1.4')
  }, async endpoint => {
    const api = new REDCapAPI(endpoint, 'SECRET')
    const file = await api.file({ record: '1', field: 'consent_form' })
    assert.equal(file.name, 'consent.pdf')
    assert.equal(file.type, 'application/pdf')
    assert.equal(await file.text(), '%PDF-1.4')
  })
})

test('file() reads the filename when a charset comes first', async () => {
  await withServer((request, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=UTF-8; name="notes.txt"' })
    res.end('hello')
  }, async endpoint => {
    const api = new REDCapAPI(endpoint, 'SECRET')
    const file = await api.file({ record: '1', field: 'notes' })
    assert.equal(file.name, 'notes.txt')
    assert.equal(file.type, 'text/plain')
  })
})

test('file() falls back to a derived name when none is offered', async () => {
  await withServer((request, res) => {
    res.writeHead(200, { 'Content-Type': 'application/octet-stream' })
    res.end('data')
  }, async endpoint => {
    const api = new REDCapAPI(endpoint, 'SECRET')
    const file = await api.file({ record: '7', field: 'scan' })
    assert.equal(file.name, '7-scan')
    assert.equal(file.type, 'application/octet-stream')
  })
})

test('file() sends the export action and does not mutate options', async () => {
  await withServer((request, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; name="x.txt"' })
    res.end('x')
  }, async (endpoint, requests) => {
    const api = new REDCapAPI(endpoint, 'SECRET')
    const options = { record: '1', field: 'notes' }
    await api.file(options)

    assert.deepEqual(options, { record: '1', field: 'notes' })
    const params = sent(requests)
    assert.equal(params.content, 'file')
    assert.equal(params.action, 'export')
    assert.equal(params.token, 'SECRET')
  })
})

test('file() requires record and field', async () => {
  const api = new REDCapAPI('https://example.invalid/api/', 'SECRET')
  await assert.rejects(() => api.file({ field: 'notes' }), TypeError)
  await assert.rejects(() => api.file({ record: '1' }), TypeError)
})

test('upload() sends multipart form data and does not mutate options', async () => {
  await withServer((request, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end('{}')
  }, async (endpoint, requests) => {
    const api = new REDCapAPI(endpoint, 'SECRET')
    const options = { record: '1', field: 'notes' }
    await api.upload(new File(['hello'], 'notes.txt', { type: 'text/plain' }), options)

    assert.deepEqual(options, { record: '1', field: 'notes' })
    const request = requests.at(-1)
    assert.match(request.headers['content-type'], /^multipart\/form-data/)
    const body = request.body.toString('utf8')
    assert.match(body, /name="token"[\s\S]*SECRET/)
    assert.match(body, /name="action"[\s\S]*import/)
    assert.match(body, /name="file"; filename="notes.txt"/)
  })
})

test('upload() validates its arguments', async () => {
  const api = new REDCapAPI('https://example.invalid/api/', 'SECRET')
  await assert.rejects(() => api.upload('not a file', { record: '1', field: 'f' }), TypeError)
  await assert.rejects(() => api.upload(new File([''], 'x'), { field: 'f' }), TypeError)
  await assert.rejects(() => api.upload(new File([''], 'x'), { record: '1' }), TypeError)
})

test('the constructor validates endpoint and token', () => {
  assert.throws(() => new REDCapAPI(42, 'SECRET'), TypeError)
  assert.throws(() => new REDCapAPI('https://example.invalid/', ''), TypeError)
  assert.throws(() => new REDCapAPI('https://example.invalid/', null), TypeError)
  assert.ok(new REDCapAPI(new URL('https://example.invalid/api/'), 'SECRET'))
})
