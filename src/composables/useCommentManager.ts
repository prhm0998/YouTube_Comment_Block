import { isEqual } from 'ohash'

import UserButtons from '@/components/external/UserButtons.vue'

interface CommentState {
  el: HTMLElement
  author: string
  message: string
  mentions: string[]
  prevJudge?: CommentJudgeResult
}

interface CommentJudgeResult {
  ignored: boolean
  byName: boolean
  bySessionName: boolean
  byMention: boolean
  byWord: boolean
}

export default function useCommentManager() {
  /** outerごとにコメントを管理 */
  const allComments = reactive(new Map<HTMLElement, Map<HTMLElement, CommentState>>())

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

  const add = (outer: HTMLElement, el: HTMLElement) => {
    let comments = allComments.get(outer)
    if (!comments) {
      comments = reactive(new Map())
      allComments.set(outer, comments)
    }
    if (comments.has(el)) return

    const state = generateState(el)
    comments.set(el, state)

    mountButton(el, state.author)
  }

  const removeOuter = (outer: HTMLElement) => {
    allComments.delete(outer)
  }

  // ========== 各要素にボタンを追加 ==========

  const mountButton = (el: HTMLElement, author: string) => {
    const anchor = el.querySelector('#body.ytd-comment-view-model ytd-comment-engagement-bar #toolbar') ?? null
    if (!anchor) return

    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      anchor,
      append: 'last',
      onMount: (container) => {
        const app = createApp(UserButtons, {
          onClick: () => upsertName(author),
        })
        app.mount(container)
        return app
      },
      onRemove: (app) => {
        if (app) {
          app.unmount()
        }
      },
    })
    ui.mount()
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
    for (const comments of allComments.values()) {
      for (const comment of comments.values()) {
        processComment(comment)
      }
    }
  })

  // optionが変わったら表示の再計算を強制するため、prevJudgeを消去する
  watch(userOption, () => {
    for (const comments of allComments.values()) {
      for (const comment of comments.values()) {
        comment.prevJudge = undefined
      }
    }
  })

  // ========== 返却 ==========

  return {
    add,
    removeOuter,
    allComments,
  }
}
