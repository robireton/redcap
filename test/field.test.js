import { test } from 'node:test'
import assert from 'node:assert/strict'

import REDCapField from '../lib/field.js'

const field = (type, choices) => new REDCapField({
  field_name: 'q',
  form_name: 'survey',
  field_type: type,
  select_choices_or_calculations: choices
})

test('parses a well-formed choice list', () => {
  const choices = field('radio', '1, Male | 2, Female | 3, Prefer not to say').choices
  assert.deepEqual([...choices], [['1', 'Male'], ['2', 'Female'], ['3', 'Prefer not to say']])
})

test('parses choices for every select field type', () => {
  for (const type of ['checkbox', 'radio', 'dropdown']) {
    assert.deepEqual([...field(type, '1, Yes | 0, No').choices], [['1', 'Yes'], ['0', 'No']])
  }
})

test('keeps commas that belong to the label', () => {
  const choices = field('dropdown', '1, Yes, definitely | 2, No, never').choices
  assert.equal(choices.get('1'), 'Yes, definitely')
  assert.equal(choices.get('2'), 'No, never')
})

test('trims whitespace around options and labels', () => {
  const choices = field('radio', '  1 ,  Male   |   2 , Female  ').choices
  assert.deepEqual([...choices], [['1', 'Male'], ['2', 'Female']])
})

test('a blank label yields an empty string, not a crash', () => {
  const choices = field('radio', '1, |2, Yes').choices
  assert.equal(choices.get('1'), '')
  assert.equal(choices.get('2'), 'Yes')
})

test('a trailing separator is ignored', () => {
  assert.deepEqual([...field('radio', '1, Yes | 2, No |').choices], [['1', 'Yes'], ['2', 'No']])
})

test('an entry with no comma is skipped rather than throwing', () => {
  const choices = field('radio', '1, Yes | garbage | 2, No').choices
  assert.deepEqual([...choices], [['1', 'Yes'], ['2', 'No']])
})

test('an empty or absent choice list yields an empty Map', () => {
  for (const spec of ['', '   ', '|', undefined, null]) {
    const choices = field('checkbox', spec).choices
    assert.ok(choices instanceof Map)
    assert.equal(choices.size, 0)
  }
})

test('non-select fields get no choices', () => {
  assert.equal(field('text', '').choices, undefined)
  assert.equal(field('yesno', '').choices, undefined)
  assert.equal(field('notes', '').choices, undefined)
})

test('a calc field keeps its calculation and is not parsed as choices', () => {
  const calc = field('calc', '[weight]/([height]*[height])')
  assert.equal(calc.choices, undefined)
  assert.equal(calc.select_choices_or_calculations, '[weight]/([height]*[height])')
})

test('a field built from nothing does not throw', () => {
  const empty = new REDCapField()
  assert.equal(empty.name, undefined)
  assert.equal(empty.choices, undefined)
})

test('the other getters pass their values through', () => {
  const f = new REDCapField({
    field_name: 'age',
    form_name: 'demographics',
    field_type: 'text',
    field_label: 'Age',
    field_note: 'years',
    text_validation_type_or_show_slider_number: 'integer',
    text_validation_min: '0',
    text_validation_max: '120',
    identifier: 'y',
    required_field: 'y'
  })
  assert.equal(f.name, 'age')
  assert.equal(f.instrument, 'demographics')
  assert.equal(f.type, 'text')
  assert.equal(f.label, 'Age')
  assert.equal(f.note, 'years')
  assert.equal(f.text_validation_type_or_show_slider_number, 'integer')
  assert.equal(f.text_validation_min, '0')
  assert.equal(f.text_validation_max, '120')
  assert.equal(f.identifier, 'y')
  assert.equal(f.required_field, 'y')
})
