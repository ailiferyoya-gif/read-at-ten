(function () {
  "use strict";
  const picture = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22640%22%20height%3D%22480%22%20viewBox%3D%220%200%20640%20480%22%3E%3Crect%20width%3D%22640%22%20height%3D%22480%22%20fill%3D%22%23d7e4e4%22/%3E%3Crect%20x%3D%2275%22%20y%3D%2280%22%20width%3D%22490%22%20height%3D%22320%22%20rx%3D%2224%22%20fill%3D%22%23faf8ef%22/%3E%3Cpath%20d%3D%22M105%20345l115-108%2090%2072%2087-118%20138%20154%22%20fill%3D%22none%22%20stroke%3D%22%2369908d%22%20stroke-width%3D%2224%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22162%22%20r%3D%2234%22%20fill%3D%22%23d6a86f%22/%3E%3C/svg%3E";
  const silentAudio = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
  window.VDM_CONTENT_DATA.messages = {
    viewer: { id: "me", name: "ローカル利用者" },
    contacts: [
      { conversationId: "c1", name: "森野", status: "オンライン", tone: 2 },
      { conversationId: "c2", name: "共同作業室", status: "最終アクセス 18:42", tone: 4 },
      { conversationId: "c3", name: "小田", status: "ローカル記録", tone: 1 }
    ],
    conversations: [
      {
        id: "c1", name: "森野", status: "オンライン", tone: 2, pinned: true, readDelay: 320,
        messages: [
          { id: "c1-system", type: "system", text: "この会話は端末内に保存されています", date: "7月13日", time: "18:20" },
          { id: "c1-m1", sender: "c1", text: "明日の受付、九時半で大丈夫？", date: "7月13日", time: "18:26" },
          { id: "c1-m2", sender: "me", text: "大丈夫。案内板も持っていきます。", date: "7月13日", time: "18:28" },
          { id: "c1-m3", sender: "c1", text: "配置の写真を送っておくね。", date: "7月13日", time: "18:29", quoteId: "c1-m2", attachment: { kind: "image", type: "image", src: picture, name: "配置見本.svg", alt: "淡い背景に山形の図形を置いた、会場配置確認用の検証画像" } },
          { id: "c1-m4", sender: "c1", text: "入口に一枚、受付に一枚で。", date: "7月13日", time: "18:30" }
        ],
        intents: [
          { examples: ["九時半", "受付の時間", "何時"], replies: ["九時半に入口で。遅れそうならここに残して。"], delay: 720, readDelay: 280 },
          { examples: ["案内板", "配置"], replies: ["入口に一枚、受付に一枚で足ります。"], delay: 650, readDelay: 240 }
        ],
        callTranscript: "音声は使わず、画面内のローカル通話状態だけを確認しています。"
      },
      {
        id: "c2", name: "共同作業室", status: "最終アクセス 18:42", tone: 4, muted: true,
        messages: [
          { id: "c2-m1", sender: "c2", text: "共有メモを更新しました。", date: "7月12日", time: "17:10", attachment: { kind: "file", type: "text", name: "当番表.txt", text: "午前: 森野\n午後: 小田", size: 28 } },
          { id: "c2-m2", sender: "me", text: "古い版でした。", date: "7月12日", time: "17:14", type: "unsent" },
          { id: "c2-m3", type: "notification-remnant", title: "通知プレビュー", text: "更新前の通知だけが端末に残っています", date: "7月12日", time: "17:15" },
          { id: "c2-m4", sender: "c2", text: "音声メモも置いておきます。", date: "7月12日", time: "17:16", attachment: { kind: "audio", type: "audio", src: silentAudio, name: "確認用音声.wav", transcript: "会場は九時に開きます。", noAudioEquivalent: "会場は九時に開くという確認用メモ。", size: 44 } }
        ]
      },
      {
        id: "c3", name: "小田", status: "ローカル記録", tone: 1,
        messages: [
          { id: "c3-m1", sender: "c3", text: "ファイル名だけ確認できます。", date: "7月11日", time: "11:03", attachment: { kind: "file", name: "破損した添付.dat", loadError: "添付ファイルを読み込めませんでした" } },
          { id: "c3-m2", sender: "me", text: "了解。元の端末で確認します。", date: "7月11日", time: "11:06" }
        ]
      }
    ],
    calls: [
      { id: "call-out", conversationId: "c1", direction: "outgoing", status: "completed", at: "2026-07-13T17:40:00+09:00", duration: "00:18", transcript: "受付の開始時刻を確認しました。", captions: "受付の開始時刻を確認しました。", noAudioEquivalent: "受付の開始時刻を確認した通話。" },
      { id: "call-in", conversationId: "c3", direction: "incoming", status: "incoming", at: "2026-07-13T18:04:00+09:00", duration: "00:00", transcript: "折り返しの確認です。", captions: "折り返しの確認です。", noAudioEquivalent: "折り返しを確認する着信。" },
      { id: "call-missed", conversationId: "c2", direction: "incoming", status: "missed", at: "2026-07-12T16:21:00+09:00", duration: "00:00", noAudioEquivalent: "共同作業室からの不在着信。" },
      { id: "call-voice", conversationId: "c1", direction: "incoming", status: "voicemail", at: "2026-07-12T09:32:00+09:00", duration: "00:05", audio: silentAudio, transcript: "資料は受付の箱に入れました。", captions: "資料は受付の箱に入れました。", noAudioEquivalent: "資料を受付の箱に入れたという留守番電話。" }
    ],
    saved: [
      { kind: "file", title: "当番表", note: "共同作業室から保存" }
    ]
  };
})();
