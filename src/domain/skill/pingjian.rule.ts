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
  const available = context.pool.filter((candidate) => !context.usedSkillNames.includes(candidate.skillName))
  const candidates = sample(available, Math.min(3, available.length))
  return { candidates, remainingCount: Math.max(0, available.length - candidates.length) }
}

export function selectPingjianSkill(
  candidates: SkillCandidate[],
  selectedSkillName: string,
): SkillCandidate | undefined {
  return candidates.find((candidate) => candidate.skillName === selectedSkillName)
}
