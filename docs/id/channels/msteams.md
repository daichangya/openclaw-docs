---
read_when:
    - Sedang mengerjakan fitur channel Microsoft Teams
summary: Status dukungan bot Microsoft Teams, kapabilitas, dan konfigurasi
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-23T09:16:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1f093cbb9aed7d7f7348ec796b00f05ef66c601b5345214a08986940020d28e
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> "Tinggalkan segala harapan, wahai kalian yang masuk ke sini."

Status: teks + lampiran DM didukung; pengiriman file channel/grup memerlukan `sharePointSiteId` + izin Graph (lihat [Mengirim file di obrolan grup](#sending-files-in-group-chats)). Poll dikirim melalui Adaptive Cards. Aksi pesan mengekspos `upload-file` yang eksplisit untuk pengiriman yang mengutamakan file.

## Plugin bawaan

Microsoft Teams tersedia sebagai plugin bawaan di rilis OpenClaw saat ini, jadi tidak
memerlukan instalasi terpisah pada build paket normal.

Jika Anda menggunakan build yang lebih lama atau instalasi kustom yang tidak menyertakan Teams bawaan,
instal secara manual:

```bash
openclaw plugins install @openclaw/msteams
```

Checkout lokal (saat berjalan dari repo git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Detail: [Plugins](/id/tools/plugin)

## Penyiapan cepat (pemula)

1. Pastikan plugin Microsoft Teams tersedia.
   - Rilis OpenClaw paket saat ini sudah menyertakannya secara bawaan.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Buat **Azure Bot** (App ID + client secret + tenant ID).
3. Konfigurasikan OpenClaw dengan kredensial tersebut.
4. Ekspos `/api/messages` (port 3978 secara default) melalui URL publik atau tunnel.
5. Instal paket aplikasi Teams dan mulai Gateway.

Config minimal (client secret):

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Untuk deployment produksi, pertimbangkan menggunakan [autentikasi terfederasi](#federated-authentication-certificate--managed-identity) (sertifikat atau managed identity) alih-alih client secret.

Catatan: obrolan grup diblokir secara default (`channels.msteams.groupPolicy: "allowlist"`). Untuk mengizinkan balasan grup, atur `channels.msteams.groupAllowFrom` (atau gunakan `groupPolicy: "open"` untuk mengizinkan anggota mana pun, dengan pembatasan mention).

## Tujuan

- Berbicara dengan OpenClaw melalui DM, obrolan grup, atau channel Teams.
- Menjaga routing tetap deterministik: balasan selalu kembali ke channel tempat pesan datang.
- Default ke perilaku channel yang aman (mention wajib kecuali dikonfigurasi sebaliknya).

## Penulisan config

Secara default, Microsoft Teams diizinkan menulis pembaruan config yang dipicu oleh `/config set|unset` (memerlukan `commands.config: true`).

Nonaktifkan dengan:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Kontrol akses (DM + grup)

**Akses DM**

- Default: `channels.msteams.dmPolicy = "pairing"`. Pengirim yang tidak dikenal diabaikan sampai disetujui.
- `channels.msteams.allowFrom` sebaiknya menggunakan object ID AAD yang stabil.
- UPN/nama tampilan bersifat dapat berubah; pencocokan langsung dinonaktifkan secara default dan hanya diaktifkan dengan `channels.msteams.dangerouslyAllowNameMatching: true`.
- Wizard dapat me-resolve nama ke ID melalui Microsoft Graph jika kredensial mengizinkan.

**Akses grup**

- Default: `channels.msteams.groupPolicy = "allowlist"` (diblokir kecuali Anda menambahkan `groupAllowFrom`). Gunakan `channels.defaults.groupPolicy` untuk mengganti default saat tidak disetel.
- `channels.msteams.groupAllowFrom` mengontrol pengirim mana yang dapat memicu di obrolan grup/channel (fallback ke `channels.msteams.allowFrom`).
- Atur `groupPolicy: "open"` untuk mengizinkan anggota mana pun (tetap dibatasi mention secara default).
- Untuk mengizinkan **tidak ada channel**, atur `channels.msteams.groupPolicy: "disabled"`.

Contoh:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Teams + allowlist channel**

- Batasi balasan grup/channel dengan mencantumkan tim dan channel di bawah `channels.msteams.teams`.
- Kunci sebaiknya menggunakan ID tim yang stabil dan ID percakapan channel.
- Saat `groupPolicy="allowlist"` dan allowlist tim tersedia, hanya tim/channel yang tercantum yang diterima (dengan pembatasan mention).
- Wizard konfigurasi menerima entri `Team/Channel` dan menyimpannya untuk Anda.
- Saat startup, OpenClaw me-resolve nama tim/channel dan nama pengguna allowlist ke ID (jika izin Graph mengizinkan)
  dan mencatat pemetaannya; nama tim/channel yang tidak ter-resolve tetap disimpan sesuai input tetapi diabaikan untuk routing secara default kecuali `channels.msteams.dangerouslyAllowNameMatching: true` diaktifkan.

Contoh:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

## Cara kerjanya

1. Pastikan plugin Microsoft Teams tersedia.
   - Rilis OpenClaw paket saat ini sudah menyertakannya secara bawaan.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Buat **Azure Bot** (App ID + secret + tenant ID).
3. Bangun **paket aplikasi Teams** yang merujuk ke bot dan menyertakan izin RSC di bawah ini.
4. Unggah/instal aplikasi Teams ke dalam sebuah tim (atau cakupan personal untuk DM).
5. Konfigurasikan `msteams` di `~/.openclaw/openclaw.json` (atau env vars) dan mulai Gateway.
6. Gateway mendengarkan lalu lintas Webhook Bot Framework di `/api/messages` secara default.

## Penyiapan Azure Bot (Prasyarat)

Sebelum mengonfigurasi OpenClaw, Anda perlu membuat resource Azure Bot.

### Langkah 1: Buat Azure Bot

1. Buka [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Isi tab **Basics**:

   | Field              | Value                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Nama bot Anda, misalnya `openclaw-msteams` (harus unik) |
   | **Subscription**   | Pilih subscription Azure Anda                           |
   | **Resource group** | Buat baru atau gunakan yang sudah ada                   |
   | **Pricing tier**   | **Free** untuk dev/testing                              |
   | **Type of App**    | **Single Tenant** (disarankan - lihat catatan di bawah) |
   | **Creation type**  | **Create new Microsoft App ID**                         |

> **Pemberitahuan deprecation:** Pembuatan bot multi-tenant baru dihentikan setelah 2025-07-31. Gunakan **Single Tenant** untuk bot baru.

3. Klik **Review + create** → **Create** (tunggu ~1-2 menit)

### Langkah 2: Dapatkan Kredensial

1. Buka resource Azure Bot Anda → **Configuration**
2. Salin **Microsoft App ID** → ini adalah `appId` Anda
3. Klik **Manage Password** → buka App Registration
4. Di bawah **Certificates & secrets** → **New client secret** → salin **Value** → ini adalah `appPassword` Anda
5. Buka **Overview** → salin **Directory (tenant) ID** → ini adalah `tenantId` Anda

### Langkah 3: Konfigurasikan Messaging Endpoint

1. Di Azure Bot → **Configuration**
2. Atur **Messaging endpoint** ke URL Webhook Anda:
   - Produksi: `https://your-domain.com/api/messages`
   - Dev lokal: gunakan tunnel (lihat [Pengembangan Lokal](#local-development-tunneling) di bawah)

### Langkah 4: Aktifkan Channel Teams

1. Di Azure Bot → **Channels**
2. Klik **Microsoft Teams** → Configure → Save
3. Terima Terms of Service

<a id="federated-authentication-certificate--managed-identity"></a>

## Autentikasi Terfederasi (Sertifikat + Managed Identity)

> Ditambahkan pada 2026.3.24

Untuk deployment produksi, OpenClaw mendukung **autentikasi terfederasi** sebagai alternatif yang lebih aman dibanding client secret. Dua metode tersedia:

### Opsi A: Autentikasi berbasis sertifikat

Gunakan sertifikat PEM yang terdaftar pada app registration Entra ID Anda.

**Penyiapan:**

1. Buat atau peroleh sertifikat (format PEM dengan private key).
2. Di Entra ID → App Registration → **Certificates & secrets** → **Certificates** → unggah sertifikat publik.

**Config:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Env vars:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Opsi B: Azure Managed Identity

Gunakan Azure Managed Identity untuk autentikasi tanpa kata sandi. Ini ideal untuk deployment pada infrastruktur Azure (AKS, App Service, Azure VM) saat managed identity tersedia.

**Cara kerjanya:**

1. Pod/VM bot memiliki managed identity (system-assigned atau user-assigned).
2. **Federated identity credential** menghubungkan managed identity ke app registration Entra ID.
3. Saat runtime, OpenClaw menggunakan `@azure/identity` untuk memperoleh token dari endpoint Azure IMDS (`169.254.169.254`).
4. Token diteruskan ke SDK Teams untuk autentikasi bot.

**Prasyarat:**

- Infrastruktur Azure dengan managed identity diaktifkan (AKS workload identity, App Service, VM)
- Federated identity credential dibuat pada app registration Entra ID
- Akses jaringan ke IMDS (`169.254.169.254:80`) dari pod/VM

**Config (managed identity system-assigned):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Config (managed identity user-assigned):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Env vars:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (hanya untuk user-assigned)

### Penyiapan AKS Workload Identity

Untuk deployment AKS yang menggunakan workload identity:

1. **Aktifkan workload identity** pada cluster AKS Anda.
2. **Buat federated identity credential** pada app registration Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Tambahkan anotasi pada service account Kubernetes** dengan app client ID:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Tambahkan label pada pod** untuk injeksi workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Pastikan akses jaringan** ke IMDS (`169.254.169.254`) — jika menggunakan NetworkPolicy, tambahkan aturan egress yang mengizinkan lalu lintas ke `169.254.169.254/32` pada port 80.

### Perbandingan jenis autentikasi

| Method               | Config                                         | Pros                               | Cons                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | Penyiapan sederhana                | Perlu rotasi secret, kurang aman      |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | Tidak ada secret bersama di jaringan | Ada overhead pengelolaan sertifikat |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Tanpa kata sandi, tidak ada secret yang perlu dikelola | Memerlukan infrastruktur Azure |

**Perilaku default:** Saat `authType` tidak diatur, OpenClaw default ke autentikasi client secret. Konfigurasi yang sudah ada tetap berfungsi tanpa perubahan.

## Pengembangan Lokal (Tunneling)

Teams tidak dapat menjangkau `localhost`. Gunakan tunnel untuk pengembangan lokal:

**Opsi A: ngrok**

```bash
ngrok http 3978
# Salin URL https, misalnya, https://abc123.ngrok.io
# Atur messaging endpoint ke: https://abc123.ngrok.io/api/messages
```

**Opsi B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Gunakan URL funnel Tailscale Anda sebagai messaging endpoint
```

## Teams Developer Portal (Alternatif)

Alih-alih membuat ZIP manifest secara manual, Anda dapat menggunakan [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. Klik **+ New app**
2. Isi info dasar (nama, deskripsi, info developer)
3. Buka **App features** → **Bot**
4. Pilih **Enter a bot ID manually** lalu tempel Azure Bot App ID Anda
5. Centang scope: **Personal**, **Team**, **Group Chat**
6. Klik **Distribute** → **Download app package**
7. Di Teams: **Apps** → **Manage your apps** → **Upload a custom app** → pilih ZIP

Ini sering kali lebih mudah daripada mengedit manifest JSON secara manual.

## Menguji Bot

**Opsi A: Azure Web Chat (verifikasi Webhook terlebih dahulu)**

1. Di Azure Portal → resource Azure Bot Anda → **Test in Web Chat**
2. Kirim pesan - Anda seharusnya melihat respons
3. Ini mengonfirmasi bahwa endpoint Webhook Anda berfungsi sebelum penyiapan Teams

**Opsi B: Teams (setelah aplikasi diinstal)**

1. Instal aplikasi Teams (sideload atau katalog organisasi)
2. Temukan bot di Teams dan kirim DM
3. Periksa log Gateway untuk aktivitas masuk

## Penyiapan (minimal hanya teks)

1. **Pastikan plugin Microsoft Teams tersedia**
   - Rilis OpenClaw paket saat ini sudah menyertakannya secara bawaan.
   - Instalasi lama/kustom dapat menambahkannya secara manual:
     - Dari npm: `openclaw plugins install @openclaw/msteams`
     - Dari checkout lokal: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **Pendaftaran bot**
   - Buat Azure Bot (lihat di atas) dan catat:
     - App ID
     - Client secret (kata sandi App)
     - Tenant ID (single-tenant)

3. **Manifest aplikasi Teams**
   - Sertakan entri `bot` dengan `botId = <App ID>`.
   - Scope: `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (wajib untuk penanganan file pada scope personal).
   - Tambahkan izin RSC (di bawah).
   - Buat ikon: `outline.png` (32x32) dan `color.png` (192x192).
   - Zip ketiga file ini bersama-sama: `manifest.json`, `outline.png`, `color.png`.

4. **Konfigurasikan OpenClaw**

   ```json5
   {
     channels: {
       msteams: {
         enabled: true,
         appId: "<APP_ID>",
         appPassword: "<APP_PASSWORD>",
         tenantId: "<TENANT_ID>",
         webhook: { port: 3978, path: "/api/messages" },
       },
     },
   }
   ```

   Anda juga dapat menggunakan variabel lingkungan alih-alih kunci config:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`
   - `MSTEAMS_AUTH_TYPE` (opsional: `"secret"` atau `"federated"`)
   - `MSTEAMS_CERTIFICATE_PATH` (terfederasi + sertifikat)
   - `MSTEAMS_CERTIFICATE_THUMBPRINT` (opsional, tidak diperlukan untuk autentikasi)
   - `MSTEAMS_USE_MANAGED_IDENTITY` (terfederasi + managed identity)
   - `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (hanya MI user-assigned)

5. **Endpoint bot**
   - Atur Azure Bot Messaging Endpoint ke:
     - `https://<host>:3978/api/messages` (atau path/port pilihan Anda).

6. **Jalankan Gateway**
   - Channel Teams dimulai secara otomatis saat plugin bawaan atau yang diinstal manual tersedia dan config `msteams` ada beserta kredensialnya.

## Aksi info anggota

OpenClaw mengekspos aksi `member-info` yang didukung Graph untuk Microsoft Teams sehingga agent dan automasi dapat me-resolve detail anggota channel (nama tampilan, email, peran) langsung dari Microsoft Graph.

Persyaratan:

- Izin RSC `Member.Read.Group` (sudah ada di manifest yang direkomendasikan)
- Untuk lookup lintas tim: izin Aplikasi Graph `User.Read.All` dengan admin consent

Aksi ini dibatasi oleh `channels.msteams.actions.memberInfo` (default: aktif saat kredensial Graph tersedia).

## Konteks riwayat

- `channels.msteams.historyLimit` mengontrol berapa banyak pesan channel/grup terbaru yang dibungkus ke dalam prompt.
- Fallback ke `messages.groupChat.historyLimit`. Atur `0` untuk menonaktifkan (default 50).
- Riwayat thread yang diambil difilter oleh allowlist pengirim (`allowFrom` / `groupAllowFrom`), sehingga penyemaian konteks thread hanya menyertakan pesan dari pengirim yang diizinkan.
- Konteks lampiran kutipan (`ReplyTo*` yang diturunkan dari HTML balasan Teams) saat ini diteruskan sebagaimana diterima.
- Dengan kata lain, allowlist membatasi siapa yang dapat memicu agent; hanya jalur konteks tambahan tertentu yang saat ini difilter.
- Riwayat DM dapat dibatasi dengan `channels.msteams.dmHistoryLimit` (giliran pengguna). Override per pengguna: `channels.msteams.dms["<user_id>"].historyLimit`.

## Izin RSC Teams Saat Ini (Manifest)

Berikut adalah **izin resourceSpecific yang ada** di manifest aplikasi Teams kami. Izin ini hanya berlaku di dalam tim/obrolan tempat aplikasi diinstal.

**Untuk channel (scope tim):**

- `ChannelMessage.Read.Group` (Application) - menerima semua pesan channel tanpa @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Untuk obrolan grup:**

- `ChatMessage.Read.Chat` (Application) - menerima semua pesan obrolan grup tanpa @mention

## Contoh Manifest Teams (disunting)

Contoh minimal yang valid dengan field yang diperlukan. Ganti ID dan URL.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### Catatan penting manifest (field yang wajib ada)

- `bots[].botId` **harus** cocok dengan Azure Bot App ID.
- `webApplicationInfo.id` **harus** cocok dengan Azure Bot App ID.
- `bots[].scopes` harus menyertakan surface yang ingin Anda gunakan (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` wajib untuk penanganan file pada scope personal.
- `authorization.permissions.resourceSpecific` harus menyertakan baca/kirim channel jika Anda ingin lalu lintas channel.

### Memperbarui aplikasi yang sudah ada

Untuk memperbarui aplikasi Teams yang sudah diinstal (misalnya, untuk menambahkan izin RSC):

1. Perbarui `manifest.json` Anda dengan pengaturan baru
2. **Naikkan field `version`** (misalnya, `1.0.0` → `1.1.0`)
3. **Zip ulang** manifest dengan ikon (`manifest.json`, `outline.png`, `color.png`)
4. Unggah zip baru:
   - **Opsi A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → temukan aplikasi Anda → Upload new version
   - **Opsi B (Sideload):** Di Teams → Apps → Manage your apps → Upload a custom app
5. **Untuk channel tim:** instal ulang aplikasi di setiap tim agar izin baru berlaku
6. **Keluar penuh dan jalankan ulang Teams** (bukan hanya menutup jendela) untuk menghapus metadata aplikasi yang tersimpan di cache

## Kapabilitas: hanya RSC vs Graph

### Dengan **hanya Teams RSC** (aplikasi diinstal, tanpa izin API Graph)

Berfungsi:

- Membaca konten **teks** pesan channel.
- Mengirim konten **teks** pesan channel.
- Menerima lampiran file **personal (DM)**.

Tidak berfungsi:

- Konten **gambar atau file** channel/grup (payload hanya menyertakan stub HTML).
- Mengunduh lampiran yang disimpan di SharePoint/OneDrive.
- Membaca riwayat pesan (di luar event Webhook live).

### Dengan **Teams RSC + izin Aplikasi Microsoft Graph**

Menambahkan:

- Mengunduh hosted contents (gambar yang ditempel ke pesan).
- Mengunduh lampiran file yang disimpan di SharePoint/OneDrive.
- Membaca riwayat pesan channel/obrolan melalui Graph.

### RSC vs Graph API

| Capability              | RSC Permissions      | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **Pesan real-time**     | Ya (melalui Webhook) | Tidak (hanya polling)               |
| **Pesan historis**      | Tidak                | Ya (dapat melakukan kueri riwayat)  |
| **Kompleksitas setup**  | Hanya manifest aplikasi | Memerlukan admin consent + alur token |
| **Berfungsi saat offline** | Tidak (harus berjalan) | Ya (bisa kueri kapan saja)        |

**Intinya:** RSC untuk mendengarkan secara real-time; Graph API untuk akses historis. Untuk mengejar pesan yang terlewat saat offline, Anda memerlukan Graph API dengan `ChannelMessage.Read.All` (memerlukan admin consent).

## Media + riwayat yang diaktifkan Graph (wajib untuk channel)

Jika Anda memerlukan gambar/file di **channel** atau ingin mengambil **riwayat pesan**, Anda harus mengaktifkan izin Microsoft Graph dan memberikan admin consent.

1. Di **App Registration** Entra ID (Azure AD), tambahkan izin **Aplikasi** Microsoft Graph:
   - `ChannelMessage.Read.All` (lampiran channel + riwayat)
   - `Chat.Read.All` atau `ChatMessage.Read.All` (obrolan grup)
2. **Berikan admin consent** untuk tenant.
3. Naikkan **versi** manifest aplikasi Teams, unggah ulang, dan **instal ulang aplikasi di Teams**.
4. **Keluar penuh dan jalankan ulang Teams** untuk menghapus metadata aplikasi yang tersimpan di cache.

**Izin tambahan untuk mention pengguna:** @mention pengguna berfungsi langsung untuk pengguna yang berada dalam percakapan. Namun, jika Anda ingin mencari dan me-mention pengguna secara dinamis yang **tidak berada dalam percakapan saat ini**, tambahkan izin `User.Read.All` (Application) dan berikan admin consent.

## Keterbatasan yang Diketahui

### Timeout Webhook

Teams mengirim pesan melalui Webhook HTTP. Jika pemrosesan memakan waktu terlalu lama (misalnya, respons LLM lambat), Anda mungkin melihat:

- Timeout Gateway
- Teams mencoba ulang pesan (menyebabkan duplikasi)
- Balasan terbuang

OpenClaw menangani ini dengan mengembalikan respons dengan cepat dan mengirim balasan secara proaktif, tetapi respons yang sangat lambat masih dapat menimbulkan masalah.

### Pemformatan

Markdown Teams lebih terbatas dibanding Slack atau Discord:

- Pemformatan dasar berfungsi: **tebal**, _miring_, `code`, tautan
- Markdown kompleks (tabel, daftar bertingkat) mungkin tidak dirender dengan benar
- Adaptive Cards didukung untuk poll dan pengiriman presentasi semantik (lihat di bawah)

## Konfigurasi

Pengaturan utama (lihat `/gateway/configuration` untuk pola channel bersama):

- `channels.msteams.enabled`: aktifkan/nonaktifkan channel.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: kredensial bot.
- `channels.msteams.webhook.port` (default `3978`)
- `channels.msteams.webhook.path` (default `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (default: pairing)
- `channels.msteams.allowFrom`: allowlist DM (AAD object ID direkomendasikan). Wizard me-resolve nama ke ID selama penyiapan saat akses Graph tersedia.
- `channels.msteams.dangerouslyAllowNameMatching`: toggle break-glass untuk mengaktifkan kembali pencocokan UPN/nama tampilan yang dapat berubah dan routing langsung nama tim/channel.
- `channels.msteams.textChunkLimit`: ukuran chunk teks keluar.
- `channels.msteams.chunkMode`: `length` (default) atau `newline` untuk memisah pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang.
- `channels.msteams.mediaAllowHosts`: allowlist untuk host lampiran masuk (default ke domain Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: allowlist untuk melampirkan header Authorization pada percobaan ulang media (default ke host Graph + Bot Framework).
- `channels.msteams.requireMention`: mewajibkan @mention di channel/grup (default true).
- `channels.msteams.replyStyle`: `thread | top-level` (lihat [Gaya Balasan](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: override per tim.
- `channels.msteams.teams.<teamId>.requireMention`: override per tim.
- `channels.msteams.teams.<teamId>.tools`: override kebijakan tool default per tim (`allow`/`deny`/`alsoAllow`) yang digunakan saat override channel tidak ada.
- `channels.msteams.teams.<teamId>.toolsBySender`: override kebijakan tool default per pengirim per tim (`"*"` wildcard didukung).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: override per channel.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: override per channel.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: override kebijakan tool per channel (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: override kebijakan tool per pengirim per channel (`"*"` wildcard didukung).
- Kunci `toolsBySender` sebaiknya menggunakan prefiks eksplisit:
  `id:`, `e164:`, `username:`, `name:` (kunci lama tanpa prefiks masih dipetakan ke `id:` saja).
- `channels.msteams.actions.memberInfo`: aktifkan atau nonaktifkan aksi info anggota yang didukung Graph (default: aktif saat kredensial Graph tersedia).
- `channels.msteams.authType`: jenis autentikasi — `"secret"` (default) atau `"federated"`.
- `channels.msteams.certificatePath`: path ke file sertifikat PEM (terfederasi + autentikasi sertifikat).
- `channels.msteams.certificateThumbprint`: thumbprint sertifikat (opsional, tidak diperlukan untuk autentikasi).
- `channels.msteams.useManagedIdentity`: aktifkan autentikasi managed identity (mode terfederasi).
- `channels.msteams.managedIdentityClientId`: client ID untuk managed identity user-assigned.
- `channels.msteams.sharePointSiteId`: SharePoint site ID untuk upload file di obrolan grup/channel (lihat [Mengirim file di obrolan grup](#sending-files-in-group-chats)).

## Routing & Sesi

- Kunci sesi mengikuti format agent standar (lihat [/concepts/session](/id/concepts/session)):
  - Pesan langsung berbagi sesi utama (`agent:<agentId>:<mainKey>`).
  - Pesan channel/grup menggunakan ID percakapan:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Gaya Balasan: Thread vs Post

Teams baru-baru ini memperkenalkan dua gaya UI channel di atas model data dasar yang sama:

| Style                    | Description                                               | `replyStyle` yang disarankan |
| ------------------------ | --------------------------------------------------------- | ---------------------------- |
| **Posts** (klasik)       | Pesan muncul sebagai kartu dengan balasan berutas di bawahnya | `thread` (default)       |
| **Threads** (mirip Slack) | Pesan mengalir secara linear, lebih mirip Slack          | `top-level`                  |

**Masalahnya:** API Teams tidak mengekspos gaya UI apa yang digunakan sebuah channel. Jika Anda menggunakan `replyStyle` yang salah:

- `thread` di channel bergaya Threads → balasan muncul bertingkat dengan canggung
- `top-level` di channel bergaya Posts → balasan muncul sebagai post top-level terpisah, bukan di dalam thread

**Solusinya:** Konfigurasikan `replyStyle` per channel berdasarkan cara channel disiapkan:

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

## Lampiran & Gambar

**Keterbatasan saat ini:**

- **DM:** Gambar dan lampiran file berfungsi melalui API file bot Teams.
- **Channel/grup:** Lampiran berada di penyimpanan M365 (SharePoint/OneDrive). Payload Webhook hanya menyertakan stub HTML, bukan byte file yang sebenarnya. **Izin Graph API diperlukan** untuk mengunduh lampiran channel.
- Untuk pengiriman eksplisit yang mengutamakan file, gunakan `action=upload-file` dengan `media` / `filePath` / `path`; `message` opsional menjadi teks/komentar pendamping, dan `filename` menimpa nama upload.

Tanpa izin Graph, pesan channel dengan gambar akan diterima sebagai teks saja (konten gambar tidak dapat diakses oleh bot).
Secara default, OpenClaw hanya mengunduh media dari hostname Microsoft/Teams. Override dengan `channels.msteams.mediaAllowHosts` (gunakan `["*"]` untuk mengizinkan host apa pun).
Header Authorization hanya dilampirkan untuk host di `channels.msteams.mediaAuthAllowHosts` (default ke host Graph + Bot Framework). Jaga daftar ini tetap ketat (hindari suffix multi-tenant).

## Mengirim file di obrolan grup

Bot dapat mengirim file di DM menggunakan alur FileConsentCard (bawaan). Namun, **mengirim file di obrolan grup/channel** memerlukan penyiapan tambahan:

| Context                  | Cara file dikirim                           | Penyiapan yang dibutuhkan                        |
| ------------------------ | ------------------------------------------- | ------------------------------------------------ |
| **DM**                   | FileConsentCard → pengguna menerima → bot mengunggah | Langsung berfungsi                     |
| **Obrolan grup/channel** | Upload ke SharePoint → bagikan tautan       | Memerlukan `sharePointSiteId` + izin Graph       |
| **Gambar (konteks apa pun)** | Inline terenkripsi Base64               | Langsung berfungsi                               |

### Mengapa obrolan grup memerlukan SharePoint

Bot tidak memiliki drive OneDrive pribadi (endpoint Graph API `/me/drive` tidak berfungsi untuk identitas aplikasi). Untuk mengirim file di obrolan grup/channel, bot mengunggah ke **site SharePoint** dan membuat tautan berbagi.

### Penyiapan

1. **Tambahkan izin Graph API** di Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - unggah file ke SharePoint
   - `Chat.Read.All` (Application) - opsional, mengaktifkan tautan berbagi per pengguna

2. **Berikan admin consent** untuk tenant.

3. **Dapatkan SharePoint site ID Anda:**

   ```bash
   # Melalui Graph Explorer atau curl dengan token yang valid:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Contoh: untuk site di "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Respons menyertakan: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Konfigurasikan OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... config lain ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Perilaku berbagi

| Permission                              | Perilaku berbagi                                         |
| --------------------------------------- | -------------------------------------------------------- |
| `Sites.ReadWrite.All` saja              | Tautan berbagi untuk seluruh organisasi (siapa pun di org dapat mengakses) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Tautan berbagi per pengguna (hanya anggota obrolan yang dapat mengakses) |

Berbagi per pengguna lebih aman karena hanya peserta obrolan yang dapat mengakses file. Jika izin `Chat.Read.All` tidak ada, bot fallback ke berbagi seluruh organisasi.

### Perilaku fallback

| Skenario                                        | Hasil                                              |
| ----------------------------------------------- | -------------------------------------------------- |
| Obrolan grup + file + `sharePointSiteId` dikonfigurasi | Upload ke SharePoint, kirim tautan berbagi   |
| Obrolan grup + file + tanpa `sharePointSiteId`  | Coba upload OneDrive (mungkin gagal), kirim teks saja |
| Obrolan personal + file                         | Alur FileConsentCard (berfungsi tanpa SharePoint)  |
| Konteks apa pun + gambar                        | Inline terenkripsi Base64 (berfungsi tanpa SharePoint) |

### Lokasi penyimpanan file

File yang diunggah disimpan di folder `/OpenClawShared/` dalam library dokumen default dari site SharePoint yang dikonfigurasi.

## Poll (Adaptive Cards)

OpenClaw mengirim poll Teams sebagai Adaptive Cards (tidak ada poll API Teams native).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Suara dicatat oleh Gateway di `~/.openclaw/msteams-polls.json`.
- Gateway harus tetap online untuk mencatat suara.
- Poll belum otomatis memposting ringkasan hasil (periksa file store jika diperlukan).

## Kartu Presentasi

Kirim payload presentasi semantik ke pengguna atau percakapan Teams menggunakan tool `message` atau CLI. OpenClaw merendernya sebagai Teams Adaptive Cards dari kontrak presentasi generik.

Parameter `presentation` menerima blok semantik. Saat `presentation` diberikan, teks pesan bersifat opsional.

**Tool agent:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

Untuk detail format target, lihat [Format target](#target-formats) di bawah.

## Format target

Target MSTeams menggunakan prefiks untuk membedakan pengguna dan percakapan:

| Jenis target          | Format                           | Contoh                                              |
| --------------------- | -------------------------------- | --------------------------------------------------- |
| Pengguna (berdasarkan ID) | `user:<aad-object-id>`       | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Pengguna (berdasarkan nama) | `user:<display-name>`      | `user:John Smith` (memerlukan Graph API)            |
| Grup/channel          | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grup/channel (raw)    | `<conversation-id>`              | `19:abc123...@thread.tacv2` (jika berisi `@thread`) |

**Contoh CLI:**

```bash
# Kirim ke pengguna berdasarkan ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Kirim ke pengguna berdasarkan nama tampilan (memicu lookup Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Kirim ke obrolan grup atau channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Kirim kartu presentasi ke percakapan
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Contoh tool agent:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

Catatan: Tanpa prefiks `user:`, nama secara default akan di-resolve sebagai grup/tim. Selalu gunakan `user:` saat menargetkan orang berdasarkan nama tampilan.

## Pesan proaktif

- Pesan proaktif hanya dimungkinkan **setelah** pengguna berinteraksi, karena kami menyimpan referensi percakapan pada saat itu.
- Lihat `/gateway/configuration` untuk `dmPolicy` dan pembatasan allowlist.

## ID Tim dan Channel (Kendala Umum)

Parameter kueri `groupId` dalam URL Teams **BUKAN** ID tim yang digunakan untuk konfigurasi. Ekstrak ID dari path URL sebagai gantinya:

**URL Tim:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID Tim (URL-decode ini)
```

**URL Channel:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID Channel (URL-decode ini)
```

**Untuk config:**

- ID Tim = segmen path setelah `/team/` (di-URL-decode, misalnya, `19:Bk4j...@thread.tacv2`)
- ID Channel = segmen path setelah `/channel/` (di-URL-decode)
- **Abaikan** parameter kueri `groupId`

## Channel Privat

Bot memiliki dukungan terbatas di channel privat:

| Feature                      | Standard Channels | Private Channels       |
| ---------------------------- | ----------------- | ---------------------- |
| Instalasi bot                | Ya                | Terbatas               |
| Pesan real-time (Webhook)    | Ya                | Mungkin tidak berfungsi |
| Izin RSC                     | Ya                | Mungkin berperilaku berbeda |
| @mentions                    | Ya                | Jika bot dapat diakses |
| Riwayat Graph API            | Ya                | Ya (dengan izin)       |

**Solusi sementara jika channel privat tidak berfungsi:**

1. Gunakan channel standar untuk interaksi bot
2. Gunakan DM - pengguna selalu dapat mengirim pesan langsung ke bot
3. Gunakan Graph API untuk akses historis (memerlukan `ChannelMessage.Read.All`)

## Pemecahan masalah

### Masalah umum

- **Gambar tidak muncul di channel:** izin Graph atau admin consent tidak ada. Instal ulang aplikasi Teams dan keluar penuh/buka kembali Teams.
- **Tidak ada respons di channel:** mention diwajibkan secara default; atur `channels.msteams.requireMention=false` atau konfigurasikan per tim/channel.
- **Ketidakcocokan versi (Teams masih menampilkan manifest lama):** hapus + tambahkan ulang aplikasi dan keluar penuh dari Teams untuk menyegarkan.
- **401 Unauthorized dari Webhook:** Wajar saat menguji secara manual tanpa Azure JWT - artinya endpoint dapat dijangkau tetapi autentikasi gagal. Gunakan Azure Web Chat untuk menguji dengan benar.

### Error upload manifest

- **"Icon file cannot be empty":** manifest merujuk file ikon yang berukuran 0 byte. Buat ikon PNG yang valid (32x32 untuk `outline.png`, 192x192 untuk `color.png`).
- **"webApplicationInfo.Id already in use":** aplikasi masih terinstal di tim/obrolan lain. Temukan dan uninstall terlebih dahulu, atau tunggu 5-10 menit untuk propagasi.
- **"Something went wrong" saat upload:** upload melalui [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) sebagai gantinya, buka browser DevTools (F12) → tab Network, dan periksa body respons untuk error sebenarnya.
- **Sideload gagal:** coba "Upload an app to your org's app catalog" alih-alih "Upload a custom app" - ini sering melewati pembatasan sideload.

### Izin RSC tidak berfungsi

1. Verifikasi `webApplicationInfo.id` cocok persis dengan App ID bot Anda
2. Unggah ulang aplikasi dan instal ulang di tim/obrolan
3. Periksa apakah admin org Anda memblokir izin RSC
4. Pastikan Anda menggunakan scope yang benar: `ChannelMessage.Read.Group` untuk tim, `ChatMessage.Read.Chat` untuk obrolan grup

## Referensi

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - panduan penyiapan Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - membuat/mengelola aplikasi Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema) - skema manifest aplikasi Teams
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc) - menerima pesan channel dengan RSC
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent) - referensi izin RSC
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (channel/group memerlukan Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Terkait

- [Ringkasan Channels](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/id/channels/groups) — perilaku obrolan grup dan pembatasan mention
- [Routing Channel](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Security](/id/gateway/security) — model akses dan hardening
