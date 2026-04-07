---
read_when:
    - Menjawab pertanyaan umum tentang penyiapan, instalasi, onboarding, atau dukungan runtime
    - Menriage masalah yang dilaporkan pengguna sebelum debug yang lebih mendalam
summary: Pertanyaan yang sering diajukan tentang penyiapan, konfigurasi, dan penggunaan OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-07T09:23:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: bddcde55cf4bcec4913aadab4c665b235538104010e445e4c99915a1672b1148
    source_path: help/faq.md
    workflow: 15
---

# FAQ

Jawaban cepat ditambah pemecahan masalah yang lebih mendalam untuk penyiapan dunia nyata (pengembangan lokal, VPS, multi-agent, OAuth/API key, failover model). Untuk diagnostik runtime, lihat [Troubleshooting](/id/gateway/troubleshooting). Untuk referensi konfigurasi lengkap, lihat [Configuration](/id/gateway/configuration).

## 60 detik pertama jika ada yang rusak

1. **Status cepat (pemeriksaan pertama)**

   ```bash
   openclaw status
   ```

   Ringkasan lokal cepat: OS + pembaruan, keterjangkauan gateway/layanan, agent/sesi, konfigurasi provider + masalah runtime (saat gateway dapat dijangkau).

2. **Laporan yang bisa ditempel (aman untuk dibagikan)**

   ```bash
   openclaw status --all
   ```

   Diagnosis read-only dengan ekor log (token disamarkan).

3. **Status daemon + port**

   ```bash
   openclaw gateway status
   ```

   Menampilkan runtime supervisor vs keterjangkauan RPC, URL target probe, dan konfigurasi mana yang kemungkinan digunakan layanan.

4. **Probe mendalam**

   ```bash
   openclaw status --deep
   ```

   Menjalankan probe kesehatan gateway langsung, termasuk probe channel jika didukung
   (memerlukan gateway yang dapat dijangkau). Lihat [Health](/id/gateway/health).

5. **Ikuti log terbaru**

   ```bash
   openclaw logs --follow
   ```

   Jika RPC mati, gunakan cadangan:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Log file terpisah dari log layanan; lihat [Logging](/id/logging) dan [Troubleshooting](/id/gateway/troubleshooting).

6. **Jalankan doctor (perbaikan)**

   ```bash
   openclaw doctor
   ```

   Memperbaiki/memigrasikan config/state + menjalankan pemeriksaan kesehatan. Lihat [Doctor](/id/gateway/doctor).

7. **Snapshot gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # menampilkan URL target + path config saat terjadi error
   ```

   Meminta snapshot penuh dari gateway yang sedang berjalan (khusus WS). Lihat [Health](/id/gateway/health).

## Memulai cepat dan penyiapan pertama kali

<AccordionGroup>
  <Accordion title="Saya mentok, cara tercepat untuk keluar dari masalah">
    Gunakan agent AI lokal yang bisa **melihat mesin Anda**. Itu jauh lebih efektif daripada bertanya
    di Discord, karena kebanyakan kasus "saya mentok" adalah **masalah config atau environment lokal**
    yang tidak bisa diperiksa oleh orang yang membantu dari jarak jauh.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Alat-alat ini dapat membaca repo, menjalankan perintah, memeriksa log, dan membantu memperbaiki
    penyiapan tingkat mesin Anda (PATH, layanan, izin, file auth). Berikan **checkout source lengkap**
    melalui instalasi hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Ini memasang OpenClaw **dari checkout git**, sehingga agent dapat membaca kode + dokumentasi dan
    menalar berdasarkan versi persis yang sedang Anda jalankan. Anda selalu dapat beralih kembali ke stable nanti
    dengan menjalankan ulang installer tanpa `--install-method git`.

    Tip: minta agent untuk **merencanakan dan mengawasi** perbaikan (langkah demi langkah), lalu jalankan hanya
    perintah yang diperlukan. Itu membuat perubahan tetap kecil dan lebih mudah diaudit.

    Jika Anda menemukan bug atau perbaikan nyata, mohon buat issue GitHub atau kirim PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Mulai dengan perintah-perintah ini (bagikan output saat meminta bantuan):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Fungsinya:

    - `openclaw status`: snapshot cepat kesehatan gateway/agent + config dasar.
    - `openclaw models status`: memeriksa auth provider + ketersediaan model.
    - `openclaw doctor`: memvalidasi dan memperbaiki masalah umum config/state.

    Pemeriksaan CLI lain yang berguna: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Siklus debug cepat: [60 detik pertama jika ada yang rusak](#60-detik-pertama-jika-ada-yang-rusak).
    Dokumen instalasi: [Install](/id/install), [Installer flags](/id/install/installer), [Updating](/id/install/updating).

  </Accordion>

  <Accordion title="Heartbeat terus terlewati. Apa arti alasan skip-nya?">
    Alasan skip heartbeat yang umum:

    - `quiet-hours`: di luar jendela active-hours yang dikonfigurasi
    - `empty-heartbeat-file`: `HEARTBEAT.md` ada tetapi hanya berisi kerangka kosong/header saja
    - `no-tasks-due`: mode task `HEARTBEAT.md` aktif tetapi belum ada interval tugas yang jatuh tempo
    - `alerts-disabled`: semua visibilitas heartbeat dinonaktifkan (`showOk`, `showAlerts`, dan `useIndicator` semuanya mati)

    Dalam mode task, stempel waktu jatuh tempo hanya dimajukan setelah heartbeat nyata
    selesai berjalan. Eksekusi yang dilewati tidak menandai tugas sebagai selesai.

    Dokumen: [Heartbeat](/id/gateway/heartbeat), [Automation & Tasks](/id/automation).

  </Accordion>

  <Accordion title="Cara yang direkomendasikan untuk menginstal dan menyiapkan OpenClaw">
    Repo merekomendasikan menjalankan dari source dan menggunakan onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Wizard juga dapat membangun aset UI secara otomatis. Setelah onboarding, biasanya Anda menjalankan Gateway di port **18789**.

    Dari source (kontributor/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # otomatis memasang dependensi UI saat pertama kali dijalankan
    openclaw onboard
    ```

    Jika Anda belum punya instalasi global, jalankan melalui `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Bagaimana cara membuka dashboard setelah onboarding?">
    Wizard membuka browser Anda dengan URL dashboard yang bersih (tanpa token di URL) tepat setelah onboarding dan juga mencetak tautannya di ringkasan. Biarkan tab itu tetap terbuka; jika tidak terbuka otomatis, salin/tempel URL yang dicetak di mesin yang sama.
  </Accordion>

  <Accordion title="Bagaimana cara mengautentikasi dashboard di localhost vs remote?">
    **Localhost (mesin yang sama):**

    - Buka `http://127.0.0.1:18789/`.
    - Jika diminta shared-secret auth, tempel token atau password yang dikonfigurasi ke pengaturan Control UI.
    - Sumber token: `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`).
    - Sumber password: `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`).
    - Jika belum ada shared secret yang dikonfigurasi, buat token dengan `openclaw doctor --generate-gateway-token`.

    **Bukan di localhost:**

    - **Tailscale Serve** (direkomendasikan): tetap gunakan bind loopback, jalankan `openclaw gateway --tailscale serve`, buka `https://<magicdns>/`. Jika `gateway.auth.allowTailscale` bernilai `true`, header identitas memenuhi auth Control UI/WebSocket (tanpa menempel shared secret, mengasumsikan gateway host tepercaya); HTTP API tetap memerlukan shared-secret auth kecuali Anda sengaja menggunakan private-ingress `none` atau trusted-proxy HTTP auth.
      Upaya auth Serve bersamaan yang buruk dari klien yang sama diserialkan sebelum limiter failed-auth mencatatnya, jadi percobaan ulang buruk kedua bisa langsung menampilkan `retry later`.
    - **Bind tailnet**: jalankan `openclaw gateway --bind tailnet --token "<token>"` (atau konfigurasi password auth), buka `http://<tailscale-ip>:18789/`, lalu tempel shared secret yang cocok di pengaturan dashboard.
    - **Reverse proxy aware-identitas**: letakkan Gateway di belakang trusted proxy non-loopback, konfigurasi `gateway.auth.mode: "trusted-proxy"`, lalu buka URL proxy.
    - **Tunnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` lalu buka `http://127.0.0.1:18789/`. Shared-secret auth tetap berlaku melalui tunnel; tempel token atau password yang dikonfigurasi jika diminta.

    Lihat [Dashboard](/web/dashboard) dan [Web surfaces](/web) untuk mode bind dan detail auth.

  </Accordion>

  <Accordion title="Mengapa ada dua config approval exec untuk approval chat?">
    Keduanya mengendalikan lapisan yang berbeda:

    - `approvals.exec`: meneruskan prompt approval ke tujuan chat
    - `channels.<channel>.execApprovals`: membuat channel itu bertindak sebagai klien approval native untuk approval exec

    Kebijakan exec host tetap merupakan gerbang approval yang sebenarnya. Config chat hanya mengendalikan ke mana
    prompt approval muncul dan bagaimana orang bisa menjawabnya.

    Di kebanyakan penyiapan Anda **tidak** membutuhkan keduanya:

    - Jika chat sudah mendukung perintah dan balasan, `/approve` di chat yang sama bekerja melalui jalur bersama.
    - Jika channel native yang didukung dapat menyimpulkan approver dengan aman, OpenClaw sekarang otomatis mengaktifkan approval native DM-first saat `channels.<channel>.execApprovals.enabled` tidak diset atau `"auto"`.
    - Saat kartu/tombol approval native tersedia, UI native itu menjadi jalur utama; agent hanya boleh menyertakan perintah manual `/approve` jika hasil tool menyatakan approval chat tidak tersedia atau approval manual adalah satu-satunya jalur.
    - Gunakan `approvals.exec` hanya jika prompt juga harus diteruskan ke chat lain atau ruang ops khusus.
    - Gunakan `channels.<channel>.execApprovals.target: "channel"` atau `"both"` hanya bila Anda memang ingin prompt approval diposting kembali ke ruang/topic asal.
    - Approval plugin terpisah lagi: mereka menggunakan `/approve` di chat yang sama secara default, penerusan `approvals.plugin` opsional, dan hanya beberapa channel native yang tetap mempertahankan penanganan native approval plugin di atasnya.

    Versi singkat: forwarding untuk routing, config klien native untuk UX khusus channel yang lebih kaya.
    Lihat [Exec Approvals](/id/tools/exec-approvals).

  </Accordion>

  <Accordion title="Runtime apa yang saya butuhkan?">
    Node **>= 22** wajib. `pnpm` direkomendasikan. Bun **tidak direkomendasikan** untuk Gateway.
  </Accordion>

  <Accordion title="Apakah bisa berjalan di Raspberry Pi?">
    Ya. Gateway ringan - dokumentasi menyebut **512MB-1GB RAM**, **1 core**, dan sekitar **500MB**
    disk sudah cukup untuk penggunaan pribadi, dan mencatat bahwa **Raspberry Pi 4 bisa menjalankannya**.

    Jika Anda ingin ruang ekstra (log, media, layanan lain), **2GB direkomendasikan**, tetapi itu
    bukan batas minimum yang mutlak.

    Tip: Pi/VPS kecil dapat meng-host Gateway, dan Anda bisa memasangkan **node** di laptop/ponsel untuk
    screen/camera/canvas lokal atau eksekusi perintah. Lihat [Nodes](/id/nodes).

  </Accordion>

  <Accordion title="Ada tip untuk instalasi Raspberry Pi?">
    Singkatnya: bisa, tetapi siapkan ekspektasi akan ada sisi kasar.

    - Gunakan OS **64-bit** dan tetap gunakan Node >= 22.
    - Lebih baik gunakan **instalasi hackable (git)** agar Anda bisa melihat log dan memperbarui dengan cepat.
    - Mulai tanpa channel/Skills, lalu tambahkan satu per satu.
    - Jika Anda mengalami masalah biner yang aneh, biasanya itu masalah **kompatibilitas ARM**.

    Dokumen: [Linux](/id/platforms/linux), [Install](/id/install).

  </Accordion>

  <Accordion title="Macet di wake up my friend / onboarding tidak mau menetas. Lalu bagaimana?">
    Layar itu bergantung pada Gateway yang dapat dijangkau dan terautentikasi. TUI juga mengirim
    "Wake up, my friend!" secara otomatis saat penetasan pertama. Jika Anda melihat baris itu tanpa **balasan**
    dan token tetap 0, agent tidak pernah berjalan.

    1. Mulai ulang Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Periksa status + auth:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Jika masih menggantung, jalankan:

    ```bash
    openclaw doctor
    ```

    Jika Gateway bersifat remote, pastikan koneksi tunnel/Tailscale aktif dan UI
    diarahkan ke Gateway yang benar. Lihat [Remote access](/id/gateway/remote).

  </Accordion>

  <Accordion title="Bisakah saya memigrasikan penyiapan saya ke mesin baru (Mac mini) tanpa mengulang onboarding?">
    Ya. Salin **direktori state** dan **workspace**, lalu jalankan Doctor sekali. Ini
    menjaga bot Anda tetap "persis sama" (memori, riwayat sesi, auth, dan state
    channel) selama Anda menyalin **kedua** lokasi:

    1. Instal OpenClaw di mesin baru.
    2. Salin `$OPENCLAW_STATE_DIR` (default: `~/.openclaw`) dari mesin lama.
    3. Salin workspace Anda (default: `~/.openclaw/workspace`).
    4. Jalankan `openclaw doctor` dan mulai ulang layanan Gateway.

    Itu mempertahankan config, profil auth, kredensial WhatsApp, sesi, dan memori. Jika Anda berada dalam
    mode remote, ingat bahwa gateway host memiliki session store dan workspace.

    **Penting:** jika Anda hanya commit/push workspace Anda ke GitHub, Anda sedang mencadangkan
    **memori + file bootstrap**, tetapi **bukan** riwayat sesi atau auth. Keduanya berada
    di bawah `~/.openclaw/` (misalnya `~/.openclaw/agents/<agentId>/sessions/`).

    Terkait: [Migrating](/id/install/migrating), [Where things live on disk](#where-things-live-on-disk),
    [Agent workspace](/id/concepts/agent-workspace), [Doctor](/id/gateway/doctor),
    [Remote mode](/id/gateway/remote).

  </Accordion>

  <Accordion title="Di mana saya bisa melihat apa yang baru di versi terbaru?">
    Cek changelog GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Entri terbaru ada di atas. Jika bagian teratas diberi tanda **Unreleased**, bagian bertanggal berikutnya
    adalah versi rilis terbaru. Entri dikelompokkan berdasarkan **Highlights**, **Changes**, dan
    **Fixes** (ditambah bagian docs/lainnya bila diperlukan).

  </Accordion>

  <Accordion title="Tidak bisa mengakses docs.openclaw.ai (error SSL)">
    Beberapa koneksi Comcast/Xfinity salah memblokir `docs.openclaw.ai` melalui Xfinity
    Advanced Security. Nonaktifkan atau allowlist `docs.openclaw.ai`, lalu coba lagi.
    Mohon bantu kami membuka blokirnya dengan melaporkan di sini: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jika Anda masih tidak bisa menjangkau situs itu, dokumentasi juga dicerminkan di GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Perbedaan antara stable dan beta">
    **Stable** dan **beta** adalah **npm dist-tags**, bukan jalur kode terpisah:

    - `latest` = stable
    - `beta` = build awal untuk pengujian

    Biasanya, rilis stable masuk ke **beta** terlebih dahulu, lalu langkah
    promosi eksplisit memindahkan versi yang sama itu ke `latest`. Maintainer juga
    dapat menerbitkan langsung ke `latest` bila diperlukan. Itulah mengapa beta dan stable bisa
    menunjuk ke **versi yang sama** setelah promosi.

    Lihat apa yang berubah:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Untuk one-liner instalasi dan perbedaan antara beta dan dev, lihat accordion di bawah.

  </Accordion>

  <Accordion title="Bagaimana cara menginstal versi beta dan apa perbedaan beta dan dev?">
    **Beta** adalah npm dist-tag `beta` (bisa sama dengan `latest` setelah promosi).
    **Dev** adalah head bergerak dari `main` (git); saat dipublikasikan, ia menggunakan npm dist-tag `dev`.

    One-liner (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Installer Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Detail lebih lanjut: [Development channels](/id/install/development-channels) dan [Installer flags](/id/install/installer).

  </Accordion>

  <Accordion title="Bagaimana cara mencoba bit terbaru?">
    Dua opsi:

    1. **Channel dev (checkout git):**

    ```bash
    openclaw update --channel dev
    ```

    Ini mengalihkan Anda ke branch `main` dan memperbarui dari source.

    2. **Instalasi hackable (dari situs installer):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Itu memberi Anda repo lokal yang bisa Anda edit, lalu diperbarui via git.

    Jika Anda lebih suka clone bersih secara manual, gunakan:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumen: [Update](/cli/update), [Development channels](/id/install/development-channels),
    [Install](/id/install).

  </Accordion>

  <Accordion title="Biasanya instalasi dan onboarding memakan waktu berapa lama?">
    Perkiraan kasar:

    - **Instalasi:** 2-5 menit
    - **Onboarding:** 5-15 menit tergantung berapa banyak channel/model yang Anda konfigurasi

    Jika macet, gunakan [Installer stuck](#quick-start-and-first-run-setup)
    dan siklus debug cepat di [Saya mentok](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer macet? Bagaimana cara mendapat feedback lebih banyak?">
    Jalankan ulang installer dengan **output verbose**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Instalasi beta dengan verbose:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Untuk instalasi hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Padanan Windows (PowerShell):

    ```powershell
    # install.ps1 belum memiliki flag -Verbose khusus.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Opsi lainnya: [Installer flags](/id/install/installer).

  </Accordion>

  <Accordion title="Instalasi Windows mengatakan git tidak ditemukan atau openclaw tidak dikenali">
    Dua masalah Windows yang umum:

    **1) npm error spawn git / git tidak ditemukan**

    - Instal **Git for Windows** dan pastikan `git` ada di PATH Anda.
    - Tutup dan buka kembali PowerShell, lalu jalankan ulang installer.

    **2) openclaw tidak dikenali setelah instalasi**

    - Folder npm global bin Anda tidak ada di PATH.
    - Periksa path-nya:

      ```powershell
      npm config get prefix
      ```

    - Tambahkan direktori itu ke PATH pengguna Anda (tidak perlu akhiran `\bin` di Windows; pada sebagian besar sistem itu `%AppData%\npm`).
    - Tutup dan buka kembali PowerShell setelah memperbarui PATH.

    Jika Anda ingin penyiapan Windows yang paling mulus, gunakan **WSL2** alih-alih Windows native.
    Dokumen: [Windows](/id/platforms/windows).

  </Accordion>

  <Accordion title="Output exec Windows menampilkan teks Mandarin yang rusak - apa yang harus saya lakukan?">
    Ini biasanya ketidakcocokan code page konsol pada shell Windows native.

    Gejala:

    - Output `system.run`/`exec` merender teks Mandarin sebagai mojibake
    - Perintah yang sama terlihat normal di profil terminal lain

    Solusi cepat di PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Lalu mulai ulang Gateway dan coba lagi perintah Anda:

    ```powershell
    openclaw gateway restart
    ```

    Jika Anda masih bisa mereproduksi ini di OpenClaw terbaru, lacak/laporkan di:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Dokumentasi tidak menjawab pertanyaan saya - bagaimana cara mendapat jawaban yang lebih baik?">
    Gunakan **instalasi hackable (git)** agar Anda memiliki source dan dokumentasi lengkap secara lokal, lalu tanyakan
    bot Anda (atau Claude/Codex) _dari folder itu_ agar ia bisa membaca repo dan menjawab dengan tepat.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Detail lebih lanjut: [Install](/id/install) dan [Installer flags](/id/install/installer).

  </Accordion>

  <Accordion title="Bagaimana cara menginstal OpenClaw di Linux?">
    Jawaban singkat: ikuti panduan Linux, lalu jalankan onboarding.

    - Jalur cepat Linux + instalasi layanan: [Linux](/id/platforms/linux).
    - Panduan lengkap: [Getting Started](/id/start/getting-started).
    - Installer + pembaruan: [Install & updates](/id/install/updating).

  </Accordion>

  <Accordion title="Bagaimana cara menginstal OpenClaw di VPS?">
    Linux VPS apa pun bisa dipakai. Instal di server, lalu gunakan SSH/Tailscale untuk menjangkau Gateway.

    Panduan: [exe.dev](/id/install/exe-dev), [Hetzner](/id/install/hetzner), [Fly.io](/id/install/fly).
    Akses remote: [Gateway remote](/id/gateway/remote).

  </Accordion>

  <Accordion title="Di mana panduan instalasi cloud/VPS?">
    Kami menyimpan **hub hosting** dengan provider yang umum. Pilih salah satu dan ikuti panduannya:

    - [VPS hosting](/id/vps) (semua provider di satu tempat)
    - [Fly.io](/id/install/fly)
    - [Hetzner](/id/install/hetzner)
    - [exe.dev](/id/install/exe-dev)

    Cara kerjanya di cloud: **Gateway berjalan di server**, dan Anda mengaksesnya
    dari laptop/ponsel melalui Control UI (atau Tailscale/SSH). State + workspace Anda
    berada di server, jadi perlakukan host tersebut sebagai sumber kebenaran dan cadangkan.

    Anda dapat memasangkan **node** (Mac/iOS/Android/headless) ke Gateway cloud itu untuk mengakses
    screen/camera/canvas lokal atau menjalankan perintah di laptop Anda sambil tetap menjaga
    Gateway di cloud.

    Hub: [Platforms](/id/platforms). Akses remote: [Gateway remote](/id/gateway/remote).
    Nodes: [Nodes](/id/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Bisakah saya meminta OpenClaw memperbarui dirinya sendiri?">
    Jawaban singkat: **bisa, tapi tidak direkomendasikan**. Alur pembaruan dapat memulai ulang
    Gateway (yang memutus sesi aktif), mungkin memerlukan checkout git yang bersih, dan
    bisa meminta konfirmasi. Lebih aman: jalankan pembaruan dari shell sebagai operator.

    Gunakan CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Jika Anda memang harus mengotomatiskannya dari agent:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Dokumen: [Update](/cli/update), [Updating](/id/install/updating).

  </Accordion>

  <Accordion title="Sebenarnya onboarding melakukan apa?">
    `openclaw onboard` adalah jalur penyiapan yang direkomendasikan. Dalam **mode lokal** ia memandu Anda melalui:

    - **Penyiapan model/auth** (OAuth provider, API key, setup-token Anthropic, plus opsi model lokal seperti LM Studio)
    - Lokasi **workspace** + file bootstrap
    - **Pengaturan gateway** (bind/port/auth/tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, plus plugin channel bawaan seperti QQ Bot)
    - **Instalasi daemon** (LaunchAgent di macOS; systemd user unit di Linux/WSL2)
    - **Pemeriksaan kesehatan** dan pemilihan **Skills**

    Ia juga memperingatkan jika model yang Anda konfigurasi tidak dikenali atau auth-nya hilang.

  </Accordion>

  <Accordion title="Apakah saya perlu langganan Claude atau OpenAI untuk menjalankan ini?">
    Tidak. Anda dapat menjalankan OpenClaw dengan **API key** (Anthropic/OpenAI/lainnya) atau dengan
    **model lokal saja** agar data Anda tetap berada di perangkat Anda. Langganan (Claude
    Pro/Max atau OpenAI Codex) adalah cara opsional untuk mengautentikasi provider tersebut.

    Untuk Anthropic di OpenClaw, pembagian praktisnya adalah:

    - **Anthropic API key**: penagihan API Anthropic normal
    - **Claude CLI / auth langganan Claude di OpenClaw**: staf Anthropic
      memberi tahu kami bahwa penggunaan ini diperbolehkan lagi, dan OpenClaw memperlakukan penggunaan `claude -p`
      sebagai penggunaan yang disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru

    Untuk gateway host yang berjalan lama, Anthropic API key tetap menjadi
    penyiapan yang lebih dapat diprediksi. OpenAI Codex OAuth secara eksplisit didukung untuk
    alat eksternal seperti OpenClaw.

    OpenClaw juga mendukung opsi hosted bergaya langganan lainnya termasuk
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan**, dan
    **Z.AI / GLM Coding Plan**.

    Dokumen: [Anthropic](/id/providers/anthropic), [OpenAI](/id/providers/openai),
    [Qwen Cloud](/id/providers/qwen),
    [MiniMax](/id/providers/minimax), [GLM Models](/id/providers/glm),
    [Local models](/id/gateway/local-models), [Models](/id/concepts/models).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan langganan Claude Max tanpa API key?">
    Ya.

    Staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI ala OpenClaw diperbolehkan lagi, jadi
    OpenClaw memperlakukan auth langganan Claude dan penggunaan `claude -p` sebagai disetujui
    untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru. Jika Anda menginginkan
    penyiapan sisi server yang paling dapat diprediksi, gunakan Anthropic API key.

  </Accordion>

  <Accordion title="Apakah Anda mendukung auth langganan Claude (Claude Pro atau Max)?">
    Ya.

    Staf Anthropic memberi tahu kami bahwa penggunaan ini diperbolehkan lagi, sehingga OpenClaw memperlakukan
    penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai penggunaan yang disetujui untuk integrasi ini
    kecuali Anthropic menerbitkan kebijakan baru.

    Setup-token Anthropic masih tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw sekarang lebih memilih penggunaan ulang Claude CLI dan `claude -p` saat tersedia.
    Untuk beban kerja produksi atau multi-pengguna, auth Anthropic API key tetap menjadi
    pilihan yang lebih aman dan lebih dapat diprediksi. Jika Anda ingin opsi hosted bergaya langganan lain
    di OpenClaw, lihat [OpenAI](/id/providers/openai), [Qwen / Model
    Cloud](/id/providers/qwen), [MiniMax](/id/providers/minimax), dan [GLM
    Models](/id/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Mengapa saya melihat HTTP 429 rate_limit_error dari Anthropic?">
Itu berarti **kuota/batas laju Anthropic** Anda habis untuk jendela saat ini. Jika Anda
menggunakan **Claude CLI**, tunggu jendela reset atau tingkatkan paket Anda. Jika Anda
menggunakan **Anthropic API key**, periksa Anthropic Console
untuk penggunaan/penagihan dan naikkan limit sesuai kebutuhan.

    Jika pesannya secara spesifik:
    `Extra usage is required for long context requests`, berarti permintaan mencoba menggunakan
    beta konteks 1M Anthropic (`context1m: true`). Itu hanya bekerja jika
    kredensial Anda memenuhi syarat untuk penagihan konteks panjang (penagihan API key atau
    jalur login-Claude OpenClaw dengan Extra Usage diaktifkan).

    Tip: tetapkan **model fallback** agar OpenClaw dapat tetap membalas saat sebuah provider terkena rate limit.
    Lihat [Models](/cli/models), [OAuth](/id/concepts/oauth), dan
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/id/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Apakah AWS Bedrock didukung?">
    Ya. OpenClaw memiliki provider bawaan **Amazon Bedrock (Converse)**. Dengan marker env AWS yang ada, OpenClaw dapat menemukan otomatis katalog Bedrock streaming/text dan menggabungkannya sebagai provider implisit `amazon-bedrock`; jika tidak, Anda dapat secara eksplisit mengaktifkan `plugins.entries.amazon-bedrock.config.discovery.enabled` atau menambahkan entri provider manual. Lihat [Amazon Bedrock](/id/providers/bedrock) dan [Model providers](/id/providers/models). Jika Anda lebih suka alur managed key, proksi yang kompatibel dengan OpenAI di depan Bedrock juga tetap merupakan opsi yang valid.
  </Accordion>

  <Accordion title="Bagaimana auth Codex bekerja?">
    OpenClaw mendukung **OpenAI Code (Codex)** melalui OAuth (sign-in ChatGPT). Onboarding dapat menjalankan alur OAuth dan akan menetapkan model default ke `openai-codex/gpt-5.4` bila sesuai. Lihat [Model providers](/id/concepts/model-providers) dan [Onboarding (CLI)](/id/start/wizard).
  </Accordion>

  <Accordion title="Mengapa ChatGPT GPT-5.4 tidak membuka openai/gpt-5.4 di OpenClaw?">
    OpenClaw memperlakukan dua jalur ini secara terpisah:

    - `openai-codex/gpt-5.4` = OAuth ChatGPT/Codex
    - `openai/gpt-5.4` = API OpenAI Platform langsung

    Di OpenClaw, sign-in ChatGPT/Codex dihubungkan ke jalur `openai-codex/*`,
    bukan jalur langsung `openai/*`. Jika Anda menginginkan jalur API langsung di
    OpenClaw, setel `OPENAI_API_KEY` (atau config provider OpenAI yang setara).
    Jika Anda menginginkan sign-in ChatGPT/Codex di OpenClaw, gunakan `openai-codex/*`.

  </Accordion>

  <Accordion title="Mengapa batas OAuth Codex bisa berbeda dari ChatGPT web?">
    `openai-codex/*` menggunakan jalur OAuth Codex, dan jendela kuota yang dapat digunakan
    dikelola OpenAI dan bergantung pada paket. Dalam praktiknya, limit-limit itu bisa berbeda dari
    pengalaman website/aplikasi ChatGPT, bahkan jika keduanya terkait ke akun yang sama.

    OpenClaw dapat menampilkan jendela penggunaan/kuota provider yang saat ini terlihat di
    `openclaw models status`, tetapi tidak mengarang atau menormalkan
    entitlement ChatGPT-web menjadi akses API langsung. Jika Anda menginginkan jalur
    penagihan/limit OpenAI Platform langsung, gunakan `openai/*` dengan API key.

  </Accordion>

  <Accordion title="Apakah Anda mendukung auth langganan OpenAI (Codex OAuth)?">
    Ya. OpenClaw sepenuhnya mendukung **OpenAI Code (Codex) subscription OAuth**.
    OpenAI secara eksplisit mengizinkan penggunaan subscription OAuth dalam alat/alur kerja eksternal
    seperti OpenClaw. Onboarding dapat menjalankan alur OAuth untuk Anda.

    Lihat [OAuth](/id/concepts/oauth), [Model providers](/id/concepts/model-providers), dan [Onboarding (CLI)](/id/start/wizard).

  </Accordion>

  <Accordion title="Bagaimana cara menyiapkan Gemini CLI OAuth?">
    Gemini CLI menggunakan **plugin auth flow**, bukan client id atau secret di `openclaw.json`.

    Langkah-langkah:

    1. Instal Gemini CLI secara lokal agar `gemini` ada di `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktifkan plugin: `openclaw plugins enable google`
    3. Login: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Model default setelah login: `google-gemini-cli/gemini-3.1-pro-preview`
    5. Jika permintaan gagal, setel `GOOGLE_CLOUD_PROJECT` atau `GOOGLE_CLOUD_PROJECT_ID` di gateway host

    Ini menyimpan token OAuth dalam profil auth di gateway host. Detail: [Model providers](/id/concepts/model-providers).

  </Accordion>

  <Accordion title="Apakah model lokal cocok untuk chat santai?">
    Biasanya tidak. OpenClaw memerlukan konteks besar + keamanan yang kuat; kartu kecil akan memotong dan bocor. Jika harus, jalankan build model **terbesar** yang bisa Anda jalankan secara lokal (LM Studio) dan lihat [/gateway/local-models](/id/gateway/local-models). Model yang lebih kecil/terkuantisasi meningkatkan risiko prompt injection - lihat [Security](/id/gateway/security).
  </Accordion>

  <Accordion title="Bagaimana cara menjaga traffic model hosted tetap di region tertentu?">
    Pilih endpoint yang dipatok ke region. OpenRouter menyediakan opsi yang di-host di AS untuk MiniMax, Kimi, dan GLM; pilih varian yang di-host di AS untuk menjaga data tetap di region. Anda tetap dapat mencantumkan Anthropic/OpenAI di samping ini dengan menggunakan `models.mode: "merge"` agar fallback tetap tersedia sambil menghormati provider ber-region yang Anda pilih.
  </Accordion>

  <Accordion title="Apakah saya harus membeli Mac Mini untuk menginstal ini?">
    Tidak. OpenClaw berjalan di macOS atau Linux (Windows via WSL2). Mac mini bersifat opsional - sebagian orang
    membelinya sebagai host yang selalu aktif, tetapi VPS kecil, server rumahan, atau perangkat kelas Raspberry Pi juga bisa.

    Anda hanya membutuhkan Mac **untuk alat yang khusus macOS**. Untuk iMessage, gunakan [BlueBubbles](/id/channels/bluebubbles) (direkomendasikan) - server BlueBubbles berjalan di Mac apa pun, dan Gateway dapat berjalan di Linux atau tempat lain. Jika Anda menginginkan alat khusus macOS lainnya, jalankan Gateway di Mac atau pasangkan node macOS.

    Dokumen: [BlueBubbles](/id/channels/bluebubbles), [Nodes](/id/nodes), [Mac remote mode](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Apakah saya perlu Mac mini untuk dukungan iMessage?">
    Anda membutuhkan **perangkat macOS apa pun** yang masuk ke Messages. Itu **tidak** harus Mac mini -
    Mac apa pun bisa. **Gunakan [BlueBubbles](/id/channels/bluebubbles)** (direkomendasikan) untuk iMessage - server BlueBubbles berjalan di macOS, sementara Gateway dapat berjalan di Linux atau tempat lain.

    Penyiapan umum:

    - Jalankan Gateway di Linux/VPS, dan jalankan server BlueBubbles di Mac mana pun yang masuk ke Messages.
    - Jalankan semuanya di Mac jika Anda ingin penyiapan satu mesin yang paling sederhana.

    Dokumen: [BlueBubbles](/id/channels/bluebubbles), [Nodes](/id/nodes),
    [Mac remote mode](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jika saya membeli Mac mini untuk menjalankan OpenClaw, bisakah saya menghubungkannya ke MacBook Pro saya?">
    Ya. **Mac mini dapat menjalankan Gateway**, dan MacBook Pro Anda dapat terhubung sebagai
    **node** (perangkat pendamping). Node tidak menjalankan Gateway - mereka menyediakan
    kemampuan tambahan seperti screen/camera/canvas dan `system.run` di perangkat tersebut.

    Pola umum:

    - Gateway di Mac mini (selalu aktif).
    - MacBook Pro menjalankan aplikasi macOS atau host node dan dipasangkan ke Gateway.
    - Gunakan `openclaw nodes status` / `openclaw nodes list` untuk melihatnya.

    Dokumen: [Nodes](/id/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan Bun?">
    Bun **tidak direkomendasikan**. Kami melihat bug runtime, terutama dengan WhatsApp dan Telegram.
    Gunakan **Node** untuk gateway yang stabil.

    Jika Anda tetap ingin bereksperimen dengan Bun, lakukan itu di gateway non-produksi
    tanpa WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: apa yang dimasukkan ke allowFrom?">
    `channels.telegram.allowFrom` adalah **ID pengguna Telegram pengirim manusia** (numerik). Bukan username bot.

    Onboarding menerima input `@username` dan mengubahnya menjadi ID numerik, tetapi otorisasi OpenClaw hanya menggunakan ID numerik.

    Lebih aman (tanpa bot pihak ketiga):

    - Kirim DM ke bot Anda, lalu jalankan `openclaw logs --follow` dan baca `from.id`.

    Bot API resmi:

    - Kirim DM ke bot Anda, lalu panggil `https://api.telegram.org/bot<bot_token>/getUpdates` dan baca `message.from.id`.

    Pihak ketiga (kurang privat):

    - Kirim DM ke `@userinfobot` atau `@getidsbot`.

    Lihat [/channels/telegram](/id/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Bisakah beberapa orang menggunakan satu nomor WhatsApp dengan instance OpenClaw yang berbeda?">
    Ya, melalui **multi-agent routing**. Ikat **DM** WhatsApp tiap pengirim (peer `kind: "direct"`, pengirim E.164 seperti `+15551234567`) ke `agentId` yang berbeda, sehingga tiap orang mendapat workspace dan session store mereka sendiri. Balasan tetap berasal dari **akun WhatsApp yang sama**, dan kontrol akses DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) bersifat global per akun WhatsApp. Lihat [Multi-Agent Routing](/id/concepts/multi-agent) dan [WhatsApp](/id/channels/whatsapp).
  </Accordion>

  <Accordion title='Bisakah saya menjalankan agent "fast chat" dan agent "Opus for coding"?'>
    Ya. Gunakan multi-agent routing: beri tiap agent model defaultnya sendiri, lalu ikat rute masuk (akun provider atau peer tertentu) ke masing-masing agent. Contoh config ada di [Multi-Agent Routing](/id/concepts/multi-agent). Lihat juga [Models](/id/concepts/models) dan [Configuration](/id/gateway/configuration).
  </Accordion>

  <Accordion title="Apakah Homebrew berfungsi di Linux?">
    Ya. Homebrew mendukung Linux (Linuxbrew). Penyiapan cepat:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Jika Anda menjalankan OpenClaw melalui systemd, pastikan PATH layanan mencakup `/home/linuxbrew/.linuxbrew/bin` (atau prefix brew Anda) agar alat yang dipasang dengan `brew` dapat di-resolve di shell non-login.
    Build terbaru juga menambahkan direktori user bin umum di layanan Linux systemd (misalnya `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) dan menghormati `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, dan `FNM_DIR` bila disetel.

  </Accordion>

  <Accordion title="Perbedaan antara instalasi git hackable dan npm install">
    - **Instalasi hackable (git):** checkout source lengkap, bisa diedit, terbaik untuk kontributor.
      Anda menjalankan build secara lokal dan dapat menambal kode/dokumentasi.
    - **npm install:** instalasi CLI global, tanpa repo, terbaik untuk "tinggal jalankan".
      Pembaruan berasal dari npm dist-tags.

    Dokumen: [Getting started](/id/start/getting-started), [Updating](/id/install/updating).

  </Accordion>

  <Accordion title="Bisakah saya beralih antara instalasi npm dan git nanti?">
    Ya. Instal varian lainnya, lalu jalankan Doctor agar layanan gateway mengarah ke entrypoint baru.
    Ini **tidak menghapus data Anda** - hanya mengubah instalasi kode OpenClaw. State Anda
    (`~/.openclaw`) dan workspace (`~/.openclaw/workspace`) tetap tidak tersentuh.

    Dari npm ke git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    Dari git ke npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor mendeteksi ketidakcocokan entrypoint layanan gateway dan menawarkan untuk menulis ulang config layanan agar cocok dengan instalasi saat ini (gunakan `--repair` dalam otomasi).

    Tip cadangan: lihat [Backup strategy](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Sebaiknya saya menjalankan Gateway di laptop atau VPS?">
    Jawaban singkat: **jika Anda ingin keandalan 24/7, gunakan VPS**. Jika Anda ingin
    friksi paling rendah dan tidak masalah dengan sleep/restart, jalankan secara lokal.

    **Laptop (Gateway lokal)**

    - **Kelebihan:** tanpa biaya server, akses langsung ke file lokal, jendela browser terlihat.
    - **Kekurangan:** sleep/jaringan putus = koneksi terputus, pembaruan/reboot OS mengganggu, mesin harus tetap aktif.

    **VPS / cloud**

    - **Kelebihan:** selalu aktif, jaringan stabil, tidak ada masalah sleep laptop, lebih mudah dijaga tetap berjalan.
    - **Kekurangan:** sering berjalan headless (gunakan screenshot), akses file hanya remote, Anda harus SSH untuk pembaruan.

    **Catatan khusus OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord semuanya bekerja baik dari VPS. Satu-satunya trade-off nyata adalah **browser headless** vs jendela terlihat. Lihat [Browser](/id/tools/browser).

    **Default yang direkomendasikan:** VPS jika Anda pernah mengalami gateway disconnect sebelumnya. Lokal bagus saat Anda aktif menggunakan Mac dan menginginkan akses file lokal atau otomasi UI dengan browser yang terlihat.

  </Accordion>

  <Accordion title="Seberapa penting menjalankan OpenClaw di mesin khusus?">
    Tidak wajib, tetapi **direkomendasikan untuk keandalan dan isolasi**.

    - **Host khusus (VPS/Mac mini/Pi):** selalu aktif, lebih sedikit gangguan sleep/reboot, izin lebih bersih, lebih mudah dijaga tetap berjalan.
    - **Laptop/desktop bersama:** sepenuhnya oke untuk pengujian dan penggunaan aktif, tetapi perkirakan jeda saat mesin sleep atau memperbarui.

    Jika Anda menginginkan yang terbaik dari keduanya, simpan Gateway di host khusus dan pasangkan laptop Anda sebagai **node** untuk alat screen/camera/exec lokal. Lihat [Nodes](/id/nodes).
    Untuk panduan keamanan, baca [Security](/id/gateway/security).

  </Accordion>

  <Accordion title="Apa persyaratan minimum VPS dan OS yang direkomendasikan?">
    OpenClaw ringan. Untuk Gateway dasar + satu chat channel:

    - **Minimum mutlak:** 1 vCPU, 1GB RAM, ~500MB disk.
    - **Direkomendasikan:** 1-2 vCPU, RAM 2GB atau lebih untuk ruang ekstra (log, media, beberapa channel). Alat node dan otomasi browser bisa rakus sumber daya.

    OS: gunakan **Ubuntu LTS** (atau Debian/Ubuntu modern lainnya). Jalur instalasi Linux paling banyak diuji di sana.

    Dokumen: [Linux](/id/platforms/linux), [VPS hosting](/id/vps).

  </Accordion>

  <Accordion title="Bisakah saya menjalankan OpenClaw di VM dan apa persyaratannya?">
    Ya. Perlakukan VM sama seperti VPS: harus selalu aktif, dapat dijangkau, dan memiliki
    RAM yang cukup untuk Gateway dan channel apa pun yang Anda aktifkan.

    Panduan dasar:

    - **Minimum mutlak:** 1 vCPU, 1GB RAM.
    - **Direkomendasikan:** RAM 2GB atau lebih jika Anda menjalankan beberapa channel, otomasi browser, atau alat media.
    - **OS:** Ubuntu LTS atau Debian/Ubuntu modern lainnya.

    Jika Anda menggunakan Windows, **WSL2 adalah penyiapan gaya VM yang paling mudah** dan memiliki kompatibilitas
    alat terbaik. Lihat [Windows](/id/platforms/windows), [VPS hosting](/id/vps).
    Jika Anda menjalankan macOS di VM, lihat [macOS VM](/id/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Apa itu OpenClaw?

<AccordionGroup>
  <Accordion title="Apa itu OpenClaw, dalam satu paragraf?">
    OpenClaw adalah asisten AI pribadi yang Anda jalankan di perangkat Anda sendiri. Ia membalas di permukaan perpesanan yang sudah Anda gunakan (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, dan plugin channel bawaan seperti QQ Bot) dan juga dapat melakukan suara + Canvas langsung di platform yang didukung. **Gateway** adalah control plane yang selalu aktif; asistennya adalah produknya.
  </Accordion>

  <Accordion title="Proposisi nilai">
    OpenClaw bukan "sekadar wrapper Claude." Ini adalah **control plane local-first** yang memungkinkan Anda menjalankan
    asisten yang mumpuni di **perangkat keras Anda sendiri**, dapat dijangkau dari aplikasi chat yang sudah Anda gunakan, dengan
    sesi stateful, memori, dan alat - tanpa menyerahkan kendali alur kerja Anda ke
    SaaS yang di-host.

    Sorotan:

    - **Perangkat Anda, data Anda:** jalankan Gateway di mana pun Anda mau (Mac, Linux, VPS) dan simpan
      workspace + riwayat sesi tetap lokal.
    - **Channel nyata, bukan sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/dll,
      plus suara seluler dan Canvas di platform yang didukung.
    - **Model-agnostic:** gunakan Anthropic, OpenAI, MiniMax, OpenRouter, dll., dengan routing per-agent
      dan failover.
    - **Opsi lokal saja:** jalankan model lokal sehingga **semua data bisa tetap di perangkat Anda** jika Anda mau.
    - **Multi-agent routing:** agent terpisah per channel, akun, atau tugas, masing-masing dengan
      workspace dan default-nya sendiri.
    - **Open source dan hackable:** periksa, perluas, dan self-host tanpa vendor lock-in.

    Dokumen: [Gateway](/id/gateway), [Channels](/id/channels), [Multi-agent](/id/concepts/multi-agent),
    [Memory](/id/concepts/memory).

  </Accordion>

  <Accordion title="Saya baru saja menyiapkannya - apa yang harus saya lakukan terlebih dahulu?">
    Proyek awal yang bagus:

    - Bangun situs web (WordPress, Shopify, atau situs statis sederhana).
    - Prototipe aplikasi seluler (garis besar, layar, rencana API).
    - Atur file dan folder (pembersihan, penamaan, penandaan).
    - Hubungkan Gmail dan otomatisasi ringkasan atau tindak lanjut.

    Ia bisa menangani tugas besar, tetapi bekerja paling baik ketika Anda memecahnya menjadi beberapa fase dan
    menggunakan sub-agent untuk pekerjaan paralel.

  </Accordion>

  <Accordion title="Apa lima use case sehari-hari teratas untuk OpenClaw?">
    Kemenangan sehari-hari biasanya terlihat seperti:

    - **Briefing pribadi:** ringkasan inbox, kalender, dan berita yang Anda pedulikan.
    - **Riset dan drafting:** riset cepat, ringkasan, dan draft awal untuk email atau dokumen.
    - **Pengingat dan tindak lanjut:** dorongan dan checklist yang digerakkan cron atau heartbeat.
    - **Otomasi browser:** mengisi formulir, mengumpulkan data, dan mengulang tugas web.
    - **Koordinasi lintas perangkat:** kirim tugas dari ponsel Anda, biarkan Gateway menjalankannya di server, lalu dapatkan hasilnya kembali di chat.

  </Accordion>

  <Accordion title="Bisakah OpenClaw membantu lead gen, outreach, iklan, dan blog untuk SaaS?">
    Ya untuk **riset, kualifikasi, dan drafting**. Ia dapat memindai situs, membuat shortlist,
    merangkum prospek, dan menulis draft outreach atau copy iklan.

    Untuk **outreach atau menjalankan iklan**, pertahankan manusia dalam loop. Hindari spam, patuhi hukum lokal dan
    kebijakan platform, dan tinjau semuanya sebelum dikirim. Pola yang paling aman adalah membiarkan
    OpenClaw membuat draft dan Anda menyetujuinya.

    Dokumen: [Security](/id/gateway/security).

  </Accordion>

  <Accordion title="Apa kelebihannya dibanding Claude Code untuk pengembangan web?">
    OpenClaw adalah **asisten pribadi** dan lapisan koordinasi, bukan pengganti IDE. Gunakan
    Claude Code atau Codex untuk siklus coding langsung tercepat di dalam repo. Gunakan OpenClaw saat Anda
    menginginkan memori yang tahan lama, akses lintas perangkat, dan orkestrasi alat.

    Kelebihan:

    - **Memori + workspace persisten** lintas sesi
    - **Akses multi-platform** (WhatsApp, Telegram, TUI, WebChat)
    - **Orkestrasi alat** (browser, file, penjadwalan, hooks)
    - **Gateway selalu aktif** (jalankan di VPS, berinteraksi dari mana saja)
    - **Nodes** untuk browser/screen/camera/exec lokal

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills dan otomasi

<AccordionGroup>
  <Accordion title="Bagaimana cara menyesuaikan Skills tanpa membuat repo kotor?">
    Gunakan managed override alih-alih mengedit salinan repo. Taruh perubahan Anda di `~/.openclaw/skills/<name>/SKILL.md` (atau tambahkan folder melalui `skills.load.extraDirs` di `~/.openclaw/openclaw.json`). Urutan prioritas adalah `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bawaan → `skills.load.extraDirs`, jadi managed override tetap menang atas Skills bawaan tanpa menyentuh git. Jika Anda perlu Skill terpasang secara global tetapi hanya terlihat oleh beberapa agent, simpan salinan bersama di `~/.openclaw/skills` dan kendalikan visibilitas dengan `agents.defaults.skills` dan `agents.list[].skills`. Hanya edit yang layak di-upstream yang sebaiknya hidup di repo dan dikirim sebagai PR.
  </Accordion>

  <Accordion title="Bisakah saya memuat Skills dari folder kustom?">
    Ya. Tambahkan direktori tambahan melalui `skills.load.extraDirs` di `~/.openclaw/openclaw.json` (prioritas terendah). Prioritas default adalah `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bawaan → `skills.load.extraDirs`. `clawhub` memasang ke `./skills` secara default, yang diperlakukan OpenClaw sebagai `<workspace>/skills` pada sesi berikutnya. Jika Skill hanya boleh terlihat oleh agent tertentu, pasangkan itu dengan `agents.defaults.skills` atau `agents.list[].skills`.
  </Accordion>

  <Accordion title="Bagaimana saya bisa menggunakan model yang berbeda untuk tugas yang berbeda?">
    Saat ini pola yang didukung adalah:

    - **Cron jobs**: job terisolasi dapat menetapkan override `model` per job.
    - **Sub-agents**: rute tugas ke agent terpisah dengan model default yang berbeda.
    - **Peralihan sesuai permintaan**: gunakan `/model` untuk mengganti model sesi saat ini kapan saja.

    Lihat [Cron jobs](/id/automation/cron-jobs), [Multi-Agent Routing](/id/concepts/multi-agent), dan [Slash commands](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot membeku saat melakukan pekerjaan berat. Bagaimana cara memindahkannya?">
    Gunakan **sub-agents** untuk tugas yang panjang atau paralel. Sub-agent berjalan di sesinya sendiri,
    mengembalikan ringkasan, dan menjaga chat utama Anda tetap responsif.

    Minta bot Anda untuk "spawn a sub-agent for this task" atau gunakan `/subagents`.
    Gunakan `/status` di chat untuk melihat apa yang sedang dilakukan Gateway sekarang (dan apakah ia sibuk).

    Tip token: tugas panjang dan sub-agent sama-sama mengonsumsi token. Jika biaya menjadi perhatian, setel
    model yang lebih murah untuk sub-agent melalui `agents.defaults.subagents.model`.

    Dokumen: [Sub-agents](/id/tools/subagents), [Background Tasks](/id/automation/tasks).

  </Accordion>

  <Accordion title="Bagaimana cara kerja sesi subagent yang terikat thread di Discord?">
    Gunakan pengikatan thread. Anda dapat mengikat thread Discord ke target subagent atau sesi sehingga pesan tindak lanjut di thread itu tetap berada pada sesi yang terikat.

    Alur dasar:

    - Spawn dengan `sessions_spawn` menggunakan `thread: true` (dan opsional `mode: "session"` untuk tindak lanjut persisten).
    - Atau ikat secara manual dengan `/focus <target>`.
    - Gunakan `/agents` untuk memeriksa status pengikatan.
    - Gunakan `/session idle <duration|off>` dan `/session max-age <duration|off>` untuk mengontrol auto-unfocus.
    - Gunakan `/unfocus` untuk melepas thread.

    Config yang diperlukan:

    - Default global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Auto-bind saat spawn: setel `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Dokumen: [Sub-agents](/id/tools/subagents), [Discord](/id/channels/discord), [Configuration Reference](/id/gateway/configuration-reference), [Slash commands](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent selesai, tetapi pembaruan completion masuk ke tempat yang salah atau tidak pernah diposting. Apa yang harus saya periksa?">
    Periksa resolved requester route terlebih dahulu:

    - Pengiriman subagent mode completion lebih memilih thread terikat atau route percakapan bila ada.
    - Jika asal completion hanya membawa channel, OpenClaw menggunakan route tersimpan sesi peminta (`lastChannel` / `lastTo` / `lastAccountId`) sehingga pengiriman langsung tetap bisa berhasil.
    - Jika tidak ada route terikat maupun route tersimpan yang dapat digunakan, pengiriman langsung bisa gagal dan hasilnya jatuh kembali ke pengiriman sesi yang diantrekan alih-alih langsung diposting ke chat.
    - Target yang tidak valid atau basi masih dapat memaksa fallback antrean atau kegagalan pengiriman akhir.
    - Jika balasan assistant terlihat terakhir dari child adalah token senyap persis `NO_REPLY` / `no_reply`, atau persis `ANNOUNCE_SKIP`, OpenClaw sengaja menekan announce alih-alih memposting progres lama yang basi.
    - Jika child timeout setelah hanya melakukan pemanggilan tool, announce dapat meringkas itu menjadi ringkasan progres parsial singkat alih-alih memutar ulang output tool mentah.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumen: [Sub-agents](/id/tools/subagents), [Background Tasks](/id/automation/tasks), [Session Tools](/id/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron atau reminder tidak berjalan. Apa yang harus saya periksa?">
    Cron berjalan di dalam proses Gateway. Jika Gateway tidak berjalan terus-menerus,
    job terjadwal tidak akan berjalan.

    Checklist:

    - Konfirmasikan cron diaktifkan (`cron.enabled`) dan `OPENCLAW_SKIP_CRON` tidak disetel.
    - Periksa bahwa Gateway berjalan 24/7 (tanpa sleep/restart).
    - Verifikasi pengaturan zona waktu untuk job (`--tz` vs zona waktu host).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumen: [Cron jobs](/id/automation/cron-jobs), [Automation & Tasks](/id/automation).

  </Accordion>

  <Accordion title="Cron berjalan, tetapi tidak ada yang dikirim ke channel. Mengapa?">
    Periksa mode pengiriman terlebih dahulu:

    - `--no-deliver` / `delivery.mode: "none"` berarti tidak ada pesan eksternal yang diharapkan.
    - Target announce yang hilang atau tidak valid (`channel` / `to`) berarti runner melewati pengiriman keluar.
    - Kegagalan auth channel (`unauthorized`, `Forbidden`) berarti runner mencoba mengirim tetapi kredensial memblokirnya.
    - Hasil terisolasi senyap (`NO_REPLY` / `no_reply` saja) diperlakukan sebagai sengaja tidak dapat dikirim, jadi runner juga menekan pengiriman fallback yang diantrekan.

    Untuk cron job terisolasi, runner yang memiliki pengiriman akhir. Agent diharapkan
    mengembalikan ringkasan teks biasa agar runner dapat mengirimkannya. `--no-deliver` menjaga
    hasil itu tetap internal; itu tidak membuat agent bisa mengirim langsung dengan
    tool pesan.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumen: [Cron jobs](/id/automation/cron-jobs), [Background Tasks](/id/automation/tasks).

  </Accordion>

  <Accordion title="Mengapa isolated cron run mengganti model atau mencoba ulang sekali?">
    Itu biasanya jalur live model-switch, bukan penjadwalan duplikat.

    Cron terisolasi dapat menyimpan handoff model runtime dan mencoba ulang saat eksekusi aktif
    melempar `LiveSessionModelSwitchError`. Percobaan ulang mempertahankan
    provider/model yang sudah diganti, dan jika switch membawa override profil auth baru, cron
    menyimpan itu juga sebelum mencoba ulang.

    Aturan pemilihan terkait:

    - Override model hook Gmail menang lebih dulu bila berlaku.
    - Lalu `model` per-job.
    - Lalu override model cron-session tersimpan.
    - Lalu pemilihan model agent/default normal.

    Siklus percobaan ulang dibatasi. Setelah percobaan awal plus 2 percobaan ulang switch,
    cron dihentikan alih-alih berulang tanpa henti.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumen: [Cron jobs](/id/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Bagaimana cara menginstal Skills di Linux?">
    Gunakan perintah native `openclaw skills` atau taruh Skills ke workspace Anda. UI Skills macOS tidak tersedia di Linux.
    Jelajahi Skills di [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    `openclaw skills install` native menulis ke direktori `skills/`
    workspace aktif. Instal CLI `clawhub` terpisah hanya jika Anda ingin menerbitkan atau
    menyinkronkan Skills Anda sendiri. Untuk instalasi bersama lintas agent, letakkan Skill di bawah
    `~/.openclaw/skills` dan gunakan `agents.defaults.skills` atau
    `agents.list[].skills` jika Anda ingin membatasi agent mana yang dapat melihatnya.

  </Accordion>

  <Accordion title="Bisakah OpenClaw menjalankan tugas sesuai jadwal atau terus-menerus di latar belakang?">
    Ya. Gunakan scheduler Gateway:

    - **Cron jobs** untuk tugas terjadwal atau berulang (persisten lintas restart).
    - **Heartbeat** untuk pemeriksaan berkala "sesi utama".
    - **Isolated jobs** untuk agent otonom yang memposting ringkasan atau mengirim ke chat.

    Dokumen: [Cron jobs](/id/automation/cron-jobs), [Automation & Tasks](/id/automation),
    [Heartbeat](/id/gateway/heartbeat).

  </Accordion>

  <Accordion title="Bisakah saya menjalankan Skills Apple khusus macOS dari Linux?">
    Tidak secara langsung. Skills macOS dibatasi oleh `metadata.openclaw.os` plus biner yang dibutuhkan, dan Skills hanya muncul di system prompt bila memenuhi syarat di **gateway host**. Di Linux, Skills khusus `darwin` (seperti `apple-notes`, `apple-reminders`, `things-mac`) tidak akan dimuat kecuali Anda mengoverride pembatasannya.

    Anda memiliki tiga pola yang didukung:

    **Opsi A - jalankan Gateway di Mac (paling sederhana).**
    Jalankan Gateway di tempat biner macOS ada, lalu hubungkan dari Linux dalam [mode remote](#gateway-ports-already-running-and-remote-mode) atau melalui Tailscale. Skills akan dimuat normal karena gateway host adalah macOS.

    **Opsi B - gunakan node macOS (tanpa SSH).**
    Jalankan Gateway di Linux, pasangkan node macOS (aplikasi menubar), dan setel **Node Run Commands** ke "Always Ask" atau "Always Allow" di Mac. OpenClaw dapat memperlakukan Skills khusus macOS sebagai layak saat biner yang dibutuhkan ada di node. Agent menjalankan Skills tersebut melalui tool `nodes`. Jika Anda memilih "Always Ask", menyetujui "Always Allow" di prompt akan menambahkan perintah itu ke allowlist.

    **Opsi C - proksi biner macOS melalui SSH (lanjutan).**
    Pertahankan Gateway di Linux, tetapi buat biner CLI yang dibutuhkan di-resolve ke wrapper SSH yang berjalan di Mac. Lalu override Skill agar mengizinkan Linux sehingga tetap layak.

    1. Buat wrapper SSH untuk biner (contoh: `memo` untuk Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Letakkan wrapper di `PATH` pada host Linux (misalnya `~/bin/memo`).
    3. Override metadata Skill (workspace atau `~/.openclaw/skills`) agar mengizinkan Linux:

       ```markdown
       ---
       name: apple-notes
       description: Kelola Apple Notes melalui CLI memo di macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Mulai sesi baru agar snapshot Skills disegarkan.

  </Accordion>

  <Accordion title="Apakah Anda punya integrasi Notion atau HeyGen?">
    Belum ada bawaan saat ini.

    Opsi:

    - **Skill / plugin kustom:** terbaik untuk akses API yang andal (Notion/HeyGen sama-sama punya API).
    - **Otomasi browser:** bekerja tanpa kode tetapi lebih lambat dan lebih rapuh.

    Jika Anda ingin menjaga konteks per klien (alur kerja agensi), pola sederhananya adalah:

    - Satu halaman Notion per klien (konteks + preferensi + pekerjaan aktif).
    - Minta agent mengambil halaman itu di awal sesi.

    Jika Anda menginginkan integrasi native, buka feature request atau bangun Skill
    yang menargetkan API tersebut.

    Instal Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Instalasi native masuk ke direktori `skills/` workspace aktif. Untuk Skills bersama lintas agent, letakkan di `~/.openclaw/skills/<name>/SKILL.md`. Jika hanya beberapa agent yang boleh melihat instalasi bersama, konfigurasi `agents.defaults.skills` atau `agents.list[].skills`. Beberapa Skills mengharapkan biner yang dipasang melalui Homebrew; di Linux itu berarti Linuxbrew (lihat entri FAQ Homebrew Linux di atas). Lihat [Skills](/id/tools/skills), [Skills config](/id/tools/skills-config), dan [ClawHub](/id/tools/clawhub).

  </Accordion>

  <Accordion title="Bagaimana cara menggunakan Chrome saya yang sudah login dengan OpenClaw?">
    Gunakan profil browser bawaan `user`, yang terhubung melalui Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Jika Anda ingin nama kustom, buat profil MCP eksplisit:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Jalur ini bersifat lokal terhadap host. Jika Gateway berjalan di tempat lain, jalankan host node di mesin browser atau gunakan CDP remote.

    Batasan saat ini pada `existing-session` / `user`:

    - aksi berbasis ref, bukan berbasis selector CSS
    - upload memerlukan `ref` / `inputRef` dan saat ini mendukung satu file dalam satu waktu
    - `responsebody`, ekspor PDF, intersepsi download, dan aksi batch masih memerlukan browser terkelola atau profil CDP mentah

  </Accordion>
</AccordionGroup>

## Sandboxing dan memori

<AccordionGroup>
  <Accordion title="Apakah ada dokumen sandboxing khusus?">
    Ya. Lihat [Sandboxing](/id/gateway/sandboxing). Untuk penyiapan khusus Docker (gateway penuh di Docker atau image sandbox), lihat [Docker](/id/install/docker).
  </Accordion>

  <Accordion title="Docker terasa terbatas - bagaimana cara mengaktifkan fitur penuh?">
    Image default mengutamakan keamanan dan berjalan sebagai user `node`, sehingga tidak
    menyertakan paket sistem, Homebrew, atau browser bawaan. Untuk penyiapan yang lebih lengkap:

    - Persistenkan `/home/node` dengan `OPENCLAW_HOME_VOLUME` agar cache bertahan.
    - Bake dependensi sistem ke image dengan `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Instal browser Playwright melalui CLI bawaan:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Setel `PLAYWRIGHT_BROWSERS_PATH` dan pastikan path itu dipersistenkan.

    Dokumen: [Docker](/id/install/docker), [Browser](/id/tools/browser).

  </Accordion>

  <Accordion title="Bisakah saya menjaga DM tetap pribadi tetapi membuat grup publik/tersandbox dengan satu agent?">
    Ya - jika traffic privat Anda adalah **DM** dan traffic publik Anda adalah **grup**.

    Gunakan `agents.defaults.sandbox.mode: "non-main"` agar sesi grup/channel (kunci non-utama) berjalan di Docker, sementara sesi DM utama tetap di host. Lalu batasi alat yang tersedia di sesi tersandbox melalui `tools.sandbox.tools`.

    Panduan penyiapan + contoh config: [Groups: personal DMs + public groups](/id/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referensi config utama: [Gateway configuration](/id/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Bagaimana cara mengikat folder host ke sandbox?">
    Setel `agents.defaults.sandbox.docker.binds` menjadi `["host:path:mode"]` (mis. `"/home/user/src:/src:ro"`). Bind global + per-agent akan digabungkan; bind per-agent diabaikan saat `scope: "shared"`. Gunakan `:ro` untuk apa pun yang sensitif dan ingat bahwa bind melewati dinding filesystem sandbox.

    OpenClaw memvalidasi sumber bind terhadap path yang dinormalisasi dan path kanonis yang di-resolve melalui ancestor terdalam yang ada. Itu berarti escape symlink-parent tetap gagal-tertutup bahkan saat segmen path terakhir belum ada, dan pemeriksaan allowed-root tetap berlaku setelah resolusi symlink.

    Lihat [Sandboxing](/id/gateway/sandboxing#custom-bind-mounts) dan [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) untuk contoh dan catatan keamanan.

  </Accordion>

  <Accordion title="Bagaimana cara kerja memori?">
    Memori OpenClaw hanyalah file Markdown di workspace agent:

    - Catatan harian di `memory/YYYY-MM-DD.md`
    - Catatan jangka panjang yang dikurasi di `MEMORY.md` (khusus sesi utama/pribadi)

    OpenClaw juga menjalankan **silent pre-compaction memory flush** untuk mengingatkan model
    agar menulis catatan yang tahan lama sebelum auto-compaction. Ini hanya berjalan saat workspace
    dapat ditulisi (sandbox read-only melewatinya). Lihat [Memory](/id/concepts/memory).

  </Accordion>

  <Accordion title="Memori terus lupa. Bagaimana cara membuatnya melekat?">
    Minta bot untuk **menulis fakta itu ke memori**. Catatan jangka panjang masuk ke `MEMORY.md`,
    konteks jangka pendek masuk ke `memory/YYYY-MM-DD.md`.

    Ini masih area yang terus kami perbaiki. Membantu juga jika Anda mengingatkan model untuk menyimpan memori;
    ia akan tahu harus berbuat apa. Jika tetap lupa, verifikasi bahwa Gateway menggunakan
    workspace yang sama di setiap eksekusi.

    Dokumen: [Memory](/id/concepts/memory), [Agent workspace](/id/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Apakah memori bertahan selamanya? Apa batasnya?">
    File memori berada di disk dan bertahan sampai Anda menghapusnya. Batasnya adalah
    penyimpanan Anda, bukan model. **Konteks sesi** tetap dibatasi oleh jendela konteks model,
    jadi percakapan panjang dapat mengalami compaction atau truncation. Itulah mengapa
    pencarian memori ada - ia hanya menarik bagian yang relevan kembali ke konteks.

    Dokumen: [Memory](/id/concepts/memory), [Context](/id/concepts/context).

  </Accordion>

  <Accordion title="Apakah pencarian memori semantik memerlukan OpenAI API key?">
    Hanya jika Anda menggunakan **embedding OpenAI**. Codex OAuth mencakup chat/completions dan
    **tidak** memberikan akses embeddings, jadi **login dengan Codex (OAuth atau login Codex CLI)**
    tidak membantu untuk pencarian memori semantik. Embedding OpenAI
    tetap membutuhkan API key nyata (`OPENAI_API_KEY` atau `models.providers.openai.apiKey`).

    Jika Anda tidak menetapkan provider secara eksplisit, OpenClaw memilih provider secara otomatis saat
    dapat me-resolve API key (profil auth, `models.providers.*.apiKey`, atau env vars).
    Ia lebih memilih OpenAI jika OpenAI key bisa di-resolve, kalau tidak Gemini jika Gemini key
    bisa di-resolve, lalu Voyage, lalu Mistral. Jika tidak ada remote key yang tersedia, pencarian memori
    tetap dinonaktifkan sampai Anda mengonfigurasinya. Jika Anda memiliki jalur model lokal
    yang dikonfigurasi dan tersedia, OpenClaw
    lebih memilih `local`. Ollama didukung saat Anda secara eksplisit menetapkan
    `memorySearch.provider = "ollama"`.

    Jika Anda ingin tetap lokal, setel `memorySearch.provider = "local"` (dan opsional
    `memorySearch.fallback = "none"`). Jika Anda ingin embedding Gemini, setel
    `memorySearch.provider = "gemini"` dan sediakan `GEMINI_API_KEY` (atau
    `memorySearch.remote.apiKey`). Kami mendukung model embedding **OpenAI, Gemini, Voyage, Mistral, Ollama, atau lokal**
    - lihat [Memory](/id/concepts/memory) untuk detail penyiapannya.

  </Accordion>
</AccordionGroup>

## Di mana semuanya berada di disk

<AccordionGroup>
  <Accordion title="Apakah semua data yang digunakan dengan OpenClaw disimpan secara lokal?">
    Tidak - **state OpenClaw bersifat lokal**, tetapi **layanan eksternal tetap melihat apa yang Anda kirimkan kepada mereka**.

    - **Lokal secara default:** sesi, file memori, config, dan workspace berada di gateway host
      (`~/.openclaw` + direktori workspace Anda).
    - **Remote karena keharusan:** pesan yang Anda kirim ke provider model (Anthropic/OpenAI/dll.) masuk ke
      API mereka, dan platform chat (WhatsApp/Telegram/Slack/dll.) menyimpan data pesan di
      server mereka.
    - **Anda mengendalikan jejaknya:** menggunakan model lokal menjaga prompt tetap ada di mesin Anda, tetapi traffic
      channel tetap melewati server channel tersebut.

    Terkait: [Agent workspace](/id/concepts/agent-workspace), [Memory](/id/concepts/memory).

  </Accordion>

  <Accordion title="Di mana OpenClaw menyimpan datanya?">
    Semuanya berada di bawah `$OPENCLAW_STATE_DIR` (default: `~/.openclaw`):

    | Path                                                            | Tujuan                                                             |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Config utama (JSON5)                                               |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Impor OAuth lama (disalin ke profil auth saat pertama digunakan)   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profil auth (OAuth, API key, dan `keyRef`/`tokenRef` opsional)     |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload secret opsional berbasis file untuk provider SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | File kompatibilitas lama (entri `api_key` statis sudah dibersihkan) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | State provider (mis. `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | State per-agent (agentDir + sesi)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Riwayat percakapan & state (per agent)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadata sesi (per agent)                                          |

    Jalur single-agent lama: `~/.openclaw/agent/*` (dimigrasikan oleh `openclaw doctor`).

    **Workspace** Anda (AGENTS.md, file memori, Skills, dll.) terpisah dan dikonfigurasi melalui `agents.defaults.workspace` (default: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Di mana AGENTS.md / SOUL.md / USER.md / MEMORY.md seharusnya berada?">
    File-file ini berada di **workspace agent**, bukan `~/.openclaw`.

    - **Workspace (per agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (atau fallback lama `memory.md` saat `MEMORY.md` tidak ada),
      `memory/YYYY-MM-DD.md`, opsional `HEARTBEAT.md`.
    - **Direktori state (`~/.openclaw`)**: config, state channel/provider, profil auth, sesi, log,
      dan Skills bersama (`~/.openclaw/skills`).

    Workspace default adalah `~/.openclaw/workspace`, dapat dikonfigurasi melalui:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Jika bot "lupa" setelah restart, pastikan Gateway menggunakan
    workspace yang sama setiap kali dijalankan (dan ingat: mode remote menggunakan **workspace gateway host**,
    bukan laptop lokal Anda).

    Tip: jika Anda menginginkan perilaku atau preferensi yang tahan lama, minta bot untuk **menuliskannya ke
    AGENTS.md atau MEMORY.md** alih-alih mengandalkan riwayat chat.

    Lihat [Agent workspace](/id/concepts/agent-workspace) dan [Memory](/id/concepts/memory).

  </Accordion>

  <Accordion title="Strategi cadangan yang direkomendasikan">
    Letakkan **workspace agent** Anda dalam repo git **privat** dan cadangkan ke tempat
    privat (misalnya GitHub private). Ini menangkap memori + file AGENTS/SOUL/USER
    , dan memungkinkan Anda memulihkan "pikiran" asisten nanti.

    **Jangan** commit apa pun di bawah `~/.openclaw` (kredensial, sesi, token, atau payload secret terenkripsi).
    Jika Anda memerlukan pemulihan penuh, cadangkan workspace dan direktori state
    secara terpisah (lihat pertanyaan migrasi di atas).

    Dokumen: [Agent workspace](/id/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bagaimana cara menghapus OpenClaw sepenuhnya?">
    Lihat panduan khusus: [Uninstall](/id/install/uninstall).
  </Accordion>

  <Accordion title="Bisakah agent bekerja di luar workspace?">
    Ya. Workspace adalah **cwd default** dan jangkar memori, bukan sandbox keras.
    Path relatif di-resolve di dalam workspace, tetapi path absolut dapat mengakses lokasi host lain
    kecuali sandboxing diaktifkan. Jika Anda memerlukan isolasi, gunakan
    [`agents.defaults.sandbox`](/id/gateway/sandboxing) atau pengaturan sandbox per-agent. Jika Anda
    ingin repo menjadi direktori kerja default, arahkan `workspace`
    agent tersebut ke root repo. Repo OpenClaw hanyalah source code; simpan
    workspace terpisah kecuali Anda memang ingin agent bekerja di dalamnya.

    Contoh (repo sebagai cwd default):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Mode remote: di mana session store?">
    State sesi dimiliki oleh **gateway host**. Jika Anda berada dalam mode remote, session store yang penting bagi Anda ada di mesin remote, bukan laptop lokal Anda. Lihat [Session management](/id/concepts/session).
  </Accordion>
</AccordionGroup>

## Dasar-dasar config

<AccordionGroup>
  <Accordion title="Format apa config-nya? Di mana lokasinya?">
    OpenClaw membaca config **JSON5** opsional dari `$OPENCLAW_CONFIG_PATH` (default: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Jika file hilang, ia menggunakan default yang cukup aman (termasuk workspace default `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Saya menyetel gateway.bind: "lan" (atau "tailnet") dan sekarang tidak ada yang mendengarkan / UI mengatakan unauthorized'>
    Bind non-loopback **memerlukan jalur auth gateway yang valid**. Dalam praktiknya itu berarti:

    - shared-secret auth: token atau password
    - `gateway.auth.mode: "trusted-proxy"` di belakang reverse proxy aware-identitas non-loopback yang dikonfigurasi dengan benar

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    Catatan:

    - `gateway.remote.token` / `.password` **tidak** mengaktifkan auth gateway lokal dengan sendirinya.
    - Jalur pemanggilan lokal dapat menggunakan `gateway.remote.*` sebagai fallback hanya saat `gateway.auth.*` tidak disetel.
    - Untuk password auth, setel `gateway.auth.mode: "password"` plus `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`) sebagai gantinya.
    - Jika `gateway.auth.token` / `gateway.auth.password` dikonfigurasi secara eksplisit via SecretRef dan tidak dapat di-resolve, resolusi gagal-tertutup (tidak ada fallback remote yang menutupi).
    - Penyiapan shared-secret Control UI mengautentikasi melalui `connect.params.auth.token` atau `connect.params.auth.password` (disimpan dalam pengaturan aplikasi/UI). Mode berbasis identitas seperti Tailscale Serve atau `trusted-proxy` menggunakan header permintaan. Hindari menaruh shared secret di URL.
    - Dengan `gateway.auth.mode: "trusted-proxy"`, reverse proxy loopback di host yang sama tetap **tidak** memenuhi auth trusted-proxy. Trusted proxy harus menjadi sumber non-loopback yang dikonfigurasi.

  </Accordion>

  <Accordion title="Mengapa sekarang saya perlu token di localhost?">
    OpenClaw menerapkan auth gateway secara default, termasuk loopback. Dalam jalur default normal itu berarti token auth: jika tidak ada jalur auth eksplisit yang dikonfigurasi, startup gateway me-resolve ke mode token dan otomatis membuat satu, menyimpannya ke `gateway.auth.token`, sehingga **klien WS lokal harus mengautentikasi**. Ini memblokir proses lokal lain agar tidak bisa memanggil Gateway.

    Jika Anda lebih suka jalur auth yang berbeda, Anda dapat secara eksplisit memilih mode password (atau, untuk reverse proxy aware-identitas non-loopback, `trusted-proxy`). Jika Anda **benar-benar** menginginkan loopback terbuka, setel `gateway.auth.mode: "none"` secara eksplisit di config. Doctor dapat membuat token untuk Anda kapan saja: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Apakah saya harus restart setelah mengubah config?">
    Gateway memantau config dan mendukung hot-reload:

    - `gateway.reload.mode: "hybrid"` (default): hot-apply perubahan aman, restart untuk perubahan kritis
    - `hot`, `restart`, `off` juga didukung

  </Accordion>

  <Accordion title="Bagaimana cara menonaktifkan tagline CLI yang lucu?">
    Setel `cli.banner.taglineMode` di config:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: menyembunyikan teks tagline tetapi tetap menampilkan judul banner/baris versi.
    - `default`: menggunakan `All your chats, one OpenClaw.` setiap waktu.
    - `random`: tagline lucu/musiman bergilir (perilaku default).
    - Jika Anda tidak ingin ada banner sama sekali, setel env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Bagaimana cara mengaktifkan web search (dan web fetch)?">
    `web_fetch` bekerja tanpa API key. `web_search` bergantung pada provider
    yang Anda pilih:

    - Provider berbasis API seperti Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity, dan Tavily memerlukan penyiapan API key normal mereka.
    - Ollama Web Search bebas key, tetapi menggunakan host Ollama yang Anda konfigurasi dan memerlukan `ollama signin`.
    - DuckDuckGo bebas key, tetapi ini adalah integrasi tidak resmi berbasis HTML.
    - SearXNG bebas key/self-hosted; konfigurasi `SEARXNG_BASE_URL` atau `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Direkomendasikan:** jalankan `openclaw configure --section web` dan pilih provider.
    Alternatif environment:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` atau `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, atau `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` atau `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // opsional; hilangkan untuk auto-detect
            },
          },
        },
    }
    ```

    Config web-search khusus provider sekarang berada di bawah `plugins.entries.<plugin>.config.webSearch.*`.
    Jalur provider lama `tools.web.search.*` masih dimuat sementara untuk kompatibilitas, tetapi tidak boleh digunakan untuk config baru.
    Config fallback web-fetch Firecrawl berada di bawah `plugins.entries.firecrawl.config.webFetch.*`.

    Catatan:

    - Jika Anda menggunakan allowlist, tambahkan `web_search`/`web_fetch`/`x_search` atau `group:web`.
    - `web_fetch` diaktifkan secara default (kecuali dinonaktifkan secara eksplisit).
    - Jika `tools.web.fetch.provider` dihilangkan, OpenClaw mendeteksi otomatis provider fallback fetch pertama yang siap dari kredensial yang tersedia. Saat ini provider bawaannya adalah Firecrawl.
    - Daemon membaca env vars dari `~/.openclaw/.env` (atau environment layanan).

    Dokumen: [Web tools](/id/tools/web).

  </Accordion>

  <Accordion title="config.apply menghapus config saya. Bagaimana cara memulihkan dan menghindarinya?">
    `config.apply` menggantikan **seluruh config**. Jika Anda mengirim objek parsial, semua
    yang lain akan dihapus.

    Pemulihan:

    - Pulihkan dari cadangan (git atau salinan `~/.openclaw/openclaw.json`).
    - Jika Anda tidak punya cadangan, jalankan ulang `openclaw doctor` dan konfigurasi ulang channel/model.
    - Jika ini tidak terduga, buat bug report dan sertakan config terakhir yang Anda ketahui atau cadangan apa pun.
    - Agent coding lokal sering kali bisa merekonstruksi config yang berfungsi dari log atau riwayat.

    Cara menghindarinya:

    - Gunakan `openclaw config set` untuk perubahan kecil.
    - Gunakan `openclaw configure` untuk edit interaktif.
    - Gunakan `config.schema.lookup` terlebih dahulu saat Anda tidak yakin tentang path atau bentuk field yang tepat; ia mengembalikan node schema dangkal plus ringkasan child langsung untuk drill-down.
    - Gunakan `config.patch` untuk edit RPC parsial; simpan `config.apply` hanya untuk penggantian config penuh.
    - Jika Anda menggunakan tool `gateway` yang khusus owner dari eksekusi agent, ia tetap akan menolak penulisan ke `tools.exec.ask` / `tools.exec.security` (termasuk alias lama `tools.bash.*` yang dinormalisasi ke path exec terlindungi yang sama).

    Dokumen: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/id/gateway/doctor).

  </Accordion>

  <Accordion title="Bagaimana cara menjalankan Gateway pusat dengan worker khusus di berbagai perangkat?">
    Pola yang umum adalah **satu Gateway** (mis. Raspberry Pi) plus **nodes** dan **agents**:

    - **Gateway (pusat):** memiliki channel (Signal/WhatsApp), routing, dan sesi.
    - **Nodes (perangkat):** Mac/iOS/Android terhubung sebagai periferal dan mengekspos alat lokal (`system.run`, `canvas`, `camera`).
    - **Agents (worker):** otak/workspace terpisah untuk peran khusus (mis. "Hetzner ops", "Personal data").
    - **Sub-agents:** spawn pekerjaan latar belakang dari agent utama saat Anda menginginkan paralelisme.
    - **TUI:** terhubung ke Gateway dan berpindah agent/sesi.

    Dokumen: [Nodes](/id/nodes), [Remote access](/id/gateway/remote), [Multi-Agent Routing](/id/concepts/multi-agent), [Sub-agents](/id/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="Bisakah browser OpenClaw berjalan headless?">
    Ya. Ini adalah opsi config:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    Default-nya `false` (headful). Headless lebih mungkin memicu pemeriksaan anti-bot di beberapa situs. Lihat [Browser](/id/tools/browser).

    Headless menggunakan **engine Chromium yang sama** dan bekerja untuk sebagian besar otomasi (formulir, klik, scraping, login). Perbedaan utamanya:

    - Tidak ada jendela browser yang terlihat (gunakan screenshot jika Anda membutuhkan visual).
    - Beberapa situs lebih ketat terhadap otomasi dalam mode headless (CAPTCHA, anti-bot).
      Misalnya, X/Twitter sering memblokir sesi headless.

  </Accordion>

  <Accordion title="Bagaimana cara menggunakan Brave untuk kontrol browser?">
    Setel `browser.executablePath` ke biner Brave Anda (atau browser berbasis Chromium apa pun) lalu mulai ulang Gateway.
    Lihat contoh config lengkap di [Browser](/id/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateway remote dan nodes

<AccordionGroup>
  <Accordion title="Bagaimana perintah merambat antara Telegram, gateway, dan nodes?">
    Pesan Telegram ditangani oleh **gateway**. Gateway menjalankan agent dan
    baru kemudian memanggil node melalui **Gateway WebSocket** saat tool node diperlukan:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node tidak melihat traffic provider masuk; mereka hanya menerima panggilan RPC node.

  </Accordion>

  <Accordion title="Bagaimana agent saya bisa mengakses komputer saya jika Gateway di-host secara remote?">
    Jawaban singkat: **pasangkan komputer Anda sebagai node**. Gateway berjalan di tempat lain, tetapi dapat
    memanggil tool `node.*` (screen, camera, system) di mesin lokal Anda melalui Gateway WebSocket.

    Penyiapan umum:

    1. Jalankan Gateway di host yang selalu aktif (VPS/server rumahan).
    2. Tempatkan gateway host + komputer Anda di tailnet yang sama.
    3. Pastikan Gateway WS dapat dijangkau (bind tailnet atau tunnel SSH).
    4. Buka aplikasi macOS secara lokal dan hubungkan dalam mode **Remote over SSH** (atau tailnet langsung)
       agar dapat mendaftar sebagai node.
    5. Setujui node di Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Tidak diperlukan bridge TCP terpisah; node terhubung melalui Gateway WebSocket.

    Pengingat keamanan: memasangkan node macOS memungkinkan `system.run` di mesin itu. Hanya
    pasangkan perangkat yang Anda percayai, dan tinjau [Security](/id/gateway/security).

    Dokumen: [Nodes](/id/nodes), [Gateway protocol](/id/gateway/protocol), [macOS remote mode](/id/platforms/mac/remote), [Security](/id/gateway/security).

  </Accordion>

  <Accordion title="Tailscale terhubung tetapi saya tidak mendapatkan balasan. Lalu bagaimana?">
    Periksa dasar-dasarnya:

    - Gateway berjalan: `openclaw gateway status`
    - Kesehatan Gateway: `openclaw status`
    - Kesehatan channel: `openclaw channels status`

    Lalu verifikasi auth dan routing:

    - Jika Anda menggunakan Tailscale Serve, pastikan `gateway.auth.allowTailscale` disetel dengan benar.
    - Jika Anda terhubung melalui tunnel SSH, pastikan tunnel lokal aktif dan mengarah ke port yang benar.
    - Pastikan allowlist Anda (DM atau grup) mencakup akun Anda.

    Dokumen: [Tailscale](/id/gateway/tailscale), [Remote access](/id/gateway/remote), [Channels](/id/channels).

  </Accordion>

  <Accordion title="Bisakah dua instance OpenClaw berbicara satu sama lain (lokal + VPS)?">
    Ya. Tidak ada bridge "bot-ke-bot" bawaan, tetapi Anda bisa merangkainya dengan beberapa
    cara yang andal:

    **Paling sederhana:** gunakan channel chat normal yang bisa diakses kedua bot (Telegram/Slack/WhatsApp).
    Minta Bot A mengirim pesan ke Bot B, lalu biarkan Bot B membalas seperti biasa.

    **Bridge CLI (generik):** jalankan skrip yang memanggil Gateway lain dengan
    `openclaw agent --message ... --deliver`, menargetkan chat tempat bot lain
    mendengarkan. Jika salah satu bot ada di VPS remote, arahkan CLI Anda ke Gateway remote tersebut
    via SSH/Tailscale (lihat [Remote access](/id/gateway/remote)).

    Pola contoh (jalankan dari mesin yang dapat menjangkau Gateway target):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tip: tambahkan guardrail agar kedua bot tidak masuk ke loop tak berujung (hanya-mention,
    allowlist channel, atau aturan "jangan balas pesan bot").

    Dokumen: [Remote access](/id/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/id/tools/agent-send).

  </Accordion>

  <Accordion title="Apakah saya perlu VPS terpisah untuk banyak agent?">
    Tidak. Satu Gateway dapat meng-host banyak agent, masing-masing dengan workspace, default model,
    dan routing sendiri. Itu adalah penyiapan normal dan jauh lebih murah serta sederhana daripada menjalankan
    satu VPS per agent.

    Gunakan VPS terpisah hanya bila Anda memerlukan isolasi keras (batas keamanan) atau config
    yang sangat berbeda yang tidak ingin Anda bagikan. Jika tidak, pertahankan satu Gateway dan
    gunakan banyak agent atau sub-agent.

  </Accordion>

  <Accordion title="Apakah ada manfaat menggunakan node di laptop pribadi saya dibanding SSH dari VPS?">
    Ya - nodes adalah cara kelas satu untuk menjangkau laptop Anda dari Gateway remote, dan mereka
    membuka lebih dari sekadar akses shell. Gateway berjalan di macOS/Linux (Windows via WSL2) dan
    ringan (VPS kecil atau perangkat kelas Raspberry Pi sudah cukup; RAM 4 GB lebih dari cukup), sehingga pola umum
    adalah host yang selalu aktif plus laptop Anda sebagai node.

    - **Tidak perlu SSH inbound.** Node terhubung keluar ke Gateway WebSocket dan menggunakan pairing perangkat.
    - **Kontrol eksekusi yang lebih aman.** `system.run` dibatasi oleh allowlist/approval node di laptop tersebut.
    - **Lebih banyak alat perangkat.** Nodes mengekspos `canvas`, `camera`, dan `screen` selain `system.run`.
    - **Otomasi browser lokal.** Pertahankan Gateway di VPS, tetapi jalankan Chrome secara lokal melalui host node di laptop, atau sambungkan ke Chrome lokal di host melalui Chrome MCP.

    SSH baik untuk akses shell ad-hoc, tetapi nodes lebih sederhana untuk alur kerja agent yang berkelanjutan dan
    otomasi perangkat.

    Dokumen: [Nodes](/id/nodes), [Nodes CLI](/cli/nodes), [Browser](/id/tools/browser).

  </Accordion>

  <Accordion title="Apakah nodes menjalankan layanan gateway?">
    Tidak. Hanya **satu gateway** yang seharusnya berjalan per host kecuali Anda sengaja menjalankan profil terisolasi (lihat [Multiple gateways](/id/gateway/multiple-gateways)). Nodes adalah periferal yang terhubung
    ke gateway (node iOS/Android, atau "node mode" macOS di aplikasi menubar). Untuk host node
    headless dan kontrol CLI, lihat [Node host CLI](/cli/node).

    Restart penuh diperlukan untuk perubahan `gateway`, `discovery`, dan `canvasHost`.

  </Accordion>

  <Accordion title="Apakah ada cara API / RPC untuk menerapkan config?">
    Ya.

    - `config.schema.lookup`: periksa satu subtree config dengan node schema dangkal, petunjuk UI yang cocok, dan ringkasan child langsung sebelum menulis
    - `config.get`: ambil snapshot + hash saat ini
    - `config.patch`: pembaruan parsial aman (lebih disukai untuk sebagian besar edit RPC)
    - `config.apply`: validasi + ganti config penuh, lalu restart
    - Tool runtime `gateway` yang khusus owner tetap menolak menulis ulang `tools.exec.ask` / `tools.exec.security`; alias lama `tools.bash.*` dinormalisasi ke jalur exec terlindungi yang sama

  </Accordion>

  <Accordion title="Config minimal yang masuk akal untuk instalasi pertama">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Ini menetapkan workspace Anda dan membatasi siapa yang dapat memicu bot.

  </Accordion>

  <Accordion title="Bagaimana cara menyiapkan Tailscale di VPS dan terhubung dari Mac saya?">
    Langkah minimal:

    1. **Instal + login di VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Instal + login di Mac Anda**
       - Gunakan aplikasi Tailscale dan masuk ke tailnet yang sama.
    3. **Aktifkan MagicDNS (direkomendasikan)**
       - Di konsol admin Tailscale, aktifkan MagicDNS agar VPS punya nama yang stabil.
    4. **Gunakan hostname tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Jika Anda menginginkan Control UI tanpa SSH, gunakan Tailscale Serve di VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Ini menjaga gateway tetap bound ke loopback dan mengekspos HTTPS via Tailscale. Lihat [Tailscale](/id/gateway/tailscale).

  </Accordion>

  <Accordion title="Bagaimana cara menghubungkan node Mac ke Gateway remote (Tailscale Serve)?">
    Serve mengekspos **Gateway Control UI + WS**. Nodes terhubung melalui endpoint Gateway WS yang sama.

    Penyiapan yang direkomendasikan:

    1. **Pastikan VPS + Mac berada di tailnet yang sama**.
    2. **Gunakan aplikasi macOS dalam mode Remote** (target SSH bisa berupa hostname tailnet).
       Aplikasi akan men-tunnel port Gateway dan terhubung sebagai node.
    3. **Setujui node** di gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumen: [Gateway protocol](/id/gateway/protocol), [Discovery](/id/gateway/discovery), [macOS remote mode](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Haruskah saya instal di laptop kedua atau cukup tambahkan node?">
    Jika Anda hanya membutuhkan **alat lokal** (screen/camera/exec) di laptop kedua, tambahkan sebagai
    **node**. Itu mempertahankan satu Gateway dan menghindari duplikasi config. Alat node lokal
    saat ini hanya untuk macOS, tetapi kami berencana memperluasnya ke OS lain.

    Instal Gateway kedua hanya jika Anda memerlukan **isolasi keras** atau dua bot yang sepenuhnya terpisah.

    Dokumen: [Nodes](/id/nodes), [Nodes CLI](/cli/nodes), [Multiple gateways](/id/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars dan pemuatan .env

<AccordionGroup>
  <Accordion title="Bagaimana OpenClaw memuat environment variable?">
    OpenClaw membaca env vars dari proses induk (shell, launchd/systemd, CI, dll.) dan juga memuat:

    - `.env` dari direktori kerja saat ini
    - fallback `.env` global dari `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`)

    Tidak ada file `.env` yang menimpa env vars yang sudah ada.

    Anda juga dapat mendefinisikan env vars inline di config (diterapkan hanya jika tidak ada di process env):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Lihat [/environment](/id/help/environment) untuk prioritas dan sumber lengkap.

  </Accordion>

  <Accordion title="Saya memulai Gateway via layanan dan env vars saya hilang. Sekarang bagaimana?">
    Dua perbaikan umum:

    1. Letakkan key yang hilang di `~/.openclaw/.env` agar tetap diambil walaupun layanan tidak mewarisi shell env Anda.
    2. Aktifkan impor shell (kemudahan opt-in):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    Ini menjalankan login shell Anda dan hanya mengimpor key yang diharapkan yang hilang (tidak pernah menimpa). Padanan env var:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Saya menyetel COPILOT_GITHUB_TOKEN, tetapi models status menampilkan "Shell env: off." Mengapa?'>
    `openclaw models status` melaporkan apakah **impor shell env** diaktifkan. "Shell env: off"
    **tidak** berarti env vars Anda hilang - itu hanya berarti OpenClaw tidak akan memuat
    login shell Anda secara otomatis.

    Jika Gateway berjalan sebagai layanan (launchd/systemd), ia tidak akan mewarisi
    environment shell Anda. Perbaiki dengan salah satu cara berikut:

    1. Letakkan token di `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Atau aktifkan shell import (`env.shellEnv.enabled: true`).
    3. Atau tambahkan ke blok `env` config Anda (diterapkan hanya jika belum ada).

    Lalu restart gateway dan periksa lagi:

    ```bash
    openclaw models status
    ```

    Token Copilot dibaca dari `COPILOT_GITHUB_TOKEN` (juga `GH_TOKEN` / `GITHUB_TOKEN`).
    Lihat [/concepts/model-providers](/id/concepts/model-providers) dan [/environment](/id/help/environment).

  </Accordion>
</AccordionGroup>

## Sesi dan beberapa chat

<AccordionGroup>
  <Accordion title="Bagaimana cara memulai percakapan baru?">
    Kirim `/new` atau `/reset` sebagai pesan mandiri. Lihat [Session management](/id/concepts/session).
  </Accordion>

  <Accordion title="Apakah sesi otomatis reset jika saya tidak pernah mengirim /new?">
    Sesi dapat kedaluwarsa setelah `session.idleMinutes`, tetapi ini **dinonaktifkan secara default** (default **0**).
    Setel ke nilai positif untuk mengaktifkan idle expiry. Saat diaktifkan, pesan **berikutnya**
    setelah periode idle akan memulai session id baru untuk chat key tersebut.
    Ini tidak menghapus transkrip - hanya memulai sesi baru.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Apakah ada cara membuat tim instance OpenClaw (satu CEO dan banyak agent)?">
    Ya, melalui **multi-agent routing** dan **sub-agents**. Anda dapat membuat satu agent
    koordinator dan beberapa agent pekerja dengan workspace dan model mereka sendiri.

    Meski begitu, ini paling baik dipandang sebagai **eksperimen yang menyenangkan**. Ini berat pada token dan sering
    kurang efisien dibanding menggunakan satu bot dengan sesi terpisah. Model tipikal yang kami
    bayangkan adalah satu bot yang Anda ajak bicara, dengan sesi berbeda untuk pekerjaan paralel. Bot itu
    juga dapat spawn sub-agent saat diperlukan.

    Dokumen: [Multi-agent routing](/id/concepts/multi-agent), [Sub-agents](/id/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Mengapa konteks terpotong di tengah tugas? Bagaimana cara mencegahnya?">
    Konteks sesi dibatasi oleh jendela model. Chat panjang, output tool besar, atau banyak
    file dapat memicu compaction atau truncation.

    Yang membantu:

    - Minta bot merangkum status saat ini dan menuliskannya ke file.
    - Gunakan `/compact` sebelum tugas panjang, dan `/new` saat berganti topik.
    - Simpan konteks penting di workspace dan minta bot membacanya kembali.
    - Gunakan sub-agent untuk pekerjaan panjang atau paralel agar chat utama tetap lebih kecil.
    - Pilih model dengan jendela konteks lebih besar jika ini sering terjadi.

  </Accordion>

  <Accordion title="Bagaimana cara mereset OpenClaw sepenuhnya tetapi tetap mempertahankan instalasinya?">
    Gunakan perintah reset:

    ```bash
    openclaw reset
    ```

    Reset penuh non-interaktif:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Lalu jalankan ulang penyiapan:

    ```bash
    openclaw onboard --install-daemon
    ```

    Catatan:

    - Onboarding juga menawarkan **Reset** jika ia melihat config yang sudah ada. Lihat [Onboarding (CLI)](/id/start/wizard).
    - Jika Anda menggunakan profile (`--profile` / `OPENCLAW_PROFILE`), reset tiap direktori state (default-nya `~/.openclaw-<profile>`).
    - Reset dev: `openclaw gateway --dev --reset` (khusus dev; menghapus config dev + kredensial + sesi + workspace).

  </Accordion>

  <Accordion title='Saya mendapatkan error "context too large" - bagaimana cara reset atau compact?'>
    Gunakan salah satu dari ini:

    - **Compact** (mempertahankan percakapan tetapi meringkas giliran yang lebih lama):

      ```
      /compact
      ```

      atau `/compact <instructions>` untuk memandu ringkasan.

    - **Reset** (session ID baru untuk chat key yang sama):

      ```
      /new
      /reset
      ```

    Jika ini terus terjadi:

    - Aktifkan atau sesuaikan **session pruning** (`agents.defaults.contextPruning`) untuk memangkas output tool lama.
    - Gunakan model dengan jendela konteks lebih besar.

    Dokumen: [Compaction](/id/concepts/compaction), [Session pruning](/id/concepts/session-pruning), [Session management](/id/concepts/session).

  </Accordion>

  <Accordion title='Mengapa saya melihat "LLM request rejected: messages.content.tool_use.input field required"?'>
    Ini adalah error validasi provider: model mengeluarkan blok `tool_use` tanpa
    `input` yang diperlukan. Biasanya itu berarti riwayat sesi basi atau rusak (sering setelah thread panjang
    atau perubahan tool/schema).

    Perbaikan: mulai sesi baru dengan `/new` (pesan mandiri).

  </Accordion>

  <Accordion title="Mengapa saya menerima pesan heartbeat setiap 30 menit?">
    Heartbeat berjalan setiap **30m** secara default (**1h** saat menggunakan auth OAuth). Sesuaikan atau nonaktifkan:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // atau "0m" untuk menonaktifkan
          },
        },
      },
    }
    ```

    Jika `HEARTBEAT.md` ada tetapi secara efektif kosong (hanya baris kosong dan header
    markdown seperti `# Heading`), OpenClaw melewati eksekusi heartbeat untuk menghemat panggilan API.
    Jika file hilang, heartbeat tetap berjalan dan model memutuskan apa yang harus dilakukan.

    Override per-agent menggunakan `agents.list[].heartbeat`. Dokumen: [Heartbeat](/id/gateway/heartbeat).

  </Accordion>

  <Accordion title='Apakah saya perlu menambahkan "akun bot" ke grup WhatsApp?'>
    Tidak. OpenClaw berjalan di **akun Anda sendiri**, jadi jika Anda ada di grup itu, OpenClaw bisa melihatnya.
    Secara default, balasan grup diblokir sampai Anda mengizinkan pengirim (`groupPolicy: "allowlist"`).

    Jika Anda hanya ingin **Anda sendiri** yang dapat memicu balasan grup:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Bagaimana cara mendapatkan JID grup WhatsApp?">
    Opsi 1 (paling cepat): ikuti log dan kirim pesan uji di grup:

    ```bash
    openclaw logs --follow --json
    ```

    Cari `chatId` (atau `from`) yang berakhir dengan `@g.us`, seperti:
    `1234567890-1234567890@g.us`.

    Opsi 2 (jika sudah dikonfigurasi/di-allowlist): daftar grup dari config:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumen: [WhatsApp](/id/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Mengapa OpenClaw tidak membalas di grup?">
    Dua penyebab umum:

    - Mention gating aktif (default). Anda harus @mention bot (atau cocok dengan `mentionPatterns`).
    - Anda mengonfigurasi `channels.whatsapp.groups` tanpa `"*"` dan grup itu tidak ada di allowlist.

    Lihat [Groups](/id/channels/groups) dan [Group messages](/id/channels/group-messages).

  </Accordion>

  <Accordion title="Apakah grup/thread berbagi konteks dengan DM?">
    Chat langsung secara default digabungkan ke sesi utama. Grup/channel memiliki session key sendiri, dan topik Telegram / thread Discord adalah sesi terpisah. Lihat [Groups](/id/channels/groups) dan [Group messages](/id/channels/group-messages).
  </Accordion>

  <Accordion title="Berapa banyak workspace dan agent yang bisa saya buat?">
    Tidak ada batas keras. Puluhan (bahkan ratusan) tidak masalah, tetapi perhatikan:

    - **Pertumbuhan disk:** sesi + transkrip disimpan di `~/.openclaw/agents/<agentId>/sessions/`.
    - **Biaya token:** lebih banyak agent berarti lebih banyak penggunaan model bersamaan.
    - **Beban operasional:** profil auth, workspace, dan routing channel per-agent.

    Tips:

    - Pertahankan satu workspace **aktif** per agent (`agents.defaults.workspace`).
    - Pangkas sesi lama (hapus JSONL atau entri store) jika disk membesar.
    - Gunakan `openclaw doctor` untuk menemukan workspace tersasar dan ketidakcocokan profil.

  </Accordion>

  <Accordion title="Bisakah saya menjalankan beberapa bot atau chat sekaligus (Slack), dan bagaimana sebaiknya saya menyiapkannya?">
    Ya. Gunakan **Multi-Agent Routing** untuk menjalankan beberapa agent terisolasi dan merutekan pesan masuk berdasarkan
    channel/akun/peer. Slack didukung sebagai channel dan dapat diikat ke agent tertentu.

    Akses browser kuat tetapi bukan "melakukan apa pun yang bisa dilakukan manusia" - anti-bot, CAPTCHA, dan MFA masih
    dapat memblokir otomasi. Untuk kontrol browser yang paling andal, gunakan Chrome MCP lokal di host,
    atau gunakan CDP di mesin yang benar-benar menjalankan browser.

    Penyiapan praktik terbaik:

    - Gateway host yang selalu aktif (VPS/Mac mini).
    - Satu agent per peran (bindings).
    - Channel Slack terikat ke agent tersebut.
    - Browser lokal via Chrome MCP atau node saat diperlukan.

    Dokumen: [Multi-Agent Routing](/id/concepts/multi-agent), [Slack](/id/channels/slack),
    [Browser](/id/tools/browser), [Nodes](/id/nodes).

  </Accordion>
</AccordionGroup>

## Models: default, seleksi, alias, peralihan

<AccordionGroup>
  <Accordion title='Apa itu "default model"?'>
    Default model OpenClaw adalah apa pun yang Anda setel sebagai:

    ```
    agents.defaults.model.primary
    ```

    Model dirujuk sebagai `provider/model` (contoh: `openai/gpt-5.4`). Jika Anda menghilangkan provider, OpenClaw pertama-tama mencoba alias, lalu kecocokan configured-provider unik untuk model id yang persis sama, dan baru setelah itu kembali ke configured default provider sebagai jalur kompatibilitas lama yang deprecated. Jika provider itu tidak lagi mengekspos default model yang dikonfigurasi, OpenClaw akan fallback ke provider/model pertama yang dikonfigurasi alih-alih menampilkan default removed-provider yang basi. Anda tetap harus **secara eksplisit** menyetel `provider/model`.

  </Accordion>

  <Accordion title="Model apa yang Anda rekomendasikan?">
    **Default yang direkomendasikan:** gunakan model generasi terbaru terkuat yang tersedia di stack provider Anda.
    **Untuk agent yang diaktifkan tool atau menerima input tak tepercaya:** utamakan kekuatan model daripada biaya.
    **Untuk chat rutin/berisiko rendah:** gunakan model fallback yang lebih murah dan rute berdasarkan peran agent.

    MiniMax memiliki dokumentasi sendiri: [MiniMax](/id/providers/minimax) dan
    [Local models](/id/gateway/local-models).

    Aturan praktis: gunakan **model terbaik yang mampu Anda bayar** untuk pekerjaan berisiko tinggi, dan model yang lebih murah
    untuk chat rutin atau ringkasan. Anda dapat merutekan model per agent dan menggunakan sub-agent untuk
    memparalelkan tugas panjang (setiap sub-agent mengonsumsi token). Lihat [Models](/id/concepts/models) dan
    [Sub-agents](/id/tools/subagents).

    Peringatan keras: model yang lebih lemah/terlalu terkuantisasi lebih rentan terhadap prompt
    injection dan perilaku yang tidak aman. Lihat [Security](/id/gateway/security).

    Konteks lebih lanjut: [Models](/id/concepts/models).

  </Accordion>

  <Accordion title="Bagaimana cara mengganti model tanpa menghapus config saya?">
    Gunakan **perintah model** atau edit hanya field **model**. Hindari penggantian config penuh.

    Opsi aman:

    - `/model` di chat (cepat, per sesi)
    - `openclaw models set ...` (hanya memperbarui config model)
    - `openclaw configure --section model` (interaktif)
    - edit `agents.defaults.model` di `~/.openclaw/openclaw.json`

    Hindari `config.apply` dengan objek parsial kecuali Anda memang berniat mengganti seluruh config.
    Untuk edit RPC, periksa dengan `config.schema.lookup` terlebih dahulu dan lebih utamakan `config.patch`. Payload lookup memberi Anda normalized path, dokumen/kendala schema dangkal, dan ringkasan child langsung.
    untuk pembaruan parsial.
    Jika Anda terlanjur menimpa config, pulihkan dari cadangan atau jalankan ulang `openclaw doctor` untuk memperbaikinya.

    Dokumen: [Models](/id/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/id/gateway/doctor).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan model self-hosted (llama.cpp, vLLM, Ollama)?">
    Ya. Ollama adalah jalur termudah untuk model lokal.

    Penyiapan tercepat:

    1. Instal Ollama dari `https://ollama.com/download`
    2. Tarik model lokal seperti `ollama pull glm-4.7-flash`
    3. Jika Anda juga ingin model cloud, jalankan `ollama signin`
    4. Jalankan `openclaw onboard` dan pilih `Ollama`
    5. Pilih `Local` atau `Cloud + Local`

    Catatan:

    - `Cloud + Local` memberi Anda model cloud plus model Ollama lokal Anda
    - model cloud seperti `kimi-k2.5:cloud` tidak memerlukan local pull
    - untuk peralihan manual, gunakan `openclaw models list` dan `openclaw models set ollama/<model>`

    Catatan keamanan: model yang lebih kecil atau sangat terkuantisasi lebih rentan terhadap prompt
    injection. Kami sangat merekomendasikan **model besar** untuk bot apa pun yang dapat menggunakan tool.
    Jika Anda tetap ingin model kecil, aktifkan sandboxing dan allowlist tool yang ketat.

    Dokumen: [Ollama](/id/providers/ollama), [Local models](/id/gateway/local-models),
    [Model providers](/id/concepts/model-providers), [Security](/id/gateway/security),
    [Sandboxing](/id/gateway/sandboxing).

  </Accordion>

  <Accordion title="Model apa yang digunakan OpenClaw, Flawd, dan Krill?">
    - Deployment ini bisa berbeda dan dapat berubah seiring waktu; tidak ada rekomendasi provider yang tetap.
    - Periksa pengaturan runtime saat ini di tiap gateway dengan `openclaw models status`.
    - Untuk agent yang sensitif keamanan/diaktifkan tool, gunakan model generasi terbaru terkuat yang tersedia.
  </Accordion>

  <Accordion title="Bagaimana cara mengganti model secara langsung (tanpa restart)?">
    Gunakan perintah `/model` sebagai pesan mandiri:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Ini adalah alias bawaan. Alias kustom dapat ditambahkan melalui `agents.defaults.models`.

    Anda dapat menampilkan daftar model yang tersedia dengan `/model`, `/model list`, atau `/model status`.

    `/model` (dan `/model list`) menampilkan pemilih ringkas bernomor. Pilih berdasarkan nomor:

    ```
    /model 3
    ```

    Anda juga dapat memaksa profil auth tertentu untuk provider tersebut (per sesi):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Tip: `/model status` menampilkan agent mana yang aktif, file `auth-profiles.json` mana yang sedang digunakan, dan profil auth mana yang akan dicoba berikutnya.
    Ia juga menampilkan endpoint provider yang dikonfigurasi (`baseUrl`) dan mode API (`api`) saat tersedia.

    **Bagaimana cara melepas pin profil yang saya setel dengan @profile?**

    Jalankan ulang `/model` **tanpa** akhiran `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Jika Anda ingin kembali ke default, pilih dari `/model` (atau kirim `/model <default provider/model>`).
    Gunakan `/model status` untuk mengonfirmasi profil auth mana yang aktif.

  </Accordion>

  <Accordion title="Bisakah saya menggunakan GPT 5.2 untuk tugas sehari-hari dan Codex 5.3 untuk coding?">
    Ya. Tetapkan satu sebagai default dan ganti sesuai kebutuhan:

    - **Peralihan cepat (per sesi):** `/model gpt-5.4` untuk tugas harian, `/model openai-codex/gpt-5.4` untuk coding dengan Codex OAuth.
    - **Default + peralihan:** setel `agents.defaults.model.primary` ke `openai/gpt-5.4`, lalu ganti ke `openai-codex/gpt-5.4` saat coding (atau sebaliknya).
    - **Sub-agents:** rute tugas coding ke sub-agent dengan model default yang berbeda.

    Lihat [Models](/id/concepts/models) dan [Slash commands](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bagaimana cara mengonfigurasi fast mode untuk GPT 5.4?">
    Gunakan toggle sesi atau default config:

    - **Per sesi:** kirim `/fast on` saat sesi menggunakan `openai/gpt-5.4` atau `openai-codex/gpt-5.4`.
    - **Default per model:** setel `agents.defaults.models["openai/gpt-5.4"].params.fastMode` ke `true`.
    - **Codex OAuth juga:** jika Anda juga menggunakan `openai-codex/gpt-5.4`, setel flag yang sama di sana.

    Contoh:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Untuk OpenAI, fast mode dipetakan ke `service_tier = "priority"` pada permintaan native Responses yang didukung. Override sesi `/fast` mengalahkan default config.

    Lihat [Thinking and fast mode](/id/tools/thinking) dan [OpenAI fast mode](/id/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Mengapa saya melihat "Model ... is not allowed" lalu tidak ada balasan?'>
    Jika `agents.defaults.models` disetel, itu menjadi **allowlist** untuk `/model` dan semua
    override sesi. Memilih model yang tidak ada dalam daftar itu akan menghasilkan:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Error itu dikembalikan **sebagai pengganti** balasan normal. Perbaikan: tambahkan model itu ke
    `agents.defaults.models`, hapus allowlist, atau pilih model dari `/model list`.

  </Accordion>

  <Accordion title='Mengapa saya melihat "Unknown model: minimax/MiniMax-M2.7"?'>
    Ini berarti **provider belum dikonfigurasi** (tidak ditemukan config provider MiniMax atau profil
    auth), sehingga model tidak dapat di-resolve.

    Checklist perbaikan:

    1. Tingkatkan ke rilis OpenClaw terbaru (atau jalankan dari source `main`), lalu restart gateway.
    2. Pastikan MiniMax sudah dikonfigurasi (wizard atau JSON), atau auth MiniMax
       ada di env/profil auth sehingga provider yang cocok dapat diinjeksi
       (`MINIMAX_API_KEY` untuk `minimax`, `MINIMAX_OAUTH_TOKEN` atau MiniMax
       OAuth tersimpan untuk `minimax-portal`).
    3. Gunakan model id yang tepat (peka huruf besar-kecil) untuk jalur auth Anda:
       `minimax/MiniMax-M2.7` atau `minimax/MiniMax-M2.7-highspeed` untuk penyiapan
       API-key, atau `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` untuk penyiapan OAuth.
    4. Jalankan:

       ```bash
       openclaw models list
       ```

       lalu pilih dari daftar (atau `/model list` di chat).

    Lihat [MiniMax](/id/providers/minimax) dan [Models](/id/concepts/models).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan MiniMax sebagai default dan OpenAI untuk tugas kompleks?">
    Ya. Gunakan **MiniMax sebagai default** dan ganti model **per sesi** saat diperlukan.
    Fallback adalah untuk **error**, bukan "tugas sulit", jadi gunakan `/model` atau agent terpisah.

    **Opsi A: ganti per sesi**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Lalu:

    ```
    /model gpt
    ```

    **Opsi B: agent terpisah**

    - Default Agent A: MiniMax
    - Default Agent B: OpenAI
    - Rute berdasarkan agent atau gunakan `/agent` untuk berpindah

    Dokumen: [Models](/id/concepts/models), [Multi-Agent Routing](/id/concepts/multi-agent), [MiniMax](/id/providers/minimax), [OpenAI](/id/providers/openai).

  </Accordion>

  <Accordion title="Apakah opus / sonnet / gpt adalah shortcut bawaan?">
    Ya. OpenClaw menyediakan beberapa shorthand default (hanya diterapkan saat model ada di `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Jika Anda menetapkan alias sendiri dengan nama yang sama, nilai Anda yang menang.

  </Accordion>

  <Accordion title="Bagaimana cara mendefinisikan/mengoverride shortcut model (alias)?">
    Alias berasal dari `agents.defaults.models.<modelId>.alias`. Contoh:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Lalu `/model sonnet` (atau `/<alias>` bila didukung) akan di-resolve ke model ID tersebut.

  </Accordion>

  <Accordion title="Bagaimana cara menambahkan model dari provider lain seperti OpenRouter atau Z.AI?">
    OpenRouter (bayar per token; banyak model):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (model GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Jika Anda merujuk provider/model tetapi key provider yang diperlukan hilang, Anda akan mendapat runtime auth error (mis. `No API key found for provider "zai"`).

    **No API key found for provider setelah menambahkan agent baru**

    Ini biasanya berarti **agent baru** memiliki auth store kosong. Auth bersifat per-agent dan
    disimpan di:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opsi perbaikan:

    - Jalankan `openclaw agents add <id>` dan konfigurasi auth saat wizard.
    - Atau salin `auth-profiles.json` dari `agentDir` agent utama ke `agentDir` agent baru.

    **Jangan** gunakan kembali `agentDir` di antara agent; itu menyebabkan bentrokan auth/sesi.

  </Accordion>
</AccordionGroup>

## Failover model dan "All models failed"

<AccordionGroup>
  <Accordion title="Bagaimana cara kerja failover?">
    Failover terjadi dalam dua tahap:

    1. **Rotasi profil auth** di dalam provider yang sama.
    2. **Model fallback** ke model berikutnya dalam `agents.defaults.model.fallbacks`.

    Cooldown diterapkan pada profil yang gagal (exponential backoff), sehingga OpenClaw dapat tetap membalas bahkan saat sebuah provider terkena rate limit atau sementara gagal.

    Bucket rate-limit mencakup lebih dari sekadar respons `429`. OpenClaw
    juga memperlakukan pesan seperti `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`, dan limit
    jendela penggunaan berkala (`weekly/monthly limit reached`) sebagai
    kondisi yang layak failover.

    Beberapa respons yang tampak seperti penagihan bukan `402`, dan beberapa respons HTTP `402`
    juga tetap berada dalam bucket transient itu. Jika provider mengembalikan
    teks penagihan eksplisit pada `401` atau `403`, OpenClaw masih dapat menyimpannya di
    jalur penagihan, tetapi pencocok teks khusus provider tetap dibatasi pada
    provider yang memilikinya (misalnya OpenRouter `Key limit exceeded`). Jika sebuah pesan `402`
    justru tampak seperti jendela penggunaan yang bisa dicoba ulang atau
    batas pengeluaran organisasi/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw memperlakukannya sebagai
    `rate_limit`, bukan penonaktifan penagihan jangka panjang.

    Error context-overflow berbeda: signature seperti
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, atau `ollama error: context length
    exceeded` tetap berada di jalur compaction/retry alih-alih memajukan model
    fallback.

    Teks server-error generik sengaja dibuat lebih sempit daripada "apa pun yang mengandung
    unknown/error". OpenClaw memang memperlakukan bentuk transient yang dibatasi provider
    seperti Anthropic bare `An unknown error occurred`, OpenRouter bare
    `Provider returned error`, stop-reason error seperti `Unhandled stop reason:
    error`, payload JSON `api_error` dengan teks server transient
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`), dan error provider-busy seperti `ModelNotReadyException` sebagai
    sinyal timeout/overloaded yang layak failover saat konteks providernya
    cocok.
    Teks fallback internal generik seperti `LLM request failed with an unknown
    error.` tetap konservatif dan tidak memicu model fallback dengan sendirinya.

  </Accordion>

  <Accordion title='Apa arti "No credentials found for profile anthropic:default"?'>
    Itu berarti sistem mencoba menggunakan ID profil auth `anthropic:default`, tetapi tidak dapat menemukan kredensial untuknya di auth store yang diharapkan.

    **Checklist perbaikan:**

    - **Konfirmasi lokasi profil auth** (jalur baru vs lama)
      - Saat ini: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Lama: `~/.openclaw/agent/*` (dimigrasikan oleh `openclaw doctor`)
    - **Konfirmasi env var Anda dimuat oleh Gateway**
      - Jika Anda menyetel `ANTHROPIC_API_KEY` di shell tetapi menjalankan Gateway via systemd/launchd, mungkin ia tidak mewarisinya. Letakkan di `~/.openclaw/.env` atau aktifkan `env.shellEnv`.
    - **Pastikan Anda sedang mengedit agent yang benar**
      - Penyiapan multi-agent berarti bisa ada beberapa file `auth-profiles.json`.
    - **Periksa kewarasan status model/auth**
      - Gunakan `openclaw models status` untuk melihat model yang dikonfigurasi dan apakah provider sudah terautentikasi.

    **Checklist perbaikan untuk "No credentials found for profile anthropic"**

    Ini berarti eksekusi dipin ke profil auth Anthropic, tetapi Gateway
    tidak bisa menemukannya di auth store.

    - **Gunakan Claude CLI**
      - Jalankan `openclaw models auth login --provider anthropic --method cli --set-default` di gateway host.
    - **Jika Anda ingin menggunakan API key sebagai gantinya**
      - Letakkan `ANTHROPIC_API_KEY` di `~/.openclaw/.env` pada **gateway host**.
      - Bersihkan urutan pin yang memaksa profil yang hilang:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Pastikan Anda menjalankan perintah di gateway host**
      - Dalam mode remote, profil auth berada di mesin gateway, bukan laptop Anda.

  </Accordion>

  <Accordion title="Mengapa ia juga mencoba Google Gemini lalu gagal?">
    Jika config model Anda menyertakan Google Gemini sebagai fallback (atau Anda beralih ke shorthand Gemini), OpenClaw akan mencobanya saat model fallback. Jika Anda belum mengonfigurasi kredensial Google, Anda akan melihat `No API key found for provider "google"`.

    Perbaikan: sediakan auth Google, atau hapus/hindari model Google di `agents.defaults.model.fallbacks` / alias agar fallback tidak diarahkan ke sana.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Penyebab: riwayat sesi berisi **thinking blocks tanpa signature** (sering berasal dari
    stream yang dibatalkan/parsial). Google Antigravity memerlukan signature untuk thinking block.

    Perbaikan: OpenClaw sekarang menghapus thinking block tanpa tanda tangan untuk Google Antigravity Claude. Jika masih muncul, mulai **sesi baru** atau setel `/thinking off` untuk agent tersebut.

  </Accordion>
</AccordionGroup>

## Profil auth: apa itu dan bagaimana mengelolanya

Terkait: [/concepts/oauth](/id/concepts/oauth) (alur OAuth, penyimpanan token, pola multi-akun)

<AccordionGroup>
  <Accordion title="Apa itu profil auth?">
    Profil auth adalah catatan kredensial bernama (OAuth atau API key) yang terikat ke provider. Profil berada di:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Apa ID profil yang umum?">
    OpenClaw menggunakan ID berprefiks provider seperti:

    - `anthropic:default` (umum saat tidak ada identitas email)
    - `anthropic:<email>` untuk identitas OAuth
    - ID kustom yang Anda pilih (mis. `anthropic:work`)

  </Accordion>

  <Accordion title="Bisakah saya mengendalikan profil auth mana yang dicoba lebih dulu?">
    Ya. Config mendukung metadata opsional untuk profil dan pengurutan per provider (`auth.order.<provider>`). Ini **tidak** menyimpan secret; ini memetakan ID ke provider/mode dan menetapkan urutan rotasi.

    OpenClaw dapat melewati sementara sebuah profil jika sedang dalam **cooldown** singkat (rate limit/timeout/auth failure) atau status **disabled** yang lebih lama (penagihan/kredit tidak cukup). Untuk memeriksanya, jalankan `openclaw models status --json` dan lihat `auth.unusableProfiles`. Penyetelan: `auth.cooldowns.billingBackoffHours*`.

    Cooldown rate-limit bisa dibatasi per model. Profil yang sedang cooldown
    untuk satu model masih bisa digunakan untuk model saudara pada provider yang sama,
    sedangkan jendela billing/disabled tetap memblokir seluruh profil.

    Anda juga dapat menetapkan override urutan **per-agent** (disimpan di `auth-state.json` agent itu) via CLI:

    ```bash
    # Default ke agent default yang dikonfigurasi (hilangkan --agent)
    openclaw models auth order get --provider anthropic

    # Kunci rotasi ke satu profil (hanya coba yang ini)
    openclaw models auth order set --provider anthropic anthropic:default

    # Atau tetapkan urutan eksplisit (fallback di dalam provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Hapus override (kembali ke config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Untuk menargetkan agent tertentu:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Untuk memverifikasi apa yang benar-benar akan dicoba, gunakan:

    ```bash
    openclaw models status --probe
    ```

    Jika profil tersimpan dihilangkan dari urutan eksplisit, probe melaporkan
    `excluded_by_auth_order` untuk profil itu alih-alih mencobanya diam-diam.

  </Accordion>

  <Accordion title="OAuth vs API key - apa bedanya?">
    OpenClaw mendukung keduanya:

    - **OAuth** sering memanfaatkan akses langganan (jika berlaku).
    - **API keys** menggunakan penagihan bayar per token.

    Wizard secara eksplisit mendukung Anthropic Claude CLI, OpenAI Codex OAuth, dan API key.

  </Accordion>
</AccordionGroup>

## Gateway: port, "already running", dan mode remote

<AccordionGroup>
  <Accordion title="Port apa yang digunakan Gateway?">
    `gateway.port` mengendalikan satu port multiplexed untuk WebSocket + HTTP (Control UI, hooks, dll.).

    Prioritas:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Mengapa openclaw gateway status mengatakan "Runtime: running" tetapi "RPC probe: failed"?'>
    Karena "running" adalah tampilan **supervisor** (launchd/systemd/schtasks). RPC probe adalah CLI yang benar-benar terhubung ke gateway WebSocket dan memanggil `status`.

    Gunakan `openclaw gateway status` dan percayai baris berikut:

    - `Probe target:` (URL yang benar-benar digunakan probe)
    - `Listening:` (apa yang benar-benar bound pada port)
    - `Last gateway error:` (akar masalah umum saat proses hidup tetapi port tidak mendengarkan)

  </Accordion>

  <Accordion title='Mengapa openclaw gateway status menampilkan "Config (cli)" dan "Config (service)" berbeda?'>
    Anda mengedit satu file config sementara layanan menjalankan file lain (sering kali karena ketidakcocokan `--profile` / `OPENCLAW_STATE_DIR`).

    Perbaikan:

    ```bash
    openclaw gateway install --force
    ```

    Jalankan itu dari `--profile` / environment yang sama yang Anda ingin layanan gunakan.

  </Accordion>

  <Accordion title='Apa arti "another gateway instance is already listening"?'>
    OpenClaw menerapkan runtime