---
read_when:
    - Token kullanımını, maliyetleri veya bağlam pencerelerini açıklama
    - Bağlam büyümesini veya sıkıştırma davranışını hata ayıklama
summary: OpenClaw’ın istem bağlamını nasıl oluşturduğu ve token kullanımını + maliyetleri nasıl raporladığı
title: Token Kullanımı ve Maliyetler
x-i18n:
    generated_at: "2026-04-12T08:33:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: f8c856549cd28b8364a640e6fa9ec26aa736895c7a993e96cbe85838e7df2dfb
    source_path: reference/token-use.md
    workflow: 15
---

# Token kullanımı ve maliyetler

OpenClaw **karakterleri değil, token’ları** izler. Token’lar modele özgüdür, ancak çoğu
OpenAI tarzı model İngilizce metinde token başına ortalama ~4 karakter kullanır.

## Sistem istemi nasıl oluşturulur

OpenClaw her çalıştırmada kendi sistem istemini oluşturur. Şunları içerir:

- Araç listesi + kısa açıklamalar
- Skills listesi (yalnızca meta veriler; yönergeler ihtiyaç halinde `read` ile yüklenir)
- Self-update yönergeleri
- Çalışma alanı + önyükleme dosyaları (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, yeni olduğunda `BOOTSTRAP.md`, ayrıca varsa `MEMORY.md` veya küçük harfli geri dönüş olarak `memory.md`). Büyük dosyalar `agents.defaults.bootstrapMaxChars` ile kırpılır (varsayılan: 20000) ve toplam önyükleme enjeksiyonu `agents.defaults.bootstrapTotalMaxChars` ile sınırlandırılır (varsayılan: 150000). `memory/*.md` günlük dosyaları normal önyükleme isteminin parçası değildir; normal turlarda bellek araçları üzerinden ihtiyaç halinde erişilebilir olarak kalırlar, ancak çıplak `/new` ve `/reset` ilk tur için son günlük belleği içeren tek seferlik bir başlangıç bağlamı bloğunu başa ekleyebilir. Bu başlangıç giriş bölümü `agents.defaults.startupContext` ile kontrol edilir.
- Zaman (UTC + kullanıcı saat dilimi)
- Yanıt etiketleri + heartbeat davranışı
- Çalışma zamanı meta verileri (ana makine/işletim sistemi/model/düşünme)

Tam döküm için bkz. [System Prompt](/tr/concepts/system-prompt).

## Bağlam penceresinde ne sayılır

Modelin aldığı her şey bağlam sınırına dahil edilir:

- Sistem istemi (yukarıda listelenen tüm bölümler)
- Konuşma geçmişi (kullanıcı + asistan mesajları)
- Araç çağrıları ve araç sonuçları
- Ekler/dökümler (görseller, ses, dosyalar)
- Sıkıştırma özetleri ve budama artifaktları
- Sağlayıcı sarmalayıcıları veya güvenlik başlıkları (görünmezler, ancak yine de sayılırlar)

Görseller için OpenClaw, sağlayıcı çağrılarından önce döküm/araç görsel yüklerini küçültür.
Bunu ayarlamak için `agents.defaults.imageMaxDimensionPx` kullanın (varsayılan: `1200`):

- Daha düşük değerler genellikle vision token kullanımını ve yük boyutunu azaltır.
- Daha yüksek değerler OCR/arayüz ağırlıklı ekran görüntülerinde daha fazla görsel ayrıntıyı korur.

Pratik bir döküm için (enjekte edilen dosya başına, araçlar, skills ve sistem istemi boyutu), `/context list` veya `/context detail` kullanın. Bkz. [Context](/tr/concepts/context).

## Geçerli token kullanımını nasıl görebilirsiniz

Sohbette şunları kullanın:

- `/status` → oturum modelini, bağlam kullanımını,
  son yanıtın girdi/çıktı token’larını ve **tahmini maliyeti** (yalnızca API anahtarı) gösteren **emoji açısından zengin durum kartı**.
- `/usage off|tokens|full` → her yanıta **yanıt başına kullanım altbilgisi** ekler.
  - Oturum başına kalıcıdır (`responseUsage` olarak saklanır).
  - OAuth kimlik doğrulaması **maliyeti gizler** (yalnızca token’lar).
- `/usage cost` → OpenClaw oturum günlüklerinden yerel bir maliyet özeti gösterir.

Diğer yüzeyler:

- **TUI/Web TUI:** `/status` + `/usage` desteklenir.
- **CLI:** `openclaw status --usage` ve `openclaw channels list`
  normalize edilmiş sağlayıcı kota pencerelerini gösterir (`%X kaldı`, yanıt başına maliyet değil).
  Geçerli kullanım penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi ve z.ai.

Kullanım yüzeyleri, görüntülemeden önce yaygın sağlayıcıya özgü alan takma adlarını normalize eder.
OpenAI ailesi Responses trafiği için buna hem `input_tokens` /
`output_tokens` hem de `prompt_tokens` / `completion_tokens` dahildir; böylece taşıma biçimine özgü
alan adları `/status`, `/usage` veya oturum özetlerini değiştirmez.
Gemini CLI JSON kullanımı da normalize edilir: yanıt metni `response` alanından gelir ve
CLI açık bir `stats.input` alanı vermediğinde
`stats.cached`, `cacheRead` alanına eşlenir ve `stats.input_tokens - stats.cached`
kullanılır.
Yerel OpenAI ailesi Responses trafiğinde WebSocket/SSE kullanım takma adları da
aynı şekilde normalize edilir ve `total_tokens` eksikse veya `0` ise toplamlar normalize edilmiş girdi + çıktıdan geri alınır.
Geçerli oturum anlık görüntüsü seyrek olduğunda, `/status` ve `session_status`
ayrıca en son döküm kullanım günlüğünden token/önbellek sayaçlarını ve etkin çalışma zamanı model etiketini de
geri alabilir.
Var olan sıfır olmayan canlı değerler yine de döküm geri dönüş değerlerinden önceliklidir ve daha büyük istem odaklı
döküm toplamları, saklanan toplamlar eksikse veya daha küçükse üstün gelebilir.
Sağlayıcı kota pencereleri için kullanım kimlik doğrulaması, mevcut olduğunda sağlayıcıya özgü hook’lardan gelir;
aksi takdirde OpenClaw, auth profilleri, ortam veya yapılandırmadan eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.

## Maliyet tahmini (gösterildiğinde)

Maliyetler model fiyatlandırma yapılandırmanızdan tahmin edilir:

```
models.providers.<provider>.models[].cost
```

Bunlar `input`, `output`, `cacheRead` ve
`cacheWrite` için **1 milyon token başına USD** değerleridir. Fiyatlandırma eksikse OpenClaw yalnızca token’ları gösterir. OAuth token’ları
asla dolar maliyeti göstermez.

## Önbellek TTL’si ve budama etkisi

Sağlayıcı istem önbelleklemesi yalnızca önbellek TTL penceresi içinde uygulanır. OpenClaw
isteğe bağlı olarak **cache-ttl budaması** çalıştırabilir: önbellek TTL’si
sona erdiğinde oturumu budar, ardından önbellek penceresini sıfırlar; böylece sonraki istekler tüm geçmişi yeniden önbelleğe almak yerine
yeni önbelleğe alınmış bağlamı yeniden kullanabilir. Bu, bir oturum TTL sonrasına kadar boşta kalırsa
önbellek yazma maliyetlerini daha düşük tutar.

Bunu [Gateway configuration](/tr/gateway/configuration) altında yapılandırın ve
davranış ayrıntıları için [Session pruning](/tr/concepts/session-pruning) belgesine bakın.

Heartbeat, boşluk süreleri boyunca önbelleği **sıcak** tutabilir. Model önbellek TTL’niz
`1h` ise, heartbeat aralığını bunun hemen altına ayarlamak (örneğin `55m`) tüm istemin
yeniden önbelleğe alınmasını önleyebilir ve önbellek yazma maliyetlerini azaltabilir.

Çok agent’li kurulumlarda, tek bir paylaşılan model yapılandırmasını koruyabilir ve önbellek davranışını
agent başına `agents.list[].params.cacheRetention` ile ayarlayabilirsiniz.

Düğme düğme tam rehber için bkz. [Prompt Caching](/tr/reference/prompt-caching).

Anthropic API fiyatlandırmasında, önbellek okumaları girdi
token’larından belirgin ölçüde daha ucuzdur; önbellek yazmaları ise daha yüksek bir çarpanla faturalandırılır. En güncel oranlar ve TTL çarpanları için Anthropic’in
istem önbellekleme fiyatlandırmasına bakın:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Örnek: heartbeat ile 1 saatlik önbelleği sıcak tutma

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

### Örnek: agent başına önbellek stratejisiyle karma trafik

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # çoğu agent için varsayılan temel çizgi
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # derin oturumlar için uzun önbelleği sıcak tut
    - id: "alerts"
      params:
        cacheRetention: "none" # patlamalı bildirimler için önbellek yazmalarını önle
```

`agents.list[].params`, seçili modelin `params` alanının üzerine birleştirilir; böylece yalnızca
`cacheRetention` değerini geçersiz kılabilir ve diğer model varsayılanlarını değiştirmeden devralabilirsiniz.

### Örnek: Anthropic 1M bağlam beta başlığını etkinleştirme

Anthropic’in 1M bağlam penceresi şu anda beta kapısıyla sınırlandırılmıştır. OpenClaw,
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

Bu, Anthropic’in `context-1m-2025-08-07` beta başlığına eşlenir.

Bu yalnızca o model girdisinde `context1m: true` ayarlandığında uygulanır.

Gereksinim: kimlik bilgisi uzun bağlam kullanımı için uygun olmalıdır. Değilse,
Anthropic bu istek için sağlayıcı taraflı bir hız sınırı hatası döndürür.

Anthropic’i OAuth/abonelik token’larıyla (`sk-ant-oat-*`) kimlik doğrularsanız,
OpenClaw `context-1m-*` beta başlığını atlar; çünkü Anthropic şu anda
bu birleşimi HTTP 401 ile reddetmektedir.

## Token baskısını azaltma ipuçları

- Uzun oturumları özetlemek için `/compact` kullanın.
- İş akışlarınızda büyük araç çıktıları kırpın.
- Ekran görüntüsü ağırlıklı oturumlarda `agents.defaults.imageMaxDimensionPx` değerini düşürün.
- Skill açıklamalarını kısa tutun (skill listesi isteme enjekte edilir).
- Ayrıntılı, keşif amaçlı işler için daha küçük modelleri tercih edin.

Tam skill listesi ek yükü formülü için bkz. [Skills](/tr/tools/skills).
