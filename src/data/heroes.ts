import type { Hero } from '../domain/hero/hero.types'

// 技能描述与来源均以官方武将页面为准；后续更新时只修改此数据层。
export const heroes: Hero[] = [
  {
    id: 'xushou', name: '许劭', faction: '群', hp: '3', skillName: '评荐',
    skillDescription: '从已开通武将中随机出现3张拥有当前时机可发动技能的武将牌，选择其中1个武将并发动其技能。',
    mechanism: 'random-hero', mechanismLabel: '随机候选武将', officialUrl: 'https://x.sanguosha.com/hero/804.html',
  },
  {
    id: 'zhangyu', name: '张裕', faction: '蜀', hp: '3', skillName: '相谶',
    skillDescription: '随机出现与目标势力和初始体力值相等的武将的3个技能，选择1个获得，回合结束时失去。',
    mechanism: 'random-skill', mechanismLabel: '随机候选技能', officialUrl: 'https://x.sanguosha.com/news/20260429_1123_0517.html',
  },
  {
    id: 'shen-huatuo', name: '神华佗', faction: '神', hp: '3', skillName: '寰道',
    skillDescription: '令一名其他角色复原武将牌，然后其获得随机一名同名武将的随机一个技能，并选择失去一个其他技能。',
    mechanism: 'target-skill', mechanismLabel: '目标武将技能', officialUrl: 'https://x.sanguosha.com/hero/220.html',
  },
  {
    id: 'guanning', name: '关宁', faction: '蜀', hp: '4', skillName: '龙诵',
    skillDescription: '交给或获得其他角色一张红色牌，然后获得一个出牌阶段技能，优先获得该角色的技能。',
    mechanism: 'target-skill', mechanismLabel: '目标武将技能', officialUrl: 'https://x.sanguosha.com/hero/1124.html',
  },
  {
    id: 'guanning-hermit', name: '管宁', faction: '群', hp: '3', skillName: '遁世',
    skillDescription: '选择一个包含“仁义礼智信”的技能令角色获得。',
    mechanism: 'filtered-skill', mechanismLabel: '条件技能池', officialUrl: 'https://x.sanguosha.com/hero/1950.html',
  },
  {
    id: 'zhaoxiang', name: '赵襄', faction: '蜀', hp: '3', skillName: '扶汉',
    skillDescription: '从随机出现的蜀势力武将牌中选择并获得至多两个技能。',
    mechanism: 'random-skill', mechanismLabel: '随机候选技能', officialUrl: 'https://x.sanguosha.com/hero/501.html',
  },
  {
    id: 'quanhui-jie', name: '全惠解', faction: '吴', hp: '3', skillName: '离宫',
    skillDescription: '从已开通的随机四个吴国女性武将中选择至多两个技能获得。',
    mechanism: 'random-skill', mechanismLabel: '随机候选技能', officialUrl: 'https://x.sanguosha.com/hero/1102.html',
  },
  {
    id: 'nan-hua', name: '南华老仙', faction: '群', hp: '3', skillName: '经合',
    skillDescription: '选中的角色可以从写满技能的天书中选择并获得一个技能，直到你的下回合开始。',
    mechanism: 'filtered-skill', mechanismLabel: '技能池选择', officialUrl: 'https://x.sanguosha.com/hero/551.html',
  },
  {
    id: 'huaman', name: '花鬘', faction: '群', hp: '3', skillName: '战缘',
    skillDescription: '觉醒后可选择一名男性角色，你与其获得技能“系力”。',
    mechanism: 'target-skill', mechanismLabel: '共同获得技能', officialUrl: 'https://x.sanguosha.com/hero/525.html',
  },
]
