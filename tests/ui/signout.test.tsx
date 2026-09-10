import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignOutButton from '@/components/auth/SignOutButton';
import { signOut } from 'next-auth/react';
import * as navigation from '@/lib/client-navigation';

jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
  useSession: jest.fn(() => ({
    data: { user: { name: 'Test User' } },
    status: 'authenticated',
  })),
}));

jest.mock('@/lib/client-navigation', () => ({
  navigateHome: jest.fn(),
}));

describe('SignOutButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (signOut as jest.Mock).mockResolvedValue({ ok: true, url: '/' });
  });

  it('renders sign out button', () => {
    render(<SignOutButton />);
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  it('calls signOut with correct parameters', async () => {
    render(<SignOutButton />);
    const button = screen.getByText('Sign out');

    fireEvent.click(button);

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith({
        redirect: false,
        callbackUrl: '/',
      });
    });
  });

  it('calls navigateHome on successful sign out', async () => {
    (signOut as jest.Mock).mockResolvedValue({ url: '/', ok: true });

    render(<SignOutButton />);
    const button = screen.getByText('Sign out');

    fireEvent.click(button);

    await waitFor(() => {
      expect(navigation.navigateHome).toHaveBeenCalled();
    });
  });

  it('shows error message when response is invalid', async () => {
    (signOut as jest.Mock).mockResolvedValue(undefined);

    render(<SignOutButton />);
    const button = screen.getByText('Sign out');

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Sign out failed. Please try again.')).toBeInTheDocument();
    });

    expect(navigation.navigateHome).not.toHaveBeenCalled();
  });

  it('shows error message when response.url is not a string', async () => {
    (signOut as jest.Mock).mockResolvedValue({ url: 123, ok: true });

    render(<SignOutButton />);
    const button = screen.getByText('Sign out');

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Sign out failed. Please try again.')).toBeInTheDocument();
    });

    expect(navigation.navigateHome).not.toHaveBeenCalled();
  });

  it('shows error message on rejection', async () => {
    (signOut as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<SignOutButton />);
    const button = screen.getByText('Sign out');

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Sign out failed. Please try again.')).toBeInTheDocument();
    });

    expect(navigation.navigateHome).not.toHaveBeenCalled();
  });

  it('shows error with retry button', async () => {
    (signOut as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<SignOutButton />);
    const button = screen.getByText('Sign out');

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  it('retries on retry button click', async () => {
    (signOut as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    (signOut as jest.Mock).mockResolvedValueOnce({ url: '/', ok: true });

    render(<SignOutButton />);
    let button = screen.getByText('Sign out');

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(navigation.navigateHome).toHaveBeenCalled();
    });
  });

  it('renders compact mode with aria-label', () => {
    render(<SignOutButton compact />);
    expect(screen.getByLabelText('Sign out')).toBeInTheDocument();
  });

  it('disables button when pending', async () => {
    (signOut as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ url: '/', ok: true }), 200))
    );

    render(<SignOutButton />);
    const button = screen.getByText('Sign out') as HTMLButtonElement;

    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  it('button has min-height of 44px', () => {
    const { container } = render(<SignOutButton />);
    const button = container.querySelector('button');
    expect(button?.className).toContain('min-h-[44px]');
  });
});
