import { normalizedWord } from '@prhm0998/shared/utils'

export interface IgnoreWordReg {
  key: string
  regExp: RegExp
}

/**
 * ignoreWordのMapを使って、keyと対応する正規表現(RegExp)のcomputedRef配列を生成します。
 *
 * @param ignoreWord - Ref<Map<string, IgnoreBase>> 型の引数。無視する単語のリスト。
 * @param option - Ref<UserOption> 型の引数。オプション設定。
 * @returns - IgnoreWordReg[]オブジェクトを作成し、配列として返します。
 *
 * オプションについて：
 * - isCaseInsensitive: trueの場合、正規表現にiフラグを付けて、大文字小文字を区別しません。
 * - isNormalized: trueの場合、keyを正規化して、ひらがなとカタカナの区別をなくします。注意点として、RegExpを使用する際には対象の文字列も正規化する必要があります。
 */

export default function useIgnoreWordsReg(
  ignoreWord: Readonly<Ref<ReadonlyMap<string, IgnoreBase>>>,
  option: Ref<UserOption>
) {
  const ignoreWordReg = computed((): IgnoreWordReg[] =>
    [...ignoreWord.value.keys()].map((key) => {
      const normalizedKey = option.value.useNormalize ? normalizedWord(key) : key
      return {
        key,
        regExp: new RegExp(normalizedKey, option.value.useCaseInsensitive ? 'i' : ''),
      }
    }))

  const isIgnoredWord = (text: string): boolean => {
    const target = option.value.useNormalize ? normalizedWord(text) : text
    return ignoreWordReg.value.some(({ regExp }) => regExp.test(target))
  }
  return { ignoreWordReg, isIgnoredWord }
}
