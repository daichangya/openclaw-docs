---
read_when:
    - Session kimliklerini, transcript JSONL'yi veya sessions.json alanlarını hata ayıklamanız gerekiyor
    - Otomatik Compaction davranışını değiştiriyorsunuz veya “pre-compaction” ön hazırlık işlemleri ekliyorsunuz
    - Memory flush'larını veya sessiz sistem dönüşlerini uygulamak istiyorsunuz
summary: 'Derin inceleme: session store + transcript''ler, yaşam döngüsü ve (otomatik) Compaction iç yapısı'
title: Session yönetimine derinlemesine bakış
x-i18n:
    generated_at: "2026-04-25T13:57:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: f15b8cf4b1deb947b292c6931257218d7147c11c963e7bf2689b6d1f77ea8159
    source_path: reference/session-management-compaction.md
    workflow: 15
---

Bu sayfa, OpenClaw'ın session'ları uçtan uca nasıl yönettiğini açıklar:

- **Session routing** (gelen mesajların bir `sessionKey` değerine nasıl eşlendiği)
- **Session store** (`sessions.json`) ve bunun neyi izlediği
- **Transcript kalıcılığı** (`*.jsonl`) ve yapısı
- **Transcript hijyeni** (çalıştırmalardan önce provider'a özgü düzeltmeler)
- **Bağlam sınırları** (context window ile izlenen token'lar arasındaki fark)
- **Compaction** (manuel + otomatik Compaction) ve pre-compaction işlerini nereye bağlayacağınız
- **Sessiz ön hazırlık işlemleri** (ör. kullanıcıya görünür çıktı üretmemesi gereken memory yazımları)

Önce daha üst düzey bir genel bakış istiyorsanız, şuradan başlayın:

- [Session yönetimi](/tr/concepts/session)
- [Compaction](/tr/concepts/compaction)
- [Memory genel bakışı](/tr/concepts/memory)
- [Memory arama](/tr/concepts/memory-search)
- [Session budama](/tr/concepts/session-pruning)
- [Transcript hijyeni](/tr/reference/transcript-hygiene)

---

## Doğruluk kaynağı: Gateway

OpenClaw, session durumuna sahip olan tek bir **Gateway süreci** etrafında tasarlanmıştır.

- UI'lar (macOS uygulaması, web Control UI, TUI), session listeleri ve token sayıları için Gateway'i sorgulamalıdır.
- Uzak modda, session dosyaları uzak host üzerindedir; “yerel Mac dosyalarınızı kontrol etmek” Gateway'in kullandığını yansıtmaz.

---

## İki kalıcılık katmanı

OpenClaw, session'ları iki katmanda kalıcı hale getirir:

1. **Session store (`sessions.json`)**
   - Anahtar/değer eşlemesi: `sessionKey -> SessionEntry`
   - Küçük, değiştirilebilir, düzenlemesi güvenlidir (veya girdileri silebilirsiniz)
   - Session metadata'sını izler (geçerli session kimliği, son etkinlik, geçişler, token sayaçları vb.)

2. **Transcript (`<sessionId>.jsonl`)**
   - Ağaç yapılı yalnızca eklemeli transcript (girdilerde `id` + `parentId` bulunur)
   - Gerçek konuşmayı + tool çağrılarını + compaction özetlerini depolar
   - Gelecekteki dönüşler için model bağlamını yeniden oluşturmakta kullanılır

---

## Disk üzerindeki konumlar

Her agent için, Gateway host'unda:

- Store: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcript'ler: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram konu session'ları: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw bunları `src/config/sessions.ts` üzerinden çözümler.

---

## Store bakımı ve disk denetimleri

Session kalıcılığında, `sessions.json` ve transcript artifaktları için otomatik bakım denetimleri (`session.maintenance`) vardır:

- `mode`: `warn` (varsayılan) veya `enforce`
- `pruneAfter`: bayat giriş yaş sınırı (varsayılan `30d`)
- `maxEntries`: `sessions.json` içindeki giriş üst sınırı (varsayılan `500`)
- `rotateBytes`: `sessions.json` aşırı büyüdüğünde döndürme eşiği (varsayılan `10mb`)
- `resetArchiveRetention`: `*.reset.<timestamp>` transcript arşivleri için saklama süresi (varsayılan: `pruneAfter` ile aynı; `false` temizlemeyi devre dışı bırakır)
- `maxDiskBytes`: isteğe bağlı sessions dizini bütçesi
- `highWaterBytes`: temizleme sonrası isteğe bağlı hedef (varsayılan `maxDiskBytes` değerinin `%80`'i)

Disk bütçesi temizliği için uygulama sırası (`mode: "enforce"`):

1. Önce en eski arşivlenmiş veya sahipsiz transcript artifaktlarını kaldırın.
2. Hâlâ hedefin üzerindeyse, en eski session girdilerini ve transcript dosyalarını çıkarın.
3. Kullanım `highWaterBytes` değerine inene veya altına düşene kadar devam edin.

`mode: "warn"` durumunda OpenClaw olası çıkarmaları bildirir, ancak store/dosyaları değiştirmez.

Bakımı isteğe bağlı çalıştırın:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron session'ları ve çalıştırma günlükleri

Yalıtılmış Cron çalıştırmaları da session girdileri/transcript'ler oluşturur ve bunlar için özel saklama denetimleri vardır:

- `cron.sessionRetention` (varsayılan `24h`), eski yalıtılmış Cron çalıştırma session'larını session store'dan budar (`false` devre dışı bırakır).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`, `~/.openclaw/cron/runs/<jobId>.jsonl` dosyalarını budar (varsayılanlar: `2_000_000` bayt ve `2000` satır).

Cron yeni bir yalıtılmış çalıştırma session'ı zorla oluşturduğunda, yeni satırı yazmadan önce önceki
`cron:<jobId>` session girdisini temizler. Thinking/fast/verbose ayarları, etiketler ve açık
kullanıcı seçimi model/auth geçersiz kılmaları gibi güvenli tercihleri taşır. Ortam konuşma bağlamını
ör. channel/group routing, send veya queue ilkesi, yükseltme, origin ve ACP
runtime bağını bırakır; böylece yeni bir yalıtılmış çalıştırma, eski bir çalıştırmadan kalmış teslimat veya
runtime yetkisini devralamaz.

---

## Session anahtarları (`sessionKey`)

Bir `sessionKey`, _hangi konuşma kovasında_ olduğunuzu tanımlar (routing + yalıtım).

Yaygın desenler:

- Ana/doğrudan sohbet (agent başına): `agent:<agentId>:<mainKey>` (varsayılan `main`)
- Grup: `agent:<agentId>:<channel>:group:<id>`
- Oda/channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` veya `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (geçersiz kılınmadıkça)

Kanonik kurallar [/concepts/session](/tr/concepts/session) altında belgelenmiştir.

---

## Session kimlikleri (`sessionId`)

Her `sessionKey`, geçerli bir `sessionId` değerine işaret eder (konuşmayı sürdüren transcript dosyası).

Temel kurallar:

- **Sıfırlama** (`/new`, `/reset`), o `sessionKey` için yeni bir `sessionId` oluşturur.
- **Günlük sıfırlama** (varsayılan olarak Gateway host'undaki yerel saate göre sabah 4:00), sıfırlama sınırından sonraki ilk mesajda yeni bir `sessionId` oluşturur.
- **Boşta kalma süresi dolumu** (`session.reset.idleMinutes` veya eski `session.idleMinutes`), mesaj boşta kalma penceresinden sonra geldiğinde yeni bir `sessionId` oluşturur. Günlük + boşta kalma birlikte yapılandırıldığında, hangisi önce dolarsa o kazanır.
- **Thread üst oturum fork koruması** (`session.parentForkMaxTokens`, varsayılan `100000`), üst session zaten çok büyükse üst transcript çatallanmasını atlar; yeni thread temiz başlar. Devre dışı bırakmak için `0` ayarlayın.

Uygulama ayrıntısı: karar `src/auto-reply/reply/session.ts` içindeki `initSessionState()` içinde verilir.

---

## Session store şeması (`sessions.json`)

Store'un değer türü, `src/config/sessions.ts` içindeki `SessionEntry`'dir.

Temel alanlar (tam liste değildir):

- `sessionId`: geçerli transcript kimliği (dosya adı, `sessionFile` ayarlanmadıkça bundan türetilir)
- `updatedAt`: son etkinlik zaman damgası
- `sessionFile`: isteğe bağlı açık transcript yolu geçersiz kılması
- `chatType`: `direct | group | room` (UI'lara ve gönderim ilkesine yardımcı olur)
- `provider`, `subject`, `room`, `space`, `displayName`: grup/channel etiketleme için metadata
- Geçişler:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (session başına geçersiz kılma)
- Model seçimi:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token sayaçları (best-effort / provider'a bağlı):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: bu session anahtarı için otomatik Compaction'ın kaç kez tamamlandığı
- `memoryFlushAt`: son pre-compaction memory flush zaman damgası
- `memoryFlushCompactionCount`: son flush çalıştığında compaction sayısı

Store'u düzenlemek güvenlidir, ancak yetkili kaynak Gateway'dir: session'lar çalıştıkça girdileri yeniden yazabilir veya yeniden su yüzüne çıkarabilir.

---

## Transcript yapısı (`*.jsonl`)

Transcript'ler, `@mariozechner/pi-coding-agent` içindeki `SessionManager` tarafından yönetilir.

Dosya JSONL biçimindedir:

- İlk satır: session üstbilgisi (`type: "session"`, `id`, `cwd`, `timestamp`, isteğe bağlı `parentSession` içerir)
- Sonrasında: `id` + `parentId` içeren session girdileri (ağaç)

Dikkat çekici girdi türleri:

- `message`: user/assistant/toolResult mesajları
- `custom_message`: model bağlamına _giren_ extension eklemeli mesajlar (UI'dan gizlenebilir)
- `custom`: model bağlamına girmeyen extension durumu
- `compaction`: `firstKeptEntryId` ve `tokensBefore` içeren kalıcı compaction özeti
- `branch_summary`: ağaç dalında gezinirken kalıcı özet

OpenClaw transcript'leri bilinçli olarak **düzeltmez**; Gateway bunları okumak/yazmak için `SessionManager` kullanır.

---

## Context window'lar ile izlenen token'lar

İki farklı kavram önemlidir:

1. **Model context window'u**: model başına sabit üst sınır (modelin gördüğü token'lar)
2. **Session store sayaçları**: `sessions.json` içine yazılan dönen istatistikler (/status ve panolarda kullanılır)

Sınırları ayarlıyorsanız:

- Context window model kataloğundan gelir (ve config ile geçersiz kılınabilir).
- Store içindeki `contextTokens` çalışma zamanı tahmin/raporlama değeridir; bunu katı bir garanti olarak görmeyin.

Daha fazlası için bkz. [/token-use](/tr/reference/token-use).

---

## Compaction: nedir

Compaction, konuşmanın eski kısımlarını transcript içinde kalıcı bir `compaction` girdisinde özetler ve son mesajları olduğu gibi tutar.

Compaction sonrasında gelecekteki dönüşler şunları görür:

- Compaction özeti
- `firstKeptEntryId` sonrasındaki mesajlar

Compaction **kalıcıdır** (session budamasının aksine). Bkz. [/concepts/session-pruning](/tr/concepts/session-pruning).

## Compaction parça sınırları ve tool eşleştirmesi

OpenClaw uzun bir transcript'i Compaction parçalarına böldüğünde,
assistant tool çağrılarını bunlara karşılık gelen `toolResult` girdileriyle eşli tutar.

- Token paylaşımı bölmesi bir tool çağrısı ile sonucu arasına denk gelirse, OpenClaw
  sınırı çifti ayırmak yerine assistant tool-call mesajına kaydırır.
- Sondaki bir tool-result bloğu aksi durumda parçayı hedefin üstüne taşıyacaksa,
  OpenClaw bu bekleyen tool bloğunu korur ve özetlenmemiş kuyruğu olduğu gibi tutar.
- İptal edilmiş/hatalı tool-call blokları bekleyen bir bölmeyi açık tutmaz.

---

## Otomatik Compaction ne zaman olur (Pi runtime)

Embedded Pi agent içinde otomatik Compaction iki durumda tetiklenir:

1. **Taşma kurtarma**: model bir bağlam taşma hatası döndürür
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` ve benzeri provider biçimli varyantlar) → compact → yeniden dene.
2. **Eşik bakımı**: başarılı bir dönüşten sonra, şu durumda:

`contextTokens > contextWindow - reserveTokens`

Burada:

- `contextWindow`, modelin context window'udur
- `reserveTokens`, istemler + sonraki model çıktısı için ayrılan boşluk payıdır

Bunlar Pi runtime anlamlarıdır (OpenClaw olayları tüketir, ancak ne zaman compact edileceğine Pi karar verir).

---

## Compaction ayarları (`reserveTokens`, `keepRecentTokens`)

Pi'nin Compaction ayarları Pi settings içinde yer alır:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw embedded çalıştırmalar için ayrıca bir güvenlik tabanı da uygular:

- Eğer `compaction.reserveTokens < reserveTokensFloor` ise, OpenClaw bunu yükseltir.
- Varsayılan taban `20000` token'dır.
- Tabanı devre dışı bırakmak için `agents.defaults.compaction.reserveTokensFloor: 0` ayarlayın.
- Zaten daha yüksekse OpenClaw olduğu gibi bırakır.
- Manuel `/compact`, açık bir `agents.defaults.compaction.keepRecentTokens`
  değerine uyar ve Pi'nin son kuyruk kesme noktasını korur. Açık bir tutma bütçesi yoksa,
  manuel Compaction sert bir denetim noktası olarak kalır ve yeniden oluşturulan bağlam
  yeni özetten başlar.

Neden: Compaction kaçınılmaz olmadan önce çok dönüşlü “ön hazırlık” işlemleri (ör. memory yazımları) için yeterli boşluk bırakmak.

Uygulama: `src/agents/pi-settings.ts` içindeki `ensurePiCompactionReserveTokens()`
(`src/agents/pi-embedded-runner.ts` içinden çağrılır).

---

## Takılabilir Compaction provider'ları

Plugin'ler, Plugin API üzerindeki `registerCompactionProvider()` ile bir Compaction provider'ı kaydedebilir. `agents.defaults.compaction.provider` kayıtlı bir provider kimliğine ayarlandığında, koruma extension'ı özetlemeyi yerleşik `summarizeInStages` pipeline'ı yerine o provider'a devreder.

- `provider`: kayıtlı bir Compaction provider Plugin'inin kimliği. Varsayılan LLM özetleme için boş bırakın.
- Bir `provider` ayarlamak `mode: "safeguard"` değerini zorunlu kılar.
- Provider'lar, yerleşik yol ile aynı Compaction yönergelerini ve tanımlayıcı koruma ilkesini alır.
- Koruma mekanizması, provider çıktısından sonra da son dönüş ve bölünmüş dönüş sonek bağlamını korur.
- Yerleşik safeguard özetleme, önceki tam özeti aynen korumak yerine, önceki özetleri yeni mesajlarla birlikte yeniden damıtır.
- Safeguard modu varsayılan olarak özet kalite denetimlerini etkinleştirir; hatalı biçimli çıktı durumunda yeniden deneme davranışını atlamak için
  `qualityGuard.enabled: false` ayarlayın.
- Provider başarısız olursa veya boş bir sonuç döndürürse OpenClaw otomatik olarak yerleşik LLM özetlemeye geri döner.
- Abort/timeout sinyalleri yeniden fırlatılır (yutulmaz); böylece çağıranın iptali korunur.

Kaynak: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Kullanıcının görebildiği yüzeyler

Compaction ve session durumunu şunlar üzerinden gözlemleyebilirsiniz:

- `/status` (herhangi bir sohbet session'ında)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Ayrıntılı mod: `🧹 Auto-compaction complete` + compaction sayısı

---

## Sessiz ön hazırlık işlemleri (`NO_REPLY`)

OpenClaw, kullanıcının ara çıktıyı görmemesi gereken arka plan görevleri için “sessiz” dönüşleri destekler.

Kural:

- Asistan çıktısına tam sessiz belirteç `NO_REPLY` /
  `no_reply` ile başlar; bu, “kullanıcıya yanıt teslim etme” anlamına gelir.
- OpenClaw bunu teslim katmanında temizler/bastırır.
- Tam sessiz belirteç bastırma işlemi büyük/küçük harfe duyarsızdır; bu nedenle tüm payload yalnızca sessiz belirteçten oluştuğunda hem `NO_REPLY` hem de
  `no_reply` geçerlidir.
- Bu, gerçekten arka plan/teslimatsız dönüşler içindir; sıradan işlem gerektiren kullanıcı istekleri için bir kısayol değildir.

`2026.1.10` itibarıyla OpenClaw ayrıca, kısmi bir parça `NO_REPLY` ile başladığında **taslak/typing streaming** işlemini de bastırır; böylece sessiz işlemler dönüş ortasında kısmi çıktı sızdırmaz.

---

## Pre-compaction "memory flush" (uygulandı)

Amaç: otomatik Compaction gerçekleşmeden önce, diske kalıcı
durum yazan sessiz bir agentsel dönüş çalıştırmak (ör. agent çalışma alanındaki `memory/YYYY-MM-DD.md`) ki Compaction kritik bağlamı silemesin.

OpenClaw **eşik öncesi flush** yaklaşımını kullanır:

1. Session bağlam kullanımını izleyin.
2. Bir “yumuşak eşiği” geçtiğinde (Pi'nin Compaction eşiğinin altında), agent'a sessiz bir
   “memory'yi şimdi yaz” yönergesi çalıştırın.
3. Kullanıcının hiçbir şey görmemesi için tam sessiz belirteç `NO_REPLY` / `no_reply`
   kullanın.

Config (`agents.defaults.compaction.memoryFlush`):

- `enabled` (varsayılan: `true`)
- `softThresholdTokens` (varsayılan: `4000`)
- `prompt` (flush dönüşü için kullanıcı mesajı)
- `systemPrompt` (flush dönüşüne eklenen ek sistem istemi)

Notlar:

- Varsayılan prompt/system prompt, teslimatı bastırmak için bir `NO_REPLY` ipucu içerir.
- Flush, her Compaction döngüsünde bir kez çalışır (`sessions.json` içinde izlenir).
- Flush yalnızca embedded Pi session'ları için çalışır (CLI backend'leri bunu atlar).
- Session çalışma alanı salt okunursa flush atlanır (`workspaceAccess: "ro"` veya `"none"`).
- Çalışma alanı dosya düzeni ve yazma desenleri için [Memory](/tr/concepts/memory) bölümüne bakın.

Pi, extension API'de ayrıca bir `session_before_compact` hook'u da sunar, ancak OpenClaw'ın
flush mantığı bugün Gateway tarafında bulunuyor.

---

## Sorun giderme kontrol listesi

- Session anahtarı yanlış mı? [/concepts/session](/tr/concepts/session) ile başlayın ve `/status` içindeki `sessionKey` değerini doğrulayın.
- Store ile transcript uyuşmuyor mu? Gateway host'unu ve `openclaw status` içindeki store yolunu doğrulayın.
- Compaction spam'i mi var? Şunları kontrol edin:
  - model context window'u (çok küçük olabilir)
  - Compaction ayarları (`reserveTokens` model penceresine göre çok yüksekse daha erken Compaction'a neden olabilir)
  - tool-result şişmesi: session budamayı etkinleştirin/ayarlayın
- Sessiz dönüşler sızıyor mu? Yanıtın `NO_REPLY` ile başladığını (büyük/küçük harfe duyarsız tam belirteç) ve streaming bastırma düzeltmesini içeren bir build kullandığınızı doğrulayın.

## İlgili

- [Session yönetimi](/tr/concepts/session)
- [Session budama](/tr/concepts/session-pruning)
- [Context engine](/tr/concepts/context-engine)
