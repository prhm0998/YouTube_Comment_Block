/**
 * 入力された文字列が有効な正規表現（RegExp）としてコンパイルできるかを確認する関数です。
 *
 * @param input 確認対象の文字列
 * @returns 有効な正規表現であれば true、文法エラーがあれば false を返します。
 * @throws SyntaxError 以外の予期せぬエラーが発生した場合、そのエラーを再スローします。
 */
export default function isValidRegex(input: string): boolean {
  try {
    // new RegExp() で正規表現オブジェクトの作成を試みます。
    // 無効な正規表現パターンであれば SyntaxError がスローされます。
    new RegExp(input)

    // エラーがスローされなければ、有効な正規表現です。
    return true
  }
  catch (e) {
    // 発生したエラーが SyntaxError であるかを確認します。
    if (e instanceof SyntaxError) {
      // SyntaxError の場合、無効な正規表現と判断し false を返します。
      return false
    }
    else {
      // SyntaxError 以外の予期せぬエラー（メモリ不足など）の場合は、
      // 処理を止めずにそのエラーをそのままスローします。
      throw e
    }
  }
}