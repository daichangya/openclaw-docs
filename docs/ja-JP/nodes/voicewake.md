---
read_when:
    - 音声ウェイクワードの動作やデフォルトを変更する場合
    - ウェイクワード同期が必要な新しいノードプラットフォームを追加する場合
summary: グローバル音声ウェイクワード（Gateway 所有）と、それらがノード間でどのように同期されるか
title: Voice Wake
x-i18n:
    generated_at: "2026-04-05T12:49:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80e0cf7f68a3d48ff79af0ffb3058a7a0ecebd2cdbaad20b9ff53bc2b39dc84
    source_path: nodes/voicewake.md
    workflow: 15
---

# Voice Wake (Global Wake Words)

OpenClaw は、**ウェイクワードを Gateway が所有する単一のグローバルリスト**として扱います。

- **ノードごとのカスタムウェイクワードはありません**。
- **どのノード/アプリ UI からでも** リストを編集できます。変更は Gateway によって永続化され、全員にブロードキャストされます。
- macOS と iOS では、ローカルの **Voice Wake enabled/disabled** トグルを維持します（ローカル UX と権限が異なるため）。
- Android では現在 Voice Wake は無効で、Voice タブの手動マイクフローを使います。

## 保存場所（Gateway ホスト）

ウェイクワードは Gateway マシン上の次の場所に保存されます:

- `~/.openclaw/settings/voicewake.json`

形式:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## プロトコル

### メソッド

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set`、パラメータ `{ triggers: string[] }` → `{ triggers: string[] }`

注意:

- Trigger は正規化されます（前後空白の除去、空要素の削除）。空リストはデフォルトにフォールバックします。
- 安全のために制限（件数/長さの上限）が適用されます。

### イベント

- `voicewake.changed` ペイロード `{ triggers: string[] }`

受信者:

- すべての WebSocket クライアント（macOS アプリ、WebChat など）
- 接続中のすべてのノード（iOS/Android）、およびノード接続時の初期「現在状態」プッシュでも送信されます。

## クライアント動作

### macOS アプリ

- グローバルリストを使って `VoiceWakeRuntime` トリガーを制御します。
- Voice Wake 設定の「Trigger words」を編集すると `voicewake.set` を呼び出し、その後ブロードキャストに依存して他のクライアントとの同期を維持します。

### iOS ノード

- `VoiceWakeManager` のトリガー検出にグローバルリストを使います。
- Settings で Wake Words を編集すると `voicewake.set` を呼び出し（Gateway WS 経由）、ローカルのウェイクワード検出の応答性も維持します。

### Android ノード

- Android のランタイム/Settings では現在 Voice Wake は無効です。
- Android の音声機能では、ウェイクワードトリガーの代わりに Voice タブの手動マイク入力を使います。
