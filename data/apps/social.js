(function () {
  "use strict";
  const picture = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22640%22%20height%3D%22480%22%20viewBox%3D%220%200%20640%20480%22%3E%3Crect%20width%3D%22640%22%20height%3D%22480%22%20fill%3D%22%23e4e0f1%22/%3E%3Crect%20x%3D%2260%22%20y%3D%2260%22%20width%3D%22520%22%20height%3D%22360%22%20rx%3D%2228%22%20fill%3D%22%23fbfaf5%22/%3E%3Cpath%20d%3D%22M110%20345h420M155%20345V175h125v170M335%20345V125h150v220%22%20fill%3D%22none%22%20stroke%3D%22%236a6c98%22%20stroke-width%3D%2222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E";
  window.VDM_CONTENT_DATA.social = {
    viewer: { id: "me", name: "ローカル利用者", handle: "local_note", bio: "この端末だけのメモ用アカウント", joined: "2026年7月から利用", followingCount: 3, followerCount: 2, tone: 4 },
    accounts: [
      { id: "u1", name: "町田の散歩帳", handle: "walk_log", bio: "商店街と公園を歩いた記録。投稿はだいたい夕方。", location: "架空市", joined: "2024年4月から利用", followingCount: 84, followerCount: 326, postCount: 418, status: "public", verified: true, tone: 2, coverA: "#34675d", coverB: "#79a58e" },
      { id: "u2", name: "小さな図書室", handle: "tiny_library", bio: "開室日と返却予定だけを掲載します。", organization: "地域読書会", joined: "2025年1月から利用", followingCount: 12, followerCount: 91, postCount: 63, status: "private", tone: 3, stateNote: "承認済みの利用者だけが投稿を確認できます。" },
      { id: "u3", name: "駅前写真部", handle: "station_photo", bio: "週末の写真記録", followingCount: 33, followerCount: 144, postCount: 97, status: "suspended", tone: 1, stateNote: "利用規約の確認中です。" },
      { id: "u4", name: "削除済みユーザー", handle: "removed_user", bio: "", followingCount: 0, followerCount: 0, postCount: 0, status: "deleted", tone: 0 }
    ],
    trends: [
      { label: "週末の図書室", note: "読書会の投稿" },
      { label: "朝の散歩", note: "写真と短い記録" },
      { label: "商店街の掲示", note: "地域の通常情報" },
      { label: "雨の日の本", note: "最近よく読まれています" }
    ],
    notifications: [
      { id: "n1", type: "reply", actorId: "u1", postId: "p1", text: "あなたの投稿に返信しました", createdAt: "2026-07-13T18:20:00+09:00" },
      { id: "n2", type: "mention", actorId: "u2", postId: "p4", text: "投稿であなたに触れました", createdAt: "2026-07-13T17:42:00+09:00" },
      { id: "n3", type: "like", actorId: "u3", postId: "p2", text: "あなたの写真をいいねしました", createdAt: "2026-07-13T16:10:00+09:00" },
      { id: "n4", type: "repost", actorId: "u1", postId: "p2", text: "あなたの投稿を再共有しました", createdAt: "2026-07-12T21:15:00+09:00" },
      { id: "n5", type: "follow", actorId: "u1", profileId: "u1", text: "あなたをフォローしました", createdAt: "2026-07-12T20:11:00+09:00" },
      { id: "n6", type: "quote", actorId: "u3", postId: "p5", text: "あなたの投稿を引用しました", createdAt: "2026-07-12T18:35:00+09:00" }
    ],
    posts: [
      { id: "p1", authorId: "u1", body: "夕方の公園は風が少し涼しい。ベンチの塗装が新しくなっていました。 #朝の散歩", createdAt: "2026-07-13T18:12:00+09:00", metrics: { replies: 1, reposts: 2, likes: 14 }, views: "184" },
      { id: "p2", authorId: "u1", body: "商店街の案内板。今週は読書会と植木市が同じ日らしい。", createdAt: "2026-07-13T16:04:00+09:00", media: [{ type: "image", src: picture, alt: "淡い背景に二棟の建物を線で描いた、掲示確認用の検証画像" }], metrics: { replies: 2, reposts: 5, likes: 28 }, views: "402" },
      { id: "p3", authorId: "u1", body: "写真の右端は掲示板です。入口ではありません。", replyTo: "p2", createdAt: "2026-07-13T16:20:00+09:00", metrics: { replies: 0, reposts: 0, likes: 3 } },
      { id: "p4", authorId: "u2", body: "@local_note 返却箱は土曜も使えます。受付は閉まっています。", createdAt: "2026-07-13T15:44:00+09:00", metrics: { replies: 1, reposts: 0, likes: 4 } },
      { id: "p5", authorId: "u3", body: "同じ場所でも雨の日は色が違って見える。", quoteId: "p2", createdAt: "2026-07-12T18:31:00+09:00", metrics: { replies: 0, reposts: 1, likes: 8 } },
      { id: "p6", authorId: "u4", status: "deleted", remnant: "この投稿への返信が一件だけ残っています。", altRemnant: "白い机に青い冊子が置かれていたという画像説明" },
      { id: "p7", authorId: "u1", body: "削除された投稿への返信です。机の写真は先月のものだと思います。", replyTo: "p6", createdAt: "2026-07-11T12:22:00+09:00", metrics: { replies: 0, reposts: 0, likes: 2 } },
      { id: "p8", authorId: "u1", body: "朝はパン屋の列が短かった。塩パンは十一時前に売り切れ。", createdAt: "2026-07-10T10:58:00+09:00", metrics: { replies: 0, reposts: 1, likes: 11 } }
    ]
  };
})();
