import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/common/Dialog';

describe('common/Dialog wrapper', () => {
  it('renders the shadcn primitive content with viewport-aware classes', () => {
    render(
      <Dialog open>
        <DialogContent data-testid="content">
          <DialogHeader>
            <DialogTitle>Test</DialogTitle>
            <DialogDescription>Body</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    const content = screen.getByTestId('content');
    // Primitive data-slot intact — wrapper composes, does not replace
    expect(content.getAttribute('data-slot')).toBe('dialog-content');
    // Mobile anchor classes present
    expect(content.className).toContain('top-4');
    expect(content.className).toContain('translate-y-0');
    expect(content.className).toContain('overscroll-contain');
    // Desktop overrides retained
    expect(content.className).toContain('sm:top-[50%]');
    expect(content.className).toContain('sm:translate-y-[-50%]');
  });

  it('forwards user className without dropping wrapper classes', () => {
    render(
      <Dialog open>
        <DialogContent data-testid="content" className="custom-class sm:max-w-md">
          <DialogTitle>X</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const content = screen.getByTestId('content');
    expect(content.className).toContain('custom-class');
    expect(content.className).toContain('sm:max-w-md');
    expect(content.className).toContain('top-4');
  });
});
