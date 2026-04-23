---
description: Real-world OpenClaw projects from the community
read_when:
    - Gerçek OpenClaw kullanım örnekleri arıyorsunuz
    - Topluluk projesi öne çıkanlarını güncelleme
summary: OpenClaw tarafından desteklenen topluluk yapımı projeler ve entegrasyonlar
title: Vitrin
x-i18n:
    generated_at: "2026-04-23T09:11:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5bf4bd2548709a01ad18331537f804b32c3213139c2234915aa17f7a2638f19f
    source_path: start/showcase.md
    workflow: 15
---

# Vitrin

<div className="showcase-hero">
  <p className="showcase-kicker">Sohbetlerde, terminallerde, tarayıcılarda ve oturma odalarında geliştirildi</p>
  <p className="showcase-lead">
    OpenClaw projeleri oyuncak demolar değildir. İnsanlar zaten kullandıkları kanallardan PR inceleme döngüleri, mobil uygulamalar, ev otomasyonu,
    ses sistemleri, geliştirici araçları ve bellek yoğun iş akışları yayınlıyor.
  </p>
  <div className="showcase-actions">
    <a href="#videos">Demoları izle</a>
    <a href="#fresh-from-discord">Projelere göz at</a>
    <a href="https://discord.gg/clawd">Kendininkini paylaş</a>
  </div>
  <div className="showcase-highlights">
    <div className="showcase-highlight">
      <strong>Sohbet odaklı geliştirmeler</strong>
      <span>Telegram, WhatsApp, Discord, Beeper, web sohbeti ve terminal öncelikli iş akışları.</span>
    </div>
    <div className="showcase-highlight">
      <strong>Gerçek otomasyon</strong>
      <span>API beklemeden rezervasyon, alışveriş, destek, raporlama ve tarayıcı kontrolü.</span>
    </div>
    <div className="showcase-highlight">
      <strong>Yerel + fiziksel dünya</strong>
      <span>Yazıcılar, süpürgeler, kameralar, sağlık verileri, ev sistemleri ve kişisel bilgi tabanları.</span>
    </div>
  </div>
</div>

<Info>
**Öne çıkmak mı istiyorsunuz?** Projenizi [Discord'daki #self-promotion kanalında](https://discord.gg/clawd) paylaşın veya [X'te @openclaw etiketini kullanın](https://x.com/openclaw).
</Info>

<div className="showcase-jump-links">
  <a href="#videos">Videolar</a>
  <a href="#fresh-from-discord">Discord'dan taze</a>
  <a href="#automation-workflows">Otomasyon</a>
  <a href="#knowledge-memory">Bellek</a>
  <a href="#voice-phone">Ses ve Telefon</a>
  <a href="#infrastructure-deployment">Altyapı</a>
  <a href="#home-hardware">Ev ve Donanım</a>
  <a href="#community-projects">Topluluk</a>
  <a href="#submit-your-project">Bir proje gönder</a>
</div>

## Videolar

<p className="showcase-section-intro">
  “Bu nedir?” sorusundan “tamam, anladım” noktasına en kısa yolu istiyorsanız buradan başlayın.
</p>

<div className="showcase-video-grid">
  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
        title="OpenClaw: The self-hosted AI that Siri should have been (Full setup)"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Tam kurulum anlatımı</h3>
    <p>VelvetShark, 28 dakika. Kurulum, ilk kurulum ve uçtan uca çalışan ilk asistana ulaşma.</p>
    <a href="https://www.youtube.com/watch?v=SaWSPZoPX34">YouTube'da izle</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
        title="OpenClaw showcase video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Topluluk vitrin derlemesi</h3>
    <p>OpenClaw etrafında inşa edilen gerçek projeler, yüzeyler ve iş akışlarına daha hızlı bir bakış.</p>
    <a href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">YouTube'da izle</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
        title="OpenClaw community showcase"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Sahadaki projeler</h3>
    <p>Sohbet odaklı kodlama döngülerinden donanıma ve kişisel otomasyona kadar topluluktan örnekler.</p>
    <a href="https://www.youtube.com/watch?v=5kkIJNUGFho">YouTube'da izle</a>
  </div>
</div>

## Discord'dan taze

<p className="showcase-section-intro">
  Kodlama, geliştirici araçları, mobil ve sohbet odaklı ürün geliştirme genelinde son dönemin öne çıkanları.
</p>

<CardGroup cols={2}>

<Card title="PR İnceleme → Telegram Geri Bildirimi" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode değişikliği tamamlıyor → bir PR açıyor → OpenClaw diff'i inceliyor ve Telegram'da “küçük öneriler” ile birlikte net bir birleştirme kararıyla yanıt veriyor (önce uygulanması gereken kritik düzeltmeler dahil).

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Dakikalar İçinde Şarap Mahzeni Skill'i" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

“Robby”den (@openclaw) yerel bir şarap mahzeni Skill'i istendi. Örnek bir CSV dışa aktarımı + nereye kaydedileceğini soruyor, sonra Skill'i hızlıca oluşturup test ediyor (örnekte 962 şişe).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco Alışveriş Otopilotu" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Haftalık yemek planı → düzenli ürünler → teslimat saatini ayırt → siparişi onayla. API yok, yalnızca tarayıcı kontrolü.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG Ekran Görüntüsünden Markdown'a" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Ekranın bir bölgesine kısayol atayın → Gemini vision → anında panonuzda Markdown.

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Agents, Claude, Codex ve OpenClaw genelinde Skills/komutları yönetmek için masaüstü uygulaması.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram Sesli Notları (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Topluluk** • `voice` `tts` `telegram`

papla.media TTS'yi sarar ve sonuçları Telegram sesli notları olarak gönderir (rahatsız edici otomatik oynatma yok).

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Yerel OpenAI Codex oturumlarını listelemek/incelemek/izlemek için Homebrew ile kurulan yardımcı araç (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Yazıcı Kontrolü" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab yazıcılarını denetleyin ve sorun giderin: durum, işler, kamera, AMS, kalibrasyon ve daha fazlası.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Viyana Ulaşım (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Viyana toplu taşıması için gerçek zamanlı kalkışlar, kesintiler, asansör durumu ve rota bulma.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay Okul Yemekleri" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

ParentPay üzerinden Birleşik Krallık okul yemeği rezervasyonunu otomatikleştirir. Güvenilir tablo hücresi tıklaması için fare koordinatlarını kullanır.
</Card>

<Card title="R2 Yükleme (Dosyalarımı Bana Gönder)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Cloudflare R2/S3'e yükleyin ve güvenli ön imzalı indirme bağlantıları oluşturun. Uzak OpenClaw örnekleri için mükemmel.
</Card>

<Card title="Telegram ile iOS Uygulaması" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Haritalar ve ses kaydı içeren tam bir iOS uygulaması oluşturdu, tamamen Telegram sohbeti üzerinden TestFlight'a dağıttı.

  <img src="/assets/showcase/ios-testflight.jpg" alt="iOS app on TestFlight" />
</Card>

<Card title="Oura Ring Sağlık Asistanı" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Oura ring verilerini takvim, randevular ve spor salonu programıyla entegre eden kişisel yapay zekâ sağlık asistanı.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>
<Card title="Kev's Dream Team (14+ Ajan)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

Tek Gateway altında 14+ ajan; Opus 4.5 orkestratörü Codex çalışan ajanlara görev dağıtıyor. Dream Team kadrosu, model seçimi, sandboxing, Webhook'lar, Heartbeat'ler ve yetki devri akışlarını kapsayan kapsamlı [teknik yazı](https://github.com/adam91holt/orchestrated-ai-articles). Ajan sandboxing'i için [Clawdspace](https://github.com/adam91holt/clawdspace). [Blog yazısı](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/).
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

Ajan odaklı iş akışlarıyla (Claude Code, OpenClaw) entegre olan Linear için CLI. Sorunları, projeleri ve iş akışlarını terminalden yönetin. İlk harici PR birleştirildi!
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

Beeper Desktop üzerinden mesajları okuyun, gönderin ve arşivleyin. Beeper yerel MCP API'sini kullanır; böylece ajanlar tüm sohbetlerinizi (iMessage, WhatsApp vb.) tek yerden yönetebilir.
</Card>

</CardGroup>

<a id="automation-workflows"></a>

## Otomasyon ve İş Akışları

<p className="showcase-section-intro">
  Zamanlama, tarayıcı kontrolü, destek döngüleri ve ürünün “görevi benim yerime yap” tarafı.
</p>

<CardGroup cols={2}>

<Card title="Winix Hava Temizleyici Kontrolü" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code temizleyici denetimlerini keşfedip doğruladı, ardından OpenClaw oda hava kalitesini yönetmek için devralıyor.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Güzel Gökyüzü Kamera Çekimleri" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

Çatı kamerası tarafından tetikleniyor: gökyüzü güzel göründüğünde OpenClaw'dan gökyüzü fotoğrafı çekmesini isteyin — bir Skill tasarladı ve çekimi yaptı.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Görsel Sabah Bilgilendirme Sahnesi" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

Zamanlanmış bir istem, her sabah bir OpenClaw personası üzerinden tek bir “sahne” görseli üretir (hava durumu, görevler, tarih, favori gönderi/alıntı).
</Card>

<Card title="Padel Kortu Rezervasyonu" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  Playtomic müsaitlik denetleyicisi + rezervasyon CLI'si. Bir daha asla boş kortu kaçırmayın.
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Muhasebe Alımı" icon="file-invoice-dollar">
  **Topluluk** • `automation` `email` `pdf`
  
  E-postadan PDF'leri toplar, belgeleri vergi danışmanı için hazırlar. Aylık muhasebe otopilotta.
</Card>

<Card title="Kanepede Geliştirici Modu" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

Netflix izlerken tüm kişisel sitesini Telegram üzerinden yeniden inşa etti — Notion → Astro, 18 yazı taşındı, DNS Cloudflare'a alındı. Hiç dizüstü bilgisayar açmadı.
</Card>

<Card title="İş Arama Ajanı" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

İş ilanlarını arar, CV anahtar kelimeleriyle eşleştirir ve bağlantılarla birlikte ilgili fırsatları döndürür. JSearch API kullanılarak 30 dakikada geliştirildi.
</Card>

<Card title="Jira Skill Oluşturucu" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

OpenClaw Jira'ya bağlandı, ardından yeni bir Skill'i anında üretti (ClawHub'da var olmadan önce).
</Card>

<Card title="Telegram üzerinden Todoist Skill'i" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

Todoist görevlerini otomatikleştirdi ve OpenClaw'un Skill'i doğrudan Telegram sohbetinde oluşturmasını sağladı.
</Card>

<Card title="TradingView Analizi" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Tarayıcı otomasyonu ile TradingView'e giriş yapar, grafiklerin ekran görüntülerini alır ve istek üzerine teknik analiz yapar. API gerekmez—yalnızca tarayıcı kontrolü.
</Card>

<Card title="Slack Otomatik Destek" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Şirket Slack kanalını izler, yararlı şekilde yanıt verir ve bildirimleri Telegram'a iletir. Sorulmadan dağıtılmış bir uygulamadaki üretim hatasını otonom olarak düzeltti.
</Card>

</CardGroup>

<a id="knowledge-memory"></a>

## Bilgi ve Bellek

<p className="showcase-section-intro">
  Kişisel veya ekip bilgisini dizinleyen, arayan, hatırlayan ve üzerinde akıl yürüten sistemler.
</p>

<CardGroup cols={2}>

<Card title="xuezh Çince Öğrenme" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  OpenClaw üzerinden telaffuz geri bildirimi ve çalışma akışları sunan Çince öğrenme motoru.
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="WhatsApp Bellek Vault'u" icon="vault">
  **Topluluk** • `memory` `transcription` `indexing`
  
  Tam WhatsApp dışa aktarımlarını içe alır, 1000+ sesli notu transkribe eder, git günlükleriyle çapraz denetler ve bağlantılı markdown raporları üretir.
</Card>

<Card title="Karakeep Anlamsal Arama" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`
  
  Qdrant + OpenAI/Ollama embeddings kullanarak Karakeep yer imlerine vektör arama ekler.
</Card>

<Card title="Inside-Out-2 Belleği" icon="brain">
  **Topluluk** • `memory` `beliefs` `self-model`
  
  Oturum dosyalarını anılar → inançlar → gelişen öz modele dönüştüren ayrı bir bellek yöneticisi.
</Card>

</CardGroup>

<a id="voice-phone"></a>

## Ses ve Telefon

<p className="showcase-section-intro">
  Konuşma öncelikli giriş noktaları, telefon köprüleri ve yoğun transkripsiyon iş akışları.
</p>

<CardGroup cols={2}>

<Card title="Clawdia Telefon Köprüsü" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  Vapi sesli asistan ↔ OpenClaw HTTP köprüsü. Ajanınızla neredeyse gerçek zamanlı telefon görüşmeleri.
</Card>

<Card title="OpenRouter Transkripsiyonu" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

OpenRouter üzerinden çok dilli ses transkripsiyonu (Gemini vb.). ClawHub'da mevcut.
</Card>

</CardGroup>

<a id="infrastructure-deployment"></a>

## Altyapı ve Dağıtım

<p className="showcase-section-intro">
  OpenClaw'u çalıştırmayı ve genişletmeyi kolaylaştıran paketleme, dağıtım ve entegrasyonlar.
</p>

<CardGroup cols={2}>

<Card title="Home Assistant Eklentisi" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  SSH tünel desteği ve kalıcı durum ile Home Assistant OS üzerinde çalışan OpenClaw Gateway.
</Card>

<Card title="Home Assistant Skill'i" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  Home Assistant cihazlarını doğal dil ile denetleyin ve otomatikleştirin.
</Card>

<Card title="Nix Paketleme" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  Tekrarlanabilir dağıtımlar için piller dahil nixify edilmiş OpenClaw yapılandırması.
</Card>

<Card title="CalDAV Takvimi" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  khal/vdirsyncer kullanan takvim Skill'i. Kendi kendine barındırılan takvim entegrasyonu.
</Card>

</CardGroup>

<a id="home-hardware"></a>

## Ev ve Donanım

<p className="showcase-section-intro">
  OpenClaw'un fiziksel dünya tarafı: evler, sensörler, kameralar, süpürgeler ve diğer cihazlar.
</p>

<CardGroup cols={2}>

<Card title="GoHome Otomasyonu" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  Arayüz olarak OpenClaw kullanan, ayrıca güzel Grafana panoları sunan Nix yerel ev otomasyonu.
  
  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Roborock Süpürge" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  Roborock robot süpürgenizi doğal konuşma ile denetleyin.
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## Topluluk Projeleri

<p className="showcase-section-intro">
  Tek bir iş akışının ötesine geçip daha geniş ürünlere veya ekosistemlere dönüşen şeyler.
</p>

<CardGroup cols={2}>

<Card title="StarSwap Marketplace" icon="star" href="https://star-swap.com/">
  **Topluluk** • `marketplace` `astronomy` `webapp`
  
  Tam kapsamlı astronomi ekipmanı pazaryeri. OpenClaw ekosistemi ile/etrafında geliştirildi.
</Card>

</CardGroup>

---

## Projenizi Gönderin

<p className="showcase-section-intro">
  OpenClaw ile ilginç bir şey geliştiriyorsanız bize gönderin. Güçlü ekran görüntüleri ve somut sonuçlar yardımcı olur.
</p>

Paylaşacak bir şeyiniz mi var? Öne çıkarmaktan memnuniyet duyarız!

<Steps>
  <Step title="Paylaşın">
    [Discord'daki #self-promotion kanalında](https://discord.gg/clawd) paylaşın veya [@openclaw etiketini kullanarak tweet atın](https://x.com/openclaw)
  </Step>
  <Step title="Ayrıntıları ekleyin">
    Ne yaptığını anlatın, depo/demo bağlantısını verin, varsa ekran görüntüsü paylaşın
  </Step>
  <Step title="Öne çıkın">
    Öne çıkan projeleri bu sayfaya ekleyeceğiz
  </Step>
</Steps>
