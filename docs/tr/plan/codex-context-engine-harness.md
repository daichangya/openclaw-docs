---
read_when:
    - Context-engine yaşam döngüsü davranışını Codex harness içine bağlıyorsunuz
    - lossless-claw veya başka bir context-engine Plugin'inin codex/* gömülü harness oturumlarıyla çalışması gerekiyor
    - Gömülü Pi ve Codex uygulama sunucusu bağlam davranışını karşılaştırıyorsunuz
summary: Paketlenmiş Codex uygulama sunucusu harness'ının OpenClaw context-engine Plugin'lerini dikkate almasını sağlama spesifikasyonu
title: Codex Harness Context Engine Aktarımı
x-i18n:
    generated_at: "2026-04-25T13:50:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61c29a6cd8955a41510b8da1575b89ed003565d564b25b37b3b0c7f65df6b663
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

## Durum

Taslak uygulama spesifikasyonu.

## Hedef

Paketlenmiş Codex uygulama sunucusu harness'ının, gömülü Pi turlarının zaten dikkate aldığı aynı OpenClaw context-engine
yaşam döngüsü sözleşmesini dikkate almasını sağlamak.

`agents.defaults.embeddedHarness.runtime: "codex"` veya bir
`codex/*` modeli kullanan bir oturum, seçili context-engine Plugin'inin, örneğin
`lossless-claw`'ın, Codex uygulama sunucusu sınırının izin verdiği ölçüde bağlam oluşturmayı, tur sonrası alımı, bakımı ve
OpenClaw düzeyindeki Compaction ilkesini denetlemesine yine de izin vermelidir.

## Hedef dışı

- Codex uygulama sunucusu iç işleyişini yeniden uygulamayın.
- Codex yerel iş parçacığı Compaction'ının lossless-claw özeti üretmesini sağlamayın.
- Codex dışı modellerin Codex harness'ını kullanmasını zorunlu kılmayın.
- ACP/acpx oturum davranışını değiştirmeyin. Bu spesifikasyon yalnızca
  ACP olmayan gömülü aracı harness yolu içindir.
- Üçüncü taraf Plugin'lerin Codex uygulama sunucusu uzantı fabrikalarını kaydetmesini sağlamayın;
  mevcut paketlenmiş Plugin güven sınırı değişmeden kalır.

## Geçerli mimari

Gömülü çalışma döngüsü, somut bir düşük düzey harness seçmeden önce çalışma başına yapılandırılmış context engine'i bir kez çözümler:

- `src/agents/pi-embedded-runner/run.ts`
  - context-engine Plugin'lerini başlatır
  - `resolveContextEngine(params.config)` çağırır
  - `contextEngine` ve `contextTokenBudget` değerlerini
    `runEmbeddedAttemptWithBackend(...)` içine geçirir

`runEmbeddedAttemptWithBackend(...)`, seçilen aracı harness'ına devreder:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Codex uygulama sunucusu harness'ı, paketlenmiş Codex Plugin'i tarafından kaydedilir:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Codex harness uygulaması, Pi destekli denemelerle aynı `EmbeddedRunAttemptParams`
değerini alır:

- `extensions/codex/src/app-server/run-attempt.ts`

Bu, gerekli kanca noktasının OpenClaw tarafından denetlenen kodda olduğu anlamına gelir. Dış
sınır Codex uygulama sunucusu protokolünün kendisidir: OpenClaw, `thread/start`, `thread/resume` ve
`turn/start` çağrılarına ne gönderdiğini denetleyebilir ve bildirimleri gözlemleyebilir, ancak Codex'in dahili iş parçacığı deposunu veya yerel compactor'ını değiştiremez.

## Geçerli boşluk

Gömülü Pi denemeleri context-engine yaşam döngüsünü doğrudan çağırır:

- denemeden önce bootstrap/bakım
- model çağrısından önce assemble
- denemeden sonra afterTurn veya ingest
- başarılı bir turdan sonra bakım
- Compaction'ın context-engine'e ait olduğu motorlar için context-engine Compaction'ı

İlgili Pi kodu:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex uygulama sunucusu denemeleri şu anda genel aracı-harness kancalarını çalıştırıyor ve
dökümü yansıtıyor, ancak `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest` veya
`params.contextEngine.maintain` çağrılarını yapmıyor.

İlgili Codex kodu:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## İstenen davranış

Codex harness turları için OpenClaw şu yaşam döngüsünü korumalıdır:

1. Yansıtılmış OpenClaw oturum dökümünü oku.
2. Önceki bir oturum dosyası varsa etkin context engine'i bootstrap et.
3. Varsa bootstrap bakımını çalıştır.
4. Etkin context engine kullanarak bağlamı assemble et.
5. Assemble edilmiş bağlamı Codex uyumlu girdilere dönüştür.
6. Context-engine `systemPromptAddition` değerini içeren geliştirici talimatlarıyla
   Codex iş parçacığını başlat veya sürdür.
7. Assemble edilmiş kullanıcıya dönük prompt ile Codex turunu başlat.
8. Codex sonucunu OpenClaw dökümüne geri yansıt.
9. Uygulanmışsa `afterTurn`, aksi halde
   yansıtılmış döküm anlık görüntüsünü kullanarak `ingestBatch`/`ingest` çağır.
10. Başarılı ve iptal edilmemiş turlardan sonra tur bakımını çalıştır.
11. Codex yerel Compaction sinyallerini ve OpenClaw Compaction kancalarını koru.

## Tasarım kısıtları

### Codex uygulama sunucusu, yerel iş parçacığı durumu için kanonik kalır

Codex, yerel iş parçacığının ve içerdeki genişletilmiş geçmişin sahibidir. OpenClaw
uygulama sunucusunun dahili geçmişini desteklenen protokol çağrıları dışında değiştirmeye çalışmamalıdır.

OpenClaw'ın döküm aynası OpenClaw özellikleri için kaynak olmaya devam eder:

- sohbet geçmişi
- arama
- `/new` ve `/reset` kayıt tutma
- gelecekteki model veya harness değiştirme
- context-engine Plugin durumu

### Context engine assembly, Codex girdilerine yansıtılmalıdır

Context-engine arayüzü, bir Codex
iş parçacığı yaması değil, OpenClaw `AgentMessage[]` döndürür. Codex uygulama sunucusu `turn/start` geçerli kullanıcı girdisini kabul ederken,
`thread/start` ve `thread/resume` geliştirici talimatlarını kabul eder.

Bu nedenle uygulama bir yansıtma katmanına ihtiyaç duyar. Güvenli ilk sürüm,
Codex dahili geçmişinin yerini alabileceğini varsaymaktan kaçınmalıdır. Assemble edilmiş bağlamı
geçerli tur etrafında deterministik prompt/geliştirici talimatı malzemesi olarak enjekte etmelidir.

### Prompt önbelleği kararlılığı önemlidir

lossless-claw gibi motorlar için, assemble edilmiş bağlam değişmemiş girdiler için deterministik olmalıdır. Üretilen bağlam metnine zaman damgaları, rastgele kimlikler veya deterministik olmayan sıralama eklemeyin.

### Pi geri dönüş semantiği değişmez

Harness seçimi olduğu gibi kalır:

- `runtime: "pi"` Pi'yi zorlar
- `runtime: "codex"` kayıtlı Codex harness'ını seçer
- `runtime: "auto"` Plugin harness'larının desteklenen sağlayıcıları sahiplenmesine izin verir
- `fallback: "none"` eşleşen Plugin harness yoksa Pi geri dönüşünü devre dışı bırakır

Bu çalışma, Codex harness'ı seçildikten sonra ne olacağını değiştirir.

## Uygulama planı

### 1. Yeniden kullanılabilir context-engine deneme yardımcılarını dışa aktarın veya taşıyın

Bugün yeniden kullanılabilir yaşam döngüsü yardımcıları Pi runner altında yaşıyor:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Kaçınabiliyorsak Codex, adı Pi çağrıştıran bir uygulama yolundan içe aktarmamalıdır.

Harness'tan bağımsız bir modül oluşturun, örneğin:

- `src/agents/harness/context-engine-lifecycle.ts`

Şunları taşıyın veya yeniden dışa aktarın:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- `runContextEngineMaintenance` etrafında küçük bir sarmalayıcı

Eski dosyalardan yeniden dışa aktararak veya aynı PR'da Pi
çağrı noktalarını güncelleyerek Pi içe aktarmalarını çalışır durumda tutun.

Nötr yardımcı adları Pi'den söz etmemelidir.

Önerilen adlar:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Bir Codex bağlam yansıtma yardımcısı ekleyin

Yeni bir modül ekleyin:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Sorumluluklar:

- Assemble edilmiş `AgentMessage[]`, özgün yansıtılmış geçmiş ve geçerli
  prompt'u kabul et.
- Hangi bağlamın geliştirici talimatlarına, hangisinin geçerli kullanıcı
  girdisine ait olduğunu belirle.
- Geçerli kullanıcı prompt'unu son eyleme dönük istek olarak koru.
- Önceki mesajları kararlı, açık bir biçimde işle.
- Oynak meta verilerden kaçın.

Önerilen API:

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

Önerilen ilk yansıtma:

- `systemPromptAddition` değerini geliştirici talimatlarına koy.
- Assemble edilmiş döküm bağlamını geçerli prompt'tan önce `promptText` içine koy.
- Bunu OpenClaw assemble edilmiş bağlamı olarak açıkça etiketle.
- Geçerli prompt'u sonda tut.
- Zaten sonda görünüyorsa yinelenen geçerli kullanıcı prompt'unu hariç tut.

Örnek prompt biçimi:

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

Bu, yerel Codex geçmişi üzerinde cerrahi işlem yapmaktan daha az zariftir, ancak
OpenClaw içinde uygulanabilir ve context-engine semantiğini korur.

Gelecekteki iyileştirme: Codex uygulama sunucusu iş parçacığı geçmişini değiştirmek veya tamamlamak için bir protokol sunarsa, bu yansıtma katmanını o API'yi kullanacak şekilde değiştirin.

### 3. Codex iş parçacığı başlatmadan önce bootstrap'i bağlayın

`extensions/codex/src/app-server/run-attempt.ts` içinde:

- Bugünkü gibi yansıtılmış oturum geçmişini oku.
- Bu çalıştırmadan önce oturum dosyasının var olup olmadığını belirle. Tercihen
  yansıtma yazımlarından önce `fs.stat(params.sessionFile)` kontrol eden bir yardımcı kullanın.
- Bir `SessionManager` açın veya yardımcı bunu gerektiriyorsa dar kapsamlı bir session manager bağdaştırıcısı kullanın.
- `params.contextEngine` varsa nötr bootstrap yardımcısını çağırın.

Sözde akış:

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

Codex araç köprüsü ve döküm aynasıyla aynı `sessionKey` kuralını kullanın. Bugün Codex, `sandboxSessionKey` değerini `params.sessionKey` veya
`params.sessionId` içinden hesaplıyor; ham `params.sessionKey`'i korumak için bir neden yoksa bunu tutarlı biçimde kullanın.

### 4. `thread/start` / `thread/resume` ve `turn/start` öncesine assemble'i bağlayın

`runCodexAppServerAttempt` içinde:

1. Önce dinamik araçları oluşturun; böylece context engine gerçekten kullanılabilir
   araç adlarını görür.
2. Yansıtılmış oturum geçmişini okuyun.
3. `params.contextEngine` varsa context-engine `assemble(...)` çalıştırın.
4. Assemble edilmiş sonucu şunlara yansıtın:
   - geliştirici talimatı eklemesi
   - `turn/start` için prompt metni

Mevcut kanca çağrısı:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

bağlam farkında hâle gelmelidir:

1. `buildDeveloperInstructions(params)` ile temel geliştirici talimatlarını hesapla
2. context-engine assembly/yansıtmayı uygula
3. yansıtılmış prompt/geliştirici talimatlarıyla `before_prompt_build` çalıştır

Bu sıra, genel prompt kancalarının Codex'in alacağı aynı prompt'u görmesini sağlar. Eğer katı Pi parity gerekiyorsa, Pi prompt hattından sonra son sistem prompt'una context-engine `systemPromptAddition` uyguladığı için, kanca bileşiminden önce context-engine assembly çalıştırın. Önemli değişmez, hem context engine'in hem kancaların deterministik, belgelenmiş bir sıra almasıdır.

İlk uygulama için önerilen sıra:

1. `buildDeveloperInstructions(params)`
2. context-engine `assemble()`
3. `systemPromptAddition` değerini geliştirici talimatlarına ekle/önekle
4. assemble edilmiş mesajları prompt metnine yansıt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. son geliştirici talimatlarını `startOrResumeThread(...)` içine geçir
7. son prompt metnini `buildTurnStartParams(...)` içine geçir

Spesifikasyon testlerle kodlanmalıdır; böylece gelecekteki değişiklikler bunu kazayla yeniden sıralamaz.

### 5. Prompt önbelleği açısından kararlı biçimlendirmeyi koruyun

Yansıtma yardımcısı özdeş girdiler için bayt düzeyinde kararlı çıktı üretmelidir:

- kararlı mesaj sırası
- kararlı rol etiketleri
- üretilmiş zaman damgaları yok
- nesne anahtarı sırası sızıntısı yok
- rastgele ayraçlar yok
- çalışma başına kimlik yok

Sabit ayraçlar ve açık bölümler kullanın.

### 6. Tur sonrası işlemleri döküm yansıtıldıktan sonra bağlayın

Codex'in `CodexAppServerEventProjector` bileşeni geçerli tur için yerel bir `messagesSnapshot`
oluşturur. `mirrorTranscriptBestEffort(...)` bu anlık görüntüyü
OpenClaw döküm aynasına yazar.

Yansıtma başarılı da olsa başarısız da olsa, context-engine sonlandırıcısını
eldeki en iyi mesaj anlık görüntüsüyle çağırın:

- Tercihen yazımdan sonraki tam yansıtılmış oturum bağlamını kullanın, çünkü `afterTurn`
  yalnızca geçerli turu değil, oturum anlık görüntüsünü bekler.
- Oturum dosyası yeniden açılamıyorsa `historyMessages + result.messagesSnapshot`
  değerine geri dönün.

Sözde akış:

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

Yansıtma başarısız olursa yine de geri dönüş anlık görüntüsüyle `afterTurn` çağrısı yapın, ancak
context engine'in geri dönüş tur verilerinden alım yaptığını günlüğe kaydedin.

### 7. Kullanım ve prompt önbelleği çalışma zamanı bağlamını normalize edin

Codex sonuçları, mevcut olduğunda uygulama sunucusu token bildirimlerinden normalize edilmiş kullanımı içerir. Bu kullanımı context-engine çalışma zamanı bağlamına geçirin.

Codex uygulama sunucusu gelecekte önbellek okuma/yazma ayrıntılarını açığa çıkarırsa, bunları
`ContextEnginePromptCacheInfo` içine eşleyin. O zamana kadar `promptCache` alanını sıfırlar uydurmak yerine atlayın.

### 8. Compaction ilkesi

İki Compaction sistemi vardır:

1. OpenClaw context-engine `compact()`
2. Codex uygulama sunucusu yerel `thread/compact/start`

Bunları sessizce birbirine karıştırmayın.

#### `/compact` ve açık OpenClaw Compaction'ı

Seçili context engine `info.ownsCompaction === true` değerine sahipse, açık
OpenClaw Compaction'ı OpenClaw döküm aynası ve Plugin durumu için öncelikle
context engine'in `compact()` sonucunu tercih etmelidir.

Seçili Codex harness'ının yerel bir iş parçacığı bağı varsa, uygulama sunucusu iş parçacığını sağlıklı tutmak için ayrıca Codex yerel Compaction'ını isteyebiliriz; ancak bu, ayrıntılarda ayrı bir arka uç eylemi olarak raporlanmalıdır.

Önerilen davranış:

- Eğer `contextEngine.info.ownsCompaction === true` ise:
  - önce context-engine `compact()` çağrısı yapın
  - ardından bir iş parçacığı bağı varsa en iyi çabayla Codex yerel Compaction çağrısı yapın
  - birincil sonuç olarak context-engine sonucunu döndürün
  - Codex yerel Compaction durumunu `details.codexNativeCompaction` içine ekleyin
- Etkin context engine Compaction'ın sahibi değilse:
  - geçerli Codex yerel Compaction davranışını koruyun

Bu, `extensions/codex/src/app-server/compact.ts` dosyasını değiştirmeyi veya
`maybeCompactAgentHarnessSession(...)` nerede çağrıldığına bağlı olarak bunu genel Compaction yolundan sarmalamayı gerektirebilir.

#### Tur içi Codex yerel `contextCompaction` olayları

Codex, bir tur sırasında `contextCompaction` öğe olayları yayabilir. `event-projector.ts` içindeki
geçerli önce/sonra Compaction kanca yayımını koruyun, ancak bunu tamamlanmış bir context-engine Compaction'ı olarak değerlendirmeyin.

Compaction'ın sahibi olan motorlar için, Codex yine de yerel Compaction yaptığında açık bir tanılama yayımlayın:

- akış/olay adı: mevcut `compaction` akışı kabul edilebilir
- ayrıntılar: `{ backend: "codex-app-server", ownsCompaction: true }`

Bu, ayrımı denetlenebilir kılar.

### 9. Oturum sıfırlama ve bağ davranışı

Mevcut Codex harness `reset(...)`, OpenClaw oturum dosyasından Codex uygulama sunucusu bağını temizler. Bu davranışı koruyun.

Ayrıca context-engine durumu temizliğinin mevcut
OpenClaw oturum yaşam döngüsü yolları üzerinden olmaya devam ettiğinden emin olun. Context-engine yaşam döngüsü şu anda tüm harness'lar için sıfırla/sil olaylarını kaçırmıyorsa Codex'e özgü temizlik eklemeyin.

### 10. Hata işleme

Pi semantiğini izleyin:

- bootstrap hataları uyarı verir ve devam eder
- assemble hataları uyarı verir ve assemble edilmemiş hat/prompt'a geri döner
- afterTurn/ingest hataları uyarı verir ve tur sonrası sonlandırmayı başarısız olarak işaretler
- bakım yalnızca başarılı, iptal edilmemiş, yield edilmemiş turlardan sonra çalışır
- Compaction hataları yeni prompt'lar olarak yeniden denenmemelidir

Codex'e özgü ekler:

- Bağlam yansıtma başarısız olursa uyarı verin ve özgün prompt'a geri dönün.
- Döküm aynası başarısız olursa yine de geri dönüş mesajlarıyla context-engine sonlandırmasını deneyin.
- Context-engine Compaction'ı başarılı olduktan sonra Codex yerel Compaction'ı başarısız olursa,
  context engine birincil olduğunda tüm OpenClaw Compaction'ını başarısız yapmayın.

## Test planı

### Birim testleri

`extensions/codex/src/app-server` altında testler ekleyin:

1. `run-attempt.context-engine.test.ts`
   - Bir oturum dosyası varsa Codex `bootstrap` çağırır.
   - Codex, `assemble` çağrısını yansıtılmış mesajlar, token bütçesi, araç adları,
     alıntı modu, model kimliği ve prompt ile yapar.
   - `systemPromptAddition`, geliştirici talimatlarına eklenir.
   - Assemble edilmiş mesajlar, geçerli istekten önce prompt'a yansıtılır.
   - Codex, döküm yansıtıldıktan sonra `afterTurn` çağırır.
   - `afterTurn` yoksa Codex `ingestBatch` veya mesaj başına `ingest` çağırır.
   - Tur bakımı başarılı turlardan sonra çalışır.
   - Tur bakımı prompt hatası, iptal veya yield iptalinde çalışmaz.

2. `context-engine-projection.test.ts`
   - özdeş girdiler için kararlı çıktı
   - assemble edilmiş geçmiş bunu içerdiğinde geçerli prompt'u yinelemez
   - boş geçmişi işler
   - rol sırasını korur
   - sistem prompt eklemesini yalnızca geliştirici talimatlarına ekler

3. `compact.context-engine.test.ts`
   - sahibi olan context engine birincil sonucu kazanır
   - ayrıca denendiğinde Codex yerel Compaction durumu ayrıntılarda görünür
   - Codex yerel hatası, sahibi olan context-engine Compaction'ını başarısız yapmaz
   - sahibi olmayan context engine geçerli yerel Compaction davranışını korur

### Güncellenecek mevcut testler

- Varsa `extensions/codex/src/app-server/run-attempt.test.ts`, yoksa
  en yakın Codex uygulama sunucusu çalışma testleri.
- Yalnızca Compaction olay ayrıntıları değişirse `extensions/codex/src/app-server/event-projector.test.ts`.
- Config davranışı değişmediği sürece `src/agents/harness/selection.test.ts`
  değişiklik gerektirmemelidir; kararlı kalmalıdır.
- Pi context-engine testleri değişmeden geçmeye devam etmelidir.

### Entegrasyon / canlı testler

Canlı Codex harness smoke testleri ekleyin veya genişletin:

- `plugins.slots.contextEngine` değerini bir test engine'ine yapılandırın
- `agents.defaults.model` değerini bir `codex/*` modeline yapılandırın
- `agents.defaults.embeddedHarness.runtime = "codex"` ayarlayın
- test engine'inin şunları gözlemlediğini doğrulayın:
  - bootstrap
  - assemble
  - afterTurn veya ingest
  - bakım

OpenClaw çekirdek testlerinde lossless-claw gerektirmekten kaçının. Depo içi küçük bir
sahte context engine Plugin'i kullanın.

## Gözlemlenebilirlik

Codex context-engine yaşam döngüsü çağrıları etrafına hata ayıklama günlükleri ekleyin:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- neden ile birlikte `codex context engine maintenance skipped`
- `codex native compaction completed alongside context-engine compaction`

Tam prompt'ları veya döküm içeriklerini günlüğe kaydetmeyin.

Uygun olduğunda yapılandırılmış alanlar ekleyin:

- `sessionId`
- mevcut günlükleme uygulamasına göre redakte edilmiş veya atlanmış `sessionKey`
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Taşıma / uyumluluk

Bu geriye dönük uyumlu olmalıdır:

- Hiçbir context engine yapılandırılmamışsa, eski context engine davranışı
  bugünkü Codex harness davranışıyla eşdeğer olmalıdır.
- Context-engine `assemble` başarısız olursa, Codex özgün
  prompt yoluyla devam etmelidir.
- Mevcut Codex iş parçacığı bağları geçerli kalmalıdır.
- Dinamik araç fingerprinting context-engine çıktısını içermemelidir; aksi hâlde
  her bağlam değişikliği yeni bir Codex iş parçacığını zorlayabilir. Yalnızca araç kataloğu
  dinamik araç fingerprint'ini etkilemelidir.

## Açık sorular

1. Assemble edilmiş bağlam tamamen kullanıcı prompt'una mı, tamamen
   geliştirici talimatlarına mı, yoksa bölünerek mi enjekte edilmeli?

   Öneri: bölünmeli. `systemPromptAddition` geliştirici talimatlarında olsun;
   assemble edilmiş döküm bağlamı kullanıcı prompt sarmalayıcısında olsun. Bu, yerel iş parçacığı geçmişini değiştirmeden
   mevcut Codex protokolüyle en iyi uyumu sağlar.

2. Bir context engine Compaction'ın sahibi olduğunda Codex yerel Compaction'ı
   devre dışı bırakılmalı mı?

   Öneri: hayır, en azından başlangıçta değil. Codex yerel Compaction'ı yine de
   uygulama sunucusu iş parçacığını ayakta tutmak için gerekli olabilir. Ancak bu,
   context-engine Compaction'ı olarak değil, yerel Codex Compaction'ı olarak raporlanmalıdır.

3. `before_prompt_build`, context-engine assembly'den önce mi sonra mı çalışmalı?

   Öneri: Codex için context-engine yansıtmasından sonra; böylece genel harness
   kancaları Codex'in gerçekten alacağı prompt/geliştirici talimatlarını görür. Eğer Pi
   parity tersini gerektiriyorsa, seçilen sırayı testlerde kodlayın ve burada belgeleyin.

4. Codex uygulama sunucusu gelecekte yapılandırılmış bir bağlam/geçmiş geçersiz kılması kabul edebilir mi?

   Bilinmiyor. Kabul edebiliyorsa, metin yansıtma katmanını o protokolle değiştirin ve
   yaşam döngüsü çağrılarını değiştirmeden koruyun.

## Kabul kriterleri

- Bir `codex/*` gömülü harness turu, seçili context engine'in
  assemble yaşam döngüsünü çağırır.
- Bir context-engine `systemPromptAddition`, Codex geliştirici talimatlarını etkiler.
- Assemble edilmiş bağlam, Codex tur girdisini deterministik olarak etkiler.
- Başarılı Codex turları `afterTurn` veya ingest geri dönüşü çağırır.
- Başarılı Codex turları context-engine tur bakımını çalıştırır.
- Başarısız/iptal edilmiş/yield-ipta edilmiş turlar tur bakımını çalıştırmaz.
- Context-engine'e ait Compaction, OpenClaw/Plugin durumu için birincil kalır.
- Codex yerel Compaction'ı, yerel Codex davranışı olarak denetlenebilir kalır.
- Mevcut Pi context-engine davranışı değişmez.
- Eski olmayan bir context engine seçilmediğinde veya assembly başarısız olduğunda
  mevcut Codex harness davranışı değişmez.
