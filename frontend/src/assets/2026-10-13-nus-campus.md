# NUS 校园像素主题 · 2026-10-13

使用内置 image_gen（imagegen 技能），未使用 API/CLI。以下四张为原创像素插画，不是实景照片或准确校园地图。原始生成结果保留；项目内 WebP 仅做等比缩放与编码，透明小景保留 alpha。总计约 1.65 MB。

参考： [NUS UTown 官方介绍](https://uci.nus.edu.sg/campus-life/campus-services/utown/)、
[Education Resource Centre 官方介绍](https://uci.nus.edu.sg/campus-life/campus-services/utown/education-resource-centre/)。
校园主题以草坪、学习建筑、热带树木与学生日常为主，不把虚构铁路放进校园。

| 文件 | 使用位置 | 尺寸 |
| --- | --- | --- |
| [校园全景](goalpilot-world-nus-campus-v1.webp) | 工作台、侧栏、登录、目标封面 | 1536 × 1024 |
| [草坪晨景](goalpilot-world-nus-green-v1.webp) | 待办清单、目标封面 | 1536 × 512 |
| [学习空间夜景](goalpilot-world-nus-commons-v1.webp) | 目标库、目标封面 | 1536 × 512 |
| [树下阅读小景](goalpilot-world-nus-study-v1.webp) | 会话、空状态、小装饰 | 640 × 640，透明 |

## 完整提示词

### nus-campus

保存位置：`frontend/src/assets/goalpilot-world-nus-campus-v1.webp`

原始结果：`/home/qijx/.codex/generated_images/01a028d1-8288-7641-ba65-3d41b3f9a73d/exec-e93a3f30-2a55-47eb-98d1-7b853ae24749.png`

transparent_background: `false`

```text
Use case: stylized-concept. Original bitmap scenery for GoalPilot's NUS campus theme. Intricate handcrafted 16-bit pixel art, clearly visible square pixel clusters and stepped edges, miniature architectural world, NOT photorealism or smooth 3D. Tropical jade foliage, warm ivory concrete, restrained terracotta, blue-green glass and soft amber light, consistent with a cream and deep teal productivity app. Balance nature, campus architecture and tiny everyday student life. Inspired by National University of Singapore's UTown, not an exact campus map. No text, signs, letters, numbers, labels, logos, watermarks, borders, UI, vignette, blur or washed-out overlays. Fill the composition with clear attractive details rather than empty sky. Asset: home city atlas, landscape 3:2 composition. Elevated oblique aerial view of a lush Singapore university campus: a broad central Town Green lawn framed by contemporary pale-concrete residential college towers, red-brown vertical sunshades, low horizontal education buildings with flat green roofs, shaded colonnades and a glass learning centre integrated around mature tropical rain trees. Curving pedestrian paths and steps, tiny students walking and sitting on grass, a small campus shuttle bus on the perimeter road, distant forested Kent Ridge and a modest city skyline. Clear blue sky occupies only a narrow upper edge, golden late-afternoon sun, rich but harmonious detail across the entire canvas. Full campus composition visible, no collage.
```

### nus-green

保存位置：`frontend/src/assets/goalpilot-world-nus-green-v1.webp`

原始结果：`/home/qijx/.codex/generated_images/01a028d1-8288-7641-ba65-3d41b3f9a73d/exec-530b6c0a-d428-41a0-8318-d95d1c505b0e.png`

transparent_background: `false`

```text
Use case: stylized-concept. Original bitmap scenery for GoalPilot's NUS campus theme. Intricate handcrafted 16-bit pixel art, clearly visible square pixel clusters and stepped edges, miniature architectural world, NOT photorealism or smooth 3D. Tropical jade foliage, warm ivory concrete, restrained terracotta, blue-green glass and soft amber light, consistent with a cream and deep teal productivity app. Balance nature, campus architecture and tiny everyday student life. Inspired by National University of Singapore's UTown, not an exact campus map. No text, signs, letters, numbers, labels, logos, watermarks, borders, UI, vignette, blur or washed-out overlays. Fill the composition with clear attractive details rather than empty sky. Asset: panoramic task page artwork, very wide horizontal 3:1 composition. Eye-level-to-slightly-elevated view across NUS UTown-inspired Town Green: softly sloping bright green lawn, grand mature rain trees at the edges, pale low-rise Education Resource Centre-inspired building with glass learning spaces and long shaded walkways, residential-college towers peeking behind, a few tiny students reading on grass and walking together, bicycles parked by a covered path. Calm tropical morning light, clear depth and detail, little sky. Main scenery occupies central horizontal band so a shallow banner still shows greenery and buildings. No trains across the campus lawn.
```

### nus-commons

保存位置：`frontend/src/assets/goalpilot-world-nus-commons-v1.webp`

原始结果：`/home/qijx/.codex/generated_images/01a028d1-8288-7641-ba65-3d41b3f9a73d/exec-1df45876-e7a9-4036-b09c-a7db1b331c89.png`

transparent_background: `false`

```text
Use case: stylized-concept. Original bitmap scenery for GoalPilot's NUS campus theme. Intricate handcrafted 16-bit pixel art, clearly visible square pixel clusters and stepped edges, miniature architectural world, NOT photorealism or smooth 3D. Tropical jade foliage, warm ivory concrete, restrained terracotta, blue-green glass and soft amber light, consistent with a cream and deep teal productivity app. Balance nature, campus architecture and tiny everyday student life. Inspired by National University of Singapore's UTown, not an exact campus map. No text, signs, letters, numbers, labels, logos, watermarks, borders, UI, vignette, blur or washed-out overlays. Fill the composition with clear attractive details rather than empty sky. Asset: panoramic goal-library artwork, very wide horizontal 3:1 composition. UTown Education Resource Centre-inspired study commons at blue hour: view across a planted university courtyard toward a long pale concrete and warm timber-louvered learning centre, glazed windows reveal rows of books and warm reading lamps, broad steps and open colonnades, established tropical trees growing through courtyards, tiny students with backpacks walking or studying at outdoor tables. Gentle indigo evening sky and amber window glow, dark teal leaves and warm ivory architecture. Clear crisp pixels and uncluttered architectural silhouettes, not a gloomy scene. Main details in central horizontal band.
```

### nus-study

保存位置：`frontend/src/assets/goalpilot-world-nus-study-v1.webp`

原始结果：`/home/qijx/.codex/generated_images/01a028d1-8288-7641-ba65-3d41b3f9a73d/exec-9b56073b-9b1e-4acd-a888-8e0f52ecdc45.png`

transparent_background: `true`

```text
Use case: stylized-concept. Original bitmap scenery for GoalPilot's NUS campus theme. Intricate handcrafted 16-bit pixel art, clearly visible square pixel clusters and stepped edges, miniature architectural world, NOT photorealism or smooth 3D. Tropical jade foliage, warm ivory concrete, restrained terracotta, blue-green glass and soft amber light, consistent with a cream and deep teal productivity app. Balance nature, campus architecture and tiny everyday student life. Inspired by National University of Singapore's UTown, not an exact campus map. No text, signs, letters, numbers, labels, logos, watermarks, borders, UI, vignette, blur or washed-out overlays. Fill the composition with clear attractive details rather than empty sky. Asset: square transparent decorative cutout, 1:1 composition. A miniature campus study garden vignette: one mature tropical rain tree shading a pale concrete and timber reading pavilion, long wooden bench, two tiny university students with books and a laptop, a bicycle, ferns and a small flowering shrub. A hint of a flat-roof campus learning building behind the pavilion within the cutout silhouette. Calm warm daylight. Entire object with generous true transparent margins, legible at 140 CSS pixels. No rectangular scene background, no sky, no floor outside the vignette, no glow, no checkerboard and no cast shadow outside the cutout.
```

