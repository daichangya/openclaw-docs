---
read_when:
    - Betiklerden bir agent turu çalıştırmak istiyorsunuz (isteğe bağlı olarak yanıtı teslim edin)
summary: Gateway üzerinden `openclaw agent` için CLI başvurusu (bir agent turu gönder)
title: agent
x-i18n:
    generated_at: "2026-04-23T08:59:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ba3181d74e9a8d6d607ee62b18e1e6fd693e64e7789e6b29b7f7b1ccb7b69d0
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Gateway üzerinden bir agent turu çalıştırın (gömülü kullanım için `--local` kullanın).
Yapılandırılmış bir agent'ı doğrudan hedeflemek için `--agent <id>` kullanın.

En az bir oturum seçici verin:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

İlgili:

- Agent gönderme tool'u: [Agent send](/tr/tools/agent-send)

## Seçenekler

- `-m, --message <text>`: zorunlu mesaj gövdesi
- `-t, --to <dest>`: oturum anahtarını türetmek için kullanılan alıcı
- `--session-id <id>`: açık oturum kimliği
- `--agent <id>`: agent kimliği; yönlendirme bağlamalarını geçersiz kılar
- `--thinking <level>`: agent düşünme düzeyi (`off`, `minimal`, `low`, `medium`, `high` ve `xhigh`, `adaptive` veya `max` gibi sağlayıcının desteklediği özel düzeyler)
- `--verbose <on|off>`: ayrıntılı düzeyi oturum için kalıcılaştırır
- `--channel <channel>`: teslimat kanalı; ana oturum kanalını kullanmak için boş bırakın
- `--reply-to <target>`: teslimat hedefi geçersiz kılması
- `--reply-channel <channel>`: teslimat kanalı geçersiz kılması
- `--reply-account <id>`: teslimat hesabı geçersiz kılması
- `--local`: gömülü agent'ı doğrudan çalıştırın (Plugin kayıt defteri ön yüklemesinden sonra)
- `--deliver`: yanıtı seçilen kanala/hedefe geri gönder
- `--timeout <seconds>`: agent zaman aşımını geçersiz kılar (varsayılan 600 veya config değeri)
- `--json`: JSON çıktısı ver

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

- Gateway modu, Gateway isteği başarısız olduğunda gömülü agent'a fallback yapar. Baştan gömülü yürütmeyi zorlamak için `--local` kullanın.
- `--local`, gömülü çalıştırmalar sırasında Plugin tarafından sağlanan sağlayıcıların, tools'ların ve kanalların kullanılabilir kalması için önce Plugin kayıt defterini yine de ön yükler.
- `--channel`, `--reply-channel` ve `--reply-account`, oturum yönlendirmesini değil yanıt teslimini etkiler.
- Bu komut `models.json` yeniden oluşturmayı tetiklediğinde, SecretRef tarafından yönetilen sağlayıcı kimlik bilgileri çözülmüş düz gizli metin olarak değil, gizli olmayan işaretleyiciler olarak kalıcılaştırılır (örneğin env değişken adları, `secretref-env:ENV_VAR_NAME` veya `secretref-managed`).
- İşaretleyici yazımları kaynak yetkilidir: OpenClaw, işaretleyicileri çözülmüş çalışma zamanı gizli değerlerinden değil, etkin kaynak config snapshot'undan kalıcılaştırır.
