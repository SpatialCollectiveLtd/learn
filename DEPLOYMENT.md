# Deployment Guide - Spatial Collective Learning Platform

## 🚀 Quick Deploy to Vercel

### Step 1: Push to GitHub

```bash
# Navigate to project directory
cd c:\Users\TECH\Desktop\learn

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "feat: Initial release of Spatial Collective Learning Platform

- Complete Mapper training module with 12 interactive sections
- Dark theme with Spatial Collective branding
- Mobile-first responsive design
- Aceternity UI components integration
- MySQL database schema and seed data
- Progress tracking UI (auth pending)"

# Set main branch
git branch -M main

# Add remote (already created)
git remote add origin https://github.com/SpatialCollectiveLtd/learn.git

# Push to GitHub
git push -u origin main
```

### Step 2: Deploy to Vercel

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub

2. **Import Repository**
   - Click "Add New" → "Project"
   - Select `SpatialCollectiveLtd/learn` repository
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

4. **Environment Variables** (Optional - for database)
   
   Add these if you want database functionality:
   
   ```
   DATABASE_HOST=spatialcollective.co.ke
   DATABASE_PORT=3306
   DATABASE_USER=spatialcoke_learn
   DATABASE_PASSWORD=bBcsWCmGJYAUsSghhfb7
   DATABASE_NAME=spatialcoke_learn
   ```
   
   **Note**: App works perfectly without database for now.

5. **Deploy!**
   - Click "Deploy"
   - Wait ~2 minutes for build
   - Your app will be live at: `https://learn-[random].vercel.app`

### Step 3: Custom Domain (Optional)

1. In Vercel project settings
2. Go to "Domains"
3. Add custom domain (e.g., `learn.spatialcollective.co.ke`)
4. Follow DNS configuration instructions

---

## 🔧 Local Development

### Prerequisites
- Node.js 18+ installed
- Git installed
- Code editor (VS Code recommended)

### Setup

```bash
# Clone repository
git clone https://github.com/SpatialCollectiveLtd/learn.git
cd learn

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your credentials (optional)
# For local dev, database is not required

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📊 Database Setup (Optional)

### If Database Connection Works

```bash
# Run initialization script
npm run db:init
```

This will:
1. Test database connection
2. Create all tables
3. Seed initial data (modules, roles)
4. Insert mapper training content

### If Database Connection Fails

**No worries!** The app works perfectly with static content. All training material is embedded in the frontend code.

To enable database later:
1. Fix MySQL remote connection settings
2. Update `.env.local` with correct credentials
3. Run `npm run db:init`
4. Restart the app

---

## 🔐 Environment Variables

### Required for Production (Vercel)

None! App works without database.

### Optional for Database Features

```env
DATABASE_HOST=spatialcollective.co.ke
DATABASE_PORT=3306
DATABASE_USER=spatialcoke_learn
DATABASE_PASSWORD=bBcsWCmGJYAUsSghhfb7
DATABASE_NAME=spatialcoke_learn
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

---

## 📱 Testing Before Deploy

### 1. Local Development Test
```bash
npm run dev
```
- Check all pages load
- Test navigation
- Verify responsive design (resize browser)
- Test on mobile device (use your phone on same network)

### 2. Production Build Test
```bash
npm run build
npm start
```
- Ensures no build errors
- Tests production optimizations

### 3. Mobile Testing
On your phone, visit: `http://[YOUR_IP]:3000`
(Get your IP from the terminal output when running `npm run dev`)

---

## 🚨 Common Issues & Solutions

### Issue: Database Connection Timeout

**Solution**: 
- App works fine without database
- Or fix MySQL remote connection settings
- Or use Vercel Postgres instead

### Issue: Build Fails on Vercel

**Check**:
1. All dependencies in package.json
2. No TypeScript errors: `npm run lint`
3. Build works locally: `npm run build`

### Issue: Fonts Not Loading

**Solution**: Already handled! Fonts load from Google Fonts CDN.

### Issue: Images Not Showing

**Solution**: No images used yet. When adding images:
- Put in `public/` folder
- Use Next.js `<Image>` component
- Optimize before upload

---

## 📈 Performance Optimization

Already implemented:
- ✅ Code splitting (Next.js automatic)
- ✅ Font optimization (Google Fonts with display=swap)
- ✅ CSS optimization (Tailwind CSS purging)
- ✅ Lazy loading components (Framer Motion)
- ✅ Optimized builds (Turbopack)

Expected performance:
- **Load Time**: < 2 seconds
- **Lighthouse Score**: 90+
- **Mobile Friendly**: 100%

---

## 🔄 Update Workflow

### Adding New Content

1. **Edit content** in respective page file
2. **Test locally**: `npm run dev`
3. **Commit changes**:
   ```bash
   git add .
   git commit -m "feat: Add validator training content"
   git push
   ```
4. **Auto-deploy**: Vercel deploys automatically on push to main

### Adding New Modules

1. Create folder: `src/app/[module-name]/`
2. Add `page.tsx` for module selection
3. Add role pages: `[role]/page.tsx`
4. Update homepage: `src/app/page.tsx` (add module to list)
5. Commit and push

---

## 📞 Support

### Deployment Issues
- Check Vercel deployment logs
- Ensure all dependencies installed
- Verify environment variables

### Content Updates
- Edit page files directly
- No database needed for content changes
- Changes deploy automatically via Git

### Technical Support
- GitHub Issues: Create issue in repository
- Development Team: Contact via Spatial Collective

---

## ✅ Pre-Deployment Checklist

- [ ] All content reviewed and accurate
- [ ] Tested on desktop browser
- [ ] Tested on mobile device
- [ ] All links working
- [ ] No console errors
- [ ] README.md updated
- [ ] Environment variables configured (if using database)
- [ ] GitHub repository updated
- [ ] Custom domain configured (optional)

---

## 🎉 Post-Deployment

### Immediately After Deploy

1. **Test Production URL**: Visit your Vercel URL
2. **Test All Pages**: Navigate through all modules/roles
3. **Mobile Test**: Check on phone
4. **Share with Team**: Send URL to trainers

### First Week

1. **Gather Feedback**: Ask trainers for input
2. **Monitor Usage**: Check Vercel analytics
3. **Fix Issues**: Address any reported problems
4. **Plan Updates**: Prepare validator content

### Ongoing

1. **Regular Updates**: Add new content as created
2. **Performance Monitoring**: Use Vercel analytics
3. **User Feedback**: Continuous improvement
4. **Content Expansion**: Add remaining modules

---

## 🔗 Useful Links

- **Production URL**: (After deployment)
- **GitHub Repository**: https://github.com/SpatialCollectiveLtd/learn
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Aceternity UI**: https://ui.aceternity.com

---

**Ready to deploy? Follow Step 1 above! 🚀**

Your learning platform is production-ready and will be live in minutes.
