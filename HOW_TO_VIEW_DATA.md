# 🔍 How to View Your MongoDB Data

## Current Situation:
- ✅ Your data IS stored in MongoDB (we verified 23 entities + 23 users)
- ❌ You're looking at MongoDB **Atlas** (cloud) which is empty
- ✅ Your data is in **Local MongoDB** at `mongodb://localhost:27017/healsync`

---

## 🎯 **Method 1: MongoDB Compass (Best Visual Tool)**

### **Step 1: Download MongoDB Compass**
If you don't have it: https://www.mongodb.com/try/download/compass

### **Step 2: Connect to Local MongoDB**
1. Open MongoDB Compass
2. Connection String: `mongodb://localhost:27017`
3. Click "Connect"

### **Step 3: View Your Data**
1. Click on database: `healsync`
2. You'll see collections:
   - **entities** (23 documents) - Your hospitals, labs, pharmacies, suppliers
   - **users** (23 documents) - Login accounts
   - **metricslogs** - Time-series data
   - **agentactivities** - Agent coordination logs

### **Step 4: Browse Data**
- Click `entities` → See all your hospitals, labs, etc.
- Click `users` → See all user accounts
- Use filters to search: `{ "entityType": "hospital" }`
- Export to JSON, CSV, etc.

---

## 🖥️ **Method 2: MongoDB Shell (CLI)**

### **Connect to MongoDB:**
```bash
mongosh mongodb://localhost:27017/healsync
```

### **Useful Commands:**

#### **List all databases:**
```javascript
show dbs
```

#### **Use healsync database:**
```javascript
use healsync
```

#### **List all collections:**
```javascript
show collections
```

#### **Count documents:**
```javascript
db.entities.countDocuments()  // Should show 23
db.users.countDocuments()     // Should show 23
```

#### **View all hospitals:**
```javascript
db.entities.find({ entityType: "hospital" }).pretty()
```

#### **View all labs:**
```javascript
db.entities.find({ entityType: "lab" }).pretty()
```

#### **View entities by zone:**
```javascript
db.entities.find({ zone: "Zone-1" }).pretty()
```

#### **View a specific hospital:**
```javascript
db.entities.findOne({ name: "City Central Hospital" })
```

#### **View all entity names:**
```javascript
db.entities.find({}, { name: 1, entityType: 1, zone: 1 })
```

#### **View user emails:**
```javascript
db.users.find({}, { email: 1, role: 1 })
```

#### **Exit:**
```javascript
exit
```

---

## 🌐 **Method 3: Your Backend API**

### **View via REST API:**

#### **Get all entities:**
```bash
curl http://localhost:4000/api/entities | jq '.'
```

#### **Get hospitals only:**
```bash
curl http://localhost:4000/api/entities?type=hospital | jq '.'
```

#### **Get Zone-1 entities:**
```bash
curl http://localhost:4000/api/entities?zone=Zone-1 | jq '.'
```

#### **Get current state (worldState format):**
```bash
curl http://localhost:4000/api/state | jq '.'
```

#### **Count entities:**
```bash
curl -s http://localhost:4000/api/entities | jq 'length'
```

---

## 🔗 **Method 4: Connect MongoDB Atlas to Local**

If you want to use Atlas (cloud) instead of local:

### **Option A: Migrate Data to Atlas**

1. Get your Atlas connection string
2. Update `backend/.env`:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/healsync
   ```
3. Run seed script again:
   ```bash
   cd backend
   node scripts/seedDatabase.js
   ```
4. Now data will be in Atlas!

### **Option B: Export/Import**

#### **Export from local:**
```bash
mongodump --uri="mongodb://localhost:27017/healsync" --out=./backup
```

#### **Import to Atlas:**
```bash
mongorestore --uri="mongodb+srv://<username>:<password>@cluster.mongodb.net/healsync" ./backup/healsync
```

---

## 📊 **Quick Verification Commands**

### **Terminal Commands:**

#### **Check all entities:**
```bash
mongosh mongodb://localhost:27017/healsync --eval "db.entities.countDocuments()"
```

#### **List all hospitals:**
```bash
mongosh mongodb://localhost:27017/healsync --eval "db.entities.find({entityType:'hospital'}, {name:1, zone:1}).forEach(printjson)"
```

#### **Check database stats:**
```bash
mongosh mongodb://localhost:27017/healsync --eval "db.stats()"
```

---

## 🎯 **Where is Your Data RIGHT NOW?**

```
Location: Local MongoDB
Server:   localhost:27017
Database: healsync

Collections:
├── entities (23 documents)
│   ├── 10 hospitals
│   ├── 6 labs
│   ├── 3 pharmacies
│   ├── 3 suppliers
│   └── 1 cityadmin
│
├── users (23 documents)
│
├── metricslogs (time-series data)
│
└── agentactivities (coordination logs)
```

---

## 🔧 **Your Current Setup**

### **Connection String:**
Check your `backend/.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/healsync
```

### **Backend is connected to:**
- Local MongoDB on port 27017
- Database name: `healsync`

### **MongoDB Atlas (in your screenshot):**
- This is a DIFFERENT database (cloud)
- It's empty because you haven't pushed data there
- Your app is NOT connected to Atlas

---

## ✅ **Recommendation**

**For Development:** Keep using local MongoDB (current setup)
- Faster
- No internet needed
- Free
- Full control

**For Production/Demo:** Use MongoDB Atlas
- Cloud-hosted
- Accessible from anywhere
- Automatic backups
- Better for demos

---

## 🚀 **Quick Start: View Your Data NOW**

### **Option 1: MongoDB Shell (Fastest)**
```bash
mongosh mongodb://localhost:27017/healsync --eval "
  print('=== HEALSYNC DATA ===');
  print('Total Entities:', db.entities.countDocuments());
  print('Total Users:', db.users.countDocuments());
  print('\nHospitals:');
  db.entities.find({entityType:'hospital'}, {name:1, zone:1, _id:0}).forEach(printjson);
"
```

### **Option 2: Via Your API**
```bash
# Make sure backend is running
curl http://localhost:4000/api/entities | jq '.[] | {name, type: .entityType, zone}'
```

---

## 📝 **Summary**

**Your Data Location:**
- ✅ **Local MongoDB** at `localhost:27017/healsync` ← YOUR DATA IS HERE
- ❌ **MongoDB Atlas** (cloud) ← EMPTY (what you were looking at)

**To View:**
1. **GUI:** Use MongoDB Compass → Connect to `mongodb://localhost:27017`
2. **CLI:** Use `mongosh mongodb://localhost:27017/healsync`
3. **API:** Use `curl http://localhost:4000/api/entities`

**All 23 entities + 23 users are stored and working perfectly!** ✅

