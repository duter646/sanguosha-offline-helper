import type { SkillMechanism } from '../domain/hero/hero.types'

export type Skill = {
  id: string
  heroId: string
  name: string
  description: string
  mechanism: SkillMechanism
  mechanismLabel: string
  triggers?: Array<'play-phase' | 'end-phase' | 'damaged'>
  officialUrl: string
}

export const skills: Skill[] = [
  {
    id: 'zhangyu-xiangchen', heroId: 'zhangyu', name: '相谶',
    description: '出牌阶段限一次，你可选择一名角色并随机出现与其势力和初始体力值相等的武将的3个技能，然后你从中选择1个获得，你的回合结束时失去以此法获得的技能。你或上次发动“相谶”的目标角色体力值变化后，你可发动此技能。（以此法获得的技能存在3个时再次发动改为摸1张牌，无法获得限定技、觉醒技、主公技）',
    mechanism: 'random-skill', mechanismLabel: '随机候选技能',
    triggers: ['play-phase'], officialUrl: 'https://x.sanguosha.com/news/20260429_1123_0517.html',
  },
]
