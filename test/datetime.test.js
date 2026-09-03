import { test } from 'node:test'
import assert from 'node:assert/strict'

import REDCapDatetime from '../lib/datetime.js'

test('parses second precision, as datetime_seconds_* fields provide', () => {
  assert.equal(REDCapDatetime.parse('2024-03-01 14:30:45'), new Date(2024, 2, 1, 14, 30, 45).getTime())
})

test('parses minute precision, as datetime_* fields provide', () => {
  assert.equal(REDCapDatetime.parse('2024-03-01 14:30'), new Date(2024, 2, 1, 14, 30, 0).getTime())
})

test('parses date only, as date_* fields provide', () => {
  assert.equal(REDCapDatetime.parse('2024-03-01'), new Date(2024, 2, 1, 0, 0, 0).getTime())
})

test('accepts a T separator and surrounding whitespace', () => {
  const expected = new Date(2024, 2, 1, 14, 30, 0).getTime()
  assert.equal(REDCapDatetime.parse('2024-03-01T14:30'), expected)
  assert.equal(REDCapDatetime.parse('  2024-03-01 14:30  '), expected)
})

test('rejects values that are not REDCap datetimes', () => {
  for (const bad of ['', 'yesterday', '2024-3-1 14:30', '03/01/2024', '2024-03-01 14:30:45.123', '2024-03-01 14']) {
    assert.throws(() => REDCapDatetime.parse(bad), TypeError, `“${bad}” should be rejected`)
  }
})

test('rejects non-strings', () => {
  for (const bad of [null, undefined, 42, new Date(), {}]) {
    assert.throws(() => REDCapDatetime.parse(bad), TypeError)
  }
})

test('constructing from a REDCap string round-trips through toString', () => {
  assert.equal(new REDCapDatetime('2024-03-01 14:30:45').toString(), '2024-03-01 14:30:45')
})

test('a minute-precision string gets zero seconds', () => {
  assert.equal(new REDCapDatetime('2024-03-01 14:30').toString(), '2024-03-01 14:30:00')
})

test('a date-only string gets midnight', () => {
  assert.equal(new REDCapDatetime('2024-03-01').toString(), '2024-03-01 00:00:00')
})

test('constructing with no arguments gives the current time', () => {
  const before = Date.now()
  const now = new REDCapDatetime()
  assert.ok(now.getTime() >= before && now.getTime() <= Date.now())
})

test('constructing from a timestamp keeps Date semantics', () => {
  const when = new Date(2024, 2, 1, 14, 30, 45)
  assert.equal(new REDCapDatetime(when.getTime()).getTime(), when.getTime())
})

test('constructing from a Date keeps Date semantics', () => {
  const when = new Date(2024, 2, 1, 14, 30, 45)
  assert.equal(new REDCapDatetime(when).getTime(), when.getTime())
})

test('constructing from components keeps Date semantics', () => {
  assert.equal(
    new REDCapDatetime(2024, 2, 1, 14, 30, 45).getTime(),
    new Date(2024, 2, 1, 14, 30, 45).getTime()
  )
})

test('is still a Date', () => {
  const when = new REDCapDatetime('2024-03-01 14:30:45')
  assert.ok(when instanceof Date)
  assert.equal(when.getFullYear(), 2024)
  assert.equal(when.getMonth(), 2)
  assert.equal(when.toISOString(), new Date(2024, 2, 1, 14, 30, 45).toISOString())
})
