<script setup lang="ts">

/**
 *
 * 動画(ショート含む):
 *  通常の動画: 通常の動画のコメント欄は同じouterをずっと使い回す設計になっている(挙動から確認)
 *  ショート動画: スクロール毎にコメント欄が再生成される(ADが挟まるかどうかも関係する)
 */
const { init } = useCommentObserver(
  'ytd-comments#comments #contents, ytd-shorts ytd-comments #contents'
)
init()

// コメントのソート変更あたりに関連したイベント、他のタイミングでも発動するがとりあえず問題ない。はず。
document.addEventListener(
  'yt-service-request-completed',
  async () => {
    await sleep(300)
    init()
  }
)

/**
 *
 * ライブチャット: アーカイブも捕捉できるはず
 */
const { init: liveInit } = useChatObserver()
liveInit()

</script>
<template>
  <div></div>
</template>
