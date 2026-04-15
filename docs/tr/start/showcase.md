---
description: Real-world OpenClaw projects from the community
read_when:
    - Gerçek OpenClaw kullanım örneklerini arıyorum
    - Topluluk projesi öne çıkanlarını güncelliyorum
summary: OpenClaw ile desteklenen topluluk tarafından geliştirilen projeler ve entegrasyonlar
title: Vitrin
x-i18n:
    generated_at: "2026-04-15T08:53:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 797d0b85c9eca920240c79d870eb9636216714f3eba871c5ebd0f7f40cf7bbf1
    source_path: start/showcase.md
    workflow: 15
---

<!-- markdownlint-disable MD033 -->

# Vitrin

<div className="showcase-hero">
  <p className="showcase-kicker">Sohbetlerde, terminallerde, tarayıcılarda ve oturma odalarında geliştirildi</p>
  <p className="showcase-lead">
    OpenClaw projeleri oyuncak demolar değildir. İnsanlar zaten kullandıkları kanallar üzerinden PR inceleme döngüleri, mobil uygulamalar, ev otomasyonu,
    ses sistemleri, geliştirici araçları ve bellek ağırlıklı iş akışlarını kullanıma sunuyor.
  </p>
  <div className="showcase-actions">
    <a href="#videos">Demoları izle</a>
    <a href="#fresh-from-discord">Projelere göz at</a>
    <a href="https://discord.gg/clawd">Sizinkini paylaşın</a>
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
      <span>Yazıcılar, robot süpürgeler, kameralar, sağlık verileri, ev sistemleri ve kişisel bilgi tabanları.</span>
    </div>
  </div>
</div>

<Info>
**Öne çıkarılmak mı istiyorsunuz?** Projenizi [Discord'daki #self-promotion kanalında](https://discord.gg/clawd) paylaşın veya [X'te @openclaw etiketleyin](https://x.com/openclaw).
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
  <a href="#submit-your-project">Bir proje gönderin</a>
</div>

<h2 id="videos">Videolar</h2>

<p className="showcase-section-intro">
  “Bu da ne?” sorusundan “tamam, anladım” noktasına en kısa yoldan gitmek istiyorsanız buradan başlayın.
</p>

<div className="showcase-video-grid">
  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
        title="OpenClaw: Siri'nin olması gereken self-hosted AI (Tam kurulum)"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Tam kurulum rehberi</h3>
    <p>VelvetShark, 28 dakika. Kurulum yapın, başlangıç ayarlarını tamamlayın ve uçtan uca çalışan ilk asistana ulaşın.</p>
    <a href="https://www.youtube.com/watch?v=SaWSPZoPX34">YouTube'da izle</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
        title="OpenClaw vitrin videosu"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Topluluk vitrin derlemesi</h3>
    <p>OpenClaw etrafında geliştirilen gerçek projeler, yüzeyler ve iş akışlarına daha hızlı bir bakış.</p>
    <a href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">YouTube'da izle</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
        title="OpenClaw topluluk vitrini"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Sahadaki projeler</h3>
    <p>Topluluktan örnekler: sohbet odaklı kodlama döngülerinden donanım ve kişisel otomasyona kadar.</p>
    <a href="https://www.youtube.com/watch?v=5kkIJNUGFho">YouTube'da izle</a>
  </div>
</div>

<h2 id="fresh-from-discord">Discord'dan taze</h2>

<p className="showcase-section-intro">
  Kodlama, geliştirici araçları, mobil ve sohbet odaklı ürün geliştirme alanlarında son dönemin öne çıkanları.
</p>

<CardGroup cols={2}>

<Card title="PR İncelemesi → Telegram Geri Bildirimi" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode değişikliği tamamlar → bir PR açar → OpenClaw diff'i inceler ve Telegram'da “küçük öneriler” ile birlikte net bir birleştirme kararıyla yanıt verir (önce uygulanması gereken kritik düzeltmeler dahil).

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Telegram'da iletilen OpenClaw PR inceleme geri bildirimi" />
</Card>

<Card title="Dakikalar İçinde Şarap Mahzeni Skill'i" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

“Robby”den (@openclaw) yerel bir şarap mahzeni skill'i istendi. Bir örnek CSV dışa aktarımı ile bunun nereye kaydedileceğini soruyor, ardından skill'i hızlıca oluşturup test ediyor (örnekte 962 şişe).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw'ın CSV'den yerel bir şarap mahzeni skill'i oluşturması" />
</Card>

<Card title="Tesco Alışveriş Otomatik Pilotu" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Haftalık yemek planı → düzenli ürünler → teslimat zamanı ayırt → siparişi onayla. API yok, yalnızca tarayıcı kontrolü.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Sohbet üzerinden Tesco alışveriş otomasyonu" />
</Card>

<Card title="SNAG Ekran Görüntüsünden Markdown'a" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Ekranın bir bölgesine kısayol tuşuyla seç → Gemini vision → anında panona Markdown gelsin.

  <img src="/assets/showcase/snag.png" alt="SNAG ekran görüntüsünden Markdown'a aracı" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Agents, Claude, Codex ve OpenClaw genelinde skills/komutları yönetmek için masaüstü uygulaması.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI uygulaması" />
</Card>

<Card title="Telegram Sesli Notları (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Topluluk** • `voice` `tts` `telegram`

papla.media TTS'yi sarmalar ve sonuçları Telegram sesli notları olarak gönderir (rahatsız edici otomatik oynatma yok).

  <img src="/assets/showcase/papla-tts.jpg" alt="TTS'den Telegram sesli not çıktısı" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Yerel OpenAI Codex oturumlarını listelemek/incelemek/izlemek için Homebrew ile kurulan yardımcı araç (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="ClawHub üzerinde CodexMonitor" />
</Card>

<Card title="Bambu 3D Yazıcı Kontrolü" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab yazıcılarını kontrol edin ve sorun giderin: durum, işler, kamera, AMS, kalibrasyon ve daha fazlası.

  <img src="/assets/showcase/bambu-cli.png" alt="ClawHub üzerinde Bambu CLI skill'i" />
</Card>

<Card title="Viyana Ulaşımı (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Viyana toplu taşıması için gerçek zamanlı kalkışlar, kesintiler, asansör durumu ve rota oluşturma.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill'i" />
</Card>

<Card title="ParentPay Okul Yemekleri" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

ParentPay üzerinden Birleşik Krallık'ta okul yemeği rezervasyonunu otomatikleştirir. Tablo hücrelerine güvenilir şekilde tıklamak için fare koordinatlarını kullanır.
</Card>

<Card title="R2 Yükleme (Dosyalarımı Bana Gönder)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Cloudflare R2/S3'e yükleyin ve güvenli önceden imzalanmış indirme bağlantıları oluşturun. Uzak OpenClaw örnekleri için idealdir.
</Card>

<Card title="Telegram Üzerinden iOS Uygulaması" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Haritalar ve ses kaydı içeren tam bir iOS uygulaması oluşturdu; tamamını Telegram sohbeti üzerinden TestFlight'a dağıttı.

  <img src="/assets/showcase/ios-testflight.jpg" alt="TestFlight üzerindeki iOS uygulaması" />
</Card>

<Card title="Oura Ring Sağlık Asistanı" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Oura ring verilerini takvim, randevular ve spor programıyla birleştiren kişisel AI sağlık asistanı.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring sağlık asistanı" />
</Card>
<Card title="Kev'in Dream Team'i (14+ Agent)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

Tek bir Gateway altında, Opus 4.5 orkestratörünün Codex çalışanlarına görev devrettiği 14+ agent. Dream Team kadrosu, model seçimi, sandboxing, webhook'lar, Heartbeat'ler ve görev devri akışlarını kapsayan kapsamlı [teknik yazı](https://github.com/adam91holt/orchestrated-ai-articles). Agent sandboxing için [Clawdspace](https://github.com/adam91holt/clawdspace). [Blog yazısı](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/).
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

Agentik iş akışlarıyla (Claude Code, OpenClaw) entegre olan Linear için CLI. Sorunları, projeleri ve iş akışlarını terminalden yönetin. İlk harici PR birleştirildi!
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

Beeper Desktop üzerinden mesajları okuyun, gönderin ve arşivleyin. Beeper yerel MCP API'sini kullanır; böylece agent'lar tüm sohbetlerinizi (iMessage, WhatsApp vb.) tek bir yerden yönetebilir.
</Card>

</CardGroup>

<h2 id="automation-workflows">Otomasyon ve İş Akışları</h2>

<p className="showcase-section-intro">
  Planlama, tarayıcı kontrolü, destek döngüleri ve ürünün “görevi benim yerime yap” tarafı.
</p>

<CardGroup cols={2}>

<Card title="Winix Hava Temizleyici Kontrolü" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code hava temizleyici kontrollerini keşfedip doğruladı, ardından oda hava kalitesini yönetmek için OpenClaw devraldı.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="OpenClaw üzerinden Winix hava temizleyici kontrolü" />
</Card>

<Card title="Güzel Gökyüzü Kamera Çekimleri" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

Çatı kamerası tarafından tetiklenir: Gökyüzü güzel göründüğünde OpenClaw'dan bir gökyüzü fotoğrafı çekmesini isteyin — bir skill tasarladı ve çekimi yaptı.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="OpenClaw tarafından yakalanan çatı kamerası gökyüzü görüntüsü" />
</Card>

<Card title="Görsel Sabah Brifingi Sahnesi" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

Zamanlanmış bir istem, bir OpenClaw personası üzerinden her sabah tek bir “sahne” görseli üretir (hava durumu, görevler, tarih, favori gönderi/alıntı).
</Card>

<Card title="Padel Kort Rezervasyonu" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  Playtomic uygunluk denetleyicisi + rezervasyon CLI'ı. Bir daha asla boş bir kortu kaçırmayın.
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli ekran görüntüsü" />
</Card>

<Card title="Muhasebe Belge Toplama" icon="file-invoice-dollar">
  **Topluluk** • `automation` `email` `pdf`
  
  E-postadan PDF'leri toplar, belgeleri vergi danışmanı için hazırlar. Aylık muhasebe otomatik pilotta.
</Card>

<Card title="Kanepeden Geliştirici Modu" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

Telegram üzerinden Netflix izlerken tüm kişisel sitesini yeniden kurdu — Notion → Astro, 18 gönderi taşındı, DNS Cloudflare'a geçirildi. Hiç dizüstü bilgisayar açmadı.
</Card>

<Card title="İş Arama Agent'ı" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

İş ilanlarını arar, özgeçmiş anahtar kelimeleriyle eşleştirir ve ilgili fırsatları bağlantılarıyla birlikte döndürür. JSearch API kullanılarak 30 dakikada oluşturuldu.
</Card>

<Card title="Jira Skill Oluşturucu" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

OpenClaw Jira'ya bağlandı, ardından anında yeni bir skill oluşturdu (ClawHub'da bulunmadan önce).
</Card>

<Card title="Telegram Üzerinden Todoist Skill'i" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

Todoist görevlerini otomatikleştirdi ve OpenClaw'ın skill'i doğrudan Telegram sohbetinde oluşturmasını sağladı.
</Card>

<Card title="TradingView Analizi" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Tarayıcı otomasyonu aracılığıyla TradingView'a giriş yapar, grafiklerin ekran görüntülerini alır ve istek üzerine teknik analiz gerçekleştirir. API gerekmez — yalnızca tarayıcı kontrolü.
</Card>

<Card title="Slack Otomatik Destek" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Şirketin Slack kanalını izler, yardımcı yanıtlar verir ve bildirimleri Telegram'a iletir. İstenmeden, dağıtımdaki bir uygulamadaki production hatasını otonom şekilde düzeltti.
</Card>

</CardGroup>

<h2 id="knowledge-memory">Bilgi ve Bellek</h2>

<p className="showcase-section-intro">
  Kişisel veya ekip bilgisini indeksleyen, arayan, hatırlayan ve üzerinde akıl yürüten sistemler.
</p>

<CardGroup cols={2}>

<Card title="xuezh Çince Öğrenimi" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  OpenClaw üzerinden telaffuz geri bildirimi ve çalışma akışları sunan Çince öğrenme motoru.
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh telaffuz geri bildirimi" />
</Card>

<Card title="WhatsApp Bellek Kasası" icon="vault">
  **Topluluk** • `memory` `transcription` `indexing`
  
  Tam WhatsApp dışa aktarımlarını içe alır, 1k+ sesli notu metne döker, git günlükleriyle çapraz kontrol yapar, bağlantılı markdown raporları üretir.
</Card>

<Card title="Karakeep Anlamsal Arama" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`
  
  Qdrant + OpenAI/Ollama embedding'lerini kullanarak Karakeep yer imlerine vektör arama ekler.
</Card>

<Card title="Inside-Out-2 Belleği" icon="brain">
  **Topluluk** • `memory` `beliefs` `self-model`
  
  Oturum dosyalarını anılar → inançlar → gelişen benlik modeline dönüştüren ayrı bellek yöneticisi.
</Card>

</CardGroup>

<h2 id="voice-phone">Ses ve Telefon</h2>

<p className="showcase-section-intro">
  Konuşma öncelikli giriş noktaları, telefon köprüleri ve yoğun transkripsiyon iş akışları.
</p>

<CardGroup cols={2}>

<Card title="Clawdia Telefon Köprüsü" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  Vapi sesli asistanı ↔ OpenClaw HTTP köprüsü. Agent'ınızla neredeyse gerçek zamanlı telefon görüşmeleri.
</Card>

<Card title="OpenRouter Transkripsiyon" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

OpenRouter üzerinden çok dilli ses transkripsiyonu (Gemini vb.). ClawHub'da mevcut.
</Card>

</CardGroup>

<h2 id="infrastructure-deployment">Altyapı ve Dağıtım</h2>

<p className="showcase-section-intro">
  OpenClaw'ın çalıştırılmasını ve genişletilmesini kolaylaştıran paketleme, dağıtım ve entegrasyonlar.
</p>

<CardGroup cols={2}>

<Card title="Home Assistant Eklentisi" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  SSH tüneli desteği ve kalıcı durum ile Home Assistant OS üzerinde çalışan OpenClaw Gateway.
</Card>

<Card title="Home Assistant Skill'i" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  Home Assistant cihazlarını doğal dille kontrol edin ve otomatikleştirin.
</Card>

<Card title="Nix Paketleme" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  Tekrarlanabilir dağıtımlar için her şeyi içeren, nix ile yapılandırılmış OpenClaw yapılandırması.
</Card>

<Card title="CalDAV Takvimi" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  khal/vdirsyncer kullanan takvim skill'i. Self-hosted takvim entegrasyonu.
</Card>

</CardGroup>

<h2 id="home-hardware">Ev ve Donanım</h2>

<p className="showcase-section-intro">
  OpenClaw'ın fiziksel dünya tarafı: evler, sensörler, kameralar, robot süpürgeler ve diğer cihazlar.
</p>

<CardGroup cols={2}>

<Card title="GoHome Otomasyonu" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  Arayüz olarak OpenClaw'ı kullanan, ayrıca güzel Grafana panoları sunan Nix uyumlu ev otomasyonu.
  
  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana panosu" />
</Card>

<Card title="Roborock Robot Süpürge" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  Roborock robot süpürgenizi doğal konuşmayla kontrol edin.
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock durumu" />
</Card>

</CardGroup>

<h2 id="community-projects">Topluluk Projeleri</h2>

<p className="showcase-section-intro">
  Tek bir iş akışının ötesine geçerek daha geniş ürünlere veya ekosistemlere dönüşen şeyler.
</p>

<CardGroup cols={2}>

<Card title="StarSwap Marketplace" icon="star" href="https://star-swap.com/">
  **Topluluk** • `marketplace` `astronomy` `webapp`
  
  Tam kapsamlı astronomi ekipmanı pazaryeri. OpenClaw ekosistemiyle/etrafında geliştirildi.
</Card>

</CardGroup>

---

<h2 id="submit-your-project">Projenizi Gönderin</h2>

<p className="showcase-section-intro">
  OpenClaw ile ilginç bir şey geliştiriyorsanız bize gönderin. Güçlü ekran görüntüleri ve somut sonuçlar yardımcı olur.
</p>

Paylaşacak bir şeyiniz mi var? Sizi öne çıkarmaktan memnuniyet duyarız!

<Steps>
  <Step title="Paylaşın">
    [Discord'daki #self-promotion kanalında](https://discord.gg/clawd) paylaşın veya [X'te @openclaw'a yazın](https://x.com/openclaw)
  </Step>
  <Step title="Ayrıntıları Ekleyin">
    Ne yaptığını anlatın, depo/demo bağlantısını paylaşın, varsa bir ekran görüntüsü ekleyin
  </Step>
  <Step title="Öne Çıkın">
    Öne çıkan projeleri bu sayfaya ekleyeceğiz
  </Step>
</Steps>
