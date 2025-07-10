import React, { useEffect, useRef } from 'react';
import { render } from 'solid-js/web';

export const SolidInReact = ({ component: SolidComponent, props, className }) => {
  const containerRef = useRef();

  useEffect(() => {
    if (containerRef.current && SolidComponent) {
      const dispose = render(() => SolidComponent(props), containerRef.current);
      return dispose;
    }
  }, [SolidComponent, props]);

  return <div ref={containerRef} className={className} />;
};

export default { SolidInReact };