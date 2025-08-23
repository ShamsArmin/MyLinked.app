import React, { HTMLAttributes } from 'react';

interface AnimatedCardProps extends HTMLAttributes<HTMLDivElement> {
  animation?: 'float' | 'pop' | 'wiggle' | 'none';
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  border?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  animation = 'float',
  elevation = 'md',
  padding = 'md',
  rounded = 'md',
  border = true,
  className = '',
  ...props
}) => {
  // Base styles
  const baseStyles = "bg-base-100 transition-all duration-300 overflow-hidden";
  
  // Animation styles
  const animationStyles = {
    float: "float-animation",
    pop: "pop-animation",
    wiggle: "wiggle-animation",
    none: ""
  };
  
  // Elevation (shadow) styles
  const elevationStyles = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg"
  };
  
  // Padding styles
  const paddingStyles = {
    none: "p-0",
    sm: "p-3",
    md: "p-4",
    lg: "p-6"
  };
  
  // Border radius styles
  const roundedStyles = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full"
  };
  
  // Border styles
  const borderStyles = border ? "border border-base-200" : "";
  
  // Combine all styles
  const cardClasses = `
    ${baseStyles}
    ${animationStyles[animation]}
    ${elevationStyles[elevation]}
    ${paddingStyles[padding]}
    ${roundedStyles[rounded]}
    ${borderStyles}
    ${className}
  `;
  
  return (
    <div 
      className={cardClasses} 
      {...props}
    >
      {children}
    </div>
  );
};

export default AnimatedCard;