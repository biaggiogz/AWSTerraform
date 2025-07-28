import React, { useState, useMemo, useCallback } from 'react';
import { useFilterDebounce } from './useFilterDebounce';

export const useBaseStatusFilter = ({
  data,
  onFilterChange,
  onPropagationChange,
  dataFields,
  isVisible
}) => {
  const [exclusiveFilter, setExclusiveFilter] = useState(null);
  const [selectedSubsystems, setSelectedSubsystems] = useState({});
  const [propagationTarget, setPropagationTarget] = useState('nothing');
  const [searchTerm, setSearchTerm] = useState('');

  const subsystemMetrics = useMemo(() => {
    if (!data || data.length === 0) return {};
    
    const metrics = {};
    data.forEach(row => {
      if (row.subsystem) {
        const totalValue = row[dataFields.total];
        const doneValue = row[dataFields.done];
        
        if (totalValue === null || totalValue === undefined || totalValue === '' || totalValue === 0) {
          metrics[row.subsystem] = {
            status: 'Not Apply',
            totalValue,
            doneValue
          };
        } else {
          const isDone = (totalValue === doneValue) && (totalValue > 0);
          metrics[row.subsystem] = {
            status: isDone ? 'Done' : 'Pending',
            totalValue,
            doneValue
          };
        }
      }
    });
    
    return metrics;
  }, [data, dataFields]);

  const sortedSubsystems = useMemo(() => {
    return Object.entries(subsystemMetrics)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
  }, [subsystemMetrics]);

  React.useEffect(() => {
    const subsystemKeys = Object.keys(sortedSubsystems);
    if (subsystemKeys.length > 0 && Object.keys(selectedSubsystems).length === 0) {
      const initialState = subsystemKeys.reduce((acc, subsystem) => {
        acc[subsystem] = true;
        return acc;
      }, {});
      setSelectedSubsystems(initialState);
    }
  }, [sortedSubsystems]);

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.filter(row => {
      if (!selectedSubsystems[row.subsystem]) return false;
      if (exclusiveFilter) {
        const totalValue = row[dataFields.total];
        let status;
        
        if (totalValue === null || totalValue === undefined || totalValue === '' || totalValue === 0) {
          status = 'Not Apply';
        } else {
          const isDone = (totalValue === row[dataFields.done]) && (totalValue > 0);
          status = isDone ? 'Done' : 'Pending';
        }
        
        if (exclusiveFilter === 'done') return status === 'Done';
        if (exclusiveFilter === 'pending') return status === 'Pending';
        if (exclusiveFilter === 'notapply') return status === 'Not Apply';
      }
      return true;
    });
  }, [data, selectedSubsystems, exclusiveFilter, dataFields]);

  const debouncedFilterChange = useFilterDebounce(useCallback((filteredData) => {
    onFilterChange(filteredData);
    if (onPropagationChange && propagationTarget !== 'nothing') {
      onPropagationChange(filteredData, propagationTarget);
    }
  }, [onFilterChange, onPropagationChange, propagationTarget]));

  React.useEffect(() => {
    debouncedFilterChange(filteredData);
  }, [filteredData, debouncedFilterChange]);

  const toggleExclusiveFilter = useCallback((filter) => {
    setExclusiveFilter(prev => prev === filter ? null : filter);
  }, []);

  const toggleSubsystem = useCallback((subsystem) => {
    setSelectedSubsystems(prev => ({
      ...prev,
      [subsystem]: !prev[subsystem]
    }));
  }, []);

  const toggleAllSubsystems = useCallback((value) => {
    const newState = Object.keys(sortedSubsystems).reduce((acc, subsystem) => {
      acc[subsystem] = value;
      return acc;
    }, {});
    setSelectedSubsystems(newState);
  }, [sortedSubsystems]);

  const invertSubsystemSelection = useCallback(() => {
    setSelectedSubsystems(prev => {
      const invertedState = {};
      Object.keys(sortedSubsystems).forEach(subsystem => {
        invertedState[subsystem] = !prev[subsystem];
      });
      return invertedState;
    });
  }, [sortedSubsystems]);

  const handlePropagationChange = useCallback((value) => {
    setPropagationTarget(value);
    if (onPropagationChange) {
      onPropagationChange(value === 'nothing' ? [] : filteredData, value);
    }
  }, [onPropagationChange, filteredData]);

  const getStatusColor = useCallback((status) => {
    if (status === 'Done') return '#06923E';
    if (status === 'Not Apply') return '#212121';
    return '#E85C0D';
  }, []);

  const filteredSubsystems = useMemo(() => {
    if (!searchTerm) return sortedSubsystems;
    
    const filtered = {};
    Object.entries(sortedSubsystems).forEach(([subsystem, metrics]) => {
      if (subsystem.toLowerCase().includes(searchTerm.toLowerCase())) {
        filtered[subsystem] = metrics;
      }
    });
    return filtered;
  }, [sortedSubsystems, searchTerm]);

  // Reset internal state when filter becomes invisible
  React.useEffect(() => {
    if (!isVisible) {
      setExclusiveFilter(null);
      setPropagationTarget('nothing');
    }
  }, [isVisible]);

  return {
    exclusiveFilter,
    selectedSubsystems,
    searchTerm,
    setSearchTerm,
    filteredSubsystems,
    toggleExclusiveFilter,
    toggleSubsystem,
    toggleAllSubsystems,
    invertSubsystemSelection,
    getStatusColor
  };
};