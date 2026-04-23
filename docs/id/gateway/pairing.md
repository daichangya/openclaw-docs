---
read_when:
    - Menerapkan persetujuan pairing Node tanpa UI macOS
    - Menambahkan alur CLI untuk menyetujui Node remote
    - Memperluas protokol Gateway dengan manajemen Node
summary: Pairing Node milik Gateway (Opsi B) untuk iOS dan Node remote lainnya
title: Pairing Milik Gateway
x-i18n:
    generated_at: "2026-04-23T09:21:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: f644f2dd9a79140156646a78df2a83f0940e3db8160cb083453e43c108eacf3a
    source_path: gateway/pairing.md
    workflow: 15
---

# Pairing milik Gateway (Opsi B)

Dalam pairing milik Gateway, **Gateway** adalah sumber kebenaran untuk menentukan node
mana yang diizinkan bergabung. UI (aplikasi macOS, klien masa depan) hanyalah frontend yang
menyetujui atau menolak permintaan tertunda.

**Penting:** WS node menggunakan **device pairing** (role `node`) selama `connect`.
`node.pair.*` adalah penyimpanan pairing terpisah dan **tidak** mengendalikan handshake WS.
Hanya klien yang secara eksplisit memanggil `node.pair.*` yang menggunakan alur ini.

## Konsep

- **Permintaan tertunda**: sebuah node meminta untuk bergabung; memerlukan persetujuan.
- **Node ter-pairing**: node yang disetujui dengan token auth yang diterbitkan.
- **Transport**: endpoint WS Gateway meneruskan permintaan tetapi tidak memutuskan
  keanggotaan. (Dukungan bridge TCP legacy telah dihapus.)

## Cara kerja pairing

1. Sebuah node terhubung ke Gateway WS dan meminta pairing.
2. Gateway menyimpan **permintaan tertunda** dan memancarkan `node.pair.requested`.
3. Anda menyetujui atau menolak permintaan tersebut (CLI atau UI).
4. Saat disetujui, Gateway menerbitkan **token baru** (token dirotasi saat re-pair).
5. Node terhubung kembali menggunakan token dan kini berstatus “ter-pairing”.

Permintaan tertunda otomatis kedaluwarsa setelah **5 menit**.

## Alur kerja CLI (ramah headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` menampilkan node yang ter-pairing/terhubung beserta kapabilitasnya.

## Permukaan API (protokol Gateway)

Event:

- `node.pair.requested` — dipancarkan saat permintaan tertunda baru dibuat.
- `node.pair.resolved` — dipancarkan saat sebuah permintaan disetujui/ditolak/kedaluwarsa.

Metode:

- `node.pair.request` — membuat atau menggunakan kembali permintaan tertunda.
- `node.pair.list` — mencantumkan node tertunda + ter-pairing (`operator.pairing`).
- `node.pair.approve` — menyetujui permintaan tertunda (menerbitkan token).
- `node.pair.reject` — menolak permintaan tertunda.
- `node.pair.verify` — memverifikasi `{ nodeId, token }`.

Catatan:

- `node.pair.request` bersifat idempoten per node: panggilan berulang mengembalikan
  permintaan tertunda yang sama.
- Permintaan berulang untuk node tertunda yang sama juga menyegarkan metadata node yang tersimpan
  dan snapshot perintah yang dideklarasikan dalam allowlist terbaru untuk visibilitas operator.
- Persetujuan **selalu** menghasilkan token baru; tidak ada token yang pernah dikembalikan dari
  `node.pair.request`.
- Permintaan dapat menyertakan `silent: true` sebagai petunjuk untuk alur auto-approval.
- `node.pair.approve` menggunakan perintah yang dideklarasikan pada permintaan tertunda untuk menegakkan
  cakupan persetujuan tambahan:
  - permintaan tanpa perintah: `operator.pairing`
  - permintaan perintah non-exec: `operator.pairing` + `operator.write`
  - permintaan `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Penting:

- Pairing node adalah alur trust/identitas plus penerbitan token.
- Ini **tidak** menyematkan permukaan perintah node live per node.
- Perintah node live berasal dari apa yang dideklarasikan node saat connect setelah
  kebijakan perintah node global Gateway (`gateway.nodes.allowCommands` /
  `denyCommands`) diterapkan.
- Kebijakan izinkan/tanya `system.run` per node berada pada node di
  `exec.approvals.node.*`, bukan di catatan pairing.

## Gating perintah node (2026.3.31+)

<Warning>
**Perubahan yang memutus kompatibilitas:** Mulai `2026.3.31`, perintah node dinonaktifkan sampai pairing node disetujui. Device pairing saja tidak lagi cukup untuk mengekspos perintah node yang dideklarasikan.
</Warning>

Saat sebuah node terhubung untuk pertama kali, pairing diminta secara otomatis. Sampai permintaan pairing disetujui, semua perintah node tertunda dari node tersebut difilter dan tidak akan dijalankan. Setelah trust dibangun melalui persetujuan pairing, perintah yang dideklarasikan node menjadi tersedia sesuai kebijakan perintah normal.

Ini berarti:

- Node yang sebelumnya mengandalkan device pairing saja untuk mengekspos perintah kini harus menyelesaikan pairing node.
- Perintah yang diantrikan sebelum persetujuan pairing dibuang, bukan ditunda.

## Batas trust event node (2026.3.31+)

<Warning>
**Perubahan yang memutus kompatibilitas:** Eksekusi yang berasal dari node kini tetap berada pada permukaan trust yang dikurangi.
</Warning>

Ringkasan yang berasal dari node dan event sesi terkait dibatasi ke permukaan trust yang dimaksud. Alur berbasis notifikasi atau yang dipicu node yang sebelumnya bergantung pada akses tool host atau sesi yang lebih luas mungkin perlu disesuaikan. Hardening ini memastikan bahwa event node tidak dapat meningkat menjadi akses tool level host di luar batas trust yang diizinkan node.

## Auto-approval (aplikasi macOS)

Aplikasi macOS secara opsional dapat mencoba **persetujuan senyap** ketika:

- permintaan ditandai `silent`, dan
- aplikasi dapat memverifikasi koneksi SSH ke host Gateway menggunakan pengguna yang sama.

Jika persetujuan senyap gagal, alur akan fallback ke prompt “Setujui/Tolak” normal.

## Auto-approval upgrade metadata

Saat perangkat yang sudah ter-pairing terhubung kembali hanya dengan perubahan metadata yang tidak sensitif
(misalnya, nama tampilan atau petunjuk platform klien), OpenClaw memperlakukannya
sebagai `metadata-upgrade`. Auto-approval senyap bersifat sempit: hanya berlaku untuk reconnect CLI/helper lokal tepercaya yang sudah membuktikan kepemilikan token atau password bersama melalui loopback. Klien browser/Control UI dan klien remote tetap menggunakan alur persetujuan ulang eksplisit. Upgrade cakupan (read ke write/admin) dan perubahan public key **tidak** memenuhi syarat untuk auto-approval metadata-upgrade — keduanya tetap menjadi permintaan persetujuan ulang eksplisit.

## Helper pairing QR

`/pair qr` merender payload pairing sebagai media terstruktur sehingga klien mobile dan
browser dapat memindainya secara langsung.

Menghapus perangkat juga membersihkan permintaan pairing tertunda usang untuk
id perangkat tersebut, sehingga `nodes pending` tidak menampilkan baris yatim setelah pencabutan.

## Lokalitas dan header yang diteruskan

Pairing Gateway memperlakukan koneksi sebagai loopback hanya ketika socket mentah
dan bukti proxy upstream sama-sama setuju. Jika sebuah permintaan datang melalui loopback tetapi
membawa header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
yang menunjuk ke asal non-lokal, bukti forwarded-header itu menggugurkan klaim lokalitas loopback. Jalur pairing kemudian memerlukan persetujuan eksplisit
alih-alih memperlakukan permintaan secara senyap sebagai koneksi host yang sama. Lihat
[Auth Proxy Tepercaya](/id/gateway/trusted-proxy-auth) untuk aturan setara pada
auth operator.

## Penyimpanan (lokal, privat)

State pairing disimpan di bawah direktori state Gateway (default `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Jika Anda menimpa `OPENCLAW_STATE_DIR`, folder `nodes/` ikut berpindah.

Catatan keamanan:

- Token adalah rahasia; perlakukan `paired.json` sebagai sensitif.
- Merotasi token memerlukan persetujuan ulang (atau menghapus entri node).

## Perilaku transport

- Transport bersifat **stateless**; tidak menyimpan keanggotaan.
- Jika Gateway offline atau pairing dinonaktifkan, node tidak dapat melakukan pairing.
- Jika Gateway berada dalam mode remote, pairing tetap terjadi terhadap penyimpanan Gateway remote.
