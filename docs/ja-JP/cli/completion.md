---
read_when:
    - zsh/bash/fish/PowerShell 用のシェル補完が必要なとき
    - OpenClaw の状態ディレクトリ配下に補完スクリプトをキャッシュする必要があるとき
summary: '`openclaw completion` の CLI リファレンス（シェル補完スクリプトの生成 / インストール）'
title: completion
x-i18n:
    generated_at: "2026-04-05T12:38:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7bbf140a880bafdb7140149f85465d66d0d46e5a3da6a1e41fb78be2fd2bd4d0
    source_path: cli/completion.md
    workflow: 15
---

# `openclaw completion`

シェル補完スクリプトを生成し、必要に応じてシェルプロファイルにインストールします。

## 使用方法

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## オプション

- `-s, --shell <shell>`: 対象シェル（`zsh`, `bash`, `powershell`, `fish`; デフォルト: `zsh`）
- `-i, --install`: source 行をシェルプロファイルに追加して補完をインストール
- `--write-state`: 補完スクリプトを stdout に出力せずに `$OPENCLAW_STATE_DIR/completions` へ書き込む
- `-y, --yes`: インストール確認プロンプトをスキップ

## 注意

- `--install` は、シェルプロファイルに小さな「OpenClaw Completion」ブロックを書き込み、キャッシュされたスクリプトを参照するようにします。
- `--install` も `--write-state` も指定しない場合、このコマンドはスクリプトを stdout に出力します。
- 補完生成ではコマンドツリーを事前に読み込むため、ネストされたサブコマンドも含まれます。
