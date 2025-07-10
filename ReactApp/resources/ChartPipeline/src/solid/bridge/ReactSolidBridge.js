import React from 'react';
import { render } from 'solid-js/web';
import { createSignal, createEffect } from 'solid-js';

export class ReactSolidBridge {
  static mountSolidInReact(SolidComponent, containerRef, initialProps = {}) {
    const [solidProps, setSolidProps] = createSignal(initialProps);
    let dispose;
    
    const mount = () => {
      if (containerRef.current && !dispose) {
        dispose = render(() => SolidComponent(solidProps()), containerRef.current);
      }
    };
    
    const unmount = () => {
      if (dispose) {
        dispose();
        dispose = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
    
    const updateProps = (newProps) => {
      setSolidProps(prev => ({ ...prev, ...newProps }));
    };
    
    return { mount, unmount, updateProps };
  }
}

// React wrapper component for SolidJS components
export const SolidInReact = ({ 
  component: SolidComponent, 
  props = {},
  className = '',
  style = {},
  ...reactProps 
}) => {
  const containerRef = React.useRef();
  const bridgeRef = React.useRef();
  
  React.useEffect(() => {
    if (containerRef.current && !bridgeRef.current) {
      bridgeRef.current = ReactSolidBridge.mountSolidInReact(
        SolidComponent, 
        containerRef, 
        props
      );
      bridgeRef.current.mount();
    }
    
    return () => {
      if (bridgeRef.current) {
        bridgeRef.current.unmount();
        bridgeRef.current = null;
      }
    };
  }, [SolidComponent]);
  
  // Update props when they change
  React.useEffect(() => {
    if (bridgeRef.current) {
      bridgeRef.current.updateProps(props);
    }
  }, [props]);
  
  return React.createElement('div', {
    ref: containerRef,
    className,
    style,
    ...reactProps
  });
};