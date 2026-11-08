// Firebase(Firestore + 匿名認証) を、ゲームが使う db / user / room の形に合わせる薄い変換層。
// config.js に firebase 設定がある時だけ、index.html から呼ばれる。
(function () {
  const VER = '11.0.2', BASE = 'https://www.gstatic.com/firebasejs/' + VER + '/';

  async function loadSdk() {
    const [a, b, c] = await Promise.all([
      import(BASE + 'firebase-app.js'), import(BASE + 'firebase-auth.js'), import(BASE + 'firebase-firestore.js')
    ]);
    return { ...a, ...b, ...c };
  }

  function makeDb(F, db) {
    const snapDoc = s => ({ id: s.id, exists: s.exists(), data: () => s.data() });
    const snapQ = s => {
      const docs = s.docs.map(d => ({ id: d.id, exists: true, data: () => d.data() }));
      return { docs, size: docs.length, empty: !docs.length };
    };
    const newId = path => F.doc(F.collection(db, path)).id;
    function col(path, cons = []) {
      const q = () => cons.length ? F.query(F.collection(db, path), ...cons) : F.collection(db, path);
      return {
        path,
        where: (f, op, v) => col(path, [...cons, F.where(f, op, v)]),
        limit: n => col(path, [...cons, F.limit(n)]),
        orderBy: (f, dir) => col(path, [...cons, F.orderBy(f, dir || 'asc')]),
        get: async () => snapQ(await F.getDocs(q())),
        onSnapshot: (next, err) => F.onSnapshot(q(), s => next(snapQ(s)), err),
        doc: id => ref(path + '/' + (id || newId(path))),
        add: async d => { const r = ref(path + '/' + newId(path)); await r.set(d); return r; }
      };
    }
    function ref(path) {
      const id = path.split('/').pop();
      const r = () => F.doc(db, path);
      return {
        id, path,
        get: async () => snapDoc(await F.getDoc(r())),
        set: d => F.setDoc(r(), d),
        update: d => F.updateDoc(r(), d),
        delete: () => F.deleteDoc(r()),
        onSnapshot: (next, err) => F.onSnapshot(r(), s => next(snapDoc(s)), err),
        collection: p => col(path + '/' + p)
      };
    }
    return { doc: p => ref(p), collection: p => col(p) };
  }

  // 在室(presence)と招待(invite)を Firestore のドキュメントで代用する
  function makeRoom(F, db, me) {
    const PRESENCE_TTL = 70000, BEAT = 25000;
    const seen = new Set();
    let docs = [];
    const listeners = [];
    const compute = () => {
      const now = Date.now();
      return docs.filter(d => now - (d.data().ts || 0) < PRESENCE_TTL).map(d => ({ by: d.id, isMe: d.id === me }));
    };
    const fire = () => { const peers = compute(); listeners.forEach(cb => cb({ peers })); };
    let started = false;
    return {
      presence() {
        if (started) return; started = true;
        const pref = F.doc(db, 'presence/' + me);
        const beat = () => F.setDoc(pref, { ts: Date.now() }).catch(() => {});
        beat(); setInterval(beat, BEAT);
        addEventListener('pagehide', () => { F.deleteDoc(pref).catch(() => {}); });
        F.onSnapshot(F.collection(db, 'presence'), s => { docs = s.docs; fire(); }, () => {});
        setInterval(fire, 15000);
      },
      onPeers(cb) { listeners.push(cb); },
      peers() { return compute(); },
      emit(topic, data) {
        const r = F.doc(F.collection(db, 'invites'));
        return F.setDoc(r, { topic, to: (data && data.to) || null, by: me, data: data || null, ts: Date.now() });
      },
      on(topic, cb) {
        F.onSnapshot(F.query(F.collection(db, 'invites'), F.where('to', '==', me)), s => {
          s.docs.forEach(d => {
            if (seen.has(d.id)) return;
            seen.add(d.id);
            const v = d.data();
            F.deleteDoc(d.ref).catch(() => {});
            if (v.topic !== topic || Date.now() - (v.ts || 0) > 60000) return;
            cb({ data: v.data, by: v.by });
          });
        }, () => {});
      }
    };
  }

  window.__fbInit = async function (cfg) {
    const F = window.__fbSdkMock || await loadSdk();
    const app = F.initializeApp(cfg);
    const auth = F.getAuth(app);
    await (auth.authStateReady ? auth.authStateReady() : Promise.resolve());
    const uid = auth.currentUser ? auth.currentUser.uid : (await F.signInAnonymously(auth)).user.uid;
    const db = F.initializeFirestore(app, { ignoreUndefinedProperties: true, experimentalAutoDetectLongPolling: true });
    const dbApi = makeDb(F, db);
    // Googleアカウントとの連携(端末をまたいだ引き継ぎ用)
    window.__fbAuth = {
      info: () => { const u = auth.currentUser; const pd = (u && u.providerData && u.providerData[0]) || null; return { anonymous: !!(u && u.isAnonymous), email: pd ? (pd.email || '') : '' }; },
      async connectGoogle() {
        const provider = new F.GoogleAuthProvider();
        try { await F.linkWithPopup(auth.currentUser, provider); return 'linked'; }
        catch (e) {
          if (e && (e.code === 'auth/credential-already-in-use' || e.code === 'auth/email-already-in-use')) {
            const cred = F.GoogleAuthProvider.credentialFromError(e);
            if (!cred) throw e;
            await F.signInWithCredential(auth, cred);
            return 'switched';
          }
          throw e;
        }
      }
    };
    const room = makeRoom(F, db, uid);
    return {
      use: async name => name === 'db' ? dbApi
        : name === 'user' ? { id: async () => uid, can: async () => true }
        : name === 'room' ? room : null
    };
  };
})();
