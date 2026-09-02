#!/usr/bin/env python3
# RPG 发版脚本：同步三份副本 + 刷新缓存版本号（根治 ?v 缓存不更新导致新功能不生效）
import os, shutil, re, datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
VERSION = "6.2.6"  # 人类可读版本（功能版本），新增功能时手动改这里
CB = datetime.datetime.now().strftime("%Y%m%d-%H%M")  # 缓存破坏符：每次发版唯一，强制浏览器/CDN 拉新 JS

HTMLS = ["life-rpg.html", "deploy/life-rpg.html", "deploy/deploy/life-rpg.html",
          "deploy/index.html", "deploy/deploy/index.html"]

def sync_assets(src, dst):
    if os.path.exists(dst):
        shutil.rmtree(dst)
    shutil.copytree(src, dst, ignore=shutil.ignore_patterns("garden_*"))

def bump_html(path):
    with open(path, "r", encoding="utf-8") as f:
        html = f.read()
    # 1) 缓存破坏符：任意 ?v=... -> ?v=<CB>（先处理，避免被第2步误改）
    html = re.sub(r"(\?v=)[0-9A-Za-z._-]+", r"\g<1>" + CB, html)
    # 2) 显示版本：title / brand 的 vX.Y.Z -> v<VERSION>
    html = re.sub(r"v\d+\.\d+\.\d+", "v" + VERSION, html)
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    # 校验
    assert "?v=" + CB in html, f"{path} 缓存符未生效"
    assert "v" + VERSION in html, f"{path} 显示版本未生效"

def main():
    for lvl in ["deploy", "deploy/deploy"]:
        os.makedirs(lvl, exist_ok=True)
        shutil.copy2(os.path.join(ROOT, "life-rpg.html"), os.path.join(lvl, "life-rpg.html"))
        shutil.copy2(os.path.join(ROOT, "life-rpg.html"), os.path.join(lvl, "index.html"))
        sync_assets(os.path.join(ROOT, "assets"), os.path.join(lvl, "assets"))
    for p in HTMLS:
        bump_html(os.path.join(ROOT, p))
    print(f"[deploy] 完成：显示版本 v{VERSION} | 缓存符 ?v={CB} | 入口已统一(index+life-rpg)")

if __name__ == "__main__":
    main()
