import { test } from 'node:test'
import assert from 'node:assert/strict'

import REDCapProjectInformation from '../lib/info.js'

const flags = [
  'inProduction',
  'isLongitudinal',
  'hasRepeatingInstrumentsOrEvents',
  'surveysEnabled',
  'schedulingEnabled',
  'recordAutonumberingEnabled',
  'randomizationEnabled',
  'ddpEnabled',
  'displayTodayNowButton',
  'bypassBranchingEraseFieldPrompt'
]

const keys = {
  inProduction: 'in_production',
  isLongitudinal: 'is_longitudinal',
  hasRepeatingInstrumentsOrEvents: 'has_repeating_instruments_or_events',
  surveysEnabled: 'surveys_enabled',
  schedulingEnabled: 'scheduling_enabled',
  recordAutonumberingEnabled: 'record_autonumbering_enabled',
  randomizationEnabled: 'randomization_enabled',
  ddpEnabled: 'ddp_enabled',
  displayTodayNowButton: 'display_today_now_button',
  bypassBranchingEraseFieldPrompt: 'bypass_branching_erase_field_prompt'
}

const settings = (value) => Object.fromEntries(Object.values(keys).map(key => [key, value]))

test('flags set as numbers read as booleans', () => {
  const on = new REDCapProjectInformation(settings(1))
  const off = new REDCapProjectInformation(settings(0))
  for (const name of flags) {
    assert.equal(on[name], true, `${name} should be true for 1`)
    assert.equal(off[name], false, `${name} should be false for 0`)
  }
})

test('flags set as strings read the same as numbers', () => {
  const on = new REDCapProjectInformation(settings('1'))
  const off = new REDCapProjectInformation(settings('0'))
  for (const name of flags) {
    assert.equal(on[name], true, `${name} should be true for "1"`)
    assert.equal(off[name], false, `${name} should be false for "0"`)
  }
})

test('flags set as booleans read as booleans', () => {
  const on = new REDCapProjectInformation(settings(true))
  const off = new REDCapProjectInformation(settings(false))
  for (const name of flags) {
    assert.equal(on[name], true, `${name} should be true for true`)
    assert.equal(off[name], false, `${name} should be false for false`)
  }
})

test('absent flags read as false', () => {
  const info = new REDCapProjectInformation({})
  for (const name of flags) {
    assert.equal(info[name], false, `${name} should be false when absent`)
  }
})

test('a development-mode project reports no production time', () => {
  const info = new REDCapProjectInformation({
    creation_time: '2024-01-15 09:30:00',
    production_time: '',
    in_production: 0
  })
  assert.equal(info.productionTime, null)
  assert.equal(info.inProduction, false)
  assert.deepEqual(info.creationTime, new Date(2024, 0, 15, 9, 30, 0))
})

test('a production project reports both times as Dates', () => {
  const info = new REDCapProjectInformation({
    creation_time: '2023-06-01 08:00:00',
    production_time: '2023-09-15 12:00:00',
    in_production: 1
  })
  assert.deepEqual(info.creationTime, new Date(2023, 5, 1, 8, 0, 0))
  assert.deepEqual(info.productionTime, new Date(2023, 8, 15, 12, 0, 0))
  assert.equal(info.inProduction, true)
})

test('absent times read as null rather than throwing', () => {
  const info = new REDCapProjectInformation({})
  assert.equal(info.creationTime, null)
  assert.equal(info.productionTime, null)
})

test('purpose is passed through, not coerced to a flag', () => {
  assert.equal(new REDCapProjectInformation({ purpose: 0 }).purpose, 0)
  assert.equal(new REDCapProjectInformation({ purpose: 4 }).purpose, 4)
})
