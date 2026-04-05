---
read_when:
    - 位置情報ノード対応や権限 UI を追加する場合
    - Android の位置情報権限やフォアグラウンド動作を設計する場合
summary: ノード向け位置情報コマンド（`location.get`）、権限モード、Android のフォアグラウンド動作
title: Location Command
x-i18n:
    generated_at: "2026-04-05T12:49:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c691cfe147b0b9b16b3a4984d544c168a46b37f91d55b82b2507407d2011529
    source_path: nodes/location-command.md
    workflow: 15
---

# Location command (nodes)

## 要点

- `location.get` はノードコマンドです（`node.invoke` 経由）。
- デフォルトでは無効です。
- Android アプリ設定ではセレクターを使います: Off / While Using。
- 別個のトグル: Precise Location。

## なぜスイッチだけでなくセレクターなのか

OS の権限は多段階です。アプリ内ではセレクターを公開できますが、実際の許可は依然として OS が決定します。

- iOS/macOS は、システムプロンプト/設定で **While Using** または **Always** を提示することがあります。
- Android アプリは現在、フォアグラウンド位置情報のみをサポートしています。
- Precise location は別個の許可です（iOS 14+ の「Precise」、Android の「fine」と「coarse」）。

UI のセレクターは要求するモードを制御しますが、実際の許可は OS 設定側にあります。

## 設定モデル

ノードデバイスごと:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

UI 動作:

- `whileUsing` を選ぶと、フォアグラウンド権限を要求します。
- OS が要求レベルを拒否した場合、付与済みの中で最上位のレベルに戻し、状態を表示します。

## 権限マッピング（`node.permissions`）

任意です。macOS ノードは権限マップ経由で `location` を報告します。iOS/Android は省略する場合があります。

## コマンド: `location.get`

`node.invoke` 経由で呼び出されます。

パラメータ（推奨）:

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

レスポンスペイロード:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

エラー（安定コード）:

- `LOCATION_DISABLED`: セレクターが off です。
- `LOCATION_PERMISSION_REQUIRED`: 要求モードに必要な権限がありません。
- `LOCATION_BACKGROUND_UNAVAILABLE`: アプリがバックグラウンドですが、While Using しか許可されていません。
- `LOCATION_TIMEOUT`: 期限内に位置が取得できませんでした。
- `LOCATION_UNAVAILABLE`: システム障害 / 利用可能なプロバイダーがありません。

## バックグラウンド動作

- Android アプリは、バックグラウンド時に `location.get` を拒否します。
- Android で位置情報を要求する場合は OpenClaw を開いたままにしてください。
- 他のノードプラットフォームでは異なる場合があります。

## モデル/ツール統合

- ツールサーフェス: `nodes` ツールに `location_get` アクションを追加します（ノード必須）。
- CLI: `openclaw nodes location get --node <id>`。
- エージェントガイドライン: ユーザーが位置情報を有効にし、その範囲を理解している場合にのみ呼び出してください。

## UX 文言（推奨）

- Off: 「位置情報共有は無効です。」
- While Using: 「OpenClaw が開いているときのみ。」
- Precise: 「正確な GPS 位置情報を使います。おおまかな位置情報を共有するにはオフにしてください。」
