import { waitElement } from '@1natsu/wait-element'
import type { DetectorResultType } from '@1natsu/wait-element/detectors'
import { waitElementCycle, watchElement, watchElementRemoval, type WaitElementCycleCallbacks } from '@prhm0998/shared/utils'

// チャット欄の生成を監視する
export function useChatWatch() {
  const { add: addChat, remove: removeChat } = useChatManager()

  // ------------------------
  // 型付き cycler
  // ------------------------
  const cycler: WaitElementCycleCallbacks<HTMLIFrameElement> = {
    onFound: async (iframe) => {
      if (!iframe.contentDocument) return

      // チャット欄の外側を取得
      const chatOuter = await getLiveChatOuter(iframe.contentDocument)

      // 新しいチャット要素を監視
      watchElement(
        chatOuter, 'yt-live-chat-text-message-renderer', (chat: HTMLElement) => {
          addChat(chat)
          watchElementRemoval(chat, () => removeChat(chat))
        }, { subtree: false }
      )
    },
  }

  // detector 関数を変数に保持
  const detector = (el: unknown): DetectorResultType<HTMLIFrameElement> => {
    if (el instanceof HTMLIFrameElement && el.contentDocument?.body?.children.length) {
      return { isDetected: true, result: el }
    }
    return { isDetected: false }
  }

  // ------------------------
  // useWaitElementCycle に渡す
  // ------------------------
  waitElementCycle<HTMLIFrameElement>(
    cycler, 'iframe.ytd-live-chat-frame', {
    detector,
  }
  )
}

async function getLiveChatOuter(iFrameDocument: Document) {
  return await waitElement<HTMLElement>(
    '#items.yt-live-chat-item-list-renderer', { target: iFrameDocument }
  )
}
