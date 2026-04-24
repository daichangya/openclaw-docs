---
read_when:
    - OpenClaw içinde Pi SDK entegrasyon tasarımını anlama
    - Pi için ajan oturum yaşam döngüsünü, araçları veya sağlayıcı bağlantılarını değiştirme
summary: OpenClaw'ın gömülü Pi ajan entegrasyonunun mimarisi ve oturum yaşam döngüsü
title: Pi entegrasyon mimarisi
x-i18n:
    generated_at: "2026-04-24T15:21:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c0b019ff6d35f6fdcd57b56edd1945e62a96bb4b34e312d7fb0c627f01287f1
    source_path: pi.md
    workflow: 15
---

Bu belge, OpenClaw'ın yapay zeka ajan yeteneklerini desteklemek için [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) ve onun kardeş paketleri (`pi-ai`, `pi-agent-core`, `pi-tui`) ile nasıl entegre olduğunu açıklar.

## Genel Bakış

OpenClaw, bir yapay zeka kodlama ajanını mesajlaşma Gateway mimarisine gömmek için pi SDK'sını kullanır. OpenClaw, pi'yi bir alt süreç olarak başlatmak veya RPC modunu kullanmak yerine, `createAgentSession()` aracılığıyla pi'nin `AgentSession` yapısını doğrudan içe aktarır ve örnekler. Bu gömülü yaklaşım şunları sağlar:

- Oturum yaşam döngüsü ve olay işleme üzerinde tam denetim
- Özel araç enjeksiyonu (mesajlaşma, sandbox, kanala özgü eylemler)
- Kanal/bağlama göre sistem istemi özelleştirmesi
- Dallanma/Compaction desteğiyle oturum kalıcılığı
- Yedeklemeli çok hesaplı kimlik doğrulama profili rotasyonu
- Sağlayıcıdan bağımsız model değiştirme

## Paket Bağımlılıkları

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| Paket             | Amaç                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Temel LLM soyutlamaları: `Model`, `streamSimple`, mesaj türleri, sağlayıcı API'leri                   |
| `pi-agent-core`   | Ajan döngüsü, araç yürütme, `AgentMessage` türleri                                                     |
| `pi-coding-agent` | Üst düzey SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, yerleşik araçlar |
| `pi-tui`          | Terminal UI bileşenleri (OpenClaw'ın yerel TUI modunda kullanılır)                                     |

## Dosya Yapısı

```
src/agents/
├── pi-embedded-runner.ts          # pi-embedded-runner/ içinden yeniden dışa aktarımlar
├── pi-embedded-runner/
│   ├── run.ts                     # Ana giriş: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Oturum kurulumu ile tek deneme mantığı
│   │   ├── params.ts              # RunEmbeddedPiAgentParams türü
│   │   ├── payloads.ts            # Çalıştırma sonuçlarından yanıt payload'larını oluşturur
│   │   ├── images.ts              # Vision model görsel enjeksiyonu
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Abort hata tespiti
│   ├── cache-ttl.ts               # Bağlam budama için önbellek TTL izleme
│   ├── compact.ts                 # Elle/otomatik Compaction mantığı
│   ├── extensions.ts              # Gömülü çalıştırmalar için pi uzantılarını yükler
│   ├── extra-params.ts            # Sağlayıcıya özgü akış parametreleri
│   ├── google.ts                  # Google/Gemini tur sıralama düzeltmeleri
│   ├── history.ts                 # Geçmiş sınırlama (DM ve grup)
│   ├── lanes.ts                   # Oturum/genel komut hatları
│   ├── logger.ts                  # Alt sistem günlükleyicisi
│   ├── model.ts                   # ModelRegistry aracılığıyla model çözümleme
│   ├── runs.ts                    # Etkin çalıştırma takibi, abort, kuyruk
│   ├── sandbox-info.ts            # Sistem istemi için sandbox bilgisi
│   ├── session-manager-cache.ts   # SessionManager örnek önbelleklemesi
│   ├── session-manager-init.ts    # Oturum dosyası başlatma
│   ├── system-prompt.ts           # Sistem istemi oluşturucu
│   ├── tool-split.ts              # Araçları builtIn ve custom olarak ayırır
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel eşlemesi, hata açıklaması
├── pi-embedded-subscribe.ts       # Oturum olayı aboneliği/dağıtımı
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Olay işleyici fabrikası
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Akış blok yanıtı parçalaması
├── pi-embedded-messaging.ts       # Mesajlaşma aracı gönderim takibi
├── pi-embedded-helpers.ts         # Hata sınıflandırması, tur doğrulaması
├── pi-embedded-helpers/           # Yardımcı modüller
├── pi-embedded-utils.ts           # Biçimlendirme yardımcıları
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Araçlar için AbortSignal sarmalama
├── pi-tools.policy.ts             # Araç izin listesi/engelleme listesi ilkesi
├── pi-tools.read.ts               # Read aracı özelleştirmeleri
├── pi-tools.schema.ts             # Araç şeması normalleştirmesi
├── pi-tools.types.ts              # AnyAgentTool tür takma adı
├── pi-tool-definition-adapter.ts  # AgentTool -> ToolDefinition adaptörü
├── pi-settings.ts                 # Ayar geçersiz kılmaları
├── pi-hooks/                      # Özel pi hook'ları
│   ├── compaction-safeguard.ts    # Koruma uzantısı
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Önbellek-TTL bağlam budama uzantısı
│   └── context-pruning/
├── model-auth.ts                  # Kimlik doğrulama profili çözümleme
├── auth-profiles.ts               # Profil deposu, bekleme süresi, yedekleme
├── model-selection.ts             # Varsayılan model çözümleme
├── models-config.ts               # models.json oluşturma
├── model-catalog.ts               # Model kataloğu önbelleği
├── context-window-guard.ts        # Bağlam penceresi doğrulaması
├── failover-error.ts              # FailoverError sınıfı
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Sistem istemi parametre çözümleme
├── system-prompt-report.ts        # Hata ayıklama raporu oluşturma
├── tool-summaries.ts              # Araç açıklama özetleri
├── tool-policy.ts                 # Araç ilkesi çözümleme
├── transcript-policy.ts           # Transkript doğrulama ilkesi
├── skills.ts                      # Skills anlık görüntüsü/istemi oluşturma
├── skills/                        # Skills alt sistemi
├── sandbox.ts                     # Sandbox bağlam çözümleme
├── sandbox/                       # Sandbox alt sistemi
├── channel-tools.ts               # Kanala özgü araç enjeksiyonu
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

Kanala özgü mesaj eylemi çalışma zamanları artık `src/agents/tools` altında değil, plugin sahipliğindeki extension dizinlerinde bulunur; örneğin:

- Discord plugin eylem çalışma zamanı dosyaları
- Slack plugin eylem çalışma zamanı dosyası
- Telegram plugin eylem çalışma zamanı dosyası
- WhatsApp plugin eylem çalışma zamanı dosyası

## Temel Entegrasyon Akışı

### 1. Gömülü Bir Ajanı Çalıştırma

Ana giriş noktası `pi-embedded-runner/run.ts` içindeki `runEmbeddedPiAgent()` fonksiyonudur:

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

### 2. Oturum Oluşturma

`runEmbeddedAttempt()` içinde (`runEmbeddedPiAgent()` tarafından çağrılır), pi SDK kullanılır:

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

### 3. Olay Aboneliği

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

### 4. İstem Gönderme

Kurulumdan sonra oturuma istem gönderilir:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK, tam ajan döngüsünü yönetir: LLM'ye gönderme, araç çağrılarını yürütme, yanıtları akış halinde iletme.

Görsel enjeksiyonu isteme yereldir: OpenClaw, geçerli istemden görsel referanslarını yükler ve bunları yalnızca o tur için `images` aracılığıyla geçirir. Görsel payload'larını yeniden enjekte etmek için geçmişteki eski turları yeniden taramaz.

## Araç Mimarisi

### Araç Hattı

1. **Temel Araçlar**: pi'nin `codingTools` araçları (`read`, `bash`, `edit`, `write`)
2. **Özel Değiştirmeler**: OpenClaw, `bash` yerine `exec`/`process` kullanır; `read`/`edit`/`write` araçlarını sandbox için özelleştirir
3. **OpenClaw Araçları**: mesajlaşma, tarayıcı, tuval, oturumlar, Cron, Gateway vb.
4. **Kanal Araçları**: Discord/Telegram/Slack/WhatsApp'e özgü eylem araçları
5. **İlke Filtreleme**: Araçlar profil, sağlayıcı, ajan, grup ve sandbox ilkelerine göre filtrelenir
6. **Şema Normalleştirme**: Şemalar Gemini/OpenAI tuhaflıkları için temizlenir
7. **AbortSignal Sarmalama**: Araçlar abort sinyallerine uyacak şekilde sarılır

### Araç Tanımı Adaptörü

pi-agent-core içindeki `AgentTool`, pi-coding-agent içindeki `ToolDefinition` yapısından farklı bir `execute` imzasına sahiptir. `pi-tool-definition-adapter.ts` içindeki adaptör bu farkı kapatır:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agent imzası, pi-agent-core'dan farklıdır
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Araç Ayırma Stratejisi

`splitSdkTools()`, tüm araçları `customTools` üzerinden geçirir:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Boş. Her şeyi biz geçersiz kılıyoruz
    customTools: toToolDefinitions(options.tools),
  };
}
```

Bu, OpenClaw'ın ilke filtrelemesi, sandbox entegrasyonu ve genişletilmiş araç setinin sağlayıcılar arasında tutarlı kalmasını sağlar.

## Sistem İstemi Oluşturma

Sistem istemi, `buildAgentSystemPrompt()` içinde (`system-prompt.ts`) oluşturulur. Araçlar, Araç Çağrı Stili, Güvenlik korkulukları, OpenClaw CLI başvurusu, Skills, Belgeler, Çalışma Alanı, Sandbox, Mesajlaşma, Yanıt Etiketleri, Ses, Sessiz Yanıtlar, Heartbeats, Çalışma zamanı meta verileri ve etkin olduğunda Memory ile Reactions; ayrıca isteğe bağlı bağlam dosyaları ve ek sistem istemi içeriği gibi bölümleri içeren tam bir istem bir araya getirilir. Alt ajanlar için kullanılan minimal istem modunda bölümler kırpılır.

İstem, oturum oluşturulduktan sonra `applySystemPromptOverrideToSession()` aracılığıyla uygulanır:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Oturum Yönetimi

### Oturum Dosyaları

Oturumlar, ağaç yapısına sahip (`id`/`parentId` bağlantılı) JSONL dosyalarıdır. Pi'nin `SessionManager` bileşeni kalıcılığı yönetir:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw bunu, araç sonucu güvenliği için `guardSessionManager()` ile sarar.

### Oturum Önbellekleme

`session-manager-cache.ts`, tekrar tekrar dosya ayrıştırmayı önlemek için SessionManager örneklerini önbelleğe alır:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Geçmiş Sınırlama

`limitHistoryTurns()`, kanal türüne göre (DM ve grup) konuşma geçmişini kırpar.

### Compaction

Otomatik Compaction, bağlam taşmasında tetiklenir. Yaygın taşma imzaları
arasında `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` ve `ollama error: context
length exceeded` bulunur. `compactEmbeddedPiSessionDirect()` manuel
Compaction'ı yönetir:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Kimlik Doğrulama ve Model Çözümleme

### Kimlik Doğrulama Profilleri

OpenClaw, sağlayıcı başına birden fazla API anahtarına sahip bir kimlik doğrulama profili deposu tutar:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profiller, bekleme süresi takibiyle birlikte hatalarda döndürülür:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Model Çözümleme

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// Pi'nin ModelRegistry ve AuthStorage bileşenlerini kullanır
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Yedekleme

Yapılandırıldığında `FailoverError`, model geri dönüşünü tetikler:

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

## Pi Uzantıları

OpenClaw, özelleşmiş davranışlar için özel pi uzantıları yükler:

### Compaction Koruması

`src/agents/pi-hooks/compaction-safeguard.ts`, uyarlanabilir token bütçelemenin yanı sıra araç hatası ve dosya işlemi özetleri dahil olmak üzere Compaction'a korkuluklar ekler:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Bağlam Budama

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

## Akış ve Blok Yanıtları

### Blok Parçalama

`EmbeddedBlockChunker`, akış metnini ayrık yanıt bloklarına dönüştürmeyi yönetir:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Thinking/Final Etiketlerini Ayıklama

Akış çıktısı, `<think>`/`<thinking>` bloklarını kaldırmak ve `<final>` içeriğini çıkarmak için işlenir:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // <think>...</think> içeriğini kaldır
  // enforceFinalTag ise yalnızca <final>...</final> içeriğini döndür
};
```

### Yanıt Yönergeleri

`[[media:url]]`, `[[voice]]`, `[[reply:id]]` gibi yanıt yönergeleri ayrıştırılır ve çıkarılır:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Hata Yönetimi

### Hata Sınıflandırması

`pi-embedded-helpers.ts`, uygun işleme için hataları sınıflandırır:

```typescript
isContextOverflowError(errorText)     // Bağlam çok büyük
isCompactionFailureError(errorText)   // Compaction başarısız oldu
isAuthAssistantError(lastAssistant)   // Kimlik doğrulama hatası
isRateLimitAssistantError(...)        // Hız sınırına takıldı
isFailoverAssistantError(...)         // Yedeklemeye geçilmeli
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Thinking Düzeyi Geri Dönüşü

Bir thinking düzeyi desteklenmiyorsa geri dönüş yapılır:

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

## Sandbox Entegrasyonu

Sandbox modu etkin olduğunda araçlar ve yollar sınırlandırılır:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Sandbox'lı read/edit/write araçlarını kullan
  // Exec container içinde çalışır
  // Tarayıcı bridge URL'sini kullanır
}
```

## Sağlayıcıya Özgü İşleme

### Anthropic

- Ret magic string temizleme
- Ardışık roller için tur doğrulaması
- Yukarı akış Pi araç parametresi doğrulamasının katı olması

### Google/Gemini

- Plugin sahipliğindeki araç şeması temizleme

### OpenAI

- Codex modelleri için `apply_patch` aracı
- Thinking düzeyi düşürme işleme

## TUI Entegrasyonu

OpenClaw ayrıca pi-tui bileşenlerini doğrudan kullanan bir yerel TUI moduna da sahiptir:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Bu, pi'nin yerel moduna benzer etkileşimli terminal deneyimi sağlar.

## Pi CLI'dan Temel Farklar

| Görünüm        | Pi CLI                  | Gömülü OpenClaw                                                                                 |
| -------------- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| Çağırma        | `pi` komutu / RPC       | `createAgentSession()` aracılığıyla SDK                                                         |
| Araçlar        | Varsayılan kodlama araçları | Özel OpenClaw araç paketi                                                                    |
| Sistem istemi  | AGENTS.md + istemler    | Kanal/bağlama göre dinamik                                                                      |
| Oturum depolama | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (veya `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Kimlik doğrulama | Tek kimlik bilgisi    | Döndürmeli çoklu profil                                                                         |
| Uzantılar      | Diskten yüklenir        | Programatik + disk yolları                                                                      |
| Olay işleme    | TUI işleme              | Callback tabanlı (`onBlockReply` vb.)                                                           |

## Geleceğe Yönelik Değerlendirmeler

Olası yeniden çalışma alanları:

1. **Araç imzası hizalaması**: Şu anda pi-agent-core ve pi-coding-agent imzaları arasında uyarlama yapılıyor
2. **Oturum yöneticisi sarmalama**: `guardSessionManager` güvenlik ekliyor ancak karmaşıklığı artırıyor
3. **Uzantı yükleme**: Pi'nin `ResourceLoader` bileşeni daha doğrudan kullanılabilir
4. **Akış işleyici karmaşıklığı**: `subscribeEmbeddedPiSession` büyüdü
5. **Sağlayıcı tuhaflıkları**: Pi'nin potansiyel olarak yönetebileceği birçok sağlayıcıya özgü kod yolu var

## Testler

Pi entegrasyon kapsamı şu paketlere yayılır:

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

Canlı/isteğe bağlı:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (`OPENCLAW_LIVE_TEST=1` etkinleştirilmelidir)

Geçerli çalıştırma komutları için bkz. [Pi Geliştirme İş Akışı](/tr/pi-dev).

## İlgili

- [Pi geliştirme iş akışı](/tr/pi-dev)
- [Kurulum genel bakışı](/tr/install)
