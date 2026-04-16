---
x-i18n:
    generated_at: "2026-04-16T04:44:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95e56c5411204363676f002059c942201503e2359515d1a4b409882cc2e04920
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

# Async Exec 重複完了の調査

## 対象範囲

- セッション: `agent:main:telegram:group:-1003774691294:topic:1`
- 症状: 同じ session/run `keen-nexus` の async exec completion が、LCM にユーザーターンとして 2 回記録された。
- 目的: これが重複セッション注入なのか、単なるアウトバウンド配信リトライなのかを特定する。

## 結論

最も可能性が高いのは、純粋なアウトバウンド配信リトライではなく、**重複セッション注入**です。

Gateway 側で最も強い欠落箇所は、**node exec completion path** にあります。

1. Node 側の exec 完了が、完全な `runId` を含む `exec.finished` を送出する。
2. Gateway の `server-node-events` がそれを system event に変換し、Heartbeat を要求する。
3. Heartbeat run が、drain された system event ブロックを agent prompt に注入する。
4. 埋め込み runner が、その prompt を session transcript の新しい user turn として永続化する。

同じ `runId` に対する同じ `exec.finished` が、どのような理由であれ（replay、reconnect duplicate、upstream resend、duplicated producer）Gateway に 2 回到達した場合、OpenClaw のこの path には現在 `runId` / `contextKey` をキーにした idempotency check が**ありません**。2 回目も同じ内容の 2 件目の user message になります。

## 正確なコードパス

### 1. Producer: node exec completion event

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` が event `exec.finished` を持つ `node.event` を送出する。
  - payload には `sessionKey` と完全な `runId` が含まれる。

### 2. Gateway event ingestion

- `src/gateway/server-node-events.ts:574-640`
  - `exec.finished` を処理する。
  - 次の text を構築する:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - 次で queue に積む:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - 直後に wake を要求する:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. System event dedupe の弱点

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` が抑制するのは、**連続する重複 text** のみ:
    - `if (entry.lastText === cleaned) return false`
  - `contextKey` は保存しているが、idempotency には **使っていない**。
  - drain 後は duplicate suppression がリセットされる。

つまり、同じ `runId` を持つ replay された `exec.finished` は、そのコードがすでに安定した idempotency 候補（`exec:<runId>`）を持っているにもかかわらず、後から再度受理されうる。

### 4. Wake handling は主要な重複要因ではない

- `src/infra/heartbeat-wake.ts:79-117`
  - wake は `(agentId, sessionKey)` で coalesce される。
  - 同じ対象への重複 wake request は、1 件の pending wake entry にまとめられる。

このため、**wake handling の重複だけ**で説明するよりも、event ingestion の重複のほうがより強い説明になる。

### 5. Heartbeat が event を消費し、prompt input に変換する

- `src/infra/heartbeat-runner.ts:535-574`
  - preflight で pending system event を peek し、exec-event run を分類する。
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` が、その session の queue を drain する。
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - drain された system event block が agent prompt body の先頭に付加される。

### 6. Transcript injection point

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` が、完全な prompt を埋め込み PI session に送信する。
  - completion 由来の prompt が永続化された user turn になるのは、この地点である。

したがって、同じ system event が 2 回 prompt に再構築されれば、LCM に重複した user message が現れるのは自然な結果である。

## なぜ単なるアウトバウンド配信リトライの可能性が低いのか

Heartbeat runner には実際に outbound failure path がある:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - まず reply が生成される。
  - その後 `deliverOutboundPayloads(...)` によりアウトバウンド配信が行われる。
  - ここでの失敗は `{ status: "failed" }` を返す。

ただし、同じ system event queue entry に対しては、これだけでは**重複した user turn** を十分に説明できない。

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - system event queue は、アウトバウンド配信より前にすでに drain されている。

つまり、channel send retry それ自体では、まったく同じ queue 済み event は再生成されない。外部配信の欠落や失敗は説明できても、同一の session user message が再度作られること自体は説明できない。

## 二次的な、低信頼度の可能性

Agent runner には full-run retry loop が存在する:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - 特定の transient failure により、run 全体を retry し、同じ `commandBody` を再送信することがある。

これは、retry 条件が発生する前に prompt がすでに append 済みであった場合、**同一 reply execution 内で**永続化された user prompt を重複させうる。

ただし、これを duplicate `exec.finished` ingestion より下位に置く理由は次のとおり:

- 観測されたギャップが約 51 秒であり、これは in-process retry より、2 回目の wake / turn に見える。
- 報告には message send failure の繰り返しも含まれており、これは即時の model/runtime retry より、後続の別ターンを示唆する。

## Root Cause Hypothesis

最も信頼度の高い仮説:

- `keen-nexus` completion は **node exec event path** を経由して到達した。
- 同じ `exec.finished` が `server-node-events` に 2 回配信された。
- `enqueueSystemEvent(...)` は `contextKey` / `runId` で dedupe しないため、Gateway は両方を受け入れた。
- 受け入れられた各 event が Heartbeat をトリガーし、それぞれが PI transcript に user turn として注入された。

## 提案する小さく外科的な修正

修正するなら、最小で効果の高い変更は次のいずれか:

- 少なくとも厳密な `(sessionKey, contextKey, text)` の重複について、短い保持期間で exec / system-event の idempotency が `contextKey` を尊重するようにする。
- または、`server-node-events` に `(sessionKey, runId, event kind)` をキーとした `exec.finished` 専用の dedupe を追加する。

これにより、replay された `exec.finished` の重複が session turn になる前に直接ブロックされる。
