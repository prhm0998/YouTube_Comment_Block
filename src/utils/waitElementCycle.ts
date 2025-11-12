import { waitElement } from '@1natsu/wait-element'
import { watchElementRemoval } from '@prhm0998/shared/utils'

export interface WaitElementCycleCallbacks<Result> {
  onFound?: (el: Result) => void | Promise<void>
  onRemove?: (el: Result) => void | Promise<void>
}

/**
 * 要素が削除されたときの共通処理を行う
 */
export async function handleElementRemoval<Result>(
  el: Result,
  stopWatcher: (() => void) | undefined,
  onRemoveCallback?: (el: Result) => void | Promise<void>
): Promise<void> {
  // 既存の監視を停止
  stopWatcher?.()

  // 削除時コールバック
  await onRemoveCallback?.(el)
}

/**
 * 指定した要素がDOM上に現れるまで待機し、削除された場合は再び探索を行う。
 * コールバックはオブジェクト形式で指定。
 *
 * @returns 再実行用関数 を返すので、呼び出し側で任意に再探索可能
 */
export function waitElementCycle<
  Result = Element,
  QuerySelectorResult extends Element | null = Element | null
>(
  callbacks: WaitElementCycleCallbacks<Result>,
  ...args: Parameters<typeof waitElement<Result, QuerySelectorResult>>
) {
  let stopWatcher: (() => void) | undefined = undefined

  // 再実行関数
  const loop = async (): Promise<void> => {
    const el = await waitElement<Result, QuerySelectorResult>(...args)

    // 発見時コールバック
    await callbacks.onFound?.(el)

    // 削除監視と再探索
    stopWatcher = watchElementRemoval(el as unknown as Element, async () => {
      await handleElementRemoval(el, stopWatcher, callbacks.onRemove)
      // 再実行
      void loop()
    })
  }

  // 即時実行
  void loop()

  // 呼び出し側でも再探索できるよう、loop を返す
  return {
    restart: loop,
  }
}
