---
read_when:
    - Gateway プロセスを実行またはデバッグする場合
    - 単一インスタンスの強制を調査する場合
summary: WebSocket リスナーのバインドを使う Gateway シングルトンガード
title: Gateway Lock
x-i18n:
    generated_at: "2026-04-05T12:43:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 726c687ab53f2dd1e46afed8fc791b55310a5c1e62f79a0e38a7dc4ca7576093
    source_path: gateway/gateway-lock.md
    workflow: 15
---

# Gateway lock

## 理由

- 同じホスト上の同じベースポートごとに動作する Gateway インスタンスを 1 つだけにします。追加の Gateway では、分離されたプロファイルと一意のポートを使う必要があります。
- 古いロックファイルを残さずに、クラッシュ/SIGKILL をまたいで動作します。
- 制御ポートがすでに使用中の場合は、明確なエラーですぐに失敗します。

## 仕組み

- Gateway は起動直後に、排他的な TCP リスナーを使って WebSocket リスナー（デフォルト `ws://127.0.0.1:18789`）をバインドします。
- バインドが `EADDRINUSE` で失敗した場合、起動時に `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` がスローされます。
- OS は、クラッシュや SIGKILL を含むあらゆるプロセス終了時にリスナーを自動的に解放するため、別個のロックファイルやクリーンアップ手順は不要です。
- シャットダウン時には、Gateway は WebSocket サーバーと基盤となる HTTP サーバーを閉じ、ポートをすばやく解放します。

## エラーの表面

- 別のプロセスがポートを保持している場合、起動時に `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` がスローされます。
- それ以外のバインド失敗は、`GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")` として表面化します。

## 運用上の注意

- ポートが _別の_ プロセスによって使用されている場合も、エラーは同じです。ポートを解放するか、`openclaw gateway --port <port>` で別のポートを選んでください。
- macOS アプリは Gateway を起動する前に独自の軽量 PID ガードを引き続き維持しますが、実行時ロックは WebSocket バインドによって強制されます。

## 関連

- [Multiple Gateways](/gateway/multiple-gateways) — 一意のポートで複数インスタンスを実行する方法
- [Troubleshooting](/gateway/troubleshooting) — `EADDRINUSE` とポート競合の診断
