import os
from PIL import Image, ImageDraw, ImageFont

def generate_icons():
    # Size for our master image
    size = 512
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Colors
    bg_color = (13, 34, 53, 255) # #0d2235
    accent_green = (0, 229, 160, 255) # #00e5a0

    # Draw rounded rectangle background
    radius = 120
    draw.rounded_rectangle([0, 0, size, size], radius, fill=bg_color)

    # Draw a stylized "S" combined with a chart
    # Left bar (bottom to middle)
    draw.rounded_rectangle([120, 240, 200, 390], 30, fill=accent_green)
    # Middle bar (middle to top right)
    draw.rounded_rectangle([216, 120, 296, 390], 30, fill=accent_green)
    # Right bar (top)
    draw.rounded_rectangle([312, 120, 392, 270], 30, fill=accent_green)

    # Add a spark/dot
    draw.ellipse([312, 310, 392, 390], fill=accent_green)

    # Save paths
    app_dir = os.path.join("frontend", "app")
    public_dir = os.path.join("frontend", "public")
    
    os.makedirs(app_dir, exist_ok=True)
    os.makedirs(public_dir, exist_ok=True)

    # 1. apple-touch-icon.png (180x180) in app/
    img_180 = img.resize((180, 180), Image.Resampling.LANCZOS)
    img_180.save(os.path.join(app_dir, "apple-icon.png"))

    # 2. favicon-32x32.png in public/
    img_32 = img.resize((32, 32), Image.Resampling.LANCZOS)
    img_32.save(os.path.join(public_dir, "favicon-32x32.png"))

    # 3. favicon-16x16.png in public/
    img_16 = img.resize((16, 16), Image.Resampling.LANCZOS)
    img_16.save(os.path.join(public_dir, "favicon-16x16.png"))

    # 4. favicon.ico (multi-size) in app/
    img.save(
        os.path.join(app_dir, "favicon.ico"),
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)]
    )

    # Also an icon.png in app/ to satisfy Next.js app router metadata
    img.save(os.path.join(app_dir, "icon.png"))

if __name__ == "__main__":
    generate_icons()
    print("Favicons generated successfully!")
