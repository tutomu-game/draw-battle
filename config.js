// 中継Worker(Cloudflare)のURLと、Firebase(オンライン対戦用)の設定
window.DRAW_CONFIG = {
  relayUrl: "https://draw-battle-relay.tokushi-gm.workers.dev",
  // Firebaseの「ウェブアプリ」設定値を貼る。例:
  // firebase: { apiKey: "...", authDomain: "...", projectId: "...", appId: "..." }
  firebase: null
};
