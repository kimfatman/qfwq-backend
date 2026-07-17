/**
 * 种子数据脚本 - 企服外勤代办宝
 * 使用 prisma upsert 确保幂等，可重复执行
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==================== 服务分类及服务数据 ====================
const serviceCategories = [
  {
    category: 'gszc',
    categoryName: '工商注册',
    services: [
      {
        name: '公司注册',
        description: '提供全流程公司注册服务，包含名称核准、营业执照办理、刻章备案等',
        icon: '🏢',
        basePrice: 800,
        timeDesc: '5-7个工作日',
        isHot: true,
        process: [
          { step: 1, title: '在线咨询', desc: '描述需求，确认服务内容' },
          { step: 2, title: '提交资料', desc: '提供股东身份证、公司章程等材料' },
          { step: 3, title: '名称核准', desc: '提交工商局进行名称预核准' },
          { step: 4, title: '提交登记', desc: '向工商局提交注册登记申请' },
          { step: 5, title: '领取执照', desc: '领取营业执照正副本' },
          { step: 6, title: '刻章备案', desc: '公章、财务章、法人章刻制及备案' }
        ],
        materials: [
          { name: '股东身份证复印件', required: true },
          { name: '公司章程', required: true },
          { name: '股东会决议', required: true },
          { name: '注册地址证明', required: true },
          { name: '法定代表人任职文件', required: true }
        ],
        faq: [
          { q: '注册公司需要多少注册资本？', a: '目前实行认缴制，无最低注册资本限制（特殊行业除外），建议根据业务需求合理设定。' },
          { q: '注册地址有什么要求？', a: '需要提供真实有效的商业办公地址，不可使用住宅地址（除住居改商外）。' },
          { q: '整个流程大概需要多久？', a: '材料齐全的情况下，一般5-7个工作日即可拿到营业执照。' }
        ]
      },
      {
        name: '个体户注册',
        description: '个体工商户注册登记，适合个人创业和小微经营',
        icon: '🏪',
        basePrice: 300,
        timeDesc: '3-5个工作日',
        isHot: false,
        process: [
          { step: 1, title: '在线咨询', desc: '确认经营范围和注册信息' },
          { step: 2, title: '提交资料', desc: '提供身份证、经营场所证明等' },
          { step: 3, title: '工商登记', desc: '向工商局提交登记申请' },
          { step: 4, title: '领取执照', desc: '领取个体工商户营业执照' }
        ],
        materials: [
          { name: '经营者身份证', required: true },
          { name: '经营场所证明', required: true },
          { name: '一寸免冠照片', required: true }
        ],
        faq: [
          { q: '个体户和公司有什么区别？', a: '个体户注册简单、成本低，但承担无限责任；公司承担有限责任，更适合规模经营。' },
          { q: '个体户需要记账报税吗？', a: '需要。个体户也需按规定进行税务登记和纳税申报。' }
        ]
      },
      {
        name: '分公司设立',
        description: '在异地设立分支机构，完成分公司注册登记',
        icon: '🏛️',
        basePrice: 1200,
        timeDesc: '7-10个工作日',
        isHot: false,
        process: [
          { step: 1, title: '在线咨询', desc: '确认分公司注册地和经营范围' },
          { step: 2, title: '提交资料', desc: '提供总公司营业执照、决议等材料' },
          { step: 3, title: '工商登记', desc: '向分公司所在地工商局提交申请' },
          { step: 4, title: '领取执照', desc: '领取分公司营业执照' },
          { step: 5, title: '刻章备案', desc: '分公司印章刻制及备案' }
        ],
        materials: [
          { name: '总公司营业执照副本', required: true },
          { name: '总公司章程', required: true },
          { name: '股东会决议', required: true },
          { name: '分公司负责人身份证', required: true },
          { name: '分公司注册地址证明', required: true }
        ],
        faq: [
          { q: '分公司需要独立核算吗？', a: '分公司可以选择独立核算或非独立核算，根据实际经营需要决定。' }
        ]
      }
    ]
  },
  {
    category: 'zzbl',
    categoryName: '资质办理',
    services: [
      {
        name: '食品经营许可证',
        description: '餐饮、食品销售类企业必备许可证，包含预包装食品、散装食品等',
        icon: '🍖',
        basePrice: 1500,
        timeDesc: '15-20个工作日',
        isHot: true,
        process: [
          { step: 1, title: '在线咨询', desc: '确认经营类型和许可范围' },
          { step: 2, title: '准备材料', desc: '整理申请表、制度文件等材料' },
          { step: 3, title: '提交申请', desc: '向市场监管局提交许可申请' },
          { step: 4, title: '现场核查', desc: '配合监管部门进行经营场所现场核查' },
          { step: 5, title: '领取许可证', desc: '核查通过后领取食品经营许可证' }
        ],
        materials: [
          { name: '营业执照副本', required: true },
          { name: '法定代表人身份证', required: true },
          { name: '经营场所平面图', required: true },
          { name: '食品安全管理制度', required: true },
          { name: '从业人员健康证明', required: true }
        ],
        faq: [
          { q: '食品经营许可证有效期多久？', a: '食品经营许可证有效期为5年，需在到期前30日内申请延续。' },
          { q: '需要实地核查吗？', a: '是的，新办食品经营许可证一般需要监管部门进行现场核查。' }
        ]
      },
      {
        name: '劳务派遣许可证',
        description: '劳务派遣经营许可证申请，适合人力资源服务企业',
        icon: '👥',
        basePrice: 3000,
        timeDesc: '20-30个工作日',
        isHot: false,
        process: [
          { step: 1, title: '在线咨询', desc: '确认申请条件和材料清单' },
          { step: 2, title: '准备材料', desc: '整理验资报告、制度文件等' },
          { step: 3, title: '提交申请', desc: '向人社部门提交许可申请' },
          { step: 4, title: '现场核查', desc: '配合现场核查' },
          { step: 5, title: '领取许可证', desc: '领取劳务派遣经营许可证' }
        ],
        materials: [
          { name: '营业执照副本', required: true },
          { name: '验资报告（200万以上）', required: true },
          { name: '公司章程', required: true },
          { name: '劳务派遣管理制度', required: true },
          { name: '经营场所使用证明', required: true }
        ],
        faq: [
          { q: '劳务派遣许可证对注册资本有要求吗？', a: '是的，注册资本不得少于人民币200万元，且需实缴。' }
        ]
      }
    ]
  },
  {
    category: 'swba',
    categoryName: '税务备案',
    services: [
      {
        name: '税务登记',
        description: '新注册企业税务登记，包含国税、地税登记及税种核定',
        icon: '📋',
        basePrice: 500,
        timeDesc: '3-5个工作日',
        isHot: true,
        process: [
          { step: 1, title: '在线咨询', desc: '确认纳税人类型和税务需求' },
          { step: 2, title: '准备材料', desc: '提供营业执照、身份证等材料' },
          { step: 3, title: '税务登记', desc: '向税务局提交登记申请' },
          { step: 4, title: '税种核定', desc: '核定增值税、企业所得税等税种' },
          { step: 5, title: '签订协议', desc: '签订三方协议，开通网上申报' }
        ],
        materials: [
          { name: '营业执照副本', required: true },
          { name: '法定代表人身份证', required: true },
          { name: '公司章程', required: true },
          { name: '银行开户许可证', required: true },
          { name: '注册地址租赁合同', required: true }
        ],
        faq: [
          { q: '一般纳税人和小规模纳税人怎么选？', a: '年应税销售额超过500万必须登记为一般纳税人，未超过的可自愿选择。一般纳税人可抵扣进项税。' }
        ]
      },
      {
        name: '发票申领',
        description: '增值税发票领用资格申请，包含专票和普票',
        icon: '🧾',
        basePrice: 400,
        timeDesc: '3-7个工作日',
        isHot: false,
        process: [
          { step: 1, title: '在线咨询', desc: '确认发票类型和申请数量' },
          { step: 2, title: '提交申请', desc: '向税务局提交发票领用申请' },
          { step: 3, title: '设备办理', desc: '办理税控设备（如需）' },
          { step: 4, title: '领用发票', desc: '领取增值税发票' }
        ],
        materials: [
          { name: '营业执照副本', required: true },
          { name: '税务登记证', required: true },
          { name: '发票专用章', required: true },
          { name: '经办人身份证', required: true }
        ],
        faq: [
          { q: '专票和普票有什么区别？', a: '专票可以抵扣进项税，普票一般不能抵扣（部分行业除外）。一般纳税人建议申领专票。' }
        ]
      }
    ]
  },
  {
    category: 'zzns',
    categoryName: '证照年审',
    services: [
      {
        name: '营业执照年检',
        description: '企业年度报告公示，完成工商年报申报',
        icon: '📊',
        basePrice: 300,
        timeDesc: '1-3个工作日',
        isHot: true,
        process: [
          { step: 1, title: '在线咨询', desc: '确认年报内容和申报事项' },
          { step: 2, title: '整理数据', desc: '整理企业年度经营数据' },
          { step: 3, title: '填写年报', desc: '在公示系统填报年度报告' },
          { step: 4, title: '公示完成', desc: '确认年报公示成功' }
        ],
        materials: [
          { name: '营业执照副本', required: true },
          { name: '年度财务报表', required: true },
          { name: '社保缴纳证明', required: true }
        ],
        faq: [
          { q: '年报截止时间是什么时候？', a: '每年1月1日至6月30日需完成上一年度年报公示。' },
          { q: '不报年报会有什么后果？', a: '逾期未报将被列入经营异常名录，影响企业信用和业务办理。' }
        ]
      },
      {
        name: '许可证年审',
        description: '各类经营许可证年审续期，确保资质持续有效',
        icon: '🔄',
        basePrice: 600,
        timeDesc: '5-10个工作日',
        isHot: false,
        process: [
          { step: 1, title: '在线咨询', desc: '确认需要年审的许可证类型' },
          { step: 2, title: '准备材料', desc: '整理年审所需材料' },
          { step: 3, title: '提交年审', desc: '向主管部门提交年审申请' },
          { step: 4, title: '领取新证', desc: '年审通过后领取新证或签注' }
        ],
        materials: [
          { name: '许可证原件', required: true },
          { name: '营业执照副本', required: true },
          { name: '年度经营情况报告', required: true }
        ],
        faq: [
          { q: '哪些许可证需要年审？', a: '食品经营许可证、劳务派遣许可证、人力资源服务许可证等大多需要定期年审或延续。' }
        ]
      }
    ]
  },
  {
    category: 'bgzx',
    categoryName: '变更注销',
    services: [
      {
        name: '公司变更',
        description: '公司名称、地址、经营范围、法人、股权等工商变更登记',
        icon: '✏️',
        basePrice: 600,
        timeDesc: '5-7个工作日',
        isHot: true,
        process: [
          { step: 1, title: '在线咨询', desc: '确认变更事项和材料需求' },
          { step: 2, title: '准备材料', desc: '整理变更所需的决议、证明等' },
          { step: 3, title: '提交申请', desc: '向工商局提交变更登记申请' },
          { step: 4, title: '领取新照', desc: '领取变更后的营业执照' },
          { step: 5, title: '同步变更', desc: '同步变更税务、银行等信息' }
        ],
        materials: [
          { name: '营业执照正副本', required: true },
          { name: '变更决议/决定', required: true },
          { name: '修正后的公司章程', required: true },
          { name: '法定代表人身份证', required: true }
        ],
        faq: [
          { q: '股权变更需要交税吗？', a: '股权转让涉及印花税，若转让价格高于投资成本，还需缴纳个人所得税或企业所得税。' },
          { q: '法人变更多久能办好？', a: '材料齐全一般5-7个工作日，如涉及股权变更可能稍长。' }
        ]
      },
      {
        name: '公司注销',
        description: '公司清算注销全流程办理，含税务注销、工商注销',
        icon: '❌',
        basePrice: 2000,
        timeDesc: '30-60个工作日',
        isHot: false,
        process: [
          { step: 1, title: '在线咨询', desc: '评估注销条件和流程' },
          { step: 2, title: '成立清算组', desc: '成立清算组并发布清算公告' },
          { step: 3, title: '税务注销', desc: '办理税务清算和税务注销' },
          { step: 4, title: '工商注销', desc: '提交注销登记申请' },
          { step: 5, title: '银行销户', desc: '办理银行账户销户' },
          { step: 6, title: '注销完成', desc: '领取注销通知书' }
        ],
        materials: [
          { name: '营业执照正副本', required: true },
          { name: '清算报告', required: true },
          { name: '税务注销证明', required: true },
          { name: '股东会决议', required: true },
          { name: '公章', required: true }
        ],
        faq: [
          { q: '公司注销大概需要多久？', a: '简易注销约20天，一般注销需45天公告期加上审批时间，通常1-2个月。' },
          { q: '简易注销和一般注销有什么区别？', a: '简易注销适用于未发生债权债务或已清偿的小规模企业，流程更简化；一般注销需经过完整的清算程序。' }
        ]
      }
    ]
  },
  {
    category: 'jgzz',
    categoryName: '建筑资质',
    services: [
      {
        name: '建筑资质办理',
        description: '施工总承包、专业承包等建筑业企业资质新办申请',
        icon: '🏗️',
        basePrice: 8000,
        timeDesc: '60-90个工作日',
        isHot: true,
        process: [
          { step: 1, title: '在线咨询', desc: '确认资质类别和等级' },
          { step: 2, title: '人员配置', desc: '配置建造师、工程师等人员' },
          { step: 3, title: '准备材料', desc: '整理业绩证明、人员证书等' },
          { step: 4, title: '提交申请', desc: '向住建部门提交资质申请' },
          { step: 5, title: '公示公告', desc: '等待公示和审批结果' },
          { step: 6, title: '领取证书', desc: '领取建筑业企业资质证书' }
        ],
        materials: [
          { name: '营业执照副本', required: true },
          { name: '建造师注册证书', required: true },
          { name: '职称人员证书', required: true },
          { name: '技术工人证书', required: true },
          { name: '企业业绩证明', required: true },
          { name: '社保缴纳证明', required: true }
        ],
        faq: [
          { q: '办理建筑资质对人员有什么要求？', a: '不同类别和等级资质对建造师、职称人员、技术工人有不同数量和专业的要求。' },
          { q: '资质办理大概需要多久？', a: '材料齐全提交后，一般2-3个月完成审批。' }
        ]
      },
      {
        name: '安全生产许可证',
        description: '建筑施工企业安全生产许可证新办申请',
        icon: '⚠️',
        basePrice: 5000,
        timeDesc: '30-45个工作日',
        isHot: false,
        process: [
          { step: 1, title: '在线咨询', desc: '确认安许申请条件' },
          { step: 2, title: '人员培训', desc: '安排三类人员安全考核' },
          { step: 3, title: '准备材料', desc: '整理安全管理制度、人员证书等' },
          { step: 4, title: '提交申请', desc: '向住建部门提交安许申请' },
          { step: 5, title: '领取证书', desc: '审批通过后领取安全生产许可证' }
        ],
        materials: [
          { name: '营业执照副本', required: true },
          { name: '建筑资质证书', required: true },
          { name: '三类人员考核证书', required: true },
          { name: '安全生产管理制度', required: true },
          { name: '工伤保险证明', required: true }
        ],
        faq: [
          { q: '安许和建筑资质的关系？', a: '需要先取得建筑资质证书，才能申请安全生产许可证，两者缺一不可。' }
        ]
      }
    ]
  },
  {
    category: 'dljz',
    categoryName: '代理记账',
    services: [
      {
        name: '小规模代理记账',
        description: '小规模纳税人月度/季度记账报税服务，专业会计一对多服务',
        icon: '📒',
        basePrice: 200,
        timeDesc: '每月按时完成',
        isHot: true,
        process: [
          { step: 1, title: '签订合同', desc: '确认服务内容和费用' },
          { step: 2, title: '票据交接', desc: '按月提供原始票据和银行流水' },
          { step: 3, title: '账务处理', desc: '专业会计进行凭证编制和账务处理' },
          { step: 4, title: '纳税申报', desc: '按时完成各税种申报' },
          { step: 5, title: '报表反馈', desc: '提供财务报表和纳税情况反馈' }
        ],
        materials: [
          { name: '营业执照副本', required: true },
          { name: '银行开户许可证', required: true },
          { name: '每月原始票据', required: true },
          { name: '银行对账单', required: true }
        ],
        faq: [
          { q: '代理记账包含哪些服务？', a: '包含凭证编制、账簿登记、纳税申报、年度汇算清缴、工商年报等。' },
          { q: '每月什么时候提供票据？', a: '建议每月5号前提供上月原始票据，以便按时完成申报。' }
        ]
      },
      {
        name: '一般纳税人代理记账',
        description: '一般纳税人月度记账报税服务，含进项认证、专票管理',
        icon: '📗',
        basePrice: 500,
        timeDesc: '每月按时完成',
        isHot: false,
        process: [
          { step: 1, title: '签订合同', desc: '确认服务内容和费用' },
          { step: 2, title: '票据交接', desc: '按月提供进销项票据和银行流水' },
          { step: 3, title: '进项认证', desc: '勾选确认进项发票进行抵扣' },
          { step: 4, title: '账务处理', desc: '编制凭证和登记账簿' },
          { step: 5, title: '纳税申报', desc: '完成增值税及附加税申报' },
          { step: 6, title: '报表反馈', desc: '提供财务报表和税务情况分析' }
        ],
        materials: [
          { name: '营业执照副本', required: true },
          { name: '银行开户许可证', required: true },
          { name: '每月进销项发票', required: true },
          { name: '银行对账单', required: true },
          { name: '工资表', required: true }
        ],
        faq: [
          { q: '一般纳税人代理记账和小规模有什么区别？', a: '一般纳税人涉及进项抵扣、专票管理，账务处理更复杂，费用相对较高。' }
        ]
      }
    ]
  }
];

// ==================== Banner 数据 ====================
const banners = [
  {
    title: '工商注册',
    subtitle: '专业代办，快速拿证',
    imageUrl: '/images/banner-gszc.png',
    linkType: 'service',
    linkValue: 'gszc',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    sortOrder: 1
  },
  {
    title: '资质办理',
    subtitle: '一站式资质解决方案',
    imageUrl: '/images/banner-zzbl.png',
    linkType: 'service',
    linkValue: 'zzbl',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    sortOrder: 2
  },
  {
    title: '代理记账',
    subtitle: '省心省力，专业可靠',
    imageUrl: '/images/banner-dljz.png',
    linkType: 'service',
    linkValue: 'dljz',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    sortOrder: 3
  }
];

// ==================== 协议数据 ====================
const agreements = [
  {
    type: 'privacy',
    title: '隐私政策',
    version: '1.0',
    content: `企服外勤代办宝隐私政策

更新日期：2026年1月1日
生效日期：2026年1月1日

一、信息收集
我们在您使用本服务时，可能会收集以下信息：
1. 注册信息：微信授权获取的昵称、头像等基本信息；
2. 身份信息：办理业务所需的姓名、身份证号、手机号等；
3. 业务信息：您提交的订单、地址、材料等业务相关数据；
4. 设备信息：设备型号、操作系统版本等。

二、信息使用
我们收集的信息将用于：
1. 提供和维护我们的服务；
2. 处理您的业务订单；
3. 改善用户体验；
4. 遵守法律法规要求。

三、信息保护
我们采用行业标准的安全措施保护您的个人信息，包括但不限于数据加密、访问控制等。

四、信息共享
未经您的同意，我们不会与第三方共享您的个人信息，但以下情况除外：
1. 法律法规要求；
2. 服务提供商（如云存储服务）；
3. 您授权的第三方。

五、您的权利
您有权访问、更正、删除您的个人信息，并可撤回授权同意。

六、联系我们
如对本隐私政策有任何疑问，请通过应用内客服与我们联系。`
  },
  {
    type: 'service',
    title: '服务协议',
    version: '1.0',
    content: `企服外勤代办宝服务协议

更新日期：2026年1月1日
生效日期：2026年1月1日

一、服务内容
企服外勤代办宝为企业及个人提供工商注册、资质办理、税务备案、证照年审、变更注销、建筑资质、代理记账等代办服务的信息平台。

二、服务说明
1. 本平台为信息撮合平台，连接用户与外勤代办人员；
2. 具体服务由认证外勤员提供，平台负责质量监督；
3. 服务价格以报价为准，平台展示价格为参考价。

三、用户权利与义务
1. 用户应提供真实、准确的信息和材料；
2. 用户应按时支付服务费用；
3. 用户有权对服务进行评价。

四、外勤员权利与义务
1. 外勤员需通过实名认证和资质审核；
2. 外勤员应按约定时间和标准完成服务；
3. 外勤员应保护用户隐私和商业秘密。

五、费用与退款
1. 服务费用在报价确认后支付；
2. 因外勤员原因导致服务无法完成的，全额退款；
3. 因用户原因取消订单的，按实际发生费用结算。

六、免责声明
1. 因政府部门原因导致延误的，平台不承担责任；
2. 因不可抗力导致服务无法完成的，双方协商解决。

七、争议解决
因本协议产生的争议，双方应友好协商解决；协商不成的，提交当地仲裁委员会仲裁。`
  }
];

// ==================== 系统配置数据 ====================
const systemConfigs = [
  { key: 'app_name', value: '企服外勤代办宝', description: '应用名称' },
  { key: 'app_version', value: '1.0.0', description: '应用版本' },
  { key: 'customer_service_url', value: 'https://kf.qfwq.com', description: '客服链接' },
  { key: 'city', value: '广州', description: '默认服务城市' },
  { key: 'order_cancel_hours', value: '24', description: '订单可取消时长(小时)' },
  { key: 'quote_expire_hours', value: '48', description: '报价过期时长(小时)' },
  { key: 'review_enabled', value: 'true', description: '是否开启评价功能' },
  { key: 'upload_max_size', value: '10485760', description: '上传文件最大字节数(10MB)' }
];

// ==================== 主函数 ====================
async function main() {
  console.log('🌱 开始播种数据...\n');

  let sortOrder = 0;

  // 播种服务数据
  for (const cat of serviceCategories) {
    for (const svc of cat.services) {
      sortOrder++;
      const service = await prisma.service.upsert({
        where: { id: sortOrder },
        update: {
          name: svc.name,
          category: cat.category,
          categoryName: cat.categoryName,
          description: svc.description,
          icon: svc.icon,
          basePrice: svc.basePrice,
          timeDesc: svc.timeDesc,
          isHot: svc.isHot,
          sortOrder: sortOrder,
          process: svc.process,
          materials: svc.materials,
          faq: svc.faq,
          detail: {
            description: svc.description,
            price: svc.basePrice,
            time: svc.timeDesc
          }
        },
        create: {
          name: svc.name,
          category: cat.category,
          categoryName: cat.categoryName,
          description: svc.description,
          icon: svc.icon,
          basePrice: svc.basePrice,
          timeDesc: svc.timeDesc,
          isHot: svc.isHot,
          sortOrder: sortOrder,
          process: svc.process,
          materials: svc.materials,
          faq: svc.faq,
          detail: {
            description: svc.description,
            price: svc.basePrice,
            time: svc.timeDesc
          }
        }
      });
      console.log(`  ✅ 服务: ${svc.name} (${cat.categoryName}) - ID: ${service.id}`);
    }
  }

  // 播种 Banner 数据
  for (const banner of banners) {
    const b = await prisma.banner.upsert({
      where: { id: banner.sortOrder },
      update: banner,
      create: banner
    });
    console.log(`  ✅ Banner: ${b.title} - ID: ${b.id}`);
  }

  // 播种协议数据
  for (const agreement of agreements) {
    const a = await prisma.agreement.upsert({
      where: { type: agreement.type },
      update: {
        title: agreement.title,
        content: agreement.content,
        version: agreement.version
      },
      create: agreement
    });
    console.log(`  ✅ 协议: ${a.title} (${a.type}) - ID: ${a.id}`);
  }

  // 播种系统配置
  for (const config of systemConfigs) {
    const c = await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {
        value: config.value,
        description: config.description
      },
      create: config
    });
    console.log(`  ✅ 配置: ${c.key} = ${c.value} - ID: ${c.id}`);
  }

  console.log('\n🎉 种子数据播种完成！');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据播种失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
