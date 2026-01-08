# Server Restart Required

The backend server needs to be restarted to pick up the new address validation rules.

## Current Issue
The server is validating against old fields (`type`, `name`, `address`, `pincode`) instead of new fields (`firstName`, `lastName`, `street`, `pinCode`).

## Solution
Restart the backend server to load the updated validation rules.

## Restart Command
```bash
cd /var/www/ozme_production/OZME/ozme-backend
pkill -9 -f "node.*server.js"
sleep 2
nohup node src/server.js > /tmp/ozme-backend.log 2>&1 &
```

## Verify
After restart, check logs:
```bash
tail -50 /tmp/ozme-backend.log | grep -E "Server|listening|addresses"
```

## Test
Try saving an address again. The validation should now accept:
- `firstName` (not `name`)
- `lastName` (not `name`)
- `street` (not `address`)
- `pinCode` (not `pincode`)

