(() => {
  'use strict';

  const KEY = 'read-at-ten-mobile-v1';
  const $ = (selector, root = document) => root.querySelector(selector);
  const screen = $('#screen');
  const dialog = $('#claim-dialog');
  const settings = $('#settings-dialog');
  const toast = $('#toast');
  const blank = () => ({ started: false, screen: 'home', evidence: {}, claims: {}, ended: null, audioOff: false });
  let state = load();
  let toastTimer;

  const stages = [
    { id: 'I1', title: '22:00の切替', guide: '通知を開き、写真の時計と同じ時刻かを確かめる。', evidence: ['E01', 'E03'], min: 2, question: '午後十時に予定されていたのは？', options: ['公開案内の一時停止', '端末の初期化', '展示の開始'], answer: 0, result: '切替の対象は、まず公開案内だった。' },
    { id: 'I2', title: '消えた範囲', guide: '連絡・索引・地域投稿を見比べ、どこまでが同時に変わったかを調べる。', evidence: ['E02', 'E04', 'E05'], min: 2, question: '公開案内以外に起きたことは？', options: ['私信と投稿も同時に変わった', '会場の照明だけが消えた', '全員が退会した'], answer: 0, result: '停止は公開ページだけに留まっていない。' },
    { id: 'I3', title: '安全のための範囲', guide: '保管庫の同意書と、索引の説明を読む。', evidence: ['E06', 'E07'], min: 2, question: '安全措置の本来の範囲は？', options: ['公開される導線の一時停止', '私信の恒久削除', '端末内の写真の回収'], answer: 0, result: '目的は特定可能な公開導線を抑えることだった。' },
    { id: 'I4', title: '断片が指すもの', guide: '北口通路の写真と、地域投稿の編集前後を照合する。', evidence: ['E08', 'E09'], min: 2, question: 'なぜ公開記録を止める必要があった？', options: ['複数の断片で帰り道が推測できた', '展示作品が壊れた', '電波が止まった'], answer: 0, result: '単独では無害な断片が、組み合わさると導線になる。' },
    { id: 'I5', title: '沈黙の選択', guide: '音声メモの文字起こしと、未送信の下書きを読む。', evidence: ['E10', 'E11'], min: 2, question: '透子の選択として最も近いのは？', options: ['今は公に説明しない', '誰にも知らせず失踪する', '展示を無かったことにする'], answer: 0, result: '沈黙は失踪ではなく、説明を保留する意思だった。' },
    { id: 'I6', title: '広がった権限', guide: '保管ログと変更履歴で、実行者と変更範囲を比べる。', evidence: ['E12', 'E13'], min: 2, question: '同意範囲を越えた変更を実行したのは？', options: ['安全連絡の同期権限', '透子本人の端末操作', '索引の自動更新'], answer: 0, result: '安全のための同期権限が、私信にまで拡張された。' },
    { id: 'I7', title: '届いた理由', guide: '最後の連絡と、保管票の受取先を確かめる。', evidence: ['E14', 'E15'], min: 2, question: 'このアーカイブがあなたに届いた理由は？', options: ['保管権限へ意図的に共有された', '端末が現在地を送信した', '第三者が不正アクセスした'], answer: 0, result: 'これは端末追跡ではなく、保管先を指定した共有だ。' }
  ];

  const meta = {
    home: ['保管された端末', 'ホーム'], inbox: ['連絡箱 / Nami', '連絡'], search: ['灯台室の索引', '索引'], feed: ['MACHI', '地域投稿'],
    photos: ['ローカル写真', '写真'], files: ['保管庫', '保管'], notes: ['未送信', 'メモ'], call: ['再生記録', '音声メモ'], timeline: ['照合ノート', '時系列'], ending: ['保管アーカイブ', '結末']
  };

  function load() {
    try { return { ...blank(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (_) { return blank(); }
  }
  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
  function stageIndex() { return stages.findIndex(stage => !state.claims[stage.id]); }
  function currentStage() { const n = stageIndex(); return n === -1 ? null : stages[n]; }
  function stageAllowed(index) { return index <= stageIndex(); }
  function seen(id) { return Boolean(state.evidence[id]); }
  function observedFor(stage) { return stage.evidence.filter(seen).length; }
  function showToast(message) { clearTimeout(toastTimer); toast.textContent = message; toast.classList.add('show'); toastTimer = setTimeout(() => toast.classList.remove('show'), 2700); }
  function open(app) { state.screen = app; save(); render(); }
  function goHome() { open('home'); }
  function activeTab() { const name = state.screen; return ['home','inbox','search','files','notes'].includes(name) ? name : ''; }
  function escape(text) { const d = document.createElement('div'); d.textContent = text; return d.innerHTML; }

  function evidenceCard(id, title, body, index, action = 'この記録を調査メモへ残す') {
    const locked = !stageAllowed(index);
    const done = seen(id);
    return `<article class="evidence-card ${done ? 'observed' : ''} ${locked ? 'locked' : ''}">
      <div class="evidence-card__meta"><span>${id} / 第${index + 1}章</span><span>${done ? '記録済み' : locked ? '保護中' : '未記録'}</span></div>
      <div class="evidence-card__body"><b>${title}</b><br>${body}</div>
      <button type="button" data-observe="${id}" data-stage="${index}" ${locked ? 'disabled' : ''}>${done ? '✓ 調査メモに記録済み' : locked ? 'この章で開く' : action}</button>
    </article>`;
  }
  function cta() {
    const stage = currentStage();
    if (!stage) return '';
    const amount = observedFor(stage);
    return `<div class="claim-cta"><button type="button" data-claim ${amount < stage.min ? 'disabled' : ''}>${amount < stage.min ? `手掛かりをあと ${stage.min - amount} 件記録する` : `第${stageIndex() + 1}章の照合へ`}</button></div>`;
  }
  function appIcon(app, glyph, label) { return `<button class="app-icon" type="button" data-open="${app}" data-app="${app}"><span>${glyph}</span>${label}</button>`; }

  function renderHome() {
    const stage = currentStage();
    const done = Object.keys(state.claims).length;
    const chips = stages.map((_, i) => `<i class="${i < done ? 'done' : ''}"></i>`).join('');
    const focus = stage ? `<div class="guide"><b>いますること / 第${stageIndex() + 1}章</b><p>${stage.guide}</p></div>` : `<div class="guide"><b>照合完了</b><p>残す記録の形を選んでください。</p></div>`;
    return `<p class="home-title">端末に残った記録を、順番に照合します。</p>
      <section class="case-card"><div class="card-kicker"><span>CASE / READ AT TEN</span><span class="badge">${done}/7 照合済み</span></div><h3>${stage ? stage.title : '保管の判断'}</h3><p>${stage ? '答えを急がず、別の種類の記録を二つ以上比べてください。' : 'すべての照合が終わりました。'}</p><div class="progress-row">${chips}</div></section>
      <div class="section-label"><span>調査の案内</span><button type="button" data-open="timeline">時系列を見る</button></div>${focus}
      <div class="section-label"><span>新しい通知</span><span>${seen('E01') ? '既読' : '1件'}</span></div>
      <div class="notification-list"><button class="notification" type="button" data-open="inbox"><span class="dot">◉</span><span><b>連絡箱</b><p>「10時になったら、表示は消える」</p></span><time>21:59</time></button><button class="notification" type="button" data-open="files"><span class="dot">▤</span><span><b>保管庫</b><p>受取先: ひらくアーカイブ / #118</p></span><time>翌朝</time></button></div>
      <div class="section-label"><span>アプリ</span><span>オフライン</span></div>
      <div class="app-grid">${appIcon('inbox','◉','連絡')}${appIcon('search','⌕','索引')}${appIcon('feed','◌','地域投稿')}${appIcon('photos','▧','写真')}${appIcon('files','▤','保管')}${appIcon('call','◒','音声メモ')}${appIcon('notes','✦','メモ')}${appIcon('timeline','↟','時系列')}</div>${cta()}`;
  }

  function renderInbox() {
    return `<p class="app-intro">共同制作者3人の、展示終了後の連絡。表示された時刻は端末に保存されたものです。</p><div class="thread">
      <div class="thread-break">10月12日　夜</div>
      <div class="message">入口側の案内、いったん非公開になるって。<small>永見 21:57　既読 2</small></div>
      <div class="message me">わかった。外に出る導線の写真だけ、先に下げる。<small>透子 21:58　既読 2</small></div>
      ${evidenceCard('E01','通知の保存内容','「22:00 に公開案内を一時停止します。端末内の会話は対象外です」',0,'通知を記録する')}
      <div class="message">でも、投稿の返事まで見えなくなってる。これは聞いてない。<small>永見 22:09　既読表示なし</small></div>
      ${evidenceCard('E02','既読表示の変化','22:09以降、透子の既読ではなく「保護中」と表示される。公開ページ以外でも変化が起きている。',1,'会話の変化を記録する')}
      ${evidenceCard('E14','最後の連絡','「ひらくアーカイブの118番へ。端末を探さないで、範囲だけを残して」',6,'受取指示を記録する')}
    </div>${cta()}`;
  }

  function renderSearch() {
    return `<div class="search-box"><span>⌕</span><input aria-label="索引を検索" value="灯台室 夜間展示" readonly></div><p class="app-intro" style="margin-top:12px">保存された索引。現在のページと、保管された旧版を切り替えられます。</p>
      <button class="search-result" type="button" data-open="timeline"><small>灯台室 / 版 3 → 4</small><b>夜間展示「水面の手前」 <mark>一時保留</mark></b><p>22:00に切り替わった公開ページ。旧版には「北口側の案内」がある。</p></button>
      ${evidenceCard('E04','索引の旧版','版3には「北口側の案内」。版4では展示名だけが残る。切替と同じ時刻に更新されている。',1,'旧版を比較して記録する')}
      ${evidenceCard('E07','公開停止の説明','索引の注記: 「来場者の導線が推測できる記述を一時的に外します」。対象は公開ページと明記されている。',2,'説明を記録する')}
      ${evidenceCard('E15','保管票 #118','受取先: ひらくアーカイブ。端末からの自動送信ではなく、予約された保管先への共有と記されている。',6,'保管票を記録する')}${cta()}`;
  }

  function renderFeed() {
    return `<div class="feed-tab"><span>近く</span><span style="color:#8590a6;border-color:transparent">保存済み</span></div><p class="app-intro">地域投稿のアプリ。編集前の文章は保管ログから復元されています。</p>
      <article class="post"><span class="avatar">m</span><div><header><b>machi_kitaguchi</b><time>22:04</time></header><p>雨がひどい。<span class="edit">青いリボンの傘</span>、北口通路のベンチに置いてあった。</p><footer>↟ 2　◌ 0　編集済み</footer></div></article>
      ${evidenceCard('E05','投稿の編集履歴','22:04の投稿は22:09に編集され、傘と北口通路に触れた一文だけが消えた。',1,'編集履歴を記録する')}
      <article class="post"><span class="avatar">s</span><div><header><b>slowframe</b><time>21:52</time></header><p>入口の青い扉、写真に残しておく。展示は静かでよかった。</p><footer>↟ 5　◌ 1</footer></div></article>
      ${evidenceCard('E09','位置の組合せ','北口通路・青い傘・入口側の扉という別々の投稿が、帰り道の断片になっていた。',3,'投稿の断片を記録する')}${cta()}`;
  }

  function renderPhotos() {
    return `<p class="app-intro">端末に保存された写真。写真が見えづらい場合も、キャプションから同じ情報を確認できます。</p><div class="photo-grid">
      <button class="photo-tile" type="button" data-open="photo-hall"><img src="assets/images/E03_hall_2200.png" alt="青い扉のあるアートセンターの廊下。時計が10時を指す。"><span>廊下 / 21:58<small>時計・青い扉・入口側</small></span></button>
      <button class="photo-tile" type="button" data-open="photo-passage"><img src="assets/images/E06_passage_2206.png" alt="駅通路のベンチに青いリボンの傘が置かれている。"><span>北口通路 / 22:06<small>傘・ベンチ</small></span></button>
      <button class="photo-tile locked" type="button" disabled><span>展示室 / 保護中<small>第5章で参照</small></span></button>
    </div>${cta()}`;
  }
  function renderPhotoHall() { return `<div class="photo-view"><img src="assets/images/E03_hall_2200.png" alt="青い扉とロッカー、傘立てがある廊下。壁時計は10時を指している。"><div><div class="section-label" style="margin:0 0 8px"><span>21:58 / IMG_4812</span><button type="button" data-open="photos">一覧へ</button></div><p class="caption">保存時刻 21:58。壁時計は22:00を指す。青い扉は入口側、写真内に人物は写っていない。</p></div>${evidenceCard('E03','廊下の時計','通知の予定時刻と、写真に残る時計が同じ22:00を示している。',0,'写真の情報を記録する')}</div>${cta()}`; }
  function renderPhotoPassage() { return `<div class="photo-view"><img src="assets/images/E06_passage_2206.png" alt="雨上がりの駅通路。ベンチに淡い青のリボンが結ばれた紺色の傘が置かれている。"><div><div class="section-label" style="margin:0 0 8px"><span>22:06 / IMG_4817</span><button type="button" data-open="photos">一覧へ</button></div><p class="caption">保存時刻 22:06。北口通路のベンチ。淡い青のリボン付きの傘。これは場所を特定するための情報ではなく、公開断片の重なりを示す記録です。</p></div>${evidenceCard('E08','北口通路の写真','地域投稿にあった青いリボンと北口通路が、別の記録でも確認できる。',3,'写真の情報を記録する')}</div>${cta()}`; }

  function renderFiles() {
    return `<p class="app-intro">保管権限で開かれた文書。元のファイル名と更新日時を維持しています。</p><div class="file-list">
      <button class="file-row" type="button" data-open="consent"><span>▤</span><div><b>安全連絡_同意範囲.pdf</b><small>2024.10.12 / 21:55</small></div><em>開く</em></button>
      <button class="file-row" type="button" data-open="sync"><span>⌗</span><div><b>同期保管ログ.txt</b><small>2024.10.12 / 22:09</small></div><em>開く</em></button>
      <button class="file-row" type="button" data-open="permission"><span>▤</span><div><b>変更権限_履歴.pdf</b><small>2024.10.12 / 22:11</small></div><em>開く</em></button>
    </div>${cta()}`;
  }
  function renderConsent() { return `<div class="paper"><p class="paper-label">灯台室 / 安全連絡票 / 21:55</p><h3>公開案内の一時停止について</h3><p>目的: 来場者と共同制作者の導線を推測できる公開記述を、一時的に非表示にする。</p><p class="redline">対象: イベントページ、公開索引、公開投稿の添付説明<br>対象外: 私信、端末内の写真、個人の下書き</p>${evidenceCard('E06','安全連絡の同意範囲','同意書は公開記述だけを対象にしており、私信や端末内記録は明確に対象外としている。',2,'同意範囲を記録する')}</div>${cta()}`; }
  function renderSync() { return `<div class="paper"><p class="paper-label">SYNC / 保管ログ / 22:09:14</p><h3>連動処理の記録</h3><p>実行: <b>SAFE-LINK / relayer</b><br>根拠: 公開案内の一時停止<br>適用先: public-index, community-post, <span class="redline">private-thread</span></p><p>備考: private-thread は同意書の対象外。手動の例外記録なし。</p>${evidenceCard('E12','同期保管ログ','公開案内を根拠にした同期処理が、private-thread まで適用されている。',5,'同期ログを記録する')}</div>${cta()}`; }
  function renderPermission() { return `<div class="paper"><p class="paper-label">灯台室 / 変更権限 / 22:11</p><h3>実行権限の履歴</h3><p>更新者: 安全連絡担当 / 岸田<br>権限: SAFE-LINK / relayer<br>索引の自動更新: 停止</p><p class="redline">手動拡張: 1件。承認者欄は空欄。</p>${evidenceCard('E13','変更権限の履歴','索引の自動更新ではなく、安全連絡の同期権限が手動で拡張されている。',5,'権限履歴を記録する')}</div>${cta()}`; }

  function renderNotes() { return `<p class="app-intro">透子の未送信下書き。宛先は保管先で、公開先ではありません。</p><div class="note-page"><h3>送らない説明</h3><p>今夜のことを、<span class="underline">誰かの居場所の話にしないでほしい</span>。</p><p>案内を止めることには同意した。でも、会話まで消えるとは聞いていない。私は今は説明を出さない。出さないことと、いなくなったことは違う。</p><p>受取先は、ひらくアーカイブの <b>118</b>。残すなら、範囲だけを残して。</p><small>下書き / 保存 22:17 / 未送信</small></div>${evidenceCard('E11','未送信の下書き','透子は「今は説明を出さない」と明記し、保管先118番を指定している。',4,'下書きを記録する')}${cta()}`; }

  function renderCall() { return `<p class="app-intro">この記録には音声は含まれていません。再生内容の文字起こしだけが保管されています。</p><div class="paper"><p class="paper-label">VOICE NOTE / 00:29 / 22:16</p><h3>文字起こし</h3><p>「ページを止めるのはいい。でも、連絡まで消すのは違う。誰かに今すぐ説明させないで。私は明日、保管の方だけに書くから。」</p><p>［無音 4秒］「探さないで、という意味じゃない。今は見える形にしないでほしい、ということ。」</p>${evidenceCard('E10','ボイスメモの文字起こし','透子は公開説明を保留したいと述べ、失踪や端末追跡を示す内容ではない。',4,'文字起こしを記録する')}</div>${cta()}`; }

  function renderTimeline() {
    const events = [['21:41','共同チャット','透子が案内を共有。'],['21:58','廊下写真','時計と青い扉が保存される。'],['22:00','公開案内の切替','一時停止が予定されていた。'],['22:09','連動した改変','投稿と私信に変化。'],['22:17','保管指示','118番の受取先が残る。']];
    return `<p class="app-intro">確認済みの事実だけを時系列に並べるノート。黄色の印は照合済みです。</p><div class="timeline">${events.map((item, i) => `<div class="timeline-item ${Object.keys(state.claims).length > i ? 'done' : ''}"><time>${item[0]}</time><b>${item[1]}</b><p>${item[2]}</p></div>`).join('')}</div><div class="guide"><b>推理の注意</b><p>この事件は人物の位置を追うためのものではありません。記録がどの範囲まで、誰の判断で変わったかを確かめます。</p></div>${cta()}`;
  }
  function renderEnding() {
    if (state.ended) {
      const result = { restore:['識別できる記録を復元した','検証可能性を優先しました。公開によって再び個人へ結びつく危険も引き受けます。'], preserve:['匿名化した記録を保全した','経緯を残しながら、個人への導線を閉じました。細部の検証可能性は下がります。'], seal:['残る参照を閉じた','現在の静けさを守りました。改変を検証するための公共記録もここで閉じます。'] }[state.ended];
      return `<section class="ending-final"><p class="eyebrow">ARCHIVE CLOSED</p><h3>${result[0]}</h3><p>${result[1]}</p><p style="margin-top:12px">透子が残した問いは、消えた人を探すことではありません。保護のための手続きが、いつ本人の記録まで奪い始めるのかでした。</p></section><div class="section-label"><span>プレイ記録</span><span>7/7 照合済み</span></div><div class="guide"><b>保存について</b><p>進行はこのブラウザ内だけに保存されています。設定から書き出し・読み込み・リセットができます。</p></div>`;
    }
    return `<section class="ending-card"><p class="eyebrow">FINAL DECISION</p><h3>何を残しますか</h3><p>透子の安全、共同制作者への説明、記録の検証可能性は、同時には満たせません。</p><div class="ending-options"><button type="button" data-end="restore"><b>識別できるまま復元する</b><small>説明責任を守る / 再特定の可能性を負う</small></button><button type="button" data-end="preserve"><b>匿名化して保全する</b><small>経緯を残す / 細部の検証可能性を下げる</small></button><button type="button" data-end="seal"><b>参照を閉じる</b><small>現在の安全を守る / 公共の記録を閉じる</small></button></div></section>`;
  }

  function render() {
    const target = state.screen;
    const [kicker, title] = meta[target] || ['保管された端末', '記録'];
    $('#app-kicker').textContent = kicker; $('#app-title').textContent = title;
    $('#back-button').hidden = target === 'home';
    const views = { home:renderHome, inbox:renderInbox, search:renderSearch, feed:renderFeed, photos:renderPhotos, 'photo-hall':renderPhotoHall, 'photo-passage':renderPhotoPassage, files:renderFiles, consent:renderConsent, sync:renderSync, permission:renderPermission, notes:renderNotes, call:renderCall, timeline:renderTimeline, ending:renderEnding };
    screen.innerHTML = (views[target] || renderHome)(); screen.scrollTop = 0;
    document.querySelectorAll('[data-tab]').forEach(button => button.classList.toggle('active', button.dataset.tab === activeTab()));
  }

  function observe(id, index) {
    if (!stageAllowed(Number(index))) { showToast('この記録は、前の照合のあとで開きます。'); return; }
    if (!seen(id)) { state.evidence[id] = new Date().toISOString(); save(); showToast(`記録 ${id} を調査メモへ追加しました。`); render(); }
    else showToast('この記録はすでにメモへ追加されています。');
  }
  function openClaim() {
    const stage = currentStage(); if (!stage || observedFor(stage) < stage.min) return;
    dialog.innerHTML = `<div class="sheet__body"><div class="sheet__handle"></div><p class="eyebrow">照合 / 第${stageIndex() + 1}章</p><h2 id="claim-title">${stage.title}</h2><p>${stage.question}</p><div class="option-list">${stage.options.map((option, i) => `<button type="button" data-answer="${i}">${escape(option)}</button>`).join('')}</div><p class="answer-feedback" id="answer-feedback"></p><div class="sheet-actions"><button type="button" data-close-sheet>あとで確認する</button></div></div>`;
    dialog.showModal();
  }
  function answer(choice) {
    const stage = currentStage(); const feedback = $('#answer-feedback', dialog);
    if (Number(choice) !== stage.answer) { feedback.textContent = 'この解釈は、ほかの記録と一致しません。表示時刻と対象範囲をもう一度比べてください。'; return; }
    state.claims[stage.id] = new Date().toISOString(); save(); dialog.close(); showToast(`照合完了：${stage.result}`); state.screen = currentStage() ? 'home' : 'ending'; save(); render();
  }
  function openSettings() {
    settings.innerHTML = `<div class="sheet__body"><div class="sheet__handle"></div><p class="eyebrow">LOCAL ONLY</p><h2 id="settings-title">端末の設定</h2><p>進行はこのブラウザ内の架空のケースデータとしてのみ保存されます。</p><div class="settings-list"><label>音声なしモード <input id="audio-off" type="checkbox" ${state.audioOff ? 'checked' : ''}></label><button type="button" data-export>進行をファイルに書き出す</button><label>進行を読み込む <input id="import-save" type="file" accept="application/json,.json"></label><button class="danger" type="button" data-reset>このケースの進行をリセット</button></div><div class="sheet-actions"><button type="button" data-close-settings>閉じる</button></div></div>`;
    settings.showModal();
  }
  function exportSave() { const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'read-at-ten-save.json'; a.click(); URL.revokeObjectURL(url); showToast('進行ファイルを書き出しました。'); }
  function importSave(file) { const reader = new FileReader(); reader.onload = () => { try { const next = JSON.parse(String(reader.result)); if (!next || typeof next !== 'object') throw new Error('invalid'); state = {...blank(), ...next}; save(); settings.close(); render(); showToast('進行を読み込みました。'); } catch (_) { showToast('読み込めない進行ファイルです。'); } }; reader.readAsText(file); }

  $('#start-case').addEventListener('click', () => { state.started = true; state.screen = 'home'; save(); $('#welcome').hidden = true; $('#game').hidden = false; render(); });
  $('#back-button').addEventListener('click', goHome);
  $('#utility-button').addEventListener('click', openSettings);
  document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => open(button.dataset.tab)));
  screen.addEventListener('click', event => { const target = event.target.closest('button'); if (!target) return; if (target.dataset.open) open(target.dataset.open); if (target.dataset.observe) observe(target.dataset.observe, target.dataset.stage); if (target.hasAttribute('data-claim')) openClaim(); if (target.dataset.end) { state.ended = target.dataset.end; save(); render(); showToast('選択を保存しました。'); } });
  dialog.addEventListener('click', event => { const target = event.target.closest('button'); if (!target) return; if (target.dataset.answer !== undefined) answer(target.dataset.answer); if (target.hasAttribute('data-close-sheet')) dialog.close(); });
  settings.addEventListener('click', event => { const target = event.target.closest('button'); if (!target) return; if (target.hasAttribute('data-close-settings')) settings.close(); if (target.hasAttribute('data-export')) exportSave(); if (target.hasAttribute('data-reset')) { if (confirm('このブラウザ内の進行だけを最初からやり直しますか？')) { state = blank(); save(); settings.close(); $('#welcome').hidden = false; $('#game').hidden = true; showToast('進行をリセットしました。'); } } });
  settings.addEventListener('change', event => { if (event.target.id === 'audio-off') { state.audioOff = event.target.checked; save(); showToast(state.audioOff ? '音声なしモードを有効にしました。' : '音声なしモードを解除しました。'); } if (event.target.id === 'import-save' && event.target.files[0]) importSave(event.target.files[0]); });
  function updateClock() { const date = new Date(); $('#device-clock').textContent = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`; }
  updateClock(); setInterval(updateClock, 30000);
  if (state.started) { $('#welcome').hidden = true; $('#game').hidden = false; render(); }
})();
