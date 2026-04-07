---
read_when:
    - Anda sedang menghubungkan transport QA sintetis ke dalam pengujian lokal atau CI
    - Anda memerlukan permukaan konfigurasi `qa-channel` bawaan
    - Anda sedang melakukan iterasi pada otomatisasi QA end-to-end
summary: Plugin channel sintetis kelas Slack untuk skenario QA OpenClaw yang deterministik
title: Channel QA
x-i18n:
    generated_at: "2026-04-07T09:12:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 65c2c908d3ec27c827087616c4ea278f10686810091058321ff26f68296a1782
    source_path: channels/qa-channel.md
    workflow: 15
---

# Channel QA

`qa-channel` adalah transport pesan sintetis bawaan untuk QA OpenClaw otomatis.

Ini bukan channel produksi. Channel ini ada untuk menguji batas plugin channel
yang sama seperti yang digunakan oleh transport nyata sambil menjaga state tetap
deterministik dan sepenuhnya dapat diperiksa.

## Apa yang dilakukannya saat ini

- Tata bahasa target kelas Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- Bus sintetis berbasis HTTP untuk:
  - injeksi pesan masuk
  - penangkapan transkrip keluar
  - pembuatan thread
  - reaksi
  - pengeditan
  - penghapusan
  - tindakan pencarian dan pembacaan
- Runner pemeriksaan mandiri bawaan di sisi host yang menulis laporan Markdown

## Konfigurasi

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

Kunci akun yang didukung:

- `baseUrl`
- `botUserId`
- `botDisplayName`
- `pollTimeoutMs`
- `allowFrom`
- `defaultTo`
- `actions.messages`
- `actions.reactions`
- `actions.search`
- `actions.threads`

## Runner

Irisan vertikal saat ini:

```bash
pnpm qa:e2e
```

Ini sekarang dirutekan melalui ekstensi `qa-lab` bawaan. Ini memulai
bus QA di dalam repo, menjalankan irisan runtime `qa-channel` bawaan,
menjalankan pemeriksaan mandiri yang deterministik, dan menulis laporan Markdown
di bawah `.artifacts/qa-e2e/`.

UI debugger privat:

```bash
pnpm qa:lab:up
```

Satu perintah itu membangun situs QA, memulai stack gateway + QA Lab
berbasis Docker, dan mencetak URL QA Lab. Dari situs itu Anda dapat memilih
skenario, memilih jalur model, meluncurkan setiap pengujian, dan memantau
hasilnya secara langsung.

Suite QA lengkap berbasis repo:

```bash
pnpm openclaw qa suite
```

Itu meluncurkan debugger QA privat di URL lokal, terpisah dari bundle
Control UI yang dikirimkan.

## Cakupan

Cakupan saat ini sengaja dibuat sempit:

- bus + transport plugin
- tata bahasa perutean berulir
- tindakan pesan yang dimiliki channel
- pelaporan Markdown
- situs QA berbasis Docker dengan kontrol pengujian

Pekerjaan lanjutan akan menambahkan:

- eksekusi matriks provider/model
- penemuan skenario yang lebih kaya
- orkestrasi native OpenClaw di kemudian hari
