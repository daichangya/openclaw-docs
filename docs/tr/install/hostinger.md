---
read_when:
    - OpenClaw'ı Hostinger üzerinde kurma
    - OpenClaw için yönetilen bir VPS arıyorsunuz
    - Hostinger 1-Click OpenClaw kullanma
summary: OpenClaw'ı Hostinger üzerinde barındırın
title: Hostinger
x-i18n:
    generated_at: "2026-04-23T09:04:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ee70d24fd1c3a6de503fc967d7e726d701f84cc6717fe7a3bc65a6a28e386ea
    source_path: install/hostinger.md
    workflow: 15
---

# Hostinger

[Hostinger](https://www.hostinger.com/openclaw) üzerinden **1-Click** yönetilen dağıtım veya **VPS** kurulumu ile kalıcı bir OpenClaw Gateway çalıştırın.

## Ön koşullar

- Hostinger hesabı ([kayıt](https://www.hostinger.com/openclaw))
- Yaklaşık 5-10 dakika

## Seçenek A: 1-Click OpenClaw

Başlamanın en hızlı yolu. Hostinger altyapıyı, Docker'ı ve otomatik güncellemeleri yönetir.

<Steps>
  <Step title="Satın alın ve başlatın">
    1. [Hostinger OpenClaw sayfasından](https://www.hostinger.com/openclaw) bir Managed OpenClaw planı seçin ve ödeme işlemini tamamlayın.

    <Note>
    Ödeme sırasında, önceden satın alınan ve doğrudan OpenClaw içine anında entegre edilen **Ready-to-Use AI** kredilerini seçebilirsiniz -- başka sağlayıcılardan harici hesaplara veya API anahtarlarına gerek yoktur. Hemen sohbet etmeye başlayabilirsiniz. Alternatif olarak kurulum sırasında Anthropic, OpenAI, Google Gemini veya xAI anahtarınızı sağlayabilirsiniz.
    </Note>

  </Step>

  <Step title="Bir mesajlaşma kanalı seçin">
    Bağlamak için bir veya daha fazla kanal seçin:

    - **WhatsApp** -- kurulum sihirbazında gösterilen QR kodunu tarayın.
    - **Telegram** -- [BotFather](https://t.me/BotFather) içinden aldığınız bot token'ını yapıştırın.

  </Step>

  <Step title="Kurulumu tamamlayın">
    Örneği dağıtmak için **Finish** düğmesine tıklayın. Hazır olduğunda, hPanel içindeki **OpenClaw Overview** bölümünden OpenClaw panosuna erişin.
  </Step>

</Steps>

## Seçenek B: VPS üzerinde OpenClaw

Sunucunuz üzerinde daha fazla denetim sağlar. Hostinger OpenClaw'ı VPS'inize Docker üzerinden dağıtır ve siz onu hPanel içindeki **Docker Manager** üzerinden yönetirsiniz.

<Steps>
  <Step title="Bir VPS satın alın">
    1. [Hostinger OpenClaw sayfasından](https://www.hostinger.com/openclaw) bir OpenClaw on VPS planı seçin ve ödeme işlemini tamamlayın.

    <Note>
    Ödeme sırasında **Ready-to-Use AI** kredilerini seçebilirsiniz -- bunlar önceden satın alınır ve anında OpenClaw içine entegre edilir; böylece başka sağlayıcılardan harici hesaplar veya API anahtarları olmadan sohbete başlayabilirsiniz.
    </Note>

  </Step>

  <Step title="OpenClaw'ı yapılandırın">
    VPS sağlandıktan sonra yapılandırma alanlarını doldurun:

    - **Gateway token** -- otomatik oluşturulur; daha sonra kullanmak için kaydedin.
    - **WhatsApp number** -- ülke koduyla birlikte numaranız (isteğe bağlı).
    - **Telegram bot token** -- [BotFather](https://t.me/BotFather) üzerinden (isteğe bağlı).
    - **API keys** -- yalnızca ödeme sırasında Ready-to-Use AI kredilerini seçmediyseniz gereklidir.

  </Step>

  <Step title="OpenClaw'ı başlatın">
    **Deploy** düğmesine tıklayın. Çalışmaya başladıktan sonra, hPanel içinden **Open** düğmesine tıklayarak OpenClaw panosunu açın.
  </Step>

</Steps>

Günlükler, yeniden başlatmalar ve güncellemeler doğrudan hPanel içindeki Docker Manager arayüzünden yönetilir. Güncellemek için Docker Manager içindeki **Update** düğmesine basın; bu en son imajı çeker.

## Kurulumunuzu doğrulayın

Bağladığınız kanalda asistanınıza "Hi" gönderin. OpenClaw yanıt verir ve sizi ilk tercih ayarları boyunca yönlendirir.

## Sorun giderme

**Pano yüklenmiyor** -- Kapsayıcının sağlanmayı tamamlaması için birkaç dakika bekleyin. hPanel içindeki Docker Manager günlüklerini kontrol edin.

**Docker kapsayıcısı sürekli yeniden başlıyor** -- Docker Manager günlüklerini açın ve yapılandırma hatalarını arayın (eksik token'lar, geçersiz API anahtarları).

**Telegram botu yanıt vermiyor** -- Bağlantıyı tamamlamak için eşleştirme kodu iletinizi Telegram'dan doğrudan OpenClaw sohbetinizin içine mesaj olarak gönderin.

## Sonraki adımlar

- [Kanallar](/tr/channels) -- Telegram, WhatsApp, Discord ve daha fazlasını bağlayın
- [Gateway yapılandırması](/tr/gateway/configuration) -- tüm yapılandırma seçenekleri
