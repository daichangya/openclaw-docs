---
read_when:
    - Yapılandırma/durum üzerinde hızlı bir güvenlik denetimi çalıştırmak istiyorsunuz
    - Güvenli “düzelt” önerilerini uygulamak istiyorsunuz (izinler, varsayılanları sıkılaştırma)
summary: Yaygın güvenlik ayaklarına dolanma durumlarını denetleyen ve düzelten `openclaw security` için CLI başvurusu
title: güvenlik
x-i18n:
    generated_at: "2026-04-23T09:01:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92b80468403b7d329391c40add9ae9c0e2423f5c6ff162291fa13ab91ace985d
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

Güvenlik araçları (denetim + isteğe bağlı düzeltmeler).

İlgili:

- Güvenlik kılavuzu: [Güvenlik](/tr/gateway/security)

## Denetim

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

Denetim, birden fazla DM göndereni ana oturumu paylaştığında uyarır ve **güvenli DM modu** önerir: paylaşılan gelen kutuları için `session.dmScope="per-channel-peer"` (veya çok hesaplı kanallar için `per-account-channel-peer"`).
Bu, işbirlikçi/paylaşılan gelen kutularını sertleştirmek içindir. Karşılıklı olarak güvenilmeyen/hasmane operatörler arasında paylaşılan tek bir Gateway önerilen bir kurulum değildir; güven sınırlarını ayrı gateway'lerle (veya ayrı OS kullanıcıları/host'larıyla) ayırın.
Ayrıca yapılandırma muhtemel paylaşılan kullanıcı girişini düşündürdüğünde `security.trust_model.multi_user_heuristic` üretir (örneğin açık DM/grup ilkesi, yapılandırılmış grup hedefleri veya joker gönderen kuralları) ve OpenClaw'ın varsayılan olarak kişisel yardımcı güven modeline sahip olduğunu hatırlatır.
Kasıtlı paylaşılan kullanıcı kurulumları için denetim kılavuzu, tüm oturumları sandbox içine almak, dosya sistemi erişimini çalışma alanıyla sınırlı tutmak ve kişisel/özel kimlikleri veya kimlik bilgilerini bu çalışma zamanından uzak tutmaktır.
Ayrıca küçük modeller (`<=300B`), sandbox olmadan ve web/browser araçları etkinken kullanıldığında da uyarır.
Webhook girişi için, `hooks.token` Gateway token'ını yeniden kullandığında, `hooks.token` kısa olduğunda, `hooks.path="/"` olduğunda, `hooks.defaultSessionKey` ayarlanmamış olduğunda, `hooks.allowedAgentIds` sınırsız olduğunda, istek `sessionKey` geçersiz kılmaları etkin olduğunda ve geçersiz kılmalar `hooks.allowedSessionKeyPrefixes` olmadan etkin olduğunda uyarır.
Ayrıca sandbox Docker ayarları, sandbox modu kapalıyken yapılandırıldığında; `gateway.nodes.denyCommands`, etkisiz desen benzeri/bilinmeyen girdiler kullandığında (yalnızca tam node komut adı eşleştirmesi, shell metni filtreleme değil); `gateway.nodes.allowCommands`, tehlikeli node komutlarını açıkça etkinleştirdiğinde; genel `tools.profile="minimal"`, agent araç profilleri tarafından geçersiz kılındığında; açık gruplar sandbox/çalışma alanı korumaları olmadan çalışma zamanı/dosya sistemi araçlarını açığa çıkardığında; ve kurulu plugin araçları gevşek araç ilkesi altında erişilebilir olabildiğinde de uyarır.
Ayrıca `gateway.allowRealIpFallback=true` değerini işaretler (proxy'ler yanlış yapılandırıldıysa header spoofing riski) ve `discovery.mdns.mode="full"` değerini işaretler (mDNS TXT kayıtları yoluyla meta veri sızıntısı).
Ayrıca sandbox browser, `sandbox.browser.cdpSourceRange` olmadan Docker `bridge` ağı kullandığında uyarır.
Tehlikeli sandbox Docker ağ modlarını da işaretler (`host` ve `container:*` ad alanı birleşmeleri dahil).
Ayrıca mevcut sandbox browser Docker konteynerlerinde eksik/eski hash etiketleri olduğunda da uyarır (örneğin `openclaw.browserConfigEpoch` eksik olan geçiş öncesi konteynerler) ve `openclaw sandbox recreate --browser --all` önerir.
Ayrıca npm tabanlı plugin/hook kurulum kayıtları pin'lenmemişse, integrity meta verisi eksikse veya şu anda kurulu paket sürümlerinden sapıyorsa da uyarır.
Kanal izin listeleri kararlı ID'ler yerine değiştirilebilir adlara/e-postalara/tag'lere dayanıyorsa uyarır (uygulanabildiği yerlerde Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC kapsamları).
`gateway.auth.mode="none"`, Gateway HTTP API'lerini paylaşılan bir sır olmadan erişilebilir bıraktığında da uyarır (`/tools/invoke` ile etkin tüm `/v1/*` uç noktaları dahil).
`dangerous`/`dangerously` önekli ayarlar, açık acil durum operatör geçersiz kılmalarıdır; bunlardan birini etkinleştirmek tek başına bir güvenlik açığı raporu değildir.
Tehlikeli parametrelerin tam envanteri için [Güvenlik](/tr/gateway/security) içindeki "Insecure or dangerous flags summary" bölümüne bakın.

SecretRef davranışı:

- `security audit`, hedeflenen yollar için desteklenen SecretRef'leri salt okunur modda çözümler.
- Bir SecretRef mevcut komut yolunda kullanılamıyorsa denetim devam eder ve çökme yerine `secretDiagnostics` raporlar.
- `--token` ve `--password`, yalnızca o komut çağrısı için derin prob auth'unu geçersiz kılar; yapılandırmayı veya SecretRef eşlemelerini yeniden yazmazlar.

## JSON çıktısı

CI/ilke denetimleri için `--json` kullanın:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

`--fix` ve `--json` birlikte kullanılırsa çıktı hem düzeltme eylemlerini hem de son raporu içerir:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` neleri değiştirir

`--fix`, güvenli ve deterministik iyileştirmeler uygular:

- yaygın `groupPolicy="open"` değerlerini `groupPolicy="allowlist"` olarak değiştirir (desteklenen kanallardaki hesap varyantları dahil)
- WhatsApp grup ilkesi `allowlist` olarak değiştirildiğinde, bu liste mevcutsa ve yapılandırma zaten `allowFrom` tanımlamıyorsa, depolanan `allowFrom` dosyasından `groupAllowFrom` değerini başlatır
- `logging.redactSensitive` değerini `"off"` konumundan `"tools"` konumuna getirir
- durum/yapılandırma ve yaygın hassas dosyalar için izinleri sıkılaştırır
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, oturum
  `*.jsonl`)
- ayrıca `openclaw.json` içinden başvurulan yapılandırma include dosyalarının izinlerini de sıkılaştırır
- POSIX host'larda `chmod`, Windows'ta `icacls` sıfırlamaları kullanır

`--fix` şunları **yapmaz**:

- token/parola/API anahtarlarını döndürmez
- araçları devre dışı bırakmaz (`gateway`, `cron`, `exec` vb.)
- Gateway bind/auth/ağ maruziyeti seçimlerini değiştirmez
- plugin/Skills kaldırmaz veya yeniden yazmaz
