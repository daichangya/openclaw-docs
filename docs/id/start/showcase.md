---
description: Real-world OpenClaw projects from the community
read_when:
    - Mencari contoh penggunaan OpenClaw di dunia nyata
    - Memperbarui sorotan proyek komunitas
summary: Proyek dan integrasi buatan komunitas yang didukung oleh OpenClaw
title: Showcase
x-i18n:
    generated_at: "2026-04-23T09:28:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5bf4bd2548709a01ad18331537f804b32c3213139c2234915aa17f7a2638f19f
    source_path: start/showcase.md
    workflow: 15
---

# Showcase

<div className="showcase-hero">
  <p className="showcase-kicker">Dibangun di chat, terminal, browser, dan ruang keluarga</p>
  <p className="showcase-lead">
    Proyek OpenClaw bukan demo mainan. Orang-orang mengirim loop review PR, app mobile, otomasi rumah,
    sistem suara, devtools, dan workflow berat memori dari channel yang sudah mereka gunakan.
  </p>
  <div className="showcase-actions">
    <a href="#videos">Tonton demo</a>
    <a href="#fresh-from-discord">Jelajahi proyek</a>
    <a href="https://discord.gg/clawd">Bagikan milik Anda</a>
  </div>
  <div className="showcase-highlights">
    <div className="showcase-highlight">
      <strong>Build native chat</strong>
      <span>Telegram, WhatsApp, Discord, Beeper, web chat, dan workflow yang mengutamakan terminal.</span>
    </div>
    <div className="showcase-highlight">
      <strong>Otomatisasi nyata</strong>
      <span>Pemesanan, belanja, dukungan, pelaporan, dan kontrol browser tanpa menunggu API.</span>
    </div>
    <div className="showcase-highlight">
      <strong>Dunia lokal + fisik</strong>
      <span>Printer, vacuum, kamera, data kesehatan, sistem rumah, dan basis pengetahuan pribadi.</span>
    </div>
  </div>
</div>

<Info>
**Ingin ditampilkan?** Bagikan proyek Anda di [#self-promotion on Discord](https://discord.gg/clawd) atau [tag @openclaw di X](https://x.com/openclaw).
</Info>

<div className="showcase-jump-links">
  <a href="#videos">Video</a>
  <a href="#fresh-from-discord">Baru dari Discord</a>
  <a href="#automation-workflows">Otomatisasi</a>
  <a href="#knowledge-memory">Memori</a>
  <a href="#voice-phone">Suara &amp; Telepon</a>
  <a href="#infrastructure-deployment">Infrastruktur</a>
  <a href="#home-hardware">Rumah &amp; Perangkat Keras</a>
  <a href="#community-projects">Komunitas</a>
  <a href="#submit-your-project">Kirim proyek Anda</a>
</div>

## Video

<p className="showcase-section-intro">
  Mulai di sini jika Anda menginginkan jalur tercepat dari “apa ini?” ke “oke, saya mengerti.”
</p>

<div className="showcase-video-grid">
  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
        title="OpenClaw: AI self-hosted yang seharusnya dimiliki Siri (Penyiapan lengkap)"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Panduan penyiapan lengkap</h3>
    <p>VelvetShark, 28 menit. Instal, onboard, dan dapatkan asisten pertama yang berfungsi penuh dari awal sampai akhir.</p>
    <a href="https://www.youtube.com/watch?v=SaWSPZoPX34">Tonton di YouTube</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
        title="Video showcase OpenClaw"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Reel showcase komunitas</h3>
    <p>Gambaran cepat tentang proyek nyata, surface, dan workflow yang dibangun di sekitar OpenClaw.</p>
    <a href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">Tonton di YouTube</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
        title="Showcase komunitas OpenClaw"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Proyek di dunia nyata</h3>
    <p>Contoh dari komunitas, dari loop coding native chat hingga perangkat keras dan otomatisasi pribadi.</p>
    <a href="https://www.youtube.com/watch?v=5kkIJNUGFho">Tonton di YouTube</a>
  </div>
</div>

## Baru dari Discord

<p className="showcase-section-intro">
  Sorotan terbaru di coding, devtools, mobile, dan pembangunan produk native chat.
</p>

<CardGroup cols={2}>

<Card title="Review PR → Umpan Balik Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode menyelesaikan perubahan → membuka PR → OpenClaw meninjau diff dan membalas di Telegram dengan “saran minor” plus keputusan merge yang jelas (termasuk perbaikan kritis yang harus diterapkan lebih dulu).

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Umpan balik review PR OpenClaw yang dikirim di Telegram" />
</Card>

<Card title="Skill Gudang Anggur dalam Beberapa Menit" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Meminta “Robby” (@openclaw) untuk skill gudang anggur lokal. Ia meminta contoh ekspor CSV + lokasi penyimpanannya, lalu membangun/menguji skill dengan cepat (962 botol dalam contoh).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw membangun skill gudang anggur lokal dari CSV" />
</Card>

<Card title="Autopilot Belanja Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Rencana makan mingguan → langganan rutin → pesan slot pengiriman → konfirmasi pesanan. Tanpa API, hanya kontrol browser.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Otomatisasi belanja Tesco melalui chat" />
</Card>

<Card title="SNAG Screenshot-ke-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Hotkey area layar → vision Gemini → Markdown instan di clipboard Anda.

  <img src="/assets/showcase/snag.png" alt="Tool screenshot-ke-markdown SNAG" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

App desktop untuk mengelola Skills/perintah di seluruh Agents, Claude, Codex, dan OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="App Agents UI" />
</Card>

<Card title="Voice Note Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Komunitas** • `voice` `tts` `telegram`

Membungkus TTS papla.media dan mengirim hasil sebagai voice note Telegram (tanpa autoplay yang mengganggu).

  <img src="/assets/showcase/papla-tts.jpg" alt="Output voice note Telegram dari TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Helper yang diinstal via Homebrew untuk menampilkan/memeriksa/memantau sesi OpenAI Codex lokal (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor di ClawHub" />
</Card>

<Card title="Kontrol Printer 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Mengontrol dan memecahkan masalah printer BambuLab: status, job, kamera, AMS, kalibrasi, dan lainnya.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI di ClawHub" />
</Card>

<Card title="Transportasi Wina (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Keberangkatan real-time, gangguan, status lift, dan perutean untuk transportasi umum Wina.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien di ClawHub" />
</Card>

<Card title="Makanan Sekolah ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Pemesanan makanan sekolah UK otomatis melalui ParentPay. Menggunakan koordinat mouse untuk klik sel tabel yang andal.
</Card>

<Card title="Upload R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Unggah ke Cloudflare R2/S3 dan hasilkan tautan unduh presigned yang aman. Sempurna untuk instance OpenClaw remote.
</Card>

<Card title="App iOS via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Membangun app iOS lengkap dengan peta dan perekaman suara, di-deploy ke TestFlight sepenuhnya melalui chat Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="App iOS di TestFlight" />
</Card>

<Card title="Asisten Kesehatan Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Asisten kesehatan AI pribadi yang mengintegrasikan data Oura ring dengan kalender, janji temu, dan jadwal gym.

  <img src="/assets/showcase/oura-health.png" alt="Asisten kesehatan Oura ring" />
</Card>
<Card title="Tim Impian Kev (14+ Agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

14+ agent di bawah satu Gateway dengan orkestrator Opus 4.5 yang mendelegasikan ke worker Codex. [Tulisan teknis](https://github.com/adam91holt/orchestrated-ai-articles) yang komprehensif mencakup roster Dream Team, pemilihan model, sandboxing, Webhook, Heartbeat, dan alur delegasi. [Clawdspace](https://github.com/adam91holt/clawdspace) untuk sandboxing agent. [Blog post](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/).
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

CLI untuk Linear yang terintegrasi dengan workflow agentic (Claude Code, OpenClaw). Kelola issue, proyek, dan workflow dari terminal. PR eksternal pertama berhasil di-merge!
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

Membaca, mengirim, dan mengarsipkan pesan melalui Beeper Desktop. Menggunakan API MCP lokal Beeper sehingga agent dapat mengelola semua chat Anda (iMessage, WhatsApp, dll.) di satu tempat.
</Card>

</CardGroup>

<a id="automation-workflows"></a>

## Otomatisasi & Workflow

<p className="showcase-section-intro">
  Penjadwalan, kontrol browser, loop dukungan, dan sisi produk yang “kerjakan saja tugasnya untuk saya”.
</p>

<CardGroup cols={2}>

<Card title="Kontrol Pembersih Udara Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code menemukan dan mengonfirmasi kontrol purifier, lalu OpenClaw mengambil alih untuk mengelola kualitas udara ruangan.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Kontrol pembersih udara Winix melalui OpenClaw" />
</Card>

<Card title="Foto Langit Indah" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

Dipicu oleh kamera atap: minta OpenClaw mengambil foto langit setiap kali terlihat indah — ia merancang skill dan mengambil fotonya.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Snapshot langit dari kamera atap yang diambil oleh OpenClaw" />
</Card>

<Card title="Adegan Briefing Pagi Visual" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

Prompt terjadwal menghasilkan satu gambar "adegan" setiap pagi (cuaca, tugas, tanggal, postingan/kutipan favorit) melalui persona OpenClaw.
</Card>

<Card title="Pemesanan Lapangan Padel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  Pemeriksa ketersediaan Playtomic + CLI pemesanan. Jangan sampai melewatkan lapangan kosong lagi.
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="Tangkapan layar padel-cli" />
</Card>

<Card title="Intake Akuntansi" icon="file-invoice-dollar">
  **Komunitas** • `automation` `email` `pdf`
  
  Mengumpulkan PDF dari email, menyiapkan dokumen untuk konsultan pajak. Akuntansi bulanan berjalan otomatis.
</Card>

<Card title="Mode Dev Sofa Santai" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

Dibangun ulang seluruh situs pribadi melalui Telegram sambil menonton Netflix — Notion → Astro, 18 posting dipindahkan, DNS ke Cloudflare. Tidak pernah membuka laptop.
</Card>

<Card title="Agent Pencarian Kerja" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Mencari lowongan kerja, mencocokkan dengan kata kunci CV, dan mengembalikan peluang yang relevan beserta tautannya. Dibangun dalam 30 menit menggunakan API JSearch.
</Card>

<Card title="Pembuat Skill Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

OpenClaw terhubung ke Jira, lalu menghasilkan skill baru secara langsung (sebelum skill itu ada di ClawHub).
</Card>

<Card title="Skill Todoist via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

Mengotomatiskan tugas Todoist dan membuat OpenClaw menghasilkan skill langsung di chat Telegram.
</Card>

<Card title="Analisis TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Login ke TradingView melalui otomatisasi browser, mengambil screenshot chart, dan melakukan analisis teknikal sesuai permintaan. Tidak perlu API—cukup kontrol browser.
</Card>

<Card title="Auto-Support Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Memantau channel Slack perusahaan, merespons dengan membantu, dan meneruskan notifikasi ke Telegram. Secara otonom memperbaiki bug produksi di app yang sudah di-deploy tanpa diminta.
</Card>

</CardGroup>

<a id="knowledge-memory"></a>

## Pengetahuan & Memori

<p className="showcase-section-intro">
  Sistem yang mengindeks, mencari, mengingat, dan bernalar atas pengetahuan pribadi atau tim.
</p>

<CardGroup cols={2}>

<Card title="xuezh Pembelajaran Bahasa Mandarin" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  Mesin pembelajaran bahasa Mandarin dengan umpan balik pengucapan dan alur belajar melalui OpenClaw.
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Umpan balik pengucapan xuezh" />
</Card>

<Card title="Vault Memori WhatsApp" icon="vault">
  **Komunitas** • `memory` `transcription` `indexing`
  
  Mengimpor ekspor WhatsApp penuh, mentranskripsikan 1k+ voice note, memeriksa silang dengan log git, dan menghasilkan laporan markdown yang saling tertaut.
</Card>

<Card title="Pencarian Semantik Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`
  
  Menambahkan pencarian vektor ke bookmark Karakeep menggunakan embedding Qdrant + OpenAI/Ollama.
</Card>

<Card title="Memori Inside-Out-2" icon="brain">
  **Komunitas** • `memory` `beliefs` `self-model`
  
  Pengelola memori terpisah yang mengubah file sesi menjadi memori → keyakinan → self model yang terus berkembang.
</Card>

</CardGroup>

<a id="voice-phone"></a>

## Suara & Telepon

<p className="showcase-section-intro">
  Titik masuk yang mengutamakan suara, bridge telepon, dan workflow berat transkripsi.
</p>

<CardGroup cols={2}>

<Card title="Bridge Telepon Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  Bridge asisten suara Vapi ↔ HTTP OpenClaw. Panggilan telepon hampir real-time dengan agent Anda.
</Card>

<Card title="Transkripsi OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Transkripsi audio multibahasa melalui OpenRouter (Gemini, dll). Tersedia di ClawHub.
</Card>

</CardGroup>

<a id="infrastructure-deployment"></a>

## Infrastruktur & Deployment

<p className="showcase-section-intro">
  Packaging, deployment, dan integrasi yang mempermudah OpenClaw untuk dijalankan dan diperluas.
</p>

<CardGroup cols={2}>

<Card title="Add-on Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  Gateway OpenClaw yang berjalan di Home Assistant OS dengan dukungan tunnel SSH dan status persisten.
</Card>

<Card title="Skill Home Assistant" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  Mengontrol dan mengotomatiskan perangkat Home Assistant melalui bahasa alami.
</Card>

<Card title="Packaging Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  Konfigurasi OpenClaw yang dinixifikasi dan lengkap baterainya untuk deployment yang dapat direproduksi.
</Card>

<Card title="Kalender CalDAV" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  Skill kalender menggunakan khal/vdirsyncer. Integrasi kalender self-hosted.
</Card>

</CardGroup>

<a id="home-hardware"></a>

## Rumah & Perangkat Keras

<p className="showcase-section-intro">
  Sisi dunia fisik dari OpenClaw: rumah, sensor, kamera, vacuum, dan perangkat lainnya.
</p>

<CardGroup cols={2}>

<Card title="Otomatisasi GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  Otomatisasi rumah native Nix dengan OpenClaw sebagai antarmuka, plus dashboard Grafana yang indah.
  
  <img src="/assets/showcase/gohome-grafana.png" alt="Dashboard Grafana GoHome" />
</Card>

<Card title="Vacuum Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  Kontrol vacuum robot Roborock Anda melalui percakapan alami.
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Status Roborock" />
</Card>

</CardGroup>

## Proyek Komunitas

<p className="showcase-section-intro">
  Hal-hal yang tumbuh melampaui satu workflow menjadi produk atau ekosistem yang lebih luas.
</p>

<CardGroup cols={2}>

<Card title="Marketplace StarSwap" icon="star" href="https://star-swap.com/">
  **Komunitas** • `marketplace` `astronomy` `webapp`
  
  Marketplace perlengkapan astronomi lengkap. Dibangun dengan/di sekitar ekosistem OpenClaw.
</Card>

</CardGroup>

---

## Kirim Proyek Anda

<p className="showcase-section-intro">
  Jika Anda sedang membangun sesuatu yang menarik dengan OpenClaw, kirimkan. Screenshot yang kuat dan hasil konkret sangat membantu.
</p>

Punya sesuatu untuk dibagikan? Kami ingin menampilkannya!

<Steps>
  <Step title="Bagikan">
    Posting di [#self-promotion on Discord](https://discord.gg/clawd) atau [tweet @openclaw](https://x.com/openclaw)
  </Step>
  <Step title="Sertakan Detail">
    Beri tahu kami apa yang dilakukan proyek itu, tautkan repo/demo, bagikan screenshot jika ada
  </Step>
  <Step title="Ditampilkan">
    Kami akan menambahkan proyek unggulan ke halaman ini
  </Step>
</Steps>
