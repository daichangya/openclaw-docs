---
read_when:
    - Bağlantı/kimlik doğrulama sorunlarınız var ve rehberli düzeltmeler istiyorsunuz
    - Güncelleme yaptınız ve hızlı bir sağlamlık kontrolü istiyorsunuz
summary: '`openclaw doctor` için CLI başvurusu (sağlık kontrolleri + rehberli onarımlar)'
title: Doktor
x-i18n:
    generated_at: "2026-04-25T13:44:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e185d17d91d1677d0b16152d022b633d012d22d484bd9961820b200d5c4ce5
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
- `--yes`: sormadan varsayılanları kabul eder
- `--repair`: sormadan önerilen onarımları uygular
- `--fix`: `--repair` için takma ad
- `--force`: gerektiğinde özel hizmet yapılandırmasının üzerine yazmak dahil agresif onarımlar uygular
- `--non-interactive`: istemler olmadan çalıştırır; yalnızca güvenli geçişler
- `--generate-gateway-token`: bir gateway token'ı üretir ve yapılandırır
- `--deep`: ek gateway kurulumları için sistem hizmetlerini tarar

Notlar:

- Etkileşimli istemler (keychain/OAuth düzeltmeleri gibi) yalnızca stdin bir TTY olduğunda ve `--non-interactive` **ayarlanmamışsa** çalışır. Başsız çalıştırmalarda (Cron, Telegram, terminal yok) istemler atlanır.
- Performans: etkileşimli olmayan `doctor` çalıştırmaları, başsız sağlık kontrollerinin hızlı kalması için istek üzerine olmayan Plugin yüklemesini atlar. Etkileşimli oturumlar, bir kontrol katkılarına ihtiyaç duyduğunda Plugin'leri yine tam olarak yükler.
- `--fix` (`--repair` için takma ad) `~/.openclaw/openclaw.json.bak` konumuna bir yedek yazar ve bilinmeyen yapılandırma anahtarlarını kaldırır; her kaldırmayı listeler.
- Durum bütünlüğü kontrolleri artık oturumlar dizinindeki sahipsiz transkript dosyalarını algılar ve alanı güvenle geri kazanmak için bunları `.deleted.<timestamp>` olarak arşivleyebilir.
- Doctor ayrıca `~/.openclaw/cron/jobs.json` dosyasını (veya `cron.store`) eski Cron iş şekilleri için tarar ve zamanlayıcının çalışma zamanında otomatik normalleştirme yapmasına gerek kalmadan önce bunları yerinde yeniden yazabilir.
- Doctor, paketlenmiş genel kurulumların içine yazmadan eksik paketlenmiş Plugin çalışma zamanı bağımlılıklarını onarır. Root sahibi npm kurulumları veya sıkılaştırılmış systemd birimleri için `OPENCLAW_PLUGIN_STAGE_DIR` değerini `/var/lib/openclaw/plugin-runtime-deps` gibi yazılabilir bir dizine ayarlayın.
- Doctor, eski düz Talk yapılandırmasını (`talk.voiceId`, `talk.modelId` ve benzerleri) otomatik olarak `talk.provider` + `talk.providers.<provider>` yapısına geçirir.
- Yalnızca nesne anahtarı sırası farkı olduğunda tekrarlanan `doctor --fix` çalıştırmaları artık Talk normalleştirmesini raporlamaz/uygulamaz.
- Doctor, bellek arama hazırlık denetimi içerir ve embedding kimlik bilgileri eksik olduğunda `openclaw configure --section model` önerebilir.
- Sandbox modu etkinse ancak Docker kullanılamıyorsa doctor, çözüm önerisiyle birlikte yüksek sinyalli bir uyarı bildirir (`install Docker` veya `openclaw config set agents.defaults.sandbox.mode off`).
- `gateway.auth.token`/`gateway.auth.password` SecretRef ile yönetiliyorsa ve geçerli komut yolunda kullanılamıyorsa doctor salt okunur bir uyarı bildirir ve düz metin geri dönüş kimlik bilgileri yazmaz.
- Bir düzeltme yolunda kanal SecretRef incelemesi başarısız olursa doctor erken çıkmak yerine devam eder ve bir uyarı bildirir.
- Telegram `allowFrom` kullanıcı adı otomatik çözümlemesi (`doctor --fix`), geçerli komut yolunda çözümlenebilir bir Telegram token'ı gerektirir. Token incelemesi kullanılamıyorsa doctor bir uyarı bildirir ve bu çalıştırmada otomatik çözümlemeyi atlar.

## macOS: `launchctl` ortam geçersiz kılmaları

Daha önce `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (veya `...PASSWORD`) çalıştırdıysanız bu değer yapılandırma dosyanızı geçersiz kılar ve kalıcı “unauthorized” hatalarına neden olabilir.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway doctor](/tr/gateway/doctor)
