"""Build learn.html from learn-ad-hcl.md.

Usage: python3 scripts/build_learn.py
Needs: markdown==3.7 and pygments==2.18.0.
The Markdown file is the source. Do not edit learn.html by hand.
"""
import html
import pathlib
import re

import markdown

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = ROOT / "learn-ad-hcl.md"
TARGET = ROOT / "learn.html"
TEMPLATE = ROOT / "scripts" / "learn.template.html"


def convert(text):
    # Let Markdown run inside <details> blocks.
    text = text.replace("<details>", '<details markdown="1">')
    # The page has its own title and top matter.
    text = re.sub(r"\A# .*\n", "", text)
    md = markdown.Markdown(
        extensions=["fenced_code", "codehilite", "tables", "md_in_html", "toc"],
        extension_configs={
            "codehilite": {"css_class": "code", "guess_lang": False},
            "toc": {"toc_depth": "2"},
        },
    )
    body = md.convert(text)
    return body, md.toc_tokens


def sections(body):
    # Wrap each h2 and its content in a <section> for progress tracking.
    parts = re.split(r'(?=<h2 id=")', body)
    out = [parts[0]]
    for part in parts[1:]:
        sid = re.match(r'<h2 id="([^"]+)"', part).group(1)
        lesson = sid.startswith("lesson-")
        attrs = f' id="sec-{sid}" class="doc-section"'
        if lesson:
            attrs += f' data-lesson="{sid}"'
        done = (
            f'<p class="done-row"><button type="button" class="btn-done" data-done="{sid}" aria-pressed="false">Mark this lesson as done</button></p>'
            if lesson
            else ""
        )
        out.append(f"<section{attrs}>{part}{done}</section>")
    return "".join(out).replace("<hr />", "")


def nav(tokens):
    items = []
    for t in tokens:
        name = html.escape(re.sub(r"<[^>]+>", "", t["name"]))
        cls = ' class="is-lesson"' if t["id"].startswith("lesson-") else ""
        items.append(f'<li{cls}><a href="#{t["id"]}" data-nav="{t["id"]}">{name}</a></li>')
    return "\n".join(items)


def main():
    body, tokens = convert(SOURCE.read_text(encoding="utf-8"))
    page = TEMPLATE.read_text(encoding="utf-8")
    page = page.replace("{{NAV}}", nav(tokens)).replace("{{BODY}}", sections(body))
    TARGET.write_text(page, encoding="utf-8")
    print(f"wrote {TARGET.name} ({len(tokens)} sections)")


if __name__ == "__main__":
    main()
