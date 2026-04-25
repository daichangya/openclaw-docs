---
read_when:
    - Kimlik bilgilerini, cihazları veya varsayılan ajan ayarlarını etkileşimli olarak ayarlamak istiyorsunuz
summary: '`openclaw configure` için CLI başvurusu (etkileşimli yapılandırma istemleri)'
title: Yapılandırma
x-i18n:
    generated_at: "2026-04-25T13:43:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15f445b1b5dd7198175c718d51ae50f9c9c0f3dcbb199adacf9155f6a512d93a
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Kimlik bilgilerini, cihazları ve varsayılan ajan ayarlarını kurmak için etkileşimli istem.

Not: **Model** bölümü artık `agents.defaults.models` izin listesi için çoklu seçim içerir (`/model` ve model seçicide neyin göründüğü). Sağlayıcı kapsamlı kurulum seçimleri, seçilen modelleri mevcut yapılandırmadaki ilişkisiz sağlayıcıları değiştirmek yerine var olan izin listesiyle birleştirir. Configure içinden sağlayıcı kimlik doğrulamasını yeniden çalıştırmak mevcut bir `agents.defaults.model.primary` değerini korur; varsayılan modeli bilinçli olarak değiştirmek istediğinizde `openclaw models auth login --provider <id> --set-default` veya `openclaw models set <model>` kullanın.

Configure bir sağlayıcı kimlik doğrulama seçeneğinden başladığında, varsayılan model ve izin listesi seçicileri o sağlayıcıyı otomatik olarak tercih eder. Volcengine/BytePlus gibi eşleştirilmiş sağlayıcılarda bu tercih aynı zamanda onların coding-plan varyantlarıyla da eşleşir (`volcengine-plan/*`, `byteplus-plan/*`). Tercih edilen sağlayıcı filtresi boş bir liste üretecekse configure boş bir seçici göstermek yerine filtrelenmemiş kataloğa geri döner.

İpucu: Alt komut olmadan `openclaw config` aynı sihirbazı açar. Etkileşimli olmayan düzenlemeler için `openclaw config get|set|unset` kullanın.

Web araması için `openclaw configure --section web`, bir sağlayıcı seçmenize ve onun kimlik bilgilerini yapılandırmanıza izin verir. Bazı sağlayıcılar ayrıca sağlayıcıya özgü ek istemler de gösterir:

- **Grok**, aynı `XAI_API_KEY` ile isteğe bağlı `x_search` kurulumunu sunabilir ve bir `x_search` modeli seçmenize izin verebilir.
- **Kimi**, Moonshot API bölgesini (`api.moonshot.ai` veya `api.moonshot.cn`) ve varsayılan Kimi web-search modelini sorabilir.

İlgili:

- Gateway yapılandırma başvurusu: [Yapılandırma](/tr/gateway/configuration)
- Config CLI: [Config](/tr/cli/config)

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

- Gateway'in nerede çalışacağını seçmek her zaman `gateway.mode` değerini günceller. İhtiyacınız olan tek şey buysa başka bölüm seçmeden "Continue" seçeneğini seçebilirsiniz.
- Kanal odaklı hizmetler (Slack/Discord/Matrix/Microsoft Teams), kurulum sırasında kanal/oda izin listelerini ister. Ad veya kimlik girebilirsiniz; sihirbaz mümkün olduğunda adları kimliklere çözümler.
- Daemon kurulum adımını çalıştırırsanız token kimlik doğrulaması bir token gerektirir ve `gateway.auth.token` SecretRef ile yönetiliyorsa configure SecretRef'i doğrular ancak çözümlenmiş düz metin token değerlerini supervisor hizmet ortamı meta verisine kalıcı olarak yazmaz.
- Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenmemişse configure, uygulanabilir düzeltme rehberliğiyle daemon kurulumunu engeller.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa configure, mod açıkça ayarlanana kadar daemon kurulumunu engeller.

## Örnekler

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Yapılandırma](/tr/gateway/configuration)
