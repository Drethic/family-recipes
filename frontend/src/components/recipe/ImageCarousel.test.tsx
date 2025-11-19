import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImageCarousel } from './ImageCarousel';
import type { RecipeImage } from '@/types';
import userEvent from '@testing-library/user-event';

describe('ImageCarousel', () => {
  const mockImages: RecipeImage[] = [
    {
      id: 'image-1',
      recipe_id: 'recipe-1',
      url: 'http://example.com/image1.jpg',
      alt_text: 'First image',
      is_primary: true,
      order_index: 0,
      instruction_id: null,
    },
    {
      id: 'image-2',
      recipe_id: 'recipe-1',
      url: 'http://example.com/image2.jpg',
      alt_text: 'Second image',
      is_primary: false,
      order_index: 1,
      instruction_id: null,
    },
    {
      id: 'image-3',
      recipe_id: 'recipe-1',
      url: 'http://example.com/image3.jpg',
      alt_text: 'Third image',
      is_primary: false,
      order_index: 2,
      instruction_id: null,
    },
  ];

  it('should render null when no images provided', () => {
    const { container } = render(<ImageCarousel images={[]} recipeName="Test Recipe" />);
    expect(container.firstChild).toBeNull();
  });

  it('should render single image without navigation', () => {
    render(<ImageCarousel images={[mockImages[0]]} recipeName="Test Recipe" />);

    expect(screen.getByAltText('First image')).toBeInTheDocument();
    expect(screen.queryByLabelText('Previous image')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Next image')).not.toBeInTheDocument();
  });

  it('should render multiple images with navigation', () => {
    render(<ImageCarousel images={mockImages} recipeName="Test Recipe" />);

    expect(screen.getAllByAltText('First image')[0]).toBeInTheDocument();
    expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
    expect(screen.getByLabelText('Next image')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('should navigate to next image when next button clicked', async () => {
    const user = userEvent.setup();
    render(<ImageCarousel images={mockImages} recipeName="Test Recipe" />);

    expect(screen.getAllByAltText('First image')[0]).toBeInTheDocument();

    const nextButton = screen.getByLabelText('Next image');
    await user.click(nextButton);

    expect(screen.getAllByAltText('Second image')[0]).toBeInTheDocument();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('should navigate to previous image when previous button clicked', async () => {
    const user = userEvent.setup();
    render(<ImageCarousel images={mockImages} recipeName="Test Recipe" />);

    // Go to second image first
    const nextButton = screen.getByLabelText('Next image');
    await user.click(nextButton);

    expect(screen.getAllByAltText('Second image')[0]).toBeInTheDocument();

    // Go back to first
    const prevButton = screen.getByLabelText('Previous image');
    await user.click(prevButton);

    expect(screen.getAllByAltText('First image')[0]).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('should wrap to last image when clicking previous on first image', async () => {
    const user = userEvent.setup();
    render(<ImageCarousel images={mockImages} recipeName="Test Recipe" />);

    expect(screen.getAllByAltText('First image')[0]).toBeInTheDocument();

    const prevButton = screen.getByLabelText('Previous image');
    await user.click(prevButton);

    expect(screen.getAllByAltText('Third image')[0]).toBeInTheDocument();
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('should wrap to first image when clicking next on last image', async () => {
    const user = userEvent.setup();
    render(<ImageCarousel images={mockImages} recipeName="Test Recipe" />);

    // Go to last image
    const nextButton = screen.getByLabelText('Next image');
    await user.click(nextButton);
    await user.click(nextButton);

    expect(screen.getAllByAltText('Third image')[0]).toBeInTheDocument();

    // Wrap to first
    await user.click(nextButton);

    expect(screen.getAllByAltText('First image')[0]).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('should navigate with arrow keys', async () => {
    const user = userEvent.setup();
    render(<ImageCarousel images={mockImages} recipeName="Test Recipe" />);

    const carousel = screen.getByRole('region', { name: 'Recipe image carousel' });

    // Navigate to next with arrow right
    await user.type(carousel, '{ArrowRight}');
    expect(screen.getAllByAltText('Second image')[0]).toBeInTheDocument();

    // Navigate to previous with arrow left
    await user.type(carousel, '{ArrowLeft}');
    expect(screen.getAllByAltText('First image')[0]).toBeInTheDocument();
  });

  it('should navigate to specific image when thumbnail clicked', async () => {
    const user = userEvent.setup();
    render(<ImageCarousel images={mockImages} recipeName="Test Recipe" />);

    // Click on third thumbnail
    const thumbnails = screen.getAllByRole('button');
    const thirdThumbnail = thumbnails.find((btn) =>
      btn.getAttribute('aria-label') === 'View image 3'
    );

    expect(thirdThumbnail).toBeDefined();
    await user.click(thirdThumbnail!);

    expect(screen.getAllByAltText('Third image')[0]).toBeInTheDocument();
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('should render all thumbnails', () => {
    render(<ImageCarousel images={mockImages} recipeName="Test Recipe" />);

    const thumbnails = screen.getAllByRole('button').filter((btn) =>
      btn.getAttribute('aria-label')?.startsWith('View image')
    );

    expect(thumbnails).toHaveLength(3);
  });

  it('should highlight current thumbnail', () => {
    render(<ImageCarousel images={mockImages} recipeName="Test Recipe" />);

    const thumbnails = screen.getAllByRole('button').filter((btn) =>
      btn.getAttribute('aria-label')?.startsWith('View image')
    );

    const firstThumbnail = thumbnails[0];
    expect(firstThumbnail).toHaveAttribute('aria-current', 'true');
  });

  it('should use alt text when provided', () => {
    render(<ImageCarousel images={mockImages} recipeName="Test Recipe" />);

    expect(screen.getAllByAltText('First image')[0]).toBeInTheDocument();
  });

  it('should fallback to recipe name and index when alt text missing', () => {
    const imagesWithoutAlt = mockImages.map((img) => ({ ...img, alt_text: '' }));
    render(<ImageCarousel images={imagesWithoutAlt} recipeName="Test Recipe" />);

    expect(screen.getByAltText('Test Recipe - Image 1')).toBeInTheDocument();
  });

  it('should have accessible region role', () => {
    render(<ImageCarousel images={mockImages} recipeName="Test Recipe" />);

    const carousel = screen.getByRole('region', { name: 'Recipe image carousel' });
    expect(carousel).toBeInTheDocument();
    expect(carousel).toHaveAttribute('tabIndex', '0');
  });
});
