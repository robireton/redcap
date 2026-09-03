import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import * as index from '../index.js'

const root = path.resolve(import.meta.dirname, '..')
const pkg = JSON.parse(await readFile(path.resolve(root, 'package.json'), { encoding: 'utf8' }))

const names = [
  'REDCapAPI',
  'REDCapDatetime',
  'REDCapField',
  'REDCapInstrument',
  'REDCapProject',
  'REDCapProjectInformation'
]

test('index.js exports every class and nothing else', () => {
  for (const name of names) {
    assert.equal(typeof index[name], 'function', `${name} should be exported from index.js`)
  }
  assert.deepEqual(Object.keys(index).sort(), names)
})

test('every subpath export resolves to the same class index.js exports', async () => {
  for (const [subpath, target] of Object.entries(pkg.exports)) {
    if (subpath === '.') continue
    const module = await import(path.resolve(root, target))
    assert.equal(typeof module.default, 'function', `${subpath} should default-export a class`)
    assert.equal(module.default, index[module.default.name], `${subpath} should be the class index.js exports as ${module.default.name}`)
  }
})

test('every class has a subpath export', () => {
  assert.equal(Object.keys(pkg.exports).length, names.length + 1, 'expected one subpath per class, plus "."')
})

test('everything in the exports map is published by the files map', () => {
  for (const target of Object.values(pkg.exports)) {
    assert.ok(pkg.files.includes(target.replace(/^\.\//, '')), `${target} is exported but missing from "files"`)
  }
})
