(function () {
  "use strict";

  const A = VDMApp;
  const D = A.read("messages", {});
  const I = VDMIcons;
  const ATT = VDMLocalAttachment;
  const root = document.getElementById("app-body");
  const conversations = Array.isArray(D.conversations) ? D.conversations : [];
  const brand = Object.assign({ name: "Link", description: "メッセージと通話", accent: "#287c78", mark: "link" }, A.brand || {});
  const defaults = {
    tab: "chats",
    active: null,
    mobile: "list",
    localMessages: {},
    read: {},
    unsent: [],
    drafts: {},
    quoteDrafts: {},
    pendingAttachments: [],
    typingConversationId: null,
    conversationQuery: "",
    contactQuery: "",
    callFilter: "all",
    calls: [],
    activeCall: null,
    voicemailPlayback: {},
    attachmentMenu: false,
    messageMenu: null,
    detailsOpen: false,
    chatSearchOpen: false,
    chatQuery: "",
    localNotice: ""
  };
  const S = A.appState(defaults);
  Object.keys(defaults).forEach((key) => {
    if (S[key] == null) S[key] = defaults[key];
  });
  document.documentElement.style.setProperty("--link-accent", brand.accent || "#287c78");
  A.frame(brand.name, brand.description);

  let callTimer = 0;
  const icon = (name, className) => I.icon(name, className);
  const save = () => A.saveAppState(S);
  const conversation = (id) => conversations.find((item) => item.id === id);
  const nowTime = () => new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit" }).format(new Date());
  const nowDate = () => new Intl.DateTimeFormat("ja-JP", { month: "short", day: "numeric" }).format(new Date());
  const messageText = (message) => String(message && (message.text || message.body) || "");
  const initials = (value) => String(value || "?").trim().slice(0, 1).toUpperCase();
  const avatar = (name, tone, large) => '<span class="link-avatar' + (large ? ' link-avatar--large' : '') + '" data-tone="' + A.esc(String(tone || 0)) + '" aria-hidden="true">' + A.esc(initials(name)) + '</span>';
  const formatStamp = (value) => {
    if (!value) return "";
    if (/^\d\d?:\d\d$/.test(String(value))) return String(value);
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
  };

  function allMessages(item) {
    if (!item) return [];
    return [...(item.messages || []), ...(S.localMessages[item.id] || [])];
  }

  function unreadCount(item) {
    return allMessages(item).filter((message) => message.sender !== "me" && !S.read[message.id]).length;
  }

  function previewText(message) {
    if (!message) return "まだメッセージはありません";
    if (S.unsent.includes(message.id) || message.type === "unsent") return "メッセージの送信を取り消しました";
    const attachment = (message.attachments || [message.attachment]).filter(Boolean)[0];
    if (attachment) return ({ image: "写真", audio: "音声", file: "ファイル", text: "ファイル" })[attachment.kind || attachment.type] || "添付ファイル";
    return messageText(message) || (message.type === "system" ? "システムメッセージ" : "通知");
  }

  function markConversationRead(item) {
    if (!item) return;
    let changed = false;
    allMessages(item).forEach((message) => {
      if (message.sender !== "me" && !S.read[message.id]) {
        S.read[message.id] = true;
        changed = true;
      }
    });
    if (changed) save();
  }

  function railButton(id, label, iconName, badge) {
    const active = S.tab === id;
    return '<button class="link-rail-button" type="button" data-tab="' + id + '" aria-label="' + A.esc(label) + '" aria-current="' + (active ? 'page' : 'false') + '">' +
      icon(iconName) + '<span>' + A.esc(label) + '</span>' + (badge ? '<b class="link-rail-badge">' + badge + '</b>' : '') + '</button>';
  }

  function rail() {
    const unread = conversations.reduce((sum, item) => sum + unreadCount(item), 0);
    const missed = callRows().filter((item) => item.status === "missed").length;
    return '<nav class="link-apprail" aria-label="' + A.esc(brand.name) + ' の機能">' +
      '<div class="link-brand" aria-label="' + A.esc(brand.name) + '"><span class="link-brand-mark">' + icon("chat") + '</span><strong>' + A.esc(brand.name) + '</strong></div>' +
      '<div class="link-rail-main">' +
      railButton("chats", "トーク", "chat", unread) +
      railButton("calls", "通話", "call", missed) +
      railButton("contacts", "連絡先", "contacts", 0) +
      railButton("saved", "保存済み", "saved", 0) +
      '</div>' +
      '<div class="link-local-user">' + avatar(D.viewer && D.viewer.name || "Local", 5) + '<span><strong>' + A.esc(D.viewer && D.viewer.name || "ローカル利用者") + '</strong><small>この端末のみ</small></span></div>' +
      '</nav>';
  }

  function conversationList() {
    const sorted = [...conversations].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
    const rows = sorted.map((item, index) => {
      const messages = allMessages(item);
      const last = messages[messages.length - 1];
      const unread = unreadCount(item);
      const active = S.active === item.id;
      const stateLabel = [item.pinned ? "ピン留め" : "", item.muted ? "ミュート" : "", unread ? unread + "件の未読" : ""].filter(Boolean).join("、");
      return '<button class="conversation-row" type="button" data-conversation="' + A.esc(item.id) + '" aria-current="' + (active ? 'true' : 'false') + '" aria-label="' + A.esc(item.name + (stateLabel ? '、' + stateLabel : '')) + '">' +
        avatar(item.name, item.tone == null ? index : item.tone) +
        '<span class="conversation-copy"><span class="conversation-name"><strong>' + A.esc(item.name) + '</strong><span class="conversation-flags">' + (item.pinned ? icon("pin") : "") + (item.muted ? icon("mute") : "") + '</span></span><small>' + A.esc(previewText(last)) + '</small></span>' +
        '<span class="conversation-side"><time>' + A.esc(formatStamp(last && (last.time || last.createdAt) || item.updatedAt)) + '</time>' + (unread ? '<b class="conversation-unread">' + unread + '</b>' : '') + '</span>' +
        '</button>';
    }).join("");
    return '<section class="conversation-pane ' + (S.mobile === "list" && S.tab === "chats" ? 'mobile-active' : '') + '" aria-label="会話一覧">' +
      '<header class="conversation-pane-head"><div><h1>トーク</h1><small>' + conversations.length + '件</small></div><div class="header-actions"><button class="link-icon-button" type="button" data-new-chat aria-label="新しい会話">' + icon("compose") + '</button><button class="link-icon-button" type="button" data-local-menu aria-label="メニュー">' + icon("more") + '</button></div></header>' +
      '<label class="link-search">' + icon("search") + '<span class="sr-only">会話を検索</span><input type="search" data-conversation-search value="' + A.esc(S.conversationQuery) + '" placeholder="会話を検索"></label>' +
      '<div class="conversation-scroll" data-conversation-rows>' + (rows || '<div class="link-empty"><strong>トークはありません</strong><p>連絡先からローカル会話を始められます。</p></div>') + '</div>' +
      '<p class="link-local-note">' + icon("local") + ' 外部には送信されません</p>' +
      '</section>';
  }

  function messageAttachments(message) {
    const attachments = (message.attachments || [message.attachment]).filter(Boolean);
    if (!attachments.length) return "";
    return '<div class="message-attachments">' + attachments.map((item, index) => {
      const kind = item.kind || item.type;
      if (item.loadError) {
        return '<div class="message-file is-error" role="status"><span>' + icon("info") + '</span><span><strong>' + A.esc(item.name || "添付ファイル") + '</strong><small>' + A.esc(item.loadError) + '</small></span></div>';
      }
      if (kind === "image") {
        return '<button class="message-image" type="button" data-message-attachment="' + A.esc(message.id) + '" data-attachment-index="' + index + '"><img src="' + A.esc(item.src || item.data) + '" alt="' + A.esc(item.alt || item.name || "添付画像") + '"><span>画像を開く</span></button>';
      }
      const label = kind === "audio" ? "音声" : "ファイル";
      const iconName = kind === "audio" ? "audio" : "file";
      return '<button class="message-file" type="button" data-message-attachment="' + A.esc(message.id) + '" data-attachment-index="' + index + '"><span>' + icon(iconName) + '</span><span><strong>' + A.esc(item.name || label) + '</strong><small>' + A.esc(label + (item.size ? ' · ' + Math.max(1, Math.ceil(item.size / 1024)) + ' KiB' : '')) + '</small></span>' + icon("play") + '</button>';
    }).join("") + '</div>';
  }

  function messageItem(message, previous, item) {
    const mine = message.sender === "me";
    const grouped = previous && previous.sender === message.sender && previous.type !== "system" && message.type !== "system";
    const cancelled = S.unsent.includes(message.id) || message.type === "unsent";
    if (message.type === "system" || message.system) return '<p class="message-system" data-message="' + A.esc(message.id) + '">' + A.esc(messageText(message)) + '</p>';
    if (message.type === "notification-remnant") return '<article class="notification-remnant" data-message="' + A.esc(message.id) + '">' + icon("notification") + '<span><strong>' + A.esc(message.title || "通知") + '</strong><small>' + A.esc(messageText(message)) + '</small></span></article>';
    const quote = message.quoteId ? allMessages(item).find((candidate) => candidate.id === message.quoteId) : null;
    const menuOpen = S.messageMenu === message.id;
    return '<article class="message-row ' + (mine ? 'is-me ' : 'is-them ') + (grouped ? 'is-grouped ' : '') + (cancelled ? 'is-cancelled' : '') + '" data-message="' + A.esc(message.id) + '">' +
      (!mine && !grouped ? avatar(item.name, item.tone) : '<span class="message-avatar-space" aria-hidden="true"></span>') +
      '<div class="message-stack">' +
      '<div class="message-bubble">' +
      (quote ? '<button type="button" class="message-quote" data-jump-message="' + A.esc(quote.id) + '"><strong>' + A.esc(quote.sender === "me" ? "あなた" : item.name) + '</strong><span>' + A.esc(previewText(quote)) + '</span></button>' : message.quoteId ? '<div class="message-quote is-missing"><strong>参照できないメッセージ</strong><span>引用元は残っていません</span></div>' : '') +
      (cancelled ? '<p class="unsent-copy">メッセージの送信を取り消しました</p>' : '<p>' + A.esc(messageText(message)) + '</p>' + messageAttachments(message)) +
      '</div>' +
      '<div class="message-meta">' + (mine ? '<span>' + (S.read[message.id] ? '既読' : '送信済み') + '</span>' : '') + '<time>' + A.esc(message.time || formatStamp(message.createdAt)) + '</time></div>' +
      '</div>' +
      '<div class="message-menu-wrap"><button type="button" class="message-more" data-message-menu="' + A.esc(message.id) + '" aria-label="メッセージ操作" aria-expanded="' + String(menuOpen) + '">' + icon("more") + '</button>' +
      (menuOpen ? '<div class="message-context" role="menu"><button type="button" data-quote-message="' + A.esc(message.id) + '">' + icon("reply") + '引用返信</button><button type="button" data-copy-message="' + A.esc(message.id) + '">' + icon("file") + 'コピー</button>' + (mine && !cancelled ? '<button type="button" class="is-danger" data-unsend-message="' + A.esc(message.id) + '">' + icon("close") + '送信取消</button>' : '') + '</div>' : '') +
      '</div></article>';
  }

  function dateLabel(message) {
    return message.date || message.dateLabel || "今日";
  }

  function messageList(item) {
    const source = allMessages(item);
    let lastDate = "";
    return source.map((message, index) => {
      const currentDate = dateLabel(message);
      const divider = currentDate !== lastDate ? '<div class="message-date"><span>' + A.esc(currentDate) + '</span></div>' : "";
      lastDate = currentDate;
      return divider + messageItem(message, source[index - 1], item);
    }).join("");
  }

  function pendingAttachments() {
    if (!S.pendingAttachments.length) return "";
    return '<div class="attachment-preview" aria-label="送信前の添付">' + S.pendingAttachments.map((item) => '<span class="attachment-chip">' + icon(item.kind === "image" ? "image" : item.kind === "audio" ? "audio" : "file") + '<span><strong>' + A.esc(item.name) + '</strong><small>' + Math.max(1, Math.ceil(item.size / 1024)) + ' KiB</small></span><button type="button" data-remove-attachment="' + A.esc(item.id) + '" aria-label="' + A.esc(item.name) + 'を外す">' + icon("close") + '</button></span>').join("") + '</div>';
  }

  function attachmentMenu() {
    if (!S.attachmentMenu) return "";
    return '<div class="attachment-menu" role="menu"><button type="button" data-pick-kind="image">' + icon("image") + '<span><strong>画像</strong><small>端末内の画像を添付</small></span></button><button type="button" data-pick-kind="audio">' + icon("audio") + '<span><strong>音声</strong><small>端末内の音声を添付</small></span></button><button type="button" data-pick-kind="file">' + icon("file") + '<span><strong>ファイル</strong><small>テキスト・PDFなど</small></span></button></div>';
  }

  function detailsPanel(item) {
    if (!S.detailsOpen) return "";
    const attachments = allMessages(item).reduce((sum, message) => sum + (message.attachments || [message.attachment]).filter(Boolean).length, 0);
    return '<aside class="chat-details"><button class="link-icon-button details-close" type="button" data-toggle-details aria-label="詳細を閉じる">' + icon("close") + '</button>' + avatar(item.name, item.tone, true) + '<h2>' + A.esc(item.name) + '</h2><p>' + A.esc(item.status || "ローカル記録") + '</p><dl><div><dt>共有項目</dt><dd>' + attachments + '</dd></div><div><dt>通知</dt><dd>' + (item.muted ? 'ミュート' : 'オン') + '</dd></div></dl><p class="details-note">この会話は作品内のローカル記録です。実在のサービスや回線には接続しません。</p></aside>';
  }

  function chat(item) {
    if (!item) return '<section class="chat-pane chat-pane--empty"><div class="link-empty link-empty--hero">' + icon("chat") + '<strong>会話を選択</strong><p>左の一覧からトークを開きます。</p></div></section>';
    const draft = S.drafts[item.id] || "";
    const quoteId = S.quoteDrafts[item.id];
    const quoted = quoteId && allMessages(item).find((message) => message.id === quoteId);
    const sendEnabled = Boolean(draft.trim() || S.pendingAttachments.length);
    return '<section class="chat-pane ' + (S.mobile === "chat" && S.tab === "chats" ? 'mobile-active' : '') + '">' +
      '<header class="chat-head"><button class="link-icon-button mobile-chat-back" type="button" data-mobile-back aria-label="会話一覧へ戻る">' + icon("back") + '</button>' +
      avatar(item.name, item.tone) + '<div class="chat-identity"><strong>' + A.esc(item.name) + '</strong><small><i></i>' + A.esc(item.status || "ローカル記録") + '</small></div>' +
      '<div class="chat-head-actions"><button class="link-icon-button" type="button" data-toggle-chat-search aria-label="会話内検索" aria-pressed="' + String(S.chatSearchOpen) + '">' + icon("search") + '</button><button class="link-icon-button" type="button" data-start-call="' + A.esc(item.id) + '" aria-label="ローカル通話を開始">' + icon("call") + '</button><button class="link-icon-button" type="button" data-toggle-details aria-label="会話の詳細" aria-pressed="' + String(S.detailsOpen) + '">' + icon("info") + '</button></div></header>' +
      (S.chatSearchOpen ? '<label class="chat-search">' + icon("search") + '<span class="sr-only">会話内検索</span><input type="search" data-chat-search value="' + A.esc(S.chatQuery) + '" placeholder="この会話を検索"></label>' : '') +
      '<div class="message-list" data-message-list>' + (messageList(item) || '<div class="link-empty"><strong>まだメッセージはありません</strong></div>') + '<div class="typing-indicator" ' + (S.typingConversationId === item.id ? '' : 'hidden') + ' aria-live="polite"><span></span><span></span><span></span><small>' + A.esc(item.name) + 'が入力中</small></div></div>' +
      (quoted ? '<div class="composer-quote"><span>' + icon("reply") + '<span><strong>' + A.esc(quoted.sender === "me" ? "あなた" : item.name) + 'に返信</strong><small>' + A.esc(previewText(quoted)) + '</small></span></span><button type="button" data-cancel-quote aria-label="引用を解除">' + icon("close") + '</button></div>' : '') +
      pendingAttachments() +
      '<form class="message-composer" data-send-form><div class="composer-main"><div class="attach-wrap"><button class="composer-icon" type="button" data-attach-toggle aria-label="添付を追加" aria-expanded="' + String(S.attachmentMenu) + '">' + icon("attach") + '</button>' + attachmentMenu() + '</div><textarea name="text" rows="1" maxlength="2000" placeholder="メッセージ" aria-label="メッセージ">' + A.esc(draft) + '</textarea><button class="composer-icon composer-send ' + (sendEnabled ? 'has-content' : '') + '" type="submit" aria-label="送信" ' + (sendEnabled ? '' : 'disabled') + '>' + icon("send") + '</button><input type="file" data-file-input hidden></div><p>Enterで送信 · Shift+Enterで改行 · この端末内だけに保存</p></form>' +
      '<p class="link-status" role="status" aria-live="polite">' + A.esc(S.localNotice || "") + '</p>' + detailsPanel(item) + '</section>';
  }

  const callLabels = { dialing: "発信中", ringing: "呼出し中", connected: "通話中", ended: "終了", incoming: "着信中", answered: "通話中", declined: "拒否", missed: "不在着信", voicemail: "留守番電話", completed: "完了", outgoing: "発信", incomingDirection: "着信" };

  function callRows() {
    const merged = new Map();
    [...(D.calls || []), ...(S.calls || [])].forEach((item) => merged.set(item.id, Object.assign({}, merged.get(item.id) || {}, item)));
    return [...merged.values()];
  }

  function callDirectionIcon(item) {
    if (item.status === "missed") return "missed";
    return item.direction === "outgoing" ? "outgoing" : "incoming";
  }

  function callsPanel() {
    const tabs = [["all", "すべて"], ["missed", "不在着信"], ["voicemail", "留守番電話"]];
    const rows = callRows().filter((item) => S.callFilter === "all" || item.status === S.callFilter).map((item, index) => {
      const name = item.name || (conversation(item.conversationId) || {}).name || "不明";
      const incoming = item.status === "incoming" || item.status === "ringing";
      return '<article class="call-row" data-call-row="' + A.esc(item.id) + '">' + avatar(name, index) + '<span class="call-direction ' + (item.status === 'missed' ? 'is-missed' : '') + '">' + icon(callDirectionIcon(item)) + '</span><span class="call-copy"><strong>' + A.esc(name) + '</strong><small>' + A.esc(callLabels[item.status] || (item.direction === "outgoing" ? "発信" : "着信")) + ' · ' + A.esc(formatStamp(item.at || item.createdAt)) + '</small></span><time>' + A.esc(item.duration || "00:00") + '</time><div class="call-row-actions">' +
        (incoming ? '<button type="button" class="call-accept" data-answer-call="' + A.esc(item.id) + '" aria-label="応答">' + icon("call") + '</button><button type="button" class="call-decline" data-decline-call="' + A.esc(item.id) + '" aria-label="拒否">' + icon("hangup") + '</button>' : '<button type="button" class="link-icon-button" data-redial="' + A.esc(item.conversationId || '') + '" aria-label="再発信">' + icon("call") + '</button>' + ((item.status === "voicemail" || item.transcript || item.audio || item.src) ? '<button type="button" class="link-icon-button" data-open-call="' + A.esc(item.id) + '" data-call-item="' + A.esc(item.id) + '" aria-label="記録を再生">' + icon("play") + '</button>' : '')) + '</div></article>';
    }).join("");
    return '<section class="link-page call-page ' + (S.mobile === "calls" ? 'mobile-active' : '') + '"><header class="link-page-head"><div><button class="link-icon-button mobile-chat-back" type="button" data-mobile-back aria-label="戻る">' + icon("back") + '</button><h1>通話</h1><small>ローカル通話履歴</small></div></header><div class="segmented" role="tablist">' + tabs.map(([id, label]) => '<button type="button" role="tab" data-call-filter="' + id + '" aria-selected="' + String(S.callFilter === id) + '">' + label + '</button>').join("") + '</div><div class="call-list">' + (rows || '<div class="link-empty"><strong>該当する履歴はありません</strong></div>') + '</div></section>';
  }

  function contactsPanel() {
    const contacts = D.contacts && D.contacts.length ? D.contacts : conversations.map((item) => ({ conversationId: item.id, name: item.name, status: item.status, tone: item.tone }));
    const filtered = contacts.filter((item) => VDMText.includesAll([item.name, item.status].join(" "), S.contactQuery));
    const rows = filtered.map((item, index) => '<article class="contact-row">' + avatar(item.name, item.tone == null ? index : item.tone) + '<span><strong>' + A.esc(item.name) + '</strong><small>' + A.esc(item.status || "ローカル記録") + '</small></span><div><button type="button" class="link-icon-button" data-contact-chat="' + A.esc(item.conversationId || item.id) + '" aria-label="トークを開く">' + icon("chat") + '</button><button type="button" class="link-icon-button" data-contact-call="' + A.esc(item.conversationId || item.id) + '" aria-label="通話を開始">' + icon("call") + '</button></div></article>').join("");
    return '<section class="link-page contacts-page ' + (S.mobile === "contacts" ? 'mobile-active' : '') + '"><header class="link-page-head"><div><button class="link-icon-button mobile-chat-back" type="button" data-mobile-back aria-label="戻る">' + icon("back") + '</button><h1>連絡先</h1><small>端末内の記録のみ</small></div></header><label class="link-search link-search--page">' + icon("search") + '<span class="sr-only">連絡先を検索</span><input type="search" data-contact-search value="' + A.esc(S.contactQuery) + '" placeholder="名前を検索"></label><div class="contact-list">' + (rows || '<div class="link-empty"><strong>連絡先がありません</strong></div>') + '</div><p class="privacy-note">' + icon("local") + '<span><strong>ローカル連絡先</strong><small>端末のアドレス帳には接続していません。</small></span></p></section>';
  }

  function savedPanel() {
    const saved = (D.saved || []).map((item) => '<article class="saved-row">' + icon(item.kind === "audio" ? "audio" : item.kind === "image" ? "image" : "file") + '<span><strong>' + A.esc(item.title || item.name || "保存項目") + '</strong><small>' + A.esc(item.note || "この端末内") + '</small></span></article>').join("");
    return '<section class="link-page saved-page ' + (S.mobile === "saved" ? 'mobile-active' : '') + '"><header class="link-page-head"><div><button class="link-icon-button mobile-chat-back" type="button" data-mobile-back aria-label="戻る">' + icon("back") + '</button><h1>保存済み</h1><small>あとで確認する項目</small></div></header><div class="saved-list">' + (saved || '<div class="link-empty">' + icon("saved") + '<strong>保存済み項目はありません</strong><p>ケース側のデータから追加できます。</p></div>') + '</div></section>';
  }

  function callOverlay() {
    const active = S.activeCall;
    if (!active) return "";
    const item = conversation(active.conversationId) || { name: active.name || "不明", tone: 0 };
    const incoming = active.state === "incoming";
    const transcript = active.transcript || active.noAudioEquivalent || "字幕はありません";
    return '<section class="call-overlay" role="dialog" aria-modal="true" aria-label="ローカル通話"><div class="call-overlay-glow"></div><div class="call-overlay-content">' + avatar(item.name, item.tone, true) + '<h2>' + A.esc(item.name) + '</h2><p class="call-status">' + A.esc(callLabels[active.state] || active.state) + '</p><time data-call-duration>00:00</time>' +
      (active.captions ? '<p class="call-caption" aria-live="polite">' + A.esc(transcript) + '</p>' : '<p class="call-caption is-off">字幕はオフです</p>') +
      (incoming ? '<div class="incoming-actions"><button type="button" class="call-accept" data-call-answer>' + icon("call") + '<span>応答</span></button><button type="button" class="call-decline" data-call-decline>' + icon("hangup") + '<span>拒否</span></button></div>' : '<div class="in-call-actions"><button type="button" data-call-toggle="muted" aria-pressed="' + String(Boolean(active.muted)) + '">' + icon("mute") + '<span>ミュート</span></button><button type="button" data-call-toggle="speaker" aria-pressed="' + String(Boolean(active.speaker)) + '">' + icon("speaker") + '<span>スピーカー</span></button><button type="button" data-call-toggle="captions" aria-pressed="' + String(Boolean(active.captions)) + '">' + icon("caption") + '<span>字幕</span></button><button type="button" class="hangup" data-call-end>' + icon("hangup") + '<span>終了</span></button></div>') +
      '<small>実回線・マイクは使用していません</small></div></section>';
  }

  function render() {
    if (S.active && !conversation(S.active)) S.active = null;
    root.innerHTML = '<section class="link-shell">' + rail() + conversationList() + (S.tab === "chats" ? chat(conversation(S.active)) : S.tab === "calls" ? callsPanel() : S.tab === "contacts" ? contactsPanel() : savedPanel()) + callOverlay() + '</section>';
    filterConversationRows();
    filterMessageRows();
    ensureCallTimer();
    requestAnimationFrame(() => {
      const list = root.querySelector("[data-message-list]");
      if (list && !S.chatQuery) list.scrollTop = list.scrollHeight;
    });
  }

  function openConversation(id) {
    const item = conversation(id);
    if (!item) return;
    S.active = id;
    S.tab = "chats";
    S.mobile = "chat";
    S.messageMenu = null;
    markConversationRead(item);
    save();
    render();
  }

  function filterConversationRows() {
    root.querySelectorAll("[data-conversation]").forEach((button) => {
      button.hidden = !VDMText.includesAll(button.textContent, S.conversationQuery);
    });
  }

  function filterMessageRows() {
    root.querySelectorAll("[data-message]").forEach((node) => {
      node.hidden = Boolean(S.chatQuery) && !VDMText.includesAll(node.textContent, S.chatQuery);
    });
  }

  async function chooseAttachment(input) {
    try {
      const item = await ATT.fromFile(input.files && input.files[0], S.pendingAttachments);
      S.pendingAttachments.push(item);
      S.attachmentMenu = false;
      S.localNotice = item.name + "を添付しました";
      save();
      render();
    } catch (error) {
      S.localNotice = error.message;
      save();
      render();
    } finally {
      input.value = "";
    }
  }

  function sendMessage(form) {
    const item = conversation(S.active);
    if (!item) return;
    const text = String(S.drafts[item.id] || "").trim();
    if (!text && !S.pendingAttachments.length) return;
    const message = {
      id: "local-message-" + Date.now(),
      sender: "me",
      text,
      attachments: S.pendingAttachments.splice(0),
      quoteId: S.quoteDrafts[item.id] || null,
      time: nowTime(),
      date: nowDate(),
      createdAt: new Date().toISOString()
    };
    (S.localMessages[item.id] || (S.localMessages[item.id] = [])).push(message);
    S.drafts[item.id] = "";
    S.quoteDrafts[item.id] = null;
    S.localNotice = "端末内に送信しました";
    const match = text ? VDMIntent.match(text, item.intents || D.intents || []) : null;
    const readDelay = Number(item.readDelay ?? (match && match.intent && match.intent.readDelay) ?? 500);
    const replyDelay = Number(match && match.intent && match.intent.delay || 900);
    S.typingConversationId = match && match.score ? item.id : null;
    save();
    render();
    window.setTimeout(() => {
      S.read[message.id] = true;
      save();
      render();
    }, Math.max(0, readDelay));
    if (match && match.score) {
      window.setTimeout(() => {
        const response = match.intent.replies && match.intent.replies[0] || match.intent.reply;
        if (response) (S.localMessages[item.id] || (S.localMessages[item.id] = [])).push({ id: "local-reply-" + Date.now(), sender: item.id, text: response, time: nowTime(), date: nowDate(), createdAt: new Date().toISOString() });
        S.read[message.id] = true;
        S.typingConversationId = null;
        save();
        render();
      }, Math.max(readDelay, replyDelay));
    }
  }

  function findMessage(id) {
    const item = conversation(S.active);
    return item && allMessages(item).find((message) => message.id === id);
  }

  async function copyMessage(id) {
    const message = findMessage(id);
    if (!message) return;
    const text = messageText(message);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(text);
      else {
        const area = document.createElement("textarea");
        area.value = text;
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
      }
      S.localNotice = "メッセージをコピーしました";
    } catch (_) {
      S.localNotice = "コピーできませんでした";
    }
    S.messageMenu = null;
    save();
    render();
  }

  function openMessageAttachment(messageId, index) {
    const message = findMessage(messageId);
    const attachments = message && (message.attachments || [message.attachment]).filter(Boolean);
    const item = attachments && attachments[Number(index) || 0];
    if (!item) return;
    ATT.open(item);
    VDMEvidence.observe(message, "open-attachment");
  }

  function findCall(id) {
    return callRows().find((item) => item.id === id);
  }

  function upsertCall(next) {
    const index = S.calls.findIndex((item) => item.id === next.id);
    if (index >= 0) S.calls[index] = Object.assign({}, S.calls[index], next);
    else S.calls.unshift(Object.assign({}, next));
  }

  function beginCall(conversationId) {
    const item = conversation(conversationId);
    if (!item) return;
    const id = "local-call-" + Date.now();
    const record = { id, conversationId: item.id, name: item.name, direction: "outgoing", status: "dialing", at: new Date().toISOString(), duration: "00:00" };
    upsertCall(record);
    S.activeCall = { id, conversationId: item.id, name: item.name, state: "dialing", startedAt: null, muted: false, speaker: false, captions: true, transcript: item.callTranscript || "ローカル通話を接続しています。" };
    save();
    render();
    window.setTimeout(() => advanceOutgoingCall(id, "ringing"), 450);
    window.setTimeout(() => advanceOutgoingCall(id, "connected"), 1000);
  }

  function advanceOutgoingCall(id, state) {
    if (!S.activeCall || S.activeCall.id !== id || !["dialing", "ringing"].includes(S.activeCall.state)) return;
    S.activeCall.state = state;
    if (state === "connected") S.activeCall.startedAt = Date.now();
    upsertCall({ id, status: state });
    save();
    render();
  }

  function answerCall(id) {
    const source = findCall(id);
    if (!source) return;
    const item = conversation(source.conversationId) || { id: source.conversationId, name: source.name || "不明" };
    upsertCall(Object.assign({}, source, { status: "answered" }));
    S.activeCall = { id: source.id, conversationId: item.id, name: item.name, state: "connected", startedAt: Date.now(), muted: false, speaker: false, captions: true, transcript: source.transcript, noAudioEquivalent: source.noAudioEquivalent };
    save();
    render();
  }

  function declineCall(id) {
    const source = findCall(id);
    if (!source) return;
    upsertCall(Object.assign({}, source, { status: "declined" }));
    if (S.activeCall && S.activeCall.id === id) S.activeCall = null;
    save();
    render();
  }

  function endActiveCall() {
    if (!S.activeCall) return;
    const seconds = S.activeCall.startedAt ? Math.max(0, Math.floor((Date.now() - S.activeCall.startedAt) / 1000)) : 0;
    const duration = String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
    upsertCall({ id: S.activeCall.id, conversationId: S.activeCall.conversationId, name: S.activeCall.name, direction: "outgoing", status: "completed", duration, at: new Date().toISOString() });
    S.activeCall = null;
    window.clearInterval(callTimer);
    callTimer = 0;
    save();
    render();
  }

  function ensureCallTimer() {
    window.clearInterval(callTimer);
    callTimer = 0;
    if (!S.activeCall || S.activeCall.state !== "connected" || !S.activeCall.startedAt) return;
    const update = () => {
      const target = root.querySelector("[data-call-duration]");
      if (!target || !S.activeCall) return;
      const seconds = Math.max(0, Math.floor((Date.now() - S.activeCall.startedAt) / 1000));
      target.textContent = String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
    };
    update();
    callTimer = window.setInterval(update, 1000);
  }

  function openCallRecord(id) {
    const item = findCall(id);
    if (!item) return;
    S.voicemailPlayback[id] = true;
    save();
    if (item.audio || item.src) VDMMedia.open({ type: "audio", src: item.audio || item.src, caption: item.name || "通話記録", captions: item.captions, transcript: item.transcript, noAudioEquivalent: item.noAudioEquivalent, evidenceId: item.evidenceId, evidenceOn: item.evidenceOn });
    else VDMMedia.open({ type: "text", text: [item.transcript, item.noAudioEquivalent].filter(Boolean).join("\n\n") || "音声記録はありません", caption: item.name || callLabels[item.status] || "通話記録", evidenceId: item.evidenceId, evidenceOn: item.evidenceOn });
    VDMEvidence.observe(item, "play-voicemail");
  }

  root.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.tab) {
      S.tab = button.dataset.tab;
      S.mobile = button.dataset.tab === "chats" ? "list" : button.dataset.tab;
      S.messageMenu = null;
      save();
      render();
    } else if (button.dataset.conversation) openConversation(button.dataset.conversation);
    else if (button.hasAttribute("data-mobile-back")) {
      S.mobile = "list";
      S.tab = "chats";
      save();
      render();
    } else if (button.hasAttribute("data-new-chat")) {
      S.tab = "contacts";
      S.mobile = "contacts";
      save();
      render();
    } else if (button.hasAttribute("data-local-menu")) {
      S.localNotice = "設定と保存はデスクトップの情報画面から操作できます";
      save();
      render();
    } else if (button.hasAttribute("data-toggle-details")) {
      S.detailsOpen = !S.detailsOpen;
      save();
      render();
    } else if (button.hasAttribute("data-toggle-chat-search")) {
      S.chatSearchOpen = !S.chatSearchOpen;
      if (!S.chatSearchOpen) S.chatQuery = "";
      save();
      render();
      root.querySelector("[data-chat-search]")?.focus();
    } else if (button.dataset.messageMenu) {
      S.messageMenu = S.messageMenu === button.dataset.messageMenu ? null : button.dataset.messageMenu;
      save();
      render();
    } else if (button.dataset.quoteMessage) {
      S.quoteDrafts[S.active] = button.dataset.quoteMessage;
      S.messageMenu = null;
      save();
      render();
      root.querySelector("[name=text]")?.focus();
    } else if (button.dataset.copyMessage) copyMessage(button.dataset.copyMessage);
    else if (button.dataset.unsendMessage) {
      if (!S.unsent.includes(button.dataset.unsendMessage)) S.unsent.push(button.dataset.unsendMessage);
      S.messageMenu = null;
      save();
      render();
    } else if (button.dataset.jumpMessage) {
      const target = root.querySelector('[data-message="' + CSS.escape(button.dataset.jumpMessage) + '"]');
      target?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      target?.classList.add("is-highlighted");
      window.setTimeout(() => target?.classList.remove("is-highlighted"), 1000);
    } else if (button.hasAttribute("data-cancel-quote")) {
      S.quoteDrafts[S.active] = null;
      save();
      render();
    } else if (button.hasAttribute("data-attach-toggle")) {
      S.attachmentMenu = !S.attachmentMenu;
      save();
      render();
    } else if (button.dataset.pickKind) {
      const input = root.querySelector("[data-file-input]");
      input.accept = button.dataset.pickKind === "image" ? "image/*" : button.dataset.pickKind === "audio" ? "audio/*" : ".txt,.md,.csv,.json,.pdf,application/pdf,text/*";
      input.click();
    } else if (button.dataset.removeAttachment) {
      S.pendingAttachments = S.pendingAttachments.filter((item) => item.id !== button.dataset.removeAttachment);
      save();
      render();
    } else if (button.dataset.messageAttachment) openMessageAttachment(button.dataset.messageAttachment, button.dataset.attachmentIndex);
    else if (button.dataset.startCall) beginCall(button.dataset.startCall);
    else if (button.dataset.callFilter) {
      S.callFilter = button.dataset.callFilter;
      save();
      render();
    } else if (button.dataset.answerCall) answerCall(button.dataset.answerCall);
    else if (button.dataset.declineCall) declineCall(button.dataset.declineCall);
    else if (button.dataset.redial) beginCall(button.dataset.redial);
    else if (button.dataset.openCall) openCallRecord(button.dataset.openCall);
    else if (button.dataset.contactChat) openConversation(button.dataset.contactChat);
    else if (button.dataset.contactCall) beginCall(button.dataset.contactCall);
    else if (button.hasAttribute("data-call-answer")) answerCall(S.activeCall && S.activeCall.id);
    else if (button.hasAttribute("data-call-decline")) declineCall(S.activeCall && S.activeCall.id);
    else if (button.hasAttribute("data-call-end")) endActiveCall();
    else if (button.dataset.callToggle && S.activeCall) {
      S.activeCall[button.dataset.callToggle] = !S.activeCall[button.dataset.callToggle];
      save();
      render();
    }
  });

  root.addEventListener("input", (event) => {
    if (event.target.matches("[data-conversation-search]")) {
      S.conversationQuery = event.target.value;
      save();
      filterConversationRows();
    } else if (event.target.matches("[data-chat-search]")) {
      S.chatQuery = event.target.value;
      save();
      filterMessageRows();
    } else if (event.target.matches("[data-contact-search]")) {
      S.contactQuery = event.target.value;
      save();
      render();
      root.querySelector("[data-contact-search]")?.focus();
    } else if (event.target.matches("[name=text]")) {
      S.drafts[S.active] = event.target.value;
      save();
      const submit = root.querySelector(".composer-send");
      const enabled = Boolean(event.target.value.trim() || S.pendingAttachments.length);
      submit.disabled = !enabled;
      submit.classList.toggle("has-content", enabled);
    }
  });

  root.addEventListener("keydown", (event) => {
    if (event.target.matches("[name=text]") && event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      event.target.form?.requestSubmit();
    }
  });

  root.addEventListener("submit", (event) => {
    if (event.target.matches("[data-send-form]")) {
      event.preventDefault();
      sendMessage(event.target);
    }
  });

  root.addEventListener("change", (event) => {
    if (event.target.matches("[data-file-input]")) chooseAttachment(event.target);
  });

  window.addEventListener("beforeunload", () => window.clearInterval(callTimer));
  render();
})();
