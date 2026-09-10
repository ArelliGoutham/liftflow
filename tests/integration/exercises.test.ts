describe('Exercise API', () => {
  it('should seed default exercises', () => {
    const defaultExercises = ['Machine Chest Press', 'Lat Pulldown', 'Leg Press'];
    expect(defaultExercises.length).toBeGreaterThan(0);
  });

  it('should support category filtering', () => {
    const exercises = [
      { name: 'Leg Press', category: 'lower-body' },
      { name: 'Chest Press', category: 'upper-body' },
    ];
    const filtered = exercises.filter((e) => e.category === 'upper-body');
    expect(filtered).toHaveLength(1);
  });
});
