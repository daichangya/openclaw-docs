---
read_when:
    - Anda sedang menyetujui permintaan pairing perangkat
    - Anda perlu merotasi atau mencabut token perangkat
summary: Referensi CLI untuk `openclaw devices` (pairing perangkat + rotasi/pencabutan token)
title: perangkat
x-i18n:
    generated_at: "2026-04-23T09:18:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e58d2dff7fc22a11ff372f4937907977dab0ffa9f971b9c0bffeb3e347caf66
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Kelola permintaan pairing perangkat dan token yang dicakup per perangkat.

## Perintah

### `openclaw devices list`

Daftarkan permintaan pairing yang tertunda dan perangkat yang sudah dipasangkan.

```
openclaw devices list
openclaw devices list --json
```

Output permintaan tertunda menampilkan akses yang diminta di samping akses yang saat ini
disetujui untuk perangkat tersebut ketika perangkat sudah dipasangkan. Ini membuat
peningkatan scope/peran menjadi eksplisit alih-alih terlihat seolah pairing hilang.

### `openclaw devices remove <deviceId>`

Hapus satu entri perangkat yang sudah dipasangkan.

Saat Anda diautentikasi dengan token perangkat yang sudah dipasangkan, pemanggil non-admin hanya dapat
menghapus entri perangkat **milik mereka sendiri**. Menghapus perangkat lain memerlukan
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Hapus perangkat yang sudah dipasangkan secara massal.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Setujui permintaan pairing perangkat yang tertunda berdasarkan `requestId` yang tepat. Jika `requestId`
dihilangkan atau `--latest` diberikan, OpenClaw hanya mencetak permintaan tertunda
yang dipilih lalu keluar; jalankan kembali persetujuan dengan ID permintaan yang tepat setelah memverifikasi
detailnya.

Catatan: jika perangkat mencoba pairing ulang dengan detail auth yang berubah (peran/scope/public
key), OpenClaw menggantikan entri tertunda sebelumnya dan menerbitkan
`requestId` baru. Jalankan `openclaw devices list` tepat sebelum persetujuan untuk menggunakan
ID saat ini.

Jika perangkat sudah dipasangkan dan meminta scope yang lebih luas atau peran yang lebih luas,
OpenClaw mempertahankan persetujuan yang ada dan membuat permintaan peningkatan
tertunda yang baru. Tinjau kolom `Requested` vs `Approved` di `openclaw devices list`
atau gunakan `openclaw devices approve --latest` untuk melihat pratinjau peningkatan yang tepat sebelum
menyetujuinya.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Tolak permintaan pairing perangkat yang tertunda.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Rotasi token perangkat untuk peran tertentu (opsional sambil memperbarui scope).
Peran target harus sudah ada dalam kontrak pairing yang disetujui untuk perangkat tersebut;
rotasi tidak dapat menerbitkan peran baru yang belum disetujui.
Jika Anda menghilangkan `--scope`, koneksi ulang berikutnya dengan token yang dirotasi dan disimpan akan menggunakan kembali
scope yang disetujui yang di-cache oleh token tersebut. Jika Anda memberikan nilai `--scope` yang eksplisit, nilai tersebut
menjadi kumpulan scope yang disimpan untuk koneksi ulang token-cache di masa mendatang.
Pemanggil perangkat berpasangan non-admin hanya dapat merotasi token perangkat **milik mereka sendiri**.
Selain itu, setiap nilai `--scope` yang eksplisit harus tetap berada dalam scope operator
milik sesi pemanggil itu sendiri; rotasi tidak dapat menerbitkan token operator yang lebih luas daripada yang
sudah dimiliki pemanggil.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Mengembalikan payload token baru sebagai JSON.

### `openclaw devices revoke --device <id> --role <role>`

Cabut token perangkat untuk peran tertentu.

Pemanggil perangkat berpasangan non-admin hanya dapat mencabut token perangkat **milik mereka sendiri**.
Pencabutan token perangkat lain memerlukan `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

Mengembalikan hasil pencabutan sebagai JSON.

## Opsi umum

- `--url <url>`: URL WebSocket Gateway (default ke `gateway.remote.url` jika dikonfigurasi).
- `--token <token>`: token Gateway (jika diperlukan).
- `--password <password>`: kata sandi Gateway (auth kata sandi).
- `--timeout <ms>`: timeout RPC.
- `--json`: output JSON (direkomendasikan untuk scripting).

Catatan: saat Anda mengatur `--url`, CLI tidak fallback ke kredensial config atau environment.
Berikan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang tidak ada adalah sebuah error.

## Catatan

- Rotasi token mengembalikan token baru (sensitif). Perlakukan sebagai rahasia.
- Perintah ini memerlukan scope `operator.pairing` (atau `operator.admin`).
- Rotasi token tetap berada dalam kumpulan peran pairing yang disetujui dan baseline scope
  yang disetujui untuk perangkat tersebut. Entri token cache yang menyimpang tidak memberikan target
  rotasi baru.
- Untuk sesi token perangkat berpasangan, pengelolaan lintas perangkat hanya untuk admin:
  `remove`, `rotate`, dan `revoke` hanya untuk diri sendiri kecuali pemanggil memiliki
  `operator.admin`.
- `devices clear` sengaja dibatasi oleh `--yes`.
- Jika scope pairing tidak tersedia pada local loopback (dan tidak ada `--url` eksplisit yang diberikan), list/approve dapat menggunakan fallback pairing lokal.
- `devices approve` memerlukan ID permintaan eksplisit sebelum menerbitkan token; menghilangkan `requestId` atau memberikan `--latest` hanya menampilkan pratinjau permintaan tertunda terbaru.

## Checklist pemulihan token drift

Gunakan ini saat Control UI atau klien lain terus gagal dengan `AUTH_TOKEN_MISMATCH` atau `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Konfirmasikan sumber token Gateway saat ini:

```bash
openclaw config get gateway.auth.token
```

2. Daftarkan perangkat yang sudah dipasangkan dan identifikasi ID perangkat yang terdampak:

```bash
openclaw devices list
```

3. Rotasi token operator untuk perangkat yang terdampak:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Jika rotasi tidak cukup, hapus pairing yang stale dan setujui lagi:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Coba ulang koneksi klien dengan token/kata sandi bersama yang saat ini berlaku.

Catatan:

- Prioritas auth koneksi ulang normal adalah token/kata sandi bersama eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token perangkat yang disimpan, lalu token bootstrap.
- Pemulihan `AUTH_TOKEN_MISMATCH` tepercaya dapat sementara mengirim token bersama dan token perangkat yang disimpan bersama-sama untuk satu percobaan ulang terbatas tersebut.

Terkait:

- [Pemecahan masalah auth Dashboard](/id/web/dashboard#if-you-see-unauthorized-1008)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting#dashboard-control-ui-connectivity)
