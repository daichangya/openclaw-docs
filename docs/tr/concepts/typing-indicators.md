---
read_when:
    - Yazıyor göstergesi davranışını veya varsayılanlarını değiştirme
summary: OpenClaw yazıyor göstergelerini ne zaman gösterir ve bunlar nasıl ayarlanır
title: Yazıyor Göstergeleri
x-i18n:
    generated_at: "2026-04-22T08:54:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e7e8ca448b6706b6f53fcb6a582be6d4a84715c82dfde3d53abe4268af3ae0d
    source_path: concepts/typing-indicators.md
    workflow: 15
---

# Yazıyor göstergeleri

Bir çalıştırma etkinken sohbet kanalına yazıyor göstergeleri gönderilir. Yazmanın **ne zaman** başladığını denetlemek için `agents.defaults.typingMode`, **ne sıklıkta** yenilendiğini denetlemek için ise `typingIntervalSeconds` kullanın.

## Varsayılanlar

`agents.defaults.typingMode` **ayarlanmamışsa**, OpenClaw eski davranışı korur:

- **Doğrudan sohbetler**: model döngüsü başlar başlamaz yazma başlar.
- **Bahsetme içeren grup sohbetleri**: yazma hemen başlar.
- **Bahsetme içermeyen grup sohbetleri**: yazma yalnızca mesaj metni akmaya başladığında başlar.
- **Heartbeat çalıştırmaları**: çözümlenen Heartbeat hedefi yazmayı destekleyen bir sohbetse ve yazma devre dışı bırakılmamışsa, yazma Heartbeat çalıştırması başladığında başlar.

## Modlar

`agents.defaults.typingMode` değerini şunlardan biri olarak ayarlayın:

- `never` — hiçbir zaman yazıyor göstergesi yok.
- `instant` — çalıştırma daha sonra yalnızca sessiz yanıt belirtecini döndürse bile, yazmayı **model döngüsü başlar başlamaz** başlatır.
- `thinking` — yazmayı **ilk akıl yürütme deltasıyla** başlatır (`reasoningLevel: "stream"` gerektirir).
- `message` — yazmayı **ilk sessiz olmayan metin deltasıyla** başlatır (`NO_REPLY` sessiz belirtecini yok sayar).

“Ne kadar erken tetiklendiği” sırası:
`never` → `message` → `thinking` → `instant`

## Yapılandırma

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

Modu veya aralığı oturum başına geçersiz kılabilirsiniz:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Notlar

- `message` modu, tüm yük tam olarak sessiz belirteç olduğunda sessiz-yalnızca yanıtlar için yazıyor göstergesi göstermez (örneğin `NO_REPLY` / `no_reply`, büyük/küçük harf duyarsız eşleştirilir).
- `thinking` yalnızca çalıştırma akıl yürütmeyi akıtırsa tetiklenir (`reasoningLevel: "stream"`). Model akıl yürütme deltaları üretmezse, yazma başlamaz.
- Heartbeat yazıyor göstergesi, çözümlenen teslim hedefi için bir canlılık sinyalidir. `message` veya `thinking` akış zamanlamasını izlemek yerine Heartbeat çalıştırması başlarken başlar. Bunu devre dışı bırakmak için `typingMode: "never"` ayarlayın.
- `target: "none"` olduğunda, hedef çözümlenemediğinde, Heartbeat için sohbet teslimi devre dışı bırakıldığında veya kanal yazmayı desteklemediğinde Heartbeat yazıyor göstergesi göstermez.
- `typingIntervalSeconds`, başlama zamanını değil, **yenileme aralığını** denetler. Varsayılan değer 6 saniyedir.
