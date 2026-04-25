---
read_when:
    - voice-call Plugin'ini kullanıyorsunuz ve CLI giriş noktalarını istiyorsunuz
    - '`voicecall setup|smoke|call|continue|dtmf|status|tail|expose` için hızlı örnekler istiyorsunuz'
summary: '`openclaw voicecall` için CLI başvurusu (voice-call Plugin komut yüzeyi)'
title: Voicecall
x-i18n:
    generated_at: "2026-04-25T13:44:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c8b83ef75f792920024a67b0dee1b07aff9f55486de1149266c6d94854ca0fe
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall`, Plugin tarafından sağlanan bir komuttur. Yalnızca voice-call Plugin'i yüklü ve etkinse görünür.

Birincil belge:

- Voice-call Plugin'i: [Voice Call](/tr/plugins/voice-call)

## Yaygın komutlar

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup`, varsayılan olarak insan tarafından okunabilir hazır olma kontrollerini yazdırır. Betikler için `--json` kullanın:

```bash
openclaw voicecall setup --json
```

Harici sağlayıcılar (`twilio`, `telnyx`, `plivo`) için kurulum, `publicUrl`, bir tünel veya Tailscale exposure üzerinden herkese açık bir Webhook URL'si çözümlemelidir. Döngüsel geri adres/özel sunum geri dönüşü reddedilir çünkü taşıyıcılar buna erişemez.

`smoke`, aynı hazır olma kontrollerini çalıştırır. Hem `--to` hem de `--yes` mevcut olmadıkça gerçek bir telefon araması yapmaz:

```bash
openclaw voicecall smoke --to "+15555550123"        # deneme çalıştırması
openclaw voicecall smoke --to "+15555550123" --yes  # canlı bildirim araması
```

## Webhook'ları dışa açma (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Güvenlik notu: Webhook uç noktasını yalnızca güvendiğiniz ağlara açın. Mümkün olduğunda Funnel yerine Tailscale Serve tercih edin.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Voice call Plugin'i](/tr/plugins/voice-call)
