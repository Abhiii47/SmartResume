# Open Graph Image Setup Guide

## What is an OG Image?

The Open Graph (OG) image is the preview image that appears when you share your website link on social media platforms like Facebook, Twitter, LinkedIn, WhatsApp, etc.

## Current Status

The meta tags are configured to look for an image at:
- `https://smartresume.app/og-image.png`

## Requirements

Your OG image should be:
- **Dimensions**: 1200 x 630 pixels (recommended)
- **Format**: PNG or JPG
- **File size**: Under 1MB (preferably under 300KB)
- **Content**: Should represent your brand/app visually

## How to Create

### Option 1: Design Tool (Recommended)
1. Use Canva, Figma, or Adobe Express
2. Create a 1200x630px canvas
3. Include:
   - SmartResume logo/branding
   - Tagline: "Build Job-Ready Resumes"
   - Subtitle: "AI-Powered ATS Scoring"
   - Visual elements (resume/document icons)
4. Export as PNG
5. Save as `og-image.png` in the `frontend/public/` or `frontend/dist/` folder

### Option 2: Online Generators
- Use tools like:
  - https://www.opengraph.xyz/
  - https://www.bannerbear.com/
  - https://og-image.vercel.app/

### Option 3: Screenshot
1. Take a screenshot of your landing page
2. Crop to 1200x630px
3. Save as `og-image.png`

## File Location

Place the image file in one of these locations:
- `frontend/public/og-image.png` (for Parcel to serve)
- `frontend/dist/og-image.png` (for production build)

## Testing

After adding the image, test it using:
- Facebook Debugger: https://developers.facebook.com/tools/debug/
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

## Update Meta Tags

If you change the image location, update the `og:image` and `twitter:image` meta tags in:
- `frontend/index.html`
- `frontend/src/utils.js` (updateMetaTags function)

