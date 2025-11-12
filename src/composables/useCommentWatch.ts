import { sleep, watchElementRemoval } from '@prhm0998/shared/utils'

import { watchElement } from '@/utils/watchElement'

export function useCommentWatch() {
  const { add: addComment, remove: removeComment } = useCommentManager()
  let innerCommentWatchController: (() => void) | null = null

  // コメント欄の外側を取得する
  watchElement(document.body, 'ytd-comments#comments #contents.ytd-item-section-renderer, ytd-shorts ytd-comments #contents.ytd-item-section-renderer', (commentOuter) => {
    const { restart } = watchElement(
      commentOuter, 'ytd-comment-thread-renderer', (comment: HTMLElement) => {
        addComment(comment)
        // コメントに対するリプライも監視する
        observeReplies(comment)
        watchElementRemoval(comment, () => {
          removeComment(comment)
        })
      }, { subtree: false }
    )
    innerCommentWatchController = restart
  })

  function observeReplies(comment: Element) {
    const replyOuter: HTMLElement | null = comment.querySelector<HTMLElement>('#replies #contents')
    if (!replyOuter) return

    watchElement(replyOuter, 'ytd-comment-view-model', (reply: HTMLElement) => {
      addComment(reply)
      watchElementRemoval(reply, () => {
        removeComment(reply)
      })
    }, { subtree: false })

  }

  /**
   * コメントのソートに合わせて中身を再設定します
   * ※ YouTubeのコメントソートがelementの各itemの入れ替えをせずに中身のstateを入れ替えるため
   */
  document.addEventListener(
    'yt-service-request-completed', async () => {
      await sleep(500) // ソートの終わりがわからないのでちょっと待つ
      innerCommentWatchController?.()
    }
  )
}
