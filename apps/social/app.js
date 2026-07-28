(function () {
  "use strict";

  const A = VDMApp;
  const D = A.read("social", {});
  const I = VDMIcons;
  const ATT = VDMLocalAttachment;
  const root = document.getElementById("app-body");
  const viewer = Object.assign({ id: "local-viewer", name: "ローカル利用者", handle: "local", bio: "この端末内のプロフィール" }, D.viewer || {});
  const brand = Object.assign({ name: "Ripple", description: "短い投稿とつながり", accent: "#5d5bd6", mark: "ripple" }, A.brand || {});
  const defaults = {
    view: "home",
    homeTab: "recommended",
    notificationTab: "all",
    profileTab: "posts",
    query: "",
    searchHistory: [],
    localPosts: [],
    likes: [],
    reposts: [],
    bookmarks: [],
    following: [],
    readNotifications: [],
    detail: null,
    profileUserId: null,
    previousView: "home",
    composeModal: false,
    composeDraft: "",
    composeReplyTo: null,
    composeQuoteId: null,
    composeAttachment: null,
    statusMessage: ""
  };
  const S = A.appState(defaults);
  Object.keys(defaults).forEach((key) => {
    if (S[key] == null) S[key] = defaults[key];
  });
  document.documentElement.style.setProperty("--ripple-accent", brand.accent || "#5d5bd6");
  A.frame(brand.name, brand.description);

  const icon = (name, className) => I.icon(name, className);
  const save = () => A.saveAppState(S);
  const baseAccounts = Array.isArray(D.accounts) ? D.accounts : [];
  const allAccounts = () => [viewer, ...baseAccounts.filter((item) => item.id !== viewer.id)];
  const account = (id) => allAccounts().find((item) => item.id === id) || { id, name: "削除されたアカウント", handle: "removed", status: "deleted", bio: "" };
  const allPosts = () => [...(S.localPosts || []), ...(D.posts || [])];
  const postById = (id) => allPosts().find((item) => item.id === id);
  const postBody = (post) => String(post && (post.body || post.text) || "");
  const initials = (value) => String(value || "?").trim().slice(0, 1).toUpperCase();
  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
  };
  const avatar = (user, large) => '<span class="ripple-avatar' + (large ? ' ripple-avatar--large' : '') + '" data-tone="' + A.esc(String(user && user.tone || 0)) + '" aria-hidden="true">' + A.esc(initials(user && user.name)) + '</span>';
  const isAvailable = (item) => !item.availableWhen || (window.VDMContent && VDMContent.available ? VDMContent.available(item) : true);
  const unreadNotifications = () => (D.notifications || []).filter((item) => !S.readNotifications.includes(item.id)).length;

  function renderRichText(value) {
    return A.esc(value).replace(/(^|\s)([@#][\p{L}\p{N}_-]+)/gu, '$1<span class="ripple-token" role="button" tabindex="0" data-social-token="$2">$2</span>');
  }

  function navItem(id, label, iconName, badge) {
    const active = S.view === id && !S.detail && !S.profileUserId;
    return '<button type="button" class="ripple-nav-item" data-social-view="' + id + '" aria-current="' + (active ? 'page' : 'false') + '">' + icon(iconName) + '<span>' + A.esc(label) + '</span>' + (badge ? '<b>' + badge + '</b>' : '') + '</button>';
  }

  function leftNav() {
    return '<nav class="ripple-left ripple-mobile-nav" aria-label="' + A.esc(brand.name) + ' のナビゲーション">' +
      '<div class="ripple-brand"><span>' + icon("trend") + '</span><strong>' + A.esc(brand.name) + '</strong></div>' +
      '<div class="ripple-nav-list">' +
      navItem("home", "ホーム", "home", 0) +
      navItem("explore", "話題を探す", "search", 0) +
      navItem("notifications", "通知", "notification", unreadNotifications()) +
      navItem("bookmarks", "ブックマーク", "bookmark", 0) +
      navItem("profile", "プロフィール", "profile", 0) +
      '<button type="button" class="ripple-compose-button" data-compose-modal>' + icon("compose") + '<span>投稿する</span></button>' +
      '</div>' +
      '<button type="button" class="ripple-local-user" data-open-profile="' + A.esc(viewer.id) + '">' + avatar(viewer) + '<span><strong>' + A.esc(viewer.name) + '</strong><small>@' + A.esc(viewer.handle) + '</small></span>' + icon("more") + '</button>' +
      '</nav>';
  }

  function header(title, options) {
    const opts = options || {};
    return '<header class="ripple-header">' + (opts.back ? '<button type="button" class="ripple-icon-button" data-social-back aria-label="戻る">' + icon("back") + '</button>' : '') + '<div><h1>' + A.esc(title) + '</h1>' + (opts.subtitle ? '<small>' + A.esc(opts.subtitle) + '</small>' : '') + '</div>' + (opts.action || '') + '</header>';
  }

  function compose(context, compact) {
    const ctx = context || {};
    const draft = S.composeDraft || "";
    const quote = ctx.quoteId && postById(ctx.quoteId);
    const reply = ctx.replyTo && postById(ctx.replyTo);
    const count = [...draft].length;
    return '<form class="ripple-compose ' + (compact ? 'is-compact' : '') + '" data-social-compose data-reply-to="' + A.esc(ctx.replyTo || '') + '" data-quote-id="' + A.esc(ctx.quoteId || '') + '">' +
      avatar(viewer) + '<div class="compose-content">' +
      (reply ? '<p class="compose-context">返信先 <button type="button" data-open-post="' + A.esc(reply.id) + '">@' + A.esc(account(reply.authorId).handle) + '</button></p>' : '') +
      (quote ? '<div class="compose-quote"><strong>' + A.esc(account(quote.authorId).name) + '</strong><span>' + A.esc(postBody(quote)) + '</span></div>' : '') +
      '<textarea name="post" maxlength="500" rows="' + (compact ? '2' : '3') + '" placeholder="いま何を記録しますか？" aria-label="投稿本文">' + A.esc(draft) + '</textarea>' +
      (S.composeAttachment ? '<div class="compose-media-preview"><img src="' + A.esc(S.composeAttachment.src || S.composeAttachment.data) + '" alt="' + A.esc(S.composeAttachment.alt || S.composeAttachment.name || "投稿予定の画像") + '"><button type="button" data-remove-compose-media aria-label="画像を外す">' + icon("close") + '</button></div>' : '') +
      '<div class="compose-toolbar"><div><button type="button" class="ripple-icon-button" data-add-compose-media aria-label="画像を添付">' + icon("image") + '</button><span class="local-save-label">' + icon("local") + '端末内保存</span></div><div><span class="character-count ' + (count > 470 ? 'is-near-limit' : '') + '">' + count + '/500</span><button type="submit" class="ripple-post-button" ' + (draft.trim() || S.composeAttachment ? '' : 'disabled') + '>投稿</button></div></div>' +
      '<input type="file" accept="image/*" data-compose-file hidden>' +
      '</div></form>';
  }

  function postMedia(post) {
    const media = Array.isArray(post.media) ? post.media : post.media ? [post.media] : [];
    if (!media.length && post.altRemnant) return '<div class="alt-remnant">' + icon("image") + '<span><strong>画像は利用できません</strong><small>' + A.esc(post.altRemnant) + '</small></span></div>';
    if (!media.length) return "";
    return '<div class="post-media-grid media-count-' + Math.min(media.length, 4) + '">' + media.slice(0, 4).map((item, index) => '<figure><button type="button" data-post-media="' + A.esc(post.id) + '" data-media-index="' + index + '"><img src="' + A.esc(item.src || item.data) + '" alt="' + A.esc(item.alt || item.name || "投稿画像") + '"></button><figcaption><button type="button" data-toggle-alt="' + A.esc(post.id + '-' + index) + '">ALT</button><span id="alt-' + A.esc(post.id + '-' + index) + '" hidden>' + A.esc(item.alt || "説明はありません") + '</span></figcaption></figure>').join("") + '</div>';
  }

  function quoteCard(post) {
    if (!post.quoteId) return "";
    const source = postById(post.quoteId);
    if (!source || source.status === "deleted") return '<button type="button" class="quote-post is-deleted" data-open-post="' + A.esc(post.quoteId) + '">' + icon("quote") + '<span><strong>引用元は削除されました</strong><small>' + A.esc(post.quoteRemnant || "引用だけが残っています") + '</small></span></button>';
    const user = account(source.authorId);
    return '<button type="button" class="quote-post" data-open-post="' + A.esc(source.id) + '"><span><strong>' + A.esc(user.name) + '</strong><small>@' + A.esc(user.handle) + '</small></span><p>' + A.esc(postBody(source)) + '</p></button>';
  }

  function countFor(post, key) {
    const base = Number(post.metrics && post.metrics[key] || post[key + "Count"] || 0);
    if (key === "likes") return base + (S.likes.includes(post.id) ? 1 : 0);
    if (key === "reposts") return base + (S.reposts.includes(post.id) ? 1 : 0);
    if (key === "replies") return base + allPosts().filter((item) => item.replyTo === post.id).length;
    return base;
  }

  function actionButton(action, post, iconName, label, count, active) {
    return '<button type="button" data-post-action="' + action + '" data-post-id="' + A.esc(post.id) + '" class="post-action ' + (active ? 'is-active' : '') + '" aria-label="' + A.esc(label) + '" aria-pressed="' + String(Boolean(active)) + '">' + icon(iconName) + (count != null ? '<span>' + count + '</span>' : '') + '</button>';
  }

  function deletedPost(post) {
    return '<article class="ripple-post deleted-post" data-post-card="' + A.esc(post.id) + '"><div class="deleted-mark">' + icon("close") + '</div><div><strong>この投稿は削除されました</strong><p>' + A.esc(post.remnant || "返信や通知に痕跡が残っている場合があります。") + '</p>' + (post.altRemnant ? '<small>画像の説明: ' + A.esc(post.altRemnant) + '</small>' : '') + '</div></article>';
  }

  function postCard(post, options) {
    const opts = options || {};
    if (!post || !isAvailable(post)) return "";
    if (post.status === "deleted") return deletedPost(post);
    const user = account(post.authorId);
    const replyTo = post.replyTo && postById(post.replyTo);
    const replyUser = replyTo && account(replyTo.authorId);
    const liked = S.likes.includes(post.id);
    const reposted = S.reposts.includes(post.id);
    const saved = S.bookmarks.includes(post.id);
    const accountMissing = ["deleted", "missing"].includes(user.status);
    return '<article class="ripple-post ' + (opts.detail ? 'is-detail' : '') + '" data-post-card="' + A.esc(post.id) + '">' +
      '<button type="button" class="post-avatar-button" data-open-profile="' + A.esc(user.id) + '" aria-label="' + A.esc(user.name + 'のプロフィール') + '">' + avatar(user) + '</button>' +
      '<div class="post-main">' +
      '<header class="post-meta"><button type="button" data-open-profile="' + A.esc(user.id) + '"><strong>' + A.esc(user.name) + '</strong>' + (user.verified ? '<span class="independent-check" title="作品内の確認済み表示">' + icon("verified") + '</span>' : '') + '<small>@' + A.esc(user.handle) + '</small></button><span>·</span><time>' + A.esc(formatDate(post.createdAt || post.date)) + '</time><button type="button" class="post-menu" data-post-menu="' + A.esc(post.id) + '" aria-label="投稿メニュー">' + icon("more") + '</button></header>' +
      (replyUser ? '<p class="reply-target">返信先 <button type="button" data-open-profile="' + A.esc(replyUser.id) + '">@' + A.esc(replyUser.handle) + '</button></p>' : post.replyTo ? '<p class="reply-target is-missing">返信先の投稿はありません</p>' : '') +
      '<div class="post-body">' + (accountMissing ? '<p class="account-remnant">削除されたアカウントの投稿</p>' : '') + '<p>' + renderRichText(postBody(post)) + '</p></div>' +
      quoteCard(post) + postMedia(post) +
      (opts.detail ? '<div class="detail-stats"><span>' + A.esc(post.views || "—") + ' 閲覧</span><time>' + A.esc(formatDate(post.createdAt || post.date)) + '</time></div>' : '') +
      '<footer class="post-actions">' +
      actionButton("reply", post, "reply", "返信", countFor(post, "replies"), false) +
      actionButton("quote", post, "quote", "引用", null, false) +
      actionButton("repost", post, "repost", "再共有", countFor(post, "reposts"), reposted) +
      actionButton("like", post, "like", "いいね", countFor(post, "likes"), liked) +
      actionButton("bookmark", post, "bookmark", "保存", null, saved) +
      actionButton("detail", post, "chevron", "詳細", null, Boolean(opts.detail)) +
      '</footer></div></article>';
  }

  function homeView() {
    let posts = allPosts().filter((post) => !post.replyTo && isAvailable(post));
    if (S.homeTab === "following") posts = posts.filter((post) => post.authorId === viewer.id || S.following.includes(post.authorId));
    return header("ホーム") +
      '<div class="home-tabs" role="tablist"><button type="button" data-home-tab="recommended" role="tab" aria-selected="' + String(S.homeTab === 'recommended') + '">おすすめ</button><button type="button" data-home-tab="following" role="tab" aria-selected="' + String(S.homeTab === 'following') + '">フォロー中</button></div>' +
      compose({}, true) +
      '<section class="timeline" aria-label="タイムライン">' + (posts.map((post) => postCard(post)).join("") || '<div class="ripple-empty">' + icon("home") + '<strong>表示する投稿がありません</strong><p>投稿するか、別のタブを確認してください。</p></div>') + '<p class="timeline-count">' + posts.length + '件を表示</p></section>';
  }

  function searchPosts(query) {
    if (!query) return [];
    return allPosts().filter((post) => VDMText.includesAll([postBody(post), account(post.authorId).name, account(post.authorId).handle].join(" "), query));
  }

  function searchAccounts(query) {
    if (!query) return [];
    return allAccounts().filter((user) => VDMText.includesAll([user.name, user.handle, user.bio, user.location].join(" "), query));
  }

  function accountResult(user) {
    const followed = S.following.includes(user.id);
    return '<article class="account-result"><button type="button" data-open-profile="' + A.esc(user.id) + '">' + avatar(user) + '<span><strong>' + A.esc(user.name) + '</strong><small>@' + A.esc(user.handle) + '</small><p>' + A.esc(user.bio || "") + '</p></span></button>' + (user.id !== viewer.id && user.status !== "deleted" ? '<button type="button" class="follow-button" data-follow="' + A.esc(user.id) + '" aria-pressed="' + String(followed) + '">' + (followed ? 'フォロー中' : 'フォロー') + '</button>' : '') + '</article>';
  }

  function exploreView() {
    const people = searchAccounts(S.query);
    const posts = searchPosts(S.query);
    const trends = D.trends || [];
    return header("話題を探す") +
      '<form class="explore-search" data-explore-search>' + icon("search") + '<label><span class="sr-only">投稿とアカウントを検索</span><input type="search" name="query" value="' + A.esc(S.query) + '" placeholder="投稿、人物、話題を検索"></label><button type="submit">検索</button></form>' +
      (S.searchHistory.length ? '<section class="search-history"><header><h2>最近の検索</h2><button type="button" data-clear-search-history>消去</button></header><div>' + S.searchHistory.map((query) => '<button type="button" data-search-query="' + A.esc(query) + '">' + icon("clock") + A.esc(query) + '</button>').join("") + '</div></section>' : '') +
      (!S.query ? '<section class="trend-panel"><h2>いま話題</h2>' + trends.map((trend, index) => '<button type="button" data-search-query="' + A.esc(typeof trend === 'string' ? trend : trend.label) + '"><span><small>' + (index + 1) + ' · ローカル</small><strong>' + A.esc(typeof trend === 'string' ? trend : trend.label) + '</strong><em>' + A.esc(typeof trend === 'string' ? '関連する通常投稿' : trend.note || '') + '</em></span>' + icon("chevron") + '</button>').join("") + '</section>' :
      '<div class="search-results">' +
      (people.length ? '<section><h2>人物</h2>' + people.map(accountResult).join("") + '</section>' : '') +
      (posts.length ? '<section><h2>投稿</h2>' + posts.map((post) => postCard(post)).join("") + '</section>' : '') +
      (!people.length && !posts.length ? '<div class="ripple-empty">' + icon("search") + '<strong>「' + A.esc(S.query) + '」の結果はありません</strong><p>別の表記や、見つけた固有名詞で検索できます。</p></div>' : '') + '</div>');
  }

  const notificationLabels = { mention: "メンション", reply: "返信", like: "いいね", repost: "再共有", follow: "フォロー", quote: "引用" };
  const notificationIcons = { mention: "profile", reply: "reply", like: "like", repost: "repost", follow: "contacts", quote: "quote" };

  function notificationsView() {
    const source = (D.notifications || []).filter((item) => S.notificationTab === "all" || item.type === "mention");
    return header("通知") + '<div class="home-tabs" role="tablist"><button type="button" data-notification-tab="all" role="tab" aria-selected="' + String(S.notificationTab === 'all') + '">すべて</button><button type="button" data-notification-tab="mention" role="tab" aria-selected="' + String(S.notificationTab === 'mention') + '">メンション</button></div><section class="notification-list">' + (source.map((item) => {
      const read = S.readNotifications.includes(item.id);
      const user = account(item.actorId || item.userId);
      return '<button type="button" class="notification-row ' + (read ? 'is-read' : 'is-unread') + '" data-open-notification="' + A.esc(item.id) + '"><span class="notification-kind" data-kind="' + A.esc(item.type || 'mention') + '">' + icon(notificationIcons[item.type] || "notification") + '</span>' + avatar(user) + '<span><small>' + A.esc(notificationLabels[item.type] || item.title || "通知") + '</small><p><strong>' + A.esc(user.name) + '</strong> ' + A.esc(item.text || item.preview || "新しい動きがあります") + '</p><time>' + A.esc(formatDate(item.createdAt || item.date)) + '</time></span>' + (!read ? '<i aria-label="未読"></i>' : '') + '</button>';
    }).join("") || '<div class="ripple-empty">' + icon("notification") + '<strong>通知はありません</strong></div>') + '</section>';
  }

  function bookmarksView() {
    const posts = allPosts().filter((post) => S.bookmarks.includes(post.id));
    return header("ブックマーク", { subtitle: "この端末内だけに保存" }) + '<section class="timeline">' + (posts.map((post) => postCard(post)).join("") || '<div class="ripple-empty">' + icon("bookmark") + '<strong>保存した投稿はありません</strong><p>投稿のブックマークボタンから追加できます。</p></div>') + '</section>';
  }

  function profileView(userId) {
    const user = account(userId || viewer.id);
    const status = user.status || "public";
    const followed = S.following.includes(user.id);
    const posts = allPosts().filter((post) => {
      if (S.profileTab === "replies") return post.authorId === user.id && Boolean(post.replyTo);
      if (S.profileTab === "media") return post.authorId === user.id && Boolean(post.media);
      if (S.profileTab === "likes") return S.likes.includes(post.id);
      return post.authorId === user.id && !post.replyTo;
    });
    const stateCopy = { private: "このアカウントは非公開です", suspended: "このアカウントは停止中です", deleted: "このアカウントは削除されました", missing: "アカウントが見つかりません" };
    const canShow = status === "public" || user.id === viewer.id;
    return header("プロフィール", { back: Boolean(S.profileUserId), subtitle: (user.postCount == null ? posts.length : user.postCount) + "件の投稿" }) +
      '<section class="profile-view"><div class="profile-cover" style="--cover-a:' + A.esc(user.coverA || '#3d477a') + ';--cover-b:' + A.esc(user.coverB || brand.accent || '#5d5bd6') + '"></div><div class="profile-summary">' + avatar(user, true) +
      '<div class="profile-actions">' + (user.id !== viewer.id && status === "public" ? '<button type="button" class="follow-button" data-follow="' + A.esc(user.id) + '" aria-pressed="' + String(followed) + '">' + (followed ? 'フォロー中' : 'フォロー') + '</button>' : '') + '</div>' +
      '<h2>' + A.esc(user.name) + (user.verified ? '<span class="independent-check">' + icon("verified") + '</span>' : '') + '</h2><p class="profile-handle">@' + A.esc(user.handle) + '</p><p class="profile-bio">' + A.esc(user.bio || "") + '</p><div class="profile-meta">' + (user.organization ? '<span>' + icon("contacts") + A.esc(user.organization) + '</span>' : '') + (user.location ? '<span>' + icon("home") + A.esc(user.location) + '</span>' : '') + (user.joined ? '<span>' + icon("clock") + A.esc(user.joined) + '</span>' : '') + '</div><div class="profile-counts"><span><strong>' + Number(user.followingCount || 0).toLocaleString("ja-JP") + '</strong> フォロー</span><span><strong>' + Number(user.followerCount || 0).toLocaleString("ja-JP") + '</strong> フォロワー</span></div></div>' +
      '<div class="profile-tabs" role="tablist">' + [["posts", "投稿"], ["replies", "返信"], ["media", "メディア"], ["likes", "いいね"]].map(([id, label]) => '<button type="button" role="tab" data-profile-tab="' + id + '" aria-selected="' + String(S.profileTab === id) + '">' + label + '</button>').join("") + '</div>' +
      (canShow ? '<div class="timeline">' + (posts.map((post) => postCard(post)).join("") || '<div class="ripple-empty"><strong>表示する投稿がありません</strong></div>') + '</div>' : '<div class="profile-state">' + icon(status === 'private' ? 'lock' : 'info') + '<strong>' + A.esc(stateCopy[status] || "投稿を表示できません") + '</strong><p>' + A.esc(user.stateNote || "プロフィールに残っている公開情報だけを表示しています。") + '</p></div>') + '</section>';
  }

  function detailView(postId) {
    const post = postById(postId);
    const replies = allPosts().filter((item) => item.replyTo === postId);
    return header("スレッド", { back: true }) + '<section class="thread-view">' + (post ? postCard(post, { detail: true }) : '<div class="deleted-post-detail">' + icon("close") + '<strong>元の投稿はありません</strong><p>返信や引用だけが残っています。</p></div>') + compose({ replyTo: postId }, true) + '<div class="thread-replies">' + (replies.map((reply) => postCard(reply)).join("") || '<div class="ripple-empty"><strong>返信はまだありません</strong></div>') + '</div></section>';
  }

  function rightSidebar() {
    const trends = (D.trends || []).slice(0, 5);
    const suggestions = baseAccounts.filter((user) => user.status === "public" && user.id !== viewer.id).slice(0, 3);
    return '<aside class="ripple-right"><form class="side-search" data-side-search>' + icon("search") + '<label><span class="sr-only">話題を検索</span><input type="search" name="query" placeholder="' + A.esc(brand.name) + 'を検索"></label></form><section class="side-panel"><h2>いま話題</h2>' + trends.map((trend, index) => '<button type="button" data-search-query="' + A.esc(typeof trend === 'string' ? trend : trend.label) + '"><small>' + (index + 1) + ' · ローカル</small><strong>' + A.esc(typeof trend === 'string' ? trend : trend.label) + '</strong><span>' + A.esc(typeof trend === 'string' ? '通常の話題' : trend.note || '') + '</span></button>').join("") + '</section><section class="side-panel suggestions"><h2>おすすめユーザー</h2>' + suggestions.map((user) => '<div>' + avatar(user) + '<button type="button" data-open-profile="' + A.esc(user.id) + '"><strong>' + A.esc(user.name) + '</strong><small>@' + A.esc(user.handle) + '</small></button><button type="button" class="mini-follow" data-follow="' + A.esc(user.id) + '">' + (S.following.includes(user.id) ? '中' : '＋') + '</button></div>').join("") + '</section><footer><span>この端末内の架空サービス</span><button type="button" data-side-info>利用案内</button><button type="button" data-side-info>プライバシー</button></footer></aside>';
  }

  function composeModal() {
    if (!S.composeModal) return "";
    return '<section class="compose-modal" role="dialog" aria-modal="true" aria-label="新しい投稿"><div class="compose-dialog"><header><button type="button" class="ripple-icon-button" data-close-compose aria-label="閉じる">' + icon("close") + '</button><strong>新しい投稿</strong><span></span></header>' + compose({ replyTo: S.composeReplyTo, quoteId: S.composeQuoteId }, false) + '</div></section>';
  }

  function centerView() {
    if (S.detail) return detailView(S.detail);
    if (S.profileUserId) return profileView(S.profileUserId);
    if (S.view === "explore") return exploreView();
    if (S.view === "notifications") return notificationsView();
    if (S.view === "bookmarks") return bookmarksView();
    if (S.view === "profile") return profileView(viewer.id);
    return homeView();
  }

  function render() {
    root.innerHTML = '<section class="ripple-shell">' + leftNav() + '<main class="ripple-center" id="ripple-main" tabindex="-1">' + centerView() + '</main>' + rightSidebar() + composeModal() + '<p class="ripple-status" role="status" aria-live="polite">' + A.esc(S.statusMessage || "") + '</p></section>';
  }

  function setView(view) {
    S.view = view;
    S.detail = null;
    S.profileUserId = null;
    S.composeModal = false;
    save();
    render();
    root.querySelector("#ripple-main")?.focus({ preventScroll: true });
  }

  function openProfile(id) {
    if (!id) return;
    S.previousView = S.detail ? "detail" : S.view;
    S.profileUserId = id;
    S.detail = null;
    S.profileTab = "posts";
    save();
    render();
  }

  function openPost(id) {
    if (!id) return;
    S.previousView = S.profileUserId ? "profile-other" : S.view;
    S.detail = id;
    S.profileUserId = null;
    save();
    render();
    const post = postById(id);
    if (post) VDMEvidence.observe(post, "open-post-detail");
  }

  function goBack() {
    if (S.detail) {
      S.detail = null;
    } else if (S.profileUserId) {
      S.profileUserId = null;
    }
    save();
    render();
  }

  function toggle(list, id) {
    const index = list.indexOf(id);
    if (index >= 0) list.splice(index, 1);
    else list.push(id);
    save();
    render();
  }

  function openComposer(replyTo, quoteId) {
    S.composeModal = true;
    S.composeReplyTo = replyTo || null;
    S.composeQuoteId = quoteId || null;
    S.composeDraft = "";
    S.composeAttachment = null;
    save();
    render();
    root.querySelector(".compose-modal textarea")?.focus();
  }

  async function chooseComposeMedia(input) {
    try {
      const item = await ATT.fromFile(input.files && input.files[0], []);
      if (item.kind !== "image") throw new Error("投稿には画像を選択してください");
      S.composeAttachment = item;
      S.statusMessage = item.name + "を添付しました";
    } catch (error) {
      S.statusMessage = error.message;
    }
    save();
    render();
  }

  function submitPost(form) {
    const text = String(S.composeDraft || "").trim();
    if (!text && !S.composeAttachment) return;
    const replyTo = form.dataset.replyTo || null;
    const quoteId = form.dataset.quoteId || null;
    S.localPosts.unshift({
      id: "local-post-" + Date.now(),
      authorId: viewer.id,
      body: text,
      text,
      replyTo: quoteId ? null : replyTo,
      quoteId: quoteId || null,
      media: S.composeAttachment ? [S.composeAttachment] : [],
      createdAt: new Date().toISOString(),
      status: "published",
      metrics: { replies: 0, reposts: 0, likes: 0 }
    });
    S.composeDraft = "";
    S.composeReplyTo = null;
    S.composeQuoteId = null;
    S.composeAttachment = null;
    S.composeModal = false;
    S.statusMessage = "端末内に投稿しました";
    if (!S.detail) S.view = "home";
    save();
    render();
  }

  function performSearch(query) {
    const value = String(query || "").trim();
    S.query = value;
    if (value) S.searchHistory = [value, ...S.searchHistory.filter((item) => item !== value)].slice(0, 8);
    S.view = "explore";
    S.detail = null;
    S.profileUserId = null;
    save();
    render();
  }

  function openNotification(id) {
    const item = (D.notifications || []).find((notification) => notification.id === id);
    if (!item) return;
    if (!S.readNotifications.includes(id)) S.readNotifications.push(id);
    save();
    if (item.postId) openPost(item.postId);
    else if (item.profileId || item.actorId || item.userId) openProfile(item.profileId || item.actorId || item.userId);
    else render();
  }

  function openPostMedia(postId, index) {
    const post = postById(postId);
    const media = post && (Array.isArray(post.media) ? post.media : [post.media]).filter(Boolean);
    const item = media && media[Number(index) || 0];
    if (!item) return;
    VDMMedia.open(Object.assign({ type: "image" }, item));
    VDMEvidence.observe(post, "open-media");
  }

  root.addEventListener("click", (event) => {
    const button = event.target.closest("button, [data-social-token]");
    if (!button) return;
    if (button.dataset.socialView) setView(button.dataset.socialView);
    else if (button.hasAttribute("data-social-back")) goBack();
    else if (button.dataset.openProfile) openProfile(button.dataset.openProfile);
    else if (button.dataset.openPost) openPost(button.dataset.openPost);
    else if (button.dataset.homeTab) {
      S.homeTab = button.dataset.homeTab;
      save();
      render();
    } else if (button.dataset.notificationTab) {
      S.notificationTab = button.dataset.notificationTab;
      save();
      render();
    } else if (button.dataset.profileTab) {
      S.profileTab = button.dataset.profileTab;
      save();
      render();
    } else if (button.dataset.follow) toggle(S.following, button.dataset.follow);
    else if (button.dataset.postAction) {
      const id = button.dataset.postId;
      if (button.dataset.postAction === "reply") openComposer(id, null);
      else if (button.dataset.postAction === "quote") openComposer(null, id);
      else if (button.dataset.postAction === "repost") toggle(S.reposts, id);
      else if (button.dataset.postAction === "like") toggle(S.likes, id);
      else if (button.dataset.postAction === "bookmark") toggle(S.bookmarks, id);
      else if (button.dataset.postAction === "detail") openPost(id);
    } else if (button.hasAttribute("data-compose-modal")) openComposer(null, null);
    else if (button.hasAttribute("data-close-compose")) {
      S.composeModal = false;
      save();
      render();
    } else if (button.hasAttribute("data-add-compose-media")) button.closest("form").querySelector("[data-compose-file]").click();
    else if (button.hasAttribute("data-remove-compose-media")) {
      S.composeAttachment = null;
      save();
      render();
    } else if (button.dataset.postMedia) openPostMedia(button.dataset.postMedia, button.dataset.mediaIndex);
    else if (button.dataset.toggleAlt) {
      const id = "alt-" + button.dataset.toggleAlt;
      const target = document.getElementById(id);
      if (target) {
        target.hidden = !target.hidden;
        button.setAttribute("aria-expanded", String(!target.hidden));
      }
    } else if (button.dataset.searchQuery) performSearch(button.dataset.searchQuery);
    else if (button.dataset.socialToken) performSearch(button.dataset.socialToken);
    else if (button.hasAttribute("data-clear-search-history")) {
      S.searchHistory = [];
      save();
      render();
    } else if (button.dataset.openNotification) openNotification(button.dataset.openNotification);
    else if (button.hasAttribute("data-side-info")) {
      S.statusMessage = "これは作品内のローカル短文サービスです";
      save();
      render();
    } else if (button.dataset.postMenu) {
      S.statusMessage = "この投稿に利用できる追加操作はありません";
      save();
      render();
    }
  });

  root.addEventListener("keydown", (event) => {
    if (event.target.matches("[data-social-token]") && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      performSearch(event.target.dataset.socialToken);
    }
  });

  root.addEventListener("input", (event) => {
    if (event.target.matches("[name=post]")) {
      S.composeDraft = event.target.value;
      save();
      const form = event.target.closest("form");
      const count = form.querySelector(".character-count");
      const submit = form.querySelector("[type=submit]");
      const length = [...event.target.value].length;
      count.textContent = length + "/500";
      count.classList.toggle("is-near-limit", length > 470);
      submit.disabled = !event.target.value.trim() && !S.composeAttachment;
    }
  });

  root.addEventListener("submit", (event) => {
    if (event.target.matches("[data-social-compose]")) {
      event.preventDefault();
      submitPost(event.target);
    } else if (event.target.matches("[data-explore-search], [data-side-search]")) {
      event.preventDefault();
      performSearch(new FormData(event.target).get("query"));
    }
  });

  root.addEventListener("change", (event) => {
    if (event.target.matches("[data-compose-file]")) chooseComposeMedia(event.target);
  });

  window.addEventListener("vdm-open-payload", (event) => {
    const detail = event.detail || {};
    if (detail.postId) openPost(detail.postId);
    else if (detail.profileId) openProfile(detail.profileId);
    else if (detail.query) performSearch(detail.query);
  });

  render();
})();
