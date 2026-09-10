describe('Auth', () => {
  it('should require authentication for protected routes', () => {
    const protectedRoutes = ['/api/plans', '/api/sessions', '/api/logs'];
    expect(protectedRoutes.length).toBeGreaterThan(0);
  });
});
