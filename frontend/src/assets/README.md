# GoalPilot decorative assets

## Pixel town, nature and railway — current theme

Rebalanced on 2026-09-14 by reusing the existing five assets: the login scene
combines a train, riverside architecture, greenery and commuters; the home river
panorama is paired with the station vignette. The sidebar retains the mountain
lake; the goal library and Agent welcome retain the reading garden. Trains are
part of the world, not restricted to the brand mark and not repeated everywhere.
This adjustment changes component selection and CSS framing only; no new image
generation, bitmap edits, backend changes or automatic scene rotation.

Generated on 2026-09-13 with the **built-in image generation tool** (not the CLI),
using the `imagegen` skill. Three original scenes balance architecture, everyday
human life and nature; none uses a reference image. These scenes are used alongside
the railway assets documented below. The tiny native Agent locomotive also remains
a brand mark.

| Saved asset | Encoding | Use |
| --- | --- | --- |
| `frontend/src/assets/goalpilot-pixel-riverside-v1.webp` | 1536 × 512 RGB, WebP quality 92, 382,552 bytes | Home panorama: river, park, bridge and neighborhood |
| `frontend/src/assets/goalpilot-pixel-highlands-v1.webp` | 1536 × 768 RGB, WebP quality 92, 416,954 bytes | Sidebar: mountain lake and village |
| `frontend/src/assets/goalpilot-pixel-courtyard-v1.webp` | 512 × 439 RGBA, lossless WebP, 351,812 bytes | Agent welcome, goal library: bookshop garden |

The originals were proportionally resized using nearest-neighbor from
2172 × 724, 1774 × 887 and 1354 × 1161 respectively, then encoded as WebP.
There was no drawing, recoloring or compositing after generation. The courtyard
retains its transparent alpha; CSS uses `image-rendering: pixelated`. The 3:1
home panorama reduces vertical cropping of distant hills and the river.
All artwork is decorative and hidden from assistive technology; text, counts,
status and controls remain HTML. Landscapes are selected by page, not rotated
automatically. No new settings, animation library or API calls were added.

Unmodified originals retained at:

- `/home/qijx/.codex/generated_images/01a028d1-8288-7641-ba65-3d41b3f9a73d/exec-7ebb0341-c5aa-499a-9efd-87ba884f8b7c.png`
- `/home/qijx/.codex/generated_images/01a028d1-8288-7641-ba65-3d41b3f9a73d/exec-701d23e1-1247-47a4-9973-32beca7ec026.png`
- `/home/qijx/.codex/generated_images/01a028d1-8288-7641-ba65-3d41b3f9a73d/exec-f1fed97f-ab4e-4604-aaca-6083260a82f4.png`

### Final riverside generation prompt

```text
Use case: stylized-concept. Asset type: original panoramic pixel-art landscape for a web app header.
Create a wide 3:1 panoramic canvas (approximately 1536 by 512). Crisp, carefully handcrafted 16-bit pixel art with consistent visible square pixel clusters, stepped edges, no smooth rendering, no blur. A balanced landscape where a lively little riverside city and beautiful nature each occupy roughly half the scene.
An elevated view over a winding blue-green river, a small stone pedestrian bridge, leafy riverside park, meadow flowers, and a walkable town with warm ivory and pale terracotta apartment buildings, rooftop gardens, a neighborhood cafe and a small glass greenhouse. Tiny full-body pixel people stroll, read on a bench and ride bicycles along the river. Layered forested hills and mountains in the background. Mature green trees frame the town, clear water and greenery are important focal subjects, not tiny background decorations. Warm late-afternoon sunshine, pale blue sky, peaceful daily life.
Compose all major architecture, river, park and distant hills in a continuous horizontal panorama, with a readable silhouette even when displayed as a shallow website banner. Rich but considered detail. Natural greens, faded blue, slate, warm sandstone and small coral accents, matching an ivory and muted petrol-blue productivity UI.
No trains, railways, platforms, vehicles dominating the scene, giant factories, logos, writing, numbers, UI, watermark, or photographic textures. This is a finished original bitmap environment, not an interface mockup.
```

### Final highlands generation prompt

```text
Use case: stylized-concept. Asset type: original pixel-art scenery for a calm web app login illustration and small sidebar landscape.
A wide 2:1 landscape canvas, handcrafted 16-bit pixel art with clearly visible consistent square pixels and crisp stepped silhouettes. No smooth antialiasing, gradients rendered as discrete color bands only.
Scene: a luminous mountain lake with soft blue reflections, forested foothills, grassy terraces and wildflowers, a winding footpath, and a small inhabited lakeside village nestled into the terrain. Restrained architecture: warm cream houses with slate and terracotta roofs, a waterside bookshop terrace, a small wooden boat dock. Tiny walking figures on the path, one person reading on the terrace. Mountains, water, trees and open meadow occupy most of the picture; buildings feel naturally integrated. Wide establishing view with gentle depth, optimistic quiet morning sunlight, pale sky and small blocky clouds.
Composition balanced across the full canvas, no huge empty sky. The lake and village are in the central horizontal band so they remain legible in a moderately wide crop. Palette: soft sage and pine greens, sky blue and teal water, ivory stone, warm apricot sunlight; rich atmospheric detail without neon colors.
Constraints: no trains, railway tracks, station buildings, city skyscrapers, logos, letters, numbers, captions, watermark, UI, 3D rendered look or photorealism. A finished original bitmap landscape.
```

### Final courtyard generation prompt

```text
Use case: stylized-concept. Asset type: small transparent pixel-art cutout illustration for an Agent-first goal planning workspace.
One compact neighborhood reading garden vignette: a small cream brick bookshop with a blue-gray tiled roof and a muted copper awning, climbing ivy, one generously leafy green tree, a bench with a tiny person reading, a bicycle, terracotta plant pots and a short stone pathway surrounded by meadow flowers. Large garden foliage should balance the architecture, creating equal emphasis on nature and human life. The shop window can show simple book-shaped pixel blocks, but no writing. One coherent composition, gentle three-quarter game-environment perspective, full object in frame with transparent padding.
Style: crisp handcrafted 16-bit pixel art, obvious square pixel clusters, stepped silhouettes and limited flat shaded colors. Not a rounded 3D render, not a smooth digital painting. Warm daylight, harmonious sage/pine foliage, ivory stone, faded slate blue roof, a few warm peach accents. Readable at 140–190 CSS pixels.
Genuinely transparent alpha background. No opaque floor outside the vignette, no checkerboard drawn into the image, no skyline backdrop, no external shadow, no train, rails, railway station, clock tower, text, letters, labels, logos, UI or watermark. Single finished original bitmap, not a sprite sheet.
```

## Pixel railway city — complementary current assets

Generated on 2026-09-13 with the **built-in image generation tool**, using the
`imagegen` skill. Original artwork combines a lived-in river city, architecture,
greenery, commuters and a railway. No external reference image was used.
These images are decoration only; all text, task counts, status and controls are HTML.

| Saved asset | Encoding | Use |
| --- | --- | --- |
| `frontend/src/assets/goalpilot-pixel-city-v1.webp` | 1536 × 1024 RGB, WebP quality 92, 565,416 bytes | Login: train, river, buildings, trees and commuters |
| `frontend/src/assets/goalpilot-pixel-station-v1.webp` | 512 × 512 RGBA, lossless WebP, 235,012 bytes | Home route guide: station, train, greenery and people |

The station was proportionally reduced from 1280 × 1280 using nearest-neighbor
to preserve pixel edges. The city retains its generated dimensions. No drawing,
recoloring or compositing was done after generation. CSS uses
`image-rendering: pixelated`; transparent station alpha is preserved.

Unmodified generated originals retained at:

- `/home/qijx/.codex/generated_images/01a028d1-8288-7641-ba65-3d41b3f9a73d/exec-23d06b8c-cbbf-4243-9bb8-736ef95591e4.png`
- `/home/qijx/.codex/generated_images/01a028d1-8288-7641-ba65-3d41b3f9a73d/exec-60d8b324-7500-4813-8f5a-4fbb665a4014.png`

### Final city generation prompt

```text
Use case: stylized-concept. Asset type: original panoramic pixel-art environment illustration for GoalPilot, an agent-first productivity workspace themed as a thoughtful urban railway journey.
Create a wide 3:2 landscape canvas, deliberately crisp handcrafted 16-bit pixel art, clearly visible consistent square pixels and stepped silhouettes, as if a 480x320 game background enlarged with nearest-neighbor. No antialiasing, no blur, no 3D rendering.
Scene: a small inhabited riverside city merging nature, architecture, community and gentle industry. In the foreground a cream and muted petrol-blue commuter train travels horizontally across a steel railway bridge and a small brick station platform. Tiny full-body pixel people wait on the platform, one with a bicycle; planters and benches, warm glowing little windows. Layered narrow apartment buildings with slate and terra-cotta roofs, rooftop gardens, a modest workshop chimney, overhead railway wires, green trees and a quiet canal behind the train; soft distant blue hills and a warm pale blue sky with blocky peach clouds. A few birds as tiny pixel shapes. Rich, intentional environmental detail, calm daytime atmosphere, optimistic and human, not cyberpunk or post-apocalyptic.
Composition: fully illustrated edge-to-edge landscape, train and station spanning the lower middle; city across the central band, sky in the upper third. Important train and city subjects within the middle vertical 65% so the art can be cropped as a wide web banner. No blank area reserved for text; all UI text will be HTML outside this image.
Palette: restrained warm ivory, faded sky blue, slate ink, pine green, sage foliage, sandstone, small copper-orange accents. Harmonious, not neon, strong readable silhouettes and natural tonal depth.
Constraints: original environment, no famous buildings, no logos, no text, no letters, no numbers, no watermark, no UI, no rounded glossy objects. Output a finished polished bitmap illustration.
```

### Final station generation prompt

```text
Use case: stylized-concept. Asset type: transparent pixel-art vignette for a refined goal-planning application's small illustrations.
Create one coherent little railway station diorama in crisp 16-bit pixel art. Consistent clearly visible square pixel grid, stepped silhouettes and flat pixel-cluster shading, like a carefully hand-drawn 192x192 sprite enlarged using nearest-neighbor. NOT a smooth isometric 3D render, no antialiasing or blur.
Subject: a charming small cream brick station house with a slate blue gabled roof, a square clock face with simple hands and NO numerals, copper awning, a short cream and muted petrol-blue train carriage beside its platform, a leafy pine-green tree and a few shrubs. Two tiny human figures on the platform, a bicycle leaning against the station and one terracotta planter. A short pair of railway tracks at the bottom grounds the composition. Gentle three-quarter game environment view, precise and rich pixel craftsmanship. Full object visible with generous transparent margin on all sides, balanced central composition with a clean, compact silhouette.
Palette: warm ivory walls, dusty blue and slate, pine and sage greens, sandstone ground, tiny muted copper details. Calm daylight, no harsh neon, no fantasy glow.
Genuinely transparent alpha background; no white rectangle, no checkerboard drawn into the image, no landscape background, no drop shadow outside the sprite, no text, no logos, no watermark. Output one finished bitmap asset, not a sprite sheet.
```

### Local display font and visual references

`Silkscreen-Regular.woff2` (9,048 bytes) is an unmodified local copy from the
[Google Fonts Silkscreen repository](https://github.com/googlefonts/silkscreen/tree/main/fonts/webfonts).
By the Silkscreen Project Authors / Jason Kottke, licensed under SIL OFL 1.1;
the complete license is included in `Silkscreen-OFL.txt`. It is used only for
English signage and selected numerals. Chinese prose keeps a sans-serif stack.

Palette research: [Slynyrd's Steam Lords palette on Lospec](https://lospec.com/palette-list/steam-lords)
informed the restrained green / slate industrial direction; the UI palette is
customized for light surfaces and readable contrast, not a literal palette copy.
No reference images were downloaded or embedded. Agent locomotive mark and
city-outline background are native SVG/CSS, not generated bitmaps.

## goalpilot-celadon-ribbon-v1.webp — previous theme

Generated with the **built-in image generation tool**, following the `imagegen`
skill, on 2026-09-13. The original celadon glass / ivory porcelain ribbon and
small apricot sphere are decorative only, not a progress indicator or interactive control.

Final asset: `frontend/src/assets/goalpilot-celadon-ribbon-v1.webp`.
The 1254 × 1254 transparent RGBA PNG was proportionally reduced to 960 × 960
and encoded as WebP (quality 88, 74,108 bytes). Transparency is preserved; no
composition or color edits. It is reused on login, the home illustration panel,
and the goal library. All copy remains selectable HTML; the image has empty alt text.

Original retained unchanged:
`/home/qijx/.codex/generated_images/01a028d1-8288-7641-ba65-3d41b3f9a73d/exec-135c8ae9-0ca4-453a-9ec4-c188ebcbd4fc.png`.

Final generation prompt:

```text
Use case: stylized-concept
Asset type: original decorative cutout for the GoalPilot AI planning workspace, reused on a light login page and small homepage art panel.
Primary request: an exquisitely refined sculptural loop suggesting a thought finding its direction: a single soft folded ribbon forming an open ascending arch, with one small floating warm apricot sphere in its opening. Abstract rather than a literal product or mascot.
Scene/backdrop: genuinely transparent background with clean alpha, a very soft compact contact shadow, no floor rectangle or environment.
Style/medium: high-end photorealistic 3D editorial still life, soft tactile porcelain smoothly transitioning to translucent sea-glass on the ribbon, subtle refraction and delicate studio highlights, understated and artful, not cartoon or plastic.
Composition/framing: centered complete sculpture, three-quarter view, square composition, balanced breathing room, silhouette readable at 150 pixels; keep all edges and shadow inside image.
Lighting/mood: diffused morning studio light, calm, optimistic, refined and quietly technological.
Color palette: desaturated celadon and mist teal, warm ivory porcelain, a tiny pale apricot accent. No purple, saturated blue or harsh orange. The UI background will be #f6f7f3.
Text: none.
Constraints: one coherent ribbon sculpture and one sphere only; no logos, no text, no letters, no watermark, no cards, no plants, no stairs, no paper plane, no busy patterns. Genuine transparent background.
```

The older assets below are retained for history and existing legacy components;
the current login and home no longer use the dark gradient or lavender steps.

## goalpilot-progress-garden-v1.webp

Generated with the **built-in image generation tool** on 2026-09-12 using the
`imagegen` skill. A small porcelain/paper still-life for the new-goal page:
four ascending steps, a paper plane and a sage sprig. It is decorative, not a
chart or a representation of the user's actual progress. Functional text stays
in HTML; the image has empty alt text and is hidden from assistive technology.

Final asset: `frontend/src/assets/goalpilot-progress-garden-v1.webp`.
The 1280 × 1280 transparent PNG was proportionally resized to 720 × 720 and
encoded as WebP at quality 0.88 (56,650 bytes). Alpha is preserved. Used as a
compact side illustration on desktop and a 92–150 px header accent on mobile/tablet.
The generated source was left untouched:
`/home/qijx/.codex/generated_images/01a028d1-8288-7641-ba65-3d41b3f9a73d/exec-33c671a5-e67a-4cb3-b425-327a79c8261d.png`.

Final generation prompt:

```text
Use case: stylized-concept.
Asset type: small editorial illustration for a real productivity web app, not a UI mockup.
Primary request: a refined sculptural miniature representing steady progress: four softly rounded cream and dusty lilac steps ascending, a small folded lavender paper plane resting lightly at the top, and a single delicate sage-green leafy sprig growing beside the bottom step. One cohesive, compact still-life cluster, quietly optimistic and adult, not a toy scene.
Scene/backdrop: genuinely transparent background with preserved alpha; no backdrop, no room, no landscape, no floor rectangle. Only a very soft, short contact shadow beneath the objects.
Style/medium: polished 3D editorial illustration, matte porcelain and folded paper, tactile subtle grain, elegant organic curves.
Composition/framing: slightly elevated three-quarter view, centered compact cluster occupying most of the square canvas with generous safe edge padding; all objects fully visible. Readable at 280–380 CSS pixels wide.
Lighting/mood: soft studio daylight from upper left, delicate shadows, calm and warm.
Color palette: muted lilac #b7a3d0, ivory #f3eee5, sage #91a99a, a tiny blush highlight. Clear sculptural definition without vivid colors or dark outlines.
Constraints: no lettering, no numbers, no labels, no logos, no watermark, no people, no floating UI cards, no glitter, no additional props. This is a standalone decorative cutout that must blend onto an off-white lavender app background.
```

## goalpilot-plane-charm-v1.webp

Small decorative cutout generated with the built-in image generation tool on
2026-09-06. Used beside the goal-input writing prompts at 116 px, never as a backdrop.
The 1280 × 1280 source PNG was encoded as a 384 × 384 WebP (quality 0.88),
preserving transparent alpha. The delivered asset is about 15 KB.

Original:
`/home/qijx/.codex/generated_images/01a028d1-8288-7641-ba65-3d41b3f9a73d/exec-5d334495-b1ee-47de-b002-745fb3ba6319.png`

Final generation prompt:

```text
Use case: stylized-concept
Asset type: small transparent decorative cutout for GoalPilot's input helper card, displayed at 100–150 px.
Primary request: one sculptural folded paper airplane, rendered like a tiny satin ceramic desk charm, pointing gently up and right. A small pearl sphere sits just below its tail, part of the same compact arrangement.
Scene/backdrop: genuinely transparent background with alpha, no backdrop, no rectangle, no floor. The two objects are isolated cutouts.
Style/medium: premium tactile 3D editorial still life, softly rounded edges with clear folded geometry, sophisticated and playful but not cartoonish.
Composition: square canvas, entire airplane visible, compact centered silhouette filling about 75% of frame, gentle three-quarter view. Readable at small size.
Lighting: soft diffuse studio light, subtle material highlights, no harsh shadows.
Color palette: muted periwinkle and mist blue with a tiny dusty-rose edge accent, pearl cream sphere; match a calm lavender and graphite productivity UI.
Constraints: no text, lettering, logos, watermark, badge border, scene background or checkerboard pattern. True transparent alpha around the object. One image.
```

## goalpilot-ribbon-v1.webp

Generated with the built-in image generation tool on 2026-09-05.
Used in the goal composer's inspiration card and the goal library empty state.
The decorative image has empty alt text; all functional content remains HTML.
The original 1536 × 1024 PNG was encoded as a 1200 × 800 WebP at quality 0.85
for faster delivery, without changing its composition.

Original generated image:
`/home/qijx/.codex/generated_images/01a028d1-8288-7641-ba65-3d41b3f9a73d/exec-9ced6439-861c-4507-ba89-70ae4eb251ac.png`

### Final generation prompt

Use case: stylized-concept
Asset type: decorative artwork for GoalPilot, a calm goal-planning web app with muted lavender, dusky rose, mist blue and graphite UI.
Primary request: A refined editorial 3D still life of a single flowing frosted-glass ribbon spiraling gently upward around a small pearl sphere, suggesting an idea becoming a path. Sculptural and tactile, softly translucent satin glass, subtle iridescent lilac and pale peach edge highlights.
Scene/backdrop: seamless deep graphite-lavender studio background (#252936), soft pool of light and gentle contact shadow.
Composition/framing: landscape 3:2 composition, ribbon fills the central two thirds, entire sculpture visible, designed to crop as a small square or landscape card. No large empty expanse. Strong readable silhouette at small size.
Lighting/mood: calm softbox lighting, premium product photography, restrained saturation, sophisticated Instagram editorial mood.
Color palette: muted periwinkle #8189bb, dusty rose #c9869d, mist blue #83a6b9, pearl cream.
Constraints: One unified scene, no panels, no lettering, no logos, no watermark, no UI, no neon, no harsh bright lights. Generate one image at approximately 1200 x 800 pixels.
