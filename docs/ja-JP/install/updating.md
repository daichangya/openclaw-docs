---
read_when:
    - OpenClawを更新する場合
    - 更新後に何かが壊れた場合
summary: OpenClawを安全に更新する方法（グローバルインストールまたはソース）、およびロールバック戦略
title: 更新
x-i18n:
    generated_at: "2026-04-05T12:49:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: b40429d38ca851be4fdf8063ed425faf4610a4b5772703e0481c5f1fb588ba58
    source_path: install/updating.md
    workflow: 15
---

# 更新

OpenClawを最新の状態に保ちます。

## 推奨: `openclaw update`

最も手早い更新方法です。インストール種別（npmまたはgit）を検出し、最新バージョンを取得し、`openclaw doctor`を実行して、gatewayを再起動します。

```bash
openclaw update
```

チャンネルを切り替える、または特定バージョンを指定するには:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # 適用せずにプレビュー
```

`--channel beta`はbetaを優先しますが、betaタグが存在しない場合や最新のstableリリースより古い場合、ランタイムはstable/latestへフォールバックします。単発のパッケージ更新で生のnpm beta dist-tagを使いたい場合は`--tag beta`を使用してください。

チャンネルの意味については、[開発チャンネル](/install/development-channels)を参照してください。

## 代替手段: インストーラーを再実行する

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

オンボーディングをスキップするには`--no-onboard`を追加してください。ソースインストールでは、`--install-method git --no-onboard`を渡してください。

## 代替手段: 手動でnpm、pnpm、またはbunを使う

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

## 自動アップデーター

自動アップデーターはデフォルトで無効です。`~/.openclaw/openclaw.json`で有効にします:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Channel  | 動作                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------- |
| `stable` | `stableDelayHours`待機した後、`stableJitterHours`全体にわたる決定論的ジッターで適用します（段階的ロールアウト）。 |
| `beta`   | `betaCheckIntervalHours`ごと（デフォルト: 毎時）に確認し、すぐに適用します。                              |
| `dev`    | 自動適用はしません。手動で`openclaw update`を使用してください。                                                           |

gatewayは起動時にも更新ヒントをログ出力します（無効化するには`update.checkOnStart: false`）。

## 更新後

<Steps>

### doctorを実行する

```bash
openclaw doctor
```

設定を移行し、DMポリシーを監査し、gatewayの正常性を確認します。詳細: [Doctor](/gateway/doctor)

### gatewayを再起動する

```bash
openclaw gateway restart
```

### 確認する

```bash
openclaw health
```

</Steps>

## ロールバック

### バージョンを固定する（npm）

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Tip: 現在公開されているバージョンは`npm view openclaw version`で確認できます。

### コミットを固定する（ソース）

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

最新へ戻すには: `git checkout main && git pull`。

## 行き詰まった場合

- もう一度`openclaw doctor`を実行し、出力を注意深く読んでください。
- 確認先: [トラブルシューティング](/gateway/troubleshooting)
- Discordで質問する: [https://discord.gg/clawd](https://discord.gg/clawd)

## 関連

- [Install Overview](/install) — すべてのインストール方法
- [Doctor](/gateway/doctor) — 更新後のヘルスチェック
- [Migrating](/install/migrating) — メジャーバージョン移行ガイド
