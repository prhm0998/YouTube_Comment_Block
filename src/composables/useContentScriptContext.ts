import type { ContentScriptContext } from '#imports'

const ctxRef = ref<ContentScriptContext | null>(null)
export function setContentScriptContext(ctx: ContentScriptContext) {
  ctxRef.value = ctx
}
export function useContentScriptContext(): ContentScriptContext {
  if (!ctxRef.value) {
    throw new Error('ContentScriptContextがセットされていません')
  } return ctxRef.value as ContentScriptContext
}