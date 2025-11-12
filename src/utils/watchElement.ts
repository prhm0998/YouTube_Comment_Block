import defu from 'defu'

// 返すオブジェクトの型を定義
export interface WatchElementController {
  /** 監視を停止します。 */
  disconnect: () => void
  /** 監視を停止し、初期要素の走査からやり直して、再び監視を開始します。 */
  restart: () => void
  /** 監視に利用されている MutationObserver のインスタンスです。 */
  observer: MutationObserver
}

/**
 * 指定要素以下を監視し、クエリに一致する新規要素（または既存要素）を検出してコールバックを実行する。
 * @returns 監視の制御を行うコントローラーオブジェクト。
 */
export function watchElement(
  targetElement: HTMLElement,
  query: string,
  callback: (element: HTMLElement) => void,
  options: MutationObserverInit | null = null
): WatchElementController {

  const defaultOptions: MutationObserverInit = {
    childList: true,
    subtree: true,
  }

  const observerOptions = defu(options ?? {}, defaultOptions)

  // 監視インスタンスをスコープ外からアクセスできるように定義
  let observer: MutationObserver | null = null

  // ----------------------------------------------------
  // リスタート時に実行する初期走査処理を関数化
  // ----------------------------------------------------
  const runInitialScan = () => {
    // 初期状態の該当要素に対して実行
    targetElement.querySelectorAll<HTMLElement>(query).forEach(q => {
      callback(q)
    })
  }

  // ----------------------------------------------------
  // MutationObserver のコールバック
  // ----------------------------------------------------
  const mutationCallback = (mutations: MutationRecord[]) => {
    for (const mutation of mutations) {
      // 削除ノードの処理をスキップしたい場合は、ここで追加ノードのみに絞る

      for (const node of mutation.addedNodes) {
        if (node.nodeType !== node.ELEMENT_NODE) continue
        if (!(node instanceof HTMLElement)) continue

        // ① 追加ノード自身が query にマッチするかを確認
        if (node.matches(query)) {
          callback(node)
          continue
        }
      }
    }
  }

  // ----------------------------------------------------
  // 制御メソッド
  // ----------------------------------------------------

  // 監視開始処理
  const startObserving = () => {
    if (observer) {
      // 既存の監視があれば停止してから再開
      observer.disconnect()
    }
    observer = new MutationObserver(mutationCallback)
    observer.observe(targetElement, observerOptions)
  }

  // 監視を停止
  const disconnect = () => {
    observer?.disconnect()
  }

  // 監視をリスタート（やり直し）
  const restart = () => {
    disconnect() // 既存の監視を停止
    runInitialScan() // 初期走査を再実行
    startObserving() // 監視を再開
  }

  // ----------------------------------------------------
  // 最初の実行
  // ----------------------------------------------------
  runInitialScan()
  startObserving()

  // ----------------------------------------------------
  // 制御オブジェクトを返す
  // ----------------------------------------------------
  return {
    disconnect,
    restart,
    get observer() {
      if (!observer) throw new Error('Observer not initialized.')
      return observer
    },
  }
}