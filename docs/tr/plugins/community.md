---
read_when:
    - Üçüncü taraf OpenClaw Plugin'lerini bulmak istiyorsunuz
    - Kendi Plugin'inizi yayımlamak veya listelemek istiyorsunuz
summary: 'Topluluk tarafından sürdürülen OpenClaw Plugin''leri: göz atın, kurun ve kendinizinkini gönderin'
title: Topluluk Plugin'leri
x-i18n:
    generated_at: "2026-04-21T09:01:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59be629cc5e271cec459eaaaa587487a4225a12f721ec22a3fefa3f29ac057fa
    source_path: plugins/community.md
    workflow: 15
---

# Topluluk Plugin'leri

Topluluk Plugin'leri, OpenClaw'ı yeni
kanallar, araçlar, sağlayıcılar veya diğer yeteneklerle genişleten üçüncü taraf paketlerdir. Topluluk tarafından geliştirilir ve sürdürülür,
[ClawHub](/tr/tools/clawhub) veya npm üzerinde yayımlanır ve
tek bir komutla kurulabilir.

ClawHub, topluluk Plugin'leri için kanonik keşif yüzeyidir. Yalnızca Plugin'inizi burada keşfedilebilir kılmak için
yalnızca dokümantasyon PR'leri açmayın; bunun yerine
ClawHub üzerinde yayımlayın.

```bash
openclaw plugins install <package-name>
```

OpenClaw önce ClawHub'ı kontrol eder ve ardından otomatik olarak npm'e geri döner.

## Listelenen Plugin'ler

### Apify

20.000+ hazır scraper ile herhangi bir web sitesinden veri kazıyın. Agent'ınızın
Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, e-ticaret siteleri ve daha fazlasından yalnızca sorarak veri çıkarmasını sağlayın.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Codex App Server konuşmaları için bağımsız OpenClaw köprüsü. Bir sohbeti
bir Codex ileti dizisine bağlayın, bununla düz metinle konuşun ve devam ettirme, planlama, inceleme, model seçimi, Compaction ve daha fazlası için
sohbete özgü komutlarla denetleyin.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Stream modu kullanan kurumsal robot entegrasyonu. Herhangi bir DingTalk istemcisi üzerinden metin, görüntü ve
dosya mesajlarını destekler.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

OpenClaw için Lossless Context Management Plugin'i. DAG tabanlı konuşma
özetleme ve artımlı Compaction — belirteç kullanımını azaltırken
tam bağlam doğruluğunu korur.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Agent izlerini Opik'e aktaran resmî Plugin. Agent davranışını,
maliyeti, belirteçleri, hataları ve daha fazlasını izleyin.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

OpenClaw agent'ınıza gerçek zamanlı dudak senkronizasyonu, duygu
ifadeleri ve metinden sese dönüştürme ile bir Live2D avatar verin. AI varlık üretimi
ve Prometheus Marketplace'e tek tıkla dağıtım için oluşturucu araçları içerir. Şu anda alfa aşamasındadır.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

OpenClaw'ı QQ Bot API aracılığıyla QQ'ya bağlayın. Özel sohbetleri, grup
bahsetmelerini, kanal mesajlarını ve ses, görüntü, video
ve dosyalar dahil zengin medyayı destekler.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Tencent WeCom ekibi tarafından OpenClaw için WeCom kanal Plugin'i. WeCom Bot WebSocket kalıcı bağlantılarıyla desteklenir;
doğrudan mesajları ve grup sohbetlerini,
akış yanıtlarını, proaktif mesajlaşmayı, görüntü/dosya işlemeyi, Markdown
biçimlendirmeyi, yerleşik erişim denetimini ve belge/toplantı/mesajlaşma Skills'lerini destekler.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Plugin'inizi gönderin

Yararlı, belgelenmiş ve işletimi güvenli olan topluluk Plugin'lerini memnuniyetle karşılıyoruz.

<Steps>
  <Step title="ClawHub veya npm üzerinde yayımlayın">
    Plugin'iniz `openclaw plugins install \<package-name\>` ile kurulabilir olmalıdır.
    [ClawHub](/tr/tools/clawhub) üzerinde (tercih edilir) veya npm'de yayımlayın.
    Tam kılavuz için bkz. [Building Plugins](/tr/plugins/building-plugins).

  </Step>

  <Step title="GitHub üzerinde barındırın">
    Kaynak kod, kurulum belgeleri ve issue
    izleyicisi içeren herkese açık bir depoda bulunmalıdır.

  </Step>

  <Step title="Dokümantasyon PR'lerini yalnızca kaynak belge değişiklikleri için kullanın">
    Plugin'inizin keşfedilebilir olması için yalnızca bir dokümantasyon PR'sine ihtiyacınız yoktur. Bunun yerine
    ClawHub üzerinde yayımlayın.

    Yalnızca OpenClaw'ın kaynak belgelerinde gerçek bir içerik
    değişikliği gerekiyorsa, örneğin kurulum yönergelerini düzeltmek veya
    ana belge kümesine ait depolar arası
    belgeleri eklemek gibi durumlarda dokümantasyon PR'si açın.

  </Step>
</Steps>

## Kalite çıtası

| Gereklilik                  | Neden                                         |
| --------------------------- | --------------------------------------------- |
| ClawHub veya npm üzerinde yayımlanmış | Kullanıcıların `openclaw plugins install` komutunun çalışmasına ihtiyacı var |
| Herkese açık GitHub deposu  | Kaynak incelemesi, issue takibi, şeffaflık    |
| Kurulum ve kullanım belgeleri | Kullanıcıların bunu nasıl yapılandıracağını bilmesi gerekir |
| Etkin bakım                 | Yakın tarihli güncellemeler veya duyarlı issue işleme |

Düşük çabalı sarmalayıcılar, belirsiz sahiplik veya bakımsız paketler reddedilebilir.

## İlgili

- [Plugin'leri kurma ve yapılandırma](/tr/tools/plugin) — herhangi bir Plugin nasıl kurulur
- [Building Plugins](/tr/plugins/building-plugins) — kendinizinkini oluşturun
- [Plugin Manifest](/tr/plugins/manifest) — manifest şeması
