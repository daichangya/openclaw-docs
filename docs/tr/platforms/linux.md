---
read_when:
    - Linux yardımcı uygulama durumunu arıyorsunuz
    - Platform kapsamı veya katkıları planlama
    - Bir VPS veya container üzerinde Linux OOM kill'lerini ya da exit 137 hatalarını ayıklama
summary: Linux desteği + yardımcı uygulama durumu
title: Linux Uygulaması
x-i18n:
    generated_at: "2026-04-23T09:05:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: c56151406517a1259e66626b8f4b48c16917b10580e7626463afd8a68dc286f7
    source_path: platforms/linux.md
    workflow: 15
---

# Linux Uygulaması

Gateway, Linux üzerinde tam olarak desteklenir. **Önerilen çalışma zamanı Node'dur**.
Gateway için Bun önerilmez (WhatsApp/Telegram hataları).

Yerel Linux yardımcı uygulamaları planlanmaktadır. Bir tane oluşturmaya yardımcı olmak istiyorsanız katkılar memnuniyetle karşılanır.

## Yeni başlayanlar için hızlı yol (VPS)

1. Node 24 kurun (önerilir; Node 22 LTS, şu anda `22.14+`, uyumluluk için hâlâ çalışır)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Dizüstü bilgisayarınızdan: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/` adresini açın ve yapılandırılmış paylaşılan gizli anahtarla kimlik doğrulaması yapın (varsayılan olarak token; `gateway.auth.mode: "password"` ayarladıysanız parola)

Tam Linux sunucu rehberi: [Linux Sunucu](/tr/vps). Adım adım VPS örneği: [exe.dev](/tr/install/exe-dev)

## Kurulum

- [Başlarken](/tr/start/getting-started)
- [Kurulum ve güncellemeler](/tr/install/updating)
- İsteğe bağlı akışlar: [Bun (deneysel)](/tr/install/bun), [Nix](/tr/install/nix), [Docker](/tr/install/docker)

## Gateway

- [Gateway çalışma kitabı](/tr/gateway)
- [Yapılandırma](/tr/gateway/configuration)

## Gateway hizmet kurulumu (CLI)

Bunlardan birini kullanın:

```
openclaw onboard --install-daemon
```

Veya:

```
openclaw gateway install
```

Veya:

```
openclaw configure
```

İstendiğinde **Gateway service** seçeneğini seçin.

Onarma/geçirme:

```
openclaw doctor
```

## Sistem denetimi (systemd kullanıcı birimi)

OpenClaw varsayılan olarak bir systemd **kullanıcı** hizmeti kurar. Paylaşılan veya sürekli açık sunucular için bir **sistem**
hizmeti kullanın. `openclaw gateway install` ve
`openclaw onboard --install-daemon` zaten sizin için geçerli kanonik birimi
oluşturur; elle yalnızca özel bir sistem/hizmet yöneticisi
kurulumuna ihtiyacınız olduğunda yazın. Tam hizmet rehberi [Gateway çalışma kitabı](/tr/gateway) içinde yer alır.

Minimal kurulum:

`~/.config/systemd/user/openclaw-gateway[-<profile>].service` oluşturun:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

Etkinleştirin:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Bellek baskısı ve OOM kill'leri

Linux üzerinde çekirdek, bir sunucu, VM veya container cgroup'u
belleği tükettiğinde bir OOM kurbanı seçer. Gateway kötü bir kurban olabilir; çünkü uzun ömürlü
oturumların ve kanal bağlantılarının sahibidir. Bu nedenle OpenClaw, mümkün olduğunda Gateway'den önce geçici alt
süreçlerin öldürülmesini tercih eder.

Uygun Linux alt süreç başlatmaları için OpenClaw, alt süreci kısa bir
`/bin/sh` sarmalayıcısı üzerinden başlatır; bu sarmalayıcı alt sürecin kendi `oom_score_adj` değerini `1000`'e yükseltir, ardından
gerçek komutu `exec` eder. Bu ayrıcalıksız bir işlemdir; çünkü alt süreç
yalnızca kendi OOM öldürülme olasılığını artırmaktadır.

Kapsanan alt süreç yüzeyleri şunları içerir:

- supervisor tarafından yönetilen komut alt süreçleri,
- PTY shell alt süreçleri,
- MCP stdio sunucu alt süreçleri,
- OpenClaw tarafından başlatılan tarayıcı/Chrome süreçleri.

Sarmalayıcı yalnızca Linux içindir ve `/bin/sh` kullanılamadığında atlanır. Ayrıca
alt süreç env içinde `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` veya `off` ayarlanmışsa da atlanır.

Bir alt süreci doğrulamak için:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Kapsanan alt süreçler için beklenen değer `1000`'dir. Gateway süreci normal
skorunu korumalıdır; bu genellikle `0` olur.

Bu, normal bellek ayarlarının yerini almaz. Bir VPS veya container sürekli olarak
alt süreçleri öldürüyorsa bellek sınırını artırın, eşzamanlılığı azaltın veya systemd `MemoryMax=` ya da container düzeyi bellek sınırları gibi daha güçlü
kaynak denetimleri ekleyin.
