import { sleep, watchElementRemoval, watchElement, waitElementCycle } from '@prhm0998/shared/utils'
import type { WaitElementCycleCallbacks } from '@prhm0998/shared/utils'

// ------------------------------
// 共通: コメントのリプライを監視
// ------------------------------
function observeReplies(
  comment: Element,
  addComment: (el: HTMLElement) => void,
  removeComment: (el: HTMLElement) => void
) {
  const replyOuter = comment.querySelector<HTMLElement>('#replies #contents')
  if (!replyOuter) return

  watchElement(
    replyOuter, 'ytd-comment-view-model', (reply: HTMLElement) => {
      addComment(reply)
      watchElementRemoval(reply, () => removeComment(reply))
    }, { subtree: false }
  )
}

// ------------------------------
// 共通: commentOuter 内のコメントを監視し、
// YouTube側のソートイベント時に連動してrestart()する
// ------------------------------
function setupCommentOuterWatch(
  commentOuter: HTMLElement,
  addComment: (el: HTMLElement) => void,
  removeComment: (el: HTMLElement) => void
) {
  // コメント本体 (ytd-comment-thread-renderer) の監視
  const { restart } = watchElement(
    commentOuter, 'ytd-comment-thread-renderer', (comment: HTMLElement) => {
      addComment(comment)
      observeReplies(comment, addComment, removeComment)
      watchElementRemoval(comment, () => removeComment(comment))
    }, { subtree: false }
  )

  // ソート完了イベント → restart()
  const onSortCompleted = async () => {
    await sleep(500)
    restart()
  }

  // イベント登録 ※ これはsort完了専用のイベントではないが、このタイミングで問題ない
  document.addEventListener('yt-service-request-completed', onSortCompleted)

  // commentOuter が消えたらイベント解除
  watchElementRemoval(commentOuter, () => {
    document.removeEventListener('yt-service-request-completed', onSortCompleted)
  })
}

// ------------------------------
// 動画ページのコメント欄監視サイクル
// ------------------------------
export function useVideoWatch() {
  const { add: addComment, remove: removeComment } = useCommentManager()

  const cycler: WaitElementCycleCallbacks<HTMLElement> = {
    onFound: (commentOuter) => {
      setupCommentOuterWatch(commentOuter, addComment, removeComment)
    },
  }

  waitElementCycle(
    cycler, 'ytd-comments#comments #contents.ytd-item-section-renderer'
  )
}

// ------------------------------
// ショート動画のコメント欄監視サイクル
// ------------------------------
export function useShortWatch() {
  const { add: addComment, remove: removeComment } = useCommentManager()

  const cycler: WaitElementCycleCallbacks<HTMLElement> = {
    onFound: (commentOuter) => {
      setupCommentOuterWatch(commentOuter, addComment, removeComment)
    },
    onRemove: () => { },
  }

  waitElementCycle(
    cycler, 'ytd-shorts ytd-comments #contents.ytd-item-section-renderer'
  )
}

// ------------------------------
// useCommentWatch
// ------------------------------
export function useCommentWatch() {
  useVideoWatch()
  useShortWatch()
}
