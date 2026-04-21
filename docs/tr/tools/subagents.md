---
read_when:
    - Aracı aracılığıyla arka plan/paralel çalışma istiyorsunuz
    - '`sessions_spawn` veya alt temsilci araç politikasını değiştiriyorsunuz'
    - İş parçacığına bağlı alt temsilci oturumlarını uyguluyor veya sorunlarını gideriyorsunuz
summary: 'Alt temsilciler: sonuçları tekrar istekte bulunan sohbetine bildiren izole temsilci çalıştırmaları'
title: Alt Temsilciler
x-i18n:
    generated_at: "2026-04-21T19:20:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 218913f0db88d40e1b5fdb0201b8d23e7af23df572c86ff4be2637cb62498281
    source_path: tools/subagents.md
    workflow: 15
---

# Alt Temsilciler

Alt temsilciler, mevcut bir temsilci çalıştırmasından başlatılan arka plan temsilci çalıştırmalarıdır. Kendi oturumlarında çalışırlar (`agent:<agentId>:subagent:<uuid>`) ve tamamlandıklarında sonuçlarını tekrar istekte bulunan sohbet kanalına **duyururlar**. Her alt temsilci çalıştırması bir [arka plan görevi](/tr/automation/tasks) olarak izlenir.

## Eğik çizgi komutu

**Geçerli oturum** için alt temsilci çalıştırmalarını incelemek veya denetlemek üzere `/subagents` kullanın:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

İş parçacığı bağlama denetimleri:

Bu komutlar, kalıcı iş parçacığı bağlamalarını destekleyen kanallarda çalışır. Aşağıdaki **İş parçacığını destekleyen kanallar** bölümüne bakın.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info`, çalıştırma meta verilerini gösterir (durum, zaman damgaları, oturum kimliği, transkript yolu, temizleme).
Sınırlı, güvenlik filtresinden geçirilmiş bir geri çağırma görünümü için `sessions_history` kullanın; ham tam transkripte ihtiyaç duyduğunuzda diskteki transkript yolunu inceleyin.

### Başlatma davranışı

`/subagents spawn`, bir arka plan alt temsilcisini dahili aktarma olarak değil, kullanıcı komutu olarak başlatır ve çalıştırma bittiğinde istekte bulunan sohbete tek bir son tamamlama güncellemesi gönderir.

- Başlatma komutu engelleyici değildir; hemen bir çalıştırma kimliği döndürür.
- Tamamlandığında alt temsilci, istekte bulunan sohbet kanalına bir özet/sonuç mesajı duyurur.
- Tamamlama itme tabanlıdır. Başlatıldıktan sonra, bitmesini beklemek için döngü içinde `/subagents list`, `sessions_list` veya `sessions_history` yoklaması yapmayın; durumu yalnızca hata ayıklama veya müdahale gerektiğinde inceleyin.
- Tamamlandığında OpenClaw, duyuru temizleme akışı devam etmeden önce o alt temsilci oturumu tarafından açılan izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır.
- Manuel başlatmalarda teslimat dayanıklıdır:
  - OpenClaw önce kararlı bir eşzamanlılık anahtarıyla doğrudan `agent` teslimatını dener.
  - Doğrudan teslimat başarısız olursa kuyruk yönlendirmesine geri döner.
  - Kuyruk yönlendirmesi de mevcut değilse, son vazgeçmeden önce duyuru kısa bir üstel geri çekilmeyle yeniden denenir.
- Tamamlama teslimatı çözümlenmiş istekte bulunan rotasını korur:
  - mevcut olduğunda iş parçacığına bağlı veya konuşmaya bağlı tamamlama rotaları önceliklidir
  - tamamlama kaynağı yalnızca bir kanal sağlıyorsa, OpenClaw istekte bulunan oturumun çözümlenmiş rotasından (`lastChannel` / `lastTo` / `lastAccountId`) eksik hedefi/hesabı doldurur; böylece doğrudan teslimat yine çalışır
- İstekte bulunan oturuma yapılan tamamlama devri, çalışma zamanında üretilen dahili bağlamdır (kullanıcı tarafından yazılmış metin değildir) ve şunları içerir:
  - `Result` (en son görünür `assistant` yanıt metni; yoksa temizlenmiş en son tool/toolResult metni; sonlandırılmış başarısız çalıştırmalar yakalanmış yanıt metnini yeniden kullanmaz)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - kompakt çalışma zamanı/token istatistikleri
  - istekte bulunan temsilciye ham dahili meta veriyi iletmek yerine normal yardımcı sesiyle yeniden yazmasını söyleyen bir teslimat talimatı
- `--model` ve `--thinking`, bu belirli çalıştırma için varsayılanları geçersiz kılar.
- Tamamlandıktan sonra ayrıntıları ve çıktıyı incelemek için `info`/`log` kullanın.
- `/subagents spawn`, tek seferlik moddur (`mode: "run"`). Kalıcı, iş parçacığına bağlı oturumlar için `thread: true` ve `mode: "session"` ile `sessions_spawn` kullanın.
- ACP harness oturumları için (Codex, Claude Code, Gemini CLI) `runtime: "acp"` ile `sessions_spawn` kullanın ve [ACP Agents](/tr/tools/acp-agents) bölümüne bakın.

Birincil hedefler:

- Ana çalıştırmayı engellemeden "araştırma / uzun görev / yavaş araç" işini paralelleştirmek.
- Alt temsilcileri varsayılan olarak yalıtılmış tutmak (oturum ayrımı + isteğe bağlı sandbox).
- Araç yüzeyini kötüye kullanımı zor tutmak: alt temsilciler varsayılan olarak oturum araçlarını **almaz**.
- Orkestratör düzenleri için yapılandırılabilir iç içe geçme derinliğini desteklemek.

Maliyet notu: her alt temsilcinin **kendi** bağlamı ve token kullanımı vardır. Ağır veya tekrarlı görevler için alt temsilcilerde daha ucuz bir model ayarlayın ve ana temsilcinizi daha yüksek kaliteli bir modelde tutun.
Bunu `agents.defaults.subagents.model` veya temsilci başına geçersiz kılmalarla yapılandırabilirsiniz.

## Araç

`sessions_spawn` kullanın:

- Bir alt temsilci çalıştırması başlatır (`deliver: false`, genel şerit: `subagent`)
- Ardından bir duyuru adımı çalıştırır ve duyuru yanıtını istekte bulunan sohbet kanalına gönderir
- Varsayılan model: çağıranı devralır; `agents.defaults.subagents.model` (veya temsilci başına `agents.list[].subagents.model`) ayarlarsanız o kullanılır; açık bir `sessions_spawn.model` yine önceliklidir.
- Varsayılan düşünme: çağıranı devralır; `agents.defaults.subagents.thinking` (veya temsilci başına `agents.list[].subagents.thinking`) ayarlarsanız o kullanılır; açık bir `sessions_spawn.thinking` yine önceliklidir.
- Varsayılan çalıştırma zaman aşımı: `sessions_spawn.runTimeoutSeconds` atlanırsa, ayarlı olduğunda OpenClaw `agents.defaults.subagents.runTimeoutSeconds` kullanır; aksi halde `0`'a (zaman aşımı yok) geri döner.

Araç parametreleri:

- `task` (gerekli)
- `label?` (isteğe bağlı)
- `agentId?` (isteğe bağlı; izin veriliyorsa başka bir temsilci kimliği altında başlatır)
- `model?` (isteğe bağlı; alt temsilci modelini geçersiz kılar; geçersiz değerler atlanır ve alt temsilci varsayılan modelde çalışır; araç sonucunda bir uyarı yer alır)
- `thinking?` (isteğe bağlı; alt temsilci çalıştırması için düşünme düzeyini geçersiz kılar)
- `runTimeoutSeconds?` (ayarlıysa varsayılan olarak `agents.defaults.subagents.runTimeoutSeconds`, aksi halde `0`; ayarlandığında alt temsilci çalıştırması N saniye sonra durdurulur)
- `thread?` (varsayılan `false`; `true` olduğunda bu alt temsilci oturumu için kanal iş parçacığı bağlaması ister)
- `mode?` (`run|session`)
  - varsayılan `run` değeridir
  - `thread: true` ise ve `mode` atlanırsa, varsayılan `session` olur
  - `mode: "session"` için `thread: true` gereklidir
- `cleanup?` (`delete|keep`, varsayılan `keep`)
- `sandbox?` (`inherit|require`, varsayılan `inherit`; `require`, hedef alt çalışma zamanı sandbox içinde değilse başlatmayı reddeder)
- `sessions_spawn`, kanal teslimat parametrelerini kabul etmez (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Teslimat için başlatılmış çalıştırmadan `message`/`sessions_send` kullanın.

## İş parçacığına bağlı oturumlar

Bir kanalda iş parçacığı bağlamaları etkinleştirildiğinde, bir alt temsilci bir iş parçacığına bağlı kalabilir; böylece o iş parçacığındaki devam kullanıcı mesajları aynı alt temsilci oturumuna yönlendirilmeye devam eder.

### İş parçacığını destekleyen kanallar

- Discord (şu anda desteklenen tek kanal): kalıcı iş parçacığına bağlı alt temsilci oturumlarını (`thread: true` ile `sessions_spawn`), manuel iş parçacığı denetimlerini (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) ve `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` ve `channels.discord.threadBindings.spawnSubagentSessions` bağdaştırıcı anahtarlarını destekler.

Hızlı akış:

1. `thread: true` ile (ve isteğe bağlı olarak `mode: "session"` ile) `sessions_spawn` kullanarak başlatın.
2. OpenClaw, etkin kanalda bu oturum hedefine bir iş parçacığı oluşturur veya bağlar.
3. O iş parçacığındaki yanıtlar ve devam mesajları bağlı oturuma yönlendirilir.
4. Etkinsizlik nedeniyle otomatik odağı kaldırmayı incelemek/güncellemek için `/session idle`, kesin üst sınırı denetlemek için `/session max-age` kullanın.
5. Manuel olarak ayırmak için `/unfocus` kullanın.

Manuel denetimler:

- `/focus <target>`, geçerli iş parçacığını (veya yenisini oluşturarak) bir alt temsilci/oturum hedefine bağlar.
- `/unfocus`, geçerli bağlı iş parçacığı için bağlamayı kaldırır.
- `/agents`, etkin çalıştırmaları ve bağlama durumunu listeler (`thread:<id>` veya `unbound`).
- `/session idle` ve `/session max-age` yalnızca odaklanmış bağlı iş parçacıklarında çalışır.

Yapılandırma anahtarları:

- Genel varsayılan: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Kanal geçersiz kılması ve başlatmada otomatik bağlama anahtarları bağdaştırıcıya özeldir. Yukarıdaki **İş parçacığını destekleyen kanallar** bölümüne bakın.

Geçerli bağdaştırıcı ayrıntıları için [Configuration Reference](/tr/gateway/configuration-reference) ve [Slash commands](/tr/tools/slash-commands) bölümlerine bakın.

İzin listesi:

- `agents.list[].subagents.allowAgents`: `agentId` aracılığıyla hedeflenebilecek temsilci kimliklerinin listesi (`["*"]` herhangi birine izin verir). Varsayılan: yalnızca istekte bulunan temsilci.
- `agents.defaults.subagents.allowAgents`: istekte bulunan temsilci kendi `subagents.allowAgents` değerini ayarlamadığında kullanılan varsayılan hedef temsilci izin listesi.
- Sandbox devralma koruması: istekte bulunan oturum sandbox içindeyse, `sessions_spawn` sandbox dışında çalışacak hedefleri reddeder.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: true olduğunda `agentId` atlayan `sessions_spawn` çağrılarını engeller (açık profil seçimini zorlar). Varsayılan: false.

Keşif:

- Şu anda `sessions_spawn` için hangi temsilci kimliklerine izin verildiğini görmek üzere `agents_list` kullanın.

Otomatik arşivleme:

- Alt temsilci oturumları, `agents.defaults.subagents.archiveAfterMinutes` sonrasında otomatik olarak arşivlenir (varsayılan: 60).
- Arşivleme `sessions.delete` kullanır ve transkripti `*.deleted.<timestamp>` olarak yeniden adlandırır (aynı klasörde).
- `cleanup: "delete"`, duyurudan hemen sonra arşivler (yine de yeniden adlandırma yoluyla transkripti korur).
- Otomatik arşivleme en iyi çaba temelindedir; ağ geçidi yeniden başlatılırsa bekleyen zamanlayıcılar kaybolur.
- `runTimeoutSeconds` otomatik arşivleme yapmaz; yalnızca çalıştırmayı durdurur. Oturum, otomatik arşivlemeye kadar kalır.
- Otomatik arşivleme hem derinlik-1 hem de derinlik-2 oturumlarına eşit şekilde uygulanır.
- Tarayıcı temizliği, arşiv temizliğinden ayrıdır: transkript/oturum kaydı tutulsa bile izlenen tarayıcı sekmeleri/süreçleri çalıştırma bittiğinde en iyi çabayla kapatılır.

## İç içe Alt Temsilciler

Varsayılan olarak alt temsilciler kendi alt temsilcilerini başlatamaz (`maxSpawnDepth: 1`). `maxSpawnDepth: 2` ayarlanarak bir iç içe geçme düzeyi etkinleştirilebilir; bu da **orkestratör düzenine** izin verir: ana → orkestratör alt temsilci → çalışan alt-alt temsilciler.

### Nasıl etkinleştirilir

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // alt temsilcilerin alt öğeler başlatmasına izin ver (varsayılan: 1)
        maxChildrenPerAgent: 5, // temsilci oturumu başına en fazla etkin alt öğe (varsayılan: 5)
        maxConcurrent: 8, // genel eşzamanlılık şeridi üst sınırı (varsayılan: 8)
        runTimeoutSeconds: 900, // atlandığında sessions_spawn için varsayılan zaman aşımı (0 = zaman aşımı yok)
      },
    },
  },
}
```

### Derinlik düzeyleri

| Derinlik | Oturum anahtarı biçimi                     | Rol                                            | Başlatabilir mi?              |
| -------- | ------------------------------------------ | ---------------------------------------------- | ----------------------------- |
| 0        | `agent:<id>:main`                          | Ana temsilci                                   | Her zaman                     |
| 1        | `agent:<id>:subagent:<uuid>`               | Alt temsilci (`maxSpawnDepth >= 2` olduğunda orkestratör) | Yalnızca `maxSpawnDepth >= 2` ise |
| 2        | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Alt-alt temsilci (yaprak çalışan)              | Asla                          |

### Duyuru zinciri

Sonuçlar zincir boyunca geri akar:

1. Derinlik-2 çalışanı tamamlanır → üst öğesine (derinlik-1 orkestratör) duyurur
2. Derinlik-1 orkestratör duyuruyu alır, sonuçları sentezler, tamamlanır → ana öğeye duyurur
3. Ana temsilci duyuruyu alır ve kullanıcıya teslim eder

Her düzey yalnızca doğrudan alt öğelerinden gelen duyuruları görür.

Operasyonel rehberlik:

- Alt işi bir kez başlatın ve `sessions_list`, `sessions_history`, `/subagents list` veya `exec` uyku komutları etrafında yoklama döngüleri kurmak yerine tamamlama olaylarını bekleyin.
- Son yanıtı zaten gönderdikten sonra bir alt öğe tamamlama olayı gelirse, doğru devam işlemi tam olarak şu sessiz belirteçtir: `NO_REPLY` / `no_reply`.

### Derinliğe göre araç politikası

- Rol ve denetim kapsamı, başlatma anında oturum meta verilerine yazılır. Bu, düzleştirilmiş veya geri yüklenmiş oturum anahtarlarının yanlışlıkla yeniden orkestratör ayrıcalıkları kazanmasını önler.
- **Derinlik 1 (orkestratör, `maxSpawnDepth >= 2` olduğunda)**: Alt öğelerini yönetebilmesi için `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` alır. Diğer oturum/sistem araçları yine reddedilir.
- **Derinlik 1 (yaprak, `maxSpawnDepth == 1` olduğunda)**: Oturum aracı yoktur (geçerli varsayılan davranış).
- **Derinlik 2 (yaprak çalışan)**: Oturum aracı yoktur — `sessions_spawn`, derinlik 2'de her zaman reddedilir. Daha fazla alt öğe başlatamaz.

### Temsilci başına başlatma sınırı

Her temsilci oturumu (herhangi bir derinlikte), aynı anda en fazla `maxChildrenPerAgent` (varsayılan: 5) etkin alt öğeye sahip olabilir. Bu, tek bir orkestratörden kaynaklanan kontrolsüz yayılmayı önler.

### Zincirleme durdurma

Bir derinlik-1 orkestratörü durdurmak, tüm derinlik-2 alt öğelerini otomatik olarak durdurur:

- Ana sohbette `/stop`, tüm derinlik-1 temsilcileri durdurur ve derinlik-2 alt öğelerine zincirleme uygulanır.
- `/subagents kill <id>`, belirli bir alt temsilciyi durdurur ve alt öğelerine zincirleme uygulanır.
- `/subagents kill all`, istekte bulunan için tüm alt temsilcileri durdurur ve zincirleme uygulanır.

## Kimlik doğrulama

Alt temsilci kimlik doğrulaması, oturum türüne göre değil, **temsilci kimliğine** göre çözümlenir:

- Alt temsilci oturum anahtarı `agent:<agentId>:subagent:<uuid>` biçimindedir.
- Kimlik doğrulama deposu, o temsilcinin `agentDir` dizininden yüklenir.
- Ana temsilcinin kimlik doğrulama profilleri, **yedek** olarak birleştirilir; çakışmalarda temsilci profilleri ana profilleri geçersiz kılar.

Not: birleştirme toplamsaldır, bu nedenle ana profiller her zaman yedek olarak kullanılabilir. Temsilci başına tamamen yalıtılmış kimlik doğrulama henüz desteklenmemektedir.

## Duyuru

Alt temsilciler, bir duyuru adımıyla geri bildirim yapar:

- Duyuru adımı, istekte bulunan oturumda değil, alt temsilci oturumunda çalışır.
- Alt temsilci tam olarak `ANNOUNCE_SKIP` yanıtını verirse hiçbir şey gönderilmez.
- En son yardımcı metni tam olarak sessiz belirteç `NO_REPLY` / `no_reply` ise, daha önce görünür ilerleme olsa bile duyuru çıktısı bastırılır.
- Aksi halde teslimat, istekte bulunanın derinliğine bağlıdır:
  - üst düzey istekte bulunan oturumları, dış teslimatla (`deliver=true`) devam niteliğinde bir `agent` çağrısı kullanır
  - iç içe istekte bulunan alt temsilci oturumları, orkestratörün alt sonuçları oturum içinde sentezleyebilmesi için dahili bir devam eklemesi alır (`deliver=false`)
  - iç içe istekte bulunan bir alt temsilci oturumu artık mevcut değilse, OpenClaw mümkün olduğunda o oturumun istekte bulunanına geri döner
- Üst düzey istekte bulunan oturumları için tamamlama modu doğrudan teslimat, önce bağlı konuşma/iş parçacığı rotasını ve kanca geçersiz kılmasını çözümler, ardından eksik kanal-hedef alanlarını istekte bulunan oturumun saklanan rotasından doldurur. Bu, tamamlama kaynağı yalnızca kanalı tanımladığında bile tamamlamaları doğru sohbet/konuda tutar.
- İç içe tamamlama bulguları oluşturulurken alt öğe tamamlama toplaması geçerli istekte bulunan çalıştırmasıyla sınırlandırılır; böylece önceki çalıştırmalara ait eski alt öğe çıktılarının geçerli duyuruya sızması önlenir.
- Duyuru yanıtları, kanal bağdaştırıcılarında mevcut olduğunda iş parçacığı/konu yönlendirmesini korur.
- Duyuru bağlamı, kararlı bir dahili olay bloğuna normalize edilir:
  - kaynak (`subagent` veya `cron`)
  - alt oturum anahtarı/kimliği
  - duyuru türü + görev etiketi
  - çalışma zamanı sonucundan türetilen durum satırı (`success`, `error`, `timeout` veya `unknown`)
  - en son görünür yardımcı metninden seçilen sonuç içeriği; yoksa temizlenmiş en son tool/toolResult metni; sonlandırılmış başarısız çalıştırmalar, yakalanmış yanıt metnini yeniden oynatmadan başarısızlık durumunu bildirir
  - ne zaman yanıt verileceğini ve ne zaman sessiz kalınacağını açıklayan bir devam talimatı
- `Status`, model çıktısından çıkarılmaz; çalışma zamanı sonuç sinyallerinden gelir.
- Zaman aşımında, alt öğe yalnızca araç çağrılarına kadar ilerlediyse, duyuru ham araç çıktısını yeniden oynatmak yerine bu geçmişi kısa bir kısmi ilerleme özetine indirgemiş olabilir.

Duyuru yükleri, sonunda bir istatistik satırı içerir (sarıldığında bile):

- Çalışma zamanı (ör. `runtime 5m12s`)
- Token kullanımı (girdi/çıktı/toplam)
- Model fiyatlandırması yapılandırıldığında tahmini maliyet (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` ve transkript yolu (böylece ana temsilci `sessions_history` ile geçmişi getirebilir veya dosyayı diskte inceleyebilir)
- Dahili meta veriler yalnızca orkestrasyon içindir; kullanıcıya yönelik yanıtlar normal yardımcı sesiyle yeniden yazılmalıdır.

`sessions_history`, daha güvenli orkestrasyon yoludur:

- önce yardımcı geri çağırması normalize edilir:
  - düşünme etiketleri kaldırılır
  - `<relevant-memories>` / `<relevant_memories>` iskelet blokları kaldırılır
  - `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` ve `<function_calls>...</function_calls>` gibi düz metin araç çağrısı XML yük blokları, düzgün kapanmayan kesik yükler dahil olmak üzere kaldırılır
  - düşürülmüş araç çağrısı/sonuç iskeleti ve geçmiş bağlam işaretçileri kaldırılır
  - `<|assistant|>`, diğer ASCII `<|...|>` belirteçleri ve tam genişlikli `<｜...｜>` varyantları gibi sızmış model denetim belirteçleri kaldırılır
  - hatalı MiniMax araç çağrısı XML'i kaldırılır
- kimlik bilgisi/token benzeri metin sansürlenir
- uzun bloklar kısaltılabilir
- çok büyük geçmişlerde eski satırlar düşürülebilir veya aşırı büyük bir satır şu ifadeyle değiştirilebilir: `[sessions_history omitted: message too large]`
- bayt düzeyinde tam transkripte ihtiyaç duyduğunuzda, yedek seçenek olarak diskteki ham transkript incelemesi kullanılır

## Araç Politikası (alt temsilci araçları)

Varsayılan olarak alt temsilciler, oturum araçları ve sistem araçları hariç **tüm araçları** alır:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

Burada da `sessions_history`, sınırlı ve temizlenmiş bir geri çağırma görünümü olarak kalır; ham transkript dökümü değildir.

`maxSpawnDepth >= 2` olduğunda, derinlik-1 orkestratör alt temsilciler, alt öğelerini yönetebilmeleri için ek olarak `sessions_spawn`, `subagents`, `sessions_list` ve `sessions_history` alır.

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
        // red önceliklidir
        deny: ["gateway", "cron"],
        // allow ayarlanırsa, yalnızca izin ver moduna geçer (deny yine önceliklidir)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Eşzamanlılık

Alt temsilciler, sürece özel ayrılmış bir kuyruk şeridi kullanır:

- Şerit adı: `subagent`
- Eşzamanlılık: `agents.defaults.subagents.maxConcurrent` (varsayılan `8`)

## Durdurma

- İstekte bulunan sohbete `/stop` göndermek, istekte bulunan oturumu iptal eder ve ondan başlatılan tüm etkin alt temsilci çalıştırmalarını durdurur; iç içe alt öğelere zincirleme uygulanır.
- `/subagents kill <id>`, belirli bir alt temsilciyi durdurur ve alt öğelerine zincirleme uygulanır.

## Sınırlamalar

- Alt temsilci duyurusu **en iyi çaba** esasına dayanır. Ağ geçidi yeniden başlatılırsa bekleyen "geri duyur" işleri kaybolur.
- Alt temsilciler yine aynı ağ geçidi süreci kaynaklarını paylaşır; `maxConcurrent` değerini bir güvenlik supabı olarak düşünün.
- `sessions_spawn` her zaman engelleyici değildir: hemen `{ status: "accepted", runId, childSessionKey }` döndürür.
- Alt temsilci bağlamı yalnızca `AGENTS.md` + `TOOLS.md` ekler (`SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` veya `BOOTSTRAP.md` yoktur).
- En yüksek iç içe geçme derinliği 5'tir (`maxSpawnDepth` aralığı: 1–5). Çoğu kullanım durumu için derinlik 2 önerilir.
- `maxChildrenPerAgent`, oturum başına etkin alt öğeleri sınırlar (varsayılan: 5, aralık: 1–20).
