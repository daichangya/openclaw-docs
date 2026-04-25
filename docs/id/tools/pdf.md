---
read_when:
    - Anda ingin menganalisis PDF dari agen
    - Anda memerlukan parameter dan batas alat pdf yang tepat
    - Anda sedang men-debug mode PDF native versus fallback ekstraksi
summary: Analisis satu atau lebih dokumen PDF dengan dukungan provider native dan fallback ekstraksi
title: Alat PDF
x-i18n:
    generated_at: "2026-04-25T13:58:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89bbc675f2b87729e283659f9604724be7a827b50b11edc853a42c448bbaaf6e
    source_path: tools/pdf.md
    workflow: 15
---

`pdf` menganalisis satu atau lebih dokumen PDF dan mengembalikan teks.

Perilaku singkat:

- Mode provider native untuk provider model Anthropic dan Google.
- Mode fallback ekstraksi untuk provider lain (ekstrak teks terlebih dahulu, lalu gambar halaman bila diperlukan).
- Mendukung input tunggal (`pdf`) atau multi (`pdfs`), maksimum 10 PDF per pemanggilan.

## Ketersediaan

Alat ini hanya didaftarkan ketika OpenClaw dapat meresolusikan konfigurasi model yang mendukung PDF untuk agen:

1. `agents.defaults.pdfModel`
2. fallback ke `agents.defaults.imageModel`
3. fallback ke model sesi/default yang telah diresolusikan untuk agen
4. jika provider PDF-native berbasis auth, utamakan mereka di depan kandidat fallback image generik

Jika tidak ada model yang dapat digunakan yang bisa diresolusikan, alat `pdf` tidak diekspos.

Catatan ketersediaan:

- Rantai fallback sadar-auth. `provider/model` yang dikonfigurasi hanya dihitung jika
  OpenClaw benar-benar dapat mengautentikasi provider tersebut untuk agen.
- Provider PDF native saat ini adalah **Anthropic** dan **Google**.
- Jika provider sesi/default yang telah diresolusikan sudah memiliki model vision/PDF
  yang dikonfigurasi, alat PDF akan menggunakannya kembali sebelum fallback ke provider
  lain yang berbasis auth.

## Referensi input

<ParamField path="pdf" type="string">
Satu path atau URL PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
Beberapa path atau URL PDF, hingga total 10.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Prompt analisis.
</ParamField>

<ParamField path="pages" type="string">
Filter halaman seperti `1-5` atau `1,3,7-9`.
</ParamField>

<ParamField path="model" type="string">
Override model opsional dalam bentuk `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Batas ukuran per PDF dalam MB. Default ke `agents.defaults.pdfMaxBytesMb` atau `10`.
</ParamField>

Catatan input:

- `pdf` dan `pdfs` digabungkan dan dideduplikasi sebelum dimuat.
- Jika tidak ada input PDF yang diberikan, alat mengembalikan error.
- `pages` diparse sebagai nomor halaman berbasis 1, dideduplikasi, diurutkan, dan dibatasi ke jumlah halaman maksimum yang dikonfigurasi.
- `maxBytesMb` default ke `agents.defaults.pdfMaxBytesMb` atau `10`.

## Referensi PDF yang didukung

- path file lokal (termasuk ekspansi `~`)
- URL `file://`
- URL `http://` dan `https://`
- ref inbound yang dikelola OpenClaw seperti `media://inbound/<id>`

Catatan referensi:

- Skema URI lain (misalnya `ftp://`) ditolak dengan `unsupported_pdf_reference`.
- Dalam mode sandbox, URL `http(s)` jarak jauh ditolak.
- Dengan kebijakan file workspace-only aktif, path file lokal di luar root yang diizinkan akan ditolak.
- Ref inbound terkelola dan path replay di bawah penyimpanan media inbound OpenClaw diizinkan dengan kebijakan file workspace-only.

## Mode eksekusi

### Mode provider native

Mode native digunakan untuk provider `anthropic` dan `google`.
Alat mengirim byte PDF mentah langsung ke API provider.

Batas mode native:

- `pages` tidak didukung. Jika disetel, alat mengembalikan error.
- Input multi-PDF didukung; setiap PDF dikirim sebagai blok dokumen native /
  bagian PDF inline sebelum prompt.

### Mode fallback ekstraksi

Mode fallback digunakan untuk provider non-native.

Alur:

1. Ekstrak teks dari halaman yang dipilih (hingga `agents.defaults.pdfMaxPages`, default `20`).
2. Jika panjang teks yang diekstrak di bawah `200` karakter, render halaman yang dipilih ke gambar PNG dan sertakan.
3. Kirim konten yang diekstrak plus prompt ke model yang dipilih.

Detail fallback:

- Ekstraksi gambar halaman menggunakan anggaran piksel `4,000,000`.
- Jika model target tidak mendukung input gambar dan tidak ada teks yang dapat diekstrak, alat mengembalikan error.
- Jika ekstraksi teks berhasil tetapi ekstraksi gambar akan memerlukan vision pada
  model text-only, OpenClaw menghapus gambar yang dirender dan melanjutkan dengan teks
  yang diekstrak.
- Fallback ekstraksi menggunakan Plugin `document-extract` yang dibundel. Plugin tersebut memiliki
  `pdfjs-dist`; `@napi-rs/canvas` hanya digunakan ketika fallback rendering gambar
  tersedia.

## Konfigurasi

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

Lihat [Referensi Konfigurasi](/id/gateway/configuration-reference) untuk detail field lengkap.

## Detail output

Alat ini mengembalikan teks di `content[0].text` dan metadata terstruktur di `details`.

Field `details` umum:

- `model`: ref model yang diresolusikan (`provider/model`)
- `native`: `true` untuk mode provider native, `false` untuk fallback
- `attempts`: upaya fallback yang gagal sebelum berhasil

Field path:

- input PDF tunggal: `details.pdf`
- input beberapa PDF: `details.pdfs[]` dengan entri `pdf`
- metadata penulisan ulang path sandbox (jika berlaku): `rewrittenFrom`

## Perilaku error

- Input PDF hilang: melempar `pdf required: provide a path or URL to a PDF document`
- Terlalu banyak PDF: mengembalikan error terstruktur dalam `details.error = "too_many_pdfs"`
- Skema referensi tidak didukung: mengembalikan `details.error = "unsupported_pdf_reference"`
- Mode native dengan `pages`: melempar error yang jelas `pages is not supported with native PDF providers`

## Contoh

PDF tunggal:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

Beberapa PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

Model fallback dengan filter halaman:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## Terkait

- [Ikhtisar Alat](/id/tools) — semua alat agen yang tersedia
- [Referensi Konfigurasi](/id/gateway/config-agents#agent-defaults) — konfigurasi pdfMaxBytesMb dan pdfMaxPages
