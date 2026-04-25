---
read_when:
    - context-engineのライフサイクル動作をCodex harnessへ組み込んでいる場合
    - lossless-clawや他のcontext-engine pluginをcodex/*のembedded harnessセッションで動作させる必要がある場合
    - embedded PiとCodex app-serverのコンテキスト動作を比較している場合
summary: bundledされたCodex app-server harnessがOpenClawのcontext-engine pluginを尊重するようにするための仕様
title: Codex HarnessのContext Engine移植
x-i18n:
    generated_at: "2026-04-25T13:52:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61c29a6cd8955a41510b8da1575b89ed003565d564b25b37b3b0c7f65df6b663
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

## ステータス

ドラフト実装仕様です。

## 目的

bundledされたCodex app-server harnessが、embedded Piターンですでに尊重されているのと同じOpenClaw context-engineライフサイクル契約を尊重するようにします。

`agents.defaults.embeddedHarness.runtime: "codex"`または
`codex/*`モデルを使うセッションでも、`lossless-claw`のような選択されたcontext-engine pluginが、Codex app-server境界で可能な範囲で、contextの組み立て、ターン後のingest、メンテナンス、OpenClawレベルのCompactionポリシーを制御できるようにする必要があります。

## 非目標

- Codex app-server内部実装を再実装しない。
- Codexネイティブthread Compactionにlossless-claw要約を生成させない。
- 非CodexモデルにCodex harnessの使用を要求しない。
- ACP/acpxセッション動作を変更しない。この仕様は、ACPではないembedded agent harnessパスのみを対象とする。
- サードパーティpluginにCodex app-server extension factoryを登録させない。既存のbundled-plugin信頼境界は変更しない。

## 現在のアーキテクチャ

embedded run loopは、具体的な低レベルharnessを選択する前に、実行ごとに設定済みcontext engineを1回解決します。

- `src/agents/pi-embedded-runner/run.ts`
  - context-engine pluginを初期化する
  - `resolveContextEngine(params.config)`を呼ぶ
  - `contextEngine`と`contextTokenBudget`を
    `runEmbeddedAttemptWithBackend(...)`へ渡す

`runEmbeddedAttemptWithBackend(...)`は、選択されたagent harnessへ委譲します。

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Codex app-server harnessは、bundledされたCodex pluginによって登録されます。

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Codex harness実装は、PI支援attemptと同じ`EmbeddedRunAttemptParams`を受け取ります。

- `extensions/codex/src/app-server/run-attempt.ts`

つまり、必要なhook pointはOpenClawが制御するコード内にあります。外部境界はCodex app-server protocol自体です。OpenClawは`thread/start`、`thread/resume`、`turn/start`へ送る内容を制御し、通知を観測できますが、Codexの内部thread storeやネイティブcompactorは変更できません。

## 現在の欠落

embedded Pi attemptは、context-engineライフサイクルを直接呼び出します。

- attempt前のbootstrap/maintenance
- モデル呼び出し前のassemble
- attempt後のafterTurnまたはingest
- successful turn後のmaintenance
- Compactionを所有するengine向けのcontext-engine Compaction

関連するPiコード:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

一方、Codex app-server attemptは現在、汎用agent-harness hookを実行し、transcriptをmirrorしますが、`params.contextEngine.bootstrap`、`params.contextEngine.assemble`、`params.contextEngine.afterTurn`、`params.contextEngine.ingestBatch`、`params.contextEngine.ingest`、`params.contextEngine.maintain`は呼び出していません。

関連するCodexコード:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## 望ましい動作

Codex harnessターンでは、OpenClawは次のライフサイクルを維持すべきです。

1. mirrorされたOpenClawセッションtranscriptを読み取る。
2. 以前のsession fileが存在する場合、アクティブなcontext engineをbootstrapする。
3. 利用可能ならbootstrap maintenanceを実行する。
4. アクティブなcontext engineを使ってcontextをassembleする。
5. assemble済みcontextをCodex互換入力へ変換する。
6. context-engineの`systemPromptAddition`を含むdeveloper instructionsでCodex threadを開始または再開する。
7. assemble済みのユーザー向けpromptでCodex turnを開始する。
8. Codex結果をOpenClaw transcriptへmirrorし戻す。
9. 実装されていれば`afterTurn`を呼び、そうでなければmirror済みtranscript snapshotを使って`ingestBatch`/`ingest`を呼ぶ。
10. successfulかつ非abortedなturnの後でturn maintenanceを実行する。
11. CodexネイティブCompactionシグナルとOpenClaw Compaction hookを維持する。

## 設計上の制約

### Codex app-serverはネイティブthread stateの正式な所有者のままである

Codexはネイティブthreadと、内部の拡張履歴を所有します。OpenClawは、サポートされたprotocol呼び出し以外でapp-serverの内部履歴を変更しようとすべきではありません。

OpenClawのtranscript mirrorは、OpenClaw機能のソースのままであり続けます。

- チャット履歴
- 検索
- `/new`と`/reset`の記録管理
- 将来のmodelまたはharness切り替え
- context-engine plugin state

### Context engineのassembleはCodex入力へ投影されなければならない

context-engine interfaceが返すのはCodex thread patchではなく、OpenClaw `AgentMessage[]`です。Codex app-serverの`turn/start`は現在のユーザー入力を受け取り、`thread/start`と`thread/resume`はdeveloper instructionsを受け取ります。

したがって、実装にはprojection layerが必要です。安全な初期バージョンでは、Codex内部履歴を置き換えられるふりを避けるべきです。assemble済みcontextを、現在のturnの周囲にある決定論的なprompt/developer-instruction素材として注入するべきです。

### Prompt cacheの安定性が重要

lossless-clawのようなengineでは、入力が変わらない限り、assemble済みcontextは決定論的であるべきです。生成されるcontext textに、タイムスタンプ、ランダムid、または非決定的な順序を追加してはいけません。

### Pi fallbackセマンティクスは変更しない

Harness選択は現状のまま維持します。

- `runtime: "pi"`はPiを強制する
- `runtime: "codex"`は登録済みCodex harnessを選択する
- `runtime: "auto"`はplugin harnessがサポートされるproviderを引き受けられるようにする
- `fallback: "none"`は、plugin harnessが一致しない場合のPi fallbackを無効にする

この作業が変えるのは、Codex harnessが選択された後に何が起こるかです。

## 実装計画

### 1. 再利用可能なcontext-engine attempt helperをexportまたは移設する

現在、再利用可能なライフサイクルhelperはPi runner配下にあります。

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

可能であれば、Codexは名前からPi専用であることを示す実装パスからimportすべきではありません。

たとえば、harnessに依存しないmoduleを作成します。

- `src/agents/harness/context-engine-lifecycle.ts`

移動またはre-exportするもの:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- `runContextEngineMaintenance`の小さなwrapper

古いファイルからre-exportするか、同じPRでPiの呼び出し側を更新することで、Pi側importも引き続き動作させてください。

中立的なhelper名はPiに言及すべきではありません。

推奨名:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Codex context projection helperを追加する

新しいmoduleを追加します。

- `extensions/codex/src/app-server/context-engine-projection.ts`

責務:

- assemble済み`AgentMessage[]`、元のmirror済み履歴、現在のpromptを受け取る。
- どのcontextをdeveloper instructionsへ入れ、どれを現在のユーザー入力へ入れるかを判定する。
- 現在のユーザーpromptを最後の実行対象リクエストとして維持する。
- 以前のメッセージを安定した明示形式でrenderする。
- 揮発的メタデータを避ける。

提案API:

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

推奨される初期projection:

- `systemPromptAddition`をdeveloper instructionsへ入れる。
- assemble済みtranscript contextを現在のpromptの前の`promptText`へ入れる。
- それがOpenClaw assemble済みcontextであることを明確にラベル付けする。
- 現在のpromptは最後に保つ。
- 現在のユーザーpromptがすでに末尾にある場合は重複を除外する。

prompt形状の例:

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

これはネイティブCodex履歴操作より洗練されていませんが、OpenClaw内で実装可能であり、context-engineセマンティクスを維持します。

将来的な改善: Codex app-serverがthread履歴の置換または補足のためのprotocolを公開した場合、このprojection layerをそのAPIを使う形に差し替えます。

### 3. Codex thread起動前にbootstrapを組み込む

`extensions/codex/src/app-server/run-attempt.ts`で:

- 現在と同様にmirror済みsession historyを読む。
- この実行前にsession fileが存在していたかを判定する。mirror書き込み前に`fs.stat(params.sessionFile)`を確認するhelperを優先してください。
- `SessionManager`を開くか、helperが必要とするなら狭いsession manager adapterを使う。
- `params.contextEngine`が存在する場合、中立helperを呼ぶ。

疑似フロー:

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

Codex tool bridgeおよびtranscript mirrorと同じ`sessionKey`規約を使用してください。現在、Codexは`params.sessionKey`または`params.sessionId`から`sandboxSessionKey`を計算しています。生の`params.sessionKey`を保持する理由がない限り、それを一貫して使ってください。

### 4. `thread/start` / `thread/resume`および`turn/start`の前にassembleを組み込む

`runCodexAppServerAttempt`で:

1. まずdynamic toolsを構築し、context engineが実際に利用可能なtool名を確認できるようにする。
2. mirror済みsession historyを読む。
3. `params.contextEngine`が存在する場合、context-engine `assemble(...)`を実行する。
4. assemble結果を次へ投影する:
   - developer instruction追加分
   - `turn/start`用prompt text

既存のhook呼び出し:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

は、context-awareにする必要があります。

1. `buildDeveloperInstructions(params)`でベースdeveloper instructionsを計算する
2. context-engine assemble/projectionを適用する
3. 投影済みprompt/developer instructionsで`before_prompt_build`を実行する

この順序により、汎用prompt hookはCodexが受け取るのと同じpromptを見られます。厳密なPi互換が必要なら、hook構成の前にcontext-engine assembleを実行してください。Piはprompt pipeline後の最終system promptへcontext-engine `systemPromptAddition`を適用するためです。重要な不変条件は、context engineとhookの両方が、決定論的で文書化された順序を得ることです。

初期実装の推奨順序:

1. `buildDeveloperInstructions(params)`
2. context-engine `assemble()`
3. `systemPromptAddition`をdeveloper instructionsへappend/prependする
4. assemble済みmessagesをprompt textへ投影する
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. 最終developer instructionsを`startOrResumeThread(...)`へ渡す
7. 最終prompt textを`buildTurnStartParams(...)`へ渡す

将来の変更で誤って順序が変わらないよう、この仕様はテストへエンコードされるべきです。

### 5. Prompt cacheに安定したformatを維持する

projection helperは、同一入力に対してバイトレベルで安定した出力を生成しなければなりません。

- 安定したメッセージ順序
- 安定したrole label
- 生成タイムスタンプなし
- object key順序の漏れなし
- ランダムなdelimiterなし
- 実行ごとのidなし

固定delimiterと明示的sectionを使用してください。

### 6. transcript mirror後にpost-turnを組み込む

Codexの`CodexAppServerEventProjector`は、現在のturn用にローカルな`messagesSnapshot`を構築します。`mirrorTranscriptBestEffort(...)`は、そのsnapshotをOpenClaw transcript mirrorへ書き込みます。

mirrorが成功しても失敗しても、その後で、利用可能な最良のmessage snapshotを使ってcontext-engine finalizerを呼び出します。

- `afterTurn`は現在のturnだけでなくセッションsnapshotを期待するため、書き込み後の完全なmirror済みsession contextを優先します。
- session fileを再オープンできない場合は、`historyMessages + result.messagesSnapshot`へフォールバックします。

疑似フロー:

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

mirrorに失敗した場合でも、フォールバックsnapshotを使って`afterTurn`を呼び出し続けてください。ただし、そのcontext engineがフォールバックturn dataからingestしていることをログに残します。

### 7. usageとprompt cacheのruntime contextを正規化する

Codex結果には、利用可能な場合、app-server token通知から正規化されたusageが含まれます。そのusageをcontext-engine runtime contextへ渡してください。

Codex app-serverが将来的にcache read/write詳細を公開する場合は、それを`ContextEnginePromptCacheInfo`へ対応付けます。それまでは、ゼロ値を捏造するのではなく、`promptCache`を省略してください。

### 8. Compactionポリシー

Compactionシステムは2つあります。

1. OpenClaw context-engine `compact()`
2. Codex app-serverネイティブ`thread/compact/start`

これらを暗黙に混同してはいけません。

#### `/compact`と明示的なOpenClaw Compaction

選択されたcontext engineが`info.ownsCompaction === true`を持つ場合、明示的なOpenClaw Compactionは、OpenClaw transcript mirrorとplugin stateに対して、context engineの`compact()`結果を優先すべきです。

選択されたCodex harnessにネイティブthread bindingがある場合、app-server threadを健全に保つために、追加でCodexネイティブCompactionを要求してもよいですが、これは詳細内で別個のbackend actionとして報告されなければなりません。

推奨動作:

- `contextEngine.info.ownsCompaction === true`の場合:
  - まずcontext-engine `compact()`を呼ぶ
  - その後、thread bindingが存在する場合はベストエフォートでCodexネイティブCompactionを呼ぶ
  - 主結果としてcontext-engine結果を返す
  - `details.codexNativeCompaction`にCodexネイティブCompaction状態を含める
- アクティブなcontext engineがCompactionを所有していない場合:
  - 現在のCodexネイティブCompaction動作を維持する

これには、`maybeCompactAgentHarnessSession(...)`がどこで呼ばれるかに応じて、
`extensions/codex/src/app-server/compact.ts`を変更するか、汎用Compactionパスからそれをwrapする必要がある可能性があります。

#### turn中のCodexネイティブ`contextCompaction`イベント

Codexは、turn中に`contextCompaction` item eventを発行することがあります。`event-projector.ts`内の現在のCompaction前後hook発行は維持してください。ただし、それを完了済みcontext-engine Compactionとして扱ってはいけません。

Compactionを所有するengineに対して、CodexがそれでもネイティブCompactionを行った場合は、明示的なdiagnosticを発行します。

- stream/event名: 既存の`compaction` streamで問題ありません
- details: `{ backend: "codex-app-server", ownsCompaction: true }`

これにより、分離が監査可能になります。

### 9. セッションresetとbinding動作

既存のCodex harness `reset(...)`は、OpenClaw session fileからCodex app-server bindingを消去します。この動作は維持してください。

また、context-engine state cleanupが既存のOpenClaw session lifecycleパスを通じて引き続き発生することも確認してください。すべてのharnessで現在reset/deleteイベントをcontext-engine lifecycleが取りこぼしているのでない限り、Codex固有のcleanupは追加しないでください。

### 10. エラーハンドリング

Piセマンティクスに従います。

- bootstrap失敗は警告して継続
- assemble失敗は警告し、未assembleのpipeline messages/promptへフォールバック
- afterTurn/ingest失敗は警告し、post-turn finalizationを不成功としてマーク
- maintenanceはsuccessfulかつ非abortedかつ非yield turnの後にのみ実行
- Compactionエラーは新しいpromptとして再試行しない

Codex固有の追加:

- context projectionが失敗した場合、警告して元のpromptへフォールバックする
- transcript mirrorが失敗した場合でも、フォールバックmessagesでcontext-engine finalizationを試みる
- context-engine Compactionが成功した後にCodexネイティブCompactionが失敗しても、context engineが主である場合はOpenClaw全体のCompactionを失敗にしない

## テスト計画

### ユニットテスト

`extensions/codex/src/app-server`配下にテストを追加します。

1. `run-attempt.context-engine.test.ts`
   - session fileが存在する場合、Codexが`bootstrap`を呼ぶ。
   - Codexが、mirror済みmessages、token budget、tool名、
     citations mode、model id、promptを使って`assemble`を呼ぶ。
   - `systemPromptAddition`がdeveloper instructionsに含まれる。
   - assemble済みmessagesが、現在リクエストの前のpromptへ投影される。
   - Codexがtranscript mirroring後に`afterTurn`を呼ぶ。
   - `afterTurn`がなければ、Codexが`ingestBatch`またはメッセージ単位の`ingest`を呼ぶ。
   - successful turn後にturn maintenanceが実行される。
   - prompt error、abort、yield abortではturn maintenanceが実行されない。

2. `context-engine-projection.test.ts`
   - 同一入力に対して安定した出力
   - assemble済み履歴に現在promptが含まれていても、現在promptが重複しない
   - 空の履歴を扱える
   - role順序を保持する
   - system prompt additionはdeveloper instructionsにのみ含まれる

3. `compact.context-engine.test.ts`
   - Compactionを所有するcontext engineの主結果が優先される
   - 併せて試行された場合、CodexネイティブCompaction状態がdetailsに現れる
   - Codexネイティブ失敗は、Compactionを所有するcontext-engine Compactionを失敗にしない
   - Compaction非所有のcontext engineでは現在のネイティブCompaction動作を維持する

### 更新する既存テスト

- `extensions/codex/src/app-server/run-attempt.test.ts`があればそれ、なければ
  最も近いCodex app-server runテスト。
- Compaction event detailsが変わる場合のみ`extensions/codex/src/app-server/event-projector.test.ts`。
- config動作が変わらない限り、`src/agents/harness/selection.test.ts`は変更不要であるべきです。安定したままであるべきです。
- Pi context-engineテストは変更なしで引き続き通るべきです。

### 統合 / ライブテスト

Codex harness smoke testを追加または拡張します。

- `plugins.slots.contextEngine`をテストengineに設定する
- `agents.defaults.model`を`codex/*`モデルに設定する
- `agents.defaults.embeddedHarness.runtime = "codex"`を設定する
- テストengineが以下を観測したことを確認する:
  - bootstrap
  - assemble
  - afterTurnまたはingest
  - maintenance

OpenClaw coreテストでlossless-clawを必須にしないでください。小さなin-repo fake context engine pluginを使用してください。

## 観測性

Codex context-engineライフサイクル呼び出しの周辺にdebug logを追加します。

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped`（理由付き）
- `codex native compaction completed alongside context-engine compaction`

完全なpromptやtranscript内容はログしないでください。

有用な場所では構造化フィールドを追加します。

- `sessionId`
- 既存のlogging慣行に従ってマスクまたは省略された`sessionKey`
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## 移行 / 互換性

これは後方互換であるべきです。

- context engineが設定されていない場合、legacy context engine動作は現在のCodex harness動作と等価であるべきです。
- context-engine `assemble`が失敗した場合、Codexは元のpromptパスで継続すべきです。
- 既存のCodex thread bindingは引き続き有効であるべきです。
- Dynamic tool fingerprintingにcontext-engine出力を含めてはいけません。そうしないと、context変更のたびに新しいCodex threadが強制される可能性があります。dynamic tool fingerprintに影響すべきなのはtool catalogだけです。

## 未解決の問い

1. assemble済みcontextは、ユーザーpromptへ全て注入すべきか、developer instructionsへ全て注入すべきか、それとも分割すべきか。

   推奨: 分割。`systemPromptAddition`はdeveloper instructionsへ、assemble済みtranscript contextはユーザーpromptラッパーへ入れます。これが、ネイティブthread履歴を変更せずに現在のCodex protocolへ最もよく適合します。

2. context engineがCompactionを所有している場合、CodexネイティブCompactionは無効化すべきか。

   推奨: いいえ、少なくとも初期段階では。CodexネイティブCompactionは、app-server threadを生かし続けるために依然必要な可能性があります。ただし、それはcontext-engine Compactionとしてではなく、ネイティブCodex Compactionとして報告されなければなりません。

3. `before_prompt_build`はcontext-engine assembleの前に実行すべきか、後に実行すべきか。

   推奨: Codexではcontext-engine projectionの後。そうすることで、汎用harness hookはCodexが実際に受け取るprompt/developer instructionsを見られます。Pi互換性のために逆が必要な場合は、選んだ順序をテストへエンコードし、ここに文書化してください。

4. Codex app-serverは、将来structured context/history overrideを受け入れられるか。

   不明。可能であれば、ライフサイクル呼び出しは変更せず、text projection layerをそのprotocolへ置き換えてください。

## 受け入れ基準

- `codex/*` embedded harnessターンが、選択されたcontext engineのassembleライフサイクルを呼び出す。
- context-engine `systemPromptAddition`がCodex developer instructionsへ影響する。
- assemble済みcontextが、Codex turn入力へ決定論的に影響する。
- successfulなCodex turnが`afterTurn`またはingest fallbackを呼ぶ。
- successfulなCodex turnがcontext-engine turn maintenanceを実行する。
- failed/aborted/yield-abortedなturnではturn maintenanceを実行しない。
- context-engine所有のCompactionがOpenClaw/plugin stateに対して引き続き主である。
- CodexネイティブCompactionがネイティブCodex動作として引き続き監査可能である。
- 既存のPi context-engine動作は変更されない。
- non-legacy context engineが選択されていない場合、またはassembleに失敗した場合、既存のCodex harness動作は変更されない。
