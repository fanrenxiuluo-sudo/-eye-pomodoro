"""
生成专业的番茄钟图标
设计：现代扁平风格番茄 + 绿叶，透明背景
"""
from PIL import Image, ImageDraw, ImageFilter
import math

def create_tomato_icon(size=256):
    """创建指定尺寸的番茄图标"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = size // 2, size // 2 + size // 20  # 番茄中心略偏下
    r = int(size * 0.38)  # 番茄半径

    # ─── 番茄主体（红色渐变感） ───
    # 外层阴影
    for i in range(3):
        shadow_r = r + 3 - i
        alpha = 40 - i * 12
        draw.ellipse(
            [cx - shadow_r, cy - shadow_r + 2, cx + shadow_r, cy + shadow_r + 2],
            fill=(80, 20, 20, alpha)
        )

    # 主体红色（多层叠加产生渐变效果）
    # 底层 - 深红
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(210, 50, 50, 255))

    # 中层 - 标准红（略小，偏上）
    r2 = int(r * 0.92)
    draw.ellipse([cx - r2, cy - r2 - 2, cx + r2, cy + r2 - 2], fill=(230, 65, 55, 255))

    # 顶层 - 亮红（更小，偏上）
    r3 = int(r * 0.75)
    draw.ellipse([cx - r3, cy - r3 - 4, cx + r3, cy + r3 - 4], fill=(240, 80, 60, 255))

    # ─── 高光 ───
    # 左上高光椭圆
    hx = cx - int(r * 0.25)
    hy = cy - int(r * 0.3)
    hw = int(r * 0.35)
    hh = int(r * 0.25)
    highlight = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(highlight)
    hdraw.ellipse([hx - hw, hy - hh, hx + hw, hy + hh], fill=(255, 180, 170, 120))
    # 模糊高光
    highlight = highlight.filter(ImageFilter.GaussianBlur(radius=int(r * 0.08)))
    img = Image.alpha_composite(img, highlight)
    draw = ImageDraw.Draw(img)

    # ─── 番茄顶部凹陷 ───
    indent_w = int(r * 0.2)
    indent_h = int(r * 0.08)
    draw.ellipse(
        [cx - indent_w, cy - r - indent_h + 4, cx + indent_w, cy - r + indent_h + 4],
        fill=(180, 40, 40, 255)
    )

    # ─── 绿叶（两片对称叶子） ───
    leaf_color = (76, 175, 80, 255)
    leaf_dark = (56, 142, 60, 255)
    leaf_light = (129, 199, 132, 255)

    stem_bottom = cy - r + 2
    stem_top = cy - r - int(size * 0.12)

    # 左叶子
    left_leaf = [
        (cx - 2, stem_bottom - 2),
        (cx - int(r * 0.45), stem_top - int(size * 0.02)),
        (cx - int(r * 0.35), stem_bottom - int(size * 0.08)),
    ]
    draw.polygon(left_leaf, fill=leaf_color)

    # 右叶子
    right_leaf = [
        (cx + 2, stem_bottom - 2),
        (cx + int(r * 0.45), stem_top - int(size * 0.02)),
        (cx + int(r * 0.35), stem_bottom - int(size * 0.08)),
    ]
    draw.polygon(right_leaf, fill=leaf_color)

    # 叶子高光
    left_highlight = [
        (cx - 1, stem_bottom - 4),
        (cx - int(r * 0.3), stem_top + int(size * 0.02)),
        (cx - int(r * 0.2), stem_bottom - int(size * 0.06)),
    ]
    draw.polygon(left_highlight, fill=leaf_light)

    right_highlight = [
        (cx + 1, stem_bottom - 4),
        (cx + int(r * 0.3), stem_top + int(size * 0.02)),
        (cx + int(r * 0.2), stem_bottom - int(size * 0.06)),
    ]
    draw.polygon(right_highlight, fill=leaf_light)

    # 中间茎
    stem_w = max(2, int(size * 0.02))
    draw.rectangle(
        [cx - stem_w, stem_top + int(size * 0.04), cx + stem_w, stem_bottom],
        fill=leaf_dark
    )

    return img


def create_ico_from_images(images, sizes, output_path):
    """
    手动构建 ICO 文件，确保包含所有尺寸
    ICO 格式：Header + DirEntries + PNG data
    """
    import struct

    # 为每个尺寸生成 PNG 数据
    png_data_list = []
    for img, s in zip(images, sizes):
        from io import BytesIO
        buf = BytesIO()
        img.save(buf, format='PNG')
        png_data_list.append(buf.getvalue())

    count = len(sizes)
    # Header: 6 bytes, each DirEntry: 16 bytes
    header_size = 6
    dir_size = count * 16
    data_offset = header_size + dir_size

    # 计算每个 PNG 的偏移
    offsets = []
    current_offset = data_offset
    for png_data in png_data_list:
        offsets.append(current_offset)
        current_offset += len(png_data)

    # 写入文件
    with open(output_path, 'wb') as f:
        # Header
        f.write(struct.pack('<HHH', 0, 1, count))  # reserved, type=ICO, count

        # Directory entries
        for i, (s, png_data) in enumerate(zip(sizes, png_data_list)):
            w = s if s < 256 else 0  # 0 means 256
            h = s if s < 256 else 0
            f.write(struct.pack('<BBBBHHII',
                w, h,
                0,  # color count
                0,  # reserved
                1,  # color planes
                32, # bits per pixel
                len(png_data),
                offsets[i]
            ))

        # PNG data
        for png_data in png_data_list:
            f.write(png_data)


def main():
    import os

    sizes = [16, 24, 32, 48, 64, 128, 256]
    images = []

    for s in sizes:
        img = create_tomato_icon(s)
        if img.size != (s, s):
            img = img.resize((s, s), Image.LANCZOS)
        images.append(img)
        print(f'  Created {s}x{s}')

    # 保存为 ICO
    ico_path = r'C:\Users\35397\eye-pomodoro-temp\resources\icon.ico'
    create_ico_from_images(images, sizes, ico_path)
    print(f'Saved ICO: {ico_path} ({os.path.getsize(ico_path)} bytes)')

    # 保存 256x256 PNG 预览
    png_path = r'C:\Users\35397\eye-pomodoro-temp\resources\icon_preview.png'
    images[-1].save(png_path, format='PNG')
    print(f'Saved PNG preview: {png_path}')


if __name__ == '__main__':
    main()
