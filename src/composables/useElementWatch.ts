import defu from 'defu'

/**
 * 指定要素以下を監視し、クエリに一致する新規要素（または既存要素）を検出してコールバックを実行する。
 */
export default function useElementWatch(
  targetElement: HTMLElement,
  query: string,
  callback: (element: HTMLElement) => void,
  options: MutationObserverInit | null = null
): MutationObserver {
  const defaultOptions: MutationObserverInit = {
    childList: true,
    subtree: true,
  }

  const observerOptions = defu(options ?? {}, defaultOptions)

  // 初期状態の該当要素に対して実行
  targetElement.querySelectorAll<HTMLElement>(query).forEach(callback)

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue

        // ① 追加ノード自身が query にマッチする場合
        if (node.matches(query)) callback(node)

        // ② subtree が有効な場合、子孫要素も探索
        if (observerOptions.subtree) {
          node.querySelectorAll<HTMLElement>(query).forEach(callback)
        }
        // todo: その他オプションへの対応
      }
    }
  })

  observer.observe(targetElement, observerOptions)
  return observer
}
