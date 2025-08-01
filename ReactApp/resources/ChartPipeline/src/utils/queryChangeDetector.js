import sqlCompilerBridge from '../wasm/sqlCompilerBridge';

class QueryChangeDetector {
  constructor() {
    this.watchers = new Map();
    this.queryHashes = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      await sqlCompilerBridge.initialize();
      this.initialized = true;
      console.log('Query Change Detector initialized');
    } catch (error) {
      console.error('Failed to initialize Query Change Detector:', error);
    }
  }

  // Watch for changes in a specific query template
  watchQuery(templateName, callback) {
    if (!this.initialized) {
      console.warn('Query Change Detector not initialized');
      return () => {};
    }

    const watcherId = `${templateName}_${Date.now()}`;
    this.watchers.set(watcherId, { templateName, callback });

    // Get current template hash
    const template = sqlCompilerBridge.getTemplate(templateName);
    if (template) {
      this.queryHashes.set(templateName, this.hashTemplate(template));
    }

    // Return unwatch function
    return () => {
      this.watchers.delete(watcherId);
    };
  }

  // Check if a query template has changed
  async checkForChanges(templateName) {
    if (!this.initialized) return false;

    const template = sqlCompilerBridge.getTemplate(templateName);
    if (!template) return false;

    const currentHash = this.hashTemplate(template);
    const previousHash = this.queryHashes.get(templateName);

    if (previousHash && currentHash !== previousHash) {
      this.queryHashes.set(templateName, currentHash);
      this.notifyWatchers(templateName, template);
      return true;
    }

    this.queryHashes.set(templateName, currentHash);
    return false;
  }

  // Update a query template and notify watchers
  async updateTemplate(templateName, newTemplate) {
    if (!this.initialized) {
      throw new Error('Query Change Detector not initialized');
    }

    try {
      // Register the updated template
      await sqlCompilerBridge.registerTemplate(templateName, newTemplate);
      
      // Update hash and notify watchers
      const newHash = this.hashTemplate(newTemplate);
      const oldHash = this.queryHashes.get(templateName);
      
      if (oldHash !== newHash) {
        this.queryHashes.set(templateName, newHash);
        this.notifyWatchers(templateName, newTemplate);
        
        // Invalidate related cache entries
        await sqlCompilerBridge.invalidateCache(templateName);
        
        console.log(`Template ${templateName} updated and cache invalidated`);
      }
    } catch (error) {
      console.error(`Failed to update template ${templateName}:`, error);
      throw error;
    }
  }

  // Batch update multiple templates
  async updateTemplates(templates) {
    if (!this.initialized) {
      throw new Error('Query Change Detector not initialized');
    }

    const results = [];
    
    for (const [templateName, template] of Object.entries(templates)) {
      try {
        await this.updateTemplate(templateName, template);
        results.push({ templateName, success: true });
      } catch (error) {
        results.push({ templateName, success: false, error: error.message });
      }
    }

    return results;
  }

  // Monitor file system changes (for development)
  watchFileChanges(filePath, templateName) {
    if (typeof window !== 'undefined' && 'FileSystemWatcher' in window) {
      // Use File System Access API if available
      this.watchFileSystemChanges(filePath, templateName);
    } else {
      // Fallback to polling for changes
      this.pollForChanges(templateName);
    }
  }

  async watchFileSystemChanges(filePath, templateName) {
    try {
      // This would require File System Access API permissions
      const fileHandle = await window.showOpenFilePicker({
        types: [{
          description: 'SQL files',
          accept: { 'text/sql': ['.sql'] }
        }]
      });

      // Watch for changes (simplified example)
      setInterval(async () => {
        try {
          const file = await fileHandle.getFile();
          const content = await file.text();
          
          // Parse and update template if changed
          const template = this.parseTemplateFromFile(content, templateName);
          await this.checkAndUpdateTemplate(templateName, template);
        } catch (error) {
          console.error('Error reading file:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('File system watching not available:', error);
    }
  }

  pollForChanges(templateName, interval = 5000) {
    setInterval(async () => {
      await this.checkForChanges(templateName);
    }, interval);
  }

  parseTemplateFromFile(content, templateName) {
    // Simple parser for SQL template files
    const lines = content.split('\n');
    let baseQuery = '';
    let parameters = [];
    let optimizationHints = [];

    let currentSection = 'query';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('-- @parameters:')) {
        currentSection = 'parameters';
        parameters = trimmed.substring(15).split(',').map(p => p.trim());
      } else if (trimmed.startsWith('-- @hints:')) {
        currentSection = 'hints';
        optimizationHints = trimmed.substring(10).split(',').map(h => h.trim());
      } else if (!trimmed.startsWith('--') && trimmed) {
        if (currentSection === 'query') {
          baseQuery += line + '\n';
        }
      }
    }

    return {
      name: templateName,
      base_query: baseQuery.trim(),
      parameters,
      optimization_hints: optimizationHints
    };
  }

  async checkAndUpdateTemplate(templateName, newTemplate) {
    const currentTemplate = sqlCompilerBridge.getTemplate(templateName);
    
    if (!currentTemplate || this.hashTemplate(currentTemplate) !== this.hashTemplate(newTemplate)) {
      await this.updateTemplate(templateName, newTemplate);
      return true;
    }
    
    return false;
  }

  hashTemplate(template) {
    // Simple hash function for template comparison
    const str = JSON.stringify({
      base_query: template.base_query,
      parameters: template.parameters,
      optimization_hints: template.optimization_hints
    });
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  notifyWatchers(templateName, template) {
    for (const [watcherId, watcher] of this.watchers) {
      if (watcher.templateName === templateName) {
        try {
          watcher.callback(templateName, template);
        } catch (error) {
          console.error(`Error in query change watcher ${watcherId}:`, error);
        }
      }
    }
  }

  // Get statistics about watched queries
  getStats() {
    return {
      watchedQueries: Array.from(this.queryHashes.keys()),
      activeWatchers: this.watchers.size,
      initialized: this.initialized
    };
  }

  // Clean up resources
  destroy() {
    this.watchers.clear();
    this.queryHashes.clear();
    this.initialized = false;
  }
}

// Singleton instance
const queryChangeDetector = new QueryChangeDetector();

export default queryChangeDetector;