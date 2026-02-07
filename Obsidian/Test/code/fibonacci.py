"""Fibonacci sequence implementations."""

# ============ ITERATIVE ============

def fibonacci_iterative(n: int) -> int:
    """Calculate the nth Fibonacci number iteratively."""
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

# ============ RECURSIVE ============

def fibonacci_recursive(n: int) -> int:
    """Calculate the nth Fibonacci number recursively."""
    if n <= 1:
        return n
    return fibonacci_recursive(n - 1) + fibonacci_recursive(n - 2)

# ============ MEMOISED ============

from functools import lru_cache

@lru_cache(maxsize=None)
def fibonacci_memoised(n: int) -> int:
    """Calculate the nth Fibonacci number with memoisation."""
    if n <= 1:
        return n
    return fibonacci_memoised(n - 1) + fibonacci_memoised(n - 2)

# ============ GENERATOR ============

def fibonacci_generator(limit: int):
    """Generate Fibonacci numbers up to a limit."""
    a, b = 0, 1
    while a <= limit:
        yield a
        a, b = b, a + b

# ============ MAIN ============

if __name__ == "__main__":
    print("Iterative:")
    for i in range(10):
        print(f"  fib({i}) = {fibonacci_iterative(i)}")

    print("\nRecursive:")
    for i in range(10):
        print(f"  fib({i}) = {fibonacci_recursive(i)}")

    print("\nMemoised:")
    for i in range(10):
        print(f"  fib({i}) = {fibonacci_memoised(i)}")

    print("\nGenerator (up to 100):")
    print(f"  {list(fibonacci_generator(100))}")
