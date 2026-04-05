---
read_when:
    - モデル向けにタイムスタンプがどのように正規化されるかを理解する必要がある場合
    - システムプロンプト用のユーザータイムゾーンを設定する場合
summary: エージェント、エンベロープ、プロンプトにおけるタイムゾーン処理
title: タイムゾーン
x-i18n:
    generated_at: "2026-04-05T12:42:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31a195fa43e3fc17b788d8e70d74ef55da998fc7997c4f0538d4331b1260baac
    source_path: concepts/timezone.md
    workflow: 15
---

# タイムゾーン

OpenClawはタイムスタンプを標準化し、モデルが**単一の基準時刻**を見るようにします。

## メッセージエンベロープ（デフォルトではローカル）

受信メッセージは、次のようなエンベロープでラップされます:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

エンベロープ内のタイムスタンプは、デフォルトでは**ホストのローカル時刻**で、分単位の精度です。

これは次の設定で上書きできます:

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
- `envelopeTimezone: "user"`は`agents.defaults.userTimezone`を使用します（ホストタイムゾーンにフォールバックします）。
- 固定オフセットには、明示的なIANAタイムゾーン（例: `"Europe/Vienna"`）を使用してください。
- `envelopeTimestamp: "off"`は、エンベロープヘッダーから絶対タイムスタンプを削除します。
- `envelopeElapsed: "off"`は、経過時間のサフィックス（`+2m`形式）を削除します。

### 例

**ローカル（デフォルト）:**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**固定タイムゾーン:**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**経過時間:**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## ツールペイロード（生のプロバイダーデータ + 正規化フィールド）

ツール呼び出し（`channels.discord.readMessages`、`channels.slack.readMessages`など）は、**生のプロバイダータイムスタンプ**を返します。
一貫性のために、正規化フィールドも追加されます:

- `timestampMs`（UTCエポックミリ秒）
- `timestampUtc`（ISO 8601 UTC文字列）

生のプロバイダーフィールドは保持されます。

## システムプロンプト用のユーザータイムゾーン

`agents.defaults.userTimezone`を設定すると、モデルにユーザーのローカルタイムゾーンを伝えられます。未設定の場合、OpenClawは**実行時にホストタイムゾーンを解決**します（設定は書き込みません）。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

システムプロンプトには次が含まれます:

- ローカル時刻とタイムゾーンを含む`Current Date & Time`セクション
- `Time format: 12-hour`または`24-hour`

プロンプト形式は`agents.defaults.timeFormat`（`auto` | `12` | `24`）で制御できます。

完全な動作と例については、[日付と時刻](/date-time)を参照してください。

## 関連

- [Heartbeat](/gateway/heartbeat) — アクティブ時間はスケジューリングにタイムゾーンを使用します
- [Cron Jobs](/ja-JP/automation/cron-jobs) — cron式はスケジューリングにタイムゾーンを使用します
- [日付と時刻](/date-time) — 日付/時刻の完全な動作と例
