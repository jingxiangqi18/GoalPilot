import test from 'node:test'
import assert from 'node:assert/strict'
import { replyBlocks, replyInlines } from '../src/utils/assistantReply.js'

test('assistant prose, headings and lists keep their content and numbering', () => {
  assert.deepEqual(replyBlocks('## 正式计划\r\n\r\n第一行\n第二行\n\n1. 搭建项目\n2. 验证功能\n\n- 已跳过不等于已完成'), [
    { type: 'heading', text: '正式计划' },
    { type: 'paragraph', text: '第一行\n第二行' },
    { type: 'list', ordered: true, start: 1, items: ['搭建项目', '验证功能'] },
    { type: 'list', ordered: false, start: null, items: ['已跳过不等于已完成'] },
  ])
  const blocks = replyBlocks('3. 第三项\n5. 第五项\n+ 另一项')
  assert.equal(blocks[0].start, 3)
  assert.equal(blocks[1].start, 5)
  assert.equal(blocks[2].ordered, false)
})

test('only allowlisted text tags are produced; HTML and URLs are inert text', () => {
  const input = '<img src=x onerror=alert(1)> **完成标准** 与 `代码` [链接](javascript:alert(1))'
  const tokens = replyInlines(input)
  assert.deepEqual(tokens.map(item => item.tag), ['span', 'strong', 'span', 'code', 'span'])
  assert.equal(tokens[0].text, '<img src=x onerror=alert(1)> ')
  assert.equal(tokens.at(-1).text, ' [链接](javascript:alert(1))')
  assert.deepEqual(replyBlocks('```html\n<script>alert(1)</script>\n```'), [{ type: 'code', text: '<script>alert(1)</script>' }])
})

test('empty input, unfinished Markdown and code preserve readable content', () => {
  assert.deepEqual(replyBlocks(null), [])
  assert.deepEqual(replyInlines('**未闭合'), [{ tag: 'span', text: '**未闭合' }])
  assert.deepEqual(replyBlocks('```\n## 不是标题\n- 不是列表'), [{ type: 'code', text: '## 不是标题\n- 不是列表' }])
})
