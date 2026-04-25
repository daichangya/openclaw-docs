---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Cara kerja sandboxing OpenClaw: mode, cakupan, akses workspace, dan image'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-25T13:47:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f22778690a4d41033c7abf9e97d54e53163418f8d45f1a816ce2be9d124fedf
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw dapat menjalankan **tool di dalam backend sandbox** untuk mengurangi blast radius.
Ini **opsional** dan dikontrol oleh konfigurasi (`agents.defaults.sandbox` atau
`agents.list[].sandbox`). Jika sandboxing nonaktif, tool berjalan di host.
Gateway tetap berada di host; eksekusi tool berjalan di sandbox terisolasi
saat diaktifkan.

Ini bukan batas keamanan yang sempurna, tetapi secara material membatasi akses
filesystem dan proses ketika model melakukan sesuatu yang bodoh.

## Apa yang di-sandbox

- Eksekusi tool (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, dll.).
- Browser sandbox opsional (`agents.defaults.sandbox.browser`).
  - Secara default, browser sandbox otomatis memulai (memastikan CDP dapat dijangkau) saat tool browser membutuhkannya.
    Konfigurasikan melalui `agents.defaults.sandbox.browser.autoStart` dan `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Secara default, container browser sandbox menggunakan jaringan Docker khusus (`openclaw-sandbox-browser`) alih-alih jaringan `bridge` global.
    Konfigurasikan dengan `agents.defaults.sandbox.browser.network`.
  - `agents.defaults.sandbox.browser.cdpSourceRange` opsional membatasi ingress CDP di tepi container dengan allowlist CIDR (misalnya `172.21.0.1/32`).
  - Akses pengamat noVNC dilindungi kata sandi secara default; OpenClaw memancarkan URL token jangka pendek yang menyajikan halaman bootstrap lokal dan membuka noVNC dengan kata sandi di fragmen URL (bukan di log kueri/header).
  - `agents.defaults.sandbox.browser.allowHostControl` memungkinkan sesi sandbox menargetkan browser host secara eksplisit.
  - Allowlist opsional mengendalikan `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Tidak di-sandbox:

- Proses Gateway itu sendiri.
- Tool apa pun yang secara eksplisit diizinkan berjalan di luar sandbox (mis. `tools.elevated`).
  - **Elevated exec melewati sandboxing dan menggunakan jalur escape yang dikonfigurasi (`gateway` secara default, atau `node` ketika target exec adalah `node`).**
  - Jika sandboxing nonaktif, `tools.elevated` tidak mengubah eksekusi (sudah di host). Lihat [Elevated Mode](/id/tools/elevated).

## Mode

`agents.defaults.sandbox.mode` mengontrol **kapan** sandboxing digunakan:

- `"off"`: tidak ada sandboxing.
- `"non-main"`: sandbox hanya sesi **non-main** (default jika Anda ingin chat normal di host).
- `"all"`: setiap sesi berjalan di sandbox.
  Catatan: `"non-main"` didasarkan pada `session.mainKey` (default `"main"`), bukan ID agen.
  Sesi grup/channel menggunakan kuncinya sendiri, sehingga dihitung sebagai non-main dan akan di-sandbox.

## Cakupan

`agents.defaults.sandbox.scope` mengontrol **berapa banyak container** yang dibuat:

- `"agent"` (default): satu container per agen.
- `"session"`: satu container per sesi.
- `"shared"`: satu container yang dibagikan oleh semua sesi yang di-sandbox.

## Backend

`agents.defaults.sandbox.backend` mengontrol **runtime mana** yang menyediakan sandbox:

- `"docker"` (default saat sandboxing diaktifkan): runtime sandbox lokal berbasis Docker.
- `"ssh"`: runtime sandbox jarak jauh generik berbasis SSH.
- `"openshell"`: runtime sandbox berbasis OpenShell.

Konfigurasi khusus SSH berada di bawah `agents.defaults.sandbox.ssh`.
Konfigurasi khusus OpenShell berada di bawah `plugins.entries.openshell.config`.

### Memilih backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Tempat berjalan** | Container lokal                  | Host apa pun yang dapat diakses via SSH | Sandbox yang dikelola OpenShell               |
| **Penyiapan**       | `scripts/sandbox-setup.sh`       | Kunci SSH + host target        | Plugin OpenShell diaktifkan                         |
| **Model workspace** | Bind-mount atau salin            | Remote-canonical (seed sekali) | `mirror` atau `remote`                              |
| **Kontrol jaringan** | `docker.network` (default: none) | Bergantung pada host jarak jauh | Bergantung pada OpenShell                           |
| **Browser sandbox** | Didukung                         | Tidak didukung                 | Belum didukung                                      |
| **Bind mount**      | `docker.binds`                   | T/A                            | T/A                                                 |
| **Paling cocok untuk** | Dev lokal, isolasi penuh      | Offload ke mesin jarak jauh    | Sandbox jarak jauh terkelola dengan sinkronisasi dua arah opsional |

### Backend Docker

Sandboxing nonaktif secara default. Jika Anda mengaktifkan sandboxing dan tidak memilih
backend, OpenClaw menggunakan backend Docker. Backend ini mengeksekusi tool dan browser sandbox
secara lokal melalui socket daemon Docker (`/var/run/docker.sock`). Isolasi container sandbox
ditentukan oleh namespace Docker.

**Kendala Docker-out-of-Docker (DooD)**:
Jika Anda men-deploy OpenClaw Gateway itu sendiri sebagai container Docker, Gateway akan mengorkestrasi container sandbox saudara menggunakan socket Docker host (DooD). Ini memperkenalkan kendala pemetaan jalur tertentu:

- **Konfigurasi Memerlukan Jalur Host**: Konfigurasi `workspace` dalam `openclaw.json` HARUS berisi **jalur absolut Host** (misalnya `/home/user/.openclaw/workspaces`), bukan jalur internal container Gateway. Saat OpenClaw meminta daemon Docker untuk membuat sandbox, daemon mengevaluasi jalur relatif terhadap namespace OS Host, bukan namespace Gateway.
- **Paritas Jembatan FS (Peta Volume Identik)**: Proses native OpenClaw Gateway juga menulis file heartbeat dan bridge ke direktori `workspace`. Karena Gateway mengevaluasi string yang sama persis (jalur host) dari dalam lingkungan ter-container-nya sendiri, deployment Gateway HARUS menyertakan peta volume identik yang menautkan namespace host secara native (`-v /home/user/.openclaw:/home/user/.openclaw`).

Jika Anda memetakan jalur secara internal tanpa paritas host absolut, OpenClaw secara native akan melempar error izin `EACCES` saat mencoba menulis heartbeat di dalam lingkungan container karena string jalur yang sepenuhnya memenuhi syarat tersebut tidak ada secara native.

### Backend SSH

Gunakan `backend: "ssh"` saat Anda ingin OpenClaw men-sandbox `exec`, tool file, dan pembacaan media pada
mesin arbitrer yang dapat diakses via SSH.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Atau gunakan SecretRef / konten inline alih-alih file lokal:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Cara kerjanya:

- OpenClaw membuat root jarak jauh per cakupan di bawah `sandbox.ssh.workspaceRoot`.
- Pada penggunaan pertama setelah create atau recreate, OpenClaw melakukan seed workspace jarak jauh tersebut dari workspace lokal sekali.
- Setelah itu, `exec`, `read`, `write`, `edit`, `apply_patch`, pembacaan media prompt, dan staging media masuk berjalan langsung terhadap workspace jarak jauh melalui SSH.
- OpenClaw tidak menyinkronkan perubahan jarak jauh kembali ke workspace lokal secara otomatis.

Materi autentikasi:

- `identityFile`, `certificateFile`, `knownHostsFile`: gunakan file lokal yang ada dan teruskan melalui konfigurasi OpenSSH.
- `identityData`, `certificateData`, `knownHostsData`: gunakan string inline atau SecretRef. OpenClaw me-resolve-nya melalui snapshot runtime secrets normal, menuliskannya ke file temp dengan `0600`, dan menghapusnya saat sesi SSH berakhir.
- Jika `*File` dan `*Data` keduanya ditetapkan untuk item yang sama, `*Data` menang untuk sesi SSH tersebut.

Ini adalah model **remote-canonical**. Workspace SSH jarak jauh menjadi state sandbox yang sebenarnya setelah seed awal.

Konsekuensi penting:

- Edit lokal host yang dibuat di luar OpenClaw setelah langkah seed tidak terlihat secara jarak jauh sampai Anda membuat ulang sandbox.
- `openclaw sandbox recreate` menghapus root jarak jauh per cakupan dan melakukan seed lagi dari lokal pada penggunaan berikutnya.
- Browser sandbox tidak didukung pada backend SSH.
- Pengaturan `sandbox.docker.*` tidak berlaku untuk backend SSH.

### Backend OpenShell

Gunakan `backend: "openshell"` saat Anda ingin OpenClaw men-sandbox tool di lingkungan
jarak jauh yang dikelola OpenShell. Untuk panduan penyiapan lengkap, referensi
konfigurasi, dan perbandingan mode workspace, lihat halaman khusus
[OpenShell](/id/gateway/openshell).

OpenShell menggunakan ulang transport SSH inti yang sama dan jembatan filesystem jarak jauh seperti
backend SSH generik, dan menambahkan lifecycle khusus OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`) ditambah mode workspace `mirror`
opsional.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

Mode OpenShell:

- `mirror` (default): workspace lokal tetap kanonis. OpenClaw menyinkronkan file lokal ke OpenShell sebelum exec dan menyinkronkan workspace jarak jauh kembali setelah exec.
- `remote`: workspace OpenShell menjadi kanonis setelah sandbox dibuat. OpenClaw melakukan seed workspace jarak jauh sekali dari workspace lokal, lalu tool file dan exec berjalan langsung terhadap sandbox jarak jauh tanpa menyinkronkan perubahan kembali.

Detail transport jarak jauh:

- OpenClaw meminta OpenShell untuk konfigurasi SSH khusus sandbox melalui `openshell sandbox ssh-config <name>`.
- Inti menulis konfigurasi SSH tersebut ke file temp, membuka sesi SSH, dan menggunakan ulang jembatan filesystem jarak jauh yang sama seperti `backend: "ssh"`.
- Hanya pada mode `mirror` lifecycle berbeda: sinkronkan lokal ke jarak jauh sebelum exec, lalu sinkronkan kembali setelah exec.

Keterbatasan OpenShell saat ini:

- browser sandbox belum didukung
- `sandbox.docker.binds` tidak didukung pada backend OpenShell
- pengaturan runtime khusus Docker di bawah `sandbox.docker.*` tetap hanya berlaku untuk backend Docker

#### Mode workspace

OpenShell memiliki dua model workspace. Inilah bagian yang paling penting dalam praktik.

##### `mirror`

Gunakan `plugins.entries.openshell.config.mode: "mirror"` saat Anda ingin **workspace lokal tetap kanonis**.

Perilaku:

- Sebelum `exec`, OpenClaw menyinkronkan workspace lokal ke sandbox OpenShell.
- Setelah `exec`, OpenClaw menyinkronkan workspace jarak jauh kembali ke workspace lokal.
- Tool file tetap beroperasi melalui jembatan sandbox, tetapi workspace lokal tetap menjadi sumber kebenaran antar giliran.

Gunakan ini saat:

- Anda mengedit file secara lokal di luar OpenClaw dan ingin perubahan tersebut otomatis muncul di sandbox
- Anda ingin sandbox OpenShell berperilaku semirip mungkin dengan backend Docker
- Anda ingin workspace host mencerminkan penulisan sandbox setelah setiap giliran exec

Trade-off:

- biaya sinkronisasi tambahan sebelum dan sesudah exec

##### `remote`

Gunakan `plugins.entries.openshell.config.mode: "remote"` saat Anda ingin **workspace OpenShell menjadi kanonis**.

Perilaku:

- Saat sandbox pertama kali dibuat, OpenClaw melakukan seed workspace jarak jauh dari workspace lokal sekali.
- Setelah itu, `exec`, `read`, `write`, `edit`, dan `apply_patch` beroperasi langsung terhadap workspace OpenShell jarak jauh.
- OpenClaw **tidak** menyinkronkan perubahan jarak jauh kembali ke workspace lokal setelah exec.
- Pembacaan media saat prompt tetap berfungsi karena tool file dan media membaca melalui jembatan sandbox alih-alih mengasumsikan jalur host lokal.
- Transport menggunakan SSH ke sandbox OpenShell yang dikembalikan oleh `openshell sandbox ssh-config`.

Konsekuensi penting:

- Jika Anda mengedit file di host di luar OpenClaw setelah langkah seed, sandbox jarak jauh **tidak** akan melihat perubahan tersebut secara otomatis.
- Jika sandbox dibuat ulang, workspace jarak jauh di-seed ulang dari workspace lokal.
- Dengan `scope: "agent"` atau `scope: "shared"`, workspace jarak jauh tersebut dibagikan pada cakupan yang sama.

Gunakan ini saat:

- sandbox seharusnya hidup terutama di sisi OpenShell jarak jauh
- Anda menginginkan overhead sinkronisasi per giliran yang lebih rendah
- Anda tidak ingin edit lokal host diam-diam menimpa state sandbox jarak jauh

Pilih `mirror` jika Anda menganggap sandbox sebagai lingkungan eksekusi sementara.
Pilih `remote` jika Anda menganggap sandbox sebagai workspace yang sebenarnya.

#### Lifecycle OpenShell

Sandbox OpenShell tetap dikelola melalui lifecycle sandbox normal:

- `openclaw sandbox list` menampilkan runtime OpenShell serta runtime Docker
- `openclaw sandbox recreate` menghapus runtime saat ini dan membiarkan OpenClaw membuatnya kembali pada penggunaan berikutnya
- logika prune juga sadar-backend

Untuk mode `remote`, recreate sangat penting:

- recreate menghapus workspace jarak jauh kanonis untuk cakupan tersebut
- penggunaan berikutnya melakukan seed workspace jarak jauh baru dari workspace lokal

Untuk mode `mirror`, recreate terutama mereset lingkungan eksekusi jarak jauh
karena workspace lokal tetap kanonis.

## Akses workspace

`agents.defaults.sandbox.workspaceAccess` mengontrol **apa yang dapat dilihat sandbox**:

- `"none"` (default): tool melihat workspace sandbox di bawah `~/.openclaw/sandboxes`.
- `"ro"`: me-mount workspace agen hanya-baca di `/agent` (menonaktifkan `write`/`edit`/`apply_patch`).
- `"rw"`: me-mount workspace agen baca/tulis di `/workspace`.

Dengan backend OpenShell:

- mode `mirror` tetap menggunakan workspace lokal sebagai sumber kanonis antar giliran exec
- mode `remote` menggunakan workspace OpenShell jarak jauh sebagai sumber kanonis setelah seed awal
- `workspaceAccess: "ro"` dan `"none"` tetap membatasi perilaku penulisan dengan cara yang sama

Media masuk disalin ke workspace sandbox aktif (`media/inbound/*`).
Catatan Skills: tool `read` berakar di sandbox. Dengan `workspaceAccess: "none"`,
OpenClaw mencerminkan Skills yang memenuhi syarat ke workspace sandbox (`.../skills`) agar
dapat dibaca. Dengan `"rw"`, Skills workspace dapat dibaca dari
`/workspace/skills`.

## Bind mount kustom

`agents.defaults.sandbox.docker.binds` me-mount direktori host tambahan ke dalam container.
Format: `host:container:mode` (misalnya `"/home/user/source:/source:rw"`).

Bind global dan per-agen **digabungkan** (bukan diganti). Di bawah `scope: "shared"`, bind per-agen diabaikan.

`agents.defaults.sandbox.browser.binds` me-mount direktori host tambahan ke dalam container **browser sandbox** saja.

- Saat ditetapkan (termasuk `[]`), ini menggantikan `agents.defaults.sandbox.docker.binds` untuk container browser.
- Saat dihilangkan, container browser fallback ke `agents.defaults.sandbox.docker.binds` (kompatibel ke belakang).

Contoh (source hanya-baca + direktori data tambahan):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

Catatan keamanan:

- Bind melewati filesystem sandbox: bind mengekspos jalur host dengan mode apa pun yang Anda tetapkan (`:ro` atau `:rw`).
- OpenClaw memblokir sumber bind berbahaya (misalnya: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`, dan mount induk yang akan mengeksposnya).
- OpenClaw juga memblokir root kredensial direktori home umum seperti `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, dan `~/.ssh`.
- Validasi bind bukan sekadar pencocokan string. OpenClaw menormalkan jalur sumber, lalu me-resolve-nya lagi melalui leluhur terdalam yang ada sebelum memeriksa ulang jalur yang diblokir dan root yang diizinkan.
- Itu berarti escape induk symlink tetap fail-closed bahkan saat leaf akhir belum ada. Contoh: `/workspace/run-link/new-file` tetap di-resolve sebagai `/var/run/...` jika `run-link` menunjuk ke sana.
- Root sumber yang diizinkan juga dikanoniskan dengan cara yang sama, jadi jalur yang hanya tampak berada di dalam allowlist sebelum resolusi symlink tetap ditolak sebagai `outside allowed roots`.
- Mount sensitif (secret, kunci SSH, kredensial layanan) sebaiknya `:ro` kecuali benar-benar diperlukan.
- Gabungkan dengan `workspaceAccess: "ro"` jika Anda hanya memerlukan akses baca ke workspace; mode bind tetap independen.
- Lihat [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) untuk bagaimana bind berinteraksi dengan kebijakan tool dan elevated exec.

## Image + penyiapan

Image Docker default: `openclaw-sandbox:bookworm-slim`

Build sekali:

```bash
scripts/sandbox-setup.sh
```

Catatan: image default **tidak** menyertakan Node. Jika sebuah skill memerlukan Node (atau
runtime lain), buat image kustom atau instal melalui
`sandbox.docker.setupCommand` (memerlukan network egress + root yang dapat ditulis +
pengguna root).

Jika Anda menginginkan image sandbox yang lebih fungsional dengan tool umum (misalnya
`curl`, `jq`, `nodejs`, `python3`, `git`), build:

```bash
scripts/sandbox-common-setup.sh
```

Lalu tetapkan `agents.defaults.sandbox.docker.image` ke
`openclaw-sandbox-common:bookworm-slim`.

Image browser sandbox:

```bash
scripts/sandbox-browser-setup.sh
```

Secara default, container sandbox Docker berjalan **tanpa jaringan**.
Override dengan `agents.defaults.sandbox.docker.network`.

Image browser sandbox bundel juga menerapkan default startup Chromium yang konservatif
untuk beban kerja dalam container. Default container saat ini meliputi:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `--no-sandbox` saat `noSandbox` diaktifkan.
- Tiga flag penguatan grafis (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) bersifat opsional dan berguna
  saat container tidak memiliki dukungan GPU. Tetapkan `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  jika beban kerja Anda memerlukan WebGL atau fitur browser/3D lainnya.
- `--disable-extensions` diaktifkan secara default dan dapat dinonaktifkan dengan
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` untuk alur yang bergantung pada extension.
- `--renderer-process-limit=2` dikontrol oleh
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, di mana `0` mempertahankan default Chromium.

Jika Anda memerlukan profil runtime yang berbeda, gunakan image browser kustom dan sediakan
entrypoint Anda sendiri. Untuk profil Chromium lokal (non-container), gunakan
`browser.extraArgs` untuk menambahkan flag startup tambahan.

Default keamanan:

- `network: "host"` diblokir.
- `network: "container:<id>"` diblokir secara default (risiko bypass join namespace).
- Override break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Instalasi Docker dan gateway ter-container ada di sini:
[Docker](/id/install/docker)

Untuk deployment gateway Docker, `scripts/docker/setup.sh` dapat mem-bootstrap konfigurasi sandbox.
Tetapkan `OPENCLAW_SANDBOX=1` (atau `true`/`yes`/`on`) untuk mengaktifkan jalur tersebut. Anda dapat
meng-override lokasi socket dengan `OPENCLAW_DOCKER_SOCKET`. Penyiapan lengkap dan referensi env:
[Docker](/id/install/docker#agent-sandbox).

## setupCommand (penyiapan container satu kali)

`setupCommand` berjalan **sekali** setelah container sandbox dibuat (bukan pada setiap eksekusi).
Perintah ini dieksekusi di dalam container melalui `sh -lc`.

Jalur:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Per-agen: `agents.list[].sandbox.docker.setupCommand`

Jebakan umum:

- Default `docker.network` adalah `"none"` (tanpa egress), sehingga instalasi paket akan gagal.
- `docker.network: "container:<id>"` memerlukan `dangerouslyAllowContainerNamespaceJoin: true` dan hanya untuk break-glass.
- `readOnlyRoot: true` mencegah penulisan; tetapkan `readOnlyRoot: false` atau buat image kustom.
- `user` harus root untuk instalasi paket (hilangkan `user` atau tetapkan `user: "0:0"`).
- Exec sandbox **tidak** mewarisi `process.env` host. Gunakan
  `agents.defaults.sandbox.docker.env` (atau image kustom) untuk API key skill.

## Kebijakan tool + jalur escape

Kebijakan izinkan/tolak tool tetap berlaku sebelum aturan sandbox. Jika sebuah tool ditolak
secara global atau per-agen, sandboxing tidak akan mengembalikannya.

`tools.elevated` adalah jalur escape eksplisit yang menjalankan `exec` di luar sandbox (`gateway` secara default, atau `node` ketika target exec adalah `node`).
Direktif `/exec` hanya berlaku untuk pengirim yang berwenang dan dipersistenkan per sesi; untuk menonaktifkan `exec` secara keras,
gunakan penolakan kebijakan tool (lihat [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugging:

- Gunakan `openclaw sandbox explain` untuk memeriksa mode sandbox efektif, kebijakan tool, dan kunci konfigurasi perbaikan.
- Lihat [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) untuk model mental “mengapa ini diblokir?”.
  Tetap kunci dengan ketat.

## Override multi-agen

Setiap agen dapat meng-override sandbox + tool:
`agents.list[].sandbox` dan `agents.list[].tools` (ditambah `agents.list[].tools.sandbox.tools` untuk kebijakan tool sandbox).
Lihat [Multi-Agent Sandbox & Tools](/id/tools/multi-agent-sandbox-tools) untuk prioritas.

## Contoh pengaktifan minimal

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## Dokumen terkait

- [OpenShell](/id/gateway/openshell) -- penyiapan backend sandbox terkelola, mode workspace, dan referensi konfigurasi
- [Konfigurasi Sandbox](/id/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) -- debugging "mengapa ini diblokir?"
- [Multi-Agent Sandbox & Tools](/id/tools/multi-agent-sandbox-tools) -- override per-agen dan prioritas
- [Security](/id/gateway/security)
