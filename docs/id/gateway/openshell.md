---
read_when:
    - Anda ingin sandbox yang dikelola di cloud alih-alih Docker lokal
    - Anda sedang menyiapkan Plugin OpenShell
    - Anda perlu memilih antara mode workspace mirror dan remote
summary: Gunakan OpenShell sebagai backend sandbox terkelola untuk agen OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-23T09:21:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534127b293364659a14df3e36583a9b7120f5d55cdbd8b4b611efe44adc7ff8
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell adalah backend sandbox terkelola untuk OpenClaw. Alih-alih menjalankan container Docker
secara lokal, OpenClaw mendelegasikan siklus hidup sandbox ke CLI `openshell`,
yang memprovisikan environment remote dengan eksekusi perintah berbasis SSH.

Plugin OpenShell menggunakan ulang transport SSH inti yang sama dan bridge sistem file remote
seperti [backend SSH](/id/gateway/sandboxing#ssh-backend) generik. Plugin ini menambahkan siklus hidup khusus OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
dan mode workspace `mirror` opsional.

## Prasyarat

- CLI `openshell` terinstal dan ada di `PATH` (atau atur path kustom melalui
  `plugins.entries.openshell.config.command`)
- Akun OpenShell dengan akses sandbox
- Gateway OpenClaw berjalan di host

## Memulai cepat

1. Aktifkan Plugin dan atur backend sandbox:

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
          mode: "remote",
        },
      },
    },
  },
}
```

2. Restart Gateway. Pada giliran agen berikutnya, OpenClaw membuat sandbox OpenShell
   dan merutekan eksekusi tool melaluinya.

3. Verifikasi:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Mode workspace

Ini adalah keputusan terpenting saat menggunakan OpenShell.

### `mirror`

Gunakan `plugins.entries.openshell.config.mode: "mirror"` saat Anda ingin **workspace
lokal tetap menjadi kanonis**.

Perilaku:

- Sebelum `exec`, OpenClaw menyinkronkan workspace lokal ke sandbox OpenShell.
- Setelah `exec`, OpenClaw menyinkronkan workspace remote kembali ke workspace lokal.
- Tool file tetap beroperasi melalui bridge sandbox, tetapi workspace lokal
  tetap menjadi sumber kebenaran antar-giliran.

Paling cocok untuk:

- Anda mengedit file secara lokal di luar OpenClaw dan ingin perubahan tersebut terlihat di
  sandbox secara otomatis.
- Anda ingin sandbox OpenShell berperilaku semirip mungkin dengan backend Docker.
- Anda ingin workspace host mencerminkan penulisan sandbox setelah setiap giliran exec.

Tradeoff: biaya sinkronisasi tambahan sebelum dan sesudah setiap exec.

### `remote`

Gunakan `plugins.entries.openshell.config.mode: "remote"` saat Anda ingin **workspace
OpenShell menjadi kanonis**.

Perilaku:

- Saat sandbox pertama kali dibuat, OpenClaw melakukan seed workspace remote dari
  workspace lokal satu kali.
- Setelah itu, `exec`, `read`, `write`, `edit`, dan `apply_patch` beroperasi
  langsung pada workspace OpenShell remote.
- OpenClaw **tidak** menyinkronkan perubahan remote kembali ke workspace lokal.
- Pembacaan media saat prompt tetap berfungsi karena tool file dan media membaca melalui
  bridge sandbox.

Paling cocok untuk:

- Sandbox seharusnya hidup terutama di sisi remote.
- Anda menginginkan overhead sinkronisasi per giliran yang lebih rendah.
- Anda tidak ingin edit lokal di host diam-diam menimpa status sandbox remote.

Penting: jika Anda mengedit file di host di luar OpenClaw setelah seed awal,
sandbox remote **tidak** melihat perubahan tersebut. Gunakan
`openclaw sandbox recreate` untuk melakukan seed ulang.

### Memilih mode

|                          | `mirror`                     | `remote`                  |
| ------------------------ | ---------------------------- | ------------------------- |
| **Workspace kanonis**    | Host lokal                   | OpenShell remote          |
| **Arah sinkronisasi**    | Dua arah (setiap exec)       | Seed satu kali            |
| **Overhead per giliran** | Lebih tinggi (unggah + unduh) | Lebih rendah (operasi remote langsung) |
| **Edit lokal terlihat?** | Ya, pada exec berikutnya     | Tidak, sampai recreate    |
| **Paling cocok untuk**   | Alur kerja pengembangan      | Agen jangka panjang, CI   |

## Referensi config

Semua config OpenShell berada di bawah `plugins.entries.openshell.config`:

| Kunci                     | Tipe                     | Default       | Deskripsi                                             |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` atau `"remote"` | `"mirror"`  | Mode sinkronisasi workspace                           |
| `command`                 | `string`                 | `"openshell"` | Path atau nama CLI `openshell`                        |
| `from`                    | `string`                 | `"openclaw"`  | Sumber sandbox untuk pembuatan pertama kali           |
| `gateway`                 | `string`                 | —             | Nama gateway OpenShell (`--gateway`)                  |
| `gatewayEndpoint`         | `string`                 | —             | URL endpoint gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | ID kebijakan OpenShell untuk pembuatan sandbox        |
| `providers`               | `string[]`               | `[]`          | Nama provider yang dilampirkan saat sandbox dibuat    |
| `gpu`                     | `boolean`                | `false`       | Minta resource GPU                                    |
| `autoProviders`           | `boolean`                | `true`        | Teruskan `--auto-providers` saat membuat sandbox      |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Workspace writable utama di dalam sandbox             |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Path mount workspace agen (untuk akses read-only)     |
| `timeoutSeconds`          | `number`                 | `120`         | Batas waktu untuk operasi CLI `openshell`             |

Pengaturan tingkat sandbox (`mode`, `scope`, `workspaceAccess`) dikonfigurasi di bawah
`agents.defaults.sandbox` seperti backend lainnya. Lihat
[Sandboxing](/id/gateway/sandboxing) untuk matriks lengkap.

## Contoh

### Penyiapan remote minimal

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### Mode mirror dengan GPU

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
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
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### OpenShell per agen dengan gateway kustom

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## Pengelolaan siklus hidup

Sandbox OpenShell dikelola melalui CLI sandbox normal:

```bash
# Daftar semua runtime sandbox (Docker + OpenShell)
openclaw sandbox list

# Periksa kebijakan efektif
openclaw sandbox explain

# Recreate (menghapus workspace remote, melakukan seed ulang pada penggunaan berikutnya)
openclaw sandbox recreate --all
```

Untuk mode `remote`, **recreate sangat penting**: perintah ini menghapus workspace remote
kanonis untuk cakupan tersebut. Penggunaan berikutnya melakukan seed workspace remote baru dari
workspace lokal.

Untuk mode `mirror`, recreate terutama mereset environment eksekusi remote karena
workspace lokal tetap kanonis.

### Kapan melakukan recreate

Lakukan recreate setelah mengubah salah satu dari ini:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Penguatan keamanan

OpenShell mem-pin fd root workspace dan memeriksa ulang identitas sandbox sebelum setiap
pembacaan, sehingga pertukaran symlink atau workspace yang di-remount tidak dapat mengalihkan pembacaan keluar dari
workspace remote yang dimaksud.

## Keterbatasan saat ini

- Browser sandbox tidak didukung pada backend OpenShell.
- `sandbox.docker.binds` tidak berlaku untuk OpenShell.
- Knop runtime khusus Docker di bawah `sandbox.docker.*` hanya berlaku untuk backend
  Docker.

## Cara kerjanya

1. OpenClaw memanggil `openshell sandbox create` (dengan flag `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` sesuai konfigurasi).
2. OpenClaw memanggil `openshell sandbox ssh-config <name>` untuk mendapatkan detail
   koneksi SSH bagi sandbox.
3. Inti menulis config SSH ke file sementara dan membuka sesi SSH menggunakan
   bridge sistem file remote yang sama seperti backend SSH generik.
4. Dalam mode `mirror`: sinkronkan lokal ke remote sebelum exec, jalankan, sinkronkan kembali setelah exec.
5. Dalam mode `remote`: lakukan seed sekali saat create, lalu beroperasi langsung pada workspace
   remote.

## Lihat juga

- [Sandboxing](/id/gateway/sandboxing) -- mode, cakupan, dan perbandingan backend
- [Sandbox vs Kebijakan Tool vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) -- debugging tool yang diblokir
- [Sandbox dan Tool Multi-Agen](/id/tools/multi-agent-sandbox-tools) -- override per agen
- [CLI Sandbox](/id/cli/sandbox) -- perintah `openclaw sandbox`
