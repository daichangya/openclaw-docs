---
read_when:
    - Düşünme, hızlı mod veya ayrıntılı yönerge ayrıştırmasını ya da varsayılanlarını ayarlama
summary: '`/think`, `/fast`, `/verbose`, `/trace` için yönerge sözdizimi ve akıl yürütme görünürlüğü'
title: Düşünme Düzeyleri
x-i18n:
    generated_at: "2026-04-23T13:58:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4efe899f7b47244745a105583b3239effa7975fadd06bd7bcad6327afcc91207
    source_path: tools/thinking.md
    workflow: 15
---

# Düşünme Düzeyleri (`/think` yönergeleri)

## Ne yapar

- Herhangi bir gelen gövdede satır içi yönerge: `/t <level>`, `/think:<level>` veya `/thinking <level>`.
- Düzeyler (takma adlar): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “çok düşün”
  - medium → “daha çok düşün”
  - high → “ultrathink” (maksimum bütçe)
  - xhigh → “ultrathink+” (GPT-5.2 + Codex modelleri ve Anthropic Claude Opus 4.7 çabası)
  - adaptive → sağlayıcı tarafından yönetilen uyarlanabilir düşünme (Anthropic/Bedrock üzerindeki Claude 4.6 ve Anthropic Claude Opus 4.7 için desteklenir)
  - max → sağlayıcının maksimum akıl yürütmesi (şu anda Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` ve `extra_high`, `xhigh` ile eşlenir.
  - `highest`, `high` ile eşlenir.
- Sağlayıcı notları:
  - Düşünme menüleri ve seçicileri, sağlayıcı profiline göre belirlenir. Sağlayıcı Plugin'leri, `on` gibi ikili etiketler dahil seçili model için tam düzey kümesini bildirir.
  - `adaptive`, `xhigh` ve `max` yalnızca bunları destekleyen sağlayıcı/model profilleri için gösterilir. Desteklenmeyen düzeyler için yazılmış yönergeler, o modelin geçerli seçenekleriyle birlikte reddedilir.
  - Daha önce kaydedilmiş ama desteklenmeyen düzeyler, sağlayıcı profili sıralamasına göre yeniden eşlenir. `adaptive`, uyarlanabilir olmayan modellerde `medium` düzeyine geri düşer; `xhigh` ve `max` ise seçili model için desteklenen en büyük `off` dışı düzeye geri düşer.
  - Anthropic Claude 4.6 modelleri, açık bir düşünme düzeyi ayarlanmamışsa varsayılan olarak `adaptive` kullanır.
  - Anthropic Claude Opus 4.7 varsayılan olarak uyarlanabilir düşünme kullanmaz. Açıkça bir düşünme düzeyi ayarlamadığınız sürece API çaba varsayılanı sağlayıcıya aittir.
  - Anthropic Claude Opus 4.7, `/think xhigh` ifadesini uyarlanabilir düşünme artı `output_config.effort: "xhigh"` olarak eşler; çünkü `/think` bir düşünme yönergesidir ve `xhigh`, Opus 4.7 çaba ayarıdır.
  - Anthropic Claude Opus 4.7 ayrıca `/think max` sunar; bu da sağlayıcıya ait aynı maksimum çaba yoluna eşlenir.
  - OpenAI GPT modelleri, `/think` ifadesini modele özel Responses API çaba desteği üzerinden eşler. `/think off`, yalnızca hedef model bunu destekliyorsa `reasoning.effort: "none"` gönderir; aksi durumda OpenClaw desteklenmeyen bir değer göndermek yerine devre dışı bırakılmış akıl yürütme yükünü atlar.
  - Anthropic uyumlu akış yolundaki MiniMax (`minimax/*`), düşünmeyi model parametrelerinde veya istek parametrelerinde açıkça ayarlamadığınız sürece varsayılan olarak `thinking: { type: "disabled" }` kullanır. Bu, MiniMax’ın yerel olmayan Anthropic akış biçiminden sızan `reasoning_content` deltalarını önler.
  - Z.AI (`zai/*`) yalnızca ikili düşünmeyi (`on`/`off`) destekler. `off` dışındaki her düzey `on` olarak ele alınır (`low` ile eşlenir).
  - Moonshot (`moonshot/*`), `/think off` ifadesini `thinking: { type: "disabled" }`, `off` dışındaki her düzeyi ise `thinking: { type: "enabled" }` olarak eşler. Düşünme etkinken Moonshot yalnızca `tool_choice` için `auto|none` kabul eder; OpenClaw uyumsuz değerleri `auto` olarak normalleştirir.

## Çözümleme sırası

1. Mesajdaki satır içi yönerge (yalnızca o mesaja uygulanır).
2. Oturum geçersiz kılması (yalnızca yönerge içeren bir mesaj gönderilerek ayarlanır).
3. Aracı başına varsayılan (`agents.list[].thinkingDefault` config içinde).
4. Genel varsayılan (`agents.defaults.thinkingDefault` config içinde).
5. Geri dönüş: varsa sağlayıcının bildirdiği varsayılan; aksi halde akıl yürütebilen modeller `medium` ya da o model için desteklenen en yakın `off` dışı düzeye çözülür ve akıl yürütmeyen modeller `off` olarak kalır.

## Oturum varsayılanı ayarlama

- **Yalnızca** yönergeden oluşan bir mesaj gönderin (boşluk olabilir), örneğin `/think:medium` veya `/t high`.
- Bu, geçerli oturum için kalıcı olur (varsayılan olarak gönderici başına); `/think:off` veya oturum boşta kalma sıfırlamasıyla temizlenir.
- Onay yanıtı gönderilir (`Thinking level set to high.` / `Thinking disabled.`). Düzey geçersizse (ör. `/thinking big`), komut bir ipucuyla reddedilir ve oturum durumu değiştirilmez.
- Geçerli düşünme düzeyini görmek için bağımsız olarak `/think` (veya `/think:`) gönderin.

## Aracıya göre uygulama

- **Gömülü Pi**: çözümlenen düzey, süreç içi Pi aracı çalışma zamanına iletilir.

## Hızlı mod (`/fast`)

- Düzeyler: `on|off`.
- Yalnızca yönergeden oluşan mesaj, bir oturum hızlı mod geçersiz kılmasını değiştirir ve `Fast mode enabled.` / `Fast mode disabled.` yanıtını verir.
- Geçerli etkili hızlı mod durumunu görmek için kip belirtmeden `/fast` (veya `/fast status`) gönderin.
- OpenClaw hızlı modu şu sırayla çözümler:
  1. Satır içi/yalnızca yönerge içeren `/fast on|off`
  2. Oturum geçersiz kılması
  3. Aracı başına varsayılan (`agents.list[].fastModeDefault`)
  4. Model başına config: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Geri dönüş: `off`
- `openai/*` için hızlı mod, desteklenen Responses isteklerinde `service_tier=priority` göndererek OpenAI öncelikli işlemeye eşlenir.
- `openai-codex/*` için hızlı mod, Codex Responses üzerinde aynı `service_tier=priority` işaretini gönderir. OpenClaw her iki kimlik doğrulama yolu için tek bir paylaşılan `/fast` anahtarı kullanır.
- `api.anthropic.com` adresine gönderilen OAuth ile kimliği doğrulanmış trafik dahil, doğrudan genel `anthropic/*` istekleri için hızlı mod Anthropic hizmet katmanlarına eşlenir: `/fast on`, `service_tier=auto` ayarlar; `/fast off`, `service_tier=standard_only` ayarlar.
- Anthropic uyumlu yoldaki `minimax/*` için `/fast on` (veya `params.fastMode: true`), `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
- Açık Anthropic `serviceTier` / `service_tier` model parametreleri, her ikisi de ayarlandığında hızlı mod varsayılanını geçersiz kılar. OpenClaw yine de Anthropic olmayan proxy temel URL’leri için Anthropic hizmet katmanı eklemeyi atlar.
- `/status`, hızlı mod yalnızca etkin olduğunda `Fast` gösterir.

## Ayrıntılı yönergeler (`/verbose` veya `/v`)

- Düzeyler: `on` (minimal) | `full` | `off` (varsayılan).
- Yalnızca yönergeden oluşan mesaj oturum ayrıntı düzeyini değiştirir ve `Verbose logging enabled.` / `Verbose logging disabled.` yanıtını verir; geçersiz düzeyler durumu değiştirmeden bir ipucu döndürür.
- `/verbose off`, açık bir oturum geçersiz kılması saklar; bunu Sessions UI içinden `inherit` seçerek temizleyin.
- Satır içi yönerge yalnızca o mesaja uygulanır; aksi halde oturum/genel varsayılanlar geçerlidir.
- Geçerli ayrıntı düzeyini görmek için bağımsız olarak `/verbose` (veya `/verbose:`) gönderin.
- Ayrıntılı mod açıkken, yapılandırılmış araç sonuçları üreten aracılar (Pi, diğer JSON aracılar) her araç çağrısını kendi meta veri mesajı olarak geri gönderir; mümkünse başına `<emoji> <tool-name>: <arg>` eklenir (yol/komut). Bu araç özetleri, her araç başlar başlamaz gönderilir (ayrı baloncuklar hâlinde), akış deltaları olarak değil.
- Araç hata özetleri normal modda görünür kalır, ancak ham hata ayrıntısı sonekleri yalnızca `verbose` değeri `on` veya `full` olduğunda gösterilir.
- `verbose` değeri `full` olduğunda, araç çıktıları tamamlandıktan sonra da iletilir (ayrı baloncuk, güvenli uzunluğa kısaltılmış biçimde). Bir çalışma devam ederken `/verbose on|full|off` değiştirirseniz, sonraki araç baloncukları yeni ayara uyar.

## Plugin izleme yönergeleri (`/trace`)

- Düzeyler: `on` | `off` (varsayılan).
- Yalnızca yönergeden oluşan mesaj, oturum Plugin izleme çıktısını değiştirir ve `Plugin trace enabled.` / `Plugin trace disabled.` yanıtını verir.
- Satır içi yönerge yalnızca o mesaja uygulanır; aksi halde oturum/genel varsayılanlar geçerlidir.
- Geçerli izleme düzeyini görmek için bağımsız olarak `/trace` (veya `/trace:`) gönderin.
- `/trace`, `/verbose` değerinden daha dardır: yalnızca Active Memory hata ayıklama özetleri gibi Plugin sahipliğindeki izleme/hata ayıklama satırlarını gösterir.
- İzleme satırları `/status` içinde ve normal asistan yanıtından sonra takip eden bir tanılama mesajı olarak görünebilir.

## Akıl yürütme görünürlüğü (`/reasoning`)

- Düzeyler: `on|off|stream`.
- Yalnızca yönergeden oluşan mesaj, düşünme bloklarının yanıtlarda gösterilip gösterilmeyeceğini değiştirir.
- Etkin olduğunda akıl yürütme, başında `Reasoning:` bulunan **ayrı bir mesaj** olarak gönderilir.
- `stream` (yalnızca Telegram): yanıt oluşturulurken akıl yürütmeyi Telegram taslak baloncuğuna akıtır, ardından son yanıtı akıl yürütme olmadan gönderir.
- Takma ad: `/reason`.
- Geçerli akıl yürütme düzeyini görmek için bağımsız olarak `/reasoning` (veya `/reasoning:`) gönderin.
- Çözümleme sırası: satır içi yönerge, ardından oturum geçersiz kılması, ardından aracı başına varsayılan (`agents.list[].reasoningDefault`), ardından geri dönüş (`off`).

## İlgili

- Yükseltilmiş mod belgeleri [Elevated mode](/tr/tools/elevated) altında yer alır.

## Heartbeat'ler

- Heartbeat yoklama gövdesi, yapılandırılmış heartbeat istemidir (varsayılan: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Bir heartbeat mesajındaki satır içi yönergeler normal şekilde uygulanır (ancak heartbeat'lerden oturum varsayılanlarını değiştirmekten kaçının).
- Heartbeat teslimi varsayılan olarak yalnızca son yükü gönderir. Ayrı `Reasoning:` mesajını da göndermek için (varsa), `agents.defaults.heartbeat.includeReasoning: true` veya aracı başına `agents.list[].heartbeat.includeReasoning: true` ayarlayın.

## Web sohbet UI

- Sayfa yüklendiğinde web sohbet düşünme seçicisi, gelen oturum deposu/config içindeki oturumda saklanan düzeyi yansıtır.
- Başka bir düzey seçmek, `sessions.patch` aracılığıyla oturum geçersiz kılmasını hemen yazar; bir sonraki gönderimi beklemez ve tek seferlik bir `thinkingOnce` geçersiz kılması değildir.
- İlk seçenek her zaman `Default (<resolved level>)` olur; burada çözümlenen varsayılan, etkin oturum modelinin sağlayıcı düşünme profilinden ve `/status` ile `session_status` tarafından kullanılan aynı geri dönüş mantığından gelir.
- Seçici, Gateway oturum satırı tarafından döndürülen `thinkingOptions` değerlerini kullanır. Tarayıcı UI kendi sağlayıcı regex listesini tutmaz; modele özgü düzey kümelerinin sahibi Plugin'lerdir.
- `/think:<level>` hâlâ çalışır ve oturumda saklanan aynı düzeyi günceller; böylece sohbet yönergeleri ve seçici senkronize kalır.

## Sağlayıcı profilleri

- Sağlayıcı Plugin'leri, modelin desteklenen düzeylerini ve varsayılanını tanımlamak için `resolveThinkingProfile(ctx)` sunabilir.
- Her profil düzeyinin saklanan kurallı bir `id` değeri vardır (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` veya `max`) ve bir görüntüleme `label` değeri içerebilir. İkili sağlayıcılar `{ id: "low", label: "on" }` kullanır.
- Yayınlanmış eski kancalar (`supportsXHighThinking`, `isBinaryThinking` ve `resolveDefaultThinkingLevel`) uyumluluk bağdaştırıcıları olarak kalır, ancak yeni özel düzey kümeleri `resolveThinkingProfile` kullanmalıdır.
- Gateway satırları `thinkingOptions` ve `thinkingDefault` değerlerini açığa çıkarır; böylece ACP/sohbet istemcileri, çalışma zamanı doğrulamasının kullandığı aynı profili işler.
