export type SkillMechanism =
  | 'random-hero'
  | 'random-skill'
  | 'target-skill'
  | 'filtered-skill'

export type Hero = {
  id: string
  name: string
  faction: string
  hp: string
  skillIds: string[]
  officialUrl: string
  availability: 'physical' | 'online-original' | 'limited-online' | 'unclassified'
}

export type Page = 'home' | 'heroes' | 'draw'
