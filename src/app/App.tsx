import { useMemo, useState } from 'react'
import { heroes, skills } from '../data/catalog'
import type { Hero, Page } from '../domain/hero/hero.types'
import { drawPingjian } from '../domain/skill/pingjian.rule'
import type { SkillCandidate, SkillTrigger } from '../domain/skill/skill.types'
import type { SkillPool } from '../domain/pool/pool.types'
import { loadActivePoolId, loadPools, saveActivePoolId, savePools } from '../stores/pool.storage'

const extractors = ['许劭', '张裕', '神华佗', '关宁', '管宁', '赵襄', '全惠解', '南华老仙', '花鬘']
const mechanisms = ['全部机制', '随机候选武将', '随机候选技能', '目标武将技能', '条件技能池', '普通技能']

const toCandidate = (hero: Hero, skill: typeof skills[number]): SkillCandidate => ({ heroId: hero.id, heroName: hero.name, skillName: skill.name, description: skill.description })

function HeroCard({ hero, onOpen }: { hero: Hero; onOpen: () => void }) {
  const skill = skills.find((item) => hero.skillIds.includes(item.id))
  return <article className="hero-card" onClick={onOpen}><div className="hero-card__top"><span className="hero-faction">{hero.faction}</span><span>{hero.hp}体力</span></div><h3>{hero.name}</h3><div className="skill-name">{skill?.name}</div><p>{skill?.description}</p><span className="tag">{skill?.mechanismLabel}</span></article>
}

export function App() {
  const [page, setPage] = useState<Page>('home')
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null)
  const [query, setQuery] = useState('')
  const [mechanism, setMechanism] = useState('全部机制')
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
  const drawHero = heroes.find((hero) => hero.id === drawHeroId) ?? heroes.find((hero) => extractors.includes(hero.name))
  const targetHero = heroes.find((hero) => hero.id === targetHeroId)
  const drawHeroes = heroes.filter((hero) => extractors.includes(hero.name))

  const updatePools = (next: SkillPool[]) => { setPools(next); savePools(next) }
  const updatePoolHeroes = (ids: string[]) => updatePools(pools.map((pool) => pool.id === activePool?.id ? { ...pool, heroIds: ids } : pool))
  const selectPool = (id: string) => { setActivePoolId(id); saveActivePoolId(id); setCandidates([]); setUsed([]) }
  const createPool = () => { const name = window.prompt('请输入将池名称'); if (!name?.trim()) return; const id = `pool-${Date.now()}`; updatePools([...pools, { id, name: name.trim(), heroIds: heroes.map((hero) => hero.id) }]); selectPool(id) }
  const pool = heroes.filter((hero) => poolHeroIds.includes(hero.id) && hero.id !== drawHero?.id)

  const draw = () => {
    if (!drawHero) return
    let result = pool.flatMap((hero) => skills.filter((skill) => hero.skillIds.includes(skill.id)).map((skill) => toCandidate(hero, skill)))
    if (drawHero.name === '许劭') result = drawPingjian({ trigger, pool: result, usedSkillNames: used }).candidates
    if (drawHero.name === '张裕') result = result.filter((item) => { const hero = pool.find((candidate) => candidate.id === item.heroId); return hero?.faction === targetHero?.faction && hero?.hp === targetHero?.hp && !/限定技|觉醒技|主公技/.test(item.description) }).sort(() => Math.random() - 0.5).slice(0, 3)
    if (drawHero.name === '神华佗') result = targetHero ? pool.filter((hero) => hero.name === targetHero.name).flatMap((hero) => skills.filter((skill) => hero.skillIds.includes(skill.id)).map((skill) => toCandidate(hero, skill))) : []
    if (drawHero.name === '关宁' || drawHero.name === '花鬘') result = targetHero ? skills.filter((skill) => targetHero.skillIds.includes(skill.id)).map((skill) => toCandidate(targetHero, skill)) : []
    if (drawHero.name === '管宁') result = result.filter((item) => /仁义礼智信/.test(item.description))
    if (drawHero.name === '赵襄') result = result.filter((item) => pool.find((hero) => hero.id === item.heroId)?.faction === '蜀' && !/限定技|觉醒技|主公技/.test(item.description)).sort(() => Math.random() - 0.5).slice(0, 6)
    if (drawHero.name === '全惠解') result = result.filter((item) => pool.find((hero) => hero.id === item.heroId)?.faction === '吴').sort(() => Math.random() - 0.5).slice(0, 4)
    setCandidates(result.filter((item) => !used.includes(item.skillName)))
  }

  const filtered = useMemo(() => heroes.filter((hero) => { const ownSkills = skills.filter((skill) => hero.skillIds.includes(skill.id)); return `${hero.name}${ownSkills.map((skill) => `${skill.name}${skill.description}`).join('')}`.includes(query.trim()) && (mechanism === '全部机制' || ownSkills.some((skill) => skill.mechanismLabel === mechanism)) }), [query, mechanism])
  const config = <div className="pool-modal__backdrop" onClick={() => setPoolModalOpen(false)}><div className="pool-modal" onClick={(event) => event.stopPropagation()}><div className="pool-config__header"><div><strong>配置当前将池</strong><small>已选择 {poolHeroIds.length} / {heroes.length} 名武将</small></div><span><button onClick={() => updatePoolHeroes(heroes.map((hero) => hero.id))}>全选</button><button onClick={() => updatePoolHeroes([])}>全不选</button><button onClick={() => setPoolModalOpen(false)}>关闭</button></span></div><div className="pool-list">{heroes.map((hero) => <label key={hero.id} className="pool-item"><input type="checkbox" checked={poolHeroIds.includes(hero.id)} onChange={() => updatePoolHeroes(poolHeroIds.includes(hero.id) ? poolHeroIds.filter((id) => id !== hero.id) : [...poolHeroIds, hero.id])} /><span>{hero.name}</span><small>{skills.filter((skill) => hero.skillIds.includes(skill.id)).map((skill) => skill.name).join('、')}</small></label>)}</div></div></div>

  return <div className="app-shell"><header className="topbar"><button className="brand" onClick={() => { setPage('home'); setSelectedHero(null) }}><span>一将成名</span><small>线下辅助</small></button><nav><button className={page === 'home' ? 'active' : ''} onClick={() => setPage('home')}>首页</button><button className={page === 'heroes' ? 'active' : ''} onClick={() => setPage('heroes')}>武将查询</button><button className={page === 'draw' ? 'active' : ''} onClick={() => setPage('draw')}>技能抽取</button></nav></header><main>
    {page === 'home' && <section className="hero-banner"><div><span className="eyebrow">SAN GUO SHA · OFFLINE TOOL</span><h1>把复杂技能，<br /><em>留在牌桌之外。</em></h1><p>专为《一将成名》线下游玩设计的特殊技能查询与抽取工具。</p><div className="actions"><button className="button button--primary" onClick={() => setPage('heroes')}>开始查询</button><button className="button button--ghost" onClick={() => setPage('draw')}>进入技能抽取</button></div></div><div className="seal">将<br />成<br />名</div></section>}
    {page === 'heroes' && <section className="content-section">{selectedHero ? <div className="detail-view"><button className="back-button" onClick={() => setSelectedHero(null)}>← 返回武将列表</button><div className="detail-card"><div className="detail-heading"><span className="hero-faction hero-faction--large">{selectedHero.faction}</span><div><span className="eyebrow">SPECIAL HERO</span><h1>{selectedHero.name}</h1>{skills.filter((skill) => selectedHero.skillIds.includes(skill.id)).map((skill) => <div className="skill-name" key={skill.id}>{skill.name}</div>)}</div></div>{skills.filter((skill) => selectedHero.skillIds.includes(skill.id)).map((skill) => <div key={skill.id}><p className="detail-description">{skill.description}</p><div className="detail-meta"><span className="tag">{skill.mechanismLabel}</span><a href={skill.officialUrl} target="_blank" rel="noreferrer">查看官方资料 ↗</a></div></div>)}</div></div> : <><div className="section-heading"><div><span className="eyebrow">HERO INDEX</span><h2>武将查询</h2></div><span className="count">{filtered.length} / {heroes.length}</span></div><div className="filters"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索武将或技能" />{mechanisms.map((label) => <button key={label} className={mechanism === label ? 'selected' : ''} onClick={() => setMechanism(label)}>{label}</button>)}</div><div className="hero-grid">{filtered.map((hero) => <HeroCard key={hero.id} hero={hero} onOpen={() => setSelectedHero(hero)} />)}</div></>}</section>}
    {page === 'draw' && <section className="content-section"><div className="section-heading"><div><span className="eyebrow">SKILL DRAW · NINE HEROES</span><h2>技能抽取</h2></div></div><div className="draw-panel"><div className="pool-switcher"><label>当前将池<select value={activePool?.id} onChange={(event) => selectPool(event.target.value)}>{pools.map((pool) => <option key={pool.id} value={pool.id}>{pool.name}</option>)}</select></label><button className="button button--ghost" onClick={() => setPoolModalOpen(true)}>配置将池 · {poolHeroIds.length}/{heroes.length}</button><button className="button button--ghost" onClick={createPool}>新建将池</button></div><div className="draw-controls"><label>抽取武将<select value={drawHero?.id} onChange={(event) => { setDrawHeroId(event.target.value); setCandidates([]); setUsed([]) }}>{drawHeroes.map((hero) => <option key={hero.id} value={hero.id}>{hero.name} · {skills.find((skill) => hero.skillIds.includes(skill.id))?.name}</option>)}</select></label>{drawHero?.name !== '许劭' && <label>目标武将<select value={targetHeroId} onChange={(event) => setTargetHeroId(event.target.value)}><option value="">请选择</option>{pool.map((hero) => <option key={hero.id} value={hero.id}>{hero.name} · {hero.faction}{hero.hp}</option>)}</select></label>}{drawHero?.name === '许劭' && <label>发动时机<select value={trigger} onChange={(event) => setTrigger(event.target.value as SkillTrigger)}><option value="play-phase">出牌阶段</option><option value="end-phase">结束阶段</option><option value="damaged">受到伤害后</option></select></label>}<button className="button button--primary" onClick={draw}>随机出现候选</button></div><div className="draw-notice">当前规则：{drawHero?.name}。将池配置已移至“配置将池”弹窗。</div>{candidates.length > 0 && <div className="candidate-grid">{candidates.map((candidate) => <button className="candidate-card" key={`${candidate.heroId}-${candidate.skillName}`} onClick={() => { setUsed((current) => [...current, candidate.skillName]); setCandidates((current) => current.filter((item) => item.skillName !== candidate.skillName)) }}><strong>{candidate.heroName}</strong><span>{candidate.skillName}</span><small>{candidate.description}</small></button>)}</div>}{candidates.length === 0 && <div className="empty-state empty-state--compact"><div className="empty-state__mark">抽</div><h3>等待抽取</h3><p>选择武将后点击“随机出现候选”。</p></div>}{used.length > 0 && <div className="used-skills"><span>本局已获得：</span>{used.map((name) => <span className="tag" key={name}>{name}</span>)}<button onClick={() => setUsed([])}>清空记录</button></div>}</div></section>}
  </main>{page === 'draw' && poolModalOpen && config}<footer><span>数据来源：三国杀官方武将网站</span><span>九名抽取技能武将</span></footer></div>
}
