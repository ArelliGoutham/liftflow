import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ExerciseList from '@/components/exercises/ExerciseList';

describe('Exercise List', () => {
  const mockExercises = [
    {
      _id: '1',
      name: 'Bench Press',
      category: 'upper-body',
    },
    {
      _id: '2',
      name: 'Squat',
      category: 'lower-body',
    },
  ];

  it('renders exercise list with all exercises', () => {
    render(<ExerciseList exercises={mockExercises} />);

    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Squat')).toBeInTheDocument();
  });

  it('displays exercise categories', () => {
    render(<ExerciseList exercises={mockExercises} />);

    expect(screen.getByText('Upper Body')).toBeInTheDocument();
    expect(screen.getByText('Lower Body')).toBeInTheDocument();
  });

  it('links to exercise detail pages', () => {
    render(<ExerciseList exercises={mockExercises} />);

    const benchPressLinks = screen.getAllByRole('link').filter(link =>
      link.getAttribute('href')?.includes('/exercises/1')
    );
    expect(benchPressLinks.length).toBeGreaterThan(0);
  });

  it('shows empty state when no exercises', () => {
    render(<ExerciseList exercises={[]} />);

    expect(screen.getByText('No exercises found.')).toBeInTheDocument();
  });

  it('displays form guide text for each exercise', () => {
    render(<ExerciseList exercises={mockExercises} />);

    const formGuideTexts = screen.getAllByText(/View form guide/);
    expect(formGuideTexts.length).toBe(2);
  });
});
