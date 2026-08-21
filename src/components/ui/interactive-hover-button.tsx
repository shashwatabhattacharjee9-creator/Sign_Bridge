'use client';

/**
 * @author: @emerald-ui
 * @description: Interactive Hover Button Component
 * @version: 1.0.0
 * @date: 2026-01-28
 * @license: MIT
 * @website: https://emerald-ui.com
 */
import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  loadingText?: string;
  successText?: string;
  classes?: string;
  className?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'glass';
}

export default function InteractiveHoverButton({
  text = 'Button',
  loadingText = 'Processing...',
  successText = 'Complete!',
  classes,
  className,
  icon,
  variant = 'primary',
  onClick,
  disabled,
  children,
  ...props
}: InteractiveHoverButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const isIdle = status === 'idle';
  const displayText = children ? (typeof children === 'string' ? children : text) : text;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
      return;
    }
    if (status !== 'idle') return;

    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }, 2000);
  };

  return (
    <motion.button
      className={cn(
        'group relative flex min-w-36 items-center justify-center overflow-hidden rounded-full border border-white/10 p-2.5 px-6 font-semibold text-xs transition-all duration-300 select-none cursor-pointer',
        variant === 'glass'
          ? 'liquid-glass text-white'
          : 'bg-black text-white hover:border-white/25',
        status === 'loading' && 'px-4',
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        classes,
        className
      )}
      onClick={handleClick}
      disabled={disabled}
      layout
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      {...(props as any)}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={status}
          className="flex items-center justify-center gap-2 w-full"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
        >
          {/* Animated expansion dot: hidden initially, scales out on hover */}
          <div
            className={cn(
              'absolute left-4 h-2 w-2 rounded-full bg-white opacity-0 scale-0 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-[45] pointer-events-none z-0',
              !isIdle && 'opacity-100 scale-[45]'
            )}
          />

          {/* Normal Default Label & Icon (Slides out on hover) */}
          <span
            className={cn(
              'relative z-10 flex items-center justify-center gap-2 transition-all duration-500 group-hover:translate-x-20 group-hover:opacity-0',
              !isIdle && 'translate-x-20 opacity-0'
            )}
          >
            {icon}
            <span>{displayText}</span>
          </span>

          {/* Hover / Status Overlay (Slides in with arrow on hover) */}
          <div
            className={cn(
              'absolute inset-0 z-20 flex h-full w-full -translate-x-16 items-center justify-center gap-2 font-semibold text-black opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100',
              !isIdle && 'translate-x-0 opacity-100'
            )}
          >
            {status === 'idle' ? (
              <>
                <span>{displayText}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            ) : status === 'loading' ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                <span>{loadingText}</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 text-black" />
                <span>{successText}</span>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
