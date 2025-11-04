import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/utils/test-utils';
import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  it('renders the login component', () => {
    render(<LoginPage />);

    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
  });

  it('renders sign in button', () => {
    render(<LoginPage />);

    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});
