/**
 * Database connection pool and helper functions
 * Uses Vercel Postgres in production, mock storage for local development
 */

import { sql } from '@vercel/postgres';
import { mockDb } from './mock-storage.js';

export interface Component {
  id: string;
  name: string;
  figma_url: string;
  component_code: string;
  css_code: string;
  story_code: string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ComponentListItem {
  id: string;
  name: string;
  figma_url: string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface PackageMetadata {
  id: number;
  package_name: string;
  version: string;
  tarball_path: string | null;
  component_count?: number;
  last_built_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

// Check if we're using mock storage (no POSTGRES_URL configured)
const useMockStorage = !process.env.POSTGRES_URL;

if (useMockStorage) {
  console.log('[DB] Using in-memory mock storage for local development');
}

/**
 * List all components (without code content for performance)
 */
export async function listComponents(): Promise<ComponentListItem[]> {
  if (useMockStorage) {
    const components = await mockDb.listComponents();
    return components.map(c => ({
      id: c.id,
      name: c.name,
      figma_url: c.figma_url,
      created_at: c.created_at,
      updated_at: c.updated_at,
    }));
  }

  const result = await sql<ComponentListItem>`
    SELECT id, name, figma_url, created_at, updated_at
    FROM components
    ORDER BY updated_at DESC
  `;
  return result.rows;
}

/**
 * Get a single component by ID (with full code content)
 */
export async function getComponentById(id: string): Promise<Component | null> {
  if (useMockStorage) {
    return await mockDb.getComponentById(id);
  }

  const result = await sql<Component>`
    SELECT *
    FROM components
    WHERE id = ${id}
  `;
  return result.rows[0] || null;
}

/**
 * Get a single component by name (with full code content)
 */
export async function getComponentByName(
  name: string,
): Promise<Component | null> {
  if (useMockStorage) {
    const components = await mockDb.listComponents();
    return components.find(c => c.name === name) || null;
  }

  const result = await sql<Component>`
    SELECT *
    FROM components
    WHERE name = ${name}
  `;
  return result.rows[0] || null;
}

/**
 * Save or update a component
 * Uses INSERT ... ON CONFLICT to handle duplicates
 */
export async function saveComponent(data: {
  name: string;
  figmaUrl: string;
  componentCode: string;
  cssCode: string;
  storyCode: string;
}): Promise<Component> {
  if (useMockStorage) {
    return await mockDb.saveComponent(data);
  }

  const result = await sql<Component>`
    INSERT INTO components (name, figma_url, component_code, css_code, story_code, updated_at)
    VALUES (${data.name}, ${data.figmaUrl}, ${data.componentCode}, ${data.cssCode}, ${data.storyCode}, NOW())
    ON CONFLICT (name)
    DO UPDATE SET
      figma_url = EXCLUDED.figma_url,
      component_code = EXCLUDED.component_code,
      css_code = EXCLUDED.css_code,
      story_code = EXCLUDED.story_code,
      updated_at = NOW()
    RETURNING *
  `;
  return result.rows[0];
}

/**
 * Delete a component by ID
 */
export async function deleteComponent(id: string): Promise<boolean> {
  if (useMockStorage) {
    return await mockDb.deleteComponent(id);
  }

  const result = await sql`
    DELETE FROM components
    WHERE id = ${id}
  `;
  return (result.rowCount ?? 0) > 0;
}

/**
 * Get all components for package building
 */
export async function getAllComponentsForPackage(): Promise<
  Array<{
    name: string;
    component_code: string;
    css_code: string;
  }>
> {
  if (useMockStorage) {
    const components = await mockDb.getAllComponentsForPackage();
    return components.map(c => ({
      name: c.name,
      component_code: c.component_code,
      css_code: c.css_code,
    }));
  }

  const result = await sql<{
    name: string;
    component_code: string;
    css_code: string;
  }>`
    SELECT name, component_code, css_code
    FROM components
    ORDER BY name ASC
  `;
  return result.rows;
}

/**
 * Get the latest package metadata
 */
export async function getLatestPackageMetadata(): Promise<PackageMetadata | null> {
  if (useMockStorage) {
    return await mockDb.getLatestPackageMetadata();
  }

  const result = await sql<PackageMetadata>`
    SELECT *
    FROM package_metadata
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return result.rows[0] || null;
}

/**
 * Save package metadata after building
 */
export async function savePackageMetadata(data: {
  packageName: string;
  version: string;
  tarballPath: string | null;
  componentCount: number;
}): Promise<PackageMetadata> {
  if (useMockStorage) {
    return await mockDb.savePackageMetadata({
      packageName: data.packageName,
      version: data.version,
      tarballPath: data.tarballPath || '',
    });
  }

  const result = await sql<PackageMetadata>`
    INSERT INTO package_metadata (package_name, version, tarball_path, component_count, last_built_at, updated_at)
    VALUES (${data.packageName}, ${data.version}, ${data.tarballPath}, ${data.componentCount}, NOW(), NOW())
    RETURNING *
  `;
  return result.rows[0];
}

/**
 * Track component generation for analytics (optional)
 */
export async function trackComponentGeneration(
  componentName: string,
  figmaUrl: string,
): Promise<void> {
  if (useMockStorage) {
    await mockDb.trackComponentGeneration(componentName, figmaUrl);
    return;
  }

  await sql`
    INSERT INTO component_generations (component_name, figma_url)
    VALUES (${componentName}, ${figmaUrl})
  `;
}
