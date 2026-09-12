import * as React from 'react';
import { createPortal } from 'react-dom';

type DialogState = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogState | null>(null);

function useDialog() {
  const value = React.useContext(DialogContext);
  if (!value) throw new Error('Dialog components must be used inside Dialog');
  return value;
}

export function Dialog({
  open,
  onOpenChange,
  children,
}: React.PropsWithChildren<DialogState>) {
  return <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>;
}

export function DialogContent({
  className = '',
  children,
}: React.PropsWithChildren<{ className?: string; showCloseButton?: boolean }>) {
  const { open, onOpenChange } = useDialog();

  React.useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [open, onOpenChange]);

  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <>
      <div data-slot="dialog-overlay" onMouseDown={() => onOpenChange(false)} />
      <div data-slot="dialog-content" role="dialog" aria-modal="true" className={className}>
        {children}
      </div>
    </>,
    document.body,
  );
}

export function DialogClose({
  className = '',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { onOpenChange } = useDialog();
  return (
    <button type="button" className={className} onClick={() => onOpenChange(false)} {...props}>
      {children}
    </button>
  );
}

export function DialogTitle({ className = '', children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={className} {...props}>{children}</h2>;
}

export function DialogDescription({ className = '', children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={className} {...props}>{children}</p>;
}
