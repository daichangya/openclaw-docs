---
read_when:
    - Otomatik Compaction ve `/compact` komutunu anlamak istiyorsunuz
    - Bağlam sınırlarına ulaşan uzun oturumlarda hata ayıklıyorsunuz
summary: OpenClaw'ın model sınırları içinde kalmak için uzun konuşmaları nasıl özetlediği
title: Compaction
x-i18n:
    generated_at: "2026-04-21T08:58:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 382e4a879e65199bd98d7476bff556571e09344a21e909862a34e6029db6d765
    source_path: concepts/compaction.md
    workflow: 15
---

# Compaction

Her modelin bir bağlam penceresi vardır -- yani işleyebileceği en yüksek token sayısı.
Bir konuşma bu sınıra yaklaştığında, OpenClaw sohbetin devam edebilmesi için
eski mesajları bir özete **sıkıştırır**.

## Nasıl çalışır

1. Eski konuşma dönüşleri bir Compaction girdisinde özetlenir.
2. Özet, oturum dökümüne kaydedilir.
3. Son mesajlar olduğu gibi korunur.

OpenClaw geçmişi Compaction parçalarına böldüğünde, asistan araç çağrılarını
eşleşen `toolResult` girdileriyle eşleştirilmiş halde tutar. Bir bölme noktası
bir araç bloğunun içine denk gelirse, OpenClaw sınırı çift birlikte kalacak ve
mevcut özetlenmemiş kuyruk korunacak şekilde kaydırır.

Tam konuşma geçmişi diskte kalır. Compaction yalnızca modelin bir sonraki
dönüşte ne gördüğünü değiştirir.

## Otomatik Compaction

Otomatik Compaction varsayılan olarak açıktır. Oturum bağlam sınırına
yaklaştığında veya model bir bağlam taşması hatası döndürdüğünde çalışır (bu durumda
OpenClaw Compaction yapar ve yeniden dener). Tipik taşma imzaları arasında
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` ve `ollama error: context length
exceeded` bulunur.

<Info>
Compaction yapmadan önce OpenClaw, önemli notları [memory](/tr/concepts/memory)
dosyalarına kaydetmesini aracıya otomatik olarak hatırlatır. Bu, bağlam kaybını önler.
</Info>

Compaction davranışını (mod, hedef token sayısı vb.) yapılandırmak için `openclaw.json` dosyanızdaki `agents.defaults.compaction` ayarını kullanın.
Compaction özetleme varsayılan olarak opak tanımlayıcıları korur (`identifierPolicy: "strict"`). Bunu `identifierPolicy: "off"` ile geçersiz kılabilir veya `identifierPolicy: "custom"` ve `identifierInstructions` ile özel metin sağlayabilirsiniz.

İsteğe bağlı olarak Compaction özetleme için `agents.defaults.compaction.model` üzerinden farklı bir model belirtebilirsiniz. Bu, birincil modeliniz yerel veya küçük bir model olduğunda ve Compaction özetlerinin daha yetenekli bir model tarafından üretilmesini istediğinizde kullanışlıdır. Geçersiz kılma herhangi bir `provider/model-id` dizesini kabul eder:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

Bu, örneğin özetlemeye ayrılmış ikinci bir Ollama modeli veya ince ayarlı bir Compaction uzmanı gibi yerel modellerle de çalışır:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

Ayarlanmadığında, Compaction aracının birincil modelini kullanır.

## Takılabilir Compaction sağlayıcıları

Plugin'ler, plugin API üzerindeki `registerCompactionProvider()` aracılığıyla özel bir Compaction sağlayıcısı kaydedebilir. Bir sağlayıcı kaydedilip yapılandırıldığında, OpenClaw özetlemeyi yerleşik LLM işlem hattı yerine buna devreder.

Kayıtlı bir sağlayıcıyı kullanmak için yapılandırmanızda sağlayıcı kimliğini ayarlayın:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

Bir `provider` ayarlamak otomatik olarak `mode: "safeguard"` kullanımını zorunlu kılar. Sağlayıcılar, yerleşik yol ile aynı Compaction yönergelerini ve tanımlayıcı koruma ilkesini alır; OpenClaw ayrıca sağlayıcı çıktısından sonra son dönüş ve bölünmüş dönüş sonek bağlamını korumaya devam eder. Sağlayıcı başarısız olursa veya boş bir sonuç döndürürse, OpenClaw yerleşik LLM özetlemeye geri döner.

## Otomatik Compaction (varsayılan olarak açık)

Bir oturum modelin bağlam penceresine yaklaştığında veya onu aştığında, OpenClaw otomatik Compaction'ı tetikler ve özgün isteği sıkıştırılmış bağlamı kullanarak yeniden deneyebilir.

Şunları görürsünüz:

- ayrıntılı modda `🧹 Auto-compaction complete`
- `/status` içinde `🧹 Compactions: <count>`

Compaction'dan önce OpenClaw, kalıcı notları diske kaydetmek için sessiz bir
**memory flush** dönüşü çalıştırabilir. Ayrıntılar ve yapılandırma için bkz.
[Memory](/tr/concepts/memory).

## El ile Compaction

Compaction'ı zorlamak için herhangi bir sohbette `/compact` yazın. Özeti
yönlendirmek için yönergeler ekleyin:

```
/compact Focus on the API design decisions
```

## Farklı bir model kullanma

Varsayılan olarak Compaction, aracınızın birincil modelini kullanır. Daha iyi
özetler için daha yetenekli bir model kullanabilirsiniz:

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## Compaction bildirimleri

Varsayılan olarak Compaction sessizce çalışır. Compaction başladığında ve
tamamlandığında kısa bildirimler göstermek için `notifyUser` özelliğini
etkinleştirin:

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

Etkinleştirildiğinde, kullanıcı her Compaction çalıştırması etrafında kısa
durum mesajları görür
(örneğin, "Bağlam sıkıştırılıyor..." ve "Compaction tamamlandı").

## Compaction ve budama

|                  | Compaction                   | Budama                           |
| ---------------- | ---------------------------- | -------------------------------- |
| **Ne yapar**     | Eski konuşmayı özetler       | Eski araç sonuçlarını kırpar     |
| **Kaydedilir mi?** | Evet (oturum dökümünde)    | Hayır (yalnızca bellekte, istek başına) |
| **Kapsam**       | Tüm konuşma                  | Yalnızca araç sonuçları          |

[Oturum budama](/tr/concepts/session-pruning), araç çıktısını özetlemeden kırpan
daha hafif bir tamamlayıcıdır.

## Sorun giderme

**Çok mu sık Compaction yapılıyor?** Modelin bağlam penceresi küçük olabilir veya araç
çıktıları büyük olabilir. [oturum budama](/tr/concepts/session-pruning)
özelliğini etkinleştirmeyi deneyin.

**Compaction'dan sonra bağlam eski mi hissediliyor?** Özeti yönlendirmek için
`/compact Focus on <topic>` kullanın veya notların korunması için
[memory flush](/tr/concepts/memory) özelliğini etkinleştirin.

**Temiz bir başlangıç mı gerekiyor?** `/new`, Compaction yapmadan yeni bir
oturum başlatır.

Gelişmiş yapılandırma için (ayrılmış token'lar, tanımlayıcı koruma, özel
bağlam motorları, OpenAI sunucu tarafı Compaction), bkz.
[Oturum Yönetimi Derinlemesine İnceleme](/tr/reference/session-management-compaction).

## İlgili

- [Oturum](/tr/concepts/session) — oturum yönetimi ve yaşam döngüsü
- [Oturum Budama](/tr/concepts/session-pruning) — araç sonuçlarını kırpma
- [Bağlam](/tr/concepts/context) — aracı dönüşleri için bağlamın nasıl oluşturulduğu
- [Kancalar](/tr/automation/hooks) — Compaction yaşam döngüsü kancaları (`before_compaction`, `after_compaction`)
