# お絵描きバトル（Web版）

お題を制限時間内に描いて、AI審査員が採点するパーティーゲーム。スマホ向け。

- 遊び方: 1人プレイ（縛りチャレンジ / AIに当てさせろ）、1台で2〜4人対戦
- AI審査: Gemini（無料枠）を中継Worker経由で利用
- 無料枠が尽きたとき: 画面に「AIの無料枠が尽きました」と表示。対戦は「みんなの投票」で続行可能
- オンライン対戦・友達登録: Firebase（無料枠）を利用。設定は下の「オンライン対戦の設定」

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

## オンライン対戦の設定（Firebase）
1. Firebaseコンソールでプロジェクトを作成（Googleアナリティクスはオフでよい）
2. Authentication → ログイン方法 → **匿名** を有効にする
3. Firestore Database を作成（本番環境モード）し、「ルール」に `firestore.rules` の内容を貼って公開
4. プロジェクトの設定 → マイアプリ → ウェブアプリを登録し、表示される設定値を `config.js` の `firebase` に貼る
5. Authentication → 設定 → **承認済みドメイン** に `tutomu-game.github.io` を追加

### 注意
- 友達のアカウントは、端末ごとの匿名ログインです。ブラウザのデータを消すと別人として扱われます。
- 無料枠（Spark）には1日あたりの読み書き回数の上限があります。
- 名前と友達コードは、サインインした全員が読めます（友達コードで検索するため）。個人情報は入れないでください。
