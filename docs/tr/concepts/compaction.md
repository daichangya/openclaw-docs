---
read_when:
    - Otomatik Compaction ve /compact komutunu anlamak istiyorsunuz
    - Bağlam sınırlarına ulaşan uzun oturumlarda hata ayıklıyorsunuz
summary: OpenClaw'ın model sınırları içinde kalmak için uzun konuşmaları nasıl özetlediği
title: Compaction
x-i18n:
    generated_at: "2026-04-25T13:44:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e396a59d5346355cf2d87cd08ca8550877b103b1c613670fb3908fe1b028170
    source_path: concepts/compaction.md
    workflow: 15
---

Her modelin bir bağlam penceresi vardır -- işleyebileceği en yüksek token sayısı.
Bir konuşma bu sınıra yaklaştığında, OpenClaw eski mesajları bir özete
**Compaction** yaparak sohbetin devam etmesini sağlar.

## Nasıl çalışır

1. Eski konuşma dönüşleri, kompakt bir girdide özetlenir.
2. Özet, oturum transcript'ine kaydedilir.
3. Son mesajlar olduğu gibi tutulur.

OpenClaw geçmişi Compaction parçalarına böldüğünde, asistan araç
çağrılarını eşleşen `toolResult` girdileriyle birlikte tutar. Bir bölme noktası
araç bloğunun içine denk gelirse, OpenClaw çifti birlikte tutmak ve
özetlenmemiş geçerli kuyruğu korumak için sınırı kaydırır.

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
Compaction yapmadan önce OpenClaw, önemli notları
[memory](/tr/concepts/memory) dosyalarına kaydetmesi için ajanı otomatik olarak hatırlatır. Bu, bağlam kaybını önler.
</Info>

Compaction davranışını (mod, hedef token sayısı vb.) yapılandırmak için `openclaw.json` dosyanızdaki `agents.defaults.compaction` ayarını kullanın.
Compaction özetleme, varsayılan olarak opak tanımlayıcıları korur (`identifierPolicy: "strict"`). Bunu `identifierPolicy: "off"` ile geçersiz kılabilir veya `identifierPolicy: "custom"` ve `identifierInstructions` ile özel metin sağlayabilirsiniz.

İsteğe bağlı olarak, `agents.defaults.compaction.model` üzerinden Compaction özetleme için farklı bir model belirtebilirsiniz. Bu, birincil modeliniz yerel veya küçük bir model olduğunda ve Compaction özetlerinin daha yetenekli bir model tarafından üretilmesini istediğinizde yararlıdır. Bu geçersiz kılma, herhangi bir `provider/model-id` dizesini kabul eder:

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

Bu, yerel modellerle de çalışır; örneğin özetleme için ayrılmış ikinci bir Ollama modeli veya ince ayarlı bir Compaction uzmanı:

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

Ayarlanmadığında Compaction, ajanın birincil modelini kullanır.

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

Bir `provider` ayarlamak otomatik olarak `mode: "safeguard"` değerini zorunlu kılar. Sağlayıcılar, yerleşik yolla aynı Compaction talimatlarını ve tanımlayıcı koruma ilkesini alır; ayrıca OpenClaw, sağlayıcı çıktısından sonra da son dönüş ve bölünmüş dönüş sonek bağlamını korur. Sağlayıcı başarısız olursa veya boş bir sonuç döndürürse, OpenClaw yerleşik LLM özetlemeye geri döner.

## Otomatik Compaction (varsayılan olarak açık)

Bir oturum modelin bağlam penceresine yaklaştığında veya bunu aştığında, OpenClaw otomatik Compaction tetikler ve özgün isteği kompakt bağlamı kullanarak yeniden deneyebilir.

Göreceğiniz şeyler:

- ayrıntılı modda `🧹 Auto-compaction complete`
- `/status` içinde `🧹 Compactions: <count>`

Compaction öncesinde OpenClaw, kalıcı notları diske kaydetmek için sessiz bir **memory flush** dönüşü çalıştırabilir. Ayrıntılar ve yapılandırma için [Memory](/tr/concepts/memory) bölümüne bakın.

## Manuel Compaction

Compaction'ı zorlamak için herhangi bir sohbette `/compact` yazın. Özeti yönlendirmek için
talimat ekleyin:

```
/compact API tasarım kararlarına odaklan
```

`agents.defaults.compaction.keepRecentTokens` ayarlandığında, manuel Compaction
bu Pi kesme noktasına uyar ve yeniden oluşturulmuş bağlamda son kuyruğu korur. Açık bir koruma bütçesi yoksa, manuel Compaction kesin bir denetim noktası gibi davranır ve
yalnızca yeni özetten devam eder.

## Farklı bir model kullanma

Varsayılan olarak Compaction, ajanınızın birincil modelini kullanır. Daha iyi özetler için daha
yetenekli bir model kullanabilirsiniz:

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

Varsayılan olarak Compaction sessiz çalışır. Compaction başladığında ve tamamlandığında kısa bildirimler göstermek için `notifyUser` seçeneğini etkinleştirin:

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

Etkinleştirildiğinde kullanıcı, her Compaction çalıştırmasının etrafında kısa durum mesajları görür
(örneğin, "Bağlam Compaction yapılıyor..." ve "Compaction tamamlandı").

## Compaction ve budama

|                  | Compaction                  | Budama                           |
| ---------------- | --------------------------- | -------------------------------- |
| **Ne yapar**     | Eski konuşmayı özetler      | Eski araç sonuçlarını kırpar     |
| **Kaydedilir mi?** | Evet (oturum transcript'inde) | Hayır (yalnızca bellekte, istek başına) |
| **Kapsam**       | Tüm konuşma                 | Yalnızca araç sonuçları          |

[Oturum budama](/tr/concepts/session-pruning), özetleme yapmadan
araç çıktısını kırpan daha hafif bir tamamlayıcıdır.

## Sorun giderme

**Çok sık mı Compaction yapılıyor?** Modelin bağlam penceresi küçük olabilir veya araç
çıktıları büyük olabilir. [oturum budama](/tr/concepts/session-pruning)
özelliğini etkinleştirmeyi deneyin.

**Compaction sonrasında bağlam eski mi hissediliyor?** Özeti yönlendirmek için `/compact <konuya> odaklan` kullanın veya notların
kalıcı olması için [memory flush](/tr/concepts/memory) özelliğini etkinleştirin.

**Temiz bir başlangıç mı gerekiyor?** `/new`, Compaction yapmadan yeni bir oturum başlatır.

Gelişmiş yapılandırma için (ayrılmış token'lar, tanımlayıcı koruma, özel
bağlam motorları, OpenAI sunucu tarafı Compaction), şu bölüme bakın:
[Oturum Yönetimi Derinlemesine İnceleme](/tr/reference/session-management-compaction).

## İlgili

- [Oturum](/tr/concepts/session) — oturum yönetimi ve yaşam döngüsü
- [Oturum Budama](/tr/concepts/session-pruning) — araç sonuçlarını kırpma
- [Bağlam](/tr/concepts/context) — ajan dönüşleri için bağlamın nasıl oluşturulduğu
- [Kancalar](/tr/automation/hooks) — Compaction yaşam döngüsü kancaları (`before_compaction`, `after_compaction`)
