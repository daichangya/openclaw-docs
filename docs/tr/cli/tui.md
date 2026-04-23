---
read_when:
    - Gateway için bir terminal UI istiyorsunuz (uzak kullanım dostu)
    - Betiklerden url/token/session geçirmek istiyorsunuz
    - TUI'yi Gateway olmadan yerel gömülü modda çalıştırmak istiyorsunuz
    - '`openclaw chat` veya `openclaw tui --local` kullanmak istiyorsunuz'
summary: '`openclaw tui` için CLI başvurusu (Gateway destekli veya yerel gömülü terminal UI)'
title: TUI
x-i18n:
    generated_at: "2026-04-23T09:01:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4fca025a15f5e985ca6f2eaf39fcbe784bd716f24841f43450b71936db26d141
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Gateway'e bağlı terminal UI'yi açın veya bunu yerel gömülü
modda çalıştırın.

İlgili:

- TUI kılavuzu: [TUI](/tr/web/tui)

Notlar:

- `chat` ve `terminal`, `openclaw tui --local` için takma adlardır.
- `--local`, `--url`, `--token` veya `--password` ile birlikte kullanılamaz.
- `tui`, mümkün olduğunda token/parola kimlik doğrulaması için yapılandırılmış Gateway auth SecretRef'lerini çözümler (`env`/`file`/`exec` sağlayıcıları).
- Yapılandırılmış bir aracı çalışma alanı dizini içinden başlatıldığında, TUI oturum anahtarı varsayılanı için o aracıyı otomatik seçer (`--session` açıkça `agent:<id>:...` değilse).
- Yerel mod, gömülü aracı çalışma zamanını doğrudan kullanır. Çoğu yerel araç çalışır, ancak yalnızca Gateway'e özgü özellikler kullanılamaz.
- Yerel mod, TUI komut yüzeyine `/auth [provider]` ekler.
- Plugin onay geçitleri yerel modda da geçerlidir. Onay gerektiren araçlar terminalde karar ister; Gateway dahil olmadığı için hiçbir şey sessizce otomatik onaylanmaz.

## Örnekler

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# bir aracı çalışma alanı içinde çalıştırıldığında, o aracı otomatik olarak çıkarır
openclaw tui --session bugfix
```

## Yapılandırma onarım döngüsü

Geçerli yapılandırma zaten doğrulanıyorsa ve gömülü aracının bunu incelemesini,
belgelerle karşılaştırmasını ve aynı terminalden onarmaya yardımcı olmasını
istiyorsanız yerel modu kullanın:

`openclaw config validate` zaten başarısız oluyorsa önce `openclaw configure` veya
`openclaw doctor --fix` kullanın. `openclaw chat`, geçersiz yapılandırma
korumasını atlatmaz.

```bash
openclaw chat
```

Ardından TUI içinde:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Hedefli düzeltmeleri `openclaw config set` veya `openclaw configure` ile uygulayın, ardından
`openclaw config validate` komutunu yeniden çalıştırın. Bkz. [TUI](/tr/web/tui) ve [Yapılandırma](/tr/cli/config).
