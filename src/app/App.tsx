import { useMemo, useState } from 'react'
import { heroes } from '../data/heroes'
import type { Hero, Page } from '../domain/hero/hero.types'
import { drawPingjian } from '../domain/skill/pingjian.rule'
import type { SkillCandidate, SkillTrigger } from '../domain/skill/skill.types'

const mechanismLabels = ['全部机制', '随机候选武将', '随机候选技能', '目标武将技能', '条件技能池']

function HeroCard({ hero, onOpen }: { hero: Hero; onOpen: () => void }) {
  return <article className="hero-card" onClick={onOpen}>
    <div className="hero-card__top"><span className="hero-faction">{hero.faction}</span><span>{hero.hp}体力</span></div>
    <h3>{hero.name}</h3>
    <div className="skill-name">{hero.skillName}</div>
    <p>{hero.skillDescription}</p>
    <span className="tag">{hero.mechanismLabel}</span>
  </article>
}

export function App() {
  const [page, setPage] = useState<Page>('home')
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null)
  const [query, setQuery] = useState('')
  const [mechanism, setMechanism] = useState('全部机制')
  const [drawHeroId, setDrawHeroId] = useState('xushou')
  const [trigger, setTrigger] = useState<SkillTrigger>('play-phase')
  const [drawCandidates, setDrawCandidates] = useState<SkillCandidate[]>([])
  const [usedSkillNames, setUsedSkillNames] = useState<string[]>([])
  const [poolHeroIds, setPoolHeroIds] = useState<string[]>(() => heroes.map((hero) => hero.id))

  const filteredHeroes = useMemo(() => heroes.filter((hero) => {
    const matchesQuery = `${hero.name}${hero.skillName}${hero.skillDescription}`.includes(query.trim())
    const matchesMechanism = mechanism === '全部机制' || hero.mechanismLabel === mechanism
    return matchesQuery && matchesMechanism
  }), [query, mechanism])

  const openHero = (hero: Hero) => { setSelectedHero(hero); setPage('heroes') }

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => { setPage('home'); setSelectedHero(null) }}><span>一将成名</span><small>线下辅助</small></button>
      <nav><button className={page === 'home' ? 'active' : ''} onClick={() => setPage('home')}>首页</button><button className={page === 'heroes' ? 'active' : ''} onClick={() => setPage('heroes')}>武将查询</button><button className={page === 'draw' ? 'active' : ''} onClick={() => setPage('draw')}>技能抽取</button></nav>
    </header>

    <main>
      {page === 'home' && <section className="hero-banner">
        <div><span className="eyebrow">SAN GUO SHA · OFFLINE TOOL</span><h1>把复杂技能，<br /><em>留在牌桌之外。</em></h1><p>专为《一将成名》线下游玩设计的特殊技能查询与抽取工具。</p><div className="actions"><button className="button button--primary" onClick={() => setPage('heroes')}>开始查询</button><button className="button button--ghost" onClick={() => setPage('draw')}>进入技能抽取</button></div></div>
        <div className="seal">将<br />成<br />名</div>
      </section>}

      {page === 'heroes' && <section className="content-section">
        {selectedHero ? <div className="detail-view"><button className="back-button" onClick={() => setSelectedHero(null)}>← 返回武将列表</button><div className="detail-card"><div className="detail-heading"><span className="hero-faction hero-faction--large">{selectedHero.faction}</span><div><span className="eyebrow">SPECIAL HERO</span><h1>{selectedHero.name}</h1><div className="skill-name">{selectedHero.skillName}</div></div></div><p className="detail-description">{selectedHero.skillDescription}</p><div className="detail-meta"><span className="tag">{selectedHero.mechanismLabel}</span><a href={selectedHero.officialUrl} target="_blank" rel="noreferrer">查看官方资料 ↗</a></div></div></div> : <><div className="section-heading"><div><span className="eyebrow">HERO INDEX</span><h2>特殊技能武将</h2></div><span className="count">{filteredHeroes.length} / {heroes.length}</span></div><div className="filters"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索武将或技能" />{mechanismLabels.map((label) => <button key={label} className={mechanism === label ? 'selected' : ''} onClick={() => setMechanism(label)}>{label}</button>)}</div><div className="hero-grid">{filteredHeroes.map((hero) => <HeroCard key={hero.id} hero={hero} onOpen={() => openHero(hero)} />)}</div></>}
      </section>}

      {page === 'draw' && <section className="content-section"><div className="section-heading"><div><span className="eyebrow">SKILL DRAW · FIRST RULE</span><h2>技能抽取</h2></div></div><div className="draw-panel"><div className="draw-controls"><label>选择武将<select value={drawHeroId} onChange={(event) => setDrawHeroId(event.target.value)}>{heroes.map((hero) => <option key={hero.id} value={hero.id}>{hero.name} · {hero.skillName}</option>)}</select></label><label>发动时机<select value={trigger} onChange={(event) => setTrigger(event.target.value as SkillTrigger)}><option value="play-phase">出牌阶段</option><option value="end-phase">结束阶段</option><option value="damaged">受到伤害后</option></select></label><button className="button button--primary" onClick={() => { if (drawHeroId !== 'xushou') { setDrawCandidates([]); return }; const pool = heroes.filter((hero) => poolHeroIds.includes(hero.id) && hero.id !== 'xushou').map((hero) => ({ heroId: hero.id, heroName: hero.name, skillName: hero.skillName, description: hero.skillDescription })); const result = drawPingjian({ trigger, pool, usedSkillNames }); setDrawCandidates(result.candidates) }}>随机出现候选</button></div><div className="draw-notice">当前已接入：许劭【评荐】规则。默认使用当前已录入的全将池，也可以在下方取消不参与本局的武将。</div><div className="pool-config"><div className="pool-config__header"><strong>本局技能池 · {poolHeroIds.length}/{heroes.length}</strong><span><button onClick={() => setPoolHeroIds(heroes.map((hero) => hero.id))}>全选</button><button onClick={() => setPoolHeroIds([])}>全不选</button></span></div><div className="pool-list">{heroes.map((hero) => <label key={hero.id} className="pool-item"><input type="checkbox" checked={poolHeroIds.includes(hero.id)} onChange={() => setPoolHeroIds((current) => current.includes(hero.id) ? current.filter((id) => id !== hero.id) : [...current, hero.id])} /><span>{hero.name}</span><small>{hero.skillName}</small></label>)}</div></div>{drawHeroId === 'xushou' && drawCandidates.length > 0 && <div className="candidate-grid">{drawCandidates.map((candidate) => <button className="candidate-card" key={candidate.skillName} onClick={() => setUsedSkillNames((current) => [...current, candidate.skillName])}><strong>{candidate.heroName}</strong><span>{candidate.skillName}</span><small>{candidate.description}</small></button>)}</div>}{drawHeroId === 'xushou' && drawCandidates.length === 0 && <div className="empty-state empty-state--compact"><div className="empty-state__mark">评</div><h3>等待抽取</h3><p>选择本局将池后，点击“随机出现候选”。</p></div>}{usedSkillNames.length > 0 && <div className="used-skills"><span>本局已发动：</span>{usedSkillNames.map((name) => <span className="tag" key={name}>{name}</span>)}<button onClick={() => setUsedSkillNames([])}>清空记录</button></div>}</div></section>}
    </main>
    <footer><span>数据来源：三国杀官方武将网站</span><span>第一版 · 特殊技能工具</span></footer>
  </div>
}
