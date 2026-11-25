"""Stills of card.html at given times on the fixed clock: python tools/stills.py <W>x<H> t1 t2 ... -> frames/card_t<t>.png"""
import sys, os, functools, http.server, threading
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = map(int, sys.argv[1].split('x')); extra = os.environ.get('QS', ''); tag = os.environ.get('TAG', 'card'); times = [float(x) for x in sys.argv[2:]]
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Q, directory=root))
threading.Thread(target=srv.serve_forever, daemon=True).start()
os.makedirs(os.path.join(root, 'frames'), exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=['--enable-gpu', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': W, 'height': H})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') else None)
    pg.goto(f'http://127.0.0.1:{srv.server_address[1]}/{os.environ.get('PAGE', 'card.html')}?capture&size={W}x{H}{extra}')
    try: pg.wait_for_function('window.__papercraft && window.__papercraft.ready', timeout=120000)
    except Exception:
        [print('ERR', e) for e in errs]; raise
    print('build', pg.evaluate('__papercraft.buildMs'), 'ms')
    prev = 0
    pg.evaluate('__papercraft.restart()')
    for t in sorted(times):
        if t > prev: pg.evaluate(f'__papercraft.step({t - prev})')
        prev = t
        out = os.path.join(root, 'frames', f'{tag}_t{t:g}.png'); pg.screenshot(path=out); print('->', out)
    for e in errs: print('ERR', e)
    b.close()
