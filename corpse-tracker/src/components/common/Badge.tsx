import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'pending' | 'in_progress' | 'in_review' | 'returned' | 'approved' | 'published';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  pending: 'bg-blue-50 text-blue-700 border border-blue-200',
  in_progress: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  in_review: 'bg-orange-50 text-orange-700 border border-orange-200',
  returned: 'bg-red-50 text-red-700 border border-red-200',
  approved: 'bg-green-50 text-green-700 border border-green-200',
  published: 'bg-green-600 text-white',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
