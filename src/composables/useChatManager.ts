import { isEqual } from 'ohash'

interface ChatState {
  el: HTMLElement
  author: string
  message: string
  prevJudge?: ChatJudgeResult
}

interface ChatJudgeResult {
  ignored: boolean
  byName: boolean
  bySessionName: boolean
  byWord: boolean
}

export default function useChatManager() {
  /** outerごとにコメントを管理 */
  const allChats = reactive(new Map<HTMLElement, Map<HTMLElement, ChatState>>())

  /** 各種 state とユーティリティ */
  const { state: userOption } = useUserOption()
  const { state: ignoreWord } = useIgnore('local:Word')
  const { state: ignoreName, upsert: upsertName } = useIgnore('local:Name')
  const { state: ignoreSessionName, upsert: upsertSessionName } = useIgnore('session:Name')
  const { isIgnoredWord } = useIgnoreWordsReg(ignoreWord, userOption)
  const hoverHandlers = new WeakMap<HTMLElement, { onEnter: () => void, onLeave: () => void }>()

  // ========== State生成 ==========

  const generateState = (el: HTMLElement): ChatState => {
    const author = el.querySelector('span#author-name')?.textContent?.trim() ?? ''
    const message = el.querySelector('span#message')?.textContent?.trim() ?? ''
    return { el, author, message }
  }

  // ========== 登録・削除 ==========

  const add = (outer: HTMLElement, el: HTMLElement) => {
    let chats = allChats.get(outer)
    if (!chats) {
      chats = reactive(new Map())
      allChats.set(outer, chats)
    }
    if (chats.has(el)) return // 既に登録済みならスキップ

    const state = generateState(el)
    chats.set(el, state)
  }

  /** outer単位で削除（DOMからouterが削除されたときなど） */
  const removeOuter = (outer: HTMLElement) => {
    allChats.delete(outer)
  }

  // ========== 判定 ==========

  const judgeChat = (chat: ChatState): ChatJudgeResult => {
    const byName = ignoreName.value.has(chat.author)
    const bySessionName = ignoreSessionName.value.has(chat.author)
    const byWord = isIgnoredWord(chat.message)
    return {
      ignored: byName || bySessionName || byWord,
      byName,
      bySessionName,
      byWord,
    }
  }

  // ========== 個別処理 ==========

  const handleSensitiveUpsert = (
    author: string,
    isPermanent: boolean,
    isTemporary: boolean
  ) => {
    if (isPermanent) upsertName(author)
    else if (isTemporary) upsertSessionName(author)
  }

  const bannedProcess = (chat: ChatState, judge: ChatJudgeResult) => {
    const opt = userOption.value

    const { author, el } = chat
    const { ignored, byName, bySessionName, byWord } = judge

    commentStyling(el, ignored)

    if (byName) upsertName(author)
    if (bySessionName) upsertSessionName(author)

    if (byWord) {
      handleSensitiveUpsert(author, opt.useWordSensitive, opt.useTemporaryWordSensitive)
    }
  }

  const commentStyling = (el: HTMLElement, ignored: boolean) => {
    if (ignored && userOption.value.enabledChat) {
      if (userOption.value.useShowOnHover) {
        el.style.display = ''
        el.style.opacity = '0.05'
      }
      else {
        el.style.display = 'none'
        el.style.opacity = ''
      }

      if (!hoverHandlers.has(el)) {
        const onEnter = () => {
          if (userOption.value.useShowOnHover) {
            el.style.opacity = '1'
            el.style.display = ''
          }
        }
        const onLeave = () => {
          if (userOption.value.useShowOnHover) {
            el.style.opacity = '0.05'
            el.style.display = ''
          }
        }
        el.addEventListener('mouseover', () => {
          onEnter()
        })
        el.addEventListener('mouseout', () => {
          onLeave()
        })
        hoverHandlers.set(el, { onEnter, onLeave })
      }
    }
    else {
      // ===== 通常表示状態 =====
      el.style.opacity = ''
      el.style.transition = ''
      el.style.display = ''
    }
  }

  const processChat = (chat: ChatState) => {
    const newJudge = judgeChat(chat)
    if (isEqual(newJudge, chat.prevJudge)) return
    bannedProcess(chat, newJudge)
    chat.prevJudge = newJudge
  }

  // ========== 監視処理 ==========
  watchEffect(() => {
    for (const chats of allChats.values()) {
      for (const chat of chats.values()) {
        processChat(chat)
      }
    }
  })

  // optionが変わったら表示の再計算を強制するため、prevJudgeを消去する
  watch(userOption, () => {
    for (const chats of allChats.values()) {
      for (const chat of chats.values()) {
        chat.prevJudge = undefined
      }
    }
  })

  return {
    add,
    removeOuter,
    allChats,
  }
}
