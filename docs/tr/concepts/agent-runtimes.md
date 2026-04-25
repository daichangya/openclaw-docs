---
read_when:
    - Pi, Codex, ACP veya başka bir yerel ajan çalışma zamanı arasında seçim yapıyorsunuz
    - Durumda veya yapılandırmada sağlayıcı/model/çalışma zamanı etiketleri sizi karıştırıyor
    - Bir yerel harness için destek eşitliğini belgeliyorsunuz
summary: OpenClaw'ın model sağlayıcılarını, modelleri, kanalları ve ajan çalışma zamanlarını nasıl ayırdığı
title: Ajan çalışma zamanları
x-i18n:
    generated_at: "2026-04-25T13:44:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f492209da2334361060f0827c243d5d845744be906db9ef116ea00384879b33
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

Bir **ajan çalışma zamanı**, hazırlanmış bir model döngüsünün sahibi olan bileşendir: istemi
alır, model çıktısını yürütür, yerel araç çağrılarını işler ve
tamamlanan dönüşü OpenClaw'a geri döndürür.

Çalışma zamanları, her ikisi de model
yapılandırmasının yakınında göründüğü için sağlayıcılarla kolayca karıştırılır. Bunlar farklı katmanlardır:

| Katman        | Örnekler                              | Anlamı                                                              |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Sağlayıcı     | `openai`, `anthropic`, `openai-codex` | OpenClaw'ın nasıl kimlik doğruladığı, modelleri keşfettiği ve model başvurularını adlandırdığı |
| Model         | `gpt-5.5`, `claude-opus-4-6`          | Ajan dönüşü için seçilen model                                      |
| Ajan çalışma zamanı | `pi`, `codex`, ACP destekli çalışma zamanları | Hazırlanmış dönüşü yürüten düşük seviyeli döngü                 |
| Kanal         | Telegram, Discord, Slack, WhatsApp    | Mesajların OpenClaw'a girip çıktığı yer                             |

Kodda ve yapılandırmada **harness** sözcüğünü de görürsünüz. Harness, bir
ajan çalışma zamanı sağlayan uygulamadır. Örneğin, paketlenmiş Codex
harness, `codex` çalışma zamanını uygular. Yapılandırma anahtarının adı
uyumluluk için hâlâ `embeddedHarness` olarak kalır, ancak kullanıcıya dönük belgeler ve durum çıktıları
genellikle çalışma zamanı demelidir.

Yaygın Codex kurulumu, `codex` çalışma zamanı ile `openai` sağlayıcısını kullanır:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

Bu, OpenClaw'ın bir OpenAI model başvurusu seçtiği ve ardından
paketlenmiş ajan dönüşünü çalıştırmak için Codex uygulama sunucusu
çalışma zamanından istediği anlamına gelir. Bu, kanalın, model
sağlayıcı kataloğunun veya OpenClaw oturum deposunun Codex olduğu anlamına gelmez.

OpenAI ailesi önek ayrımı için [OpenAI](/tr/providers/openai) ve
[Model sağlayıcıları](/tr/concepts/model-providers) bölümlerine bakın. Codex çalışma zamanı destek
sözleşmesi için [Codex harness](/tr/plugins/codex-harness#v1-support-contract) bölümüne bakın.

## Çalışma zamanı sahipliği

Farklı çalışma zamanları döngünün farklı miktarlarına sahiptir.

| Yüzey                       | OpenClaw PI embedded                    | Codex app-server                                                            |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Model döngüsü sahibi        | PI embedded runner üzerinden OpenClaw   | Codex app-server                                                            |
| Kanonik iş parçacığı durumu | OpenClaw transcript                     | Codex iş parçacığı, ayrıca OpenClaw transcript yansısı                      |
| OpenClaw dinamik araçları   | Yerel OpenClaw araç döngüsü             | Codex bağdaştırıcısı üzerinden köprülenir                                   |
| Yerel kabuk ve dosya araçları | PI/OpenClaw yolu                      | Codex yerel araçları, desteklendiğinde yerel kancalar üzerinden köprülenir  |
| Bağlam motoru               | Yerel OpenClaw bağlam oluşturma         | OpenClaw projeleri bağlamı Codex dönüşüne derler                            |
| Compaction                  | OpenClaw veya seçilen bağlam motoru     | Codex yerel Compaction, OpenClaw bildirimleri ve yansı bakım ile            |
| Kanal teslimatı             | OpenClaw                                | OpenClaw                                                                    |

Bu sahiplik ayrımı ana tasarım kuralıdır:

- OpenClaw yüzeyin sahibiyse OpenClaw normal Plugin kancası davranışını sağlayabilir.
- Yerel çalışma zamanı yüzeyin sahibiyse OpenClaw'ın çalışma zamanı olaylarına veya yerel kancalara ihtiyacı vardır.
- Yerel çalışma zamanı kanonik iş parçacığı durumunun sahibiyse OpenClaw desteklenmeyen iç yapıları yeniden yazmak yerine bağlamı yansıtmalı ve projelendirmelidir.

## Çalışma zamanı seçimi

OpenClaw, sağlayıcı ve model çözümlemesinden sonra paketlenmiş çalışma zamanını seçer:

1. Bir oturumun kaydedilmiş çalışma zamanı önceliklidir. Yapılandırma değişiklikleri
   mevcut bir transcript'i sıcak şekilde farklı bir yerel iş parçacığı sistemine geçirmez.
2. `OPENCLAW_AGENT_RUNTIME=<id>`, yeni veya sıfırlanmış oturumlar için bu çalışma zamanını zorlar.
3. `agents.defaults.embeddedHarness.runtime` veya
   `agents.list[].embeddedHarness.runtime`, `auto`, `pi` veya `codex` gibi kayıtlı
   bir çalışma zamanı kimliği ayarlayabilir.
4. `auto` modunda, kayıtlı Plugin çalışma zamanları desteklenen sağlayıcı/model
   çiftlerini sahiplenebilir.
5. `auto` modunda hiçbir çalışma zamanı bir dönüşü sahiplenmezse ve `fallback: "pi"` ayarlıysa
   (varsayılan budur), OpenClaw uyumluluk fallback'i olarak Pi kullanır. Eşleşmeyen
   `auto` modu seçiminin bunun yerine başarısız olması için `fallback: "none"` ayarlayın.

Açık Plugin çalışma zamanları varsayılan olarak kapalı şekilde başarısız olur. Örneğin,
`runtime: "codex"`; aynı geçersiz kılma kapsamında `fallback: "pi"` ayarlamadığınız sürece
Codex veya açık bir seçim hatası anlamına gelir. Bir çalışma zamanı geçersiz kılması daha geniş
bir fallback ayarını devralmaz; bu nedenle ajan düzeyindeki `runtime: "codex"`,
varsayılanlar `fallback: "pi"` kullandı diye sessizce tekrar Pi'ye yönlendirilmez.

## Uyumluluk sözleşmesi

Bir çalışma zamanı Pi değilse, hangi OpenClaw yüzeylerini desteklediğini belgelemelidir.
Çalışma zamanı belgeleri için şu biçimi kullanın:

| Soru                                  | Neden önemlidir                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Model döngüsünün sahibi kim?          | Yeniden denemelerin, araç devamının ve nihai yanıt kararlarının nerede gerçekleştiğini belirler   |
| Kanonik iş parçacığı geçmişinin sahibi kim? | OpenClaw'ın geçmişi düzenleyip düzenleyemeyeceğini veya yalnızca yansıtıp yansıtamayacağını belirler |
| OpenClaw dinamik araçları çalışıyor mu? | Mesajlaşma, oturumlar, cron ve OpenClaw'a ait araçlar buna dayanır                               |
| Dinamik araç kancaları çalışıyor mu?  | Plugin'ler, OpenClaw'a ait araçlar etrafında `before_tool_call`, `after_tool_call` ve middleware bekler |
| Yerel araç kancaları çalışıyor mu?    | Kabuk, yama ve çalışma zamanına ait araçlar; ilke ve gözlem için yerel kanca desteğine ihtiyaç duyar |
| Bağlam motoru yaşam döngüsü çalışıyor mu? | Bellek ve bağlam Plugin'leri oluşturma, içeri alma, dönüş sonrası ve Compaction yaşam döngüsüne bağlıdır |
| Hangi Compaction verileri açığa çıkarılıyor? | Bazı Plugin'ler yalnızca bildirimlere ihtiyaç duyarken diğerleri tutulan/çıkarılan meta verilere ihtiyaç duyar |
| Kasıtlı olarak ne desteklenmiyor?     | Yerel çalışma zamanı daha fazla duruma sahip olduğunda kullanıcılar Pi eşdeğerliğini varsaymamalıdır |

Codex çalışma zamanı destek sözleşmesi
[Codex harness](/tr/plugins/codex-harness#v1-support-contract) bölümünde belgelenmiştir.

## Durum etiketleri

Durum çıktısı hem `Execution` hem de `Runtime` etiketlerini gösterebilir. Bunları
sağlayıcı adları olarak değil, tanılama bilgileri olarak okuyun.

- `openai/gpt-5.5` gibi bir model başvurusu size seçilen sağlayıcı/modeli söyler.
- `codex` gibi bir çalışma zamanı kimliği, dönüşü hangi döngünün yürüttüğünü söyler.
- Telegram veya Discord gibi bir kanal etiketi, konuşmanın nerede gerçekleştiğini söyler.

Çalışma zamanı yapılandırmasını değiştirdikten sonra bir oturum hâlâ Pi gösteriyorsa
`/new` ile yeni bir oturum başlatın veya `/reset` ile geçerli oturumu temizleyin. Mevcut oturumlar
kaydedilmiş çalışma zamanlarını korur; böylece bir transcript uyumsuz iki yerel
oturum sistemi üzerinden yeniden oynatılmaz.

## İlgili

- [Codex harness](/tr/plugins/codex-harness)
- [OpenAI](/tr/providers/openai)
- [Ajan harness Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Ajan döngüsü](/tr/concepts/agent-loop)
- [Modeller](/tr/concepts/models)
- [Durum](/tr/cli/status)
