# Pixel Atlas · 像素生活工作室

生成日期：2026 年 10 月 12 日。使用 `imagegen` skill 和 **内置图片生成工具**，不是 CLI 或替代方案。8 张原创位图均无外部参考图。城市、自然、人文和铁路共同组成一个生活环境，铁路不再承担全部装饰。

## 文件与用途

| 素材 | 保存路径 | 尺寸 | 字节 | 使用位置 |
| --- | --- | --- | ---: | --- |
| 河岸小城 | [goalpilot-world-harbor-v1.webp](goalpilot-world-harbor-v1.webp) | 1536 × 512 | 373,042 | 登录全景、默认工作台环境、目标封面 |
| 花园漫步 | [goalpilot-world-garden-v1.webp](goalpilot-world-garden-v1.webp) | 1536 × 512 | 442,122 | 待办全景、工作室可选风景、目标封面 |
| 蓝调夜行 | [goalpilot-world-night-rail-v1.webp](goalpilot-world-night-rail-v1.webp) | 1536 × 512 | 334,606 | 工作室可选风景、目标封面 |
| 河畔花园 | [goalpilot-world-garden-edge-v1.webp](goalpilot-world-garden-edge-v1.webp) | 512 × 768 | 212,760 | 工作台左侧街景、健康灵感小插画 |
| 街角花铺 | [goalpilot-world-neighborhood-edge-v1.webp](goalpilot-world-neighborhood-edge-v1.webp) | 512 × 768 | 188,554 | 工作台右侧街景 |
| 原野列车 | [goalpilot-world-viaduct-v1.webp](goalpilot-world-viaduct-v1.webp) | 1536 × 512 | 289,464 | 工作台底部连接城市与自然的横向景观 |
| 日常书桌 | [goalpilot-world-desk-v1.webp](goalpilot-world-desk-v1.webp) | 640 × 640 | 140,938 | 登录页、任务编辑区、职业灵感 |
| 树下书屋 | [goalpilot-world-reading-nook-v1.webp](goalpilot-world-reading-nook-v1.webp) | 640 × 640 | 186,050 | Agent 欢迎页、目标空状态、学习灵感 |

## 输出处理与呈现约定

- 三张全景生成时为 2172 × 724；两张竖向透明插画为 1024 × 1536；两张方形透明插画为 1280 × 1280。横向铁路透明插画为 2172 × 724。
- 浏览器 Canvas 仅用于等比例最近邻缩放和 WebP 编码（quality 0.90），未绘制、补画、合成、调色或裁剪。五张透明资产保留 alpha；所有最终图片各小于 500 KB，合计约 2.17 MB。
- 完整原始 PNG 未被修改，保存在以下各条记录的生成路径。
- `WorldArt.vue` 统一加载，装饰图使用空 alt、`aria-hidden` 和禁用指针事件。所有真实文字、状态、计数、按钮仍使用 HTML。
- 用户通过顶部「风景」切换河岸 / 花园 / 蓝调场景；只在本地保存视觉偏好，不调用 API，不改变草稿、目标、任务或聊天。
- 专注模式隐藏场景和插画；没有自动轮播或持续装饰动画。动效遵循系统减少动态效果设置。
- 仅像素标牌与部分数字使用本地 Silkscreen。中文正文保持无衬线字体，不栅格化正文或用图片替代内容。

## 完整生成提示词

### 河岸小城

最终文件：[goalpilot-world-harbor-v1.webp](goalpilot-world-harbor-v1.webp)

原始 PNG：`/home/qijx/.codex/generated_images/01a028d1-8288-7641-ba65-3d41b3f9a73d/exec-8c259ad5-2a90-4dc7-bd48-65574aa1e70b.png`

透明背景参数：`false`

```text
Use case: stylized-concept. Original finished bitmap artwork for GoalPilot, a refined pixel-art productivity workspace. Handcrafted 16-bit environmental pixel art, deliberate visible square pixel clusters and stepped silhouettes, coherent scale, no blur, no smooth 3D render, no photorealism. Restrained deep spruce green, sage, cream sandstone, muted teal water, slate blue and warm honey light, comfortable contrast and exquisite small environmental details. Architecture, nature, everyday human life and gentle industrial transport belong to the same calm lived-in world. Absolutely no text, no numbers, no logos, no watermark, no interface elements. Asset type: 3:1 wide panoramic scene, full bleed, for a login illustration and collectible goal-card covers. A lively riverside neighborhood at golden hour: narrow cream and soft terracotta buildings, little cafes, potted gardens, a small arched stone bridge over shimmering water, trees and distant hills. Tiny people walking and sitting beside the river, a cyclist, a small ferry. Elegant steel railway viaduct and a short cream-and-green tram integrated on the far right, not the central subject. View across the river from an elevated promenade, atmospheric layered distance, blue-green shadows, apricot sky. Continuous horizontal composition with buildings and water in the central band, no dominant blank sky. No text or signs.
```

### 花园漫步

最终文件：[goalpilot-world-garden-v1.webp](goalpilot-world-garden-v1.webp)

原始 PNG：`/home/qijx/.codex/generated_images/01a028d1-8288-7641-ba65-3d41b3f9a73d/exec-030f47a9-4d41-492b-9858-5816daccd964.png`

透明背景参数：`false`

```text
Use case: stylized-concept. Original finished bitmap artwork for GoalPilot, a refined pixel-art productivity workspace. Handcrafted 16-bit environmental pixel art, deliberate visible square pixel clusters and stepped silhouettes, coherent scale, no blur, no smooth 3D render, no photorealism. Restrained deep spruce green, sage, cream sandstone, muted teal water, slate blue and warm honey light, comfortable contrast and exquisite small environmental details. Architecture, nature, everyday human life and gentle industrial transport belong to the same calm lived-in world. Absolutely no text, no numbers, no logos, no watermark, no interface elements. Asset type: 3:1 wide panoramic full-bleed scene for a ToDo cover and world theme. Morning in a verdant botanical park nestled inside a small city: a delicate iron-and-glass greenhouse, a winding stream and footbridge, large deciduous trees, flowering meadow, cream townhouses in the distance. Tiny gardeners, a reader on a bench, two people walking their bicycles. Lush nature occupies two thirds of the composition and human architecture one third. Soft warm ivory daylight, richly varied green pixel clusters, pale blue water. Horizontal continuous composition, eye-level establishing view, no large empty sky. No trains in this scene.
```

### 蓝调夜行

最终文件：[goalpilot-world-night-rail-v1.webp](goalpilot-world-night-rail-v1.webp)

原始 PNG：`/home/qijx/.codex/generated_images/01a028d1-8288-7641-ba65-3d41b3f9a73d/exec-243b54b2-a3a7-4b88-8e7b-6eb86d8370db.png`

透明背景参数：`false`

```text
Use case: stylized-concept. Original finished bitmap artwork for GoalPilot, a refined pixel-art productivity workspace. Handcrafted 16-bit environmental pixel art, deliberate visible square pixel clusters and stepped silhouettes, coherent scale, no blur, no smooth 3D render, no photorealism. Restrained deep spruce green, sage, cream sandstone, muted teal water, slate blue and warm honey light, comfortable contrast and exquisite small environmental details. Architecture, nature, everyday human life and gentle industrial transport belong to the same calm lived-in world. Absolutely no text, no numbers, no logos, no watermark, no interface elements. Asset type: 3:1 wide panoramic full-bleed scene for a quiet evening world theme and library cover. Blue-hour hillside town beside a winding river, warm lit apartment windows and a little observatory on a wooded hill. A cream-and-teal electric train crosses a graceful iron railway bridge in the lower-middle distance, small waiting figures near a tiny station on the right. Terraced gardens, tall trees, stone stairways, a little bookshop with glowing windows on the left. Twilight is gentle desaturated blue, not black; warm honey interior lights, calm water reflections, a few restrained pixel stars. Nature and inhabited town are equally present, railway meaningful but not dominant. No signage.
```

### 河畔花园

最终文件：[goalpilot-world-garden-edge-v1.webp](goalpilot-world-garden-edge-v1.webp)

原始 PNG：`/home/qijx/.codex/generated_images/01a028d1-8288-7641-ba65-3d41b3f9a73d/exec-53f61207-6c91-424e-b068-e8645ba1e7ac.png`

透明背景参数：`true`

```text
Use case: stylized-concept. Original finished bitmap artwork for GoalPilot, a refined pixel-art productivity workspace. Handcrafted 16-bit environmental pixel art, deliberate visible square pixel clusters and stepped silhouettes, coherent scale, no blur, no smooth 3D render, no photorealism. Restrained deep spruce green, sage, cream sandstone, muted teal water, slate blue and warm honey light, comfortable contrast and exquisite small environmental details. Architecture, nature, everyday human life and gentle industrial transport belong to the same calm lived-in world. Absolutely no text, no numbers, no logos, no watermark, no interface elements. Asset type: tall transparent cutout scene to frame the LEFT edge of a centered chat workspace; canvas portrait 2:3. A complete compact slice of a riverside garden: a tall leafy tree with its canopy curving gently to the right, stone steps descending through flowers, reeds and a small pond, a wooden bench with a tiny reader and bicycle. Deliberate profile/three-quarter game environment view, not a symmetrical isometric square island. Scene concentrated on the left, with irregular organic silhouette and small sprigs reaching right. All objects fully in frame with transparent margin. Genuine transparent alpha outside the vignette, no sky, no rectangular platform, no artificial background or shadow beyond the vignette.
```

### 街角花铺

最终文件：[goalpilot-world-neighborhood-edge-v1.webp](goalpilot-world-neighborhood-edge-v1.webp)

原始 PNG：`/home/qijx/.codex/generated_images/01a028d1-8288-7641-ba65-3d41b3f9a73d/exec-3db51870-b268-4f7a-8af1-88285bc1f8a6.png`

透明背景参数：`true`

```text
Use case: stylized-concept. Original finished bitmap artwork for GoalPilot, a refined pixel-art productivity workspace. Handcrafted 16-bit environmental pixel art, deliberate visible square pixel clusters and stepped silhouettes, coherent scale, no blur, no smooth 3D render, no photorealism. Restrained deep spruce green, sage, cream sandstone, muted teal water, slate blue and warm honey light, comfortable contrast and exquisite small environmental details. Architecture, nature, everyday human life and gentle industrial transport belong to the same calm lived-in world. Absolutely no text, no numbers, no logos, no watermark, no interface elements. Asset type: tall transparent cutout scene to frame the RIGHT edge of a centered chat workspace; portrait 2:3. A charming compact stack of two adjoining cream-stone and faded coral neighborhood buildings, blue-grey tiled roofs, small balconies with plants, a green awning over a flower stand, tiny stairway, one little person and a bicycle below. Large lush tree behind the buildings balances the architecture. Three-quarter game environment view, full complete silhouette, composition slightly right weighted with stairway reaching left. Genuine transparent alpha around every outer contour, no sky, no rectangular base, no detached shadow, no lettering on windows or awnings.
```

### 原野列车

最终文件：[goalpilot-world-viaduct-v1.webp](goalpilot-world-viaduct-v1.webp)

原始 PNG：`/home/qijx/.codex/generated_images/01a028d1-8288-7641-ba65-3d41b3f9a73d/exec-9d4ac446-85a3-48b6-a748-c3dc9842a52b.png`

透明背景参数：`true`

```text
Use case: stylized-concept. Original finished bitmap artwork for GoalPilot, a refined pixel-art productivity workspace. Handcrafted 16-bit environmental pixel art, deliberate visible square pixel clusters and stepped silhouettes, coherent scale, no blur, no smooth 3D render, no photorealism. Restrained deep spruce green, sage, cream sandstone, muted teal water, slate blue and warm honey light, comfortable contrast and exquisite small environmental details. Architecture, nature, everyday human life and gentle industrial transport belong to the same calm lived-in world. Absolutely no text, no numbers, no logos, no watermark, no interface elements. Asset type: wide 3:1 transparent footer/environment cutout. A low continuous slice of a green river valley, a graceful short five-arch sandstone railway viaduct, one compact cream-and-teal electric train crossing it, meadow flowers and bushes, little riverside footpath with two tiny walkers and a blue stream beneath. Shallow panoramic side/elevated view, entire train and bridge fully visible, maximum scene height stays low across the canvas. Genuine transparent alpha above and around the irregular ground silhouette, no sky or rectangular platform, no separate vignettes, no outer frame. Train and bridge occupy only half of width, meadow and riverside life complete the other half.
```

### 日常书桌

最终文件：[goalpilot-world-desk-v1.webp](goalpilot-world-desk-v1.webp)

原始 PNG：`/home/qijx/.codex/generated_images/01a028d1-8288-7641-ba65-3d41b3f9a73d/exec-5970bd58-bd8c-4803-ad85-5bf14460363b.png`

透明背景参数：`true`

```text
Use case: stylized-concept. Original finished bitmap artwork for GoalPilot, a refined pixel-art productivity workspace. Handcrafted 16-bit environmental pixel art, deliberate visible square pixel clusters and stepped silhouettes, coherent scale, no blur, no smooth 3D render, no photorealism. Restrained deep spruce green, sage, cream sandstone, muted teal water, slate blue and warm honey light, comfortable contrast and exquisite small environmental details. Architecture, nature, everyday human life and gentle industrial transport belong to the same calm lived-in world. Absolutely no text, no numbers, no logos, no watermark, no interface elements. Asset type: square transparent miniature still-life used in a task editor and welcome panel. A small oak writing desk with an open cream notebook with blank pages, a compact muted blue laptop, a ceramic cup, an adjustable brass desk lamp and a little potted fern; a worn wooden chair half tucked under it. A few blank paper sheets and colored pencils suggest thoughtful work. Gentle three-quarter game environment perspective, warm light, precise pixel craftsmanship, simple readable silhouette at 130 CSS pixels. Genuine transparent alpha all around, no room, no wall, no floor rectangle, no cast shadow outside object, no text on notebook or laptop.
```

### 树下书屋

最终文件：[goalpilot-world-reading-nook-v1.webp](goalpilot-world-reading-nook-v1.webp)

原始 PNG：`/home/qijx/.codex/generated_images/01a028d1-8288-7641-ba65-3d41b3f9a73d/exec-60fbf2f9-a8c8-44a5-b57f-10a97618bc60.png`

透明背景参数：`true`

```text
Use case: stylized-concept. Original finished bitmap artwork for GoalPilot, a refined pixel-art productivity workspace. Handcrafted 16-bit environmental pixel art, deliberate visible square pixel clusters and stepped silhouettes, coherent scale, no blur, no smooth 3D render, no photorealism. Restrained deep spruce green, sage, cream sandstone, muted teal water, slate blue and warm honey light, comfortable contrast and exquisite small environmental details. Architecture, nature, everyday human life and gentle industrial transport belong to the same calm lived-in world. Absolutely no text, no numbers, no logos, no watermark, no interface elements. Asset type: square transparent cutout vignette for a goal library empty state and conversation welcome. A small outdoor bookstall with a short wooden shelf of colorful blank-spine books, a leafy tree arching overhead, a cream bench with one tiny person reading, a terracotta planter and a sleeping ginger cat. Beautiful asymmetrical compact silhouette, human-scale neighborhood corner, three-quarter pixel game view. Minimal irregular paving beneath objects, genuine transparent alpha outside vignette, no building walls or background, no rectangular platform, no text or labels. Readable and charming at 130–190 CSS pixels.
```
