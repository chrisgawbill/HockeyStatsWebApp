import { useState } from 'react';
import SignInDialog from '@/components/SignInDialog';

export interface SignInButtonProps {
  className?: string;
}

/**
 * A "Sign in" text button that opens the sign-in dialog, for in-page prompts
 * that should offer every provider rather than one.
 */
export default function SignInButton({ className = '' }: SignInButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={`ds-button ${className}`}
        aria-haspopup="dialog"
        onClick={() => setIsDialogOpen(true)}
      >
        Sign in
      </button>
      <SignInDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}
