# 🔄 Migrate Your Data to MongoDB Atlas

## 📍 **Current Situation:**
- ✅ Your data (23 entities) is in **local MongoDB** (`localhost:27017`)
- ❌ Your **Atlas** is empty (0 documents)
- 🎯 **Goal:** Move data from local → Atlas

---

## 🚀 **Quick Migration (3 Steps)**

### **Step 1: Get Your Atlas Connection String**

1. In your Atlas dashboard, click **"Connect"** button
2. Choose **"Connect your application"**
3. Copy the connection string (looks like this):
   ```
   mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. **Replace `<password>`** with your actual password
5. **Add database name** at the end:
   ```
   mongodb+srv://username:yourpassword@cluster0.xxxxx.mongodb.net/healsync?retryWrites=true&w=majority
   ```
   Note: Changed `/?` to `/healsync?` to specify the database name

---

### **Step 2: Run Migration Script**

Open terminal and run:

```bash
cd /Users/apple/Documents/Projects/agent-hub/backend
node scripts/migrateToAtlas.js
```

When prompted, **paste your Atlas connection string** from Step 1.

The script will:
- ✅ Connect to local MongoDB
- ✅ Connect to Atlas
- ✅ Copy all 23 entities
- ✅ Copy all 23 users
- ✅ Show you a summary

---

### **Step 3: Update Backend to Use Atlas**

Create/edit `backend/.env`:

```bash
echo 'MONGODB_URI=your-atlas-connection-string-here' > backend/.env
```

Or manually create `backend/.env` with:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/healsync?retryWrites=true&w=majority
PORT=4000
```

---

## 🎯 **Complete Commands**

Copy and paste these (one at a time):

### **1. Run Migration:**
```bash
cd /Users/apple/Documents/Projects/agent-hub/backend
node scripts/migrateToAtlas.js
```

### **2. Create .env file (REPLACE with your actual connection string):**
```bash
cat > backend/.env << 'EOF'
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/healsync?retryWrites=true&w=majority
PORT=4000
EOF
```

### **3. Restart Backend:**
```bash
pkill -f "node server.js"
node server.js
```

You should see:
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
```

---

## 📊 **Alternative: Use MongoDB Tools**

If you prefer using MongoDB's built-in tools:

### **Export from Local:**
```bash
mongodump --uri="mongodb://localhost:27017/healsync" --out=./mongo-backup
```

### **Import to Atlas:**
```bash
mongorestore --uri="mongodb+srv://username:password@cluster.mongodb.net/healsync" ./mongo-backup/healsync
```

---

## 🔍 **Verify Migration**

### **Check in Atlas:**
1. Refresh your Atlas Data Explorer
2. Click on "entities" collection
3. You should see 23 documents!

### **Check via Terminal:**
```bash
cd backend
node -e "
const mongoose = require('mongoose');
mongoose.connect('YOUR_ATLAS_URI').then(async () => {
  const db = mongoose.connection.db;
  const count = await db.collection('entities').countDocuments();
  console.log('Entities in Atlas:', count);
  process.exit(0);
});
"
```

---

## ⚠️ **Important Notes**

### **Connection String Format:**

**WRONG:**
```
mongodb+srv://username:<password>@cluster.mongodb.net
```

**CORRECT:**
```
mongodb+srv://username:actualpassword123@cluster.mongodb.net/healsync
```

Key points:
- Replace `<password>` with actual password
- Add `/healsync` before the `?` to specify database
- Remove any `<>` brackets

### **Common Issues:**

1. **"Authentication failed"**
   - Wrong password
   - User doesn't have access to database
   - Solution: Check Atlas → Database Access → Add user

2. **"IP not whitelisted"**
   - Your IP is blocked
   - Solution: Atlas → Network Access → Add IP (or allow all: `0.0.0.0/0`)

3. **"Connection timeout"**
   - Network issue
   - Solution: Check internet connection, try again

---

## 🎯 **What Happens After Migration**

### **Before:**
```
Local MongoDB (localhost)
  └─ healsync database
      ├─ entities (23) ✅
      └─ users (23) ✅

Atlas Cloud
  └─ test database
      ├─ entities (0) ❌
      └─ users (0) ❌
```

### **After:**
```
Local MongoDB (localhost)
  └─ healsync database
      ├─ entities (23) ✅
      └─ users (23) ✅

Atlas Cloud
  └─ healsync database (NEW!)
      ├─ entities (23) ✅
      └─ users (23) ✅
```

### **Backend Connected To:**
- Before: `localhost:27017/healsync`
- After: `cluster0.xxxxx.mongodb.net/healsync` ← Atlas!

---

## 🚀 **Quick Start (Copy-Paste)**

1. **Get Atlas connection string** (from Atlas dashboard)

2. **Run this:**
   ```bash
   cd /Users/apple/Documents/Projects/agent-hub/backend
   node scripts/migrateToAtlas.js
   # Paste your Atlas connection string when prompted
   ```

3. **Create .env:**
   ```bash
   echo "MONGODB_URI=your-atlas-connection-string" > .env
   ```

4. **Restart backend:**
   ```bash
   pkill -f "node server.js"
   node server.js
   ```

5. **Refresh Atlas** → See your data! 🎉

---

## ✅ **Checklist**

- [ ] Get Atlas connection string
- [ ] Replace `<password>` with real password
- [ ] Add `/healsync` database name
- [ ] Run migration script
- [ ] Verify data in Atlas
- [ ] Create `.env` file
- [ ] Restart backend
- [ ] Confirm backend connects to Atlas

---

**After this, your data will be visible in Atlas and your app will use the cloud database!** ☁️✨

