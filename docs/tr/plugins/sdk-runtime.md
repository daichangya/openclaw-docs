---
read_when:
    - Bir plugin içinden çekirdek yardımcıları çağırmanız gerekiyor (TTS, STT, görsel üretimi, web araması, alt agent, Node'lar)
    - '`api.runtime` öğesinin neleri açığa çıkardığını anlamak istiyorsunuz'
    - Eklenti kodundan config, agent veya medya yardımcılarına erişiyorsunuz
sidebarTitle: Runtime Helpers
summary: '`api.runtime` -- plugin''lere sunulan enjekte edilmiş çalışma zamanı yardımcıları'
title: Plugin çalışma zamanı yardımcıları
x-i18n:
    generated_at: "2026-04-25T13:54:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9f1a56faf33ac18ea7e4b14f70d6f3a73c8b88481aeb0ee77035a17a03f15ce
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Her plugin'e kayıt sırasında enjekte edilen `api.runtime` nesnesi için başvuru. Host iç bileşenlerini doğrudan içe aktarmak yerine bu yardımcıları kullanın.

<Tip>
  **Bir adım adım anlatım mı arıyorsunuz?** Bu yardımcıların bağlam içinde nasıl kullanıldığını adım adım gösteren kılavuzlar için [Channel Plugins](/tr/plugins/sdk-channel-plugins) veya [Provider Plugins](/tr/plugins/sdk-provider-plugins) sayfalarına bakın.
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Runtime ad alanları

### `api.runtime.agent`

Agent kimliği, dizinler ve oturum yönetimi.

```typescript
// Agent'in çalışma dizinini çözümle
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// Agent çalışma alanını çözümle
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// Agent kimliğini al
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// Varsayılan düşünme düzeyini al
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// Agent zaman aşımını al
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// Çalışma alanının var olduğundan emin ol
await api.runtime.agent.ensureAgentWorkspace(cfg);

// Gömülü bir agent turu çalıştır
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "En son değişiklikleri özetle",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

`runEmbeddedAgent(...)`, Plugin kodundan normal bir OpenClaw agent turu başlatmak için tarafsız yardımcıdır. Kanal tarafından tetiklenen yanıtlardakiyle aynı sağlayıcı/model çözümlemesini ve agent harness seçimini kullanır.

`runEmbeddedPiAgent(...)`, geriye dönük uyumluluk takma adı olarak kalır.

**Oturum deposu yardımcıları** `api.runtime.agent.session` altındadır:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

Varsayılan model ve sağlayıcı sabitleri:

```typescript
const model = api.runtime.agent.defaults.model; // örn. "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // örn. "anthropic"
```

### `api.runtime.subagent`

Arka plan subagent çalıştırmalarını başlatın ve yönetin.

```typescript
// Bir subagent çalıştırması başlat
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Bu sorguyu odaklı takip aramalarına genişlet.",
  provider: "openai", // isteğe bağlı geçersiz kılma
  model: "gpt-4.1-mini", // isteğe bağlı geçersiz kılma
  deliver: false,
});

// Tamamlanmasını bekle
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// Oturum mesajlarını oku
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// Bir oturumu sil
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  Model geçersiz kılmaları (`provider`/`model`), yapılandırmada `plugins.entries.<id>.subagent.allowModelOverride: true` üzerinden operatör onayı gerektirir.
  Güvenilmeyen plugin'ler yine de subagent çalıştırabilir, ancak geçersiz kılma istekleri reddedilir.
</Warning>

### `api.runtime.nodes`

Bağlı Node'ları listeleyin ve Gateway tarafından yüklenen Plugin kodundan veya plugin CLI komutlarından bir Node host komutu çağırın. Bir Plugin eşlenmiş bir cihazdaki yerel işi sahiplendiğinde, örneğin başka bir Mac'teki bir tarayıcı ya da ses köprüsü için bunu kullanın.

```typescript
const { nodes } = await api.runtime.nodes.list({ connected: true });

const result = await api.runtime.nodes.invoke({
  nodeId: "mac-studio",
  command: "my-plugin.command",
  params: { action: "start" },
  timeoutMs: 30000,
});
```

Gateway içinde bu Runtime süreç içindedir. Plugin CLI komutlarında yapılandırılmış Gateway'i RPC üzerinden çağırır; böylece `openclaw googlemeet recover-tab` gibi komutlar terminalden eşlenmiş Node'ları inceleyebilir. Node komutları yine normal Gateway Node eşleme, komut izin listeleri ve Node-yerel komut işleme üzerinden geçer.

### `api.runtime.taskFlow`

Bir TaskFlow Runtime'ını mevcut bir OpenClaw oturum anahtarına veya güvenilir araç bağlamına bağlayın; ardından her çağrıda bir sahip geçmeden TaskFlow'lar oluşturup yönetin.

```typescript
const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

const created = taskFlow.createManaged({
  controllerId: "my-plugin/review-batch",
  goal: "Yeni pull request'leri incele",
});

const child = taskFlow.runTask({
  flowId: created.flowId,
  runtime: "acp",
  childSessionKey: "agent:main:subagent:reviewer",
  task: "PR #123'ü incele",
  status: "running",
  startedAt: Date.now(),
});

const waiting = taskFlow.setWaiting({
  flowId: created.flowId,
  expectedRevision: created.revision,
  currentStep: "await-human-reply",
  waitJson: { kind: "reply", channel: "telegram" },
});
```

Kendi bağlama katmanınızdan gelen güvenilir bir OpenClaw oturum anahtarınız zaten varsa `bindSession({ sessionKey, requesterOrigin })` kullanın. Ham kullanıcı girdisinden bağlama yapmayın.

### `api.runtime.tts`

Metinden konuşmaya sentezi.

```typescript
// Standart TTS
const clip = await api.runtime.tts.textToSpeech({
  text: "OpenClaw'dan merhaba",
  cfg: api.config,
});

// Telefoni için optimize edilmiş TTS
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "OpenClaw'dan merhaba",
  cfg: api.config,
});

// Kullanılabilir sesleri listele
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Çekirdekteki `messages.tts` yapılandırmasını ve sağlayıcı seçimini kullanır. PCM ses arabelleği + örnekleme hızı döndürür.

### `api.runtime.mediaUnderstanding`

Görüntü, ses ve video analizi.

```typescript
// Bir görüntüyü açıkla
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// Sesi yazıya dök
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // isteğe bağlı, MIME çıkarılamadığında
});

// Bir videoyu açıkla
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// Genel dosya analizi
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

Çıktı üretilmediğinde `{ text: undefined }` döndürür (örn. atlanan girdi).

<Info>
  `api.runtime.stt.transcribeAudioFile(...)`, `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` için geriye dönük uyumluluk takma adı olarak kalır.
</Info>

### `api.runtime.imageGeneration`

Görüntü oluşturma.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "Gün batımını resmeden bir robot",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

Web araması.

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

Düşük seviyeli medya yardımcıları.

```typescript
const webMedia = await api.runtime.media.loadWebMedia(url);
const mime = await api.runtime.media.detectMime(buffer);
const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
const metadata = await api.runtime.media.getImageMetadata(filePath);
const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
const terminalQr = await api.runtime.media.renderQrTerminal("https://openclaw.ai");
const pngQr = await api.runtime.media.renderQrPngBase64("https://openclaw.ai", {
  scale: 6, // 1-12
  marginModules: 4, // 0-16
});
const pngQrDataUrl = await api.runtime.media.renderQrPngDataUrl("https://openclaw.ai");
const tmpRoot = resolvePreferredOpenClawTmpDir();
const pngQrFile = await api.runtime.media.writeQrPngTempFile("https://openclaw.ai", {
  tmpRoot,
  dirPrefix: "my-plugin-qr-",
  fileName: "qr.png",
});
```

### `api.runtime.config`

Yapılandırma yükleme ve yazma.

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

Sistem düzeyinde yardımcılar.

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

Olay abonelikleri.

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

Günlükleme.

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

Model ve sağlayıcı kimlik doğrulama çözümlemesi.

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

Durum dizini çözümlemesi.

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

Bellek araç fabrikaları ve CLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

Kanala özgü Runtime yardımcıları (bir kanal Plugin'i yüklendiğinde kullanılabilir).

`api.runtime.channel.mentions`, Runtime enjeksiyonu kullanan paketlenmiş kanal plugin'leri için paylaşılan gelen mention ilkesi yüzeyidir:

```typescript
const mentionMatch = api.runtime.channel.mentions.matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const decision = api.runtime.channel.mentions.resolveInboundMentionDecision({
  facts: {
    canDetectMention: true,
    wasMentioned: mentionMatch.matched,
    implicitMentionKinds: api.runtime.channel.mentions.implicitMentionKindWhen(
      "reply_to_bot",
      isReplyToBot,
    ),
  },
  policy: {
    isGroup,
    requireMention,
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});
```

Kullanılabilir mention yardımcıları:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions`, eski `resolveMentionGating*` uyumluluk yardımcılarını kasıtlı olarak dışa açmaz. Normalize edilmiş `{ facts, policy }` yolunu tercih edin.

## Runtime başvurularını depolama

`register` geri çağrısı dışında kullanmak üzere Runtime başvurusunu depolamak için `createPluginRuntimeStore` kullanın:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "my-plugin",
  errorMessage: "my-plugin runtime başlatılmadı",
});

// Giriş noktanızda
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Örnek",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// Diğer dosyalarda
export function getRuntime() {
  return store.getRuntime(); // başlatılmadıysa hata fırlatır
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // başlatılmadıysa null döndürür
}
```

Runtime-store kimliği için `pluginId` tercih edin. Daha düşük seviyeli `key` biçimi, bir Plugin'in kasıtlı olarak birden fazla Runtime yuvasına ihtiyaç duyduğu nadir durumlar içindir.

## Diğer üst düzey `api` alanları

`api.runtime`'ın ötesinde, API nesnesi ayrıca şunları da sağlar:

| Alan                     | Tür                       | Açıklama                                                                                    |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin kimliği                                                                              |
| `api.name`               | `string`                  | Plugin görünen adı                                                                          |
| `api.config`             | `OpenClawConfig`          | Geçerli yapılandırma anlık görüntüsü (mevcut olduğunda etkin bellek içi Runtime anlık görüntüsü) |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` içinden Plugin'e özgü yapılandırma                           |
| `api.logger`             | `PluginLogger`            | Kapsamlı günlükleyici (`debug`, `info`, `warn`, `error`)                                   |
| `api.registrationMode`   | `PluginRegistrationMode`  | Geçerli yükleme modu; `"setup-runtime"` hafif tam giriş öncesi başlatma/kurulum penceresidir |
| `api.resolvePath(input)` | `(string) => string`      | Plugin köküne göreli bir yolu çözümle                                                      |

## İlgili

- [SDK overview](/tr/plugins/sdk-overview) — alt yol başvurusu
- [SDK entry points](/tr/plugins/sdk-entrypoints) — `definePluginEntry` seçenekleri
- [Plugin internals](/tr/plugins/architecture) — yetenek modeli ve kayıt defteri
