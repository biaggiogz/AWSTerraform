#!/bin/bash
set -e

echo "Building SQL Compiler WASM module..."

# Install wasm-pack if not available
if ! command -v wasm-pack &> /dev/null; then
    echo "Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Build the WASM module
wasm-pack build --target web --out-dir ../sql-compiler-pkg

# Copy to public directory
mkdir -p ../../../../public/wasm
cp ../sql-compiler-pkg/sql_compiler.js ../../../../public/wasm/
cp ../sql-compiler-pkg/sql_compiler_bg.wasm ../../../../public/wasm/

echo "SQL Compiler WASM module built successfully!"