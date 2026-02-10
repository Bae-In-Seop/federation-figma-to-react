import 'dotenv/config';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { runCodegen } from './codegen.js';
import { parseFigmaUrl } from './utils.js';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(
      'Usage: tsx scripts/figma-codegen/index.ts <figma-url>',
    );
    console.error(
      '       tsx scripts/figma-codegen/index.ts <file-key> <node-id>',
    );
    process.exit(1);
  }

  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    console.error('Error: FIGMA_ACCESS_TOKEN not found in environment.');
    console.error(
      'Create a .env file with: FIGMA_ACCESS_TOKEN=your_token_here',
    );
    process.exit(1);
  }

  let figmaUrl: string;

  if (args.length === 1) {
    figmaUrl = args[0];
    const parsed = parseFigmaUrl(figmaUrl);
    if (!parsed) {
      console.error('Error: Invalid Figma URL. Expected format:');
      console.error(
        '  https://www.figma.com/design/<file-key>/...?node-id=<node-id>',
      );
      process.exit(1);
    }
  } else {
    const fileKey = args[0];
    const nodeId = args[1];
    figmaUrl = `https://www.figma.com/design/${fileKey}?node-id=${nodeId}`;
  }

  console.log('Fetching and generating code...');

  const result = await runCodegen(figmaUrl, token);

  const outputDir = join(
    process.cwd(),
    'src',
    'components',
    result.componentName,
  );

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const files = [result.files.react, result.files.css, result.files.story];

  for (const file of files) {
    const filePath = join(outputDir, file.filename);
    writeFileSync(filePath, file.content, 'utf-8');
    console.log(
      `✓ ${join('src', 'components', result.componentName, file.filename)} generated`,
    );
  }

  console.log(
    '\nDone! Run `yarn storybook` to see the generated component.',
  );
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
