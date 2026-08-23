# Universal Frontend Asset Optimizer ![Ko-Fi](https://img.shields.io/badge/Ko--fi-F16061?style=for-the-badge&logo=ko-fi&logoColor=white) 

<a href='https://ko-fi.com/YOUR_USERNAME' target='_blank'>
    <img height='36' style='border:0px;height:36px;' src='https://ko-fi.com/img/githubbutton_sm.svg' border='0' alt='Buy Me a Coffee at ko-fi.com' />
</a>

<img width="807" height="450" alt="1776896526" src="https://github.com/user-attachments/assets/62ac2ce7-709e-4029-bdb4-9a75f35c0618" />




A GitHub Action that scans a repo (or specific folders) for `.jpg`, `.jpeg`, and `.png`
images and compresses them with [`sharp`](https://sharp.pixelplumbing.com/), reducing
frontend payload size automatically on every PR.

## Usage

```yaml
- uses: your-username/universal-frontend-squeezer@v1
  with:
    image-quality: '80'   # 1-100, default 80
    paths: 'assets,public'  # comma-separated folders, default "."
    dry-run: 'false'      # report savings without modifying files
```

## Inputs

| Name            | Description                                      | Default |
|-----------------|---------------------------------------------------|---------|
| `image-quality` | Compression quality, 1-100                        | `80`    |
| `paths`         | Comma-separated folders to scan (relative to repo)| `.`     |
| `dry-run`       | Report savings without writing changes            | `false` |

## Outputs

| Name               | Description                          |
|--------------------|---------------------------------------|
| `saved-bytes`      | Total bytes saved                     |
| `images-optimized` | Number of images actually optimized   |

## Local build

```bash
npm install
npm run build   # bundles src/main.ts -> dist/index.js via @vercel/ncc
```

Commit `dist/index.js` — GitHub Actions run the compiled bundle directly,
not the TypeScript source.

## License

MIT
