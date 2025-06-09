import React from 'react';
import Spinner from './Spinner';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  disabled = false, 
  loading = false,
  icon = null,
  iconPosition = 'left',
  type = 'button',
  onClick,
  className = '',
  ...rest
}) => {
  // Variant classes
  const variantClasses = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white',
    secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white',
    accent: 'bg-accent-500 hover:bg-accent-600 text-white',
    success: 'bg-success-500 hover:bg-success-600 text-white',
    error: 'bg-error-500 hover:bg-error-600 text-white',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Width classes
  const widthClass = fullWidth ? 'w-full' : '';

  // Disabled classes
  const disabledClasses = disabled || loading 
    ? 'opacity-50 cursor-not-allowed pointer-events-none' 
    : '';

  // Render button
  return (
    <button
      type={type}
      className={`
        flex items-center justify-center rounded-button font-medium transition-colors
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${disabledClasses}
        ${className}
      `}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner size="small" color={variant === 'outline' || variant === 'ghost' ? 'primary' : 'white'} />
          <span className="ml-2">{children}</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;