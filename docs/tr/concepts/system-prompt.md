---
read_when:
    - Sistem istemi metnini, araç listesini veya zaman/heartbeat bölümlerini düzenleme
    - Çalışma alanı önyükleme işlemini veya Skills ekleme davranışını değiştirme
summary: OpenClaw sistem isteminin neler içerdiği ve nasıl bir araya getirildiği
title: Sistem İstemi
x-i18n:
    generated_at: "2026-04-12T08:32:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 057f01aac51f7737b5223f61f5d55e552d9011232aebb130426e269d8f6c257f
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Sistem İstemi

OpenClaw, her agent çalıştırması için özel bir sistem istemi oluşturur. Bu istem **OpenClaw tarafından sahiplenilir** ve pi-coding-agent varsayılan istemini kullanmaz.

İstem, OpenClaw tarafından bir araya getirilir ve her agent çalıştırmasına enjekte edilir.

Sağlayıcı eklentileri, OpenClaw’a ait tam istemin yerini almadan önbellek farkındalığına sahip istem yönlendirmeleri ekleyebilir. Sağlayıcı çalışma zamanı şunları yapabilir:

- adlandırılmış az sayıda çekirdek bölümü değiştirebilir (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- istem önbelleği sınırının üstüne **kararlı bir önek** enjekte edebilir
- istem önbelleği sınırının altına **dinamik bir sonek** enjekte edebilir

Model ailesine özgü ayarlar için sağlayıcıya ait katkıları kullanın. Eski
`before_prompt_build` istem mutasyonunu uyumluluk veya gerçekten genel istem
değişiklikleri için saklayın; normal sağlayıcı davranışı için değil.

## Yapı

İstem bilerek kompakt tutulur ve sabit bölümler kullanır:

- **Araçlar**: yapılandırılmış araçlar için doğruluk kaynağı hatırlatması ve çalışma zamanı araç kullanımı yönlendirmesi.
- **Güvenlik**: güç peşinde koşan davranışlardan veya denetimi aşmaktan kaçınmak için kısa koruma hatırlatması.
- **Skills** (varsa): modele gerektiğinde skill yönergelerini nasıl yükleyeceğini söyler.
- **OpenClaw Self-Update**: yapılandırmayı
  `config.schema.lookup` ile güvenli biçimde nasıl inceleyeceği, yapılandırmayı `config.patch` ile nasıl yamalayacağı, tam yapılandırmayı
  `config.apply` ile nasıl değiştireceği ve `update.run` komutunu yalnızca
  açık kullanıcı isteğiyle nasıl çalıştıracağı. Yalnızca sahip için kullanılabilen `gateway` aracı ayrıca
  `tools.exec.ask` / `tools.exec.security` yeniden yazmayı da reddeder; buna bu korumalı exec yollarına normalize edilen eski `tools.bash.*`
  takma adları da dahildir.
- **Çalışma Alanı**: çalışma dizini (`agents.defaults.workspace`).
- **Belgeler**: OpenClaw belgelerine giden yerel yol (repo veya npm paketi) ve bunların ne zaman okunacağı.
- **Çalışma Alanı Dosyaları (enjekte edilir)**: önyükleme dosyalarının aşağıya dahil edildiğini belirtir.
- **Korumalı Alan** (etkin olduğunda): korumalı çalışma zamanını, korumalı alan yollarını ve yükseltilmiş exec kullanılabilirliğini belirtir.
- **Geçerli Tarih ve Saat**: kullanıcı yerel saati, saat dilimi ve saat biçimi.
- **Yanıt Etiketleri**: desteklenen sağlayıcılar için isteğe bağlı yanıt etiketi sözdizimi.
- **Heartbeat’ler**: varsayılan agent için heartbeat’ler etkin olduğunda heartbeat istemi ve onay davranışı.
- **Çalışma Zamanı**: ana makine, işletim sistemi, node, model, repo kökü (algılandığında), düşünme düzeyi (tek satır).
- **Akıl Yürütme**: geçerli görünürlük düzeyi + /reasoning geçiş ipucu.

Araçlar bölümü ayrıca uzun süren işler için çalışma zamanı yönlendirmeleri de içerir:

- gelecekteki takip işlemleri için cron kullanın (`daha sonra tekrar kontrol et`, hatırlatmalar, yinelenen işler);
  `exec` uyku döngüleri, `yieldMs` gecikme hileleri veya yinelenen `process`
  yoklaması yerine
- `exec` / `process` araçlarını yalnızca şimdi başlayan ve arka planda
  çalışmayı sürdüren komutlar için kullanın
- otomatik tamamlanma uyandırması etkin olduğunda, komutu bir kez başlatın ve
  çıktı ürettiğinde veya başarısız olduğunda itme tabanlı uyandırma yoluna güvenin
- çalışan bir komutu incelemeniz gerektiğinde günlükler, durum, girdi veya müdahale için `process` kullanın
- görev daha büyükse `sessions_spawn` tercih edin; alt agent tamamlanması
  itme tabanlıdır ve istekte bulunana otomatik olarak duyurulur
- yalnızca tamamlanmayı beklemek için `subagents list` / `sessions_list` araçlarını döngü içinde yoklamayın

Deneysel `update_plan` aracı etkin olduğunda, Araçlar bölümü modele ayrıca
bunu yalnızca önemsiz olmayan çok adımlı işler için kullanmasını, tam olarak bir
`in_progress` adımı tutmasını ve her güncellemeden sonra tüm planı
tekrarlamaktan kaçınmasını söyler.

Sistem istemindeki güvenlik korumaları tavsiye niteliğindedir. Model davranışını yönlendirirler ancak politikayı zorla uygulatmazlar. Kesin uygulama için araç politikası, exec onayları, korumalı alan ve kanal izin listelerini kullanın; operatörler tasarım gereği bunları devre dışı bırakabilir.

Yerel onay kartları/düğmeleri bulunan kanallarda, çalışma zamanı istemi artık
agent’e önce bu yerel onay arayüzüne güvenmesini söyler. Yalnızca araç sonucu sohbet içi onayların kullanılamadığını veya
tek yolun manuel onay olduğunu belirtiyorsa elle yazılan bir
`/approve` komutu eklemelidir.

## İstem modları

OpenClaw, alt agent’ler için daha küçük sistem istemleri oluşturabilir. Çalışma zamanı her çalıştırma için bir
`promptMode` ayarlar (kullanıcıya dönük bir yapılandırma değildir):

- `full` (varsayılan): yukarıdaki tüm bölümleri içerir.
- `minimal`: alt agent’ler için kullanılır; **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** ve **Heartbeats** bölümlerini çıkarır. Araçlar, **Güvenlik**,
  Çalışma Alanı, Korumalı Alan, Geçerli Tarih ve Saat (biliniyorsa), Çalışma Zamanı ve enjekte edilen
  bağlam kullanılabilir olmaya devam eder.
- `none`: yalnızca temel kimlik satırını döndürür.

`promptMode=minimal` olduğunda, ek enjekte edilen istemler **Group Chat Context** yerine **Subagent
Context** olarak etiketlenir.

## Çalışma alanı önyükleme enjeksiyonu

Önyükleme dosyaları kırpılır ve **Project Context** altında eklenir; böylece model, açık okuma gerektirmeden kimlik ve profil bağlamını görür:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca yepyeni çalışma alanlarında)
- varsa `MEMORY.md`, yoksa küçük harfli geri dönüş olarak `memory.md`

Bu dosyaların tümü, dosyaya özgü bir geçit uygulanmadığı sürece, her turda **bağlam penceresine enjekte edilir**.
`HEARTBEAT.md`, normal çalıştırmalarda heartbeat’ler varsayılan agent için devre dışıysa veya
`agents.defaults.heartbeat.includeSystemPromptSection` false ise
çıkarılır. Enjekte edilen dosyaları kısa tutun — özellikle zamanla büyüyebilen ve
beklenmedik ölçüde yüksek bağlam kullanımına ve daha sık sıkıştırmaya yol açabilen `MEMORY.md` dosyasını.

> **Not:** `memory/*.md` günlük dosyaları, normal önyükleme
> Project Context’in parçası **değildir**. Normal turlarda bunlara
> `memory_search` ve `memory_get` araçları aracılığıyla ihtiyaç halinde erişilir; bu nedenle model bunları açıkça okumadıkça
> bağlam penceresine dahil olmazlar. Salt `/new` ve
> `/reset` turları istisnadır: çalışma zamanı, bu ilk tur için
> son günlük belleği tek seferlik bir başlangıç bağlamı bloğu olarak öne ekleyebilir.

Büyük dosyalar bir işaretleyiciyle kırpılır. Dosya başına azami boyut
`agents.defaults.bootstrapMaxChars` tarafından kontrol edilir (varsayılan: 20000). Dosyalar arasında enjekte edilen toplam önyükleme
içeriği `agents.defaults.bootstrapTotalMaxChars`
tarafından sınırlandırılır (varsayılan: 150000). Eksik dosyalar kısa bir eksik-dosya işaretleyicisi enjekte eder. Kırpma
olduğunda OpenClaw, Project Context içine bir uyarı bloğu enjekte edebilir; bunu
`agents.defaults.bootstrapPromptTruncationWarning` ile kontrol edin (`off`, `once`, `always`;
varsayılan: `once`).

Alt agent oturumları yalnızca `AGENTS.md` ve `TOOLS.md` enjekte eder (diğer önyükleme dosyaları
alt agent bağlamını küçük tutmak için filtrelenir).

İç hook’lar bu adımı `agent:bootstrap` aracılığıyla durdurup enjekte edilen önyükleme dosyalarını değiştirebilir veya
yerine koyabilir (örneğin `SOUL.md` yerine alternatif bir persona kullanmak gibi).

Agent’in daha az genel duyulmasını istiyorsanız, başlangıç noktası olarak
[SOUL.md Personality Guide](/tr/concepts/soul) belgesini kullanın.

Her enjekte edilen dosyanın ne kadar katkı yaptığını incelemek için (ham ve enjekte edilen boyut, kırpma ve araç şeması ek yükü dahil), `/context list` veya `/context detail` kullanın. Bkz. [Context](/tr/concepts/context).

## Zaman işleme

Kullanıcı saat dilimi biliniyorsa sistem istemi özel bir **Geçerli Tarih ve Saat** bölümü içerir.
İstem önbelleğini kararlı tutmak için artık yalnızca **saat dilimini** içerir (dinamik saat veya saat biçimi yoktur).

Agent’in geçerli saati bilmesi gerektiğinde `session_status` kullanın; durum kartı
bir zaman damgası satırı içerir. Aynı araç isteğe bağlı olarak oturum başına bir model
geçersiz kılma da ayarlayabilir (`model=default` bunu temizler).

Şunlarla yapılandırın:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Davranışın tüm ayrıntıları için bkz. [Date & Time](/tr/date-time).

## Skills

Uygun skill’ler mevcut olduğunda OpenClaw, her skill için **dosya yolunu** içeren kompakt bir **kullanılabilir skill listesi**
(`formatSkillsForPrompt`) enjekte eder. İstem, modele listelenen
konumdaki SKILL.md dosyasını yüklemek için `read` kullanmasını söyler (çalışma alanı, yönetilen veya paketlenmiş). Uygun skill yoksa
Skills bölümü çıkarılır.

Uygunluk; skill meta veri geçitlerini, çalışma zamanı ortamı/yapılandırma kontrollerini
ve `agents.defaults.skills` veya
`agents.list[].skills` yapılandırıldığında etkin agent skill izin listesini içerir.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Bu, hedefe yönelik skill kullanımını yine de mümkün kılarken temel istemi küçük tutar.

## Belgeler

Mevcut olduğunda sistem istemi, yerel OpenClaw belgeleri dizinine işaret eden bir **Belgeler** bölümü içerir
(repo çalışma alanındaki `docs/` veya paketlenmiş npm
paketi belgeleri) ve ayrıca herkese açık yansıyı, kaynak repo’yu, topluluk Discord’unu ve
skill keşfi için ClawHub’ı ([https://clawhub.ai](https://clawhub.ai)) belirtir. İstem, modelin OpenClaw davranışı, komutlar, yapılandırma veya mimari için
önce yerel belgelere başvurmasını ve mümkün olduğunda
`openclaw status` komutunu kendisinin çalıştırmasını söyler (erişimi olmadığında yalnızca kullanıcıya sorar).
