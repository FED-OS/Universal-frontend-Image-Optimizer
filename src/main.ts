import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);

// Directories that should never be scanned - dependency trees, build output,
// and VCS metadata. Scanning these is slow, pointless, and occasionally unsafe.
const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  'coverage',
  '.cache',
]);

function findImages(dir: string, fileList: string[] = []): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    core.warning(`Could not read directory ${dir}: ${(err as Error).message}`);
    return fileList;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      findImages(fullPath, fileList);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (IMAGE_EXTENSIONS.has(ext)) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

async function optimizeImage(
  imagePath: string,
  quality: number,
  dryRun: boolean
): Promise<number> {
  const ext = path.extname(imagePath).toLowerCase();
  const originalSize = fs.statSync(imagePath).size;
  const tempPath = `${imagePath}.squeezer.tmp`;

  try {
    const pipeline = sharp(imagePath);

    if (ext === '.png') {
      await pipeline.png({ quality, compressionLevel: 9 }).toFile(tempPath);
    } else {
      await pipeline.jpeg({ quality, mozjpeg: true }).toFile(tempPath);
    }

    const optimizedSize = fs.statSync(tempPath).size;
    const saved = originalSize - optimizedSize;

    if (saved > 0) {
      if (!dryRun) {
        fs.renameSync(tempPath, imagePath);
      } else {
        fs.unlinkSync(tempPath);
      }
      core.info(
        `${dryRun ? '[dry-run] would optimize' : 'Optimized'}: ${imagePath} ` +
          `(saved ${(saved / 1024).toFixed(2)} KB)`
      );
      return saved;
    }

    // No improvement - discard the temp file, leave original untouched.
    fs.unlinkSync(tempPath);
    return 0;
  } catch (err) {
    // Clean up any partial temp file and skip this image rather than failing the whole run.
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    core.warning(`Skipped ${imagePath}: ${(err as Error).message}`);
    return 0;
  }
}

async function run(): Promise<void> {
  try {
    const quality = parseInt(core.getInput('image-quality') || '80', 10);
    const dryRun = core.getInput('dry-run').toLowerCase() === 'true';
    const pathsInput = core.getInput('paths') || '.';
    const workspace = process.env.GITHUB_WORKSPACE || '.';

    if (Number.isNaN(quality) || quality < 1 || quality > 100) {
      core.setFailed(`image-quality must be a number between 1 and 100, got "${core.getInput('image-quality')}"`);
      return;
    }

    const scanDirs = pathsInput
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => path.join(workspace, p));

    core.info(`Scanning for images in: ${scanDirs.join(', ')}`);

    const images = scanDirs.flatMap((dir) => (fs.existsSync(dir) ? findImages(dir) : []));
    core.info(`Found ${images.length} image(s) to check.`);

    let totalSaved = 0;
    let optimizedCount = 0;

    for (const imagePath of images) {
      const saved = await optimizeImage(imagePath, quality, dryRun);
      if (saved > 0) {
        totalSaved += saved;
        optimizedCount += 1;
      }
    }

    core.setOutput('saved-bytes', totalSaved.toString());
    core.setOutput('images-optimized', optimizedCount.toString());

    core.info(
      `Done. ${optimizedCount} image(s) optimized, ${(totalSaved / 1024).toFixed(2)} KB total saved.`
    );
  } catch (err) {
    core.setFailed(`Action failed: ${(err as Error).message}`);
  }
}

run();
