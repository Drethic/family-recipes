import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageUpload } from './ImageUpload';

describe('ImageUpload', () => {
  const mockOnImagesChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  });

  it('should render upload area when no images', () => {
    render(<ImageUpload onImagesChange={mockOnImagesChange} />);

    expect(screen.getByText(/Click to upload/i)).toBeInTheDocument();
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
    expect(screen.getByText('0 / 3')).toBeInTheDocument();
  });

  it('should accept custom maxImages prop', () => {
    render(<ImageUpload maxImages={5} onImagesChange={mockOnImagesChange} />);

    expect(screen.getByText('Recipe Images (up to 5)')).toBeInTheDocument();
    expect(screen.getByText('0 / 5')).toBeInTheDocument();
  });

  it('should handle file selection', async () => {
    const user = userEvent.setup();
    render(<ImageUpload onImagesChange={mockOnImagesChange} />);

    const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/Click to upload/i);

    await user.upload(input, file);

    await waitFor(() => {
      expect(mockOnImagesChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            file,
            altText: '',
            isPrimary: true,
          }),
        ])
      );
    });
  });

  it('should handle multiple file selection', async () => {
    const user = userEvent.setup();
    render(<ImageUpload onImagesChange={mockOnImagesChange} />);

    const files = [
      new File(['image1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['image2'], 'test2.png', { type: 'image/png' }),
    ];
    const input = screen.getByLabelText(/Click to upload/i);

    await user.upload(input, files);

    await waitFor(() => {
      expect(mockOnImagesChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ isPrimary: true }),
          expect.objectContaining({ isPrimary: false }),
        ])
      );
    });
  });

  it('should filter out non-image files', async () => {
    const user = userEvent.setup();
    render(<ImageUpload onImagesChange={mockOnImagesChange} />);

    const files = [
      new File(['image'], 'test.jpg', { type: 'image/jpeg' }),
      new File(['doc'], 'test.pdf', { type: 'application/pdf' }),
    ];
    const input = screen.getByLabelText(/Click to upload/i);

    await user.upload(input, files);

    await waitFor(() => {
      const calls = mockOnImagesChange.mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall).toHaveLength(1);
    });
  });

  it('should show alert when exceeding max images', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<ImageUpload maxImages={2} onImagesChange={mockOnImagesChange} />);

    const files = [
      new File(['image1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['image2'], 'test2.jpg', { type: 'image/jpeg' }),
      new File(['image3'], 'test3.jpg', { type: 'image/jpeg' }),
    ];
    const input = screen.getByLabelText(/Click to upload/i);

    await user.upload(input, files);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('You can only upload up to 2 images');
    });

    alertSpy.mockRestore();
  });

  it('should display image previews', async () => {
    const user = userEvent.setup();
    render(<ImageUpload onImagesChange={mockOnImagesChange} />);

    const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/Click to upload/i);

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
    });
  });

  it('should show thumbnail badge on primary image', async () => {
    const user = userEvent.setup();
    render(<ImageUpload onImagesChange={mockOnImagesChange} />);

    const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/Click to upload/i);

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('Thumbnail')).toBeInTheDocument();
    });
  });

  it('should update alt text', async () => {
    const user = userEvent.setup();
    render(<ImageUpload onImagesChange={mockOnImagesChange} />);

    const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/Click to upload/i);

    await user.upload(input, file);

    const altTextInput = await screen.findByPlaceholderText('Describe the image...');
    await user.type(altTextInput, 'A beautiful sunset');

    await waitFor(() => {
      const calls = mockOnImagesChange.mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall[0].altText).toBe('A beautiful sunset');
    });
  });

  it('should set image as primary', async () => {
    const user = userEvent.setup();
    render(<ImageUpload onImagesChange={mockOnImagesChange} />);

    const files = [
      new File(['image1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['image2'], 'test2.jpg', { type: 'image/jpeg' }),
    ];
    const input = screen.getByLabelText(/Click to upload/i);

    await user.upload(input, files);

    const setPrimaryButton = await screen.findByText('Set as Thumbnail');
    await user.click(setPrimaryButton);

    await waitFor(() => {
      const calls = mockOnImagesChange.mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall[0].isPrimary).toBe(false);
      expect(lastCall[1].isPrimary).toBe(true);
    });
  });

  it('should not show "Set as Thumbnail" button for primary image', async () => {
    const user = userEvent.setup();
    render(<ImageUpload onImagesChange={mockOnImagesChange} />);

    const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/Click to upload/i);

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.queryByText('Set as Thumbnail')).not.toBeInTheDocument();
    });
  });

  it('should move image up', async () => {
    const user = userEvent.setup();
    render(<ImageUpload onImagesChange={mockOnImagesChange} />);

    const files = [
      new File(['image1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['image2'], 'test2.jpg', { type: 'image/jpeg' }),
    ];
    const input = screen.getByLabelText(/Click to upload/i);

    await user.upload(input, files);

    const moveUpButton = await screen.findByLabelText('Move image up');
    await user.click(moveUpButton);

    await waitFor(() => {
      const calls = mockOnImagesChange.mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall[0].file.name).toBe('test2.jpg');
      expect(lastCall[1].file.name).toBe('test1.jpg');
    });
  });

  it('should not show move up button for first image', async () => {
    const user = userEvent.setup();
    render(<ImageUpload onImagesChange={mockOnImagesChange} />);

    const files = [
      new File(['image1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['image2'], 'test2.jpg', { type: 'image/jpeg' }),
    ];
    const input = screen.getByLabelText(/Click to upload/i);

    await user.upload(input, files);

    await waitFor(() => {
      const moveUpButtons = screen.queryAllByLabelText('Move image up');
      expect(moveUpButtons).toHaveLength(1);
    });
  });

  it('should move image down', async () => {
    const user = userEvent.setup();
    render(<ImageUpload onImagesChange={mockOnImagesChange} />);

    const files = [
      new File(['image1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['image2'], 'test2.jpg', { type: 'image/jpeg' }),
    ];
    const input = screen.getByLabelText(/Click to upload/i);

    await user.upload(input, files);

    const moveDownButton = await screen.findByLabelText('Move image down');
    await user.click(moveDownButton);

    await waitFor(() => {
      const calls = mockOnImagesChange.mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall[0].file.name).toBe('test2.jpg');
      expect(lastCall[1].file.name).toBe('test1.jpg');
    });
  });

  it('should not show move down button for last image', async () => {
    const user = userEvent.setup();
    render(<ImageUpload onImagesChange={mockOnImagesChange} />);

    const files = [
      new File(['image1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['image2'], 'test2.jpg', { type: 'image/jpeg' }),
    ];
    const input = screen.getByLabelText(/Click to upload/i);

    await user.upload(input, files);

    await waitFor(() => {
      const moveDownButtons = screen.queryAllByLabelText('Move image down');
      expect(moveDownButtons).toHaveLength(1);
    });
  });

  it('should remove image', async () => {
    const user = userEvent.setup();
    render(<ImageUpload onImagesChange={mockOnImagesChange} />);

    const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/Click to upload/i);

    await user.upload(input, file);

    const removeButton = await screen.findByText('Remove');
    await user.click(removeButton);

    await waitFor(() => {
      const calls = mockOnImagesChange.mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall).toHaveLength(0);
    });
  });

  it('should reassign primary to first image when removing current primary', async () => {
    const user = userEvent.setup();
    render(<ImageUpload onImagesChange={mockOnImagesChange} />);

    const files = [
      new File(['image1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['image2'], 'test2.jpg', { type: 'image/jpeg' }),
    ];
    const input = screen.getByLabelText(/Click to upload/i);

    await user.upload(input, files);

    const removeButtons = await screen.findAllByText('Remove');
    await user.click(removeButtons[0]);

    await waitFor(() => {
      const calls = mockOnImagesChange.mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall).toHaveLength(1);
      expect(lastCall[0].isPrimary).toBe(true);
    });
  });

  it('should hide upload area when max images reached', async () => {
    const user = userEvent.setup();
    render(<ImageUpload maxImages={1} onImagesChange={mockOnImagesChange} />);

    const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/Click to upload/i);

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.queryByText(/Click to upload/i)).not.toBeInTheDocument();
    });
  });

  it('should handle drag enter', async () => {
    render(<ImageUpload onImagesChange={mockOnImagesChange} />);

    const uploadArea = screen.getByText(/Click to upload/i).closest('div');

    if (uploadArea?.parentElement) {
      const dragEvent = new DragEvent('dragenter', {
        bubbles: true,
        cancelable: true,
      });

      uploadArea.parentElement.dispatchEvent(dragEvent);

      await waitFor(() => {
        expect(uploadArea.parentElement).toHaveClass('border-blue-500');
      });
    }
  });

  it('should handle drag leave', async () => {
    render(<ImageUpload onImagesChange={mockOnImagesChange} />);

    const uploadArea = screen.getByText(/Click to upload/i).closest('div');

    if (uploadArea?.parentElement) {
      const dragEnter = new DragEvent('dragenter', {
        bubbles: true,
        cancelable: true,
      });
      uploadArea.parentElement.dispatchEvent(dragEnter);

      const dragLeave = new DragEvent('dragleave', {
        bubbles: true,
        cancelable: true,
      });
      uploadArea.parentElement.dispatchEvent(dragLeave);

      await waitFor(() => {
        expect(uploadArea.parentElement).toHaveClass('border-gray-300');
      });
    }
  });

  it('should handle drop event', async () => {
    render(<ImageUpload onImagesChange={mockOnImagesChange} />);

    const uploadArea = screen.getByText(/Click to upload/i).closest('div');
    const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });

    if (uploadArea?.parentElement) {
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
      });

      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [file],
        },
      });

      uploadArea.parentElement.dispatchEvent(dropEvent);

      await waitFor(() => {
        expect(mockOnImagesChange).toHaveBeenCalled();
      });
    }
  });

  it('should render with existing images', () => {
    const existingImages = [
      {
        file: new File(['image'], 'test.jpg', { type: 'image/jpeg' }),
        preview: 'blob:existing',
        altText: 'Existing image',
        isPrimary: true,
      },
    ];

    render(<ImageUpload existingImages={existingImages} onImagesChange={mockOnImagesChange} />);

    expect(screen.getByDisplayValue('Existing image')).toBeInTheDocument();
    expect(screen.getByText('Thumbnail')).toBeInTheDocument();
  });

  it('should update image count', async () => {
    const user = userEvent.setup();
    render(<ImageUpload onImagesChange={mockOnImagesChange} />);

    expect(screen.getByText('0 / 3')).toBeInTheDocument();

    const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/Click to upload/i);

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });
  });
});
