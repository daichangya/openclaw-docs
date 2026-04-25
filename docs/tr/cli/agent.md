---
read_when:
    - Betiklerden tek bir ajan dönüşü çalıştırmak istiyorsunuz (isteğe bağlı olarak yanıtı iletmek)
summary: '`openclaw agent` için CLI başvurusu (Gateway üzerinden bir ajan dönüşü gönder)'
title: Ajan
x-i18n:
    generated_at: "2026-04-25T13:43:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: e06681ffbed56cb5be05c7758141e784eac8307ed3c6fc973f71534238b407e1
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Gateway üzerinden bir ajan dönüşü çalıştırın (gömülü kullanım için `--local` kullanın).
Yapılandırılmış bir ajanı doğrudan hedeflemek için `--agent <id>` kullanın.

En az bir oturum seçici iletin:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

İlgili:

- Ajan gönderme aracı: [Agent send](/tr/tools/agent-send)

## Seçenekler

- `-m, --message <text>`: gerekli mesaj gövdesi
- `-t, --to <dest>`: oturum anahtarını türetmek için kullanılan alıcı
- `--session-id <id>`: açık oturum kimliği
- `--agent <id>`: ajan kimliği; yönlendirme bağlamalarını geçersiz kılar
- `--thinking <level>`: ajan düşünme seviyesi (`off`, `minimal`, `low`, `medium`, `high`; ayrıca `xhigh`, `adaptive` veya `max` gibi sağlayıcının desteklediği özel seviyeler)
- `--verbose <on|off>`: oturum için ayrıntılı düzeyi kalıcı yapar
- `--channel <channel>`: teslim kanalı; ana oturum kanalını kullanmak için boş bırakın
- `--reply-to <target>`: teslim hedefi geçersiz kılma
- `--reply-channel <channel>`: teslim kanalı geçersiz kılma
- `--reply-account <id>`: teslim hesabı geçersiz kılma
- `--local`: gömülü ajanı doğrudan çalıştırır (Plugin kayıt defteri ön yüklemesinden sonra)
- `--deliver`: yanıtı seçilen kanala/hedefe geri gönderir
- `--timeout <seconds>`: ajan zaman aşımını geçersiz kılar (varsayılan 600 veya yapılandırma değeri)
- `--json`: JSON çıktısı verir

## Örnekler

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Notlar

- Gateway modu, Gateway isteği başarısız olduğunda gömülü ajana geri döner. Baştan gömülü yürütmeyi zorlamak için `--local` kullanın.
- `--local`, yine de önce Plugin kayıt defterini önceden yükler; böylece Plugin tarafından sağlanan sağlayıcılar, araçlar ve kanallar gömülü çalıştırmalar sırasında kullanılabilir kalır.
- Her `openclaw agent` çağrısı tek seferlik çalıştırma olarak değerlendirilir. Bu çalıştırma için açılan paketlenmiş veya kullanıcı tarafından yapılandırılmış MCP sunucuları, komut Gateway yolunu kullansa bile yanıt sonrasında sonlandırılır; böylece `stdio` MCP alt süreçleri betik tabanlı çağrılar arasında canlı kalmaz.
- `--channel`, `--reply-channel` ve `--reply-account`, oturum yönlendirmesini değil, yanıt teslimini etkiler.
- `--json`, `stdout`'u JSON yanıtı için ayrılmış tutar. Gateway, Plugin ve gömülü geri dönüş tanılamaları `stderr`'e yönlendirilir; böylece betikler `stdout`'u doğrudan ayrıştırabilir.
- Bu komut `models.json` yeniden oluşturmayı tetiklediğinde, SecretRef tarafından yönetilen sağlayıcı kimlik bilgileri çözümlenmiş düz gizli metin olarak değil, gizli olmayan işaretleyiciler olarak kalıcılaştırılır (örneğin ortam değişkeni adları, `secretref-env:ENV_VAR_NAME` veya `secretref-managed`).
- İşaretleyici yazımları kaynak açısından yetkilidir: OpenClaw, çözümlenmiş çalışma zamanı gizli değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsündeki işaretleyicileri kalıcılaştırır.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Ajan çalışma zamanı](/tr/concepts/agent)
