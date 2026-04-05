---
read_when:
    - CLIからexec承認を編集したいとき
    - Gatewayまたはnodeホストでallowlistを管理する必要があるとき
summary: '`openclaw approvals`のCLIリファレンス（Gatewayまたはnodeホスト向けのexec承認）'
title: approvals
x-i18n:
    generated_at: "2026-04-05T12:38:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b2532bfd3e6e6ce43c96a2807df2dd00cb7b4320b77a7dfd09bee0531da610e
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

**ローカルホスト**、**Gatewayホスト**、または**nodeホスト**のexec承認を管理します。
デフォルトでは、コマンドはディスク上のローカル承認ファイルを対象にします。Gatewayを対象にするには`--gateway`を、特定のnodeを対象にするには`--node`を使用します。

エイリアス: `openclaw exec-approvals`

関連:

- Exec approvals: [Exec approvals](/tools/exec-approvals)
- Nodes: [Nodes](/nodes)

## 一般的なコマンド

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get`は、ローカル、Gateway、nodeターゲットの有効なexecポリシーを表示するようになりました。

- 要求された`tools.exec`ポリシー
- ホスト承認ファイルのポリシー
- 優先順位ルール適用後の有効結果

優先順位は意図的なものです。

- ホスト承認ファイルは、強制可能な信頼できる唯一の情報源です
- 要求された`tools.exec`ポリシーは意図を狭めたり広げたりできますが、有効結果は依然としてホストルールから導出されます
- `--node`はnodeホストの承認ファイルとGatewayの`tools.exec`ポリシーを組み合わせます。実行時にはその両方が引き続き適用されるためです
- Gateway configが利用できない場合、CLIはnode承認スナップショットにフォールバックし、最終的な実行時ポリシーを計算できなかったことを注記します

## ファイルから承認を置き換える

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set`は厳密なJSONだけでなくJSON5も受け付けます。`--file`または`--stdin`のどちらかを使ってください。両方は使用できません。

## 「確認を一切出さない」 / YOLOの例

exec承認で停止させたくないホストでは、ホスト承認のデフォルトを`full` + `off`に設定します。

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

node版:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

これで変更されるのは**ホスト承認ファイル**のみです。要求されるOpenClawポリシーも揃えるには、次も設定してください。

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

この例で`tools.exec.host=gateway`とする理由:

- `host=auto`は引き続き「sandboxが使える場合はsandbox、それ以外はGateway」を意味します。
- YOLOはルーティングではなく承認に関するものです。
- sandboxが設定されている場合でもホストexecを使いたいなら、`gateway`または`/exec host=gateway`でホスト選択を明示してください。

これは現在のホストデフォルトYOLO動作に一致します。承認を厳しくしたい場合は、より制限してください。

## allowlistヘルパー

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 一般的なオプション

`get`、`set`、`allowlist add|remove`はすべて次をサポートします。

- `--node <id|name|ip>`
- `--gateway`
- 共通のnode RPCオプション: `--url`, `--token`, `--timeout`, `--json`

ターゲット指定に関する注記:

- ターゲットフラグなしの場合は、ディスク上のローカル承認ファイルが対象です
- `--gateway`はGatewayホスト承認ファイルを対象にします
- `--node`は、id、name、IP、またはidプレフィックスを解決した後、そのnodeホストを対象にします

`allowlist add|remove`は次もサポートします。

- `--agent <id>`（デフォルトは`*`）

## 注記

- `--node`は`openclaw nodes`と同じリゾルバーを使用します（id、name、ip、またはidプレフィックス）。
- `--agent`のデフォルトは`"*"`で、すべてのagentに適用されます。
- nodeホストは`system.execApprovals.get/set`を通知する必要があります（macOSアプリまたはヘッドレスnodeホスト）。
- 承認ファイルはホストごとに`~/.openclaw/exec-approvals.json`へ保存されます。
