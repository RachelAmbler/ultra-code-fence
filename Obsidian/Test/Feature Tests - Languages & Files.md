# Ultra Code Fence — Languages & Files (Sections 12–21)

> Part of the [[Feature Tests]] suite. Covers multiple languages, generic processor, edge cases, combined features, file references, filtering, and template variables.

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
