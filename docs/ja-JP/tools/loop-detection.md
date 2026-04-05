---
read_when:
    - ユーザーから、エージェントがツール呼び出しを繰り返して動けなくなるという報告があったとき
    - 反復呼び出し保護を調整する必要があるとき
    - エージェントのツール/ランタイムポリシーを編集しているとき
summary: 反復するツール呼び出しループを検出するガードレールを有効化して調整する方法
title: ツールループ検出
x-i18n:
    generated_at: "2026-04-05T12:59:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc3c92579b24cfbedd02a286b735d99a259b720f6d9719a9b93902c9fc66137d
    source_path: tools/loop-detection.md
    workflow: 15
---

# ツールループ検出

OpenClaw は、エージェントが繰り返しのツール呼び出しパターンに陥るのを防ぐことができます。
このガードは**デフォルトで無効**です。

厳しい設定では正当な繰り返し呼び出しまでブロックする可能性があるため、必要な場所でのみ有効化してください。

## これが存在する理由

- 進展のない反復シーケンスを検出する。
- 高頻度の無結果ループ（同じツール、同じ入力、繰り返されるエラー）を検出する。
- 既知のポーリング系ツールに対する特定の反復呼び出しパターンを検出する。

## 設定ブロック

グローバルデフォルト:

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

エージェントごとの上書き（任意）:

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### フィールドの動作

- `enabled`: マスタースイッチ。`false` の場合、ループ検出は実行されません。
- `historySize`: 分析のために保持する最近のツール呼び出し数。
- `warningThreshold`: パターンを警告のみと分類する前のしきい値。
- `criticalThreshold`: 反復ループパターンをブロックするしきい値。
- `globalCircuitBreakerThreshold`: 進展なしのグローバルブレーカーしきい値。
- `detectors.genericRepeat`: 同一ツール + 同一パラメータの反復パターンを検出します。
- `detectors.knownPollNoProgress`: 状態変化のない既知のポーリング風パターンを検出します。
- `detectors.pingPong`: 交互に繰り返す ping-pong パターンを検出します。

## 推奨セットアップ

- `enabled: true` で開始し、デフォルト値は変更しないでください。
- しきい値は `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold` の順序を保ってください。
- 誤検知が発生する場合:
  - `warningThreshold` や `criticalThreshold` を引き上げる
  - （必要に応じて）`globalCircuitBreakerThreshold` を引き上げる
  - 問題を起こしている detector のみを無効にする
  - 履歴コンテキストを緩めるため `historySize` を減らす

## ログと想定される動作

ループが検出されると、OpenClaw はループイベントを報告し、重大度に応じて次のツールサイクルをブロックまたは抑制します。
これにより、通常のツールアクセスを保ちながら、暴走によるトークン消費やロックアップからユーザーを保護します。

- まず警告と一時的な抑制を優先してください。
- 繰り返しの証拠が積み上がった場合にのみエスカレーションしてください。

## 注意

- `tools.loopDetection` はエージェントレベルの上書きとマージされます。
- エージェントごとの設定は、グローバル値を完全に上書きするか拡張します。
- 設定が存在しない場合、ガードレールは無効のままです。
