---
read_when:
    - Anda ingin menjalankan audit keamanan cepat pada config/status
    - Anda ingin menerapkan saran “perbaikan” yang aman (izin, memperketat default)
summary: Referensi CLI untuk `openclaw security` (audit dan perbaiki footgun keamanan yang umum)
title: keamanan
x-i18n:
    generated_at: "2026-04-23T09:19:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92b80468403b7d329391c40add9ae9c0e2423f5c6ff162291fa13ab91ace985d
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

Alat keamanan (audit + perbaikan opsional).

Terkait:

- Panduan keamanan: [Keamanan](/id/gateway/security)

## Audit

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

Audit ini memberi peringatan saat beberapa pengirim DM berbagi sesi utama dan merekomendasikan **mode DM aman**: `session.dmScope="per-channel-peer"` (atau `per-account-channel-peer` untuk saluran multi-akun) bagi inbox bersama.
Ini ditujukan untuk hardening inbox kooperatif/bersama. Satu Gateway yang dibagi oleh operator yang saling tidak tepercaya/adversarial bukanlah penyiapan yang direkomendasikan; pisahkan batas kepercayaan dengan gateway terpisah (atau pengguna OS/host terpisah).
Audit ini juga menghasilkan `security.trust_model.multi_user_heuristic` saat config menunjukkan ingress multi-pengguna bersama yang mungkin (misalnya kebijakan DM/grup terbuka, target grup yang dikonfigurasi, atau aturan pengirim wildcard), dan mengingatkan bahwa model kepercayaan default OpenClaw adalah asisten pribadi.
Untuk penyiapan multi-pengguna yang disengaja, panduan auditnya adalah mengisolasi semua sesi, menjaga akses filesystem tetap terikat pada workspace, serta menjauhkan identitas atau kredensial pribadi/privat dari runtime tersebut.
Audit ini juga memperingatkan saat model kecil (`<=300B`) digunakan tanpa sandboxing dan dengan alat web/browser diaktifkan.
Untuk ingress webhook, audit ini memperingatkan saat `hooks.token` memakai ulang token Gateway, saat `hooks.token` pendek, saat `hooks.path="/"`, saat `hooks.defaultSessionKey` tidak diatur, saat `hooks.allowedAgentIds` tidak dibatasi, saat override `sessionKey` permintaan diaktifkan, dan saat override diaktifkan tanpa `hooks.allowedSessionKeyPrefixes`.
Audit ini juga memperingatkan saat pengaturan Docker sandbox dikonfigurasi sementara mode sandbox nonaktif, saat `gateway.nodes.denyCommands` menggunakan entri mirip pola/tidak dikenal yang tidak efektif (hanya pencocokan nama perintah node yang persis, bukan pemfilteran teks shell), saat `gateway.nodes.allowCommands` secara eksplisit mengaktifkan perintah node berbahaya, saat `tools.profile="minimal"` global dioverride oleh profil alat agen, saat grup terbuka mengekspos alat runtime/filesystem tanpa guard sandbox/workspace, dan saat alat Plugin yang terinstal mungkin dapat dijangkau di bawah kebijakan alat yang permisif.
Audit ini juga menandai `gateway.allowRealIpFallback=true` (risiko spoofing header jika proxy salah konfigurasi) dan `discovery.mdns.mode="full"` (kebocoran metadata melalui rekaman mDNS TXT).
Audit ini juga memperingatkan saat browser sandbox menggunakan jaringan Docker `bridge` tanpa `sandbox.browser.cdpSourceRange`.
Audit ini juga menandai mode jaringan Docker sandbox yang berbahaya (termasuk `host` dan penggabungan namespace `container:*`).
Audit ini juga memperingatkan saat container Docker browser sandbox yang ada memiliki label hash yang hilang/kedaluwarsa (misalnya container pra-migrasi yang tidak memiliki `openclaw.browserConfigEpoch`) dan merekomendasikan `openclaw sandbox recreate --browser --all`.
Audit ini juga memperingatkan saat rekaman instalasi Plugin/hook berbasis npm tidak dipin, tidak memiliki metadata integritas, atau menyimpang dari versi package yang saat ini terinstal.
Audit ini memperingatkan saat allowlist saluran mengandalkan nama/email/tag yang dapat berubah, bukan ID stabil (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC scope jika berlaku).
Audit ini memperingatkan saat `gateway.auth.mode="none"` membuat API HTTP Gateway dapat dijangkau tanpa secret bersama (`/tools/invoke` plus endpoint `/v1/*` apa pun yang diaktifkan).
Pengaturan dengan prefiks `dangerous`/`dangerously` adalah override operator break-glass yang eksplisit; mengaktifkan salah satunya, dengan sendirinya, bukan laporan kerentanan keamanan.
Untuk inventaris lengkap parameter berbahaya, lihat bagian "Insecure or dangerous flags summary" di [Keamanan](/id/gateway/security).

Perilaku SecretRef:

- `security audit` menyelesaikan SecretRef yang didukung dalam mode read-only untuk path yang ditargetkan.
- Jika SecretRef tidak tersedia pada path perintah saat ini, audit akan tetap berjalan dan melaporkan `secretDiagnostics` (bukan crash).
- `--token` dan `--password` hanya mengoverride auth deep-probe untuk pemanggilan perintah tersebut; keduanya tidak menulis ulang config atau pemetaan SecretRef.

## Output JSON

Gunakan `--json` untuk pemeriksaan CI/kebijakan:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Jika `--fix` dan `--json` digabungkan, output mencakup aksi perbaikan dan laporan akhir:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Apa yang diubah oleh `--fix`

`--fix` menerapkan remedi yang aman dan deterministik:

- membalik `groupPolicy="open"` yang umum menjadi `groupPolicy="allowlist"` (termasuk varian akun di saluran yang didukung)
- saat kebijakan grup WhatsApp dibalik ke `allowlist`, mengisi `groupAllowFrom` dari
  file `allowFrom` yang tersimpan ketika daftar itu ada dan config belum
  mendefinisikan `allowFrom`
- menetapkan `logging.redactSensitive` dari `"off"` menjadi `"tools"`
- memperketat izin untuk file status/config dan file sensitif umum
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, session
  `*.jsonl`)
- juga memperketat file include config yang direferensikan dari `openclaw.json`
- menggunakan `chmod` pada host POSIX dan reset `icacls` pada Windows

`--fix` **tidak**:

- merotasi token/password/API key
- menonaktifkan alat (`gateway`, `cron`, `exec`, dll.)
- mengubah pilihan bind/auth/eksposur jaringan gateway
- menghapus atau menulis ulang Plugin/Skills
