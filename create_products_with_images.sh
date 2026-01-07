#!/bin/bash

# Script to create 8 OZMÉ perfume products with placeholder images
# Images can be replaced later via admin panel

API_BASE="https://www.ozme.in/api"
EMAIL="admin@ozme.in"
PASSWORD="Ozme@0911"

echo "🔐 Logging in..."
TOKEN=$(curl -s -X POST "${API_BASE}/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}" | \
  jq -r '.data.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Create a temporary placeholder image file (1x1 transparent PNG)
PLACEHOLDER_IMAGE="/tmp/ozme_placeholder.png"
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > "$PLACEHOLDER_IMAGE"

# Function to create a product with placeholder image
create_product() {
  local name="$1"
  local short_desc="$2"
  local full_desc="$3"
  local category="$4"
  local gender="$5"
  local mrp="$6"
  local price="$7"
  local stock="$8"

  echo "Creating: ${name:0:50}..."

  # Create multipart/form-data request
  RESPONSE=$(curl -s -X POST "${API_BASE}/admin/products" \
    -H "Authorization: Bearer ${TOKEN}" \
    -F "productData={\"name\":\"$(echo "$name" | sed 's/"/\\"/g')\",\"shortDescription\":\"$(echo "$short_desc" | sed 's/"/\\"/g')\",\"description\":\"$(echo "$full_desc" | sed 's/"/\\"/g')\",\"category\":\"$category\",\"gender\":\"$gender\",\"sizes\":[{\"size\":\"120ML\",\"price\":$price,\"originalPrice\":$mrp,\"stockQuantity\":$stock}],\"active\":true};type=application/json" \
    -F "images=@${PLACEHOLDER_IMAGE};type=image/png")

  SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
  if [ "$SUCCESS" == "true" ]; then
    PRODUCT_ID=$(echo "$RESPONSE" | jq -r '.data.product._id')
    PRODUCT_NAME=$(echo "$RESPONSE" | jq -r '.data.product.name')
    echo "✅ Created: ${PRODUCT_NAME:0:50}"
    echo "   ID: ${PRODUCT_ID}"
    return 0
  else
    ERROR=$(echo "$RESPONSE" | jq -r '.message')
    echo "❌ Failed: $ERROR"
    echo "$RESPONSE" | jq '.'
    return 1
  fi
}

# Product 1: Cristal 7
create_product \
  "Cristal 7 Extrait de Parfum | Premium Unisex Perfume | Long Lasting, 120 ml" \
  "A clean and sparkling fragrance with fresh citrus, soft florals, and smooth musks for effortless everyday elegance." \
  "Cristal 7 Extrait de Parfum is a bright and refreshing scent crafted for those who love clarity and sophistication. It opens with crisp citrus and airy fresh notes that feel instantly uplifting. The heart reveals soft floral nuances, balanced perfectly with subtle woody tones. As it dries down, smooth musks add depth and long-lasting comfort. A versatile unisex fragrance ideal for daily wear, office use, and warm climates." \
  "Fresh & Daily Sourced" \
  "Unisex" \
  1499 \
  899 \
  50

echo ""

# Product 2: Paradox Infinity
create_product \
  "Paradox Infinity Extrait de Parfum | Premium Unisex Perfume | Long Lasting, 120 ml" \
  "A bold and intense fragrance blending warm spices, deep woods, and rich amber for a powerful statement." \
  "Paradox Infinity Extrait de Parfum is designed for those who command attention. It opens with an intriguing mix of spicy and aromatic notes, creating an immediate sense of mystery. The heart is rich with woody accords that add strength and character, while the base of amber and musk delivers warmth and long-lasting intensity. Perfect for evenings, special occasions, and confident personalities." \
  "Fresh & Daily Sourced" \
  "Unisex" \
  1499 \
  899 \
  50

echo ""

# Product 3: Fantasy
create_product \
  "Fantasy Extrait de Parfum | Premium Unisex Perfume | Long Lasting, 120 ml" \
  "A playful and sweet fragrance with fruity notes, soft florals, and a creamy musky finish." \
  "Fantasy Extrait de Parfum is a joyful blend that captures a carefree and youthful spirit. It opens with delicious fruity notes that feel vibrant and fun, followed by a delicate floral heart that adds softness. The base settles into creamy vanilla and gentle musk, leaving a comforting and addictive trail. Ideal for casual wear, daytime outings, and those who love sweet, cheerful scents." \
  "Fresh & Daily Sourced" \
  "Unisex" \
  1499 \
  899 \
  50

echo ""

# Product 4: Interstellar
create_product \
  "Interstellar Extrait de Parfum | Premium Unisex Perfume | Long Lasting, 120 ml" \
  "A dark, powerful fragrance with smoky woods, spices, and amber inspired by the mystery of space." \
  "Interstellar Extrait de Parfum is a deep and captivating scent for lovers of intense fragrances. It opens with bold spices and aromatic notes that immediately set a dramatic tone. The heart features smoky woods and resinous accords, creating depth and intrigue. A warm amber and musky base ensures exceptional longevity. Best suited for night wear and statement-making moments." \
  "Fresh & Daily Sourced" \
  "Unisex" \
  1499 \
  899 \
  50

echo ""

# Product 5: Céleste
create_product \
  "Céleste Extrait de Parfum | Premium Unisex Perfume | Long Lasting, 120 ml" \
  "A soft, elegant fragrance with airy florals, fresh notes, and clean musks for a calming presence." \
  "Céleste Extrait de Parfum is a graceful and soothing scent that feels light yet refined. It opens with fresh, delicate notes that transition into a floral heart full of softness and balance. The base of clean musks and subtle woods adds a smooth, lasting finish. Perfect for daily wear, minimalists, and those who prefer gentle, elegant fragrances." \
  "Fresh & Daily Sourced" \
  "Unisex" \
  1499 \
  899 \
  50

echo ""

# Product 6: Halo Sky
create_product \
  "Halo Sky Extrait de Parfum | Premium Unisex Perfume | Long Lasting, 120 ml" \
  "A fresh and breezy fragrance with citrus, aquatic notes, and soft woods for all-day freshness." \
  "Halo Sky Extrait de Parfum delivers a refreshing experience inspired by open skies and cool air. It opens with bright citrus and aquatic accords that feel clean and energizing. The heart introduces light aromatic tones, while the base of soft woods and musk keeps the fragrance balanced and long-lasting. Ideal for summer, travel, and everyday wear." \
  "Fresh & Daily Sourced" \
  "Unisex" \
  1499 \
  899 \
  50

echo ""

# Product 7: Floralé
create_product \
  "Floralé Extrait de Parfum | Premium Unisex Perfume | Long Lasting, 120 ml" \
  "A romantic floral fragrance with blooming petals and a smooth musky base, elegant and timeless." \
  "Floralé Extrait de Parfum is a celebration of floral beauty. It begins with fresh, blooming floral notes that feel vibrant and graceful. The heart reveals layered petals that add richness without overpowering. A soft musky and woody base provides warmth and excellent longevity. A perfect choice for lovers of classic florals with a modern touch." \
  "Fresh & Daily Sourced" \
  "Unisex" \
  1499 \
  899 \
  50

echo ""

# Product 8: Amber Prime
create_product \
  "Amber Prime Extrait de Parfum | Premium Unisex Perfume | Long Lasting, 120 ml" \
  "A warm and luxurious fragrance featuring rich amber, soft woods, and subtle sweetness." \
  "Amber Prime Extrait de Parfum is a refined and sensual scent built around deep amber notes. It opens smoothly and transitions into a warm, slightly sweet heart with woody undertones. The base is rich, comforting, and long-lasting, making it an excellent signature fragrance. Ideal for evenings, cooler weather, and those who enjoy elegant, mature scents." \
  "Fresh & Daily Sourced" \
  "Unisex" \
  1499 \
  899 \
  50

echo ""
echo "✨ All products created!"
echo ""
echo "📝 IMPORTANT: Replace placeholder images with actual product images via admin panel:"
echo "   1. Go to https://ozme.in/admin/products"
echo "   2. Click Edit on each product"
echo "   3. Upload the provided product images"
echo "   4. Save changes"

# Cleanup
rm -f "$PLACEHOLDER_IMAGE"

