/**
 * H.A.L. Design System — Public API
 * 
 * This barrel file controls what the rest of the application is allowed to import
 * from the design system. This is a key evolvability mechanism.
 */

// Primitives (lowest level building blocks)
export { Button, type ButtonProps } from './primitives/Button';
export { Card } from './primitives/Card';
export { Input, type InputProps } from './primitives/Input';
export { Badge } from './primitives/Badge';
export { Spinner } from './primitives/Spinner';
export { Tabs } from './primitives/Tabs';
export { CommandBar } from './primitives/CommandBar';
export { Combobox, type ComboboxOption } from './primitives/Combobox';

// Tokens
export * as tokens from './tokens';

// Future: composed components, patterns, etc. will be exported here.
