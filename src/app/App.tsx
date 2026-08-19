import { useMemo, useState } from 'react'
import { heroes, skills } from '../data/catalog'
import type { Hero, Page } from '../domain/hero/hero.types'
import { drawPingjian } from '../domain/skill/pingjian.rule'
import type { SkillCandidate, SkillTrigger } from '../domain/skill/skill.types'
import type { SkillPool } from '../domain/pool/pool.types'
import { loadActivePoolId, loadPools, saveActivePoolId, savePools } from '../stores/pool.storage'

const toolNames = ['\u8bb8\u90b5', '\u5f20\u88d5', '\u795e\u534e\u4f57', '\u5173\u5b81', '\u7ba1\u5b81', '\u8d75\u8944', '\u5168\u60e0\u89e3', '\u5357\u534e\u8001\u4ed9', '\u82b1\u5e9e']
const candidate = (hero: Hero, skill: typeof skills[number]): SkillCandidate => ({ heroId: hero.id, heroName: hero.name, skillName: skill.name, description: skill.description })

function HeroCard({ hero, onOpen }: { hero: Hero; onOpen: () => void }) { const skill = skills.find((item) => hero.skillIds.includes(item.id)); return <article className="hero-card" onClick={onOpen}><div className="hero-card__top"><span className="hero-faction">{hero.faction}</span><span>{hero.hp}体力</span></div><h3>{hero.name}</h3><div className="skill-name">{skill?.name}</div><p>{skill?.description}</p><span className="tag">{skill?.mechanismLabel}</span></article> }

export function App() {
  const [page, setPage] = useState<Page>('home')
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null)
  const [query, setQuery] = useState('')
  const [drawHeroId, setDrawHeroId] = useState('official-804')
  const [targetHeroId, setTargetHeroId] = useState('')
  const [trigger, setTrigger] = useState<SkillTrigger>('play-phase')
  const [candidates, setCandidates] = useState<SkillCandidate[]>([])
  const [used, setUsed] = useState<string[]>([])
  const [poolModalOpen, setPoolModalOpen] = useState(false)
  const [pools, setPools] = useState<SkillPool[]>(() => loadPools(heroes.map((hero) => hero.id)))
  const [activePoolId, setActivePoolId] = useState(() => loadActivePoolId())
  const activePool = pools.find((pool) => pool.id === activePoolId) ?? pools[0]
  const poolHeroIds = activePool?.heroIds ?? []
  const toolHeroes = heroes.filter((hero) => toolNames.includes(hero.name))
  const drawHero = heroes.find((hero) => hero.id === drawHeroId) ?? toolHeroes[0]
  const targetHero = heroes.find((hero) => hero.id === targetHeroId)
  const pool = heroes.filter((hero) => poolHeroIds.includes(hero.id) && hero.id !== drawHero?.id)

  const updatePools = (next: SkillPool[]) => { setPools(next); savePools(next) }
  const updatePoolHeroes = (ids: string[]) => updatePools(pools.map((poolItem) => poolItem.id === activePool?.id ? { ...poolItem, heroIds: ids } : poolItem))
  const selectPool = (id: string) => { setActivePoolId(id); saveActivePoolId(id); setCandidates([]); setUsed([]) }
  const createPool = () => { const name = window.prompt('请输入将池名称'); if (!name?.trim()) return; const id = `pool-${Date.now()}`; updatePools([...pools, { id, name: name.trim(), heroIds: heroes.map((hero) => hero.id) }]); selectPool(id) }

  const draw = () => {
    if (!drawHero) return
    let result = pool.flatMap((hero) => skills.filter((skill) => hero.skillIds.includes(skill.id)).map((skill) => candidate(hero, skill)))
    if (drawHero.name === '许劭') result = drawPingjian({ trigger, pool: result, usedSkillNames: used }).candidates
    if (drawHero.name === '张裕') result = result.filter((item) => { const hero = pool.find((itemHero) => itemHero.id === item.heroId); return hero?.faction === targetHero?.faction && hero?.hp === targetHero?.hp && !/限定技|觉醒技|主公技/.test(item.description) }).sort(() => Math.random() - .5).slice(0, 3)
    if (drawHero.name === '神华佗') result = targetHero ? pool.filter((hero) => hero.name === targetHero.name).flatMap((hero) => skills.filter((skill) => hero.skillIds.includes(skill.id)).map((skill) => candidate(hero, skill))) : []
    if (drawHero.name === '关宁' || drawHero.name === '花鬘') result = targetHero ? skills.filter((skill) => targetHero.skillIds.includes(skill.id)).map((skill) => candidate(targetHero, skill)) : []
    if (drawHero.name === '管宁') result = result.filter((item) => /仁义礼智信/.test(item.description))
    if (drawHero.name === '赵襄') result = result.filter((item) => pool.find((hero) => hero.id === item.heroId)?.faction === '蜀' && !/限定技|觉醒技|主公技/.test(item.description)).sort(() => Math.random() - .5).slice(0, 6)
    if (drawHero.name === '全惠解') result = result.filter((item) => pool.find((hero) => hero.id === item.heroId)?.faction === '吴').sort(() => Math.random() - .5).slice(0, 4)
    setCandidates(result.filter((item) => !used.includes(item.skillName)))
  }

  const filtered = useMemo(() => heroes.filter((hero) => { const own = skills.filter((skill) => hero.skillIds.includes(skill.id)); return `${hero.name}${own.map((skill) => skill.name + skill.description).join('')}`.includes(query.trim()) }), [query])
  const modal = poolModalOpen && <div className="pool-modal__backdrop" onClick={() => setPoolModalOpen(false)}><div className="pool-modal" onClick={(event) => event.stopPropagation()}><div className="pool-config__header"><div><strong>配置当前将池</strong><small>已选择 {poolHeroIds.length} / {heroes.length} 名武将</small></div><span><button onClick={() => updatePoolHeroes(heroes.map((hero) => hero.id))}>全选</button><button onClick={() => updatePoolHeroes([])}>全不选</button><button onClick={() => setPoolModalOpen(false)}>关闭</button></span></div><div className="pool-list">{heroes.map((hero) => <label key={hero.id} className="pool-item"><input type="checkbox" checked={poolHeroIds.includes(hero.id)} onChange={() => updatePoolHeroes(poolHeroIds.includes(hero.id) ? poolHeroIds.filter((id) => id !== hero.id) : [...poolHeroIds, hero.id])} /><span>{hero.name}</span><small>{skills.filter((skill) => hero.skillIds.includes(skill.id)).map((skill) => skill.name).join('、')}</small></label>)}</div></div></div>
  const openTool = (hero: Hero) => { setDrawHeroId(hero.id); setCandidates([]); setUsed([]); setPage('draw') }
  return <div className="app-shell"><header className="topbar"><button className="brand" onClick={() => setPage('home')}><span>一将成名</span><small>线下辅助</small></button><nav><button className={page === 'home' ? 'active' : ''} onClick={() => setPage('home')}>工具首页</button><button className={page === 'heroes' ? 'active' : ''} onClick={() => setPage('heroes')}>武将查询</button><button onClick={() => setPoolModalOpen(true)}>配置将池</button></nav></header><main>
    {page === 'home' && <section className="tool-home"><aside className="tool-sidebar"><span className="eyebrow">OFFLINE TOOLKIT</span><h1>一将成名</h1><p>选择一名武将，直接开始对应的线下技能辅助。</p><button className="button button--primary" onClick={() => setPoolModalOpen(true)}>配置当前将池</button><button className="button button--ghost" onClick={() => setPage('heroes')}>查询全部武将</button><div className="sidebar-meta">当前将池：{activePool?.name}<br />已选武将：{poolHeroIds.length} / {heroes.length}</div></aside><div className="tool-grid"><div className="section-heading"><div><span className="eyebrow">NINE HERO TOOLS</span><h2>选择技能工具</h2></div></div><div className="hero-grid">{toolHeroes.map((hero) => <button className="tool-card" key={hero.id} onClick={() => openTool(hero)}><span className="hero-faction">{hero.faction}</span><strong>{hero.name}</strong><span>{skills.find((skill) => hero.skillIds.includes(skill.id))?.name}</span><small>进入抽取工具 →</small></button>)}</div></div></section>}
    {page === 'heroes' && <section className="content-section"><div className="section-heading"><div><span className="eyebrow">HERO INDEX</span><h2>武将查询</h2></div><span className="count">{filtered.length} / {heroes.length}</span></div><div className="filters"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索武将或技能" /></div><div className="hero-grid">{filtered.map((hero) => <HeroCard key={hero.id} hero={hero} onOpen={() => setSelectedHero(hero)} />)}</div>{selectedHero && <div className="pool-modal__backdrop" onClick={() => setSelectedHero(null)}><div className="detail-card" onClick={(event) => event.stopPropagation()}><button className="back-button" onClick={() => setSelectedHero(null)}>关闭</button><h1>{selectedHero.name}</h1>{skills.filter((skill) => selectedHero.skillIds.includes(skill.id)).map((skill) => <div key={skill.id}><div className="skill-name">{skill.name}</div><p className="detail-description">{skill.description}</p><a href={skill.officialUrl} target="_blank" rel="noreferrer">查看官方资料 ↗</a></div>)}</div></div>}</section>}
    {page === 'draw' && <section className="content-section"><div className="section-heading"><div><span className="eyebrow">SKILL DRAW</span><h2>{drawHero?.name} · 技能工具</h2></div></div><div className="draw-panel"><div className="pool-switcher"><label>当前将池<select value={activePool?.id} onChange={(event) => selectPool(event.target.value)}>{pools.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button className="button button--ghost" onClick={() => setPoolModalOpen(true)}>配置将池 · {poolHeroIds.length}/{heroes.length}</button><button className="button button--ghost" onClick={createPool}>新建将池</button></div><div className="draw-controls">{drawHero?.name !== '许劭' && <label>目标武将<select value={targetHeroId} onChange={(event) => setTargetHeroId(event.target.value)}><option value="">请选择</option>{pool.map((hero) => <option key={hero.id} value={hero.id}>{hero.name} · {hero.faction}{hero.hp}</option>)}</select></label>}{drawHero?.name === '许劭' && <label>发动时机<select value={trigger} onChange={(event) => setTrigger(event.target.value as SkillTrigger)}><option value="play-phase">出牌阶段</option><option value="end-phase">结束阶段</option><option value="damaged">受到伤害后</option></select></label>}<button className="button button--primary" onClick={draw}>随机出现候选</button></div><div className="draw-notice">候选范围来自当前将池；点击候选记录本局已获得的技能。</div>{candidates.length > 0 && <div className="candidate-grid">{candidates.map((item) => <button className="candidate-card" key={`${item.heroId}-${item.skillName}`} onClick={() => { setUsed((items) => [...items, item.skillName]); setCandidates((items) => items.filter((candidateItem) => candidateItem.skillName !== item.skillName)) }}><strong>{item.heroName}</strong><span>{item.skillName}</span><small>{item.description}</small></button>)}</div>}{used.length > 0 && <div className="used-skills"><span>本局已获得：</span>{used.map((name) => <span className="tag" key={name}>{name}</span>)}<button onClick={() => setUsed([])}>清空记录</button></div>}</div></section>}
  </main>{modal}<footer><span>数据来源：三国杀官方武将网站</span><span>九名抽取技能武将</span></footer></div>
}
