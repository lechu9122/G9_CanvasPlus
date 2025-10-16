import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * ModalPortal component that renders children into a portal at document.body.
 * Creates a detached DOM node and cleans it up on unmount.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render in the portal
 * @returns {React.Portal} Portal to document.body
 */
function ModalPortal({ children }) {
  const portalRootRef = useRef(null);

  useEffect(() => {
    // Create portal root element
    const portalRoot = document.createElement('div');
    portalRoot.setAttribute('data-modal-portal', 'true');
    document.body.appendChild(portalRoot);
    portalRootRef.current = portalRoot;

    // Cleanup on unmount
    return () => {
      if (portalRootRef.current && document.body.contains(portalRootRef.current)) {
        document.body.removeChild(portalRootRef.current);
      }
    };
  }, []);

  // Don't render until portal root is created
  if (!portalRootRef.current) {
    return null;
  }

  return createPortal(children, portalRootRef.current);
}

export default ModalPortal;
