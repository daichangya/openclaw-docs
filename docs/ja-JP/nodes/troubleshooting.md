---
read_when:
    - nodeは接続されているのにcamera/canvas/screen/execツールが失敗する場合
    - node pairingとapprovalsの違いを整理して理解したい場合
summary: node pairing、foreground要件、権限、ツール障害をトラブルシュートする
title: Node Troubleshooting
x-i18n:
    generated_at: "2026-04-05T12:49:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2e431e6a35c482a655e01460bef9fab5d5a5ae7dc46f8f992ee51100f5c937e
    source_path: nodes/troubleshooting.md
    workflow: 15
---

# Node Troubleshooting

このページは、status上ではnodeが見えているのにnode toolsが失敗する場合に使用してください。

## コマンドの段階的確認

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

次に、node固有の確認を実行します:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

正常なシグナル:

- Nodeが接続されており、role `node` としてpairedになっている。
- `nodes describe` に、呼び出しているcapabilityが含まれている。
- Exec approvalsが期待どおりのmode/allowlistを示している。

## Foreground要件

`canvas.*`、`camera.*`、`screen.*` は、iOS/Android nodesではforeground時のみ利用できます。

簡易確認と修正:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

`NODE_BACKGROUND_UNAVAILABLE` が表示される場合は、node appをforegroundに戻して再試行してください。

## 権限マトリクス

| Capability                   | iOS                                     | Android                                      | macOS node app                | 典型的な失敗コード            |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ----------------------------- |
| `camera.snap`, `camera.clip` | Camera（clip audioにはmicも必要）       | Camera（clip audioにはmicも必要）            | Camera（clip audioにはmicも必要） | `*_PERMISSION_REQUIRED`       |
| `screen.record`              | Screen Recording（+ micは任意）         | Screen capture prompt（+ micは任意）         | Screen Recording              | `*_PERMISSION_REQUIRED`       |
| `location.get`               | While UsingまたはAlways（modeに依存）   | modeに応じてForeground/Background location   | Location permission           | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/a（node host path）                   | n/a（node host path）                        | Exec approvalsが必要          | `SYSTEM_RUN_DENIED`           |

## Pairingとapprovalsの違い

これらは別々のゲートです:

1. **Device pairing**: このnodeはgatewayに接続できるか？
2. **Gateway node command policy**: RPC command IDは `gateway.nodes.allowCommands` / `denyCommands` とplatform defaultsで許可されているか？
3. **Exec approvals**: このnodeは特定のshell commandをローカルで実行できるか？

簡易確認:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

pairingが欠けている場合は、まずnode deviceを承認してください。
`nodes describe` にcommandが出てこない場合は、gateway node command policyと、そのnodeが接続時に実際にそのcommandを宣言したかを確認してください。
pairingに問題がないのに `system.run` が失敗する場合は、そのnodeのexec approvals/allowlistを修正してください。

Node pairingはidentity/trustのゲートであり、コマンドごとの承認面ではありません。`system.run` のノードごとのポリシーは、そのnodeのexec approvals file（`openclaw approvals get --node ...`）にあり、gateway pairing recordにはありません。

approvalに基づく `host=node` 実行では、gatewayは実行を準備済みの正規 `systemRunPlan` にも結び付けます。後続の呼び出し元が、承認済み実行がforwardされる前にcommand/cwdやsession metadataを変更した場合、gatewayは編集済みpayloadを信頼せず、approval mismatchとして実行を拒否します。

## よくあるnodeエラーコード

- `NODE_BACKGROUND_UNAVAILABLE` → appがbackgroundにある。foregroundへ戻してください。
- `CAMERA_DISABLED` → node settingsでcameraトグルが無効。
- `*_PERMISSION_REQUIRED` → OS権限が不足または拒否されている。
- `LOCATION_DISABLED` → location modeがoff。
- `LOCATION_PERMISSION_REQUIRED` → 要求されたlocation modeが許可されていない。
- `LOCATION_BACKGROUND_UNAVAILABLE` → appがbackgroundにあるが、While Using権限しかない。
- `SYSTEM_RUN_DENIED: approval required` → exec requestに明示承認が必要。
- `SYSTEM_RUN_DENIED: allowlist miss` → commandがallowlist modeでブロックされた。
  Windows node hostsでは、`cmd.exe /c ...` のようなshell-wrapper形式は、
  ask flowで承認されない限り、allowlist modeではallowlist missとして扱われます。

## 迅速な復旧ループ

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

まだ詰まる場合:

- device pairingを再承認する。
- node appを再度開く（foreground）。
- OS権限を再付与する。
- exec approval policyを再作成/調整する。

関連:

- [/nodes/index](/nodes/index)
- [/nodes/camera](/nodes/camera)
- [/nodes/location-command](/nodes/location-command)
- [/tools/exec-approvals](/tools/exec-approvals)
- [/gateway/pairing](/gateway/pairing)
