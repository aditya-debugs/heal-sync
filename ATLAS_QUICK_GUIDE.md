# 🎯 Quick Guide: View Data in MongoDB Atlas

## 📍 **You Are Here** (from your screenshot):
```
Database: test
Collection: agent_activities (currently selected)
Status: Viewing - but this collection has 0 documents
```

## ✅ **What You Need to Do:**

### **Step 1: Click on "entities" Collection**

Look at the left sidebar under "test" database:
```
test
├─ agent_activities  ← You are here (0 docs)
├─ entities          ← CLICK HERE (this has your 23 entities!)
├─ metrics_logs
└─ users
```

### **Step 2: You'll See All 23 Entities**

After clicking "entities", you'll see all your data mixed together:
- 10 hospitals
- 6 labs
- 3 pharmacies
- 3 suppliers
- 1 city admin

**ALL IN ONE LIST!**

---

## 🔍 **How to Separate Them:**

### **Filter Box** (top of the page)

Type ONE of these filters and click **Apply**:

#### **See Only Hospitals:**
```
{ "entityType": "hospital" }
```
**Result:** Shows 10 hospitals only ✅

#### **See Only Labs:**
```
{ "entityType": "lab" }
```
**Result:** Shows 6 labs only ✅

#### **See Only Pharmacies:**
```
{ "entityType": "pharmacy" }
```
**Result:** Shows 3 pharmacies only ✅

#### **See Only Suppliers:**
```
{ "entityType": "supplier" }
```
**Result:** Shows 3 suppliers only ✅

---

## 📊 **What Makes Them Different?**

Each entity has a field called **"entityType"** that identifies what it is:

### **Hospital Document:**
```json
{
  "_id": "...",
  "entityType": "hospital",  ← THIS FIELD!
  "name": "City Central Hospital",
  "zone": "Zone-1",
  "currentState": {
    "beds": { ... },         ← Hospitals have beds
    "equipment": { ... },    ← and equipment
    "staff": { ... }         ← and staff
  }
}
```

### **Lab Document:**
```json
{
  "_id": "...",
  "entityType": "lab",       ← THIS FIELD!
  "name": "West Mumbai Diagnostics",
  "zone": "Zone-1",
  "currentState": {
    "testData": { ... }      ← Labs have test data
  }
}
```

### **Pharmacy Document:**
```json
{
  "_id": "...",
  "entityType": "pharmacy",  ← THIS FIELD!
  "name": "MediCare Pharmacy",
  "zone": "Zone-1",
  "currentState": {
    "medicines": { ... }     ← Pharmacies have medicines
  }
}
```

### **Supplier Document:**
```json
{
  "_id": "...",
  "entityType": "supplier",  ← THIS FIELD!
  "name": "MediSupply Co.",
  "zone": "Zone-1",
  "currentState": {
    "inventory": { ... }     ← Suppliers have inventory
  }
}
```

---

## 🎨 **Visual Differences:**

### **🏥 Hospitals Have:**
- ✅ **beds** (general, ICU, isolation, pediatric, maternity)
- ✅ **equipment** (ventilators, ambulances, X-ray machines)
- ✅ **staff** (doctors, nurses, specialists)
- ✅ **patientMetrics** (inflow, admissions, ER wait time)

### **🔬 Labs Have:**
- ✅ **testData** (dengue, malaria, COVID, typhoid tests)
- ✅ **testingCapacity** (daily test limits)
- ✅ **equipment** (RT-PCR machines, microscopes, centrifuges)

### **💊 Pharmacies Have:**
- ✅ **medicines** (dengueMed, chloroquine, paracetamol, etc.)
- ✅ **storageCapacity** (refrigerated, controlled, general)
- ✅ **pendingOrders** (orders to suppliers)

### **📦 Suppliers Have:**
- ✅ **inventory** (bulk stock of medicines & equipment)
- ✅ **logistics** (delivery vehicles, max daily deliveries)
- ✅ **activeOrders** (orders from pharmacies/hospitals)

---

## 🚀 **Try This NOW:**

1. **In Atlas, click "entities"** in the left sidebar
2. **Type this in the Filter box:**
   ```
   { "entityType": "hospital" }
   ```
3. **Click "Apply"**
4. **You'll see:** Only the 10 hospitals!

5. **Change filter to:**
   ```
   { "entityType": "lab" }
   ```
6. **Click "Apply"**
7. **You'll see:** Only the 6 labs!

---

## 📝 **Summary:**

| What You See | What It Is | How to Filter |
|--------------|------------|---------------|
| City Central Hospital | Hospital | `{ "entityType": "hospital" }` |
| West Mumbai Diagnostics | Lab | `{ "entityType": "lab" }` |
| MediCare Pharmacy | Pharmacy | `{ "entityType": "pharmacy" }` |
| MediSupply Co. | Supplier | `{ "entityType": "supplier" }` |

**The "entityType" field is the key!** That's how you tell them apart. 🎯

---

## 🔧 **Quick Script to Run Locally:**

If you want to see this in your terminal:
```bash
cd backend
node scripts/viewEntities.js
```

This will show you all entities grouped by type with their differences! ✅

