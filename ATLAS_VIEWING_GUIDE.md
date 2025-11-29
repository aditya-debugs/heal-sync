# 🔍 How to View Your Data in MongoDB Atlas

## 📊 **Current Situation**

Looking at your Atlas screenshot:
- ✅ Database: **test** (1 database)
- ✅ Collections: **4 collections visible**
  - agent_activities
  - **entities** ← Your hospitals, labs, pharmacies, suppliers are here
  - metrics_logs
  - users

---

## 🎯 **Step-by-Step: View Your Data in Atlas**

### **Step 1: Click on "entities" Collection**

In the left sidebar, click on **"entities"** (currently you're viewing "agent_activities")

### **Step 2: Browse All Entities**

Once in the entities collection:
- You'll see all documents (hospitals, labs, pharmacies, suppliers)
- Each document has an "entityType" field

### **Step 3: Filter by Entity Type**

To see ONLY hospitals, labs, etc., use the **Filter** box at the top:

#### **View Only Hospitals:**
```json
{ "entityType": "hospital" }
```
Click **Apply** → You'll see only the 10 hospitals

#### **View Only Labs:**
```json
{ "entityType": "lab" }
```
Click **Apply** → You'll see only the 6 labs

#### **View Only Pharmacies:**
```json
{ "entityType": "pharmacy" }
```
Click **Apply** → You'll see only the 3 pharmacies

#### **View Only Suppliers:**
```json
{ "entityType": "supplier" }
```
Click **Apply** → You'll see only the 3 suppliers

#### **View by Zone:**
```json
{ "zone": "Zone-1" }
```
Click **Apply** → See all entities in Zone-1

#### **View Hospitals in Zone-1:**
```json
{ "entityType": "hospital", "zone": "Zone-1" }
```
Click **Apply** → See only hospitals in Zone-1

### **Step 4: Clear Filter**

Click **Reset** to remove filters and see all entities again.

---

## 🖼️ **Visual Guide**

```
Current Screen:
┌─────────────────────────────────────┐
│ test database                       │
│  ├─ agent_activities (selected)    │  ← You are here
│  ├─ entities                        │  ← CLICK HERE to see hospitals/labs/etc
│  ├─ metrics_logs                    │
│  └─ users                           │
└─────────────────────────────────────┘

After clicking "entities":
┌─────────────────────────────────────┐
│ Filter: { "entityType": "hospital" }│  ← Type filter here
│ [Apply] [Reset]                     │  ← Click Apply
│                                      │
│ Document 1: City Central Hospital   │
│ Document 2: Sunrise Hospital        │
│ Document 3: ...                     │
└─────────────────────────────────────┘
```

---

## 🔍 **What Each Collection Contains**

### **entities** (Main Collection)
- All 23 entities:
  - 10 hospitals
  - 6 labs
  - 3 pharmacies
  - 3 suppliers
  - 1 city admin
- Each has an `entityType` field to distinguish them
- Full profiles (beds, equipment, staff, inventory)
- Current state (occupancy, stock levels)

### **users**
- 23 user accounts
- Login credentials for each entity
- Email, role, and password (hashed)

### **agent_activities**
- Logs of agent coordination
- Events and communications
- Time-stamped activity

### **metrics_logs**
- Time-series metrics data
- Historical trends
- Performance data

---

## 🎨 **Example Entity Document Structure**

### **Hospital:**
```json
{
  "_id": "...",
  "entityType": "hospital",
  "name": "City Central Hospital",
  "zone": "Zone-1",
  "email": "central@healsync.com",
  "phone": "+91-9876543210",
  "address": "Main Street, Andheri West, Mumbai",
  "currentState": {
    "beds": {
      "general": { "total": 100, "used": 30 },
      "icu": { "total": 20, "used": 5 }
    }
  }
}
```

### **Lab:**
```json
{
  "_id": "...",
  "entityType": "lab",
  "name": "West Mumbai Diagnostics",
  "zone": "Zone-1",
  "currentState": {
    "testData": {
      "dengue": { "today": 45, "positive": 8 },
      "covid": { "today": 120, "positive": 12 }
    }
  }
}
```

The **entityType** field is what distinguishes them!

---

## 📊 **Atlas UI Tips**

### **Table View vs JSON View**
- Toggle between "Table" and "JSON" view at the top
- **Table View**: Easier to scan multiple documents
- **JSON View**: See full structure

### **Search Specific Fields**
```json
{ "name": "City Central Hospital" }
```
Finds the hospital by exact name

```json
{ "name": /Central/ }
```
Finds all entities with "Central" in the name

### **Sort Results**
Click on column headers to sort:
- Sort by name alphabetically
- Sort by zone
- Sort by entityType

### **Export Data**
- Click "Export" button (top right)
- Download as JSON or CSV
- Analyze in Excel or other tools

---

## 🔗 **Connect Your Backend to Atlas**

Currently your backend connects to **local MongoDB**. To use Atlas instead:

### **Option 1: Update .env File**

Create/edit `backend/.env`:
```env
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/healsync?retryWrites=true&w=majority
```

**Get your connection string:**
1. In Atlas, click "Connect" button
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your actual password
5. Replace `test` database name with `healsync`

### **Option 2: Use Environment Variable**

```bash
export MONGODB_URI="mongodb+srv://..."
node server.js
```

### **Verify Connection**

After updating:
```bash
cd backend
node server.js
```

You should see:
```
✅ MongoDB Connected: cluster0.xxx.mongodb.net
```

---

## 🚀 **Quick Query Examples**

Once in the "entities" collection:

### **Count Documents by Type**
Use the Aggregation tab:
```json
[
  {
    "$group": {
      "_id": "$entityType",
      "count": { "$sum": 1 }
    }
  }
]
```

### **Find Hospitals with >150 Beds**
```json
{
  "entityType": "hospital",
  "profile.beds.general.total": { "$gt": 150 }
}
```

### **Find All Zone-1 Entities**
```json
{ "zone": "Zone-1" }
```

### **Find Labs with High Test Capacity**
```json
{
  "entityType": "lab",
  "profile.testingCapacity.covid.daily": { "$gt": 400 }
}
```

---

## ✅ **Action Steps**

### **To See Your Data NOW:**

1. **Click "entities"** in the left sidebar (not "agent_activities")
2. You'll see all 23 documents
3. **To filter hospitals**: Type `{ "entityType": "hospital" }` in Filter box
4. **Click "Apply"**
5. You'll see only the 10 hospitals!

### **To See Difference Between Types:**

Each entity has an **"entityType"** field:
- `"entityType": "hospital"` → Hospital
- `"entityType": "lab"` → Lab
- `"entityType": "pharmacy"` → Pharmacy
- `"entityType": "supplier"` → Supplier

Use filters to separate them!

---

## 🎯 **Summary**

**Your Data IS There!** You just need to:
1. ✅ Click on the **"entities"** collection (left sidebar)
2. ✅ Use filters to see different types: `{ "entityType": "hospital" }`
3. ✅ Browse through the documents

**To distinguish hospitals from labs:**
- Look at the `entityType` field in each document
- Use filters to show only one type at a time

---

*Your data is stored and visible - you just need to navigate to the right collection and use filters!* 🎉

