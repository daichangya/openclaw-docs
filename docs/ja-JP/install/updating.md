---
read_when:
    - OpenClawの更新
    - 更新後に何かが壊れる
summary: グローバルインストールまたはソースでOpenClawを安全に更新する方法と、ロールバック戦略
title: 更新中
x-i18n:
    generated_at: "2026-04-22T04:23:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ab2b515457c64d24c830e2e1678d9fefdcf893e0489f0d99b039db3b877b3c4
    source_path: install/updating.md
    workflow: 15
---

# 更新

OpenClawを最新の状態に保ってください。

## 推奨: `openclaw update`

最も速い更新方法です。インストール方式（npmまたはgit）を検出し、最新バージョンを取得し、`openclaw doctor` を実行して、ゲートウェイを再起動します。

```bash
openclaw update
```

チャンネルを切り替える、または特定バージョンを対象にするには:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # 適用せずにプレビュー
```

`--channel beta` はbetaを優先しますが、betaタグが存在しないか、最新のstableリリースより古い場合、ランタイムはstable/latestにフォールバックします。一度限りのパッケージ更新で生のnpm beta dist-tagを使いたい場合は `--tag beta` を使ってください。

チャンネルの意味については [Development channels](/ja-JP/install/development-channels) を参照してください。

## 別の方法: インストーラーを再実行する

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

オンボーディングをスキップするには `--no-onboard` を追加します。ソースインストールの場合は、`--install-method git --no-onboard` を渡してください。

## 別の方法: 手動でnpm、pnpm、またはbunを使う

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### root所有のグローバルnpmインストール

一部のLinux npm環境では、グローバルパッケージが `/usr/lib/node_modules/openclaw` のようなroot所有ディレクトリにインストールされます。OpenClawはこのレイアウトをサポートしています。インストール済みパッケージはランタイム時に読み取り専用として扱われ、バンドル済みPluginのランタイム依存関係は、パッケージツリーを変更する代わりに、書き込み可能なランタイムディレクトリへステージングされます。

強化されたsystemdユニットでは、`ReadWritePaths` に含まれる書き込み可能なステージディレクトリを設定してください:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

`OPENCLAW_PLUGIN_STAGE_DIR` が設定されていない場合、OpenClawはsystemdが提供していれば `$STATE_DIRECTORY` を使い、その後 `~/.openclaw/plugin-runtime-deps` にフォールバックします。

## 自動更新機能

自動更新機能はデフォルトでオフです。`~/.openclaw/openclaw.json` で有効にします:

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

| Channel  | 動作                                                                                                            |
| -------- | --------------------------------------------------------------------------------------------------------------- |
| `stable` | `stableDelayHours` 待機した後、`stableJitterHours` 全体にわたる決定的ジッター付きで適用します（段階的ロールアウト）。 |
| `beta`   | `betaCheckIntervalHours` ごとに（デフォルト: 毎時）確認し、即時適用します。                                      |
| `dev`    | 自動適用はありません。手動で `openclaw update` を使ってください。                                               |

ゲートウェイは起動時にも更新ヒントをログに出します（`update.checkOnStart: false` で無効化）。

## 更新後

<Steps>

### doctorを実行

```bash
openclaw doctor
```

設定を移行し、DMポリシーを監査し、ゲートウェイの健全性を確認します。詳細: [Doctor](/ja-JP/gateway/doctor)

### ゲートウェイを再起動

```bash
openclaw gateway restart
```

### 確認

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

ヒント: `npm view openclaw version` で現在公開されているバージョンを確認できます。

### コミットを固定する（ソース）

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

最新に戻すには: `git checkout main && git pull`。

## 行き詰まった場合

- もう一度 `openclaw doctor` を実行し、出力を注意深く読んでください。
- ソースチェックアウトで `openclaw update --channel dev` を使う場合、必要に応じてアップデーターが `pnpm` を自動ブートストラップします。pnpm/corepackのブートストラップエラーが表示された場合は、`pnpm` を手動でインストールするか（または `corepack` を再度有効にして）、更新をやり直してください。
- 確認先: [Troubleshooting](/ja-JP/gateway/troubleshooting)
- Discordで質問: [https://discord.gg/clawd](https://discord.gg/clawd)

## 関連

- [Install Overview](/ja-JP/install) — すべてのインストール方法
- [Doctor](/ja-JP/gateway/doctor) — 更新後のヘルスチェック
- [Migrating](/ja-JP/install/migrating) — メジャーバージョン移行ガイド
