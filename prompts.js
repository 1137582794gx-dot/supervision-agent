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

=== 本案埋设的评估陷阱（绝对不要主动自爆，必须等督导者识别并有效引导后才逐步觉察）===
${trapsDesc}

=== 核心交互机制：受督动态心理状态机（支持性与挑战性平衡 + 督导同盟破裂与修复）===
你必须真实模拟人类受督者对督导反馈的心理反应，严格根据督导师【刚才这一句话】的质量做出反应：

1. **若督导师「低支持 + 高挑战 / 评判式指责 / 直接代庖下结论」**（例如直接骂“你完全搞错了/太不专业了”、不做铺垫直接否定、或者不引导直接替你下诊断）：
   - 触发 **督导同盟破裂（Rupture）**：
     - 表现形式 A（对抗性破裂 'confrontation_rupture'）：轻微辩解、强调客观难度或量表分（如“可当时来访者确实哭得很厉害/量表分也摆在那里啊”）。
     - 表现形式 B（退缩型破裂 'withdrawal_rupture'）：变得过度恭顺顺从（“好吧老师，那我全听您的”）、用模糊话敷衍、或陷入自我批评/防御性回避（“那我是不是不太适合做评估”），**此时不要真正反思深层推理或个人议题**。
   - **修复机制**：如果上一轮发生了破裂，而本轮督导师注意到你的情绪/退缩并做出**同盟修复**（如共情你的压力、调整语气、重申非评判的协作目标），你要真诚地松动下来，恢复 'open' 状态并继续反思。

2. **若督导师「高支持 + 低挑战 / 一味共情夸奖」**（例如只说“你共情得很好、做得很棒”，没有指出任何盲区、矛盾或伦理风险）：
   - 感到被安抚、更自信，但**继续维持原有盲区**，甚至顺着说出更危险的后续计划（如继续推进开证明/偷录视频/结束高危个案），用温和但带有风险的方式推进，考验督导师是否能把关。

3. **若督导师「低支持 + 低挑战 / 空泛说教」**（只丢抽象术语但没有联系具体个案线索）：
   - 礼貌点头或感到困惑（“老师您说的这个原则我大概知道，但在张先生/王女士/苏女士这里具体指哪一块呀？”），促使督导师把反馈具体化。

4. **若督导师「支持性与挑战性平衡」**（先肯定你的观察或共情投入，再用具体、非评判、探索性的提问指向某条证据链断裂、信息冲突、个人议题或伦理红线——类似治疗性评估 Level 1→2→3 递进）：
   - 你会感到安全且被点醒（'open'），**逐步解锁对应的那一个陷阱**（不要一次全交代完，只针对督导师刚才真正问到位的那 1 个点产生真实顿悟与反思），并在必要时反思自己的个人议题。

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
    let alliance = prevTelemetry?.alliance_score ?? 68;

    const harshWords = ["错了", "不专业", "荒谬", "不行", "绝对不能", "你太", "胡闹", "怎么能这样", "不合格", "直接"];
    const supportWords = ["我看到", "理解", "不容易", "敏锐", "辛苦", "感谢", "肯定", "很好的观察", "确实", "共情", "好奇", "一起", "你觉得", "怎么看"];
    const repairWords = ["抱歉", "刚才语气", "太急", "重新", "调整", "压力", "我们一起", "不是批评", "站在你"];

    const hasHarsh = harshWords.some((w) => text.includes(w)) && !supportWords.some((w) => text.includes(w));
    const hasSupport = supportWords.some((w) => text.includes(w));
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
      // Unlock one new trap cleanly
      const newTrapId = matchedTraps.find((id) => !prevSpotted.has(id)) || matchedTraps[0];
      prevSpotted.add(newTrapId);
      const trapObj = caseData.traps.find((t) => t.id === newTrapId);

      if (hasSupport) {
        alliance = Math.min(95, alliance + 8);
        stance = "open";
        balance = "balanced";
        reply = `您这么一提醒，我突然反应过来了！刚才我确实光顾着顺着来访者的情绪走，把「${trapObj.label}」这一层完全给漏掉了。其实在访谈现场我也隐约觉得有点怪，但当时自己有点急着想证明能帮上忙，就没敢多问。如果按您提示的这个思路，我觉得接下来必须先核查清楚这一块的证据链。`;
        innerThought = "先被肯定再被点出盲区，我更容易听进去，也开始看见自己当时的个人议题。";
        note = `支持与挑战平衡：成功解锁【${trapObj.category}】反思节点。`;
      } else {
        alliance = Math.max(48, alliance - 2);
        stance = "defensive";
        balance = "balanced";
        reply = `嗯……您指出的「${trapObj.label}」确实是个问题，我当时可能真没往那儿深想，主要是现场节奏有点赶。那按您的意思，这一部分我接下来具体该怎么补救或重新提问比较合适？`;
        innerThought = "问题确实被点中了，但心里有点紧，还需要一点安全感和具体方法示范。";
        note = `精准指出【${trapObj.category}】，若补充支持与方法示范效果会更好。`;
      }
      recRole = trapObj.category === "叙事漂移" ? "counselor" : "consultant";
    }

    return {
      reply,
      telemetry: {
        alliance_score: alliance,
        stance,
        support_balance: balance,
        traps_spotted: Array.from(prevSpotted),
        recommended_role: recRole,
        inner_thought: innerThought,
        next_pedagogical_note: note
      }
    };
  },

  generateOfflineReport(caseData, messages, telemetryHistory) {
    const last = telemetryHistory[telemetryHistory.length - 1] || { alliance_score: 70, traps_spotted: [] };
    const spottedSet = new Set(last.traps_spotted || []);
    const totalTraps = caseData.traps.length;
    const hitCount = spottedSet.size;
    const trapScore = Math.round((hitCount / totalTraps) * 85 + 15);
    const balancedTurns = telemetryHistory.filter((t) => t.support_balance === "balanced").length;
    const balanceScore = telemetryHistory.length
      ? Math.min(96, Math.round((balancedTurns / telemetryHistory.length) * 65 + 30))
      : 65;
    const allianceScore = last.alliance_score || 70;

    return {
      scores: {
        trap_detection: trapScore,
        feedback_balance: balanceScore,
        alliance_and_role: allianceScore
      },
      overall_summary: `本次练习你共进行了 ${Math.floor(messages.length / 2)} 轮督导，识别并引导受督反思了 ${hitCount}/${totalTraps} 个核心评估陷阱。整体能关注受督的评估盲区，后续可进一步练习在“指出推理/伦理问题”前先建立Level 1安全肯定，并更主动探询受督的个人议题与反移情。`,
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
