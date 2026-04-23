
import io
from pdfminer.high_level import extract_text_to_fp
from pdfminer.layout import LAParams

def extract_text_from_pdfbytes(file_bytes: bytes) -> str:
    out = io.StringIO()
    try:
        extract_text_to_fp(io.BytesIO(file_bytes), out, laparams=LAParams(), output_type='text', codec=None)
        text = out.getvalue()
        if text and len(text.strip())>10:
            return text
    except Exception:
        pass
    return ""
