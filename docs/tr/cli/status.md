---
read_when:
    - Kanal sağlığı ve son oturum alıcıları için hızlı bir tanı istiyorsunuz
    - Hata ayıklama için yapıştırılabilir bir “all” durumu istiyorsunuz
summary: '`openclaw status` için CLI başvurusu (tanılamalar, sorgulamalar, kullanım anlık görüntüleri)'
title: Durum
x-i18n:
    generated_at: "2026-04-25T13:44:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: b191b8d78d43fb9426bfad495815fd06ab7188b413beff6fb7eb90f811b6d261
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

Kanallar + oturumlar için tanılamalar.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Notlar:

- `--deep`, canlı sorgulamalar çalıştırır (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage`, normalize edilmiş sağlayıcı kullanım pencerelerini `X% left` olarak yazdırır.
- Oturum durum çıktısı `Execution:` ile `Runtime:` değerlerini ayırır. `Execution`, sandbox yoludur (`direct`, `docker/*`), `Runtime` ise oturumun `OpenClaw Pi Default`, `OpenAI Codex`, bir CLI arka ucu veya `codex (acp/acpx)` gibi bir ACP arka ucu kullanıp kullanmadığını gösterir. Sağlayıcı/model/çalışma zamanı ayrımı için [Ajan çalışma zamanları](/tr/concepts/agent-runtimes) bölümüne bakın.
- MiniMax'in ham `usage_percent` / `usagePercent` alanları kalan kotayı gösterir; bu nedenle OpenClaw görüntülemeden önce bunları tersine çevirir. Mevcut olduğunda sayım tabanlı alanlar önceliklidir. `model_remains` yanıtları sohbet modeli girdisini tercih eder, gerektiğinde pencere etiketini zaman damgalarından türetir ve model adını plan etiketine ekler.
- Geçerli oturum anlık görüntüsü seyrek olduğunda, `/status` en son transcript kullanım günlüğünden token ve önbellek sayaçlarını geri doldurabilir. Mevcut sıfır olmayan canlı değerler yine transcript geri dönüş değerlerine üstün gelir.
- Transcript geri dönüşü, canlı oturum girdisinde eksik olduğunda etkin çalışma zamanı model etiketini de kurtarabilir. Bu transcript modeli seçili modelden farklıysa, durum bağlam penceresini seçili model yerine kurtarılan çalışma zamanı modeline göre çözümler.
- İstem boyutu muhasebesi için transcript geri dönüşü, oturum meta verisi eksik olduğunda veya daha küçük olduğunda daha büyük istem odaklı toplamı tercih eder; böylece özel sağlayıcı oturumları `0` token görüntülerine düşmez.
- Çıktı, birden fazla ajan yapılandırıldığında ajan başına oturum depolarını içerir.
- Genel bakış, kullanılabildiğinde Gateway + node host hizmet kurulum/çalışma durumu bilgisini içerir.
- Genel bakış, güncelleme kanalı + git SHA bilgisini içerir (kaynak checkout'ları için).
- Güncelleme bilgisi Genel Bakış'ta gösterilir; bir güncelleme varsa, durum `openclaw update` çalıştırmanız için bir ipucu yazdırır (bkz. [Güncelleme](/tr/install/updating)).
- Salt okunur durum yüzeyleri (`status`, `status --json`, `status --all`), mümkün olduğunda hedeflenen yapılandırma yolları için desteklenen SecretRef'leri çözümler.
- Desteklenen bir kanal SecretRef'i yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa, durum salt okunur kalır ve çökme yerine bozulmuş çıktı bildirir. İnsanlara yönelik çıktı “configured token unavailable in this command path” gibi uyarılar gösterir ve JSON çıktısı `secretDiagnostics` içerir.
- Komut yerel SecretRef çözümlemesi başarılı olduğunda, durum çözümlenmiş anlık görüntüyü tercih eder ve son çıktıdan geçici “secret unavailable” kanal işaretlerini temizler.
- `status --all`, bir Secrets genel bakış satırı ve rapor oluşturmayı durdurmadan gizli tanılamaları özetleyen (okunabilirlik için kısaltılmış) bir tanı bölümü içerir.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Doctor](/tr/gateway/doctor)
