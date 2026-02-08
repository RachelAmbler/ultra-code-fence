# Ultra Code Fence — Output & Downloads (Sections 10–11)

> Part of the [[Feature Tests]] suite. Covers the download button and command output (`ufence-cmdout`) blocks.

---

## 10. Download Button

Each code block above should show a download icon (arrow-to-tray) next to the copy button on hover. Clicking it should open a save dialog.

This block has a title that should become the suggested filename:

```ufence-bash
META:
  TITLE: "setup.sh"
~~~
#!/bin/bash
echo "Setting up environment..."
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/example/repo.git
```

This block has no title — filename should default to `code.python`:

```ufence-python
for i in range(10):
    print(f"Square of {i} is {i**2}")
```

---

## 11. Command Output (ufence-cmdout)

```ufence-cmdout
META:
  TITLE: "Terminal Session"
PROMPT: "^(\\$ )(.*)"
~~~
$ whoami
rachel
$ pwd
/home/rachel/projects
$ ls -la
total 24
drwxr-xr-x  5 rachel staff  160 Feb  7 10:00 .
drwxr-xr-x  3 rachel staff   96 Feb  7 09:00 ..
-rw-r--r--  1 rachel staff  256 Feb  7 10:00 README.md
-rw-r--r--  1 rachel staff 1024 Feb  7 10:00 package.json
$ echo "All done!"
All done!
```

### With custom colours

```ufence-cmdout
META:
  TITLE: "Deployment Log"
PROMPT: "^(\\[.*?\\] -> )(.*)"
RENDER:
  PROMPT:
    COLOUR: "#888888"
    ITALIC: true
  COMMAND:
    COLOUR: "#61afef"
    BOLD: true
  OUTPUT:
    COLOUR: "#98c379"
~~~
[OK] -> ./deploy.sh production
Deploying to production...
Building assets...
Uploading to server...
Done!
[OK] -> ./verify.sh
All checks passed.
[WARN] -> ./cleanup.sh
Removing temporary files...
3 files removed.
```

### No prompt regex (plain output)

No `PROMPT` property — all lines should render as output with no command distinction.

```ufence-cmdout
META:
  TITLE: "Build Log"
~~~
Starting build pipeline...
[1/4] Resolving dependencies
[2/4] Fetching packages
[3/4] Linking dependencies
[4/4] Building fresh packages
success Saved lockfile.
Done in 12.34s.
```

### No title

Cmdout block without `TITLE` — should render without a title bar.

```ufence-cmdout
PROMPT: "^(>>> )(.*)"
~~~
>>> print("hello")
hello
>>> 2 + 2
4
>>> import sys; sys.version
'3.12.0 (main, Oct  2 2024, 12:00:00)'
```

### With description

`DESC` should render as markdown below the title.

```ufence-cmdout
META:
  TITLE: "API Health Check"
  DESC: "Run **daily** at `08:00 UTC` — see [monitoring docs](https://example.com) for thresholds."
PROMPT: "^(\\$ )(.*)"
~~~
$ curl -s https://api.example.com/health | jq .
{
  "status": "healthy",
  "uptime": "14d 3h 22m",
  "version": "2.4.1"
}
$ curl -s https://api.example.com/metrics | jq .requestsPerMinute
4521
```

### With scrolling

Long output with `SCROLL` set — should show a scrollable region.

```ufence-cmdout
META:
  TITLE: "Git Log"
PROMPT: "^(\\$ )(.*)"
RENDER:
  SCROLL: 6
~~~
$ git log --oneline -20
a1b2c3d Fix edge case in parser
e4f5g6h Add download button feature
i7j8k9l Update settings table layout
m0n1o2p Implement copy join with modifiers
q3r4s5t Fix no-YAML code blocks
u6v7w8x Add line number support
y9z0a1b Refactor CSS variables
c2d3e4f Add fold/unfold animation
g5h6i7j Fix scrollbar styling
k8l9m0n Add zebra stripe option
o1p2q3r Initial command output support
s4t5u6v Add file reference resolution
w7x8y9z Fix title template variables
a0b1c2d Add description rendering
e3f4g5h Improve error messages
i6j7k8l Add copy button tooltip
m9n0o1p Fix mobile download fallback
q2r3s4t Update documentation
u5v6w7x Add integration tests
y8z9a0b Release v2026.2.0
```

### Copy button disabled

Cmdout with `COPY: false` — no copy button should appear.

```ufence-cmdout
META:
  TITLE: "Sensitive Output"
PROMPT: "^(\\$ )(.*)"
RENDER:
  COPY: false
~~~
$ cat /etc/passwd | head -3
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
```

### Empty lines in output

Blank lines between output should be preserved.

```ufence-cmdout
META:
  TITLE: "Spaced Output"
PROMPT: "^(\\$ )(.*)"
~~~
$ echo "Section 1"
Section 1

$ echo "Section 2"
Section 2

$ echo "Section 3"
Section 3
```

### Bold and italic combos

Different formatting on each element type.

```ufence-cmdout
META:
  TITLE: "Styled Mix"
PROMPT: "^(→ )(.*)"
RENDER:
  PROMPT:
    COLOUR: "#e06c75"
    BOLD: true
    ITALIC: true
  COMMAND:
    COLOUR: "#c678dd"
    BOLD: true
  OUTPUT:
    COLOUR: "#d19a66"
    ITALIC: true
~~~
→ uname -a
Linux dev-box 6.1.0 #1 SMP x86_64 GNU/Linux
→ uptime
 10:42:31 up 42 days, 3:17, 2 users, load average: 0.12, 0.08, 0.05
→ free -h
              total   used   free  shared  buff/cache  available
Mem:           16G    4.2G   8.1G    256M       3.7G       11G
```
