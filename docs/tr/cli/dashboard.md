---
read_when:
    - Control UI'yi mevcut token'ınızla açmak istiyorsunuz
    - Tarayıcı başlatmadan URL'yi yazdırmak istiyorsunuz
summary: '`openclaw dashboard` için CLI başvurusu (Control UI''yi aç)'
title: Kontrol Paneli
x-i18n:
    generated_at: "2026-04-25T13:43:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce485388465fb93551be8ccf0aa01ea52e4feb949ef0d48c96b4f8ea65a6551c
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Geçerli kimlik doğrulamanızı kullanarak Control UI'yi açın.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Notlar:

- `dashboard`, mümkün olduğunda yapılandırılmış `gateway.auth.token` SecretRef'lerini çözümler.
- `dashboard`, `gateway.tls.enabled` ayarını izler: TLS etkin gateway'ler `https://` Control UI URL'lerini yazdırır/açar ve `wss://` üzerinden bağlanır.
- SecretRef ile yönetilen token'lar için (çözümlenmiş veya çözümlenmemiş), `dashboard` terminal çıktısında, pano geçmişinde veya tarayıcı başlatma bağımsız değişkenlerinde dış sırların açığa çıkmasını önlemek için token içermeyen bir URL yazdırır/kopyalar/açar.
- `gateway.auth.token` SecretRef ile yönetiliyorsa ancak bu komut yolunda çözümlenemiyorsa, komut geçersiz bir token yer tutucusu gömmek yerine token içermeyen bir URL ve açık düzeltme rehberliği yazdırır.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Dashboard](/tr/web/dashboard)
