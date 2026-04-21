---
read_when:
    - Gelen mesajların nasıl yanıtlara dönüştüğünü açıklama
    - Oturumları, kuyruklama modlarını veya akış davranışını netleştirme
    - Akıl yürütme görünürlüğünü ve kullanım etkilerini belgeleme
summary: Mesaj akışı, oturumlar, kuyruklama ve akıl yürütme görünürlüğü
title: Mesajlar
x-i18n:
    generated_at: "2026-04-21T08:58:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f535d01872e7fcf0f3d99a5c5ac01feddbf7fb562ff61d9ccdf18f109f9922f
    source_path: concepts/messages.md
    workflow: 15
---

# Mesajlar

Bu sayfa, OpenClaw'ın gelen mesajları, oturumları, kuyruklamayı,
akışı ve akıl yürütme görünürlüğünü nasıl ele aldığını bir araya getirir.

## Mesaj akışı (üst düzey)

```
Gelen mesaj
  -> yönlendirme/binding'ler -> oturum anahtarı
  -> kuyruk (bir çalıştırma etkinse)
  -> ajan çalıştırması (akış + araçlar)
  -> giden yanıtlar (kanal sınırları + parçalara ayırma)
```

Temel ayarlar yapılandırmada bulunur:

- Önekler, kuyruklama ve grup davranışı için `messages.*`.
- Blok akışı ve parçalara ayırma varsayılanları için `agents.defaults.*`.
- Üst sınırlar ve akış anahtarları için kanal geçersiz kılmaları (`channels.whatsapp.*`, `channels.telegram.*` vb.).

Tam şema için bkz. [Yapılandırma](/tr/gateway/configuration).

## Gelen tekrarlarını ayıklama

Kanallar, yeniden bağlanmalardan sonra aynı mesajı yeniden teslim edebilir. OpenClaw, kanal/hesap/eş/oturum/mesaj kimliğine göre anahtarlanan kısa ömürlü bir önbellek tutar; böylece yinelenen teslimatlar başka bir ajan çalıştırmasını tetiklemez.

## Gelen debounce

**Aynı gönderenden** hızlı arka arkaya gelen mesajlar, `messages.inbound` aracılığıyla tek bir ajan dönüşünde toplu hâle getirilebilir. Debounce, kanal + konuşma başına kapsamlanır ve yanıt iş parçacığı/kimlikleri için en son mesajı kullanır.

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

- Debounce, **yalnızca metin** mesajlarına uygulanır; medya/ekler hemen flush edilir.
- Denetim komutları, bağımsız kalmaları için debounce'u atlar — ancak bir kanal aynı gönderenli DM birleştirmesine açıkça katıldığında (ör. [BlueBubbles `coalesceSameSenderDms`](/tr/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), bölünmüş gönderim yükünün aynı ajan dönüşüne katılabilmesi için DM komutları debounce penceresi içinde bekler.

## Oturumlar ve cihazlar

Oturumların sahibi istemciler değil, gateway'dir.

- Doğrudan sohbetler ajanın ana oturum anahtarında birleşir.
- Gruplar/kanallar kendi oturum anahtarlarını alır.
- Oturum deposu ve transkriptler gateway ana bilgisayarında bulunur.

Birden çok cihaz/kanal aynı oturuma eşlenebilir, ancak geçmiş her istemciye tamamen geri eşitlenmez. Öneri: ayrışan bağlamdan kaçınmak için uzun konuşmalarda tek bir birincil cihaz kullanın. Control UI ve TUI her zaman gateway destekli oturum transkriptini gösterir, bu yüzden doğruluk kaynağı onlardır.

Ayrıntılar: [Oturum yönetimi](/tr/concepts/session).

## Gelen gövdeler ve geçmiş bağlamı

OpenClaw, **prompt gövdesini** **komut gövdesinden** ayırır:

- `Body`: ajana gönderilen prompt metni. Bu, kanal zarflarını ve isteğe bağlı geçmiş sarmalayıcılarını içerebilir.
- `CommandBody`: yönerge/komut ayrıştırma için ham kullanıcı metni.
- `RawBody`: `CommandBody` için eski takma ad (uyumluluk için korunur).

Bir kanal geçmiş sağladığında ortak bir sarmalayıcı kullanır:

- `[Son yanıtınızdan bu yana gelen sohbet mesajları - bağlam için]`
- `[Geçerli mesaj - buna yanıt verin]`

**Doğrudan olmayan sohbetler** için (gruplar/kanallar/odalar), **geçerli mesaj gövdesinin** başına
gönderen etiketi eklenir (geçmiş girdileri için kullanılan stille aynı). Bu, gerçek zamanlı ve kuyruktaki/geçmişteki
mesajları ajan prompt'unda tutarlı kılar.

Geçmiş arabellekleri **yalnızca bekleyenlerdir**: bir çalıştırmayı _tetiklemeyen_
grup mesajlarını (örneğin, mention geçitlemeli mesajlar) içerir ve
zaten oturum transkriptinde bulunan mesajları **hariç tutar**.

Yönerge temizleme yalnızca **geçerli mesaj** bölümüne uygulanır; böylece geçmiş bozulmadan kalır.
Geçmişi saran kanallar, `CommandBody` (veya `RawBody`) alanını özgün mesaj metnine ayarlamalı ve
`Body` alanını birleşik prompt olarak tutmalıdır.
Geçmiş arabellekleri `messages.groupChat.historyLimit` (genel varsayılan)
ve `channels.slack.historyLimit` veya `channels.telegram.accounts.<id>.historyLimit` gibi kanal başına geçersiz kılmalarla yapılandırılabilir (`0` devre dışı bırakır).

## Kuyruklama ve takipler

Bir çalıştırma zaten etkinse, gelen mesajlar kuyruğa alınabilir, geçerli
çalıştırmaya yönlendirilebilir veya bir takip dönüşü için toplanabilir.

- `messages.queue` (ve `messages.queue.byChannel`) ile yapılandırın.
- Modlar: `interrupt`, `steer`, `followup`, `collect` ve backlog varyantları.

Ayrıntılar: [Kuyruklama](/tr/concepts/queue).

## Akış, parçalara ayırma ve toplu işleme

Blok akışı, model metin blokları ürettikçe kısmi yanıtlar gönderir.
Parçalara ayırma, kanal metin sınırlarına uyar ve çitli kodların bölünmesini önler.

Temel ayarlar:

- `agents.defaults.blockStreamingDefault` (`on|off`, varsayılan kapalı)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (boşta kalma tabanlı toplu işleme)
- `agents.defaults.humanDelay` (blok yanıtları arasında insana benzer duraklama)
- Kanal geçersiz kılmaları: `*.blockStreaming` ve `*.blockStreamingCoalesce` (Telegram dışı kanallar açık `*.blockStreaming: true` gerektirir)

Ayrıntılar: [Akış + parçalara ayırma](/tr/concepts/streaming).

## Akıl yürütme görünürlüğü ve token'lar

OpenClaw, model akıl yürütmesini gösterebilir veya gizleyebilir:

- `/reasoning on|off|stream` görünürlüğü kontrol eder.
- Akıl yürütme içeriği, model tarafından üretildiğinde yine de token kullanımına sayılır.
- Telegram, reasoning akışını taslak balonuna destekler.

Ayrıntılar: [Thinking + reasoning yönergeleri](/tr/tools/thinking) ve [Token kullanımı](/tr/reference/token-use).

## Önekler, iş parçacıkları ve yanıtlar

Giden mesaj biçimlendirmesi `messages` içinde merkezileştirilmiştir:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` ve `channels.<channel>.accounts.<id>.responsePrefix` (giden önek kademesi), ayrıca `channels.whatsapp.messagePrefix` (WhatsApp gelen öneki)
- `replyToMode` ve kanal başına varsayılanlar aracılığıyla yanıt iş parçacığı oluşturma

Ayrıntılar: [Yapılandırma](/tr/gateway/configuration-reference#messages) ve kanal belgeleri.

## Sessiz yanıtlar

Tam sessiz belirteç `NO_REPLY` / `no_reply`, “kullanıcının görebileceği bir yanıt teslim etme” anlamına gelir.
OpenClaw bu davranışı konuşma türüne göre çözümler:

- Doğrudan konuşmalar varsayılan olarak sessizliğe izin vermez ve çıplak bir sessiz
  yanıtı kısa, görünür bir fallback'e yeniden yazar.
- Gruplar/kanallar varsayılan olarak sessizliğe izin verir.
- Dahili orkestrasyon varsayılan olarak sessizliğe izin verir.

Varsayılanlar `agents.defaults.silentReply` ve
`agents.defaults.silentReplyRewrite` altında bulunur; `surfaces.<id>.silentReply` ve
`surfaces.<id>.silentReplyRewrite` bunları yüzey başına geçersiz kılabilir.

## İlgili

- [Akış](/tr/concepts/streaming) — gerçek zamanlı mesaj teslimi
- [Yeniden deneme](/tr/concepts/retry) — mesaj teslimi yeniden deneme davranışı
- [Kuyruk](/tr/concepts/queue) — mesaj işleme kuyruğu
- [Kanallar](/tr/channels) — mesajlaşma platformu entegrasyonları
