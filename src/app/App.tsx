import { useMemo, useState } from 'react'
import { heroes, skills } from '../data/catalog'
import type { Hero, Page } from '../domain/hero/hero.types'
import { drawPingjian } from '../domain/skill/pingjian.rule'
import type { SkillCandidate, SkillTrigger } from '../domain/skill/skill.types'
import type { SkillPool } from '../domain/pool/pool.types'
import { loadActivePoolId, loadPools, saveActivePoolId, savePools } from '../stores/pool.storage'

const names = ['许劭', '张裕', '神华佗', '关宁', '管宁', '赵襄', '全惠解', '南华老仙']
const XUSHAO = '许劭'
const ZHANGYU = '张裕'
const SHEN_HUATUO = '神华佗'
const GUANNING = '关宁'
const GUAN_NING = '管宁'
const ZHAO_XIANG = '赵襄'
const QUAN_HUIJIE = '全惠解'
const femaleNames = new Set(['貂蝉', '大乔', '小乔', '孙尚香', '黄月英', '甘夫人', '甄姬', '郭女王', '张春华', '徐氏', '王异', '马云禄', '邹氏', '步练师', '孙鲁班', '孙鲁育', '安易', '花鬘', '赵襄', '全惠解'])

const toCandidate = (hero: Hero, skill: typeof skills[number]): SkillCandidate => ({ heroId: hero.id, heroName: hero.name, skillName: skill.name, description: skill.description, triggers: skill.triggers })

function HeroCard({ hero, onOpen }: { hero: Hero; onOpen: () => void }) { const [open, setOpen] = useState(false); const ownSkills = skills.filter((item) => hero.skillIds.includes(item.id)); return <><article className="hero-card" onClick={() => { setOpen(true); onOpen() }}><div className="hero-card__top"><span className="hero-faction">{hero.faction}</span><span>{hero.hp}体力</span></div><h3>{hero.name}</h3><div className="skill-name">{ownSkills[0]?.name}</div><p>{ownSkills[0]?.description}</p><span className="tag">{ownSkills[0]?.mechanismLabel}</span></article>{open && <div className="pool-modal__backdrop" onClick={() => setOpen(false)}><div className="detail-card" onClick={(event) => event.stopPropagation()}><button className="back-button" onClick={() => setOpen(false)}>关闭</button><div className="detail-heading"><span className="hero-faction hero-faction--large">{hero.faction}</span><div><span className="eyebrow">HERO DETAIL</span><h1>{hero.name}</h1></div></div>{ownSkills.map((skill) => <div key={skill.id}><div className="skill-name">{skill.name}</div><p className="detail-description">{skill.description}</p><a href={skill.officialUrl} target="_blank" rel="noreferrer">查看官方资料 ↗</a></div>)}</div></div>}</> }

function LegacyApp() {
  const [page, setPage] = useState<Page>('home')
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null)
  const [query, setQuery] = useState('')
  const [drawHeroId, setDrawHeroId] = useState('official-804')
  const [targetHeroId, setTargetHeroId] = useState('')
  const [targetSearch, setTargetSearch] = useState('')
  const [targetFaction, setTargetFaction] = useState('蜀')
  const [targetHp, setTargetHp] = useState('3')
  const [trigger, setTrigger] = useState<SkillTrigger>('play-phase')
  const [candidates, setCandidates] = useState<SkillCandidate[]>([])
  const [used, setUsed] = useState<string[]>([])
  const [poolModalOpen, setPoolModalOpen] = useState(false)
  const [pools, setPools] = useState<SkillPool[]>(() => loadPools(heroes.map((hero) => hero.id)))
  const [activePoolId, setActivePoolId] = useState(() => loadActivePoolId())
  const activePool = pools.find((pool) => pool.id === activePoolId) ?? pools[0]
  const poolHeroIds = activePool?.heroIds ?? []
  const toolHeroes = heroes.filter((hero) => names.includes(hero.name))
  const drawHero = heroes.find((hero) => hero.id === drawHeroId) ?? toolHeroes[0]
  const targetHero = heroes.find((hero) => hero.id === targetHeroId)
  const pool = heroes.filter((hero) => poolHeroIds.includes(hero.id) && hero.id !== drawHero?.id)
  const searchableTargets = pool.filter((hero) => hero.name.includes(targetSearch.trim()))

  const updatePools = (next: SkillPool[]) => { setPools(next); savePools(next) }
  const updatePoolHeroes = (ids: string[]) => updatePools(pools.map((item) => item.id === activePool?.id ? { ...item, heroIds: ids } : item))
  const selectPool = (id: string) => { setActivePoolId(id); saveActivePoolId(id); setCandidates([]); setUsed([]) }
  const createPool = () => { const name = window.prompt('请输入将池名称'); if (!name?.trim()) return; const id = `pool-${Date.now()}`; updatePools([...pools, { id, name: name.trim(), heroIds: heroes.map((hero) => hero.id) }]); selectPool(id) }

  const draw = () => {
    if (!drawHero) return
    let result = pool.flatMap((hero) => skills.filter((skill) => hero.skillIds.includes(skill.id)).map((skill) => toCandidate(hero, skill)))
    if (drawHero.name === XUSHAO) result = drawPingjian({ trigger, pool: result, usedSkillNames: used }).candidates
    if (drawHero.name === ZHANGYU) result = result.filter((item) => { const hero = pool.find((candidate) => candidate.id === item.heroId); return hero?.faction === targetFaction && hero?.hp === targetHp && !/限定技|觉醒技|主公技/.test(item.description) }).sort(() => Math.random() - .5).slice(0, 3)
    if (drawHero.name === SHEN_HUATUO) result = targetHero ? pool.filter((hero) => hero.name === targetHero.name).flatMap((hero) => skills.filter((skill) => hero.skillIds.includes(skill.id)).map((skill) => toCandidate(hero, skill))) : []
    if (drawHero.name === GUANNING) result = result.filter((item) => /^出牌阶段/.test(item.description)).sort(() => Math.random() - .5).slice(0, 1)
    if (drawHero.name === GUAN_NING) result = result.filter((item) => /[仁义礼智信]/.test(item.skillName)).sort(() => Math.random() - .5).slice(0, 1)
    if (drawHero.name === ZHAO_XIANG) result = result.filter((item) => pool.find((hero) => hero.id === item.heroId)?.faction === '蜀' && !/限定技|觉醒技|主公技/.test(item.description)).sort(() => Math.random() - .5).slice(0, 6)
    if (drawHero.name === QUAN_HUIJIE) result = result.filter((item) => { const hero = pool.find((candidate) => candidate.id === item.heroId); return hero?.faction === '吴' && femaleNames.has(hero.name) }).sort(() => Math.random() - .5).slice(0, 4)
    setCandidates(result.filter((item) => !used.includes(item.skillName)))
  }

  const filtered = useMemo(() => heroes.filter((hero) => { const own = skills.filter((skill) => hero.skillIds.includes(skill.id)); return `${hero.name}${own.map((skill) => skill.name + skill.description).join('')}`.includes(query.trim()) }), [query])
  const modal = poolModalOpen && <div className="pool-modal__backdrop" onClick={() => setPoolModalOpen(false)}><div className="pool-modal" onClick={(event) => event.stopPropagation()}><div className="pool-config__header"><div><strong>配置当前将池</strong><small>已选择 {poolHeroIds.length} / {heroes.length} 名武将</small></div><span><button onClick={() => updatePoolHeroes(heroes.map((hero) => hero.id))}>全选</button><button onClick={() => updatePoolHeroes([])}>全不选</button><button onClick={() => setPoolModalOpen(false)}>关闭</button></span></div><div className="pool-list">{heroes.map((hero) => <label key={hero.id} className="pool-item"><input type="checkbox" checked={poolHeroIds.includes(hero.id)} onChange={() => updatePoolHeroes(poolHeroIds.includes(hero.id) ? poolHeroIds.filter((id) => id !== hero.id) : [...poolHeroIds, hero.id])} /><span>{hero.name}</span><small>{skills.filter((skill) => hero.skillIds.includes(skill.id)).map((skill) => skill.name).join('、')}</small></label>)}</div></div></div>
  const openTool = (hero: Hero) => { setDrawHeroId(hero.id); setTargetHeroId(''); setTargetSearch(''); setCandidates([]); setUsed([]); setPage('draw') }
  const needsTargetHero = drawHero?.name === SHEN_HUATUO
  return <div className="app-shell"><header className="topbar"><button className="brand" onClick={() => setPage('home')}><span>一将成名</span><small>线下辅助</small></button><nav><button className={page === 'home' ? 'active' : ''} onClick={() => setPage('home')}>工具首页</button><button className={page === 'heroes' ? 'active' : ''} onClick={() => setPage('heroes')}>武将查询</button><button onClick={() => setPoolModalOpen(true)}>配置将池</button></nav></header><main>
    {page === 'home' && <section className="tool-home"><aside className="tool-sidebar"><span className="eyebrow">OFFLINE TOOLKIT</span><h1>一将成名</h1><p>选择一名武将，直接开始对应的线下技能辅助。</p><button className="button button--primary" onClick={() => setPoolModalOpen(true)}>配置当前将池</button><button className="button button--ghost" onClick={() => setPage('heroes')}>查询全部武将</button><div className="sidebar-meta">当前将池：{activePool?.name}<br />已选武将：{poolHeroIds.length} / {heroes.length}</div></aside><div className="tool-grid"><div className="section-heading"><div><span className="eyebrow">EIGHT HERO TOOLS</span><h2>选择技能工具</h2></div></div><div className="hero-grid">{toolHeroes.map((hero) => <button className="tool-card" key={hero.id} onClick={() => openTool(hero)}><span className="hero-faction">{hero.faction}</span><strong>{hero.name}</strong><span>{skills.find((skill) => hero.skillIds.includes(skill.id))?.name}</span><small>进入抽取工具 →</small></button>)}</div></div></section>}
    {page === 'heroes' && <section className="content-section"><div className="section-heading"><div><span className="eyebrow">HERO INDEX</span><h2>武将查询</h2></div><span className="count">{filtered.length} / {heroes.length}</span></div><div className="filters"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索武将或技能" /></div><div className="hero-grid">{filtered.map((hero) => <HeroCard key={hero.id} hero={hero} onOpen={() => setSelectedHero(hero)} />)}</div>{selectedHero && <div className="pool-modal__backdrop" onClick={() => setSelectedHero(null)}><div className="detail-card" onClick={(event) => event.stopPropagation()}><button className="back-button" onClick={() => setSelectedHero(null)}>关闭</button><h1>{selectedHero.name}</h1>{skills.filter((skill) => selectedHero.skillIds.includes(skill.id)).map((skill) => <div key={skill.id}><div className="skill-name">{skill.name}</div><p className="detail-description">{skill.description}</p><a href={skill.officialUrl} target="_blank" rel="noreferrer">查看官方资料 ↗</a></div>)}</div></div>}</section>}
    {page === 'draw' && <section className="content-section"><div className="section-heading"><div><span className="eyebrow">SKILL DRAW</span><h2>{drawHero?.name} · 技能工具</h2></div></div><div className="draw-panel"><div className="pool-switcher"><label>当前将池<select value={activePool?.id} onChange={(event) => selectPool(event.target.value)}>{pools.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button className="button button--ghost" onClick={() => setPoolModalOpen(true)}>配置将池 · {poolHeroIds.length}/{heroes.length}</button><button className="button button--ghost" onClick={createPool}>新建将池</button></div><div className="draw-controls">{drawHero?.name === ZHANGYU && <><label>目标势力<select value={targetFaction} onChange={(event) => setTargetFaction(event.target.value)}><option>魏</option><option>蜀</option><option>吴</option><option>群</option><option>神</option></select></label><label>初始体力<select value={targetHp} onChange={(event) => setTargetHp(event.target.value)}><option>3</option><option>4</option><option>5</option><option>6</option><option>7</option></select></label></>}{needsTargetHero && <label>搜索同名武将<input value={targetSearch} onChange={(event) => setTargetSearch(event.target.value)} placeholder="输入武将名" /><select value={targetHeroId} onChange={(event) => setTargetHeroId(event.target.value)}><option value="">请选择</option>{searchableTargets.map((hero) => <option key={hero.id} value={hero.id}>{hero.name} · {hero.faction}{hero.hp}</option>)}</select></label>}{drawHero?.name === XUSHAO && <label>发动时机<select value={trigger} onChange={(event) => setTrigger(event.target.value as SkillTrigger)}><option value="play-phase">出牌阶段</option><option value="end-phase">结束阶段</option><option value="damaged">受到伤害后</option></select></label>}<button className="button button--primary" onClick={draw}>随机出现候选</button></div><div className="draw-notice">关宁直接抽取一个出牌阶段技能；张裕按势力和初始体力匹配；神华佗搜索目标后抽取同名武将技能。</div>{candidates.length > 0 && <div className="candidate-grid">{candidates.map((item) => <button className="candidate-card" key={`${item.heroId}-${item.skillName}`} onClick={() => { setUsed((items) => [...items, item.skillName]); setCandidates((items) => items.filter((candidateItem) => candidateItem.skillName !== item.skillName)) }}><strong>{item.heroName}</strong><span>{item.skillName}</span><small>{item.description}</small></button>)}</div>}{used.length > 0 && <div className="used-skills"><span>本局已获得：</span>{used.map((name) => <span className="tag" key={name}>{name}</span>)}<button onClick={() => setUsed([])}>清空记录</button></div>}</div></section>}
  </main>{modal}<footer><span>数据来源：三国杀官方武将网站</span><span>八名抽取技能武将</span></footer></div>
}

export function App() {
  const [page, setPage] = useState<Page>('home')
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null)
  const [query, setQuery] = useState('')
  const [drawHeroId, setDrawHeroId] = useState('official-804')
  const [trigger, setTrigger] = useState<SkillTrigger>('play-phase')
  const [targetFaction, setTargetFaction] = useState('蜀')
  const [targetHp, setTargetHp] = useState('3')
  const [targetSearch, setTargetSearch] = useState('')
  const [targetHeroId, setTargetHeroId] = useState('')
  const [candidates, setCandidates] = useState<SkillCandidate[]>([])
  const [usedSkillNames, setUsedSkillNames] = useState<string[]>([])
  const [poolModalOpen, setPoolModalOpen] = useState(false)
  const [pools, setPools] = useState<SkillPool[]>(() => loadPools(heroes.map((hero) => hero.id)))
  const [activePoolId, setActivePoolId] = useState(() => loadActivePoolId())
  const [seatNames, setSeatNames] = useState(['1号位', '2号位', '3号位', '4号位'])
  const [activeSeat, setActiveSeat] = useState('1号位')
  const [seatSkills, setSeatSkills] = useState<Record<string, string[]>>({})
  const activePool = pools.find((pool) => pool.id === activePoolId) ?? pools[0]
  const poolHeroIds = activePool?.heroIds ?? []
  const drawHero = heroes.find((hero) => hero.id === drawHeroId) ?? heroes.find((hero) => hero.name === XUSHAO)
  const pool = heroes.filter((hero) => poolHeroIds.includes(hero.id) && hero.id !== drawHero?.id)
  const targetHero = heroes.find((hero) => hero.id === targetHeroId)
  const targetOptions = pool.filter((hero) => hero.name.includes(targetSearch.trim()))
  const toolHeroes = heroes.filter((hero) => names.includes(hero.name))
  const filteredHeroes = useMemo(() => heroes.filter((hero) => `${hero.name}${skills.filter((skill) => hero.skillIds.includes(skill.id)).map((skill) => skill.name + skill.description).join('')}`.includes(query.trim())), [query])

  const updatePools = (next: SkillPool[]) => { setPools(next); savePools(next) }
  const updatePoolHeroes = (ids: string[]) => updatePools(pools.map((poolItem) => poolItem.id === activePool?.id ? { ...poolItem, heroIds: ids } : poolItem))
  const selectPool = (id: string) => { setActivePoolId(id); saveActivePoolId(id); setCandidates([]) }
  const makeCandidate = (hero: Hero, skill: typeof skills[number]): SkillCandidate => ({ heroId: hero.id, heroName: hero.name, skillName: skill.name, description: skill.description, triggers: skill.triggers })
  const draw = () => {
    if (!drawHero) return
    let result = pool.flatMap((hero) => skills.filter((skill) => hero.skillIds.includes(skill.id)).map((skill) => makeCandidate(hero, skill)))
    if (drawHero.name === XUSHAO) result = drawPingjian({ trigger, pool: result, usedSkillNames }).candidates
    if (drawHero.name === ZHANGYU) result = result.filter((item) => { const hero = pool.find((candidate) => candidate.id === item.heroId); return hero?.faction === targetFaction && hero?.hp === targetHp && !/限定技|觉醒技|主公技/.test(item.description) }).sort(() => Math.random() - .5).slice(0, 3)
    if (drawHero.name === SHEN_HUATUO) result = targetHero ? pool.filter((hero) => hero.name === targetHero.name).flatMap((hero) => skills.filter((skill) => hero.skillIds.includes(skill.id)).map((skill) => makeCandidate(hero, skill))) : []
    if (drawHero.name === GUANNING) result = result.filter((item) => /^出牌阶段/.test(item.description)).sort(() => Math.random() - .5).slice(0, 1)
    if (drawHero.name === GUAN_NING) result = result.filter((item) => /[仁义礼智信]/.test(item.skillName)).sort(() => Math.random() - .5).slice(0, 1)
    if (drawHero.name === ZHAO_XIANG) result = result.filter((item) => pool.find((hero) => hero.id === item.heroId)?.faction === '蜀' && !/限定技|觉醒技|主公技/.test(item.description)).sort(() => Math.random() - .5).slice(0, 6)
    if (drawHero.name === QUAN_HUIJIE) result = result.filter((item) => { const hero = pool.find((candidate) => candidate.id === item.heroId); return hero?.faction === '吴' && femaleNames.has(hero.name) }).sort(() => Math.random() - .5).slice(0, 4)
    setCandidates(result.filter((item) => !usedSkillNames.includes(item.skillName)))
  }
  const choose = (item: SkillCandidate) => {
    if (drawHero?.name === GUAN_NING) { setSeatSkills((current) => ({ ...current, [activeSeat]: [...(current[activeSeat] ?? []), item.skillName] })); setCandidates([]); return }
    setUsedSkillNames((current) => [...current, item.skillName]); setCandidates((current) => current.filter((candidate) => candidate.skillName !== item.skillName))
  }
  const modal = poolModalOpen && <div className="pool-modal__backdrop" onClick={() => setPoolModalOpen(false)}><div className="pool-modal" onClick={(event) => event.stopPropagation()}><div className="pool-config__header"><strong>配置当前将池 · {poolHeroIds.length}/{heroes.length}</strong><span><button onClick={() => updatePoolHeroes(heroes.map((hero) => hero.id))}>全选</button><button onClick={() => updatePoolHeroes([])}>全不选</button><button onClick={() => setPoolModalOpen(false)}>关闭</button></span></div><div className="pool-list">{heroes.map((hero) => <label className="pool-item" key={hero.id}><input type="checkbox" checked={poolHeroIds.includes(hero.id)} onChange={() => updatePoolHeroes(poolHeroIds.includes(hero.id) ? poolHeroIds.filter((id) => id !== hero.id) : [...poolHeroIds, hero.id])} /><span>{hero.name}</span><small>{skills.filter((skill) => hero.skillIds.includes(skill.id)).map((skill) => skill.name).join('、')}</small></label>)}</div></div></div>
  return <div className="app-shell"><header className="topbar"><button className="brand" onClick={() => setPage('home')}><span>一将成名</span><small>线下辅助</small></button><nav><button onClick={() => setPage('home')}>工具首页</button><button onClick={() => setPage('heroes')}>武将查询</button><button onClick={() => setPoolModalOpen(true)}>配置将池</button></nav></header><main>
    {page === 'home' && <section className="tool-home"><aside className="tool-sidebar"><span className="eyebrow">OFFLINE TOOLKIT</span><h1>一将成名</h1><p>选择一名武将，开始对应的线下技能辅助。</p><button className="button button--primary" onClick={() => setPoolModalOpen(true)}>配置当前将池</button><button className="button button--ghost" onClick={() => setPage('heroes')}>查询全部武将</button><div className="sidebar-meta">当前将池：{activePool?.name}<br />已选武将：{poolHeroIds.length} / {heroes.length}</div></aside><div className="tool-grid"><div className="section-heading"><div><span className="eyebrow">EIGHT HERO TOOLS</span><h2>选择技能工具</h2></div></div><div className="hero-grid">{toolHeroes.map((hero) => <button className="tool-card" key={hero.id} onClick={() => { setDrawHeroId(hero.id); setPage('draw') }}><span className="hero-faction">{hero.faction}</span><strong>{hero.name}</strong><span>{skills.find((skill) => hero.skillIds.includes(skill.id))?.name}</span><small>进入工具 →</small></button>)}</div></div></section>}
    {page === 'heroes' && <section className="content-section"><div className="section-heading"><h2>武将查询</h2><span className="count">{filteredHeroes.length} / {heroes.length}</span></div><div className="filters"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索武将或技能" /></div><div className="hero-grid">{filteredHeroes.map((hero) => <HeroCard key={hero.id} hero={hero} onOpen={() => setPage('heroes')} />)}</div></section>}
    {page === 'draw' && <section className="content-section"><div className="section-heading"><h2>{drawHero?.name} · 技能工具</h2></div><div className="draw-panel"><div className="pool-switcher"><label>当前将池<select value={activePool?.id} onChange={(event) => selectPool(event.target.value)}>{pools.map((poolItem) => <option key={poolItem.id} value={poolItem.id}>{poolItem.name}</option>)}</select></label><button className="button button--ghost" onClick={() => setPoolModalOpen(true)}>配置将池 · {poolHeroIds.length}/{heroes.length}</button></div><div className="draw-controls">{drawHero?.name === XUSHAO && <label>发动时机<select value={trigger} onChange={(event) => setTrigger(event.target.value as SkillTrigger)}><option value="play-phase">出牌阶段</option><option value="end-phase">结束阶段</option><option value="damaged">受到伤害后</option></select></label>}{drawHero?.name === ZHANGYU && <><label>目标势力<select value={targetFaction} onChange={(event) => setTargetFaction(event.target.value)}><option>魏</option><option>蜀</option><option>吴</option><option>群</option><option>神</option></select></label><label>初始体力<select value={targetHp} onChange={(event) => setTargetHp(event.target.value)}><option>3</option><option>4</option><option>5</option><option>6</option><option>7</option></select></label></>}{drawHero?.name === SHEN_HUATUO && <label>搜索目标武将<input value={targetSearch} onChange={(event) => setTargetSearch(event.target.value)} placeholder="输入名称缩小范围" /><select value={targetHeroId} onChange={(event) => setTargetHeroId(event.target.value)}><option value="">请选择</option>{targetOptions.map((hero) => <option key={hero.id} value={hero.id}>{hero.name} · {hero.faction}{hero.hp}</option>)}</select></label>}{drawHero?.name === GUAN_NING && <label>技能归属座位<select value={activeSeat} onChange={(event) => setActiveSeat(event.target.value)}>{seatNames.map((seat) => <option key={seat}>{seat}</option>)}</select></label>}<button className="button button--primary" onClick={draw}>随机出现候选</button></div>{drawHero?.name === GUAN_NING && <div className="draw-notice">管宁本次抽到的技能将交给所选座位。座位名称：{seatNames.map((seat, index) => <input key={seat} value={seat} onChange={(event) => setSeatNames((current) => current.map((name, i) => i === index ? event.target.value : name))} />)}</div>}{candidates.length > 0 && <div className="candidate-grid">{candidates.map((item) => <button className="candidate-card" key={`${item.heroId}-${item.skillName}`} onClick={() => choose(item)}><strong>{item.heroName}</strong><span>{item.skillName}</span><small>{item.description}</small></button>)}</div>}{drawHero?.name === GUAN_NING && <div className="used-skills">{seatNames.map((seat) => <span key={seat}><strong>{seat}</strong>：{(seatSkills[seat] ?? []).join('、') || '暂无技能'}</span>)}</div>}{drawHero?.name === XUSHAO && usedSkillNames.length > 0 && <div className="used-skills"><span>许劭本局已发动：</span>{usedSkillNames.map((name) => <span className="tag" key={name}>{name}</span>)}<button onClick={() => setUsedSkillNames([])}>重置本局</button></div>}</div></section>}
  </main>{modal}<footer><span>数据来源：三国杀官方武将网站</span><span>八名抽取技能武将</span></footer></div>
}
