# axiomatic-design-hcl.github.io

This repository holds the website for RequirementsHCL (`.ad.hcl`) and the `adhcl` tool.
GitHub Pages serves it from the `main` branch.

## Files

| File | Contents |
|---|---|
| `index.html` | The overview of the language and the tool. |
| `plugin.html` | The Claude Code plugin and its two skills. |
| `learn.html` | The course. A script makes it from `learn-ad-hcl.md`. |
| `learn-ad-hcl.md` | The source text of the course. |
| `examples/architecture-diagram.html` | An example page from `adhcl diagram`. Do not edit it. |
| `assets/` | The stylesheet, the script, and the icon. |
| `scripts/` | The build script and the page template for the course. |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are. |

## Change the course

Edit `learn-ad-hcl.md`, not `learn.html`. Then make the page again:

```sh
python3 -m pip install markdown==3.7 pygments==2.18.0
python3 scripts/build_learn.py
```

Commit `learn-ad-hcl.md` and `learn.html` together.

## Change the example diagram

`examples/architecture-diagram.html` is a copy of the file with the same name in the `adhcl` repository. That repository makes the file from `examples/architecture.ad.hcl`. When a new adhcl release changes the page, copy the file again. Run this command from the folder that holds the two repositories:

```sh
cp adhcl/examples/architecture-diagram.html axiomatic-design-hcl.github.io/examples/
```
