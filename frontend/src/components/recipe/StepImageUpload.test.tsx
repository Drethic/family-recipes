import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StepImageUpload } from './StepImageUpload';

describe('StepImageUpload', () => {
  const mockOnImageChange = vi.fn();
  const stepNumber = 1;

  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('should render upload button when no image', () => {
    render(<StepImageUpload stepNumber={stepNumber} onImageChange={mockOnImageChange} />);

    expect(screen.getByText('Add image (optional)')).toBeInTheDocument();
  });

  it('should have correct input id based on step number', () => {
    render(<StepImageUpload stepNumber={3} onImageChange={mockOnImageChange} />);

    const input = document.getElementById('step-3-image-upload');
    expect(input).toBeInTheDocument();
  });

  it('should handle file selection', async () => {
    const user = userEvent.setup();
    render(<StepImageUpload stepNumber={stepNumber} onImageChange={mockOnImageChange} />);

    const file = new File(['image'], 'step-image.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Add image (optional)');

    await user.upload(input, file);

    await waitFor(() => {
      expect(mockOnImageChange).toHaveBeenCalledWith(
        expect.objectContaining({
          file,
          preview: 'blob:mock-url',
          altText: '',
        })
      );
    });
  });

  it('should show alert for non-image files', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<StepImageUpload stepNumber={stepNumber} onImageChange={mockOnImageChange} />);

    const file = new File(['document'], 'document.pdf', { type: 'application/pdf' });
    const input = document.getElementById(`step-${stepNumber}-image-upload`) as HTMLInputElement;

    await user.upload(input, file);

    expect(alertSpy).toHaveBeenCalledWith('Please select an image file');
    expect(mockOnImageChange).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('should display preview after file selection', async () => {
    const user = userEvent.setup();
    render(<StepImageUpload stepNumber={stepNumber} onImageChange={mockOnImageChange} />);

    const file = new File(['image'], 'step-image.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Add image (optional)');

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByAltText('Step 1 image')).toBeInTheDocument();
    });
  });

  it('should show alt text input after image upload', async () => {
    const user = userEvent.setup();
    render(<StepImageUpload stepNumber={2} onImageChange={mockOnImageChange} />);

    const file = new File(['image'], 'step-image.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Add image (optional)');

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Describe step 2 image...')).toBeInTheDocument();
    });
  });

  it('should update alt text', async () => {
    const user = userEvent.setup();
    render(<StepImageUpload stepNumber={stepNumber} onImageChange={mockOnImageChange} />);

    const file = new File(['image'], 'step-image.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Add image (optional)');

    await user.upload(input, file);

    const altTextInput = await screen.findByPlaceholderText('Describe step 1 image...');
    await user.type(altTextInput, 'Mixing ingredients');

    await waitFor(() => {
      const calls = mockOnImageChange.mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall.altText).toBe('Mixing ingredients');
    });
  });

  it('should use alt text in image alt attribute', async () => {
    const user = userEvent.setup();
    render(<StepImageUpload stepNumber={stepNumber} onImageChange={mockOnImageChange} />);

    const file = new File(['image'], 'step-image.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Add image (optional)');

    await user.upload(input, file);

    const altTextInput = await screen.findByPlaceholderText('Describe step 1 image...');
    await user.type(altTextInput, 'Test description');

    await waitFor(() => {
      expect(screen.getByAltText('Test description')).toBeInTheDocument();
    });
  });

  it('should remove image when remove button clicked', async () => {
    const user = userEvent.setup();
    render(<StepImageUpload stepNumber={stepNumber} onImageChange={mockOnImageChange} />);

    const file = new File(['image'], 'step-image.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Add image (optional)');

    await user.upload(input, file);

    const removeButton = await screen.findByText('Remove Image');
    await user.click(removeButton);

    await waitFor(() => {
      expect(mockOnImageChange).toHaveBeenCalledWith(null);
    });
  });

  it('should show upload button again after removing image', async () => {
    const user = userEvent.setup();
    render(<StepImageUpload stepNumber={stepNumber} onImageChange={mockOnImageChange} />);

    const file = new File(['image'], 'step-image.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Add image (optional)');

    await user.upload(input, file);

    const removeButton = await screen.findByText('Remove Image');
    await user.click(removeButton);

    await waitFor(() => {
      expect(screen.getByText('Add image (optional)')).toBeInTheDocument();
    });
  });

  it('should revoke object URL when removing image', async () => {
    const user = userEvent.setup();
    render(<StepImageUpload stepNumber={stepNumber} onImageChange={mockOnImageChange} />);

    const file = new File(['image'], 'step-image.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Add image (optional)');

    await user.upload(input, file);

    const removeButton = await screen.findByText('Remove Image');
    await user.click(removeButton);

    await waitFor(() => {
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  it('should render with existing image', () => {
    const existingImage = {
      file: new File(['image'], 'existing.jpg', { type: 'image/jpeg' }),
      preview: 'blob:existing',
      altText: 'Existing step image',
    };

    render(
      <StepImageUpload
        stepNumber={stepNumber}
        onImageChange={mockOnImageChange}
        existingImage={existingImage}
      />
    );

    expect(screen.getByAltText('Existing step image')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing step image')).toBeInTheDocument();
    expect(screen.getByText('Remove Image')).toBeInTheDocument();
  });

  it('should have correct label for alt text input', async () => {
    const user = userEvent.setup();
    render(<StepImageUpload stepNumber={3} onImageChange={mockOnImageChange} />);

    const file = new File(['image'], 'step-image.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Add image (optional)');

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByLabelText('Image description (optional)')).toBeInTheDocument();
    });
  });

  it('should clear file input value when removing', async () => {
    const user = userEvent.setup();
    render(<StepImageUpload stepNumber={stepNumber} onImageChange={mockOnImageChange} />);

    const file = new File(['image'], 'step-image.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Add image (optional)') as HTMLInputElement;

    await user.upload(input, file);

    const removeButton = await screen.findByText('Remove Image');
    await user.click(removeButton);

    await waitFor(() => {
      const fileInput = document.getElementById(`step-${stepNumber}-image-upload`) as HTMLInputElement;
      expect(fileInput.value).toBe('');
    });
  });

  it('should handle PNG images', async () => {
    const user = userEvent.setup();
    render(<StepImageUpload stepNumber={stepNumber} onImageChange={mockOnImageChange} />);

    const file = new File(['image'], 'step-image.png', { type: 'image/png' });
    const input = screen.getByLabelText('Add image (optional)');

    await user.upload(input, file);

    await waitFor(() => {
      expect(mockOnImageChange).toHaveBeenCalledWith(
        expect.objectContaining({
          file,
        })
      );
    });
  });

  it('should handle WebP images', async () => {
    const user = userEvent.setup();
    render(<StepImageUpload stepNumber={stepNumber} onImageChange={mockOnImageChange} />);

    const file = new File(['image'], 'step-image.webp', { type: 'image/webp' });
    const input = screen.getByLabelText('Add image (optional)');

    await user.upload(input, file);

    await waitFor(() => {
      expect(mockOnImageChange).toHaveBeenCalledWith(
        expect.objectContaining({
          file,
        })
      );
    });
  });

  it('should maintain alt text when updating', async () => {
    const user = userEvent.setup();
    render(<StepImageUpload stepNumber={stepNumber} onImageChange={mockOnImageChange} />);

    const file = new File(['image'], 'step-image.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Add image (optional)');

    await user.upload(input, file);

    const altTextInput = await screen.findByPlaceholderText('Describe step 1 image...');
    await user.type(altTextInput, 'First description');
    await user.clear(altTextInput);
    await user.type(altTextInput, 'Updated description');

    await waitFor(() => {
      const calls = mockOnImageChange.mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall.altText).toBe('Updated description');
      expect(lastCall.file).toBe(file);
    });
  });
});
