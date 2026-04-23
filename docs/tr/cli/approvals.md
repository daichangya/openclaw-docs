---
read_when:
    - CLI üzerinden exec onaylarını düzenlemek istiyorsunuz
    - Gateway veya Node ana makinelerinde izin listelerini yönetmeniz gerekiyor
summary: '`openclaw approvals` ve `openclaw exec-policy` için CLI başvurusu'
title: onaylar
x-i18n:
    generated_at: "2026-04-23T08:59:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e4e031df737e3bdde97ece81fe50eafbb4384557b40c6d52cf2395cf30721a3
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

**Yerel ana makine**, **gateway ana makinesi** veya bir **Node ana makinesi** için exec onaylarını yönetin.
Varsayılan olarak komutlar diskteki yerel onay dosyasını hedefler. Gateway'i hedeflemek için `--gateway`, belirli bir Node'u hedeflemek için `--node` kullanın.

Takma ad: `openclaw exec-approvals`

İlgili:

- Exec approvals: [Exec approvals](/tr/tools/exec-approvals)
- Nodes: [Nodes](/tr/nodes)

## `openclaw exec-policy`

`openclaw exec-policy`, istenen
`tools.exec.*` config'i ile yerel ana makine onay dosyasını tek adımda uyumlu tutmak için kullanılan yerel kolaylık komutudur.

Şunları yapmak istediğinizde kullanın:

- yerel istenen ilkeyi, ana makine onay dosyasını ve etkili birleşimi incelemek
- YOLO veya deny-all gibi yerel bir ön ayar uygulamak
- yerel `tools.exec.*` ile yerel `~/.openclaw/exec-approvals.json` dosyasını eşzamanlamak

Örnekler:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Çıktı modları:

- `--json` yok: insan tarafından okunabilir tablo görünümünü yazdırır
- `--json`: makine tarafından okunabilir yapılandırılmış çıktı yazdırır

Mevcut kapsam:

- `exec-policy` **yalnızca yereldir**
- yerel config dosyasını ve yerel onay dosyasını birlikte günceller
- ilkeyi gateway ana makinesine veya bir Node ana makinesine **göndermez**
- bu komutta `--host node` reddedilir, çünkü Node exec onayları çalışma zamanında Node'dan alınır ve bunun yerine Node hedefli approvals komutları üzerinden yönetilmelidir
- `openclaw exec-policy show`, `host=node` kapsamlarını yerel onay dosyasından etkili bir ilke türetmek yerine çalışma zamanında Node tarafından yönetilen olarak işaretler

Uzak ana makine onaylarını doğrudan düzenlemeniz gerekiyorsa `openclaw approvals set --gateway`
veya `openclaw approvals set --node <id|name|ip>` kullanmaya devam edin.

## Yaygın komutlar

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` artık yerel, gateway ve Node hedefleri için etkili exec ilkesini gösterir:

- istenen `tools.exec` ilkesi
- ana makine onay dosyası ilkesi
- öncelik kuralları uygulandıktan sonraki etkili sonuç

Öncelik kasıtlıdır:

- ana makine onay dosyası uygulanabilir tek doğruluk kaynağıdır
- istenen `tools.exec` ilkesi amacı daraltabilir veya genişletebilir, ancak etkili sonuç yine de ana makine kurallarından türetilir
- `--node`, Node ana makine onay dosyasını gateway `tools.exec` ilkesiyle birleştirir, çünkü ikisi de çalışma zamanında hâlâ uygulanır
- gateway config kullanılamıyorsa CLI, Node onay snapshot'una fallback yapar ve son çalışma zamanı ilkesinin hesaplanamadığını belirtir

## Bir dosyadan onayları değiştirin

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set`, yalnızca strict JSON değil JSON5 kabul eder. `--file` veya `--stdin` kullanın, ikisini birden değil.

## "Asla sorma" / YOLO örneği

Exec onaylarında hiç durmaması gereken bir ana makine için ana makine onay varsayılanlarını `full` + `off` olarak ayarlayın:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Node varyantı:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Bu yalnızca **ana makine onay dosyasını** değiştirir. İstenen OpenClaw ilkesini de uyumlu tutmak için ayrıca şunları ayarlayın:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Bu örnekte neden `tools.exec.host=gateway` kullanılıyor:

- `host=auto` hâlâ "varsa sandbox, yoksa gateway" anlamına gelir.
- YOLO yönlendirme ile değil, onaylarla ilgilidir.
- Bir sandbox yapılandırılmış olsa bile ana makine exec istiyorsanız, `gateway` veya `/exec host=gateway` ile ana makine seçimini açıkça belirtin.

Bu, mevcut ana makine varsayılanlı YOLO davranışıyla eşleşir. Onay istiyorsanız bunu sıkılaştırın.

Yerel kısayol:

```bash
openclaw exec-policy preset yolo
```

Bu yerel kısayol hem istenen yerel `tools.exec.*` config'ini hem de
yerel onay varsayılanlarını birlikte günceller. Amaç olarak yukarıdaki el ile iki adımlı
kuruluma denktir, ancak yalnızca yerel makine için.

## İzin listesi yardımcıları

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Yaygın seçenekler

`get`, `set` ve `allowlist add|remove` komutlarının tümü şunları destekler:

- `--node <id|name|ip>`
- `--gateway`
- paylaşılan Node RPC seçenekleri: `--url`, `--token`, `--timeout`, `--json`

Hedefleme notları:

- hedef bayrağı yoksa diskteki yerel onay dosyası kullanılır
- `--gateway`, gateway ana makinesi onay dosyasını hedefler
- `--node`, kimlik, ad, IP veya kimlik öneki çözümlendikten sonra bir Node ana makinesini hedefler

`allowlist add|remove` ayrıca şunu da destekler:

- `--agent <id>` (varsayılan `*`)

## Notlar

- `--node`, `openclaw nodes` ile aynı çözücüyü kullanır (kimlik, ad, ip veya kimlik öneki).
- `--agent` varsayılan olarak `"*"` değerini alır; bu tüm agent'lara uygulanır.
- Node ana makinesi `system.execApprovals.get/set` özelliğini duyurmalıdır (macOS uygulaması veya headless Node ana makinesi).
- Onay dosyaları ana makine başına `~/.openclaw/exec-approvals.json` konumunda saklanır.
