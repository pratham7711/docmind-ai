import type { ReactNode, ReactElement, HTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

// ── Avatar ─────────────────────────────────────────────────────────────────
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'
export interface AvatarProps {
  src?: string
  alt?: string
  name?: string
  size?: AvatarSize
  online?: boolean
  className?: string
}
export declare const Avatar: (props: AvatarProps) => ReactElement

// ── Badge ──────────────────────────────────────────────────────────────────
export type BadgeVariant = 'accent' | 'success' | 'warning' | 'danger' | 'neutral'
export type BadgeSize = 'sm' | 'md'
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  outlined?: boolean
  dot?: boolean
  children?: ReactNode
}
export declare const Badge: (props: BadgeProps) => ReactElement

// ── Button ─────────────────────────────────────────────────────────────────
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glow'
export type ButtonSize = 'sm' | 'md' | 'lg'
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  fullWidth?: boolean
  children?: ReactNode
}
export declare const Button: (props: ButtonProps) => ReactElement

// ── Card ───────────────────────────────────────────────────────────────────
export type CardVariant = 'glass' | 'solid' | 'outlined'
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  clickable?: boolean
  noPadding?: boolean
  children?: ReactNode
}
export declare const Card: (props: CardProps) => ReactElement

// ── ConnectionStatus ───────────────────────────────────────────────────────
export type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'unavailable'
export type ConnectionVariant = 'banner' | 'badge'
export interface ConnectionStatusProps {
  state: ConnectionState
  variant?: ConnectionVariant
  label?: string
  className?: string
}
export declare const ConnectionStatus: (props: ConnectionStatusProps) => ReactElement

// ── EmptyState ─────────────────────────────────────────────────────────────
export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}
export declare const EmptyState: (props: EmptyStateProps) => ReactElement

// ── Footer ─────────────────────────────────────────────────────────────────
export interface FooterLink { label: string; href: string }
export interface FooterProps {
  brand?: ReactNode
  tagline?: string
  links?: FooterLink[]
  copyright?: ReactNode
  bottomRight?: ReactNode
  className?: string
}
export declare const Footer: (props: FooterProps) => ReactElement

// ── GlassPanel ────────────────────────────────────────────────────────────
export interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean
  noPadding?: boolean
  children?: ReactNode
}
export declare const GlassPanel: (props: GlassPanelProps) => ReactElement

// ── Input ─────────────────────────────────────────────────────────────────
export type InputSize = 'sm' | 'md' | 'lg'
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  iconLeft?: ReactNode
  iconRight?: ReactNode
  showCount?: boolean
  size?: InputSize
}
export declare const Input: (props: InputProps) => ReactElement

// ── LoadingSpinner ─────────────────────────────────────────────────────────
export type SpinnerSize = 'sm' | 'md' | 'lg'
export interface LoadingSpinnerProps {
  size?: SpinnerSize
  className?: string
}
export declare const LoadingSpinner: (props: LoadingSpinnerProps) => ReactElement

// ── Modal ─────────────────────────────────────────────────────────────────
export type ModalSize = 'sm' | 'md' | 'lg' | 'full'
export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  size?: ModalSize
  footer?: ReactNode
  hideClose?: boolean
  children?: ReactNode
}
export declare const Modal: (props: ModalProps) => ReactElement | null

// ── Nav ───────────────────────────────────────────────────────────────────
export interface NavLink { label: string; href: string }
export interface NavProps {
  logo?: ReactNode
  links?: NavLink[]
  cta?: ReactNode
  className?: string
}
export declare const Nav: (props: NavProps) => ReactElement

// ── SectionHeader ─────────────────────────────────────────────────────────
export interface SectionHeaderProps {
  overline?: string
  title: string
  subtitle?: string
  className?: string
}
export declare const SectionHeader: (props: SectionHeaderProps) => ReactElement

// ── Skeleton ──────────────────────────────────────────────────────────────
export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
  borderRadius?: string
}
export declare const Skeleton: (props: SkeletonProps) => ReactElement

// ── StatCard ──────────────────────────────────────────────────────────────
export type TrendDirection = 'up' | 'down' | 'neutral'
export interface StatCardProps {
  value: string | number
  label: string
  trend?: TrendDirection
  trendLabel?: string
  icon?: ReactNode
  className?: string
}
export declare const StatCard: (props: StatCardProps) => ReactElement

// ── Tag ───────────────────────────────────────────────────────────────────
export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  outlined?: boolean
  clickable?: boolean
  icon?: ReactNode
  removable?: boolean
  onRemove?: () => void
  children?: ReactNode
}
export declare const Tag: (props: TagProps) => ReactElement

// ── Textarea ──────────────────────────────────────────────────────────────
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  rows?: number
}
export declare const Textarea: (props: TextareaProps) => ReactElement

// ── Tooltip ───────────────────────────────────────────────────────────────
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'
export interface TooltipProps {
  content: ReactNode
  placement?: TooltipPlacement
  delay?: number
  children: ReactElement
}
export declare const Tooltip: (props: TooltipProps) => ReactElement
