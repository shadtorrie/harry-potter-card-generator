import cv2
from pathlib import Path

imagePath = Path("C:/Users/shadt/Documents/harry-potter-card-generator/docs/card-resources/book.png")
image = cv2.imread(str(imagePath), cv2.IMREAD_UNCHANGED)
if image is None:
    raise FileNotFoundError(f"Cannot read image: {imagePath}")
# Ensure 4 channels (BGRA). If image has 1 or 3 channels, add an opaque alpha.
if image.ndim == 2:
    image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGRA)
elif image.shape[2] == 3:
    image = cv2.cvtColor(image, cv2.COLOR_BGR2BGRA)
#resize image to 156x{scale}

scale = int(156 * (image.shape[0] / image.shape[1]))
resizedImage = cv2.resize(image, (156, scale))
cv2.imwrite(str(imagePath), resizedImage)