# Ultra Code Fence — Presets (Section 31)

> Part of the [[Feature Tests]] suite. Covers the Presets (reusable presets) feature.

---

## 31. Presets — Reusable Presets

> Create a preset called **"teaching"** in Settings → Presets with this YAML:
> ```
> RENDER:
>   LINES: true
>   ZEBRA: true
>   FOLD: 20
> META:
>   TITLE: "Lesson Example"
> ```
> Then the blocks below will inherit those defaults automatically.
>
> **Note:** After editing the `ufence-ufence` block or changing a preset in Settings, use the **Force Refresh** command (Command palette → *Ultra Code Fence: Force refresh all code blocks*) to update existing blocks on the page. Preset changes via the Settings UI apply automatically on Save.

### 31a. Page-level preset (invisible config block)

Sets defaults for all ufence blocks on this page (unless overridden). Only one `ufence-ufence` block per page is supported. After editing, run **Force Refresh** to apply changes:

```ufence-ufence
RENDER:
   ZEBRA: true
   LINES: true
```

### 31b. Block inherits page preset

This block has no explicit `META.PRESET` — it inherits "teaching" from the page-level config above. It should show line numbers, zebra stripes, and fold at 20 lines.

```ufence-typescript
~~~
// This block inherits the "teaching" preset from the page-level config.
// It should have: line numbers, zebra stripes, and fold at 20 lines.
function fibonacci(n: number): number {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));
```

### 31c. Block with explicit preset reference

This block explicitly references the "teaching" preset under META:

```ufence-python
META:
  PRESET: "teaching"
  TITLE: "Explicit Reference"
~~~
# This block explicitly references META.PRESET: "teaching"
# It should show line numbers, zebra stripes, and fold at 20 lines.
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

print(quicksort([3, 6, 8, 10, 1, 2, 1]))
```

### 31d. Block overrides preset values

This block uses the "teaching" preset but overrides ZEBRA to false and supplies its own TITLE:

```ufence-javascript
META:
  PRESET: "teaching"
  TITLE: "Override Example"
RENDER:
  ZEBRA: false
~~~
// This block inherits from "teaching" but overrides:
//   - TITLE → "Override Example" (instead of "Lesson Example")
//   - ZEBRA → false (no zebra stripes)
// It should still have: line numbers, fold at 20 lines.
const greet = (name) => `Hello, ${name}!`;
console.log(greet("World"));
```

### 31e. Page-level inline defaults (no named preset)

The page-level `ufence-ufence` block in 31a above sets inline defaults (ZEBRA + LINES) for every ufence block on this page. Only one `ufence-ufence` block is allowed per page — the first one wins.

This block should have zebra stripes and line numbers from the page-level config:

```ufence-go
// Inherited inline page defaults: ZEBRA + LINES
package main

import "fmt"

func main() {
    for i := 0; i < 5; i++ {
        fmt.Println("Hello from Go!", i)
    }
}
```

### 31f. Block-level preset with overrides

A block can reference a named preset and override individual values. Here we use the "teaching" preset but turn ZEBRA off at the block level:

```ufence-rust
META:
  PRESET: "teaching"
RENDER:
  ZEBRA: false
~~~
// teaching preset + block-level override (ZEBRA: false)
// Should have: line numbers, fold at 20, title "Lesson Example", but NO zebra
fn main() {
    let numbers: Vec<i32> = (1..=10).collect();
    let sum: i32 = numbers.iter().sum();
    println!("Sum: {}", sum);
}
```
