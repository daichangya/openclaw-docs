---
read_when:
    - Sistem istemi metnini, araç listesini veya zaman/Heartbeat bölümlerini düzenleme
    - Çalışma alanı bootstrap veya Skills ekleme davranışını değiştirme
summary: OpenClaw sistem isteminin neler içerdiği ve nasıl derlendiği
title: Sistem istemi
x-i18n:
    generated_at: "2026-04-25T13:45:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a0717788885521848e3ef9508e3eb5bc5a8ad39f183f0ab2ce0d4cb971cb2df
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw, her ajan çalıştırması için özel bir sistem istemi oluşturur. İstem **OpenClaw tarafından sahiplenilir** ve pi-coding-agent varsayılan istemini kullanmaz.

İstem OpenClaw tarafından derlenir ve her ajan çalıştırmasına eklenir.

Sağlayıcı Plugin'leri, tam OpenClaw sahipli istemi değiştirmeden
önbellek farkındalığı olan istem yönlendirmesi ekleyebilir. Sağlayıcı çalışma zamanı şunları yapabilir:

- adlandırılmış küçük bir çekirdek bölüm kümesini değiştirebilir (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- istem önbelleği sınırının üstüne **kararlı bir önek** ekleyebilir
- istem önbelleği sınırının altına **dinamik bir son ek** ekleyebilir

Sağlayıcıya ait katkıları model ailesine özgü ayarlamalar için kullanın. Eski
`before_prompt_build` istem değişimini uyumluluk veya gerçekten genel istem
değişiklikleri için tutun; normal sağlayıcı davranışı için değil.

OpenAI GPT-5 ailesi katmanı, çekirdek yürütme kuralını küçük tutar ve
persona sabitleme, kısa çıktı, araç disiplini, paralel arama, teslimat kapsamı, doğrulama, eksik bağlam ve terminal-araç hijyeni için modele özgü yönlendirme ekler.

## Yapı

İstem kasıtlı olarak kompakt tutulur ve sabit bölümler kullanır:

- **Tooling**: yapılandırılmış araç için doğruluk kaynağı hatırlatması ve çalışma zamanı araç kullanım yönlendirmesi.
- **Execution Bias**: kompakt takip yönlendirmesi: işlem yapılabilir
  isteklerde aynı dönüşte harekete geç, bitene veya engellenene kadar sürdür, zayıf araç
  sonuçlarından toparlan, değişebilir durumu canlı kontrol et ve tamamlamadan önce doğrula.
- **Safety**: güç arayışındaki davranıştan veya gözetimi atlatmaktan kaçınmak için kısa bir güvenlik korkuluğu hatırlatması.
- **Skills** (mevcut olduğunda): modele Skills talimatlarını gerektiğinde nasıl yükleyeceğini söyler.
- **OpenClaw Self-Update**: config'i güvenli biçimde
  `config.schema.lookup` ile inceleme, config'i `config.patch` ile yama,
  tam config'i `config.apply` ile değiştirme ve `update.run` komutunu yalnızca açık kullanıcı
  isteği üzerine çalıştırma. Yalnızca sahip için olan `gateway` aracı da
  eski `tools.bash.*`
  takma adları dahil olmak üzere `tools.exec.ask` / `tools.exec.security` yeniden yazımlarını reddeder; bunlar korunan exec yollarına normalize edilir.
- **Workspace**: çalışma dizini (`agents.defaults.workspace`).
- **Documentation**: OpenClaw belgelerinin yerel yolu (repo veya npm paketi) ve bunların ne zaman okunacağı.
- **Workspace Files (injected)**: bootstrap dosyalarının aşağıya eklendiğini belirtir.
- **Sandbox** (etkin olduğunda): sandbox'lı çalışma zamanını, sandbox yollarını ve yükseltilmiş exec'in kullanılabilir olup olmadığını belirtir.
- **Current Date & Time**: kullanıcı yerel saati, saat dilimi ve saat biçimi.
- **Reply Tags**: desteklenen sağlayıcılar için isteğe bağlı yanıt etiketi sözdizimi.
- **Heartbeats**: varsayılan ajan için Heartbeat etkin olduğunda Heartbeat istemi ve ack davranışı.
- **Runtime**: ana makine, OS, node, model, repo kökü (algılandığında), düşünme düzeyi (tek satır).
- **Reasoning**: mevcut görünürlük düzeyi + /reasoning geçiş ipucu.

Tooling bölümü ayrıca uzun süreli işler için çalışma zamanı yönlendirmesi de içerir:

- gelecekteki takip işleri için Cron kullanın (`daha sonra yeniden kontrol et`, hatırlatmalar, tekrar eden işler);
  `exec` uyku döngüleri, `yieldMs` gecikme hileleri veya tekrar eden `process`
  yoklaması kullanmayın
- `exec` / `process` araçlarını yalnızca şimdi başlayan ve arka planda
  çalışmaya devam eden komutlar için kullanın
- otomatik tamamlanma uyandırması etkinse, komutu bir kez başlatın ve çıktı ürettiğinde veya başarısız olduğunda
  push tabanlı uyandırma yoluna güvenin
- çalışan bir komutu incelemeniz gerektiğinde günlükler, durum, girdi veya müdahale için `process` kullanın
- görev daha büyükse `sessions_spawn` tercih edin; alt ajan tamamlanması push tabanlıdır ve
  istekte bulunana otomatik olarak duyurulur
- yalnızca tamamlanmayı beklemek için döngü içinde `subagents list` / `sessions_list`
  yoklaması yapmayın

Deneysel `update_plan` aracı etkin olduğunda Tooling ayrıca
modele bunu yalnızca önemsiz olmayan çok adımlı işler için kullanmasını, tam olarak bir
`in_progress` adımı tutmasını ve her güncellemeden sonra tüm planı tekrarlamaktan kaçınmasını söyler.

Sistem istemindeki Safety korkulukları yönlendiricidir. Model davranışına rehberlik ederler ancak politikayı uygulamazlar. Zorlayıcı uygulama için araç politikası, exec onayları, sandboxing ve kanal izin listeleri kullanın; operatörler bunları tasarım gereği devre dışı bırakabilir.

Yerel onay kartları/düğmeleri olan kanallarda, çalışma zamanı istemi artık
ajandan önce bu yerel onay UI'sine güvenmesini ister. Yalnızca araç sonucu sohbet onaylarının kullanılamadığını söylediğinde veya
manuel onayın tek yol olduğunu belirttiğinde manuel bir `/approve`
komutu eklemelidir.

## İstem kipleri

OpenClaw, alt ajanlar için daha küçük sistem istemleri oluşturabilir. Çalışma zamanı her çalıştırma için bir
`promptMode` ayarlar (kullanıcıya dönük bir config değildir):

- `full` (varsayılan): yukarıdaki tüm bölümleri içerir.
- `minimal`: alt ajanlar için kullanılır; **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** ve **Heartbeats** bölümlerini çıkarır. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (biliniyorsa), Runtime ve eklenmiş
  bağlam kullanılabilir olmaya devam eder.
- `none`: yalnızca temel kimlik satırını döndürür.

`promptMode=minimal` olduğunda, ek enjekte edilmiş istemler **Group Chat Context**
yerine **Subagent Context** olarak etiketlenir.

## Çalışma alanı bootstrap ekleme

Bootstrap dosyaları kırpılır ve modelin kimlik ve profil bağlamını açıkça okuma gerektirmeden görebilmesi için **Project Context** altında eklenir:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca yepyeni çalışma alanlarında)
- mevcutsa `MEMORY.md`

Dosyaya özgü bir kapı uygulanmadıkça, bu dosyaların tümü her dönüşte **bağlam penceresine eklenir**.
Varsayılan ajan için Heartbeat devre dışıysa veya
`agents.defaults.heartbeat.includeSystemPromptSection` false ise `HEARTBEAT.md`
normal çalıştırmalarda çıkarılır. Eklenen dosyaları kısa tutun — özellikle zamanla büyüyebilen ve
beklenmedik derecede yüksek bağlam kullanımı ile daha sık Compaction'a yol açabilen `MEMORY.md` dosyasını.

> **Not:** `memory/*.md` günlük dosyaları normal bootstrap
> Project Context'in bir parçası **değildir**. Sıradan dönüşlerde bunlara
> `memory_search` ve `memory_get` araçları üzerinden gerektiğinde erişilir,
> bu nedenle model bunları açıkça okumadıkça bağlam penceresinden pay almazlar. Basit `/new` ve
> `/reset` dönüşleri istisnadır: çalışma zamanı bu ilk dönüş için
> son günlük belleği tek seferlik başlangıç bağlam bloğu olarak başa ekleyebilir.

Büyük dosyalar bir işaretçiyle kırpılır. Dosya başına azami boyut
`agents.defaults.bootstrapMaxChars` tarafından kontrol edilir (varsayılan: 12000). Dosyalar genelinde enjekte edilen toplam bootstrap
içeriği `agents.defaults.bootstrapTotalMaxChars`
tarafından sınırlandırılır (varsayılan: 60000). Eksik dosyalar kısa bir eksik-dosya işaretçisi ekler. Kırpma
olduğunda OpenClaw, Project Context içine bir uyarı bloğu ekleyebilir; bunu
`agents.defaults.bootstrapPromptTruncationWarning` ile kontrol edin (`off`, `once`, `always`;
varsayılan: `once`).

Alt ajan oturumları yalnızca `AGENTS.md` ve `TOOLS.md` dosyalarını ekler (diğer bootstrap dosyaları
alt ajan bağlamını küçük tutmak için filtrelenir).

Dahili hook'lar, eklenen bootstrap dosyalarını değiştirmek veya tamamen değiştirmek için `agent:bootstrap` üzerinden bu adımı kesebilir
(örneğin `SOUL.md` dosyasını alternatif bir persona ile değiştirmek gibi).

Ajanın daha az genel konuşmasını istiyorsanız,
[SOUL.md Kişilik Kılavuzu](/tr/concepts/soul) ile başlayın.

Eklenen her dosyanın ne kadar katkı yaptığını (ham ve enjekte edilmiş, kırpma, ayrıca araç şeması ek yükü) incelemek için `/context list` veya `/context detail` kullanın. Bkz. [Bağlam](/tr/concepts/context).

## Zaman işleme

Kullanıcı saat dilimi biliniyorsa sistem istemi ayrılmış bir **Current Date & Time** bölümü içerir. İstem önbelleğini kararlı tutmak için artık yalnızca
**saat dilimini** içerir (dinamik saat veya saat biçimi içermez).

Ajanın geçerli saati bilmesi gerektiğinde `session_status` kullanın; durum kartı
bir zaman damgası satırı içerir. Aynı araç isteğe bağlı olarak oturum başına model
geçersiz kılmasını da ayarlayabilir (`model=default` bunu temizler).

Şunlarla yapılandırın:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Davranışın tüm ayrıntıları için bkz. [Date & Time](/tr/date-time).

## Skills

Uygun Skills mevcut olduğunda OpenClaw, her Skill için **dosya yolunu** içeren kompakt bir **kullanılabilir Skills listesi**
(`formatSkillsForPrompt`) enjekte eder. İstem, modele listelenen
konumda (çalışma alanı, yönetilen veya paketle gelen) bulunan SKILL.md dosyasını yüklemek için `read` kullanmasını söyler.
Uygun Skill yoksa Skills bölümü çıkarılır.

Uygunluk; Skill meta veri kapılarını, çalışma zamanı ortamı/config denetimlerini
ve `agents.defaults.skills` veya
`agents.list[].skills` yapılandırıldığında etkin ajan Skill izin listesini içerir.

Plugin ile paketlenen Skills yalnızca sahibi olan Plugin etkin olduğunda uygun olur.
Bu, araç Plugin'lerinin her araç açıklamasına doğrudan tüm bu
yönlendirmeyi gömmeden daha derin işletim kılavuzları sunmasına olanak tanır.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Bu, temel istemi küçük tutarken hedefli Skill kullanımını yine de mümkün kılar.

Skills listesi bütçesi, Skills alt sistemi tarafından sahiplenilir:

- Genel varsayılan: `skills.limits.maxSkillsPromptChars`
- Ajan başına geçersiz kılma: `agents.list[].skillsLimits.maxSkillsPromptChars`

Genel sınırlı çalışma zamanı alıntıları farklı bir yüzey kullanır:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Bu ayrım, Skills boyutlandırmasını `memory_get`, canlı araç sonuçları ve Compaction sonrası AGENTS.md yenilemeleri gibi
çalışma zamanı okuma/ekleme boyutlandırmalarından ayrı tutar.

## Documentation

Sistem istemi bir **Documentation** bölümü içerir. Yerel belgeler mevcut olduğunda
yerel OpenClaw belgeleri dizinini gösterir (`docs/` bir Git checkout içinde veya paketle gelen npm
paketi belgeleri). Yerel belgeler mevcut değilse
[https://docs.openclaw.ai](https://docs.openclaw.ai) adresine geri döner.

Aynı bölüm OpenClaw kaynak konumunu da içerir. Git checkout'ları, ajanın kodu doğrudan inceleyebilmesi için yerel
kaynak kökünü açığa çıkarır. Paket kurulumları GitHub
kaynak URL'sini içerir ve belgeler eksik veya bayatsa ajana kaynağı orada incelemesini söyler. İstem ayrıca halka açık belge aynasını, topluluk Discord'unu ve Skills keşfi için ClawHub'ı
([https://clawhub.ai](https://clawhub.ai)) not eder. Modelden
OpenClaw davranışı, komutları, yapılandırması veya mimarisi için önce belgelere başvurmasını ve mümkün olduğunda
`openclaw status` komutunu kendisinin çalıştırmasını ister (yalnızca erişimi yoksa kullanıcıya sormasını söyler).

## İlgili

- [Ajan çalışma zamanı](/tr/concepts/agent)
- [Ajan çalışma alanı](/tr/concepts/agent-workspace)
- [Bağlam motoru](/tr/concepts/context-engine)
