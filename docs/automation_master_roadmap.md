# 🧠 AUTOMATION MASTER ROADMAP (VS CODE AI AGENT CONTROL FILE)

> Mục tiêu: 1 lộ trình duy nhất – chạy tuần tự – không quên bước – không loạn phase – không lệch flow
> Dán file này vào root project và dùng như **bảng điều khiển trung tâm** cho AI Agent VS Code.

---

# 🚦 CÁCH SỬ DỤNG

1) Dán file này vào thư mục gốc project
2) Trong AI Agent VS Code, gõ:

```
START automation_master_roadmap.mb
```

Từ đây AI Agent sẽ:
- chạy từng mục
- đánh dấu: ✅ DONE hoặc ❌ MISSING
- thông báo: ĐÃ HOÀN THÀNH MỤC NÀO
- đưa ra **lệnh tiếp theo cần gõ**

---

# 🧭 QUY ƯỚC TRẠNG THÁI

- ✅ DONE  → hoàn thành, tự sang bước kế
- ❌ MISSING → thiếu dữ liệu, AI sẽ hỏi bạn dán gì
- ⏸ HOLD → chờ quyết định của bạn

---

# 🔒 LOCK RULES

- Phase-lock: không nhảy phase
- Step-lock: không nhảy bước
- Safety-lock: không động data thật nếu chưa test
- Env-lock: không production nếu chưa staging

---

# 🧱 PHASE 1 — SYSTEM VALIDATION

## STEP 1.1 — Integration Tests
PROMPT:
```
RUN INTEGRATION TESTS
```
DONE SIGNAL:
```
STATUS: ✅ DONE
MESSAGE: Integration tests validated
```
NEXT CMD:
```
ADD CI WORKFLOW FOR INTEGRATION TESTS
```

---

## STEP 1.2 — CI Pipeline
PROMPT:
```
ADD CI WORKFLOW FOR INTEGRATION TESTS
```
DONE SIGNAL:
```
STATUS: ✅ DONE
MESSAGE: CI pipeline active
```
NEXT CMD:
```
ADD SECRETS AND ENVIRONMENT CONFIGURATION
```

---

# 🌱 PHASE 2 — ENVIRONMENT SETUP

## STEP 2.1 — Secrets + Env
PROMPT:
```
ADD SECRETS AND ENVIRONMENT CONFIGURATION
```
DONE SIGNAL:
```
STATUS: ✅ DONE
MESSAGE: Secrets & env configured
```
NEXT CMD:
```
WIRE REAL KMS SIGNER
```

---

## STEP 2.2 — Security Hardening
PROMPT:
```
WIRE REAL KMS SIGNER
```
DONE SIGNAL:
```
STATUS: ✅ DONE
MESSAGE: KMS & IAM secured
```
NEXT CMD:
```
CONFIGURE STAGING DB
```

---

# 🗄 PHASE 3 — DATA LAYER

## STEP 3.1 — Staging Database
PROMPT:
```
CONFIGURE STAGING DB
```
DONE SIGNAL:
```
STATUS: ✅ DONE
MESSAGE: Staging DB connected
```
NEXT CMD:
```
RUN RECONCILIATION (STAGING)
```

---

## STEP 3.2 — Reconciliation
PROMPT:
```
RUN RECONCILIATION (STAGING)
```
DONE SIGNAL:
```
STATUS: ✅ DONE
MESSAGE: Financial reconciliation validated
```
NEXT CMD:
```
ENABLE AUTOMATION RUNTIME (STAGING)
```

---

# ⚙ PHASE 4 — AUTOMATION RUNTIME

## STEP 4.1 — Automation Runtime
PROMPT:
```
ENABLE AUTOMATION RUNTIME (STAGING)
```
DONE SIGNAL:
```
STATUS: ✅ DONE
MESSAGE: Automation runtime active
```
NEXT CMD:
```
DEPLOY ORCHESTRATOR (STAGING)
```

---

## STEP 4.2 — Orchestrator
PROMPT:
```
DEPLOY ORCHESTRATOR (STAGING)
```
DONE SIGNAL:
```
STATUS: ✅ DONE
MESSAGE: Orchestrator running
```
NEXT CMD:
```
RUN SYSTEM HEALTH CHECK
```

---

# 🧪 PHASE 5 — SYSTEM VERIFICATION

## STEP 5.1 — Health Check
PROMPT:
```
RUN SYSTEM HEALTH CHECK
```
DONE SIGNAL:
```
STATUS: ✅ DONE
MESSAGE: System verified
```
NEXT CMD:
```
PROMOTE TO PRODUCTION
```

---

# 🚀 PHASE 6 — PRODUCTION

## STEP 6.1 — Production Deploy
PROMPT:
```
PROMOTE TO PRODUCTION
```
DONE SIGNAL:
```
STATUS: ✅ DONE
MESSAGE: PRODUCTION LIVE
```
NEXT CMD:
```
ENABLE FULL AUTOMATION
```

---

# 🤖 PHASE 7 — OPERATION MODE

## STEP 7.1 — Full Automation
PROMPT:
```
ENABLE FULL AUTOMATION
```
DONE SIGNAL:
```
STATUS: ✅ DONE
MESSAGE: SYSTEM IN AUTONOMOUS MODE
```

---

# 🧠 AUTO-REMINDER SYSTEM

Sau mỗi step, AI Agent phải trả về:
```
COMPLETED: <STEP>
STATUS: ✅ DONE
NEXT STEP: <STEP>
NEXT COMMAND: <CMD>
```

Nếu thiếu dữ liệu:
```
STATUS: ❌ MISSING
NEED: <FILE | OUTPUT | CONFIG>
PASTE REQUESTED DATA
```

---

# 🛑 ANTI-FORGET RULE

AI Agent bị cấm:
- nhảy phase
- gộp bước
- làm thay dữ liệu thật
- bật automation khi chưa staging
- chạy prod khi chưa reconciliation

---

# 🔑 MASTER CONTROL COMMAND

```
AUTO-FLOW automation_master_roadmap.mb
```

---

# 🧬 TƯ DUY HỆ THỐNG

Không build web.
Không build app.
Không build tool.

👉 Build **SYSTEM**
👉 Build **AUTOMATION ENGINE**
👉 Build **CONTROL PLANE**
👉 Build **PRODUCTION PLATFORM**

---

# ✅ FILE ROLE

File này là:
- roadmap
- checklist
- phase-lock
- step-lock
- command-map
- memory system
- AI navigation system

👉 Không cần nhớ gì.
👉 Không cần suy.
👉 Chỉ copy command tiếp theo.

---

🧠 CONTROL FILE READY

