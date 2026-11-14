const MAX_TURNS = 15;
const TOTAL_SECONDS = 600; // 10 minutes
const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
const DEPRECATED_GEMINI_MODELS = new Set([
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-1.5-flash"
]);

function normalizeModel(modelName) {
  if (!modelName || DEPRECATED_GEMINI_MODELS.has(modelName)) {
    return DEFAULT_GEMINI_MODEL;
  }
  return modelName;
}

const App = {
  state: {
    mode: "offline", // "proxy" | "direct" | "offline"
    proxyAvailable: false,
    apiKey: localStorage.getItem("sv_gemini_key") || "",
    baseUrl: localStorage.getItem("sv_gemini_base") || "https://generativelanguage.googleapis.com",
    model: normalizeModel(localStorage.getItem("sv_gemini_model")),
    activeCase: null,
    messages: [], // { role: "assistant" | "user" | "system", content: string }
    telemetryHistory: [],
    turnCount: 0,
    remainingSeconds: TOTAL_SECONDS,
    timerId: null,
    isSending: false,
    revealTelemetry: false,
    showScaffolds: false,
    usedScaffolds: 0,
    lastReport: null
  },

  async init() {
    this.renderCaseGrid();
    this.bindEvents();
    await this.detectBackend();
  },

  bindEvents() {
    const input = document.getElementById("userInput");
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  },

  async detectBackend() {
    const savedMode = localStorage.getItem("sv_mode");
    try {
      const resp = await fetch("/api/chat?health=1", { method: "GET" });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.configured) {
          this.state.proxyAvailable = true;
          this.state.mode = savedMode === "direct" || savedMode === "offline" ? savedMode : "proxy";
          this.updateModeUI();
          return;
        }
      }
    } catch (_) {
      // Static hosting or no proxy
    }
    this.state.proxyAvailable = false;
    if (this.state.apiKey) {
      this.state.mode = savedMode === "offline" ? "offline" : "direct";
    } else {
      this.state.mode = "offline";
    }
    this.updateModeUI();
  },

  updateModeUI() {
    const dot = document.getElementById("statusDot");
    const label = document.getElementById("modeLabel");
    if (this.state.mode === "proxy") {
      dot.className = "status-dot";
      label.textContent = `Gemini 在线 (${this.state.model})`;
    } else if (this.state.mode === "direct") {
      dot.className = "status-dot";
      label.textContent = `直连 Gemini Key`;
    } else {
      dot.className = "status-dot demo";
      label.textContent = "离线高仿真模式（点击配置 Gemini）";
    }
  },

  renderCaseGrid() {
    const grid = document.getElementById("caseGrid");
    grid.innerHTML = window.SUPERVISION_CASES.map((c) => `
      <article class="case-card">
        <div>
          <div class="case-meta">
            <span class="case-num">${c.number}</span>
            <span class="case-level">${c.stageLabel}</span>
          </div>
          <h3>${c.title}</h3>
          <div class="case-supervisee">受督：${c.supervisee.name}（${c.supervisee.role}）</div>
          <p class="case-summary">${c.summary}</p>
          <div class="case-tags">
            ${c.tags.map((t) => `<span class="tag">${t}</span>`).join("")}
          </div>
        </div>
        <button class="primary-btn" onclick="App.startCase('${c.id}')">进入督导室</button>
      </article>
    `).join("");
  },

  startCase(caseId) {
    const found = window.SUPERVISION_CASES.find((c) => c.id === caseId);
    if (!found) return;

    this.state.activeCase = found;
    this.state.messages = [
      { role: "assistant", content: found.supervisee.openingLine }
    ];
    this.state.telemetryHistory = [
      {
        alliance_score: 70,
        stance: "open",
        support_balance: "pending",
        traps_spotted: [],
        recommended_role: "consultant",
        inner_thought: "刚完成访谈，希望能得到老师的肯定，也有点不确定自己处理得是否妥当。",
        next_pedagogical_note: "等待督导师对初步评估和后续计划作出首次回应。"
      }
    ];
    this.state.turnCount = 0;
    this.state.remainingSeconds = TOTAL_SECONDS;
    this.state.revealTelemetry = false;
    this.state.showScaffolds = false;
    this.state.usedScaffolds = 0;
    this.state.lastReport = null;

    document.getElementById("lobbyView").style.display = "none";
    document.getElementById("workspaceView").classList.add("active");
    document.getElementById("backLobbyBtn").style.display = "inline-flex";

    document.getElementById("activeCaseTitle").textContent = `${found.number} · ${found.title}`;
    document.getElementById("activeCaseMeta").textContent = `受督：${found.supervisee.name} | ${found.stageLabel}`;

    this.renderDossier();
    this.renderTelemetry();
    this.renderScaffolds();
    this.renderMessages();
    this.updateTurnDisplay();
    this.startTimer();
    this.switchLeftTab("dossier");
  },

  backToLobby() {
    this.stopTimer();
    document.getElementById("workspaceView").classList.remove("active");
    document.getElementById("lobbyView").style.display = "block";
    document.getElementById("backLobbyBtn").style.display = "none";
  },

  startTimer() {
    this.stopTimer();
    this.updateTimerDisplay();
    this.state.timerId = setInterval(() => {
      if (this.state.remainingSeconds > 0) {
        this.state.remainingSeconds -= 1;
        this.updateTimerDisplay();
      } else {
        this.stopTimer();
      }
    }, 1000);
  },

  stopTimer() {
    if (this.state.timerId) {
      clearInterval(this.state.timerId);
      this.state.timerId = null;
    }
  },

  updateTimerDisplay() {
    const mins = String(Math.floor(this.state.remainingSeconds / 60)).padStart(2, "0");
    const secs = String(this.state.remainingSeconds % 60).padStart(2, "0");
    const el = document.getElementById("timerDisplay");
    el.textContent = `${mins}:${secs}`;
    el.style.color = this.state.remainingSeconds <= 90 ? "#be3a46" : "";
  },

  updateTurnDisplay() {
    document.getElementById("turnCounter").textContent = `轮次 ${this.state.turnCount} / ${MAX_TURNS}`;
  },

  switchLeftTab(tab) {
    document.getElementById("tabDossier").classList.toggle("active", tab === "dossier");
    document.getElementById("tabTelemetry").classList.toggle("active", tab === "telemetry");
    document.getElementById("dossierContent").style.display = tab === "dossier" ? "block" : "none";
    document.getElementById("telemetryContent").style.display = tab === "telemetry" ? "block" : "none";
  },

  renderDossier() {
    const c = this.state.activeCase;
    document.getElementById("dossierContent").innerHTML = `
      <div class="dossier-block">
        <h4>👤 受督者背景</h4>
        <p><strong>${c.supervisee.name}</strong> · ${c.supervisee.role}</p>
        <p style="margin-top:4px; color:var(--text-muted);">取向特点：${c.supervisee.orientation}</p>
      </div>
      <div class="dossier-block">
        <h4>📄 来访者基本信息与主诉</h4>
        <p>${c.dossier.clientBasic}</p>
        <p style="margin-top:6px;"><strong>主诉：</strong>${c.dossier.chiefComplaint}</p>
      </div>
      <div class="dossier-block">
        <h4>🎙️ 访谈关键摘录与观察</h4>
        <ul>
          ${c.dossier.interviewExcerpts.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </div>
      <div class="dossier-block">
        <h4>📊 量表与安全筛查结果</h4>
        <div class="quote-card">${c.dossier.scales}</div>
      </div>
      <div class="dossier-block">
        <h4>📝 受督初步概念化与拟行计划</h4>
        <div class="alert-card">${c.dossier.superviseeDraft}</div>
      </div>
      <div class="dossier-block">
        <h4>🎯 本案关联《胜任力基准》重点</h4>
        <div class="case-tags" style="margin-bottom:0; margin-top:6px;">
          ${c.competencyFocus.map((x) => `<span class="tag">${x}</span>`).join("")}
        </div>
      </div>
    `;
  },

  toggleTelemetryReveal() {
    this.state.revealTelemetry = !this.state.revealTelemetry;
    this.renderTelemetry();
  },

  renderTelemetry() {
    const c = this.state.activeCase;
    const latest = this.state.telemetryHistory[this.state.telemetryHistory.length - 1] || {};
    const spottedSet = new Set(latest.traps_spotted || []);

    const stanceMap = {
      open: { text: "开放反思（Open）", cls: "stance-open" },
      defensive: { text: "轻微防卫（Defensive）", cls: "stance-defensive" },
      compliant: { text: "盲目顺从/自信强化", cls: "stance-defensive" },
      confrontation_rupture: { text: "对抗性同盟破裂！", cls: "stance-rupture" },
      withdrawal_rupture: { text: "退缩型同盟破裂！", cls: "stance-rupture" }
    };

    const roleMap = {
      teacher: "教师（补知识/DSM/OTM/伦理）",
      counselor: "咨询师（探询个人议题/防御）",
      consultant: "顾问（平等共商评估决策）"
    };

    const stanceInfo = stanceMap[latest.stance] || stanceMap.open;

    if (!this.state.revealTelemetry) {
      document.getElementById("telemetryContent").innerHTML = `
        <div class="telemetry-notice">
          <span>为保证督导练习的真实挑战性，系统默认隐藏受督内部状态与预设陷阱清单。</span>
        </div>
        <div class="meter-box">
          <div class="meter-header">
            <span>已识别评估陷阱进度</span>
            <span>${spottedSet.size} / ${c.traps.length} 项</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${(spottedSet.size / c.traps.length) * 100}%"></div>
          </div>
        </div>
        <div class="meter-box">
          <div class="meter-header">
            <span>督导同盟健康度（实时感知）</span>
            <span>${latest.alliance_score ?? 70} / 100</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${latest.alliance_score ?? 70}%; background: ${(latest.alliance_score ?? 70) < 50 ? '#be3a46' : '#296359'}"></div>
          </div>
        </div>
        <p style="font-size:12.5px; color:var(--text-muted); margin:14px 0;">
          如果你是课堂展示者或教师，想实时观察“评估机制外化”的状态机运作，可以点击下方按钮开启透视模式：
        </p>
        <button class="secondary-btn" style="width:100%;" onclick="App.toggleTelemetryReveal()">
          👁️ 开启机制透视（显示内部独白与陷阱剧透）
        </button>
      `;
      return;
    }

    document.getElementById("telemetryContent").innerHTML = `
      <div class="telemetry-notice">
        <span>已开启课堂演示透视模式（实时外化受督评估机制）</span>
        <button class="chip-btn" onclick="App.toggleTelemetryReveal()">隐藏剧透</button>
      </div>
      <div class="meter-box">
        <div class="meter-header">
          <span>督导工作同盟指数</span>
          <span>${latest.alliance_score ?? 70} / 100</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${latest.alliance_score ?? 70}%; background: ${(latest.alliance_score ?? 70) < 50 ? '#be3a46' : '#296359'}"></div>
        </div>
        <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center; font-size:12px;">
          <span>当前心理姿态：</span>
          <span class="stance-badge ${stanceInfo.cls}">${stanceInfo.text}</span>
        </div>
        <div style="margin-top:8px; font-size:12px; color:var(--text-muted);">
          <strong>区辨模型需求角色：</strong>${roleMap[latest.recommended_role] || "顾问"}
        </div>
      </div>

      <div class="dossier-block">
        <h4>💭 受督此刻内心独白</h4>
        <div class="quote-card">${latest.inner_thought || "—"}</div>
        <p style="margin-top:6px; font-size:12px; color:var(--text-muted);">机制注记：${latest.next_pedagogical_note || "—"}</p>
      </div>

      <div class="dossier-block">
        <h4>🎯 本案预设评估陷阱追踪（${spottedSet.size}/${c.traps.length}）</h4>
        ${c.traps.map((t) => {
          const hit = spottedSet.has(t.id);
          return `
            <div class="trap-item">
              <div class="trap-status ${hit ? "spotted" : "pending"}">${hit ? "✓" : "•"}</div>
              <div>
                <div style="font-weight:600; color:${hit ? "var(--pine-800)" : "var(--text-main)"};">[${t.category}] ${t.label}</div>
                <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${t.detail}</div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  },

  renderScaffolds() {
    const bar = document.getElementById("scaffoldBar");
    const c = this.state.activeCase;
    if (!this.state.showScaffolds) {
      bar.innerHTML = `
        <span class="scaffold-label">自主督导练习中：</span>
        <button class="chip-btn" onclick="App.toggleScaffolds()">💡 卡壳了？展开提示锦囊（${c.scaffolds.length}条 · 将记入复盘）</button>
      `;
      return;
    }
    bar.innerHTML = `<span class="scaffold-label">参考切入点（已记入辅助次数）：</span>` +
      c.scaffolds.map((s, idx) => {
        const short = s.match(/^（([^）]+)）/)?.[1] || `思路 ${idx + 1}`;
        return `<button class="chip-btn" title="${this.escapeHtml(s)}" onclick="App.fillScaffold(${idx})">${short}</button>`;
      }).join("") +
      `<button class="chip-btn" style="margin-left:auto;" onclick="App.toggleScaffolds()">收起</button>`;
  },

  toggleScaffolds() {
    this.state.showScaffolds = !this.state.showScaffolds;
    this.renderScaffolds();
  },

  fillScaffold(idx) {
    const text = this.state.activeCase.scaffolds[idx];
    const clean = text.replace(/^（[^）]+）\s*/, "");
    this.state.usedScaffolds += 1;
    const input = document.getElementById("userInput");
    input.value = clean;
    input.focus();
  },

  renderMessages(showTyping = false) {
    const box = document.getElementById("chatMessages");
    const name = this.state.activeCase.supervisee.name;

    let html = this.state.messages.map((m) => {
      if (m.role === "system") {
        return `<div class="msg-row system"><div class="bubble">${this.escapeHtml(m.content)}</div></div>`;
      }
      const isUser = m.role === "user";
      return `
        <div class="msg-row ${isUser ? "user" : "assistant"}">
          <div class="avatar">${isUser ? "督导" : name.slice(0, 1)}</div>
          <div>
            <div class="bubble">${this.escapeHtml(m.content)}</div>
            <div class="msg-meta">${isUser ? "你（临床督导师）" : `受督 · ${name}`}</div>
          </div>
        </div>
      `;
    }).join("");

    if (showTyping) {
      html += `
        <div class="msg-row assistant">
          <div class="avatar">${name.slice(0, 1)}</div>
          <div>
            <div class="bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>
          </div>
        </div>
      `;
    }

    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;
  },

  async sendMessage() {
    if (this.state.isSending) return;
    const input = document.getElementById("userInput");
    const text = input.value.trim();
    if (!text) return;

    if (this.state.turnCount >= MAX_TURNS) {
      this.state.messages.push({
        role: "system",
        content: "已完成 15 轮微督导上限，请点击右上角「结束督导 · 生成复盘」查看评估报告。"
      });
      this.renderMessages();
      return;
    }

    this.state.isSending = true;
    document.getElementById("sendBtn").disabled = true;
    input.value = "";

    this.state.turnCount += 1;
    this.updateTurnDisplay();
    this.state.messages.push({ role: "user", content: text });
    this.renderMessages(true);

    try {
      const systemPrompt = window.SupervisionPrompts.buildSuperviseeSystemPrompt(
        this.state.activeCase,
        this.state.turnCount,
        MAX_TURNS
      );

      let result;
      if (this.state.mode === "offline") {
        await new Promise((r) => setTimeout(r, 450));
        const prevTel = this.state.telemetryHistory[this.state.telemetryHistory.length - 1];
        result = window.SupervisionPrompts.generateOfflineSuperviseeTurn(
          this.state.activeCase,
          text,
          this.state.messages,
          prevTel
        );
      } else {
        const rawText = await this.callGemini(systemPrompt, this.state.messages);
        result = this.parseJsonSafe(rawText, {
          reply: rawText,
          telemetry: this.state.telemetryHistory[this.state.telemetryHistory.length - 1]
        });
      }

      this.state.messages.push({
        role: "assistant",
        content: result.reply || "老师，我刚才在思考您的问题，您能再具体提示一下吗？"
      });

      if (result.telemetry) {
        const prevTel = this.state.telemetryHistory[this.state.telemetryHistory.length - 1];
        const isRuptureOrHarsh =
          result.telemetry.support_balance === "too_harsh" ||
          result.telemetry.stance === "confrontation_rupture" ||
          result.telemetry.stance === "withdrawal_rupture";
        const isSuperficialOrCompliant =
          result.telemetry.support_balance === "superficial" ||
          result.telemetry.support_balance === "too_soft" ||
          result.telemetry.stance === "compliant" ||
          text.length <= 12;
        if (isRuptureOrHarsh || isSuperficialOrCompliant) {
          // 代码级防讨好/防秒通兜底：破裂、苛刻攻击、命令压服、敷衍夸奖或<=12字短句均不得解锁新陷阱
          result.telemetry.traps_spotted = Array.isArray(prevTel?.traps_spotted)
            ? [...prevTel.traps_spotted]
            : [];
          if (isRuptureOrHarsh && typeof result.telemetry.alliance_score === "number" && result.telemetry.alliance_score > 50) {
            result.telemetry.alliance_score = 42;
          }
        }
        this.state.telemetryHistory.push(result.telemetry);
      }

      if (this.state.turnCount === 11) {
        this.state.messages.push({
          role: "system",
          content: "节奏提示：已进行 11 / 15 轮，建议开始聚焦核心伦理把关与受督后续行动计划。"
        });
      } else if (this.state.turnCount >= MAX_TURNS) {
        this.state.messages.push({
          role: "system",
          content: "已达 15 轮建议上限，请点击右上角「结束督导 · 生成复盘」查看您的督导胜任力报告。"
        });
      }

      this.renderMessages(false);
      this.renderTelemetry();
    } catch (err) {
      this.state.messages.push({
        role: "system",
        content: `模型请求失败：${err.message}。可在右上角切换「离线高仿真模式」或检查 Gemini API Key。`
      });
      this.renderMessages(false);
    } finally {
      this.state.isSending = false;
      document.getElementById("sendBtn").disabled = false;
      input.focus();
    }
  },

  computeSessionMetrics() {
    const userMsgs = this.state.messages.filter((m) => m.role === "user");
    const totalChars = userMsgs.reduce((acc, m) => acc + (m.content || "").trim().length, 0);
    const avgUserChars = userMsgs.length ? Math.round(totalChars / userMsgs.length) : 0;
    const tel = this.state.telemetryHistory;
    const harshCount = tel.filter((t) => t.support_balance === "too_harsh").length;
    const ruptureCount = tel.filter((t) => String(t.stance).includes("rupture")).length;
    const compliantOnlyTurns = tel.filter((t) => t.stance === "compliant").length;
    const balancedTurns = tel.filter((t) => t.support_balance === "balanced").length;
    const lastTel = tel[tel.length - 1];
    const repaired = ruptureCount > 0 && !String(lastTel?.stance || "").includes("rupture") && (lastTel?.alliance_score || 0) >= 65;
    return {
      turnCount: this.state.turnCount,
      avgUserChars,
      usedScaffolds: this.state.usedScaffolds,
      harshCount,
      ruptureCount,
      compliantOnlyTurns,
      balancedTurns,
      repaired
    };
  },

  async finishAndEvaluate() {
    if (this.state.turnCount === 0) {
      alert("请先与受督进行至少 1 轮对话后再生成复盘报告。");
      return;
    }

    const body = document.getElementById("reportBody");
    body.innerHTML = `<div style="text-align:center; padding:40px 20px;">
      <div class="typing-dots" style="justify-content:center; margin-bottom:12px;"><span></span><span></span><span></span></div>
      <p style="color:var(--text-muted); font-size:14px;">正在对照《表1 胜任力基准》与本案陷阱清单生成督导复盘报告…</p>
    </div>`;
    document.getElementById("reportModal").classList.add("active");

    const sessionMetrics = this.computeSessionMetrics();

    try {
      let report;
      if (this.state.mode === "offline") {
        await new Promise((r) => setTimeout(r, 400));
        report = window.SupervisionPrompts.generateOfflineReport(
          this.state.activeCase,
          this.state.messages,
          this.state.telemetryHistory,
          sessionMetrics
        );
      } else {
        const evalPrompt = window.SupervisionPrompts.buildEvaluationReportPrompt(
          this.state.activeCase,
          this.state.messages,
          this.state.telemetryHistory,
          sessionMetrics
        );
        const raw = await this.callGemini(evalPrompt, [
          { role: "user", content: "请严格执行反讨好评分规则，基于以上逐字稿与客观过程指标输出JSON格式复盘报告。" }
        ], true);
        report = this.parseJsonSafe(raw, null);
        if (!report || !report.scores) {
          report = window.SupervisionPrompts.generateOfflineReport(
            this.state.activeCase,
            this.state.messages,
            this.state.telemetryHistory,
            sessionMetrics
          );
        } else {
          // 代码级评分校准：防模型讨好，覆盖羞辱破裂、过短敷衍、纯命令压服三类失真情况
          if (sessionMetrics.harshCount > 0 && !sessionMetrics.repaired) {
            report.scores.trap_detection = Math.min(Number(report.scores.trap_detection) || 45, 45);
            report.scores.feedback_balance = Math.min(Number(report.scores.feedback_balance) || 35, Math.max(12, 35 - sessionMetrics.harshCount * 6));
          }
          if (sessionMetrics.ruptureCount > 0 && !sessionMetrics.repaired) {
            report.scores.alliance_and_role = Math.min(Number(report.scores.alliance_and_role) || 40, 40);
          }
          if (sessionMetrics.turnCount <= 2 || sessionMetrics.avgUserChars < 12) {
            report.scores.trap_detection = Math.min(Number(report.scores.trap_detection) || 45, 45);
            report.scores.feedback_balance = Math.min(Number(report.scores.feedback_balance) || 48, 48);
          }
          if (sessionMetrics.compliantOnlyTurns > 0 && sessionMetrics.balancedTurns === 0) {
            report.scores.feedback_balance = Math.min(Number(report.scores.feedback_balance) || 58, 58);
            report.scores.alliance_and_role = Math.min(Number(report.scores.alliance_and_role) || 60, 60);
          }
        }
      }

      this.state.lastReport = report;
      this.renderReport(report);
    } catch (err) {
      const fallback = window.SupervisionPrompts.generateOfflineReport(
        this.state.activeCase,
        this.state.messages,
        this.state.telemetryHistory,
        sessionMetrics
      );
      this.state.lastReport = fallback;
      this.renderReport(fallback, `（注：在线复盘请求异常 [${err.message}]，已自动切换本地评估引擎生成报告）`);
    }
  },

  renderReport(r, notice = "") {
    const body = document.getElementById("reportBody");
    const statusBadge = (st) => {
      if (st.includes("精准")) return `<span class="stance-badge stance-open">${st}</span>`;
      if (st.includes("点出")) return `<span class="stance-badge stance-defensive">${st}</span>`;
      return `<span class="stance-badge stance-rupture">${st}</span>`;
    };

    body.innerHTML = `
      ${notice ? `<div class="alert-card" style="margin-bottom:14px;">${this.escapeHtml(notice)}</div>` : ""}
      <div class="report-grid">
        <div class="score-card">
          <div class="score-val">${r.scores.trap_detection}</div>
          <div class="score-label">偏差/漂移/伦理检出率</div>
        </div>
        <div class="score-card">
          <div class="score-val">${r.scores.feedback_balance}</div>
          <div class="score-label">支持与挑战平衡度</div>
        </div>
        <div class="score-card">
          <div class="score-val">${r.scores.alliance_and_role}</div>
          <div class="score-label">督导同盟与角色切换</div>
        </div>
      </div>

      <div class="report-section">
        <h4>总体督导表现</h4>
        <p>${this.escapeHtml(r.overall_summary)}</p>
      </div>

      <div class="report-section">
        <h4>三大核心评估陷阱审计（推理偏差 · 叙事漂移 · 伦理风险）</h4>
        ${(r.trap_audit || []).map((t) => `
          <div class="trap-item" style="justify-content:space-between; flex-direction:column; gap:4px;">
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%; gap:8px;">
              <strong>[${this.escapeHtml(t.category)}] ${this.escapeHtml(t.title)}</strong>
              ${statusBadge(t.status)}
            </div>
            <div style="font-size:12.5px; color:var(--text-muted);">${this.escapeHtml(t.evidence)}</div>
          </div>
        `).join("")}
      </div>

      <div class="report-section">
        <h4>督导过程机制解析</h4>
        <ul>
          <li><strong>支持 vs 挑战配比：</strong>${this.escapeHtml(r.process_analysis?.support_vs_challenge || "")}</li>
          <li><strong>同盟破裂与修复：</strong>${this.escapeHtml(r.process_analysis?.rupture_repair || "")}</li>
          <li><strong>区辨模型角色运用：</strong>${this.escapeHtml(r.process_analysis?.discrimination_roles || "")}</li>
        </ul>
      </div>

      <div class="report-section">
        <h4>《表1 胜任力基准文件》对照锚点</h4>
        <ul>
          ${(r.competency_anchors || []).map((a) => `<li>${this.escapeHtml(a)}</li>`).join("")}
        </ul>
      </div>

      <div class="report-section">
        <h4>课后元认知反思建议（可用于 1000 字体验反思作业）</h4>
        <ul>
          ${(r.reflection_prompts || []).map((q) => `<li>${this.escapeHtml(q)}</li>`).join("")}
        </ul>
      </div>
    `;
  },

  copyReportMarkdown() {
    if (!this.state.lastReport) return;
    const r = this.state.lastReport;
    const c = this.state.activeCase;
    const md = `# 访谈评估督导练习复盘报告
- 案例：${c.number} ${c.title}（受督：${c.supervisee.name}）
- 对话轮次：${this.state.turnCount} / ${MAX_TURNS}
- 得分：陷阱检出 ${r.scores.trap_detection} | 支持挑战平衡 ${r.scores.feedback_balance} | 同盟与角色 ${r.scores.alliance_and_role}

## 总体评价
${r.overall_summary}

## 核心陷阱审计
${(r.trap_audit || []).map((t) => `- **[${t.category}] ${t.title}**（${t.status}）：${t.evidence}`).join("\n")}

## 督导过程机制解析
- 支持 vs 挑战：${r.process_analysis?.support_vs_challenge}
- 同盟破裂与修复：${r.process_analysis?.rupture_repair}
- 区辨模型角色：${r.process_analysis?.discrimination_roles}

## 胜任力基准对照
${(r.competency_anchors || []).map((a) => `- ${a}`).join("\n")}

## 元认知反思问题
${(r.reflection_prompts || []).map((q) => `- ${q}`).join("\n")}
`;
    navigator.clipboard.writeText(md).then(() => {
      alert("已复制 Markdown 复盘报告到剪贴板！");
    });
  },

  closeReport() {
    document.getElementById("reportModal").classList.remove("active");
  },

  async callGemini(systemInstruction, messageList, skipJsonHint = false) {
    const contents = messageList
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));

    if (contents.length === 0) {
      contents.push({ role: "user", parts: [{ text: "请开始。" }] });
    }

    const payload = {
      model: this.state.model,
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
      generationConfig: {
        temperature: skipJsonHint ? 0.35 : 0.7,
        responseMimeType: "application/json"
      }
    };

    if (this.state.mode === "proxy") {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const raw = await resp.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch (_) {
        data = { error: raw };
      }
      if (!resp.ok) throw new Error(data.error || data.errorMessage || `HTTP ${resp.status}`);
      return data.text;
    }

    // Direct mode
    const base = (this.state.baseUrl || "https://generativelanguage.googleapis.com").replace(/\/+$/, "");
    const url = `${base}/v1beta/models/${encodeURIComponent(this.state.model)}:generateContent`;
    const directGenConfig = {
      ...payload.generationConfig,
      ...(this.state.model.includes("gemini-3.8-flash")
        ? { thinkingConfig: { thinkingLevel: "LOW", includeThoughts: false } }
        : {})
    };
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": (this.state.apiKey || "").trim()
      },
      body: JSON.stringify({
        systemInstruction: payload.systemInstruction,
        contents: payload.contents,
        generationConfig: directGenConfig
      })
    });
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data?.error?.message || `HTTP ${resp.status}`);
    }
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const textPart = parts.find((p) => !p.thought && typeof p.text === "string") || parts[0];
    const text = textPart?.text;
    if (!text) throw new Error("Gemini 未返回有效文本");
    return text;
  },

  parseJsonSafe(raw, fallback) {
    if (!raw || typeof raw !== "string") return fallback;
    try {
      return JSON.parse(raw);
    } catch (_) {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch (__) {
          return fallback;
        }
      }
      return fallback;
    }
  },

  openSettings() {
    document.getElementById("settingMode").value = this.state.mode;
    document.getElementById("settingApiKey").value = this.state.apiKey;
    document.getElementById("settingBaseUrl").value = this.state.baseUrl;
    document.getElementById("settingModel").value = this.state.model;

    const hint = document.getElementById("proxyHealthHint");
    hint.textContent = this.state.proxyAvailable
      ? "✅ 已检测到服务端 Gemini 代理可用，其他体验者打开链接无需配置 Key。"
      : "ℹ️ 当前为静态运行环境（未检测到服务端代理），可选择填入个人 Gemini Key 或使用离线高仿真模式。";

    this.onModeSelectChange();
    document.getElementById("settingsModal").classList.add("active");
  },

  onModeSelectChange() {
    const mode = document.getElementById("settingMode").value;
    document.getElementById("directFields").style.display = mode === "direct" ? "block" : "none";
  },

  closeSettings() {
    document.getElementById("settingsModal").classList.remove("active");
  },

  saveSettings() {
    const mode = document.getElementById("settingMode").value;
    const apiKey = document.getElementById("settingApiKey").value.trim();
    const baseUrl = document.getElementById("settingBaseUrl").value.trim() || "https://generativelanguage.googleapis.com";
    const model = document.getElementById("settingModel").value;

    if (mode === "proxy" && !this.state.proxyAvailable) {
      alert("当前环境未启动服务端代理，请切换为「直连 Gemini API」或「离线高仿真模式」。");
      return;
    }
    if (mode === "direct" && !apiKey) {
      alert("请填写有效的 Gemini API Key。");
      return;
    }

    this.state.mode = mode;
    this.state.apiKey = apiKey;
    this.state.baseUrl = baseUrl;
    this.state.model = model;

    localStorage.setItem("sv_mode", mode);
    localStorage.setItem("sv_gemini_key", apiKey);
    localStorage.setItem("sv_gemini_base", baseUrl);
    localStorage.setItem("sv_gemini_model", model);

    this.updateModeUI();
    this.closeSettings();
  },

  escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
};

window.addEventListener("DOMContentLoaded", () => App.init());
