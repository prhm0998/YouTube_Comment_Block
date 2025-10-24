/**
 * 指定要素の子要素を監視し、新しいコメントを処理する ※子要素の指定にタグ必須
 */
export default function useCommentWatch(
  targetElement: HTMLElement,
  targetTag: string,
  callback: (element: HTMLElement) => void
): MutationObserver {
  targetElement.querySelectorAll(targetTag).forEach((el) => callback(el as HTMLElement))

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement && node.tagName.toLowerCase() === targetTag) {
          callback(node)
        }
      })
    })
  })

  observer.observe(targetElement, { childList: true })
  return observer
}
