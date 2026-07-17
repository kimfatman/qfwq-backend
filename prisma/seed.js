/**
 * 种子数据 - 企服外勤代办宝
 * 执行方式: docker exec qfwq-app node prisma/seed.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始录入种子数据...\n');

  // ==================== 1. 服务分类 & 服务项 ====================
  const services = [
    // 工商注册
    { name: '公司注册', category: 'business', categoryName: '工商注册', description: '内资/外资企业注册登记，一站式代办', basePrice: 500, timeDesc: '3-5个工作日', isHot: true, orderCount: 326, sortOrder: 1,
      process: JSON.stringify([{step:1,title:'提交资料',desc:'提供公司名称、经营范围、股东信息'},{step:2,title:'核名',desc:'工商局名称审核'},{step:3,title:'递交材料',desc:'提交注册申请'},{step:4,title:'领取执照',desc:'领取营业执照正副本'},{step:5,title:'刻章备案',desc:'公章、财务章、法人章'}]),
      materials: JSON.stringify([{name:'法人身份证',required:true},{name:'公司名称预核准',required:true},{name:'经营范围',required:true},{name:'注册地址证明',required:true},{name:'公司章程',required:false}]),
      faq: JSON.stringify([{q:'注册公司需要多少钱？',a:'代办费用500元起，不含政府工本费'},{q:'没有注册地址怎么办？',a:'我们提供武汉各区合规挂靠地址'},{q:'注册完成后还需要做什么？',a:'需要按时记账报税，建议同步办理'}]),
      detail: JSON.stringify({highlights:['全程代办无需到场','赠送公章四枚','免费银行开户预约'])})},
    { name: '个体户注册', category: 'business', categoryName: '工商注册', description: '个体工商户营业执照快速办理', basePrice: 300, timeDesc: '1-3个工作日', isHot: false, orderCount: 189, sortOrder: 2,
      process: JSON.stringify([{step:1,title:'资料准备',desc:'身份证、经营场所证明'},{step:2,title:'提交申请',desc:'市场监管局提交'},{step:3,title:'领取执照',desc:'审核通过领取营业执照'}]),
      materials: JSON.stringify([{name:'身份证',required:true},{name:'经营场所证明',required:true},{name:'经营范围',required:true}]),
      faq: JSON.stringify([{q:'个体户和公司有什么区别？',a:'个体户不具法人资格，税务更简单'},{q:'个体户需要记账吗？',a:'建议建简易账本，方便年报'}]),
      detail: JSON.stringify({highlights:['最快1天出照','支持线上办理','含年报代办'])})},
    { name: '公司变更', category: 'business', categoryName: '工商注册', description: '公司名称/地址/法人/股权变更', basePrice: 400, timeDesc: '5-7个工作日', isHot: false, orderCount: 98, sortOrder: 3,
      process: JSON.stringify([{step:1,title:'确认变更事项',desc:'确定变更内容'},{step:2,title:'准备材料',desc:'股东会决议等'},{step:3,title:'提交变更',desc:'工商局递交'},{step:4,title:'领取新照',desc:'换发新营业执照'}]),
      materials: JSON.stringify([{name:'原营业执照',required:true},{name:'股东会决议',required:true},{name:'变更申请书',required:true}]),
      faq: JSON.stringify([{q:'变更地址需要新地址证明吗？',a:'是的，需要提供新地址的租赁合同或产权证'}]),
      detail: JSON.stringify({highlights:['支持跨区变更','同步变更税务银行','全程代办'])})},
    { name: '公司注销', category: 'business', categoryName: '工商注册', description: '企业注销、吊销转注销、简易注销', basePrice: 1500, timeDesc: '15-30个工作日', isHot: false, orderCount: 67, sortOrder: 4,
      process: JSON.stringify([{step:1,title:'清算备案',desc:'成立清算组，登报公告'},{step:2,title:'税务注销',desc:'清税证明'},{step:3,title:'工商注销',desc:'提交注销申请'},{step:4,title:'银行账户注销',desc:'关闭公司账户'}]),
      materials: JSON.stringify([{name:'营业执照正副本',required:true},{name:'公章',required:true},{name:'法人身份证',required:true},{name:'清算报告',required:false}]),
      faq: JSON.stringify([{q:'公司不经营了不注销会怎样？',a:'会被吊销营业执照，影响法人征信'},{q:'简易注销和一般注销有什么区别？',a:'简易注销适用于无债权债务的企业，流程更快'}]),
      detail: JSON.stringify({highlights:['含登报公告','处理疑难注销','全程无需到场'])})},

    // 资质办理
    { name: '食品经营许可证', category: 'license', categoryName: '资质办理', description: '餐饮/食品销售许可证代办', basePrice: 800, timeDesc: '7-10个工作日', isHot: true, orderCount: 215, sortOrder: 5,
      process: JSON.stringify([{step:1,title:'资料准备',desc:'营业执照、场所平面图等'},{step:2,title:'现场核查',desc:'食药监局现场验收'},{step:3,title:'审批发证',desc:'审核通过后颁发许可证'}]),
      materials: JSON.stringify([{name:'营业执照',required:true},{name:'经营场所平面图',required:true},{name:'食品安全管理制度',required:true},{name:'从业人员健康证',required:true}]),
      faq: JSON.stringify([{q:'没有健康证怎么办？',a:'我们可以协助安排体检'},{q:'场地不达标能办吗？',a:'需要先整改达到标准'}]),
      detail: JSON.stringify({highlights:['含现场指导','协助整改','一次通过率高'])})},
    { name: '道路运输许可证', category: 'license', categoryName: '资质办理', description: '道路运输经营许可证办理', basePrice: 1200, timeDesc: '10-15个工作日', isHot: false, orderCount: 56, sortOrder: 6,
      process: JSON.stringify([{step:1,title:'资质审核',desc:'确认企业条件'},{step:2,title:'车辆备案',desc:'运营车辆登记'},{step:3,title:'人员资质',desc:'驾驶员从业资格证'},{step:4,title:'审批发证',desc:'交通运输局审批'}]),
      materials: JSON.stringify([{name:'营业执照',required:true},{name:'车辆行驶证',required:true},{name:'驾驶员从业资格证',required:true},{name:'安全生产管理制度',required:true}]),
      faq: JSON.stringify([{q:'需要几辆车才能申请？',a:'至少1辆符合条件的运营车辆'}]),
      detail: JSON.stringify({highlights:['含车辆备案','协助人员培训','全市可办'])})},
    { name: '建筑资质', category: 'license', categoryName: '资质办理', description: '建筑施工/装修装饰/机电安装等资质', basePrice: 3000, timeDesc: '20-30个工作日', isHot: true, orderCount: 134, sortOrder: 7,
      process: JSON.stringify([{step:1,title:'资质匹配',desc:'根据业务确定资质类别'},{step:2,title:'人员配备',desc:'建造师、工程师等'},{step:3,title:'材料编制',desc:'申报资料整理'},{step:4,title:'提交审批',desc:'住建局审批'},{step:5,title:'领取证书',desc:'颁发资质证书'}]),
      materials: JSON.stringify([{name:'营业执照',required:true},{name:'企业章程',required:true},{name:'技术人员证书',required:true},{name:'办公场所证明',required:true}]),
      faq: JSON.stringify([{q:'资质需要年检吗？',a:'需要定期动态核查'},{q:'没有建造师怎么办？',a:'可以协助挂靠或招聘'}]),
      detail: JSON.stringify({highlights:['含人员配备','全程代办','不过退款'])})},

    // 税务服务
    { name: '代理记账', category: 'tax', categoryName: '税务服务', description: '专业会计团队，月度记账报税', basePrice: 200, timeDesc: '每月持续服务', isHot: true, orderCount: 458, sortOrder: 8,
      process: JSON.stringify([{step:1,title:'交接票据',desc:'每月提供原始票据'},{step:2,title:'账务处理',desc:'会计做账'},{step:3,title:'税务申报',desc:'按期纳税申报'},{step:4,title:'报表反馈',desc:'月度财务报表推送'}]),
      materials: JSON.stringify([{name:'银行回单',required:true},{name:'发票',required:true},{name:'费用票据',required:true}]),
      faq: JSON.stringify([{q:'小规模纳税人和一般纳税人区别？',a:'主要区别在于增值税税率和抵扣方式'},{q:'没有业务也需要报税吗？',a:'是的，零申报也需要按时进行'}]),
      detail: JSON.stringify({highlights:['资深会计1对1','免费税务咨询','含年报汇算清缴'])})},
    { name: '税务异常处理', category: 'tax', categoryName: '税务服务', description: '税务非正常户解除、逾期申报处理', basePrice: 600, timeDesc: '5-10个工作日', isHot: false, orderCount: 78, sortOrder: 9,
      process: JSON.stringify([{step:1,title:'情况诊断',desc:'查询异常原因'},{step:2,title:'补申报',desc:'补做未申报的税种'},{step:3,title:'缴纳罚款',desc:'处理滞纳金'},{step:4,title:'解除异常',desc:'恢复正常状态'}]),
      materials: JSON.stringify([{name:'营业执照',required:true},{name:'公章',required:true},{name:'法人身份证',required:true}]),
      faq: JSON.stringify([{q:'异常了有什么影响？',a:'影响税务评级、发票领购、招投标等'}]),
      detail: JSON.stringify({highlights:['快速解除异常','处理历史遗留','经验丰富'])})},

    // 社保公积金
    { name: '社保开户', category: 'social', categoryName: '社保公积金', description: '企业社保账户开设、人员增减', basePrice: 300, timeDesc: '3-5个工作日', isHot: false, orderCount: 112, sortOrder: 10,
      process: JSON.stringify([{step:1,title:'资料准备',desc:'营业执照、法人信息等'},{step:2,title:'开户申请',desc:'社保局开设单位账户'},{step:3,title:'人员增员',desc:'为员工办理参保'}]),
      materials: JSON.stringify([{name:'营业执照',required:true},{name:'法人身份证',required:true},{name:'银行开户许可证',required:true}]),
      faq: JSON.stringify([{q:'新员工入职多久要办社保？',a:'入职30日内必须办理'}]),
      detail: JSON.stringify({highlights:['全程代办','含公积金同步开户','支持批量增员'])})},

    // 银行开户
    { name: '银行对公开户', category: 'bank', categoryName: '银行开户', description: '基本户/一般户开设，多家银行可选', basePrice: 500, timeDesc: '3-5个工作日', isHot: false, orderCount: 187, sortOrder: 11,
      process: JSON.stringify([{step:1,title:'选择银行',desc:'根据需求推荐银行网点'},{step:2,title:'预约上门',desc:'银行上门核实场地'},{step:3,title:'开户审批',desc:'银行内部审批'},{step:4,title:'领取开户许可',desc:'领取开户许可证'}]),
      materials: JSON.stringify([{name:'营业执照正副本',required:true},{name:'公章全套',required:true},{name:'法人身份证',required:true},{name:'公司章程',required:true}]),
      faq: JSON.stringify([{q:'法人需要到场吗？',a:'部分银行要求法人面签，我们可以安排陪同'},{q:'开户需要存多少钱？',a:'大部分银行无最低存款要求'}]),
      detail: JSON.stringify({highlights:['覆盖武汉主流银行','含预约陪同','免费年检'])})},

    // 知识产权
    { name: '商标注册', category: 'ip', categoryName: '知识产权', description: '商标查询、申请、续展一站式服务', basePrice: 600, timeDesc: '9-12个月（审核周期）', isHot: true, orderCount: 267, sortOrder: 12,
      process: JSON.stringify([{step:1,title:'商标查询',desc:'检索近似商标'},{step:2,title:'提交申请',desc:'向商标局递交'},{step:3,title:'形式审查',desc:'约1个月'},{step:4,title:'实质审查',desc:'约6-9个月'},{step:5,title:'初审公告',desc:'3个月公告期'},{step:6,title:'领取证书',desc:'颁发商标注册证'}]),
      materials: JSON.stringify([{name:'商标图样',required:true},{name:'营业执照/身份证',required:true},{name:'商品/服务类别',required:true}]),
      faq: JSON.stringify([{q:'商标注册成功率是多少？',a:'经过专业查询后申请，成功率可达80%以上'},{q:'被驳回了怎么办？',a:'可以做驳回复审，我们提供免费复审咨询'}]),
      detail: JSON.stringify({highlights:['免费近似查询','驳回退款','含监控预警'])})},

    // 行政许可
    { name: '医疗器械经营许可证', category: 'admin', categoryName: '行政许可', description: '一类/二类/三类医疗器械经营许可', basePrice: 1500, timeDesc: '15-20个工作日', isHot: false, orderCount: 43, sortOrder: 13,
      process: JSON.stringify([{step:1,title:'资质评估',desc:'确认经营类别和条件'},{step:2,title:'场地准备',desc:'仓库/经营场所达标'},{step:3,title:'人员配备',desc:'质量管理人员'},{step:4,title:'提交申请',desc:'药监局审批'},{step:5,title:'现场验收',desc:'执法人员实地核查'},{step:6,title:'颁发许可证',desc:'审批通过发证'}]),
      materials: JSON.stringify([{name:'营业执照',required:true},{name:'经营场所证明',required:true},{name:'质量管理制度',required:true},{name:'人员资质证书',required:true}]),
      faq: JSON.stringify([{q:'二类备案和三类许可有什么区别？',a:'二类实行备案制，三类需要许可审批'}]),
      detail: JSON.stringify({highlights:['含场地规划指导','制度模板提供','全程代办'])})},
    { name: '人力资源服务许可证', category: 'admin', categoryName: '行政许可', description: '人力资源服务/劳务派遣许可办理', basePrice: 2000, timeDesc: '15-20个工作日', isHot: false, orderCount: 35, sortOrder: 14,
      process: JSON.stringify([{step:1,title:'条件确认',desc:'注册资本≥200万等'},{step:2,title:'验资报告',desc:'出具验资证明'},{step:3,title:'提交申请',desc:'人社局审批'},{step:4,title:'现场核查',desc:'经营场所验收'},{step:5,title:'颁发许可',desc:'领取许可证'}]),
      materials: JSON.stringify([{name:'营业执照',required:true},{name:'验资报告',required:true},{name:'经营场所证明',required:true},{name:'管理制度',required:true}]),
      faq: JSON.stringify([{q:'注册资本不够200万怎么办？',a:'需要先办理增资'},{q:'需要几个人？',a:'至少5名大专以上学历的专职人员'}]),
      detail: JSON.stringify({highlights:['含验资协助','制度模板','快速出证'])})},

    // 其他服务
    { name: '代办年检', category: 'other', categoryName: '其他服务', description: '企业工商年报、个体户年报', basePrice: 200, timeDesc: '1-3个工作日', isHot: false, orderCount: 345, sortOrder: 15,
      process: JSON.stringify([{step:1,title:'信息确认',desc:'确认企业信息'},{step:2,title:'填报年报',desc:'国家企业信用信息公示系统'},{step:3,title:'提交公示',desc:'完成年报公示'}]),
      materials: JSON.stringify([{name:'营业执照',required:true},{name:'法人身份证',required:true}]),
      faq: JSON.stringify([{q:'年报什么时候截止？',a:'每年1月1日至6月30日'},{q:'不年报会怎样？',a:'会列入经营异常名录'}]),
      detail: JSON.stringify({highlights:['当天可完成','支持批量','含异常移出'])})},
    { name: '代办公示', category: 'other', categoryName: '其他服务', description: '企业信息公示、股权变更公示等', basePrice: 150, timeDesc: '1个工作日', isHot: false, orderCount: 89, sortOrder: 16,
      process: JSON.stringify([{step:1,title:'确认公示内容',desc:'确认需要公示的信息'},{step:2,title:'系统填报',desc:'信用公示系统操作'},{step:3,title:'提交完成',desc:'公示即时生效'}]),
      materials: JSON.stringify([{name:'营业执照',required:true}]),
      faq: JSON.stringify([{q:'哪些信息需要公示？',a:'股东出资、股权变更、行政许可等信息'}]),
      detail: JSON.stringify({highlights:['即时完成','专业准确','含信息核验'])})},
  ];

  console.log('📋 录入服务数据...');
  for (const svc of services) {
    await prisma.service.create({
      data: {
        name: svc.name,
        category: svc.category,
        categoryName: svc.categoryName,
        description: svc.description,
        icon: '',
        imageUrl: '',
        basePrice: svc.basePrice,
        timeDesc: svc.timeDesc,
        region: '武汉',
        orderCount: svc.orderCount,
        isHot: svc.isHot,
        sortOrder: svc.sortOrder,
        status: 1,
        detail: svc.detail || JSON.stringify({}),
        process: svc.process || JSON.stringify([]),
        materials: svc.materials || JSON.stringify([]),
        faq: svc.faq || JSON.stringify([]),
      },
    });
  }
  console.log(`✅ 已录入 ${services.length} 个服务项\n`);

  // ==================== 2. Banner 轮播图 ====================
  const banners = [
    {
      title: '企业注册一站式',
      subtitle: '3天拿照 · 赠送公章 · 银行开户',
      gradient: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
      linkType: 'service', linkValue: '', sortOrder: 1,
    },
    {
      title: '代理记账 低至200/月',
      subtitle: '资深会计 · 差错赔付 · 免费税务筹划',
      gradient: 'linear-gradient(135deg, #047857 0%, #10B981 100%)',
      linkType: 'service', linkValue: '', sortOrder: 2,
    },
    {
      title: '商标注册 600元起',
      subtitle: '免费查询 · 驳回退款 · 全程跟踪',
      gradient: 'linear-gradient(135deg, #B45309 0%, #F59E0B 100%)',
      linkType: 'service', linkValue: '', sortOrder: 3,
    },
    {
      title: '首单立减100元',
      subtitle: '新用户专享 · 全品类可用',
      gradient: 'linear-gradient(135deg, #9333EA 0%, #C084FC 100%)',
      linkType: 'page', linkValue: '', sortOrder: 4,
    },
  ];

  console.log('🖼️  录入Banner数据...');
  for (const banner of banners) {
    await prisma.banner.create({
      data: {
        title: banner.title,
        subtitle: banner.subtitle,
        imageUrl: '',
        gradient: banner.gradient,
        linkType: banner.linkType,
        linkValue: banner.linkValue,
        sortOrder: banner.sortOrder,
        status: 1,
      },
    });
  }
  console.log(`✅ 已录入 ${banners.length} 个Banner\n`);

  // ==================== 3. 协议内容 ====================
  console.log('📝 录入协议数据...');
  await prisma.agreement.create({
    data: {
      type: 'service',
      title: '企服代办宝用户服务协议',
      content: `<h2>企服代办宝用户服务协议</h2>
<p>更新日期：2026年7月1日 | 生效日期：2026年7月1日</p>
<h3>一、服务说明</h3>
<p>企服代办宝（以下简称"本平台"）是武汉本地企业外勤代办服务平台，为用户提供工商注册、资质办理、税务服务、知识产权等企业服务。用户通过本平台发布代办需求，由平台认证的外勤服务人员提供报价并完成代办服务。</p>
<h3>二、用户注册</h3>
<p>1. 用户通过微信授权登录即可完成注册。<br>2. 用户应保证提供的信息真实、准确、完整。<br>3. 用户账号仅限本人使用，不得转让、出借。</p>
<h3>三、服务规范</h3>
<p>1. 本平台提供信息撮合服务，具体代办服务由外勤人员提供。<br>2. 外勤人员均经过实名认证和资质审核。<br>3. 服务价格由外勤人员报价，用户自主选择。<br>4. 平台不介入价格谈判，但会监督服务质量和合规性。</p>
<h3>四、费用与支付</h3>
<p>1. 服务费用由用户与外勤人员协商确定。<br>2. 平台支持线上支付，保障交易安全。<br>3. 服务未完成可申请退款，具体规则见退款政策。</p>
<h3>五、免责条款</h3>
<p>1. 因用户提供的资料不实导致的服务延误或失败，平台不承担责任。<br>2. 因政策变化导致的服务流程调整，平台将及时通知但不承担额外责任。<br>3. 不可抗力导致的服务中断，平台不承担责任。</p>
<h3>六、争议解决</h3>
<p>本协议适用中华人民共和国法律。因本协议产生的争议，双方应友好协商；协商不成的，提交武汉市有管辖权的人民法院诉讼解决。</p>`,
      version: '1.0',
    },
  });

  await prisma.agreement.create({
    data: {
      type: 'privacy',
      title: '企服代办宝隐私政策',
      content: `<h2>企服代办宝隐私政策</h2>
<p>更新日期：2026年7月1日 | 生效日期：2026年7月1日</p>
<h3>一、信息收集</h3>
<p>我们可能收集以下信息：<br>1. 微信授权信息（昵称、头像）<br>2. 手机号码（用于身份验证和服务联系）<br>3. 企业信息（用于代办服务）<br>4. 设备信息（用于安全保障）</p>
<h3>二、信息使用</h3>
<p>我们收集的信息用于：<br>1. 提供和改进服务<br>2. 身份验证和安全保障<br>3. 服务通知和沟通<br>4. 遵守法律法规要求</p>
<h3>三、信息保护</h3>
<p>1. 采用加密技术存储敏感信息<br>2. 严格限制员工访问权限<br>3. 定期进行安全审计<br>4. 不会向第三方出售用户信息</p>
<h3>四、信息共享</h3>
<p>仅在以下情况共享信息：<br>1. 获得用户明确同意<br>2. 为完成代办服务需要提供给外勤人员<br>3. 法律法规要求<br>4. 保护平台和用户权益</p>
<h3>五、用户权利</h3>
<p>用户有权：<br>1. 查看和更正个人信息<br>2. 删除账号及相关数据<br>3. 撤回授权同意<br>4. 投诉和举报</p>
<h3>六、联系我们</h3>
<p>如对本隐私政策有疑问，请联系客服或发送邮件至 privacy@qfwq.com</p>`,
      version: '1.0',
    },
  });
  console.log('✅ 已录入用户协议和隐私政策\n');

  // ==================== 4. 系统配置 ====================
  console.log('⚙️  录入系统配置...');
  const configs = [
    { key: 'service_phone', value: '027-8888-6666', description: '客服电话' },
    { key: 'service_hours', value: '工作日 9:00-18:00', description: '客服工作时间' },
    { key: 'min_quote_count', value: '3', description: '最低报价人数展示' },
    { key: 'order_auto_cancel_hours', value: '72', description: '订单超时自动取消（小时）' },
    { key: 'platform_commission_rate', value: '0.10', description: '平台抽成比例' },
    { key: 'new_user_coupon', value: '100', description: '新用户优惠券金额' },
    { key: 'city_name', value: '武汉', description: '服务城市' },
    { key: 'city_code', value: '420100', description: '城市编码' },
  ];

  for (const config of configs) {
    await prisma.systemConfig.create({ data: config });
  }
  console.log(`✅ 已录入 ${configs.length} 项系统配置\n`);

  // ==================== 5. 管理员账号 ====================
  console.log('👤 创建管理员账号...');
  const existingAdmin = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        openid: 'admin_master',
        nickname: '系统管理员',
        avatarUrl: '',
        phone: '13800000000',
        role: 'admin',
        status: 1,
      },
    });
    // 录入管理员密码配置
    await prisma.systemConfig.upsert({
      where: { key: 'admin_password' },
      create: { key: 'admin_password', value: 'admin123', description: '管理员登录密码' },
      update: { value: 'admin123' },
    });
    console.log('✅ 管理员账号已创建（手机号: 13800000000, 密码: admin123）\n');
  } else {
    console.log('⏭️  管理员账号已存在，跳过\n');
  }

  // ==================== 6. 示例外勤人员 ====================
  console.log('👷 录入示例外勤人员...');
  const runners = [
    {
      nickname: '张明', avatarUrl: '', phone: '13800001111',
      realName: '张明', idCard: '420102199001011234',
      description: '10年企业服务经验，熟悉武汉各区工商、税务流程。服务态度好，响应速度快，累计服务超过500家企业。',
      serviceAreas: JSON.stringify(['武昌区', '洪山区', '江夏区']),
      serviceCategories: JSON.stringify(['business', 'tax', 'social']),
      rating: 4.9, totalOrders: 523, completionRate: 99.2, avgResponseTime: 8,
      verified: true,
    },
    {
      nickname: '李娟', avatarUrl: '', phone: '13800002222',
      realName: '李娟', idCard: '420106199205052345',
      description: '专注资质办理5年，食品经营许可证、建筑资质通过率高。一对一全程跟进，让您省心省力。',
      serviceAreas: JSON.stringify(['江汉区', '硚口区', '汉阳区']),
      serviceCategories: JSON.stringify(['license', 'admin']),
      rating: 4.8, totalOrders: 312, completionRate: 98.5, avgResponseTime: 12,
      verified: true,
    },
    {
      nickname: '王强', avatarUrl: '', phone: '13800003333',
      realName: '王强', idCard: '420111198803033456',
      description: '知识产权资深顾问，商标注册成功率90%以上。同时提供公司注册、银行开户等一站式服务。',
      serviceAreas: JSON.stringify(['东湖高新区', '武昌区', '洪山区']),
      serviceCategories: JSON.stringify(['ip', 'business', 'bank']),
      rating: 4.7, totalOrders: 267, completionRate: 97.8, avgResponseTime: 15,
      verified: true,
    },
    {
      nickname: '赵丽', avatarUrl: '', phone: '13800004444',
      realName: '赵丽', idCard: '420102199505054567',
      description: '注册会计师，专注代理记账和税务筹划。精通小规模纳税人和一般纳税人账务，服务细致入微。',
      serviceAreas: JSON.stringify(['武昌区', '青山区', '东西湖区']),
      serviceCategories: JSON.stringify(['tax']),
      rating: 4.9, totalOrders: 458, completionRate: 99.5, avgResponseTime: 5,
      verified: true,
    },
  ];

  for (const r of runners) {
    const user = await prisma.user.create({
      data: {
        openid: `runner_${r.phone}`,
        nickname: r.nickname,
        avatarUrl: r.avatarUrl,
        phone: r.phone,
        role: 'runner',
        status: 1,
      },
    });

    await prisma.runner.create({
      data: {
        userId: user.id,
        realName: r.realName,
        idCard: r.idCard,
        phone: r.phone,
        avatarUrl: r.avatarUrl,
        description: r.description,
        serviceAreas: r.serviceAreas,
        serviceCategories: r.serviceCategories,
        rating: r.rating,
        totalOrders: r.totalOrders,
        completionRate: r.completionRate,
        avgResponseTime: r.avgResponseTime,
        verified: r.verified,
        status: 1,
      },
    });
  }
  console.log(`✅ 已录入 ${runners.length} 名外勤人员\n`);

  // ==================== 7. 示例评价 ====================
  console.log('⭐ 录入示例评价...');
  const firstRunner = await prisma.runner.findFirst();
  const secondRunner = await prisma.runner.findMany({ skip: 1, take: 1 });
  const firstUser = await prisma.user.findFirst({ where: { role: 'runner' } });

  if (firstRunner && firstUser) {
    const reviews = [
      { runnerId: firstRunner.id, userId: firstUser.id, serviceName: '公司注册', rating: 5.0, content: '张明老师非常专业，公司注册全程没操心，3天就拿到执照了！强烈推荐！' },
      { runnerId: firstRunner.id, userId: firstUser.id, serviceName: '代理记账', rating: 4.5, content: '记账很规范，每个月都会准时报税，有问题也能随时咨询。' },
      { runnerId: secondRunner[0]?.id || firstRunner.id, userId: firstUser.id, serviceName: '食品经营许可证', rating: 5.0, content: '李娟帮忙办的食品经营许可证，一次通过，之前自己跑了好几次都没搞定。' },
    ];

    for (const review of reviews) {
      // 创建一个示例订单用于关联评价
      const hotService = await prisma.service.findFirst({ where: { name: review.serviceName } });
      if (hotService) {
        const order = await prisma.order.create({
          data: {
            orderNo: `QFW${Date.now()}${Math.random().toString(36).slice(2,6).toUpperCase()}`,
            userId: review.userId,
            serviceId: hotService.id,
            serviceName: review.serviceName,
            assignedRunnerId: review.runnerId,
            status: 'completed',
            title: `${review.serviceName}代办`,
            contactName: '测试用户',
            contactPhone: '13800000000',
            completedAt: new Date(),
            quoteCount: 3,
          },
        });

        await prisma.review.create({
          data: {
            orderId: order.id,
            userId: review.userId,
            runnerId: review.runnerId,
            serviceName: review.serviceName,
            rating: review.rating,
            content: review.content,
            images: JSON.stringify([]),
            status: 1,
          },
        });
      }
    }
    console.log(`✅ 已录入示例评价\n`);
  }

  console.log('🎉 种子数据录入完成！');
  console.log('📊 数据统计：');
  console.log(`   服务项: ${await prisma.service.count()} 个`);
  console.log(`   Banner: ${await prisma.banner.count()} 个`);
  console.log(`   协议: ${await prisma.agreement.count()} 个`);
  console.log(`   系统配置: ${await prisma.systemConfig.count()} 项`);
  console.log(`   外勤人员: ${await prisma.runner.count()} 名`);
  console.log(`   评价: ${await prisma.review.count()} 条`);
}

main()
  .catch((e) => {
    console.error('❌ 种子数据录入失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
