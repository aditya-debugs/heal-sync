# 🚀 HealSync Quick Start Guide

## ✅ **System Status**

Your HealSync system is now **100% MongoDB-powered**! 🎉

---

## 🎯 **What's Running**

```bash
✅ MongoDB - Storing all entity data
✅ 12 AI Agents - Reading & writing to MongoDB
✅ Backend API - Serving live MongoDB data
✅ Real-time coordination - Agents communicating via event bus
```

---

## 🔄 **Data Flow (Current)**

```
MongoDB Database
      ↕️
12 AI Agents (updating every 8-12 seconds)
      ↕️
/api/state endpoint
      ↕️
Frontend Dashboards
```

**Everything is LIVE and REAL-TIME!**

---

## 🖥️ **Start the System**

### **1. Backend:**
```bash
cd backend
node server.js
```

**Expected output:**
```
✅ MongoDB Connected: localhost
🤖 Initializing agents from MongoDB...
📊 Found: 4 hospitals, 2 labs, 3 pharmacies, 2 suppliers
✅ Initialized 12 agents successfully
✅ Backend server listening on port 4000
```

### **2. Frontend:**
```bash
cd frontend
npm run dev
```

**Access at:** `http://localhost:5173`

---

## 🔍 **Verify Everything Works**

### **Test 1: Health Check**
```bash
curl http://localhost:4000/health
```
**Expected:** `{"status":"running","database":"connected"}`

### **Test 2: Live Data**
```bash
curl http://localhost:4000/api/state | jq '.hospitals.H1.name'
```
**Expected:** `"City Central Hospital"` (from MongoDB!)

### **Test 3: Live Agent Updates**
```bash
# Check dengue tests (changes every 10 seconds)
curl http://localhost:4000/api/state | jq '.labs.L1.testData.dengue.today'

# Wait 10 seconds, check again
sleep 10
curl http://localhost:4000/api/state | jq '.labs.L1.testData.dengue.today'
```
**Expected:** Number increases naturally

### **Test 4: Trigger Outbreak**
```bash
curl -X POST http://localhost:4000/api/simulate/dengue
```
**Expected:** Rapid growth in test numbers + agent coordination logs

---

## 📊 **Monitor Agent Activity**

### **Watch Logs:**
```bash
tail -f /tmp/healsync.log
```

### **What You'll See:**
```
[AGENT] City Central Hospital: 🟢 NORMAL occupancy 47% (92/210 beds)
[AGENT] Metro Diagnostics: Processing 924 tests today
[AGENT] HealthPlus Pharmacy: 🟡 MONITORING stock levels
[AGENT] 🚨 CITY ALERT: Medicine shortage risk
```

---

## 🎮 **Try the Demo Scenarios**

### **Scenario 1: Dengue Outbreak**
```bash
curl -X POST http://localhost:4000/api/simulate/dengue
```
**Watch for:**
- Lab agents detect spike
- Hospitals prepare isolation wards
- Pharmacies check medicine stock
- Suppliers fulfill orders

### **Scenario 2: View Live Coordination**
```bash
# Open dashboard
http://localhost:5173/city

# Trigger outbreak
curl -X POST http://localhost:4000/api/simulate/dengue

# Watch the coordination timeline update in real-time!
```

---

## 🏥 **Access Dashboards**

### **Public Dashboard**
`http://localhost:5173/`
- City health overview
- Active alerts
- Key statistics

### **City Command Center**
`http://localhost:5173/city`
- Agent coordination timeline
- Scenario triggers
- Live activity logs

### **Hospital Dashboard**
`http://localhost:5173/hospital/692a300f7ac35e8ff2f6b493`
*Replace with actual hospital ID from database*

---

## 🔧 **Useful Commands**

### **Reset Database:**
```bash
cd backend
node scripts/seedDatabase.js
```

### **View All Entities:**
```bash
curl http://localhost:4000/api/entities | jq '.[] | {name, type: .entityType, zone}'
```

### **Check Bed Occupancy:**
```bash
curl http://localhost:4000/api/state | jq '.city.totalResources.beds'
```

### **Stop Server:**
```bash
pkill -f "node server.js"
```

---

## 🐛 **Troubleshooting**

### **MongoDB not connecting:**
```bash
# Check if MongoDB is running
mongosh

# If not, start it
brew services start mongodb-community
# or
sudo systemctl start mongod
```

### **Port 4000 already in use:**
```bash
# Kill existing process
lsof -ti:4000 | xargs kill -9

# Or use different port
PORT=4001 node server.js
```

### **Agents not updating:**
- Check server logs: `tail -f /tmp/healsync.log`
- Verify MongoDB connection: `curl http://localhost:4000/health`
- Restart server

---

## 📝 **Default Credentials**

```
Hospitals:  h1@healsync.com / password123
Labs:       l1@healsync.com / password123
Pharmacies: p1@healsync.com / password123
Suppliers:  s1@healsync.com / password123
City Admin: cityadmin@healsync.com / admin123
```

---

## 📚 **Documentation**

- `MONGODB_MIGRATION_COMPLETE.md` - Full migration details
- `DATA_FLOW_UPDATE.md` - Data flow explanation
- `README.md` - Project overview
- `PROJECT_SUMMARY.md` - Architecture details

---

## 🎯 **Next Steps**

1. ✅ Test frontend dashboards
2. ✅ Try different outbreak scenarios
3. ✅ Register new entities via `/register` page
4. ✅ Explore agent coordination in real-time
5. 🚀 Demo to stakeholders!

---

## 💡 **Pro Tips**

1. **Watch agent coordination:**
   Open City Dashboard and trigger dengue outbreak to see full cascade

2. **Monitor medicine stock:**
   Pharmacies deplete stock naturally - watch suppliers fulfill orders

3. **Compare before/after:**
   Check test counts before and after outbreak simulation

4. **Live updates:**
   Dashboards auto-refresh - data is always current from MongoDB

---

## 🏆 **What's Different Now**

**Before:** Dashboards showed static `worldState.js` data  
**After:** Dashboards show **LIVE MongoDB data** updated by agents  

**Before:** Simulations only modified memory  
**After:** Simulations **persist to MongoDB** and trigger real agent responses  

**Before:** Data lost on restart  
**After:** Data **survives restarts** and keeps historical trends  

---

**Your system is production-ready and hackathon-ready!** 🚀🎉

---

*Last Updated: November 28, 2025*

