/**
 * API client for component management
 */

export interface ComponentListItem {
  id: string;
  name: string;
  figmaUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface CodegenResult {
  componentName: string;
  files: {
    react: { filename: string; content: string };
    css: { filename: string; content: string };
    story: { filename: string; content: string };
  };
  saveWarning?: string;
}

export interface ComponentDetail extends CodegenResult {
  id: string;
  name: string;
  figmaUrl: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Generate code from Figma URL
 */
export async function generateFromFigma(
  figmaUrl: string,
  save = false,
): Promise<CodegenResult> {
  const res = await fetch('/api/figma', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ figmaUrl, save }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Alias for generateFromFigma
 */
export const generateCode = generateFromFigma;

/**
 * List all saved components
 */
export async function listComponents(): Promise<ComponentListItem[]> {
  const res = await fetch('/api/components');

  if (!res.ok) {
    throw new Error(`Failed to fetch components: ${res.status}`);
  }

  const data = await res.json();
  return data.components;
}

/**
 * Get a single component by ID
 */
export async function getComponent(id: string): Promise<ComponentDetail> {
  const res = await fetch(`/api/components/${id}`);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Not found' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Save a generated component to the library
 */
export async function saveComponent(data: {
  componentName: string;
  figmaUrl: string;
  files: CodegenResult['files'];
}): Promise<{ id: string; message: string }> {
  const res = await fetch('/api/components/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Save failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Delete a component from the library
 */
export async function deleteComponent(id: string): Promise<void> {
  const res = await fetch(`/api/components/delete?id=${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Delete failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
}

// Package API

export interface PackageInfo {
  packageName: string;
  version: string;
  componentCount: number;
  lastBuiltAt: string | null;
  tarballUrl: string | null;
  hasComponents: boolean;
}

export interface BuildResult {
  success: boolean;
  packageName: string;
  version: string;
  tarballUrl: string;
  tarballFilename: string;
  componentCount: number;
  buildLog: string[];
}

/**
 * Get package metadata
 */
export async function getPackageInfo(): Promise<PackageInfo> {
  const res = await fetch('/api/package/info');

  if (!res.ok) {
    throw new Error(`Failed to fetch package info: ${res.status}`);
  }

  return res.json();
}

/**
 * Build npm package from all components
 */
export async function buildPackage(): Promise<BuildResult> {
  const res = await fetch('/api/package/build', {
    method: 'POST',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Build failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}
