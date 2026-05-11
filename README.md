# GTA6 攻略指南网站

这是一个完整的GTA6游戏攻略网站，采用现代化的设计风格，具有丰富的交互效果。

## 功能特性

### 主要板块
- **首页** - 游戏概览和统计数据展示
- **剧情攻略** - 主线剧情时间线
- **任务指南** - 分类任务卡片（主线/支线/抢劫/陌生人）
- **角色介绍** - 主要角色属性和背景
- **载具图鉴** - 各类载具分类展示和属性对比
- **武器库** - 武器分类和属性介绍
- **秘籍技巧** - 游戏技巧和控制台秘籍
- **地图探索** - 区域介绍和地点图例

### 技术特性
- 响应式设计，支持移动端和桌面端
- 粒子动画背景
- 故障艺术风格标题
- 滚动动画效果
- 数据过滤和分类功能
- 平滑滚动导航
- 深色主题设计

## 文件结构

```
gta6-guide/
├── index.html      # 主HTML文件
├── styles.css      # CSS样式文件
├── script.js       # JavaScript交互脚本
├── start.sh        # 启动脚本
├── README.md       # 说明文档
└── images/         # 真实图片素材
    ├── hero-bg.jpg           # 首页背景 - 迈阿密城市夜景
    ├── vice-city-neon.jpg    # Vice City 霓虹城市横幅
    ├── mission-welcome.jpg   # 任务: 欢迎来到Vice City
    ├── mission-heist.jpg     # 任务: 世纪大劫案
    ├── mission-race.jpg      # 任务: 街头赛车
    ├── mission-stranger.jpg  # 任务: 神秘陌生人
    ├── mission-turf.jpg      # 任务: 权力争夺
    ├── mission-jewel.jpg     # 任务: 珠宝店劫案
    ├── char-jason.jpg        # 角色: Jason Cole
    ├── char-luna.jpg         # 角色: Luna Rodriguez
    ├── char-vinnie.jpg       # 角色: Vincent Malone
    ├── vehicle-sports.jpg    # 载具: 跑车
    ├── vehicle-muscle.jpg    # 载具: 肌肉车
    ├── vehicle-motorcycle.jpg # 载具: 摩托车
    ├── vehicle-boat.jpg      # 载具: 快艇
    ├── vehicle-aircraft.jpg  # 载具: 飞机
    ├── vehicle-suv.jpg       # 载具: SUV
    ├── weapon-pistol.jpg     # 武器: 手枪
    ├── weapon-rifle.jpg      # 武器: 突击步枪
    ├── weapon-sniper.jpg     # 武器: 狙击步枪
    └── map-bg.jpg            # 地图探索背景
```

### 图片来源
所有图片均来自 Unsplash (免费商用授权)，主题匹配 Miami/Vice City 风格。

## 使用方法

### 方法1: 直接打开
1. 在文件管理器中找到 `index.html` 文件
2. 双击打开即可在浏览器中查看

### 方法2: 使用本地服务器
1. 确保安装了Python
2. 在命令行中进入项目目录
3. 运行以下命令：
   ```bash
   # Python 3
   python -m http.server 8000
   
   # 或者使用Node.js的http-server
   npx http-server
   ```
4. 在浏览器中访问 `http://localhost:8000`

### 方法3: 使用VS Code Live Server
1. 安装VS Code的Live Server扩展
2. 右键点击 `index.html`
3. 选择 "Open with Live Server"

## 自定义修改

### 修改颜色主题
在 `styles.css` 文件的 `:root` 部分修改CSS变量：

```css
:root {
    --primary: #ff6b00;      /* 主要颜色 */
    --secondary: #00d4ff;    /* 次要颜色 */
    --accent: #ff00ff;       /* 强调颜色 */
    --dark: #0a0a0a;         /* 深色背景 */
    --light: #ffffff;        /* 浅色文字 */
}
```

### 添加新任务
在 `index.html` 的任务部分添加新的任务卡片：

```html
<div class="mission-card" data-category="main">
    <div class="mission-image">
        <div class="mission-overlay">
            <span class="difficulty">★★★☆☆</span>
        </div>
    </div>
    <div class="mission-info">
        <h3>任务名称</h3>
        <p>任务描述</p>
        <div class="mission-meta">
            <span class="reward">奖励: $XX,XXX</span>
            <span class="unlock">解锁: 内容</span>
        </div>
    </div>
</div>
```

### 添加新载具
在 `index.html` 的载具部分添加新的载具卡片：

```html
<div class="vehicle-card" data-category="sports">
    <div class="vehicle-image">
        <img src="images/vehicle-xxx.jpg" alt="载具名称">
    </div>
    <div class="vehicle-info">
        <h3>载具名称</h3>
        <p class="vehicle-class">载具类型</p>
        <div class="vehicle-stats">
            <div class="v-stat">
                <span>速度</span>
                <div class="v-bar"><div class="v-fill" style="width: 90%"></div></div>
            </div>
            <!-- 更多属性 -->
        </div>
        <p class="vehicle-price">价格: $XXX,XXX</p>
    </div>
</div>
```

## 响应式断点

- **桌面端**: > 1024px
- **平板端**: 768px - 1024px
- **移动端**: < 768px

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 注意事项

1. 这是一个粉丝制作的攻略网站，非官方产品
2. 所有游戏内容和素材版权归Rockstar Games所有
3. 网站内容基于游戏信息整理，可能与实际游戏有差异
4. 建议在现代浏览器中使用以获得最佳体验

## 扩展建议

- 添加搜索功能
- 实现暗色/亮色主题切换
- 添加用户评论系统
- 集成游戏地图API
- 添加收藏夹功能
- 实现多语言支持

## 许可证

本项目仅供学习和参考使用。
