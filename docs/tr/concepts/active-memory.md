---
read_when:
    - Etkin belleğin ne için olduğunu anlamak istiyorsunuz
    - Bir konuşma aracısı için etkin belleği açmak istiyorsunuz
    - Etkin bellek davranışını her yerde etkinleştirmeden ayarlamak istiyorsunuz
summary: Etkileşimli sohbet oturumlarına ilgili belleği ekleyen, eklentiye ait bir engelleyici bellek alt aracısı
title: Etkin Bellek
x-i18n:
    generated_at: "2026-04-11T08:30:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: e8b0e6539e09678e9e8def68795f8bcb992f98509423da3da3123eda88ec1dd5
    source_path: concepts/active-memory.md
    workflow: 15
---

# Etkin Bellek

Etkin bellek, uygun konuşma oturumlarında ana yanıttan önce çalışan, eklentiye ait isteğe bağlı bir engelleyici bellek alt aracısıdır.

Bunun nedeni, çoğu bellek sisteminin yetenekli ama tepkisel olmasıdır. Bellekte ne zaman arama yapılacağına ana aracının karar vermesine ya da kullanıcının "bunu hatırla" veya "bellekte ara" gibi şeyler söylemesine dayanırlar. O noktada, belleğin yanıtı doğal hissettireceği an çoktan geçmiş olur.

Etkin bellek, ana yanıt oluşturulmadan önce sistemin ilgili belleği ortaya çıkarması için sınırlı tek bir fırsat verir.

## Bunu Aracınıza Yapıştırın

Etkin Belleği kendi içinde yeterli, varsayılan olarak güvenli bir kurulumla etkinleştirmek istiyorsanız, bunu aracınıza yapıştırın:

```json5
{
  plugins: {
    entries: {
      "active-memory": {
        enabled: true,
        config: {
          enabled: true,
          agents: ["main"],
          allowedChatTypes: ["direct"],
          modelFallbackPolicy: "default-remote",
          queryMode: "recent",
          promptStyle: "balanced",
          timeoutMs: 15000,
          maxSummaryChars: 220,
          persistTranscripts: false,
          logging: true,
        },
      },
    },
  },
}
```

Bu, eklentiyi `main` aracısı için açar, varsayılan olarak yalnızca doğrudan mesaj tarzı oturumlarla sınırlar, önce mevcut oturum modelini devralmasına izin verir ve yine de açık veya devralınmış bir model yoksa yerleşik uzak yedeğe izin verir.

Ardından, gateway'i yeniden başlatın:

```bash
openclaw gateway
```

Bunu bir konuşma sırasında canlı olarak incelemek için:

```text
/verbose on
```

## Etkin belleği açın

En güvenli kurulum şudur:

1. eklentiyi etkinleştirin
2. bir konuşma aracısını hedefleyin
3. yalnızca ayarlama yaparken günlük kaydını açık tutun

`openclaw.json` içinde şununla başlayın:

```json5
{
  plugins: {
    entries: {
      "active-memory": {
        enabled: true,
        config: {
          agents: ["main"],
          allowedChatTypes: ["direct"],
          modelFallbackPolicy: "default-remote",
          queryMode: "recent",
          promptStyle: "balanced",
          timeoutMs: 15000,
          maxSummaryChars: 220,
          persistTranscripts: false,
          logging: true,
        },
      },
    },
  },
}
```

Ardından gateway'i yeniden başlatın:

```bash
openclaw gateway
```

Bunun anlamı:

- `plugins.entries.active-memory.enabled: true` eklentiyi açar
- `config.agents: ["main"]` yalnızca `main` aracısını etkin belleğe dahil eder
- `config.allowedChatTypes: ["direct"]` etkin belleği varsayılan olarak yalnızca doğrudan mesaj tarzı oturumlarda açık tutar
- `config.model` ayarlanmamışsa, etkin bellek önce mevcut oturum modelini devralır
- `config.modelFallbackPolicy: "default-remote"` açık veya devralınmış bir model olmadığında yerleşik uzak yedeği varsayılan olarak korur
- `config.promptStyle: "balanced"` `recent` modu için varsayılan genel amaçlı istem stilini kullanır
- etkin bellek yine de yalnızca uygun etkileşimli kalıcı sohbet oturumlarında çalışır

## Nasıl görebilirsiniz

Etkin bellek, model için gizli sistem bağlamı ekler. Ham `<active_memory_plugin>...</active_memory_plugin>` etiketlerini istemciye göstermez.

## Oturum anahtarı

Yapılandırmayı düzenlemeden mevcut sohbet oturumu için etkin belleği duraklatmak veya sürdürmek istediğinizde eklenti komutunu kullanın:

```text
/active-memory status
/active-memory off
/active-memory on
```

Bu, oturum kapsamındadır. Şunları değiştirmez:
`plugins.entries.active-memory.enabled`, aracı hedefleme veya diğer genel
yapılandırmalar.

Komutun yapılandırma yazmasını ve tüm oturumlar için etkin belleği duraklatmasını veya sürdürmesini istiyorsanız, açık genel biçimi kullanın:

```text
/active-memory status --global
/active-memory off --global
/active-memory on --global
```

Genel biçim `plugins.entries.active-memory.config.enabled` değerini yazar. Komutun daha sonra etkin belleği yeniden açabilmesi için `plugins.entries.active-memory.enabled` değerini açık bırakır.

Canlı bir oturumda etkin belleğin ne yaptığını görmek istiyorsanız, o oturum için ayrıntılı modu açın:

```text
/verbose on
```

Ayrıntılı mod etkinleştirildiğinde, OpenClaw şunları gösterebilir:

- `Active Memory: ok 842ms recent 34 chars` gibi bir etkin bellek durum satırı
- `Active Memory Debug: Lemon pepper wings with blue cheese.` gibi okunabilir bir hata ayıklama özeti

Bu satırlar, gizli sistem bağlamını besleyen aynı etkin bellek geçişinden türetilir, ancak ham istem işaretlemesini açığa çıkarmak yerine insanlar için biçimlendirilir.

Varsayılan olarak, engelleyici bellek alt aracısı dökümü geçicidir ve çalışma tamamlandıktan sonra silinir.

Örnek akış:

```text
/verbose on
hangi tavuk kanadını sipariş etmeliyim?
```

Beklenen görünür yanıt biçimi:

```text
...normal yardımcı yanıtı...

🧩 Active Memory: ok 842ms recent 34 chars
🔎 Active Memory Debug: Lemon pepper wings with blue cheese.
```

## Ne zaman çalışır

Etkin bellek iki geçit kullanır:

1. **Yapılandırma ile dahil etme**
   Eklenti etkinleştirilmiş olmalı ve mevcut aracı kimliği
   `plugins.entries.active-memory.config.agents` içinde görünmelidir.
2. **Katı çalışma zamanı uygunluğu**
   Etkinleştirilmiş ve hedeflenmiş olsa bile, etkin bellek yalnızca uygun
   etkileşimli kalıcı sohbet oturumlarında çalışır.

Gerçek kural şudur:

```text
eklenti etkin
+
aracı kimliği hedeflenmiş
+
izin verilen sohbet türü
+
uygun etkileşimli kalıcı sohbet oturumu
=
etkin bellek çalışır
```

Bunlardan herhangi biri başarısız olursa, etkin bellek çalışmaz.

## Oturum türleri

`config.allowedChatTypes`, Etkin Belleğin hangi tür konuşmalarda überhaupt çalışabileceğini kontrol eder.

Varsayılan değer şudur:

```json5
allowedChatTypes: ["direct"]
```

Bu, Etkin Belleğin varsayılan olarak doğrudan mesaj tarzı oturumlarda çalıştığı, ancak açıkça dahil etmediğiniz sürece grup veya kanal oturumlarında çalışmadığı anlamına gelir.

Örnekler:

```json5
allowedChatTypes: ["direct"]
```

```json5
allowedChatTypes: ["direct", "group"]
```

```json5
allowedChatTypes: ["direct", "group", "channel"]
```

## Nerede çalışır

Etkin bellek, platform genelinde bir çıkarım özelliği değil, konuşmayı zenginleştirme özelliğidir.

| Yüzey                                                              | Etkin bellek çalışır mı?                                |
| ------------------------------------------------------------------ | ------------------------------------------------------- |
| Control UI / web sohbeti kalıcı oturumları                         | Evet, eklenti etkinse ve aracı hedeflendiyse            |
| Aynı kalıcı sohbet yolu üzerindeki diğer etkileşimli kanal oturumları | Evet, eklenti etkinse ve aracı hedeflendiyse            |
| Başsız tek seferlik çalıştırmalar                                  | Hayır                                                   |
| Heartbeat/arka plan çalıştırmaları                                 | Hayır                                                   |
| Genel dahili `agent-command` yolları                               | Hayır                                                   |
| Alt aracı/dahili yardımcı yürütmesi                                | Hayır                                                   |

## Neden kullanılır

Etkin belleği şu durumlarda kullanın:

- oturum kalıcı ve kullanıcıya dönükse
- aracının aranabilecek anlamlı uzun vadeli belleği varsa
- süreklilik ve kişiselleştirme, ham istem belirlenimciliğinden daha önemliyse

Özellikle şu durumlarda iyi çalışır:

- kalıcı tercihler
- yinelenen alışkanlıklar
- doğal şekilde ortaya çıkması gereken uzun vadeli kullanıcı bağlamı

Şu durumlar için uygun değildir:

- otomasyon
- dahili çalışanlar
- tek seferlik API görevleri
- gizli kişiselleştirmenin şaşırtıcı olacağı yerler

## Nasıl çalışır

Çalışma zamanı biçimi şöyledir:

```mermaid
flowchart LR
  U["Kullanıcı Mesajı"] --> Q["Bellek Sorgusu Oluştur"]
  Q --> R["Etkin Bellek Engelleyici Bellek Alt Aracısı"]
  R -->|NONE veya boş| M["Ana Yanıt"]
  R -->|ilgili özet| I["Gizli active_memory_plugin Sistem Bağlamı Ekle"]
  I --> M["Ana Yanıt"]
```

Engelleyici bellek alt aracısı yalnızca şunları kullanabilir:

- `memory_search`
- `memory_get`

Bağlantı zayıfsa `NONE` döndürmelidir.

## Sorgu modları

`config.queryMode`, engelleyici bellek alt aracısının konuşmanın ne kadarını gördüğünü kontrol eder.

## İstem stilleri

`config.promptStyle`, engelleyici bellek alt aracısının belleği döndürüp döndürmemeye karar verirken ne kadar istekli veya katı olduğunu kontrol eder.

Kullanılabilir stiller:

- `balanced`: `recent` modu için genel amaçlı varsayılan
- `strict`: en az istekli; yakın bağlamdan çok az sızıntı istediğinizde en iyisidir
- `contextual`: sürekliliğe en uygun; konuşma geçmişinin daha önemli olması gerektiğinde en iyisidir
- `recall-heavy`: daha yumuşak ama yine de makul eşleşmelerde belleği ortaya çıkarmaya daha isteklidir
- `precision-heavy`: eşleşme açık değilse agresif şekilde `NONE` tercih eder
- `preference-only`: favoriler, alışkanlıklar, rutinler, zevkler ve tekrarlayan kişisel bilgiler için optimize edilmiştir

`config.promptStyle` ayarlanmamışsa varsayılan eşleme:

```text
message -> strict
recent -> balanced
full -> contextual
```

`config.promptStyle` değerini açıkça ayarlarsanız, bu geçersiz kılma kazanır.

Örnek:

```json5
promptStyle: "preference-only"
```

## Model yedek ilkesi

`config.model` ayarlanmamışsa, Etkin Bellek bir modeli şu sırayla çözmeye çalışır:

```text
açık eklenti modeli
-> mevcut oturum modeli
-> aracı birincil modeli
-> isteğe bağlı yerleşik uzak yedek
```

`config.modelFallbackPolicy` son adımı kontrol eder.

Varsayılan:

```json5
modelFallbackPolicy: "default-remote"
```

Diğer seçenek:

```json5
modelFallbackPolicy: "resolved-only"
```

Açık veya devralınmış bir model olmadığında Etkin Belleğin yerleşik uzak varsayılana geri düşmek yerine geri çağırmayı atlamasını istiyorsanız `resolved-only` kullanın.

## Gelişmiş kaçış kapıları

Bu seçenekler kasıtlı olarak önerilen kurulumun parçası değildir.

`config.thinking`, engelleyici bellek alt aracısının düşünme düzeyini geçersiz kılabilir:

```json5
thinking: "medium"
```

Varsayılan:

```json5
thinking: "off"
```

Bunu varsayılan olarak etkinleştirmeyin. Etkin Bellek yanıt yolunda çalışır, bu nedenle ek düşünme süresi doğrudan kullanıcının gördüğü gecikmeyi artırır.

`config.promptAppend`, varsayılan Etkin Bellek isteminden sonra ve konuşma bağlamından önce ek operatör talimatları ekler:

```json5
promptAppend: "Tek seferlik olaylar yerine kalıcı uzun vadeli tercihleri tercih et."
```

`config.promptOverride`, varsayılan Etkin Bellek istemini değiştirir. OpenClaw yine de sonrasında konuşma bağlamını ekler:

```json5
promptOverride: "Sen bir bellek arama aracısısın. NONE veya tek bir kısa kullanıcı gerçeği döndür."
```

İstem özelleştirmesi, bilerek farklı bir geri çağırma sözleşmesini test etmiyorsanız önerilmez. Varsayılan istem, ana model için ya `NONE` ya da kısa kullanıcı-gerçeği bağlamı döndürecek şekilde ayarlanmıştır.

### `message`

Yalnızca en son kullanıcı mesajı gönderilir.

```text
Yalnızca en son kullanıcı mesajı
```

Bunu şu durumlarda kullanın:

- en hızlı davranışı istiyorsanız
- kalıcı tercih geri çağırımına en güçlü yanlılığı istiyorsanız
- takip turlarının konuşma bağlamına ihtiyacı yoksa

Önerilen zaman aşımı:

- yaklaşık `3000` ile `5000` ms arasında başlayın

### `recent`

En son kullanıcı mesajı artı küçük bir yakın dönem konuşma kuyruğu gönderilir.

```text
Yakın dönem konuşma kuyruğu:
user: ...
assistant: ...
user: ...

En son kullanıcı mesajı:
...
```

Bunu şu durumlarda kullanın:

- hız ve konuşma temellendirmesi arasında daha iyi bir denge istiyorsanız
- takip soruları sık sık son birkaç tura bağlıysa

Önerilen zaman aşımı:

- yaklaşık `15000` ms ile başlayın

### `full`

Tam konuşma engelleyici bellek alt aracısına gönderilir.

```text
Tam konuşma bağlamı:
user: ...
assistant: ...
user: ...
...
```

Bunu şu durumlarda kullanın:

- en güçlü geri çağırma kalitesi gecikmeden daha önemliyse
- konuşma, akışın çok gerisinde önemli kurulum içeriyorsa

Önerilen zaman aşımı:

- `message` veya `recent` ile karşılaştırıldığında belirgin şekilde artırın
- ileti dizisi boyutuna bağlı olarak yaklaşık `15000` ms veya daha yüksek bir değerle başlayın

Genel olarak, zaman aşımı bağlam boyutuyla birlikte artmalıdır:

```text
message < recent < full
```

## Döküm kalıcılığı

Etkin bellek engelleyici bellek alt aracısı çalıştırmaları, engelleyici bellek alt aracısı çağrısı sırasında gerçek bir `session.jsonl` dökümü oluşturur.

Varsayılan olarak bu döküm geçicidir:

- geçici bir dizine yazılır
- yalnızca engelleyici bellek alt aracısı çalıştırması için kullanılır
- çalıştırma biter bitmez silinir

Hata ayıklama veya inceleme için bu engelleyici bellek alt aracısı dökümlerini diskte tutmak istiyorsanız, kalıcılığı açıkça etkinleştirin:

```json5
{
  plugins: {
    entries: {
      "active-memory": {
        enabled: true,
        config: {
          agents: ["main"],
          persistTranscripts: true,
          transcriptDir: "active-memory",
        },
      },
    },
  },
}
```

Etkinleştirildiğinde, etkin bellek dökümleri ana kullanıcı konuşması döküm yolunda değil, hedef aracının oturum klasörü altında ayrı bir dizinde depolar.

Varsayılan düzen kavramsal olarak şöyledir:

```text
agents/<agent>/sessions/active-memory/<blocking-memory-sub-agent-session-id>.jsonl
```

Göreli alt dizini `config.transcriptDir` ile değiştirebilirsiniz.

Bunu dikkatli kullanın:

- engelleyici bellek alt aracısı dökümleri yoğun oturumlarda hızla birikebilir
- `full` sorgu modu çok fazla konuşma bağlamını kopyalayabilir
- bu dökümler gizli istem bağlamı ve geri çağrılan anıları içerir

## Yapılandırma

Tüm etkin bellek yapılandırması şunun altında bulunur:

```text
plugins.entries.active-memory
```

En önemli alanlar şunlardır:

| Anahtar                    | Tür                                                                                                  | Anlamı                                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `enabled`                  | `boolean`                                                                                            | Eklentinin kendisini etkinleştirir                                                                     |
| `config.agents`            | `string[]`                                                                                           | Etkin belleği kullanabilen aracı kimlikleri                                                            |
| `config.model`             | `string`                                                                                             | İsteğe bağlı engelleyici bellek alt aracısı model başvurusu; ayarlanmadığında etkin bellek mevcut oturum modelini kullanır |
| `config.queryMode`         | `"message" \| "recent" \| "full"`                                                                    | Engelleyici bellek alt aracısının konuşmanın ne kadarını gördüğünü kontrol eder                        |
| `config.promptStyle`       | `"balanced" \| "strict" \| "contextual" \| "recall-heavy" \| "precision-heavy" \| "preference-only"` | Engelleyici bellek alt aracısının belleği döndürüp döndürmemeye karar verirken ne kadar istekli veya katı olduğunu kontrol eder |
| `config.thinking`          | `"off" \| "minimal" \| "low" \| "medium" \| "high" \| "xhigh" \| "adaptive"`                        | Engelleyici bellek alt aracısı için gelişmiş düşünme geçersiz kılması; hız için varsayılan `off`      |
| `config.promptOverride`    | `string`                                                                                             | Gelişmiş tam istem değiştirme; normal kullanım için önerilmez                                          |
| `config.promptAppend`      | `string`                                                                                             | Varsayılan veya geçersiz kılınmış isteme eklenen gelişmiş ek talimatlar                                |
| `config.timeoutMs`         | `number`                                                                                             | Engelleyici bellek alt aracısı için katı zaman aşımı                                                   |
| `config.maxSummaryChars`   | `number`                                                                                             | Etkin bellek özetinde izin verilen en fazla toplam karakter sayısı                                     |
| `config.logging`           | `boolean`                                                                                            | Ayarlama sırasında etkin bellek günlüklerini üretir                                                    |
| `config.persistTranscripts`| `boolean`                                                                                            | Engelleyici bellek alt aracısı dökümlerini geçici dosyaları silmek yerine diskte tutar                |
| `config.transcriptDir`     | `string`                                                                                             | Aracı oturum klasörü altındaki göreli engelleyici bellek alt aracısı döküm dizini                     |

Yararlı ayarlama alanları:

| Anahtar                      | Tür      | Anlamı                                                     |
| ---------------------------- | -------- | ---------------------------------------------------------- |
| `config.maxSummaryChars`     | `number` | Etkin bellek özetinde izin verilen en fazla toplam karakter sayısı |
| `config.recentUserTurns`     | `number` | `queryMode` `recent` olduğunda dahil edilecek önceki kullanıcı turları |
| `config.recentAssistantTurns`| `number` | `queryMode` `recent` olduğunda dahil edilecek önceki yardımcı turları |
| `config.recentUserChars`     | `number` | Son kullanıcı turu başına en fazla karakter                |
| `config.recentAssistantChars`| `number` | Son yardımcı turu başına en fazla karakter                 |
| `config.cacheTtlMs`          | `number` | Tekrarlanan özdeş sorgular için önbellek yeniden kullanımı |

## Önerilen kurulum

`recent` ile başlayın.

```json5
{
  plugins: {
    entries: {
      "active-memory": {
        enabled: true,
        config: {
          agents: ["main"],
          queryMode: "recent",
          promptStyle: "balanced",
          timeoutMs: 15000,
          maxSummaryChars: 220,
          logging: true,
        },
      },
    },
  },
}
```

Ayarlama yaparken canlı davranışı incelemek istiyorsanız, ayrı bir etkin bellek hata ayıklama komutu aramak yerine oturumda `/verbose on` kullanın.

Ardından şunlara geçin:

- daha düşük gecikme istiyorsanız `message`
- ek bağlamın daha yavaş engelleyici bellek alt aracısına değdiğine karar verirseniz `full`

## Hata ayıklama

Etkin bellek beklediğiniz yerde görünmüyorsa:

1. Eklentinin `plugins.entries.active-memory.enabled` altında etkinleştirildiğini doğrulayın.
2. Geçerli aracı kimliğinin `config.agents` içinde listelendiğini doğrulayın.
3. Etkileşimli kalıcı bir sohbet oturumu üzerinden test yaptığınızı doğrulayın.
4. `config.logging: true` seçeneğini açın ve gateway günlüklerini izleyin.
5. Bellek aramasının kendisinin `openclaw memory status --deep` ile çalıştığını doğrulayın.

Bellek eşleşmeleri gürültülüyse şunu sıkılaştırın:

- `maxSummaryChars`

Etkin bellek çok yavaşsa:

- `queryMode` değerini düşürün
- `timeoutMs` değerini düşürün
- son tur sayılarını azaltın
- tur başına karakter sınırlarını azaltın

## İlgili sayfalar

- [Bellek Arama](/tr/concepts/memory-search)
- [Bellek yapılandırma başvurusu](/tr/reference/memory-config)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
