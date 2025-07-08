import React, { useState, useRef, useCallback } from 'react';
import { Box } from '@chakra-ui/react';

const ResizableDraggablePanel = ({ 
  children, 
  initialWidth = 600, 
  initialHeight = 500,
  initialX = 0,
  initialY = 0,
  minWidth = 300,
  minHeight = 200,
  title = "Panel"
}) => {
  const [dimensions, setDimensions] = useState({
    width: initialWidth,
    height: initialHeight,
    x: initialX,
    y: initialY
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const panelRef = useRef(null);

  const handleMouseDown = useCallback((e, action, direction = '') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (action === 'drag') {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - dimensions.x,
        y: e.clientY - dimensions.y
      });
    } else if (action === 'resize') {
      setIsResizing(true);
      setResizeDirection(direction);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: dimensions.width,
        height: dimensions.height
      });
    }
  }, [dimensions]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      setDimensions(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      setDimensions(prev => {
        let newWidth = prev.width;
        let newHeight = prev.height;
        
        if (resizeDirection.includes('right')) {
          newWidth = Math.max(minWidth, resizeStart.width + deltaX);
        }
        if (resizeDirection.includes('bottom')) {
          newHeight = Math.max(minHeight, resizeStart.height + deltaY);
        }
        
        return {
          ...prev,
          width: newWidth,
          height: newHeight
        };
      });
    }
  }, [isDragging, isResizing, dragStart, resizeStart, resizeDirection, minWidth, minHeight]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection('');
  }, []);

  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  return (
    <Box
      ref={panelRef}
      position="absolute"
      left={`${dimensions.x}px`}
      top={`${dimensions.y}px`}
      width={`${dimensions.width}px`}
      height={`${dimensions.height}px`}
      border="2px solid"
      borderColor="#CCCCCC"
      borderRadius="md"
      bg="white"
      boxShadow="lg"
      zIndex={isDragging || isResizing ? 1000 : 1}
      cursor={isDragging ? 'grabbing' : 'default'}
    >
      {/* Drag Handle */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        height="30px"
        bg="#CCCCCC"
        color="white"
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontSize="sm"
        fontWeight="bold"
        cursor="grab"
        onMouseDown={(e) => handleMouseDown(e, 'drag')}
        _active={{ cursor: 'grabbing' }}
        borderTopRadius="md"
      >
        {title}
      </Box>

      {/* Content Area */}
      <Box
        position="absolute"
        top="30px"
        left="0"
        right="0"
        bottom="0"
        overflow="hidden"
      >
        {children}
      </Box>

      {/* Resize Handles */}
      {/* Right edge */}
      <Box
        position="absolute"
        right="-3px"
        top="30px"
        bottom="0"
        width="6px"
        cursor="ew-resize"
        onMouseDown={(e) => handleMouseDown(e, 'resize', 'right')}
        _hover={{ bg: 'rgba(217, 154, 0, 0.2)' }}
      />
      
      {/* Bottom edge */}
      <Box
        position="absolute"
        bottom="-3px"
        left="0"
        right="0"
        height="6px"
        cursor="ns-resize"
        onMouseDown={(e) => handleMouseDown(e, 'resize', 'bottom')}
        _hover={{ bg: 'rgba(217, 154, 0, 0.2)' }}
      />
      
      {/* Bottom-right corner */}
      <Box
        position="absolute"
        bottom="-3px"
        right="-3px"
        width="12px"
        height="12px"
        cursor="nw-resize"
        onMouseDown={(e) => handleMouseDown(e, 'resize', 'right bottom')}
        _hover={{ bg: 'rgba(217, 154, 0, 0.2)' }}
        borderBottomRightRadius="md"
      />
    </Box>
  );
};

export default ResizableDraggablePanel;