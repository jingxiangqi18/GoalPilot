// A deliberately small, text-only Markdown subset. Never interpret HTML, links
// or model output as DOM. Unsupported syntax remains visible as ordinary text.
export function replyBlocks(value) {
  const blocks = []
  let paragraph = [], list = null, code = null
  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: 'paragraph', text: paragraph.join('\n') })
    paragraph = []
  }
  const flushList = () => { if (list) blocks.push(list); list = null }

  for (const line of String(value ?? '').replace(/\r\n?/g, '\n').split('\n')) {
    if (line.trim().startsWith('```')) {
      flushParagraph(); flushList()
      if (code !== null) { blocks.push({ type: 'code', text: code.join('\n') }); code = null }
      else code = []
      continue
    }
    if (code !== null) { code.push(line); continue }
    if (!line.trim()) { flushParagraph(); flushList(); continue }
    const heading = /^\s{0,3}#{1,6}\s+(.+)$/.exec(line)
    const item = /^\s*(?:[-*+]\s+|(\d+)[.)、]\s+)(.+)$/.exec(line)
    if (heading) {
      flushParagraph(); flushList()
      blocks.push({ type: 'heading', text: heading[1] })
    } else if (item) {
      flushParagraph()
      const ordered = Boolean(item[1])
      const number = ordered ? Number(item[1]) : null
      if (list && (list.ordered !== ordered || (ordered && number !== list.start + list.items.length))) flushList()
      list ??= { type: 'list', ordered, start: number, items: [] }
      list.items.push(item[2])
    } else {
      flushList()
      paragraph.push(line)
    }
  }
  flushParagraph(); flushList()
  if (code !== null) blocks.push({ type: 'code', text: code.join('\n') })
  return blocks
}

export function replyInlines(text) {
  return String(text).split(/(\*\*[^*\n]+\*\*|`[^`\n]+`)/g).filter(Boolean).map(part => {
    if (part.startsWith('**') && part.endsWith('**')) return { tag: 'strong', text: part.slice(2, -2) }
    if (part.startsWith('`') && part.endsWith('`')) return { tag: 'code', text: part.slice(1, -1) }
    return { tag: 'span', text: part }
  })
}
