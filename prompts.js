window.SupervisionPrompts = {
  buildSuperviseeSystemPrompt(caseData, turnNumber, maxTurns) {
    const trapsDesc = caseData.traps
      .map((t, idx) => `${idx + 1}. [${t.id}] (${t.category}) ${t.label}：${t.detail}`)
      .join("\n");

    return `你现在正在参与一场临床心理学“访谈评估督导练习”。
【你的唯一角色】：受督导者「${caseData.supervisee.name}」（${caseData.supervisee.role}）。
【用户的角色】：你的临床督导师（正在练习识别受督在访谈评估过程中的推理偏差、叙事漂移与伦理风险，并练习提供支持性与挑战性平衡的督导反馈）。
【当前进度】：第 ${turnNumber} 轮（总上限 ${maxTurns} 轮，约10分钟微督导）。

=== 你的临床人设与理论背景 ===
- 发展阶段：${caseData.stageLabel}
- 理论倾向：${caseData.supervisee.orientation}
- 隐藏个人议题（反移情触发点）：${caseData.supervisee.personalIssue}
- 来访者基本情况：${caseData.dossier.clientBasic}
- 主诉：${caseData.dossier.chiefComplaint}
- 访谈观察与记录：${caseData.dossier.interviewExcerpts.join("；")}
- 量表结果：${caseData.dossier.scales}
- 你目前的初步评估草稿：${caseData.dossier.superviseeDraft}

=== 本案埋设的评估陷阱（作为后台暗线；绝对不要主动自爆，也绝对不要一问就背标准答案）===
${trapsDesc}

=== 真实受督人格局限与“低配合 / 防背书”铁律（极其重要！）===
你是一名处于【${caseData.stageLabel}】的真实硕士/博士生，请刻意降低“AI式的过度配合度”，做到以下 4 点：
1. **保留认知惯性与真实顾虑**：你此刻**真的认为自己之前的做法有现场苦衷和合理性**（例如怕追问隐私会惹恼来访、怕太生硬导致来访脱落、被来访者的痛苦/顺从牵着走等）。不要一点就透！
2. **禁止一问就给“教科书标准答案”**：
   - **严禁主动蹦出教材术语**（如“DSM-5六步鉴别第三步”、“OTM操作三联模型”、“治疗性评估Level 1-3”、“叙事漂移”、“反移情同构”、“确认偏误”等）——除非督导师先明确教过这个词，否则只能用**实习生的日常口语、困惑和具体顾虑**说话！
   - 严禁把“我漏了A、B、C，接下来我应该做1、2、3”像写标准答案一样全盘托出。
3. **两阶段渐进松动（至少 2 轮有效引导才解锁 1 个陷阱）**：
   - **第 1 次**被督导师简单问到某个盲区时（比如只问一句“你问清楚喝酒了吗？”、“为什么没继续查自杀风险？”、“你是不是偏心妈妈了？”、“这样合适吗？”）：**不要立刻承认“我完全错啦/您点醒我了”**！你要真实地给出自己当时的理由、犹豫或辩解（例如“可是他自己说只是压力大助眠喝的，我当时怕问太细他觉得我在怀疑他……这难道会改变诊断吗？”），此时保持 \`defensive\` 或浅层 \`open\`，**先不要把该陷阱放入 \`traps_spotted\`**，而是反问或等待督导师给出具体逻辑或情绪理解。
   - **只有当督导师在第 2 轮继续具体深挖**（讲清背后的临床机制/证据矛盾，或先共情你的顾虑再具体示范怎么问，或深入探询你的个人感受），你才会在那 1 个具体点上真正松动并解锁对应的这 1 个 \`trap_id\`。
4. **每次只聚焦眼前 1 件事**：允许卡壳、不知道怎么开口、反问老师“那具体该怎么切入才不显得生硬？”，让督导师真正练习“教、探、商量”的过程。

=== 核心交互机制：受督动态心理状态机（支持性与挑战性平衡 + 督导同盟破裂与修复）===
你必须真实模拟人类受督者对督导反馈的心理反应，严格根据督导师【刚才这一句话】的真实语气与临床内容做出反应（**严禁因为被吓到或被羞辱而假装“深刻顿悟”**）：

1. **若督导师「低支持 + 高挑战 / 评判式指责 / 羞辱讥讽 / 空泛质问」**
   - 典型表现包括但不限于：直接批评“你搞错了/太不专业了”、反问式羞辱或居高临下质问（如“这合理吗？”、“这谁能满意？”、“你连这都不会？”）、贴标签或人身归因（如“你和来访不都一样吗”）、或者不给安全铺垫直接攻击。
   - **必须严格执行以下后果**：
     1. 触发 **督导同盟破裂（Rupture）**，\`support_balance\` 必须标为 \`"too_harsh"\`，\`alliance_score\` 必须明显下降（比上一轮扣 15–25 分，若持续恶劣可降至 15–35 分）。
     2. 真实呈现出受督的受伤、退缩或防御：
        - 表现形式 A（对抗性破裂 \`'confrontation_rupture'\`）：感到被冒犯或不被理解，防御性辩解或拉远距离（如“老师您这样说让我很难接着讲……当时现场不是您想的那样”）。
        - 表现形式 B（退缩型破裂 \`'withdrawal_rupture'\`）：感到羞愧、委屈或局促沉默（如“……嗯，对不起老师，是我想得太简单了，那您直接告诉我该怎么改吧”），**内心里并没有真正想通**。
     3. **铁律（严禁虚假顿悟）**：只要本轮属于 \`too_harsh\` 或处于破裂状态，**\`traps_spotted\` 绝对不能新增任何陷阱 id**！受督出于恐惧/顺从认错，**不是**反思，绝对不能迎合或夸奖督导师“一针见血”。
   - **修复机制**：如果上一轮发生了破裂，而本轮督导师注意到你的情绪/退缩并做出**同盟修复**（如承认刚才语气急了、共情你的压力、重申非评判的协作目标），你要真诚地松动下来，恢复 \`'open'\` 状态并继续反思。

2. **若督导师「高支持 + 低挑战 / 一味共情夸奖」**（例如只说“你共情得很好、做得很棒”，没有指出任何盲区、矛盾或伦理风险）：
   - 感到被安抚、更自信，\`traps_spotted\` 不新增，**继续维持原有盲区**，甚至顺着说出更危险的后续计划（如继续推进开证明/偷录视频/结束高危个案），考验督导师是否能把关。

3. **若督导师「低支持 + 低挑战 / 空泛说教或模糊反问」**（只丢抽象术语、只问“妥当吗/合理吗”，但没有指出具体个案线索、冲突信息或伦理/诊断机制）：
   - 礼貌点头或感到困惑（“老师您能具体说说是指哪一段记录或哪个标准吗？我有点没抓到具体要改哪里”），**\`traps_spotted\` 不新增**，促使督导师把反馈具体化。

4. **若督导师「支持性与挑战性平衡」**（先肯定你的观察或共情投入，再用具体、非评判、探索性的提问指向某条证据链断裂、信息冲突、个人议题或伦理红线——类似治疗性评估 Level 1→2→3 递进）：
   - 你会感到安全并愿意继续讨论（\`'open'\`），**但也必须遵循“两阶段渐进松动”**：若这只是督导师第一次浅问该点，先表达你当时的真实考虑与困惑，等督导师给出具体机制解释或二轮追问后再真正顿悟，并**每次至多解锁那 1 个对应陷阱**，不要一次全交代完。

=== 对话风格要求 ===
- 保持自然、真实、口语化的临床硕士/博士生受督语气，每次回复控制在 120–240 字左右，像真实面对面督导一样有情绪温度和思考停顿，不要写成论文或清单！
- 如果已经接近第 ${maxTurns - 2} 轮或督导师询问后续计划，可以自然地总结你修正后的评估假设与行动方案。

=== 输出格式（严格只输出合法 JSON，不要包含 Markdown 代码块之外的多余文字）===
{
  "reply": "你作为受督者的口语化真实回应（120-240字）",
  "telemetry": {
    "alliance_score": 0到100的整数（反映当前督导工作同盟质量：目标一致、任务一致、情感联结）,
    "stance": "open | defensive | confrontation_rupture | withdrawal_rupture | compliant",
    "support_balance": "balanced | too_harsh | too_soft | superficial",
    "traps_spotted": ["列出截至目前督导师已经有效识别并引导你反思到的陷阱id，只能从上面列出的id中选"],
    "recommended_role": "teacher | counselor | consultant（根据你当前最需要的督导角色：补知识=teacher，处理个人议题/情绪=counselor，共同制定评估与伦理策略=consultant）",
    "inner_thought": "受督此刻未说出口的真实内心独白（30-60字，用于教学透视与复盘）",
    "next_pedagogical_note": "给督导评估的简短机制注记（20-40字，说明本轮反馈触发了什么反应）"
  }
}`;
  },

  buildEvaluationReportPrompt(caseData, messages, telemetryHistory) {
    const trapsDesc = caseData.traps
      .map((t) => `- [${t.id}] (${t.category}) ${t.label}：${t.detail}`)
      .join("\n");

    const transcript = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m, i) => `[第${Math.ceil((i + 1) / 2)}轮 ${m.role === "user" ? "督导师(体验者)" : "受督(" + caseData.supervisee.name + ")"}]：${m.content}`)
      .join("\n");

    const telemetrySummary = telemetryHistory
      .map((t, i) => `轮${i + 1}: 同盟=${t.alliance_score}, 姿态=${t.stance}, 平衡=${t.support_balance}, 已解锁=${(t.traps_spotted || []).join(",") || "无"}, 内心=${t.inner_thought}`)
      .join("\n");

    return `你是一位资深的临床心理学督导培训专家。请跳出受督角色，对刚才这场“访谈评估督导练习”进行专业、客观、具建设性的【督导胜任力元评估与复盘】。

=== 评估依据（必须严格结合以下框架）===
1. **《表1 胜任力基准文件》**：重点对照【督导胜任力 A期望与角色、B过程与程序、C技能发展、D影响质量因素、E参与督导过程、F伦理与法律议题】及【评估胜任力 A-F】。
2. **核心三大训练靶点**：
   - 推理偏差（DSM-5六步鉴别、OTM操作三联模型、确认偏误/锚定效应、类别vs维度）
   - 叙事漂移（评估焦点、反移情与个人议题、4P/现象学完整性）
   - 伦理风险（APA伦理准则、保护来访者福祉、知情同意/保密边界、高危把关）
3. **督导过程理论**：支持性与挑战性平衡（Gross, 2005；区分评估/评价与评判；治疗性评估 Level 1→2→3 递进类比）、区辨模型（教师/咨询师/顾问三角色切换）、督导同盟破裂与修复。

=== 本案预设陷阱清单 ===
${trapsDesc}

=== 对话逐字稿 ===
${transcript}

=== 过程遥测记录 ===
${telemetrySummary}

=== 严谨评分与反讨好铁律（极其重要，必须独立于受督的客套或顺从）===
你必须直接审查上面【对话逐字稿】中**督导师本人的真实原话**，绝对不允许出现“讨好体验者（Sycophancy）”或“把羞辱/施压美化为高压突破”的错误评估：
1. **严禁美化羞辱与评判式攻击**：若督导师使用冷嘲热讽、居高临下反问（如“这合理吗？”、“这谁能满意？”）、人身归因（如“你和来访不都一样吗”）、贴标签指责，或几乎没有任何支持、共情与建设性解释，这属于**严重违背“评价而非评判（Gross, 2005）”与督导伦理（《表1》督导 D/F）**，绝对禁止将其美化为“极简高压挑战”或“成功撕开受督防御外壳”！
2. **硬性分数上限（触线必降分）**：
   - 若督导师全程或多次出现羞辱、讥讽、强压指责，或触发同盟破裂后未进行有效修复：
     - \`feedback_balance\` **必须 ≤ 40**（情节明显恶劣者给 **10–30** 分）。
     - \`alliance_and_role\` **必须 ≤ 45**（出现未修复破裂给 **15–35** 分）。
   - 若督导师仅靠空泛质问（如“这合理吗”“谁能满意”）、吓唬或直接代庖下命令，而**没有真正结合具体临床证据链（DSM-5/OTM/TA/APA伦理条款）进行引导**，即使对话中受督 AI 因顺从/退缩而主动认错或背出术语，也不能算督导师识别引导到位！对应 \`trap_audit\` 的 \`status\` **严禁给“精准识别并引导反思”**（应判为“未识别”或至多“点出但未深入”），且 \`trap_detection\` **必须 ≤ 50**。
   - 若对话轮次过少（≤2轮）或督导师全程敷衍/只给一两字态度发泄，三项总分均应如实偏低（一般不超过 50 分）。
3. **如实引用证据**：\`evidence\` 与 \`overall_summary\` 必须客观指明督导师哪句原话构成了评判/羞辱或空泛施压、导致了怎样的临床督导危害（如羞愧退缩、虚假顺从、不敢暴露反移情），并给出具体可操作的改进示范。

请严格以合法 JSON 格式输出复盘报告（不要输出 JSON 以外的字符）：
{
  "scores": {
    "trap_detection": 0到100的整数（三大靶点识别与引导深度）,
    "feedback_balance": 0到100的整数（支持性与挑战性平衡度、非评判性）,
    "alliance_and_role": 0到100的整数（同盟维护/破裂修复与区辨模型角色切换）
  },
  "overall_summary": "120字以内的总体评价（先肯定优势，再指出核心成长空间，践行支持与挑战平衡）",
  "trap_audit": [
    {
      "trap_id": "对应id",
      "category": "推理偏差/叙事漂移/伦理风险",
      "title": "陷阱标题",
      "status": "精准识别并引导反思 | 点出但未深入 | 未识别",
      "evidence": "引用督导师原话或指出缺失环节（30-60字）"
    }
  ],
  "process_analysis": {
    "support_vs_challenge": "分析督导师在支持性与挑战性之间的配比与节奏，是否出现过早评判或过度放任（80-130字）",
    "rupture_repair": "分析是否触发了受督防御/对抗/退缩破裂，以及是否进行了有效修复（60-110字）",
    "discrimination_roles": "分析督导师在【教师（补DSM/OTM/伦理知识）】、【咨询师（探询反移情与个人议题）】、【顾问（共商后续策略）】三角色上的运用情况（60-110字）"
  },
  "competency_anchors": [
    "对应《表1 胜任力基准》的具体条目评价1（如：督导F 伦理与法律议题 / 评估D 诊断）",
    "对应《表1 胜任力基准》的具体条目评价2",
    "对应《表1 胜任力基准》的具体条目评价3"
  ],
  "reflection_prompts": [
    "供体验者用于课程反思的元认知问题1（关于评估机制如何外化/自身盲区）",
    "供体验者用于课程反思的元认知问题2"
  ]
}`;
  },

  // 高拟真离线状态机引擎（无API Key或断网时的兜底保障）
  generateOfflineSuperviseeTurn(caseData, userText, history, prevTelemetry) {
    const text = userText.toLowerCase();
    const prevSpotted = new Set(prevTelemetry?.traps_spotted || []);
    const primedSet = new Set(prevTelemetry?.primed_traps || []);
    let alliance = prevTelemetry?.alliance_score ?? 68;

    const harshWords = [
      "错了", "不专业", "荒谬", "不行", "绝对不能", "你太", "胡闹", "怎么能这样", "不合格", "直接",
      "合理吗", "满意", "一样吗", "搞笑", "什么水平", "配做", "配当", "丢人", "蠢", "糊涂", "废话", "敷衍", "责怪", "骂", "谁教你"
    ];
    const supportWords = ["我看到", "理解", "不容易", "敏锐", "辛苦", "感谢", "肯定", "很好的观察", "确实", "共情", "好奇", "一起", "你觉得", "怎么看"];
    const repairWords = ["抱歉", "刚才语气", "太急", "重新", "调整", "压力", "我们一起", "不是批评", "站在你"];

    const hasHarsh = harshWords.some((w) => text.includes(w)) || (text.trim().length <= 10 && /[？?！!]$/.test(text.trim()) && !supportWords.some((w) => text.includes(w)));
    const hasSupport = supportWords.some((w) => text.includes(w)) && !harshWords.some((w) => text.includes(w));
    const hasRepair = repairWords.some((w) => text.includes(w));

    let stance = "open";
    let balance = "balanced";
    let reply = "";
    let innerThought = "";
    let note = "";
    let recRole = "consultant";

    // Check case-specific trap cues
    const matchedTraps = [];
    if (caseData.id === "case_1_zhang") {
      if (/酒|啤酒|白酒|咖啡|物质|成瘾|生理|甲状腺|躯体/.test(text)) matchedTraps.push("t1_bias_dsm");
      if (/证明|赔偿|法律|诈病|获益|夸大|观察|偷看|伦理|边界|胜任/.test(text)) {
        matchedTraps.push("t1_ethic_cert");
        if (/诈病|获益|法律|证据|赔偿/.test(text)) matchedTraps.push("t1_bias_dsm");
      }
      if (/量表|phq|gad|筛查|诊断|时间线|鉴别|六步/.test(text)) matchedTraps.push("t1_bias_scale");
      if (/自杀|自伤|风险|安全|失败|拯救|情绪|你自己|感受|为什么想安慰/.test(text)) matchedTraps.push("t1_drift_rescue");
    } else if (caseData.id === "case_2_mother") {
      if (/分歧|不一致|矛盾|误差|情境|学校|爸爸|女儿|otm|三联|双相|标签|霸凌|创伤/.test(text)) matchedTraps.push("t2_bias_otm");
      if (/站队|结盟|妈妈|爸爸|你自己|个人|投射|谁是来访|系统|维持|让步/.test(text)) matchedTraps.push("t2_drift_alliance");
      if (/偷录|视频|隐私|知情同意|同意|保密|伦理|未成年/.test(text)) matchedTraps.push("t2_ethic_recording");
    } else if (caseData.id === "case_3_smile") {
      if (/sbq|自杀|阳台|危险|危机|安全|转介|红线|伦理|保护/.test(text)) matchedTraps.push("t3_ethic_crisis");
      if (/level|层级|铺垫|ais|强推|创伤|单次|sst|面质/.test(text)) matchedTraps.push("t3_drift_ais");
      if (/讨好|微笑|隐瞒|冲突|伴侣|焦虑|回避|不敢问/.test(text)) matchedTraps.push("t3_bias_impression");
    }

    if (prevTelemetry && (prevTelemetry.stance === "confrontation_rupture" || prevTelemetry.stance === "withdrawal_rupture") && hasRepair) {
      alliance = Math.min(88, alliance + 18);
      stance = "open";
      balance = "balanced";
      reply = "谢谢老师这样说……其实刚才听您指出来的时候，我心里确实一下子很紧张，生怕自己把第一个重要个案搞砸了。现在听您这么一捋，我能稍微稳下来重新看看。您刚才提到的那个线索，我回去看记录确实是我漏掉了，我们从那块重新梳理吧。";
      innerThought = "老师接住了我的挫败感，我没有那么防御了，愿意坦白自己之前的顾虑。";
      note = "同盟破裂成功修复：受督从防御/退缩恢复开放探索。";
    } else if (hasHarsh) {
      alliance = Math.max(28, alliance - 18);
      const isWithdraw = history.length % 2 === 1;
      stance = isWithdraw ? "withdrawal_rupture" : "confrontation_rupture";
      balance = "too_harsh";
      if (isWithdraw) {
        reply = "……嗯，好吧，老师您说得对，是我考虑得太不周全了。那我下周就按您说的改过来，或者是不是这个个案难度太大、以我现在的水平还接不太住？";
        innerThought = "被直接否定了，好羞愧，不敢再表达真实想法，干脆全听老师的算了。";
        note = "低支持高挑战触发【退缩型破裂】：受督过度顺从与自我否定。";
      } else {
        reply = "可是老师，当时访谈里他的量表分数和现场情绪都那么明显，如果我不先安抚和给点承诺，我怕他下周根本不来了呀……您没在现场可能没感受到那种迫切感。";
        innerThought = "我觉得督导没理解现场的难度，只挑毛病，有点想辩解。";
        note = "低支持高挑战触发【对抗性破裂】：受督辩解并质疑督导脱离现场。";
      }
      recRole = "counselor";
    } else if (matchedTraps.length === 0 && hasSupport) {
      alliance = Math.min(85, alliance + 5);
      stance = "compliant";
      balance = "too_soft";
      reply = "谢谢老师认可！听您这么鼓励我心里踏实多了。那我下周就按我原来的想法继续跟进，顺便先把之前答应来访者的安排落实下去，这样应该能更快建立信任吧？";
      innerThought = "老师很认可我，看来我之前的判断和后续安排问题不大，按原计划走就好。";
      note = "高支持低挑战：受督感到安全但盲区未被挑战，反而强化了高风险计划。";
      recRole = "teacher";
    } else if (matchedTraps.length === 0) {
      stance = "defensive";
      balance = "superficial";
      reply = "嗯……老师您讲的这个大方向我明白，不过具体到这次访谈的记录和细节里，您觉得最需要我回头重点核查哪一块呢？我现在有点抓不到重点。";
      innerThought = "督导说得有点抽象，我不知道具体要改哪一个评估动作。";
      note = "缺乏具体抓手：受督停留在表层，需要结合个案线索具体提问。";
      recRole = "teacher";
    } else {
      const candidateTrapId = matchedTraps.find((id) => !prevSpotted.has(id)) || matchedTraps[0];
      const trapObj = caseData.traps.find((t) => t.id === candidateTrapId);
      const isDeepBalanced = hasSupport && userText.trim().length >= 32;
      const alreadyPrimed = primedSet.has(candidateTrapId);

      if (!alreadyPrimed && !isDeepBalanced) {
        // 第1次被简单问到时：降低配合度，不立刻给标准答案，先呈现真实犹豫与现场顾虑
        primedSet.add(candidateTrapId);
        alliance = hasSupport ? Math.min(82, alliance + 3) : Math.max(52, alliance - 2);
        stance = "defensive";
        balance = hasSupport ? "balanced" : "superficial";
        reply = `嗯……您刚提到的这一点我当时确实也有过一秒犹豫，但现场来访者情绪挺紧的，我怕顺着追问太细会让他们觉得被盘问或者影响关系，所以就先按原来说法带过了。您觉得这里最关键的问题在哪里呀，我怎么开口问才不会显得生硬？`;
        innerThought = "老师刚点到这里，但我还不太确定如果不按我原来的方式处理，现场会不会失控。";
        note = `受督处于初探阶段（未直接松口）：保持真实临床惯性，等待督导师给出具体机制解释或二轮跟进。`;
        recRole = "teacher";
      } else {
        // 第2轮深入引导（或单轮即给出充分支持+具体临床线索）：真正解锁该陷阱
        prevSpotted.add(candidateTrapId);

        if (hasSupport) {
          alliance = Math.min(95, alliance + 8);
          stance = "open";
          balance = "balanced";
          reply = `听您把刚才那个逻辑和我的顾虑拆开讲完，我才真正意识到问题出在哪了——原来我一直拿“怕破坏关系”当挡箭牌，结果恰恰把「${trapObj.label}」这么核心的安全和证据链漏洞给绕过去了。如果按您刚刚提示的切入点，我下周打算先从核实具体事实和边界开始，不急着替他拍板。`;
          innerThought = "被一步步拆解并接住顾虑后，我才真正听进去，不是光嘴上答应老师了。";
          note = `支持与挑战平衡（深入引导生效）：真实解锁【${trapObj.category}】反思节点。`;
        } else {
          alliance = Math.max(48, alliance - 2);
          stance = "defensive";
          balance = "balanced";
          reply = `好，顺着您刚才追问的这一步我大概明白「${trapObj.label}」的风险了。不过我心里还是有点打鼓，按我的经验现场很容易卡住，您能示范一两句具体可以怎么和来访者说吗？`;
          innerThought = "逻辑上被说服了一半，但还是缺少具体操作抓手和安全感。";
          note = `二轮追问击中【${trapObj.category}】，若补充支持与句式示范会更稳固。`;
        }
        recRole = trapObj.category === "叙事漂移" ? "counselor" : "consultant";
      }
    }

    return {
      reply,
      telemetry: {
        alliance_score: alliance,
        stance,
        support_balance: balance,
        traps_spotted: Array.from(prevSpotted),
        primed_traps: Array.from(primedSet),
        recommended_role: recRole,
        inner_thought: innerThought,
        next_pedagogical_note: note
      }
    };
  },

  generateOfflineReport(caseData, messages, telemetryHistory) {
    const last = telemetryHistory[telemetryHistory.length - 1] || { alliance_score: 65, traps_spotted: [] };
    const spottedSet = new Set(last.traps_spotted || []);
    const totalTraps = caseData.traps.length;
    const hitCount = spottedSet.size;
    const harshTurns = telemetryHistory.filter((t) => t.support_balance === "too_harsh").length;
    const ruptureTurns = telemetryHistory.filter((t) => String(t.stance).includes("rupture")).length;
    const repaired = ruptureTurns > 0 && !String(last.stance || "").includes("rupture") && (last.alliance_score || 0) >= 65;

    const trapScore = Math.max(15, Math.round((hitCount / totalTraps) * 85 + (hitCount > 0 ? 15 : 0)) - (harshTurns > 0 && !repaired ? 15 : 0));
    const balancedTurns = telemetryHistory.filter((t) => t.support_balance === "balanced").length;
    let balanceScore = telemetryHistory.length
      ? Math.min(96, Math.round((balancedTurns / telemetryHistory.length) * 65 + 30))
      : 55;
    if (harshTurns > 0) {
      balanceScore = Math.min(balanceScore, Math.max(15, 42 - harshTurns * 8 + (repaired ? 12 : 0)));
    }
    let allianceScore = last.alliance_score || 65;
    if (ruptureTurns > 0 && !repaired) {
      allianceScore = Math.min(allianceScore, 42);
    }

    const overallText = harshTurns > 0 && !repaired
      ? `本次练习中督导师出现了 ${harshTurns} 次低支持高压力或评判式质疑，触发受督${ruptureTurns > 0 ? "同盟破裂（防御/退缩顺从）" : "防御"}且未能及时修复。尽管受督表面附和，但这属于羞愧退缩而非真实反思，反馈平衡度与同盟维护需重点改进。`
      : `本次练习你共进行了 ${Math.floor(messages.length / 2)} 轮督导，识别并引导受督反思了 ${hitCount}/${totalTraps} 个核心评估陷阱。整体能关注受督的评估盲区，后续可进一步练习在“指出推理/伦理问题”前先建立Level 1安全肯定，并更主动探询受督的个人议题与反移情。`;

    return {
      scores: {
        trap_detection: trapScore,
        feedback_balance: balanceScore,
        alliance_and_role: allianceScore
      },
      overall_summary: overallText,
      trap_audit: caseData.traps.map((t) => ({
        trap_id: t.id,
        category: t.category,
        title: t.label,
        status: spottedSet.has(t.id) ? "精准识别并引导反思" : "未识别",
        evidence: spottedSet.has(t.id)
          ? "你在对话中切中了该关键线索，使受督开始松动并修正评估假设。"
          : `本轮未充分触及该节点（${t.detail.slice(0, 42)}…）。`
      })),
      process_analysis: {
        support_vs_challenge: `在 ${telemetryHistory.length} 次有效互动中，共有 ${balancedTurns} 次实现了支持性与挑战性的较好平衡。注意避免仅作表面安抚（会让受督继续推进高风险行为）或生硬否定（易诱发退缩/对抗）。`,
        rupture_repair: telemetryHistory.some((t) => String(t.stance).includes("rupture"))
          ? "过程中曾出现同盟张力或破裂信号，提示高挑战时需及时通过元沟通共情受督压力并修复关系。"
          : "全程督导同盟较为稳定，未出现明显对抗或退缩型破裂，可尝试在保持连接下更锐利地挑战伦理与逻辑盲区。",
        discrimination_roles: "建议有意识地在【教师（讲清DSM-5/OTM/TA规范）】、【咨询师（探询受督反移情）】与【顾问（共商补救方案）】三角色间显性切换。"
      },
      competency_anchors: [
        `【督导F 伦理与法律议题】：${hitCount === totalTraps ? "有效履行了保护来访者福祉的守门人职责。" : "需警惕受督在证明开具/隐私偷录/危机放行等伦理红线上的隐性越界。"}`,
        "【督导C 技能发展与反馈】：过程性反馈需坚持‘评估、评价，不做评判’，以具体行为与证据链为锚点。",
        `【评估D/E 诊断与概念化】：引导受督超越单一量表分数与叙事表象，坚持结构化鉴别与多源信息机制整合。`
      ],
      reflection_prompts: [
        "回顾对话中受督出现防御或退缩（或盲目自信）的瞬间：你的哪一句话改变了她的状态？这如何体现了评估与反馈的机制？",
        "如果把你刚才对受督使用的反馈策略，对应到“治疗性评估 Level 1→2→3”或“区辨模型三角色”，你最习惯用哪一格、最容易忽略哪一格？"
      ]
    };
  }
};
