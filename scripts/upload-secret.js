import { Octokit } from '@octokit/rest'
import fs from 'fs'
import dotenv from 'dotenv'
import sodium from 'libsodium-wrappers'

dotenv.config()

const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = process.env
const FILE_PATH = '.env.submit'
const secret_name = FILE_PATH.toUpperCase().replace(/\./g, '_') // _ENV_SUBMIT になる

const octokit = new Octokit({ auth: GITHUB_TOKEN })

async function main() {
  if (!fs.existsSync(FILE_PATH)) {
    console.error(`❌ エラー: ファイル ${FILE_PATH} が見つかりません。`)
    process.exit(1)
  }

  const content = fs.readFileSync(FILE_PATH, 'utf8')

  const { data: publicKeyData } = await octokit.actions.getRepoPublicKey({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
  })

  const { key: publicKey, key_id } = publicKeyData
  console.log('🔑 公開鍵を取得:', key_id)

  const encrypted_value = await encryptSecret(publicKey, content)

  console.log(`🚀 Secret を更新中: ${secret_name}`)

  await octokit.actions.createOrUpdateRepoSecret({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    secret_name,
    encrypted_value,
    key_id,
  })

  console.log(`✅ Secret "${secret_name}" を正常に更新しました。`)
}

main().catch((err) => {
  console.error('❌ Error updating secrets:', err)
  process.exit(1)
})

async function encryptSecret(publicKey, secretValue) {
  await sodium.ready
  const binkey = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL)
  const binsec = sodium.from_string(secretValue)
  const encryptedBytes = sodium.crypto_box_seal(binsec, binkey)
  return sodium.to_base64(encryptedBytes, sodium.base64_variants.ORIGINAL)
}
