# 🔧 EADDRINUSE Error - Permanent Fix

## ❌ **The Error:**

```
Error: listen EADDRINUSE: address already in use :::4000
```

---

## 🤔 **Why This Keeps Happening:**

### **Root Cause:**
1. You start the server → Port 4000 is bound
2. Server crashes or you try to restart → Old process still running
3. New server tries to start → Port 4000 already in use → **EADDRINUSE error**
4. Repeat...

### **Common Scenarios:**
- ✅ Running `node server.js` multiple times
- ✅ Using `nodemon` which auto-restarts
- ✅ Background processes not killed properly
- ✅ Terminal closing but process still running
- ✅ Multiple terminals running the server

---

## ✅ **Permanent Solutions:**

### **Option 1: Use the Start Script (Recommended)**

We created `start.sh` that automatically handles port conflicts:

```bash
cd backend
./start.sh
```

**What it does:**
- ✅ Checks if port 4000 is in use
- ✅ Kills any existing process
- ✅ Starts fresh server
- ✅ All automatic!

---

### **Option 2: Use NPM Scripts**

We added helpful scripts to `package.json`:

```bash
# Kill port and start server
npm run restart

# Kill port and start with nodemon (auto-reload)
npm run restart:dev

# Just kill the port
npm run kill-port

# Normal start (will fail if port in use)
npm start
```

---

### **Option 3: Manual Kill Command**

If you prefer manual control:

```bash
# Kill process on port 4000
lsof -ti:4000 | xargs kill -9

# Then start server
node server.js
```

**Save this as an alias** in your `~/.zshrc`:
```bash
alias kill4000="lsof -ti:4000 | xargs kill -9"
```

Then you can just run:
```bash
kill4000
node server.js
```

---

### **Option 4: Use Different Port**

If port 4000 is always occupied:

**Update `.env`:**
```env
PORT=4001
```

**Or set when starting:**
```bash
PORT=4001 node server.js
```

---

## 🎯 **Best Practices:**

### **1. Always Use One Method to Start Server**

**Choose ONE:**
- ✅ `./start.sh` (auto-handles conflicts)
- ✅ `npm run restart` (kills port first)
- ✅ Manual kill + start

**DON'T mix:** Starting in multiple terminals or methods

### **2. Check What's Running**

Before starting, check:
```bash
lsof -i :4000
```

This shows all processes on port 4000.

### **3. Use Nodemon for Development**

Instead of restarting manually:
```bash
npm run dev
```

Nodemon auto-restarts on file changes. Just run it once!

### **4. Clean Stop**

When stopping server, use `Ctrl+C` (not closing terminal).

To ensure it's stopped:
```bash
pkill -f "node server.js"
```

---

## 🛠️ **Troubleshooting:**

### **"lsof: command not found"**

On some systems, `lsof` might not be available. Alternative:

```bash
# Find process using port
netstat -anv | grep 4000

# Or use this
ps aux | grep "node server.js" | grep -v grep | awk '{print $2}' | xargs kill -9
```

### **"Operation not permitted"**

The process might be owned by another user. Try with sudo:

```bash
sudo lsof -ti:4000 | xargs sudo kill -9
```

### **Port Still In Use After Killing**

Wait a few seconds for the OS to release the port:

```bash
lsof -ti:4000 | xargs kill -9
sleep 3
node server.js
```

---

## 📊 **Improved Server Code:**

We updated `server.js` to handle this error better:

```javascript
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use!`);
    console.log('\n💡 Fix this by running:');
    console.log(`   lsof -ti:${PORT} | xargs kill -9`);
    console.log('   OR');
    console.log('   npm run kill-port\n');
    process.exit(1);
  }
});
```

Now when the error occurs, you get clear instructions! ✅

---

## 🎯 **Recommended Workflow:**

### **For Development:**
```bash
cd backend
npm run dev  # Starts with nodemon (auto-reload)
```

Leave it running. It will auto-restart on code changes.

### **For Production:**
```bash
cd backend
./start.sh  # Auto-handles port conflicts
```

### **To Restart:**
```bash
# Option 1: Use script
npm run restart

# Option 2: Manual
Ctrl+C  # Stop current server
./start.sh  # Start new one

# Option 3: Kill and restart
npm run kill-port && node server.js
```

---

## 🚀 **Quick Reference:**

| Command | Purpose |
|---------|---------|
| `./start.sh` | Smart start (handles conflicts) |
| `npm run restart` | Kill port + start |
| `npm run dev` | Development mode (nodemon) |
| `npm run kill-port` | Just kill the port |
| `lsof -ti:4000 \| xargs kill -9` | Manual kill |
| `lsof -i :4000` | Check what's on port |

---

## ✅ **Prevention Checklist:**

- [ ] Use `./start.sh` or `npm run restart`
- [ ] Don't start server in multiple terminals
- [ ] Use `Ctrl+C` to stop (not closing terminal)
- [ ] Use `npm run dev` for development (runs once)
- [ ] Check port before starting: `lsof -i :4000`
- [ ] Add to `.gitignore`: `*.log` (prevents log conflicts)

---

## 💡 **Pro Tips:**

### **1. Create Terminal Alias:**
```bash
# Add to ~/.zshrc
alias healsync-start="cd ~/Documents/Projects/agent-hub/backend && ./start.sh"
alias healsync-kill="lsof -ti:4000 | xargs kill -9"
```

Then anywhere:
```bash
healsync-kill  # Kill server
healsync-start # Start server
```

### **2. Use tmux/screen:**
Run server in detached session:
```bash
tmux new -s healsync
cd backend && ./start.sh
# Press Ctrl+B then D to detach
```

Reattach anytime:
```bash
tmux attach -t healsync
```

### **3. Check All Node Processes:**
```bash
ps aux | grep node
```

---

## 🎉 **Summary:**

**Problem:** Port 4000 keeps being used by old server instances  
**Solution:** Always kill existing processes before starting new one  
**Best Method:** Use `./start.sh` or `npm run restart`  
**For Development:** Use `npm run dev` (nodemon)  

**You now have 4 ways to fix this issue!** Choose the one that fits your workflow best. ✅

