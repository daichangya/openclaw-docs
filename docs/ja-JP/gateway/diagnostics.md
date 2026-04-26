---
read_when:
    - バグレポートまたはサポート依頼の準備
    - Gatewayのクラッシュ、再起動、メモリ圧迫、または巨大すぎるpayloadのデバッグ
    - 記録またはマスクされる診断データの確認
summary: バグレポート用に共有可能なGateway診断バンドルを作成する
title: 診断エクスポート
x-i18n:
    generated_at: "2026-04-26T11:29:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64866d929ed42f8484aa7c153e3056bad7b594d9e02705c095b7005f3094ec36
    source_path: gateway/diagnostics.md
    workflow: 15
---

OpenClawは、バグレポートに添付しても安全なローカル診断zipを作成できます。これは、サニタイズ済みのGateway status、health、logs、config形状、および最近のpayloadを含まないstability eventをまとめたものです。

## クイックスタート

```bash
openclaw gateway diagnostics export
```

このコマンドは、書き込まれたzipパスを表示します。パスを指定するには:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

自動化向け:

```bash
openclaw gateway diagnostics export --json
```

## エクスポート内容

zipには次が含まれます:

- `summary.md`: サポート向けの人間が読める概要。
- `diagnostics.json`: config、logs、status、health、stabilityデータの機械可読サマリー。
- `manifest.json`: エクスポートmetadataとfile一覧。
- サニタイズ済みconfig形状と非secretのconfig詳細。
- サニタイズ済みlogサマリーと最近のマスク済みlog行。
- ベストエフォートのGateway statusおよびhealthスナップショット。
- `stability/latest.json`: 利用可能な場合の最新の永続化stability bundle。

このエクスポートは、Gatewayが不健全な場合でも役立ちます。Gatewayがstatusやhealthリクエストに応答できない場合でも、ローカルlogs、config形状、最新stability bundleは利用可能な限り収集されます。

## プライバシーモデル

診断は共有可能になるよう設計されています。エクスポートには、デバッグに役立つ運用データが保持されます。たとえば:

- subsystem名、plugin id、provider id、channel id、設定済みmode
- status code、duration、byte count、queue state、memory reading
- サニタイズ済みlog metadataとマスク済み運用メッセージ
- config形状と非secretのfeature設定

エクスポートでは、次を省略またはマスクします:

- チャットテキスト、プロンプト、instruction、Webhook body、tool出力
- 認証情報、API key、token、cookie、secret値
- 生のrequest bodyまたはresponse body
- account id、message id、生のsession id、hostname、ローカルusername

log messageがユーザー、チャット、プロンプト、またはtool payloadテキストに見える場合、エクスポートは「メッセージが省略された」という情報とbyte数だけを保持します。

## Stability recorder

diagnosticsが有効な場合、Gatewayはデフォルトで、上限付きのpayloadを含まないstability streamを記録します。これはcontentではなく運用上の事実のためのものです。

ライブrecorderを確認:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

fatal exit、shutdown timeout、またはrestart startup failure後の最新の永続化stability bundleを確認:

```bash
openclaw gateway stability --bundle latest
```

最新の永続化bundleから診断zipを作成:

```bash
openclaw gateway stability --bundle latest --export
```

永続化bundleは、eventが存在する場合 `~/.openclaw/logs/stability/` 配下に保存されます。

## 便利なオプション

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: 特定のzipパスに書き込みます。
- `--log-lines <count>`: 含めるサニタイズ済みlog行の最大数。
- `--log-bytes <bytes>`: 調査するlog byte数の最大値。
- `--url <url>`: statusおよびhealthスナップショット用のGateway WebSocket URL。
- `--token <token>`: statusおよびhealthスナップショット用のGateway token。
- `--password <password>`: statusおよびhealthスナップショット用のGateway password。
- `--timeout <ms>`: statusおよびhealthスナップショットのタイムアウト。
- `--no-stability-bundle`: 永続化stability bundleの検索をスキップします。
- `--json`: 機械可読のエクスポートmetadataを出力します。

## diagnosticsを無効化

diagnosticsはデフォルトで有効です。stability recorderとdiagnostic event collectionを無効にするには:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

diagnosticsを無効化すると、バグレポートの詳細は減ります。通常のGateway loggingには影響しません。

## 関連

- [Health checks](/ja-JP/gateway/health)
- [Gateway CLI](/ja-JP/cli/gateway#gateway-diagnostics-export)
- [Gateway protocol](/ja-JP/gateway/protocol#system-and-identity)
- [Logging](/ja-JP/logging)
- [OpenTelemetry export](/ja-JP/gateway/opentelemetry) — collectorへ診断をストリーミングするための別フロー
