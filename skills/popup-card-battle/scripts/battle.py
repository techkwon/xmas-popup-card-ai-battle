#!/usr/bin/env python3
"""Christmas pop-up card battle: the same prompt, the same kit, one folder per AI.

    battle.py setup  <root>                         copy the kit (read-only) into <root>/kit
    battle.py run    <root> <engine> [--prompt battle] [--dir NAME] [--timeout-min 120]
    battle.py render <root> [--only ENGINE] [--to .. --msg .. --from ..] [--sec 10]
    battle.py gallery <root>                        write <root>/index.html linking every design and video
    battle.py check  <root> <engine-dir>            self-check frames of every design (shot.py)
    battle.py art    <root> [--dir bonus]           bonus round step 1: Codex paints the art set into <root>/<dir>/art
    (bonus round step 2: battle.py run <root> fable --prompt bonus --dir bonus)

Engines (the top model of each, effort matched as closely as the CLIs allow):
    opus    Claude Code   claude-opus-5-5   effort xhigh   (prompt tests)
    fable   Claude Code   claude-fable-5-2  effort xhigh
    astra   Codex CLI     gpt-6.2-astra     reasoning xhigh
    carbon  Antigravity   gemini-4-carbon-high
Keep <root> outside $HOME (e.g. /private/tmp/xmas-battle): global CLAUDE.md / AGENTS.md must not leak into a run.
"""
import argparse, json, os, shutil, stat, subprocess, sys, time
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
ENGINES = {
    'opus':   dict(cli='claude', model='claude-opus-5-5', effort='xhigh'),
    'fable':  dict(cli='claude', model='claude-fable-5-2', effort='xhigh'),
    'astra':  dict(cli='codex', model='gpt-6.2-astra', effort='xhigh'),
    'carbon': dict(cli='agy', model='gemini-4-carbon-high', effort=None),
}


def setup(root: Path):
    root.mkdir(parents=True, exist_ok=True)
    kit = root / 'kit'
    if kit.exists():
        for p in kit.rglob('*'):
            os.chmod(p, os.stat(p).st_mode | stat.S_IWUSR)
        os.chmod(kit, os.stat(kit).st_mode | stat.S_IWUSR)
        shutil.rmtree(kit)
    shutil.copytree(SKILL / 'kit', kit)
    for p in list(kit.rglob('*')) + [kit]:          # read-only for the engines (they may still read and run it)
        m = os.stat(p).st_mode
        os.chmod(p, m & ~(stat.S_IWUSR | stat.S_IWGRP | stat.S_IWOTH))
    print('kit ->', kit)


def engine_cmd(e, prompt, cwd: Path, out: Path, timeout_min):
    if e['cli'] == 'claude':
        return ['claude', '-p', prompt, '--model', e['model'], '--effort', e['effort'], '--output-format', 'json',
                '--setting-sources', 'project,local', '--disable-slash-commands',
                '--permission-mode', 'acceptEdits', '--allowedTools', 'Bash', 'Read', 'Edit', 'Write', 'Glob', 'Grep',
                '--disallowedTools', 'Agent', 'Task', 'WebSearch', 'WebFetch']
    if e['cli'] == 'codex':
        return ['codex', 'exec', '-m', e['model'], '-c', f"model_reasoning_effort={e['effort']}", '-c', 'service_tier=default',
                '--disable', 'multi_agent', '--disable', 'memories', '--skip-git-repo-check', '--ephemeral',
                '-s', 'danger-full-access', '-C', str(cwd), '--json', '-o', str(out), prompt]
    if e['cli'] == 'agy':
        return ['agy', '-p', prompt, '--model', e['model'], '--output-format', 'json', '--print-timeout', f'{int(timeout_min)}m',
                '--mode', 'accept-edits', '--dangerously-skip-permissions']
    raise ValueError(e)


def run(root: Path, engine: str, prompt_name: str, dirname: str, timeout_min: float):
    e = ENGINES[engine]
    cwd = root / (dirname or engine); cwd.mkdir(parents=True, exist_ok=True)
    prompt = (SKILL / 'prompts' / f'{prompt_name}.md').read_text()
    (cwd / 'TASK.md').write_text(prompt)
    (root / 'logs').mkdir(exist_ok=True)   # outside the engine's folder: an engine that tidies its folder must not delete it
    log, out = root / 'logs' / f'{cwd.name}.log', root / 'logs' / f'{cwd.name}.last.txt'
    cmd = engine_cmd(e, prompt, cwd, out, timeout_min)
    t0 = time.time()
    print(f'[{engine}] {e["model"]} in {cwd} (timeout {timeout_min} min)', flush=True)
    with open(log, 'w') as f:
        try:
            r = subprocess.run(cmd, cwd=cwd, stdout=f, stderr=subprocess.STDOUT, timeout=timeout_min * 60 + 120)
            code = r.returncode
        except subprocess.TimeoutExpired:
            code = 'timeout'
    meta = dict(engine=engine, model=e['model'], effort=e['effort'], prompt=prompt_name, exit=code,
                minutes=round((time.time() - t0) / 60, 1), finished=time.strftime('%Y-%m-%d %H:%M'))
    meta.update(usage(e, log))
    (cwd / 'result.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2))
    print(json.dumps(meta, ensure_ascii=False))


def usage(e, log: Path):
    """Best-effort token / cost figures from the engine's JSON output."""
    txt = log.read_text(errors='ignore')
    u = {}
    try:
        if e['cli'] == 'claude':
            d = json.loads(txt.strip().splitlines()[-1]); u = dict(cost_usd=d.get('total_cost_usd'), turns=d.get('num_turns'), usage=d.get('usage'))
        elif e['cli'] == 'codex':
            for line in txt.splitlines():
                if '"turn.completed"' in line: u = dict(usage=json.loads(line).get('usage'))
        elif e['cli'] == 'agy':
            d = json.loads(txt[txt.find('{'):]); u = dict(status=d.get('status'), usage=d.get('usage'))
    except Exception as ex:
        u = dict(usage_error=str(ex)[:120])
    return u


def art(root: Path, dirname: str, timeout_min: float):
    cwd = root / (dirname or 'bonus'); cwd.mkdir(parents=True, exist_ok=True)
    prompt = (SKILL / 'prompts' / 'bonus-art.md').read_text(); (cwd / 'ART-TASK.md').write_text(prompt)
    t0 = time.time()
    with open(cwd / 'art.log', 'w') as f:
        r = subprocess.run(['codex', 'exec', '--skip-git-repo-check', '-s', 'workspace-write', '-C', str(cwd), '-o', str(cwd / 'art-last.txt'), '-'],
                           input=prompt, text=True, cwd=cwd, stdout=f, stderr=subprocess.STDOUT, timeout=timeout_min * 60)
    files = sorted(p.name for p in (cwd / 'art').glob('*.png')) if (cwd / 'art').exists() else []
    print(json.dumps(dict(exit=r.returncode, minutes=round((time.time() - t0) / 60, 1), files=files), ensure_ascii=False))


def designs(root: Path, only=None):
    for d in sorted(root.glob('*/design-*/index.html')):
        if d.parts[-3] == 'kit' or (only and d.parts[-3] != only):
            continue
        yield d.parent


def render(root: Path, only, to, msg, frm, sec):
    from urllib.parse import urlencode
    vids = root / 'videos'; vids.mkdir(exist_ok=True)
    q = urlencode({k: v for k, v in dict(to=to, msg=msg, **{'from': frm}).items() if v})
    for d in designs(root, only):
        name = f'{d.parent.name}-{d.name}'
        page = f'{d.relative_to(root)}/index.html' + (f'?{q}' if q else '')
        cmd = [sys.executable, str(root / 'kit/tools/capture.py'), str(root), f'{name}:video={sec},30', '--page', page, '--size', '1080p', '--out', str(vids)]
        print('render', name, flush=True)
        r = subprocess.run(cmd, capture_output=True, text=True)
        print((r.stdout + r.stderr).strip().splitlines()[-3:] if r.returncode else 'ok', flush=True)
        shutil.rmtree(vids / name, ignore_errors=True)   # keep only the mp4
        if (vids / f'{name}.mp4').exists():
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(sec - 1.5), '-i', str(vids / f'{name}.mp4'), '-frames:v', '1', str(vids / f'{name}.jpg')])


def gallery(root: Path):
    rows = []
    for d in designs(root):
        eng = d.parent.name; meta = {}
        if (d.parent / 'result.json').exists():
            meta = json.loads((d.parent / 'result.json').read_text())
        notes = (d / 'NOTES.md').read_text().strip() if (d / 'NOTES.md').exists() else ''
        name = f'{eng}-{d.name}'
        rows.append(dict(eng=eng, model=meta.get('model', ''), design=d.name, href=f'{d.relative_to(root)}/index.html',
                         video=f'videos/{name}.mp4', poster=f'videos/{name}.jpg', notes=notes))
    (root / 'gallery.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2))
    tpl = (Path(__file__).parent / 'gallery.html').read_text()
    (root / 'index.html').write_text(tpl.replace('/*ROWS*/[]', json.dumps(rows, ensure_ascii=False).replace('<', '\\u003c')))   # model notes can never close the <script>
    print(f'{len(rows)} designs -> gallery.json, index.html')


def check(root: Path, engdir: str):
    for d in designs(root, engdir):
        subprocess.run([sys.executable, str(root / 'kit/tools/shot.py'), str(d), '0.5', '2', '4', '8'])


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('cmd'); ap.add_argument('root'); ap.add_argument('engine', nargs='?')
    ap.add_argument('--prompt', default='battle'); ap.add_argument('--dir', default=''); ap.add_argument('--timeout-min', type=float, default=120)
    ap.add_argument('--only'); ap.add_argument('--to'); ap.add_argument('--msg'); ap.add_argument('--from', dest='frm'); ap.add_argument('--sec', type=float, default=10)
    a = ap.parse_args(); root = Path(a.root).resolve()
    if a.cmd == 'setup': setup(root)
    elif a.cmd == 'run': run(root, a.engine, a.prompt, a.dir, a.timeout_min)
    elif a.cmd == 'render': render(root, a.only, a.to, a.msg, a.frm, a.sec)
    elif a.cmd == 'gallery': gallery(root)
    elif a.cmd == 'check': check(root, a.engine)
    elif a.cmd == 'art': art(root, a.dir, a.timeout_min)
    else: ap.error(a.cmd)
