import React from 'react';
import { usePanelEventBus } from './usePanelEventBus';
import { useGenericPanelState } from './useGenericPanelState';

/**
 * Adapter component that converts generic panel props to DynamicCalculationPanel specific props
 * This maintains backward compatibility while providing a cleaner interface
 */
export const useDynamicCalculationPanelAdapter = (props) => {
  const {
    // Generic props
    data = {},
    onDataChange = () => {},
    onVisibilityChange = () => {},
    onPropagationChange = () => {},
    onBringToFront = () => {},
    
    // Specific props (for backward compatibility)
    controlData,
    detailsData,
    filteredControlData,
    filteredDetailsData,
    csvProgressData,
    filters,
    ...specificProps
  } = props;

  // Event handlers mapping
  const eventHandlers = {
    'filter-change': onDataChange,
    'visibility-change': onVisibilityChange,
    'propagation-change': onPropagationChange,
    'bring-to-front': onBringToFront,
    
    // Map specific events to generic ones
    'filtered-data-change': specificProps.onFilteredDataChange || onDataChange,
    'filtered-control-data-change': specificProps.onFilteredControlDataChange || onDataChange,
    'loop-filtered-control-data-change': specificProps.onLoopFilteredControlDataChange || onDataChange,
    'loop-propagation-change': specificProps.onLoopPropagationChange || onPropagationChange,
    'items-propagation-change': specificProps.onItemsPropagationChange || onPropagationChange,
    'progress-filter-visibility-change': specificProps.onProgressFilterVisibilityChange || onVisibilityChange,
    'items-filter-visibility-change': specificProps.onItemsFilterVisibilityChange || onVisibilityChange,
    'loop-filter-visibility-change': specificProps.onLoopFilterVisibilityChange || onVisibilityChange,
    'items-total-filtered-control-data-change': specificProps.onItemsTotalFilteredControlDataChange || onDataChange,
    'items-total-propagation-change': specificProps.onItemsTotalPropagationChange || onPropagationChange,
    'items-total-filter-visibility-change': specificProps.onItemsTotalFilterVisibilityChange || onVisibilityChange,
    'inst-filtered-control-data-change': specificProps.onInstFilteredControlDataChange || onDataChange,
    'inst-filter-visibility-change': specificProps.onInstFilterVisibilityChange || onVisibilityChange,
    'tracing-filtered-control-data-change': specificProps.onTracingFilteredControlDataChange || onDataChange,
    'tracing-filter-visibility-change': specificProps.onTracingFilterVisibilityChange || onVisibilityChange,
    'progress-propagation-change': specificProps.onProgressPropagationChange || onPropagationChange,
    'hito-propagation-change': specificProps.onHitoPropagationChange || onPropagationChange,
    'hito-filter-visibility-change': specificProps.onHitoFilterVisibilityChange || onVisibilityChange,
    'hito-filtered-data-change': specificProps.onHitoFilteredDataChange || onDataChange,
    'subsystem-propagation-change': specificProps.onSubsystemPropagationChange || onPropagationChange,
    'subsystem-filter-visibility-change': specificProps.onSubsystemFilterVisibilityChange || onVisibilityChange,
    'subsystem-filtered-data-change': specificProps.onSubsystemFilteredDataChange || onDataChange,
    'progress-table-visibility-change': specificProps.onProgressTableVisibilityChange || onVisibilityChange
  };

  const eventBus = usePanelEventBus(eventHandlers, {
    enableLogging: false,
    eventPrefix: 'dynamic-calc'
  });

  // Convert generic data structure to specific props if needed
  const adaptedProps = {
    // Use specific props if provided (backward compatibility)
    controlData: controlData || data.controlData,
    detailsData: detailsData || data.detailsData,
    filteredControlData: filteredControlData || data.filteredControlData,
    filteredDetailsData: filteredDetailsData || data.filteredDetailsData,
    csvProgressData: csvProgressData || data.csvProgressData,
    filters: filters || data.filters || {},
    
    // Map all specific callback props
    onFilteredDataChange: eventBus.onFilteredDataChange,
    onFilteredControlDataChange: eventBus.onFilteredControlDataChange,
    onLoopFilteredControlDataChange: eventBus.onLoopFilteredControlDataChange,
    onLoopPropagationChange: eventBus.onLoopPropagationChange,
    onItemsPropagationChange: eventBus.onItemsPropagationChange,
    onProgressFilterVisibilityChange: eventBus.onProgressFilterVisibilityChange,
    onItemsFilterVisibilityChange: eventBus.onItemsFilterVisibilityChange,
    onLoopFilterVisibilityChange: eventBus.onLoopFilterVisibilityChange,
    onItemsTotalFilteredControlDataChange: eventBus.onItemsTotalFilteredControlDataChange,
    onItemsTotalPropagationChange: eventBus.onItemsTotalPropagationChange,
    onItemsTotalFilterVisibilityChange: eventBus.onItemsTotalFilterVisibilityChange,
    onInstFilteredControlDataChange: eventBus.onInstFilteredControlDataChange,
    onInstFilterVisibilityChange: eventBus.onInstFilterVisibilityChange,
    onTracingFilteredControlDataChange: eventBus.onTracingFilteredControlDataChange,
    onTracingFilterVisibilityChange: eventBus.onTracingFilterVisibilityChange,
    onProgressPropagationChange: eventBus.onProgressPropagationChange,
    onHitoPropagationChange: eventBus.onHitoPropagationChange,
    onHitoFilterVisibilityChange: eventBus.onHitoFilterVisibilityChange,
    onHitoFilteredDataChange: eventBus.onHitoFilteredDataChange,
    onSubsystemPropagationChange: eventBus.onSubsystemPropagationChange,
    onSubsystemFilterVisibilityChange: eventBus.onSubsystemFilterVisibilityChange,
    onSubsystemFilteredDataChange: eventBus.onSubsystemFilteredDataChange,
    onProgressTableVisibilityChange: eventBus.onProgressTableVisibilityChange,
    onBringToFront: eventBus.onBringToFront
  };

  return adaptedProps;
};