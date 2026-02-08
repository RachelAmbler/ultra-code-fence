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

### 31a. Page-level preset (invisible config block)

Sets a default preset for all ufence blocks on this page (unless overridden):

```ufence-ufence
PRESET: "teaching"
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

Instead of referencing a named preset, you can put config directly into a `ufence-ufence` block. Every ufence block on the page will inherit these defaults.

```ufence-ufence
RENDER:
  ZEBRA: true
  LINES: true
```

This block should have zebra stripes and line numbers from the inline page defaults above:

```ufence-go
~~~
// Inherited inline page defaults: ZEBRA + LINES
package main

import "fmt"

func main() {
    for i := 0; i < 5; i++ {
        fmt.Println("Hello from Go!", i)
    }
}
```

### 31f. Combined: named preset + inline overrides

You can also combine a named preset reference with inline config. The inline config overrides the preset, and block-level config overrides everything.

```ufence-ufence
PRESET: "teaching"
RENDER:
  ZEBRA: false
```

This block inherits "teaching" (line numbers, fold 20, title) but ZEBRA is turned off by the inline page override:

```ufence-rust
~~~
// teaching preset + inline override (ZEBRA: false)
// Should have: line numbers, fold at 20, title "Lesson Example", but NO zebra
fn main() {
    let numbers: Vec<i32> = (1..=10).collect();
    let sum: i32 = numbers.iter().sum();
    println!("Sum: {}", sum);
}
```
