#!/usr/bin/env bash
set -euo pipefail

# Simulates key API flows against the local server, mirroring docs/curl-journeys.md.
# Stops with a helpful message if any step encounters an issue.

API_BASE="${API_BASE:-http://localhost:3000}"
QUEUE_URL="${QUEUE_URL:-https://mock-sqs.local/queues/demo}"

CURRENT_STEP=""
REQUEST_STATUS=""
REQUEST_BODY=""
ERROR_HANDLED=0

TMP_DIR="$(mktemp -d journey.XXXXXX)"

cleanup() {
  rm -rf "$TMP_DIR"
}

on_error() {
  local exit_code=$1
  local line=$2
  if [[ $exit_code -ne 0 && $ERROR_HANDLED -eq 0 ]]; then
    echo "✖ Unexpected error (exit $exit_code) at line $line during step '${CURRENT_STEP:-initialization}'." >&2
  fi
}

abort() {
  local message=$1
  ERROR_HANDLED=1
  echo "✖ ${CURRENT_STEP:-Step} failed."
  echo "  $message"
  exit 1
}

set_step() {
  CURRENT_STEP=$1
  echo ""
  echo "==> $CURRENT_STEP"
}

ensure_command() {
  command -v "$1" >/dev/null 2>&1 || abort "Missing required command '$1'. Install it and re-run."
}

urlencode() {
  local raw=$1
  local length=${#raw}
  local i char
  for (( i = 0; i < length; i++ )); do
    char=${raw:i:1}
    case $char in
      [a-zA-Z0-9.~_-]) printf '%s' "$char" ;;
      *) printf '%%%02X' "'$char" ;;
    esac
  done
}

perform_request() {
  local method=$1
  local url=$2
  local data="${3-}"
  local tmp
  tmp="$(mktemp "$TMP_DIR/body.XXXXXX")"
  local status curl_exit

  local args=(-sS -o "$tmp" -w "%{http_code}" -X "$method" "$url")
  if [[ -n $data ]]; then
    args+=(-H "Content-Type: application/json" -d "$data")
  fi

  set +e
  status=$(curl "${args[@]}")
  curl_exit=$?
  set -e

  if [[ $curl_exit -ne 0 ]]; then
    rm -f "$tmp"
    abort "Failed to reach $url (curl exit code: $curl_exit). Is the API running at $API_BASE?"
  fi

  REQUEST_STATUS=$status
  if [[ -s $tmp ]]; then
    REQUEST_BODY=$(<"$tmp")
  else
    REQUEST_BODY=""
  fi
  rm -f "$tmp"
}

assert_status() {
  local expected
  local matched=1
  for expected in "$@"; do
    if [[ "$REQUEST_STATUS" == "$expected" ]]; then
      matched=0
      break
    fi
  done

  if [[ $matched -ne 0 ]]; then
    abort "Expected HTTP status ${*}, got $REQUEST_STATUS. Response body: ${REQUEST_BODY:-<empty>}"
  fi
}

main() {
  set_step "Checking prerequisites"
  ensure_command curl
  ensure_command jq
  echo "API base URL: $API_BASE"
  echo "Queue URL: $QUEUE_URL"

  set_step "Checking API health"
  perform_request GET "$API_BASE/health"
  assert_status 200
  if [[ -n $REQUEST_BODY ]]; then
    echo "$REQUEST_BODY" | jq
  fi

  set_step "Creating user"
  perform_request POST "$API_BASE/v1/users" \
    '{"email":"ada@example.com","name":"Ada Lovelace","roles":["admin"]}'
  assert_status 201
  local USER_ID
  USER_ID=$(echo "$REQUEST_BODY" | jq -r '.user._id // empty')
  [[ -n $USER_ID ]] || abort "User ID missing from creation response."
  echo "Created user $USER_ID"

  set_step "Listing users"
  perform_request GET "$API_BASE/v1/users"
  assert_status 200
  local USER_COUNT
  USER_COUNT=$(echo "$REQUEST_BODY" | jq '.users | length')
  echo "Total users: $USER_COUNT"

  set_step "Updating user profile"
  perform_request PUT "$API_BASE/v1/users/$USER_ID" \
    '{"name":"Augusta Ada","status":"active"}'
  assert_status 200
  echo "Updated user $USER_ID"

  set_step "Listing devices before registration"
  perform_request GET "$API_BASE/v1/users/$USER_ID/devices"
  assert_status 200
  local DEVICE_COUNT_BEFORE
  DEVICE_COUNT_BEFORE=$(echo "$REQUEST_BODY" | jq '.devices | length')
  echo "Devices before registration: $DEVICE_COUNT_BEFORE"

  set_step "Registering device"
  perform_request POST "$API_BASE/v1/users/$USER_ID/devices" \
    '{"nickname":"Ada MacBook","type":"laptop","platform":"macOS","osVersion":"14.1"}'
  assert_status 201
  local DEVICE_ID
  DEVICE_ID=$(echo "$REQUEST_BODY" | jq -r '.device._id // empty')
  [[ -n $DEVICE_ID ]] || abort "Device ID missing from registration response."
  echo "Registered device $DEVICE_ID"

  set_step "Listing devices after registration"
  perform_request GET "$API_BASE/v1/users/$USER_ID/devices"
  assert_status 200
  echo "$REQUEST_BODY" | jq '.devices'

  set_step "Fetching device details"
  perform_request GET "$API_BASE/v1/users/$USER_ID/devices/$DEVICE_ID"
  assert_status 200
  echo "$REQUEST_BODY" | jq '.device'

  set_step "Deleting device"
  perform_request DELETE "$API_BASE/v1/users/$USER_ID/devices/$DEVICE_ID"
  assert_status 204
  echo "Deleted device $DEVICE_ID"

  set_step "Deleting user"
  perform_request DELETE "$API_BASE/v1/users/$USER_ID"
  assert_status 204
  echo "Deleted user $USER_ID"

  set_step "Indexing search document"
  perform_request POST "$API_BASE/v1/search/articles/document" \
    '{"title":"Koa on Vercel","content":"Deploying Koa APIs to Vercel with mocked services.","tags":["koa","vercel"]}'
  assert_status 201
  local DOC_ID
  DOC_ID=$(echo "$REQUEST_BODY" | jq -r '.id // empty')
  [[ -n $DOC_ID ]] || abort "Document ID missing from index response."
  echo "Indexed document $DOC_ID"

  set_step "Searching documents"
  perform_request GET "$API_BASE/v1/search?q=Koa&index=articles&limit=5"
  assert_status 200
  echo "$REQUEST_BODY" | jq '.hits'

  set_step "Deleting search document"
  perform_request DELETE "$API_BASE/v1/search/articles/document/$DOC_ID"
  assert_status 200
  echo "$REQUEST_BODY" | jq

  set_step "Uploading file"
  perform_request POST "$API_BASE/v1/upload" \
    '{"filename":"readme.pdf","contentType":"application/pdf","fileSize":12345}'
  assert_status 201
  local UPLOAD_KEY
  UPLOAD_KEY=$(echo "$REQUEST_BODY" | jq -r '.key // empty')
  [[ -n $UPLOAD_KEY ]] || abort "Upload key missing from response."
  echo "Uploaded file key: $UPLOAD_KEY"

  set_step "Listing uploads"
  perform_request GET "$API_BASE/v1/upload?prefix=uploads/"
  assert_status 200
  echo "$REQUEST_BODY" | jq '.files'

  set_step "Fetching upload metadata"
  perform_request GET "$API_BASE/v1/upload/$UPLOAD_KEY"
  assert_status 200
  echo "$REQUEST_BODY" | jq

  set_step "Deleting upload"
  perform_request DELETE "$API_BASE/v1/upload/$UPLOAD_KEY"
  assert_status 200
  echo "$REQUEST_BODY" | jq

  set_step "Sending queue message"
  local QUEUE_PAYLOAD
  QUEUE_PAYLOAD=$(cat <<JSON
{"queueUrl":"$QUEUE_URL","message":{"type":"user.event","detail":"User signup"}}
JSON
)
  perform_request POST "$API_BASE/v1/queue/send" "$QUEUE_PAYLOAD"
  assert_status 201
  echo "$REQUEST_BODY" | jq

  set_step "Receiving queue messages"
  local ENCODED_QUEUE_URL
  ENCODED_QUEUE_URL=$(urlencode "$QUEUE_URL")
  perform_request GET "$API_BASE/v1/queue/receive?queueUrl=$ENCODED_QUEUE_URL&maxMessages=1"
  assert_status 200
  echo "$REQUEST_BODY" | jq '.messages'
  local RECEIPT_HANDLE
  RECEIPT_HANDLE=$(echo "$REQUEST_BODY" | jq -r '.messages[0].receiptHandle // empty')
  [[ -n $RECEIPT_HANDLE ]] || abort "No receipt handle returned; queue might be empty."

  set_step "Deleting queue message"
  local ENCODED_RECEIPT
  ENCODED_RECEIPT=$(urlencode "$RECEIPT_HANDLE")
  perform_request DELETE "$API_BASE/v1/queue/message?queueUrl=$ENCODED_QUEUE_URL&receiptHandle=$ENCODED_RECEIPT"
  assert_status 204
  echo "Deleted message with receipt handle $RECEIPT_HANDLE"

  set_step "Inspecting queue history"
  perform_request GET "$API_BASE/v1/queue/history"
  assert_status 200
  echo "$REQUEST_BODY" | jq '.history'

  set_step "Clearing queue history"
  perform_request DELETE "$API_BASE/v1/queue/history"
  assert_status 204
  echo "Cleared queue history"

  echo ""
  echo "✅ Journey completed successfully."
}

trap 'on_error $? $LINENO' ERR
trap 'cleanup' EXIT INT TERM

main "$@"
