---
read_when:
    - Ajan üzerinden arka plan/paralel çalışma istiyorsunuz
    - '`sessions_spawn` veya alt ajan araç ilkesini değiştiriyorsunuz'
    - Thread'e bağlı alt ajan oturumlarını uyguluyor veya sorun gideriyorsunuz
summary: 'Alt ajanlar: sonuçları isteyen sohbete geri duyuran yalıtılmış ajan çalıştırmaları oluşturma'
title: Alt ajanlar
x-i18n:
    generated_at: "2026-04-25T14:00:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: b262edf46b9c823dcf0ad6514e560d2d1a718e9081015ea8bb5c081206b88fce
    source_path: tools/subagents.md
    workflow: 15
---

Alt ajanlar, mevcut bir ajan çalıştırmasından oluşturulan arka plan ajan çalıştırmalarıdır. Kendi oturumlarında çalışırlar (`agent:<agentId>:subagent:<uuid>`) ve bittiğinde sonuçlarını isteyen sohbet kanalına **duyururlar**. Her alt ajan çalıştırması bir [arka plan görevi](/tr/automation/tasks) olarak izlenir.

## Slash komutu

**Geçerli oturum** için alt ajan çalıştırmalarını incelemek veya denetlemek üzere `/subagents` kullanın:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Thread bağlama denetimleri:

Bu komutlar, kalıcı thread bağlarını destekleyen kanallarda çalışır. Aşağıdaki **Thread destekleyen kanallar** bölümüne bakın.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info`, çalıştırma üst verilerini gösterir (durum, zaman damgaları, oturum kimliği, transkript yolu, temizleme).
Sınırlandırılmış, güvenlik filtreli bir geri çağırma görünümü için
`sessions_history` kullanın; ham tam transkripte ihtiyaç duyduğunuzda
diskteki transkript yolunu inceleyin.

### Oluşturma davranışı

`/subagents spawn`, bir alt ajanı iç aktarma olarak değil kullanıcı komutu olarak arka planda başlatır ve çalıştırma bittiğinde isteyen sohbete tek bir nihai tamamlama güncellemesi gönderir.

- Oluşturma komutu engelleyici değildir; hemen bir çalıştırma kimliği döndürür.
- Tamamlandığında alt ajan, isteyen sohbet kanalına bir özet/sonuç mesajı duyurur.
- Tamamlama push tabanlıdır. Oluşturulduktan sonra bitmesini beklemek için
  döngü içinde `/subagents list`, `sessions_list` veya `sessions_history`
  yoklaması yapmayın; durumu yalnızca hata ayıklama veya müdahale gerektiğinde inceleyin.
- Tamamlanınca OpenClaw, duyuru temizleme akışı devam etmeden önce o alt ajan oturumu tarafından açılmış izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır.
- El ile oluşturmalarda teslim dayanıklıdır:
  - OpenClaw önce kararlı bir idempotency anahtarıyla doğrudan `agent` teslimini dener.
  - Doğrudan teslim başarısız olursa kuyruk yönlendirmesine geri düşer.
  - Kuyruk yönlendirmesi de kullanılamıyorsa duyuru, nihai vazgeçmeden önce kısa bir üstel backoff ile yeniden denenir.
- Tamamlama teslimi çözümlenmiş isteyen rotayı korur:
  - kullanılabiliyorsa thread'e bağlı veya konuşmaya bağlı tamamlama rotaları kazanır
  - tamamlama kaynağı yalnızca bir kanal sağlıyorsa OpenClaw, doğrudan teslimin yine çalışması için isteyen oturumun çözümlenmiş rotasından (`lastChannel` / `lastTo` / `lastAccountId`) eksik hedefi/hesabı doldurur
- İsteyen oturuma tamamlama devri çalışma zamanı tarafından üretilen iç bağlamdır (kullanıcı tarafından yazılmış metin değildir) ve şunları içerir:
  - `Result` (en son görünür `assistant` yanıt metni, aksi durumda temizlenmiş en son `tool`/`toolResult` metni; terminal başarısız çalıştırmalar yakalanmış yanıt metnini yeniden kullanmaz)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - kısa çalışma zamanı/token istatistikleri
  - isteyen ajana normal asistan sesiyle yeniden yazmasını söyleyen bir teslim yönergesi (ham iç üst verileri iletmemesini söyler)
- `--model` ve `--thinking`, o belirli çalıştırma için varsayılanları geçersiz kılar.
- Tamamlandıktan sonra ayrıntıları ve çıktıyı incelemek için `info`/`log` kullanın.
- `/subagents spawn`, tek seferlik moddur (`mode: "run"`). Kalıcı thread'e bağlı oturumlar için `sessions_spawn` değerini `thread: true` ve `mode: "session"` ile kullanın.
- ACP harness oturumları (Codex, Claude Code, Gemini CLI) için `sessions_spawn` komutunu `runtime: "acp"` ile kullanın ve özellikle tamamlamalarda veya ajandan ajana döngülerde hata ayıklarken [ACP Agents](/tr/tools/acp-agents) sayfasına, özellikle de [ACP teslim modeli](/tr/tools/acp-agents#delivery-model) bölümüne bakın.

Birincil hedefler:

- Ana çalıştırmayı engellemeden "araştırma / uzun görev / yavaş araç" işlerini paralelleştirmek.
- Alt ajanları varsayılan olarak yalıtılmış tutmak (oturum ayrımı + isteğe bağlı sandboxing).
- Araç yüzeyini yanlış kullanımı zor olacak şekilde tutmak: alt ajanlar varsayılan olarak oturum araçlarını **almaz**.
- Orkestratör desenleri için yapılandırılabilir iç içe yerleşme derinliğini desteklemek.

Maliyet notu: her alt ajanın varsayılan olarak **kendi** bağlamı ve token kullanımı vardır. Ağır veya
tekrarlayan görevler için alt ajanlar için daha ucuz bir model ayarlayın ve ana ajanınızı
daha yüksek kaliteli bir modelde tutun. Bunu `agents.defaults.subagents.model` veya ajan başına
geçersiz kılmalar ile yapılandırabilirsiniz. Bir alt öğe gerçekten isteyenin geçerli transkriptine ihtiyaç
duyduğunda, ajan o tek oluşturma için `context: "fork"` isteyebilir.

## Bağlam modları

Yerel alt ajanlar, çağıran açıkça geçerli transkripti çatallamayı istemedikçe
yalıtılmış başlar.

| Mod        | Ne zaman kullanılır                                                                                                                     | Davranış                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `isolated` | Yeni araştırma, bağımsız uygulama, yavaş araç işi veya görev metninde brifing verilebilen herhangi bir iş                              | Temiz bir alt transkript oluşturur. Bu varsayılandır ve token kullanımını daha düşük tutar. |
| `fork`     | Geçerli konuşmaya, önceki araç sonuçlarına veya isteyen transkriptinde zaten bulunan ayrıntılı yönergelere bağlı iş                     | Alt öğe başlamadan önce isteyen transkriptini alt oturuma dallandırır.          |

`fork` değerini dikkatli kullanın. Bu, bağlama duyarlı devretme içindir;
açık bir görev istemi yazmanın yerine geçmez.

## Araç

`sessions_spawn` kullanın:

- Bir alt ajan çalıştırması başlatır (`deliver: false`, genel şerit: `subagent`)
- Sonra bir duyuru adımı çalıştırır ve duyuru yanıtını isteyen sohbet kanalına gönderir
- Varsayılan model: `agents.defaults.subagents.model` (veya ajan başına `agents.list[].subagents.model`) ayarlamadığınız sürece çağıranı devralır; açık bir `sessions_spawn.model` yine de önceliklidir.
- Varsayılan düşünme: `agents.defaults.subagents.thinking` (veya ajan başına `agents.list[].subagents.thinking`) ayarlamadığınız sürece çağıranı devralır; açık bir `sessions_spawn.thinking` yine de önceliklidir.
- Varsayılan çalıştırma zaman aşımı: `sessions_spawn.runTimeoutSeconds` atlanırsa OpenClaw, ayarlanmışsa `agents.defaults.subagents.runTimeoutSeconds` kullanır; aksi halde `0`'a (zaman aşımı yok) geri düşer.

Araç parametreleri:

- `task` (gerekli)
- `label?` (isteğe bağlı)
- `agentId?` (isteğe bağlı; izin veriliyorsa başka bir ajan kimliği altında oluşturur)
- `model?` (isteğe bağlı; alt ajan modelini geçersiz kılar; geçersiz değerler atlanır ve alt ajan araç sonucunda uyarıyla varsayılan modelde çalışır)
- `thinking?` (isteğe bağlı; alt ajan çalıştırması için düşünme düzeyini geçersiz kılar)
- `runTimeoutSeconds?` (ayarlanmışsa varsayılan olarak `agents.defaults.subagents.runTimeoutSeconds`, aksi halde `0`; ayarlanırsa alt ajan çalıştırması N saniye sonra durdurulur)
- `thread?` (varsayılan `false`; `true` olduğunda bu alt ajan oturumu için kanal thread bağlaması ister)
- `mode?` (`run|session`)
  - varsayılan `run` olur
  - `thread: true` ise ve `mode` atlanmışsa varsayılan `session` olur
  - `mode: "session"` için `thread: true` gerekir
- `cleanup?` (`delete|keep`, varsayılan `keep`)
- `sandbox?` (`inherit|require`, varsayılan `inherit`; `require`, hedef alt çalışma zamanı sandbox içindeyse oluşturmayı reddeder)
- `context?` (`isolated|fork`, varsayılan `isolated`; yalnızca yerel alt ajanlar)
  - `isolated` temiz bir alt transkript oluşturur ve varsayılandır.
  - `fork`, isteyenin geçerli transkriptini alt oturuma dallandırır; böylece alt öğe aynı konuşma bağlamıyla başlar.
  - `fork` yalnızca alt öğe geçerli transkripte ihtiyaç duyduğunda kullanılmalıdır. Kapsamlı işler için `context` değerini atlayın.
- `sessions_spawn`, kanal teslim parametrelerini (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`) kabul etmez. Teslim için oluşturulan çalıştırmadan `message`/`sessions_send` kullanın.

## Thread'e bağlı oturumlar

Bir kanalda thread bağları etkinleştirildiğinde, bir alt ajan bir thread'e bağlı kalabilir; böylece o thread içindeki takip kullanıcı mesajları aynı alt ajan oturumuna yönlenmeye devam eder.

### Thread destekleyen kanallar

- Discord (şu anda desteklenen tek kanal): kalıcı thread'e bağlı alt ajan oturumlarını (`thread: true` ile `sessions_spawn`), el ile thread denetimlerini (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) ve `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` ve `channels.discord.threadBindings.spawnSubagentSessions` bağdaştırıcı anahtarlarını destekler.

Hızlı akış:

1. `thread: true` (ve isteğe bağlı olarak `mode: "session"`) ile `sessions_spawn` kullanarak oluşturun.
2. OpenClaw, etkin kanalda o oturum hedefine bir thread oluşturur veya bağlar.
3. O thread içindeki yanıtlar ve takip mesajları bağlı oturuma yönlendirilir.
4. Etkinsizlikte otomatik odak kaldırmayı incelemek/güncellemek için `/session idle`, katı üst sınırı denetlemek için `/session max-age` kullanın.
5. El ile ayırmak için `/unfocus` kullanın.

El ile denetimler:

- `/focus <target>` geçerli thread'i (veya bir tane oluşturur) bir alt ajan/oturum hedefine bağlar.
- `/unfocus` geçerli bağlı thread için bağı kaldırır.
- `/agents` etkin çalıştırmaları ve bağ durumunu listeler (`thread:<id>` veya `unbound`).
- `/session idle` ve `/session max-age` yalnızca odaklanmış bağlı thread'lerde çalışır.

Yapılandırma anahtarları:

- Genel varsayılan: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Kanal geçersiz kılması ve oluşturma otomatik bağlama anahtarları bağdaştırıcıya özeldir. Yukarıdaki **Thread destekleyen kanallar** bölümüne bakın.

Geçerli bağdaştırıcı ayrıntıları için [Configuration Reference](/tr/gateway/configuration-reference) ve [Slash commands](/tr/tools/slash-commands) sayfalarına bakın.

Allowlist:

- `agents.list[].subagents.allowAgents`: `agentId` üzerinden hedeflenebilecek ajan kimliklerinin listesi (`["*"]` herhangi birine izin verir). Varsayılan: yalnızca isteyen ajan.
- `agents.defaults.subagents.allowAgents`: isteyen ajan kendi `subagents.allowAgents` değerini ayarlamadığında kullanılan varsayılan hedef-ajan allowlist'i.
- Sandbox devralma koruması: isteyen oturum sandbox içindeyse `sessions_spawn`, sandbox dışında çalışacak hedefleri reddeder.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: true olduğunda `agentId` atlayan `sessions_spawn` çağrılarını engeller (açık profil seçimini zorlar). Varsayılan: false.

Keşif:

- Şu anda hangi ajan kimliklerine `sessions_spawn` için izin verildiğini görmek üzere `agents_list` kullanın.

Otomatik arşivleme:

- Alt ajan oturumları `agents.defaults.subagents.archiveAfterMinutes` sonrasında otomatik olarak arşivlenir (varsayılan: 60).
- Arşivleme `sessions.delete` kullanır ve transkripti `*.deleted.<timestamp>` olarak yeniden adlandırır (aynı klasörde).
- `cleanup: "delete"`, duyurudan hemen sonra arşivler (yine de transkripti yeniden adlandırarak korur).
- Otomatik arşivleme en iyi çabadır; bekleyen zamanlayıcılar Gateway yeniden başlarsa kaybolur.
- `runTimeoutSeconds` otomatik arşivleme yapmaz; yalnızca çalıştırmayı durdurur. Oturum otomatik arşive kadar kalır.
- Otomatik arşivleme hem derinlik-1 hem de derinlik-2 oturumlara eşit uygulanır.
- Tarayıcı temizliği arşiv temizliğinden ayrıdır: izlenen tarayıcı sekmeleri/süreçleri, transkript/oturum kaydı tutulsa bile çalıştırma bitince en iyi çabayla kapatılır.

## İç içe alt ajanlar

Varsayılan olarak alt ajanlar kendi alt ajanlarını oluşturamaz (`maxSpawnDepth: 1`). `maxSpawnDepth: 2` ayarlayarak tek düzey iç içe yerleşmeyi etkinleştirebilirsiniz; bu, **orkestratör deseni**ne izin verir: ana → orkestratör alt ajan → işçi alt-alt ajanlar.

### Nasıl etkinleştirilir

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // alt ajanların alt öğe oluşturmasına izin ver (varsayılan: 1)
        maxChildrenPerAgent: 5, // ajan oturumu başına en fazla etkin alt öğe (varsayılan: 5)
        maxConcurrent: 8, // genel eşzamanlılık şeridi sınırı (varsayılan: 8)
        runTimeoutSeconds: 900, // atlandığında sessions_spawn için varsayılan zaman aşımı (0 = zaman aşımı yok)
      },
    },
  },
}
```

### Derinlik düzeyleri

| Derinlik | Oturum anahtarı biçimi                   | Rol                                           | Oluşturabilir mi?             |
| -------- | ---------------------------------------- | --------------------------------------------- | ----------------------------- |
| 0        | `agent:<id>:main`                        | Ana ajan                                      | Her zaman                     |
| 1        | `agent:<id>:subagent:<uuid>`             | Alt ajan (`maxSpawnDepth >= 2` olduğunda orkestratör) | Yalnızca `maxSpawnDepth >= 2` ise |
| 2        | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Alt-alt ajan (yaprak işçi)                | Asla                          |

### Duyuru zinciri

Sonuçlar zincir boyunca yukarı akar:

1. Derinlik-2 işçisi biter → üst öğesine duyurur (derinlik-1 orkestratör)
2. Derinlik-1 orkestratör duyuruyu alır, sonuçları sentezler, biter → ana öğeye duyurur
3. Ana ajan duyuruyu alır ve kullanıcıya teslim eder

Her seviye yalnızca doğrudan alt öğelerinden gelen duyuruları görür.

Operasyonel yönergeler:

- Alt iş başlatıldıktan sonra `sessions_list`, `sessions_history`, `/subagents list` veya
  `exec` sleep komutları etrafında yoklama döngüleri kurmak yerine
  tamamlama olaylarını bekleyin.
- `sessions_list` ve `/subagents list`, alt oturum ilişkilerini canlı işle
  sınırlı tutar: canlı alt öğeler bağlı kalır, biten alt öğeler kısa bir yakın
  geçmiş penceresinde görünür kalır ve yalnızca depoda kalan eski alt öğe
  bağlantıları tazelik penceresi sonrasında yok sayılır. Bu, yeniden
  başlatmadan sonra eski `spawnedBy` / `parentSessionKey` üst verilerinin hayalet
  alt öğeleri geri getirmesini önler.
- Bir alt öğe tamamlama olayı siz son yanıtı gönderdikten sonra gelirse,
  doğru takip tam sessiz belirteç `NO_REPLY` / `no_reply` olur.

### Derinliğe göre araç ilkesi

- Rol ve denetim kapsamı, oluşturma sırasında oturum üst verilerine yazılır. Bu, düzleştirilmiş veya geri yüklenmiş oturum anahtarlarının yanlışlıkla yeniden orkestratör ayrıcalıkları kazanmasını önler.
- **Derinlik 1 (`maxSpawnDepth >= 2` olduğunda orkestratör)**: Alt öğelerini yönetebilmesi için `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` alır. Diğer oturum/sistem araçları yine reddedilir.
- **Derinlik 1 (`maxSpawnDepth == 1` olduğunda yaprak)**: Oturum aracı yoktur (mevcut varsayılan davranış).
- **Derinlik 2 (yaprak işçi)**: Oturum aracı yoktur — `sessions_spawn`, derinlik 2'de her zaman reddedilir. Daha fazla alt öğe oluşturamaz.

### Ajan başına oluşturma sınırı

Her ajan oturumu (herhangi bir derinlikte) aynı anda en fazla `maxChildrenPerAgent` (varsayılan: 5) etkin alt öğeye sahip olabilir. Bu, tek bir orkestratörden kontrolsüz yelpazelenmeyi önler.

### Zincirleme durdurma

Bir derinlik-1 orkestratörü durdurmak, tüm derinlik-2 alt öğelerini otomatik olarak durdurur:

- Ana sohbette `/stop`, tüm derinlik-1 ajanları durdurur ve derinlik-2 alt öğelerine zincirleme uygular.
- `/subagents kill <id>`, belirli bir alt ajanı durdurur ve alt öğelerine zincirleme uygular.
- `/subagents kill all`, isteyen için tüm alt ajanları durdurur ve zincirleme uygular.

## Kimlik doğrulama

Alt ajan kimlik doğrulaması, oturum türüne göre değil **ajan kimliğine** göre çözümlenir:

- Alt ajan oturum anahtarı `agent:<agentId>:subagent:<uuid>` biçimindedir.
- Kimlik doğrulama deposu, o ajanın `agentDir` değerinden yüklenir.
- Ana ajanın kimlik doğrulama profilleri bir **fallback** olarak birleştirilir; çakışmalarda ajan profilleri ana profilin önüne geçer.

Not: birleştirme toplamsaldır; bu yüzden ana profiller fallback olarak her zaman kullanılabilir. Ajan başına tamamen yalıtılmış kimlik doğrulama henüz desteklenmiyor.

## Duyuru

Alt ajanlar, bir duyuru adımı üzerinden geri bildirir:

- Duyuru adımı, isteyen oturumda değil alt ajan oturumunda çalışır.
- Alt ajan tam olarak `ANNOUNCE_SKIP` yanıtını verirse hiçbir şey gönderilmez.
- En son asistan metni tam sessiz belirteç `NO_REPLY` / `no_reply` ise,
  daha önce görünür ilerleme olmuş olsa bile duyuru çıktısı bastırılır.
- Aksi durumda teslim, isteyen derinliğine bağlıdır:
  - üst düzey isteyen oturumlar, harici teslimli (`deliver=true`) bir takip `agent` çağrısı kullanır
  - iç içe isteyen alt ajan oturumları, orkestratörün alt öğe sonuçlarını oturum içinde sentezleyebilmesi için iç bir takip enjeksiyonu (`deliver=false`) alır
  - iç içe isteyen alt ajan oturumu gitmişse, OpenClaw mümkün olduğunda o oturumun isteyeni için fallback uygular
- Üst düzey isteyen oturumlarda tamamlanma modu doğrudan teslim, önce bağlı konuşma/thread rotasını ve kanca geçersiz kılmasını çözümler, ardından eksik kanal-hedef alanlarını isteyen oturumun saklanan rotasından doldurur. Bu, tamamlama kaynağı yalnızca kanalı tanımlasa bile tamamlamaları doğru sohbet/konuda tutar.
- İç içe tamamlama bulguları oluşturulurken alt öğe tamamlama toplaması geçerli isteyen çalıştırmasıyla sınırlandırılır; böylece eski önceki çalıştırma alt öğe çıktıları geçerli duyuruya sızmaz.
- Duyuru yanıtları, kanal bağdaştırıcılarında mümkün olduğunda thread/konu yönlendirmesini korur.
- Duyuru bağlamı, kararlı bir iç olay bloğuna normalleştirilir:
  - kaynak (`subagent` veya `cron`)
  - alt oturum anahtarı/kimliği
  - duyuru türü + görev etiketi
  - çalışma zamanı sonucundan türetilen durum satırı (`success`, `error`, `timeout` veya `unknown`)
  - en son görünür asistan metninden seçilen sonuç içeriği, aksi durumda temizlenmiş en son `tool`/`toolResult` metni; terminal başarısız çalıştırmalar, yakalanmış yanıt metnini yeniden oynatmadan başarısızlık durumu bildirir
  - ne zaman yanıt verileceğini ve ne zaman sessiz kalınacağını açıklayan bir takip yönergesi
- `Status`, model çıktısından çıkarılmaz; çalışma zamanı sonuç sinyallerinden gelir.
- Zaman aşımında, alt öğe yalnızca araç çağrılarına kadar geldiyse duyuru, ham araç çıktısını yeniden oynatmak yerine bu geçmişi kısa bir kısmi ilerleme özetine indirgemeyi seçebilir.

Duyuru yükleri sonda bir istatistik satırı içerir (sarılmış olsa bile):

- Çalışma zamanı (ör. `runtime 5m12s`)
- Token kullanımı (girdi/çıktı/toplam)
- Model fiyatlandırması yapılandırılmışsa tahmini maliyet (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` ve transkript yolu (böylece ana ajan geçmişi `sessions_history` ile getirebilir veya dosyayı disk üzerinde inceleyebilir)
- İç üst veriler yalnızca orkestrasyon içindir; kullanıcıya dönük yanıtlar normal asistan sesiyle yeniden yazılmalıdır.

`sessions_history`, daha güvenli orkestrasyon yoludur:

- asistan geri çağırması önce normalleştirilir:
  - thinking etiketleri kaldırılır
  - `<relevant-memories>` / `<relevant_memories>` iskele blokları kaldırılır
  - `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` ve
    `<function_calls>...</function_calls>` gibi düz metin tool-call XML yük blokları,
    düzgün kapanmayan kesilmiş yükler dahil kaldırılır
  - düşürülmüş tool-call/result iskelesi ve historical-context işaretleri kaldırılır
  - `<|assistant|>`, diğer ASCII
    `<|...|>` belirteçleri ve tam genişlikli `<｜...｜>` varyantları gibi sızmış model denetim belirteçleri kaldırılır
  - bozuk MiniMax tool-call XML kaldırılır
- kimlik bilgisi/token benzeri metin sansürlenir
- uzun bloklar kesilebilir
- çok büyük geçmişler eski satırları düşürebilir veya büyük bir satırı
  `[sessions_history omitted: message too large]` ile değiştirebilir
- ham, bayt bayt tam transkripte ihtiyaç duyduğunuzda fallback yolu disk üzerindeki transkripti incelemektir

## Araç ilkesi (alt ajan araçları)

Varsayılan olarak alt ajanlar **oturum araçları** ve sistem araçları hariç **tüm araçları** alır:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history`, burada da sınırlandırılmış, temizlenmiş bir geri çağırma görünümü olarak kalır; ham bir transkript dökümü değildir.

`maxSpawnDepth >= 2` olduğunda, derinlik-1 orkestratör alt ajanları alt öğelerini yönetebilmek için ek olarak `sessions_spawn`, `subagents`, `sessions_list` ve `sessions_history` alır.

Yapılandırma ile geçersiz kılın:

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny kazanır
        deny: ["gateway", "cron"],
        // allow ayarlanırsa yalnızca izin verilen mod olur (deny yine kazanır)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Eşzamanlılık

Alt ajanlar özel, süreç içi bir kuyruk şeridi kullanır:

- Şerit adı: `subagent`
- Eşzamanlılık: `agents.defaults.subagents.maxConcurrent` (varsayılan `8`)

## Canlılık ve kurtarma

OpenClaw, `endedAt` yokluğunu bir alt ajanın hâlâ canlı olduğuna dair kalıcı kanıt olarak değerlendirmez. Eski çalıştırma penceresinden daha yaşlı, sonlanmamış çalıştırmalar `/subagents list`, durum özetleri, alt öğe tamamlama geçitleri ve oturum başına eşzamanlılık denetimlerinde artık etkin/beklemede sayılmaz.

Gateway yeniden başlatmasından sonra, eski sonlanmamış geri yüklenmiş çalıştırmalar alt oturum `abortedLastRun: true` olarak işaretlenmedikçe budanır. Yeniden başlatmada iptal edilen bu alt oturumlar, iptal işaretini temizlemeden önce sentetik bir sürdürme mesajı gönderen alt ajan yetim kurtarma akışı üzerinden kurtarılabilir kalır.

## Durdurma

- İsteyen sohbette `/stop` göndermek, isteyen oturumu iptal eder ve ondan oluşturulan tüm etkin alt ajan çalıştırmalarını durdurur; iç içe alt öğelere zincirleme uygular.
- `/subagents kill <id>`, belirli bir alt ajanı durdurur ve alt öğelerine zincirleme uygular.

## Sınırlamalar

- Alt ajan duyurusu **en iyi çaba** esaslıdır. Gateway yeniden başlarsa, bekleyen "geri duyur" işleri kaybolur.
- Alt ajanlar hâlâ aynı Gateway süreç kaynaklarını paylaşır; `maxConcurrent` değerini bir güvenlik valfi olarak değerlendirin.
- `sessions_spawn` her zaman engellemesizdir: hemen `{ status: "accepted", runId, childSessionKey }` döndürür.
- Alt ajan bağlamı yalnızca `AGENTS.md` + `TOOLS.md` enjekte eder (`SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` veya `BOOTSTRAP.md` yoktur).
- En fazla iç içe yerleşme derinliği 5'tir (`maxSpawnDepth` aralığı: 1–5). Çoğu kullanım için derinlik 2 önerilir.
- `maxChildrenPerAgent`, oturum başına etkin alt öğeleri sınırlar (varsayılan: 5, aralık: 1–20).

## İlgili

- [ACP ajanları](/tr/tools/acp-agents)
- [Çok ajanlı sandbox araçları](/tr/tools/multi-agent-sandbox-tools)
- [Ajan gönderimi](/tr/tools/agent-send)
