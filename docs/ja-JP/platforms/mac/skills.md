---
read_when:
    - macOSのSkills設定UIを更新している場合
    - skillsのゲーティングまたはインストール動作を変更している場合
summary: macOSのSkills設定UIとgateway経由のステータス
title: Skills（macOS）
x-i18n:
    generated_at: "2026-04-05T12:50:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ffd6744646d2c8770fa12a5e511f84a40b5ece67181139250ec4cc4301b49b8
    source_path: platforms/mac/skills.md
    workflow: 15
---

# Skills（macOS）

macOS appはGateway経由でOpenClawのSkillsを表示します。ローカルでskillsを解析することはありません。

## データソース

- `skills.status`（gateway）は、すべてのskillsに加えて、適格性と不足要件を返します
  （同梱skillsに対するallowlist blockも含みます）。
- 要件は、各 `SKILL.md` の `metadata.openclaw.requires` から導出されます。

## インストール操作

- `metadata.openclaw.install` は、インストールオプション（brew/node/go/uv）を定義します。
- appは `skills.install` を呼び出して、gateway host上でinstallerを実行します。
- 組み込みのdangerous-code `critical` 検出は、デフォルトで `skills.install` をブロックします。suspicious検出は引き続き警告のみです。dangerous overrideはgateway request側に存在しますが、デフォルトのappフローはfail-closedのままです。
- すべてのinstall optionが `download` の場合、gatewayはすべてのdownload
  choicesを表示します。
- それ以外の場合、gatewayは現在の
  install preferencesとhost binariesを使って、優先installerを1つ選びます。
  `skills.install.preferBrew` が有効で `brew` が存在する場合はHomebrewが最優先で、その後に `uv`、次に
  `skills.install.nodeManager` で設定されたnode manager、その後に
  `go` や `download` のようなフォールバックが続きます。
- Node install labelsは、`yarn` を含めて、設定されたnode managerを反映します。

## Env/API keys

- appはキーを `~/.openclaw/openclaw.json` の `skills.entries.<skillKey>` 配下に保存します。
- `skills.update` は `enabled`、`apiKey`、`env` をpatchします。

## Remote mode

- Install + config updatesは、ローカルMacではなくgateway host上で行われます。
