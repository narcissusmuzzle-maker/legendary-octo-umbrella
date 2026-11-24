// Проверка записи цветов для циферблата: подставляем заглушки общего хранилища и смотрим, что в них попало.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'share-'))
fs.mkdirSync(path.join(tmp, 'shared'))
fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}')
fs.writeFileSync(path.join(tmp, 'shared', 'share.js'), fs.readFileSync(path.join(root, 'shared', 'share.js'), 'utf8'))
const d = path.join(tmp, 'node_modules', '@zos', 'storage')
fs.mkdirSync(d, { recursive: true })
fs.writeFileSync(path.join(d, 'package.json'), JSON.stringify({ name: '@zos/storage', type: 'module', main: 'index.js' }))
fs.writeFileSync(path.join(d, 'index.js'), `
export class ShareTypedStorage { constructor(s) { this.s = s; globalThis.__typed = globalThis.__typed || {}; this.m = (globalThis.__typed[s] = globalThis.__typed[s] || {}) }
  putInt(k, v) { this.m[k] = v; return 0 } putInt64(k, v) { this.m[k] = v; return 0 } }
export class ShareLocalStorage { constructor(f) { this.f = f; globalThis.__file = globalThis.__file || {}; this.m = (globalThis.__file[f] = globalThis.__file[f] || {}) }
  setItem(k, v) { this.m[k] = v } }
`)
const share = await import(pathToFileURL(path.join(tmp, 'shared', 'share.js')).href)

const colors = []
for (let r = 0; r < 8; r++) colors.push([0x100000 + r * 3, 0x100000 + r * 3 + 1, 0x100000 + r * 3 + 2])
assert.deepEqual(share.topColors(colors), [0x100000, 0x100001, 0x100002, 0x100003, 0x100004, 0x100005])
assert.equal(share.publish(colors, 777), '')
const t = globalThis.__typed[share.SCOPE]
for (let i = 0; i < 6; i++) assert.equal(t['c' + i], 0x100000 + i)
assert.equal(t.ts, 777)
assert.ok(t.at > 0)
const f = globalThis.__file[share.FILE]
assert.deepEqual(f.top, share.topColors(colors))
assert.equal(f.ts, 777)
assert.equal(f.at, t.at)
console.log('share: ok')
