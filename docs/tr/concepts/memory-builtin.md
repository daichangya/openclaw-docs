---
read_when:
    - Varsayılan bellek arka ucunu anlamak istiyorsunuz
    - Embedding sağlayıcılarını veya hibrit aramayı yapılandırmak istiyorsunuz
summary: Anahtar sözcük, vektör ve hibrit arama içeren varsayılan SQLite tabanlı bellek arka ucu
title: Yerleşik bellek motoru
x-i18n:
    generated_at: "2026-04-25T13:45:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ccf0b70bd3ed4e2138ae1d811573f6920c95eb3f8117693b242732012779dc6
    source_path: concepts/memory-builtin.md
    workflow: 15
---

Yerleşik motor varsayılan bellek arka ucudur. Bellek dizininizi ajan başına bir SQLite veritabanında depolar ve başlamak için ek bağımlılık gerektirmez.

## Sağladıkları

- FTS5 tam metin dizinleme (BM25 puanlama) ile **anahtar sözcük araması**.
- Desteklenen herhangi bir sağlayıcıdan embedding'lerle **vektör araması**.
- En iyi sonuçlar için ikisini birleştiren **hibrit arama**.
- Çince, Japonca ve Korece için trigram tokenizasyonu ile **CJK desteği**.
- Veritabanı içi vektör sorguları için **sqlite-vec hızlandırması** (isteğe bağlı).

## Başlarken

OpenAI, Gemini, Voyage veya Mistral için bir API anahtarınız varsa yerleşik motor bunu otomatik algılar ve vektör aramasını etkinleştirir. Yapılandırma gerekmez.

Bir sağlayıcıyı açıkça ayarlamak için:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

Bir embedding sağlayıcısı olmadan yalnızca anahtar sözcük araması kullanılabilir.

Yerleşik yerel embedding sağlayıcısını zorlamak için isteğe bağlı `node-llama-cpp` çalışma zamanı paketini OpenClaw'ın yanına kurun, ardından `local.modelPath` değerini bir GGUF dosyasına yönlendirin:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## Desteklenen embedding sağlayıcıları

| Sağlayıcı | ID        | Otomatik algılanır | Notlar                              |
| --------- | --------- | ------------------ | ----------------------------------- |
| OpenAI    | `openai`  | Evet               | Varsayılan: `text-embedding-3-small` |
| Gemini    | `gemini`  | Evet               | Çok modluyu destekler (görsel + ses) |
| Voyage    | `voyage`  | Evet               |                                     |
| Mistral   | `mistral` | Evet               |                                     |
| Ollama    | `ollama`  | Hayır              | Yerel, açıkça ayarlayın             |
| Local     | `local`   | Evet (ilk)         | İsteğe bağlı `node-llama-cpp` çalışma zamanı |

Otomatik algılama, API anahtarı çözümlenebilen ilk sağlayıcıyı tabloda gösterilen sırayla seçer. Bunu geçersiz kılmak için `memorySearch.provider` ayarlayın.

## Dizinleme nasıl çalışır

OpenClaw, `MEMORY.md` ve `memory/*.md` dosyalarını parçalara (~400 token ve 80 token örtüşme) ayırarak dizinler ve bunları ajan başına bir SQLite veritabanında depolar.

- **Dizin konumu:** `~/.openclaw/memory/<agentId>.sqlite`
- **Dosya izleme:** bellek dosyalarındaki değişiklikler debounce uygulanmış yeniden dizinlemeyi tetikler (1,5 sn).
- **Otomatik yeniden dizinleme:** embedding sağlayıcısı, model veya parçalama yapılandırması değiştiğinde tüm dizin otomatik olarak yeniden oluşturulur.
- **İstek üzerine yeniden dizinleme:** `openclaw memory index --force`

<Info>
Ayrıca çalışma alanı dışındaki Markdown dosyalarını `memorySearch.extraPaths` ile dizinleyebilirsiniz. Bkz. [yapılandırma başvurusu](/tr/reference/memory-config#additional-memory-paths).
</Info>

## Ne zaman kullanılmalı

Yerleşik motor çoğu kullanıcı için doğru seçimdir:

- Ek bağımlılık olmadan kutudan çıktığı gibi çalışır.
- Anahtar sözcük ve vektör aramasını iyi şekilde işler.
- Tüm embedding sağlayıcılarını destekler.
- Hibrit arama, her iki getirim yaklaşımının en iyisini birleştirir.

Yeniden sıralama, sorgu genişletme gerekiyorsa veya çalışma alanı dışındaki dizinleri dizinlemek istiyorsanız [QMD](/tr/concepts/memory-qmd)'ye geçmeyi değerlendirin.

Otomatik kullanıcı modelleme ile oturumlar arası bellek istiyorsanız [Honcho](/tr/concepts/memory-honcho)'yu değerlendirin.

## Sorun giderme

**Bellek araması devre dışı mı?** `openclaw memory status` komutunu kontrol edin. Hiçbir sağlayıcı algılanmıyorsa birini açıkça ayarlayın veya bir API anahtarı ekleyin.

**Yerel sağlayıcı algılanmıyor mu?** Yerel yolun mevcut olduğunu doğrulayın ve şunu çalıştırın:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Hem bağımsız CLI komutları hem de Gateway aynı `local` sağlayıcı kimliğini kullanır. Sağlayıcı `auto` olarak ayarlanmışsa yerel embedding'ler yalnızca `memorySearch.local.modelPath` mevcut bir yerel dosyayı işaret ettiğinde önce değerlendirilir.

**Sonuçlar bayat mı?** Yeniden oluşturmak için `openclaw memory index --force` çalıştırın. İzleyici nadir uç durumlarda değişiklikleri kaçırabilir.

**sqlite-vec yüklenmiyor mu?** OpenClaw otomatik olarak süreç içi kosinüs benzerliğine geri döner. Belirli yükleme hatası için günlükleri kontrol edin.

## Yapılandırma

Embedding sağlayıcı kurulumu, hibrit arama ayarı (ağırlıklar, MMR, zamansal azalma), toplu dizinleme, çok modlu bellek, sqlite-vec, ek yollar ve diğer tüm yapılandırma seçenekleri için bkz. [Bellek yapılandırma başvurusu](/tr/reference/memory-config).

## İlgili

- [Bellek genel bakışı](/tr/concepts/memory)
- [Bellek araması](/tr/concepts/memory-search)
- [Active Memory](/tr/concepts/active-memory)
