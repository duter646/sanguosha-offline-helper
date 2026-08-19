import generated from './official-hero-pages.json'
import { heroes as curatedHeroes } from './heroes'
import { skills as curatedSkills, type Skill } from './skills'
import type { Hero } from '../domain/hero/hero.types'

type GeneratedPage = {
  id: string
  name: string
  faction: string
  hp: string
  availability: 'online-original' | 'unclassified'
  excluded: boolean
  url: string
  skills: Array<{ name: string; description: string }>
}

const pages = (generated.pages as GeneratedPage[]).filter((page) => !page.excluded)
const curatedNames = new Set(curatedHeroes.map((hero) => hero.name))

const generatedSkills: Skill[] = pages
  .filter((page) => !curatedNames.has(page.name))
  .flatMap((page) => page.skills.map((skill, index) => ({
    id: `official-${page.id}-${index}`,
    heroId: `official-${page.id}`,
    name: skill.name,
    description: skill.description,
    mechanism: 'filtered-skill' as const,
    mechanismLabel: '\u666e\u901a\u6280\u80fd',
    officialUrl: page.url,
  })))

const generatedHeroes: Hero[] = pages
  .filter((page) => !curatedNames.has(page.name))
  .map((page) => ({
    id: `official-${page.id}`,
    name: page.name,
    faction: page.faction,
    hp: page.hp,
    skillIds: page.skills.map((_, index) => `official-${page.id}-${index}`),
    officialUrl: page.url,
    availability: page.availability,
  }))

export const skills: Skill[] = [...generatedSkills, ...curatedSkills]
export const heroes: Hero[] = [...generatedHeroes, ...curatedHeroes]
