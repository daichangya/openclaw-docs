---
read_when:
    - Token kullanımını, maliyetleri veya bağlam pencerelerini açıklama
    - Bağlam büyümesini veya Compaction davranışını hata ayıklama
summary: OpenClaw'ın prompt bağlamını nasıl oluşturduğu ve token kullanımı ile maliyetleri nasıl raporladığı
title: Token Kullanımı ve Maliyetler
x-i18n:
    generated_at: "2026-04-21T09:05:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: d26db37353941e247eb26f84bfa105896318b3239b2975d6e033c6e9ceda6b0d
    source_path: reference/token-use.md
    workflow: 15
---

# Token kullanımı ve maliyetler

OpenClaw karakterleri değil, **token**'ları izler. Token'lar modele özgüdür, ancak çoğu
OpenAI tarzı model İngilizce metinde token başına ortalama ~4 karaktere denk gelir.

## Sistem prompt'u nasıl oluşturulur

OpenClaw her çalıştırmada kendi sistem prompt'unu oluşturur. Şunları içerir:

- Araç listesi + kısa açıklamalar
- Skills listesi (yalnızca meta veriler; yönergeler gerektiğinde `read` ile yüklenir).
  Sıkıştırılmış Skills bloğu `skills.limits.maxSkillsPromptChars` ile sınırlandırılır,
  isteğe bağlı ajan başına geçersiz kılma ise
  `agents.list[].skillsLimits.maxSkillsPromptChars` altındadır.
- Kendini güncelleme yönergeleri
- Çalışma alanı + bootstrap dosyaları (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` yeni olduğunda ve ayrıca mevcutsa `MEMORY.md` veya küçük harfli fallback olarak `memory.md`). Büyük dosyalar `agents.defaults.bootstrapMaxChars` ile kısaltılır (varsayılan: 12000) ve toplam bootstrap enjeksiyonu `agents.defaults.bootstrapTotalMaxChars` ile sınırlandırılır (varsayılan: 60000). `memory/*.md` günlük dosyaları normal bootstrap prompt'unun parçası değildir; sıradan dönüşlerde bellek araçları üzerinden isteğe bağlı kalırlar, ancak çıplak `/new` ve `/reset` ilk dönüş için son günlük belleği içeren tek seferlik bir başlangıç bağlamı bloğunu öne ekleyebilir. Bu başlangıç ön eki `agents.defaults.startupContext` ile denetlenir.
- Zaman (UTC + kullanıcı saat dilimi)
- Yanıt etiketleri + Heartbeat davranışı
- Çalışma zamanı meta verileri (ana bilgisayar/işletim sistemi/model/thinking)

Tam döküm için bkz. [System Prompt](/tr/concepts/system-prompt).

## Bağlam penceresinde ne sayılır

Modelin aldığı her şey bağlam sınırına sayılır:

- Sistem prompt'u (yukarıda listelenen tüm bölümler)
- Konuşma geçmişi (kullanıcı + asistan mesajları)
- Araç çağrıları ve araç sonuçları
- Ekler/transkriptler (görüntüler, ses, dosyalar)
- Compaction özetleri ve budama artifact'leri
- Sağlayıcı sarmalayıcıları veya güvenlik başlıkları (görünmezler ama yine de sayılırlar)

Bazı çalışma zamanı ağırlıklı yüzeylerin kendi açık üst sınırları vardır:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Ajan başına geçersiz kılmalar `agents.list[].contextLimits` altında bulunur. Bu ayarlar,
sınırlı çalışma zamanı alıntıları ve çalışma zamanına ait enjekte edilmiş bloklar
içindir. Bootstrap sınırları, başlangıç bağlamı sınırları ve Skills prompt
sınırlarından ayrıdırlar.

Görüntüler için OpenClaw, sağlayıcı çağrılarından önce transkript/araç görüntü yüklerini küçültür.
Bunu ayarlamak için `agents.defaults.imageMaxDimensionPx` (varsayılan: `1200`) kullanın:

- Daha düşük değerler genellikle vision-token kullanımını ve yük boyutunu azaltır.
- Daha yüksek değerler OCR/UI ağırlıklı ekran görüntülerinde daha fazla görsel ayrıntıyı korur.

Pratik bir döküm için (enjekte edilen dosya başına, araçlar, Skills ve sistem prompt boyutu), `/context list` veya `/context detail` kullanın. Bkz. [Context](/tr/concepts/context).

## Geçerli token kullanımını nasıl görürsünüz

Sohbette şunları kullanın:

- `/status` → oturum modeli, bağlam kullanımı,
  son yanıtın girdi/çıktı token'ları ve **tahmini maliyeti** (yalnızca API anahtarı) içeren **emoji açısından zengin durum kartı**.
- `/usage off|tokens|full` → her yanıta **yanıt başına kullanım alt bilgisi** ekler.
  - Oturum başına kalıcıdır (`responseUsage` olarak depolanır).
  - OAuth kimlik doğrulaması **maliyeti gizler** (yalnızca token'lar).
- `/usage cost` → OpenClaw oturum günlüklerinden yerel maliyet özeti gösterir.

Diğer yüzeyler:

- **TUI/Web TUI:** `/status` + `/usage` desteklenir.
- **CLI:** `openclaw status --usage` ve `openclaw channels list`,
  normalize edilmiş sağlayıcı kota pencerelerini gösterir (`X% left`, yanıt başına maliyet değil).
  Geçerli kullanım-penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi ve z.ai.

Kullanım yüzeyleri, görüntülemeden önce yaygın sağlayıcıya özgü alan takma adlarını normalize eder.
OpenAI ailesi Responses trafiği için buna hem `input_tokens` /
`output_tokens` hem de `prompt_tokens` / `completion_tokens` dahildir; böylece taşımaya özgü
alan adları `/status`, `/usage` veya oturum özetlerini değiştirmez.
Gemini CLI JSON kullanımı da normalize edilir: yanıt metni `response` içinden gelir ve
`stats.cached`, `cacheRead` olarak eşlenir; CLI açık bir `stats.input` alanını atladığında
`stats.input_tokens - stats.cached` kullanılır.
Yerel OpenAI ailesi Responses trafiğinde WebSocket/SSE kullanım takma adları da
aynı şekilde normalize edilir ve `total_tokens` eksik olduğunda veya `0` olduğunda toplamlar normalize edilmiş girdi + çıktıya geri döner.
Geçerli oturum anlık görüntüsü seyrek olduğunda `/status` ve `session_status`,
ayrıca en son transkript kullanım günlüğünden token/önbellek sayaçlarını ve etkin çalışma zamanı model etiketini kurtarabilir.
Mevcut sıfır olmayan canlı değerler yine de transkript fallback değerlerine göre öncelikli kalır ve saklanan toplamlar eksik veya daha küçük olduğunda
daha büyük prompt odaklı transkript toplamları kazanabilir.
Sağlayıcı kota pencereleri için kullanım kimlik doğrulaması, mevcut olduğunda sağlayıcıya özgü Hook'lar üzerinden gelir; aksi takdirde OpenClaw auth profillerinden, ortamdan veya yapılandırmadan eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.
Asistan transkript girdileri, etkin modelde fiyatlandırma yapılandırılmışsa ve sağlayıcı
kullanım meta verisi döndürüyorsa `usage.cost` dahil aynı normalize kullanım biçimini kalıcı olarak tutar.
Bu, canlı çalışma zamanı durumu artık yok olduktan sonra bile `/usage cost` ve transkript destekli oturum
durumu için kararlı bir kaynak sağlar.

## Maliyet tahmini (gösterildiğinde)

Maliyetler model fiyatlandırma yapılandırmanızdan tahmin edilir:

```
models.providers.<provider>.models[].cost
```

Bunlar `input`, `output`, `cacheRead` ve
`cacheWrite` için **1M token başına USD** değerleridir. Fiyatlandırma eksikse OpenClaw yalnızca token'ları gösterir. OAuth token'ları
asla dolar maliyeti göstermez.

## Önbellek TTL'si ve budamanın etkisi

Sağlayıcı prompt önbelleklemesi yalnızca önbellek TTL penceresi içinde geçerlidir. OpenClaw
isteğe bağlı olarak **cache-ttl pruning** çalıştırabilir: önbellek TTL'si
sona erdiğinde oturumu budar, ardından önbellek penceresini sıfırlar; böylece sonraki istekler
tam geçmişi yeniden önbelleğe almak yerine yeni önbelleğe alınmış bağlamı yeniden kullanabilir. Bu,
bir oturum TTL'den uzun süre boşta kaldığında önbellek yazma maliyetlerini düşük tutar.

Bunu [Gateway yapılandırması](/tr/gateway/configuration) içinde yapılandırın ve
davranış ayrıntıları için [Session pruning](/tr/concepts/session-pruning) bölümüne bakın.

Heartbeat, önbelleği boşta geçen aralıklar boyunca **sıcak** tutabilir. Modelinizin önbellek TTL'si
`1h` ise Heartbeat aralığını bunun hemen altına ayarlamak (ör. `55m`) tam prompt'un
yeniden önbelleğe alınmasını önleyebilir, böylece önbellek yazma maliyetlerini azaltır.

Çoklu ajan kurulumlarında tek bir paylaşılan model yapılandırmasını tutabilir ve önbellek davranışını
ajan başına `agents.list[].params.cacheRetention` ile ayarlayabilirsiniz.

Her ayar için tam kılavuz adına bkz. [Prompt Caching](/tr/reference/prompt-caching).

Anthropic API fiyatlandırmasında önbellek okumaları girdi
token'larından önemli ölçüde daha ucuzdur; önbellek yazmaları ise daha yüksek çarpanla faturalandırılır. En güncel oranlar ve TTL çarpanları için Anthropic'in
prompt caching fiyatlandırmasına bakın:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Örnek: 1 saatlik önbelleği Heartbeat ile sıcak tutma

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Örnek: ajan başına önbellek stratejili karma trafik

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # çoğu ajan için varsayılan temel
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # derin oturumlar için uzun önbelleği sıcak tut
    - id: "alerts"
      params:
        cacheRetention: "none" # patlamalı bildirimler için önbellek yazımlarından kaçın
```

`agents.list[].params`, seçili modelin `params` değerlerinin üzerine birleştirilir; böylece
yalnızca `cacheRetention` değerini geçersiz kılabilir ve diğer model varsayılanlarını değiştirmeden devralabilirsiniz.

### Örnek: Anthropic 1M bağlam beta başlığını etkinleştirme

Anthropic'in 1M bağlam penceresi şu anda beta kapılıdır. OpenClaw,
desteklenen Opus
veya Sonnet modellerinde `context1m` etkinleştirildiğinde gerekli `anthropic-beta` değerini enjekte edebilir.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Bu, Anthropic'in `context-1m-2025-08-07` beta başlığına eşlenir.

Bu yalnızca ilgili model girdisinde `context1m: true` ayarlandığında uygulanır.

Gereksinim: kimlik bilgisi uzun bağlam kullanımı için uygun olmalıdır. Değilse,
Anthropic bu istek için sağlayıcı taraflı bir hız sınırı hatasıyla yanıt verir.

Anthropic'i OAuth/abonelik token'larıyla (`sk-ant-oat-*`) doğrularsanız,
OpenClaw `context-1m-*` beta başlığını atlar çünkü Anthropic şu anda
bu birleşimi HTTP 401 ile reddeder.

## Token baskısını azaltma ipuçları

- Uzun oturumları özetlemek için `/compact` kullanın.
- İş akışlarınızda büyük araç çıktılarını kırpın.
- Ekran görüntüsü ağırlıklı oturumlar için `agents.defaults.imageMaxDimensionPx` değerini düşürün.
- Skill açıklamalarını kısa tutun (Skill listesi prompt'a enjekte edilir).
- Ayrıntılı, keşif amaçlı işler için daha küçük modelleri tercih edin.

Tam Skill listesi ek yükü formülü için bkz. [Skills](/tr/tools/skills).
