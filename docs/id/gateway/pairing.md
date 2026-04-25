---
read_when:
    - Menerapkan persetujuan pairing Node tanpa UI macOS
    - Menambahkan alur CLI untuk menyetujui node remote
    - Memperluas protokol gateway dengan pengelolaan node
summary: Node pairing milik Gateway (Opsi B) untuk iOS dan node remote lainnya
title: Pairing milik Gateway
x-i18n:
    generated_at: "2026-04-25T13:47:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b512fbf97e7557a1f467732f1b68d8c1b8183695e436b3f87b4c4aca1478cb5
    source_path: gateway/pairing.md
    workflow: 15
---

Dalam pairing milik Gateway, **Gateway** adalah sumber kebenaran untuk menentukan node mana
yang diizinkan bergabung. UI (aplikasi macOS, klien masa depan) hanyalah frontend yang
menyetujui atau menolak permintaan tertunda.

**Penting:** Node WS menggunakan **device pairing** (role `node`) selama `connect`.
`node.pair.*` adalah penyimpanan pairing terpisah dan **tidak** mengendalikan handshake WS.
Hanya klien yang secara eksplisit memanggil `node.pair.*` yang menggunakan alur ini.

## Konsep

- **Permintaan tertunda**: sebuah node meminta untuk bergabung; memerlukan persetujuan.
- **Node yang dipasangkan**: node yang disetujui dengan auth token yang diterbitkan.
- **Transport**: endpoint WS Gateway meneruskan permintaan tetapi tidak memutuskan
  keanggotaan. (Dukungan bridge TCP lama telah dihapus.)

## Cara kerja pairing

1. Sebuah node terhubung ke WS Gateway dan meminta pairing.
2. Gateway menyimpan **permintaan tertunda** dan memancarkan `node.pair.requested`.
3. Anda menyetujui atau menolak permintaan tersebut (CLI atau UI).
4. Setelah disetujui, Gateway menerbitkan **token baru** (token dirotasi saat re-pair).
5. Node terhubung kembali menggunakan token tersebut dan kini berstatus “paired”.

Permintaan tertunda kedaluwarsa secara otomatis setelah **5 menit**.

## Alur kerja CLI (ramah headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` menampilkan node yang dipasangkan/terhubung dan kapabilitasnya.

## Permukaan API (protokol gateway)

Peristiwa:

- `node.pair.requested` — dipancarkan saat permintaan tertunda baru dibuat.
- `node.pair.resolved` — dipancarkan saat permintaan disetujui/ditolak/kedaluwarsa.

Metode:

- `node.pair.request` — membuat atau menggunakan kembali permintaan tertunda.
- `node.pair.list` — mencantumkan node tertunda + yang dipasangkan (`operator.pairing`).
- `node.pair.approve` — menyetujui permintaan tertunda (menerbitkan token).
- `node.pair.reject` — menolak permintaan tertunda.
- `node.pair.verify` — memverifikasi `{ nodeId, token }`.

Catatan:

- `node.pair.request` bersifat idempoten per node: panggilan berulang mengembalikan
  permintaan tertunda yang sama.
- Permintaan berulang untuk node tertunda yang sama juga menyegarkan metadata node yang tersimpan
  dan snapshot perintah yang dideklarasikan terbaru yang di-allowlist untuk visibilitas operator.
- Persetujuan **selalu** menghasilkan token baru; token tidak pernah dikembalikan dari
  `node.pair.request`.
- Permintaan dapat menyertakan `silent: true` sebagai petunjuk untuk alur auto-approval.
- `node.pair.approve` menggunakan perintah yang dideklarasikan permintaan tertunda untuk menegakkan
  scope persetujuan tambahan:
  - permintaan tanpa perintah: `operator.pairing`
  - permintaan perintah non-exec: `operator.pairing` + `operator.write`
  - permintaan `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Penting:

- Node pairing adalah alur kepercayaan/identitas plus penerbitan token.
- Ini **tidak** mem-pin permukaan perintah node langsung per node.
- Perintah node langsung berasal dari apa yang dideklarasikan node saat connect setelah
  kebijakan perintah node global gateway (`gateway.nodes.allowCommands` /
  `denyCommands`) diterapkan.
- Kebijakan allow/ask `system.run` per node berada pada node di
  `exec.approvals.node.*`, bukan di catatan pairing.

## Gating perintah node (2026.3.31+)

<Warning>
**Perubahan yang memutus kompatibilitas:** Mulai `2026.3.31`, perintah node dinonaktifkan sampai node pairing disetujui. Device pairing saja tidak lagi cukup untuk mengekspos perintah node yang dideklarasikan.
</Warning>

Saat sebuah node terhubung untuk pertama kalinya, pairing diminta secara otomatis. Sampai permintaan pairing disetujui, semua perintah node tertunda dari node tersebut difilter dan tidak akan dieksekusi. Setelah kepercayaan dibangun melalui persetujuan pairing, perintah yang dideklarasikan node menjadi tersedia sesuai kebijakan perintah normal.

Ini berarti:

- Node yang sebelumnya mengandalkan device pairing saja untuk mengekspos perintah sekarang harus menyelesaikan node pairing.
- Perintah yang diantrekan sebelum persetujuan pairing dibuang, bukan ditunda.

## Batas kepercayaan peristiwa node (2026.3.31+)

<Warning>
**Perubahan yang memutus kompatibilitas:** Proses yang berasal dari node kini tetap berada pada permukaan tepercaya yang diperkecil.
</Warning>

Ringkasan yang berasal dari node dan peristiwa sesi terkait dibatasi pada permukaan tepercaya yang dimaksud. Alur yang digerakkan notifikasi atau dipicu node yang sebelumnya mengandalkan akses tool host atau sesi yang lebih luas mungkin perlu disesuaikan. Hardening ini memastikan bahwa peristiwa node tidak dapat meningkat menjadi akses tool tingkat host di luar yang diizinkan oleh batas kepercayaan node tersebut.

## Auto-approval (aplikasi macOS)

Aplikasi macOS secara opsional dapat mencoba **silent approval** ketika:

- permintaan ditandai `silent`, dan
- aplikasi dapat memverifikasi koneksi SSH ke host gateway menggunakan pengguna yang sama.

Jika silent approval gagal, proses kembali ke prompt “Approve/Reject” normal.

## Auto-approval device trusted-CIDR

Device pairing WS untuk `role: node` tetap manual secara default. Untuk
jaringan node privat tempat Gateway sudah mempercayai jalur jaringan, operator dapat
melakukan opt-in dengan CIDR eksplisit atau IP persis:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Batas keamanan:

- Dinonaktifkan saat `gateway.nodes.pairing.autoApproveCidrs` tidak disetel.
- Tidak ada mode auto-approve LAN atau jaringan privat menyeluruh.
- Hanya device pairing `role: node` baru tanpa scope yang diminta yang memenuhi syarat.
- Klien operator, browser, Control UI, dan WebChat tetap manual.
- Upgrade role, scope, metadata, dan public key tetap manual.
- Jalur header trusted-proxy loopback pada host yang sama tidak memenuhi syarat karena
  jalur tersebut dapat dipalsukan oleh pemanggil lokal.

## Auto-approval upgrade metadata

Saat device yang sudah dipasangkan terhubung kembali hanya dengan perubahan metadata
yang tidak sensitif (misalnya, display name atau petunjuk platform klien), OpenClaw memperlakukannya
sebagai `metadata-upgrade`. Silent auto-approval bersifat sempit: hanya berlaku untuk
reconnect CLI/helper lokal tepercaya yang sudah membuktikan kepemilikan
token atau password bersama melalui loopback. Klien browser/Control UI dan klien remote
tetap menggunakan alur persetujuan ulang eksplisit. Upgrade scope (read ke
write/admin) dan perubahan public key **tidak** memenuhi syarat untuk auto-approval
metadata-upgrade — keduanya tetap menjadi permintaan persetujuan ulang eksplisit.

## Helper pairing QR

`/pair qr` merender payload pairing sebagai media terstruktur sehingga klien mobile dan
browser dapat memindainya secara langsung.

Menghapus device juga membersihkan permintaan pairing tertunda lama untuk
ID device tersebut, sehingga `nodes pending` tidak menampilkan baris yatim setelah revoke.

## Lokalitas dan header yang diteruskan

Gateway pairing memperlakukan koneksi sebagai loopback hanya ketika socket mentah
dan bukti proxy upstream sama-sama sepakat. Jika permintaan tiba di loopback tetapi
membawa header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` yang
menunjuk ke asal non-lokal, bukti forwarded-header tersebut menggugurkan klaim lokalitas loopback. Jalur pairing kemudian memerlukan persetujuan eksplisit
alih-alih diam-diam memperlakukan permintaan sebagai koneksi host yang sama. Lihat
[Trusted Proxy Auth](/id/gateway/trusted-proxy-auth) untuk aturan setara pada
auth operator.

## Penyimpanan (lokal, privat)

Status pairing disimpan di bawah direktori status Gateway (default `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Jika Anda menimpa `OPENCLAW_STATE_DIR`, folder `nodes/` ikut berpindah.

Catatan keamanan:

- Token adalah secret; perlakukan `paired.json` sebagai sensitif.
- Merotasi token memerlukan persetujuan ulang (atau menghapus entri node).

## Perilaku transport

- Transport **tidak menyimpan status**; ia tidak menyimpan keanggotaan.
- Jika Gateway offline atau pairing dinonaktifkan, node tidak dapat melakukan pairing.
- Jika Gateway berada dalam mode remote, pairing tetap terjadi terhadap penyimpanan Gateway remote.

## Terkait

- [Channel pairing](/id/channels/pairing)
- [Nodes](/id/nodes)
- [Devices CLI](/id/cli/devices)
