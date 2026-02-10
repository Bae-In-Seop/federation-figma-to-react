/**
 * Mock in-memory storage for local development
 * Use this when Vercel Postgres is not configured
 */

interface Component {
  id: string;
  name: string;
  figma_url: string;
  component_code: string;
  css_code: string;
  story_code: string;
  created_at: string;
  updated_at: string;
}

interface PackageMetadata {
  id: number;
  package_name: string;
  version: string;
  tarball_path: string | null;
  last_built_at: string | null;
  created_at: string;
  updated_at: string;
}

// In-memory storage
const components: Map<string, Component> = new Map();
const packageMetadata: PackageMetadata[] = [];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const mockDb = {
  async listComponents(): Promise<Component[]> {
    return Array.from(components.values()).sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  },

  async getComponentById(id: string): Promise<Component | null> {
    return components.get(id) || null;
  },

  async saveComponent(data: {
    name: string;
    figmaUrl: string;
    componentCode: string;
    cssCode: string;
    storyCode: string;
  }): Promise<Component> {
    // Check if component with this name already exists
    const existing = Array.from(components.values()).find(c => c.name === data.name);

    const now = new Date().toISOString();

    if (existing) {
      // Update existing
      existing.figma_url = data.figmaUrl;
      existing.component_code = data.componentCode;
      existing.css_code = data.cssCode;
      existing.story_code = data.storyCode;
      existing.updated_at = now;
      components.set(existing.id, existing);
      return existing;
    } else {
      // Create new
      const component: Component = {
        id: generateId(),
        name: data.name,
        figma_url: data.figmaUrl,
        component_code: data.componentCode,
        css_code: data.cssCode,
        story_code: data.storyCode,
        created_at: now,
        updated_at: now,
      };
      components.set(component.id, component);
      return component;
    }
  },

  async deleteComponent(id: string): Promise<boolean> {
    return components.delete(id);
  },

  async getAllComponentsForPackage(): Promise<Component[]> {
    return Array.from(components.values());
  },

  async getLatestPackageMetadata(): Promise<PackageMetadata | null> {
    return packageMetadata.length > 0 ? packageMetadata[packageMetadata.length - 1] : null;
  },

  async savePackageMetadata(data: {
    packageName: string;
    version: string;
    tarballPath: string;
  }): Promise<PackageMetadata> {
    const metadata: PackageMetadata = {
      id: packageMetadata.length + 1,
      package_name: data.packageName,
      version: data.version,
      tarball_path: data.tarballPath,
      last_built_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    packageMetadata.push(metadata);
    return metadata;
  },

  async trackComponentGeneration(componentName: string, figmaUrl: string): Promise<void> {
    // No-op for mock
    console.log(`[Mock] Tracked generation: ${componentName} from ${figmaUrl}`);
  },
};
