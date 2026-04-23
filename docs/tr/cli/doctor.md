---
read_when:
    - Bağlantı/kimlik doğrulama sorunlarınız var ve yönlendirmeli düzeltmeler istiyorsunuz.
    - Güncelleme yaptınız ve temel bir doğruluk kontrolü istiyorsunuz.
summary: '`openclaw doctor` için CLI başvurusu (sağlık kontrolleri + yönlendirmeli onarımlar)'
title: doctor
x-i18n:
    generated_at: "2026-04-23T09:00:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4b858e8726094c950edcde1e3bdff05d03ae2bd216c3519bbee4805955cf851
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Gateway ve kanallar için sağlık kontrolleri + hızlı düzeltmeler.

İlgili:

- Sorun giderme: [Sorun Giderme](/tr/gateway/troubleshooting)
- Güvenlik denetimi: [Güvenlik](/tr/gateway/security)

## Örnekler

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Seçenekler

- `--no-workspace-suggestions`: çalışma alanı bellek/arama önerilerini devre dışı bırakır
- `--yes`: istem göstermeden varsayılanları kabul eder
- `--repair`: önerilen onarımları istem göstermeden uygular
- `--fix`: `--repair` için takma ad
- `--force`: gerektiğinde özel hizmet yapılandırmasının üzerine yazma dahil, agresif onarımlar uygular
- `--non-interactive`: istemler olmadan çalıştırır; yalnızca güvenli migration'lar
- `--generate-gateway-token`: bir Gateway token'ı oluşturur ve yapılandırır
- `--deep`: ek Gateway kurulumları için sistem hizmetlerini tarar

Notlar:

- Etkileşimli istemler (keychain/OAuth düzeltmeleri gibi) yalnızca stdin bir TTY olduğunda ve `--non-interactive` **ayarlanmamışsa** çalışır. Başsız çalıştırmalar (Cron, Telegram, terminal yok) istemleri atlar.
- Performans: etkileşimsiz `doctor` çalıştırmaları, başsız sağlık kontrolleri hızlı kalsın diye istekli Plugin yüklemeyi atlar. Etkileşimli oturumlar ise bir kontrol katkılarına ihtiyaç duyduğunda Plugin'leri yine tam olarak yükler.
- `--fix` (`--repair` takma adı), `~/.openclaw/openclaw.json.bak` içine bir yedek yazar ve bilinmeyen yapılandırma anahtarlarını kaldırır; her kaldırmayı listeler.
- Durum bütünlüğü kontrolleri artık oturumlar dizinindeki sahipsiz transcript dosyalarını algılar ve alanı güvenli şekilde geri kazanmak için bunları `.deleted.<timestamp>` olarak arşivleyebilir.
- Doctor ayrıca `~/.openclaw/cron/jobs.json` (veya `cron.store`) dosyasını eski Cron iş biçimleri için tarar ve scheduler bunları çalışma zamanında otomatik normalize etmek zorunda kalmadan önce yerinde yeniden yazabilir.
- Doctor, kurulu OpenClaw paketine yazma erişimi gerektirmeden eksik paketle gelen Plugin çalışma zamanı bağımlılıklarını onarır. Root sahipli npm kurulumları veya sıkılaştırılmış systemd birimleri için `OPENCLAW_PLUGIN_STAGE_DIR` değerini `/var/lib/openclaw/plugin-runtime-deps` gibi yazılabilir bir dizine ayarlayın.
- Doctor eski düz Talk yapılandırmasını (`talk.voiceId`, `talk.modelId` ve benzerleri) otomatik olarak `talk.provider` + `talk.providers.<provider>` yapısına geçirir.
- Tek fark nesne anahtar sırası olduğunda, tekrarlanan `doctor --fix` çalıştırmaları artık Talk normalizasyonunu raporlamaz/uygulamaz.
- Doctor bir bellek arama hazırlık kontrolü içerir ve embedding kimlik bilgileri eksik olduğunda `openclaw configure --section model` önerebilir.
- Sandbox modu etkinse ancak Docker kullanılamıyorsa, doctor düzeltmeyle birlikte yüksek sinyalli bir uyarı bildirir (`Docker kurun` veya `openclaw config set agents.defaults.sandbox.mode off`).
- `gateway.auth.token`/`gateway.auth.password` SecretRef tarafından yönetiliyorsa ve mevcut komut yolunda kullanılamıyorsa, doctor salt okunur bir uyarı bildirir ve düz metin geri dönüş kimlik bilgileri yazmaz.
- Bir düzeltme yolunda kanal SecretRef incelemesi başarısız olursa, doctor erken çıkmak yerine devam eder ve bir uyarı bildirir.
- Telegram `allowFrom` kullanıcı adı otomatik çözümü (`doctor --fix`), mevcut komut yolunda çözülebilir bir Telegram token'ı gerektirir. Token incelemesi kullanılamıyorsa, doctor bir uyarı bildirir ve bu geçiş için otomatik çözümü atlar.

## macOS: `launchctl` ortam değişkeni geçersiz kılmaları

Daha önce `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (veya `...PASSWORD`) çalıştırdıysanız, bu değer yapılandırma dosyanızı geçersiz kılar ve kalıcı “unauthorized” hatalarına neden olabilir.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
