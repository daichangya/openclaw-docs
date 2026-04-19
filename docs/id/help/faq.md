---
read_when:
    - Menjawab pertanyaan umum tentang penyiapan, instalasi, onboarding, atau dukungan runtime
    - Menilai masalah yang dilaporkan pengguna sebelum debug yang lebih mendalam
summary: Pertanyaan yang sering diajukan tentang penyiapan, konfigurasi, dan penggunaan OpenClaw
title: Pertanyaan umum
x-i18n:
    generated_at: "2026-04-19T09:06:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: f569fb0412797314a11c41a1bbfa14f5892d2d368544fa67800823a6457000e6
    source_path: help/faq.md
    workflow: 15
---

# Pertanyaan umum

Jawaban cepat plus pemecahan masalah yang lebih mendalam untuk penyiapan dunia nyata (dev lokal, VPS, multi-agent, kunci OAuth/API, failover model). Untuk diagnostik runtime, lihat [Troubleshooting](/id/gateway/troubleshooting). Untuk referensi konfigurasi lengkap, lihat [Configuration](/id/gateway/configuration).

## 60 detik pertama jika ada yang rusak

1. **Status cepat (pemeriksaan pertama)**

   ```bash
   openclaw status
   ```

   Ringkasan lokal cepat: OS + pembaruan, keterjangkauan gateway/service, agents/sessions, konfigurasi provider + masalah runtime (saat gateway dapat dijangkau).

2. **Laporan yang bisa ditempel (aman untuk dibagikan)**

   ```bash
   openclaw status --all
   ```

   Diagnosis baca-saja dengan ekor log (token disamarkan).

3. **Status daemon + port**

   ```bash
   openclaw gateway status
   ```

   Menampilkan runtime supervisor vs keterjangkauan RPC, URL target probe, dan konfigurasi mana yang kemungkinan digunakan service.

4. **Probe mendalam**

   ```bash
   openclaw status --deep
   ```

   Menjalankan probe kesehatan gateway langsung, termasuk probe channel saat didukung
   (memerlukan gateway yang dapat dijangkau). Lihat [Health](/id/gateway/health).

5. **Ikuti log terbaru**

   ```bash
   openclaw logs --follow
   ```

   Jika RPC tidak aktif, gunakan cadangan ini:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Log file terpisah dari log service; lihat [Logging](/id/logging) dan [Troubleshooting](/id/gateway/troubleshooting).

6. **Jalankan doctor (perbaikan)**

   ```bash
   openclaw doctor
   ```

   Memperbaiki/memigrasikan konfigurasi/status + menjalankan pemeriksaan kesehatan. Lihat [Doctor](/id/gateway/doctor).

7. **Snapshot Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # menampilkan URL target + jalur config saat terjadi error
   ```

   Meminta snapshot lengkap dari gateway yang sedang berjalan (khusus WS). Lihat [Health](/id/gateway/health).

## Mulai cepat dan penyiapan pertama kali

<AccordionGroup>
  <Accordion title="Saya terjebak, cara tercepat untuk keluar dari kebuntuan">
    Gunakan agent AI lokal yang dapat **melihat mesin Anda**. Itu jauh lebih efektif daripada bertanya
    di Discord, karena sebagian besar kasus "saya terjebak" adalah **masalah konfigurasi atau lingkungan lokal** yang
    tidak dapat diperiksa oleh penolong jarak jauh.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Alat-alat ini dapat membaca repo, menjalankan perintah, memeriksa log, dan membantu memperbaiki penyiapan
    di tingkat mesin Anda (PATH, services, permissions, file auth). Berikan kepada mereka **checkout source lengkap** melalui
    instalasi yang dapat diutak-atik (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Ini menginstal OpenClaw **dari checkout git**, sehingga agent dapat membaca kode + docs dan
    menalar versi persis yang sedang Anda jalankan. Anda selalu dapat beralih kembali ke stable nanti
    dengan menjalankan ulang installer tanpa `--install-method git`.

    Tip: minta agent untuk **merencanakan dan mengawasi** perbaikannya (langkah demi langkah), lalu jalankan hanya
    perintah yang diperlukan. Itu membuat perubahan tetap kecil dan lebih mudah diaudit.

    Jika Anda menemukan bug atau perbaikan nyata, silakan buat issue GitHub atau kirim PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Mulailah dengan perintah-perintah ini (bagikan output-nya saat meminta bantuan):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Fungsinya:

    - `openclaw status`: snapshot cepat kesehatan gateway/agent + konfigurasi dasar.
    - `openclaw models status`: memeriksa auth provider + ketersediaan model.
    - `openclaw doctor`: memvalidasi dan memperbaiki masalah umum konfigurasi/status.

    Pemeriksaan CLI lain yang berguna: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Siklus debug cepat: [60 detik pertama jika ada yang rusak](#60-detik-pertama-jika-ada-yang-rusak).
    Dokumen instalasi: [Install](/id/install), [Installer flags](/id/install/installer), [Updating](/id/install/updating).

  </Accordion>

  <Accordion title="Heartbeat terus melewati. Apa arti alasan skip itu?">
    Alasan skip Heartbeat yang umum:

    - `quiet-hours`: di luar jendela active-hours yang dikonfigurasi
    - `empty-heartbeat-file`: `HEARTBEAT.md` ada tetapi hanya berisi kerangka kosong/header saja
    - `no-tasks-due`: mode tugas `HEARTBEAT.md` aktif tetapi belum ada interval tugas yang jatuh tempo
    - `alerts-disabled`: semua visibilitas heartbeat dinonaktifkan (`showOk`, `showAlerts`, dan `useIndicator` semuanya nonaktif)

    Dalam mode tugas, cap waktu jatuh tempo hanya dimajukan setelah Heartbeat yang nyata
    selesai dijalankan. Proses yang dilewati tidak menandai tugas sebagai selesai.

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
    pnpm ui:build
    openclaw onboard
    ```

    Jika Anda belum memiliki instalasi global, jalankan melalui `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Bagaimana cara membuka dashboard setelah onboarding?">
    Wizard membuka browser Anda dengan URL dashboard yang bersih (tanpa token) tepat setelah onboarding dan juga mencetak tautan di ringkasan. Biarkan tab itu tetap terbuka; jika tidak diluncurkan, salin/tempel URL yang dicetak pada mesin yang sama.
  </Accordion>

  <Accordion title="Bagaimana cara mengautentikasi dashboard di localhost vs remote?">
    **Localhost (mesin yang sama):**

    - Buka `http://127.0.0.1:18789/`.
    - Jika meminta auth shared-secret, tempel token atau kata sandi yang dikonfigurasi ke pengaturan Control UI.
    - Sumber token: `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`).
    - Sumber kata sandi: `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`).
    - Jika belum ada shared secret yang dikonfigurasi, buat token dengan `openclaw doctor --generate-gateway-token`.

    **Bukan di localhost:**

    - **Tailscale Serve** (direkomendasikan): tetap gunakan bind loopback, jalankan `openclaw gateway --tailscale serve`, buka `https://<magicdns>/`. Jika `gateway.auth.allowTailscale` bernilai `true`, header identitas memenuhi auth Control UI/WebSocket (tanpa menempel shared secret, mengasumsikan host gateway tepercaya); HTTP API tetap memerlukan auth shared-secret kecuali Anda sengaja menggunakan private-ingress `none` atau auth HTTP trusted-proxy.
      Upaya auth Serve bersamaan yang buruk dari klien yang sama diserialkan sebelum pembatas failed-auth mencatatnya, sehingga percobaan buruk kedua sudah bisa menampilkan `retry later`.
    - **Bind tailnet**: jalankan `openclaw gateway --bind tailnet --token "<token>"` (atau konfigurasi auth kata sandi), buka `http://<tailscale-ip>:18789/`, lalu tempel shared secret yang sesuai di pengaturan dashboard.
    - **Reverse proxy yang sadar identitas**: biarkan Gateway berada di belakang trusted proxy non-loopback, konfigurasikan `gateway.auth.mode: "trusted-proxy"`, lalu buka URL proxy tersebut.
    - **Tunnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` lalu buka `http://127.0.0.1:18789/`. Auth shared-secret tetap berlaku melalui tunnel; tempel token atau kata sandi yang dikonfigurasi jika diminta.

    Lihat [Dashboard](/web/dashboard) dan [Web surfaces](/web) untuk detail mode bind dan auth.

  </Accordion>

  <Accordion title="Mengapa ada dua konfigurasi persetujuan exec untuk persetujuan chat?">
    Keduanya mengendalikan lapisan yang berbeda:

    - `approvals.exec`: meneruskan prompt persetujuan ke tujuan chat
    - `channels.<channel>.execApprovals`: membuat channel itu bertindak sebagai klien persetujuan native untuk persetujuan exec

    Kebijakan exec host tetap menjadi gerbang persetujuan yang sebenarnya. Konfigurasi chat hanya mengendalikan di mana prompt persetujuan
    muncul dan bagaimana orang dapat menjawabnya.

    Dalam sebagian besar penyiapan, Anda **tidak** memerlukan keduanya:

    - Jika chat sudah mendukung perintah dan balasan, `/approve` di chat yang sama berfungsi melalui jalur bersama.
    - Jika channel native yang didukung dapat menyimpulkan approver dengan aman, OpenClaw sekarang mengaktifkan persetujuan native DM-first secara otomatis saat `channels.<channel>.execApprovals.enabled` tidak disetel atau `"auto"`.
    - Saat kartu/tombol persetujuan native tersedia, UI native itu adalah jalur utama; agent hanya boleh menyertakan perintah `/approve` manual jika hasil alat mengatakan persetujuan chat tidak tersedia atau persetujuan manual adalah satu-satunya jalur.
    - Gunakan `approvals.exec` hanya jika prompt juga harus diteruskan ke chat lain atau ruang ops eksplisit.
    - Gunakan `channels.<channel>.execApprovals.target: "channel"` atau `"both"` hanya saat Anda secara eksplisit ingin prompt persetujuan diposting kembali ke room/topic asal.
    - Persetujuan Plugin terpisah lagi: secara default mereka menggunakan `/approve` di chat yang sama, penerusan `approvals.plugin` opsional, dan hanya beberapa channel native yang tetap menambahkan penanganan native persetujuan Plugin di atasnya.

    Versi singkatnya: penerusan adalah untuk routing, konfigurasi klien native adalah untuk UX khusus channel yang lebih kaya.
    Lihat [Exec Approvals](/id/tools/exec-approvals).

  </Accordion>

  <Accordion title="Runtime apa yang saya perlukan?">
    Node **>= 22** diperlukan. `pnpm` direkomendasikan. Bun **tidak direkomendasikan** untuk Gateway.
  </Accordion>

  <Accordion title="Apakah ini berjalan di Raspberry Pi?">
    Ya. Gateway ringan - dokumen menyebutkan **512MB-1GB RAM**, **1 core**, dan sekitar **500MB**
    disk sudah cukup untuk penggunaan pribadi, dan mencatat bahwa **Raspberry Pi 4 dapat menjalankannya**.

    Jika Anda menginginkan ruang lebih (log, media, service lain), **2GB direkomendasikan**, tetapi itu
    bukan minimum yang keras.

    Tip: Pi/VPS kecil dapat meng-host Gateway, dan Anda dapat memasangkan **Node** di laptop/ponsel Anda untuk
    screen/camera/canvas lokal atau eksekusi perintah. Lihat [Nodes](/id/nodes).

  </Accordion>

  <Accordion title="Ada tips untuk instalasi Raspberry Pi?">
    Versi singkat: ini berfungsi, tetapi bersiaplah menghadapi beberapa sisi kasar.

    - Gunakan OS **64-bit** dan tetap gunakan Node >= 22.
    - Pilih instalasi **hackable (git)** agar Anda dapat melihat log dan memperbarui dengan cepat.
    - Mulai tanpa channels/Skills, lalu tambahkan satu per satu.
    - Jika Anda menemui masalah biner yang aneh, biasanya itu adalah masalah **kompatibilitas ARM**.

    Dokumen: [Linux](/id/platforms/linux), [Install](/id/install).

  </Accordion>

  <Accordion title="Ini macet di wake up my friend / onboarding tidak mau hatch. Sekarang bagaimana?">
    Layar itu bergantung pada Gateway yang dapat dijangkau dan diautentikasi. TUI juga mengirim
    "Wake up, my friend!" secara otomatis pada hatch pertama. Jika Anda melihat baris itu dengan **tanpa balasan**
    dan token tetap 0, agent tidak pernah berjalan.

    1. Restart Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Periksa status + auth:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Jika masih macet, jalankan:

    ```bash
    openclaw doctor
    ```

    Jika Gateway berada di remote, pastikan koneksi tunnel/Tailscale aktif dan UI
    mengarah ke Gateway yang benar. Lihat [Remote access](/id/gateway/remote).

  </Accordion>

  <Accordion title="Bisakah saya memigrasikan penyiapan saya ke mesin baru (Mac mini) tanpa mengulangi onboarding?">
    Ya. Salin **direktori state** dan **workspace**, lalu jalankan Doctor sekali. Ini
    menjaga bot Anda "tetap sama persis" (memori, riwayat sesi, auth, dan
    status channel) selama Anda menyalin **kedua** lokasi tersebut:

    1. Instal OpenClaw di mesin baru.
    2. Salin `$OPENCLAW_STATE_DIR` (default: `~/.openclaw`) dari mesin lama.
    3. Salin workspace Anda (default: `~/.openclaw/workspace`).
    4. Jalankan `openclaw doctor` dan restart service Gateway.

    Itu mempertahankan config, profil auth, kredensial WhatsApp, sesi, dan memori. Jika Anda berada dalam
    mode remote, ingat bahwa host gateway memiliki session store dan workspace.

    **Penting:** jika Anda hanya commit/push workspace Anda ke GitHub, Anda mencadangkan
    **memori + file bootstrap**, tetapi **bukan** riwayat sesi atau auth. Keduanya berada
    di bawah `~/.openclaw/` (misalnya `~/.openclaw/agents/<agentId>/sessions/`).

    Terkait: [Migrating](/id/install/migrating), [Tempat berbagai hal disimpan di disk](#tempat-berbagai-hal-disimpan-di-disk),
    [Workspace agent](/id/concepts/agent-workspace), [Doctor](/id/gateway/doctor),
    [Mode remote](/id/gateway/remote).

  </Accordion>

  <Accordion title="Di mana saya bisa melihat apa yang baru di versi terbaru?">
    Periksa changelog GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Entri terbaru ada di bagian atas. Jika bagian teratas ditandai **Unreleased**, bagian bertanggal berikutnya
    adalah versi rilis terbaru. Entri dikelompokkan berdasarkan **Highlights**, **Changes**, dan
    **Fixes** (ditambah bagian docs/lainnya bila diperlukan).

  </Accordion>

  <Accordion title="Tidak bisa mengakses docs.openclaw.ai (error SSL)">
    Beberapa koneksi Comcast/Xfinity salah memblokir `docs.openclaw.ai` melalui Xfinity
    Advanced Security. Nonaktifkan fitur itu atau tambahkan `docs.openclaw.ai` ke allowlist, lalu coba lagi.
    Mohon bantu kami membuka blokirnya dengan melapor di sini: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jika Anda masih tidak bisa menjangkau situs tersebut, docs dicerminkan di GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Perbedaan antara stable dan beta">
    **Stable** dan **beta** adalah **npm dist-tag**, bukan jalur kode yang terpisah:

    - `latest` = stable
    - `beta` = build awal untuk pengujian

    Biasanya, rilis stable masuk ke **beta** terlebih dahulu, lalu langkah
    promosi eksplisit memindahkan versi yang sama itu ke `latest`. Maintainer juga dapat
    menerbitkan langsung ke `latest` bila diperlukan. Itulah sebabnya beta dan stable dapat
    menunjuk ke **versi yang sama** setelah promosi.

    Lihat apa yang berubah:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Untuk one-liner instalasi dan perbedaan antara beta dan dev, lihat accordion di bawah.

  </Accordion>

  <Accordion title="Bagaimana cara menginstal versi beta dan apa perbedaan antara beta dan dev?">
    **Beta** adalah npm dist-tag `beta` (dapat sama dengan `latest` setelah promosi).
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

    Ini beralih ke branch `main` dan memperbarui dari source.

    2. **Instalasi hackable (dari situs installer):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Itu memberi Anda repo lokal yang bisa Anda edit, lalu perbarui melalui git.

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

  <Accordion title="Berapa lama instalasi dan onboarding biasanya berlangsung?">
    Panduan kasar:

    - **Instalasi:** 2-5 menit
    - **Onboarding:** 5-15 menit tergantung berapa banyak channels/models yang Anda konfigurasi

    Jika macet, gunakan [Installer stuck](#quick-start-and-first-run-setup)
    dan siklus debug cepat di [Saya terjebak](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer macet? Bagaimana cara mendapatkan umpan balik lebih banyak?">
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

    **1) error npm spawn git / git tidak ditemukan**

    - Instal **Git for Windows** dan pastikan `git` ada di PATH Anda.
    - Tutup dan buka kembali PowerShell, lalu jalankan ulang installer.

    **2) openclaw tidak dikenali setelah instalasi**

    - Folder npm global bin Anda tidak ada di PATH.
    - Periksa path-nya:

      ```powershell
      npm config get prefix
      ```

    - Tambahkan direktori itu ke PATH pengguna Anda (di Windows tidak perlu sufiks `\bin`; pada kebanyakan sistem itu adalah `%AppData%\npm`).
    - Tutup dan buka kembali PowerShell setelah memperbarui PATH.

    Jika Anda menginginkan penyiapan Windows yang paling mulus, gunakan **WSL2** alih-alih Windows native.
    Dokumen: [Windows](/id/platforms/windows).

  </Accordion>

  <Accordion title="Output exec di Windows menampilkan teks Mandarin yang rusak - apa yang harus saya lakukan?">
    Biasanya ini adalah ketidakcocokan code page konsol pada shell Windows native.

    Gejala:

    - Output `system.run`/`exec` merender teks Mandarin sebagai mojibake
    - Perintah yang sama terlihat baik-baik saja di profil terminal lain

    Solusi cepat di PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Lalu restart Gateway dan coba lagi perintah Anda:

    ```powershell
    openclaw gateway restart
    ```

    Jika Anda masih dapat mereproduksi ini di OpenClaw terbaru, lacak/laporkan di:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Docs tidak menjawab pertanyaan saya - bagaimana cara mendapatkan jawaban yang lebih baik?">
    Gunakan **instalasi hackable (git)** agar Anda memiliki source dan docs lengkap secara lokal, lalu tanyakan
    bot Anda (atau Claude/Codex) _dari folder itu_ sehingga ia dapat membaca repo dan menjawab dengan tepat.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Detail lebih lanjut: [Install](/id/install) dan [Installer flags](/id/install/installer).

  </Accordion>

  <Accordion title="Bagaimana cara menginstal OpenClaw di Linux?">
    Jawaban singkat: ikuti panduan Linux, lalu jalankan onboarding.

    - Jalur cepat Linux + instalasi service: [Linux](/id/platforms/linux).
    - Panduan lengkap: [Getting Started](/id/start/getting-started).
    - Installer + pembaruan: [Install & updates](/id/install/updating).

  </Accordion>

  <Accordion title="Bagaimana cara menginstal OpenClaw di VPS?">
    Linux VPS apa pun bisa digunakan. Instal di server, lalu gunakan SSH/Tailscale untuk menjangkau Gateway.

    Panduan: [exe.dev](/id/install/exe-dev), [Hetzner](/id/install/hetzner), [Fly.io](/id/install/fly).
    Akses remote: [Gateway remote](/id/gateway/remote).

  </Accordion>

  <Accordion title="Di mana panduan instalasi cloud/VPS?">
    Kami menyimpan **pusat hosting** dengan provider yang umum. Pilih salah satu dan ikuti panduannya:

    - [VPS hosting](/id/vps) (semua provider di satu tempat)
    - [Fly.io](/id/install/fly)
    - [Hetzner](/id/install/hetzner)
    - [exe.dev](/id/install/exe-dev)

    Cara kerjanya di cloud: **Gateway berjalan di server**, dan Anda mengaksesnya
    dari laptop/ponsel Anda melalui Control UI (atau Tailscale/SSH). State + workspace Anda
    berada di server, jadi perlakukan host sebagai sumber kebenaran dan buat cadangannya.

    Anda dapat memasangkan **Node** (Mac/iOS/Android/headless) ke Gateway cloud tersebut untuk mengakses
    screen/camera/canvas lokal atau menjalankan perintah di laptop Anda sambil tetap menjaga
    Gateway berada di cloud.

    Pusat: [Platforms](/id/platforms). Akses remote: [Gateway remote](/id/gateway/remote).
    Nodes: [Nodes](/id/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Bisakah saya meminta OpenClaw memperbarui dirinya sendiri?">
    Jawaban singkat: **mungkin, tetapi tidak direkomendasikan**. Alur pembaruan dapat me-restart
    Gateway (yang memutus sesi aktif), mungkin memerlukan checkout git yang bersih, dan
    dapat meminta konfirmasi. Lebih aman: jalankan pembaruan dari shell sebagai operator.

    Gunakan CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Jika Anda harus mengotomatiskannya dari agent:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Dokumen: [Update](/cli/update), [Updating](/id/install/updating).

  </Accordion>

  <Accordion title="Apa sebenarnya yang dilakukan onboarding?">
    `openclaw onboard` adalah jalur penyiapan yang direkomendasikan. Dalam **mode lokal** ini memandu Anda melalui:

    - **Penyiapan model/auth** (OAuth provider, kunci API, setup-token Anthropic, plus opsi model lokal seperti LM Studio)
    - Lokasi **workspace** + file bootstrap
    - **Pengaturan Gateway** (bind/port/auth/tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, plus Plugin channel bawaan seperti QQ Bot)
    - **Instalasi daemon** (LaunchAgent di macOS; unit pengguna systemd di Linux/WSL2)
    - **Pemeriksaan kesehatan** dan pemilihan **Skills**

    Ini juga memperingatkan jika model yang Anda konfigurasi tidak dikenal atau auth-nya hilang.

  </Accordion>

  <Accordion title="Apakah saya memerlukan langganan Claude atau OpenAI untuk menjalankan ini?">
    Tidak. Anda dapat menjalankan OpenClaw dengan **kunci API** (Anthropic/OpenAI/lainnya) atau dengan
    **model lokal saja** sehingga data Anda tetap berada di perangkat Anda. Langganan (Claude
    Pro/Max atau OpenAI Codex) adalah cara opsional untuk mengautentikasi provider tersebut.

    Untuk Anthropic di OpenClaw, pembagian praktisnya adalah:

    - **Kunci API Anthropic**: penagihan API Anthropic normal
    - **Claude CLI / auth langganan Claude di OpenClaw**: staf Anthropic
      memberi tahu kami bahwa penggunaan ini diizinkan lagi, dan OpenClaw memperlakukan penggunaan `claude -p`
      sebagai sesuatu yang disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan
      baru

    Untuk host Gateway yang berumur panjang, kunci API Anthropic tetap menjadi
    penyiapan yang lebih dapat diprediksi. OpenAI Codex OAuth secara eksplisit didukung untuk
    alat eksternal seperti OpenClaw.

    OpenClaw juga mendukung opsi lain bergaya langganan yang di-host termasuk
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan**, dan
    **Z.AI / GLM Coding Plan**.

    Dokumen: [Anthropic](/id/providers/anthropic), [OpenAI](/id/providers/openai),
    [Qwen Cloud](/id/providers/qwen),
    [MiniMax](/id/providers/minimax), [GLM Models](/id/providers/glm),
    [Local models](/id/gateway/local-models), [Models](/id/concepts/models).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan langganan Claude Max tanpa kunci API?">
    Ya.

    Staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI gaya OpenClaw diizinkan lagi, jadi
    OpenClaw memperlakukan auth langganan Claude dan penggunaan `claude -p` sebagai sesuatu yang disetujui
    untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru. Jika Anda menginginkan
    penyiapan sisi server yang paling dapat diprediksi, gunakan kunci API Anthropic sebagai gantinya.

  </Accordion>

  <Accordion title="Apakah Anda mendukung auth langganan Claude (Claude Pro atau Max)?">
    Ya.

    Staf Anthropic memberi tahu kami bahwa penggunaan ini diizinkan lagi, jadi OpenClaw memperlakukan
    penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai sesuatu yang disetujui untuk integrasi ini
    kecuali Anthropic menerbitkan kebijakan baru.

    Setup-token Anthropic masih tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw sekarang lebih memilih penggunaan ulang Claude CLI dan `claude -p` bila tersedia.
    Untuk beban kerja produksi atau multi-pengguna, auth kunci API Anthropic tetap menjadi
    pilihan yang lebih aman dan lebih dapat diprediksi. Jika Anda menginginkan opsi host bergaya langganan lainnya
    di OpenClaw, lihat [OpenAI](/id/providers/openai), [Qwen / Model
    Cloud](/id/providers/qwen), [MiniMax](/id/providers/minimax), dan [GLM
    Models](/id/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Mengapa saya melihat HTTP 429 rate_limit_error dari Anthropic?">
Itu berarti **kuota/batas laju Anthropic** Anda habis untuk jendela saat ini. Jika Anda
menggunakan **Claude CLI**, tunggu sampai jendela direset atau tingkatkan paket Anda. Jika Anda
menggunakan **kunci API Anthropic**, periksa Anthropic Console
untuk penggunaan/penagihan dan naikkan batas sesuai kebutuhan.

    Jika pesannya secara spesifik adalah:
    `Extra usage is required for long context requests`, permintaan tersebut mencoba menggunakan
    beta konteks 1M Anthropic (`context1m: true`). Itu hanya berfungsi ketika
    kredensial Anda memenuhi syarat untuk penagihan konteks panjang (penagihan kunci API atau
    jalur login Claude OpenClaw dengan Extra Usage diaktifkan).

    Tip: tetapkan **fallback model** agar OpenClaw dapat tetap membalas saat sebuah provider terkena rate limit.
    Lihat [Models](/cli/models), [OAuth](/id/concepts/oauth), dan
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/id/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Apakah AWS Bedrock didukung?">
    Ya. OpenClaw memiliki provider bawaan **Amazon Bedrock (Converse)**. Dengan penanda env AWS yang ada, OpenClaw dapat menemukan secara otomatis katalog Bedrock streaming/teks dan menggabungkannya sebagai provider implisit `amazon-bedrock`; jika tidak, Anda dapat secara eksplisit mengaktifkan `plugins.entries.amazon-bedrock.config.discovery.enabled` atau menambahkan entri provider manual. Lihat [Amazon Bedrock](/id/providers/bedrock) dan [Model providers](/id/providers/models). Jika Anda lebih memilih alur kunci terkelola, proxy yang kompatibel dengan OpenAI di depan Bedrock tetap merupakan opsi yang valid.
  </Accordion>

  <Accordion title="Bagaimana cara kerja auth Codex?">
    OpenClaw mendukung **OpenAI Code (Codex)** melalui OAuth (login ChatGPT). Onboarding dapat menjalankan alur OAuth dan akan menetapkan model default ke `openai-codex/gpt-5.4` bila sesuai. Lihat [Model providers](/id/concepts/model-providers) dan [Onboarding (CLI)](/id/start/wizard).
  </Accordion>

  <Accordion title="Mengapa ChatGPT GPT-5.4 tidak membuka akses ke openai/gpt-5.4 di OpenClaw?">
    OpenClaw memperlakukan dua jalur itu secara terpisah:

    - `openai-codex/gpt-5.4` = OAuth ChatGPT/Codex
    - `openai/gpt-5.4` = API Platform OpenAI langsung

    Di OpenClaw, login ChatGPT/Codex dihubungkan ke rute `openai-codex/*`,
    bukan rute langsung `openai/*`. Jika Anda menginginkan jalur API langsung di
    OpenClaw, setel `OPENAI_API_KEY` (atau konfigurasi provider OpenAI yang setara).
    Jika Anda menginginkan login ChatGPT/Codex di OpenClaw, gunakan `openai-codex/*`.

  </Accordion>

  <Accordion title="Mengapa batas OAuth Codex bisa berbeda dari web ChatGPT?">
    `openai-codex/*` menggunakan rute OAuth Codex, dan jendela kuota yang dapat digunakan
    dikelola oleh OpenAI dan bergantung pada paket. Dalam praktiknya, batas-batas itu dapat berbeda dari
    pengalaman situs web/aplikasi ChatGPT, bahkan ketika keduanya terikat ke akun yang sama.

    OpenClaw dapat menampilkan jendela penggunaan/kuota provider yang saat ini terlihat di
    `openclaw models status`, tetapi tidak mengada-ada atau menormalkan
    hak akses web ChatGPT menjadi akses API langsung. Jika Anda menginginkan jalur
    penagihan/batas Platform OpenAI langsung, gunakan `openai/*` dengan kunci API.

  </Accordion>

  <Accordion title="Apakah Anda mendukung auth langganan OpenAI (Codex OAuth)?">
    Ya. OpenClaw sepenuhnya mendukung **OAuth langganan OpenAI Code (Codex)**.
    OpenAI secara eksplisit mengizinkan penggunaan OAuth langganan dalam alat/alur kerja eksternal
    seperti OpenClaw. Onboarding dapat menjalankan alur OAuth untuk Anda.

    Lihat [OAuth](/id/concepts/oauth), [Model providers](/id/concepts/model-providers), dan [Onboarding (CLI)](/id/start/wizard).

  </Accordion>

  <Accordion title="Bagaimana cara menyiapkan OAuth Gemini CLI?">
    Gemini CLI menggunakan **alur auth Plugin**, bukan client id atau secret di `openclaw.json`.

    Langkah-langkah:

    1. Instal Gemini CLI secara lokal agar `gemini` ada di `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktifkan Plugin: `openclaw plugins enable google`
    3. Login: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Model default setelah login: `google-gemini-cli/gemini-3-flash-preview`
    5. Jika permintaan gagal, setel `GOOGLE_CLOUD_PROJECT` atau `GOOGLE_CLOUD_PROJECT_ID` pada host gateway

    Ini menyimpan token OAuth dalam profil auth pada host gateway. Detail: [Model providers](/id/concepts/model-providers).

  </Accordion>

  <Accordion title="Apakah model lokal cukup baik untuk chat santai?">
    Biasanya tidak. OpenClaw membutuhkan konteks besar + keamanan yang kuat; kartu kecil akan memotong dan bocor. Jika terpaksa, jalankan build model **terbesar** yang bisa Anda jalankan secara lokal (LM Studio) dan lihat [/gateway/local-models](/id/gateway/local-models). Model yang lebih kecil/terkuantisasi meningkatkan risiko prompt injection - lihat [Security](/id/gateway/security).
  </Accordion>

  <Accordion title="Bagaimana cara menjaga lalu lintas model yang di-host tetap berada di wilayah tertentu?">
    Pilih endpoint yang dikunci ke wilayah tertentu. OpenRouter menyediakan opsi yang di-host di AS untuk MiniMax, Kimi, dan GLM; pilih varian yang di-host di AS agar data tetap berada di wilayah tersebut. Anda tetap dapat mencantumkan Anthropic/OpenAI di samping ini dengan menggunakan `models.mode: "merge"` agar fallback tetap tersedia sambil tetap menghormati provider per wilayah yang Anda pilih.
  </Accordion>

  <Accordion title="Apakah saya harus membeli Mac Mini untuk menginstal ini?">
    Tidak. OpenClaw berjalan di macOS atau Linux (Windows melalui WSL2). Mac mini bersifat opsional - beberapa orang
    membelinya sebagai host yang selalu aktif, tetapi VPS kecil, server rumahan, atau perangkat setara Raspberry Pi juga bisa digunakan.

    Anda hanya memerlukan Mac **untuk alat khusus macOS**. Untuk iMessage, gunakan [BlueBubbles](/id/channels/bluebubbles) (direkomendasikan) - server BlueBubbles berjalan di Mac apa pun, dan Gateway dapat berjalan di Linux atau di tempat lain. Jika Anda menginginkan alat khusus macOS lainnya, jalankan Gateway di Mac atau pasangkan node macOS.

    Dokumen: [BlueBubbles](/id/channels/bluebubbles), [Nodes](/id/nodes), [Mac remote mode](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Apakah saya memerlukan Mac mini untuk dukungan iMessage?">
    Anda memerlukan **perangkat macOS** yang masuk ke Messages. Itu **tidak** harus Mac mini -
    Mac apa pun bisa. **Gunakan [BlueBubbles](/id/channels/bluebubbles)** (direkomendasikan) untuk iMessage - server BlueBubbles berjalan di macOS, sementara Gateway dapat berjalan di Linux atau di tempat lain.

    Penyiapan umum:

    - Jalankan Gateway di Linux/VPS, dan jalankan server BlueBubbles di Mac apa pun yang masuk ke Messages.
    - Jalankan semuanya di Mac jika Anda menginginkan penyiapan satu mesin yang paling sederhana.

    Dokumen: [BlueBubbles](/id/channels/bluebubbles), [Nodes](/id/nodes),
    [Mac remote mode](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jika saya membeli Mac mini untuk menjalankan OpenClaw, bisakah saya menghubungkannya ke MacBook Pro saya?">
    Ya. **Mac mini dapat menjalankan Gateway**, dan MacBook Pro Anda dapat terhubung sebagai
    **Node** (perangkat pendamping). Node tidak menjalankan Gateway - mereka menyediakan
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

    Jika Anda tetap ingin bereksperimen dengan Bun, lakukan itu pada gateway non-produksi
    tanpa WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: apa yang masuk ke allowFrom?">
    `channels.telegram.allowFrom` adalah **ID pengguna Telegram pengirim manusia** (numerik). Itu bukan username bot.

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
    Ya, melalui **routing multi-agent**. Ikat setiap **DM** WhatsApp pengirim (peer `kind: "direct"`, pengirim E.164 seperti `+15551234567`) ke `agentId` yang berbeda, sehingga setiap orang mendapatkan workspace dan session store mereka sendiri. Balasan tetap berasal dari **akun WhatsApp yang sama**, dan kontrol akses DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) bersifat global per akun WhatsApp. Lihat [Multi-Agent Routing](/id/concepts/multi-agent) dan [WhatsApp](/id/channels/whatsapp).
  </Accordion>

  <Accordion title='Bisakah saya menjalankan agent "fast chat" dan agent "Opus for coding"?'>
    Ya. Gunakan routing multi-agent: beri setiap agent model default-nya sendiri, lalu ikat rute masuk (akun provider atau peer tertentu) ke masing-masing agent. Contoh konfigurasi ada di [Multi-Agent Routing](/id/concepts/multi-agent). Lihat juga [Models](/id/concepts/models) dan [Configuration](/id/gateway/configuration).
  </Accordion>

  <Accordion title="Apakah Homebrew berfungsi di Linux?">
    Ya. Homebrew mendukung Linux (Linuxbrew). Penyiapan cepat:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Jika Anda menjalankan OpenClaw melalui systemd, pastikan PATH service menyertakan `/home/linuxbrew/.linuxbrew/bin` (atau prefiks brew Anda) agar alat yang diinstal dengan `brew` dapat di-resolve dalam shell non-login.
    Build terbaru juga menambahkan di awal direktori bin pengguna umum pada Linux systemd services (misalnya `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) dan menghormati `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, dan `FNM_DIR` jika disetel.

  </Accordion>

  <Accordion title="Perbedaan antara instalasi git hackable dan npm install">
    - **Instalasi hackable (git):** checkout source penuh, dapat diedit, terbaik untuk kontributor.
      Anda menjalankan build secara lokal dan dapat menambal kode/docs.
    - **npm install:** instalasi CLI global, tanpa repo, terbaik untuk "langsung jalankan."
      Pembaruan berasal dari npm dist-tag.

    Dokumen: [Getting started](/id/start/getting-started), [Updating](/id/install/updating).

  </Accordion>

  <Accordion title="Bisakah saya beralih antara instalasi npm dan git nanti?">
    Ya. Instal varian lainnya, lalu jalankan Doctor agar service gateway mengarah ke entrypoint baru.
    Ini **tidak menghapus data Anda** - ini hanya mengubah instalasi kode OpenClaw. State Anda
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

    Doctor mendeteksi ketidakcocokan entrypoint service gateway dan menawarkan untuk menulis ulang konfigurasi service agar cocok dengan instalasi saat ini (gunakan `--repair` dalam otomatisasi).

    Tips pencadangan: lihat [Strategi pencadangan](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Sebaiknya saya menjalankan Gateway di laptop atau VPS?">
    Jawaban singkat: **jika Anda menginginkan keandalan 24/7, gunakan VPS**. Jika Anda menginginkan
    hambatan paling rendah dan tidak masalah dengan sleep/restart, jalankan secara lokal.

    **Laptop (Gateway lokal)**

    - **Kelebihan:** tidak ada biaya server, akses langsung ke file lokal, jendela browser langsung.
    - **Kekurangan:** sleep/jaringan terputus = koneksi terputus, pembaruan/reboot OS mengganggu, harus tetap menyala.

    **VPS / cloud**

    - **Kelebihan:** selalu aktif, jaringan stabil, tidak ada masalah sleep laptop, lebih mudah dijaga tetap berjalan.
    - **Kekurangan:** sering berjalan headless (gunakan screenshot), akses file hanya remote, Anda harus SSH untuk pembaruan.

    **Catatan khusus OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord semuanya bekerja dengan baik dari VPS. Satu-satunya trade-off nyata adalah **browser headless** vs jendela yang terlihat. Lihat [Browser](/id/tools/browser).

    **Default yang direkomendasikan:** VPS jika Anda pernah mengalami gateway terputus sebelumnya. Lokal sangat cocok saat Anda aktif menggunakan Mac dan menginginkan akses file lokal atau otomatisasi UI dengan browser yang terlihat.

  </Accordion>

  <Accordion title="Seberapa penting menjalankan OpenClaw di mesin khusus?">
    Tidak wajib, tetapi **direkomendasikan untuk keandalan dan isolasi**.

    - **Host khusus (VPS/Mac mini/Pi):** selalu aktif, lebih sedikit gangguan sleep/reboot, izin lebih bersih, lebih mudah dijaga tetap berjalan.
    - **Laptop/desktop bersama:** sepenuhnya baik untuk pengujian dan penggunaan aktif, tetapi bersiaplah untuk jeda saat mesin sleep atau diperbarui.

    Jika Anda menginginkan yang terbaik dari keduanya, simpan Gateway di host khusus dan pasangkan laptop Anda sebagai **Node** untuk alat screen/camera/exec lokal. Lihat [Nodes](/id/nodes).
    Untuk panduan keamanan, baca [Security](/id/gateway/security).

  </Accordion>

  <Accordion title="Apa persyaratan minimum VPS dan OS yang direkomendasikan?">
    OpenClaw ringan. Untuk Gateway dasar + satu channel chat:

    - **Minimum mutlak:** 1 vCPU, 1GB RAM, ~500MB disk.
    - **Direkomendasikan:** 1-2 vCPU, RAM 2GB atau lebih untuk ruang tambahan (log, media, banyak channel). Alat Node dan otomatisasi browser bisa memakan banyak sumber daya.

    OS: gunakan **Ubuntu LTS** (atau Debian/Ubuntu modern lainnya). Jalur instalasi Linux paling teruji di sana.

    Dokumen: [Linux](/id/platforms/linux), [VPS hosting](/id/vps).

  </Accordion>

  <Accordion title="Bisakah saya menjalankan OpenClaw di VM dan apa persyaratannya?">
    Ya. Perlakukan VM sama seperti VPS: VM harus selalu aktif, dapat dijangkau, dan memiliki
    RAM yang cukup untuk Gateway serta channel apa pun yang Anda aktifkan.

    Panduan dasar:

    - **Minimum mutlak:** 1 vCPU, 1GB RAM.
    - **Direkomendasikan:** RAM 2GB atau lebih jika Anda menjalankan banyak channel, otomatisasi browser, atau alat media.
    - **OS:** Ubuntu LTS atau Debian/Ubuntu modern lainnya.

    Jika Anda menggunakan Windows, **WSL2 adalah penyiapan bergaya VM yang paling mudah** dan memiliki kompatibilitas
    alat terbaik. Lihat [Windows](/id/platforms/windows), [VPS hosting](/id/vps).
    Jika Anda menjalankan macOS di VM, lihat [macOS VM](/id/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Apa itu OpenClaw?

<AccordionGroup>
  <Accordion title="Apa itu OpenClaw, dalam satu paragraf?">
    OpenClaw adalah asisten AI pribadi yang Anda jalankan di perangkat Anda sendiri. OpenClaw membalas di permukaan pesan yang sudah Anda gunakan (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, dan Plugin channel bawaan seperti QQ Bot) dan juga dapat melakukan suara + Canvas langsung di platform yang didukung. **Gateway** adalah control plane yang selalu aktif; asistennya adalah produknya.
  </Accordion>

  <Accordion title="Proposisi nilai">
    OpenClaw bukan "sekadar pembungkus Claude." OpenClaw adalah **control plane yang local-first** yang memungkinkan Anda menjalankan
    asisten yang andal di **perangkat keras milik Anda sendiri**, dapat dijangkau dari aplikasi chat yang sudah Anda gunakan, dengan
    sesi stateful, memori, dan alat - tanpa menyerahkan kendali alur kerja Anda ke
    SaaS yang di-host.

    Sorotan:

    - **Perangkat Anda, data Anda:** jalankan Gateway di mana pun Anda inginkan (Mac, Linux, VPS) dan simpan
      workspace + riwayat sesi secara lokal.
    - **Channel nyata, bukan sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/dll,
      ditambah suara seluler dan Canvas di platform yang didukung.
    - **Agnostik model:** gunakan Anthropic, OpenAI, MiniMax, OpenRouter, dll., dengan routing
      dan failover per-agent.
    - **Opsi lokal saja:** jalankan model lokal sehingga **semua data dapat tetap berada di perangkat Anda** jika Anda mau.
    - **Routing multi-agent:** pisahkan agent per channel, akun, atau tugas, masing-masing dengan
      workspace dan default-nya sendiri.
    - **Open source dan hackable:** periksa, perluas, dan self-host tanpa vendor lock-in.

    Dokumen: [Gateway](/id/gateway), [Channels](/id/channels), [Multi-agent](/id/concepts/multi-agent),
    [Memory](/id/concepts/memory).

  </Accordion>

  <Accordion title="Saya baru saja menyiapkannya - apa yang harus saya lakukan terlebih dahulu?">
    Proyek awal yang bagus:

    - Bangun situs web (WordPress, Shopify, atau situs statis sederhana).
    - Buat prototipe aplikasi seluler (kerangka, layar, rencana API).
    - Atur file dan folder (pembersihan, penamaan, penandaan).
    - Hubungkan Gmail dan otomatisasikan ringkasan atau tindak lanjut.

    OpenClaw dapat menangani tugas besar, tetapi bekerja paling baik saat Anda membaginya ke dalam beberapa fase dan
    menggunakan sub-agent untuk pekerjaan paralel.

  </Accordion>

  <Accordion title="Apa lima kasus penggunaan sehari-hari teratas untuk OpenClaw?">
    Keuntungan harian biasanya terlihat seperti ini:

    - **Ringkasan pribadi:** ringkasan kotak masuk, kalender, dan berita yang Anda pedulikan.
    - **Riset dan penyusunan:** riset cepat, ringkasan, dan draf awal untuk email atau dokumen.
    - **Pengingat dan tindak lanjut:** dorongan dan daftar periksa berbasis Cron atau Heartbeat.
    - **Otomatisasi browser:** mengisi formulir, mengumpulkan data, dan mengulang tugas web.
    - **Koordinasi lintas perangkat:** kirim tugas dari ponsel Anda, biarkan Gateway menjalankannya di server, dan dapatkan hasilnya kembali di chat.

  </Accordion>

  <Accordion title="Bisakah OpenClaw membantu dengan lead gen, outreach, iklan, dan blog untuk SaaS?">
    Ya untuk **riset, kualifikasi, dan penyusunan**. OpenClaw dapat memindai situs, membuat daftar pendek,
    merangkum prospek, dan menulis draf outreach atau copy iklan.

    Untuk **outreach atau penayangan iklan**, pertahankan manusia dalam loop. Hindari spam, ikuti hukum lokal dan
    kebijakan platform, serta tinjau apa pun sebelum dikirim. Pola paling aman adalah membiarkan
    OpenClaw membuat draf dan Anda yang menyetujuinya.

    Dokumen: [Security](/id/gateway/security).

  </Accordion>

  <Accordion title="Apa keunggulannya dibanding Claude Code untuk pengembangan web?">
    OpenClaw adalah **asisten pribadi** dan lapisan koordinasi, bukan pengganti IDE. Gunakan
    Claude Code atau Codex untuk siklus coding langsung tercepat di dalam repo. Gunakan OpenClaw saat Anda
    menginginkan memori yang tahan lama, akses lintas perangkat, dan orkestrasi alat.

    Keunggulan:

    - **Memori + workspace persisten** antar sesi
    - **Akses multi-platform** (WhatsApp, Telegram, TUI, WebChat)
    - **Orkestrasi alat** (browser, file, penjadwalan, hooks)
    - **Gateway yang selalu aktif** (jalankan di VPS, berinteraksi dari mana saja)
    - **Nodes** untuk browser/screen/camera/exec lokal

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills dan otomatisasi

<AccordionGroup>
  <Accordion title="Bagaimana cara menyesuaikan Skills tanpa membuat repo tetap kotor?">
    Gunakan override terkelola alih-alih mengedit salinan repo. Simpan perubahan Anda di `~/.openclaw/skills/<name>/SKILL.md` (atau tambahkan folder melalui `skills.load.extraDirs` di `~/.openclaw/openclaw.json`). Prioritasnya adalah `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bawaan → `skills.load.extraDirs`, jadi override terkelola tetap menang atas Skills bawaan tanpa menyentuh git. Jika Anda perlu Skill diinstal secara global tetapi hanya terlihat oleh beberapa agent, simpan salinan bersama di `~/.openclaw/skills` dan kendalikan visibilitas dengan `agents.defaults.skills` dan `agents.list[].skills`. Hanya edit yang layak di-upstream yang seharusnya tinggal di repo dan dikirim sebagai PR.
  </Accordion>

  <Accordion title="Bisakah saya memuat Skills dari folder khusus?">
    Ya. Tambahkan direktori ekstra melalui `skills.load.extraDirs` di `~/.openclaw/openclaw.json` (prioritas terendah). Prioritas default adalah `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bawaan → `skills.load.extraDirs`. `clawhub` menginstal ke `./skills` secara default, yang diperlakukan OpenClaw sebagai `<workspace>/skills` pada sesi berikutnya. Jika Skill hanya boleh terlihat oleh agent tertentu, pasangkan itu dengan `agents.defaults.skills` atau `agents.list[].skills`.
  </Accordion>

  <Accordion title="Bagaimana saya bisa menggunakan model yang berbeda untuk tugas yang berbeda?">
    Saat ini pola yang didukung adalah:

    - **Cron jobs**: job terisolasi dapat menetapkan override `model` per job.
    - **Sub-agent**: rute tugas ke agent terpisah dengan model default yang berbeda.
    - **Peralihan sesuai permintaan**: gunakan `/model` untuk mengganti model sesi saat ini kapan saja.

    Lihat [Cron jobs](/id/automation/cron-jobs), [Multi-Agent Routing](/id/concepts/multi-agent), dan [Slash commands](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot membeku saat melakukan pekerjaan berat. Bagaimana cara memindahkan beban itu?">
    Gunakan **sub-agent** untuk tugas yang panjang atau paralel. Sub-agent berjalan di sesi mereka sendiri,
    mengembalikan ringkasan, dan menjaga chat utama Anda tetap responsif.

    Minta bot Anda untuk "memunculkan sub-agent untuk tugas ini" atau gunakan `/subagents`.
    Gunakan `/status` di chat untuk melihat apa yang sedang dilakukan Gateway saat ini (dan apakah sedang sibuk).

    Tip token: tugas panjang dan sub-agent sama-sama mengonsumsi token. Jika biaya menjadi perhatian, setel
    model yang lebih murah untuk sub-agent melalui `agents.defaults.subagents.model`.

    Dokumen: [Sub-agents](/id/tools/subagents), [Background Tasks](/id/automation/tasks).

  </Accordion>

  <Accordion title="Bagaimana sesi subagent yang terikat thread bekerja di Discord?">
    Gunakan binding thread. Anda dapat mengikat thread Discord ke target subagent atau sesi sehingga pesan tindak lanjut di thread tersebut tetap berada pada sesi yang terikat itu.

    Alur dasar:

    - Munculkan dengan `sessions_spawn` menggunakan `thread: true` (dan opsional `mode: "session"` untuk tindak lanjut persisten).
    - Atau ikat secara manual dengan `/focus <target>`.
    - Gunakan `/agents` untuk memeriksa status binding.
    - Gunakan `/session idle <duration|off>` dan `/session max-age <duration|off>` untuk mengendalikan auto-unfocus.
    - Gunakan `/unfocus` untuk melepaskan thread.

    Konfigurasi yang diperlukan:

    - Default global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Auto-bind saat spawn: setel `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Dokumen: [Sub-agents](/id/tools/subagents), [Discord](/id/channels/discord), [Configuration Reference](/id/gateway/configuration-reference), [Slash commands](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Sub-agent selesai, tetapi pembaruan penyelesaian dikirim ke tempat yang salah atau tidak pernah diposting. Apa yang harus saya periksa?">
    Periksa rute peminta yang telah di-resolve terlebih dahulu:

    - Pengiriman sub-agent mode penyelesaian lebih mengutamakan thread terikat atau rute percakapan apa pun jika ada.
    - Jika asal penyelesaian hanya membawa channel, OpenClaw akan menggunakan fallback ke rute tersimpan sesi peminta (`lastChannel` / `lastTo` / `lastAccountId`) sehingga pengiriman langsung tetap bisa berhasil.
    - Jika tidak ada rute terikat maupun rute tersimpan yang dapat digunakan, pengiriman langsung dapat gagal dan hasilnya akan menggunakan fallback ke pengiriman sesi yang diantrikan alih-alih langsung memposting ke chat.
    - Target yang tidak valid atau kedaluwarsa masih dapat memaksa fallback antrean atau kegagalan pengiriman akhir.
    - Jika balasan asisten terakhir yang terlihat dari child adalah token senyap persis `NO_REPLY` / `no_reply`, atau persis `ANNOUNCE_SKIP`, OpenClaw sengaja menekan pengumuman alih-alih memposting progres lama yang basi.
    - Jika child timeout setelah hanya melakukan pemanggilan alat, pengumuman dapat merangkum itu menjadi ringkasan progres parsial singkat alih-alih memutar ulang output alat mentah.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumen: [Sub-agents](/id/tools/subagents), [Background Tasks](/id/automation/tasks), [Session Tools](/id/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron atau pengingat tidak berjalan. Apa yang harus saya periksa?">
    Cron berjalan di dalam proses Gateway. Jika Gateway tidak berjalan terus-menerus,
    job terjadwal tidak akan berjalan.

    Daftar periksa:

    - Konfirmasikan Cron diaktifkan (`cron.enabled`) dan `OPENCLAW_SKIP_CRON` tidak disetel.
    - Periksa bahwa Gateway berjalan 24/7 (tanpa sleep/restart).
    - Verifikasi pengaturan zona waktu untuk job tersebut (`--tz` vs zona waktu host).

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
    - Target pengumuman yang hilang atau tidak valid (`channel` / `to`) berarti runner melewati pengiriman keluar.
    - Kegagalan auth channel (`unauthorized`, `Forbidden`) berarti runner mencoba mengirim, tetapi kredensial memblokirnya.
    - Hasil terisolasi yang senyap (`NO_REPLY` / `no_reply` saja) diperlakukan sebagai memang sengaja tidak dapat dikirim, sehingga runner juga menekan pengiriman fallback terantri.

    Untuk Cron jobs terisolasi, runner memiliki pengiriman akhir. Agent diharapkan
    mengembalikan ringkasan teks biasa agar runner dapat mengirimkannya. `--no-deliver` menjaga
    hasil itu tetap internal; itu tidak membuat agent dapat mengirim langsung dengan
    alat pesan sebagai gantinya.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumen: [Cron jobs](/id/automation/cron-jobs), [Background Tasks](/id/automation/tasks).

  </Accordion>

  <Accordion title="Mengapa eksekusi Cron terisolasi beralih model atau mencoba ulang sekali?">
    Itu biasanya adalah jalur pergantian model langsung, bukan penjadwalan ganda.

    Cron terisolasi dapat mempertahankan handoff model runtime dan mencoba ulang saat eksekusi aktif
    melempar `LiveSessionModelSwitchError`. Percobaan ulang mempertahankan
    provider/model yang sudah dialihkan, dan jika pergantian itu membawa override profil auth baru, Cron
    juga mempertahankannya sebelum mencoba ulang.

    Aturan pemilihan terkait:

    - Override model hook Gmail menang terlebih dahulu jika berlaku.
    - Lalu `model` per-job.
    - Lalu override model sesi Cron yang tersimpan.
    - Lalu pemilihan model agent/default normal.

    Loop percobaan ulang dibatasi. Setelah percobaan awal plus 2 kali percobaan ulang karena pergantian,
    Cron dibatalkan alih-alih berulang tanpa akhir.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumen: [Cron jobs](/id/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Bagaimana cara menginstal Skills di Linux?">
    Gunakan perintah native `openclaw skills` atau letakkan Skills ke workspace Anda. UI Skills macOS tidak tersedia di Linux.
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
    Ya. Gunakan penjadwal Gateway:

    - **Cron jobs** untuk tugas terjadwal atau berulang (bertahan setelah restart).
    - **Heartbeat** untuk pemeriksaan berkala "sesi utama".
    - **Job terisolasi** untuk agent otonom yang memposting ringkasan atau mengirim ke chat.

    Dokumen: [Cron jobs](/id/automation/cron-jobs), [Automation & Tasks](/id/automation),
    [Heartbeat](/id/gateway/heartbeat).

  </Accordion>

  <Accordion title="Bisakah saya menjalankan Skills Apple khusus macOS dari Linux?">
    Tidak secara langsung. Skills macOS dibatasi oleh `metadata.openclaw.os` ditambah biner yang diperlukan, dan Skills hanya muncul di system prompt saat memenuhi syarat pada **host Gateway**. Di Linux, Skills khusus `darwin` (seperti `apple-notes`, `apple-reminders`, `things-mac`) tidak akan dimuat kecuali Anda mengganti aturan pembatasannya.

    Ada tiga pola yang didukung:

    **Opsi A - jalankan Gateway di Mac (paling sederhana).**
    Jalankan Gateway di tempat biner macOS tersedia, lalu hubungkan dari Linux dalam [mode remote](#gateway-ports-already-running-and-remote-mode) atau melalui Tailscale. Skills dimuat secara normal karena host Gateway adalah macOS.

    **Opsi B - gunakan node macOS (tanpa SSH).**
    Jalankan Gateway di Linux, pasangkan node macOS (aplikasi menubar), dan setel **Node Run Commands** ke "Always Ask" atau "Always Allow" di Mac. OpenClaw dapat memperlakukan Skills khusus macOS sebagai memenuhi syarat saat biner yang diperlukan ada di node. Agent menjalankan Skills tersebut melalui alat `nodes`. Jika Anda memilih "Always Ask", menyetujui "Always Allow" pada prompt akan menambahkan perintah itu ke allowlist.

    **Opsi C - proxikan biner macOS melalui SSH (lanjutan).**
    Biarkan Gateway tetap di Linux, tetapi buat CLI biner yang diperlukan di-resolve ke wrapper SSH yang berjalan di Mac. Lalu override Skill agar mengizinkan Linux sehingga tetap memenuhi syarat.

    1. Buat wrapper SSH untuk biner tersebut (contoh: `memo` untuk Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Letakkan wrapper itu di `PATH` pada host Linux (misalnya `~/bin/memo`).
    3. Override metadata Skill (workspace atau `~/.openclaw/skills`) untuk mengizinkan Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Mulai sesi baru agar snapshot Skills diperbarui.

  </Accordion>

  <Accordion title="Apakah Anda memiliki integrasi Notion atau HeyGen?">
    Belum bawaan saat ini.

    Opsi:

    - **Skill / Plugin kustom:** terbaik untuk akses API yang andal (Notion/HeyGen sama-sama memiliki API).
    - **Otomatisasi browser:** berfungsi tanpa kode tetapi lebih lambat dan lebih rapuh.

    Jika Anda ingin mempertahankan konteks per klien (alur kerja agensi), pola yang sederhana adalah:

    - Satu halaman Notion per klien (konteks + preferensi + pekerjaan aktif).
    - Minta agent mengambil halaman itu di awal sesi.

    Jika Anda menginginkan integrasi native, buka permintaan fitur atau bangun Skill
    yang menargetkan API tersebut.

    Instal Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Instalasi native ditempatkan di direktori `skills/` workspace aktif. Untuk Skills bersama lintas agent, letakkan di `~/.openclaw/skills/<name>/SKILL.md`. Jika hanya beberapa agent yang boleh melihat instalasi bersama, konfigurasikan `agents.defaults.skills` atau `agents.list[].skills`. Beberapa Skills mengharapkan biner yang diinstal melalui Homebrew; di Linux itu berarti Linuxbrew (lihat entri FAQ Homebrew Linux di atas). Lihat [Skills](/id/tools/skills), [Skills config](/id/tools/skills-config), dan [ClawHub](/id/tools/clawhub).

  </Accordion>

  <Accordion title="Bagaimana cara menggunakan Chrome saya yang sudah login dengan OpenClaw?">
    Gunakan profil browser bawaan `user`, yang terhubung melalui Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Jika Anda menginginkan nama kustom, buat profil MCP eksplisit:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Jalur ini bersifat lokal ke host. Jika Gateway berjalan di tempat lain, jalankan host node di mesin browser atau gunakan CDP remote sebagai gantinya.

    Batasan saat ini pada `existing-session` / `user`:

    - aksi berbasis ref, bukan berbasis selector CSS
    - upload memerlukan `ref` / `inputRef` dan saat ini hanya mendukung satu file dalam satu waktu
    - `responsebody`, ekspor PDF, intersepsi unduhan, dan aksi batch masih memerlukan browser terkelola atau profil CDP mentah

  </Accordion>
</AccordionGroup>

## Sandboxing dan memori

<AccordionGroup>
  <Accordion title="Apakah ada dokumen sandboxing khusus?">
    Ya. Lihat [Sandboxing](/id/gateway/sandboxing). Untuk penyiapan khusus Docker (gateway penuh di Docker atau image sandbox), lihat [Docker](/id/install/docker).
  </Accordion>

  <Accordion title="Docker terasa terbatas - bagaimana cara mengaktifkan fitur penuh?">
    Image default mengutamakan keamanan dan berjalan sebagai pengguna `node`, jadi tidak
    menyertakan paket sistem, Homebrew, atau browser bawaan. Untuk penyiapan yang lebih lengkap:

    - Pertahankan `/home/node` dengan `OPENCLAW_HOME_VOLUME` agar cache tetap tersimpan.
    - Panggang dependensi sistem ke dalam image dengan `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Instal browser Playwright melalui CLI bawaan:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Setel `PLAYWRIGHT_BROWSERS_PATH` dan pastikan jalurnya disimpan secara persisten.

    Dokumen: [Docker](/id/install/docker), [Browser](/id/tools/browser).

  </Accordion>

  <Accordion title="Bisakah saya menjaga DM tetap personal tetapi membuat grup publik/tersandbox dengan satu agent?">
    Ya - jika lalu lintas privat Anda adalah **DM** dan lalu lintas publik Anda adalah **grup**.

    Gunakan `agents.defaults.sandbox.mode: "non-main"` agar sesi grup/channel (kunci non-utama) berjalan di Docker, sementara sesi DM utama tetap di host. Lalu batasi alat apa saja yang tersedia dalam sesi tersandbox melalui `tools.sandbox.tools`.

    Panduan penyiapan + contoh config: [Groups: personal DMs + public groups](/id/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referensi config utama: [Gateway configuration](/id/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Bagaimana cara mengikat folder host ke dalam sandbox?">
    Setel `agents.defaults.sandbox.docker.binds` ke `["host:path:mode"]` (misalnya `"/home/user/src:/src:ro"`). Ikatan global + per-agent digabungkan; ikatan per-agent diabaikan saat `scope: "shared"`. Gunakan `:ro` untuk apa pun yang sensitif dan ingat bahwa bind melewati dinding filesystem sandbox.

    OpenClaw memvalidasi sumber bind terhadap jalur yang dinormalisasi dan jalur kanonis yang di-resolve melalui leluhur terdalam yang sudah ada. Itu berarti escape melalui parent symlink tetap gagal secara fail-closed bahkan ketika segmen jalur terakhir belum ada, dan pemeriksaan allowed-root tetap berlaku setelah resolusi symlink.

    Lihat [Sandboxing](/id/gateway/sandboxing#custom-bind-mounts) dan [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) untuk contoh dan catatan keamanan.

  </Accordion>

  <Accordion title="Bagaimana cara kerja memori?">
    Memori OpenClaw hanyalah file Markdown di workspace agent:

    - Catatan harian di `memory/YYYY-MM-DD.md`
    - Catatan jangka panjang yang dikurasi di `MEMORY.md` (hanya sesi utama/pribadi)

    OpenClaw juga menjalankan **flush memori pra-Compaction yang senyap** untuk mengingatkan model
    agar menulis catatan yang tahan lama sebelum auto-Compaction. Ini hanya berjalan ketika workspace
    dapat ditulis (sandbox baca-saja melewatinya). Lihat [Memory](/id/concepts/memory).

  </Accordion>

  <Accordion title="Memori terus melupakan hal-hal. Bagaimana cara membuatnya menempel?">
    Minta bot untuk **menulis fakta itu ke memori**. Catatan jangka panjang masuk ke `MEMORY.md`,
    konteks jangka pendek masuk ke `memory/YYYY-MM-DD.md`.

    Ini masih merupakan area yang terus kami tingkatkan. Akan membantu jika Anda mengingatkan model untuk menyimpan memori;
    model akan tahu apa yang harus dilakukan. Jika terus lupa, verifikasi bahwa Gateway menggunakan
    workspace yang sama pada setiap eksekusi.

    Dokumen: [Memory](/id/concepts/memory), [Agent workspace](/id/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Apakah memori bertahan selamanya? Apa batasannya?">
    File memori hidup di disk dan bertahan sampai Anda menghapusnya. Batasnya adalah
    penyimpanan Anda, bukan model. **Konteks sesi** tetap dibatasi oleh jendela konteks
    model, sehingga percakapan panjang dapat mengalami Compaction atau pemotongan. Itulah sebabnya
    pencarian memori ada - fitur itu hanya menarik kembali bagian yang relevan ke dalam konteks.

    Dokumen: [Memory](/id/concepts/memory), [Context](/id/concepts/context).

  </Accordion>

  <Accordion title="Apakah pencarian memori semantik memerlukan kunci API OpenAI?">
    Hanya jika Anda menggunakan **embedding OpenAI**. OAuth Codex mencakup chat/completion dan
    **tidak** memberikan akses embedding, jadi **login dengan Codex (OAuth atau
    login Codex CLI)** tidak membantu untuk pencarian memori semantik. Embedding OpenAI
    tetap memerlukan kunci API asli (`OPENAI_API_KEY` atau `models.providers.openai.apiKey`).

    Jika Anda tidak menetapkan provider secara eksplisit, OpenClaw memilih provider secara otomatis ketika
    dapat me-resolve kunci API (profil auth, `models.providers.*.apiKey`, atau env vars).
    OpenClaw lebih memilih OpenAI jika kunci OpenAI dapat di-resolve, jika tidak Gemini jika kunci Gemini
    dapat di-resolve, lalu Voyage, lalu Mistral. Jika tidak ada kunci remote yang tersedia, pencarian memori
    tetap dinonaktifkan sampai Anda mengonfigurasinya. Jika Anda memiliki jalur model lokal
    yang dikonfigurasi dan tersedia, OpenClaw
    lebih memilih `local`. Ollama didukung saat Anda secara eksplisit menetapkan
    `memorySearch.provider = "ollama"`.

    Jika Anda lebih suka tetap lokal, setel `memorySearch.provider = "local"` (dan opsional
    `memorySearch.fallback = "none"`). Jika Anda menginginkan embedding Gemini, setel
    `memorySearch.provider = "gemini"` dan berikan `GEMINI_API_KEY` (atau
    `memorySearch.remote.apiKey`). Kami mendukung model embedding **OpenAI, Gemini, Voyage, Mistral, Ollama, atau local**
    - lihat [Memory](/id/concepts/memory) untuk detail penyiapannya.

  </Accordion>
</AccordionGroup>

## Tempat berbagai hal disimpan di disk

<AccordionGroup>
  <Accordion title="Apakah semua data yang digunakan dengan OpenClaw disimpan secara lokal?">
    Tidak - **state OpenClaw bersifat lokal**, tetapi **layanan eksternal tetap melihat apa yang Anda kirim ke mereka**.

    - **Lokal secara default:** sesi, file memori, config, dan workspace berada di host Gateway
      (`~/.openclaw` + direktori workspace Anda).
    - **Remote karena kebutuhan:** pesan yang Anda kirim ke provider model (Anthropic/OpenAI/dll.) dikirim ke
      API mereka, dan platform chat (WhatsApp/Telegram/Slack/dll.) menyimpan data pesan di
      server mereka.
    - **Anda mengendalikan jejaknya:** menggunakan model lokal menjaga prompt tetap di mesin Anda, tetapi lalu lintas
      channel tetap melewati server milik channel tersebut.

    Terkait: [Agent workspace](/id/concepts/agent-workspace), [Memory](/id/concepts/memory).

  </Accordion>

  <Accordion title="Di mana OpenClaw menyimpan datanya?">
    Semuanya berada di bawah `$OPENCLAW_STATE_DIR` (default: `~/.openclaw`):

    | Path                                                            | Tujuan                                                             |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Config utama (JSON5)                                               |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Impor OAuth lama (disalin ke profil auth saat pertama digunakan)   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profil auth (OAuth, kunci API, dan `keyRef`/`tokenRef` opsional)   |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload secret opsional berbasis file untuk provider SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | File kompatibilitas lama (entri `api_key` statis dibersihkan)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | State provider (mis. `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | State per-agent (agentDir + sesi)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Riwayat & state percakapan (per agent)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadata sesi (per agent)                                          |

    Jalur lama agent tunggal: `~/.openclaw/agent/*` (dimigrasikan oleh `openclaw doctor`).

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
    workspace yang sama pada setiap peluncuran (dan ingat: mode remote menggunakan **workspace milik host gateway**,
    bukan laptop lokal Anda).

    Tip: jika Anda menginginkan perilaku atau preferensi yang tahan lama, minta bot untuk **menuliskannya ke
    AGENTS.md atau MEMORY.md** daripada mengandalkan riwayat chat.

    Lihat [Agent workspace](/id/concepts/agent-workspace) dan [Memory](/id/concepts/memory).

  </Accordion>

  <Accordion title="Strategi pencadangan yang direkomendasikan">
    Simpan **workspace agent** Anda di repo git **private** dan cadangkan di tempat
    privat (misalnya GitHub private). Ini menangkap memori + file AGENTS/SOUL/USER
    dan memungkinkan Anda memulihkan "pikiran" asisten nanti.

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
    Jalur relatif di-resolve di dalam workspace, tetapi jalur absolut dapat mengakses lokasi
    host lain kecuali sandboxing diaktifkan. Jika Anda memerlukan isolasi, gunakan
    [`agents.defaults.sandbox`](/id/gateway/sandboxing) atau pengaturan sandbox per-agent. Jika Anda
    ingin repo menjadi direktori kerja default, arahkan `workspace`
    agent itu ke root repo. Repo OpenClaw hanyalah source code; simpan
    workspace secara terpisah kecuali Anda memang ingin agent bekerja di dalamnya.

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

  <Accordion title="Mode remote: di mana session store berada?">
    State sesi dimiliki oleh **host gateway**. Jika Anda berada dalam mode remote, session store yang penting bagi Anda ada di mesin remote, bukan di laptop lokal Anda. Lihat [Session management](/id/concepts/session).
  </Accordion>
</AccordionGroup>

## Dasar-dasar config

<AccordionGroup>
  <Accordion title="Apa format config-nya? Di mana letaknya?">
    OpenClaw membaca config **JSON5** opsional dari `$OPENCLAW_CONFIG_PATH` (default: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Jika file tidak ada, OpenClaw menggunakan default yang cukup aman (termasuk workspace default `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Saya menetapkan gateway.bind: "lan" (atau "tailnet") dan sekarang tidak ada yang listen / UI mengatakan unauthorized'>
    Bind non-loopback **memerlukan jalur auth gateway yang valid**. Dalam praktiknya itu berarti:

    - auth shared-secret: token atau kata sandi
    - `gateway.auth.mode: "trusted-proxy"` di belakang reverse proxy sadar identitas non-loopback yang dikonfigurasi dengan benar

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
    - Jalur pemanggilan lokal dapat menggunakan `gateway.remote.*` sebagai fallback hanya ketika `gateway.auth.*` tidak disetel.
    - Untuk auth kata sandi, setel `gateway.auth.mode: "password"` plus `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`) sebagai gantinya.
    - Jika `gateway.auth.token` / `gateway.auth.password` secara eksplisit dikonfigurasi melalui SecretRef dan tidak dapat di-resolve, resolusi akan gagal secara fail-closed (tanpa masking fallback remote).
    - Penyiapan Control UI dengan shared-secret melakukan autentikasi melalui `connect.params.auth.token` atau `connect.params.auth.password` (disimpan di pengaturan aplikasi/UI). Mode pembawa identitas seperti Tailscale Serve atau `trusted-proxy` menggunakan header permintaan sebagai gantinya. Hindari menaruh shared secret di URL.
    - Dengan `gateway.auth.mode: "trusted-proxy"`, reverse proxy loopback pada host yang sama tetap **tidak** memenuhi auth trusted-proxy. Trusted proxy harus berupa sumber non-loopback yang dikonfigurasi.

  </Accordion>

  <Accordion title="Mengapa saya perlu token di localhost sekarang?">
    OpenClaw menegakkan auth gateway secara default, termasuk loopback. Pada jalur default normal itu berarti auth token: jika tidak ada jalur auth eksplisit yang dikonfigurasi, startup gateway akan me-resolve ke mode token dan menghasilkan token secara otomatis, lalu menyimpannya ke `gateway.auth.token`, sehingga **klien WS lokal harus diautentikasi**. Ini memblokir proses lokal lain untuk memanggil Gateway.

    Jika Anda lebih memilih jalur auth yang berbeda, Anda dapat secara eksplisit memilih mode kata sandi (atau, untuk reverse proxy sadar identitas non-loopback, `trusted-proxy`). Jika Anda **benar-benar** ingin loopback terbuka, setel `gateway.auth.mode: "none"` secara eksplisit di config Anda. Doctor dapat membuat token untuk Anda kapan saja: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Apakah saya harus restart setelah mengubah config?">
    Gateway mengawasi config dan mendukung hot-reload:

    - `gateway.reload.mode: "hybrid"` (default): terapkan perubahan yang aman secara hot, restart untuk yang kritis
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

    - `off`: menyembunyikan teks tagline tetapi tetap mempertahankan baris judul/versi banner.
    - `default`: selalu menggunakan `All your chats, one OpenClaw.`.
    - `random`: tagline lucu/musiman yang bergilir (perilaku default).
    - Jika Anda tidak ingin ada banner sama sekali, setel env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Bagaimana cara mengaktifkan pencarian web (dan pengambilan web)?">
    `web_fetch` berfungsi tanpa kunci API. `web_search` bergantung pada
    provider yang Anda pilih:

    - Provider berbasis API seperti Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity, dan Tavily memerlukan penyiapan kunci API normal mereka.
    - Ollama Web Search tidak memerlukan kunci, tetapi menggunakan host Ollama yang telah Anda konfigurasi dan memerlukan `ollama signin`.
    - DuckDuckGo tidak memerlukan kunci, tetapi merupakan integrasi tidak resmi berbasis HTML.
    - SearXNG tidak memerlukan kunci/self-hosted; konfigurasikan `SEARXNG_BASE_URL` atau `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Direkomendasikan:** jalankan `openclaw configure --section web` dan pilih provider.
    Alternatif env:

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
              provider: "firecrawl", // opsional; hilangkan untuk deteksi otomatis
            },
          },
        },
    }
    ```

    Config pencarian web khusus provider sekarang berada di bawah `plugins.entries.<plugin>.config.webSearch.*`.
    Jalur provider lama `tools.web.search.*` masih dimuat sementara demi kompatibilitas, tetapi tidak boleh digunakan untuk config baru.
    Config fallback pengambilan web Firecrawl berada di bawah `plugins.entries.firecrawl.config.webFetch.*`.

    Catatan:

    - Jika Anda menggunakan allowlist, tambahkan `web_search`/`web_fetch`/`x_search` atau `group:web`.
    - `web_fetch` diaktifkan secara default (kecuali dinonaktifkan secara eksplisit).
    - Jika `tools.web.fetch.provider` dihilangkan, OpenClaw mendeteksi otomatis provider fallback fetch siap pertama dari kredensial yang tersedia. Saat ini provider bawaannya adalah Firecrawl.
    - Daemon membaca env vars dari `~/.openclaw/.env` (atau environment service).

    Dokumen: [Web tools](/id/tools/web).

  </Accordion>

  <Accordion title="config.apply menghapus config saya. Bagaimana cara memulihkan dan menghindari ini?">
    `config.apply` menggantikan **seluruh config**. Jika Anda mengirim objek parsial, semua yang
    lain akan dihapus.

    Pemulihan:

    - Pulihkan dari cadangan (git atau salinan `~/.openclaw/openclaw.json`).
    - Jika Anda tidak punya cadangan, jalankan ulang `openclaw doctor` dan konfigurasi ulang channels/models.
    - Jika ini tidak terduga, buat bug dan sertakan config terakhir yang Anda ketahui atau cadangan apa pun.
    - Agent coding lokal sering kali dapat merekonstruksi config yang berfungsi dari log atau riwayat.

    Hindari ini:

    - Gunakan `openclaw config set` untuk perubahan kecil.
    - Gunakan `openclaw configure` untuk edit interaktif.
    - Gunakan `config.schema.lookup` terlebih dahulu saat Anda tidak yakin tentang path atau bentuk field yang tepat; perintah ini mengembalikan node skema dangkal plus ringkasan child langsung untuk penelusuran lebih lanjut.
    - Gunakan `config.patch` untuk edit RPC parsial; simpan `config.apply` hanya untuk penggantian config penuh.
    - Jika Anda menggunakan alat `gateway` khusus owner dari eksekusi agent, alat itu tetap akan menolak penulisan ke `tools.exec.ask` / `tools.exec.security` (termasuk alias lama `tools.bash.*` yang dinormalisasi ke jalur exec terlindungi yang sama).

    Dokumen: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/id/gateway/doctor).

  </Accordion>

  <Accordion title="Bagaimana cara menjalankan Gateway pusat dengan worker khusus di berbagai perangkat?">
    Pola umumnya adalah **satu Gateway** (mis. Raspberry Pi) plus **Node** dan **agent**:

    - **Gateway (pusat):** memiliki channels (Signal/WhatsApp), routing, dan sesi.
    - **Nodes (perangkat):** Mac/iOS/Android terhubung sebagai periferal dan mengekspos alat lokal (`system.run`, `canvas`, `camera`).
    - **Agents (worker):** otak/workspace terpisah untuk peran khusus (mis. "Hetzner ops", "Personal data").
    - **Sub-agents:** munculkan pekerjaan latar belakang dari agent utama saat Anda menginginkan paralelisme.
    - **TUI:** hubungkan ke Gateway dan ganti agent/sesi.

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

    Default-nya adalah `false` (headful). Mode headless lebih mungkin memicu pemeriksaan anti-bot di beberapa situs. Lihat [Browser](/id/tools/browser).

    Mode headless menggunakan **engine Chromium yang sama** dan berfungsi untuk sebagian besar otomatisasi (formulir, klik, scraping, login). Perbedaan utamanya:

    - Tidak ada jendela browser yang terlihat (gunakan screenshot jika Anda membutuhkan visual).
    - Beberapa situs lebih ketat terhadap otomatisasi dalam mode headless (CAPTCHA, anti-bot).
      Misalnya, X/Twitter sering memblokir sesi headless.

  </Accordion>

  <Accordion title="Bagaimana cara menggunakan Brave untuk kontrol browser?">
    Setel `browser.executablePath` ke biner Brave Anda (atau browser berbasis Chromium lainnya) dan restart Gateway.
    Lihat contoh config lengkap di [Browser](/id/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateway remote dan Node

<AccordionGroup>
  <Accordion title="Bagaimana perintah merambat antara Telegram, gateway, dan Node?">
    Pesan Telegram ditangani oleh **gateway**. Gateway menjalankan agent dan
    baru kemudian memanggil Node melalui **Gateway WebSocket** saat alat node diperlukan:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node tidak melihat lalu lintas provider masuk; mereka hanya menerima panggilan RPC node.

  </Accordion>

  <Accordion title="Bagaimana agent saya bisa mengakses komputer saya jika Gateway di-host secara remote?">
    Jawaban singkat: **pasangkan komputer Anda sebagai Node**. Gateway berjalan di tempat lain, tetapi dapat
    memanggil alat `node.*` (layar, kamera, sistem) di mesin lokal Anda melalui Gateway WebSocket.

    Penyiapan yang umum:

    1. Jalankan Gateway di host yang selalu aktif (VPS/server rumahan).
    2. Tempatkan host Gateway + komputer Anda pada tailnet yang sama.
    3. Pastikan Gateway WS dapat dijangkau (bind tailnet atau tunnel SSH).
    4. Buka aplikasi macOS secara lokal dan hubungkan dalam mode **Remote over SSH** (atau tailnet langsung)
       sehingga aplikasi tersebut dapat mendaftar sebagai Node.
    5. Setujui Node di Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Tidak diperlukan bridge TCP terpisah; Nodes terhubung melalui Gateway WebSocket.

    Pengingat keamanan: memasangkan Node macOS memungkinkan `system.run` di mesin itu. Hanya
    pasangkan perangkat yang Anda percayai, dan tinjau [Security](/id/gateway/security).

    Dokumen: [Nodes](/id/nodes), [Gateway protocol](/id/gateway/protocol), [macOS remote mode](/id/platforms/mac/remote), [Security](/id/gateway/security).

  </Accordion>

  <Accordion title="Tailscale terhubung tetapi saya tidak mendapat balasan. Sekarang bagaimana?">
    Periksa hal-hal dasarnya:

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
    Ya. Tidak ada bridge "bot-ke-bot" bawaan, tetapi Anda dapat menghubungkannya dengan beberapa
    cara yang andal:

    **Paling sederhana:** gunakan channel chat normal yang bisa diakses kedua bot (Telegram/Slack/WhatsApp).
    Minta Bot A mengirim pesan ke Bot B, lalu biarkan Bot B membalas seperti biasa.

    **CLI bridge (generik):** jalankan skrip yang memanggil Gateway lain dengan
    `openclaw agent --message ... --deliver`, menargetkan chat tempat bot lain
    mendengarkan. Jika satu bot berada di VPS remote, arahkan CLI Anda ke Gateway remote itu
    melalui SSH/Tailscale (lihat [Remote access](/id/gateway/remote)).

    Contoh pola (jalankan dari mesin yang dapat menjangkau Gateway target):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tip: tambahkan guardrail agar kedua bot tidak berulang tanpa akhir (hanya saat disebut, channel
    allowlist, atau aturan "jangan balas pesan bot").

    Dokumen: [Remote access](/id/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/id/tools/agent-send).

  </Accordion>

  <Accordion title="Apakah saya perlu VPS terpisah untuk beberapa agent?">
    Tidak. Satu Gateway dapat menampung beberapa agent, masing-masing dengan workspace, default model,
    dan routing-nya sendiri. Itulah penyiapan normal dan jauh lebih murah serta lebih sederhana daripada menjalankan
    satu VPS per agent.

    Gunakan VPS terpisah hanya ketika Anda memerlukan isolasi keras (batas keamanan) atau config yang sangat
    berbeda yang tidak ingin Anda bagikan. Selain itu, pertahankan satu Gateway dan
    gunakan beberapa agent atau sub-agent.

  </Accordion>

  <Accordion title="Apakah ada manfaat menggunakan Node di laptop pribadi saya dibanding SSH dari VPS?">
    Ya - Nodes adalah cara utama untuk menjangkau laptop Anda dari Gateway remote, dan mereka
    membuka lebih dari sekadar akses shell. Gateway berjalan di macOS/Linux (Windows melalui WSL2) dan
    ringan (VPS kecil atau perangkat setara Raspberry Pi sudah cukup; RAM 4 GB lebih dari cukup), jadi penyiapan yang umum
    adalah host yang selalu aktif ditambah laptop Anda sebagai Node.

    - **Tidak perlu SSH masuk.** Nodes terhubung keluar ke Gateway WebSocket dan menggunakan pairing perangkat.
    - **Kontrol eksekusi yang lebih aman.** `system.run` dibatasi oleh allowlist/persetujuan node di laptop itu.
    - **Lebih banyak alat perangkat.** Nodes mengekspos `canvas`, `camera`, dan `screen` selain `system.run`.
    - **Otomatisasi browser lokal.** Simpan Gateway di VPS, tetapi jalankan Chrome secara lokal melalui host node di laptop, atau sambungkan ke Chrome lokal di host melalui Chrome MCP.

    SSH baik untuk akses shell ad hoc, tetapi Nodes lebih sederhana untuk alur kerja agent yang berkelanjutan dan
    otomatisasi perangkat.

    Dokumen: [Nodes](/id/nodes), [Nodes CLI](/cli/nodes), [Browser](/id/tools/browser).

  </Accordion>

  <Accordion title="Apakah Node menjalankan service gateway?">
    Tidak. Hanya **satu gateway** yang seharusnya berjalan per host kecuali Anda sengaja menjalankan profil terisolasi (lihat [Multiple gateways](/id/gateway/multiple-gateways)). Nodes adalah periferal yang terhubung
    ke gateway (Node iOS/Android, atau "mode node" macOS di aplikasi menubar). Untuk host node headless
    dan kontrol CLI, lihat [Node host CLI](/cli/node).

    Restart penuh diperlukan untuk perubahan `gateway`, `discovery`, dan `canvasHost`.

  </Accordion>

  <Accordion title="Apakah ada cara API / RPC untuk menerapkan config?">
    Ya.

    - `config.schema.lookup`: periksa satu subtree config dengan node skema dangkalnya, petunjuk UI yang cocok, dan ringkasan child langsung sebelum menulis
    - `config.get`: ambil snapshot + hash saat ini
    - `config.patch`: pembaruan parsial aman (lebih disukai untuk sebagian besar edit RPC); hot-reload bila memungkinkan dan restart bila diperlukan
    - `config.apply`: validasi + ganti seluruh config; hot-reload bila memungkinkan dan restart bila diperlukan
    - Alat runtime `gateway` khusus owner tetap menolak penulisan ulang `tools.exec.ask` / `tools.exec.security`; alias lama `tools.bash.*` dinormalisasi ke jalur exec terlindungi yang sama

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
       - Di konsol admin Tailscale, aktifkan MagicDNS agar VPS memiliki nama yang stabil.
    4. **Gunakan hostname tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Jika Anda menginginkan Control UI tanpa SSH, gunakan Tailscale Serve di VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Ini menjaga gateway tetap terikat ke loopback dan mengekspos HTTPS melalui Tailscale. Lihat [Tailscale](/id/gateway/tailscale).

  </Accordion>

  <Accordion title="Bagaimana cara menghubungkan Node Mac ke Gateway remote (Tailscale Serve)?">
    Serve mengekspos **Gateway Control UI + WS**. Nodes terhubung melalui endpoint Gateway WS yang sama.

    Penyiapan yang direkomendasikan:

    1. **Pastikan VPS + Mac berada di tailnet yang sama**.
    2. **Gunakan aplikasi macOS dalam mode Remote** (target SSH bisa berupa hostname tailnet).
       Aplikasi akan membuat tunnel port Gateway dan terhubung sebagai Node.
    3. **Setujui Node** di gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumen: [Gateway protocol](/id/gateway/protocol), [Discovery](/id/gateway/discovery), [macOS remote mode](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Sebaiknya saya menginstal di laptop kedua atau cukup menambahkan Node?">
    Jika Anda hanya membutuhkan **alat lokal** (screen/camera/exec) di laptop kedua, tambahkan sebagai
    **Node**. Itu mempertahankan satu Gateway dan menghindari duplikasi config. Alat node lokal
    saat ini hanya untuk macOS, tetapi kami berencana memperluasnya ke OS lain.

    Instal Gateway kedua hanya ketika Anda memerlukan **isolasi keras** atau dua bot yang benar-benar terpisah.

    Dokumen: [Nodes](/id/nodes), [Nodes CLI](/cli/nodes), [Multiple gateways](/id/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars dan pemuatan .env

<AccordionGroup>
  <Accordion title="Bagaimana OpenClaw memuat env vars?">
    OpenClaw membaca env vars dari proses induk (shell, launchd/systemd, CI, dll.) dan juga memuat:

    - `.env` dari direktori kerja saat ini
    - fallback `.env` global dari `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`)

    Tidak satu pun file `.env` menimpa env vars yang sudah ada.

    Anda juga dapat mendefinisikan env vars inline di config (diterapkan hanya jika tidak ada dari env proses):

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

  <Accordion title="Saya memulai Gateway melalui service dan env vars saya hilang. Sekarang bagaimana?">
    Dua perbaikan umum:

    1. Masukkan kunci yang hilang ke `~/.openclaw/.env` agar tetap diambil bahkan ketika service tidak mewarisi env shell Anda.
    2. Aktifkan impor shell (kemudahan opsional):

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

    Ini menjalankan login shell Anda dan hanya mengimpor kunci yang diharapkan tetapi hilang (tidak pernah menimpa). Padanan env var:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Saya menetapkan COPILOT_GITHUB_TOKEN, tetapi status models menampilkan "Shell env: off." Mengapa?'>
    `openclaw models status` melaporkan apakah **impor env shell** diaktifkan. "Shell env: off"
    **tidak** berarti env vars Anda hilang - itu hanya berarti OpenClaw tidak akan memuat
    login shell Anda secara otomatis.

    Jika Gateway berjalan sebagai service (launchd/systemd), Gateway tidak akan mewarisi env
    shell Anda. Perbaiki dengan salah satu cara berikut:

    1. Masukkan token ke `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Atau aktifkan impor shell (`env.shellEnv.enabled: true`).
    3. Atau tambahkan ke blok `env` config Anda (diterapkan hanya jika hilang).

    Lalu restart gateway dan periksa ulang:

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

  <Accordion title="Apakah sesi direset secara otomatis jika saya tidak pernah mengirim /new?">
    Sesi dapat kedaluwarsa setelah `session.idleMinutes`, tetapi ini **dinonaktifkan secara default** (default **0**).
    Setel ke nilai positif untuk mengaktifkan kedaluwarsa saat idle. Saat diaktifkan, pesan **berikutnya**
    setelah masa idle akan memulai ID sesi baru untuk kunci chat tersebut.
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
    Ya, melalui **routing multi-agent** dan **sub-agent**. Anda dapat membuat satu agent
    koordinator dan beberapa agent pekerja dengan workspace dan model mereka sendiri.

    Meskipun begitu, ini paling baik dianggap sebagai **eksperimen yang menyenangkan**. Ini memakan banyak token dan sering
    kali kurang efisien daripada menggunakan satu bot dengan sesi terpisah. Model tipikal yang
    kami bayangkan adalah satu bot yang Anda ajak bicara, dengan sesi yang berbeda untuk pekerjaan paralel. Bot itu
    juga dapat memunculkan sub-agent saat diperlukan.

    Dokumen: [Multi-agent routing](/id/concepts/multi-agent), [Sub-agents](/id/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Mengapa konteks terpotong di tengah tugas? Bagaimana cara mencegahnya?">
    Konteks sesi dibatasi oleh jendela model. Chat yang panjang, output alat yang besar, atau banyak
    file dapat memicu Compaction atau pemotongan.

    Yang membantu:

    - Minta bot merangkum status saat ini dan menuliskannya ke file.
    - Gunakan `/compact` sebelum tugas panjang, dan `/new` saat berganti topik.
    - Simpan konteks penting di workspace dan minta bot membacanya kembali.
    - Gunakan sub-agent untuk pekerjaan panjang atau paralel agar chat utama tetap lebih kecil.
    - Pilih model dengan jendela konteks yang lebih besar jika ini sering terjadi.

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

    - Onboarding juga menawarkan **Reset** jika melihat config yang ada. Lihat [Onboarding (CLI)](/id/start/wizard).
    - Jika Anda menggunakan profil (`--profile` / `OPENCLAW_PROFILE`), reset setiap direktori state (default adalah `~/.openclaw-<profile>`).
    - Reset dev: `openclaw gateway --dev --reset` (khusus dev; menghapus config dev + kredensial + sesi + workspace).

  </Accordion>

  <Accordion title='Saya mendapatkan error "context too large" - bagaimana cara mereset atau melakukan Compaction?'>
    Gunakan salah satu dari ini:

    - **Compact** (tetap mempertahankan percakapan tetapi merangkum giliran lama):

      ```
      /compact
      ```

      atau `/compact <instructions>` untuk memandu ringkasannya.

    - **Reset** (ID sesi baru untuk kunci chat yang sama):

      ```
      /new
      /reset
      ```

    Jika ini terus terjadi:

    - Aktifkan atau sesuaikan **session pruning** (`agents.defaults.contextPruning`) untuk memangkas output alat lama.
    - Gunakan model dengan jendela konteks yang lebih besar.

    Dokumen: [Compaction](/id/concepts/compaction), [Session pruning](/id/concepts/session-pruning), [Session management](/id/concepts/session).

  </Accordion>

  <Accordion title='Mengapa saya melihat "LLM request rejected: messages.content.tool_use.input field required"?'>
    Ini adalah error validasi provider: model mengeluarkan blok `tool_use` tanpa `input` yang diperlukan.
    Biasanya itu berarti riwayat sesi basi atau rusak (sering setelah thread panjang
    atau perubahan alat/skema).

    Perbaikan: mulai sesi baru dengan `/new` (pesan mandiri).

  </Accordion>

  <Accordion title="Mengapa saya mendapatkan pesan Heartbeat setiap 30 menit?">
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

    Jika `HEARTBEAT.md` ada tetapi pada dasarnya kosong (hanya baris kosong dan header
    markdown seperti `# Heading`), OpenClaw melewati eksekusi heartbeat untuk menghemat panggilan API.
    Jika file itu tidak ada, heartbeat tetap berjalan dan model memutuskan apa yang harus dilakukan.

    Override per-agent menggunakan `agents.list[].heartbeat`. Dokumen: [Heartbeat](/id/gateway/heartbeat).

  </Accordion>

  <Accordion title='Apakah saya perlu menambahkan "akun bot" ke grup WhatsApp?'>
    Tidak. OpenClaw berjalan di **akun Anda sendiri**, jadi jika Anda berada di grup itu, OpenClaw dapat melihatnya.
    Secara default, balasan grup diblokir sampai Anda mengizinkan pengirim (`groupPolicy: "allowlist"`).

    Jika Anda ingin hanya **Anda** yang dapat memicu balasan grup:

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
    Opsi 1 (tercepat): ikuti log dan kirim pesan uji di grup:

    ```bash
    openclaw logs --follow --json
    ```

    Cari `chatId` (atau `from`) yang berakhiran `@g.us`, seperti:
    `1234567890-1234567890@g.us`.

    Opsi 2 (jika sudah dikonfigurasi/di-allowlist): daftar grup dari config:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumen: [WhatsApp](/id/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Mengapa OpenClaw tidak membalas di grup?">
    Dua penyebab umum:

    - Pembatasan mention aktif (default). Anda harus @mention bot (atau cocok dengan `mentionPatterns`).
    - Anda mengonfigurasi `channels.whatsapp.groups` tanpa `"*"` dan grup tersebut tidak ada di allowlist.

    Lihat [Groups](/id/channels/groups) dan [Group messages](/id/channels/group-messages).

  </Accordion>

  <Accordion title="Apakah grup/thread berbagi konteks dengan DM?">
    Chat langsung secara default runtuh ke sesi utama. Grup/channel memiliki kunci sesi mereka sendiri, dan topik Telegram / thread Discord adalah sesi terpisah. Lihat [Groups](/id/channels/groups) dan [Group messages](/id/channels/group-messages).
  </Accordion>

  <Accordion title="Berapa banyak workspace dan agent yang bisa saya buat?">
    Tidak ada batas keras. Puluhan (bahkan ratusan) tidak masalah, tetapi perhatikan:

    - **Pertumbuhan disk:** sesi + transkrip berada di bawah `~/.openclaw/agents/<agentId>/sessions/`.
    - **Biaya token:** lebih banyak agent berarti lebih banyak penggunaan model secara bersamaan.
    - **Overhead operasional:** profil auth, workspace, dan routing channel per-agent.

    Tips:

    - Pertahankan satu workspace **aktif** per agent (`agents.defaults.workspace`).
    - Pangkas sesi lama (hapus entri JSONL atau store) jika disk membesar.
    - Gunakan `openclaw doctor` untuk menemukan workspace liar dan ketidakcocokan profil.

  </Accordion>

  <Accordion title="Bisakah saya menjalankan beberapa bot atau chat pada saat yang sama (Slack), dan bagaimana saya harus menyiapkannya?">
    Ya. Gunakan **Multi-Agent Routing** untuk menjalankan beberapa agent terisolasi dan merutekan pesan masuk berdasarkan
    channel/akun/peer. Slack didukung sebagai channel dan dapat diikat ke agent tertentu.

    Akses browser sangat kuat tetapi bukan "bisa melakukan apa pun yang bisa dilakukan manusia" - anti-bot, CAPTCHA, dan MFA tetap
    dapat memblokir otomatisasi. Untuk kontrol browser yang paling andal, gunakan Chrome MCP lokal di host,
    atau gunakan CDP di mesin yang benar-benar menjalankan browser.

    Penyiapan praktik terbaik:

    - Host Gateway yang selalu aktif (VPS/Mac mini).
    - Satu agent per peran (binding).
    - Channel Slack terikat ke agent-agent tersebut.
    - Browser lokal melalui Chrome MCP atau Node saat diperlukan.

    Dokumen: [Multi-Agent Routing](/id/concepts/multi-agent), [Slack](/id/channels/slack),
    [Browser](/id/tools/browser), [Nodes](/id/nodes).

  </Accordion>
</AccordionGroup>

## Models: default, pemilihan, alias, peralihan

<AccordionGroup>
  <Accordion title='Apa yang dimaksud dengan "model default"?'>
    Model default OpenClaw adalah apa pun yang Anda tetapkan sebagai:

    ```
    agents.defaults.model.primary
    ```

    Models direferensikan sebagai `provider/model` (contoh: `openai/gpt-5.4`). Jika Anda menghilangkan provider, OpenClaw pertama-tama mencoba alias, lalu kecocokan provider terkonfigurasi yang unik untuk ID model persis itu, dan baru setelah itu menggunakan fallback ke provider default yang dikonfigurasi sebagai jalur kompatibilitas usang. Jika provider itu tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw menggunakan fallback ke provider/model terkonfigurasi pertama alih-alih menampilkan default provider usang yang sudah dihapus. Anda tetap sebaiknya **secara eksplisit** menetapkan `provider/model`.

  </Accordion>

  <Accordion title="Model apa yang Anda rekomendasikan?">
    **Default yang direkomendasikan:** gunakan model generasi terbaru terkuat yang tersedia dalam tumpukan provider Anda.
    **Untuk agent dengan alat aktif atau input yang tidak tepercaya:** prioritaskan kekuatan model daripada biaya.
    **Untuk chat rutin/berisiko rendah:** gunakan model fallback yang lebih murah dan rute berdasarkan peran agent.

    MiniMax memiliki dokumennya sendiri: [MiniMax](/id/providers/minimax) dan
    [Local models](/id/gateway/local-models).

    Aturan praktis: gunakan **model terbaik yang mampu Anda bayar** untuk pekerjaan berisiko tinggi, dan model yang lebih murah
    untuk chat rutin atau ringkasan. Anda dapat merutekan model per agent dan menggunakan sub-agent untuk
    memparalelkan tugas panjang (setiap sub-agent mengonsumsi token). Lihat [Models](/id/concepts/models) dan
    [Sub-agents](/id/tools/subagents).

    Peringatan keras: model yang lebih lemah/terlalu terkuantisasi lebih rentan terhadap prompt
    injection dan perilaku tidak aman. Lihat [Security](/id/gateway/security).

    Konteks lebih lanjut: [Models](/id/concepts/models).

  </Accordion>

  <Accordion title="Bagaimana cara mengganti model tanpa menghapus config saya?">
    Gunakan **perintah model** atau edit hanya field **model**. Hindari penggantian config penuh.

    Opsi aman:

    - `/model` di chat (cepat, per sesi)
    - `openclaw models set ...` (hanya memperbarui config model)
    - `openclaw configure --section model` (interaktif)
    - edit `agents.defaults.model` di `~/.openclaw/openclaw.json`

    Hindari `config.apply` dengan objek parsial kecuali Anda memang ingin mengganti seluruh config.
    Untuk edit RPC, periksa dulu dengan `config.schema.lookup` dan lebih pilih `config.patch`. Payload lookup memberi Anda path yang dinormalisasi, dokumentasi/kendala skema dangkal, dan ringkasan child langsung
    untuk pembaruan parsial.
    Jika Anda memang menimpa config, pulihkan dari cadangan atau jalankan ulang `openclaw doctor` untuk memperbaikinya.

    Dokumen: [Models](/id/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/id/gateway/doctor).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan model self-hosted (llama.cpp, vLLM, Ollama)?">
    Ya. Ollama adalah jalur termudah untuk model lokal.

    Penyiapan tercepat:

    1. Instal Ollama dari `https://ollama.com/download`
    2. Tarik model lokal seperti `ollama pull gemma4`
    3. Jika Anda juga menginginkan model cloud, jalankan `ollama signin`
    4. Jalankan `openclaw onboard` dan pilih `Ollama`
    5. Pilih `Local` atau `Cloud + Local`

    Catatan:

    - `Cloud + Local` memberi Anda model cloud plus model Ollama lokal Anda
    - model cloud seperti `kimi-k2.5:cloud` tidak memerlukan pull lokal
    - untuk peralihan manual, gunakan `openclaw models list` dan `openclaw models set ollama/<model>`

    Catatan keamanan: model yang lebih kecil atau sangat terkuantisasi lebih rentan terhadap prompt
    injection. Kami sangat merekomendasikan **model besar** untuk bot apa pun yang dapat menggunakan alat.
    Jika Anda tetap menginginkan model kecil, aktifkan sandboxing dan allowlist alat yang ketat.

    Dokumen: [Ollama](/id/providers/ollama), [Local models](/id/gateway/local-models),
    [Model providers](/id/concepts/model-providers), [Security](/id/gateway/security),
    [Sandboxing](/id/gateway/sandboxing).

  </Accordion>

  <Accordion title="Model apa yang digunakan OpenClaw, Flawd, dan Krill?">
    - Deployment ini bisa berbeda dan dapat berubah dari waktu ke waktu; tidak ada rekomendasi provider yang tetap.
    - Periksa pengaturan runtime saat ini pada setiap gateway dengan `openclaw models status`.
    - Untuk agent yang sensitif terhadap keamanan/dengan alat aktif, gunakan model generasi terbaru terkuat yang tersedia.
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

    Anda dapat mencantumkan model yang tersedia dengan `/model`, `/model list`, atau `/model status`.

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
    Perintah ini juga menampilkan endpoint provider yang dikonfigurasi (`baseUrl`) dan mode API (`api`) bila tersedia.

    **Bagaimana cara melepas pin profil yang saya setel dengan @profile?**

    Jalankan kembali `/model` **tanpa** sufiks `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Jika Anda ingin kembali ke default, pilih dari `/model` (atau kirim `/model <default provider/model>`).
    Gunakan `/model status` untuk mengonfirmasi profil auth mana yang aktif.

  </Accordion>

  <Accordion title="Bisakah saya menggunakan GPT 5.2 untuk tugas harian dan Codex 5.3 untuk coding?">
    Ya. Tetapkan salah satu sebagai default dan ganti sesuai kebutuhan:

    - **Peralihan cepat (per sesi):** `/model gpt-5.4` untuk tugas harian, `/model openai-codex/gpt-5.4` untuk coding dengan Codex OAuth.
    - **Default + ganti:** setel `agents.defaults.model.primary` ke `openai/gpt-5.4`, lalu ganti ke `openai-codex/gpt-5.4` saat coding (atau sebaliknya).
    - **Sub-agent:** rute tugas coding ke sub-agent dengan model default yang berbeda.

    Lihat [Models](/id/concepts/models) dan [Slash commands](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bagaimana cara mengonfigurasi fast mode untuk GPT 5.4?">
    Gunakan toggle sesi atau default config:

    - **Per sesi:** kirim `/fast on` saat sesi menggunakan `openai/gpt-5.4` atau `openai-codex/gpt-5.4`.
    - **Default per model:** setel `agents.defaults.models["openai/gpt-5.4"].params.fastMode` ke `true`.
    - **Juga untuk Codex OAuth:** jika Anda juga menggunakan `openai-codex/gpt-5.4`, setel flag yang sama di sana.

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

    Untuk OpenAI, fast mode dipetakan ke `service_tier = "priority"` pada permintaan Responses native yang didukung. Override sesi `/fast` mengalahkan default config.

    Lihat [Thinking and fast mode](/id/tools/thinking) dan [OpenAI fast mode](/id/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Mengapa saya melihat "Model ... is not allowed" lalu tidak ada balasan?'>
    Jika `agents.defaults.models` disetel, itu menjadi **allowlist** untuk `/model` dan semua
    override sesi. Memilih model yang tidak ada dalam daftar itu akan mengembalikan:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Error itu dikembalikan **sebagai pengganti** balasan normal. Perbaikan: tambahkan model ke
    `agents.defaults.models`, hapus allowlist, atau pilih model dari `/model list`.

  </Accordion>

  <Accordion title='Mengapa saya melihat "Unknown model: minimax/MiniMax-M2.7"?'>
    Ini berarti **provider belum dikonfigurasi** (tidak ditemukan config provider MiniMax atau
    profil auth), sehingga model tidak dapat di-resolve.

    Daftar periksa perbaikan:

    1. Upgrade ke rilis OpenClaw terbaru (atau jalankan dari source `main`), lalu restart gateway.
    2. Pastikan MiniMax dikonfigurasi (wizard atau JSON), atau auth MiniMax
       ada di env/profil auth sehingga provider yang cocok dapat disuntikkan
       (`MINIMAX_API_KEY` untuk `minimax`, `MINIMAX_OAUTH_TOKEN` atau MiniMax
       OAuth tersimpan untuk `minimax-portal`).
    3. Gunakan ID model yang tepat (peka huruf besar-kecil) untuk jalur auth Anda:
       `minimax/MiniMax-M2.7` atau `minimax/MiniMax-M2.7-highspeed` untuk penyiapan
       kunci API, atau `minimax-portal/MiniMax-M2.7` /
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
    - Rute berdasarkan agent atau gunakan `/agent` untuk beralih

    Dokumen: [Models](/id/concepts/models), [Multi-Agent Routing](/id/concepts/multi-agent), [MiniMax](/id/providers/minimax), [OpenAI](/id/providers/openai).

  </Accordion>

  <Accordion title="Apakah opus / sonnet / gpt adalah shortcut bawaan?">
    Ya. OpenClaw menyediakan beberapa singkatan default (hanya diterapkan saat model tersebut ada di `agents.defaults.models`):

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

  <Accordion title="Bagaimana cara mendefinisikan/menimpa shortcut model (alias)?">
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

    Lalu `/model sonnet` (atau `/<alias>` saat didukung) akan di-resolve ke ID model tersebut.

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

    Jika Anda mereferensikan provider/model tetapi kunci provider yang diperlukan tidak ada, Anda akan mendapatkan error auth runtime (mis. `No API key found for provider "zai"`).

    **Tidak ada kunci API yang ditemukan untuk provider setelah menambahkan agent baru**

    Ini biasanya berarti **agent baru** memiliki penyimpanan auth kosong. Auth bersifat per-agent dan
    disimpan di:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opsi perbaikan:

    - Jalankan `openclaw agents add <id>` dan konfigurasi auth selama wizard.
    - Atau salin `auth-profiles.json` dari `agentDir` agent utama ke `agentDir` agent baru.

    **Jangan** gunakan ulang `agentDir` di beberapa agent; ini menyebabkan bentrokan auth/sesi.

  </Accordion>
</AccordionGroup>

## Failover model dan "All models failed"

<AccordionGroup>
  <Accordion title="Bagaimana cara kerja failover?">
    Failover terjadi dalam dua tahap:

    1. **Rotasi profil auth** dalam provider yang sama.
    2. **Fallback model** ke model berikutnya di `agents.defaults.model.fallbacks`.

    Cooldown berlaku untuk profil yang gagal (exponential backoff), sehingga OpenClaw dapat terus merespons bahkan saat provider terkena rate limit atau sementara gagal.

    Bucket rate limit mencakup lebih dari sekadar respons `429`. OpenClaw
    juga memperlakukan pesan seperti `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`, dan batas
    jendela penggunaan berkala (`weekly/monthly limit reached`) sebagai rate limit
    yang layak untuk failover.

    Beberapa respons yang tampak seperti penagihan bukan `402`, dan beberapa respons HTTP `402`
    juga tetap berada dalam bucket sementara itu. Jika provider mengembalikan
    teks penagihan eksplisit pada `401` atau `403`, OpenClaw tetap dapat menjaga itu
    di jalur penagihan, tetapi matcher teks khusus provider tetap dibatasi pada
    provider yang memilikinya (misalnya OpenRouter `Key limit exceeded`). Jika pesan `402`
    justru tampak seperti jendela penggunaan yang bisa dicoba ulang atau
    batas belanja organisasi/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw memperlakukannya sebagai
    `rate_limit`, bukan penonaktifan penagihan jangka panjang.

    Error luapan konteks berbeda: signature seperti
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, atau `ollama error: context length
    exceeded` tetap berada di jalur Compaction/coba ulang alih-alih memajukan
    fallback model.

    Teks error server generik sengaja dibuat lebih sempit daripada "apa pun yang
    memuat unknown/error". OpenClaw memang memperlakukan bentuk sementara yang dibatasi provider
    seperti `An unknown error occurred` polos dari Anthropic, `Provider returned error`
    polos dari OpenRouter, error stop-reason seperti `Unhandled stop reason:
    error`, payload JSON `api_error` dengan teks server sementara
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`), dan error provider sibuk seperti `ModelNotReadyException` sebagai
    sinyal timeout/kelebihan beban yang layak untuk failover saat konteks provider
    cocok.
    Teks fallback internal generik seperti `LLM request failed with an unknown
    error.` tetap konservatif dan tidak memicu fallback model sendirian.

  </Accordion>

  <Accordion title='Apa arti "No credentials found for profile anthropic:default"?'>
    Itu berarti sistem mencoba menggunakan ID profil auth `anthropic:default`, tetapi tidak dapat menemukan kredensial untuk profil itu di penyimpanan auth yang diharapkan.

    **Daftar periksa perbaikan:**

    - **Konfirmasi lokasi profil auth** (jalur baru vs lama)
      - Saat ini: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Lama: `~/.openclaw/agent/*` (dimigrasikan oleh `openclaw doctor`)
    - **Konfirmasi env var Anda dimuat oleh Gateway**
      - Jika Anda menetapkan `ANTHROPIC_API_KEY` di shell tetapi menjalankan Gateway melalui systemd/launchd, Gateway mungkin tidak mewarisinya. Masukkan ke `~/.openclaw/.env` atau aktifkan `env.shellEnv`.
    - **Pastikan Anda mengedit agent yang benar**
      - Penyiapan multi-agent berarti bisa ada beberapa file `auth-profiles.json`.
    - **Pemeriksaan kewarasan status model/auth**
      - Gunakan `openclaw models status` untuk melihat model yang dikonfigurasi dan apakah provider sudah diautentikasi.

    **Daftar periksa perbaikan untuk "No credentials found for profile anthropic"**

    Ini berarti eksekusi dipin ke profil auth Anthropic, tetapi Gateway
    tidak dapat menemukannya di penyimpanan auth.

    - **Gunakan Claude CLI**
      - Jalankan `openclaw models auth login --provider anthropic --method cli --set-default` pada host gateway.
    - **Jika Anda ingin menggunakan kunci API sebagai gantinya**
      - Masukkan `ANTHROPIC_API_KEY` ke `~/.openclaw/.env` pada **host gateway**.
      - Hapus urutan terpin yang memaksa profil yang hilang:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Konfirmasi Anda menjalankan perintah di host gateway**
      - Dalam mode remote, profil auth berada di mesin gateway, bukan di laptop Anda.

  </Accordion>

  <Accordion title="Mengapa OpenClaw juga mencoba Google Gemini lalu gagal?">
    Jika config model Anda menyertakan Google Gemini sebagai fallback (atau Anda beralih ke shorthand Gemini), OpenClaw akan mencobanya saat fallback model. Jika Anda belum mengonfigurasi kredensial Google, Anda akan melihat `No API key found for provider "google"`.

    Perbaikan: sediakan auth Google, atau hapus/hindari model Google di `agents.defaults.model.fallbacks` / alias agar fallback tidak diarahkan ke sana.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Penyebab: riwayat sesi berisi **blok thinking tanpa signature** (sering dari
    stream yang dibatalkan/parsial). Google Antigravity memerlukan signature untuk blok thinking.

    Perbaikan: OpenClaw sekarang menghapus blok thinking tanpa signature untuk Google Antigravity Claude. Jika masih muncul, mulai **sesi baru** atau setel `/thinking off` untuk agent tersebut.

  </Accordion>
</AccordionGroup>

## Profil auth: apa itu dan bagaimana mengelolanya

Terkait: [/concepts/oauth](/id/concepts/oauth) (alur OAuth, penyimpanan token, pola multi-akun)

<AccordionGroup>
  <Accordion title="Apa itu profil auth?">
    Profil auth adalah rekaman kredensial bernama (OAuth atau kunci API) yang terikat ke provider. Profil hidup di:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Seperti apa ID profil yang umum?">
    OpenClaw menggunakan ID dengan awalan provider seperti:

    - `anthropic:default` (umum saat tidak ada identitas email)
    - `anthropic:<email>` untuk identitas OAuth
    - ID kustom yang Anda pilih (mis. `anthropic:work`)

  </Accordion>

  <Accordion title="Bisakah saya mengontrol profil auth mana yang dicoba terlebih dahulu?">
    Ya. Config mendukung metadata opsional untuk profil dan urutan per provider (`auth.order.<provider>`). Ini **tidak** menyimpan secret; hanya memetakan ID ke provider/mode dan menetapkan urutan rotasi.

    OpenClaw dapat sementara melewati profil jika profil tersebut berada dalam **cooldown** singkat (rate limit/timeout/kegagalan auth) atau status **disabled** yang lebih lama (penagihan/kredit tidak cukup). Untuk memeriksanya, jalankan `openclaw models status --json` dan periksa `auth.unusableProfiles`. Penyetelan: `auth.cooldowns.billingBackoffHours*`.

    Cooldown rate limit dapat dibatasi pada model tertentu. Profil yang sedang cooldown
    untuk satu model masih bisa digunakan untuk model saudara pada provider yang sama,
    sementara jendela penagihan/disabled tetap memblokir seluruh profil.

    Anda juga dapat menetapkan override urutan **per-agent** (disimpan di `auth-state.json` agent itu) melalui CLI:

    ```bash
    # Default ke agent default yang dikonfigurasi (hilangkan --agent)
    openclaw models auth order get --provider anthropic

    # Kunci rotasi ke satu profil saja (coba hanya yang ini)
    openclaw models auth order set --provider anthropic anthropic:default

    # Atau tetapkan urutan eksplisit (fallback dalam provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Hapus override (fallback ke config auth.order / round-robin)
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
    `excluded_by_auth_order` untuk profil tersebut alih-alih mencobanya secara diam-diam.

  </Accordion>

  <Accordion title="OAuth vs kunci API - apa bedanya?">
    OpenClaw mendukung keduanya:

    - **OAuth** sering memanfaatkan akses langganan (bila berlaku).
    - **Kunci API** menggunakan penagihan bayar per token.

    Wizard secara eksplisit mendukung Anthropic Claude CLI, OpenAI Codex OAuth, dan kunci API.

  </Accordion>
</AccordionGroup>

## Gateway: port, "already running", dan mode remote

<AccordionGroup>
  <Accordion title="Port apa yang digunakan Gateway?">
    `gateway.port` mengontrol port tunggal yang dimultipleks untuk WebSocket + HTTP (Control UI, hooks, dll.).

    Prioritas:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Mengapa openclaw gateway status mengatakan "Runtime: running" tetapi "RPC probe: failed"?'>
    Karena "running" adalah pandangan **supervisor** (launchd/systemd/schtasks). RPC probe adalah CLI yang benar-benar terhubung ke Gateway WebSocket dan memanggil `status`.

    Gunakan `openclaw gateway status` dan percayai baris-baris ini:

    - `Probe target:` (URL yang benar-benar digunakan probe)
    - `Listening:` (apa yang benar-benar terikat pada port)
    - `Last gateway error:` (akar penyebab umum saat proses hidup tetapi port tidak listen)

  </Accordion>

  <Accordion title='Mengapa openclaw gateway status menampilkan "Config (cli)" dan "Config (service)" yang berbeda?'>
    Anda sedang mengedit satu file config sementara service menjalankan file lain (sering kali karena ketidakcocokan `--profile` / `OPENCLAW_STATE_DIR`).

    Perbaikan:

    ```bash
    openclaw gateway install --force
    ```

    Jalankan itu dari `--profile` / environment yang sama yang Anda ingin service gunakan.

  </Accordion>

  <Accordion title='Apa arti "another gateway instance is already listening"?'>
    OpenClaw menegakkan runtime lock dengan langsung melakukan bind pada listener WebSocket saat startup (default `ws://127.0.0.1:18789`). Jika bind gagal dengan `EADDRINUSE`, OpenClaw melempar `GatewayLockError` yang menunjukkan instance lain sudah sedang listen.

    Perbaikan: hentikan instance lain, bebaskan port, atau jalankan dengan `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Bagaimana cara menjalankan OpenClaw dalam mode remote (klien terhubung ke Gateway di tempat lain)?">
    Setel `gateway.mode: "remote"` dan arahkan ke URL WebSocket remote, opsional dengan kredensial remote shared-secret:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    Catatan:

    - `openclaw gateway` hanya mulai saat `gateway.mode` adalah `local` (atau Anda melewatkan flag override).
    - Aplikasi macOS mengawasi file config dan berpindah mode secara langsung saat nilai-nilai ini berubah.
    - `gateway.remote.token` / `.password` hanyalah kredensial remote sisi klien; keduanya tidak mengaktifkan auth gateway lokal dengan sendirinya.

  </Accordion>

  <Accordion title='Control UI menampilkan "unauthorized" (atau terus menyambung ulang). Sekarang bagaimana?'>
    Jalur auth gateway Anda dan metode auth UI tidak cocok.

    Fakta (dari kode):

    - Control UI menyimpan token di `sessionStorage` untuk sesi tab browser saat ini dan URL gateway yang dipilih, sehingga refresh di tab yang sama tetap berfungsi tanpa mengembalikan persistensi token `localStorage` jangka panjang.
    - Pada `AUTH_TOKEN_MISMATCH`, klien tepercaya dapat mencoba satu kali retry terbatas dengan token perangkat yang di-cache saat gateway mengembalikan petunjuk retry (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Retry token ter-cache itu sekarang menggunakan kembali scope yang disetujui dan disimpan bersama token perangkat. Pemanggil `deviceToken` eksplisit / `scopes` eksplisit tetap mempertahankan set scope yang diminta alih-alih mewarisi scope ter-cache.
    - Di luar jalur retry itu, prioritas auth koneksi adalah shared token/password eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token perangkat tersimpan, lalu bootstrap token.
    - Pemeriksaan scope bootstrap token memiliki prefiks per peran. Allowlist operator bootstrap bawaan hanya memenuhi permintaan operator; peran node atau peran non-operator lainnya tetap memerlukan scope di bawah prefiks peran mereka sendiri.

    Perbaikan:

    - Paling cepat: `openclaw dashboard` (mencetak + menyalin URL dashboard, mencoba membuka; menampilkan petunjuk SSH jika headless).
    - Jika Anda belum memiliki token: `openclaw doctor --generate-gateway-token`.
    - Jika remote, buat tunnel dulu: `ssh -N -L 18789:127.0.0.1:18789 user@host` lalu buka `http://127.0.0.1:18789/`.
    - Mode shared-secret: setel `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` atau `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, lalu tempel secret yang cocok di pengaturan Control UI.
    - Mode Tailscale Serve: pastikan `gateway.auth.allowTailscale` diaktifkan dan Anda membuka URL Serve, bukan URL loopback/tailnet mentah yang melewati header identitas Tailscale.
    - Mode trusted-proxy: pastikan Anda masuk melalui proxy sadar identitas non-loopback yang dikonfigurasi, bukan proxy loopback pada host yang sama atau URL gateway mentah.
    - Jika ketidakcocokan tetap ada setelah satu retry, rotasi/setujui ulang token perangkat yang dipasangkan:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Jika panggilan rotate itu mengatakan ditolak, periksa dua hal:
      - sesi perangkat yang dipasangkan hanya dapat merotasi **perangkatnya sendiri** kecuali juga memiliki `operator.admin`
      - nilai `--scope` eksplisit tidak boleh melebihi scope operator saat ini milik pemanggil
    - Masih buntu? Jalankan `openclaw status --all` dan ikuti [Troubleshooting](/id/gateway/troubleshooting). Lihat [Dashboard](/web/dashboard) untuk detail auth.

  </Accordion>

  <Accordion title="Saya menetapkan gateway.bind tailnet tetapi tidak bisa bind dan tidak ada yang listen">
    Bind `tailnet` memilih IP Tailscale dari antarmuka jaringan Anda (100.64.0.0/10). Jika mesin tidak berada di Tailscale (atau antarmukanya mati), tidak ada yang bisa di-bind.

    Perbaikan:

    - Jalankan Tailscale di host tersebut (agar memiliki alamat 100.x), atau
    - Beralih ke `gateway.bind: "loopback"` / `"lan"`.

    Catatan: `tailnet` bersifat eksplisit. `auto` lebih memilih loopback; gunakan `gateway.bind: "tailnet"` saat Anda menginginkan bind khusus tailnet.

  </Accordion>

  <Accordion title="Bisakah saya menjalankan beberapa Gateway di host yang sama?">
    Biasanya tidak - satu Gateway dapat menjalankan beberapa messaging channel dan agent. Gunakan beberapa Gateway hanya ketika Anda membutuhkan redundansi (mis.: bot penyelamat) atau isolasi keras.

    Ya, tetapi Anda harus mengisolasi:

    - `OPENCLAW_CONFIG_PATH` (config per instance)
    - `OPENCLAW_STATE_DIR` (state per instance)
    - `agents.defaults.workspace` (isolasi workspace)
    - `gateway.port` (port unik)

    Penyiapan cepat (direkomendasikan):

    - Gunakan `openclaw --profile <name> ...` per instance (otomatis membuat `~/.openclaw-<name>`).
    - Setel `gateway.port` unik di setiap config profil (atau berikan `--port` untuk eksekusi manual).
    - Instal service per profil: `openclaw --profile <name> gateway install`.

    Profil juga memberi sufiks pada nama service (`ai.openclaw.<profile>`; lama `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Panduan lengkap: [Multiple gateways](/id/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Apa arti "invalid handshake" / code 1008?'>
    Gateway adalah **server WebSocket**, dan mengharapkan pesan pertama
    berupa frame `connect`. Jika menerima hal lain, Gateway menutup koneksi
    dengan **code 1008** (pelanggaran kebijakan).

    Penyebab umum:

    - Anda membuka URL **HTTP** di browser (`http://...`) alih-alih klien WS.
    - Anda menggunakan port atau path yang salah.
    - Proxy atau tunnel menghapus header auth atau mengirim permintaan non-Gateway.

    Perbaikan cepat:

    1. Gunakan URL WS: `ws://<host>:18789` (atau `wss://...` jika HTTPS).
    2. Jangan buka port WS di tab browser biasa.
    3. Jika auth aktif, sertakan token/kata sandi dalam frame `connect`.

    Jika Anda menggunakan CLI atau TUI, URL-nya seharusnya terlihat seperti:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Detail protokol: [Gateway protocol](/id/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Logging dan debugging

<AccordionGroup>
  <Accordion title="Di mana log berada?">
    Log file (terstruktur):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Anda dapat menetapkan jalur stabil melalui `logging.file`. Level log file dikendalikan oleh `logging.level`. Verbositas konsol dikendalikan oleh `--verbose` dan `logging.consoleLevel`.

    Ikuti log tercepat:

    ```bash
    openclaw logs --follow
    ```

    Log service/supervisor (saat gateway berjalan melalui launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` dan `gateway.err.log` (default: `~/.openclaw/logs/...`; profil menggunakan `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Lihat [Troubleshooting](/id/gateway/troubleshooting) untuk lebih lanjut.

  </Accordion>

  <Accordion title="Bagaimana cara memulai/menghentikan/me-restart service Gateway?">
    Gunakan helper gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Jika Anda menjalankan gateway secara manual, `openclaw gateway --force` dapat mengambil alih kembali port. Lihat [Gateway](/id/gateway).

  </Accordion>

  <Accordion title="Saya menutup terminal saya di Windows - bagaimana cara me-restart OpenClaw?">
    Ada **dua mode instalasi Windows**:

    **1) WSL2 (direkomendasikan):** Gateway berjalan di dalam Linux.

    Buka PowerShell, masuk ke WSL, lalu restart:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Jika Anda tidak pernah menginstal service, mulai di foreground:

    ```bash
    openclaw gateway run
    ```

    **2) Windows native (tidak direkomendasikan):** Gateway berjalan langsung di Windows.

    Buka PowerShell dan jalankan:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Jika Anda menjalankannya secara manual (tanpa service), gunakan:

    ```powershell
    openclaw gateway run
    ```

    Dokumen: [Windows (WSL2)](/id/platforms/windows), [Gateway service runbook](/id/gateway).

  </Accordion>

  <Accordion title="Gateway aktif tetapi balasan tidak pernah datang. Apa yang harus saya periksa?">
    Mulailah dengan pemeriksaan kesehatan cepat:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Penyebab umum:

    - Auth model tidak dimuat di **host gateway** (periksa `models status`).
    - Pairing/allowlist channel memblokir balasan (periksa config channel + log).
    - WebChat/Dashboard terbuka tanpa token yang benar.

    Jika Anda berada di remote, pastikan koneksi tunnel/Tailscale aktif dan
    Gateway WebSocket dapat dijangkau.

    Dokumen: [Channels](/id/channels), [Troubleshooting](/id/gateway/troubleshooting), [Remote access](/id/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - sekarang bagaimana?'>
    Biasanya ini berarti UI kehilangan koneksi WebSocket. Periksa:

    1. Apakah Gateway berjalan? `openclaw gateway status`
    2. Apakah Gateway sehat? `openclaw status`
    3. Apakah UI memiliki token yang benar? `openclaw dashboard`
    4. Jika remote, apakah tautan tunnel/Tailscale aktif?

    Lalu ikuti log:

    ```bash
    openclaw logs --follow
    ```

    Dokumen: [Dashboard](/web/dashboard), [Remote access](/id/gateway/remote), [Troubleshooting](/id/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands gagal. Apa yang harus saya periksa?">
    Mulailah dengan log dan status channel:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Lalu cocokkan error-nya:

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram memiliki terlalu banyak entri. OpenClaw sudah memangkas hingga batas Telegram dan mencoba ulang dengan lebih sedikit perintah, tetapi beberapa entri menu tetap perlu dibuang. Kurangi perintah plugin/skill/kustom, atau nonaktifkan `channels.telegram.commands.native` jika Anda tidak memerlukan menu itu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, atau error jaringan serupa: jika Anda berada di VPS atau di belakang proxy, pastikan HTTPS keluar diizinkan dan DNS berfungsi untuk `api.telegram.org`.

    Jika Gateway berada di remote, pastikan Anda melihat log di host Gateway.

    Dokumen: [Telegram](/id/channels/telegram), [Channel troubleshooting](/id/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI tidak menampilkan output. Apa yang harus saya periksa?">
    Pertama, pastikan Gateway dapat dijangkau dan agent bisa berjalan:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Di TUI, gunakan `/status` untuk melihat keadaan saat ini. Jika Anda mengharapkan balasan di channel
    chat, pastikan pengiriman diaktifkan (`/deliver on`).

    Dokumen: [TUI](/web/tui), [Slash commands](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bagaimana cara menghentikan sepenuhnya lalu memulai Gateway?">
    Jika Anda menginstal service:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Ini menghentikan/memulai **service yang diawasi** (launchd di macOS, systemd di Linux).
    Gunakan ini saat Gateway berjalan di latar belakang sebagai daemon.

    Jika Anda menjalankannya di foreground, hentikan dengan Ctrl-C, lalu:

    ```bash
    openclaw gateway run
    ```

    Dokumen: [Gateway service runbook](/id/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: me-restart **service latar belakang** (launchd/systemd).
    - `openclaw gateway`: menjalankan gateway **di foreground** untuk sesi terminal ini.

    Jika Anda menginstal service, gunakan perintah gateway. Gunakan `openclaw gateway` saat
    Anda menginginkan satu eksekusi foreground.

  </Accordion>

  <Accordion title="Cara tercepat untuk mendapatkan detail lebih banyak saat sesuatu gagal">
    Mulai Gateway dengan `--verbose` untuk mendapatkan detail konsol lebih banyak. Lalu periksa file log untuk auth channel, routing model, dan error RPC.
  </Accordion>
</AccordionGroup>

## Media dan lampiran

<AccordionGroup>
  <Accordion title="Skill saya menghasilkan gambar/PDF, tetapi tidak ada yang dikirim">
    Lampiran keluar dari agent harus menyertakan baris `MEDIA:<path-or-url>` (di barisnya sendiri). Lihat [OpenClaw assistant setup](/id/start/openclaw) dan [Agent send](/id/tools/agent-send).

    Pengiriman CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Periksa juga:

    - Channel target mendukung media keluar dan tidak diblokir oleh allowlist.
    - File berada dalam batas ukuran provider (gambar diubah ukurannya menjadi maksimum 2048px).
    - `tools.fs.workspaceOnly=true` menjaga pengiriman jalur lokal tetap terbatas pada workspace, temp/media-store, dan file yang divalidasi sandbox.
    - `tools.fs.workspaceOnly=false` membuat `MEDIA:` dapat mengirim file lokal host yang sudah dapat dibaca agent, tetapi hanya untuk media plus tipe dokumen aman (gambar, audio, video, PDF, dan dokumen Office). File teks biasa dan file mirip secret tetap diblokir.

    Lihat [Images](/id/nodes/images).

  </Accordion>
</AccordionGroup>

## Keamanan dan kontrol akses

<AccordionGroup>
  <Accordion title="Apakah aman mengekspos OpenClaw ke DM masuk?">
    Perlakukan DM masuk sebagai input yang tidak tepercaya. Default dirancang untuk mengurangi risiko:

    - Perilaku default pada channel yang mendukung DM adalah **pairing**:
      - Pengirim yang tidak dikenal menerima kode pairing; bot tidak memproses pesan mereka.
      - Setujui dengan: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Permintaan tertunda dibatasi hingga **3 per channel**; periksa `openclaw pairing list --channel <channel> [--account <id>]` jika kode tidak sampai.
    - Membuka DM secara publik memerlukan opt-in eksplisit (`dmPolicy: "open"` dan allowlist `"*"`).

    Jalankan `openclaw doctor` untuk menampilkan kebijakan DM yang berisiko.

  </Accordion>

  <Accordion title="Apakah prompt injection hanya menjadi perhatian untuk bot publik?">
    Tidak. Prompt injection berkaitan dengan **konten yang tidak tepercaya**, bukan hanya siapa yang bisa mengirim DM ke bot.
    Jika asisten Anda membaca konten eksternal (web search/fetch, halaman browser, email,
    docs, lampiran, log yang ditempel), konten itu dapat menyertakan instruksi yang mencoba
    membajak model. Ini bisa terjadi bahkan jika **Anda adalah satu-satunya pengirim**.

    Risiko terbesar muncul saat alat diaktifkan: model dapat ditipu untuk
    mengekstrak konteks atau memanggil alat atas nama Anda. Kurangi radius ledakan dengan:

    - menggunakan agent "reader" baca-saja atau tanpa alat untuk merangkum konten yang tidak tepercaya
    - menjaga `web_search` / `web_fetch` / `browser` tetap mati untuk agent dengan alat aktif
    - memperlakukan teks file/dokumen yang telah didekode juga sebagai tidak tepercaya: OpenResponses
      `input_file` dan ekstraksi lampiran media sama-sama membungkus teks yang diekstrak dalam
      penanda batas konten eksternal yang eksplisit alih-alih meneruskan teks file mentah
    - sandboxing dan allowlist alat yang ketat

    Detail: [Security](/id/gateway/security).

  </Accordion>

  <Accordion title="Apakah bot saya sebaiknya memiliki email, akun GitHub, atau nomor telepon sendiri?">
    Ya, untuk sebagian besar penyiapan. Mengisolasi bot dengan akun dan nomor telepon terpisah
    mengurangi radius ledakan jika terjadi sesuatu yang salah. Ini juga memudahkan untuk merotasi
    kredensial atau mencabut akses tanpa memengaruhi akun pribadi Anda.

    Mulailah dari yang kecil. Beri akses hanya ke alat dan akun yang benar-benar Anda butuhkan, lalu perluas
    nanti jika diperlukan.

    Dokumen: [Security](/id/gateway/security), [Pairing](/id/channels/pairing).

  </Accordion>

  <Accordion title="Bisakah saya memberinya otonomi atas pesan teks saya dan apakah itu aman?">
    Kami **tidak** merekomendasikan otonomi penuh atas pesan pribadi Anda. Pola paling aman adalah:

    - Pertahankan DM dalam **mode pairing** atau allowlist yang ketat.
    - Gunakan **nomor atau akun terpisah** jika Anda ingin bot mengirim pesan atas nama Anda.
    - Biarkan bot membuat draf, lalu **setujui sebelum mengirim**.

    Jika Anda ingin bereksperimen, lakukan itu pada akun khusus dan tetap isolasikan. Lihat
    [Security](/id/gateway/security).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan model yang lebih murah untuk tugas asisten pribadi?">
    Ya, **jika** agent hanya untuk chat dan input-nya tepercaya. Tingkatan yang lebih kecil
    lebih rentan terhadap pembajakan instruksi, jadi hindari untuk agent dengan alat aktif
    atau saat membaca konten yang tidak tepercaya. Jika Anda harus menggunakan model yang lebih kecil, kunci
    alat dan jalankan di dalam sandbox. Lihat [Security](/id/gateway/security).
  </Accordion>

  <Accordion title="Saya menjalankan /start di Telegram tetapi tidak mendapatkan kode pairing">
    Kode pairing dikirim **hanya** ketika pengirim yang tidak dikenal mengirim pesan ke bot dan
    `dmPolicy: "pairing"` diaktifkan. `/start` sendiri tidak menghasilkan kode.

    Periksa permintaan tertunda:

    ```bash
    openclaw pairing list telegram
    ```

    Jika Anda ingin akses langsung, masukkan sender id Anda ke allowlist atau setel `dmPolicy: "open"`
    untuk akun tersebut.

  </Accordion>

  <Accordion title="WhatsApp: apakah ini akan mengirim pesan ke kontak saya? Bagaimana cara kerja pairing?">
    Tidak. Kebijakan DM WhatsApp default adalah **pairing**. Pengirim yang tidak dikenal hanya mendapat kode pairing dan pesan mereka **tidak diproses**. OpenClaw hanya membalas chat yang diterimanya atau pengiriman eksplisit yang Anda picu.

    Setujui pairing dengan:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Daftar permintaan tertunda:

    ```bash
    openclaw pairing list whatsapp
    ```

    Prompt nomor telepon di wizard: ini digunakan untuk menetapkan **allowlist/owner** Anda sehingga DM Anda sendiri diizinkan. Ini tidak digunakan untuk pengiriman otomatis. Jika Anda menjalankan pada nomor WhatsApp pribadi Anda, gunakan nomor itu dan aktifkan `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Perintah chat, membatalkan tugas, dan "tidak mau berhenti"

<AccordionGroup>
  <Accordion title="Bagaimana cara menghentikan pesan sistem internal agar tidak muncul di chat?">
    Sebagian besar pesan internal atau alat hanya muncul ketika **verbose**, **trace**, atau **reasoning** diaktifkan
    untuk sesi tersebut.

    Perbaiki di chat tempat Anda melihatnya:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Jika masih berisik, periksa pengaturan sesi di Control UI dan setel verbose
    ke **inherit**. Pastikan juga Anda tidak menggunakan profil bot dengan `verboseDefault` yang disetel
    ke `on` di config.

    Dokumen: [Thinking and verbose](/id/tools/thinking), [Security](/id/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Bagaimana cara menghentikan/membatalkan tugas yang sedang berjalan?">
    Kirim salah satu dari ini **sebagai pesan mandiri** (tanpa slash):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    Ini adalah pemicu pembatalan (bukan slash command).

    Untuk proses latar belakang (dari alat exec), Anda dapat meminta agent menjalankan:

    ```
    process action:kill sessionId:XXX
    ```

    Ikhtisar slash command: lihat [Slash commands](/id/tools/slash-commands).

    Sebagian besar perintah harus dikirim sebagai **pesan mandiri** yang diawali dengan `/`, tetapi beberapa shortcut (seperti `/status`) juga berfungsi inline untuk pengirim yang ada di allowlist.

  </Accordion>

  <Accordion title='Bagaimana cara mengirim pesan Discord dari Telegram? ("Cross-context messaging denied")'>
    OpenClaw memblokir pengiriman pesan **lintas-provider** secara default. Jika pemanggilan alat terikat
    ke Telegram, OpenClaw tidak akan mengirim ke Discord kecuali Anda secara eksplisit mengizinkannya.

    Aktifkan pengiriman lintas-provider untuk agent:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    Restart gateway setelah mengedit config.

  </Accordion>

  <Accordion title='Mengapa rasanya bot "mengabaikan" pesan yang datang cepat bertubi-tubi?'>
    Mode antrean mengontrol bagaimana pesan baru berinteraksi dengan eksekusi yang sedang berjalan. Gunakan `/queue` untuk mengubah mode:

    - `steer` - pesan baru mengalihkan tugas saat ini
    - `followup` - jalankan pesan satu per satu
    - `collect` - kumpulkan pesan dan balas sekali (default)
    - `steer-backlog` - alihkan sekarang, lalu proses backlog
    - `interrupt` - batalkan eksekusi saat ini dan mulai dari awal

    Anda dapat menambahkan opsi seperti `debounce:2s cap:25 drop:summarize` untuk mode followup.

  </Accordion>
</AccordionGroup>

## Lain-lain

<AccordionGroup>
  <Accordion title='Apa model default untuk Anthropic dengan kunci API?'>
    Di OpenClaw, kredensial dan pemilihan model dipisahkan. Menetapkan `ANTHROPIC_API_KEY` (atau menyimpan kunci API Anthropic dalam profil auth) mengaktifkan autentikasi, tetapi model default yang sebenarnya adalah apa pun yang Anda konfigurasikan di `agents.defaults.model.primary` (misalnya, `anthropic/claude-sonnet-4-6` atau `anthropic/claude-opus-4-6`). Jika Anda melihat `No credentials found for profile "anthropic:default"`, artinya Gateway tidak dapat menemukan kredensial Anthropic di `auth-profiles.json` yang diharapkan untuk agent yang sedang berjalan.
  </Accordion>
</AccordionGroup>

---

Masih buntu? Tanyakan di [Discord](https://discord.com/invite/clawd) atau buka [diskusi GitHub](https://github.com/openclaw/openclaw/discussions).
