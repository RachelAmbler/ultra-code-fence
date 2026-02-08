# Ultra Code Fence — Callouts (Sections 22–30)

> Part of the [[Feature Tests]] suite. Covers all callout display modes (inline, footnote, popover), mixed modes, print overrides, file references, range targeting, type showcase, and border style.

---

## 22. Callouts — Inline Display

Callouts appear as annotated rows between code lines. Line numbers are preserved.
Each callout can have a TYPE (note, info, warning, tip, etc.) that controls the border colour and icon.

### Basic inline callout by line number

```ufence-typescript
META:
  TITLE: "server.ts — inline callouts"
RENDER:
  STYLE: "integrated"
  LINES: true
CALLOUT:
  DISPLAY: "inline"
  ENTRIES:
    - LINE: 3
      TEXT: "Define the shape of each API route"
      TYPE: info
    - LINE: 8
      TEXT: "Generic wrapper ensures **consistent** response format across all endpoints"
      TYPE: tip
~~~
interface Route {
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    handler: (req: Request) => Promise<Response>;
}

interface ApiResponse<T> {
    status: number;
    data: T;
    timestamp: string;
}
```

### Inline callout by MARK (string search)

```ufence-python
META:
  TITLE: "fibonacci.py — mark-based callouts"
RENDER:
  LINES: true
  ZEBRA: true
CALLOUT:
  DISPLAY: "inline"
  ENTRIES:
    - MARK: "lru_cache"
      TEXT: "Python's built-in memoisation decorator — caches *all* previous results"
      TYPE: tip
    - MARK: "yield a"
      TEXT: "Generator pattern: produces values **lazily** instead of building a list"
      TYPE: info
~~~
from functools import lru_cache

@lru_cache(maxsize=None)
def fibonacci_memoised(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci_memoised(n - 1) + fibonacci_memoised(n - 2)

def fibonacci_generator(limit: int):
    a, b = 0, 1
    while a <= limit:
        yield a
        a, b = b, a + b
```

### Inline callout with REPLACE

The marker line content is replaced by the callout text.

```ufence-bash
META:
  TITLE: "deploy.sh — replace mode"
RENDER:
  LINES: true
CALLOUT:
  DISPLAY: "inline"
  ENTRIES:
    - MARK: "# TODO:"
      TEXT: "Add retry logic with **exponential backoff** here"
      REPLACE: true
      TYPE: warning
~~~
#!/bin/bash
set -euo pipefail

echo "Starting deployment..."
rsync -avz ./dist/ server:/var/www/
# TODO: handle failures
echo "Done!"
```

---

## 23. Callouts — Footnote Display

Superscript numbers appear at the end of each annotated line, with a footnote section below the code block.
Footnotes keep numbered references regardless of TYPE.

```ufence-typescript
META:
  TITLE: "server.ts — footnotes"
RENDER:
  STYLE: "infobar"
  LINES: true
CALLOUT:
  DISPLAY: "footnote"
  ENTRIES:
    - LINE: 1
      TEXT: "Typed HTTP methods prevent typos at **compile time**"
      TYPE: info
    - LINE: 5
      TEXT: "Handler returns a `Promise` — all routes are async"
      TYPE: note
    - LINE: 9
      TEXT: "Generics let callers specify the response payload type"
      TYPE: tip
~~~
interface Route {
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    handler: (req: Request) => Promise<Response>;
}

interface ApiResponse<T> {
    status: number;
    data: T;
    timestamp: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    role: "admin" | "user" | "guest";
}
```

---

## 24. Callouts — Popover Display

Callout content appears in a floating popover when clicking the trigger icon.
Popovers keep numbered triggers and gain a type-coloured left border.

```ufence-python
META:
  TITLE: "fibonacci.py — popovers"
RENDER:
  LINES: true
  STYLE: "integrated"
CALLOUT:
  DISPLAY: "popover"
  ENTRIES:
    - MARK: "def fibonacci_iterative"
      TEXT: "O(n) time, O(1) space — the **most efficient** for single lookups"
      TYPE: success
    - MARK: "def fibonacci_recursive"
      TEXT: "O(2^n) — *exponential!* Don't use this for large n"
      TYPE: danger
    - MARK: "lru_cache"
      TEXT: "Adds O(n) space but keeps recursive elegance with O(n) time"
      TYPE: tip
~~~
def fibonacci_iterative(n: int) -> int:
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

def fibonacci_recursive(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci_recursive(n - 1) + fibonacci_recursive(n - 2)

from functools import lru_cache

@lru_cache(maxsize=None)
def fibonacci_memoised(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci_memoised(n - 1) + fibonacci_memoised(n - 2)
```

---

## 25. Callouts — Mixed Display Modes

Individual entries can override the block-level display mode.
Each entry can also have its own TYPE.

```ufence-typescript
META:
  TITLE: "server.ts — mixed callouts"
RENDER:
  STYLE: "integrated"
  LINES: true
  ZEBRA: true
CALLOUT:
  DISPLAY: "footnote"
  ENTRIES:
    - LINE: 1
      TEXT: "Strict **union type** for HTTP methods"
      DISPLAY: "inline"
      TYPE: info
    - LINE: 5
      TEXT: "Every handler is async — returns a `Promise<Response>`"
      TYPE: note
    - LINE: 10
      TEXT: "Role-based access control via union type"
      DISPLAY: "popover"
      TYPE: warning
~~~
interface Route {
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    handler: (req: Request) => Promise<Response>;
}

interface User {
    id: number;
    name: string;
    email: string;
    role: "admin" | "user" | "guest";
}
```

---

## 26. Callouts — Print Display Override

PRINT_DISPLAY overrides the display mode when exporting to PDF.

```ufence-python
META:
  TITLE: "fibonacci.py — print-friendly"
RENDER:
  LINES: true
CALLOUT:
  DISPLAY: "popover"
  PRINT_DISPLAY: "inline"
  ENTRIES:
    - LINE: 1
      TEXT: "Iterative is the go-to for **production** code"
      TYPE: success
    - LINE: 8
      TEXT: "Generator version is great for streaming or pipeline usage"
      TYPE: tip
~~~
def fibonacci_iterative(n: int) -> int:
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

def fibonacci_generator(limit: int):
    a, b = 0, 1
    while a <= limit:
        yield a
        a, b = b, a + b
```

---

## 27. Callouts — File Reference with Callouts

Callouts work with vault:// file references too.

```ufence-typescript
META:
  PATH: "vault://code/server.ts"
  TITLE: "{filename} — annotated"
  DESC: "Callouts on an embedded file reference"
RENDER:
  STYLE: "infobar"
  LINES: true
  SCROLL: 12
CALLOUT:
  DISPLAY: "footnote"
  ENTRIES:
    - MARK: "const users"
      TEXT: "In production, this would be a **database query**"
      TYPE: warning
    - MARK: "jsonResponse"
      TEXT: "Helper ensures every response has the same envelope shape"
      TYPE: info
    - MARK: "handleRequest"
      TEXT: "Simple router — loops through routes until one matches"
      TYPE: note
```

---

## 28. Callouts — LINES Range Targeting

Target a range of lines with a single callout.

```ufence-bash
META:
  TITLE: "deploy.sh — range callout"
RENDER:
  LINES: true
CALLOUT:
  DISPLAY: "inline"
  ENTRIES:
    - LINES: [3, 5]
      TEXT: "These three lines handle the **critical** backup step — if this fails, abort!"
      TYPE: danger
~~~
#!/bin/bash
set -euo pipefail
BACKUP_DIR="/var/backups"
tar -czf "$BACKUP_DIR/app-$(date +%Y%m%d).tar.gz" /var/www/app
echo "Backup complete"
echo "Proceeding with deployment..."
rsync -avz ./dist/ server:/var/www/
echo "Done!"
```

---

## 29. Callouts — Type Showcase

All major Obsidian callout types displayed inline. Each type has its own colour and icon.
Aliases (e.g. `hint` → `tip`, `caution` → `warning`) also work.

```ufence-javascript
META:
  TITLE: "callout-types.js — type showcase"
RENDER:
  LINES: true
  STYLE: "integrated"
CALLOUT:
  DISPLAY: "inline"
  ENTRIES:
    - LINE: 1
      TEXT: "Default **note** — general annotation\nThis can be more than 1 line"
      TYPE: note
    - LINE: 2
      TEXT: "**Abstract** — high-level summary\nThis takes *basic* **markdown**"
      TYPE: abstract
    - LINE: 3
      TEXT: "**Info** — useful background detail"
      TYPE: info
    - LINE: 4
      TEXT: "**Tip** — a handy suggestion"
      TYPE: tip
    - LINE: 5
      TEXT: "**Success** — this works correctly"
      TYPE: success
    - LINE: 6
      TEXT: "**Question** — something to think about"
      TYPE: question
    - LINE: 7
      TEXT: "**Warning** — proceed with caution"
      TYPE: warning
    - LINE: 8
      TEXT: "**Failure** — this approach won't work"
      TYPE: failure
    - LINE: 9
      TEXT: "**Danger** — serious risk ahead"
      TYPE: danger
    - LINE: 10
      TEXT: "**Bug** — known defect here"
      TYPE: bug
    - LINE: 11
      TEXT: "**Example** — illustrative snippet"
      TYPE: example
    - LINE: 12
      TEXT: "**Quote** — cited from the docs"
      TYPE: quote
    - LINE: 13
      TEXT: "**Todo** — needs implementation"
      TYPE: todo
~~~
const note     = "default annotation";
const abstract = "high-level summary";
const info     = "background detail";
const tip      = "handy suggestion";
const success  = "all tests passing";
const question = "worth investigating";
const warning  = "use with caution";
const failure  = "deprecated approach";
const danger   = "security risk";
const bug      = "known issue #42";
const example  = "see usage below";
const quote    = "per the spec...";
const todo     = "implement by Friday";
```

### Alias resolution

TYPE aliases resolve to their canonical type. `hint` → `tip`, `caution` → `warning`, etc.

```ufence-python
META:
  TITLE: "aliases.py — alias demo"
RENDER:
  LINES: true
CALLOUT:
  DISPLAY: "inline"
  ENTRIES:
    - LINE: 1
      TEXT: "`hint` resolves to **tip** styling"
      TYPE: hint
    - LINE: 2
      TEXT: "`caution` resolves to **warning** styling"
      TYPE: caution
    - LINE: 3
      TEXT: "`error` resolves to **danger** styling"
      TYPE: error
    - LINE: 4
      TEXT: "`check` resolves to **success** styling"
      TYPE: check
~~~
use_hint = True
use_caution = True
raise_error = False
check_done = True
```

---

## 30. Callouts — Border Style

The STYLE option controls the visual appearance of inline callouts.
`STYLE: "standard"` (default) uses a left border. `STYLE: "border"` wraps each callout in a thin rounded outline.

### Standard style (default)

```ufence-typescript
META:
  TITLE: "server.ts — standard callouts"
RENDER:
  LINES: true
  STYLE: "integrated"
CALLOUT:
  DISPLAY: "inline"
  ENTRIES:
    - LINE: 1
      TEXT: "Standard style — **left border** only"
      TYPE: info
    - LINE: 3
      TEXT: "This is the default when STYLE is omitted"
      TYPE: tip
~~~
interface Route {
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    handler: (req: Request) => Promise<Response>;
}
```

### Border style

```ufence-typescript
META:
  TITLE: "server.ts — border callouts"
RENDER:
  LINES: true
  STYLE: "integrated"
CALLOUT:
  DISPLAY: "inline"
  STYLE: "border"
  ENTRIES:
    - LINE: 1
      TEXT: "Border style — thin **rounded outline**"
      TYPE: info
    - LINE: 3
      TEXT: "Set `STYLE: border` in the CALLOUT section"
      TYPE: tip
    - LINE: 5
      TEXT: "Works with all callout types"
      TYPE: warning
~~~
interface Route {
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    handler: (req: Request) => Promise<Response>;
}
```
