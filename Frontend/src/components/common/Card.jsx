import React from 'react';

const Card = ({ 
  children, 
  title, 
  subtitle,
  icon,
  footer,
  className = '',
  cardClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  ...rest
}) => {
  return (
    <div 
      className={`bg-white rounded-card shadow-card overflow-hidden ${cardClassName} ${className}`}
      {...rest}
    >
      {/* Card Header */}
      {(title || subtitle || icon) && (
        <div className={`px-6 py-4 border-b border-gray-100 ${headerClassName}`}>
          <div className="flex items-center">
            {icon && <div className="mr-3">{icon}</div>}
            <div>
              {title && <h3 className="text-lg font-semibold text-gray-800">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Card Body */}
      <div className={`p-6 ${bodyClassName}`}>
        {children}
      </div>

      {/* Card Footer */}
      {footer && (
        <div className={`px-6 py-4 border-t border-gray-100 bg-gray-50 ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;