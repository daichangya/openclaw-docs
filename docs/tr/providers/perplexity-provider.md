---
read_when:
    - Perplexity’yi bir web arama sağlayıcısı olarak yapılandırmak istiyorsunuz
    - Perplexity API anahtarına veya OpenRouter proxy kurulumuna ihtiyacınız var
summary: Perplexity web arama sağlayıcısı kurulumu (API anahtarı, arama modları, filtreleme)
title: Perplexity
x-i18n:
    generated_at: "2026-04-25T13:56:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: d913d71c1b3a5cfbd755efff9235adfd5dd460ef606a6d229d2cceb5134174d3
    source_path: providers/perplexity-provider.md
    workflow: 15
---

Perplexity eklentisi, Perplexity Search API veya OpenRouter üzerinden Perplexity Sonar aracılığıyla web arama yetenekleri sağlar.

<Note>
Bu sayfa, Perplexity **sağlayıcı** kurulumunu kapsar. Perplexity
**aracı** için (ajanın bunu nasıl kullandığı), bkz. [Perplexity aracı](/tr/tools/perplexity-search).
</Note>

| Özellik     | Değer                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| Tür         | Web arama sağlayıcısı (model sağlayıcısı değil)                        |
| Kimlik doğrulama | `PERPLEXITY_API_KEY` (doğrudan) veya `OPENROUTER_API_KEY` (OpenRouter üzerinden) |
| Yapılandırma yolu | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## Başlarken

<Steps>
  <Step title="API anahtarını ayarlayın">
    Etkileşimli web arama yapılandırma akışını çalıştırın:

    ```bash
    openclaw configure --section web
    ```

    Veya anahtarı doğrudan ayarlayın:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Aramaya başlayın">
    Anahtar yapılandırıldıktan sonra ajan, web aramaları için Perplexity'yi
    otomatik olarak kullanacaktır. Ek adım gerekmez.
  </Step>
</Steps>

## Arama modları

Eklenti, API anahtarı önekine göre taşıma katmanını otomatik olarak seçer:

<Tabs>
  <Tab title="Yerel Perplexity API'si (pplx-)">
    Anahtarınız `pplx-` ile başlıyorsa, OpenClaw yerel Perplexity Search
    API'sini kullanır. Bu taşıma katmanı yapılandırılmış sonuçlar döndürür ve
    alan adı, dil ve tarih filtrelerini destekler (aşağıdaki filtreleme
    seçeneklerine bakın).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Anahtarınız `sk-or-` ile başlıyorsa, OpenClaw OpenRouter üzerinden
    Perplexity Sonar modelini kullanarak yönlendirme yapar. Bu taşıma katmanı,
    alıntılar içeren yapay zeka sentezli yanıtlar döndürür.
  </Tab>
</Tabs>

| Anahtar öneki | Taşıma katmanı              | Özellikler                                      |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | Yerel Perplexity Search API | Yapılandırılmış sonuçlar, alan adı/dil/tarih filtreleri |
| `sk-or-`   | OpenRouter (Sonar)           | Alıntılar içeren yapay zeka sentezli yanıtlar    |

## Yerel API filtreleme

<Note>
Filtreleme seçenekleri yalnızca yerel Perplexity API kullanılırken
(`pplx-` anahtarı) kullanılabilir. OpenRouter/Sonar aramaları bu parametreleri desteklemez.
</Note>

Yerel Perplexity API kullanılırken aramalar aşağıdaki filtreleri destekler:

| Filtre         | Açıklama                               | Örnek                               |
| -------------- | -------------------------------------- | ----------------------------------- |
| Ülke           | 2 harfli ülke kodu                     | `us`, `de`, `jp`                    |
| Dil            | ISO 639-1 dil kodu                     | `en`, `fr`, `zh`                    |
| Tarih aralığı  | Güncellik penceresi                    | `day`, `week`, `month`, `year`      |
| Alan adı filtreleri | İzin listesi veya engelleme listesi (en fazla 20 alan adı) | `example.com`                       |
| İçerik bütçesi | Yanıt başına / sayfa başına belirteç sınırları | `max_tokens`, `max_tokens_per_page` |

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Daemon süreçleri için ortam değişkeni">
    OpenClaw Gateway bir daemon olarak çalışıyorsa (launchd/systemd),
    `PERPLEXITY_API_KEY` değerinin bu süreç için kullanılabilir olduğundan emin olun.

    <Warning>
    Yalnızca `~/.profile` içinde ayarlanan bir anahtar, bu ortam açıkça içe
    aktarılmadıkça launchd/systemd daemon'ı tarafından görülemez. Gateway
    sürecinin bunu okuyabilmesini sağlamak için anahtarı `~/.openclaw/.env`
    içinde veya `env.shellEnv` aracılığıyla ayarlayın.
    </Warning>

  </Accordion>

  <Accordion title="OpenRouter proxy kurulumu">
    Perplexity aramalarını OpenRouter üzerinden yönlendirmeyi tercih ediyorsanız,
    yerel bir Perplexity anahtarı yerine bir `OPENROUTER_API_KEY`
    (önek `sk-or-`) ayarlayın. OpenClaw öneki algılar ve otomatik olarak Sonar
    taşıma katmanına geçer.

    <Tip>
    OpenRouter taşıma katmanı, zaten bir OpenRouter hesabınız varsa ve birden
    fazla sağlayıcı için birleştirilmiş faturalandırma istiyorsanız kullanışlıdır.
    </Tip>

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Perplexity arama aracı" href="/tr/tools/perplexity-search" icon="magnifying-glass">
    Ajanın Perplexity aramalarını nasıl çağırdığı ve sonuçları nasıl yorumladığı.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Eklenti girdileri dahil tam yapılandırma başvurusu.
  </Card>
</CardGroup>
