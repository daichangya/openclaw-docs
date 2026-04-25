---
read_when:
    - OpenClaw'taki Pi SDK entegrasyon tasarımını anlama
    - Pi için ajan oturum yaşam döngüsünü, araç kullanımını veya sağlayıcı kablolamasını değiştirme
summary: OpenClaw'ın gömülü Pi ajan entegrasyonunun mimarisi ve oturum yaşam döngüsü
title: Pi entegrasyon mimarisi
x-i18n:
    generated_at: "2026-04-25T13:50:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ec260fd3e2726190ed7aa60e249b739689f2d42d230f52fa93a43cbbf90ea06
    source_path: pi.md
    workflow: 15
---

Bu belge, OpenClaw'ın yapay zeka ajan yeteneklerini desteklemek için [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) ve kardeş paketleriyle (`pi-ai`, `pi-agent-core`, `pi-tui`) nasıl entegre olduğunu açıklar.

## Genel bakış

OpenClaw, mesajlaşma gateway mimarisi içine bir yapay zeka kodlama ajanı gömmek için pi SDK'sını kullanır. pi'yi bir alt süreç olarak başlatmak veya RPC modunu kullanmak yerine, OpenClaw doğrudan `createAgentSession()` aracılığıyla pi'nin `AgentSession` sınıfını içe aktarır ve örnekler. Bu gömülü yaklaşım şunları sağlar:

- Oturum yaşam döngüsü ve olay işleme üzerinde tam denetim
- Özel araç ekleme (mesajlaşma, sandbox, kanala özgü eylemler)
- Kanal/bağlam başına sistem istemi özelleştirme
- Dallanma/Compaction desteğiyle oturum kalıcılığı
- Hata durumunda devretmeyle çok hesaplı auth profil döndürme
- Sağlayıcıdan bağımsız model değiştirme

## Paket bağımlılıkları

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| Paket             | Amaç                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `pi-ai`           | Çekirdek LLM soyutlamaları: `Model`, `streamSimple`, mesaj türleri, sağlayıcı API'leri                 |
| `pi-agent-core`   | Ajan döngüsü, araç yürütme, `AgentMessage` türleri                                                      |
| `pi-coding-agent` | Üst düzey SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, yerleşik araçlar |
| `pi-tui`          | Terminal UI bileşenleri (OpenClaw'ın yerel TUI modunda kullanılır)                                      |

## Dosya yapısı

```
src/agents/
├── pi-embedded-runner.ts          # pi-embedded-runner/ içinden yeniden dışa aktarımlar
├── pi-embedded-runner/
│   ├── run.ts                     # Ana giriş: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Oturum kurulumu içeren tek deneme mantığı
│   │   ├── params.ts              # RunEmbeddedPiAgentParams türü
│   │   ├── payloads.ts            # Çalıştırma sonuçlarından yanıt payload'ları oluşturma
│   │   ├── images.ts              # Görü modeline görsel ekleme
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Abort hata algılama
│   ├── cache-ttl.ts               # Bağlam budama için önbellek TTL izleme
│   ├── compact.ts                 # Manuel/otomatik Compaction mantığı
│   ├── extensions.ts              # Gömülü çalıştırmalar için pi uzantılarını yükleme
│   ├── extra-params.ts            # Sağlayıcıya özgü akış parametreleri
│   ├── google.ts                  # Google/Gemini dönüş sıralama düzeltmeleri
│   ├── history.ts                 # Geçmiş sınırlama (DM ve grup)
│   ├── lanes.ts                   # Oturum/genel komut şeritleri
│   ├── logger.ts                  # Alt sistem günlük kaydedici
│   ├── model.ts                   # ModelRegistry üzerinden model çözümleme
│   ├── runs.ts                    # Etkin çalıştırma izleme, iptal, kuyruk
│   ├── sandbox-info.ts            # Sistem istemi için sandbox bilgisi
│   ├── session-manager-cache.ts   # SessionManager örnek önbellekleme
│   ├── session-manager-init.ts    # Oturum dosyası başlatma
│   ├── system-prompt.ts           # Sistem istemi oluşturucu
│   ├── tool-split.ts              # Araçları builtIn ve custom olarak bölme
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel eşleme, hata açıklaması
├── pi-embedded-subscribe.ts       # Oturum olayı aboneliği/dağıtımı
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Olay işleyici fabrikası
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Akış blok yanıt parçalama
├── pi-embedded-messaging.ts       # Mesajlaşma aracı gönderim izleme
├── pi-embedded-helpers.ts         # Hata sınıflandırma, dönüş doğrulama
├── pi-embedded-helpers/           # Yardımcı modüller
├── pi-embedded-utils.ts           # Biçimlendirme yardımcıları
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Araçlar için AbortSignal sarmalama
├── pi-tools.policy.ts             # Araç izin listesi/red listesi ilkesi
├── pi-tools.read.ts               # Read aracı özelleştirmeleri
├── pi-tools.schema.ts             # Araç şeması normalleştirme
├── pi-tools.types.ts              # AnyAgentTool tür takma adı
├── pi-tool-definition-adapter.ts  # AgentTool -> ToolDefinition bağdaştırıcısı
├── pi-settings.ts                 # Ayar geçersiz kılmaları
├── pi-hooks/                      # Özel pi kancaları
│   ├── compaction-safeguard.ts    # Koruma uzantısı
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Önbellek-TTL bağlam budama uzantısı
│   └── context-pruning/
├── model-auth.ts                  # Auth profil çözümleme
├── auth-profiles.ts               # Profil deposu, soğuma, hata durumunda devretme
├── model-selection.ts             # Varsayılan model çözümleme
├── models-config.ts               # models.json oluşturma
├── model-catalog.ts               # Model katalog önbelleği
├── context-window-guard.ts        # Bağlam penceresi doğrulama
├── failover-error.ts              # FailoverError sınıfı
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Sistem istemi parametre çözümleme
├── system-prompt-report.ts        # Hata ayıklama raporu oluşturma
├── tool-summaries.ts              # Araç açıklama özetleri
├── tool-policy.ts                 # Araç ilkesi çözümleme
├── transcript-policy.ts           # Transcript doğrulama ilkesi
├── skills.ts                      # Skill anlık görüntüsü/istem oluşturma
├── skills/                        # Skill alt sistemi
├── sandbox.ts                     # Sandbox bağlam çözümleme
├── sandbox/                       # Sandbox alt sistemi
├── channel-tools.ts               # Kanala özgü araç ekleme
├── openclaw-tools.ts              # OpenClaw'a özgü araçlar
├── bash-tools.ts                  # exec/process araçları
├── apply-patch.ts                 # apply_patch aracı (OpenAI)
├── tools/                         # Tekil araç uygulamaları
│   ├── browser-tool.ts
│   ├── canvas-tool.ts
│   ├── cron-tool.ts
│   ├── gateway-tool.ts
│   ├── image-tool.ts
│   ├── message-tool.ts
│   ├── nodes-tool.ts
│   ├── session*.ts
│   ├── web-*.ts
│   └── ...
└── ...
```

Kanala özgü mesaj eylemi çalışma zamanları artık `src/agents/tools` altında değil,
Plugin'e ait uzantı dizinlerinde bulunur; örneğin:

- Discord Plugin'i eylem çalışma zamanı dosyaları
- Slack Plugin'i eylem çalışma zamanı dosyası
- Telegram Plugin'i eylem çalışma zamanı dosyası
- WhatsApp Plugin'i eylem çalışma zamanı dosyası

## Çekirdek entegrasyon akışı

### 1. Gömülü bir ajan çalıştırma

Ana giriş noktası `pi-embedded-runner/run.ts` içindeki `runEmbeddedPiAgent()` işlevindedir:

```typescript
import { runEmbeddedPiAgent } from "./agents/pi-embedded-runner.js";

const result = await runEmbeddedPiAgent({
  sessionId: "user-123",
  sessionKey: "main:whatsapp:+1234567890",
  sessionFile: "/path/to/session.jsonl",
  workspaceDir: "/path/to/workspace",
  config: openclawConfig,
  prompt: "Hello, how are you?",
  provider: "anthropic",
  model: "claude-sonnet-4-6",
  timeoutMs: 120_000,
  runId: "run-abc",
  onBlockReply: async (payload) => {
    await sendToChannel(payload.text, payload.mediaUrls);
  },
});
```

### 2. Oturum oluşturma

`runEmbeddedPiAgent()` tarafından çağrılan `runEmbeddedAttempt()` içinde pi SDK'sı kullanılır:

```typescript
import {
  createAgentSession,
  DefaultResourceLoader,
  SessionManager,
  SettingsManager,
} from "@mariozechner/pi-coding-agent";

const resourceLoader = new DefaultResourceLoader({
  cwd: resolvedWorkspace,
  agentDir,
  settingsManager,
  additionalExtensionPaths,
});
await resourceLoader.reload();

const { session } = await createAgentSession({
  cwd: resolvedWorkspace,
  agentDir,
  authStorage: params.authStorage,
  modelRegistry: params.modelRegistry,
  model: params.model,
  thinkingLevel: mapThinkingLevel(params.thinkLevel),
  tools: builtInTools,
  customTools: allCustomTools,
  sessionManager,
  settingsManager,
  resourceLoader,
});

applySystemPromptOverrideToSession(session, systemPromptOverride);
```

### 3. Olay aboneliği

`subscribeEmbeddedPiSession()`, pi'nin `AgentSession` olaylarına abone olur:

```typescript
const subscription = subscribeEmbeddedPiSession({
  session: activeSession,
  runId: params.runId,
  verboseLevel: params.verboseLevel,
  reasoningMode: params.reasoningLevel,
  toolResultFormat: params.toolResultFormat,
  onToolResult: params.onToolResult,
  onReasoningStream: params.onReasoningStream,
  onBlockReply: params.onBlockReply,
  onPartialReply: params.onPartialReply,
  onAgentEvent: params.onAgentEvent,
});
```

İşlenen olaylar şunları içerir:

- `message_start` / `message_end` / `message_update` (akış metni/düşünme)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. İstem verme

Kurulumdan sonra oturuma istem gönderilir:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK tam ajan döngüsünü yönetir: LLM'e gönderme, araç çağrılarını yürütme, yanıtları akıtma.

Görsel ekleme isteme özeldir: OpenClaw geçerli istemden görsel başvurularını yükler ve
bunları yalnızca o dönüş için `images` aracılığıyla iletir. Görsel payload'larını yeniden eklemek için
eski geçmiş dönüşlerini yeniden taramaz.

## Araç mimarisi

### Araç işlem hattı

1. **Temel Araçlar**: pi'nin `codingTools` araçları (`read`, `bash`, `edit`, `write`)
2. **Özel Değiştirmeler**: OpenClaw, bash'i `exec`/`process` ile değiştirir, sandbox için read/edit/write özelleştirir
3. **OpenClaw Araçları**: mesajlaşma, browser, canvas, sessions, cron, gateway vb.
4. **Kanal Araçları**: Discord/Telegram/Slack/WhatsApp'e özgü eylem araçları
5. **İlke Filtreleme**: Araçlar profil, sağlayıcı, ajan, grup, sandbox ilkelerine göre süzülür
6. **Şema Normalleştirme**: Şemalar Gemini/OpenAI tuhaflıkları için temizlenir
7. **AbortSignal Sarmalama**: Araçlar abort sinyallerine saygı gösterecek şekilde sarılır

### Araç tanımı bağdaştırıcısı

pi-agent-core'un `AgentTool` yapısı, pi-coding-agent'ın `ToolDefinition` yapısından farklı bir `execute` imzasına sahiptir. `pi-tool-definition-adapter.ts` içindeki bağdaştırıcı bunu köprüler:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agent imzası pi-agent-core'dan farklıdır
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Araç bölme stratejisi

`splitSdkTools()`, tüm araçları `customTools` üzerinden geçirir:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Boş. Her şeyi geçersiz kılıyoruz
    customTools: toToolDefinitions(options.tools),
  };
}
```

Bu, OpenClaw'ın ilke filtrelemesinin, sandbox entegrasyonunun ve genişletilmiş araç setinin sağlayıcılar arasında tutarlı kalmasını sağlar.

## Sistem istemi oluşturma

Sistem istemi, `buildAgentSystemPrompt()` içinde (`system-prompt.ts`) oluşturulur. Tooling, Tool Call Style, Safety guardrails, OpenClaw CLI reference, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, Runtime metadata bölümleriyle birlikte; etkin olduğunda Memory ve Reactions ile isteğe bağlı bağlam dosyaları ve ek sistem istemi içeriğini içeren tam bir istem derler. Bölümler, alt ajanlar tarafından kullanılan minimal istem modu için kırpılır.

İstem, oturum oluşturulduktan sonra `applySystemPromptOverrideToSession()` aracılığıyla uygulanır:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Oturum yönetimi

### Oturum dosyaları

Oturumlar, ağaç yapısına sahip JSONL dosyalarıdır (`id`/`parentId` bağlantısı). Pi'nin `SessionManager` sınıfı kalıcılığı yönetir:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw bunu araç sonucu güvenliği için `guardSessionManager()` ile sarar.

### Oturum önbellekleme

`session-manager-cache.ts`, tekrar tekrar dosya ayrıştırmayı önlemek için SessionManager örneklerini önbelleğe alır:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Geçmiş sınırlama

`limitHistoryTurns()`, kanal türüne göre (DM ve grup) konuşma geçmişini kırpar.

### Compaction

Otomatik Compaction, bağlam taşması olduğunda tetiklenir. Yaygın taşma imzaları
arasında `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` ve `ollama error: context
length exceeded` bulunur. `compactEmbeddedPiSessionDirect()`, manuel
Compaction'ı işler:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Kimlik doğrulama ve model çözümleme

### Auth profilleri

OpenClaw, sağlayıcı başına birden fazla API anahtarına sahip bir auth profil deposu tutar:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profiller, soğuma takibiyle hata durumunda döndürülür:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Model çözümleme

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// pi'nin ModelRegistry ve AuthStorage sınıflarını kullanır
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Hata durumunda devretme

`FailoverError`, yapılandırıldığında model geri dönüşünü tetikler:

```typescript
if (fallbackConfigured && isFailoverErrorMessage(errorText)) {
  throw new FailoverError(errorText, {
    reason: promptFailoverReason ?? "unknown",
    provider,
    model: modelId,
    profileId,
    status: resolveFailoverStatus(promptFailoverReason),
  });
}
```

## Pi uzantıları

OpenClaw, özel davranışlar için özel pi uzantıları yükler:

### Compaction koruması

`src/agents/pi-hooks/compaction-safeguard.ts`, uyarlanabilir token bütçelemesi ile araç hatası ve dosya işlemi özetleri dahil olmak üzere Compaction'a koruma önlemleri ekler:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Bağlam budama

`src/agents/pi-hooks/context-pruning.ts`, önbellek-TTL tabanlı bağlam budamayı uygular:

```typescript
if (cfg?.agents?.defaults?.contextPruning?.mode === "cache-ttl") {
  setContextPruningRuntime(params.sessionManager, {
    settings,
    contextWindowTokens,
    isToolPrunable,
    lastCacheTouchAt,
  });
  paths.push(resolvePiExtensionPath("context-pruning"));
}
```

## Akış ve blok yanıtlar

### Blok parçalama

`EmbeddedBlockChunker`, akış metnini ayrık yanıt bloklarına dönüştürmeyi yönetir:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Thinking/final etiket temizleme

Akış çıktısı, `<think>`/`<thinking>` bloklarını kaldırmak ve `<final>` içeriğini çıkarmak için işlenir:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // <think>...</think> içeriğini kaldır
  // enforceFinalTag varsa, yalnızca <final>...</final> içeriğini döndür
};
```

### Yanıt yönergeleri

`[[media:url]]`, `[[voice]]`, `[[reply:id]]` gibi yanıt yönergeleri ayrıştırılır ve çıkarılır:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Hata işleme

### Hata sınıflandırma

`pi-embedded-helpers.ts`, uygun işlem için hataları sınıflandırır:

```typescript
isContextOverflowError(errorText)     // Bağlam çok büyük
isCompactionFailureError(errorText)   // Compaction başarısız oldu
isAuthAssistantError(lastAssistant)   // Auth hatası
isRateLimitAssistantError(...)        // Hız sınırı aşıldı
isFailoverAssistantError(...)         // Hata durumunda devretmeli
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Thinking seviyesi geri dönüşü

Bir thinking seviyesi desteklenmiyorsa geri dönüş yapılır:

```typescript
const fallbackThinking = pickFallbackThinkingLevel({
  message: errorText,
  attempted: attemptedThinking,
});
if (fallbackThinking) {
  thinkLevel = fallbackThinking;
  continue;
}
```

## Sandbox entegrasyonu

Sandbox modu etkin olduğunda araçlar ve yollar kısıtlanır:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Sandbox uygulanmış read/edit/write araçlarını kullan
  // Exec container içinde çalışır
  // Browser bridge URL kullanır
}
```

## Sağlayıcıya özgü işleme

### Anthropic

- Reddetme sihirli dizesi temizleme
- Ardışık roller için dönüş doğrulama
- Katı yukarı akış Pi araç parametresi doğrulama

### Google/Gemini

- Plugin'e ait araç şeması temizleme

### OpenAI

- Codex modelleri için `apply_patch` aracı
- Thinking seviyesi düşürme işleme

## TUI entegrasyonu

OpenClaw ayrıca pi-tui bileşenlerini doğrudan kullanan yerel bir TUI moduna da sahiptir:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Bu, pi'nin yerel moduna benzer etkileşimli terminal deneyimi sağlar.

## Pi CLI'dan temel farklar

| Yön             | Pi CLI                  | OpenClaw Gömülü                                                                                |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Çağırma         | `pi` komutu / RPC       | `createAgentSession()` üzerinden SDK                                                           |
| Araçlar         | Varsayılan kodlama araçları | Özel OpenClaw araç paketi                                                                    |
| Sistem istemi   | AGENTS.md + istemler    | Kanal/bağlama göre dinamik                                                                      |
| Oturum depolama | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (veya `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | Tek kimlik bilgisi      | Döndürmeli çoklu profil                                                                         |
| Uzantılar       | Diskten yüklenir        | Programatik + disk yolları                                                                      |
| Olay işleme     | TUI işleme              | Callback tabanlı (`onBlockReply` vb.)                                                          |

## Geleceğe yönelik değerlendirmeler

Olası yeniden işleme alanları:

1. **Araç imzası hizalama**: Şu anda pi-agent-core ve pi-coding-agent imzaları arasında uyarlama yapılıyor
2. **Session manager sarmalama**: `guardSessionManager` güvenlik ekliyor ancak karmaşıklığı artırıyor
3. **Uzantı yükleme**: pi'nin `ResourceLoader` sınıfını daha doğrudan kullanabilir
4. **Akış işleyici karmaşıklığı**: `subscribeEmbeddedPiSession` büyüdü
5. **Sağlayıcı tuhaflıkları**: pi'nin potansiyel olarak ele alabileceği birçok sağlayıcıya özgü kod yolu var

## Testler

Pi entegrasyonu kapsamı şu paketleri kapsar:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-auth-json.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-embedded-helpers*.test.ts`
- `src/agents/pi-embedded-runner*.test.ts`
- `src/agents/pi-embedded-runner/**/*.test.ts`
- `src/agents/pi-embedded-subscribe*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-tool-definition-adapter*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-hooks/**/*.test.ts`

Canlı/katılımlı:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (`OPENCLAW_LIVE_TEST=1` ile etkinleştirin)

Güncel çalıştırma komutları için bkz. [Pi Geliştirme İş Akışı](/tr/pi-dev).

## İlgili

- [Pi geliştirme iş akışı](/tr/pi-dev)
- [Kurulum genel bakışı](/tr/install)
