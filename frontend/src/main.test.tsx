import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('main.tsx', () => {
  it('exists and contains ReactDOM.createRoot', () => {
    const mainPath = path.join(__dirname, 'main.tsx');
    const content = fs.readFileSync(mainPath, 'utf-8');

    expect(content).toContain('ReactDOM.createRoot');
    expect(content).toContain('document.getElementById(\'root\')');
  });

  it('renders App in StrictMode', () => {
    const mainPath = path.join(__dirname, 'main.tsx');
    const content = fs.readFileSync(mainPath, 'utf-8');

    expect(content).toContain('React.StrictMode');
    expect(content).toContain('<App />');
  });

  it('imports required dependencies', () => {
    const mainPath = path.join(__dirname, 'main.tsx');
    const content = fs.readFileSync(mainPath, 'utf-8');

    expect(content).toContain('import React from \'react\'');
    expect(content).toContain('import ReactDOM from \'react-dom/client\'');
    expect(content).toContain('import App from \'./App.tsx\'');
  });
});
