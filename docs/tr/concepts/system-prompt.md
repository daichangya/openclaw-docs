---
read_when:
    - Sistem istemi metnini, araç listesini veya zaman/Heartbeat bölümlerini düzenleme
    - Çalışma alanı önyüklemesini veya Skills ekleme davranışını değiştirme
summary: OpenClaw sistem isteminin neleri içerdiği ve nasıl bir araya getirildiği
title: Sistem İstemi
x-i18n:
    generated_at: "2026-04-21T08:58:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc7b887865830e29bcbfb7f88a12fe04f490eec64cb745fc4534051b63a862dc
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Sistem İstemi

OpenClaw, her aracı çalıştırması için özel bir sistem istemi oluşturur. İstem **OpenClaw'a aittir** ve pi-coding-agent varsayılan istemini kullanmaz.

İstem OpenClaw tarafından bir araya getirilir ve her aracı çalıştırmasına eklenir.

Sağlayıcı Plugin'leri, OpenClaw'a ait tam istemi değiştirmeden önbellek farkındalıklı istem yönlendirmesi ekleyebilir. Sağlayıcı çalışma zamanı şunları yapabilir:

- adlandırılmış küçük bir çekirdek bölüm kümesini değiştirebilir (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- istem önbelleği sınırının üstüne **kararlı bir önek** ekleyebilir
- istem önbelleği sınırının altına **dinamik bir sonek** ekleyebilir

Model ailesine özgü ayarlamalar için sağlayıcıya ait katkıları kullanın. Eski
`before_prompt_build` istem değişimini uyumluluk veya gerçekten genel istem
değişiklikleri için saklayın; normal sağlayıcı davranışı için değil.

OpenAI GPT-5 ailesi katmanı, çekirdek yürütme kuralını küçük tutar ve persona
kilitlenmesi, kısa çıktı, araç disiplini, paralel arama, teslim edilebilir
öğe kapsamı, doğrulama, eksik bağlam ve terminal aracı hijyeni için
modele özgü yönlendirme ekler.

## Yapı

İstem kasıtlı olarak kompaktır ve sabit bölümler kullanır:

- **Araçlar**: yapılandırılmış araçlar için doğruluk kaynağı hatırlatıcısı ve çalışma zamanı araç kullanımı yönlendirmesi.
- **Yürütme Eğilimi**: kompakt takip yönlendirmesi: uygulanabilir isteklerde aynı dönüşte harekete geçme, tamamlanana veya engellenene kadar sürdürme, zayıf araç sonuçlarından toparlanma, değişken durumu canlı olarak kontrol etme ve sonlandırmadan önce doğrulama.
- **Güvenlik**: güç peşinde koşan davranışlardan veya gözetimi aşmaktan kaçınmak için kısa koruma rayı hatırlatıcısı.
- **Skills** (mevcut olduğunda): modele ihtiyaç halinde skill yönergelerini nasıl yükleyeceğini söyler.
- **OpenClaw Kendini Güncelleme**: yapılandırmayı `config.schema.lookup` ile güvenle nasıl inceleyeceği, yapılandırmayı `config.patch` ile nasıl yamalayacağı, tam yapılandırmayı `config.apply` ile nasıl değiştireceği ve `update.run` aracını yalnızca açık kullanıcı isteği üzerine nasıl çalıştıracağı. Yalnızca sahip kullanımı için olan `gateway` aracı ayrıca `tools.exec.ask` / `tools.exec.security` yollarını, bunlara normalize olan eski `tools.bash.*` takma adları dahil, yeniden yazmayı reddeder.
- **Çalışma Alanı**: çalışma dizini (`agents.defaults.workspace`).
- **Belgeler**: yerel OpenClaw belgeleri yolu (repo veya npm paketi) ve bunların ne zaman okunacağı.
- **Çalışma Alanı Dosyaları (eklenmiş)**: önyükleme dosyalarının aşağıda yer aldığını belirtir.
- **Sandbox** (etkin olduğunda): sandbox'lı çalışma zamanını, sandbox yollarını ve yükseltilmiş exec kullanımının mümkün olup olmadığını belirtir.
- **Geçerli Tarih ve Saat**: kullanıcı yerel saati, saat dilimi ve saat biçimi.
- **Yanıt Etiketleri**: desteklenen sağlayıcılar için isteğe bağlı yanıt etiketi sözdizimi.
- **Heartbeat'ler**: varsayılan aracı için Heartbeat etkin olduğunda Heartbeat istemi ve ack davranışı.
- **Çalışma Zamanı**: ana makine, işletim sistemi, node, model, repo kökü (algılandığında), düşünme seviyesi (tek satır).
- **Muhakeme**: geçerli görünürlük seviyesi + `/reasoning` geçiş ipucu.

Araçlar bölümü ayrıca uzun süren işler için çalışma zamanı yönlendirmesi de içerir:

- gelecekteki takip işleri için (`daha sonra tekrar kontrol et`, hatırlatıcılar, yinelenen işler) `exec` uyku döngüleri, `yieldMs` gecikme hileleri veya tekrarlanan `process` yoklaması yerine cron kullanın
- `exec` / `process` araçlarını yalnızca şimdi başlayan ve arka planda çalışmayı sürdüren komutlar için kullanın
- otomatik tamamlanma uyandırması etkinse, komutu bir kez başlatın ve çıktı ürettiğinde veya başarısız olduğunda push tabanlı uyandırma yoluna güvenin
- çalışan bir komutu incelemeniz gerektiğinde günlükler, durum, girdi veya müdahale için `process` kullanın
- görev daha büyükse, `sessions_spawn` tercih edin; alt aracı tamamlanması push tabanlıdır ve istekte bulunana otomatik olarak geri duyurulur
- yalnızca tamamlanmayı beklemek için döngü içinde `subagents list` / `sessions_list` yoklaması yapmayın

Deneysel `update_plan` aracı etkin olduğunda, Araçlar bölümü ayrıca modele onu yalnızca önemsiz olmayan çok adımlı işler için kullanmasını, tam olarak bir `in_progress` adım tutmasını ve her güncellemeden sonra tüm planı tekrar etmemesini söyler.

Sistem istemindeki güvenlik koruma rayları tavsiye niteliğindedir. Model davranışını yönlendirirler ancak politika uygulamazlar. Kesin yaptırım için araç politikası, exec onayları, sandbox kullanımı ve kanal izin listelerini kullanın; operatörler bunları tasarım gereği devre dışı bırakabilir.

Yerel onay kartları/düğmeleri olan kanallarda, çalışma zamanı istemi artık aracıya önce bu yerel onay arayüzüne güvenmesini söyler. Yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya tek yolun el ile onay olduğunu söylüyorsa el ile `/approve` komutu eklemelidir.

## İstem modları

OpenClaw, alt aracılar için daha küçük sistem istemleri oluşturabilir. Çalışma zamanı her çalıştırma için bir `promptMode` ayarlar (kullanıcıya dönük bir yapılandırma değildir):

- `full` (varsayılan): yukarıdaki tüm bölümleri içerir.
- `minimal`: alt aracılar için kullanılır; **Skills**, **Memory Recall**, **OpenClaw Kendini Güncelleme**, **Model Takma Adları**, **Kullanıcı Kimliği**, **Yanıt Etiketleri**, **Mesajlaşma**, **Sessiz Yanıtlar** ve **Heartbeat'ler** bölümlerini atlar. Araçlar, **Güvenlik**, Çalışma Alanı, Sandbox, Geçerli Tarih ve Saat (biliniyorsa), Çalışma Zamanı ve eklenmiş bağlam kullanılabilir kalır.
- `none`: yalnızca temel kimlik satırını döndürür.

`promptMode=minimal` olduğunda, ek eklenmiş istemler **Grup Sohbeti Bağlamı** yerine **Alt Aracı Bağlamı** olarak etiketlenir.

## Çalışma alanı önyükleme ekleme

Önyükleme dosyaları kırpılır ve **Proje Bağlamı** altında eklenir; böylece model kimlik ve profil bağlamını açık okumalara gerek kalmadan görür:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca yepyeni çalışma alanlarında)
- varsa `MEMORY.md`, yoksa küçük harfli geri dönüş olarak `memory.md`

Bu dosyaların tümü, dosyaya özgü bir geçit uygulanmadığı sürece her dönüşte **bağlam penceresine eklenir**. Varsayılan aracı için Heartbeat devre dışıysa veya `agents.defaults.heartbeat.includeSystemPromptSection` false ise, normal çalıştırmalarda `HEARTBEAT.md` atlanır. Eklenen dosyaları kısa tutun — özellikle zamanla büyüyebilen ve beklenmedik derecede yüksek bağlam kullanımına ve daha sık Compaction'a yol açabilen `MEMORY.md` dosyasını.

> **Not:** `memory/*.md` günlük dosyaları normal önyükleme
> Proje Bağlamı'nın parçası **değildir**. Normal dönüşlerde
> `memory_search` ve `memory_get` araçları üzerinden istek üzerine erişilirler,
> bu nedenle model onları açıkça okumadıkça bağlam penceresinden pay almazlar.
> Yalın `/new` ve `/reset` dönüşleri istisnadır: çalışma zamanı, bu ilk dönüş için
> tek seferlik başlangıç bağlamı bloğu olarak son günlük memory içeriğini başa ekleyebilir.

Büyük dosyalar bir işaretleyiciyle kırpılır. Dosya başına azami boyut `agents.defaults.bootstrapMaxChars` ile denetlenir (varsayılan: 12000). Dosyalar arasında eklenen toplam önyükleme içeriği `agents.defaults.bootstrapTotalMaxChars` ile sınırlandırılır (varsayılan: 60000). Eksik dosyalar kısa bir eksik dosya işaretleyicisi ekler. Kırpma olduğunda OpenClaw, Proje Bağlamı içine bir uyarı bloğu ekleyebilir; bunu `agents.defaults.bootstrapPromptTruncationWarning` ile denetleyin (`off`, `once`, `always`; varsayılan: `once`).

Alt aracı oturumları yalnızca `AGENTS.md` ve `TOOLS.md` ekler (diğer önyükleme dosyaları alt aracı bağlamını küçük tutmak için süzülür).

Dahili kancalar bu adımı `agent:bootstrap` aracılığıyla yakalayarak eklenen önyükleme dosyalarını değiştirebilir veya değiştirilmiş sürümlerle tamamen değiştirebilir (örneğin `SOUL.md` yerine alternatif bir persona kullanmak gibi).

Aracının daha az genel duyulmasını istiyorsanız, başlangıç noktası olarak
[SOUL.md Kişilik Rehberi](/tr/concepts/soul) ile başlayın.

Eklenen her dosyanın ne kadar katkıda bulunduğunu incelemek için (ham ve eklenmiş, kırpma ve araç şeması ek yükü dahil), `/context list` veya `/context detail` kullanın. Bkz. [Bağlam](/tr/concepts/context).

## Zaman işleme

Kullanıcı saat dilimi biliniyorsa sistem istemi özel bir **Geçerli Tarih ve Saat** bölümü içerir. İstem önbelleğini kararlı tutmak için artık yalnızca **saat dilimini** içerir (dinamik saat veya saat biçimi içermez).

Aracı geçerli saati gerektiğinde `session_status` kullanın; durum kartı bir zaman damgası satırı içerir. Aynı araç isteğe bağlı olarak oturum başına model geçersiz kılması da ayarlayabilir (`model=default` bunu temizler).

Şunlarla yapılandırın:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Davranışın tüm ayrıntıları için bkz. [Tarih ve Saat](/tr/date-time).

## Skills

Uygun Skills mevcut olduğunda OpenClaw, her skill için **dosya yolunu** içeren kompakt bir **mevcut skills listesi** (`formatSkillsForPrompt`) ekler. İstem, modele listelenen konumdaki (çalışma alanı, yönetilen veya paketlenmiş) SKILL.md dosyasını yüklemek için `read` kullanmasını söyler. Uygun skill yoksa Skills bölümü atlanır.

Uygunluk; skill meta veri geçitlerini, çalışma zamanı ortamı/yapılandırma denetimlerini ve `agents.defaults.skills` veya `agents.list[].skills` yapılandırıldığında etkin aracı skill izin listesini içerir.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Bu, temel istemi küçük tutarken hedefli skill kullanımını yine de mümkün kılar.

Skills listesi bütçesi skills alt sistemi tarafından yönetilir:

- Genel varsayılan: `skills.limits.maxSkillsPromptChars`
- Aracı başına geçersiz kılma: `agents.list[].skillsLimits.maxSkillsPromptChars`

Genel sınırlı çalışma zamanı alıntıları farklı bir yüzey kullanır:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Bu ayrım, skills boyutlandırmasını `memory_get`, canlı araç sonuçları ve Compaction sonrası AGENTS.md yenilemeleri gibi çalışma zamanı okuma/ekleme boyutlandırmalarından ayrı tutar.

## Belgeler

Mevcut olduğunda sistem istemi, yerel OpenClaw belgeler dizinine (repo çalışma alanındaki `docs/` veya paketlenmiş npm paketi belgeleri) işaret eden bir **Belgeler** bölümü içerir ve ayrıca genel aynayı, kaynak repoyu, topluluk Discord'unu ve skill keşfi için ClawHub'ı ([https://clawhub.ai](https://clawhub.ai)) not eder. İstem, modele OpenClaw davranışı, komutlar, yapılandırma veya mimari için önce yerel belgeleri incelemesini ve mümkün olduğunda `openclaw status` komutunu kendisinin çalıştırmasını söyler (yalnızca erişimi yoksa kullanıcıya sormasını belirtir).
