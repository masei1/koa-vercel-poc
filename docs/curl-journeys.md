# API cURL Journeys

Practical walkthroughs you can paste into a shell while the API runs locally (default: `http://localhost:3000`). Examples rely on `jq` for parsing; install it or replace the `jq` calls with manual inspection.

```bash
# Base URL used by all calls below
export API_BASE="http://localhost:3000"
```

## Users & Devices Flow

```bash
# 1. Create a user and capture its ID
USER_ID=$(
  curl -s "$API_BASE/v1/users" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"ada@example.com","name":"Ada Lovelace","roles":["admin"]}' \
  | jq -r '.user._id'
)
echo "Created user: $USER_ID"

# 2. List all users (verify creation)
curl -s "$API_BASE/v1/users" | jq '.users'

# 3. Update the user profile
curl -s "$API_BASE/v1/users/$USER_ID" \
  -X PUT \
  -H "Content-Type: application/json" \
  -d '{"name":"Augusta Ada","status":"active"}'

# 4. List current devices for the user (should be empty on first run)
curl -s "$API_BASE/v1/users/$USER_ID/devices" | jq '.devices'

# 5. Register a device for the user and capture its ID
DEVICE_ID=$(
  curl -s "$API_BASE/v1/users/$USER_ID/devices" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"nickname":"Ada MacBook","type":"laptop","platform":"macOS","osVersion":"14.1"}' \
  | jq -r '.device._id'
)
echo "Registered device: $DEVICE_ID"

# 6. List devices again (shows the newly registered device)
curl -s "$API_BASE/v1/users/$USER_ID/devices" | jq '.devices'

# 7. Fetch device details by ID
curl -s "$API_BASE/v1/users/$USER_ID/devices/$DEVICE_ID" | jq '.device'

# 8. Delete the device
curl -s -o /dev/null -w "Device delete status: %{http_code}\n" \
  "$API_BASE/v1/users/$USER_ID/devices/$DEVICE_ID" \
  -X DELETE

# 9. Delete the user
curl -s -o /dev/null -w "User delete status: %{http_code}\n" \
  "$API_BASE/v1/users/$USER_ID" \
  -X DELETE
```

## Search Examples

```bash
# 1. Index a document into the "articles" index
DOC_ID=$(
  curl -s "$API_BASE/v1/search/articles/document" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"title":"Koa on Vercel","content":"Deploying Koa APIs to Vercel with mocked services.","tags":["koa","vercel"]}' \
  | jq -r '.id'
)
echo "Indexed document: $DOC_ID"

# 2. Run a search query
curl -s "$API_BASE/v1/search?q=Koa&index=articles&limit=5" | jq '.hits'

# 3. Delete the document
curl -s "$API_BASE/v1/search/articles/document/$DOC_ID" -X DELETE | jq
```

## Upload Examples

```bash
# 1. Upload a mock file
UPLOAD_KEY=$(
  curl -s "$API_BASE/v1/upload" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"filename":"readme.pdf","contentType":"application/pdf","fileSize":12345}' \
  | jq -r '.key'
)
echo "Uploaded file key: $UPLOAD_KEY"

# 2. List uploaded files
curl -s "$API_BASE/v1/upload?prefix=uploads/" | jq '.files'

# 3. Get metadata for the uploaded file
curl -s "$API_BASE/v1/upload/$UPLOAD_KEY" | jq

# 4. Delete the uploaded file
curl -s "$API_BASE/v1/upload/$UPLOAD_KEY" -X DELETE | jq
```

## Queue Examples

```bash
# 1. Send a message to a mock queue
QUEUE_URL="https://mock-sqs.local/queues/demo"
curl -s "$API_BASE/v1/queue/send" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{\"queueUrl\":\"$QUEUE_URL\",\"message\":{\"type\":\"user.event\",\"detail\":\"User signup\"}}" \
  | jq

# 2. Receive messages (capture first receipt handle)
RECEIVE_OUTPUT=$(curl -s "$API_BASE/v1/queue/receive?queueUrl=$QUEUE_URL&maxMessages=1")
echo "$RECEIVE_OUTPUT" | jq '.messages'
RECEIPT_HANDLE=$(echo "$RECEIVE_OUTPUT" | jq -r '.messages[0].receiptHandle')

# 3. Delete the message using its receipt handle
curl -s -o /dev/null -w "Delete status: %{http_code}\n" \
  "$API_BASE/v1/queue/message?queueUrl=$QUEUE_URL&receiptHandle=$RECEIPT_HANDLE" \
  -X DELETE

# 4. Inspect queue history (send/receive/delete log)
curl -s "$API_BASE/v1/queue/history" | jq '.history'

# 5. Clear the history log
curl -s -o /dev/null -w "Clear status: %{http_code}\n" \
  "$API_BASE/v1/queue/history" \
  -X DELETE
```
