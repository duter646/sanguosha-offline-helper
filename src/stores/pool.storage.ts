import type { SkillPool } from '../domain/pool/pool.types'

const STORAGE_KEY = 'sanguosha-skill-pools'
const ACTIVE_POOL_COOKIE = 'sanguosha-active-pool'

export function loadPools(defaultHeroIds: string[]): SkillPool[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as SkillPool[]
  } catch {
    // 使用默认配置继续运行，避免本地存储损坏导致页面不可用。
  }
  return [{ id: 'default', name: '默认全将池', heroIds: defaultHeroIds, isDefault: true }]
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
