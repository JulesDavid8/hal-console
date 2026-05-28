import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for merging Tailwind classes with proper conflict resolution.
 * This is a foundational piece of our component system.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
