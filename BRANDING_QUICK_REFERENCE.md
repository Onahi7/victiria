# 🎨 EdifyPub Branding - Quick Reference

## Logo Files (all in `/public/`)

### For UI/Components:
```tsx
import Image from 'next/image'

// Standard usage
<Image src="/logo.png" alt="EdifyPub" width={40} height={40} />

// With priority (above fold)
<Image src="/logo.png" alt="EdifyPub" width={40} height={40} priority />
```

## Asset Inventory

| Asset | Size | Usage |
|-------|------|-------|
| `logo.png` | 200×200 | Main UI logo |
| `logo-192.png` | 192×192 | PWA standard |
| `logo-512.png` | 512×512 | PWA high-res |
| `favicon.ico` | 48×48 | Browser icon |
| `favicon-16x16.png` | 16×16 | Small browser tab |
| `favicon-32x32.png` | 32×32 | Medium browser tab |
| `apple-touch-icon.png` | 180×180 | iOS home screen |
| `og-image.jpg` | 1200×630 | Social sharing |
| `twitter-image.jpg` | 800×600 | Twitter card |

## Brand Colors

```css
/* Primary */
--purple-600: #9333ea;

/* Secondary */
--pink-600: #db2777;

/* Background */
--white: #ffffff;

/* Gradient */
background: linear-gradient(to right, #9333ea, #db2777);
```

## Component Locations

- **Site Header**: `components/site-header.tsx`
- **Admin Sidebar**: `components/admin-sidebar.tsx`
- **Root Layout**: `app/layout.tsx`
- **PWA Manifest**: `public/site.webmanifest`

## TypeScript Support

Global types in: `types/global.d.ts`
- ✅ CSS imports
- ✅ Image imports
- ✅ JSON imports

## Quick Commands

### Regenerate all from source:
```powershell
cd public
magick edlogo.jpg -resize 200x200 -background white -gravity center -extent 200x200 logo.png
magick edlogo.jpg -resize 512x512 -background white -gravity center -extent 512x512 logo-512.png
magick edlogo.jpg -resize 192x192 -background white -gravity center -extent 192x192 logo-192.png
magick edlogo.jpg -resize 180x180 -background white -gravity center -extent 180x180 apple-touch-icon.png
magick edlogo.jpg -resize 32x32 -background white -gravity center -extent 32x32 favicon-32x32.png
magick edlogo.jpg -resize 16x16 -background white -gravity center -extent 16x16 favicon-16x16.png
magick edlogo.jpg -resize 48x48 -background white -gravity center -extent 48x48 favicon.ico
magick edlogo.jpg -resize 1200x630 -background white -gravity center -extent 1200x630 og-image.jpg
magick edlogo.jpg -resize 800x600 -background white -gravity center -extent 800x600 twitter-image.jpg
```

## SEO Testing Tools

- **Facebook**: https://developers.facebook.com/tools/debug/
- **Twitter**: https://cards-dev.twitter.com/validator
- **LinkedIn**: https://www.linkedin.com/post-inspector/
- **General**: https://www.opengraph.xyz/

## Deployment Checklist

- [ ] All images in `/public/`
- [ ] Manifest file present
- [ ] Favicon links in layout
- [ ] OG images updated
- [ ] TypeScript errors = 0
- [ ] Test social sharing
- [ ] Test PWA install

## Status: ✅ READY FOR PRODUCTION
