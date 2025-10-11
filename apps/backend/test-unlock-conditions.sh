#!/bin/bash

# Script de test pour les conditions de déblocage
# Ce script teste le workflow complet de l'API

BASE_URL="http://localhost:3001/api"
TOKEN=""
CAMPAIGN_ID=5
VALIDATION_ID=""

echo "🚀 Starting Unlock Conditions API Tests..."
echo "=========================================="
echo ""

# Step 1: Login as Manager
echo "🔐 Step 1: Login as Manager..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"manager3@htf.com","password":"password"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Step 2: Get unlock conditions
echo "🔐 Step 2: Get unlock conditions for campaign ${CAMPAIGN_ID}..."
CONDITIONS_RESPONSE=$(curl -s -X GET "${BASE_URL}/campaign-validation/campaigns/${CAMPAIGN_ID}/conditions" \
  -H "Authorization: Bearer ${TOKEN}")

echo "📝 Unlock Conditions:"
echo "$CONDITIONS_RESPONSE" | jq '.[] | {id, description: (.description | .[0:60] + "..."), displayOrder}'
echo ""

# Extract condition IDs
CONDITION_IDS=$(echo "$CONDITIONS_RESPONSE" | jq -r '.[].id')
echo "Condition IDs: $CONDITION_IDS"
echo ""

# Step 3: Get campaign validations
echo "✅ Step 3: Get campaign validations for FBOs..."
VALIDATIONS_RESPONSE=$(curl -s -X GET "${BASE_URL}/campaign-validation/campaign/${CAMPAIGN_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

echo "📊 Campaign Validations:"
echo "$VALIDATIONS_RESPONSE" | jq '.[] | {id, userName, status, totalEarnings, completionPercentage}'
echo ""

# Extract first validation ID
VALIDATION_ID=$(echo "$VALIDATIONS_RESPONSE" | jq -r '.[0].id')
USER_ID=$(echo "$VALIDATIONS_RESPONSE" | jq -r '.[0].userId')

if [ -z "$VALIDATION_ID" ] || [ "$VALIDATION_ID" == "null" ]; then
  echo "❌ No validation found"
  exit 1
fi

echo "➡️  Using validation ID ${VALIDATION_ID} for user ID ${USER_ID}"
echo ""

# Step 4: Get condition fulfillments
echo "📋 Step 4: Get condition fulfillments status..."
FULFILLMENTS_RESPONSE=$(curl -s -X GET "${BASE_URL}/campaign-validation/${VALIDATION_ID}/condition-fulfillments" \
  -H "Authorization: Bearer ${TOKEN}")

echo "Current status:"
echo "$FULFILLMENTS_RESPONSE" | jq '.[] | {conditionId: .condition.id, description: (.condition.description | .[0:50] + "..."), isFulfilled: (.fulfillment.isFulfilled // false)}'
echo ""

# Step 5: Fulfill only SOME conditions (3 out of 5)
echo "📝 Step 5: Fulfilling ONLY 3 out of 5 conditions..."

CONDITION_ARRAY=($CONDITION_IDS)

# Fulfill condition 1
echo "✅ Fulfilling condition ${CONDITION_ARRAY[0]}..."
curl -s -X PUT "${BASE_URL}/campaign-validation/${VALIDATION_ID}/conditions/${CONDITION_ARRAY[0]}/fulfill" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"isFulfilled":true,"comment":"Formations suivies : 4/4 ✅"}' | jq '.'
echo ""

# Fulfill condition 2
echo "✅ Fulfilling condition ${CONDITION_ARRAY[1]}..."
curl -s -X PUT "${BASE_URL}/campaign-validation/${VALIDATION_ID}/conditions/${CONDITION_ARRAY[1]}/fulfill" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"isFulfilled":true,"comment":"Taux de conversion : 12% ✅"}' | jq '.'
echo ""

# Fulfill condition 3
echo "✅ Fulfilling condition ${CONDITION_ARRAY[2]}..."
curl -s -X PUT "${BASE_URL}/campaign-validation/${VALIDATION_ID}/conditions/${CONDITION_ARRAY[2]}/fulfill" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"isFulfilled":true,"comment":"5 parrainages réalisés ✅"}' | jq '.'
echo ""

# Step 6: Check status after partial fulfillment
echo "📋 Step 6: Check status after partial fulfillment..."
curl -s -X GET "${BASE_URL}/campaign-validation/${VALIDATION_ID}/condition-fulfillments" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.[] | {conditionId: .condition.id, isFulfilled: (.fulfillment.isFulfilled // false)}'
echo ""

# Step 7: Attempt to validate (should FAIL)
echo "⚠️  Step 7: Attempting validation with INCOMPLETE conditions (should FAIL)..."
VALIDATION_ATTEMPT=$(curl -s -w "\n%{http_code}" -X PUT "${BASE_URL}/campaign-validation/user/${USER_ID}/campaign/${CAMPAIGN_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved","comment":"Test validation with incomplete conditions"}')

HTTP_CODE=$(echo "$VALIDATION_ATTEMPT" | tail -n1)
RESPONSE_BODY=$(echo "$VALIDATION_ATTEMPT" | head -n -1)

if [ "$HTTP_CODE" == "400" ] || [ "$HTTP_CODE" == "422" ]; then
  echo "✅ Validation correctly BLOCKED (HTTP ${HTTP_CODE})"
  echo "Error message:" 
  echo "$RESPONSE_BODY" | jq '.message'
else
  echo "❌ Validation should have been blocked but got HTTP ${HTTP_CODE}"
  echo "$RESPONSE_BODY" | jq '.'
fi
echo ""

# Step 8: Fulfill remaining conditions
echo "📝 Step 8: Fulfilling REMAINING conditions..."

# Fulfill condition 4
echo "✅ Fulfilling condition ${CONDITION_ARRAY[3]}..."
curl -s -X PUT "${BASE_URL}/campaign-validation/${VALIDATION_ID}/conditions/${CONDITION_ARRAY[3]}/fulfill" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"isFulfilled":true,"comment":"Rapports soumis : 4/4 semaines ✅"}' | jq '.'
echo ""

# Fulfill condition 5
echo "✅ Fulfilling condition ${CONDITION_ARRAY[4]}..."
curl -s -X PUT "${BASE_URL}/campaign-validation/${VALIDATION_ID}/conditions/${CONDITION_ARRAY[4]}/fulfill" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"isFulfilled":true,"comment":"Participation WhatsApp active ✅"}' | jq '.'
echo ""

# Step 9: Final status check
echo "📋 Step 9: Final fulfillment status check..."
curl -s -X GET "${BASE_URL}/campaign-validation/${VALIDATION_ID}/condition-fulfillments" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.[] | {conditionId: .condition.id, isFulfilled: (.fulfillment.isFulfilled // false), comment: .fulfillment.comment}'
echo ""

# Step 10: Attempt to validate again (should SUCCEED)
echo "✅ Step 10: Attempting validation with ALL conditions fulfilled (should SUCCEED)..."
FINAL_VALIDATION=$(curl -s -w "\n%{http_code}" -X PUT "${BASE_URL}/campaign-validation/user/${USER_ID}/campaign/${CAMPAIGN_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved","comment":"Validation finale - toutes conditions remplies"}')

HTTP_CODE=$(echo "$FINAL_VALIDATION" | tail -n1)
RESPONSE_BODY=$(echo "$FINAL_VALIDATION" | head -n -1)

if [ "$HTTP_CODE" == "200" ]; then
  echo "✅ Validation SUCCEEDED (HTTP ${HTTP_CODE})"
  echo "Validation details:"
  echo "$RESPONSE_BODY" | jq '{id, userName, status, validatedAt, comment}'
else
  echo "❌ Validation should have succeeded but got HTTP ${HTTP_CODE}"
  echo "$RESPONSE_BODY" | jq '.'
fi
echo ""

echo "🎉 All tests completed!"
echo "=========================================="
