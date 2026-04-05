---
read_when:
    - 昇格モードのデフォルト、許可リスト、またはスラッシュコマンドの挙動を調整するとき
    - サンドボックス化されたエージェントがどのようにホストへアクセスできるかを理解するとき
summary: '昇格 exec モード: サンドボックス化されたエージェントからサンドボックス外でコマンドを実行する'
title: 昇格モード
x-i18n:
    generated_at: "2026-04-05T12:58:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: f6f0ca0a7c03c94554a70fee775aa92085f15015850c3abaa2c1c46ced9d3c2e
    source_path: tools/elevated.md
    workflow: 15
---

# 昇格モード

エージェントがサンドボックス内で実行されている場合、その `exec` コマンドはサンドボックス環境内に制限されます。**昇格モード**を使うと、エージェントはそこから抜け出し、代わりにサンドボックス外でコマンドを実行できます。承認ゲートは設定可能です。

<Info>
  昇格モードが挙動を変えるのは、エージェントが**サンドボックス化されている**場合だけです。サンドボックス化されていないエージェントでは、`exec` はすでにホスト上で実行されます。
</Info>

## ディレクティブ

セッション単位でスラッシュコマンドを使って昇格モードを制御します。

| Directive        | What it does |
| ---------------- | ------------ |
| `/elevated on`   | 設定されたホストパスでサンドボックス外実行に切り替え、承認は維持する |
| `/elevated ask`  | `on` と同じ（エイリアス） |
| `/elevated full` | 設定されたホストパスでサンドボックス外実行に切り替え、承認をスキップする |
| `/elevated off`  | サンドボックス内に制限された実行へ戻す |

`/elev on|off|ask|full` でも利用できます。

引数なしで `/elevated` を送ると、現在のレベルを確認できます。

## 仕組み

<Steps>
  <Step title="利用可能か確認する">
    昇格は config で有効になっている必要があり、送信者が許可リストに入っていなければなりません。

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="レベルを設定する">
    ディレクティブだけのメッセージを送ると、そのセッションのデフォルトを設定できます。

    ```
    /elevated full
    ```

    またはインラインでも使えます（そのメッセージにのみ適用されます）。

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="コマンドはサンドボックス外で実行される">
    昇格が有効な間、`exec` 呼び出しはサンドボックスを出て実行されます。実際のホストはデフォルトで
    `gateway`、設定済みまたはセッションの exec target が `node` の場合は `node` です。`full` モードでは、
    exec の承認はスキップされます。`on`/`ask` モードでは、設定された承認ルールが引き続き適用されます。
  </Step>
</Steps>

## 解決順序

1. メッセージ上の**インラインディレクティブ**（そのメッセージのみに適用）
2. **セッション上書き**（ディレクティブだけのメッセージ送信で設定）
3. **グローバルデフォルト**（config の `agents.defaults.elevatedDefault`）

## 利用可否と許可リスト

- **グローバルゲート**: `tools.elevated.enabled`（`true` である必要があります）
- **送信者許可リスト**: チャンネルごとの一覧を持つ `tools.elevated.allowFrom`
- **エージェント単位のゲート**: `agents.list[].tools.elevated.enabled`（さらに制限することしかできません）
- **エージェント単位の許可リスト**: `agents.list[].tools.elevated.allowFrom`（送信者はグローバル + エージェント単位の両方に一致する必要があります）
- **Discord のフォールバック**: `tools.elevated.allowFrom.discord` が省略されている場合、`channels.discord.allowFrom` がフォールバックとして使われます
- **すべてのゲートを通過する必要があります**。そうでない場合、昇格は利用不可として扱われます

許可リスト項目の形式:

| Prefix                  | Matches |
| ----------------------- | ------- |
| （なし）                | 送信者 ID、E.164、または From フィールド |
| `name:`                 | 送信者の表示名 |
| `username:`             | 送信者のユーザー名 |
| `tag:`                  | 送信者タグ |
| `id:`, `from:`, `e164:` | 明示的な識別情報指定 |

## 昇格で制御しないもの

- **tool policy**: `exec` が tool policy によって拒否されている場合、昇格でもそれを上書きできません
- **ホスト選択ポリシー**: 昇格は `auto` を自由なクロスホスト上書きにはしません。設定済みまたはセッションの exec target ルールを使い、target がすでに `node` の場合にのみ `node` を選びます
- **`/exec` とは別物**: `/exec` ディレクティブは、認可された送信者向けにセッションごとの exec デフォルトを調整するもので、昇格モードは必要ありません

## 関連

- [Exec tool](/tools/exec) — シェルコマンドの実行
- [Exec approvals](/tools/exec-approvals) — 承認および許可リストの仕組み
- [Sandboxing](/ja-JP/gateway/sandboxing) — サンドボックス設定
- [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)
