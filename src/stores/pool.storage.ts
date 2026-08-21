import type { SkillPool } from '../domain/pool/pool.types'

const STORAGE_KEY = 'sanguosha-skill-pools'
const ACTIVE_POOL_COOKIE = 'sanguosha-active-pool'

export function loadPools(defaultHeroIds: string[]): SkillPool[] {
  const fallback: SkillPool[] = [{ id: 'default', name: '默认全将池', heroIds: defaultHeroIds, isDefault: true }]
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return fallback
    const pools = parsed.filter((item): item is SkillPool => {
      if (!item || typeof item !== 'object') return false
      const pool = item as Partial<SkillPool>
      return typeof pool.id === 'string' && pool.id.length > 0 && typeof pool.name === 'string' && Array.isArray(pool.heroIds)
    }).map((pool) => ({
      id: pool.id,
      name: pool.name.trim() || '未命名将池',
      heroIds: pool.heroIds.filter((id): id is string => typeof id === 'string'),
      ...(pool.isDefault ? { isDefault: true } : {}),
    }))
    return pools.length > 0 ? pools : fallback
  } catch {
    // 使用默认配置继续运行，避免本地存储损坏导致页面不可用。
  }
  return fallback
}

export function savePools(pools: SkillPool[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pools))
}

export function loadActivePoolId(): string {
  const match = document.cookie.match(/(?:^|; )sanguosha-active-pool=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : 'default'
}

export function saveActivePoolId(id: string) {
  document.cookie = `sanguosha-active-pool=${encodeURIComponent(id)}; max-age=31536000; path=/; samesite=lax`
}
