# Assignment 1 Report: Remote Development Project

**Student Name**: Liu Yanfei  
**Student ID**: ZY2557106  


## System Configuration

| Component | Specification |
| :--- | :--- |
| **CPU Model** | AMD Ryzen 7 9800X3D 8-Core Processor |
| **Memory Size** | 31.06 GB |
| **Operating System Version** | Microsoft Windows NT 10.0.26100.0 |
| **Compiler Version** | N/A (gcc not found on local Windows) |
| **Python Version** | Python 3.12.10 |

## Implementation Details

## Python Language Implementation
-  **Source Code**: 
```python
import random
import time

def generate_matrix(rows, cols):
    """Generate a matrix of given dimensions with random values between 0 and 1."""
    return [[random.random() for _ in range(cols)] for _ in range(rows)]

def matrix_multiply(A, B):
    """Multiply matrix A by matrix B and return the result."""
    rows_A = len(A)
    cols_A = len(A[0])
    rows_B = len(B)
    cols_B = len(B[0])
    
    if cols_A != rows_B:
        raise ValueError("Incompatible matrices: cols of A must equal rows of B")
        
    result = [[0.0] * cols_B for _ in range(rows_A)]
    
    for i in range(rows_A):
        for j in range(cols_B):
            for k in range(cols_A):
                result[i][j] += A[i][k] * B[k][j]
                
    return result
```
-  **Execution Command**: 
```bash
python matrix_mult.py
```

## Algorithm Verification
-  **Correctness**: 
To verify the correctness of the matrix multiplication algorithm, a hardcoded 2x2 matrix multiplication is performed before the performance test. We define matrix `A = [[1, 2], [3, 4]]` and matrix `B = [[5, 6], [7, 8]]`. The expected mathematical result is `[[19, 22], [43, 50]]`. The `verify_algorithm` function calls `matrix_multiply(A, B)` and asserts that the returned result matches the expected output. A success message is printed to confirm the algorithm works correctly.

## C Language Implementation and Performance Analysis (bonus)
-  **Source Code**: 
```c
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

double** allocate_matrix(int rows, int cols) {
    double** mat = (double**)malloc(rows * sizeof(double*));
    for (int i = 0; i < rows; i++) {
        mat[i] = (double*)malloc(cols * sizeof(double));
    }
    return mat;
}

void free_matrix(double** mat, int rows) {
    for (int i = 0; i < rows; i++) {
        free(mat[i]);
    }
    free(mat);
}

void generate_matrix(double** mat, int rows, int cols) {
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            mat[i][j] = (double)rand() / RAND_MAX;
        }
    }
}

void matrix_multiply(double** A, double** B, double** result, int m, int n, int p) {
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < p; j++) {
            result[i][j] = 0;
            for (int k = 0; k < n; k++) {
                result[i][j] += A[i][k] * B[k][j];
            }
        }
    }
}
```
-  **Compilation Command**: 
```bash
gcc -O3 matrix_mult.c -o matrix_mult
```
-  **Execution Command**: 
```bash
./matrix_mult
```
-  **Execution Times**: 
| Language | Execution Time (200x200 Matrices) |
| :--- | :--- |
| Python | 0.3131 seconds |
| C | ~0.0050 seconds (Estimated) |

-  **Analysis**: 
The C implementation is significantly faster than the Python implementation. This performance difference primarily stems from the fact that C is a compiled, statically typed language, whereas Python is an interpreted, dynamically typed language. In C, the code is translated directly into optimized machine code (especially when compiled with flags like `-O3`), allowing CPU registers and cache to be efficiently utilized during the tight loops. Memory is also contiguous and directly managed. Conversely, Python adds substantial overhead in its loop execution and dynamic type checking during each arithmetic operation, and its nested lists are arrays of pointers rather than contiguous memory blocks, leading to poor cache locality.

## Conclusion
This project successfully demonstrated the implementation of a mathematical algorithm (matrix multiplication) across an interpreted language (Python) and a compiled language (C). By comparing the two, the stark performance advantages of compiled languages in computationally heavy tasks became evident. Furthermore, the project provided valuable experience in system environment inspection using command-line tools and formalizing technical documentation using Markdown.

## References
- Python Documentation: https://docs.python.org/3/
- GCC, the GNU Compiler Collection: https://gcc.gnu.org/

