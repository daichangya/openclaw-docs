---
read_when:
    - タイムスタンプがモデルまたはユーザーにどのように表示されるかを変更している場合
    - メッセージまたはシステムプロンプト出力での時刻フォーマットをデバッグしている場合
summary: エンベロープ、プロンプト、ツール、コネクター全体にわたる日付と時刻の処理
title: 日付と時刻
x-i18n:
    generated_at: "2026-04-05T12:42:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 753af5946a006215d6af2467fa478f3abb42b1dff027cf85d5dc4c7ba4b58d39
    source_path: date-time.md
    workflow: 15
---

# 日付と時刻

OpenClawのデフォルトは、**転送用タイムスタンプにはホストのローカル時刻**を使用し、**ユーザータイムゾーンはシステムプロンプト内でのみ**使用します。
プロバイダーのタイムスタンプは保持されるため、ツールはネイティブの意味論を維持します（現在時刻は`session_status`で利用できます）。

## メッセージエンベロープ（デフォルトではローカル）

受信メッセージは、タイムスタンプ付きでラップされます（分単位の精度）:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

このエンベロープタイムスタンプは、プロバイダーのタイムゾーンに関係なく、デフォルトでは**ホストのローカル時刻**です。

この動作は上書きできます:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"`はUTCを使用します。
- `envelopeTimezone: "local"`はホストタイムゾーンを使用します。
- `envelopeTimezone: "user"`は`agents.defaults.userTimezone`を使用します（ホストタイムゾーンにフォールバックします）。
- 固定タイムゾーンには、明示的なIANAタイムゾーン（例: `"America/Chicago"`）を使用してください。
- `envelopeTimestamp: "off"`は、エンベロープヘッダーから絶対タイムスタンプを削除します。
- `envelopeElapsed: "off"`は、経過時間のサフィックス（`+2m`形式）を削除します。

### 例

**ローカル（デフォルト）:**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**ユーザータイムゾーン:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**経過時間を有効化:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## システムプロンプト: Current Date & Time

ユーザータイムゾーンがわかっている場合、システムプロンプトには、プロンプトキャッシュを安定させるために、**時刻や時刻形式を含まない**、**タイムゾーンのみ**の専用の**Current Date & Time**セクションが含まれます:

```
Time zone: America/Chicago
```

エージェントが現在時刻を必要とする場合は、`session_status`ツールを使用してください。ステータスカードにはタイムスタンプ行が含まれます。

## システムイベント行（デフォルトではローカル）

エージェントコンテキストに挿入されるキュー済みシステムイベントには、メッセージエンベロープと同じタイムゾーン選択を使用するタイムスタンプが前置されます（デフォルト: ホストのローカル時刻）。

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### ユーザータイムゾーン + 形式を設定する

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone`は、プロンプトコンテキスト用の**ユーザーローカルタイムゾーン**を設定します。
- `timeFormat`は、プロンプト内の**12時間/24時間表示**を制御します。`auto`はOS設定に従います。

## 時刻形式の検出（auto）

`timeFormat: "auto"`の場合、OpenClawはOS設定（macOS/Windows）を確認し、ロケール形式にフォールバックします。検出された値は、システムコールの繰り返しを避けるため、**プロセスごとにキャッシュ**されます。

## ツールペイロード + コネクター（生のプロバイダー時刻 + 正規化フィールド）

チャンネルツールは、**プロバイダーネイティブのタイムスタンプ**を返し、一貫性のために正規化フィールドを追加します:

- `timestampMs`: エポックミリ秒（UTC）
- `timestampUtc`: ISO 8601 UTC文字列

生のプロバイダーフィールドは保持されるため、失われるものはありません。

- Slack: APIからのエポック風文字列
- Discord: UTC ISOタイムスタンプ
- Telegram/WhatsApp: プロバイダー固有の数値/ISOタイムスタンプ

ローカル時刻が必要な場合は、既知のタイムゾーンを使って下流で変換してください。

## 関連ドキュメント

- [システムプロンプト](/concepts/system-prompt)
- [タイムゾーン](/concepts/timezone)
- [メッセージ](/concepts/messages)
