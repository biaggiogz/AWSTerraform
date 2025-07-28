import React from 'react';
import DynamicCalculationPanel from './DynamicCalculationPanel';
import { useDynamicCalculationPanelAdapter } from './base/DynamicCalculationPanelAdapter';

/**
 * Modular wrapper for DynamicCalculationPanel that provides a cleaner, more generic interface
 * while maintaining full backward compatibility with existing usage
 * 
 * @param {Object} props - Component props
 * @param {Object} props.data - Generic data object containing all datasets
 * @param {Function} props.onDataChange - Generic data change handler
 * @param {Function} props.onVisibilityChange - Generic visibility change handler
 * @param {Function} props.onPropagationChange - Generic propagation change handler
 * @param {Function} props.onBringToFront - Generic bring to front handler
 * 
 * // Backward compatibility - all original props still work
 * @param {Array} props.controlData - Control dataset (backward compatibility)
 * @param {Array} props.detailsData - Details dataset (backward compatibility)
 * @param {Array} props.filteredControlData - Filtered control data (backward compatibility)
 * @param {Array} props.filteredDetailsData - Filtered details data (backward compatibility)
 * @param {Array} props.csvProgressData - CSV progress data (backward compatibility)
 * @param {Object} props.filters - Filter state (backward compatibility)
 * // ... all other original callback props for backward compatibility
 */
const ModularDynamicCalculationPanel = (props) => {
  const adaptedProps = useDynamicCalculationPanelAdapter(props);
  
  return <DynamicCalculationPanel {...adaptedProps} />;
};

export default ModularDynamicCalculationPanel;