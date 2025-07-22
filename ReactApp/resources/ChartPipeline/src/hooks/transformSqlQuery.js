  // Transform SQL query to use normalized column names
  const transformSqlQuery = useCallback(async (sqlQuery) => {
    let transformedQuery = sqlQuery;
    
    // Extract table name from query
    const tableMatch = sqlQuery.match(/FROM\\s+[\"']?([^\\s\"';]+)[\"']?/i);
    const tableName = tableMatch ? tableMatch[1].replace(/[\"']/g, '') : null;
    
    if (tableName) {
      // Get actual column names from the table
      const actualColumns = await getActualColumnNames(tableName);
      console.log(`Actual columns in ${tableName}:`, actualColumns);
      
      // Get column mappings for this table
      const columnMap = tableDataRef.current[`${tableName}_columns`] || {};
      
      // Create reverse mapping (normalized -> original)
      const reverseColumnMap = {};
      Object.entries(columnMap).forEach(([original, normalized]) => {
        reverseColumnMap[normalized] = original;
        // Also map lowercase versions
        reverseColumnMap[normalized.toLowerCase()] = original;
      });
      
      // Table-specific column mappings
      const tableSpecificMappings = {
        'controlInstrumentsByIsometric': {
          'done': ['installed_by_teigatmi', 'installed_by_siemsa'],
          'total done': ['installed_by_teigatmi', 'installed_by_siemsa'],
          'DONE': ['installed_by_teigatmi', 'installed_by_siemsa'],
          'TOTAL DONE': ['installed_by_teigatmi', 'installed_by_siemsa'],
          'total inst': ['qty_inst'],
          'TOTAL INST': ['qty_inst']
        },
        'dynamicInstrumentTable': {
          'done': ['total_installed'],
          'total done': ['total_installed'],
          'DONE': ['total_installed'],
          'TOTAL DONE': ['total_installed'],
          'total inst': ['qty_inst'],
          'TOTAL INST': ['qty_inst']
        },
        'detailsInstrumentsTable': {
          'tag': ['tag_inst'],
          'TAG': ['tag_inst']
        }
      };
      
      // Get the appropriate mappings for this table
      const commonVariations = tableSpecificMappings[tableName] || {};
      
      // Extract column names from query
      const columnMatches = sqlQuery.match(/\"([^\"]+)\"/g) || [];
      
      // Replace each column name with its normalized version
      for (const match of columnMatches) {
        const columnName = match.replace(/\"/g, '');
        const normalizedName = columnMap[columnName];
        
        if (normalizedName && actualColumns.includes(normalizedName)) {
          // Direct mapping exists
          const regex = new RegExp(`\"${columnName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\"`, 'g');
          transformedQuery = transformedQuery.replace(regex, `\"${normalizedName}\"`);
        } else {
          // Try table-specific variations
          const variations = commonVariations[columnName] || [];
          for (const variant of variations) {
            if (actualColumns.includes(variant)) {
              const regex = new RegExp(`\"${columnName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\"`, 'g');
              transformedQuery = transformedQuery.replace(regex, `\"${variant}\"`);
              console.log(`Replaced \"${columnName}\" with \"${variant}\" in ${tableName}`);
              break;
            }
          }
        }
      }
      
      // Special case for SUM of multiple columns in controlInstrumentsByIsometric
      if (tableName === 'controlInstrumentsByIsometric' && 
          transformedQuery.includes('TOTAL DONE') && 
          !transformedQuery.includes('installed_by_teigatmi')) {
        // Replace "DONE" with sum of TEIGA-TMI and SIEMSA installations
        const donePattern = /SUM\s*\(\s*\"([^\"]+)\"\s*\)/gi;
        if (donePattern.test(transformedQuery)) {
          transformedQuery = transformedQuery.replace(
            donePattern,
            'SUM("installed_by_teigatmi") + SUM("installed_by_siemsa")'
          );
          console.log('Applied special case for TOTAL DONE in controlInstrumentsByIsometric');
        }
      }
    }
    
    return transformedQuery;
  }, [getActualColumnNames]);