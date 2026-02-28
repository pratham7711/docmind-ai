import { ComponentType, ReactNode, CSSProperties, ForwardRefExoticComponent, RefAttributes } from 'react';

export declare const LoadingSpinner: ComponentType<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}>;

export declare const Badge: ComponentType<{
  variant?: 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  outlined?: boolean;
  dot?: boolean;
  className?: string;
  children?: ReactNode;
}>;

export declare const Button: ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  className?: string;
  children?: ReactNode;
} & RefAttributes<HTMLButtonElement>>;

export declare const Card: ForwardRefExoticComponent<{
  variant?: 'glass' | 'solid' | 'outlined';
  clickable?: boolean;
  noPadding?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
} & RefAttributes<HTMLDivElement>>;

export declare const GlassPanel: ForwardRefExoticComponent<{
  glow?: boolean;
  noPadding?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
} & RefAttributes<HTMLDivElement>>;

export declare const Input: ForwardRefExoticComponent<React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  showCount?: boolean;
  className?: string;
} & RefAttributes<HTMLInputElement>>;

export declare const StatCard: ComponentType<{
  value: string | number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  icon?: ReactNode;
  className?: string;
}>;

export declare const Avatar: ComponentType<{
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  className?: string;
}>;

export declare const EmptyState: ComponentType<{
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}>;

export declare const Nav: ComponentType<{
  logo?: ReactNode;
  links?: Array<{ label: string; href: string; onClick?: () => void }>;
  cta?: ReactNode;
  className?: string;
}>;

export declare const Footer: ComponentType<{
  brand?: ReactNode;
  tagline?: string;
  links?: Array<{ label: string; href: string }>;
  copyright?: string;
  bottomRight?: ReactNode;
  className?: string;
}>;
