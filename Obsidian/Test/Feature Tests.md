# Ultra Code Fence — Feature Tests

---

## 1. Drop-in Replacement (Issue #3 — No YAML)

Plain code, no YAML at all. Should render with global settings, no title tab.

```ufence-bash
#!/bin/bash
echo "Hello from a drop-in replacement"
ls -la /tmp
```

```ufence-python
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
```

```ufence-javascript
const sum = (a, b) => a + b;
console.log(sum(2, 3));
```

---

## 2. No Title (Issue #2 — TITLE Omitted)

YAML present but no TITLE specified. Should show code with settings applied, no title tab.

```ufence-bash
RENDER:
  LINES: true
  ZEBRA: true
~~~
#!/bin/bash
for i in 1 2 3 4 5; do
    echo "Iteration $i"
done
```

---

## 3. Explicit Title — Tab Style (Default)

```ufence-python
META:
  TITLE: "hello.py"
  DESC: "A simple greeting script"
~~~
def hello():
    print("Hello, World!")

if __name__ == "__main__":
    hello()
```

---

## 4. Title Styles

### Integrated

```ufence-bash
META:
  TITLE: "deploy.sh"
  DESC: "Deployment script"
RENDER:
  STYLE: "integrated"
  LINES: true
~~~
#!/bin/bash
set -euo pipefail
echo "Deploying..."
rsync -avz ./dist/ server:/var/www/
echo "Done!"
```

### Minimal

```ufence-javascript
META:
  TITLE: "utils.js"
RENDER:
  STYLE: "minimal"
~~~
export function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}
```

### Infobar

```ufence-typescript
META:
  TITLE: "config.ts"
  DESC: "Application configuration with type safety"
RENDER:
  STYLE: "infobar"
  LINES: true
  ZEBRA: true
~~~
interface AppConfig {
    port: number;
    host: string;
    debug: boolean;
    database: {
        url: string;
        pool: number;
    };
}

const config: AppConfig = {
    port: 3000,
    host: "localhost",
    debug: true,
    database: {
        url: "postgres://localhost:5432/app",
        pool: 10,
    },
};
```

### None (hidden title)

```ufence-sql
META:
  TITLE: "query.sql"
RENDER:
  STYLE: "none"
  LINES: true
~~~
SELECT u.name, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.created_at > '2025-01-01'
GROUP BY u.name
ORDER BY order_count DESC
LIMIT 10;
```

---

## 5. Line Numbers and Zebra Stripes

```ufence-go
META:
  TITLE: "main.go"
RENDER:
  LINES: true
  ZEBRA: true
~~~
package main

import "fmt"

func fibonacci(n int) int {
    if n <= 1 {
        return n
    }
    return fibonacci(n-1) + fibonacci(n-2)
}

func main() {
    for i := 0; i < 10; i++ {
        fmt.Printf("fib(%d) = %d\n", i, fibonacci(i))
    }
}
```

---

## 6. Code Folding

Should fold to 5 lines with a "Show more" button.

```ufence-python
META:
  TITLE: "long_script.py"
  DESC: "Click to expand"
RENDER:
  FOLD: 5
  LINES: true
~~~
import os
import sys
import json
import logging
from pathlib import Path
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def process_file(filepath):
    """Process a single file."""
    logger.info(f"Processing: {filepath}")
    with open(filepath, 'r') as f:
        data = json.load(f)
    return data

def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python long_script.py <directory>")
        sys.exit(1)

    target_dir = Path(sys.argv[1])
    if not target_dir.exists():
        logger.error(f"Directory not found: {target_dir}")
        sys.exit(1)

    results = []
    for filepath in target_dir.glob("*.json"):
        results.append(process_file(filepath))

    logger.info(f"Processed {len(results)} files")

if __name__ == "__main__":
    main()
```

---

## 7. Scrolling

Should scroll after 8 lines.

```ufence-ruby
META:
  TITLE: "server.rb"
RENDER:
  SCROLL: 8
  LINES: true
  ZEBRA: true
~~~
require 'sinatra'
require 'json'

set :port, 4567
set :bind, '0.0.0.0'

get '/' do
  content_type :json
  { message: 'Hello, World!', timestamp: Time.now }.to_json
end

get '/health' do
  content_type :json
  { status: 'ok', uptime: Time.now - $start_time }.to_json
end

post '/data' do
  content_type :json
  payload = JSON.parse(request.body.read)
  { received: payload, processed_at: Time.now }.to_json
end

$start_time = Time.now
```

---

## 8. Copy Join — Shift+Click and Alt/Cmd+Click

Shift+click should join with `&&`, Alt/Cmd+click with `;`. Hover the copy button to see the tooltip.

```ufence-sh
apt update
apt upgrade -y
apt autoremove -y
apt clean
```

### With explicit YAML overrides

```ufence-bash
RENDER:
  SHIFT_COPY_JOIN: "&&"
  ALT_COPY_JOIN: ";"
~~~
cd /var/www
git pull origin main
npm install
npm run build
pm2 restart all
```

---

## 9. Copy Join with JOIN_IGNORE_REGEX

### Using per-language default (sh has `^\s*#`)

Shift+click should produce commands only, no comments.

```ufence-sh
# Update the system
apt update
# Upgrade packages
apt upgrade -y
# Clean up
apt autoremove -y
```

### With explicit per-block regex

```ufence-bash
RENDER:
  SHIFT_COPY_JOIN: "&&"
  JOIN_IGNORE_REGEX: "^\\s*#"
~~~
# Step 1: Build
cd /app
npm run build

# Step 2: Deploy
scp -r dist/ server:/var/www/

# Step 3: Restart
ssh server 'systemctl restart nginx'
```

### Python comments (// would not match here)

```ufence-python
RENDER:
  SHIFT_COPY_JOIN: "; "
  JOIN_IGNORE_REGEX: "^\\s*#"
~~~
# Import libraries
import pandas as pd
# Load data
df = pd.read_csv("data.csv")
# Show summary
print(df.describe())
```

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

---

## 12. Multiple Languages

```ufence-java
META:
  TITLE: "Main.java"
RENDER:
  STYLE: "integrated"
  LINES: true
~~~
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
    }
}
```

```ufence-cpp
META:
  TITLE: "main.cpp"
RENDER:
  STYLE: "integrated"
  LINES: true
~~~
#include <iostream>

int main() {
    std::cout << "Hello from C++!" << std::endl;
    return 0;
}
```

```ufence-go
META:
  TITLE: "main.go"
RENDER:
  STYLE: "integrated"
  LINES: true
~~~
package main

import "fmt"

func main() {
    fmt.Println("Hello from Go!")
}
```

---

## 13. Generic ufence-code with LANG Override

```ufence-code
META:
  TITLE: "example.rs"
RENDER:
  LANG: "rust"
  LINES: true
  ZEBRA: true
  STYLE: "infobar"
~~~
fn main() {
    let numbers: Vec<i32> = (1..=10).collect();
    let sum: i32 = numbers.iter().sum();
    println!("Sum of 1..10 = {}", sum);
}
```

---

## 14. Edge Cases

### Empty code block (no content)

```ufence-bash
META:
  TITLE: "empty.sh"
~~~
```

### Single line

```ufence-bash
echo "Just one line"
```

### Very long line (horizontal scroll test)

```ufence-bash
META:
  TITLE: "long_line.sh"
RENDER:
  LINES: true
~~~
echo "This is a very long line that should test horizontal scrolling behaviour in the code block to make sure it handles overflow correctly without breaking the layout or causing visual artefacts in the title bar or copy button positioning"
```

### TITLE set to 'none' (explicit hide)

```ufence-python
META:
  TITLE: "none"
~~~
print("Title should be hidden because TITLE is 'none'")
```

### Copy button disabled

```ufence-bash
META:
  TITLE: "no-copy.sh"
RENDER:
  COPY: false
~~~
echo "There should be no copy button on this block"
```

---

## 15. Combined Features

Everything at once: title, description, line numbers, zebra, fold, copy join, ignore regex.

```ufence-bash
META:
  TITLE: "kitchen-sink.sh"
  DESC: "Testing all features together"
RENDER:
  STYLE: "infobar"
  LINES: true
  ZEBRA: true
  FOLD: 8
  SHIFT_COPY_JOIN: "&&"
  ALT_COPY_JOIN: ";"
  JOIN_IGNORE_REGEX: "^\\s*#"
~~~
#!/bin/bash
set -euo pipefail

# Configuration
APP_DIR="/var/www/app"
BACKUP_DIR="/var/backups"
LOG_FILE="/var/log/deploy.log"

# Create backup
echo "Creating backup..."
tar -czf "$BACKUP_DIR/app-$(date +%Y%m%d).tar.gz" "$APP_DIR"

# Pull latest code
echo "Pulling latest changes..."
cd "$APP_DIR"
git fetch --all
git reset --hard origin/main

# Install dependencies
echo "Installing dependencies..."
npm ci --production

# Build assets
echo "Building..."
npm run build

# Restart services
echo "Restarting services..."
systemctl restart app
systemctl restart nginx

# Verify
echo "Verifying deployment..."
curl -sf http://localhost:3000/health || exit 1

echo "Deployment complete!"
```

---

## 16. File References — Basic Embeds

### Python — whole file with template title

```ufence-python
META:
  PATH: "vault://code/fibonacci.py"
  TITLE: "{filename}"
```

### TypeScript — with description and infobar style

```ufence-typescript
META:
  PATH: "vault://code/server.ts"
  TITLE: "{filename} — {size}"
  DESC: "Simple HTTP server with typed routes"
RENDER:
  STYLE: "infobar"
  LINES: true
```

### Go — integrated style with zebra

```ufence-go
META:
  PATH: "vault://code/config.go"
  TITLE: "{basename}"
  DESC: "Application configuration structs and loader"
RENDER:
  STYLE: "integrated"
  LINES: true
  ZEBRA: true
```

### SQL — minimal style, scrollable

```ufence-sql
META:
  PATH: "vault://code/queries.sql"
  TITLE: "{filename}"
RENDER:
  STYLE: "minimal"
  SCROLL: 15
  LINES: true
```

### Bash — folded with copy join

```ufence-bash
META:
  PATH: "vault://code/deploy.sh"
  TITLE: "{filename}"
  DESC: "Click to expand the full deployment script"
RENDER:
  FOLD: 10
  LINES: true
  SHIFT_COPY_JOIN: "&&"
  ALT_COPY_JOIN: ";"
  JOIN_IGNORE_REGEX: "^\\s*#"
```

---

## 17. File References — Line Filtering (BY_LINES)

### Extract lines 5–21 (the iterative implementation)

```ufence-python
META:
  PATH: "vault://code/fibonacci.py"
  TITLE: "fibonacci_iterative()"
FILTER:
  BY_LINES:
    RANGE: 5, 12
RENDER:
  LINES: true
```

### Extract lines 30–60 from the SQL (revenue query only)

```ufence-sql
META:
  PATH: "vault://code/queries.sql"
  TITLE: "Top users by revenue"
FILTER:
  BY_LINES:
    RANGE: 14, 29
RENDER:
  LINES: true
  ZEBRA: true
```

---

## 18. File References — Marker Filtering (BY_MARKS)

### Extract between `# BEGIN BACKUP` and `# END BACKUP`

```ufence-bash
META:
  PATH: "vault://code/deploy.sh"
  TITLE: "Backup function"
FILTER:
  BY_MARKS:
    START: "# BEGIN BACKUP"
    END: "# END BACKUP"
    INCLUSIVE: false
RENDER:
  LINES: true
```

### Extract between `# BEGIN DEPLOY` and `# END DEPLOY`

```ufence-bash
META:
  PATH: "vault://code/deploy.sh"
  TITLE: "Deploy function"
FILTER:
  BY_MARKS:
    START: "# BEGIN DEPLOY"
    END: "# END DEPLOY"
    INCLUSIVE: false
RENDER:
  STYLE: "integrated"
  LINES: true
  ZEBRA: true
```

---

## 19. File References — Chained Filters

### Lines 50–100, then markers within that range

```ufence-bash
META:
  PATH: "vault://code/deploy.sh"
  TITLE: "Deploy core (chained filter)"
  DESC: "BY_LINES first, then BY_MARKS"
FILTER:
  BY_LINES:
    RANGE: 50, 100
  BY_MARKS:
    START: "# BEGIN DEPLOY"
    END: "# END DEPLOY"
    INCLUSIVE: false
RENDER:
  STYLE: "infobar"
  LINES: true
```

---

## 20. File References — Template Variables

### All the variable formats

```ufence-python
META:
  PATH: "vault://code/fibonacci.py"
  TITLE: "{filename:upper} — {size}"
  DESC: "Modified: {modified:relative}"
RENDER:
  STYLE: "infobar"
  LINES: true
  FOLD: 8
```

### Basename and extension

```ufence-go
META:
  PATH: "vault://code/config.go"
  TITLE: "{basename} ({extension})"
RENDER:
  STYLE: "tab"
```

---

## 21. File References — All Title Styles on Same File

### Tab

```ufence-typescript
META:
  PATH: "vault://code/server.ts"
  TITLE: "Tab: {filename}"
RENDER:
  STYLE: "tab"
FILTER:
  BY_LINES:
    RANGE: 1, 10
```

### Integrated

```ufence-typescript
META:
  PATH: "vault://code/server.ts"
  TITLE: "Integrated: {filename}"
RENDER:
  STYLE: "integrated"
FILTER:
  BY_LINES:
    RANGE: 1, 10
```

### Minimal

```ufence-typescript
META:
  PATH: "vault://code/server.ts"
  TITLE: "Minimal: {filename}"
RENDER:
  STYLE: "minimal"
FILTER:
  BY_LINES:
    RANGE: 1, 10
```

### Infobar

```ufence-typescript
META:
  PATH: "vault://code/server.ts"
  TITLE: "Infobar: {filename}"
RENDER:
  STYLE: "infobar"
FILTER:
  BY_LINES:
    RANGE: 1, 10
```

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
