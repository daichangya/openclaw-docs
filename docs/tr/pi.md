---
read_when:
    - OpenClaw'daki Pi SDK entegrasyon tasarımını anlama
    - Pi için aracı oturum yaşam döngüsünü, araçları veya sağlayıcı bağlantılarını değiştirme
summary: OpenClaw'ın gömülü Pi aracı entegrasyonunun mimarisi ve oturum yaşam döngüsü
title: Pi Entegrasyon Mimarisi
x-i18n:
    generated_at: "2026-04-21T09:00:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: ece62eb1459e8a861610c8502f2b3bf5172500207df5e78f4abe7a2a416a47fc
    source_path: pi.md
    workflow: 15
---

# Pi Entegrasyon Mimarisi

Bu belge, OpenClaw'ın AI aracı yeteneklerini güçlendirmek için [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) ve onun kardeş paketleriyle (`pi-ai`, `pi-agent-core`, `pi-tui`) nasıl entegre olduğunu açıklar.

## Genel bakış

OpenClaw, mesajlaşma Gateway mimarisine bir AI kodlama aracısı gömmek için pi SDK'sını kullanır. Pi'yi bir alt süreç olarak başlatmak veya RPC modunu kullanmak yerine, OpenClaw pi'nin `AgentSession` bileşenini doğrudan `createAgentSession()` aracılığıyla içe aktarır ve örnekler. Bu gömülü yaklaşım şunları sağlar:

- Oturum yaşam döngüsü ve olay işleme üzerinde tam denetim
- Özel araç ekleme (mesajlaşma, sandbox, kanala özgü eylemler)
- Kanal/bağlama göre sistem istemi özelleştirmesi
- Dallanma/Compaction desteğiyle oturum kalıcılığı
- Hata durumunda geçiş ile çok hesaplı kimlik doğrulama profili rotasyonu
- Sağlayıcıdan bağımsız model değiştirme

## Paket bağımlılıkları

```json
{
  "@mariozechner/pi-agent-core": "0.64.0",
  "@mariozechner/pi-ai": "0.64.0",
  "@mariozechner/pi-coding-agent": "0.64.0",
  "@mariozechner/pi-tui": "0.64.0"
}
```

| Paket            | Amaç                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `pi-ai`          | Çekirdek LLM soyutlamaları: `Model`, `streamSimple`, mesaj türleri, sağlayıcı API'leri                       |
| `pi-agent-core`  | Aracı döngüsü, araç yürütme, `AgentMessage` türleri                                                           |
| `pi-coding-agent` | Yüksek seviyeli SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, yerleşik araçlar |
| `pi-tui`         | Terminal UI bileşenleri (OpenClaw'ın yerel TUI modunda kullanılır)                                            |

## Dosya yapısı

```
src/agents/
├── pi-embedded-runner.ts          # pi-embedded-runner/ içinden yeniden dışa aktarımlar
├── pi-embedded-runner/
│   ├── run.ts                     # Ana giriş: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Oturum kurulumu ile tek deneme mantığı
│   │   ├── params.ts              # RunEmbeddedPiAgentParams türü
│   │   ├── payloads.ts            # Çalıştırma sonuçlarından yanıt yükleri oluşturma
│   │   ├── images.ts              # Vision model görsel ekleme
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Abort hata algılama
│   ├── cache-ttl.ts               # Bağlam budama için önbellek TTL takibi
│   ├── compact.ts                 # El ile/otomatik Compaction mantığı
│   ├── extensions.ts              # Gömülü çalıştırmalar için pi eklentilerini yükleme
│   ├── extra-params.ts            # Sağlayıcıya özgü akış parametreleri
│   ├── google.ts                  # Google/Gemini dönüş sıralama düzeltmeleri
│   ├── history.ts                 # Geçmiş sınırlama (DM ve grup)
│   ├── lanes.ts                   # Oturum/genel komut şeritleri
│   ├── logger.ts                  # Alt sistem günlükleyicisi
│   ├── model.ts                   # ModelRegistry üzerinden model çözümleme
│   ├── runs.ts                    # Etkin çalıştırma takibi, abort, kuyruk
│   ├── sandbox-info.ts            # Sistem istemi için sandbox bilgisi
│   ├── session-manager-cache.ts   # SessionManager örneği önbellekleme
│   ├── session-manager-init.ts    # Oturum dosyası başlatma
│   ├── system-prompt.ts           # Sistem istemi oluşturucu
│   ├── tool-split.ts              # Araçları builtIn ve custom olarak ayırma
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel eşleme, hata açıklaması
├── pi-embedded-subscribe.ts       # Oturum olay aboneliği/dağıtımı
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Olay işleyici fabrikası
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Akış blok yanıt parçalama
├── pi-embedded-messaging.ts       # Mesajlaşma aracı gönderim takibi
├── pi-embedded-helpers.ts         # Hata sınıflandırması, dönüş doğrulama
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
│   ├── compaction-safeguard.ts    # Safeguard eklentisi
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Önbellek-TTL bağlam budama eklentisi
│   └── context-pruning/
├── model-auth.ts                  # Kimlik doğrulama profili çözümleme
├── auth-profiles.ts               # Profil deposu, bekleme süresi, hata durumunda geçiş
├── model-selection.ts             # Varsayılan model çözümleme
├── models-config.ts               # models.json üretimi
├── model-catalog.ts               # Model katalog önbelleği
├── context-window-guard.ts        # Bağlam penceresi doğrulaması
├── failover-error.ts              # FailoverError sınıfı
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Sistem istemi parametre çözümleme
├── system-prompt-report.ts        # Hata ayıklama raporu üretimi
├── tool-summaries.ts              # Araç açıklama özetleri
├── tool-policy.ts                 # Araç ilkesi çözümleme
├── transcript-policy.ts           # Döküm doğrulama ilkesi
├── skills.ts                      # Skill anlık görüntüsü/istem oluşturma
├── skills/                        # Skill alt sistemi
├── sandbox.ts                     # Sandbox bağlam çözümleme
├── sandbox/                       # Sandbox alt sistemi
├── channel-tools.ts               # Kanala özgü araç ekleme
├── openclaw-tools.ts              # OpenClaw'a özgü araçlar
├── bash-tools.ts                  # exec/process araçları
├── apply-patch.ts                 # apply_patch aracı (OpenAI)
├── tools/                         # Bireysel araç uygulamaları
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
Plugin'e ait eklenti dizinlerinde bulunur; örneğin:

- Discord Plugin'i eylem çalışma zamanı dosyaları
- Slack Plugin'i eylem çalışma zamanı dosyası
- Telegram Plugin'i eylem çalışma zamanı dosyası
- WhatsApp Plugin'i eylem çalışma zamanı dosyası

## Çekirdek entegrasyon akışı

### 1. Gömülü bir aracı çalıştırma

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

Kurulumdan sonra oturuma istem verilir:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK tam aracı döngüsünü yönetir: LLM'ye gönderme, araç çağrılarını yürütme, yanıtları akışla iletme.

Görsel ekleme isteme yereldir: OpenClaw geçerli istemden görsel başvurularını yükler ve
yalnızca o dönüş için bunları `images` üzerinden geçirir. Eski geçmiş dönüşlerini yeniden tarayıp
görsel yüklerini tekrar eklemez.

## Araç mimarisi

### Araç işlem hattı

1. **Temel Araçlar**: pi'nin `codingTools` araçları (`read`, `bash`, `edit`, `write`)
2. **Özel Değiştirmeler**: OpenClaw, bash yerine `exec`/`process` kullanır; read/edit/write araçlarını sandbox için özelleştirir
3. **OpenClaw Araçları**: mesajlaşma, tarayıcı, canvas, oturumlar, cron, gateway vb.
4. **Kanal Araçları**: Discord/Telegram/Slack/WhatsApp'e özgü eylem araçları
5. **İlke Süzme**: Araçlar profil, sağlayıcı, aracı, grup, sandbox ilkelerine göre süzülür
6. **Şema Normalleştirme**: Şemalar Gemini/OpenAI özelliklerine göre temizlenir
7. **AbortSignal Sarmalama**: Araçlar abort sinyallerine uyacak şekilde sarılır

### Araç tanımı bağdaştırıcısı

pi-agent-core'un `AgentTool` türü, pi-coding-agent'ın `ToolDefinition` türünden farklı bir `execute` imzasına sahiptir. `pi-tool-definition-adapter.ts` içindeki bağdaştırıcı bunu köprüler:

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
    builtInTools: [], // Boş. Her şeyi biz geçersiz kılıyoruz
    customTools: toToolDefinitions(options.tools),
  };
}
```

Bu, OpenClaw'ın ilke süzmesi, sandbox entegrasyonu ve genişletilmiş araç setinin sağlayıcılar arasında tutarlı kalmasını sağlar.

## Sistem İstemi Oluşturma

Sistem istemi, `buildAgentSystemPrompt()` içinde (`system-prompt.ts`) oluşturulur. Araçlar, Araç Çağrısı Stili, Güvenlik koruma rayları, OpenClaw CLI başvurusu, Skills, Belgeler, Çalışma Alanı, Sandbox, Mesajlaşma, Yanıt Etiketleri, Ses, Sessiz Yanıtlar, Heartbeat'ler, Çalışma Zamanı meta verileri ile etkin olduğunda Memory ve Reactions bölümlerini ve isteğe bağlı bağlam dosyaları ile ek sistem istemi içeriğini kapsayan tam bir istem bir araya getirir. Bölümler, alt aracılar tarafından kullanılan minimal istem modu için kırpılır.

İstem, oturum oluşturulduktan sonra `applySystemPromptOverrideToSession()` aracılığıyla uygulanır:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Oturum yönetimi

### Oturum dosyaları

Oturumlar ağaç yapısına sahip JSONL dosyalarıdır (`id`/`parentId` bağlantıları ile). Pi'nin `SessionManager` bileşeni kalıcılığı yönetir:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw bunu araç sonucu güvenliği için `guardSessionManager()` ile sarar.

### Oturum önbellekleme

`session-manager-cache.ts`, dosyanın tekrar tekrar ayrıştırılmasını önlemek için SessionManager örneklerini önbelleğe alır:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Geçmiş sınırlama

`limitHistoryTurns()`, konuşma geçmişini kanal türüne göre kırpar (DM ve grup).

### Compaction

Otomatik Compaction, bağlam taşması olduğunda tetiklenir. Yaygın taşma imzaları
arasında `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` ve `ollama error: context
length exceeded` bulunur. `compactEmbeddedPiSessionDirect()` el ile
Compaction'ı yönetir:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Kimlik doğrulama ve model çözümleme

### Kimlik doğrulama profilleri

OpenClaw, sağlayıcı başına birden fazla API anahtarı içeren bir kimlik doğrulama profil deposu tutar:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profiller, bekleme süresi takibiyle başarısızlıklarda döndürülür:

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

// pi'nin ModelRegistry ve AuthStorage bileşenlerini kullanır
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Hata durumunda geçiş

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

## Pi eklentileri

OpenClaw, özelleşmiş davranışlar için özel pi eklentileri yükler:

### Compaction Safeguard

`src/agents/pi-hooks/compaction-safeguard.ts`, uyarlanabilir token bütçelemesi ile araç hatası ve dosya işlemi özetleri dahil olmak üzere Compaction'a koruma rayları ekler:

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

## Akış ve blok yanıtları

### Blok parçalama

`EmbeddedBlockChunker`, akış metnini ayrık yanıt bloklarına dönüştürmeyi yönetir:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Düşünme/son etiket temizleme

Akış çıktısı, `<think>`/`<thinking>` bloklarını temizlemek ve `<final>` içeriğini çıkarmak için işlenir:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // <think>...</think> içeriğini temizle
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

`pi-embedded-helpers.ts`, uygun işleme için hataları sınıflandırır:

```typescript
isContextOverflowError(errorText)     // Bağlam çok büyük
isCompactionFailureError(errorText)   // Compaction başarısız oldu
isAuthAssistantError(lastAssistant)   // Kimlik doğrulama hatası
isRateLimitAssistantError(...)        // Oran sınırı aşıldı
isFailoverAssistantError(...)         // Hata durumunda geçiş yapılmalı
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Düşünme seviyesi geri dönüşü

Bir düşünme seviyesi desteklenmiyorsa, geri düşer:

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

Sandbox modu etkin olduğunda, araçlar ve yollar kısıtlanır:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Sandbox'lı read/edit/write araçlarını kullan
  // Exec kapsayıcı içinde çalışır
  // Browser köprü URL'sini kullanır
}
```

## Sağlayıcıya özgü işleme

### Anthropic

- Reddetme sihirli dizesi temizleme
- Ardışık roller için dönüş doğrulaması
- Sıkı üst akış Pi araç parametresi doğrulaması

### Google/Gemini

- Plugin'e ait araç şeması temizleme

### OpenAI

- Codex modelleri için `apply_patch` aracı
- Düşünme seviyesi düşürme işleme

## TUI entegrasyonu

OpenClaw ayrıca doğrudan pi-tui bileşenlerini kullanan bir yerel TUI moduna da sahiptir:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Bu, pi'nin yerel moduna benzer etkileşimli terminal deneyimini sağlar.

## Pi CLI'dan temel farklar

| Özellik         | Pi CLI                  | Gömülü OpenClaw                                                                                 |
| --------------- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| Çağırma         | `pi` komutu / RPC       | `createAgentSession()` aracılığıyla SDK                                                          |
| Araçlar         | Varsayılan kodlama araçları | Özel OpenClaw araç paketi                                                                     |
| Sistem istemi   | AGENTS.md + istemler    | Kanal/bağlama göre dinamik                                                                       |
| Oturum depolama | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (veya `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Kimlik doğrulama | Tek kimlik bilgisi     | Döndürmeli çoklu profil                                                                          |
| Eklentiler      | Diskten yüklenir        | Programatik + disk yolları                                                                       |
| Olay işleme     | TUI işleme              | Callback tabanlı (`onBlockReply` vb.)                                                            |

## Geleceğe dönük değerlendirmeler

Olası yeniden çalışma alanları:

1. **Araç imzası hizalaması**: Şu anda pi-agent-core ile pi-coding-agent imzaları arasında uyarlama yapılıyor
2. **Session manager sarmalama**: `guardSessionManager` güvenlik ekliyor ancak karmaşıklığı artırıyor
3. **Eklenti yükleme**: pi'nin `ResourceLoader` bileşeni daha doğrudan kullanılabilir
4. **Akış işleyici karmaşıklığı**: `subscribeEmbeddedPiSession` büyüdü
5. **Sağlayıcı özellikleri**: Pi'nin potansiyel olarak ele alabileceği birçok sağlayıcıya özgü kod yolu var

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

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (`OPENCLAW_LIVE_TEST=1` ile etkinleştirin)

Geçerli çalıştırma komutları için bkz. [Pi Geliştirme İş Akışı](/tr/pi-dev).
