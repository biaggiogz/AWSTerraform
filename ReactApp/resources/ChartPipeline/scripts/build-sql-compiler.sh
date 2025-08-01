#!/bin/bash
set -e

echo "Building SQL Compiler WASM module..."

# Navigate to the SQL compiler directory
cd "$(dirname "$0")/../src/wasm/sql-compiler"

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo "Rust not found. Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
fi

# Install wasm-pack if not available
if ! command -v wasm-pack &> /dev/null; then
    echo "Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Add wasm32 target
rustup target add wasm32-unknown-unknown

# Build the WASM module
echo "Compiling Rust to WASM..."
wasm-pack build --target web --out-dir ../sql-compiler-pkg --no-typescript

# Copy to src directory for imports
echo "Copying WASM files to src directory..."
mkdir -p ../wasm-modules
cp ../sql-compiler-pkg/sql_compiler.js ../wasm-modules/
cp ../sql-compiler-pkg/sql_compiler_bg.wasm ../wasm-modules/

# Add eslint disable to generated JS file
echo "/* eslint-disable */" | cat - ../wasm-modules/sql_compiler.js > temp && mv temp ../wasm-modules/sql_compiler.js

# Also copy to public for runtime access
mkdir -p ../../../public/wasm
cp ../sql-compiler-pkg/sql_compiler_bg.wasm ../../../public/wasm/

# Update package.json to include build script
cd ../../../
if ! grep -q "sql-compiler:build" package.json; then
    echo "Adding build script to package.json..."
    npm pkg set scripts.sql-compiler:build="./scripts/build-sql-compiler.sh"
fi

echo "SQL Compiler WASM module built successfully!"
echo "Files created:"
echo "  - src/wasm/wasm-modules/sql_compiler.js"
echo "  - src/wasm/wasm-modules/sql_compiler_bg.wasm"
echo "  - public/wasm/sql_compiler_bg.wasm"