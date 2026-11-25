"""Self-check frames for one design: python3 ../kit/tools/shot.py design-1 [t1 t2 ...] [--size 1280x720] [--q "to=...&msg=..."]
Serves the battle folder, opens design-N/index.html?capture&size=WxH in headless Chrome, waits for window.__papercraft.ready,
steps the fixed clock to each time and saves design-N/shots/t<time>.png. Prints build time and every console / page error."""
import sys, os, functools, http.server, threading, argparse
from playwright.sync_api import sync_playwright
ap = argparse.ArgumentParser(); ap.add_argument('design'); ap.add_argument('times', nargs='*', type=float)
ap.add_argument('--size', default='1280x720'); ap.add_argument('--q', default='')
a = ap.parse_args()
root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))   # the battle folder (kit's parent)
design = os.path.abspath(a.design); rel = os.path.relpath(os.path.join(design, 'index.html'), root)
times = a.times or [0.5, 2.0, 4.0, 8.0]; W, H = map(int, a.size.split('x'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *x): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Q, directory=root))
threading.Thread(target=srv.serve_forever, daemon=True).start()
out = os.path.join(design, 'shots'); os.makedirs(out, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=['--enable-gpu', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': W, 'height': H})
    errs = []
    pg.on('pageerror', lambda e: errs.append('PAGE ERROR ' + str(e)))
    pg.on('console', lambda m: errs.append(f'console.{m.type}: {m.text}') if m.type in ('error', 'warning') and 'willReadFrequently' not in m.text else None)
    url = f'http://127.0.0.1:{srv.server_address[1]}/{rel}?capture&size={W}x{H}' + (('&' + a.q) if a.q else '')
    pg.goto(url)
    try:
        pg.wait_for_function('window.__papercraft && window.__papercraft.ready', timeout=120000)
    except Exception:
        print('NOT READY: window.__papercraft.ready never became true'); [print(e) for e in errs]; sys.exit(1)
    print('build', pg.evaluate('window.__papercraft.buildMs'), 'ms')
    pg.evaluate('window.__papercraft.restart()'); prev = 0
    for t in sorted(times):
        if t > prev: pg.evaluate(f'window.__papercraft.step({t - prev})')
        prev = t; f = os.path.join(out, f't{t:g}.png'); pg.screenshot(path=f); print('->', os.path.relpath(f))
    for e in errs: print(e)
    if not errs: print('no console errors')
    b.close()
