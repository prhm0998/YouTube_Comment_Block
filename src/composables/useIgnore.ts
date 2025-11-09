import { useStoredValue } from '@prhm0998/shared/composables'
import { useDebounceFn } from '@vueuse/core'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import destr from 'destr'

export interface IgnoreBase {
  id: string
  submitAt: Dayjs
  lastFindAt: Dayjs
}

export interface IgnoreSnapshot extends Omit<IgnoreBase, 'submitAt' | 'lastFindAt'> {
  submitISO: string
  lastFindISO: string
}

export default function (key: StorageItemKey) {
  const { state: storedJson } = useStoredValue(key, '[]')
  const memoryCache = ref<Map<IgnoreBase['id'], IgnoreBase>>(new Map<IgnoreBase['id'], IgnoreBase>())

  // json to state logic
  const deserialize = (jsonString: string): Map<IgnoreBase['id'], IgnoreBase> => {
    try {
      const parsed = destr(jsonString) as IgnoreSnapshot[]
      return parsed.sort((a, b) => dayjs(a.lastFindISO).isBefore(dayjs(b.lastFindISO)) ? 1 : -1).reduce((acc, { id, submitISO, lastFindISO }) => {
        acc.set(id, {
          id,
          submitAt: dayjs(submitISO),
          lastFindAt: dayjs(lastFindISO),
        })
        return acc
      }, new Map<IgnoreBase['id'], IgnoreBase>())

    }
    catch {
      return new Map<IgnoreBase['id'], IgnoreBase>()
    }
  }
  // state to json logic Map
  const serialize = (): IgnoreSnapshot[] => {
    return Array.from(memoryCache.value?.values()).sort((a, b) => a.lastFindAt.isBefore(b.lastFindAt) ? 1 : -1).map(({ id, submitAt, lastFindAt }) => ({
      id,
      submitISO: submitAt.toISOString(),
      lastFindISO: lastFindAt.toISOString(),
    }))
  }

  // ストアに更新があったらキャッシュも更新する
  const initializeCache = () => memoryCache.value = deserialize(storedJson.value)
  watch(storedJson, (newVal) => memoryCache.value = deserialize(newVal))
  initializeCache()

  const saveToStorage = useDebounceFn(() => {
    storedJson.value = JSON.stringify(serialize())
  }, 300, { maxWait: 1000 }) // 0.3秒間、追加の更新がないか待って更新 1.0秒経過したら強制的に更新

  // 新規追加または置換
  const insertOrReplace = (id: string, orignalId?: string) => {
    if (orignalId) {
      replace(id, orignalId)
    }
    else {
      insert(id)
    }
  }

  // 新規追加のみ
  const insert = (id: string) => {
    const existing = memoryCache.value.get(id)
    if (!existing) {
      set(id)
    }
  }

  const replace = (id: string, orignalId: string) => {
    const existing = memoryCache.value.get(orignalId)
    if (existing) {
      set(id, existing.submitAt, existing.lastFindAt)
      remove(orignalId)
    }
  }

  // 新規追加またはlastFindの更新
  const upsert = (id: string) => {
    const existing = memoryCache.value.get(id)
    const now = dayjs()
    if (existing) {
      existing.lastFindAt = now
      saveToStorage()
    }
    else {
      set(id)
    }
  }

  // 追加
  const set = (id: string, submitAt: Dayjs = dayjs(), lastFindAt: Dayjs = dayjs()) => {
    memoryCache.value.set(id, {
      id,
      submitAt,
      lastFindAt,
    })
    saveToStorage()
  }

  const remove = (id: string) => {
    memoryCache.value.delete(id)
    saveToStorage()
  }

  return {
    state: (memoryCache),
    upsert,
    insert,
    remove,
    insertOrReplace,
  }

}