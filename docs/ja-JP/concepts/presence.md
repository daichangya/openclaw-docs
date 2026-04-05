---
read_when:
    - Instancesタブをデバッグしている場合
    - 重複または古いインスタンス行を調査している場合
    - GatewayのWS接続またはsystem-eventビーコンを変更している場合
summary: OpenClawのpresenceエントリがどのように生成、マージ、表示されるか
title: Presence
x-i18n:
    generated_at: "2026-04-05T12:41:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: a004a1f87be08699c1b2cba97cad8678ce5e27baa425f59eaa18006fdcff26e7
    source_path: concepts/presence.md
    workflow: 15
---

# Presence

OpenClawの「presence」は、以下を対象とした軽量でベストエフォートなビューです。

- **Gateway** 自体
- **Gatewayに接続しているクライアント**（mac app、WebChat、CLIなど）

presenceは主に、macOS appの**Instances**タブを描画し、
オペレーターにすばやい可視性を提供するために使われます。

## Presenceフィールド（表示されるもの）

presenceエントリは、次のようなフィールドを持つ構造化オブジェクトです。

- `instanceId`（任意ですが強く推奨）: 安定したクライアント識別子（通常は `connect.client.instanceId`）
- `host`: 人が読みやすいホスト名
- `ip`: ベストエフォートなIPアドレス
- `version`: クライアントのバージョン文字列
- `deviceFamily` / `modelIdentifier`: ハードウェアのヒント
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: 「最後のユーザー入力からの秒数」（分かっている場合）
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: 最終更新タイムスタンプ（epochからのミリ秒）

## Producers（presenceの生成元）

presenceエントリは複数のソースから生成され、**マージ**されます。

### 1) Gateway自身のエントリ

Gatewayは起動時に常に「self」エントリを初期投入するため、クライアントがまだ接続していない段階でもUIにgateway hostが表示されます。

### 2) WebSocket接続

すべてのWSクライアントは `connect` リクエストで開始します。ハンドシェイクが成功すると、
Gatewayはその接続に対するpresenceエントリをupsertします。

#### 単発のCLIコマンドが表示されない理由

CLIは短時間の単発コマンドのために接続することがよくあります。Instancesリストが
過剰に埋まるのを防ぐため、`client.mode === "cli"` はpresenceエントリには**変換されません**。

### 3) `system-event` ビーコン

クライアントは `system-event` メソッドを通じて、より詳細な定期ビーコンを送信できます。mac
appはこれを使って、ホスト名、IP、`lastInputSeconds` を報告します。

### 4) ノード接続（role: node）

ノードが `role: node` でGateway WebSocket経由で接続すると、Gatewayはそのノードのpresenceエントリをupsertします
（他のWSクライアントと同じフローです）。

## マージ + 重複排除ルール（`instanceId` が重要な理由）

presenceエントリは、単一のインメモリマップに保存されます。

- エントリは**presence key**でキー付けされます。
- 最適なキーは、再起動後も維持される安定した `instanceId`（`connect.client.instanceId` 由来）です。
- キーは大文字小文字を区別しません。

クライアントが安定した `instanceId` なしで再接続すると、
**重複した**行として表示される場合があります。

## TTLと件数上限

presenceは意図的に一時的なものです。

- **TTL:** 5分より古いエントリは削除されます
- **最大エントリ数:** 200（最も古いものから先に削除）

これにより、リストを新鮮に保ち、メモリ使用量の無制限な増加を防ぎます。

## リモート/トンネル時の注意点（ループバックIP）

クライアントがSSHトンネル / ローカルポートフォワード経由で接続すると、Gatewayは
リモートアドレスを `127.0.0.1` として見ることがあります。良好なクライアント報告IPを上書きしないように、
ループバックのリモートアドレスは無視されます。

## Consumers

### macOS Instancesタブ

macOS appは `system-presence` の出力を描画し、最終更新の経過時間に基づいて
小さなステータス表示（Active/Idle/Stale）を適用します。

## デバッグのヒント

- 生の一覧を見るには、Gatewayに対して `system-presence` を呼び出します。
- 重複が見える場合:
  - クライアントがハンドシェイクで安定した `client.instanceId` を送信していることを確認してください
  - 定期ビーコンが同じ `instanceId` を使っていることを確認してください
  - 接続由来のエントリに `instanceId` が欠けていないか確認してください（その場合、重複は想定内です）
