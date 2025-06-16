import { useMemo } from 'react';
import { useCrossFilter } from '../context/CrossFilterContext';

export const useDataProcessor = (data) => {
  const { filters } = useCrossFilter();
  
  // Filter data based on selected filters
  const getFilteredData = () => {
    return data.filter(item => {
      return (!filters.designArea || item['Design Area'] === filters.designArea) &&
             (!filters.lineId || item['LINE ID'] === filters.lineId) &&
             (!filters.train || item['TRAIN'] === filters.train);
    });
  };
  
  // Prepare data for Design Area Progress chart
  const getDesignAreaProgressData = () => {
    const filteredData = getFilteredData();
    const designAreaGroups = {};
    
    filteredData.forEach(item => {
      const designArea = item['Design Area'] || 'Unknown';
      const progress = parseFloat(item['PROGRESS SW+FW (%)'] || 0);
      
      if (!designAreaGroups[designArea]) {
        designAreaGroups[designArea] = { total: 0, count: 0 };
      }
      
      if (!isNaN(progress)) {
        designAreaGroups[designArea].total += progress;
        designAreaGroups[designArea].count += 1;
      }
    });
    
    return Object.keys(designAreaGroups).map(area => ({
      name: area,
      value: designAreaGroups[area].count > 0 
        ? designAreaGroups[area].total / designAreaGroups[area].count 
        : 0
    })).sort((a, b) => b.value - a.value);
  };
  
  // Prepare data for Line ID Welds chart
  const getLineIdWeldsData = () => {
    const filteredData = getFilteredData();
    const lineGroups = {};
    
    filteredData.forEach(item => {
      const lineId = item['LINE ID'] || 'Unknown';
      const shopWelds = parseInt(item['QTY Welds Shop (SW)'] || 0, 10);
      const fieldWelds = parseInt(item['QTY Welds Field (FW)'] || 0, 10);
      
      if (!lineGroups[lineId]) {
        lineGroups[lineId] = { shopWelds: 0, fieldWelds: 0, total: 0 };
      }
      
      lineGroups[lineId].shopWelds += shopWelds;
      lineGroups[lineId].fieldWelds += fieldWelds;
      lineGroups[lineId].total = lineGroups[lineId].shopWelds + lineGroups[lineId].fieldWelds;
    });
    
    return Object.keys(lineGroups)
      .map(lineId => ({
        name: lineId,
        shopWelds: lineGroups[lineId].shopWelds,
        fieldWelds: lineGroups[lineId].fieldWelds,
        total: lineGroups[lineId].total
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  };
  
  // Prepare data for Train Progress chart
  const getTrainProgressData = () => {
    const filteredData = getFilteredData();
    const trainGroups = {};
    
    filteredData.forEach(item => {
      const train = item['TRAIN'] || 'Unknown';
      const progress = parseFloat(item['% PROGRESS ERECTED'] || 0);
      
      if (!trainGroups[train]) {
        trainGroups[train] = [];
      }
      
      if (!isNaN(progress)) {
        trainGroups[train].push(progress);
      }
    });
    
    return Object.keys(trainGroups)
      .filter(train => trainGroups[train].length > 0)
      .map(train => {
        const values = trainGroups[train].sort((a, b) => a - b);
        
        return {
          train,
          values
        };
      });
  };
  
  return {
    getFilteredData,
    getDesignAreaProgressData,
    getLineIdWeldsData,
    getTrainProgressData
  };
};