import React, { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import Button from './Button';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
  closeOnOutsideClick = true,
  showCloseButton = true,
  className = '',
  contentClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
}) => {
  const modalRef = useRef(null);
  
  // Handle ESC key press to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'auto'; // Restore scrolling when modal is closed
    };
  }, [isOpen, onClose]);

  // Handle outside click
  const handleOutsideClick = (event) => {
    if (closeOnOutsideClick && modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };

  // Size classes for modal width
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-full',
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={handleOutsideClick}
    >
      <div 
        ref={modalRef}
        className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} ${className}`}
      >
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${headerClassName}`}>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-300 rounded-full p-1"
            >
              <FiX size={20} />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className={`p-6 ${bodyClassName}`}>
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className={`px-6 py-4 border-t flex justify-end space-x-3 ${footerClassName}`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Preset footers for common actions
Modal.Footer = {
  // Confirm/Cancel footer
  Confirm: ({ onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', confirmVariant = 'primary' }) => (
    <>
      <Button variant="outline" onClick={onCancel}>
        {cancelText}
      </Button>
      <Button variant={confirmVariant} onClick={onConfirm}>
        {confirmText}
      </Button>
    </>
  ),
  
  // Delete confirmation footer
  Delete: ({ onDelete, onCancel, deleteText = 'Delete', cancelText = 'Cancel' }) => (
    <>
      <Button variant="outline" onClick={onCancel}>
        {cancelText}
      </Button>
      <Button variant="error" onClick={onDelete}>
        {deleteText}
      </Button>
    </>
  ),
  
  // Simple close footer
  Close: ({ onClose, closeText = 'Close' }) => (
    <Button variant="outline" onClick={onClose}>
      {closeText}
    </Button>
  )
};

export default Modal;