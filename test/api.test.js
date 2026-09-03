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
