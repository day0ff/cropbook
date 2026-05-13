import json
import sys
import warnings
import os
import logging

warnings.filterwarnings("ignore")
logging.disable(logging.CRITICAL)

os.environ["GLOG_minloglevel"] = "3"

from paddleocr import PaddleOCR

ocr = PaddleOCR(
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False,
    lang="ru",
)

image_path = sys.argv[1]

result = ocr.predict(image_path)

blocks = []

for page in result:
    rec_texts = page.get("rec_texts", [])
    rec_scores = page.get("rec_scores", [])
    rec_polys = page.get("rec_polys", [])

    for i in range(len(rec_texts)):
        poly = rec_polys[i].tolist()

        xs = [p[0] for p in poly]
        ys = [p[1] for p in poly]

        blocks.append({
            "text": rec_texts[i].strip(),
            "confidence": float(rec_scores[i]),
            "bbox": poly,
            "left": min(xs),
            "top": min(ys),
            "right": max(xs),
            "bottom": max(ys),
        })

print(json.dumps(blocks, ensure_ascii=False))