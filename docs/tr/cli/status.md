---
read_when:
    - Kanal sağlığı ve son oturum alıcıları hakkında hızlı bir tanılama istiyorsunuz.
    - Hata ayıklama için yapıştırılabilir bir “all” durumu istiyorsunuz.
summary: '`openclaw status` için CLI başvurusu (tanılama, problar, kullanım anlık görüntüleri)'
title: durum
x-i18n:
    generated_at: "2026-04-23T13:57:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 015614e329ec172a62c625581897fa64589f12dfe28edefe8a2764b5b5367b2a
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

Kanallar + oturumlar için tanılama.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Notlar:

- `--deep` canlı probları çalıştırır (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage`, normalize edilmiş sağlayıcı kullanım pencerelerini `X% kaldı` olarak yazdırır.
- Oturum durumu çıktısı artık `Runtime:` ile `Runner:` alanlarını ayırır. `Runtime`, yürütme yolunu ve sandbox durumunu gösterir (`direct`, `docker/*`), `Runner` ise oturumun gömülü Pi, CLI destekli bir sağlayıcı ya da `codex (acp/acpx)` gibi ACP harness backend’i kullanıp kullanmadığını belirtir.
- MiniMax’in ham `usage_percent` / `usagePercent` alanları kalan kotayı gösterir; bu nedenle OpenClaw görüntülemeden önce bunları tersine çevirir. Mevcut olduğunda sayı tabanlı alanlar önceliklidir. `model_remains` yanıtları sohbet modeli girdisini tercih eder, gerektiğinde pencere etiketini zaman damgalarından türetir ve plan etiketine model adını ekler.
- Geçerli oturum anlık görüntüsü seyrek olduğunda, `/status` en son transkript kullanım günlüğünden token ve önbellek sayaçlarını geri doldurabilir. Mevcut sıfır olmayan canlı değerler yine transkript yedek değerlerine göre önceliklidir.
- Transkript yedeği, canlı oturum girdisinde eksik olduğunda etkin çalışma zamanı model etiketini de geri getirebilir. Bu transkript modeli seçili modelden farklıysa, durum bağlam penceresini seçili model yerine geri getirilen çalışma zamanı modeline göre çözümler.
- İstem boyutu muhasebesi için, oturum meta verisi eksikse veya daha küçükse transkript yedeği istem odaklı daha büyük toplamı tercih eder; böylece özel sağlayıcı oturumları `0` token gösterimine düşmez.
- Çıktı, birden fazla aracı yapılandırıldığında aracı başına oturum depolarını içerir.
- Genel bakış, mevcut olduğunda Gateway + Node ana makine hizmeti kurulum/çalışma durumu bilgilerini içerir.
- Genel bakış, güncelleme kanalını + git SHA’sını içerir (kaynak kod checkout’ları için).
- Güncelleme bilgisi Genel Bakış’ta gösterilir; bir güncelleme mevcutsa status, `openclaw update` çalıştırmanız için bir ipucu yazdırır (bkz. [Güncelleme](/tr/install/updating)).
- Salt okunur durum yüzeyleri (`status`, `status --json`, `status --all`), mümkün olduğunda hedeflenen yapılandırma yolları için desteklenen SecretRef’leri çözümler.
- Desteklenen bir kanal SecretRef’i yapılandırılmış ancak mevcut komut yolunda kullanılamıyorsa, status salt okunur kalır ve çökmek yerine bozulmuş çıktıyı bildirir. İnsan tarafından okunabilir çıktı “configured token unavailable in this command path” gibi uyarılar gösterir, JSON çıktısı ise `secretDiagnostics` içerir.
- Komuta yerel SecretRef çözümlemesi başarılı olduğunda, status çözülmüş anlık görüntüyü tercih eder ve son çıktıdan geçici “secret unavailable” kanal işaretlerini temizler.
- `status --all`, bir Secrets genel bakış satırı ve rapor oluşturmayı durdurmadan gizli tanılamayı özetleyen bir tanılama bölümü içerir (okunabilirlik için kısaltılmıştır).
