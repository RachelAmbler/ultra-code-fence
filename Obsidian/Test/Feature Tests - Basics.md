# Ultra Code Fence — Basics (Sections 1–9)

> Part of the [[Feature Tests]] suite. Covers drop-in replacement, titles, styles, line numbers, folding, scrolling, and copy join.

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
