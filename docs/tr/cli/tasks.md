---
read_when:
    - Arka plan görev kayıtlarını incelemek, denetlemek veya iptal etmek istiyorsunuz
    - TaskFlow komutlarını `openclaw tasks flow` altında belgeliyorsunuz
summary: '`openclaw tasks` için CLI başvurusu (arka plan görev defteri ve TaskFlow durumu)'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-23T09:01:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 549e07c8a576cb4c5bd48874f16b0daa4a34facb53b102e12d358bdad2191628
    source_path: cli/tasks.md
    workflow: 15
---

# `openclaw tasks`

Kalıcı arka plan görevlerini ve TaskFlow durumunu inceleyin. Alt komut olmadan,
`openclaw tasks`, `openclaw tasks list` ile eşdeğerdir.

Yaşam döngüsü ve teslim modeli için bkz. [Arka Plan Görevleri](/tr/automation/tasks).

## Kullanım

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## Kök Seçenekler

- `--json`: JSON çıktısı.
- `--runtime <name>`: türe göre filtrele: `subagent`, `acp`, `cron` veya `cli`.
- `--status <name>`: duruma göre filtrele: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` veya `lost`.

## Alt komutlar

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

İzlenen arka plan görevlerini en yeniden başlayarak listeler.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Bir görevi görev ID'si, run ID'si veya oturum anahtarıyla gösterir.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Çalışan bir görev için bildirim ilkesini değiştirir.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Çalışan bir arka plan görevini iptal eder.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Bayat, kayıp, teslim başarısız veya başka şekilde tutarsız görev ve TaskFlow kayıtlarını ortaya çıkarır.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Görev ve TaskFlow uzlaştırmasını, temizlik damgalamayı ve temizlemeyi önizler veya uygular.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Görev defteri altındaki kalıcı TaskFlow durumunu inceler veya iptal eder.
