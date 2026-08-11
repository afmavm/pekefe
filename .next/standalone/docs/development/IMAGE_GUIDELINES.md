# PEKEFE Image Optimization & Guidelines

This document outlines the standard engineering practices for image optimization across the PEKEFE Gastronomy Platform to ensure zero Cumulative Layout Shift (CLS), high performance, and visual fidelity using Next.js.

---

## 1. Mandate: Next.js `<Image />` Component

Standard `<img>` tags are strictly prohibited. Every visual asset must be rendered via the Next.js `Image` component (`next/image`) to benefit from automatic format generation (WebP/AVIF), layout safety, and responsive scaling.

### Core Properties Checklist:
1. **`src`**: Must point to a local asset or a configured remote path.
2. **`alt`**: Descriptive, accessible text. Avoid generic terms like "resim" or "görsel".
3. **`fill`**: Prefer using `fill` on container-bound images. The parent element must have a defined size and a `relative` or `absolute` position.
4. **`sizes`**: Provide a detailed `sizes` attribute on all `fill` images to prevent Next.js from loading unnecessarily high-resolution images on smaller screens (e.g., `sizes="(max-width: 768px) 100vw, 33vw"`).
5. **`priority`**: Set `priority={true}` on all images located above the fold (LCP elements) to bypass lazy loading and trigger high-priority fetching.

---

## 2. Remote Pattern Configuration

Any external resource must be registered inside the remote patterns config in `next.config.mjs`.

### Approved Domains:
*   `lh3.googleusercontent.com` (Used for B2B user profile avatars and static product mock assets)

```javascript
// next.config.mjs configuration
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};
```

---

## 3. Z-Index Layering & Overlays

When using `fill={true}`, Next.js sets `position: absolute` on the image element. This can cause the image to render on top of text, gradients, or button overlays.

To prevent this:
*   Ensure all text overlay wrappers, gradients, and buttons have explicit z-index classes (e.g., `z-10`, `z-20`).
*   Example:
```jsx
<div className="relative w-full h-[500px]">
  <Image
    src="/hero.jpg"
    alt="Hero Banner"
    fill
    className="object-cover"
  />
  <div className="absolute inset-0 bg-black/40 z-10">
    <h2 className="text-white z-20">Editorial Title</h2>
  </div>
</div>
```

---

## 4. State-Based Loading & Error Handling

To align with modern React patterns, direct DOM manipulation (e.g., modifying `e.target.style.display` in `onError`) is prohibited. Instead, handle image loading errors or fallbacks using React state:

### Standard Fallback Pattern:
```jsx
const [imgError, setImgError] = useState(false);

return (
  <div className="relative w-32 h-32">
    {imgError ? (
      <div className="absolute inset-0 bg-surface-container flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-3xl">broken_image</span>
      </div>
    ) : (
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setImgError(true)}
      />
    )}
  </div>
);
```

---

## 5. Performance Monitoring

Keep all pages compliant with the **Lighthouse 95+ performance standard**:
*   Always test builds with `npm run build` to verify optimize static generation output.
*   Monitor Next.js console warnings regarding missing `sizes` or improperly scaled LCP images.
