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
  skillName: string
  skillDescription: string
  mechanism: SkillMechanism
  mechanismLabel: string
  officialUrl: string
  note?: string
}

export type Page = 'home' | 'heroes' | 'draw'
