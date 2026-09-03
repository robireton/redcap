import { test } from 'node:test'
import assert from 'node:assert/strict'

import REDCapField from '../lib/field.js'
import REDCapInstrument from '../lib/instrument.js'

const field = o => new REDCapField({ form_name: 'visit', ...o })

const fields = [
  field({ field_name: 'visit_date', field_type: 'text', text_validation_type_or_show_slider_number: 'date_ymd' }),
  field({ field_name: 'systolic', field_type: 'text', text_validation_type_or_show_slider_number: 'integer' }),
  field({ field_name: 'weight', field_type: 'text', text_validation_type_or_show_slider_number: 'number_1dp' }),
  field({ field_name: 'note', field_type: 'text' }),
  field({ field_name: 'adverse', field_type: 'yesno' }),
  field({ field_name: 'score', field_type: 'calc' }),
  field({ field_name: 'severity', field_type: 'slider' }),
  field({ field_name: 'sex', field_type: 'radio', select_choices_or_calculations: '1, Male | 2, Female' }),
  field({ field_name: 'symptoms', field_type: 'checkbox', select_choices_or_calculations: '1, Cough | 2, Fever' })
]

const visit = observations => new REDCapInstrument('visit', 'Study Visit', fields, observations)

test('groups observations of one record into a single flat record', () => {
  const { records } = visit([
    { record: '1', field_name: 'systolic', value: '128' },
    { record: '1', field_name: 'note', value: 'fine' },
    { record: '2', field_name: 'systolic', value: '119' }
  ])
  assert.equal(records.length, 2)
  assert.equal(records[0].record, '1')
  assert.equal(records[0].systolic, 128)
  assert.equal(records[0].note, 'fine')
  assert.equal(records[1].record, '2')
})

test('a record is not split when only some of its rows carry repeat keys', () => {
  // REDCap can omit the repeat columns on rows that do not repeat while
  // including them on rows that do; both belong to the same record.
  const { records } = visit([
    { record: '1', field_name: 'systolic', value: '128' },
    { record: '1', redcap_repeat_instrument: '', redcap_repeat_instance: '', field_name: 'note', value: 'fine' }
  ])
  assert.equal(records.length, 1, 'ragged rows should not split the record')
  assert.equal(records[0].systolic, 128)
  assert.equal(records[0].note, 'fine')
})

test('record names containing the old delimiter do not collide', () => {
  const { records } = visit([
    { record: 'a:b', redcap_event_name: 'c', field_name: 'note', value: 'first' },
    { record: 'a', redcap_event_name: 'b:c', field_name: 'note', value: 'second' }
  ])
  assert.equal(records.length, 2, 'these are different records, not one')
  assert.deepEqual(records.map(r => r.note), ['first', 'second'])
})

test('repeat instances become separate records', () => {
  const { records } = visit([
    { record: '1', redcap_repeat_instrument: 'visit', redcap_repeat_instance: '1', field_name: 'systolic', value: '128' },
    { record: '1', redcap_repeat_instrument: 'visit', redcap_repeat_instance: '2', field_name: 'systolic', value: '134' }
  ])
  assert.equal(records.length, 2)
  assert.deepEqual(records.map(r => r.redcap_repeat_instance), ['1', '2'])
  assert.deepEqual(records.map(r => r.systolic), [128, 134])
})

test('rows belonging to another repeating instrument are ignored', () => {
  const { records } = visit([
    { record: '1', redcap_repeat_instrument: 'visit', redcap_repeat_instance: '1', field_name: 'systolic', value: '128' },
    { record: '1', redcap_repeat_instrument: 'labs', redcap_repeat_instance: '1', field_name: 'systolic', value: '999' }
  ])
  assert.equal(records.length, 1)
  assert.equal(records[0].systolic, 128)
})

test('events separate records', () => {
  const { records } = visit([
    { record: '1', redcap_event_name: 'baseline_arm_1', field_name: 'systolic', value: '128' },
    { record: '1', redcap_event_name: 'followup_arm_1', field_name: 'systolic', value: '121' }
  ])
  assert.equal(records.length, 2)
  assert.deepEqual(records.map(r => r.redcap_event_name), ['baseline_arm_1', 'followup_arm_1'])
})

test('pins absent from the project are absent from the record', () => {
  const [record] = visit([{ record: '1', field_name: 'note', value: 'x' }]).records
  assert.deepEqual(Object.keys(record).filter(k => k.startsWith('redcap_')), [])
  assert.ok('record' in record)
})

test('converts values by field type', () => {
  const [record] = visit([
    { record: '1', field_name: 'visit_date', value: '2023-10-02' },
    { record: '1', field_name: 'systolic', value: '128' },
    { record: '1', field_name: 'weight', value: '61.5' },
    { record: '1', field_name: 'note', value: 'plain text' },
    { record: '1', field_name: 'adverse', value: '1' },
    { record: '1', field_name: 'score', value: '22.4' },
    { record: '1', field_name: 'severity', value: '7' },
    { record: '1', field_name: 'sex', value: '2' },
    { record: '1', field_name: 'symptoms', value: '1' },
    { record: '1', field_name: 'symptoms', value: '2' }
  ]).records

  assert.equal(record.visit_date, '2023-10-02')
  assert.equal(record.systolic, 128)
  assert.equal(record.weight, 61.5)
  assert.equal(record.note, 'plain text')
  assert.equal(record.adverse, true)
  assert.equal(record.score, 22.4)
  assert.equal(record.severity, 7)
  assert.deepEqual(record.sex, { option: '2', label: 'Female' })
  assert.deepEqual(record.symptoms, [
    { option: '1', label: 'Cough' },
    { option: '2', label: 'Fever' }
  ])
})

test('yesno reads false for anything but 1', () => {
  const [record] = visit([{ record: '1', field_name: 'adverse', value: '0' }]).records
  assert.equal(record.adverse, false)
})

test('a blank numeric value reads as null, not 0 or NaN', () => {
  const [record] = visit([
    { record: '1', field_name: 'systolic', value: '' },
    { record: '1', field_name: 'weight', value: '' },
    { record: '1', field_name: 'score', value: '' },
    { record: '1', field_name: 'severity', value: '' }
  ]).records

  assert.equal(record.systolic, null, 'integer')
  assert.equal(record.weight, null, 'number_1dp')
  assert.equal(record.score, null, 'calc')
  assert.equal(record.severity, null, 'slider')
})

test('an unparseable numeric value reads as null rather than NaN', () => {
  const [record] = visit([
    { record: '1', field_name: 'systolic', value: 'NA' },
    { record: '1', field_name: 'score', value: 'NA' }
  ]).records
  assert.equal(record.systolic, null)
  assert.equal(record.score, null)
})

test('unreported fields stay null', () => {
  const [record] = visit([{ record: '1', field_name: 'note', value: 'x' }]).records
  assert.equal(record.systolic, null)
  assert.equal(record.symptoms, null)
  assert.equal(record.sex, null)
})

test('synthesizes the <form>_complete field', () => {
  const instrument = visit([{ record: '1', field_name: 'visit_complete', value: '2' }])
  assert.ok(instrument.fields.some(f => f.name === 'visit_complete'))
  assert.equal(instrument.records[0].visit_complete, 2)
})

test('fields not on this instrument are ignored', () => {
  const { records } = visit([
    { record: '1', field_name: 'note', value: 'x' },
    { record: '1', field_name: 'not_our_field', value: 'y' }
  ])
  assert.equal(records.length, 1)
  assert.ok(!('not_our_field' in records[0]))
})

test('an instrument with no observations has no records', () => {
  const instrument = visit([])
  assert.deepEqual(instrument.records, [])
  assert.equal(instrument.name, 'visit')
  assert.equal(instrument.label, 'Study Visit')
})
