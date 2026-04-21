---
read_when:
    - Düşünme, hızlı mod veya ayrıntılı yönerge ayrıştırmasını ya da varsayılanlarını ayarlama
summary: '`/think`, `/fast`, `/verbose`, `/trace` ve reasoning görünürlüğü için yönerge sözdizimi'
title: Düşünme Düzeyleri
x-i18n:
    generated_at: "2026-04-21T09:07:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b0217f6e5a5cb3400090f31ad5271ca61848a40f77d3f942851e7c2f2352886
    source_path: tools/thinking.md
    workflow: 15
---

# Düşünme Düzeyleri (/think yönergeleri)

## Ne yapar

- Herhangi bir gelen gövde içinde satır içi yönerge: `/t <level>`, `/think:<level>` veya `/thinking <level>`.
- Düzeyler (takma adlar): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (maksimum bütçe)
  - xhigh → “ultrathink+” (GPT-5.2 + Codex modelleri ve Anthropic Claude Opus 4.7 çabası)
  - adaptive → sağlayıcı tarafından yönetilen uyarlanabilir düşünme (Anthropic/Bedrock üzerindeki Claude 4.6 ve Anthropic Claude Opus 4.7 için desteklenir)
  - max → sağlayıcı maksimum reasoning (şu anda Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` ve `extra_high`, `xhigh` olarak eşlenir.
  - `highest`, `high` olarak eşlenir.
- Sağlayıcı notları:
  - Düşünme menüleri ve seçicileri sağlayıcı profil odaklıdır. Sağlayıcı Plugin'leri, ikili `on` gibi etiketler de dahil olmak üzere seçilen model için tam düzey kümesini bildirir.
  - `adaptive`, `xhigh` ve `max`, yalnızca bunları destekleyen sağlayıcı/model profilleri için duyurulur. Desteklenmeyen düzeyler için yazılmış yönergeler, o modelin geçerli seçenekleriyle birlikte reddedilir.
  - Eski `max` değerleri dahil, depolanmış ama artık desteklenmeyen düzeyler model değiştirildikten sonra seçilen model için desteklenen en büyük düzeye yeniden eşlenir.
  - Anthropic Claude 4.6 modelleri, açık bir düşünme düzeyi ayarlanmamışsa varsayılan olarak `adaptive` kullanır.
  - Anthropic Claude Opus 4.7, varsayılan olarak uyarlanabilir düşünmeye geçmez. API çabasının varsayılanı, açıkça bir düşünme düzeyi ayarlamadığınız sürece sağlayıcıya aittir.
  - Anthropic Claude Opus 4.7, `/think xhigh` komutunu uyarlanabilir düşünme artı `output_config.effort: "xhigh"` olarak eşler; çünkü `/think` bir düşünme yönergesidir ve `xhigh`, Opus 4.7 çaba ayarıdır.
  - Anthropic Claude Opus 4.7 ayrıca `/think max` komutunu da sunar; bu, aynı sağlayıcıya ait maksimum çaba yoluna eşlenir.
  - OpenAI GPT modelleri `/think` komutunu modele özgü Responses API çaba desteği üzerinden eşler. `/think off`, yalnızca hedef model bunu destekliyorsa `reasoning.effort: "none"` gönderir; aksi durumda OpenClaw desteklenmeyen bir değer göndermek yerine devre dışı reasoning yükünü atlar.
  - Anthropic uyumlu akış yolundaki MiniMax (`minimax/*`), model parametrelerinde veya istek parametrelerinde açıkça düşünme ayarlamadığınız sürece varsayılan olarak `thinking: { type: "disabled" }` kullanır. Bu, MiniMax'in yerel olmayan Anthropic akış biçiminden sızan `reasoning_content` deltalarını önler.
  - Z.AI (`zai/*`) yalnızca ikili düşünmeyi (`on`/`off`) destekler. `off` dışındaki her düzey `on` olarak değerlendirilir (`low` olarak eşlenir).
  - Moonshot (`moonshot/*`), `/think off` komutunu `thinking: { type: "disabled" }` ve `off` dışındaki her düzeyi `thinking: { type: "enabled" }` olarak eşler. Düşünme etkin olduğunda Moonshot yalnızca `tool_choice` için `auto|none` kabul eder; OpenClaw uyumsuz değerleri `auto` olarak normalleştirir.

## Çözümleme sırası

1. Mesaj üzerindeki satır içi yönerge (yalnızca o mesaja uygulanır).
2. Oturum geçersiz kılması (yalnızca yönerge içeren mesaj gönderilerek ayarlanır).
3. Ajan başına varsayılan (`agents.list[].thinkingDefault`, config içinde).
4. Genel varsayılan (`agents.defaults.thinkingDefault`, config içinde).
5. Geri dönüş: varsa sağlayıcının bildirdiği varsayılan, reasoning yetenekli olarak işaretlenmiş diğer katalog modelleri için `low`, aksi durumda `off`.

## Oturum varsayılanı ayarlama

- **Yalnızca** yönergeden oluşan bir mesaj gönderin (boşluklara izin verilir), örneğin `/think:medium` veya `/t high`.
- Bu, geçerli oturum için kalır (varsayılan olarak gönderici başına); `/think:off` veya oturum boşta sıfırlaması ile temizlenir.
- Onay yanıtı gönderilir (`Thinking level set to high.` / `Thinking disabled.`). Düzey geçersizse (ör. `/thinking big`), komut bir ipucuyla reddedilir ve oturum durumu değiştirilmez.
- Geçerli düşünme düzeyini görmek için argüman vermeden `/think` (veya `/think:`) gönderin.

## Ajana göre uygulama

- **Gömülü Pi**: çözümlenen düzey, süreç içi Pi ajan çalışma zamanına geçirilir.

## Hızlı mod (/fast)

- Düzeyler: `on|off`.
- Yalnızca yönerge içeren mesaj, bir oturum hızlı mod geçersiz kılması açar/kapatır ve `Fast mode enabled.` / `Fast mode disabled.` yanıtını verir.
- Etkin hızlı mod durumunu görmek için kip belirtmeden `/fast` (veya `/fast status`) gönderin.
- OpenClaw hızlı modu şu sırayla çözümler:
  1. Satır içi/yalnızca yönerge `/fast on|off`
  2. Oturum geçersiz kılması
  3. Ajan başına varsayılan (`agents.list[].fastModeDefault`)
  4. Model başına yapılandırma: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Geri dönüş: `off`
- `openai/*` için hızlı mod, desteklenen Responses isteklerinde `service_tier=priority` göndererek OpenAI öncelikli işlemeye eşlenir.
- `openai-codex/*` için hızlı mod, Codex Responses üzerinde aynı `service_tier=priority` bayrağını gönderir. OpenClaw, her iki auth yolu için tek bir ortak `/fast` anahtarı tutar.
- `api.anthropic.com` adresine gönderilen OAuth kimliği doğrulanmış trafik dahil doğrudan herkese açık `anthropic/*` isteklerinde hızlı mod Anthropic hizmet katmanlarına eşlenir: `/fast on`, `service_tier=auto`; `/fast off`, `service_tier=standard_only` ayarlar.
- Anthropic uyumlu yoldaki `minimax/*` için `/fast on` (veya `params.fastMode: true`), `MiniMax-M2.7` modelini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
- Her ikisi de ayarlandığında açık Anthropic `serviceTier` / `service_tier` model parametreleri, hızlı mod varsayılanını geçersiz kılar. OpenClaw yine de Anthropic olmayan proxy temel URL'leri için Anthropic hizmet katmanı eklemesini atlar.

## Ayrıntılı yönergeler (/verbose veya /v)

- Düzeyler: `on` (minimal) | `full` | `off` (varsayılan).
- Yalnızca yönerge içeren mesaj oturum ayrıntı düzeyini açar/kapatır ve `Verbose logging enabled.` / `Verbose logging disabled.` yanıtını verir; geçersiz düzeyler durumu değiştirmeden ipucu döndürür.
- `/verbose off`, açık bir oturum geçersiz kılması depolar; bunu Sessions UI üzerinden `inherit` seçerek temizleyin.
- Satır içi yönerge yalnızca o mesaja uygulanır; aksi durumda oturum/genel varsayılanlar geçerlidir.
- Geçerli ayrıntı düzeyini görmek için argüman vermeden `/verbose` (veya `/verbose:`) gönderin.
- Ayrıntılı mod açık olduğunda, yapılandırılmış araç sonuçları üreten ajanlar (Pi, diğer JSON ajanları) her araç çağrısını kendi meta veri odaklı mesajı olarak geri gönderir; varsa `<emoji> <tool-name>: <arg>` öneki kullanılır (yol/komut). Bu araç özetleri, her araç başlar başlamaz gönderilir (ayrı baloncuklar olarak), akış deltaları olarak değil.
- Araç hata özetleri normal modda görünür kalır, ancak ham hata ayrıntısı sonekleri `verbose` değeri `on` veya `full` olmadıkça gizlenir.
- `verbose` değeri `full` olduğunda, araç çıktıları da tamamlandıktan sonra iletilir (ayrı baloncuk, güvenli uzunluğa kırpılmış). Bir çalıştırma sürerken `/verbose on|full|off` değiştirirseniz sonraki araç baloncukları yeni ayarı dikkate alır.

## Plugin izleme yönergeleri (/trace)

- Düzeyler: `on` | `off` (varsayılan).
- Yalnızca yönerge içeren mesaj oturum Plugin izleme çıktısını açar/kapatır ve `Plugin trace enabled.` / `Plugin trace disabled.` yanıtını verir.
- Satır içi yönerge yalnızca o mesaja uygulanır; aksi durumda oturum/genel varsayılanlar geçerlidir.
- Geçerli izleme düzeyini görmek için argüman vermeden `/trace` (veya `/trace:`) gönderin.
- `/trace`, `/verbose` değerinden daha dardır: yalnızca Active Memory hata ayıklama özetleri gibi Plugin sahipliğindeki izleme/hata ayıklama satırlarını açığa çıkarır.
- İzleme satırları `/status` içinde ve normal yardımcı yanıtından sonra gelen takip tanılama mesajı olarak görünebilir.

## Reasoning görünürlüğü (/reasoning)

- Düzeyler: `on|off|stream`.
- Yalnızca yönerge içeren mesaj, yanıtlarda düşünme bloklarının gösterilip gösterilmeyeceğini açar/kapatır.
- Etkinleştirildiğinde reasoning, `Reasoning:` önekiyle **ayrı bir mesaj** olarak gönderilir.
- `stream` (yalnızca Telegram): reasoning'i yanıt üretilirken Telegram taslak baloncuğuna akıtır, ardından reasoning olmadan son yanıtı gönderir.
- Takma ad: `/reason`.
- Geçerli reasoning düzeyini görmek için argüman vermeden `/reasoning` (veya `/reasoning:`) gönderin.
- Çözümleme sırası: satır içi yönerge, ardından oturum geçersiz kılması, ardından ajan başına varsayılan (`agents.list[].reasoningDefault`), ardından geri dönüş (`off`).

## İlgili

- Yükseltilmiş mod belgeleri [Yükseltilmiş mod](/tr/tools/elevated) sayfasında bulunur.

## Heartbeat'ler

- Heartbeat yoklama gövdesi, yapılandırılmış Heartbeat istemidir (varsayılan: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Bir Heartbeat mesajındaki satır içi yönergeler normal şekilde uygulanır (ancak Heartbeat'lerden oturum varsayılanlarını değiştirmekten kaçının).
- Heartbeat teslimatı varsayılan olarak yalnızca son yükü gönderir. Ayrı `Reasoning:` mesajını da göndermek için (varsa) `agents.defaults.heartbeat.includeReasoning: true` veya ajan başına `agents.list[].heartbeat.includeReasoning: true` ayarlayın.

## Web sohbet UI

- Web sohbet düşünme seçicisi, sayfa yüklendiğinde gelen oturum deposu/config içindeki oturumda depolanmış düzeyi yansıtır.
- Başka bir düzey seçmek, bunu hemen `sessions.patch` aracılığıyla oturum geçersiz kılması olarak yazar; bir sonraki gönderimi beklemez ve tek seferlik `thinkingOnce` geçersiz kılması değildir.
- İlk seçenek her zaman `Default (<resolved level>)` olur; burada çözümlenen varsayılan, etkin oturum modelinin sağlayıcı düşünme profilinden gelir.
- Seçici, Gateway oturum satırı tarafından döndürülen `thinkingOptions` değerini kullanır. Tarayıcı UI kendi sağlayıcı regex listesini tutmaz; modele özgü düzey kümeleri Plugin'lere aittir.
- `/think:<level>` hâlâ çalışır ve depolanmış aynı oturum düzeyini günceller; böylece sohbet yönergeleri ve seçici eşzamanlı kalır.

## Sağlayıcı profilleri

- Sağlayıcı Plugin'leri, modelin desteklenen düzeylerini ve varsayılanını tanımlamak için `resolveThinkingProfile(ctx)` sunabilir.
- Her profil düzeyinin depolanan kurallı bir `id` değeri vardır (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` veya `max`) ve bir görüntüleme `label` değeri içerebilir. İkili sağlayıcılar `{ id: "low", label: "on" }` kullanır.
- Yayımlanmış eski hook'lar (`supportsXHighThinking`, `isBinaryThinking` ve `resolveDefaultThinkingLevel`) uyumluluk bağdaştırıcıları olarak kalır, ancak yeni özel düzey kümeleri `resolveThinkingProfile` kullanmalıdır.
- Gateway satırları `thinkingOptions` ve `thinkingDefault` değerlerini açığa çıkarır; böylece ACP/sohbet istemcileri çalışma zamanı doğrulamasının kullandığı aynı profili işler.
