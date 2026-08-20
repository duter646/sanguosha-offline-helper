import { mkdir, writeFile } from 'node:fs/promises'

const BASE_URL = 'https://x.sanguosha.com/hero/'
const OUTPUT = new URL('../src/data/official-hero-pages.json', import.meta.url)
const MAX_ID = Number(process.env.HERO_MAX_ID ?? 2500)
const CONCURRENCY = Number(process.env.HERO_CONCURRENCY ?? 8)
const EXCLUDED_TERMS = ['限时地主', '自走棋', '共创地主']

function decode(value) {
  return value.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, ' ').replace(/\s+/g, ' ').trim()
}

function extractPage(html, id) {
  const nameMatch = html.match(/<p class="skin-hero"><span>([\s\S]*?)<\/span>([\s\S]*?)<\/p>/i)
  const name = decode(`${nameMatch?.[1] ?? ''}${nameMatch?.[2] ?? ''}`)
  if (!name) return null
  const skillStart = html.indexOf('<div class="figure-skill on">')
  const nextSkillStart = skillStart >= 0 ? html.indexOf('<div class="figure-skill ', skillStart + 1) : -1
  const skillEnd = skillStart >= 0 ? (nextSkillStart > skillStart ? nextSkillStart : html.indexOf('<div class="figure-text', skillStart)) : -1
  const firstSkillBlock = skillStart >= 0 ? html.slice(skillStart, skillEnd > skillStart ? skillEnd : undefined) : ''
  const skillNames = [...firstSkillBlock.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((match) => decode(match[1])).filter(Boolean)
  const descriptions = [...firstSkillBlock.matchAll(/<div class="hero-skill">([\s\S]*?)<\/div>/gi)].map((match) => decode(match[1])).filter(Boolean)
  const skills = skillNames.map((skillName, index) => ({ name: skillName, description: descriptions[index] ?? '' }))
  const text = decode(html.replace(/<[^>]+>/g, ' '))
  const excluded = EXCLUDED_TERMS.some((term) => text.includes(term))
  // `skin-left` is a skin/quality class on the official page, not the hero's faction.
  // The faction is encoded by the first active skin's country icon instead.
  const factionFile = html.match(/<img[^>]+class="skin-country"[^>]+src="[^"']*\/([^/"']+)\.png/i)?.[1] ?? 'unknown'
  const faction = ({ wei: '\u9b4f', shu: '\u8700', wu: '\u5434', qun: '\u7fa4', shen: '\u795e' })[factionFile] ?? '\u672a\u77e5'
  const bloodHtml = html.match(/<div class="blood">([\s\S]*?)<\/div>/i)?.[1] ?? ''
  const hp = String((bloodHtml.match(/<span><\/span>/gi) ?? []).length || '?')
  return { id: String(id), name, faction, hp, skills, availability: excluded ? 'online-original' : 'unclassified', excluded, url: `${BASE_URL}${id}.html`, fetchedAt: new Date().toISOString() }
}

async function fetchOne(id) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}${id}.html`)
      if (!response.ok) return null
      const html = new TextDecoder('utf-8').decode(await response.arrayBuffer())
      const page = extractPage(html, id)
      return page?.name ? page : null
    } catch {
      if (attempt === 2) return null
    }
  }
}

const pages = []
let cursor = 1
async function worker() {
  while (cursor <= MAX_ID) {
    const id = cursor++
    const page = await fetchOne(id)
    if (page) pages.push(page)
    if (id % 100 === 0) console.log(`processed ${id}/${MAX_ID}`)
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker))
pages.sort((a, b) => Number(a.id) - Number(b.id))
await mkdir(new URL('../src/data/', import.meta.url), { recursive: true })
await writeFile(OUTPUT, JSON.stringify({ source: BASE_URL, generatedAt: new Date().toISOString(), pages }, null, 2))
console.log(`wrote ${pages.length} official hero pages to ${OUTPUT.pathname}`)
