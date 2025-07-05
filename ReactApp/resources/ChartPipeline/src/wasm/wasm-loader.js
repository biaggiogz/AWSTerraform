/**
 * WASM Loader Utility
 * Handles loading WASM modules with fallback to JavaScript implementations
 */

class WasmLoader {
  constructor() {
    this.modules = new Map();
    this.loadingPromises = new Map();
  }

  /**
   * Load a WASM module with fallback
   * @param {string} moduleName - Name of the WASM module
   * @param {string} wasmPath - Path to the WASM file
   * @param {Function} fallbackImpl - JavaScript fallback implementation
   * @returns {Promise<Object>} Module instance
   */
  async loadModule(moduleName, wasmPath, fallbackImpl) {
    // Return cached module if already loaded
    if (this.modules.has(moduleName)) {
      return this.modules.get(moduleName);
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(moduleName)) {
      return this.loadingPromises.get(moduleName);
    }

    const loadingPromise = this._loadModuleInternal(moduleName, wasmPath, fallbackImpl);
    this.loadingPromises.set(moduleName, loadingPromise);

    try {
      const module = await loadingPromise;
      this.modules.set(moduleName, module);
      this.loadingPromises.delete(moduleName);
      return module;
    } catch (error) {
      this.loadingPromises.delete(moduleName);
      throw error;
    }
  }

  async _loadModuleInternal(moduleName, wasmPath, fallbackImpl) {
    try {
      // Check if WebAssembly is supported
      if (typeof WebAssembly === 'undefined') {
        console.warn(`WebAssembly not supported, using JavaScript fallback for ${moduleName}`);
        return { type: 'js', impl: fallbackImpl };
      }

      // Try to load WASM module
      const wasmModule = await WebAssembly.instantiateStreaming(fetch(wasmPath));
      console.log(`Successfully loaded WASM module: ${moduleName}`);
      
      return {
        type: 'wasm',
        instance: wasmModule.instance,
        exports: wasmModule.instance.exports
      };
    } catch (error) {
      console.warn(`Failed to load WASM module ${moduleName}:`, error);
      console.log(`Falling back to JavaScript implementation for ${moduleName}`);
      
      return { type: 'js', impl: fallbackImpl };
    }
  }

  /**
   * Check if a module is loaded and using WASM
   * @param {string} moduleName - Name of the module
   * @returns {boolean} True if using WASM, false if using JS fallback
   */
  isUsingWasm(moduleName) {
    const module = this.modules.get(moduleName);
    return module && module.type === 'wasm';
  }

  /**
   * Get performance metrics for loaded modules
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    const metrics = {};
    this.modules.forEach((module, name) => {
      metrics[name] = {
        type: module.type,
        loaded: true
      };
    });
    return metrics;
  }
}

// Global WASM loader instance
export const wasmLoader = new WasmLoader();

/**
 * Memory management utilities for WASM
 */
export class WasmMemoryManager {
  constructor(wasmInstance) {
    this.instance = wasmInstance;
    this.allocatedPointers = new Set();
  }

  /**
   * Allocate memory in WASM
   * @param {number} size - Size in bytes
   * @returns {number} Pointer to allocated memory
   */
  malloc(size) {
    if (!this.instance.exports.malloc) {
      throw new Error('WASM module does not export malloc function');
    }
    
    const ptr = this.instance.exports.malloc(size);
    this.allocatedPointers.add(ptr);
    return ptr;
  }

  /**
   * Free allocated memory
   * @param {number} ptr - Pointer to free
   */
  free(ptr) {
    if (this.instance.exports.free && this.allocatedPointers.has(ptr)) {
      this.instance.exports.free(ptr);
      this.allocatedPointers.delete(ptr);
    }
  }

  /**
   * Free all allocated memory
   */
  freeAll() {
    this.allocatedPointers.forEach(ptr => {
      if (this.instance.exports.free) {
        this.instance.exports.free(ptr);
      }
    });
    this.allocatedPointers.clear();
  }

  /**
   * Get WASM memory view
   * @returns {Uint8Array} Memory view
   */
  getMemoryView() {
    return new Uint8Array(this.instance.exports.memory.buffer);
  }

  /**
   * Write string to WASM memory
   * @param {string} str - String to write
   * @returns {number} Pointer to string in memory
   */
  writeString(str) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str + '\0'); // null-terminated
    const ptr = this.malloc(bytes.length);
    const memory = this.getMemoryView();
    memory.set(bytes, ptr);
    return ptr;
  }

  /**
   * Read string from WASM memory
   * @param {number} ptr - Pointer to string
   * @param {number} length - Length of string (optional)
   * @returns {string} Read string
   */
  readString(ptr, length) {
    const memory = this.getMemoryView();
    let end = ptr;
    
    if (length) {
      end = ptr + length;
    } else {
      // Find null terminator
      while (memory[end] !== 0 && end < memory.length) {
        end++;
      }
    }
    
    const bytes = memory.slice(ptr, end);
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }
}

export default wasmLoader;