import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hover?: boolean;
}

export default function Card({ children, className = '', style, hover = true }: CardProps) {
  return (
    <div className={`${hover ? 'glass' : 'glass-static'} p-6 ${className}`} style={style}>
      {children}
    </div>
  );
}
