"""Prepare the Markdown snapshot for opening index.html directly via file://."""

import json
from pathlib import Path

root = Path(__file__).resolve().parent
markdown = (root / 'API_MANUAL.md').read_text(encoding='utf-8')
payload = json.dumps(markdown, ensure_ascii=True)
(root / 'manual-data.js').write_text(
    '// Generated from API_MANUAL.md by sync-manual.py. Do not edit directly.\n'
    + 'window.API_MANUAL_MARKDOWN = ' + payload + ';\n',
    encoding='utf-8',
)
print('Updated manual-data.js from API_MANUAL.md')
