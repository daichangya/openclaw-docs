---
read_when:
    - OpenClaw'ı Hostinger üzerinde kurma
    - OpenClaw için yönetilen bir VPS mi arıyorsunuz?
    - Hostinger 1-Tık OpenClaw kullanımı
summary: OpenClaw'ı Hostinger üzerinde barındırın
title: Hostinger
x-i18n:
    generated_at: "2026-04-14T02:08:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf173cdcf6344f8ee22e839a27f4e063a3a102186f9acc07c4a33d4794e2c034
    source_path: install/hostinger.md
    workflow: 15
---

# Hostinger

[Hostinger](https://www.hostinger.com/openclaw) üzerinde, **1-Tık** yönetilen dağıtım veya **VPS** kurulumu aracılığıyla kalıcı bir OpenClaw Gateway çalıştırın.

## Önkoşullar

- Hostinger hesabı ([kayıt olun](https://www.hostinger.com/openclaw))
- Yaklaşık 5-10 dakika

## Seçenek A: 1-Tık OpenClaw

Başlamanın en hızlı yolu. Hostinger altyapıyı, Docker'ı ve otomatik güncellemeleri yönetir.

<Steps>
  <Step title="Satın alın ve başlatın">
    1. [Hostinger OpenClaw sayfasından](https://www.hostinger.com/openclaw) bir Managed OpenClaw planı seçin ve satın alma işlemini tamamlayın.

    <Note>
    Satın alma sırasında önceden satın alınmış ve doğrudan OpenClaw içine anında entegre edilen **Ready-to-Use AI** kredilerini seçebilirsiniz -- başka sağlayıcılardan harici hesaplara veya API anahtarlarına gerek yoktur. Hemen sohbet etmeye başlayabilirsiniz. Alternatif olarak kurulum sırasında Anthropic, OpenAI, Google Gemini veya xAI'den kendi anahtarınızı sağlayabilirsiniz.
    </Note>

  </Step>

  <Step title="Bir mesajlaşma kanalı seçin">
    Bağlamak için bir veya daha fazla kanal seçin:

    - **WhatsApp** -- kurulum sihirbazında gösterilen QR kodunu tarayın.
    - **Telegram** -- [BotFather](https://t.me/BotFather) üzerinden aldığınız bot token'ını yapıştırın.

  </Step>

  <Step title="Kurulumu tamamlayın">
    Örneği dağıtmak için **Finish** seçeneğine tıklayın. Hazır olduğunda, hPanel içindeki **OpenClaw Overview** üzerinden OpenClaw panosuna erişin.
  </Step>

</Steps>

## Seçenek B: VPS üzerinde OpenClaw

Sunucunuz üzerinde daha fazla kontrol sağlar. Hostinger, VPS'nize OpenClaw'ı Docker aracılığıyla dağıtır ve siz bunu hPanel içindeki **Docker Manager** üzerinden yönetirsiniz.

<Steps>
  <Step title="Bir VPS satın alın">
    1. [Hostinger OpenClaw sayfasından](https://www.hostinger.com/openclaw) bir OpenClaw on VPS planı seçin ve satın alma işlemini tamamlayın.

    <Note>
    Satın alma sırasında **Ready-to-Use AI** kredilerini seçebilirsiniz -- bunlar önceden satın alınır ve doğrudan OpenClaw içine anında entegre edilir, böylece başka sağlayıcılardan harici hesaplar veya API anahtarları olmadan sohbete başlayabilirsiniz.
    </Note>

  </Step>

  <Step title="OpenClaw'ı yapılandırın">
    VPS hazırlandıktan sonra yapılandırma alanlarını doldurun:

    - **Gateway token** -- otomatik oluşturulur; daha sonra kullanmak üzere kaydedin.
    - **WhatsApp numarası** -- ülke koduyla birlikte numaranız (isteğe bağlı).
    - **Telegram bot token'ı** -- [BotFather](https://t.me/BotFather) üzerinden alınır (isteğe bağlı).
    - **API anahtarları** -- yalnızca satın alma sırasında Ready-to-Use AI kredilerini seçmediyseniz gerekir.

  </Step>

  <Step title="OpenClaw'ı başlatın">
    **Deploy** seçeneğine tıklayın. Çalışmaya başladıktan sonra hPanel içinden **Open** seçeneğine tıklayarak OpenClaw panosunu açın.
  </Step>

</Steps>

Günlükler, yeniden başlatmalar ve güncellemeler doğrudan hPanel içindeki Docker Manager arayüzünden yönetilir. Güncellemek için Docker Manager içindeki **Update** seçeneğine basın; bu işlem en son imajı çekecektir.

## Kurulumunuzu doğrulayın

Bağladığınız kanalda asistanınıza "Hi" gönderin. OpenClaw yanıt verecek ve sizi ilk tercihlerin yapılandırılması boyunca yönlendirecektir.

## Sorun giderme

**Pano yüklenmiyor** -- Kapsayıcının sağlanmayı tamamlaması için birkaç dakika bekleyin. hPanel içindeki Docker Manager günlüklerini kontrol edin.

**Docker kapsayıcısı sürekli yeniden başlatılıyor** -- Docker Manager günlüklerini açın ve yapılandırma hatalarını arayın (eksik token'lar, geçersiz API anahtarları).

**Telegram botu yanıt vermiyor** -- Bağlantıyı tamamlamak için eşleştirme kodu mesajınızı Telegram'dan doğrudan OpenClaw sohbetinizin içine mesaj olarak gönderin.

## Sonraki adımlar

- [Kanallar](/tr/channels) -- Telegram, WhatsApp, Discord ve daha fazlasını bağlayın
- [Gateway yapılandırması](/tr/gateway/configuration) -- tüm yapılandırma seçenekleri
