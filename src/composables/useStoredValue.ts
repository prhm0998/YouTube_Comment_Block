import { UseAsyncStateOptions, useAsyncState } from '@vueuse/core'

export default function useStorageState<T>(
  key: StorageItemKey,
  initialValue: T,
  opts?: UseAsyncStateOptions<true, T>
) {
  // composable内部で専用スコープを作成
  const scope = effectScope(true) // detached: true にして親に依存しない

  // スコープ内で reactivity を扱う
  const result = scope.run(() => {
    const {
      state,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      execute: _,
      ...asyncState
    } = useAsyncState<T, [], true>(
      async () => (await storage.getItem(key, { fallback: initialValue })) ?? initialValue,
      initialValue,
      opts
    )

    const unwatch = storage.watch<T>(key, (newValue) => {
      state.value = newValue ?? initialValue
    })

    // scope.stop() 時に自動解除
    onScopeDispose(() => {
      unwatch()
    })

    const wrapped = computed({
      get() {
        return state.value
      },
      set(newValue) {
        void storage.setItem(key, newValue)
        state.value = newValue
      },
    })

    return {
      state: wrapped,
      ...asyncState,
    }
  })

  // 外部から stop() 呼び出しで破棄できるように
  const stop = () => {
    scope.stop() // → unwatch() も自動実行
  }

  return {
    ...result!,
    stop,
  }
}
