# -*- coding: utf-8 -*-
"""驱动 editor_sdk 往实验报告表格单元格里写内容（段落 + 内联图片）。"""
import subprocess, sys, os, json

SKILL = r"D:/新建文件夹 (2)/WorkBuddy/resources/app.asar.unpacked/resources/plugins/workbuddy-builtin/skills/tencent-local-office-edit"
FILE = "C:/Users/殷康竣/Desktop/03 实验三：路由配置与页面导航（学号+姓名）.doc"
SHOTS = "D:/vue/vue-project/_report_shots_exp3_final"

def call(tool, **kw):
    args = [sys.executable, "edsdk.py", "call", tool, "file_id=" + FILE]
    for k, v in kw.items():
        if isinstance(v, (dict, list)):
            args.append("--json"); args.append(json.dumps({k: v}, ensure_ascii=False))
        else:
            args.append(f"{k}={v}")
    r = subprocess.run(args, cwd=SKILL, capture_output=True, text=True, encoding="utf-8")
    out = (r.stdout or "") + "\n" + (r.stderr or "")
    for line in out.splitlines():
        line = line.strip()
        if line.startswith("{"):
            try:
                return json.loads(line)
            except Exception:
                continue
    print("RAW:", out.strip()[:400]); return None

def para(idx, text, bold=False, size=None):
    tf = {}
    if bold: tf["bold"] = True
    if size: tf["font_size"] = size
    kw = dict(idx=idx, text=text)
    if tf: kw["text_format"] = json.dumps(tf, ensure_ascii=False)
    r = call("doc_insert_paragraph_with_text", **kw)
    return r["next_index"] if r and "next_index" in r else None

def image(idx, path, w=420):
    r = call("doc_insert_paragraph_with_text",
             idx=idx, runs=[{"type": "image", "image_path": path, "w": w}])
    return r["next_index"] if r and "next_index" in r else None
