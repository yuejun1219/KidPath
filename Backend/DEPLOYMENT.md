# KidPath Backend Production Deployment Guide

## 🚀 部署步骤

### 1. 环境准备
```bash
# 确保生产环境有正确的环境变量
export NODE_ENV=production
export PORT=3000
export DATABASE_URL=your_production_database_url
```

### 2. CORS配置验证
确保以下域名在CORS允许列表中：
- `https://www.kidpath.me` ✅
- `https://kidpath.me` ✅
- `https://api.kidpath.me` ✅

### 3. 部署检查清单

#### A. 后端API部署
- [ ] 服务器运行在 `https://api.kidpath.me`
- [ ] 所有路由正常工作
- [ ] CORS头正确设置
- [ ] 数据库连接正常

#### B. 前端配置
- [ ] 更新为生产环境域名
- [ ] 测试所有API调用
- [ ] 验证CORS请求

### 4. 测试命令

#### 测试CORS配置
```bash
curl -H "Origin: https://www.kidpath.me" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://api.kidpath.me/api/v1/geojson/parks
```

#### 测试API端点
```bash
# 测试GeoJSON端点
curl https://api.kidpath.me/api/v1/geojson/parks
curl https://api.kidpath.me/api/v1/geojson/trees
curl https://api.kidpath.me/api/v1/geojson/grass

# 测试Amenities端点
curl "https://api.kidpath.me/api/v1/amenities/nearby?lat=-37.8136&lon=144.9631&radius=1000"
curl "https://api.kidpath.me/api/v1/amenities/bbox?bbox=144.9,-37.9,145.0,-37.8"
curl "https://api.kidpath.me/api/v1/amenities/search?name=park"
```

### 5. 常见问题解决

#### CORS问题
如果遇到CORS错误，检查：
1. 服务器CORS配置
2. 请求头设置
3. 预检请求处理

#### 404错误
如果API返回404，检查：
1. 路由配置
2. 服务器部署状态
3. 域名解析

### 6. 监控和维护

#### 健康检查
```bash
curl https://api.kidpath.me/health
```

#### 日志监控
- 检查服务器日志
- 监控错误率
- 跟踪响应时间

## 📝 注意事项

1. **安全性**: 确保生产环境使用HTTPS
2. **性能**: 考虑添加缓存和CDN
3. **监控**: 设置错误监控和性能监控
4. **备份**: 定期备份数据库
