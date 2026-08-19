import type { DrawResult, PingjianContext, SkillCandidate } from './skill.types'

function sample<T>(items: T[], count: number): T[] {
  return [...items].sort(() => Math.random() - 0.5).slice(0, count)
}

/**
 * 许劭【评荐】的官方规则：出牌阶段、结束阶段或受到伤害后，
 * 从符合当前时机且尚未发动过的技能中随机出现 3 个候选。
 * 候选池由线下对局配置提供，不在规则中硬编码。
 */
export function drawPingjian(context: PingjianContext): DrawResult {
  const available = context.pool.filter((candidate) => {
    if (context.usedSkillNames.includes(candidate.skillName)) return false
    if (candidate.triggers?.includes(context.trigger)) return true
    const opening = candidate.description.split(/[，。；：]/, 1)[0] ?? candidate.description
    if (/^(其他角色|任意角色|一名其他角色|当其他角色)/.test(opening)) return false
    if (/^(锁定技|限定技|觉醒技|主公技)/.test(opening)) return false
    if (context.trigger === 'play-phase') return /^出牌阶段/.test(opening)
    if (context.trigger === 'end-phase') return /^(结束阶段|回合结束时|结束时)/.test(opening)
    return /^(当你受到伤害后|你受到伤害后|受到伤害后|当你受伤后)/.test(opening)
  })
  const candidates = sample(available, Math.min(3, available.length))
  return { candidates, remainingCount: Math.max(0, available.length - candidates.length) }
}

export function selectPingjianSkill(
  candidates: SkillCandidate[],
  selectedSkillName: string,
): SkillCandidate | undefined {
  return candidates.find((candidate) => candidate.skillName === selectedSkillName)
}
