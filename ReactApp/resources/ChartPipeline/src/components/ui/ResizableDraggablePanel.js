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
  title = "Panel",
  onBringToFront
}) => {
  const [dimensions, setDimensions] = useState({
    width: initialWidth,
    height: initialHeight,
    x: initialX,
    y: initialY
  });
  
  const [zIndex, setZIndex] = useState(1);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const panelRef = useRef(null);

  const bringToFront = useCallback(() => {
    if (onBringToFront) {
      const newZIndex = onBringToFront();
      setZIndex(newZIndex);
    }
  }, [onBringToFront]);

  const handleMouseDown = useCallback((e, action, direction = '') => {
    e.preventDefault();
    e.stopPropagation();
    
    bringToFront();
    
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
  }, [dimensions, bringToFront]);

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
        let newX = prev.x;
        let newY = prev.y;
        
        if (resizeDirection.includes('right')) {
          newWidth = Math.max(minWidth, resizeStart.width + deltaX);
        }
        if (resizeDirection.includes('left')) {
          const possibleWidth = resizeStart.width - deltaX;
          if (possibleWidth >= minWidth) {
            newWidth = possibleWidth;
            newX = resizeStart.x + deltaX;
          }
        }
        if (resizeDirection.includes('bottom')) {
          newHeight = Math.max(minHeight, resizeStart.height + deltaY);
        }
        if (resizeDirection.includes('top')) {
          const possibleHeight = resizeStart.height - deltaY;
          if (possibleHeight >= minHeight) {
            newHeight = possibleHeight;
            newY = resizeStart.y + deltaY;
          }
        }
        
        return {
          ...prev,
          width: newWidth,
          height: newHeight,
          x: newX,
          y: newY
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
      zIndex={isDragging || isResizing ? zIndex + 1000 : zIndex}
      cursor={isDragging ? 'grabbing' : 'default'}
    >
      {/* Drag Handle - Header */}
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
        onClick={bringToFront}
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
        overflow="auto"
      >
        {children}
      </Box>

      {/* Visible Drag Handles around the table */}
      {/* Left border drag handle */}
      <Box
        position="absolute"
        left="0"
        top="30px"
        bottom="0"
        width="8px"
        cursor="move"
        onMouseDown={(e) => handleMouseDown(e, 'drag')}
        _hover={{ bg: 'rgba(0, 117, 152, 0.1)' }}
        zIndex={2}
      />
      
      {/* Right border drag handle */}
      <Box
        position="absolute"
        right="0"
        top="30px"
        bottom="0"
        width="8px"
        cursor="move"
        onMouseDown={(e) => handleMouseDown(e, 'drag')}
        _hover={{ bg: 'rgba(0, 117, 152, 0.1)' }}
        zIndex={2}
      />
      
      {/* Bottom border drag handle */}
      <Box
        position="absolute"
        bottom="0"
        left="0"
        right="0"
        height="8px"
        cursor="move"
        onMouseDown={(e) => handleMouseDown(e, 'drag')}
        _hover={{ bg: 'rgba(0, 117, 152, 0.1)' }}
        zIndex={2}
      />

      {/* Resize Handles */}
      {/* Left edge */}
      <Box
        position="absolute"
        left="-3px"
        top="30px"
        bottom="0"
        width="6px"
        cursor="ew-resize"
        onMouseDown={(e) => handleMouseDown(e, 'resize', 'left')}
        _hover={{ bg: 'rgba(217, 154, 0, 0.2)' }}
      />
      
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
      
      {/* Top edge */}
      <Box
        position="absolute"
        top="-3px"
        left="0"
        right="0"
        height="6px"
        cursor="ns-resize"
        onMouseDown={(e) => handleMouseDown(e, 'resize', 'top')}
        _hover={{ bg: 'rgba(217, 154, 0, 0.2)' }}
        zIndex={2}
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
      
      {/* Corner handles */}
      {/* Top-left corner */}
      <Box
        position="absolute"
        top="-3px"
        left="-3px"
        width="12px"
        height="12px"
        cursor="nwse-resize"
        onMouseDown={(e) => handleMouseDown(e, 'resize', 'left top')}
        _hover={{ bg: 'rgba(217, 154, 0, 0.2)' }}
        borderTopLeftRadius="md"
        zIndex={3}
      />
      
      {/* Top-right corner */}
      <Box
        position="absolute"
        top="-3px"
        right="-3px"
        width="12px"
        height="12px"
        cursor="nesw-resize"
        onMouseDown={(e) => handleMouseDown(e, 'resize', 'right top')}
        _hover={{ bg: 'rgba(217, 154, 0, 0.2)' }}
        borderTopRightRadius="md"
        zIndex={3}
      />
      
      {/* Bottom-left corner */}
      <Box
        position="absolute"
        bottom="-3px"
        left="-3px"
        width="12px"
        height="12px"
        cursor="nesw-resize"
        onMouseDown={(e) => handleMouseDown(e, 'resize', 'left bottom')}
        _hover={{ bg: 'rgba(217, 154, 0, 0.2)' }}
        borderBottomLeftRadius="md"
        zIndex={3}
      />
      
      {/* Bottom-right corner */}
      <Box
        position="absolute"
        bottom="-3px"
        right="-3px"
        width="12px"
        height="12px"
        cursor="nwse-resize"
        onMouseDown={(e) => handleMouseDown(e, 'resize', 'right bottom')}
        _hover={{ bg: 'rgba(217, 154, 0, 0.2)' }}
        borderBottomRightRadius="md"
        zIndex={3}
      />
    </Box>
  );
};

export default ResizableDraggablePanel;