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
  const chats = reactive(new Map<HTMLElement, ChatState>())

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

  const add = (el: HTMLElement) => {
    if (chats.has(el)) return // 既に登録済みならスキップ

    const state = generateState(el)
    chats.set(el, state)
  }

  const remove = (el: HTMLElement) => {
    chats.delete(el)
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

    // --- 1. 既存 hover イベントを必ず解除
    const existing = hoverHandlers.get(el)
    if (existing) {
      el.removeEventListener('mouseover', existing.onEnter)
      el.removeEventListener('mouseout', existing.onLeave)
      hoverHandlers.delete(el)
    }

    // --- 2. ignored ではない場合
    if (!ignored || !userOption.value.enabledChat) {
      el.style.display = ''
      el.style.opacity = ''
      return
    }

    // --- 3. ignored かつ enabled = true の場合の処理 ---

    // hover 表示が有効の場合
    if (userOption.value.useShowOnHover) {
      el.style.display = ''
      el.style.opacity = '0.05'

      const onEnter = () => {
        el.style.display = ''
        el.style.opacity = '1'
      }

      const onLeave = () => {
        el.style.display = ''
        el.style.opacity = '0.05'
      }

      el.addEventListener('mouseover', onEnter)
      el.addEventListener('mouseout', onLeave)
      hoverHandlers.set(el, { onEnter, onLeave })

      return
    }

    // hover 表示を使わない場合（完全非表示）
    el.style.display = 'none'
    el.style.opacity = ''
  }

  const processChat = (chat: ChatState) => {
    const newJudge = judgeChat(chat)
    if (isEqual(newJudge, chat.prevJudge)) return
    bannedProcess(chat, newJudge)
    chat.prevJudge = newJudge
  }

  // ========== 監視処理 ==========
  watchEffect(() => {
    for (const chat of chats.values()) {
      processChat(chat)
    }
  })

  // optionが変わったら表示の再計算を強制するため、prevJudgeを消去する
  watch(userOption, () => {
    for (const chat of chats.values()) {
      chat.prevJudge = undefined
    }
  })

  return {
    add,
    remove,
    allChats: chats,
  }
}
