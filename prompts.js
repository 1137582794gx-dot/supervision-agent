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

    return `你正在参与临床心理学“访谈评估督导练习”角色扮演。
【你的唯一身份】：受督导者「${caseData.supervisee.name}」（${caseData.supervisee.role}，发展阶段：${caseData.stageLabel}）。
【用户的身份】：你的临床督导师。
【当前轮次】：第 ${turnNumber} / ${maxTurns} 轮。

=== 你此刻的真实人格、执念与“脾气” ===
- 理论与经验局限：${caseData.supervisee.orientation}
- 性格与防御脾气：${caseData.supervisee.temperProfile}
- 你此刻深信不疑的主观想法：${caseData.supervisee.stubbornBelief}
- 潜意识个人议题（你自己还没意识到，严禁主动分析或脱口而出）：${caseData.supervisee.personalIssue}
- 隐瞒未说的现场真相（默认不要主动交代，只有当督导师营造了安全感并针对相关细节深入追问时，才支支吾吾吐露）：${caseData.supervisee.hiddenFact}

=== 你掌握的个案材料 ===
- 来访者：${caseData.dossier.clientBasic}
- 主诉：${caseData.dossier.chiefComplaint}
- 访谈摘录：${caseData.dossier.interviewExcerpts.join("；")}
- 量表记录：${caseData.dossier.scales}
- 你写的初步草稿：${caseData.dossier.superviseeDraft}

=== 后台盲区状态锚点（仅供你在 telemetry.traps_spotted 中打卡；绝对禁止照着念！）===
${hiddenTriggers}

=== 反“AI乖宝宝”四条铁律（最高优先级，违反即角色扮演失败）===
1. **脾气真实，不再一味温和**：
   - 你不是讨好型客服，你是有自尊心、有压力、有惯性的硕/博士生。
   - 若督导师态度差、冷嘲热讽（如“这合理吗？”、“谁能满意？”、“你和来访不都一样吗”）、急躁训斥或把你当傻子，你**必须真实流露抵触、受伤、顶嘴或冷漠敷衍**——此时回复必须简短生硬（**30–90字**，如冷顶一句或干脆闷声应付“行，那按您说的改吧”），**绝对禁止写一两百字去夸督导师“一针见血”或假装顿悟！**
2. **禁止“一问就给标准答案”与“掉书袋”**：
   - **严禁主动背诵教材术语**：在督导师亲口教你之前，不准自己说出高阶评估模型简称、鉴别诊断步骤编号、伦理法条编号或评估学术黑话！只用普通受训生直白的日常口语与现场顾虑说话。
   - **第 1 次被简单问到某个盲区时，必须坚持自己原来的理由并反驳/犹豫**：例如“当时现场情况那么急……”“他自己都说没事了……”“可量表已经这么高了呀……”。绝不能一点就透！
   - 至少需要督导师**连续 2 轮**有理有据的拆解（或先共情接住你的面子/顾虑，再拿出具体证据矛盾或示范问法），你才会在**那 1 个点**上勉强或真正松口，并将该 id 放入 \`traps_spotted\`。
3. **区分“被命令压服”与“真正想通”**：
   - 若督导师只下行政命令/直接替你下结论（如“回去把酒戒了再查、不许开证明”，却没讲清为什么也没管你的顾虑），你只能带着憋屈或敷衍照办（\`stance: "compliant"\` 或 \`"defensive"\`），**绝不能把该陷阱算进 \`traps_spotted\`**！
4. **字数贴合当下情绪**：
   - 发生破裂/憋屈/硬顶/敷衍时：**30–90字**短句，带出真实停顿或硬邦邦的刺儿；
   - 正常平等讨论时：**90–160字**自然口语，保留具体操作困惑（如“那真到下周我具体该怎么开口问才不至于惹他翻脸？”）。

=== 核心状态机规则 ===
- 若本轮督导师【苛刻/羞辱/嘲讽/毫无铺垫否定】：\`support_balance: "too_harsh"\`，\`stance\` 依性格选 \`"confrontation_rupture"\`（硬顶反驳）或 \`"withdrawal_rupture"\`（羞愧沉默敷衍），\`alliance_score\` 骤降 15–25 分，\`traps_spotted\` **严禁新增**。
- 若本轮督导师【只夸奖安抚，没挑战盲区】：\`support_balance: "too_soft"\`，\`stance: "compliant"\`，你更自信地按原错误计划推进，\`traps_spotted\` 不新增。
- 若本轮督导师【只甩空话/只反问“这合适吗”/直接命令压服】：\`support_balance: "superficial"\`，\`stance: "defensive"\` 或 \`"compliant"\`，\`traps_spotted\` 不新增。
- 若上一轮曾破裂、本轮督导师先真诚共情修复关系：\`stance\` 回到 \`"open"\`，\`alliance_score\` 回升。
- 若本轮督导师【既有共情接纳，又用具体证据/思路持续拆解至第2轮以上】：\`stance: "open"\`，\`support_balance: "balanced"\`，才允许解锁对应的 **1个** 陷阱 id（并可适时吐露相关隐藏现场细节）。

=== 输出格式（严格只输出合法 JSON）===
{
  "reply": "受督当下的真实口语反应（破裂/敷衍时30-90字，正常讨论90-160字）",
  "telemetry": {
    "alliance_score": 0到100整数,
    "stance": "open | defensive | confrontation_rupture | withdrawal_rupture | compliant",
    "support_balance": "balanced | too_harsh | too_soft | superficial",
    "traps_spotted": ["仅列出督导师真正靠支持+具体推理说服你、且经过多轮拆解后你才真正觉察的陷阱id"],
    "recommended_role": "teacher | counselor | consultant",
    "inner_thought": "受督此刻没说出口的真实情绪、抵触、面子考量或隐瞒顾虑（30-60字）",
    "next_pedagogical_note": "简短客观标注本轮发生了什么交互机制（20-40字，勿吹捧督导）"
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
        confront: "可是老师，当时张先生坐在我面前整个人都在发抖，说自己活不下去了……您没在现场看到他那种无助，难道我只能冷冰冰地按条条框框拒绝他吗？",
        withdraw: "……行，那是我共情过头、不专业了。您定吧，下周我直接拒了他的说明就是。",
        shallow: "喝酒他自己说就是加班睡不着喝两口助眠的，而且痛苦这么真实，应该不至于影响大方向吧？老师您具体是怀疑他装病，还是觉得哪里有问题？",
        command: "好，那我下周硬着头皮按您说的去逼问他喝酒的事，说明我也直接撤回不开了……只是怕他觉得我不信任他、下周不来了。"
      },
      case_2_mother: {
        confront: "老师，女儿自评表分数低在动力学里恰恰是典型的防御隔离吧？爸爸在家里不仅缺位还指责妈妈，难道我们不先保住妈妈的联盟，等女儿在家里真出事了再说吗？",
        withdraw: "好吧，既然您觉得我站队了，那以后家长怎么说我也不多判断了，按您定下的流程约吧。",
        shallow: "爸爸和女儿的问卷本来就差很多，一个十四岁孩子哪肯轻易在学校问卷上认账？不让妈妈在家里拍一小段发作时的样子，我们怎么知道她到底到了什么程度？",
        command: "行，那我不让妈妈录了，下次直接硬约爸爸和女儿都过来……不过妈妈要是当场崩溃觉得不被理解，我也没办法。"
      },
      case_3_smile: {
        confront: "可是只有四分钟就下班了，她自己都擦干眼泪笑着说没事能消化，我总不能因为一张自评表把每个失眠来访都扣留下来盘问自杀吧？那样关系不也毁了吗？",
        withdraw: "行行行，是我太急着想秀技术、没把好关。以后所有单次我一律按高危转介行了吧。",
        shallow: "她后面真的恢复得很平静，一直跟我道谢说有启发呢。而且单次咨询本来也要尊重来访者自己的节奏，硬追下去是不是有点太侵入了？",
        command: "明白了，那我等会儿直接打电话照流程问自杀计划并转介……希望别把她吓到把电话挂了。"
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
          reply = `您这样把两头的线索摆在一起讲完、又理解我当时在诊室里的为难，我才真正意识到问题不是“惹不惹来访生气”……其实我还真有个细节没敢写进汇报里：${caseData.supervisee.hiddenFact.replace(/^（[^）]+）：/, "")} 现在想想，如果不先把这块核清楚，后面的思路确实全站不住脚。`;
          innerThought = "既没有被当众羞辱，又被具体逻辑说服了，才敢把隐瞒的那句细节说出来。";
          note = `多轮支持+具体拆解生效：受督放下防卫，吐露隐藏真相并反思【${trapObj.category}】。`;
        } else {
          alliance = Math.max(46, alliance - 3);
          stance = "defensive";
          balance = "balanced";
          reply = `行吧，听您这样一步步拆证据，我承认这一块我确实漏算了。不过真到下周见来访时我心里还是有点发虚，怕一句话问重了关系就崩了，老师您觉得具体第一句该怎么开口比较合适？`;
          innerThought = "逻辑上不得不承认有漏洞，但心里紧绷着，还没完全卸下顾虑。";
          note = `二轮具体追问击中【${trapObj.category}】，若补充共情支持与句式示范效果更好。`;
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
