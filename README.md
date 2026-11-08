# お絵描きバトル（Web版）

お題を制限時間内に描いて、AI審査員が採点するパーティーゲーム。スマホ向け。

- 遊び方: 1人プレイ（縛りチャレンジ / AIに当てさせろ）、1台で2〜4人対戦
- AI審査: Gemini（無料枠）を中継Worker経由で利用
- 無料枠が尽きたとき: 画面に「AIの無料枠が尽きました」と表示。対戦は「みんなの投票」で続行可能
- オンライン対戦: 準備中（段階2）

## セットアップ

### 1. Gemini APIキー
Google AI Studio でAPIキーを作成（カード不要）。**キーはリポジトリに書かない。**

### 2. 中継Worker（Cloudflare）
```
cd worker
npx wrangler login
# wrangler.toml の ALLOWED_ORIGIN を https://<GitHubユーザー名>.github.io に変更
npx wrangler secret put GEMINI_API_KEY    # 貼り付けて Enter
npx wrangler deploy
```
表示された `https://draw-battle-relay.<あなた>.workers.dev` をメモ。

### 3. ゲーム側の接続
`config.js` の `relayUrl` に、上のWorkerのURLを入れる。

### 4. GitHub Pages
リポジトリの Settings → Pages → Branch: main / root で公開。

## 注意
- Gemini無料枠に送った絵は、Googleのサービス改善に使われます。
- 公開URLを知っている人は誰でもWorkerを叩けます。Workerは Origin 制限とIPごとの回数制限をかけていますが、無料枠が尽きやすい点は想定しておいてください。
