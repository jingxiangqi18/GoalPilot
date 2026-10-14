import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { normalizeAppearance, worldScenes, worldArtFor } from '../src/utils/worldAppearance.js'

test('appearance preferences have safe defaults and whitelist scenes', () => {
  for (const value of [null, undefined, {}, 'broken', { scene: 'https://invalid.test/pixel', focused: 'yes' }]) {
    assert.deepEqual(normalizeAppearance(value), { scene: 'harbor', focused: false })
  }
  for (const { key } of worldScenes) assert.deepEqual(normalizeAppearance({ scene: key, focused: true, extra: 'discard' }), { scene: key, focused: true })
})

test('all eight original world assets are local optimized WebP files', async () => {
  const cutouts = ['garden-edge', 'neighborhood-edge', 'viaduct', 'desk', 'reading-nook']
  for (const key of ['harbor', 'garden', 'night-rail', ...cutouts]) {
    const bytes = await readFile(new URL(`../src/assets/goalpilot-world-${key}-v1.webp`, import.meta.url))
    assert.equal(bytes.subarray(8, 12).toString(), 'WEBP')
    assert.ok(bytes.length < 500_000)
    if (cutouts.includes(key)) assert.ok(bytes.includes(Buffer.from('ALPH')), key + ' retains alpha')
  }
})

test('themes select distinct ToDo artwork and Singapore has coherent page roles', () => {
  assert.notEqual(worldArtFor('harbor', 'tasks'), worldArtFor('garden', 'tasks'))
  for (const key of ['harbor', 'garden', 'night-rail']) {
    for (const role of ['home', 'tasks', 'library', 'sidebar', 'auth', 'cover']) assert.equal(worldArtFor(key, role, 42), key)
  }
  assert.equal(worldArtFor('singapore', 'home'), 'singapore-atlas')
  assert.equal(worldArtFor('singapore', 'tasks'), 'singapore-gardens')
  assert.equal(worldArtFor('singapore', 'library'), 'singapore-quays')
  for (const role of ['home', 'tasks', 'library', 'sidebar', 'auth', 'cover', 'left', 'right', 'footer', 'welcome', 'empty', 'work', 'study', 'wellness', 'detail']) assert.ok(worldArtFor('singapore', role, 42).startsWith('singapore-'))
  const original = [11, 22, 33].map(id => [id, worldArtFor('singapore', 'cover', id)])
  assert.equal(worldArtFor('singapore', 'cover', 22), original[1][1])
  assert.equal(worldArtFor('bad-value', 'home'), 'harbor')
})

test('Singapore city assets are optimized and cutouts retain alpha', async () => {
  for (const key of ['atlas', 'gardens', 'quays', 'shophouse', 'garden-edge', 'mrt']) {
    const bytes = await readFile(new URL(`../src/assets/goalpilot-world-singapore-${key}-v1.webp`, import.meta.url))
    assert.equal(bytes.subarray(8, 12).toString(), 'WEBP')
    assert.ok(bytes.length < 700_000)
    if (['shophouse', 'garden-edge', 'mrt'].includes(key)) assert.ok(bytes.includes(Buffer.from('ALPH')))
  }
})

test('NUS campus has its own page scenes, stable covers and local assets', async () => {
  assert.equal(worldArtFor('nus', 'home'), 'nus-campus')
  assert.equal(worldArtFor('nus', 'tasks'), 'nus-green')
  assert.equal(worldArtFor('nus', 'library'), 'nus-commons')
  for (const role of ['sidebar', 'auth', 'cover', 'left', 'right', 'footer', 'welcome', 'empty', 'work', 'study', 'wellness', 'detail']) assert.ok(worldArtFor('nus', role, 42).startsWith('nus-'))
  const covers = new Map([1, 2, 3].map(id => [id, worldArtFor('nus', 'cover', id)]))
  assert.equal(new Set(covers.values()).size, 3)
  for (const id of [3, 1, 2]) assert.equal(worldArtFor('nus', 'cover', id), covers.get(id))
  for (const key of ['campus', 'green', 'commons', 'study']) {
    const bytes = await readFile(new URL(`../src/assets/goalpilot-world-nus-${key}-v1.webp`, import.meta.url))
    assert.equal(bytes.subarray(8, 12).toString(), 'WEBP')
    assert.ok(bytes.length < 800_000)
    if (key === 'study') assert.ok(bytes.includes(Buffer.from('ALPH')), 'Campus cutout retains transparency')
  }
})
