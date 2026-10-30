# VISUAL_STYLE.md — визуальная система и промпты

## 1. Художественное направление
Оригинальный движущийся комикс: hand-drawn 2D graphic novel, выразительный контур, крупные читаемые силуэты, контролируемые тени, умеренная полутоновая текстура. Атмосфера загадочная, но не постоянно мрачная. Юмор передаётся мимикой, паузами и композицией.

### Палитра
- Тёмный сине-фиолетовый — ночь, тени и тайна.
- Приглушённый бирюзовый — холодный свет и необычные явления.
- Янтарный — лампы, важные предметы, уютные детали.
- Кремовый — бумага и нейтральные поверхности.
Палитра является ориентиром, а не жёстким запретом на другие цвета, если история требует акцента.

## 2. Композиция для вертикального видео
- Кадр 9:16, мастер 1080 × 1920.
- Один основной визуальный фокус на кадр.
- Крупные планы лиц и предметов чередуются с общими планами.
- Важные действия держать ближе к центральной области, оставляя запас для интерфейсов платформ.
- Не помещать критически важные детали вплотную к краям.
- Избегать мелких надписей и слишком загруженного фона.
- Для монтажа оставлять свободные зоны, если там будут субтитры.

## 3. Как создаётся движение
Предпочтительный метод — несколько слоёв в монтаже:
- медленное приближение или отдаление камеры;
- горизонтальный/вертикальный пан;
- параллакс переднего плана, героя и фона;
- смена крупности;
- короткое моргание, движение глаз или рта, если инструмент позволяет;
- лёгкое движение света, дыма, пыли, дождя или магического свечения;
- резкий монтажный акцент на неожиданной реплике.

Не превращать каждый кадр в сложный видеогенерационный шот. Сложную анимацию использовать только там, где она реально усиливает сцену.

## 4. Базовый промпт для иллюстрации
Подставлять сцену и утверждённые референсы персонажей:

> Original hand-drawn 2D graphic novel illustration for a vertical animated comic short. Scene: [DESCRIBE ONE CLEAR ACTION]. Characters: [USE THE APPROVED CHARACTER REFERENCE AND DESCRIBE THEIR POSITIONS]. Distinctive clean ink outlines, expressive readable faces, controlled cel shading, subtle halftone texture, cinematic composition, deep violet-blue shadows, restrained teal glow, warm amber practical light, clear foreground/midground/background separation for parallax animation. Portrait 9:16 composition, strong focal point, consistent character design, polished original animation concept art. No text, no captions, no logos, no watermark, no photorealism, no 3D render, no extra characters, no duplicate limbs, no distorted hands or faces.

## 5. Промпт для фона без персонажей
> Original hand-drawn 2D graphic novel background, [LOCATION AND TIME]. Dark violet-blue shadows, restrained teal highlights and warm amber practical lights, bold but controlled ink outlines, subtle halftone texture, cinematic perspective, clear foreground, middle ground and background layers, designed for slow parallax animation in a vertical 9:16 video. No characters, no text, no logos, no watermark, no photorealism.

## 6. Промпт для эмоций персонажа
> Use the supplied approved character reference. Preserve the exact face, proportions, hairstyle, clothing, accessories and color palette. Create a clear [EMOTION] expression and [POSE], readable at phone size, hand-drawn 2D graphic-novel style, bold clean outlines, restrained cel shading, plain/simple background, no text, no redesign, no extra limbs.

## 7. Промпт для image-to-video
> Animate the supplied illustration while preserving the original 2D graphic-novel art style and character identity. Keep the camera movement subtle and intentional: [CAMERA MOVE]. Animate only: [SPECIFIC ELEMENTS]. Maintain the exact character design, clothing, face, proportions, composition and lighting. No new objects, no morphing, no camera shake unless explicitly requested, no extra limbs, no lip-sync unless requested, no text generation. Duration [X] seconds, vertical 9:16.

## 8. Негативные ограничения
Избегать:
- случайных букв и псевдотекста;
- смены одежды и лица между кадрами;
- фотореализма и пластиковой 3D-эстетики;
- чрезмерного свечения, которое съедает контур;
- случайных дополнительных персонажей;
- несогласованных направлений света;
- слишком мелкого объекта в вертикальном кадре;
- чрезмерного движения, из-за которого теряется рисунок.

## 9. Субтитры и надписи
Все реплики, заголовки, номера дел и другие тексты добавлять при монтаже. Генераторы изображений часто искажают кириллицу. Субтитры должны быть контрастными, короткими и не закрывать лицо или ключевую улику.
