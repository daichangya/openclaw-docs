---
read_when:
    - Eşleştirilmiş Node'ları yönetiyorsunuz (kameralar, ekran, canvas)
    - İstekleri onaylamanız veya Node komutlarını invoke etmeniz gerekiyor
summary: '`openclaw nodes` için CLI başvurusu (durum, eşleştirme, invoke, kamera/canvas/ekran)'
title: Node'lar
x-i18n:
    generated_at: "2026-04-25T13:44:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68a5701ce0dcba399d93f6eed864b0b0ae34320501de0176aeaad1712d392834
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Eşleştirilmiş Node'ları (cihazları) yönetin ve Node yeteneklerini invoke edin.

İlgili:

- Node'lara genel bakış: [Node'lar](/tr/nodes)
- Kamera: [Kamera Node'ları](/tr/nodes/camera)
- Görseller: [Görsel Node'ları](/tr/nodes/images)

Yaygın seçenekler:

- `--url`, `--token`, `--timeout`, `--json`

## Yaygın komutlar

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list`, bekleyen/eşleştirilmiş tabloları yazdırır. Eşleştirilmiş satırlar en son bağlantı yaşını (Last Connect) içerir.
Yalnızca şu anda bağlı Node'ları göstermek için `--connected` kullanın. Bir süre içinde bağlanan
Node'lara filtrelemek için `--last-connected <duration>` kullanın (ör. `24h`, `7d`).

Onay notu:

- `openclaw nodes pending` yalnızca eşleştirme kapsamına ihtiyaç duyar.
- `gateway.nodes.pairing.autoApproveCidrs`, yalnızca açıkça güvenilen, ilk kez yapılan `role: node` cihaz eşleştirmesi için
  bekleyen adımını atlayabilir. Varsayılan olarak kapalıdır ve
  yükseltmeleri onaylamaz.
- `openclaw nodes approve <requestId>`, bekleyen isteğin
  ek kapsam gereksinimlerini devralır:
  - komutsuz istek: yalnızca eşleştirme
  - exec olmayan Node komutları: eşleştirme + write
  - `system.run` / `system.run.prepare` / `system.which`: eşleştirme + admin

## Invoke

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Invoke bayrakları:

- `--params <json>`: JSON nesne dizesi (varsayılan `{}`).
- `--invoke-timeout <ms>`: Node invoke zaman aşımı (varsayılan `15000`).
- `--idempotency-key <key>`: isteğe bağlı idempotency anahtarı.
- `system.run` ve `system.run.prepare` burada engellenir; kabuk yürütmesi için `host=node` ile `exec` aracını kullanın.

Bir Node üzerinde kabuk yürütmesi için `openclaw nodes run` yerine `host=node` ile `exec` aracını kullanın.
`nodes` CLI artık yetenek odaklıdır: `nodes invoke` ile doğrudan RPC, ayrıca eşleştirme, kamera,
ekran, konum, canvas ve bildirimler.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Node'lar](/tr/nodes)
