---
read_when:
    - Gelen mesajların nasıl yanıta dönüştüğünü açıklama
    - Oturumları, kuyruklama modlarını veya akış davranışını açıklığa kavuşturma
    - Akıl yürütme görünürlüğünü ve kullanım etkilerini belgeleme
summary: Mesaj akışı, oturumlar, kuyruklama ve akıl yürütme görünürlüğü
title: Mesajlar
x-i18n:
    generated_at: "2026-04-23T09:01:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4490d87835f44f703b45b29ad69878fec552caf81f4bd07d29614f71ee15cfb
    source_path: concepts/messages.md
    workflow: 15
---

# Mesajlar

Bu sayfa, OpenClaw'ın gelen mesajları, oturumları, kuyruklamayı,
akışı ve akıl yürütme görünürlüğünü nasıl ele aldığını bir araya getirir.

## Mesaj akışı (üst düzey)

```
Gelen mesaj
  -> yönlendirme/bağlamalar -> oturum anahtarı
  -> kuyruk (bir çalıştırma etkinse)
  -> aracı çalıştırması (akış + araçlar)
  -> giden yanıtlar (kanal sınırları + parçalara ayırma)
```

Temel düğmeler yapılandırmada bulunur:

- Önekler, kuyruklama ve grup davranışı için `messages.*`.
- Blok akışı ve parçalara ayırma varsayılanları için `agents.defaults.*`.
- Sınırlar ve akış anahtarları için kanal geçersiz kılmaları (`channels.whatsapp.*`, `channels.telegram.*` vb.).

Tam şema için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

## Gelen yineleme kaldırma

Kanallar yeniden bağlanmalardan sonra aynı mesajı yeniden teslim edebilir. OpenClaw,
kanal/hesap/eş düzeyi/oturum/mesaj kimliği ile anahtarlanan kısa ömürlü bir önbellek tutar; böylece
yinelenen teslimatlar başka bir aracı çalıştırmasını tetiklemez.

## Gelen debounce

**Aynı göndericiden** hızlı art arda gelen mesajlar, `messages.inbound` aracılığıyla tek bir
aracı dönüşünde toplanabilir. Debounce, kanal + konuşma başına kapsamlanır
ve yanıt iş parçacığı/kimlikleri için en son mesajı kullanır.

Yapılandırma (genel varsayılan + kanal başına geçersiz kılmalar):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

Notlar:

- Debounce **yalnızca metin** mesajlarına uygulanır; medya/ekler hemen boşaltılır.
- Denetim komutları, tek başına kalmaları için debounce'u atlar — **ancak** bir kanal açıkça aynı göndericili DM birleştirmesine izin verirse (örneğin [BlueBubbles `coalesceSameSenderDms`](/tr/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), DM komutları debounce penceresi içinde bekler; böylece bölünmüş gönderim yükü aynı aracı dönüşüne katılabilir.

## Oturumlar ve cihazlar

Oturumlar istemcilere değil, Gateway'e aittir.

- Doğrudan sohbetler aracının ana oturum anahtarında birleşir.
- Gruplar/kanallar kendi oturum anahtarlarını alır.
- Oturum deposu ve dökümler Gateway ana makinesinde bulunur.

Birden fazla cihaz/kanal aynı oturuma eşlenebilir, ancak geçmiş her istemciye tam olarak
geri eşzamanlanmaz. Öneri: bağlam ayrışmasını önlemek için uzun
konuşmalarda tek bir birincil cihaz kullanın. Control UI ve TUI her zaman
Gateway destekli oturum dökümünü gösterir, bu yüzden doğruluk kaynağı onlardır.

Ayrıntılar: [Oturum yönetimi](/tr/concepts/session).

## Gelen gövdeler ve geçmiş bağlamı

OpenClaw, **istem gövdesi** ile **komut gövdesi**ni ayırır:

- `Body`: aracıya gönderilen istem metni. Bu, kanal zarflarını ve
  isteğe bağlı geçmiş sarmalayıcılarını içerebilir.
- `CommandBody`: yönerge/komut ayrıştırması için ham kullanıcı metni.
- `RawBody`: `CommandBody` için eski takma ad (uyumluluk için korunur).

Bir kanal geçmiş sağladığında, paylaşılan bir sarmalayıcı kullanır:

- `[Son yanıtınızdan bu yana sohbet mesajları - bağlam için]`
- `[Geçerli mesaj - buna yanıt verin]`

**Doğrudan olmayan sohbetler** için (gruplar/kanallar/odalar), **geçerli mesaj gövdesi**
gönderici etiketi ile öneklenir (geçmiş girdileri için kullanılan aynı stil). Bu, gerçek zamanlı
ve kuyruktaki/geçmiş mesajlarını aracı isteminde tutarlı hale getirir.

Geçmiş tamponları **yalnızca beklemede olanları** içerir: bunlar çalıştırma _tetiklemeyen_
grup mesajlarını içerir (örneğin, bahsetme geçitli mesajlar) ve **zaten oturum dökümünde bulunan**
mesajları hariç tutar.

Yönerge ayıklama yalnızca **geçerli mesaj** bölümüne uygulanır; böylece geçmiş
bozulmadan kalır. Geçmiş sarmalayan kanallar, `CommandBody` (veya
`RawBody`) değerini özgün mesaj metnine ayarlamalı ve `Body` değerini birleşik istem olarak tutmalıdır.
Geçmiş tamponları `messages.groupChat.historyLimit` (genel
varsayılan) ve `channels.slack.historyLimit` veya `channels.telegram.accounts.<id>.historyLimit` gibi kanal başına geçersiz kılmalar ile yapılandırılabilir (`0` devre dışı bırakır).

## Kuyruklama ve takip mesajları

Bir çalıştırma zaten etkinse, gelen mesajlar kuyruğa alınabilir, geçerli
çalıştırmaya yönlendirilebilir veya takip dönüşü için toplanabilir.

- `messages.queue` (ve `messages.queue.byChannel`) ile yapılandırılır.
- Modlar: `interrupt`, `steer`, `followup`, `collect`, ayrıca backlog varyantları.

Ayrıntılar: [Kuyruklama](/tr/concepts/queue).

## Akış, parçalara ayırma ve toplu gönderim

Blok akışı, model metin blokları üretirken kısmi yanıtlar gönderir.
Parçalara ayırma, kanal metin sınırlarına uyar ve çevrili kodu bölmekten kaçınır.

Temel ayarlar:

- `agents.defaults.blockStreamingDefault` (`on|off`, varsayılan kapalı)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (boşta kalma tabanlı toplu gönderim)
- `agents.defaults.humanDelay` (blok yanıtları arasında insan benzeri duraklama)
- Kanal geçersiz kılmaları: `*.blockStreaming` ve `*.blockStreamingCoalesce` (Telegram dışı kanallar açık `*.blockStreaming: true` gerektirir)

Ayrıntılar: [Akış + parçalara ayırma](/tr/concepts/streaming).

## Akıl yürütme görünürlüğü ve token'lar

OpenClaw model akıl yürütmesini gösterebilir veya gizleyebilir:

- `/reasoning on|off|stream` görünürlüğü kontrol eder.
- Akıl yürütme içeriği, model tarafından üretildiğinde yine de token kullanımına dahil edilir.
- Telegram, taslak baloncuğa akıl yürütme akışını destekler.

Ayrıntılar: [Thinking + akıl yürütme yönergeleri](/tr/tools/thinking) ve [Token kullanımı](/tr/reference/token-use).

## Önekler, iş parçacıkları ve yanıtlar

Giden mesaj biçimlendirmesi `messages` içinde merkezileştirilmiştir:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` ve `channels.<channel>.accounts.<id>.responsePrefix` (giden önek zinciri), ayrıca `channels.whatsapp.messagePrefix` (WhatsApp gelen öneki)
- `replyToMode` ve kanal başına varsayılanlar aracılığıyla yanıt iş parçacığı

Ayrıntılar: [Yapılandırma](/tr/gateway/configuration-reference#messages) ve kanal belgeleri.

## Sessiz yanıtlar

Tam sessiz token `NO_REPLY` / `no_reply`, “kullanıcıya görünür bir yanıt teslim etmeyin” anlamına gelir.
OpenClaw bu davranışı konuşma türüne göre çözümler:

- Doğrudan konuşmalar varsayılan olarak sessizliğe izin vermez ve çıplak sessiz
  yanıtı kısa, görünür bir yedeğe yeniden yazar.
- Gruplar/kanallar varsayılan olarak sessizliğe izin verir.
- Dahili orkestrasyon varsayılan olarak sessizliğe izin verir.

Varsayılanlar `agents.defaults.silentReply` ve
`agents.defaults.silentReplyRewrite` altında bulunur; `surfaces.<id>.silentReply` ve
`surfaces.<id>.silentReplyRewrite` bunları yüzey başına geçersiz kılabilir.

Üst oturumda bekleyen bir veya daha fazla oluşturulmuş alt aracı çalıştırması olduğunda,
çıplak sessiz yanıtlar yeniden yazılmak yerine tüm yüzeylerde düşürülür; böylece
çocuk tamamlama olayı gerçek yanıtı teslim edene kadar üst sessiz kalır.

## İlgili

- [Akış](/tr/concepts/streaming) — gerçek zamanlı mesaj teslimi
- [Yeniden deneme](/tr/concepts/retry) — mesaj teslimi yeniden deneme davranışı
- [Kuyruk](/tr/concepts/queue) — mesaj işleme kuyruğu
- [Kanallar](/tr/channels) — mesajlaşma platformu entegrasyonları
