---
read_when:
    - Başsız Node ana makinesini çalıştırma
    - '`system.run` için macOS dışı bir Node’u eşleştirme'
summary: '`openclaw node` için CLI başvurusu (başsız Node ana makinesi)'
title: Node
x-i18n:
    generated_at: "2026-04-25T13:44:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8c4b4697da3c0a4594dedd0033a114728ec599a7d33089a33e290e3cfafa5cd
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Gateway WebSocket bağlantısına bağlanan ve bu makinede `system.run` / `system.which` sunan bir **başsız Node ana makinesi** çalıştırın.

## Neden bir Node ana makinesi kullanılmalı?

Ağınızdaki diğer makinelerde tam bir macOS yardımcı uygulaması kurmadan agent’ların **başka makinelerde komut çalıştırmasını** istediğinizde bir Node ana makinesi kullanın.

Yaygın kullanım senaryoları:

- Uzak Linux/Windows makinelerinde komut çalıştırma (build sunucuları, lab makineleri, NAS).
- Gateway üzerinde exec’i **sandbox** içinde tutarken, onaylanmış çalıştırmaları diğer ana makinelere devretme.
- Otomasyon veya CI Node’ları için hafif, başsız bir yürütme hedefi sağlama.

Yürütme, yine de Node ana makinesinde **exec onayları** ve agent başına izin listeleriyle korunur; böylece komut erişimini kapsamlı ve açık tutabilirsiniz.

## Tarayıcı proxy’si (sıfır yapılandırma)

`browser.enabled` Node üzerinde devre dışı bırakılmadığı sürece Node ana makineleri otomatik olarak bir tarayıcı proxy’si duyurur. Bu, agent’ın ek yapılandırma olmadan o Node üzerinde tarayıcı otomasyonunu kullanmasına olanak tanır.

Varsayılan olarak proxy, Node’un normal tarayıcı profili yüzeyini sunar. `nodeHost.browserProxy.allowProfiles` ayarlarsanız proxy kısıtlayıcı hâle gelir: izin listesinde olmayan profil hedeflemeleri reddedilir ve kalıcı profil oluşturma/silme yolları proxy üzerinden engellenir.

Gerekirse Node üzerinde devre dışı bırakın:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Çalıştırma (ön plan)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Seçenekler:

- `--host <host>`: Gateway WebSocket ana makinesi (varsayılan: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket portu (varsayılan: `18789`)
- `--tls`: Gateway bağlantısı için TLS kullan
- `--tls-fingerprint <sha256>`: Beklenen TLS sertifika parmak izi (sha256)
- `--node-id <id>`: Node kimliğini geçersiz kıl (eşleştirme token’ını temizler)
- `--display-name <name>`: Node görünen adını geçersiz kıl

## Node ana makinesi için Gateway kimlik doğrulaması

`openclaw node run` ve `openclaw node install`, Gateway kimlik doğrulamasını config/env üzerinden çözümler (Node komutlarında `--token`/`--password` bayrağı yoktur):

- Önce `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` denetlenir.
- Sonra yerel yapılandırma geri dönüşü: `gateway.auth.token` / `gateway.auth.password`.
- Yerel modda, Node ana makinesi kasıtlı olarak `gateway.remote.token` / `gateway.remote.password` değerlerini devralmaz.
- `gateway.auth.token` / `gateway.auth.password`, SecretRef üzerinden açıkça yapılandırılmışsa ve çözümlenmemişse, Node kimlik doğrulama çözümlemesi kapalı başarısız olur (uzak geri dönüş maskelemesi yoktur).
- `gateway.mode=remote` durumunda, uzak istemci alanları (`gateway.remote.token` / `gateway.remote.password`) da uzak öncelik kurallarına göre uygun kabul edilir.
- Node ana makinesi kimlik doğrulama çözümlemesi yalnızca `OPENCLAW_GATEWAY_*` env değişkenlerini dikkate alır.

Güvenilir bir özel ağ üzerindeki loopback olmayan bir `ws://` Gateway’e bağlanan bir Node için `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ayarlayın. Bu olmadan Node başlangıcı kapalı başarısız olur ve sizden `wss://`, SSH tüneli veya Tailscale kullanmanız istenir.
Bu, `openclaw.json` yapılandırma anahtarı değil, süreç ortamı üzerinden açık katılımlı bir ayardır.
`openclaw node install`, bu değişken kurulum komutu ortamında mevcutsa onu denetlenen Node hizmetine kalıcı olarak yazar.

## Hizmet (arka plan)

Bir başsız Node ana makinesini kullanıcı hizmeti olarak kurun.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Seçenekler:

- `--host <host>`: Gateway WebSocket ana makinesi (varsayılan: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket portu (varsayılan: `18789`)
- `--tls`: Gateway bağlantısı için TLS kullan
- `--tls-fingerprint <sha256>`: Beklenen TLS sertifika parmak izi (sha256)
- `--node-id <id>`: Node kimliğini geçersiz kıl (eşleştirme token’ını temizler)
- `--display-name <name>`: Node görünen adını geçersiz kıl
- `--runtime <runtime>`: Hizmet çalışma zamanı (`node` veya `bun`)
- `--force`: Zaten kuruluysa yeniden kur/üzerine yaz

Hizmeti yönetin:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Ön planda çalışan bir Node ana makinesi için `openclaw node run` kullanın (hizmet olmadan).

Hizmet komutları, makine tarafından okunabilir çıktı için `--json` kabul eder.

## Eşleştirme

İlk bağlantı, Gateway üzerinde bekleyen bir cihaz eşleştirme isteği (`role: node`) oluşturur.
Bunu şu komutla onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Sıkı denetimli Node ağlarında, Gateway operatörü güvenilir CIDR’lerden gelen ilk kez yapılan Node eşleştirmelerinin otomatik onayını açıkça etkinleştirebilir:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Bu varsayılan olarak devre dışıdır. Yalnızca istenen kapsamlar olmadan yapılan yeni `role: node` eşleştirmesine uygulanır. Operatör/tarayıcı istemcileri, Control UI, WebChat ve rol, kapsam, meta veri veya ortak anahtar yükseltmeleri yine de elle onay gerektirir.

Node, değişmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/ortak anahtar) eşleştirmeyi yeniden denerse, önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur.
Onaylamadan önce `openclaw devices list` komutunu yeniden çalıştırın.

Node ana makinesi, Node kimliğini, token’ını, görünen adını ve Gateway bağlantı bilgilerini
`~/.openclaw/node.json` içinde saklar.

## Exec onayları

`system.run`, yerel exec onaylarıyla geçitlenir:

- `~/.openclaw/exec-approvals.json`
- [Exec approvals](/tr/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (Gateway üzerinden düzenleme)

Onaylanmış eşzamansız Node exec için OpenClaw, istemden önce standart bir `systemRunPlan` hazırlar. Daha sonra iletilen onaylanmış `system.run`, bu saklanan planı yeniden kullanır; böylece onay isteği oluşturulduktan sonra komut/cwd/oturum alanlarında yapılan düzenlemeler yürütülecek şeyi değiştirmek yerine reddedilir.

## İlgili

- [CLI reference](/tr/cli)
- [Nodes](/tr/nodes)
