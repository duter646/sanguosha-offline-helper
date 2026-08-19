import type { Hero } from '../domain/hero/hero.types'

// 张裕的技能来自官网公告页；其余武将由 official-hero-pages.json 自动导入。
export const heroes: Hero[] = [
  {
    id: 'zhangyu',
    name: '张裕',
    faction: '蜀',
    hp: '3',
    skillIds: ['zhangyu-xiangchen'],
    officialUrl: 'https://x.sanguosha.com/news/20260429_1123_0517.html',
    availability: 'unclassified',
  },
]
