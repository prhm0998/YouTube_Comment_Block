import { useStoredValue } from '@prhm0998/shared/composables'
import { applyDefaultProperties, filterProperties } from '@prhm0998/shared/utils'
import { useDebounceFn } from '@vueuse/core'
import destr from 'destr'

export interface UserOption {
  enabled: boolean
  enabledChat: boolean
  useShowOnHover: boolean
  useNormalize: boolean
  useCaseInsensitive: boolean
  useWordSensitive: boolean
  useTemporaryWordSensitive: boolean
  useMentionSensitive: boolean
  useTemporaryMentionSensitive: boolean
}

export type UserOptionEvent =
  | { type: 'toggle', key: keyof UserOption }

const getDefaultUserOption = (): UserOption => ({
  enabled: true,
  enabledChat: true,
  useShowOnHover: true,
  useCaseInsensitive: true,
  useNormalize: true,
  useTemporaryWordSensitive: false,
  useWordSensitive: false,
  useTemporaryMentionSensitive: false,
  useMentionSensitive: false,
})

export default function () {
  const defaultUserOption = getDefaultUserOption()
  const { state: storedJson } = useStoredValue('local:Option', '{}')
  const memoryCache = ref<UserOption>(defaultUserOption)

  // json to state
  const deserialize = (jsonString: string): UserOption => {
    try {
      const parsed = destr(jsonString) as Partial<UserOption>
      // 不要なプロパティを削除
      const filterd = filterProperties(parsed, defaultUserOption)
      // jsonにないプロパティはデフォルトから持ってくる
      return applyDefaultProperties(defaultUserOption, filterd)
    }
    catch {
      return getDefaultUserOption()
    }
  }

  // state to json 後はstringifyするだけの状態に加工する
  const serialize = (): UserOption => {
    return memoryCache.value
  }

  // ストアに更新があったらキャッシュも更新する
  const initializeCache = () => memoryCache.value = deserialize(storedJson.value)
  watch(storedJson, (newVal) => memoryCache.value = deserialize(newVal))
  initializeCache()

  const saveToStorage = useDebounceFn(() => {
    storedJson.value = JSON.stringify(serialize())
  }, 100, { maxWait: 1000 })

  const updateUserOption = (event: UserOptionEvent) => {
    const { type, key } = event
    switch (type) {
      case 'toggle':
        // useTemporaryWordSensitive, useWordSensitive の排他制御
        if (key === 'useTemporaryWordSensitive' || key === 'useWordSensitive') {
          if (memoryCache.value.useTemporaryWordSensitive && key === 'useWordSensitive') {
            memoryCache.value.useTemporaryWordSensitive = false
          }
          else if (memoryCache.value.useWordSensitive && key === 'useTemporaryWordSensitive') {
            memoryCache.value.useWordSensitive = false
          }
        }

        // useTemporaryMentionSensitive, useMentionSensitive の排他制御
        if (key === 'useTemporaryMentionSensitive' || key === 'useMentionSensitive') {
          if (memoryCache.value.useTemporaryMentionSensitive && key === 'useMentionSensitive') {
            memoryCache.value.useTemporaryMentionSensitive = false
          }
          else if (memoryCache.value.useMentionSensitive && key === 'useTemporaryMentionSensitive') {
            memoryCache.value.useMentionSensitive = false
          }
        }

        memoryCache.value[event.key] = !memoryCache.value[event.key]
        break
      default:
        break
    }
    saveToStorage()
  }
  return {
    state: (memoryCache),
    updateUserOption,
  }
}