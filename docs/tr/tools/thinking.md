---
read_when:
    - Düşünme, hızlı mod veya ayrıntılı yönerge ayrıştırmasını ya da varsayılanlarını ayarlama
summary: '`/think`, `/fast`, `/verbose`, `/trace` ve muhakeme görünürlüğü için yönerge söz dizimi'
title: Düşünme Düzeyleri
x-i18n:
    generated_at: "2026-04-21T19:21:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: c77f6f1318c428bbd21725ea5f32f8088506a10cbbf5b5cbca5973c72a5a81f9
    source_path: tools/thinking.md
    workflow: 15
---

# Düşünme Düzeyleri (`/think` yönergeleri)

## Ne yapar

- Herhangi bir gelen gövdedeki satır içi yönerge: `/t <level>`, `/think:<level>` veya `/thinking <level>`.
- Düzeyler (takma adlar): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (en yüksek bütçe)
  - xhigh → “ultrathink+” (GPT-5.2 + Codex modelleri ve Anthropic Claude Opus 4.7 çabası)
  - adaptive → sağlayıcı tarafından yönetilen uyarlanabilir düşünme (Anthropic/Bedrock üzerindeki Claude 4.6 ve Anthropic Claude Opus 4.7 için desteklenir)
  - max → sağlayıcının en yüksek muhakemesi (şu anda Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` ve `extra_high`, `xhigh` olarak eşlenir.
  - `highest`, `high` olarak eşlenir.
- Sağlayıcı notları:
  - Düşünme menüleri ve seçicileri sağlayıcı profil odaklıdır. Sağlayıcı Plugin'leri, `on` gibi ikili etiketler de dahil olmak üzere seçili model için tam düzey kümesini bildirir.
  - `adaptive`, `xhigh` ve `max`, yalnızca bunları destekleyen sağlayıcı/model profilleri için gösterilir. Desteklenmeyen düzeyler için yazılmış yönergeler, o modelin geçerli seçenekleriyle birlikte reddedilir.
  - Mevcut kayıtlı ancak desteklenmeyen düzeyler, sağlayıcı profil sıralamasına göre yeniden eşlenir. `adaptive`, uyarlanabilir olmayan modellerde `medium` düzeyine geri düşer; `xhigh` ve `max` ise seçili model için desteklenen `off` dışındaki en yüksek düzeye geri düşer.
  - Anthropic Claude 4.6 modelleri, açık bir düşünme düzeyi ayarlanmadığında varsayılan olarak `adaptive` kullanır.
  - Anthropic Claude Opus 4.7 varsayılan olarak uyarlanabilir düşünme kullanmaz. Açıkça bir düşünme düzeyi ayarlamadığınız sürece API effort varsayılanı sağlayıcıya aittir.
  - Anthropic Claude Opus 4.7, `/think xhigh` ifadesini uyarlanabilir düşünme artı `output_config.effort: "xhigh"` olarak eşler; çünkü `/think` bir düşünme yönergesidir ve `xhigh`, Opus 4.7 effort ayarıdır.
  - Anthropic Claude Opus 4.7 ayrıca `/think max` sunar; bu da aynı sağlayıcıya ait en yüksek effort yoluna eşlenir.
  - OpenAI GPT modelleri, `/think` ifadesini modele özgü Responses API effort desteği üzerinden eşler. `/think off`, yalnızca hedef model bunu destekliyorsa `reasoning.effort: "none"` gönderir; aksi halde OpenClaw desteklenmeyen bir değer göndermek yerine devre dışı reasoning payload'unu atlar.
  - Anthropic uyumlu akış yolundaki MiniMax (`minimax/*`), model parametrelerinde veya istek parametrelerinde açıkça düşünme ayarlamadığınız sürece varsayılan olarak `thinking: { type: "disabled" }` kullanır. Bu, MiniMax'ın yerel olmayan Anthropic akış biçiminden sızan `reasoning_content` delta'larını önler.
  - Z.AI (`zai/*`) yalnızca ikili düşünmeyi destekler (`on`/`off`). `off` dışındaki herhangi bir düzey `on` olarak ele alınır (`low` olarak eşlenir).
  - Moonshot (`moonshot/*`), `/think off` ifadesini `thinking: { type: "disabled" }`, `off` dışındaki herhangi bir düzeyi ise `thinking: { type: "enabled" }` olarak eşler. Düşünme etkin olduğunda Moonshot yalnızca `tool_choice` `auto|none` kabul eder; OpenClaw uyumsuz değerleri `auto` olarak normalize eder.

## Çözümleme sırası

1. İleti üzerindeki satır içi yönerge (yalnızca o iletiye uygulanır).
2. Oturum geçersiz kılması (yalnızca yönerge içeren bir ileti gönderilerek ayarlanır).
3. Agent başına varsayılan (`config` içindeki `agents.list[].thinkingDefault`).
4. Genel varsayılan (`config` içindeki `agents.defaults.thinkingDefault`).
5. Geri dönüş: varsa sağlayıcının bildirdiği varsayılan; reasoning özellikli olarak işaretlenen diğer katalog modelleri için `low`; aksi halde `off`.

## Oturum varsayılanı ayarlama

- **Yalnızca** yönergeden oluşan bir ileti gönderin (boşluklara izin verilir), örneğin `/think:medium` veya `/t high`.
- Bu, geçerli oturum için kalıcı olur (varsayılan olarak gönderici başına); `/think:off` veya oturum boşta kalma sıfırlaması ile temizlenir.
- Onay yanıtı gönderilir (`Thinking level set to high.` / `Thinking disabled.`). Düzey geçersizse (ör. `/thinking big`), komut bir ipucuyla reddedilir ve oturum durumu değiştirilmeden kalır.
- Geçerli düşünme düzeyini görmek için argümansız `/think` (veya `/think:`) gönderin.

## Agent tarafından uygulanması

- **Gömülü Pi**: çözümlenen düzey, süreç içi Pi agent çalışma zamanına iletilir.

## Hızlı mod (`/fast`)

- Düzeyler: `on|off`.
- Yalnızca yönerge içeren ileti, oturum hızlı mod geçersiz kılmasını açıp kapatır ve `Fast mode enabled.` / `Fast mode disabled.` yanıtını verir.
- Geçerli etkin hızlı mod durumunu görmek için modsuz `/fast` (veya `/fast status`) gönderin.
- OpenClaw hızlı modu şu sırayla çözümler:
  1. Satır içi/yalnızca yönerge `/fast on|off`
  2. Oturum geçersiz kılması
  3. Agent başına varsayılan (`agents.list[].fastModeDefault`)
  4. Model başına yapılandırma: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Geri dönüş: `off`
- `openai/*` için hızlı mod, desteklenen Responses isteklerinde `service_tier=priority` göndererek OpenAI öncelikli işlemeye eşlenir.
- `openai-codex/*` için hızlı mod, Codex Responses üzerinde aynı `service_tier=priority` bayrağını gönderir. OpenClaw, her iki kimlik doğrulama yolu için de tek bir paylaşılan `/fast` anahtarı tutar.
- `api.anthropic.com` adresine gönderilen OAuth kimlik doğrulamalı trafik dahil, doğrudan genel `anthropic/*` istekleri için hızlı mod Anthropic hizmet katmanlarına eşlenir: `/fast on`, `service_tier=auto`; `/fast off`, `service_tier=standard_only` ayarlar.
- Anthropic uyumlu yoldaki `minimax/*` için `/fast on` (veya `params.fastMode: true`), `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
- Her ikisi de ayarlıysa, açık Anthropic `serviceTier` / `service_tier` model parametreleri hızlı mod varsayılanını geçersiz kılar. OpenClaw, Anthropic olmayan proxy temel URL'leri için Anthropic hizmet katmanı eklemesini yine de atlar.

## Ayrıntılı yönergeler (`/verbose` veya `/v`)

- Düzeyler: `on` (minimal) | `full` | `off` (varsayılan).
- Yalnızca yönerge içeren ileti, oturum ayrıntı düzeyini açıp kapatır ve `Verbose logging enabled.` / `Verbose logging disabled.` yanıtını verir; geçersiz düzeyler durumu değiştirmeden bir ipucu döndürür.
- `/verbose off`, açık bir oturum geçersiz kılması saklar; bunu Sessions UI içinden `inherit` seçerek temizleyin.
- Satır içi yönerge yalnızca o iletiyi etkiler; diğer durumlarda oturum/genel varsayılanlar uygulanır.
- Geçerli ayrıntı düzeyini görmek için argümansız `/verbose` (veya `/verbose:`) gönderin.
- Ayrıntılı mod açık olduğunda, yapılandırılmış araç sonuçları üreten agent'lar (Pi, diğer JSON agent'ları), her araç çağrısını kendi başına yalnızca meta veri içeren bir ileti olarak geri gönderir; varsa `<emoji> <tool-name>: <arg>` ile öneklenir (yol/komut). Bu araç özetleri, her araç başladığında gönderilir (ayrı baloncuklar olarak), akış delta'ları olarak değil.
- Araç hata özeti normal modda görünür kalır, ancak ham hata ayrıntısı sonekleri `verbose` `on` veya `full` olmadıkça gizlenir.
- `verbose` `full` olduğunda, araç çıktıları da tamamlandıktan sonra iletilir (ayrı baloncuk olarak, güvenli bir uzunluğa kısaltılmış biçimde). Bir çalışma sürerken `/verbose on|full|off` arasında geçiş yaparsanız, sonraki araç baloncukları yeni ayara uyar.

## Plugin izleme yönergeleri (`/trace`)

- Düzeyler: `on` | `off` (varsayılan).
- Yalnızca yönerge içeren ileti, oturum Plugin izleme çıktısını açıp kapatır ve `Plugin trace enabled.` / `Plugin trace disabled.` yanıtını verir.
- Satır içi yönerge yalnızca o iletiyi etkiler; diğer durumlarda oturum/genel varsayılanlar uygulanır.
- Geçerli izleme düzeyini görmek için argümansız `/trace` (veya `/trace:`) gönderin.
- `/trace`, `/verbose` seçeneğinden daha dardır: yalnızca Plugin'e ait izleme/hata ayıklama satırlarını, örneğin Active Memory hata ayıklama özetlerini gösterir.
- İzleme satırları `/status` içinde ve normal assistant yanıtından sonra gelen takip tanılama iletisi olarak görünebilir.

## Muhakeme görünürlüğü (`/reasoning`)

- Düzeyler: `on|off|stream`.
- Yalnızca yönerge içeren ileti, yanıtlarda düşünme bloklarının gösterilip gösterilmeyeceğini açıp kapatır.
- Etkinleştirildiğinde, muhakeme `Reasoning:` önekiyle **ayrı bir ileti** olarak gönderilir.
- `stream` (yalnızca Telegram): reasoning'i yanıt üretilirken Telegram taslak baloncuğuna akıtır, ardından reasoning olmadan son yanıtı gönderir.
- Takma ad: `/reason`.
- Geçerli reasoning düzeyini görmek için argümansız `/reasoning` (veya `/reasoning:`) gönderin.
- Çözümleme sırası: satır içi yönerge, ardından oturum geçersiz kılması, ardından agent başına varsayılan (`agents.list[].reasoningDefault`), ardından geri dönüş (`off`).

## İlgili

- Elevated mode belgeleri [Elevated mode](/tr/tools/elevated) içinde yer alır.

## Heartbeat'ler

- Heartbeat probe gövdesi, yapılandırılmış heartbeat istemidir (varsayılan: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Bir heartbeat iletisindeki satır içi yönergeler her zamanki gibi uygulanır (ancak heartbeat'lerden oturum varsayılanlarını değiştirmekten kaçının).
- Heartbeat teslimi varsayılan olarak yalnızca son payload'u gönderir. Ayrı `Reasoning:` iletisini de göndermek için (varsa), `agents.defaults.heartbeat.includeReasoning: true` veya agent başına `agents.list[].heartbeat.includeReasoning: true` ayarlayın.

## Web sohbet UI

- Web sohbet düşünme seçicisi, sayfa yüklendiğinde gelen oturum deposu/yapılandırmasından oturumun kayıtlı düzeyini yansıtır.
- Başka bir düzey seçmek, oturum geçersiz kılmasını hemen `sessions.patch` ile yazar; bir sonraki gönderimi beklemez ve tek seferlik bir `thinkingOnce` geçersiz kılması değildir.
- İlk seçenek her zaman `Default (<resolved level>)` olur; burada çözümlenen varsayılan, etkin oturum modelinin sağlayıcı düşünme profilinden gelir.
- Seçici, gateway oturum satırı tarafından döndürülen `thinkingOptions` değerini kullanır. Tarayıcı UI kendi sağlayıcı regex listesini tutmaz; modele özgü düzey kümeleri Plugin'lere aittir.
- `/think:<level>` hâlâ çalışır ve aynı kayıtlı oturum düzeyini günceller; böylece sohbet yönergeleri ve seçici senkronize kalır.

## Sağlayıcı profilleri

- Sağlayıcı Plugin'leri, modelin desteklenen düzeylerini ve varsayılanını tanımlamak için `resolveThinkingProfile(ctx)` sunabilir.
- Her profil düzeyinin kayıtlı kanonik bir `id` değeri vardır (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` veya `max`) ve bir görüntüleme `label` değeri içerebilir. İkili sağlayıcılar `{ id: "low", label: "on" }` kullanır.
- Yayımlanmış eski hook'lar (`supportsXHighThinking`, `isBinaryThinking` ve `resolveDefaultThinkingLevel`) uyumluluk bağdaştırıcıları olarak kalır, ancak yeni özel düzey kümeleri `resolveThinkingProfile` kullanmalıdır.
- Gateway satırları `thinkingOptions` ve `thinkingDefault` değerlerini gösterir; böylece ACP/sohbet istemcileri çalışma zamanı doğrulamasının kullandığı aynı profili işler.
