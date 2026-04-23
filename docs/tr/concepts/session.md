---
read_when:
    - Oturum yönlendirmesini ve yalıtımını anlamak istiyorsunuz
    - Çok kullanıcılı kurulumlar için DM kapsamını yapılandırmak istiyorsunuz
summary: OpenClaw'ın konuşma oturumlarını nasıl yönettiği
title: Oturum Yönetimi
x-i18n:
    generated_at: "2026-04-23T09:02:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: d099ef7f3b484cf0fa45ddbf5648a7497d6509209e4de08c8484102eca073a2b
    source_path: concepts/session.md
    workflow: 15
---

# Oturum Yönetimi

OpenClaw konuşmaları **oturumlar** halinde düzenler. Her mesaj,
nereden geldiğine göre bir oturuma yönlendirilir -- DM'ler, grup sohbetleri, Cron işleri vb.

## Mesajlar nasıl yönlendirilir

| Kaynak          | Davranış                  |
| --------------- | ------------------------- |
| Doğrudan mesajlar | Varsayılan olarak paylaşılan oturum |
| Grup sohbetleri     | Grup başına yalıtılmış        |
| Odalar/kanallar  | Oda başına yalıtılmış         |
| Cron işleri       | Çalıştırma başına yeni oturum     |
| Webhook'lar        | Hook başına yalıtılmış         |

## DM yalıtımı

Varsayılan olarak tüm DM'ler süreklilik için tek bir oturumu paylaşır. Bu,
tek kullanıcılı kurulumlar için uygundur.

<Warning>
Birden fazla kişi agent'ınıza mesaj gönderebiliyorsa DM yalıtımını etkinleştirin. Aksi halde tüm
kullanıcılar aynı konuşma bağlamını paylaşır -- Alice'in özel mesajları
Bob tarafından görülebilir.
</Warning>

**Çözüm:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // kanal + göndericiye göre yalıt
  },
}
```

Diğer seçenekler:

- `main` (varsayılan) -- tüm DM'ler tek bir oturumu paylaşır.
- `per-peer` -- göndericiye göre yalıtır (kanallar arasında).
- `per-channel-peer` -- kanal + göndericiye göre yalıtır (önerilir).
- `per-account-channel-peer` -- hesap + kanal + göndericiye göre yalıtır.

<Tip>
Aynı kişi size birden çok kanaldan ulaşıyorsa,
kimliklerini bağlayarak tek bir oturumu paylaşmalarını sağlamak için
`session.identityLinks` kullanın.
</Tip>

Kurulumunuzu `openclaw security audit` ile doğrulayın.

## Oturum yaşam döngüsü

Oturumlar süreleri dolana kadar yeniden kullanılır:

- **Günlük sıfırlama** (varsayılan) -- gateway
  ana makinesinin yerel saatine göre sabah 4:00'te yeni oturum.
- **Boşta sıfırlama** (isteğe bağlı) -- bir süre hareketsizlikten sonra yeni oturum. `session.reset.idleMinutes`
  ayarlayın.
- **Elle sıfırlama** -- sohbette `/new` veya `/reset` yazın. `/new <model>` ayrıca
  modeli değiştirir.

Günlük ve boşta sıfırlama birlikte yapılandırıldığında önce hangisinin süresi dolarsa o geçerli olur.

Etkin bir sağlayıcıya ait CLI oturumu bulunan oturumlar örtük
günlük varsayılan tarafından kesilmez. Bu oturumların zamanlayıcıyla sona ermesi gerekiyorsa
`/reset` kullanın veya `session.reset` ayarını açıkça yapılandırın.

## Durum nerede tutulur

Tüm oturum durumu **gateway** tarafından sahiplenilir. UI istemcileri oturum verileri için gateway'i sorgular.

- **Depo:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkriptler:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## Oturum bakımı

OpenClaw zaman içinde oturum depolamasını otomatik olarak sınırlar. Varsayılan olarak
`warn` modunda çalışır (neyin temizleneceğini bildirir). Otomatik temizleme için `session.maintenance.mode`
değerini `"enforce"` olarak ayarlayın:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

`openclaw sessions cleanup --dry-run` ile önizleyin.

## Oturumları inceleme

- `openclaw status` -- oturum deposu yolu ve son etkinlik.
- `openclaw sessions --json` -- tüm oturumlar (`--active <minutes>` ile filtreleyin).
- sohbette `/status` -- bağlam kullanımı, model ve geçişler.
- `/context list` -- sistem prompt'u içinde neler var.

## Ek okumalar

- [Session Pruning](/tr/concepts/session-pruning) -- araç sonuçlarını kırpma
- [Compaction](/tr/concepts/compaction) -- uzun konuşmaları özetleme
- [Session Tools](/tr/concepts/session-tool) -- oturumlar arası çalışma için agent araçları
- [Session Management Deep Dive](/tr/reference/session-management-compaction) --
  depo şeması, transkriptler, gönderim ilkesi, kaynak meta verisi ve gelişmiş config
- [Multi-Agent](/tr/concepts/multi-agent) — agent'lar arasında yönlendirme ve oturum yalıtımı
- [Background Tasks](/tr/automation/tasks) — ayrılmış işlerin oturum başvuruları ile görev kayıtlarını nasıl oluşturduğu
- [Channel Routing](/tr/channels/channel-routing) — gelen mesajların oturumlara nasıl yönlendirildiği
