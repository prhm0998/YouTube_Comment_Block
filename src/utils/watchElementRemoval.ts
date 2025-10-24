/**
 * 指定した DOM 要素がドキュメントから削除されたかを監視する関数
 *
 * @param element 監視対象の DOM 要素
 * @param callback 要素が削除されたときに実行されるコールバック関数
 * @param interval チェック間隔（ミリ秒）。デフォルトは1000ms（1秒）
 * @returns 監視を停止するためのクリーンアップ関数
 */
export const watchElementRemoval = (
  element: Element,
  callback: () => void,
  interval: number = 1000 // デフォルトは1秒ごとにチェック
) => {
  // 要素が既にドキュメントに存在しない場合
  if (!element.isConnected) {
    callback() // 即座にコールバックを呼び出す
    return
  }

  // 指定間隔で要素が削除されているかをチェックする
  const checkInterval = setInterval(() => {
    if (!element.isConnected) {
      clearInterval(checkInterval) // チェックを停止
      callback() // コールバックを実行
    }
  }, interval)

  // 監視を停止するためのクリーンアップ関数を返す
  return () => clearInterval(checkInterval)
}
