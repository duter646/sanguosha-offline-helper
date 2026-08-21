import { useEffect, useMemo, useRef, useState } from 'react'
import { heroes, skills } from '../data/catalog'
import type { Hero, Page } from '../domain/hero/hero.types'
import { drawPingjian } from '../domain/skill/pingjian.rule'
import type { SkillCandidate, SkillTrigger } from '../domain/skill/skill.types'
import type { SkillPool } from '../domain/pool/pool.types'
import { loadActivePoolId, loadPools, saveActivePoolId, savePools } from '../stores/pool.storage'

const names = ['许劭', '张裕', '神华佗', '关宁', '管宁', '赵襄', '全惠解', '南华老仙', '左慈', '神曹丕', '徐荣', '曹华', '李傕', '杨彪', '谋曹爽', '武关羽', '乐曹植', '神典韦', '神张角', '赵嫣', '乐蔡邕']
const XUSHAO = '许劭'
const NAN_HUA = '\u5357\u534e\u8001\u4ed9'
const HERO_PAGE_SIZE = 24
const POOL_PAGE_SIZE = 30
const poolIndependentNames = new Set(['徐荣', '曹华', '李傕', '杨彪', '谋曹爽', '武关羽', '乐曹植', '神张角', '赵嫣', '乐蔡邕'])
const ZHANGYU = '张裕'
const SHEN_HUATUO = '神华佗'
const GUANNING = '关宁'
const GUAN_NING = '管宁'
const ZHAO_XIANG = '赵襄'
const QUAN_HUIJIE = '全惠解'
const ZUOCI = '左慈'
const SHEN_CAOPI = '神曹丕'
const XURONG = '徐荣'
const CAOHUA = '曹华'
const LIJUE = '李傕'
const YANGBIAO = '杨彪'
const MOU_CAO_SHUANG = '谋曹爽'
const WU_GUAN_YU = '武关羽'
const LE_CAO_ZHI = '乐曹植'
const SHEN_DIANWEI = '神典韦'
const SHEN_ZHANGJIAO = '神张角'
type DeckCard = { point: number; name: string; suit?: '♥' | '♦' | '♠' | '♣' }

const shenZhangJiaoCards: DeckCard[] = [
  [1, '无懈可击', '桃园结义', '万箭齐发', '朱雀羽扇', '诸葛连弩', '决斗', '古锭刀', '闪电', '决斗', '白银狮子', '诸葛连弩', '决斗'],
  [2, '火攻', '闪', '闪', '桃', '闪', '闪', '藤甲', '八卦阵', '雌雄双股剑', '寒冰剑', '藤甲', '八卦阵', '仁王盾'],
  [3, '火攻', '桃', '五谷丰登', '火杀', '闪', '顺手牵羊', '酒', '过河拆桥', '顺手牵羊', '酒', '杀', '杀'],
  [4, '火杀', '桃', '五谷丰登', '火杀', '闪', '顺手牵羊', '雷杀', '过河拆桥', '顺手牵羊', '兵粮寸断', '过河拆桥', '杀'],
  [5, '桃', '麒麟弓', '赤兔-1', '火杀', '闪', '贯石斧', '雷杀', '青龙偃月刀', '绝影+1', '雷杀', '的卢+1', '杀'],
  [6, '桃', '桃', '乐不思蜀', '闪', '闪', '杀', '雷杀', '乐不思蜀', '青釭剑', '雷杀', '乐不思蜀', '杀'],
  [7, '火杀', '桃', '无中生有', '闪', '闪', '杀', '雷杀', '南蛮入侵', '杀', '雷杀', '南蛮入侵', '杀'],
  [8, '闪', '桃', '无中生有', '闪', '闪', '杀', '雷杀', '杀', '杀', '雷杀', '杀', '杀'],
  [9, '闪', '桃', '无中生有', '闪', '酒', '闪', '酒', '杀', '杀', '酒', '杀', '杀'],
  [10, '火杀', '杀', '杀', '闪', '闪', '杀', '兵粮寸断', '杀', '杀', '铁索连环', '杀', '杀'],
  [11, '闪', '杀', '无中生有', '闪', '闪', '闪', '铁索连环', '无懈可击', '顺手牵羊', '铁索连环', '杀', '杀'],
  [12, '闪', '桃', '过河拆桥', '闪电', '火攻', '桃', '无懈可击', '方天画戟', '铁索连环', '铁索连环', '借刀杀人', '无懈可击'],
  [13, '无懈可击', '爪黄飞电+1', '闪', '闪', '骅骝+1', '杀', '无懈可击', '大宛-1', '南蛮入侵', '铁索连环', '借刀杀人', '无懈可击'],
].flatMap<DeckCard>(([point, ...names]) => names.map((name) => ({ point: point as number, name: name as string }))).concat({ point: 5, suit: '♦', name: '木牛流马' })
const pickCardsWithPointTotal = (cards: DeckCard[], total: number) => {
  const shuffled = [...cards].sort(() => Math.random() - .5)
  const maxCount = Math.min(shuffled.length, total)
  const states: Array<Array<number[] | undefined>> = Array.from({ length: total + 1 }, () => Array(maxCount + 1))
  states[0][0] = []
  shuffled.forEach((card, index) => {
    for (let point = total; point >= card.point; point -= 1) {
      for (let count = maxCount; count >= 1; count -= 1) {
        const previous = states[point - card.point][count - 1]
        if (previous && !states[point][count]) states[point][count] = [...previous, index]
      }
    }
  })
  const possibleCounts = states[total].map((state, count) => state ? count : -1).filter((count) => count > 0)
  const count = possibleCounts[Math.floor(Math.random() * possibleCounts.length)]
  return count ? states[total][count]?.map((index) => shuffled[index]) ?? [] : []
}
const ZHAO_YAN = '赵嫣'
const LE_CAIYONG = '乐蔡邕'
const getCardNameLength = (name: string) => /^(?:火|雷)杀$/.test(name) ? 1 : name.length
const TOOL_USAGE_STORAGE_KEY = 'sanguosha-tool-usage'
const defaultToolOrder = [XUSHAO, GUANNING, GUAN_NING, MOU_CAO_SHUANG, LIJUE, ZHAO_YAN, ZHAO_XIANG]
type CaoHuaMode = '阳' | '阴'
const caoHuaOptions: Record<CaoHuaMode, string[]> = {
  阳: ['回复X点体力', '摸X张牌', '复原武将牌', '随机执行一个已移除的阳选项'],
  阴: ['受到X点伤害', '弃X张牌', '翻面并横置', '随机执行一个已移除的阴选项'],
}
const nonEquipmentNames = ['杀', '闪', '桃', '酒', '过河拆桥', '顺手牵羊', '无中生有', '无懈可击', '决斗', '南蛮入侵', '万箭齐发', '桃园结义', '五谷丰登', '借刀杀人', '乐不思蜀', '兵粮寸断', '火攻', '铁索连环']
const femaleNames = new Set(['貂蝉', '大乔', '小乔', '孙尚香', '黄月英', '甘夫人', '甄姬', '郭女王', '张春华', '徐氏', '王异', '马云禄', '邹氏', '步练师', '孙鲁班', '孙鲁育', '安易', '花鬘', '赵襄', '全惠解', '吴国太', '潘淑', '芮姬', '孙寒华', '孙翎鸾', '孙茹', '滕芳兰', '滕公主', '周妃', '陆郁生', '陆文漪', '徐馨', '袁姬', '张嫙', '张媱', '朱佩兰', '谢灵毓', '乐大乔', '乐小乔', '乐周妃', '威孙尚香', '星孙尚香', '赵嫣'])

const toCandidate = (hero: Hero, skill: typeof skills[number]): SkillCandidate => ({ heroId: hero.id, heroName: hero.name, skillName: skill.name, description: skill.description, triggers: skill.triggers })

function HeroCard({ hero, onOpen }: { hero: Hero; onOpen: () => void }) { const [open, setOpen] = useState(false); const ownSkills = skills.filter((item) => hero.skillIds.includes(item.id)); return <><article className="hero-card" onClick={() => { setOpen(true); onOpen() }}><div className="hero-card__top"><span className="hero-faction">{hero.faction}</span><span>{hero.hp}体力</span></div><h3>{hero.name}</h3><div className="skill-name">{ownSkills.map((skill) => skill.name).join("、")}</div></article>{open && <div className="pool-modal__backdrop" onClick={() => setOpen(false)}><div className="detail-card" onClick={(event) => event.stopPropagation()}><button className="back-button" onClick={() => setOpen(false)}>关闭</button><div className="detail-heading"><span className="hero-faction hero-faction--large">{hero.faction}</span><div><span className="eyebrow">HERO DETAIL</span><h1>{hero.name}</h1></div></div>{ownSkills.map((skill) => <div key={skill.id}><div className="skill-name">{skill.name}</div><p className="detail-description">{skill.description}</p><a href={skill.officialUrl} target="_blank" rel="noreferrer">查看官方资料 ↗</a></div>)}</div></div>}</> }

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
    setCandidates([])
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
  const skipHistory = useRef(false)
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null)
  const [query, setQuery] = useState('')
  const [heroPage, setHeroPage] = useState(1)
  const [poolPage, setPoolPage] = useState(1)
  const [drawHeroId, setDrawHeroId] = useState('official-804')
  const [trigger, setTrigger] = useState<SkillTrigger>('play-phase')
  const [targetFaction, setTargetFaction] = useState('蜀')
  const [targetHp, setTargetHp] = useState('3')
  const [targetSearch, setTargetSearch] = useState('')
  const [targetHeroId, setTargetHeroId] = useState('')
  const [caoHuaMode, setCaoHuaMode] = useState<CaoHuaMode>('阳')
  const [caoHuaRemoved, setCaoHuaRemoved] = useState<Record<CaoHuaMode, string[]>>({ 阳: [], 阴: [] })
  const [caiYongLength, setCaiYongLength] = useState('2')
  const [quanHuijieSelected, setQuanHuijieSelected] = useState<string[]>([])
  const [zhaoXiangAliveCount, setZhaoXiangAliveCount] = useState('4')
  const [zhaoXiangSelected, setZhaoXiangSelected] = useState<string[]>([])
  const [toolUsage, setToolUsage] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(TOOL_USAGE_STORAGE_KEY) ?? '{}') as Record<string, number>
    } catch {
      return {}
    }
  })
  const [candidates, setCandidates] = useState<SkillCandidate[]>([])
  const [usedSkillNames, setUsedSkillNames] = useState<string[]>([])
  const [mouCaoShuangDeleted, setMouCaoShuangDeleted] = useState<string[]>([])
  const [selectedGeneralIds, setSelectedGeneralIds] = useState<string[]>([])
  const [poolModalOpen, setPoolModalOpen] = useState(false)
  const [poolQuery, setPoolQuery] = useState('')
  const [poolNameDraft, setPoolNameDraft] = useState('')
  const [poolDeletePending, setPoolDeletePending] = useState(false)
  const [poolManagerMessage, setPoolManagerMessage] = useState('')
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
  const selectedShenDianweiGenerals = selectedGeneralIds.map((id) => pool.find((hero) => hero.id === id) ?? null)
  const selectedDianweiCount = selectedGeneralIds.filter(Boolean).length
  const caoShuangOptions = ['令一名角色弃牌', '摸牌', '重铸牌', '弃牌']
  const toolHeroes = useMemo(() => heroes.filter((hero) => names.includes(hero.name)).sort((left, right) => {
    const usageDifference = (toolUsage[right.id] ?? 0) - (toolUsage[left.id] ?? 0)
    if (usageDifference !== 0) return usageDifference
    const leftDefaultIndex = defaultToolOrder.indexOf(left.name)
    const rightDefaultIndex = defaultToolOrder.indexOf(right.name)
    if (leftDefaultIndex !== -1 || rightDefaultIndex !== -1) return (leftDefaultIndex === -1 ? 999 : leftDefaultIndex) - (rightDefaultIndex === -1 ? 999 : rightDefaultIndex)
    return names.indexOf(left.name) - names.indexOf(right.name)
  }), [toolUsage])
  const filteredHeroes = useMemo(() => heroes.filter((hero) => `${hero.name}${skills.filter((skill) => hero.skillIds.includes(skill.id)).map((skill) => skill.name + skill.description).join('')}`.includes(query.trim())), [query])
  const heroPageCount = Math.max(1, Math.ceil(filteredHeroes.length / HERO_PAGE_SIZE))
  const pagedHeroes = filteredHeroes.slice((heroPage - 1) * HERO_PAGE_SIZE, heroPage * HERO_PAGE_SIZE)
  const filteredPoolHeroes = useMemo(() => heroes.filter((hero) => {
    const skillNames = skills.filter((skill) => hero.skillIds.includes(skill.id)).map((skill) => skill.name).join('')
    return `${hero.name}${skillNames}`.includes(poolQuery.trim())
  }), [poolQuery])
  const poolPageCount = Math.max(1, Math.ceil(filteredPoolHeroes.length / POOL_PAGE_SIZE))
  const pagedPoolHeroes = filteredPoolHeroes.slice((poolPage - 1) * POOL_PAGE_SIZE, poolPage * POOL_PAGE_SIZE)
  const usesPool = !poolIndependentNames.has(drawHero?.name ?? '')
  const caoHuaTrackOptions = caoHuaOptions[caoHuaMode].filter((option) => !option.startsWith('随机执行'))
  const resetTool = () => {
    setCandidates([])
    setUsedSkillNames([])
    setMouCaoShuangDeleted([])
    setSelectedGeneralIds([])
    setTargetSearch('')
    setTargetHeroId('')
    setCaoHuaMode('阳')
    setCaoHuaRemoved({ 阳: [], 阴: [] })
    setCaiYongLength('2')
    setQuanHuijieSelected([])
    setZhaoXiangAliveCount('4')
    setZhaoXiangSelected([])
    setTargetFaction('蜀')
    setTargetHp('3')
    setTrigger('play-phase')
    setActiveSeat('1号位')
    setSeatNames(['1号位', '2号位', '3号位', '4号位'])
    setSeatSkills({})
  }
  const toggleCaoHuaRemoved = (option: string) => setCaoHuaRemoved((current) => ({
    ...current,
    [caoHuaMode]: current[caoHuaMode].includes(option)
      ? current[caoHuaMode].filter((item) => item !== option)
      : [...current[caoHuaMode], option],
  }))
  const recordToolUse = (heroId: string) => setToolUsage((current) => {
    const next = { ...current, [heroId]: (current[heroId] ?? 0) + 1 }
    localStorage.setItem(TOOL_USAGE_STORAGE_KEY, JSON.stringify(next))
    return next
  })
  useEffect(() => {
    if (skipHistory.current) { skipHistory.current = false; return }
    window.history.pushState({ appPage: page }, '', `#${page}`)
  }, [page])
  useEffect(() => {
    const onPopState = () => {
      const next = window.location.hash.slice(1) as Page
      skipHistory.current = true
      setPage(next === 'heroes' || next === 'draw' ? next : 'home')
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
  const goBack = () => { if (page === 'home') return; if (window.history.length > 1) window.history.back(); else setPage('home') }
  useEffect(() => {
    if (page === 'home') return
    const button = document.createElement('button')
    button.className = 'app-back-button'
    button.textContent = '← 返回'
    button.onclick = goBack
    document.body.appendChild(button)
    return () => button.remove()
  }, [page])
  useEffect(() => { resetTool() }, [drawHeroId])
  useEffect(() => {
    const panel = document.querySelector('.draw-panel')
    if (!panel || (drawHero?.name !== SHEN_DIANWEI && drawHero?.name !== MOU_CAO_SHUANG)) return
    const board = document.createElement('div')
    board.className = 'visual-selection-board'
    const title = document.createElement('strong')
    if (drawHero.name === SHEN_DIANWEI) {
      title.textContent = `神典韦：左膀右臂（${selectedGeneralIds.length}/2）`
      title.textContent = `神典韦：左膀右臂（${selectedDianweiCount}/2）`
      board.append(title)
      title.textContent = `\u795e\u5178\u97e6\uff1a\u5de6\u8198\u53f3\u81c2\uff08${selectedDianweiCount}/2\uff09`
      for (let index = 0; index < 2; index += 1) {
        const slot = document.createElement('button')
        slot.className = 'selection-slot'
        slot.textContent = selectedShenDianweiGenerals[index]?.name ?? `位置 ${index + 1}：待选择`
        const selectedHero = selectedShenDianweiGenerals[index]
        slot.textContent = selectedHero?.name ?? (index === 0 ? '\u5de6\u8198' : '\u53f3\u81c2')
        slot.textContent = selectedHero?.name ?? (index === 0 ? '左膀' : '右臂')
        if (selectedHero) slot.onclick = () => setSelectedGeneralIds((current) => current.map((id, slotIndex) => slotIndex === index ? '' : id))
        board.append(slot)
      }
    } else {
      title.textContent = `谋曹爽：删除进度（${mouCaoShuangDeleted.length}/4）`
      board.append(title)
      caoShuangOptions.forEach((option) => {
        const slot = document.createElement('span')
        slot.className = `selection-slot${mouCaoShuangDeleted.includes(option) ? ' selection-slot--done' : ''}`
        slot.textContent = `${mouCaoShuangDeleted.includes(option) ? '×' : '○'} ${option}`
        board.append(slot)
      })
    }
    const candidatesGrid = panel.querySelector('.candidate-grid')
    panel.insertBefore(board, candidatesGrid)
    if (drawHero.name === SHEN_DIANWEI) {
      panel.querySelectorAll<HTMLButtonElement>('.candidate-card').forEach((button, index) => {
        const candidate = candidates[index]
        const selected = candidate ? selectedGeneralIds.includes(candidate.heroId) : false
        button.classList.toggle('candidate-card--selected', selected)
        button.disabled = button.disabled || selected
        button.disabled = button.disabled || candidate?.skillName === '\u65e0\u7b26\u5408\u6761\u4ef6\u6280\u80fd'
        button.disabled = (selectedGeneralIds.filter(Boolean).length >= 2 && !selected) || candidate?.skillName === '无符合条件技能'
      })
    }
    if (drawHero.name === SHEN_DIANWEI) {
      panel.querySelectorAll<HTMLButtonElement>('.candidate-card').forEach((button, index) => {
        const candidate = candidates[index]
        const selected = candidate ? selectedGeneralIds.includes(candidate.heroId) : false
        const detail = candidate?.description?.replace(/^\u5df2\u9009\u62e9[：:]/, '') ?? ''
        const hasNoSkill = detail === '\u6ca1\u6709\u7b26\u5408\u6761\u4ef6\u7684\u6280\u80fd'
        const summary = button.querySelector('small')
        if (summary) summary.textContent = detail
        button.classList.toggle('candidate-card--has-detail', Boolean(candidate?.description) && !hasNoSkill)
        if (hasNoSkill) delete button.dataset.detail
        if (candidate?.description && !hasNoSkill) {
          button.dataset.detail = detail
          button.classList.add('candidate-card--has-detail')
          if (!button.dataset.detailBound) {
            button.addEventListener('click', () => button.classList.toggle('candidate-card--detail-open'))
            button.dataset.detailBound = 'true'
          }
          if (!button.querySelector('.candidate-detail-toggle')) {
            const detailToggle = document.createElement('span')
            detailToggle.className = 'candidate-detail-toggle'
            detailToggle.textContent = '\u67e5\u770b\u6280\u80fd'
            detailToggle.addEventListener('click', (event) => {
              event.preventDefault()
              event.stopPropagation()
              button.classList.toggle('candidate-card--detail-open')
            }, true)
            button.append(detailToggle)
          }
        }
        button.querySelector('.candidate-detail-toggle')?.remove()
        if (summary && candidate?.description && !hasNoSkill) {
          summary.textContent = button.classList.contains('candidate-card--detail-open') ? detail : '\u70b9\u51fb\u67e5\u770b\u6280\u80fd\u8be6\u60c5'
          summary.classList.add('candidate-detail-summary')
          summary.dataset.fullDetail = detail
          if (!summary.dataset.detailSummaryBound) {
            summary.addEventListener('click', (event) => {
              event.preventDefault()
              event.stopPropagation()
              button.classList.toggle('candidate-card--detail-open')
              summary.textContent = button.classList.contains('candidate-card--detail-open') ? summary.dataset.fullDetail ?? '' : '\u70b9\u51fb\u67e5\u770b\u6280\u80fd\u8be6\u60c5'
            }, true)
            summary.dataset.detailSummaryBound = 'true'
          }
        }
        button.disabled = selectedGeneralIds.filter(Boolean).length >= 2 && !selected
        button.dataset.selected = String(selected)
        button.dataset.heroId = candidate?.heroId ?? ''
        if (selected && !button.dataset.cancelBound) {
          button.addEventListener('click', (event) => {
            if (button.dataset.selected !== 'true') return
            event.preventDefault()
            event.stopPropagation()
            if (button.dataset.selected !== 'true') return
            button.classList.toggle('candidate-card--detail-open')
            setSelectedGeneralIds((current) => current.map((id) => id === button.dataset.heroId ? '' : id))
          }, true)
          button.dataset.cancelBound = 'true'
        }
      })
    }
    return () => board.remove()
  }, [drawHero?.name, selectedGeneralIds, mouCaoShuangDeleted, candidates, selectedShenDianweiGenerals])
  useEffect(() => {
    if (drawHero?.name !== SHEN_DIANWEI || selectedGeneralIds.length <= 2) return
    setSelectedGeneralIds((current) => {
      const slots = current.slice(0, 2)
      current.slice(2).forEach((id) => {
        if (!id || slots.includes(id)) return
        const emptySlot = slots.findIndex((slot) => !slot)
        if (emptySlot >= 0) slots[emptySlot] = id
      })
      return slots
    })
  }, [drawHero?.name, selectedGeneralIds])
  useEffect(() => {
    if (drawHero?.name !== SHEN_DIANWEI) return
    setCandidates((current) => {
      let changed = false
      const cleaned = current.map((item) => {
        const description = item.description.replace(/^(?:\u5df2\u9009\u62e9[\uFF1A:]\s*)+/, '')
        if (description !== item.description) changed = true
        return description === item.description ? item : { ...item, description }
      })
      return changed ? cleaned : current
    })
  }, [drawHero?.name, candidates])
  useEffect(() => {
    const validPool = pools.find((poolItem) => poolItem.id === activePoolId) ?? pools[0]
    if (validPool && validPool.id !== activePoolId) {
      setActivePoolId(validPool.id)
      saveActivePoolId(validPool.id)
    }
  }, [pools, activePoolId])
  useEffect(() => {
    if (poolModalOpen && activePool) setPoolNameDraft(activePool.name)
  }, [poolModalOpen, activePool?.id])

  const updatePools = (next: SkillPool[]) => { setPools(next); savePools(next) }
  const updatePoolHeroes = (ids: string[]) => updatePools(pools.map((poolItem) => poolItem.id === activePool?.id ? { ...poolItem, heroIds: ids } : poolItem))
  const selectPool = (id: string) => { const nextPool = pools.find((poolItem) => poolItem.id === id); setActivePoolId(id); saveActivePoolId(id); setPoolNameDraft(nextPool?.name ?? ''); setPoolDeletePending(false); setPoolManagerMessage(''); setCandidates([]) }
  const uniquePoolName = (baseName: string) => { const trimmed = baseName.trim() || '新建将池'; if (!pools.some((poolItem) => poolItem.name === trimmed)) return trimmed; let index = 2; while (pools.some((poolItem) => poolItem.name === `${trimmed} ${index}`)) index += 1; return `${trimmed} ${index}` }
  const createPool = () => { const name = uniquePoolName('新建将池'); const id = `pool-${Date.now()}`; updatePools([...pools, { id, name, heroIds: [] }]); selectPool(id) }
  const duplicatePool = () => { if (!activePool) return; const name = uniquePoolName(`${activePool.name} 副本`); const id = `pool-${Date.now()}`; updatePools([...pools, { id, name, heroIds: [...activePool.heroIds] }]); selectPool(id) }
  const renamePool = () => { const name = poolNameDraft.trim(); if (!activePool || !name || name === activePool.name) return; if (pools.some((poolItem) => poolItem.id !== activePool.id && poolItem.name === name)) { setPoolManagerMessage('将池名称已存在，请换一个名称'); return } updatePools(pools.map((poolItem) => poolItem.id === activePool.id ? { ...poolItem, name } : poolItem)); setPoolNameDraft(name); setPoolManagerMessage('') }
  const deletePool = () => { if (!activePool || activePool.isDefault || pools.length <= 1) return; if (!poolDeletePending) { setPoolDeletePending(true); return } const nextPools = pools.filter((poolItem) => poolItem.id !== activePool.id); const nextActivePool = nextPools[0]; updatePools(nextPools); selectPool(nextActivePool.id) }
  const makeCandidate = (hero: Hero, skill: typeof skills[number]): SkillCandidate => ({ heroId: hero.id, heroName: hero.name, skillName: skill.name, description: skill.description, triggers: skill.triggers })
  const draw = () => {
    if (!drawHero) return
    let result = pool.flatMap((hero) => skills.filter((skill) => hero.skillIds.includes(skill.id)).map((skill) => makeCandidate(hero, skill)))
    if (drawHero.name === XUSHAO) result = drawPingjian({ trigger, pool: result, usedSkillNames }).candidates
    if (drawHero.name === ZHANGYU) result = result.filter((item) => { const hero = pool.find((candidate) => candidate.id === item.heroId); return hero?.faction === targetFaction && hero?.hp === targetHp && !/限定技|觉醒技|主公技/.test(item.description) }).sort(() => Math.random() - .5).slice(0, 3)
    if (drawHero.name === SHEN_HUATUO) result = targetHero ? pool.filter((hero) => hero.name === targetHero.name).flatMap((hero) => skills.filter((skill) => hero.skillIds.includes(skill.id)).map((skill) => makeCandidate(hero, skill))) : []
    if (drawHero.name === GUANNING) result = result.filter((item) => /^出牌阶段/.test(item.description)).sort(() => Math.random() - .5).slice(0, 1)
    if (drawHero.name === GUAN_NING) result = result.filter((item) => /[仁义礼智信]/.test(item.skillName)).sort(() => Math.random() - .5).slice(0, 1)
    if (drawHero.name === ZHAO_XIANG) {
      const count = Math.max(4, Number(zhaoXiangAliveCount) || 4)
      const candidateHeroes = pool.filter((hero) => hero.faction === '蜀').sort(() => Math.random() - .5).slice(0, count)
      result = candidateHeroes.flatMap((hero) => skills.filter((skill) => hero.skillIds.includes(skill.id) && !/限定技|觉醒技|主公技/.test(skill.description)).map((skill) => makeCandidate(hero, skill)))
      setZhaoXiangSelected([])
    }
    if (drawHero.name === QUAN_HUIJIE) { const candidateHeroes = pool.filter((hero) => hero.faction === '吴' && femaleNames.has(hero.name)).sort(() => Math.random() - .5).slice(0, 4); result = candidateHeroes.flatMap((hero) => skills.filter((skill) => hero.skillIds.includes(skill.id)).map((skill) => makeCandidate(hero, skill))); setQuanHuijieSelected([]) }
    if (drawHero.name === ZUOCI) result = pool.sort(() => Math.random() - .5).slice(0, 2).flatMap((hero) => { const own = skills.filter((skill) => hero.skillIds.includes(skill.id)); return own.length ? [makeCandidate(hero, own[Math.floor(Math.random() * own.length)])] : [] })
    if (drawHero.name === SHEN_CAOPI) result = drawPingjian({ trigger, pool: result.filter((item) => item.heroName.startsWith('曹')), usedSkillNames }).candidates
    if (drawHero.name === XURONG) { const options = ['受到1点火焰伤害且本回合不能对你使用杀', '失去1点体力且本回合手牌上限-1', '随机获得其两张牌']; result = [{ heroId: drawHero.id, heroName: drawHero.name, skillName: '凶镬随机结果', description: options[Math.floor(Math.random() * options.length)] }] }
    if (drawHero.name === CAOHUA) { const removed = caoHuaRemoved[caoHuaMode]; const available = caoHuaOptions[caoHuaMode].filter((option) => !option.startsWith('随机执行') && !removed.includes(option)); const picked = available[Math.floor(Math.random() * available.length)]; if (picked) { result = [{ heroId: drawHero.id, heroName: drawHero.name, skillName: `彩翼·${caoHuaMode}`, description: picked.replace('X', String(available.length)) }] } else result = [] }
    if (drawHero.name === LIJUE) result = [{ heroId: drawHero.id, heroName: drawHero.name, skillName: '狼袭随机伤害', description: `本次造成${Math.floor(Math.random() * 3)}点伤害` }]
    if (drawHero.name === YANGBIAO) { const cards = ['过河拆桥', '杀', '五谷丰登']; result = [{ heroId: drawHero.id, heroName: drawHero.name, skillName: '举讹随机牌', description: `本次随机使用：${cards[Math.floor(Math.random() * cards.length)]}` }] }
    if (drawHero.name === MOU_CAO_SHUANG) { const options = ['令一名角色弃牌', '摸牌', '重铸牌', '弃牌']; const available = options.filter((option) => !mouCaoShuangDeleted.includes(option)); const picked = available[Math.floor(Math.random() * available.length)]; if (picked) { const remaining = available.filter((option) => option !== picked); setMouCaoShuangDeleted((current) => [...current, picked]); result = [{ heroId: drawHero.id, heroName: drawHero.name, skillName: '渐专随机删除', description: `本次删除：${picked}；剩余选项：${remaining.join('、') || '无（四项已全部删除）'}` }] } else result = [] }
    if (drawHero.name === WU_GUAN_YU) result = nonEquipmentNames.sort(() => Math.random() - .5).slice(0, 5).map((name) => ({ heroId: drawHero.id, heroName: drawHero.name, skillName: name, description: '随机出现的非装备牌名' }))
    if (drawHero.name === LE_CAO_ZHI) { const name = nonEquipmentNames[Math.floor(Math.random() * nonEquipmentNames.length)]; result = [{ heroId: drawHero.id, heroName: drawHero.name, skillName: name, description: '赋随机获得的非装备牌名' }] }
    if (drawHero.name === SHEN_DIANWEI) result = pool.sort(() => Math.random() - .5).slice(0, 5).map((hero) => ({ heroId: hero.id, heroName: hero.name, skillName: '武将牌候选', description: `势力：${hero.faction}；体力：${hero.hp}；技能：${skills.filter((skill) => hero.skillIds.includes(skill.id)).map((skill) => skill.name).join('、') || '官网暂无技能'}` }))
    if (drawHero.name === SHEN_ZHANGJIAO) { const picked = pickCardsWithPointTotal(shenZhangJiaoCards, 36); result = picked.length ? [{ heroId: drawHero.id, heroName: drawHero.name, skillName: '肆军：点数和36', description: `随机获得${picked.length}张牌：${picked.map((card) => `${card.suit ?? ''}${card.point}点·${card.name}`).join('、')}` }] : [] }
    if (drawHero.name === ZHAO_YAN) { const singleTargetNonDamageCards = ['桃', '顺手牵羊', '过河拆桥', '借刀杀人', '乐不思蜀', '兵粮寸断']; result = singleTargetNonDamageCards.sort(() => Math.random() - .5).slice(0, 3).map((name) => ({ heroId: drawHero.id, heroName: drawHero.name, skillName: name, description: '随机亮出的不同名、单一目标非伤害牌；目标角色选择其中一张使用，其余两张由你依次使用' })) }
    if (drawHero.name === LE_CAIYONG) { const length = Number(caiYongLength); const eligible = shenZhangJiaoCards.filter((card) => getCardNameLength(card.name) === length); result = eligible.sort(() => Math.random() - .5).slice(0, 2).map((card) => ({ heroId: drawHero.id, heroName: drawHero.name, skillName: `${card.suit ?? ''}${card.point}点·${card.name}`, description: `符合${length}字牌条件的随机牌（包含装备牌）` })) }
    if (drawHero.name === SHEN_DIANWEI) {
      const allowedSkills = (hero: Hero) => skills.filter((skill) => hero.skillIds.includes(skill.id)).filter((skill) => {
        const description = skill.description
        const opening = description.split(/[，。；：:]/, 1)[0] ?? description
        const hasAllowedType = !/^(限定技|觉醒技|主公技|转换技|使命技)/.test(opening) || /^锁定技/.test(opening)
        return description.includes('\u3010杀\u3011') && hasAllowedType
      })
      result = pool.sort(() => Math.random() - .5).slice(0, 5).flatMap((hero) => {
        const eligible = allowedSkills(hero)
        return eligible.length ? [{ heroId: hero.id, heroName: hero.name, skillName: '武将牌候选', description: `符合条件的技能：${eligible.map((skill) => skill.name).join('、')}` }] : []
      })
    }
    if (drawHero.name === SHEN_DIANWEI) {
      const eligibleSkills = (hero: Hero) => skills.filter((skill) => hero.skillIds.includes(skill.id)).filter((skill) => {
        const opening = skill.description.split(/[\uFF0C\u3002\uFF1B\uFF1A:]/, 1)[0] ?? skill.description
        const hasAllowedType = !/^(?:\u9650\u5b9a\u6280|\u89c9\u9192\u6280|\u4e3b\u516c\u6280|\u8f6c\u6362\u6280|\u4f7f\u547d\u6280)/.test(opening) || /^\u9501\u5b9a\u6280/.test(opening)
        return skill.description.includes('\u3010\u6740\u3011') && hasAllowedType
      })
      result = pool.sort(() => Math.random() - .5).slice(0, 5).map((hero) => {
        const allSkills = skills.filter((skill) => hero.skillIds.includes(skill.id))
        const validSkills = eligibleSkills(hero)
        const shownSkills = validSkills.length ? validSkills : allSkills
        const details = shownSkills.length
          ? shownSkills.map((skill) => `${skill.name}：${skill.description}`).join('\n')
          : '官网暂无技能详情'
        return {
          heroId: hero.id,
          heroName: hero.name,
          skillName: validSkills.length ? '\u5019\u9009\u6b66\u5c06' : '\u65e0\u7b26\u5408\u6761\u4ef6\u6280\u80fd',
          description: validSkills.length ? `符合条件的技能：\n${details}` : `没有符合条件的技能；技能详情：\n${details}`,
        }
      })
    }
    if (drawHero.name === SHEN_DIANWEI) {
      const validSkills = (hero: Hero) => skills.filter((skill) => hero.skillIds.includes(skill.id)).filter((skill) => {
        const opening = skill.description.split(/[\uFF0C\u3002\uFF1B\uFF1A:]/, 1)[0] ?? skill.description
        const allowedType = !/^(?:\u9650\u5b9a\u6280|\u89c9\u9192\u6280|\u4e3b\u516c\u6280|\u8f6c\u6362\u6280|\u4f7f\u547d\u6280)/.test(opening) || /^\u9501\u5b9a\u6280/.test(opening)
        return skill.description.includes('\u3010\u6740\u3011') && allowedType
      })
      result = result.map((item) => {
        const hero = pool.find((candidate) => candidate.id === item.heroId)
        const details = hero ? validSkills(hero).map((skill) => `${skill.name}：${skill.description}`).join('\n') : ''
        return { ...item, skillName: '\u5019\u9009\u6b66\u5c06', description: details }
      })
    }
    if (drawHero.name === SHEN_DIANWEI) {
      result = result.map((item) => item.description ? item : { ...item, description: '\u6ca1\u6709\u7b26\u5408\u6761\u4ef6\u7684\u6280\u80fd' })
    }
    if (drawHero.name === NAN_HUA) {
      const bookSkills = ['\u96f7\u51fb', '\u95ed\u6708', '\u7a81\u88ad', '\u660e\u7b56', '\u76f4\u8a00', '\u9634\u5175', '\u6d3b\u6c14', '\u9b3c\u52a9', '\u4ed9\u6388', '\u8bba\u9053', '\u89c2\u6708', '\u8a00\u653f']
      result = bookSkills.sort(() => Math.random() - .5).slice(0, 4).map((skillName) => ({ heroId: drawHero.id, heroName: drawHero.name, skillName, description: '\u5199\u6ee1\u6280\u80fd\u7684\u5929\u4e66\uff1a\u968f\u673a\u62bd\u53d6' }))
    }
    const nextCandidates = drawHero.name === NAN_HUA ? result : result.filter((item) => !usedSkillNames.includes(item.skillName))
    const uniqueCandidates = Array.from(new Map(nextCandidates.map((item) => [`${item.heroId}-${item.skillName}`, item])).values())
    setCandidates(drawHero.name === LE_CAIYONG ? uniqueCandidates.slice(0, 2) : uniqueCandidates)
  }
  const choose = (item: SkillCandidate) => {
    if (drawHero?.name === ZHAO_XIANG) {
      const key = `${item.heroId}-${item.skillName}`
      setZhaoXiangSelected((current) => current.includes(key) ? current.filter((selected) => selected !== key) : current.length < 2 ? [...current, key] : current)
      setCandidates((current) => current.map((candidate) => candidate.heroId === item.heroId && candidate.skillName === item.skillName ? { ...candidate, description: zhaoXiangSelected.includes(key) ? candidate.description.replace(/^已选择：/, '') : `已选择：${candidate.description}` } : candidate))
      return
    }
    if (drawHero?.name === QUAN_HUIJIE) { setQuanHuijieSelected((current) => current.includes(item.skillName) ? current.filter((name) => name !== item.skillName) : current.length < 2 ? [...current, item.skillName] : current); return }
    if (drawHero?.name === GUAN_NING) { setSeatSkills((current) => ({ ...current, [activeSeat]: [...(current[activeSeat] ?? []), item.skillName] })); setCandidates([]); return }
    if (drawHero?.name === SHEN_DIANWEI) { const selected = selectedGeneralIds.includes(item.heroId); setSelectedGeneralIds((current) => selected ? current.filter((id) => id !== item.heroId) : [...current, item.heroId]); setCandidates((current) => current.map((candidate) => candidate.heroId === item.heroId ? { ...candidate, description: selected ? candidate.description.replace(/^已选择：/, '') : `已选择：${candidate.description}` } : candidate)); return }
    setUsedSkillNames((current) => [...current, item.skillName]); setCandidates((current) => current.filter((candidate) => candidate.skillName !== item.skillName))
  }
  const modal = poolModalOpen && <div className="pool-modal__backdrop" onClick={() => setPoolModalOpen(false)}><div className="pool-modal" onClick={(event) => event.stopPropagation()}><div className="pool-manager"><div className="pool-manager__title"><strong>选择将池</strong><small>先选择已有将池；如需增删武将，可继续使用下方配置</small></div><div className="pool-manager__row"><select aria-label="选择当前将池" value={activePool?.id} onChange={(event) => selectPool(event.target.value)}>{pools.map((poolItem) => <option key={poolItem.id} value={poolItem.id}>{poolItem.name} · {poolItem.heroIds.length} 将</option>)}</select><input value={poolNameDraft} onChange={(event) => { setPoolNameDraft(event.target.value); setPoolDeletePending(false); setPoolManagerMessage('') }} placeholder="输入名称后可重命名" aria-label="将池名称" /><button onClick={createPool}>新建</button><button disabled={!activePool} onClick={duplicatePool}>复制</button><button disabled={!activePool || !poolNameDraft.trim()} onClick={renamePool}>重命名</button><button disabled={!activePool || activePool.isDefault || pools.length <= 1} onClick={deletePool}>{poolDeletePending ? "确认删除" : "删除"}</button></div>{poolManagerMessage && <small className="pool-manager__message">{poolManagerMessage}</small>}</div><div className="pool-config__header"><strong>配置当前将池（可选）· {activePool?.name} · {poolHeroIds.length}/{heroes.length}</strong><span><button onClick={() => updatePoolHeroes(heroes.map((hero) => hero.id))}>全选</button><button onClick={() => updatePoolHeroes([])}>全不选</button><button onClick={() => setPoolModalOpen(false)}>完成</button></span></div><div className="pool-search"><input value={poolQuery} onChange={(event) => { setPoolPage(1); setPoolQuery(event.target.value) }} placeholder="搜索武将或技能" /></div><div className="pool-list">{pagedPoolHeroes.map((hero) => <label className="pool-item" key={hero.id}><input type="checkbox" checked={poolHeroIds.includes(hero.id)} onChange={() => updatePoolHeroes(poolHeroIds.includes(hero.id) ? poolHeroIds.filter((id) => id !== hero.id) : [...poolHeroIds, hero.id])} /><span>{hero.name}</span><small>{skills.filter((skill) => hero.skillIds.includes(skill.id)).map((skill) => skill.name).join('、')}</small></label>)}<div className="pagination"><button disabled={poolPage === 1} onClick={() => setPoolPage((current) => current - 1)}>上一页</button><span>{poolPage} / {poolPageCount}</span><button disabled={poolPage >= poolPageCount} onClick={() => setPoolPage((current) => current + 1)}>下一页</button></div></div></div></div>
  return <div className="app-shell"><header className="topbar"><button className="brand" onClick={() => setPage('home')}><span>一将成名</span><small>线下辅助</small></button><nav aria-label="主导航"><button className={page === 'home' ? 'active' : ''} aria-current={page === 'home' ? 'page' : undefined} onClick={() => setPage('home')}>工具首页</button><button className={page === 'heroes' ? 'active' : ''} aria-current={page === 'heroes' ? 'page' : undefined} onClick={() => setPage('heroes')}>武将查询</button><button onClick={() => setPoolModalOpen(true)}>配置将池</button></nav></header><main>
    {page === 'home' && <section className="tool-home"><div className="tool-home__header"><div className="tool-home__intro"><span className="eyebrow">SKILL TOOLKIT</span><h1>选择技能工具</h1><p>选择武将，开始对应的线下技能辅助。</p></div><div className="tool-home__pool"><span>当前将池：<strong>{activePool?.name}</strong> · {poolHeroIds.length}/{heroes.length}</span><button className="button button--primary" onClick={() => setPoolModalOpen(true)}>选择将池</button></div></div><div className="tool-grid"><div className="tool-grid__meta">{toolHeroes.length} 个工具 · 常用优先</div><div className="hero-grid">{toolHeroes.map((hero) => <button className="tool-card" key={hero.id} onClick={() => { recordToolUse(hero.id); resetTool(); setDrawHeroId(hero.id); setPage('draw') }}><span className="hero-faction">{hero.faction}</span><strong>{hero.name}</strong><span>{skills.find((skill) => hero.skillIds.includes(skill.id))?.name}</span><small>进入工具 →</small></button>)}</div></div></section>}
    {page === 'heroes' && <section className="content-section"><div className="section-heading"><h2>武将查询</h2><span className="count">{filteredHeroes.length} / {heroes.length}</span></div><div className="filters"><input value={query} onChange={(event) => { setHeroPage(1); setQuery(event.target.value) }} placeholder="搜索武将或技能" /></div><div className="hero-grid">{pagedHeroes.map((hero) => <HeroCard key={hero.id} hero={hero} onOpen={() => setPage('heroes')} />)}</div><div className="pagination"><button disabled={heroPage === 1} onClick={() => setHeroPage((current) => current - 1)}>上一页</button><span>{heroPage} / {heroPageCount}</span><button disabled={heroPage >= heroPageCount} onClick={() => setHeroPage((current) => current + 1)}>下一页</button></div></section>}
    {page === 'draw' && <section className="content-section"><div className="section-heading"><h2>{drawHero?.name} · 技能工具</h2></div><div className="draw-panel">{usesPool && <div className="pool-switcher"><label>当前将池<select value={activePool?.id} onChange={(event) => selectPool(event.target.value)}>{pools.map((poolItem) => <option key={poolItem.id} value={poolItem.id}>{poolItem.name}</option>)}</select></label><button className="button button--ghost" onClick={() => setPoolModalOpen(true)}>配置将池 · {poolHeroIds.length}/{heroes.length}</button></div>}<div className="draw-controls">{drawHero?.name === ZHAO_XIANG && <label>存活人数（至少4）<input type="number" min="4" value={zhaoXiangAliveCount} onChange={(event) => setZhaoXiangAliveCount(event.target.value)} /></label>}{drawHero?.name === LE_CAIYONG && <label>牌名字数<select value={caiYongLength} onChange={(event) => setCaiYongLength(event.target.value)}><option value="1">1字</option><option value="2">2字</option><option value="3">3字</option><option value="4">4字</option><option value="5">5字</option></select></label>}{drawHero?.name === CAOHUA && <label>彩翼状态<select value={caoHuaMode} onChange={(event) => setCaoHuaMode(event.target.value as CaoHuaMode)}><option value="阳">阳</option><option value="阴">阴</option></select></label>}{drawHero?.name === CAOHUA && <div className="cao-hua-options"><span>已移除选项：（未勾选表示移除）</span>{caoHuaTrackOptions.map((option) => <label key={option}><input type="checkbox" checked={caoHuaRemoved[caoHuaMode].includes(option)} onChange={() => toggleCaoHuaRemoved(option)} />{option}</label>)}</div>}{drawHero?.name === XUSHAO && <label>发动时机<select value={trigger} onChange={(event) => setTrigger(event.target.value as SkillTrigger)}><option value="play-phase">出牌阶段</option><option value="end-phase">结束阶段</option><option value="damaged">受到伤害后</option></select></label>}{drawHero?.name === ZHANGYU && <><label>目标势力<select value={targetFaction} onChange={(event) => setTargetFaction(event.target.value)}><option>魏</option><option>蜀</option><option>吴</option><option>群</option><option>神</option></select></label><label>初始体力<select value={targetHp} onChange={(event) => setTargetHp(event.target.value)}><option>3</option><option>4</option><option>5</option><option>6</option><option>7</option></select></label></>}{drawHero?.name === SHEN_HUATUO && <label>搜索目标武将<input value={targetSearch} onChange={(event) => setTargetSearch(event.target.value)} placeholder="输入名称缩小范围" /><select value={targetHeroId} onChange={(event) => setTargetHeroId(event.target.value)}><option value="">请选择</option>{targetOptions.map((hero) => <option key={hero.id} value={hero.id}>{hero.name} · {hero.faction}{hero.hp}</option>)}</select></label>}{drawHero?.name === GUAN_NING && <label>技能归属座位<select value={activeSeat} onChange={(event) => setActiveSeat(event.target.value)}>{seatNames.map((seat) => <option key={seat}>{seat}</option>)}</select></label>}<button className="button button--primary" onClick={draw}>随机出现候选</button><button className="button button--ghost" onClick={resetTool}>重置本工具</button></div>{drawHero?.name === ZHAO_XIANG && <div className="draw-notice">从 {Math.max(4, Number(zhaoXiangAliveCount) || 4)} 张随机蜀将牌中选择技能，已选择：{zhaoXiangSelected.length}/2（点击技能卡进行选择或取消）</div>}{drawHero?.name === GUAN_NING && <div className="draw-notice">管宁本次抽到的技能将交给所选座位。座位名称：{seatNames.map((seat, index) => <input key={seat} value={seat} onChange={(event) => setSeatNames((current) => current.map((name, i) => i === index ? event.target.value : name))} />)}</div>}{drawHero?.name === QUAN_HUIJIE && <div className="draw-notice">已选择技能（最多 2 个）：{quanHuijieSelected.join('、') || '尚未选择'}</div>}{candidates.length > 0 && <div className="candidate-grid">{candidates.map((item) => <button className="candidate-card" key={`${item.heroId}-${item.skillName}`} onClick={() => choose(item)}><strong>{item.heroName}</strong><span>{item.skillName}</span><small>{item.description}</small></button>)}</div>}{drawHero?.name === GUAN_NING && <div className="used-skills">{seatNames.map((seat) => <span key={seat}><strong>{seat}</strong>：{(seatSkills[seat] ?? []).join('、') || '暂无技能'}</span>)}</div>}{drawHero?.name === XUSHAO && usedSkillNames.length > 0 && <div className="used-skills"><span>许劭本局已发动：</span>{usedSkillNames.map((name) => <span className="tag" key={name}>{name}</span>)}<button onClick={() => setUsedSkillNames([])}>重置本局</button></div>}</div></section>}
  </main>{modal}<footer><span>数据来源：三国杀官方武将网站</span></footer></div>
}
