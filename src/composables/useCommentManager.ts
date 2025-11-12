import { isEqual } from 'ohash'

import UserButtons from '@/components/external/UserButtons.vue'

interface CommentState {
  el: HTMLElement
  author: string
  message: string
  mentions: string[]
  prevJudge?: CommentJudgeResult
  app?: ReturnType<typeof createApp> | null
}

interface CommentJudgeResult {
  ignored: boolean
  byName: boolean
  bySessionName: boolean
  byMention: boolean
  byWord: boolean
}

export default function useCommentManager() {
  const comments = reactive(new Map<HTMLElement, CommentState>())

  /** 各種 state とユーティリティ */
  const { state: userOption } = useUserOption()
  const { state: ignoreWord } = useIgnore('local:Word')
  const { state: ignoreName, upsert: upsertName } = useIgnore('local:Name')
  const { state: ignoreSessionName, upsert: upsertSessionName } = useIgnore('session:Name')
  const { isIgnoredWord } = useIgnoreWordsReg(ignoreWord, userOption)
  const ctx = useContentScriptContext()

  // ========== State生成 ==========

  const generateState = (el: HTMLElement): CommentState => {
    const author = el.querySelector('#author-text span')?.textContent?.trim() ?? ''
    const { message, mentions } = extractBody(el)
    return { el, author, message, mentions }
  }

  const extractBody = (el: HTMLElement) => {
    const body = el.querySelector('#content-text span')
    if (!body) return { message: '', mentions: [] }
    return parseNodes(body.childNodes)
  }

  const parseNodes = (nodes: NodeList): { message: string, mentions: string[] } => {
    const mentions = new Set<string>()
    let message = ''
    nodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        message += node.textContent?.trim() ?? ''
      }
      else if (node instanceof HTMLElement && node.tagName === 'SPAN') {
        node.querySelectorAll('a[href^="/channel/"]').forEach((a) => {
          const name = a.textContent?.trim()
          if (name) mentions.add(name)
        })
      }
    })
    return { message, mentions: [...mentions] }
  }

  // ========== 登録・削除 ==========

  const add = (el: HTMLElement) => {
    // すでに登録済みの場合は削除して再登録
    if (comments.has(el)) {
      const prev = comments.get(el)!
      if (prev.app) {
        prev.app.unmount()
        prev.app = undefined
      }
      comments.delete(el)
    }

    const state = generateState(el)
    comments.set(el, state)

    // マウントして app を保持
    state.app = mountButton(el, state.author)
  }

  const remove = (outer: HTMLElement) => {
    comments.delete(outer)
  }

  // ========== 各要素にボタンを追加 ==========

  const mountButton = (el: HTMLElement, author: string) => {
    const anchor = el.querySelector('#body.ytd-comment-view-model ytd-comment-engagement-bar #toolbar') ?? null
    if (!anchor) return

    let appInstance: ReturnType<typeof createApp> | null = null

    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      anchor,
      append: 'last',
      onMount: (container) => {
        appInstance = createApp(UserButtons, {
          name: author,
          onClick: () => upsertName(author),
        })
        appInstance.mount(container)
        return appInstance
      },
      onRemove: (app) => {
        if (app) {
          app.unmount()
        }
      },
    })
    ui.mount()

    return appInstance
  }

  // ========== 判定 ==========

  const judgeComment = (comment: CommentState): CommentJudgeResult => {
    const byName = ignoreName.value.has(comment.author)
    const bySessionName = ignoreSessionName.value.has(comment.author)
    const byWord = isIgnoredWord(comment.message)
    const byMention = comment.mentions.some(
      (id) => ignoreName.value.has(id) || ignoreSessionName.value.has(id)
    )

    return {
      ignored: byName || bySessionName || byWord || byMention,
      byName,
      bySessionName,
      byWord,
      byMention,
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

  const bannedProcess = (comment: CommentState, judge: CommentJudgeResult) => {
    const opt = userOption.value

    const { author, el } = comment
    const { ignored, byName, bySessionName, byWord, byMention } = judge

    const isHidden = userOption.value.enabled && ignored
    el.style.display = isHidden ? 'none' : ''

    if (byName) upsertName(author)
    if (bySessionName) upsertSessionName(author)

    if (byWord) {
      handleSensitiveUpsert(author, opt.useWordSensitive, opt.useTemporaryWordSensitive)
    }

    if (byMention) {
      handleSensitiveUpsert(author, opt.useMentionSensitive, opt.useTemporaryMentionSensitive)
    }
  }

  const processComment = (comment: CommentState) => {
    const newJudge = judgeComment(comment)
    if (isEqual(newJudge, comment.prevJudge)) return
    bannedProcess(comment, newJudge)
    comment.prevJudge = newJudge
  }

  // ========== 監視処理 ==========

  watchEffect(() => {
    for (const comment of comments.values()) {
      processComment(comment)
    }
  })

  // optionが変わったら表示の再計算を強制するため、prevJudgeを消去する
  watch(userOption, () => {
    for (const comment of comments.values()) {
      comment.prevJudge = undefined
    }
  })

  // ========== 返却 ==========

  return {
    add,
    remove,
    allComments: comments,
  }
}
