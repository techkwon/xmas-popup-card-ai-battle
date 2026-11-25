#!/usr/bin/env python3
"""Make a new pop-up card folder from a template (self-contained: open it from any static web server).

    python3 new_card.py --type 90|180 --out <folder> [--to "받는 사람"] [--msg "메시지"] [--from "보내는 사람"]

The message given here becomes the card's default; anyone can still change it in the page (✉ 메시지 쓰기) or with
?to=&msg=&from= in the link."""
import argparse, json, re, shutil
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument('--type', choices=['90', '180'], default='90'); ap.add_argument('--out', required=True)
ap.add_argument('--to'); ap.add_argument('--msg'); ap.add_argument('--from', dest='frm')
a = ap.parse_args()
out = Path(a.out).expanduser().resolve()
if out.exists() and any(out.iterdir()):
    raise SystemExit(f'{out} is not empty: pick a new folder')
shutil.copytree(SKILL / 'templates' / f'card-{a.type}', out, dirs_exist_ok=True)
shutil.copytree(SKILL / 'kit', out / 'kit', ignore=shutil.ignore_patterns('docs'))
if a.to or a.msg or a.frm:
    p = out / 'kit' / 'message.js'; s = p.read_text()
    m = re.search(r"export const DEFAULT_MESSAGE = (\{.*?\});", s)
    cur = dict(to=None, msg=None, frm=None)
    new = "export const DEFAULT_MESSAGE = { to: %s, msg: %s, from: %s };" % tuple(
        json.dumps(v, ensure_ascii=False) if v else re.search(k + r": ('[^']*')", m.group(1)).group(1)
        for k, v in (('to', a.to), ('msg', a.msg), ('from', a.frm)))
    p.write_text(s.replace(m.group(0), new))
print(f'card ready: {out}')
print(f'  view : cd "{out}" && python3 -m http.server 8000   ->  http://localhost:8000/')
print(f'  check: cd "{out}" && python3 kit/tools/shot.py . 0.5 2 4 8')
print(f'  video: cd "{out}" && python3 kit/tools/capture.py . card:video=10,30 --page index.html --size 1080p --out video')
