import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { SessionProvider } from '@/components/providers/SessionProvider';
import AppShell from '@/components/layout/AppShell';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  SessionProvider: ({ children }: any) => <>{children}</>,
}));

describe('AppShell Navigation', () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/exercises');
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { name: 'Test User', email: 'test@example.com' },
      },
      status: 'authenticated',
    });
  });

  it('keeps all five destinations reachable from an authenticated dashboard', () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    render(<AppShell><p>Dashboard content</p></AppShell>);
    for (const label of ['Desktop navigation', 'Mobile navigation']) {
      const nav = within(screen.getByRole('navigation', { name: label }));
      for (const [name, href] of [
        ['Dashboard', '/dashboard'], ['Plans', '/plans'], ['Exercises', '/exercises'],
        ['Progress', '/progress'], ['Settings', '/settings'],
      ]) {
        expect(nav.getByRole('link', { name })).toHaveAttribute('href', href);
      }
      expect(nav.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
    }
  });

  it('provides a sign-in link when viewing the library signed out', () => {
    (useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' });
    render(<AppShell><p>Library</p></AppShell>);
    expect(screen.getAllByRole('link', { name: 'Sign in' })[0]).toHaveAttribute('href', '/login');
  });

  it('renders desktop sidebar with Exercises nav link when authenticated', () => {
    render(
      <SessionProvider session={null}>
        <AppShell>
          <div>Test content</div>
        </AppShell>
      </SessionProvider>
    );

    expect(screen.getAllByText(/Exercises/i).length).toBeGreaterThan(0);
  });

  it('renders mobile bottom navigation', () => {
    const { container } = render(
      <SessionProvider session={null}>
        <AppShell>
          <div>Test content</div>
        </AppShell>
      </SessionProvider>
    );

    const mobileNav = container.querySelector('nav:last-of-type');
    expect(mobileNav).toBeInTheDocument();
  });

  it('includes Exercises link even for unauthenticated users', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(
      <SessionProvider session={null}>
        <AppShell>
          <div>Test content</div>
        </AppShell>
      </SessionProvider>
    );

    const exerciseLinks = screen.getAllByText(/Exercises/i);
    expect(exerciseLinks.length).toBeGreaterThan(0);
  });

  it('marks active nav item with aria-current', () => {
    (usePathname as jest.Mock).mockReturnValue('/exercises');

    const { container } = render(
      <SessionProvider session={null}>
        <AppShell>
          <div>Test content</div>
        </AppShell>
      </SessionProvider>
    );

    const activeLinks = container.querySelectorAll('[aria-current="page"]');
    expect(activeLinks.length).toBeGreaterThan(0);
  });

  it('renders skip to content link for accessibility', () => {
    render(
      <SessionProvider session={null}>
        <AppShell>
          <div>Test content</div>
        </AppShell>
      </SessionProvider>
    );

    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });

  it('shows loading state when session is loading', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
    });

    const { container } = render(
      <SessionProvider session={null}>
        <AppShell>
          <div>Test content</div>
        </AppShell>
      </SessionProvider>
    );

    const spinner = container.querySelector('.animate-pulse');
    expect(spinner).toBeInTheDocument();
  });

  it('displays YOUR TRAINING SPACE header on desktop', () => {
    render(
      <SessionProvider session={null}>
        <AppShell>
          <div>Test content</div>
        </AppShell>
      </SessionProvider>
    );

    expect(screen.getByText('YOUR TRAINING SPACE')).toBeInTheDocument();
  });
});
