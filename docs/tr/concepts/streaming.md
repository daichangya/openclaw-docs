---
read_when:
    - Kanallarda akışın veya parçalamanın nasıl çalıştığını açıklama
    - Blok akışını veya kanal parçalama davranışını değiştirme
    - Yinelenen/erken blok yanıtları veya kanal önizleme akışında hata ayıklama
summary: Akış + parçalama davranışı (blok yanıtlar, kanal önizleme akışı, mod eşleme)
title: Akış ve parçalama
x-i18n:
    generated_at: "2026-04-25T13:45:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba308b79b12886f3a1bc36bc277e3df0e2b9c6018aa260b432ccea89a235819f
    source_path: concepts/streaming.md
    workflow: 15
---

OpenClaw'ın iki ayrı akış katmanı vardır:

- **Blok akışı (kanallar):** asistan yazarken tamamlanmış **blokları** yayımlar. Bunlar normal kanal mesajlarıdır (token deltaları değildir).
- **Önizleme akışı (Telegram/Discord/Slack):** oluşturma sırasında geçici bir **önizleme mesajını** günceller.

Bugün kanal mesajlarına **gerçek token-delta akışı** yoktur. Önizleme akışı mesaj tabanlıdır (gönder + düzenleme/ekleme).

## Blok akışı (kanal mesajları)

Blok akışı, asistan çıktısını kullanılabilir oldukça kaba parçalarda gönderir.

```
Model çıktısı
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker, arabellek büyüdükçe bloklar yayımlar
       └─ (blockStreamingBreak=message_end)
            └─ chunker, message_end anında temizler
                   └─ kanal gönderimi (blok yanıtları)
```

Gösterim:

- `text_delta/events`: model akış olayları (akışsız modeller için seyrek olabilir).
- `chunker`: min/max sınırları + kesme tercihi uygulayan `EmbeddedBlockChunker`.
- `channel send`: gerçek giden mesajlar (blok yanıtları).

**Denetimler:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (varsayılan kapalı).
- Kanal geçersiz kılmaları: kanal başına `"on"`/`"off"` zorlamak için `*.blockStreaming` (ve hesap başına varyantlar).
- `agents.defaults.blockStreamingBreak`: `"text_end"` veya `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (göndermeden önce akış bloklarını birleştirir).
- Kanal üst sınırı: `*.textChunkLimit` (örneğin `channels.whatsapp.textChunkLimit`).
- Kanal parçalama modu: `*.chunkMode` (`length` varsayılan, `newline` ise uzunluk parçalamadan önce boş satırlarda (paragraf sınırlarında) böler).
- Discord yumuşak sınırı: `channels.discord.maxLinesPerMessage` (varsayılan 17), arayüzde kırpmayı önlemek için uzun yanıtları böler.

**Sınır semantiği:**

- `text_end`: chunker yayımlar yayımlamaz blokları akışla; her `text_end` anında temizler.
- `message_end`: asistan mesajı bitene kadar bekler, sonra arabellekli çıktıyı temizler.

`message_end`, arabellekli metin `maxChars` değerini aşarsa yine chunker kullanır; yani sonda birden fazla parça yayımlayabilir.

### Blok akışıyla medya teslimatı

`MEDIA:` yönergeleri normal teslimat meta verileridir. Blok akışı bir
medya bloğunu erken gönderdiğinde, OpenClaw o teslimatı bu dönüş için hatırlar. Nihai
asistan payload'u aynı medya URL'sini tekrar ederse, nihai teslimat eki yeniden göndermek yerine
yinelenen medyayı çıkarır.

Tam olarak yinelenen nihai payload'lar bastırılır. Nihai payload, zaten
akışla gönderilmiş medyanın çevresine farklı metin eklerse, OpenClaw yine yeni metni gönderir
ama medyayı tek teslimatta tutar. Bu, bir ajan akış sırasında `MEDIA:` yayımladığında
ve sağlayıcı bunu tamamlanan yanıtta da içerdiğinde Telegram gibi kanallarda
yinelenen sesli notları veya dosyaları önler.

## Parçalama algoritması (alt/üst sınırlar)

Blok parçalama `EmbeddedBlockChunker` ile uygulanır:

- **Alt sınır:** arabellek >= `minChars` olana kadar yayımlama (zorlanmadıkça).
- **Üst sınır:** `maxChars` öncesinde bölmeyi tercih eder; zorlanırsa `maxChars` noktasında böler.
- **Kesme tercihi:** `paragraph` → `newline` → `sentence` → `whitespace` → sert kesme.
- **Kod çitleri:** çitlerin içinde asla bölmez; `maxChars` noktasında zorla bölündüğünde Markdown geçerli kalsın diye çiti kapatıp yeniden açar.

`maxChars`, kanal `textChunkLimit` değerine kıstırılır; yani kanal başına sınırları aşamazsınız.

## Birleştirme (akış bloklarını birleştirme)

Blok akışı etkin olduğunda OpenClaw, gönderimden önce **ardışık blok parçalarını**
birleştirebilir. Bu, aşamalı çıktı sağlamaya devam ederken
“tek satırlık spam”i azaltır.

- Birleştirme, temizlemeden önce **boşta kalma aralıklarını** (`idleMs`) bekler.
- Arabellekler `maxChars` ile sınırlandırılır ve bunu aşarlarsa temizlenir.
- `minChars`, yeterli metin birikene kadar küçük parçaların gönderilmesini önler
  (nihai temizleme her zaman kalan metni gönderir).
- Birleştirici, `blockStreamingChunk.breakPreference` değerinden türetilir
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → boşluk).
- Kanal geçersiz kılmaları `*.blockStreamingCoalesce` üzerinden kullanılabilir (hesap başına yapılandırmalar dahil).
- Varsayılan birleştirme `minChars`, geçersiz kılınmadıkça Signal/Slack/Discord için 1500'e yükseltilir.

## Bloklar arasında insan benzeri tempo

Blok akışı etkin olduğunda, blok yanıtları arasına
rastgele bir duraklama ekleyebilirsiniz (ilk bloktan sonra). Bu, çok baloncuklu yanıtların
daha doğal hissettirmesini sağlar.

- Yapılandırma: `agents.defaults.humanDelay` (ajan başına geçersiz kılma için `agents.list[].humanDelay`).
- Modlar: `off` (varsayılan), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Yalnızca **blok yanıtlarına** uygulanır; nihai yanıtlar veya araç özetlerine uygulanmaz.

## "Parçaları akışla gönder veya her şeyi gönder"

Bu, şuna eşlenir:

- **Parçaları akışla gönder:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (ilerledikçe yayımla). Telegram dışındaki kanallarda ayrıca `*.blockStreaming: true` gerekir.
- **Her şeyi sonda akışla gönder:** `blockStreamingBreak: "message_end"` (bir kez temizle; çok uzunsa yine birden fazla parça olabilir).
- **Blok akışı yok:** `blockStreamingDefault: "off"` (yalnızca nihai yanıt).

**Kanal notu:** Blok akışı, `*.blockStreaming` açıkça `true` olarak ayarlanmadıkça **kapalıdır**. Kanallar blok yanıtları olmadan da canlı önizleme
akışı yapabilir (`channels.<channel>.streaming`).

Yapılandırma konumu hatırlatması: `blockStreaming*` varsayılanları kök yapılandırmada değil,
`agents.defaults` altında bulunur.

## Önizleme akışı modları

Kanonik anahtar: `channels.<channel>.streaming`

Modlar:

- `off`: önizleme akışını devre dışı bırakır.
- `partial`: en son metinle değiştirilen tek önizleme.
- `block`: parçalı/eklemeli adımlarla önizleme güncellemeleri.
- `progress`: oluşturma sırasında ilerleme/durum önizlemesi, tamamlanınca nihai yanıt.

### Kanal eşlemesi

| Kanal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | `partial` olarak eşlenir |
| Discord    | ✅    | ✅        | ✅      | `partial` olarak eşlenir |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |

Yalnızca Slack:

- `channels.slack.streaming.nativeTransport`, `channels.slack.streaming.mode="partial"` olduğunda Slack yerel akış API çağrılarını açıp kapatır (varsayılan: `true`).
- Slack yerel akışı ve Slack asistan iş parçacığı durumu bir yanıt iş parçacığı hedefi gerektirir; üst düzey DM'ler bu iş parçacığı tarzı önizlemeyi göstermez.

Eski anahtar taşıması:

- Telegram: eski `streamMode` ve skaler/boolean `streaming` değerleri, doctor/config uyumluluk yolları tarafından algılanır ve `streaming.mode` alanına taşınır.
- Discord: `streamMode` + boolean `streaming`, otomatik olarak `streaming` enum'una taşınır.
- Slack: `streamMode` otomatik olarak `streaming.mode` alanına taşınır; boolean `streaming` otomatik olarak `streaming.mode` ve `streaming.nativeTransport` alanlarına taşınır; eski `nativeStreaming` ise otomatik olarak `streaming.nativeTransport` alanına taşınır.

### Çalışma zamanı davranışı

Telegram:

- DM'ler ve grup/başlıklar arasında önizleme güncellemeleri için `sendMessage` + `editMessageText` kullanır.
- Telegram blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır (çifte akışı önlemek için).
- `/reasoning stream`, muhakemeyi önizlemeye yazabilir.

Discord:

- Gönder + düzenle önizleme mesajları kullanır.
- `block` modu taslak parçalama (`draftChunk`) kullanır.
- Discord blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır.
- Nihai medya, hata ve açık-yanıt payload'ları, yeni bir taslağı temizlemeden bekleyen önizlemeleri iptal eder ve ardından normal teslimatı kullanır.

Slack:

- `partial`, kullanılabiliyorsa Slack yerel akışını (`chat.startStream`/`append`/`stop`) kullanabilir.
- `block`, eklemeli taslak önizlemeleri kullanır.
- `progress`, durum önizleme metni kullanır, ardından nihai yanıtı gönderir.
- Yerel ve taslak önizleme akışı, o dönüş için blok yanıtlarını bastırır; böylece bir Slack yanıtı yalnızca bir teslimat yolu üzerinden akışlanır.
- Nihai medya/hata payload'ları ve ilerleme finalleri atılacak taslak mesajlar oluşturmaz; yalnızca önizlemeyi düzenleyebilen metin/blok finalleri bekleyen taslak metni temizler.

Mattermost:

- Düşünmeyi, araç etkinliğini ve kısmi yanıt metnini, nihai yanıt güvenle gönderilebildiğinde yerinde tamamlanan tek bir taslak önizleme gönderisinde akışlar.
- Önizleme gönderisi silinmişse veya tamamlama anında başka şekilde kullanılamıyorsa yeni bir nihai gönderi göndermeye geri döner.
- Nihai medya/hata payload'ları, geçici bir önizleme gönderisini temizlemek yerine normal teslimattan önce bekleyen önizleme güncellemelerini iptal eder.

Matrix:

- Taslak önizlemeler, nihai metin önizleme olayını yeniden kullanabildiğinde yerinde tamamlanır.
- Yalnızca medya, hata ve yanıt-hedefi uyuşmazlığı finalleri, normal teslimattan önce bekleyen önizleme güncellemelerini iptal eder; zaten görünür olan eski bir önizleme redakte edilir.

### Araç ilerleme önizleme güncellemeleri

Önizleme akışı, araçlar çalışırken nihai yanıttan önce aynı önizleme mesajında görünen
“web'de aranıyor”, “dosya okunuyor” veya “araç çağrılıyor” gibi kısa durum satırları olan **araç-ilerleme**
güncellemelerini de içerebilir. Bu, çok adımlı araç dönüşlerini ilk düşünme önizlemesi ile nihai yanıt arasında sessiz kalmak yerine görsel olarak canlı tutar.

Desteklenen yüzeyler:

- **Discord**, **Slack** ve **Telegram**, önizleme akışı etkin olduğunda varsayılan olarak araç-ilerlemeyi canlı önizleme düzenlemesine akışlar.
- Telegram, `v2026.4.22` sürümünden beri araç-ilerleme önizleme güncellemeleri etkin olarak yayınlanmıştır; bunları etkin tutmak bu yayımlanmış davranışı korur.
- **Mattermost**, araç etkinliğini zaten tek taslak önizleme gönderisine katlar (yukarıya bakın).
- Araç-ilerleme düzenlemeleri etkin önizleme akışı modunu izler; önizleme akışı `off` olduğunda veya mesajı blok akışı devraldığında atlanırlar.
- Önizleme akışını koruyup araç-ilerleme satırlarını gizlemek için o kanal için `streaming.preview.toolProgress` değerini `false` yapın. Önizleme düzenlemelerini tamamen devre dışı bırakmak için `streaming.mode` değerini `off` yapın.

Örnek:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": false
        }
      }
    }
  }
}
```

## İlgili

- [Mesajlar](/tr/concepts/messages) — mesaj yaşam döngüsü ve teslimat
- [Yeniden deneme](/tr/concepts/retry) — teslimat hatasında yeniden deneme davranışı
- [Kanallar](/tr/channels) — kanal başına akış desteği
