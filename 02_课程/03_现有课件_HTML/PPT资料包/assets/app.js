(function(){
  const byCode=Object.fromEntries(CURRICULUM.modules.map(x=>[x.code,x]));
  const frameworkByPackage={
    G0:{muscles:'判断肌、主见肌',baseline:'学生先辨认真实来源、关系与可能受影响的人，再决定能否使用 AI。',ai:'用 AI 辅助整理规则、比较案例或检查遗漏；关键责任判断必须由学生说明。'},
    G1:{muscles:'理解肌、判断肌、表达肌',baseline:'学生先说清自己的任务、已有信息与不确定处。',ai:'用 AI 获取解释、工具选项和备选说法，再核验并修正。'},
    G2:{muscles:'专注肌、理解肌、判断肌、表达肌',baseline:'学生先独立阅读、作答或形成原始思路，保留卡点。',ai:'让 AI 提供追问、反馈、变式或资料支持，不把答案与观点直接外包。'},
    G3:{muscles:'专注肌、表达肌、创造肌',baseline:'学生先画出当前手工流程、目标与风险，再判断是否值得组织或自动化。',ai:'用 AI 协助整理、规划和执行；必须保留人工检查点、异常处理与接管责任。'},
    G4:{muscles:'表达肌、主见肌、创造肌',baseline:'学生先从真实经历、证据和个人选择中形成自己的叙事。',ai:'用 AI 获取结构与反馈；不让 AI 代替经历、观点、署名或对外承诺。'},
    G5:{muscles:'理解肌、判断肌、主见肌、创造肌',baseline:'学生先观察真实场景、提出初步问题并界定不做什么。',ai:'用 AI 支持资料整理、方案比较和原型；问题选择、证据判断与风险边界由学生负责。'},
    A1:{muscles:'创造肌、表达肌、判断肌、主见肌',baseline:'学生先明确对象、核心价值、最小范围与验收标准。',ai:'用 AI 加速原型、调试和表达；学生必须解释逻辑、测试反馈、局限和下一步。'},
    A2:{muscles:'创造肌、判断肌、表达肌、主见肌',baseline:'学生先接触真实对象、收集证据并明确产品范围与责任。',ai:'用 AI 加速研究、原型和工程实现；学生必须维护数据、权限、测试与发布边界。'},
    A3:{muscles:'创造肌、判断肌、专注肌、表达肌',baseline:'学生先理解系统结构、风险与维护责任，再决定技术方案。',ai:'用 AI 辅助编码、调试与文档；关键架构、安全、测试和上线决定必须可解释、可复查。'},
    P1:{muscles:'理解肌、判断肌、表达肌、主见肌',baseline:'学生先形成研究问题、材料范围、方法与伦理边界。',ai:'用 AI 辅助检索、整理、分析与表达；结论必须回到原始材料、数据和研究限制。'},
    P2:{muscles:'理解肌、判断肌、专注肌、创造肌',baseline:'学生先掌握必要数学、代码与实验逻辑，保留可复现过程。',ai:'用 AI 辅助解释、编码和调试；模型选择、评测和实验结论必须由学生复核。'},
    P3:{muscles:'判断肌、主见肌、创造肌、专注肌',baseline:'学生先建立可复现基线、研究假设与风险意识。',ai:'用 AI 加速研究和工程工作；改进论证、安全治理与长期方向选择必须由学生负责。'}
  };
  const implementationByPackage={
    G0:{camp:'阶段 0｜使用边界，且贯穿整个 AI 营。学生完成来源、披露与 AI 使用边界表；涉及敏感数据或高风险主题时加入 G0-4。',one:'共同底线｜先判断资料、数据、对象与风险；不以“能做出来”替代责任边界。'},
    G1:{camp:'阶段 1—2｜建立 AI 认知与工具地图。学生要留下输入—模型—输出—核验图，以及任务—工具—风险卡。',one:'建模与核验补给｜当项目涉及资料、模型、自动化或工具选择时使用，帮助学生区分事实、假设与模拟。'},
    G2:{camp:'按需嵌入｜当营地项目需要读资料、理解概念或形成独立观点时补入；不是所有短营的必修包。',one:'学习补给｜把已有阅读、学科材料或卡点转为“先理解、再请 AI 追问或反馈”的学习过程。'},
    G3:{camp:'按需嵌入｜用于小组分工、资料整理与反馈记录；不能只做工具自动化展示。',one:'过程与协作补给｜当项目有访谈、版本、多人协作或持续任务时，用来保存证据、决定与接管规则。'},
    G4:{camp:'阶段 3 与 6｜从兴趣／观察形成问题来源，并在展示时说明过程、局限与下一步。',one:'兴趣诊断与长期叙事｜将经历、材料、受众和项目发展记录成可持续的个人表达，而非包装履历。'},
    G5:{camp:'阶段 3—4｜把兴趣或观察收缩为可验证问题，选择媒介，定义最小机制、验收标准与“不做什么”。',one:'项目设计核心｜从“我想做一个功能”转为“谁在何处遇到什么问题”，并按证据决定继续、转向或停止。'},
    A1:{camp:'阶段 4—6｜完成能证明核心体验的最小 Demo，保留原型、素材、调试、测试、局限与展示证据。',one:'项目原型补给｜当学生已有真实问题和明确媒介后进入；Demo 不等于可向真实用户承诺的产品。'},
    A2:{camp:'不作为短营默认内容｜只有出现小范围真实试用、账户、数据或持续维护需求时，才在营后评估进入。',one:'轻量产品路径｜有少量真实用户、持续投入与责任准备后进入；重点是访谈、测试、权限、发布边界和维护。'},
    A3:{camp:'不纳入短营｜不把软件工程压缩为一次体验课。',one:'长期工程路径｜在 A2 的真实使用与边界验证后，按系统维护、安全、测试、部署和协作缺口选择进入。'}
  };
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const slides=(m,session)=>[
    ["PPT 1",`情境引入：${session.open}`],
    ["PPT 2",`今天要解决：${session.goal}`],
    ["PPT 3",`关键说明：${session.explain}`],
    ["PPT 4",`案例拆解：${m.case}`],
    ["PPT 5",`学生活动：${session.activity}`],
    ["PPT 6",`回收与迁移：${session.close}`]
  ];
  function implementationCard(p){const route=implementationByPackage[p.id];if(!route)return '';return `<div class="implementation"><strong>AI 营中的位置</strong><span>${esc(route.camp)}</span><strong>一对一中的位置</strong><span>${esc(route.one)}</span></div>`;}
  function renderIndex(){const root=document.querySelector('#package-list');const gAndA=CURRICULUM.packages.filter(p=>implementationByPackage[p.id]);if(gAndA.length)root.insertAdjacentHTML('beforeend',`<section class="route-overview"><h2>先按实施路径调用课程，而非要求所有学生按目录学完</h2><div><strong>AI 营</strong><span>G0（贯穿）→ G1 → G4-1／G5 → A1；完成第一次有问题定义、测试证据与局限说明的 Demo。</span></div><div><strong>一对一</strong><span>先形成兴趣证据与项目建议卡，再按缺口调用 G/A；只有出现真实用户、长期维护或系统复杂度时才进入 A2／A3。</span></div></section>`); CURRICULUM.packages.forEach(p=>{const mods=CURRICULUM.modules.filter(m=>m.package===p.id);root.insertAdjacentHTML('beforeend',`<section class="package"><h2>${esc(p.name)}</h2><p>${esc(p.description)} · ${esc(p.total)}</p><div class="package-plan"><strong>课包结业：</strong>${esc(p.outcome)}<br><strong>建议顺序：</strong>${esc(p.sequence)}</div>${implementationCard(p)}<div class="grid">${mods.map(m=>`<a class="module-card" href="module.html?code=${m.code}"><div class="code">${m.code}</div><h3>${esc(m.title)}</h3><div class="muted">建议 ${m.time}｜${m.sessions.length} 个 L</div></a>`).join('')}</div></section>`);});}
  function renderModule(){const code=document.body.dataset.module||new URLSearchParams(location.search).get('code');const m=byCode[code];if(!m)return;const f=frameworkByPackage[m.package],route=implementationByPackage[m.package];document.title=`${m.code}｜${m.title}｜LKFJ`;const root=document.querySelector('#module');root.innerHTML=`<a class="crumb" href="index.html">← 返回课程包总览</a><header class="module-head"><p class="eyebrow">${esc(CURRICULUM.packages.find(p=>p.id===m.package).name)}</p><h1>${m.code}｜${esc(m.title)}</h1><div class="tags"><span class="tag">建议课堂：${m.time}</span><span class="tag">建议 ${m.sessions.length} 个 L</span><span class="tag">${esc(m.delivery)}</span></div></header><section class="framework"><div><strong>本模块重点练习</strong><span>${esc(f.muscles)}</span></div><div><strong>人类基线</strong><span>${esc(f.baseline)}</span></div><div><strong>AI 协作边界</strong><span>${esc(f.ai)}</span></div></section>${route?`<section class="implementation module-implementation"><div><strong>AI 营中的位置</strong><span>${esc(route.camp)}</span></div><div><strong>一对一中的位置</strong><span>${esc(route.one)}</span></div></section>`:''}<section class="overview"><div class="meta"><h2>模块要达成什么</h2><p>${esc(m.focus)}</p></div><div class="meta"><h2>贯穿案例</h2><p>${esc(m.case)}</p><p><strong>课后任务：</strong>${esc(m.homework)}</p></div></section><h2 class="section-title">建议 L 课时拆解（可直接转为 PPT）</h2>${m.sessions.map((s,i)=>`<article class="session"><h2>L${i+1}｜${esc(s.title)} <span>${s.minutes} 分钟</span></h2><p class="session-focus">${esc(s.focus)}</p><div class="slide-list">${slides(m,s).map(x=>`<div class="slide"><b>${x[0]}</b><span>${esc(x[1])}</span></div>`).join('')}</div><div class="activity"><strong>当堂训练：</strong>${esc(s.activity)}</div><div class="tip"><strong>讲师提示：</strong>${esc(s.tip)}</div></article>`).join('')}<div class="footer-links"><a href="index.html">课程包总览</a><a href="module.html?code=${m.code}">打印/演示本页</a></div>`;}
  document.body.dataset.page==='index'?renderIndex():renderModule();
})();
