/**
 * 服务控制器 - 企服外勤代办宝
 * 服务分类、列表、详情、流程、材料、FAQ、价格、热门、搜索
 */
const { prisma } = require('../config/database');
const { success, error, successWithPaginate } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const redis = require('../config/redis');

// 缓存key前缀
const CACHE_PREFIX = 'cache:service';

/**
 * 获取服务分类列表
 * GET /service/categories
 * 结果缓存到Redis 1小时
 */
const getCategories = asyncHandler(async (req, res) => {
  const cacheKey = `${CACHE_PREFIX}:categories`;

  // 尝试从缓存获取
  const cached = await redis.get(cacheKey);
  if (cached) {
    return success(res, cached, '获取分类列表成功');
  }

  try {
    const categories = await prisma.service.findMany({
      where: { status: 1 },
      select: {
        category: true,
        categoryName: true
      },
      distinct: ['category'],
      orderBy: { category: 'asc' }
    });

    const result = categories.map(c => ({
      category: c.category,
      categoryName: c.categoryName
    }));

    // 缓存1小时
    await redis.set(cacheKey, result, 3600);

    return success(res, result, '获取分类列表成功');
  } catch (err) {
    logger.error('获取服务分类失败', { error: err.message });
    return error(res, '获取服务分类失败', 500);
  }
});

/**
 * 获取服务列表
 * GET /service/list
 * 支持参数：category(分类筛选)、sort(排序)、page/pageSize
 */
const getList = asyncHandler(async (req, res) => {
  const {
    category,
    sort = 'default',
    page = 1,
    pageSize = 20
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));

  // 构建查询条件
  const where = { status: 1 };
  if (category) {
    where.category = category;
  }

  // 排序逻辑
  let orderBy;
  switch (sort) {
    case 'price_asc':
      orderBy = { basePrice: 'asc' };
      break;
    case 'price_desc':
      orderBy = { basePrice: 'desc' };
      break;
    case 'sales':
      orderBy = { orderCount: 'desc' };
      break;
    case 'default':
    default:
      orderBy = [{ sortOrder: 'asc' }, { id: 'asc' }];
      break;
  }

  try {
    const [list, total] = await Promise.all([
      prisma.service.findMany({
        where,
        select: {
          id: true,
          name: true,
          category: true,
          categoryName: true,
          icon: true,
          imageUrl: true,
          basePrice: true,
          timeDesc: true,
          region: true,
          orderCount: true,
          isHot: true,
          sortOrder: true
        },
        orderBy,
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum
      }),
      prisma.service.count({ where })
    ]);

    return successWithPaginate(res, list, total, pageNum, pageSizeNum, '获取服务列表成功');
  } catch (err) {
    logger.error('获取服务列表失败', { error: err.message, category, sort });
    return error(res, '获取服务列表失败', 500);
  }
});

/**
 * 获取服务详情
 * GET /service/detail/:id
 */
const getDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const service = await prisma.service.findFirst({
      where: {
        id: BigInt(id),
        status: 1
      }
    });

    if (!service) {
      return error(res, '服务不存在', 404, 404);
    }

    return success(res, service, '获取服务详情成功');
  } catch (err) {
    logger.error('获取服务详情失败', { error: err.message, id });
    return error(res, '获取服务详情失败', 500);
  }
});

/**
 * 获取服务流程
 * GET /service/process/:id
 */
const getProcess = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const service = await prisma.service.findFirst({
      where: {
        id: BigInt(id),
        status: 1
      },
      select: {
        id: true,
        name: true,
        process: true
      }
    });

    if (!service) {
      return error(res, '服务不存在', 404, 404);
    }

    return success(res, {
      id: service.id,
      name: service.name,
      process: service.process
    }, '获取服务流程成功');
  } catch (err) {
    logger.error('获取服务流程失败', { error: err.message, id });
    return error(res, '获取服务流程失败', 500);
  }
});

/**
 * 获取所需材料
 * GET /service/materials/:id
 */
const getMaterials = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const service = await prisma.service.findFirst({
      where: {
        id: BigInt(id),
        status: 1
      },
      select: {
        id: true,
        name: true,
        materials: true
      }
    });

    if (!service) {
      return error(res, '服务不存在', 404, 404);
    }

    return success(res, {
      id: service.id,
      name: service.name,
      materials: service.materials
    }, '获取所需材料成功');
  } catch (err) {
    logger.error('获取所需材料失败', { error: err.message, id });
    return error(res, '获取所需材料失败', 500);
  }
});

/**
 * 获取常见问题
 * GET /service/faq/:id
 */
const getFAQ = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const service = await prisma.service.findFirst({
      where: {
        id: BigInt(id),
        status: 1
      },
      select: {
        id: true,
        name: true,
        faq: true
      }
    });

    if (!service) {
      return error(res, '服务不存在', 404, 404);
    }

    return success(res, {
      id: service.id,
      name: service.name,
      faq: service.faq
    }, '获取常见问题成功');
  } catch (err) {
    logger.error('获取常见问题失败', { error: err.message, id });
    return error(res, '获取常见问题失败', 500);
  }
});

/**
 * 获取价格信息
 * GET /service/pricing/:id
 */
const getPricing = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const service = await prisma.service.findFirst({
      where: {
        id: BigInt(id),
        status: 1
      },
      select: {
        id: true,
        name: true,
        basePrice: true,
        detail: true
      }
    });

    if (!service) {
      return error(res, '服务不存在', 404, 404);
    }

    // 返回基础价格 + 可能的阶梯价格（从detail中提取）
    const pricing = {
      id: service.id,
      name: service.name,
      basePrice: service.basePrice,
      pricingDetail: service.detail?.pricing || null
    };

    return success(res, pricing, '获取价格信息成功');
  } catch (err) {
    logger.error('获取价格信息失败', { error: err.message, id });
    return error(res, '获取价格信息失败', 500);
  }
});

/**
 * 获取热门服务列表
 * GET /service/hot
 * 结果缓存到Redis 30分钟
 */
const getHot = asyncHandler(async (req, res) => {
  const cacheKey = `${CACHE_PREFIX}:hot`;

  // 尝试从缓存获取
  const cached = await redis.get(cacheKey);
  if (cached) {
    return success(res, cached, '获取热门服务成功');
  }

  try {
    const list = await prisma.service.findMany({
      where: {
        status: 1,
        isHot: true
      },
      select: {
        id: true,
        name: true,
        category: true,
        categoryName: true,
        icon: true,
        imageUrl: true,
        basePrice: true,
        timeDesc: true,
        region: true,
        orderCount: true,
        isHot: true
      },
      orderBy: { sortOrder: 'asc' }
    });

    // 缓存30分钟
    await redis.set(cacheKey, list, 1800);

    return success(res, list, '获取热门服务成功');
  } catch (err) {
    logger.error('获取热门服务失败', { error: err.message });
    return error(res, '获取热门服务失败', 500);
  }
});

/**
 * 搜索服务
 * GET /service/search
 * 参数 keyword，模糊搜索 name + description
 */
const search = asyncHandler(async (req, res) => {
  const { keyword, page = 1, pageSize = 20 } = req.query;

  if (!keyword || keyword.trim() === '') {
    return error(res, '请输入搜索关键词', 400, 400);
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
  const trimmedKeyword = keyword.trim();

  const where = {
    status: 1,
    OR: [
      { name: { contains: trimmedKeyword } },
      { description: { contains: trimmedKeyword } }
    ]
  };

  try {
    const [list, total] = await Promise.all([
      prisma.service.findMany({
        where,
        select: {
          id: true,
          name: true,
          category: true,
          categoryName: true,
          icon: true,
          imageUrl: true,
          basePrice: true,
          timeDesc: true,
          region: true,
          orderCount: true,
          isHot: true
        },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum
      }),
      prisma.service.count({ where })
    ]);

    return successWithPaginate(res, list, total, pageNum, pageSizeNum, '搜索服务成功');
  } catch (err) {
    logger.error('搜索服务失败', { error: err.message, keyword });
    return error(res, '搜索服务失败', 500);
  }
});

module.exports = {
  getCategories,
  getList,
  getDetail,
  getProcess,
  getMaterials,
  getFAQ,
  getPricing,
  getHot,
  search
};
