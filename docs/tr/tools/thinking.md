---
read_when:
    - Thinking, fast-mode veya verbose yönerge ayrıştırmasını ya da varsayılanlarını ayarlama
summary: '`/think`, `/fast`, `/verbose`, `/trace` ve akıl yürütme görünürlüğü için yönerge söz dizimi'
title: Thinking Düzeyleri
x-i18n:
    generated_at: "2026-04-23T09:12:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66033bb9272c9b9ea8fc85dc91e33e95ce4c469c56a8cd10c19632a5aa8a2338
    source_path: tools/thinking.md
    workflow: 15
---

# Thinking Düzeyleri (/think yönergeleri)

## Ne yapar

- Herhangi bir gelen gövdede satır içi yönerge: `/t <level>`, `/think:<level>` veya `/thinking <level>`.
- Düzeyler (takma adlar): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (azami bütçe)
  - xhigh → “ultrathink+” (GPT-5.2 + Codex modelleri ve Anthropic Claude Opus 4.7 effort)
  - adaptive → sağlayıcı tarafından yönetilen uyarlanabilir thinking (Anthropic/Bedrock üzerindeki Claude 4.6 ve Anthropic Claude Opus 4.7 için desteklenir)
  - max → sağlayıcı azami akıl yürütme (şu anda Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` ve `extra_high`, `xhigh` değerine eşlenir.
  - `highest`, `high` değerine eşlenir.
- Sağlayıcı notları:
  - Thinking menüleri ve seçicileri sağlayıcı profiline göre belirlenir. Sağlayıcı Plugin'leri seçilen model için tam düzey kümesini, `on` gibi ikili etiketler dahil, bildirir.
  - `adaptive`, `xhigh` ve `max` yalnızca bunları destekleyen sağlayıcı/model profilleri için duyurulur. Desteklenmeyen düzeyler için yazılmış yönergeler, o modelin geçerli seçenekleriyle reddedilir.
  - Saklanmış mevcut desteklenmeyen düzeyler sağlayıcı profil sırasına göre yeniden eşlenir. `adaptive`, uyarlanabilir olmayan modellerde `medium` değerine geri düşer; `xhigh` ve `max` ise seçilen model için desteklenen en büyük off-olmayan düzeye geri düşer.
  - Anthropic Claude 4.6 modelleri, açık bir thinking düzeyi ayarlı değilse varsayılan olarak `adaptive` kullanır.
  - Anthropic Claude Opus 4.7 varsayılan olarak adaptive thinking kullanmaz. API effort varsayılanı, siz açıkça bir thinking düzeyi ayarlamadıkça sağlayıcıya ait kalır.
  - Anthropic Claude Opus 4.7, `/think xhigh` komutunu adaptive thinking artı `output_config.effort: "xhigh"` olarak eşler; çünkü `/think` bir thinking yönergesidir ve `xhigh` Opus 4.7 effort ayarıdır.
  - Anthropic Claude Opus 4.7 ayrıca `/think max` değerini de açığa çıkarır; bu aynı sağlayıcıya ait azami effort yoluna eşlenir.
  - OpenAI GPT modelleri, `/think` komutunu modele özgü Responses API effort desteği üzerinden eşler. `/think off`, yalnızca hedef model bunu desteklediğinde `reasoning.effort: "none"` gönderir; aksi halde OpenClaw desteklenmeyen bir değer göndermek yerine devre dışı reasoning yükünü atlar.
  - Anthropic uyumlu akış yolundaki MiniMax (`minimax/*`), model params veya istek params içinde açıkça thinking ayarlamadığınız sürece varsayılan olarak `thinking: { type: "disabled" }` kullanır. Bu, MiniMax'ın yerel olmayan Anthropic akış biçiminden `reasoning_content` delta'larının sızmasını önler.
  - Z.AI (`zai/*`) yalnızca ikili thinking destekler (`on`/`off`). `off` olmayan her düzey `on` olarak değerlendirilir (`low` değerine eşlenir).
  - Moonshot (`moonshot/*`), `/think off` değerini `thinking: { type: "disabled" }`, `off` olmayan her düzeyi ise `thinking: { type: "enabled" }` olarak eşler. Thinking etkin olduğunda Moonshot yalnızca `tool_choice` olarak `auto|none` kabul eder; OpenClaw uyumsuz değerleri `auto` olarak normalleştirir.

## Çözümleme sırası

1. Mesaj üzerindeki satır içi yönerge (yalnızca o mesaja uygulanır).
2. Oturum geçersiz kılması (yalnızca yönergeden oluşan bir mesaj gönderilerek ayarlanır).
3. Ajan başına varsayılan (`config` içinde `agents.list[].thinkingDefault`).
4. Genel varsayılan (`config` içinde `agents.defaults.thinkingDefault`).
5. Geri dönüş: mevcut olduğunda sağlayıcının bildirdiği varsayılan, reasoning yetenekli olarak işaretlenmiş diğer katalog modelleri için `low`, aksi halde `off`.

## Bir oturum varsayılanı ayarlama

- **Yalnızca** yönergeden oluşan bir mesaj gönderin (boşluk kabul edilir), örneğin `/think:medium` veya `/t high`.
- Bu, geçerli oturum için kalıcı olur (varsayılan olarak gönderici başına); `/think:off` veya oturum boşta sıfırlaması ile temizlenir.
- Onay yanıtı gönderilir (`Thinking level set to high.` / `Thinking disabled.`). Düzey geçersizse (ör. `/thinking big`) komut bir ipucuyla reddedilir ve oturum durumu değiştirilmeden kalır.
- Geçerli thinking düzeyini görmek için argümansız `/think` (veya `/think:`) gönderin.

## Ajan tarafından uygulama

- **Embedded Pi**: çözümlenen düzey, süreç içi Pi ajan çalışma zamanına geçirilir.

## Fast mode (/fast)

- Düzeyler: `on|off`.
- Yalnızca yönergeden oluşan mesaj, oturum fast-mode geçersiz kılmasını değiştirir ve `Fast mode enabled.` / `Fast mode disabled.` yanıtını verir.
- Geçerli etkin fast-mode durumunu görmek için kip vermeden `/fast` (veya `/fast status`) gönderin.
- OpenClaw fast mode'u şu sırayla çözümler:
  1. Satır içi/yalnızca yönerge `/fast on|off`
  2. Oturum geçersiz kılması
  3. Ajan başına varsayılan (`agents.list[].fastModeDefault`)
  4. Model başına yapılandırma: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Geri dönüş: `off`
- `openai/*` için fast mode, desteklenen Responses isteklerinde `service_tier=priority` göndererek OpenAI öncelikli işlemeye eşlenir.
- `openai-codex/*` için fast mode, Codex Responses üzerinde aynı `service_tier=priority` bayrağını gönderir. OpenClaw her iki auth yolu için de tek bir paylaşılan `/fast` geçişi tutar.
- `api.anthropic.com` adresine gönderilen OAuth ile kimliği doğrulanmış trafik dahil doğrudan herkese açık `anthropic/*` istekleri için fast mode, Anthropic hizmet katmanlarına eşlenir: `/fast on`, `service_tier=auto`; `/fast off`, `service_tier=standard_only` ayarlar.
- Anthropic uyumlu yoldaki `minimax/*` için `/fast on` (veya `params.fastMode: true`) `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
- Açık Anthropic `serviceTier` / `service_tier` model params, ikisi birden ayarlandığında fast-mode varsayılanını geçersiz kılar. OpenClaw, Anthropic hizmet katmanı enjeksiyonunu Anthropic olmayan proxy temel URL'leri için yine de atlar.
- `/status`, yalnızca fast mode etkin olduğunda `Fast` gösterir.

## Verbose yönergeleri (/verbose veya /v)

- Düzeyler: `on` (minimal) | `full` | `off` (varsayılan).
- Yalnızca yönergeden oluşan mesaj, oturum verbose durumunu değiştirir ve `Verbose logging enabled.` / `Verbose logging disabled.` yanıtını verir; geçersiz düzeyler durumu değiştirmeden ipucu döndürür.
- `/verbose off`, açık bir oturum geçersiz kılması depolar; bunu Sessions UI üzerinden `inherit` seçerek temizleyin.
- Satır içi yönerge yalnızca o mesaja uygulanır; aksi durumda oturum/genel varsayılanlar geçerlidir.
- Geçerli verbose düzeyini görmek için argümansız `/verbose` (veya `/verbose:`) gönderin.
- Verbose açık olduğunda, yapılandırılmış tool result'lar yayan ajanlar (Pi, diğer JSON ajanları) her tool call'ı, mevcut olduğunda `<emoji> <tool-name>: <arg>` önekiyle (yol/komut) kendi yalnızca üst veri mesajı olarak geri gönderir. Bu tool özetleri, her araç başlar başlamaz (ayrı baloncuklar halinde) gönderilir; akış delta'ları olarak değil.
- Tool failure özetleri normal kipte görünür kalır, ancak ham hata ayrıntısı sonekleri verbose `on` veya `full` olmadıkça gizlenir.
- Verbose `full` olduğunda, tool çıktıları tamamlandıktan sonra da iletilir (ayrı baloncuk, güvenli bir uzunluğa kısaltılmış). Bir çalıştırma sürerken `/verbose on|full|off` değiştirirseniz, sonraki tool baloncukları yeni ayara uyar.

## Plugin izleme yönergeleri (/trace)

- Düzeyler: `on` | `off` (varsayılan).
- Yalnızca yönergeden oluşan mesaj, oturum Plugin izleme çıktısını değiştirir ve `Plugin trace enabled.` / `Plugin trace disabled.` yanıtını verir.
- Satır içi yönerge yalnızca o mesaja uygulanır; aksi durumda oturum/genel varsayılanlar geçerlidir.
- Geçerli trace düzeyini görmek için argümansız `/trace` (veya `/trace:`) gönderin.
- `/trace`, `/verbose` komutundan daha dardır: yalnızca Active Memory hata ayıklama özetleri gibi Plugin'e ait trace/debug satırlarını açığa çıkarır.
- Trace satırları `/status` içinde ve normal assistant yanıtından sonra takip tanılama mesajı olarak görünebilir.

## Akıl yürütme görünürlüğü (/reasoning)

- Düzeyler: `on|off|stream`.
- Yalnızca yönergeden oluşan mesaj, yanıtlar içinde thinking bloklarının gösterilip gösterilmeyeceğini değiştirir.
- Etkin olduğunda akıl yürütme, `Reasoning:` önekiyle **ayrı bir mesaj** olarak gönderilir.
- `stream` (yalnızca Telegram): akıl yürütmeyi yanıt üretilirken Telegram taslak baloncuğuna akıtır, ardından nihai yanıtı akıl yürütme olmadan gönderir.
- Takma ad: `/reason`.
- Geçerli akıl yürütme düzeyini görmek için argümansız `/reasoning` (veya `/reasoning:`) gönderin.
- Çözümleme sırası: satır içi yönerge, sonra oturum geçersiz kılması, sonra ajan başına varsayılan (`agents.list[].reasoningDefault`), sonra geri dönüş (`off`).

## İlgili

- Elevated mode belgeleri [Elevated mode](/tr/tools/elevated) sayfasında bulunur.

## Heartbeat'ler

- Heartbeat yoklama gövdesi, yapılandırılmış Heartbeat istemidir (varsayılan: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Heartbeat mesajındaki satır içi yönergeler her zamanki gibi uygulanır (ancak Heartbeat'lerden oturum varsayılanlarını değiştirmekten kaçının).
- Heartbeat teslimi varsayılan olarak yalnızca nihai yükü gönderir. Ayrı `Reasoning:` mesajını da göndermek için (mevcutsa), `agents.defaults.heartbeat.includeReasoning: true` veya ajan başına `agents.list[].heartbeat.includeReasoning: true` ayarlayın.

## Web sohbet UI

- Web sohbeti thinking seçicisi, sayfa yüklenirken gelen oturum deposundan/yapılandırmadan oturumun saklanan düzeyini yansıtır.
- Başka bir düzey seçmek, oturum geçersiz kılmasını hemen `sessions.patch` üzerinden yazar; sonraki gönderimi beklemez ve tek seferlik bir `thinkingOnce` geçersiz kılması değildir.
- İlk seçenek her zaman `Default (<resolved level>)` olur; burada çözümlenen varsayılan, etkin oturum modelinin sağlayıcı thinking profilinden gelir.
- Seçici, Gateway oturum satırı tarafından döndürülen `thinkingOptions` değerini kullanır. Tarayıcı UI kendi sağlayıcı regex listesini tutmaz; modele özgü düzey kümelerinin sahibi Plugin'lerdir.
- `/think:<level>` yine çalışır ve aynı saklanan oturum düzeyini günceller; böylece sohbet yönergeleri ve seçici eşzamanlı kalır.

## Sağlayıcı profilleri

- Sağlayıcı Plugin'leri, modelin desteklenen düzeylerini ve varsayılanını tanımlamak için `resolveThinkingProfile(ctx)` açığa çıkarabilir.
- Her profil düzeyinin saklanan kanonik bir `id` değeri vardır (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` veya `max`) ve bir görüntüleme `label` değeri içerebilir. İkili sağlayıcılar `{ id: "low", label: "on" }` kullanır.
- Yayınlanmış eski Hook'lar (`supportsXHighThinking`, `isBinaryThinking` ve `resolveDefaultThinkingLevel`) uyumluluk bağdaştırıcıları olarak kalır, ancak yeni özel düzey kümeleri `resolveThinkingProfile` kullanmalıdır.
- Gateway satırları `thinkingOptions` ve `thinkingDefault` açığa çıkarır; böylece ACP/sohbet istemcileri çalışma zamanı doğrulamasının kullandığı aynı profili işler.
