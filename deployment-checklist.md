# Deployment Checklist - Fresh Start

## Pre-Deployment Checklist

### ✅ Code Preparation
- [ ] Application runs locally without errors
- [ ] All dependencies installed (`package.json` up to date)
- [ ] Build process works: `npm run build`
- [ ] Server starts properly: `npm start`
- [ ] Environment variables configured (e.g., `SESSION_SECRET`)

### ✅ Domain Strategy Decision
Choose ONE:
- [ ] **Option A**: `www.mylinked.app` (A + TXT records)
- [ ] **Option B**: `app.mylinked.app` (CNAME record - recommended)

## Deployment Steps

### Step 1: Delete Old Deployment
- [ ] Go to https://replit.com/deployments
- [ ] Delete `personal-profile-pro-arminshams1367`
- [ ] Confirm deletion

### Step 2: Create New Deployment
- [ ] Click **Deploy** in your Replit project
- [ ] Choose **Autoscale Deployment**
- [ ] Configure settings:
  - Build Command: `npm run build`
  - Run Command: `npm start`
  - Root Directory: `/`

### Step 3: Configure Domain (Do This IMMEDIATELY)
- [ ] Go to **Deployments** → **Settings**
- [ ] Click **Link a domain**
- [ ] Enter chosen domain
- [ ] Copy DNS records provided by Replit

### Step 4: Update DNS at GoDaddy
- [ ] Remove old DNS records
- [ ] Add new records from Replit
- [ ] Verify records are added correctly

### Step 5: Wait and Monitor
- [ ] Wait for DNS propagation (up to 48 hours)
- [ ] Check Replit dashboard for "Verified" status
- [ ] Test domain in browser

## Post-Deployment Verification

### ✅ Technical Checks
- [ ] Domain resolves to correct IP
- [ ] HTTPS works without errors
- [ ] SSL certificate is valid
- [ ] All pages load correctly
- [ ] Authentication works
- [ ] Database connections work

### ✅ Functional Checks
- [ ] User registration works
- [ ] User login works
- [ ] Profile creation works
- [ ] Links management works
- [ ] Public profiles display correctly

## If Issues Persist

### Documentation for Support
- [ ] Screenshot of deployment settings
- [ ] Screenshot of DNS records
- [ ] Screenshot of any error messages
- [ ] New deployment URL
- [ ] Domain verification status

### Escalation Steps
1. Contact Replit support with new deployment details
2. Reference fresh deployment (no legacy issues)
3. Provide all screenshots and documentation
4. Request specific DNS records if needed

## Success Criteria

✅ **Domain Working**: `https://www.mylinked.app` or `https://app.mylinked.app` loads correctly
✅ **SSL Active**: Green padlock in browser
✅ **All Features Working**: Login, profiles, links, etc.
✅ **Fast Loading**: No timeout errors
✅ **Mobile Compatible**: Works on mobile devices

Ready to start fresh deployment!