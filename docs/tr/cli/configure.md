---
read_when:
    - Kimlik bilgilerini, cihazları veya varsayılan agent ayarlarını etkileşimli olarak değiştirmek istiyorsunuz.
summary: '`openclaw configure` için CLI başvurusu (etkileşimli yapılandırma istemleri)'
title: yapılandırma
x-i18n:
    generated_at: "2026-04-23T08:59:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7fedaf1bc5e5c793ed354ff01294808f9b4a266219f8e07799a2545fe5652cf2
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Kimlik bilgilerini, cihazları ve varsayılan agent ayarlarını kurmak için etkileşimli istem.

Not: **Model** bölümü artık
`agents.defaults.models` allowlist'i için çoklu seçim içerir (`/model` ve model seçicide neyin görüneceği).
Provider kapsamlı kurulum seçimleri, seçilen modelleri mevcut
allowlist ile birleştirir; yapılandırmadaki ilgisiz provider'ların yerine geçmez.

Yapılandırma bir provider kimlik doğrulama seçiminden başlatıldığında,
varsayılan model ve allowlist seçicileri bu provider'ı otomatik olarak tercih eder. Volcengine/BytePlus gibi
eşlenmiş provider'lar için aynı tercih, bunların coding-plan
varyantlarıyla da eşleşir (`volcengine-plan/*`, `byteplus-plan/*`). Tercih edilen provider
filtresi boş bir liste üretecekse, yapılandırma boş bir seçici göstermek yerine
filtresiz kataloğa geri döner.

İpucu: Alt komut olmadan `openclaw config` aynı sihirbazı açar.
Etkileşimsiz düzenlemeler için `openclaw config get|set|unset` kullanın.

Web araması için `openclaw configure --section web`, bir provider
seçmenize ve onun kimlik bilgilerini yapılandırmanıza izin verir. Bazı provider'lar ayrıca provider'a özgü
devam istemleri de gösterir:

- **Grok**, aynı `XAI_API_KEY` ile isteğe bağlı `x_search` kurulumunu önerebilir ve
  bir `x_search` modeli seçmenize izin verebilir.
- **Kimi**, Moonshot API bölgesini (`api.moonshot.ai` veya
  `api.moonshot.cn`) ve varsayılan Kimi web-search modelini sorabilir.

İlgili:

- Gateway yapılandırma başvurusu: [Yapılandırma](/tr/gateway/configuration)
- CLI yapılandırması: [Config](/tr/cli/config)

## Seçenekler

- `--section <section>`: tekrarlanabilir bölüm filtresi

Kullanılabilir bölümler:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

Notlar:

- Gateway'in nerede çalışacağını seçmek her zaman `gateway.mode` değerini günceller. Yalnızca buna ihtiyacınız varsa başka bölümler olmadan "Continue" seçebilirsiniz.
- Kanal odaklı hizmetler (Slack/Discord/Matrix/Microsoft Teams), kurulum sırasında kanal/oda allowlist'leri ister. Ad veya kimlik girebilirsiniz; sihirbaz mümkün olduğunda adları kimliklere çözer.
- Daemon kurulum adımını çalıştırırsanız, token kimlik doğrulaması bir token gerektirir ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, yapılandırma SecretRef'i doğrular ancak çözümlenmiş düz metin token değerlerini supervisor hizmet ortamı meta verilerine kalıcı olarak yazmaz.
- Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenmemişse, yapılandırma uygulanabilir düzeltme rehberiyle daemon kurulumunu engeller.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, yapılandırma mod açıkça ayarlanana kadar daemon kurulumunu engeller.

## Örnekler

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
