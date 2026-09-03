import { test } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'

import REDCapProject from '../lib/project.js'

// REDCapProject resolves path.resolve(endpoint, token) against the cwd, so it
// needs an absolute base rather than a repo-relative one.
const fixtures = path.resolve(import.meta.dirname, 'fixtures')

const load = async name => {
  const project = new REDCapProject(fixtures, name)
  await project.populate()
  return project
}

const arrayGetters = ['data', 'fields', 'instruments']
const longitudinalGetters = ['arms', 'events', 'mapping']

test('every accessor refuses to answer before populate()', () => {
  const project = new REDCapProject(fixtures, 'project-basic')
  for (const getter of [...arrayGetters, ...longitudinalGetters, 'info', 'repeating']) {
    assert.throws(() => project[getter], /project not ready/, `${getter} should refuse`)
  }
})

test('getInstrument refuses before populate() like every other accessor', () => {
  const project = new REDCapProject(fixtures, 'project-basic')
  assert.throws(() => project.getInstrument('demographics'), /project not ready/)
})

test('loads a flat project from the filesystem', async () => {
  const project = await load('project-basic')

  assert.equal(project.info.title, 'Basic Test Project')
  assert.equal(project.info.id, 42)
  assert.equal(project.info.isLongitudinal, false)
  assert.equal(project.fields.length, 10)
  assert.equal(project.instruments.length, 1)
  assert.equal(project.instruments[0].name, 'demographics')
  assert.equal(project.instruments[0].label, 'Demographics')
})

test('longitudinal-only accessors refuse on a flat project', async () => {
  const project = await load('project-basic')
  for (const getter of longitudinalGetters) {
    assert.throws(() => project[getter], /not longitudinal/, `${getter} should refuse`)
  }
  assert.throws(() => project.repeating, /does not have repeating/)
})

test('loads a longitudinal project with arms, events and mapping', async () => {
  const project = await load('project-longitudinal')

  assert.equal(project.info.isLongitudinal, true)
  assert.equal(project.info.hasRepeatingInstrumentsOrEvents, true)
  assert.deepEqual(project.arms.map(a => a.name), ['Treatment', 'Control'])
  assert.deepEqual(project.events.map(e => e.unique_event_name), ['baseline_arm_1', 'followup_arm_1', 'baseline_arm_2'])
  assert.equal(project.mapping.length, 4)
  assert.deepEqual(project.repeating.map(r => r.form_name), ['visit', 'visit'])
})

test('builds records per instrument', async () => {
  const project = await load('project-basic')
  const demographics = project.getInstrument('demographics')

  assert.equal(demographics.records.length, 2)
  const [ada] = demographics.records
  assert.equal(ada.record, '1')
  assert.equal(ada.name, 'Ada Lovelace')
  assert.equal(ada.age, 36)
  assert.equal(ada.consent, true)
  assert.deepEqual(ada.sex, { option: '2', label: 'Female' })
  assert.deepEqual(ada.symptoms, [
    { option: '1', label: 'Cough' },
    { option: '3', label: 'Fatigue' }
  ])
})

test('separates repeat instances and events', async () => {
  const project = await load('project-longitudinal')
  const visits = project.getInstrument('visit').records

  assert.equal(visits.length, 3)
  assert.deepEqual(visits.map(v => [v.redcap_event_name, v.redcap_repeat_instance]), [
    ['baseline_arm_1', '1'],
    ['baseline_arm_1', '2'],
    ['followup_arm_1', '1']
  ])
  assert.deepEqual(visits.map(v => v.systolic), [128, 134, 121])
})

test('getInstrument returns undefined for an unknown instrument', async () => {
  const project = await load('project-basic')
  assert.equal(project.getInstrument('nope'), undefined)
})

test('mutating a returned array does not disturb the project', async () => {
  const project = await load('project-basic')

  for (const getter of arrayGetters) {
    const before = project[getter].length
    const borrowed = project[getter]
    borrowed.length = 0
    borrowed.push('nonsense')
    assert.equal(project[getter].length, before, `${getter} should be insulated from callers`)
  }
})

test('mutating a returned longitudinal array does not disturb the project', async () => {
  const project = await load('project-longitudinal')

  for (const getter of [...longitudinalGetters, 'repeating']) {
    const before = project[getter].length
    project[getter].length = 0
    assert.equal(project[getter].length, before, `${getter} should be insulated from callers`)
  }
})

test('the raw eav data is available and insulated', async () => {
  const project = await load('project-basic')
  assert.equal(project.data.length, 19)
  assert.equal(project.data[0].field_name, 'record_id')

  project.data.splice(0)
  assert.equal(project.data.length, 19)
})
