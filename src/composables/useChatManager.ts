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
  //const ctx = useContentScriptContext()

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
    //mountButton(el, state.author)
  }

  /** outer単位で削除（DOMからouterが削除されたときなど） */
  const removeOuter = (outer: HTMLElement) => {
    allChats.delete(outer)
  }

  /**
   *
   * ========== 各要素にボタンを追加 ==========
   *
   * チャットにボタンを貼り付けるとTailwindCSSが効かないのでスタイルは直接書く
   * ボタンが生えるのは見栄えが悪いので起動方法を考える
   * このあたりが解決したら機能を追加する かも
   *
   *  */

  //const mountButton = (el: HTMLElement, author: string) => {
  //  const anchor = el.querySelector('#content') ?? null
  //  if (!anchor) return
  //
  //  const ui = createIntegratedUi(ctx, {
  //    position: 'inline',
  //    anchor,
  //    append: 'last',
  //    onMount: (container) => {
  //      const app = createApp(UserButtons, {
  //        onClick: () => upsertName(author),
  //      })
  //      app.mount(container)
  //      return app
  //    },
  //    onRemove: (app) => {
  //      if (app) {
  //        app.unmount()
  //      }
  //    },
  //  })
  //  ui.mount()
  //}

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
    if (!opt.enabled) return

    const { author, el } = chat
    const { ignored, byName, bySessionName, byWord } = judge

    el.style.display = ignored ? 'none' : ''

    if (byName) upsertName(author)
    if (bySessionName) upsertSessionName(author)

    if (byWord) {
      handleSensitiveUpsert(author, opt.useWordSensitive, opt.useTemporaryWordSensitive)
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

  /** 表示用: ignored=false のチャットのみ */
  const visibleChats = computed(() => {
    const result: ChatState[] = []
    for (const chats of allChats.values()) {
      for (const chat of chats.values()) {
        if (!judgeChat(chat).ignored) result.push(chat)
      }
    }
    return result
  })

  return {
    add,
    removeOuter,
    allChats,
    visibleChats,
  }
}
