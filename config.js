// 中継Worker(Cloudflare)のURLと、Firebase(オンライン対戦用)の設定
// ※ Firebaseのウェブ用設定値は公開前提の値です。守っているのはFirestoreのルールと匿名ログインです。
window.DRAW_CONFIG = {
  relayUrl: "https://draw-battle-relay.tokushi-gm.workers.dev",
  firebase: {
    apiKey: "AIzaSyAYivFBbXVJxEsuQx4TDDIXZt2KHCM4nRI",
    authDomain: "draw-battle-d6633.firebaseapp.com",
    projectId: "draw-battle-d6633",
    storageBucket: "draw-battle-d6633.firebasestorage.app",
    messagingSenderId: "493567253796",
    appId: "1:493567253796:web:d6775bbeb36304a4e867b1"
  }
};
