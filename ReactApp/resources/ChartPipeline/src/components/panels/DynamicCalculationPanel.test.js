import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import DynamicCalculationPanel from './DynamicCalculationPanel';

// Mock data for testing
const mockControlData = [
  { subsystem: 'SUB1', totalItems: 10, doneItems: 5, pendingItems: 5, totalLoops: 8, doneLoops: 3 },
  { subsystem: 'SUB2', totalItems: 15, doneItems: 10, pendingItems: 5, totalLoops: 12, doneLoops: 8 }
];

const mockDetailsData = [
  { testPack: 'TP1', testPackProgress: 75 },
  { testPack: 'TP2', testPackProgress: 50 }
];

const TestWrapper = ({ children }) => (
  <ChakraProvider>
    {children}
  </ChakraProvider>
);

describe('DynamicCalculationPanel', () => {
  const defaultProps = {
    controlData: mockControlData,
    detailsData: mockDetailsData,
    filteredControlData: mockControlData,
    filteredDetailsData: mockDetailsData,
    filters: {}
  };

  test('renders SQL Query Interface', () => {
    render(
      <TestWrapper>
        <DynamicCalculationPanel {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('SQL Query Interface')).toBeInTheDocument();
    expect(screen.getByText('Default Quick Metrics:')).toBeInTheDocument();
  });

  test('shows field suggestions hint', () => {
    render(
      <TestWrapper>
        <DynamicCalculationPanel {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('💡 Type " to see field suggestions')).toBeInTheDocument();
  });

  test('has execute query button', () => {
    render(
      <TestWrapper>
        <DynamicCalculationPanel {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('Execute Query')).toBeInTheDocument();
  });

  test('shows quick metric buttons for subsystems', () => {
    render(
      <TestWrapper>
        <DynamicCalculationPanel {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('Total Subsystems')).toBeInTheDocument();
    expect(screen.getByText('Total Items')).toBeInTheDocument();
    expect(screen.getByText('Done Items')).toBeInTheDocument();
    expect(screen.getByText('Pending Items')).toBeInTheDocument();
    expect(screen.getByText('Total Test Packs')).toBeInTheDocument();
    expect(screen.getByText('Total Loops')).toBeInTheDocument();
    expect(screen.getByText('Done Loops')).toBeInTheDocument();
    expect(screen.getByText('Avg Progress')).toBeInTheDocument();
  });

  test('can toggle interface visibility', () => {
    render(
      <TestWrapper>
        <DynamicCalculationPanel {...defaultProps} />
      </TestWrapper>
    );

    const toggleButton = screen.getByLabelText('Hide interface');
    fireEvent.click(toggleButton);

    // After hiding, the quick metrics should not be visible
    expect(screen.queryByText('Default Quick Metrics:')).not.toBeInTheDocument();
    
    // But the interface title should still be there
    expect(screen.getByText('SQL Query Interface')).toBeInTheDocument();
  });

  test('default query contains both Global and Local metrics', () => {
    render(
      <TestWrapper>
        <DynamicCalculationPanel {...defaultProps} />
      </TestWrapper>
    );

    const textarea = screen.getByPlaceholderText(/Enter your SQL query here/);
    expect(textarea.value).toContain('_Global');
    expect(textarea.value).toContain('_Local');
  });
});