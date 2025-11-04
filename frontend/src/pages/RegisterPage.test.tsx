import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/utils/test-utils';
import { RegisterPage } from './RegisterPage';

describe('RegisterPage', () => {
  it('renders the register component', () => {
    render(<RegisterPage />);

    expect(screen.getByText('Create your account')).toBeInTheDocument();
  });

  it('renders register button', () => {
    render(<RegisterPage />);

    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });
});
