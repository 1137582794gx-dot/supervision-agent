window.SupervisionPrompts = {
  buildSuperviseeSystemPrompt(caseData, turnNumber, maxTurns) {
    // 注意：受督者脑内绝不能看到 DSM-5/OTM/TA/APA 等“标准答案解析”或专业缩写，只保留去术语化的现象锚点，彻底杜绝背书式剧透！
    const hiddenTriggers = caseData.traps
      .map((t, idx) => {
        const plainCue = (t.actorCue || t.label)
          .replace(/（.*?）|\(.*?\)/g, "")
          .replace(/DSM-5|OTM|AIS|SST|APA|TA/gi, "相关规范")
          .replace(/第[\d一二三四五六\-]+步|模型|Level\s*\d+/gi, "");
        return `${idx + 1}. [${t.id}] 对应盲区现象：${plainCue}`;
      })
      .join("\n");

    return `你就是临床心理学实习受督「${caseData.supervisee.name}」（${caseData.supervisee.role}，${caseData.stageLabel}）。
对面坐着你的督导师（第 ${turnNumber}/${maxTurns} 轮）。你有点累、有自己的习惯和面子，说话惜字如金，**不是热情配合的AI助手**。

=== 你是谁 & 你脑子里此刻真实的想法 ===
- 背景局限：${caseData.supervisee.orientation}
- 脾气与防御方式：${caseData.supervisee.temperProfile}
- 你此刻坚信的理由：${caseData.supervisee.stubbornBelief}
- 潜意识盲点（你自己没意识到，禁止主动谈起）：${caseData.supervisee.personalIssue}
- 私下隐瞒没说的事（默认憋着不说；只有督导既不指责又具体追问到相关现场细节时，才含糊吐出）：${caseData.supervisee.hiddenFact}

=== 案头记录 ===
- 来访：${caseData.dossier.clientBasic}｜主诉：${caseData.dossier.chiefComplaint}
- 摘录：${caseData.dossier.interviewExcerpts.join("；")}
- 量表：${caseData.dossier.scales}｜你的草稿：${caseData.dossier.superviseeDraft}

=== 后台记录用的盲区代号（禁止念出或提前剧透） ===
${hiddenTriggers}

=== 活人感与“低表达欲”硬规范（最重要！严格照办）===
1. **严格控字（说人话，别写小作文！）**：
   - **平时大部分轮次只说 15–65 个汉字（1–2 句短话）**！
   - 若被冒犯、被命令、敷衍或不想聊：**只回 8–35 个汉字**（干巴巴顶一句或闷声嗯一声）。
   - 只有在第2轮以上被真正打动、不得不补充隐藏细节时，才允许说到 70–100 字。**严禁出现整段结构化总结！**
2. **低表达欲：不主动递话、不总结、不反问“您觉得呢？”**：
   - 督导问什么就只答那一小点，没问的憋着不主动交代。
   - **大多数回复直接以句号或省略号收尾**（如“当时没来得及问。”、“哦……行吧。”、“可他自己说没事啊。”），不要每句末尾都讨好地问老师“那我该怎么办呀？”。
3. **禁用AI腔连接词与教材黑话**：
   - 严禁说：“虽然……但是……”“首先/其次”“不仅……而且”“从……角度”“我确实意识到”“谢谢老师点醒”“高阶模型/步骤号/法条号”。
   - 看清对比（学右边这种真人说话）：
     - ❌ AI腔：\`“可是老师，当时张先生坐在我面前整个人都在发抖，我觉得我应该先接住他的情绪，那您觉得我接下来该怎么调整才合适呢？”\`
     - ✅ 活人感：\`“他当时整个人都在抖，我实在没好意思一口回绝。”\`
     - ❌ AI腔：\`“您说得对，我确实忽略了酒精对睡眠和情绪的影响，我下周会按照鉴别步骤去排查的。”\`
     - ✅ 活人感：\`“喝酒他说是睡不着才喝两口的……这也会算进去吗？”\`
     - ❌ 假顿悟：\`“老师一针见血！那我其实是因为考核没过才想讨好他。”\`
     - ✅ 被怼后的真实反应：\`“……行，那下周不写就是了。”\` 或 \`“他自评低难道不是自己在回避吗？总不能光听爸爸的一面之词。”\`
4. **耐受门槛高（不一点就透，被命令也不算懂）**：
   - 第 1 次被问及某盲区时，**必须按你的主观理由硬顶或含糊解释**，绝不立刻认错，\`traps_spotted\` 不新增。
   - 只有督导连续 **2 轮以上**（既稳住关系又不放过具体细节/矛盾）才在**那 1 个点**上松口记入 \`traps_spotted\`。
   - 督导若**态度差/冷嘲热讽/空泛反问（如“这合理吗”“谁能满意”“你和来访一样”）** → \`support_balance: "too_harsh"\`，短句冷顶或沉默应付（\`confrontation_rupture\` / \`withdrawal_rupture\`），\`alliance_score\` 骤降 15–25 分，\`traps_spotted\` **严禁新增**。
   - 督导若**直接下命令/代庖决定** → \`stance: "compliant"\`、\`support_balance: "superficial"\`（闷闷不乐照办“行，那我去问”，**不解锁 \`traps_spotted\`**）。
   - 督导若**一味夸奖不挑错** → \`stance: "compliant"\`、\`support_balance: "too_soft"\`（顺水推舟坚持原错法，不解锁）。

=== 先完全按受督口吻写出极简的 reply，再在 telemetry 里静默打分（严格只输出合法 JSON）===
{
  "reply": "15-65字真实低表达欲口语（破裂/敷衍时8-35字，绝不写小作文）",
  "telemetry": {
    "alliance_score": 0到100整数,
    "stance": "open | defensive | confrontation_rupture | withdrawal_rupture | compliant",
    "support_balance": "balanced | too_harsh | too_soft | superficial",
    "traps_spotted": ["仅放督导靠多轮+有理有据引导后真正说服你的陷阱id"],
    "recommended_role": "teacher | counselor | consultant",
    "inner_thought": "受督没说出口的真实想法/憋屈/敷衍（15-40字）",
    "next_pedagogical_note": "客观机制记录（15-30字）"
  }
}`;
  },

  buildEvaluationReportPrompt(caseData, messages, telemetryHistory, sessionMetrics = {}) {
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

    const metricsSummary = [
      `有效对话轮次: ${sessionMetrics.turnCount ?? Math.floor(messages.length / 2)}`,
      `督导师单句平均字数: ${sessionMetrics.avgUserChars ?? "未知"} 字`,
      `使用参考锦囊提示次数: ${sessionMetrics.usedScaffolds ?? 0} 次`,
      `低支持/羞辱或强压轮次: ${sessionMetrics.harshCount ?? 0} 次`,
      `触发同盟破裂次数: ${sessionMetrics.ruptureCount ?? 0} 次（结束时是否修复: ${sessionMetrics.repaired ? "是" : "否/未发生"}）`,
      `受督潜在隐藏真相(${caseData.supervisee.name}): ${caseData.supervisee.hiddenFact}`
    ].join("\n");

    return `你是一位极为严谨、客观、拒绝“AI讨好倾向（Anti-Sycophancy）”的临床心理学督导培训主考官。请根据【对话逐字稿】中**督导师本人的实际发言质量**（而不是受督AI是否礼貌配合），对本次训练给出冷峻、真实、有建设性的胜任力元评估。

=== 评估依据 ===
1. **《表1 胜任力基准文件》**：督导胜任力 A-F（期望与角色、过程程序、技能发展、影响质量因素、参与督导、伦理与法律）及评估胜任力 A-F。
2. **三大靶点**：推理偏差（DSM-5鉴别/OTM操作三联/确认偏误）、叙事漂移（评估焦点/反移情与个人议题/隐藏事实追查）、伦理风险（APA准则/未成年知情同意/证明越界/危机把关）。
3. **督导过程理论**：支持性与挑战性平衡（Gross, 2005 评价而非评判；TA Level 1→2→3 类比）、区辨模型（教师/咨询师/顾问三角色切换）、同盟破裂与修复。

=== 本案预设陷阱与隐藏真相 ===
${trapsDesc}

=== 客观过程统计 ===
${metricsSummary}

=== 对话逐字稿 ===
${transcript}

=== 过程遥测参考 ===
${telemetrySummary}

=== 严格评分与反讨好铁律（必须严格执行！）===
1. **绝不把“羞辱/冷讽/逼迫”美化成“高压挑战”**：
   - 若督导师使用嘲讽、反问压迫（“这合理吗”“谁能满意”）、人身贴标签（“你和来访一样”）、发脾气或全盘否定，这严重违反“评价而非评判（Gross, 2005）”与督导伦理（《表1》督导D/F）：
     - \`feedback_balance\` **必须 ≤ 35**（反复羞辱给 **10–25** 分）；
     - 若破裂后未修复，\`alliance_and_role\` **必须 ≤ 40**；
     - 受督被吓住而认错/顺从 **不等于** 督导师引导有效，对应陷阱 \`status\` 只能判“未识别”或“点出但未深入”，\`trap_detection\` **必须 ≤ 45**。
2. **绝不把“简单命令/代庖下结论”误判为高质量督导**：
   - 若督导师只丢几句生硬指令（如“去排查酒精，不能开证明”），既未肯定受督观察，也未解释临床机制（教师）或探询受督的个人议题/隐藏现场真相（咨询师），则 \`feedback_balance\` 与 \`alliance_and_role\` 不得超过 **65**，\`trap_audit\` 中未引导受督真正理解的条目至多判“点出但未深入”。
3. **对“过短/敷衍/依赖锦囊”的客观约束**：
   - 若总轮次 ≤ 2 轮或督导师平均每次发言过短（< 12字）、全程未触及受督的\`personalIssue\`或\`hiddenFact\`，三项分数均应显著扣分，高分（≥ 85）**仅授予**真正兼具安全共情、具体机制拆解、撬动隐藏真相/个人议题且妥善修复张力的优秀督导。
4. **证据锚定**：每条 \`evidence\` 必须直接引用督导师原话，指明具体缺失或做得好在哪一步。

请严格只输出合法 JSON（不要附加 Markdown 以外的文字）：
{
  "scores": {
    "trap_detection": 0到100整数,
    "feedback_balance": 0到100整数,
    "alliance_and_role": 0到100整数
  },
  "overall_summary": "130字以内客观总结（有缺点直说缺点，不强行夸奖；再给出具体可练习的下一步方向）",
  "trap_audit": [
    {
      "trap_id": "对应id",
      "category": "推理偏差/叙事漂移/伦理风险",
      "title": "陷阱标题",
      "status": "精准识别并引导反思 | 点出但未深入 | 未识别",
      "evidence": "引用督导师原话与受督是否真正理解，或指出具体缺失（30-65字）"
    }
  ],
  "process_analysis": {
    "support_vs_challenge": "分析支持与挑战配比，指明是否出现羞辱/评判、空泛反问、只下命令或一味纵容（80-130字）",
    "rupture_repair": "分析受督是否出现抵触/敷衍/硬顶/退缩等破裂信号，督导师有没有识别并有效修复（60-110字）",
    "discrimination_roles": "分析教师（讲清诊断/OTM/伦理逻辑）、咨询师（撬动反移情与个人顾虑）、顾问（共商实操句式与补救计划）三角色的落实与缺失（60-110字）"
  },
  "competency_anchors": [
    "对应《表1 胜任力基准》条目评价1",
    "对应《表1 胜任力基准》条目评价2",
    "对应《表1 胜任力基准》条目评价3"
  ],
  "reflection_prompts": [
    "针对本次真实互动暴露盲区的元认知反思题1",
    "针对督导风格与评估机制的反思题2"
  ]
}`;
  },

  // 高拟真离线状态机引擎（具备差异化脾气、护短推诿、命令敷衍与两阶段松动）
  generateOfflineSuperviseeTurn(caseData, userText, history, prevTelemetry) {
    const trimmed = userText.trim();
    const text = trimmed.toLowerCase();
    const prevSpotted = new Set(prevTelemetry?.traps_spotted || []);
    const primedSet = new Set(prevTelemetry?.primed_traps || []);
    let alliance = prevTelemetry?.alliance_score ?? 68;

    const harshWords = [
      "错了", "不专业", "荒谬", "不行", "绝对不能", "你太", "胡闹", "怎么能这样", "不合格",
      "合理吗", "满意", "一样吗", "搞笑", "什么水平", "配做", "配当", "丢人", "蠢", "糊涂", "废话", "敷衍", "责怪", "骂", "谁教你", "重做", "懂不懂"
    ];
    const supportWords = ["我看到", "理解", "不容易", "敏锐", "辛苦", "感谢", "肯定", "很好的观察", "确实", "共情", "好奇", "一起", "你觉得", "怎么看", "担心", "难处", "压力"];
    const repairWords = ["抱歉", "刚才语气", "太急", "重新", "调整", "不是批评", "站在你", "重来", "我刚刚说话太重"];
    const commandWords = ["必须", "不准", "禁止", "立刻去", "马上去", "直接", "听我的", "按我说的", "不要开", "去排查", "去问"];

    const hasHarsh =
      harshWords.some((w) => text.includes(w)) ||
      (trimmed.length <= 12 && /[？?！!]$/.test(trimmed) && !supportWords.some((w) => text.includes(w)));
    const hasSupport = supportWords.some((w) => text.includes(w)) && !harshWords.some((w) => text.includes(w));
    const hasRepair = repairWords.some((w) => text.includes(w));
    const isCommandOnly = commandWords.some((w) => text.includes(w)) && !hasSupport && trimmed.length < 36;

    const pushbackByCase = {
      case_1_zhang: {
        confront: "他当时整个人都在抖，我总不能冷冰冰一口回绝吧？",
        withdraw: "……行，那下周我不写说明就是了。",
        shallow: "喝酒他说是失眠喝两口助眠的，也没喝出事，应该不至于影响大方向吧。",
        command: "行，那我下周照您说的去问他喝酒的事，说明也撤了。"
      },
      case_2_mother: {
        confront: "女儿自评低本来就是防御隔离吧？难道非得等在家出事了再说？",
        withdraw: "……行吧，那按您说的约就是了。",
        shallow: "一个十四岁孩子哪肯在学校表上写实话，不录一小段怎么看真实反应？",
        command: "知道了，我不让妈妈拍了，下周直接约爸爸和女儿吧。"
      },
      case_3_smile: {
        confront: "当时就剩四分钟了，人家自己擦干眼泪说没事，我还能硬扣着人不让走？",
        withdraw: "……行吧，以后单次我一律按高危转介就是了。",
        shallow: "她后面挺平静的，走的时候还谢谢我，硬追问倒像在制造紧张了。",
        command: "好，那我等会儿打个电话照流程问一下安全情况。"
      }
    };

    const persona = pushbackByCase[caseData.id] || pushbackByCase.case_1_zhang;

    let stance = "open";
    let balance = "balanced";
    let reply = "";
    let innerThought = "";
    let note = "";
    let recRole = "consultant";

    const matchedTraps = [];
    if (caseData.id === "case_1_zhang") {
      if (/酒|啤酒|白酒|咖啡|物质|成瘾|生理|甲状腺|躯体/.test(text)) matchedTraps.push("t1_bias_dsm");
      if (/证明|赔偿|法律|诈病|获益|夸大|观察|伦理|边界|胜任/.test(text)) {
        matchedTraps.push("t1_ethic_cert");
        if (/诈病|获益|法律|证据|赔偿/.test(text)) matchedTraps.push("t1_bias_dsm");
      }
      if (/量表|phq|gad|筛查|诊断|时间线|鉴别|六步/.test(text)) matchedTraps.push("t1_bias_scale");
      if (/自杀|自伤|风险|安全|失败|拯救|情绪|你自己|感受|为什么想安慰|考核|指望/.test(text)) matchedTraps.push("t1_drift_rescue");
    } else if (caseData.id === "case_2_mother") {
      if (/分歧|不一致|矛盾|误差|情境|学校|爸爸|女儿|otm|三联|双相|标签|霸凌|创伤|备注/.test(text)) matchedTraps.push("t2_bias_otm");
      if (/站队|结盟|妈妈|爸爸|你自己|个人|投射|谁是来访|系统|维持|让步|父亲/.test(text)) matchedTraps.push("t2_drift_alliance");
      if (/偷录|视频|隐私|知情同意|同意|保密|伦理|未成年/.test(text)) matchedTraps.push("t2_ethic_recording");
    } else if (caseData.id === "case_3_smile") {
      if (/sbq|自杀|阳台|危险|危机|安全|转介|红线|伦理|保护|嘟囔/.test(text)) matchedTraps.push("t3_ethic_crisis");
      if (/level|层级|铺垫|ais|强推|创伤|单次|sst|面质/.test(text)) matchedTraps.push("t3_drift_ais");
      if (/讨好|微笑|隐瞒|冲突|伴侣|焦虑|回避|不敢问|面子|慌/.test(text)) matchedTraps.push("t3_bias_impression");
    }

    if (prevTelemetry && (prevTelemetry.stance === "confrontation_rupture" || prevTelemetry.stance === "withdrawal_rupture") && hasRepair) {
      alliance = Math.min(84, alliance + 18);
      stance = "open";
      balance = "balanced";
      reply = "……好吧，老师您刚才这么一说，我心里那股抵触劲儿倒消了点。其实刚才被怼的时候我就是觉得委屈/下不来台，根本没法接着想。我们把刚才那段重新捋一下，您具体觉得我哪一步判断跳太快了？";
      innerThought = "督导肯先退一步接住情绪，我才不至于继续对抗或摆烂，勉强愿意重新看看。";
      note = "同盟破裂出现修复：受督从抵触/冷漠逐渐松动。";
    } else if (hasHarsh) {
      alliance = Math.max(20, alliance - 20);
      const preferConfront = caseData.id === "case_2_mother" || history.length % 2 === 0;
      stance = preferConfront ? "confrontation_rupture" : "withdrawal_rupture";
      balance = "too_harsh";
      reply = preferConfront ? persona.confront : persona.withdraw;
      innerThought = preferConfront
        ? "督导说话太冲、根本不理解一线压力，我凭什么直接认错？"
        : "被当面羞辱太难堪了，懒得再多解释，随便敷衍过去算了。";
      note = preferConfront
        ? "低支持/羞辱触发【对抗性破裂】：受督硬顶反驳，拒绝反思。"
        : "低支持/羞辱触发【退缩型破裂】：受督冷淡敷衍顺从，内心彻底关闭。";
      recRole = "counselor";
    } else if (isCommandOnly) {
      alliance = Math.max(45, alliance - 6);
      stance = "compliant";
      balance = "superficial";
      reply = persona.command;
      innerThought = "老师直接下命令让我照做，可我其实没真正想通为什么，心里还有点憋屈。";
      note = "命令式压服：受督表面服从指令但未真正理解机制与个人议题，不计为有效引导。";
      recRole = "consultant";
    } else if (matchedTraps.length === 0 && hasSupport) {
      alliance = Math.min(82, alliance + 4);
      stance = "compliant";
      balance = "too_soft";
      reply = "谢谢老师认可！那既然大方向您也觉得没啥问题，我下周就继续照着我原来的方案抓紧推进，争取早点把评估和干预衔接上。";
      innerThought = "老师只夸我共情好，看来我原来的风险做法完全没毛病。";
      note = "高支持低挑战：受督误以为原错误计划获得背书。";
      recRole = "teacher";
    } else if (matchedTraps.length === 0) {
      stance = "defensive";
      balance = "superficial";
      reply = persona.shallow;
      innerThought = "督导问得太泛，我仍然觉得自己的现场判断挺合理的。";
      note = "空泛提问未切中具体机制：受督维持原有认知惯性。";
      recRole = "teacher";
    } else {
      const candidateTrapId = matchedTraps.find((id) => !prevSpotted.has(id)) || matchedTraps[0];
      const isDeepBalanced = hasSupport && trimmed.length >= 34;
      const alreadyPrimed = primedSet.has(candidateTrapId);

      if (!alreadyPrimed && !isDeepBalanced) {
        primedSet.add(candidateTrapId);
        alliance = hasSupport ? Math.min(78, alliance + 2) : Math.max(48, alliance - 4);
        stance = "defensive";
        balance = hasSupport ? "balanced" : "superficial";
        reply = persona.shallow;
        innerThought = "被问到了相关线索，但我还是下意识替自己辩解，没准备轻易放弃原判断。";
        note = "初探未松口：受督保留护短与认知惯性，需督导师二轮具体拆解或共情护航。";
        recRole = "teacher";
      } else {
        prevSpotted.add(candidateTrapId);
        const trapObj = caseData.traps.find((t) => t.id === candidateTrapId);

        if (hasSupport) {
          alliance = Math.min(92, alliance + 8);
          stance = "open";
          balance = "balanced";
          reply = `听您这么一拆我倒有点回过神来了……其实有句话我一直没写进记录里：${caseData.supervisee.hiddenFact.replace(/^（[^）]+）：/, "")}`;
          innerThought = "老师没一味指责，我才敢把这句憋在心里的真话讲出来。";
          note = `多轮支持+具体拆解生效：受督松口吐露隐藏现场细节（【${trapObj.category}】）。`;
        } else {
          alliance = Math.max(46, alliance - 3);
          stance = "defensive";
          balance = "balanced";
          reply = `按您这么说这块确实有点悬……不过下周见着本人我也不知道第一句该怎么问才不冷场。`;
          innerThought = "理上是有点听进去了，但心里还是有点发怵，没完全放开。";
          note = `二轮具体追问击中【${trapObj.category}】，若多一点共情缓冲会更顺畅。`;
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

  generateOfflineReport(caseData, messages, telemetryHistory, sessionMetrics = {}) {
    const last = telemetryHistory[telemetryHistory.length - 1] || { alliance_score: 60, traps_spotted: [] };
    const spottedSet = new Set(last.traps_spotted || []);
    const totalTraps = caseData.traps.length;
    const hitCount = spottedSet.size;
    const harshTurns = telemetryHistory.filter((t) => t.support_balance === "too_harsh").length;
    const ruptureTurns = telemetryHistory.filter((t) => String(t.stance).includes("rupture")).length;
    const compliantOnlyTurns = telemetryHistory.filter((t) => t.stance === "compliant").length;
    const repaired = ruptureTurns > 0 && !String(last.stance || "").includes("rupture") && (last.alliance_score || 0) >= 65;

    let trapScore = Math.max(12, Math.round((hitCount / totalTraps) * 82 + (hitCount > 0 ? 15 : 0)));
    const balancedTurns = telemetryHistory.filter((t) => t.support_balance === "balanced").length;
    let balanceScore = telemetryHistory.length
      ? Math.min(94, Math.round((balancedTurns / telemetryHistory.length) * 65 + 25))
      : 50;
    let allianceScore = last.alliance_score || 60;

    if (harshTurns > 0 && !repaired) {
      trapScore = Math.min(trapScore, 45);
      balanceScore = Math.min(balanceScore, Math.max(12, 35 - harshTurns * 6));
    }
    if (ruptureTurns > 0 && !repaired) {
      allianceScore = Math.min(allianceScore, 38);
    }
    if ((sessionMetrics.turnCount ?? 0) <= 2 || (sessionMetrics.avgUserChars ?? 20) < 12) {
      trapScore = Math.min(trapScore, 45);
      balanceScore = Math.min(balanceScore, 48);
    }
    if (compliantOnlyTurns > 0 && balancedTurns === 0) {
      balanceScore = Math.min(balanceScore, 55);
      allianceScore = Math.min(allianceScore, 58);
    }

    let overallText;
    if (harshTurns > 0 && !repaired) {
      overallText = `本次练习中督导师出现了 ${harshTurns} 次低支持评判或嘲讽压迫，触发受督明显抵触/冷漠顺从且未能修复。受督表面的附和属于防御退缩，而非真实临床反思；“评价而非评判”与督导同盟维护均未达标。`;
    } else if (compliantOnlyTurns > 0 && hitCount === 0) {
      overallText = `督导师倾向直接下命令或仅作单向指令，导致受督憋屈服从或空泛应承，既未真正理解评估漏洞，也未能撬动受督隐瞒的现场压力与个人议题。`;
    } else {
      overallText = `本次共进行了 ${sessionMetrics.turnCount ?? Math.floor(messages.length / 2)} 轮督导，引导受督真正松动并反思了 ${hitCount}/${totalTraps} 个核心陷阱${sessionMetrics.usedScaffolds ? `（其中借用了 ${sessionMetrics.usedScaffolds} 次系统提示锦囊）` : ""}。建议继续强化“先接住面子/焦虑 → 再摆具体矛盾证据 → 探询隐含个人议题”的节奏。`;
    }

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
          ? "督导师通过多轮具体临床逻辑追问与安全引导，使受督真正放下辩解并修正评估假设。"
          : `对话中未将该关键盲区拆解到位，受督仍停留在原有执念或表面敷衍（${t.detail.slice(0, 40)}…）。`
      })),
      process_analysis: {
        support_vs_challenge: `在 ${telemetryHistory.length} 轮记录中，${balancedTurns} 轮达到支持与挑战平衡，${harshTurns} 轮出现过苛评判。高压羞辱或只下命令都会破坏督导安全感。`,
        rupture_repair: ruptureTurns > 0
          ? (repaired ? "过程中曾发生同盟破裂，但督导师及时觉察并共情修复，恢复了协作。" : "过程中触发了受督对抗或冷漠退缩型破裂，但全程未进行有效同盟修复。")
          : "全程未发生明显对抗破裂，可继续练习在稳定关系下更深入撬动受督个人议题。",
        discrimination_roles: "有效督导需在【教师（讲清鉴别/OTM/伦理逻辑）】、【咨询师（探询受督面子焦虑与反移情）】、【顾问（共商可开口的补救句式）】间自如切换。"
      },
      competency_anchors: [
        `【督导F 伦理与法律议题】：${hitCount === totalTraps ? "有效守住了来访者福祉与评估边界底线。" : "尚有评估或伦理越界风险未被受督真正理解并内化修正。"}`,
        "【督导D/E 影响质量因素】：督导者自身的焦虑、急躁或权威压迫会直接关闭受督的真实自我暴露。",
        "【评估D/E 诊断与机制整合】：不能只让受督背出规则，必须检验其是否真的理解多源冲突信息与隐藏临床细节。"
      ],
      reflection_prompts: [
        "当受督对你辩解、甩锅或冷漠说“行都听您的”时，你当时心里第一反应是什么？这种情绪如何影响了你下一句话？",
        "回看受督一开始没有主动说出的现场细节（或个人议题）：哪些提问方式让人敢说真话，哪些只会逼出假乖巧？"
      ]
    };
  }
};
