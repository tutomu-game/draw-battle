// ステージ定義。後ろに足していくだけで、ステージを増やせます。
// topic=お題 / rule=縛りのid(なし=null) / t=[星1, 星2, 星3] の必要点(縛りのボーナス込みの点数)
window.DB_STAGES = [
  { topic: '寝ているネコ', rule: null, t: [9, 14, 18] },
  { topic: '巨大なおにぎり', rule: null, t: [10, 15, 19] },
  { topic: '踊るバナナ', rule: null, t: [10, 15, 19] },
  { topic: 'ジャンプするカエル', rule: 'mono', t: [11, 17, 20] },
  { topic: 'かき氷の富士山', rule: null, t: [11, 16, 20] },
  { topic: '雨宿りするカタツムリ', rule: 'thin', t: [13, 18, 22] },
  { topic: '笑っている目玉焼き', rule: 'tri', t: [12, 18, 21] },
  { topic: 'ペンギンの親子', rule: 'thick', t: [14, 19, 23] },
  { topic: '空飛ぶバス', rule: 'rush', t: [14, 20, 23] },
  { topic: '魔法使いの学校', rule: null, t: [12, 18, 22] },
  { topic: '空を飛ぶブタ', rule: 'nofix', t: [15, 20, 24] },
  { topic: 'かくれんぼ', rule: 'mono', t: [14, 20, 23] },
  { topic: '温泉に入る雪だるま', rule: 'one', t: [17, 22, 26] },
  { topic: '夜の動物園', rule: 'thin', t: [16, 22, 25] },
  { topic: '忍者の宅配便', rule: 'tri', t: [15, 21, 24] },
  { topic: '勇者の引っ越し', rule: 'rush', t: [17, 22, 26] },
  { topic: 'しあわせな気分', rule: 'blind', t: [18, 24, 27] },
  { topic: '雲の上のラーメン屋', rule: 'nofix', t: [17, 23, 26] },
  { topic: '巨大ロボと戦う小学生', rule: 'one', t: [19, 25, 28] },
  { topic: '夢の中の世界', rule: 'blind', t: [19, 25, 28] },
];
