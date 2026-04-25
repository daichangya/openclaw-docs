---
read_when:
    - Otomatik yanıt yürütmesini veya eşzamanlılığı değiştirme
summary: Gelen otomatik yanıt çalıştırmalarını serileştiren komut kuyruğu tasarımı
title: Komut kuyruğu
x-i18n:
    generated_at: "2026-04-25T13:45:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c027be3e9a67f91a49c5d4d69fa8191d3e7651265a152c4723b10062b339f2a
    source_path: concepts/queue.md
    workflow: 15
---

Gelen otomatik yanıt çalıştırmalarını, birden fazla ajan çalıştırmasının çakışmasını önlemek için küçük bir süreç içi kuyruk üzerinden serileştiriyoruz; bunu yaparken oturumlar arasında güvenli paralelliğe de izin veriyoruz.

## Neden

- Otomatik yanıt çalıştırmaları maliyetli olabilir (LLM çağrıları) ve birden fazla gelen mesaj birbirine yakın zamanda ulaştığında çakışabilir.
- Serileştirme, paylaşılan kaynaklar (oturum dosyaları, günlükler, CLI stdin) için rekabeti önler ve upstream hız sınırlarına takılma olasılığını azaltır.

## Nasıl çalışır

- Hat farkındalıklı bir FIFO kuyruğu, her hattı yapılandırılabilir bir eşzamanlılık sınırıyla boşaltır (yapılandırılmamış hatlar için varsayılan 1; main varsayılanı 4, subagent varsayılanı 8).
- `runEmbeddedPiAgent`, oturum başına yalnızca bir etkin çalıştırmayı garanti etmek için **session key** ile kuyruğa alır (hat `session:<key>`).
- Her oturum çalıştırması daha sonra **global lane** içine (`main` varsayılan) alınır; böylece genel paralellik `agents.defaults.maxConcurrent` ile sınırlandırılır.
- Ayrıntılı günlükleme etkin olduğunda, kuyruktaki çalıştırmalar başlamadan önce yaklaşık 2 saniyeden fazla bekledilerse kısa bir bildirim yayınlar.
- Yazma göstergeleri, sıramızı beklerken kullanıcı deneyimi değişmesin diye (kanal desteklediğinde) kuyruğa alınır alınmaz yine de hemen tetiklenir.

## Kuyruk modları (kanal başına)

Gelen mesajlar geçerli çalıştırmayı yönlendirebilir, bir takip turunu bekleyebilir veya her ikisini de yapabilir:

- `steer`: geçerli çalıştırmaya hemen enjekte eder (bir sonraki araç sınırından sonra bekleyen araç çağrılarını iptal eder). Akış yoksa followup'a geri döner.
- `followup`: geçerli çalıştırma bittikten sonra bir sonraki ajan turu için kuyruğa alınır.
- `collect`: kuyruğa alınmış tüm mesajları **tek bir** takip turunda birleştirir (varsayılan). Mesajlar farklı kanalları/başlıkları hedefliyorsa yönlendirmeyi korumak için ayrı ayrı boşaltılır.
- `steer-backlog` (diğer adıyla `steer+backlog`): şimdi yönlendirir **ve** mesajı bir takip turu için korur.
- `interrupt` (eski): o oturum için etkin çalıştırmayı durdurur, ardından en yeni mesajı çalıştırır.
- `queue` (eski takma ad): `steer` ile aynıdır.

Steer-backlog, yönlendirilmiş çalıştırmadan sonra bir takip yanıtı alabileceğiniz anlamına gelir; bu yüzden akış yüzeylerinde yinelenmiş gibi görünebilir. Gelen mesaj başına tek bir yanıt istiyorsanız `collect`/`steer` tercih edin.
Bağımsız bir komut olarak `/queue collect` gönderin (oturum başına) veya `messages.queue.byChannel.discord: "collect"` ayarlayın.

Varsayılanlar (yapılandırmada ayarlanmamışsa):

- Tüm yüzeyler → `collect`

Genel olarak veya kanal başına `messages.queue` ile yapılandırın:

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Kuyruk seçenekleri

Seçenekler `followup`, `collect` ve `steer-backlog` için geçerlidir (ve `steer` followup'a geri düştüğünde de geçerlidir):

- `debounceMs`: bir takip turu başlatmadan önce durulmayı bekler (“continue, continue” durumunu önler).
- `cap`: oturum başına en fazla kuyruktaki mesaj sayısı.
- `drop`: taşma ilkesi (`old`, `new`, `summarize`).

Summarize, bırakılan mesajların kısa bir madde işaretli listesini tutar ve bunu sentetik bir takip istemi olarak enjekte eder.
Varsayılanlar: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Oturum başına geçersiz kılmalar

- Geçerli oturum için modu saklamak üzere bağımsız komut olarak `/queue <mode>` gönderin.
- Seçenekler birleştirilebilir: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` veya `/queue reset`, oturum geçersiz kılmasını temizler.

## Kapsam ve garantiler

- Gateway yanıt işlem hattını kullanan tüm gelen kanallardaki otomatik yanıt ajan çalıştırmaları için geçerlidir (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat vb.).
- Varsayılan hat (`main`), gelenler + ana Heartbeat'ler için süreç geneli geçerlidir; birden fazla oturuma paralel izin vermek için `agents.defaults.maxConcurrent` ayarlayın.
- Arka plan işlerinin gelen yanıtları engellemeden paralel çalışabilmesi için ek hatlar bulunabilir (ör. `cron`, `subagent`). Bu ayrık çalıştırmalar [background tasks](/tr/automation/tasks) olarak izlenir.
- Oturum başına hatlar, belirli bir oturuma aynı anda yalnızca bir ajan çalıştırmasının dokunacağını garanti eder.
- Harici bağımlılık veya arka plan worker iş parçacığı yoktur; saf TypeScript + promise'ler kullanılır.

## Sorun giderme

- Komutlar takılmış görünüyorsa ayrıntılı günlükleri etkinleştirin ve kuyruğun boşaldığını doğrulamak için “queued for …ms” satırlarını arayın.
- Kuyruk derinliğine ihtiyacınız varsa ayrıntılı günlükleri etkinleştirin ve kuyruk zamanlaması satırlarını izleyin.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Yeniden deneme ilkesi](/tr/concepts/retry)
