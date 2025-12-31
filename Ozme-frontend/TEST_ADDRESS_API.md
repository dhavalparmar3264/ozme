# Test Address API Endpoint

## Manual Test Steps

1. Open browser console (F12)
2. Fill out the address form in Dashboard
3. Click "Add Address" button
4. Check console logs for:
   - "🔘 Button clicked!"
   - "📝 Form onSubmit triggered"
   - "🔘 Form submit triggered"
   - "📨 Sending address data: {...}"
   - "📥 API Response received: {...}"

## Expected Console Output

### On Success:
```
🔘 Button clicked!
📝 Form onSubmit triggered
🔘 Form submit triggered
📤 Saving address...
📨 Sending address data: {...}
📥 API Response received: { success: true, ... }
✅ Address save response received: {...}
```

### On Error:
```
❌ Address save error: Error: ...
📦 Address form data sent: {...}
🔍 Full error object: {...}
📋 Error response data: {...}
```

## Common Issues

1. **No console logs at all** → Button click not working
2. **"No response from server"** → Backend offline or wrong endpoint
3. **"Validation failed"** → Check error.response.data.errors for field-specific errors
4. **401/403 error** → Auth token missing or invalid

## Test API Directly

```javascript
// In browser console:
const testAddress = {
  firstName: "Test",
  lastName: "User",
  email: "test@example.com",
  phone: "9876543210",
  street: "123 Test St",
  apartment: "",
  city: "Mumbai",
  state: "Maharashtra",
  pinCode: "400001",
  country: "India",
  isDefault: false
};

fetch('http://82.112.231.165:3002/api/users/me/addresses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify(testAddress)
})
.then(r => r.json())
.then(d => console.log('Response:', d))
.catch(e => console.error('Error:', e));
```

