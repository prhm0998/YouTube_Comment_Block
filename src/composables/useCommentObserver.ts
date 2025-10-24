import { waitElement } from '@1natsu/wait-element'

export function useCommentObserver(
  commentOuterSelector: string
) {
  const { addObserver, resetObservers } = useObservers()
  const { add: addComment, removeOuter } = useCommentManager()
  const currentScope = ref<ReturnType<typeof effectScope> | null>(null)

  async function init() {
    // 既存のscopeを停止
    currentScope.value?.stop()

    // 新しいscopeを作成
    const scope = effectScope()
    currentScope.value = scope

    // scope内で処理を実行する
    scope.run(async () => {
      // scopeの破棄に伴う処理 asyncを使う場合は非同期処理が始まる前に書く
      onScopeDispose(() => resetObservers())

      const commentOuter: Element | null = await waitElement(commentOuterSelector)
      if (!commentOuter || !(commentOuter instanceof HTMLElement)) return

      const commentObserver: MutationObserver = useCommentWatch(
        commentOuter,
        'ytd-comment-thread-renderer',
        (comment: HTMLElement) => {
          addComment(commentOuter, comment)
          observeReplies(comment)
        }
      )
      addObserver(commentObserver)

      // commentOuterが削除されたらinitを再実行する
      const cleanup = watchElementRemoval(commentOuter, () => {
        removeOuter(commentOuter)
        cleanup?.()
        init()
      })

    })
  }

  function observeReplies(comment: Element) {
    const replyOuter: HTMLElement | null = comment.querySelector<HTMLElement>('#replies #contents')
    if (!replyOuter) return

    const replyObserver: MutationObserver = useCommentWatch(replyOuter, 'ytd-comment-view-model', (reply: HTMLElement) => {
      addComment(replyOuter, reply) //ここはcommentOuterとセットにしたほうがいいかも、要動作確認
    })

    addObserver(replyObserver)

    const cleanup = watchElementRemoval(replyOuter, () => {
      removeOuter(replyOuter)
      cleanup?.()
    })
  }
  return { init }
}
