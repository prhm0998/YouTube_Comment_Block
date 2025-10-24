import { waitElement } from '@1natsu/wait-element'

export default function useChatObserver() {
  const { addObserver, resetObservers } = useObservers()
  const currentScope = ref<ReturnType<typeof effectScope> | null>(null)
  const { add: addChat, removeOuter } = useChatManager()

  async function init() {
    currentScope.value?.stop()
    currentScope.value = effectScope()
    currentScope.value.run(async () => {
      const chatOuter = await getLiveChatOuter()
      if (!chatOuter) return
      const chatObserver = useChatWatch(chatOuter, 'yt-live-chat-text-message-renderer', (chat: HTMLElement) => {
        addChat(chatOuter, chat)
      })
      addObserver(chatObserver)
      const cleanup = watchElementRemoval(chatOuter, () => {
        removeOuter(chatOuter)
        cleanup?.()
        resetObservers?.()
        init()
      })
    })
  }
  return { init }

}

async function getLiveChatOuter() {
  const iframe = await waitElement<HTMLIFrameElement>('iframe.ytd-live-chat-frame', {
    detector: (el) => {
      const isReady = el instanceof HTMLIFrameElement && el.contentDocument?.body?.children.length
      return isReady ?
        { isDetected: true, result: el } :
        { isDetected: false }
    },
  })
  const iframeDocument = iframe?.contentDocument || iframe?.contentWindow?.document
  if (iframeDocument) {
    return await waitElement<HTMLElement>('#items.yt-live-chat-item-list-renderer', { target: iframeDocument })
  }
}
