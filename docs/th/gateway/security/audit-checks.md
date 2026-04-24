---
read_when:
    - คุณเห็น `checkId` ที่เฉพาะเจาะจงในเอาต์พุต `openclaw security audit` และต้องการรู้ว่ามันหมายถึงอะไร
    - คุณต้องการคีย์/เส้นทางสำหรับการแก้ไขของผลการตรวจสอบที่กำหนด
    - คุณกำลังคัดแยกระดับความรุนแรงจากผลการรัน security audit
summary: แค็ตตาล็อกอ้างอิงของ checkIds ที่ถูกส่งออกโดย openclaw security audit
title: การตรวจสอบความปลอดภัยและ checks
x-i18n:
    generated_at: "2026-04-24T09:12:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 107232e94aae9e12b160840691f5a12be6c354dd6162ff5f59b6a56475d27649
    source_path: gateway/security/audit-checks.md
    workflow: 15
---

`openclaw security audit` จะส่งผลการตรวจสอบแบบมีโครงสร้างที่อ้างอิงด้วย `checkId` หน้านี้คือแค็ตตาล็อกอ้างอิงสำหรับ IDs เหล่านั้น สำหรับแบบจำลองภัยคุกคามระดับสูงและแนวทางการเสริมความแข็งแกร่ง โปรดดู [ความปลอดภัย](/th/gateway/security)

ค่า `checkId` ที่มีสัญญาณสำคัญซึ่งคุณมีแนวโน้มจะพบมากที่สุดในการ deploy จริง (ไม่ใช่รายการทั้งหมด):

| `checkId` | ระดับความรุนแรง | เหตุผลที่สำคัญ | คีย์/เส้นทางหลักสำหรับการแก้ไข | แก้อัตโนมัติ |
| ------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------- |
| `fs.state_dir.perms_world_writable` | critical | ผู้ใช้/โปรเซสอื่นสามารถแก้ไขสถานะ OpenClaw ทั้งหมดได้ | สิทธิ์ของไฟล์ระบบบน `~/.openclaw` | ได้ |
| `fs.state_dir.perms_group_writable` | warn | ผู้ใช้ในกลุ่มสามารถแก้ไขสถานะ OpenClaw ทั้งหมดได้ | สิทธิ์ของไฟล์ระบบบน `~/.openclaw` | ได้ |
| `fs.state_dir.perms_readable` | warn | ไดเรกทอรี state ถูกผู้อื่นอ่านได้ | สิทธิ์ของไฟล์ระบบบน `~/.openclaw` | ได้ |
| `fs.state_dir.symlink` | warn | เป้าหมายของไดเรกทอรี state กลายเป็นขอบเขตความเชื่อถืออีกชั้นหนึ่ง | โครงสร้างไฟล์ระบบของไดเรกทอรี state | ไม่ได้ |
| `fs.config.perms_writable` | critical | ผู้อื่นสามารถเปลี่ยน auth/tool policy/config ได้ | สิทธิ์ของไฟล์ระบบบน `~/.openclaw/openclaw.json` | ได้ |
| `fs.config.symlink` | warn | ไฟล์ config ที่เป็น symlink ไม่รองรับการเขียน และเพิ่มขอบเขตความเชื่อถืออีกชั้นหนึ่ง | แทนที่ด้วยไฟล์ config ปกติหรือชี้ `OPENCLAW_CONFIG_PATH` ไปยังไฟล์จริง | ไม่ได้ |
| `fs.config.perms_group_readable` | warn | ผู้ใช้ในกลุ่มสามารถอ่าน tokens/settings ใน config ได้ | สิทธิ์ของไฟล์ระบบบนไฟล์ config | ได้ |
| `fs.config.perms_world_readable` | critical | config อาจเปิดเผย tokens/settings | สิทธิ์ของไฟล์ระบบบนไฟล์ config | ได้ |
| `fs.config_include.perms_writable` | critical | ไฟล์ include ของ config สามารถถูกแก้ไขโดยผู้อื่นได้ | สิทธิ์ของไฟล์ include ที่อ้างอิงจาก `openclaw.json` | ได้ |
| `fs.config_include.perms_group_readable` | warn | ผู้ใช้ในกลุ่มสามารถอ่าน secrets/settings ที่ include ไว้ได้ | สิทธิ์ของไฟล์ include ที่อ้างอิงจาก `openclaw.json` | ได้ |
| `fs.config_include.perms_world_readable` | critical | secrets/settings ที่ include ไว้ถูกอ่านได้โดยทุกคน | สิทธิ์ของไฟล์ include ที่อ้างอิงจาก `openclaw.json` | ได้ |
| `fs.auth_profiles.perms_writable` | critical | ผู้อื่นสามารถฉีดหรือแทนที่ข้อมูลรับรองโมเดลที่จัดเก็บไว้ได้ | สิทธิ์ของ `agents/<agentId>/agent/auth-profiles.json` | ได้ |
| `fs.auth_profiles.perms_readable` | warn | ผู้อื่นสามารถอ่าน API keys และ OAuth tokens ได้ | สิทธิ์ของ `agents/<agentId>/agent/auth-profiles.json` | ได้ |
| `fs.credentials_dir.perms_writable` | critical | ผู้อื่นสามารถแก้ไขสถานะ pairing/credentials ของช่องทางได้ | สิทธิ์ของไฟล์ระบบบน `~/.openclaw/credentials` | ได้ |
| `fs.credentials_dir.perms_readable` | warn | ผู้อื่นสามารถอ่านสถานะ credentials ของช่องทางได้ | สิทธิ์ของไฟล์ระบบบน `~/.openclaw/credentials` | ได้ |
| `fs.sessions_store.perms_readable` | warn | ผู้อื่นสามารถอ่าน session transcripts/metadata ได้ | สิทธิ์ของ session store | ได้ |
| `fs.log_file.perms_readable` | warn | ผู้อื่นสามารถอ่าน logs ที่แม้จะถูกปกปิดแล้วแต่ยังอ่อนไหวอยู่ได้ | สิทธิ์ของไฟล์ gateway log | ได้ |
| `fs.synced_dir` | warn | การเก็บ state/config ไว้ใน iCloud/Dropbox/Drive ทำให้การเปิดเผย token/transcript กว้างขึ้น | ย้าย config/state ออกจากโฟลเดอร์ที่ซิงก์ | ไม่ได้ |
| `gateway.bind_no_auth` | critical | bind แบบระยะไกลโดยไม่มี shared secret | `gateway.bind`, `gateway.auth.*` | ไม่ได้ |
| `gateway.loopback_no_auth` | critical | loopback ที่ผ่าน reverse-proxy อาจกลายเป็นแบบไม่ต้องยืนยันตัวตน | `gateway.auth.*`, การตั้งค่า proxy | ไม่ได้ |
| `gateway.trusted_proxies_missing` | warn | มี reverse-proxy headers แต่ไม่ได้รับการเชื่อถือ | `gateway.trustedProxies` | ไม่ได้ |
| `gateway.http.no_auth` | warn/critical | HTTP APIs ของ Gateway เข้าถึงได้ด้วย `auth.mode="none"` | `gateway.auth.mode`, `gateway.http.endpoints.*` | ไม่ได้ |
| `gateway.http.session_key_override_enabled` | info | ผู้เรียก HTTP API สามารถ override `sessionKey` ได้ | `gateway.http.allowSessionKeyOverride` | ไม่ได้ |
| `gateway.tools_invoke_http.dangerous_allow` | warn/critical | เปิดใช้เครื่องมืออันตรายอีกครั้งผ่าน HTTP API | `gateway.tools.allow` | ไม่ได้ |
| `gateway.nodes.allow_commands_dangerous` | warn/critical | เปิดใช้คำสั่ง Node ที่มีผลกระทบสูง (camera/screen/contacts/calendar/SMS) | `gateway.nodes.allowCommands` | ไม่ได้ |
| `gateway.nodes.deny_commands_ineffective` | warn | รายการ deny แบบมีลักษณะเป็น pattern ไม่ตรงกับข้อความ shell หรือกลุ่มคำสั่ง | `gateway.nodes.denyCommands` | ไม่ได้ |
| `gateway.tailscale_funnel` | critical | เปิดเผยสู่สาธารณะบนอินเทอร์เน็ต | `gateway.tailscale.mode` | ไม่ได้ |
| `gateway.tailscale_serve` | info | เปิดการเข้าถึงผ่าน Tailnet ด้วย Serve อยู่ | `gateway.tailscale.mode` | ไม่ได้ |
| `gateway.control_ui.allowed_origins_required` | critical | Control UI แบบ non-loopback โดยไม่มี browser-origin allowlist ที่ระบุชัดเจน | `gateway.controlUi.allowedOrigins` | ไม่ได้ |
| `gateway.control_ui.allowed_origins_wildcard` | warn/critical | `allowedOrigins=["*"]` ปิดการใช้ browser-origin allowlisting | `gateway.controlUi.allowedOrigins` | ไม่ได้ |
| `gateway.control_ui.host_header_origin_fallback` | warn/critical | เปิดใช้ Host-header origin fallback (ลดระดับการป้องกัน DNS rebinding) | `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback` | ไม่ได้ |
| `gateway.control_ui.insecure_auth` | warn | เปิดใช้สวิตช์ความเข้ากันได้แบบ insecure-auth | `gateway.controlUi.allowInsecureAuth` | ไม่ได้ |
| `gateway.control_ui.device_auth_disabled` | critical | ปิดการตรวจสอบตัวตนอุปกรณ์ | `gateway.controlUi.dangerouslyDisableDeviceAuth` | ไม่ได้ |
| `gateway.real_ip_fallback_enabled` | warn/critical | การเชื่อถือ fallback ของ `X-Real-IP` อาจเปิดทางให้ปลอมแปลง source-IP ผ่าน proxy misconfig | `gateway.allowRealIpFallback`, `gateway.trustedProxies` | ไม่ได้ |
| `gateway.token_too_short` | warn | shared token ที่สั้นเดาแบบ brute force ได้ง่ายกว่า | `gateway.auth.token` | ไม่ได้ |
| `gateway.auth_no_rate_limit` | warn | auth ที่ถูกเปิดเผยโดยไม่มี rate limiting เพิ่มความเสี่ยงจาก brute-force | `gateway.auth.rateLimit` | ไม่ได้ |
| `gateway.trusted_proxy_auth` | critical | ตัวตนจาก proxy กลายเป็นขอบเขต auth แล้ว | `gateway.auth.mode="trusted-proxy"` | ไม่ได้ |
| `gateway.trusted_proxy_no_proxies` | critical | trusted-proxy auth โดยไม่มี IP ของ trusted proxy นั้นไม่ปลอดภัย | `gateway.trustedProxies` | ไม่ได้ |
| `gateway.trusted_proxy_no_user_header` | critical | trusted-proxy auth ไม่สามารถ resolve ตัวตนผู้ใช้ได้อย่างปลอดภัย | `gateway.auth.trustedProxy.userHeader` | ไม่ได้ |
| `gateway.trusted_proxy_no_allowlist` | warn | trusted-proxy auth ยอมรับผู้ใช้ upstream ที่ยืนยันตัวตนแล้วทุกคน | `gateway.auth.trustedProxy.allowUsers` | ไม่ได้ |
| `gateway.probe_auth_secretref_unavailable` | warn | การตรวจสอบเชิงลึกไม่สามารถ resolve auth SecretRefs ได้ในเส้นทางคำสั่งนี้ | แหล่ง auth ของ deep-probe / ความพร้อมใช้งานของ SecretRef | ไม่ได้ |
| `gateway.probe_failed` | warn/critical | การตรวจสอบ Gateway แบบสดล้มเหลว | การเข้าถึงได้/auth ของ gateway | ไม่ได้ |
| `discovery.mdns_full_mode` | warn/critical | โหมดเต็มของ mDNS ประกาศ metadata `cliPath`/`sshPort` บนเครือข่ายโลคัล | `discovery.mdns.mode`, `gateway.bind` | ไม่ได้ |
| `config.insecure_or_dangerous_flags` | warn | มีการเปิดใช้แฟลก debug ที่ไม่ปลอดภัย/อันตราย | หลายคีย์ (ดูรายละเอียดในผลการตรวจสอบ) | ไม่ได้ |
| `config.secrets.gateway_password_in_config` | warn | รหัสผ่าน Gateway ถูกเก็บไว้ตรง ๆ ใน config | `gateway.auth.password` | ไม่ได้ |
| `config.secrets.hooks_token_in_config` | warn | hook bearer token ถูกเก็บไว้ตรง ๆ ใน config | `hooks.token` | ไม่ได้ |
| `hooks.token_reuse_gateway_token` | critical | token สำหรับ hook ingress ใช้ปลดล็อก auth ของ Gateway ได้ด้วย | `hooks.token`, `gateway.auth.token` | ไม่ได้ |
| `hooks.token_too_short` | warn | brute force กับ hook ingress ได้ง่ายกว่า | `hooks.token` | ไม่ได้ |
| `hooks.default_session_key_unset` | warn | การรันเอเจนต์จาก hook กระจายออกไปเป็น per-request sessions ที่ระบบสร้างขึ้น | `hooks.defaultSessionKey` | ไม่ได้ |
| `hooks.allowed_agent_ids_unrestricted` | warn/critical | ผู้เรียก hook ที่ยืนยันตัวตนแล้วสามารถกำหนดเส้นทางไปยังเอเจนต์ใดก็ได้ที่กำหนดค่าไว้ | `hooks.allowedAgentIds` | ไม่ได้ |
| `hooks.request_session_key_enabled` | warn/critical | ผู้เรียกภายนอกสามารถเลือก `sessionKey` ได้ | `hooks.allowRequestSessionKey` | ไม่ได้ |
| `hooks.request_session_key_prefixes_missing` | warn/critical | ไม่มีขอบเขตสำหรับรูปแบบ session key จากภายนอก | `hooks.allowedSessionKeyPrefixes` | ไม่ได้ |
| `hooks.path_root` | critical | path ของ hook คือ `/` ทำให้ ingress ชนกันหรือกำหนดเส้นทางผิดได้ง่ายขึ้น | `hooks.path` | ไม่ได้ |
| `hooks.installs_unpinned_npm_specs` | warn | บันทึกการติดตั้ง hook ไม่ถูก pin ไว้กับ npm specs ที่เปลี่ยนไม่ได้ | metadata ของการติดตั้ง hook | ไม่ได้ |
| `hooks.installs_missing_integrity` | warn | บันทึกการติดตั้ง hook ไม่มี metadata ด้าน integrity | metadata ของการติดตั้ง hook | ไม่ได้ |
| `hooks.installs_version_drift` | warn | บันทึกการติดตั้ง hook คลาดเคลื่อนจากแพ็กเกจที่ติดตั้งอยู่ | metadata ของการติดตั้ง hook | ไม่ได้ |
| `logging.redact_off` | warn | ค่าที่อ่อนไหวรั่วไปยัง logs/status | `logging.redactSensitive` | ได้ |
| `browser.control_invalid_config` | warn | config ของ browser control ไม่ถูกต้องก่อนรันไทม์ | `browser.*` | ไม่ได้ |
| `browser.control_no_auth` | critical | browser control ถูกเปิดเผยโดยไม่มี auth แบบ token/password | `gateway.auth.*` | ไม่ได้ |
| `browser.remote_cdp_http` | warn | Remote CDP ผ่าน HTTP แบบ plaintext ไม่มีการเข้ารหัสทรานสปอร์ต | `cdpUrl` ของ browser profile | ไม่ได้ |
| `browser.remote_cdp_private_host` | warn | Remote CDP กำหนดเป้าหมายไปยังโฮสต์ private/internal | `cdpUrl` ของ browser profile, `browser.ssrfPolicy.*` | ไม่ได้ |
| `sandbox.docker_config_mode_off` | warn | มี config ของ Sandbox Docker อยู่ แต่ไม่ได้ใช้งาน | `agents.*.sandbox.mode` | ไม่ได้ |
| `sandbox.bind_mount_non_absolute` | warn | bind mounts แบบ relative อาจ resolve ได้ไม่แน่นอน | `agents.*.sandbox.docker.binds[]` | ไม่ได้ |
| `sandbox.dangerous_bind_mount` | critical | bind mount ของ Sandbox ชี้ไปยัง paths ของระบบ, credentials หรือ Docker socket ที่ถูกบล็อก | `agents.*.sandbox.docker.binds[]` | ไม่ได้ |
| `sandbox.dangerous_network_mode` | critical | เครือข่าย Docker ของ Sandbox ใช้โหมด `host` หรือ `container:*` แบบ namespace-join | `agents.*.sandbox.docker.network` | ไม่ได้ |
| `sandbox.dangerous_seccomp_profile` | critical | seccomp profile ของ Sandbox ทำให้การแยก container อ่อนลง | `agents.*.sandbox.docker.securityOpt` | ไม่ได้ |
| `sandbox.dangerous_apparmor_profile` | critical | AppArmor profile ของ Sandbox ทำให้การแยก container อ่อนลง | `agents.*.sandbox.docker.securityOpt` | ไม่ได้ |
| `sandbox.browser_cdp_bridge_unrestricted` | warn | browser bridge ของ Sandbox ถูกเปิดเผยโดยไม่มีการจำกัดช่วงแหล่งที่มา | `sandbox.browser.cdpSourceRange` | ไม่ได้ |
| `sandbox.browser_container.non_loopback_publish` | critical | browser container ที่มีอยู่เผยแพร่ CDP บนอินเทอร์เฟซที่ไม่ใช่ loopback | config การ publish ของ browser sandbox container | ไม่ได้ |
| `sandbox.browser_container.hash_label_missing` | warn | browser container ที่มีอยู่ถูกสร้างก่อน labels แบบ config-hash ปัจจุบัน | `openclaw sandbox recreate --browser --all` | ไม่ได้ |
| `sandbox.browser_container.hash_epoch_stale` | warn | browser container ที่มีอยู่ถูกสร้างก่อน browser config epoch ปัจจุบัน | `openclaw sandbox recreate --browser --all` | ไม่ได้ |
| `tools.exec.host_sandbox_no_sandbox_defaults` | warn | `exec host=sandbox` จะ fail closed เมื่อปิด sandbox | `tools.exec.host`, `agents.defaults.sandbox.mode` | ไม่ได้ |
| `tools.exec.host_sandbox_no_sandbox_agents` | warn | `exec host=sandbox` รายเอเจนต์จะ fail closed เมื่อปิด sandbox | `agents.list[].tools.exec.host`, `agents.list[].sandbox.mode` | ไม่ได้ |
| `tools.exec.security_full_configured` | warn/critical | host exec กำลังรันด้วย `security="full"` | `tools.exec.security`, `agents.list[].tools.exec.security` | ไม่ได้ |
| `tools.exec.auto_allow_skills_enabled` | warn | การอนุมัติ exec เชื่อถือ skill bins โดยปริยาย | `~/.openclaw/exec-approvals.json` | ไม่ได้ |
| `tools.exec.allowlist_interpreter_without_strict_inline_eval` | warn | allowlists ของ interpreter อนุญาต inline eval โดยไม่บังคับให้ขอการอนุมัติใหม่ | `tools.exec.strictInlineEval`, `agents.list[].tools.exec.strictInlineEval`, exec approvals allowlist | ไม่ได้ |
| `tools.exec.safe_bins_interpreter_unprofiled` | warn | bins ประเภท interpreter/runtime ใน `safeBins` ที่ไม่มี profiles แบบชัดเจนทำให้ความเสี่ยงของ exec กว้างขึ้น | `tools.exec.safeBins`, `tools.exec.safeBinProfiles`, `agents.list[].tools.exec.*` | ไม่ได้ |
| `tools.exec.safe_bins_broad_behavior` | warn | เครื่องมือพฤติกรรมกว้างใน `safeBins` ทำให้ trust model แบบ low-risk stdin-filter อ่อนลง | `tools.exec.safeBins`, `agents.list[].tools.exec.safeBins` | ไม่ได้ |
| `tools.exec.safe_bin_trusted_dirs_risky` | warn | `safeBinTrustedDirs` มีไดเรกทอรีที่แก้ไขได้หรือมีความเสี่ยง | `tools.exec.safeBinTrustedDirs`, `agents.list[].tools.exec.safeBinTrustedDirs` | ไม่ได้ |
| `skills.workspace.symlink_escape` | warn | `skills/**/SKILL.md` ใน workspace ถูก resolve ออกนอก workspace root (symlink-chain drift) | สถานะไฟล์ระบบของ `skills/**` ใน workspace | ไม่ได้ |
| `plugins.extensions_no_allowlist` | warn | มีการติดตั้ง Plugins โดยไม่มี plugin allowlist แบบชัดเจน | `plugins.allowlist` | ไม่ได้ |
| `plugins.installs_unpinned_npm_specs` | warn | บันทึกการติดตั้ง Plugin ไม่ถูก pin ไว้กับ npm specs ที่เปลี่ยนไม่ได้ | metadata ของการติดตั้ง Plugin | ไม่ได้ |
| `checkId` | ระดับความรุนแรง | เหตุผลที่สำคัญ | คีย์/เส้นทางหลักสำหรับการแก้ไข | แก้อัตโนมัติ |
| ------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------- |
| `plugins.installs_missing_integrity` | warn | บันทึกการติดตั้ง Plugin ไม่มี metadata ด้าน integrity | metadata ของการติดตั้ง Plugin | ไม่ได้ |
| `plugins.installs_version_drift` | warn | บันทึกการติดตั้ง Plugin คลาดเคลื่อนจากแพ็กเกจที่ติดตั้งอยู่ | metadata ของการติดตั้ง Plugin | ไม่ได้ |
| `plugins.code_safety` | warn/critical | การสแกนโค้ด Plugin พบรูปแบบที่น่าสงสัยหรืออันตราย | โค้ด Plugin / แหล่งที่มาของการติดตั้ง | ไม่ได้ |
| `plugins.code_safety.entry_path` | warn | entry path ของ Plugin ชี้เข้าไปยังตำแหน่งที่ซ่อนอยู่หรือ `node_modules` | `entry` ใน manifest ของ Plugin | ไม่ได้ |
| `plugins.code_safety.entry_escape` | critical | entry ของ Plugin หลุดออกนอกไดเรกทอรีของ Plugin | `entry` ใน manifest ของ Plugin | ไม่ได้ |
| `plugins.code_safety.scan_failed` | warn | การสแกนโค้ด Plugin ไม่สามารถทำให้เสร็จสมบูรณ์ได้ | path ของ Plugin / สภาพแวดล้อมสำหรับการสแกน | ไม่ได้ |
| `skills.code_safety` | warn/critical | metadata/โค้ดของตัวติดตั้ง Skill มีรูปแบบที่น่าสงสัยหรืออันตราย | แหล่งที่มาของการติดตั้ง Skill | ไม่ได้ |
| `skills.code_safety.scan_failed` | warn | การสแกนโค้ด Skill ไม่สามารถทำให้เสร็จสมบูรณ์ได้ | สภาพแวดล้อมสำหรับการสแกน Skill | ไม่ได้ |
| `security.exposure.open_channels_with_exec` | warn/critical | ห้องที่แชร์/สาธารณะสามารถเข้าถึงเอเจนต์ที่เปิดใช้ exec ได้ | `channels.*.dmPolicy`, `channels.*.groupPolicy`, `tools.exec.*`, `agents.list[].tools.exec.*` | ไม่ได้ |
| `security.exposure.open_groups_with_elevated` | critical | กลุ่มที่เปิดกว้าง + เครื่องมือ elevated สร้างเส้นทาง prompt-injection ที่มีผลกระทบสูง | `channels.*.groupPolicy`, `tools.elevated.*` | ไม่ได้ |
| `security.exposure.open_groups_with_runtime_or_fs` | critical/warn | กลุ่มที่เปิดกว้างสามารถเข้าถึงเครื่องมือคำสั่ง/ไฟล์ได้โดยไม่มีตัวป้องกันจาก sandbox/workspace | `channels.*.groupPolicy`, `tools.profile/deny`, `tools.fs.workspaceOnly`, `agents.*.sandbox.mode` | ไม่ได้ |
| `security.trust_model.multi_user_heuristic` | warn | config ดูเหมือนใช้งานหลายผู้ใช้ ทั้งที่ trust model ของ gateway เป็นแบบ personal-assistant | แยกขอบเขตความเชื่อถือ หรือทำ hardening สำหรับผู้ใช้ร่วมกัน (`sandbox.mode`, tool deny/workspace scoping) | ไม่ได้ |
| `tools.profile_minimal_overridden` | warn | การ override ของเอเจนต์ข้าม global minimal profile | `agents.list[].tools.profile` | ไม่ได้ |
| `plugins.tools_reachable_permissive_policy` | warn | เครื่องมือของส่วนขยายเข้าถึงได้ในบริบทที่มีนโยบายผ่อนปรน | `tools.profile` + tool allow/deny | ไม่ได้ |
| `models.legacy` | warn | ยังมีการกำหนดค่าตระกูลโมเดลแบบเดิมอยู่ | การเลือกโมเดล | ไม่ได้ |
| `models.weak_tier` | warn | โมเดลที่กำหนดค่าไว้ต่ำกว่าระดับที่แนะนำในปัจจุบัน | การเลือกโมเดล | ไม่ได้ |
| `models.small_params` | critical/info | โมเดลขนาดเล็ก + พื้นผิวเครื่องมือที่ไม่ปลอดภัยเพิ่มความเสี่ยงจากการฉีดคำสั่ง | การเลือกโมเดล + นโยบาย sandbox/tool | ไม่ได้ |
| `summary.attack_surface` | info | สรุปรวมสถานะด้าน auth, ช่องทาง, เครื่องมือ และการเปิดเผยพื้นผิวการโจมตี | หลายคีย์ (ดูรายละเอียดในผลการตรวจสอบ) | ไม่ได้ |

## ที่เกี่ยวข้อง

- [ความปลอดภัย](/th/gateway/security)
- [การกำหนดค่า](/th/gateway/configuration)
- [Trusted proxy auth](/th/gateway/trusted-proxy-auth)
