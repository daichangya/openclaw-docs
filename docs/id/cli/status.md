---
read_when:
    - Anda menginginkan diagnosis cepat tentang kesehatan saluran + penerima sesi terbaru
    - Anda menginginkan status “all” yang bisa langsung ditempel untuk debugging
summary: Referensi CLI untuk `openclaw status` (diagnostik, probe, snapshot penggunaan)
title: Status
x-i18n:
    generated_at: "2026-04-25T13:44:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: b191b8d78d43fb9426bfad495815fd06ab7188b413beff6fb7eb90f811b6d261
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

Diagnostik untuk saluran + sesi.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Catatan:

- `--deep` menjalankan probe live (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage` mencetak jendela penggunaan provider yang dinormalisasi sebagai `X% left`.
- Output status sesi memisahkan `Execution:` dari `Runtime:`. `Execution` adalah path sandbox (`direct`, `docker/*`), sedangkan `Runtime` memberi tahu Anda apakah sesi menggunakan `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI, atau backend ACP seperti `codex (acp/acpx)`. Lihat [runtime agent](/id/concepts/agent-runtimes) untuk perbedaan provider/model/runtime.
- Field mentah `usage_percent` / `usagePercent` MiniMax adalah kuota yang tersisa, jadi OpenClaw membalikkannya sebelum ditampilkan; field berbasis hitungan diutamakan jika ada. Respons `model_remains` mengutamakan entri model chat, menurunkan label jendela dari timestamp bila diperlukan, dan menyertakan nama model dalam label paket.
- Saat snapshot sesi saat ini jarang, `/status` dapat mengisi kembali penghitung token dan cache dari log penggunaan transkrip terbaru. Nilai live nonzero yang sudah ada tetap diutamakan dibanding nilai fallback transkrip.
- Fallback transkrip juga dapat memulihkan label model runtime aktif saat entri sesi live tidak memilikinya. Jika model transkrip itu berbeda dari model yang dipilih, status menyelesaikan context window terhadap model runtime yang dipulihkan alih-alih model yang dipilih.
- Untuk perhitungan ukuran prompt, fallback transkrip mengutamakan total berorientasi prompt yang lebih besar saat metadata sesi tidak ada atau lebih kecil, sehingga sesi custom-provider tidak turun menjadi tampilan token `0`.
- Output mencakup penyimpanan sesi per agent saat beberapa agent dikonfigurasi.
- Ikhtisar mencakup status instalasi/runtime layanan host Gateway + node saat tersedia.
- Ikhtisar mencakup saluran pembaruan + SHA git (untuk checkout sumber).
- Informasi pembaruan ditampilkan di Ikhtisar; jika pembaruan tersedia, status mencetak petunjuk untuk menjalankan `openclaw update` (lihat [Memperbarui](/id/install/updating)).
- Permukaan status read-only (`status`, `status --json`, `status --all`) menyelesaikan SecretRef yang didukung untuk path konfigurasi targetnya bila memungkinkan.
- Jika SecretRef saluran yang didukung dikonfigurasi tetapi tidak tersedia dalam path perintah saat ini, status tetap read-only dan melaporkan output terdegradasi alih-alih crash. Output untuk manusia menampilkan peringatan seperti “configured token unavailable in this command path”, dan output JSON menyertakan `secretDiagnostics`.
- Saat resolusi SecretRef lokal-perintah berhasil, status mengutamakan snapshot yang telah diselesaikan dan menghapus penanda saluran “secret unavailable” sementara dari output akhir.
- `status --all` mencakup baris ikhtisar Secrets dan bagian diagnosis yang merangkum diagnostik secret (dipotong demi keterbacaan) tanpa menghentikan pembuatan laporan.

## Terkait

- [Referensi CLI](/id/cli)
- [Doctor](/id/gateway/doctor)
