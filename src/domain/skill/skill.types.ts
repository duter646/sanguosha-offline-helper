export type SkillTrigger = 'play-phase' | 'end-phase' | 'damaged'

export type SkillCandidate = {
  heroId: string
  heroName: string
  skillName: string
  description: string
  triggers?: SkillTrigger[]
}

export type PingjianContext = {
  trigger: SkillTrigger
  pool: SkillCandidate[]
  usedSkillNames: string[]
}

export type DrawResult = {
  candidates: SkillCandidate[]
  remainingCount: number
}
