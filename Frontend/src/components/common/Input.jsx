import React, { forwardRef } from 'react';

const Input = forwardRef(({ 
  type = 'text',
  label,
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  readOnly = false,
  error,
  icon,
  iconPosition = 'left',
  helperText,
  containerClassName = '',
  labelClassName = '',
  inputClassName = '',
  errorClassName = '',
  helperClassName = '',
  ...rest
}, ref) => {
  // Error state
  const hasError = !!error;
  
  // Input border color based on error state
  const borderClass = hasError 
    ? 'border-error-500 focus:ring-error-300' 
    : 'border-gray-300 focus:ring-primary-300';
  
  // Icon position padding
  const iconPaddingClass = icon 
    ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') 
    : '';

  return (
    <div className={`mb-4 ${containerClassName}`}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={id || name} 
          className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Input wrapper for icon positioning */}
      <div className="relative">
        {/* Input */}
        <input
          ref={ref}
          type={type}
          id={id || name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className={`
            w-full px-3 py-2 bg-white border rounded-md 
            focus:outline-none focus:ring-2
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${borderClass}
            ${iconPaddingClass}
            ${inputClassName}
          `}
          {...rest}
        />
        
        {/* Icon */}
        {icon && (
          <div className={`absolute inset-y-0 ${iconPosition === 'left' ? 'left-0' : 'right-0'} flex items-center px-3 pointer-events-none text-gray-500`}>
            {icon}
          </div>
        )}
      </div>
      
      {/* Error message */}
      {hasError && (
        <p className={`mt-1 text-sm text-error-500 ${errorClassName}`}>{error}</p>
      )}
      
      {/* Helper text */}
      {helperText && !hasError && (
        <p className={`mt-1 text-sm text-gray-500 ${helperClassName}`}>{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;