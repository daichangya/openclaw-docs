---
read_when:
    - OpenClaw を更新する
    - 更新後に何かが壊れた場合
summary: OpenClaw を安全に更新する（グローバルインストールまたはソース）、およびロールバック戦略
title: 更新ೆ
x-i18n:
    generated_at: "2026-04-25T13:50:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: af88eaa285145dd5fc370b28c0f9d91069b815c75ec416df726cfce4271a6b54
    source_path: install/updating.md
    workflow: 15
---

OpenClaw を最新の状態に保ってください。

## 推奨: `openclaw update`

最も手早く更新する方法です。インストール種別（npm または git）を検出し、最新バージョンを取得し、`openclaw doctor` を実行して、gateway を再起動します。

```bash
openclaw update
```

チャネルを切り替える、または特定バージョンを対象にするには:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # 適用せずにプレビュー
```

`--channel beta` は beta を優先しますが、beta タグが存在しない場合や最新 stable リリースより古い場合、ランタイムは stable/latest にフォールバックします。1 回限りのパッケージ更新で生の npm beta dist-tag を使いたい場合は `--tag beta` を使ってください。

チャネルの意味については [Development channels](/ja-JP/install/development-channels) を参照してください。

## 代替: インストーラーを再実行する

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

オンボーディングをスキップするには `--no-onboard` を追加します。ソースインストールでは、`--install-method git --no-onboard` を渡してください。

## 代替: 手動で npm、pnpm、または bun を使う

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### グローバル npm インストールとランタイム依存関係

OpenClaw は、現在のユーザーがグローバルパッケージディレクトリへ書き込み可能な場合でも、パッケージ化されたグローバルインストールをランタイム時に読み取り専用として扱います。バンドル済み Plugin ランタイム依存関係は、パッケージツリーを変更する代わりに、書き込み可能なランタイムディレクトリへステージされます。これにより、`openclaw update` が、同じインストール中に Plugin 依存関係を修復している実行中の gateway やローカル agent と競合するのを防ぎます。

一部の Linux npm セットアップでは、グローバルパッケージが `/usr/lib/node_modules/openclaw` のような root 所有ディレクトリにインストールされます。OpenClaw は同じ外部ステージングパスを通じてこのレイアウトもサポートします。

hardened systemd unit では、`ReadWritePaths` に含まれる書き込み可能なステージディレクトリを設定してください。

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

`OPENCLAW_PLUGIN_STAGE_DIR` が設定されていない場合、OpenClaw は systemd が提供していれば `$STATE_DIRECTORY` を使い、その後 `~/.openclaw/plugin-runtime-deps` にフォールバックします。

### バンドル済み Plugin ランタイム依存関係

パッケージ化インストールでは、バンドル済み Plugin ランタイム依存関係を読み取り専用のパッケージツリー外に保持します。起動時および `openclaw doctor --fix` 実行中、OpenClaw は、config でアクティブ、旧チャネル config 経由でアクティブ、またはバンドル済み manifest のデフォルトで有効になっているバンドル済み Plugin に対してのみ、ランタイム依存関係を修復します。

明示的な無効化が優先されます。無効化された Plugin やチャネルは、パッケージ内に存在するという理由だけでランタイム依存関係が修復されることはありません。外部 Plugin やカスタム load path では、引き続き `openclaw plugins install` または `openclaw plugins update` を使ってください。

## 自動更新

自動更新はデフォルトでオフです。`~/.openclaw/openclaw.json` で有効にします。

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

| Channel  | 動作                                                                                                        |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| `stable` | `stableDelayHours` 待機した後、`stableJitterHours` にわたる決定的ジッター付きで適用します（段階的ロールアウト）。 |
| `beta`   | `betaCheckIntervalHours` ごと（デフォルト: 1 時間ごと）に確認し、即時適用します。                           |
| `dev`    | 自動適用なし。手動で `openclaw update` を使ってください。                                                   |

gateway は起動時にも更新ヒントをログ出力します（`update.checkOnStart: false` で無効化）。

## 更新後

<Steps>

### doctor を実行

```bash
openclaw doctor
```

config を移行し、DM ポリシーを監査し、gateway の健全性を確認します。詳細: [Doctor](/ja-JP/gateway/doctor)

### gateway を再起動

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

- `openclaw doctor` をもう一度実行し、出力を注意深く読んでください。
- ソースチェックアウトでの `openclaw update --channel dev` では、必要に応じて updater が自動で `pnpm` をブートストラップします。pnpm/corepack のブートストラップエラーが表示された場合は、`pnpm` を手動でインストールするか（または `corepack` を再有効化して）、更新を再実行してください。
- 確認先: [Troubleshooting](/ja-JP/gateway/troubleshooting)
- Discord で質問: [https://discord.gg/clawd](https://discord.gg/clawd)

## 関連

- [Install Overview](/ja-JP/install) — すべてのインストール方法
- [Doctor](/ja-JP/gateway/doctor) — 更新後のヘルスチェック
- [Migrating](/ja-JP/install/migrating) — メジャーバージョン移行ガイド
