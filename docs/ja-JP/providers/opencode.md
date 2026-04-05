---
read_when:
    - OpenCodeホスト型モデルアクセスを使いたい場合
    - ZenカタログとGoカタログのどちらを選ぶか決めたい場合
summary: OpenClawでOpenCode ZenおよびGoカタログを使用する
title: OpenCode
x-i18n:
    generated_at: "2026-04-05T12:54:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: c23bc99208d9275afcb1731c28eee250c9f4b7d0578681ace31416135c330865
    source_path: providers/opencode.md
    workflow: 15
---

# OpenCode

OpenCodeは、OpenClaw内で2つのホスト型カタログを公開しています:

- **Zen** カタログ向けの `opencode/...`
- **Go** カタログ向けの `opencode-go/...`

両方のカタログは同じOpenCode APIキーを使用します。OpenClawは、upstreamのモデルごとのルーティングが正しく保たれるようにランタイムprovider idを分けていますが、オンボーディングとドキュメントではこれらを1つのOpenCodeセットアップとして扱います。

## CLIセットアップ

### Zenカタログ

```bash
openclaw onboard --auth-choice opencode-zen
openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
```

### Goカタログ

```bash
openclaw onboard --auth-choice opencode-go
openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## 設定スニペット

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## カタログ

### Zen

- ランタイムプロバイダー: `opencode`
- モデル例: `opencode/claude-opus-4-6`、`opencode/gpt-5.4`、`opencode/gemini-3-pro`
- 厳選されたOpenCodeマルチモデルプロキシを使いたい場合に最適です

### Go

- ランタイムプロバイダー: `opencode-go`
- モデル例: `opencode-go/kimi-k2.5`、`opencode-go/glm-5`、`opencode-go/minimax-m2.5`
- OpenCodeホスト型のKimi/GLM/MiniMaxラインナップを使いたい場合に最適です

## 注記

- `OPENCODE_ZEN_API_KEY` もサポートされています。
- セットアップ中に1つのOpenCodeキーを入力すると、両方のランタイムプロバイダー向け認証情報が保存されます。
- OpenCodeにサインインし、課金情報を追加して、APIキーをコピーします。
- 課金とカタログの利用可否はOpenCodeダッシュボードから管理されます。
- GeminiベースのOpenCode参照は引き続きproxy-Gemini経路上にあるため、OpenClawは
  ネイティブGemini replay検証やbootstrap rewriteを有効にせず、
  そこでGemini thought-signature sanitationを維持します。
- 非GeminiのOpenCode参照は、最小限のOpenAI互換replayポリシーを維持します。
