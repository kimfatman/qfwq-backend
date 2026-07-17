/**
 * Admin 权限中间件
 * 检查用户角色是否为 admin
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function adminMiddleware(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ code: 401, message: '未登录' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true, status: true },
    });

    if (!user) {
      return res.status(401).json({ code: 401, message: '用户不存在' });
    }

    if (user.status !== 1) {
      return res.status(403).json({ code: 403, message: '账号已禁用' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ code: 403, message: '需要管理员权限' });
    }

    req.user.role = 'admin';
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({ code: 500, message: '权限验证失败' });
  }
}

module.exports = { adminMiddleware };
