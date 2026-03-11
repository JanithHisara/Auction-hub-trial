# AuxtionHub - ESP32 Device API Reference

**Version:** 1.0  
**Date:** March 2026  
**Protocol:** MQTT 3.1.1 over TLS (port 8883)

---

## Table of Contents

1. [Connection Configuration](#1-connection-configuration)
2. [Authentication (Certificates)](#2-authentication-certificates)
3. [Topic Reference](#3-topic-reference)
4. [API: NFC Scan](#4-api-nfc-scan)
5. [API: Bid Submit](#5-api-bid-submit)
6. [API: Heartbeat](#6-api-heartbeat)
7. [API: State Response (Inbound)](#7-api-state-response-inbound)
8. [API: Auction Update (Inbound)](#8-api-auction-update-inbound)
9. [Unified Display Schema](#9-unified-display-schema)
10. [Error Codes](#10-error-codes)
11. [Device Lifecycle](#11-device-lifecycle)
12. [Firmware Architecture Recommendation](#12-firmware-architecture-recommendation)

---

## 1. Connection Configuration

| Parameter        | Value                                                        |
|------------------|--------------------------------------------------------------|
| MQTT Broker      | `a1m322vfibs32e-ats.iot.ap-southeast-1.amazonaws.com`        |
| Port             | `8883` (MQTT over TLS, mutual authentication)                |
| Protocol         | MQTT 3.1.1                                                   |
| Client ID        | Must match the Thing Name exactly (e.g. `AuxtionDevice`)     |
| Keep Alive       | 30 seconds recommended                                       |
| Clean Session    | `true`                                                       |
| QoS              | `1` for all publish and subscribe operations                  |

---

## 2. Authentication (Certificates)

The device authenticates using mutual TLS with X.509 certificates. Three files are required:

| File                   | Description                        |
|------------------------|------------------------------------|
| `AmazonRootCA1.pem`   | AWS Root Certificate Authority     |
| `certificate.pem.crt` | Device-specific client certificate |
| `private.pem.key`     | Device-specific private key        |

These files are provided separately per device and must be stored securely on the ESP32 (e.g. in SPIFFS or hardcoded in firmware).

> **Security note:** The private key must never be transmitted over an unencrypted channel. Each physical device receives its own unique certificate. If a device is compromised, its certificate can be revoked without affecting other devices.

---

## 3. Topic Reference

All topics follow the pattern: `gem-auction/{device_id}/...`

Where `{device_id}` is the Thing Name (e.g. `AuxtionDevice`). The device can ONLY access topics under its own device_id.

### Outbound (Device publishes)

| Topic                                         | Purpose             | Response? |
|-----------------------------------------------|---------------------|-----------|
| `gem-auction/{device_id}/nfc/scan`            | NFC card scanned    | Yes       |
| `gem-auction/{device_id}/bid/submit`          | Place a bid         | Yes       |
| `gem-auction/{device_id}/heartbeat`           | Periodic status     | No        |

### Inbound (Device subscribes)

| Topic                                         | Purpose                          |
|-----------------------------------------------|----------------------------------|
| `gem-auction/{device_id}/state`               | Response to NFC scan and bids    |
| `gem-auction/{device_id}/auction/update`      | Real-time auction data push      |

### On connect, subscribe to both inbound topics:

```
gem-auction/{device_id}/state
gem-auction/{device_id}/auction/update
```

---

## 4. API: NFC Scan

Triggered when a user taps their NFC card on the device reader.

### Publish

**Topic:** `gem-auction/{device_id}/nfc/scan`

```json
{
  "action": "nfc_scan",
  "device_id": "AuxtionDevice",
  "nfc_uid": "04A3B21C7F8890",
  "timestamp": "2026-03-08T10:00:00Z",
  "firmware_version": "1.0.0"
}
```

| Field              | Type   | Required | Description                              |
|--------------------|--------|----------|------------------------------------------|
| `action`           | string | Yes      | Always `"nfc_scan"`                      |
| `device_id`        | string | Yes      | This device's Thing Name                 |
| `nfc_uid`          | string | Yes      | NFC card hardware UID (hex string)       |
| `timestamp`        | string | Yes      | ISO 8601 UTC timestamp                   |
| `firmware_version` | string | No       | Current firmware version of the device   |

### Response

A full [Unified Display Schema](#9-unified-display-schema) is published to `gem-auction/{device_id}/state`.

**On success:** `screen.name = "auction_items"`, `screen.state = "success"`. The `user`, `detail.auction`, `detail.item`, and `lists.items` fields are populated.

**On error:** `screen.name = "nfc_access"`, `screen.state = "error"`. The `feedback` object contains the error code and message. See [Error Codes](#10-error-codes).

### Success Response Example

```json
{
  "screen": {
    "name": "auction_items",
    "state": "success",
    "title": "Dehiwala Auction",
    "subtitle": "Progressive Elimination",
    "message": "2 items available"
  },
  "device": {
    "device_id": "AuxtionDevice",
    "status": "active",
    "firmware_version": "1.0.0",
    "hardware_version": "1.0",
    "boot_count": null,
    "heartbeat_interval": 30,
    "last_seen_at": "2026-03-08T10:00:00Z"
  },
  "session": {
    "timestamp": "2026-03-08T10:00:01Z",
    "message_id": null,
    "protocol_version": "1.0",
    "connection_status": "online"
  },
  "user": {
    "nfc_uid": "04A3B21C7F8890",
    "user_id": "5e7dc73c-7e6b-464c-8cc0-3c9a5b8b0d6a",
    "role": "user",
    "access_granted": true,
    "access_status": "success",
    "access_reason_code": null,
    "access_reason_label": null
  },
  "context": {
    "active_auction_id": "2140b05d-38e8-42b1-ba8d-128181ea4796",
    "active_item_id": "d1b501ea-1298-45a0-a2c9-2a3af70ec192"
  },
  "lists": {
    "auctions": [],
    "items": [
      {
        "item_id": "d1b501ea-1298-45a0-a2c9-2a3af70ec192",
        "name": "Blue Sapphire 3.2ct",
        "status": "active",
        "current_price": 50000.00,
        "currency": "LKR",
        "next_min_bid": 52500.00,
        "end_datetime": "2026-03-08T12:00:00Z",
        "remaining_seconds": 7200,
        "your_bid_submitted": null
      }
    ]
  },
  "detail": {
    "auction": {
      "auction_id": "2140b05d-38e8-42b1-ba8d-128181ea4796",
      "name": "Dehiwala Auction",
      "mode": "progressive_elimination_auction",
      "mode_label": "Progressive Elimination",
      "status": "live",
      "status_label": "Live",
      "start_datetime": "2026-02-25T18:30:00Z",
      "end_datetime": "2026-04-30T18:30:00Z",
      "items_count": 2,
      "registered_count": 15
    },
    "item": {
      "item_id": "d1b501ea-1298-45a0-a2c9-2a3af70ec192",
      "name": "Blue Sapphire 3.2ct",
      "status": "active",
      "current_price": 50000.00,
      "currency": "LKR",
      "next_min_bid": 52500.00,
      "end_datetime": "2026-03-08T12:00:00Z",
      "remaining_seconds": 7200,
      "your_bid_submitted": null
    },
    "bid": null,
    "update": null
  },
  "feedback": {
    "status": "success",
    "code": null,
    "label": null,
    "message": "Welcome, John Doe"
  },
  "actions": {
    "primary": "submit_bid",
    "secondary": "refresh",
    "back": false
  }
}
```

### Error Response Example

```json
{
  "screen": {
    "name": "nfc_access",
    "state": "error",
    "title": "Access Denied",
    "subtitle": null,
    "message": "This NFC card is not registered"
  },
  "user": {
    "nfc_uid": "AABBCCDD112233",
    "user_id": null,
    "role": null,
    "access_granted": false,
    "access_status": "error",
    "access_reason_code": 3,
    "access_reason_label": "Card Not Recognized"
  },
  "feedback": {
    "status": "error",
    "code": 3,
    "label": "Card Not Recognized",
    "message": "This NFC card is not registered"
  },
  "actions": {
    "primary": "scan_nfc",
    "secondary": null,
    "back": false
  }
}
```

---

## 5. API: Bid Submit

Triggered when the user presses a bid button on the device.

> **Prerequisite:** A successful NFC scan must have been performed first. The backend tracks an active session. Bidding without a prior scan returns error code 10.

### Publish

**Topic:** `gem-auction/{device_id}/bid/submit`

```json
{
  "action": "submit_bid",
  "device_id": "AuxtionDevice",
  "nfc_uid": "04A3B21C7F8890",
  "item_id": "d1b501ea-1298-45a0-a2c9-2a3af70ec192",
  "amount": 52500.00,
  "timestamp": "2026-03-08T10:05:00Z"
}
```

| Field       | Type   | Required | Description                                    |
|-------------|--------|----------|------------------------------------------------|
| `action`    | string | Yes      | Always `"submit_bid"`                          |
| `device_id` | string | Yes      | This device's Thing Name                       |
| `nfc_uid`   | string | Yes      | NFC UID from the currently scanned card        |
| `item_id`   | string | Yes      | UUID of the gem/item to bid on                 |
| `amount`    | number | Yes      | Bid amount (must be >= `next_min_bid`)         |
| `timestamp` | string | Yes      | ISO 8601 UTC timestamp                         |

### Response

A full [Unified Display Schema](#9-unified-display-schema) is published to `gem-auction/{device_id}/state`.

**On success:** `screen.name = "bid_result"`, `detail.bid.bid_status = "ACCEPTED"`.

**On rejection:** `screen.name = "bid_result"`, `detail.bid.bid_status = "REJECTED"` with a reason code.

### Accepted Response Example

```json
{
  "screen": {
    "name": "bid_result",
    "state": "success",
    "title": "Bid Accepted",
    "subtitle": "Blue Sapphire 3.2ct",
    "message": "Your bid of LKR 52,500 was accepted"
  },
  "detail": {
    "bid": {
      "item_id": "d1b501ea-1298-45a0-a2c9-2a3af70ec192",
      "amount": 52500.00,
      "currency": "LKR",
      "bid_status": "ACCEPTED",
      "current_highest_bid": 52500.00,
      "next_min_bid": 55000.00,
      "reason_code": null,
      "reason_label": null
    }
  },
  "feedback": {
    "status": "success",
    "code": null,
    "label": null,
    "message": "Bid accepted"
  },
  "actions": {
    "primary": "submit_bid",
    "secondary": "refresh",
    "back": true
  }
}
```

### Rejected Response Example (bid too low)

```json
{
  "screen": {
    "name": "bid_result",
    "state": "success",
    "title": "Bid Rejected",
    "subtitle": "Blue Sapphire 3.2ct",
    "message": "Minimum bid is 52500"
  },
  "detail": {
    "bid": {
      "item_id": "d1b501ea-1298-45a0-a2c9-2a3af70ec192",
      "amount": 40000.00,
      "currency": "LKR",
      "bid_status": "REJECTED",
      "current_highest_bid": 50000.00,
      "next_min_bid": 52500.00,
      "reason_code": 13,
      "reason_label": "Minimum bid is 52500"
    }
  },
  "feedback": {
    "status": "error",
    "code": 13,
    "label": "Minimum bid is 52500",
    "message": "Minimum bid is 52500"
  },
  "actions": {
    "primary": "submit_bid",
    "secondary": "refresh",
    "back": true
  }
}
```

---

## 6. API: Heartbeat

Sent periodically to report device health. **No response is returned.**

### Publish

**Topic:** `gem-auction/{device_id}/heartbeat`

```json
{
  "action": "heartbeat",
  "device_id": "AuxtionDevice",
  "firmware_version": "1.0.0",
  "uptime_seconds": 3600,
  "free_heap": 150000,
  "wifi_rssi": -42,
  "timestamp": "2026-03-08T10:30:00Z"
}
```

| Field              | Type   | Required | Description                              |
|--------------------|--------|----------|------------------------------------------|
| `action`           | string | Yes      | Always `"heartbeat"`                     |
| `device_id`        | string | Yes      | This device's Thing Name                 |
| `firmware_version` | string | No       | Current firmware version                 |
| `uptime_seconds`   | number | No       | Seconds since last boot                  |
| `free_heap`        | number | No       | Free heap memory in bytes                |
| `wifi_rssi`        | number | No       | WiFi signal strength in dBm              |
| `timestamp`        | string | Yes      | ISO 8601 UTC timestamp                   |

### Response

None. The server updates the device's `last_seen_at` timestamp and firmware version in the database.

### Recommended interval

Send a heartbeat every **30 seconds**. Sessions that have not received any activity for 4 hours are automatically expired by the server.

---

## 7. API: State Response (Inbound)

**Topic:** `gem-auction/{device_id}/state`

This is the primary response channel. The device receives messages here after publishing an NFC scan or bid submit. The payload is always a full [Unified Display Schema](#9-unified-display-schema).

### How to determine what happened

Check `screen.name` to decide which screen to render:

| `screen.name`    | Trigger                      | What to display                  |
|------------------|------------------------------|----------------------------------|
| `auction_items`  | Successful NFC scan          | Auction info + item list         |
| `nfc_access`     | Failed NFC scan              | Error message                    |
| `bid_result`     | Bid response                 | Bid accepted/rejected            |
| `startup`        | Initial state                | Device info                      |

Check `screen.state` for the overall result:

| `screen.state` | Meaning                   |
|-----------------|--------------------------|
| `success`       | Operation succeeded      |
| `error`         | Operation failed         |
| `loading`       | Processing (optional)    |
| `idle`          | No active operation      |

---

## 8. API: Auction Update (Inbound)

**Topic:** `gem-auction/{device_id}/auction/update`

This topic receives **server-initiated push messages** when the auction state changes (e.g. new bid from another user, item status change, round ended). The device does NOT request these -- they arrive automatically while a session is active.

The payload is the same [Unified Display Schema](#9-unified-display-schema) with:
- `screen.name = "auction_items"`
- Updated `lists.items` with latest prices
- Updated `detail.item` with the current active item
- `user` is `null` (user context is not included in push updates)

### When updates are sent

- A new bid is placed (from any user, web or device)
- An item status changes (e.g. `active` to `ended`)
- The auction status changes (e.g. `live` to `ended`)
- An admin starts/ends a bidding round

### Recommended handling

When a message arrives on this topic, update the display with the new item prices and status. Do NOT clear the user context -- the device should retain the user info from the original NFC scan.

---

## 9. Unified Display Schema

Every response from the server follows this structure. Fields that are not relevant to the current screen are set to `null` or empty arrays.

```
{
  screen          -- Which screen to render and its state
  device          -- Device metadata
  session         -- Transport session info
  user            -- Authenticated user info (null if no scan)
  context         -- Active auction/item IDs
  lists           -- Array data for list views
    .auctions[]
    .items[]
  detail          -- Single-object detail data
    .auction
    .item
    .bid
    .update
  feedback        -- User-facing status message
  actions         -- Button hints
}
```

### Field Reference

#### `screen`

| Field      | Type   | Description                                  |
|------------|--------|----------------------------------------------|
| `name`     | string | Screen identifier (see table in section 7)   |
| `state`    | string | `"success"`, `"error"`, `"loading"`, `"idle"` |
| `title`    | string | Primary heading text                         |
| `subtitle` | string | Secondary heading text (nullable)            |
| `message`  | string | Descriptive message (nullable)               |

#### `user`

| Field                | Type    | Description                           |
|----------------------|---------|---------------------------------------|
| `nfc_uid`            | string  | NFC card UID that was scanned         |
| `user_id`            | string  | User UUID (null on error)             |
| `role`               | string  | User role (null on error)             |
| `access_granted`     | boolean | Whether access was granted            |
| `access_status`      | string  | `"success"` or `"error"`              |
| `access_reason_code` | number  | Error code (null on success)          |
| `access_reason_label`| string  | Human-readable error (null on success)|

#### `context`

| Field               | Type   | Description                              |
|---------------------|--------|------------------------------------------|
| `active_auction_id` | string | UUID of the current auction (nullable)   |
| `active_item_id`    | string | UUID of the active item (nullable)       |

#### `lists.items[]`

Each item in the array:

| Field              | Type    | Description                                |
|--------------------|---------|--------------------------------------------|
| `item_id`          | string  | Item UUID                                  |
| `name`             | string  | Item display name                          |
| `status`           | string  | `"active"`, `"completed"`, `"ended"`, etc. |
| `current_price`    | number  | Current highest price (LKR)                |
| `currency`         | string  | Always `"LKR"`                             |
| `next_min_bid`     | number  | Minimum accepted bid amount                |
| `end_datetime`     | string  | Round/item end time ISO 8601 (nullable)    |
| `remaining_seconds`| number  | Seconds until end (nullable)               |
| `your_bid_submitted`| boolean| Whether this user already bid (nullable)  |

#### `detail.bid`

Present only in bid result responses:

| Field               | Type   | Description                              |
|---------------------|--------|------------------------------------------|
| `item_id`           | string | Item the bid was placed on               |
| `amount`            | number | Bid amount submitted                     |
| `currency`          | string | Always `"LKR"`                           |
| `bid_status`        | string | `"ACCEPTED"` or `"REJECTED"`            |
| `current_highest_bid`| number| Current highest bid after this attempt   |
| `next_min_bid`      | number | New minimum bid amount                   |
| `reason_code`       | number | Rejection reason code (null if accepted) |
| `reason_label`      | string | Rejection reason text (null if accepted) |

#### `feedback`

| Field     | Type   | Description                              |
|-----------|--------|------------------------------------------|
| `status`  | string | `"success"`, `"error"`, `"warning"`, `"info"` |
| `code`    | number | Error/status code (nullable)             |
| `label`   | string | Short label (nullable)                   |
| `message` | string | Human-readable message (nullable)        |

#### `actions`

| Field       | Type    | Description                             |
|-------------|---------|-----------------------------------------|
| `primary`   | string  | Primary action hint (nullable)          |
| `secondary` | string  | Secondary action hint (nullable)        |
| `back`      | boolean | Whether a back/return action is available |

Possible action values: `"submit_bid"`, `"refresh"`, `"scan_nfc"`, `"select_auction"`

---

## 10. Error Codes

These appear in `feedback.code` and `user.access_reason_code`:

| Code | Label                    | Description                                        | User Action              |
|------|--------------------------|----------------------------------------------------|--------------------------|
| 1    | Device Not Registered    | This device ID is not in the system                | Contact administrator    |
| 2    | Device Inactive          | Device exists but is disabled                      | Contact administrator    |
| 3    | Card Not Recognized      | NFC card UID not found in the database             | Use a registered card    |
| 4    | No Auction Assigned      | Card exists but has no auction mapped              | Contact administrator    |
| 5    | User Not Found           | User account associated with card was deleted      | Contact administrator    |
| 6    | Auction Not Found        | The assigned auction no longer exists               | Contact administrator    |
| 7    | Auction Not Live         | Auction exists but is not currently live            | Wait for auction to start|
| 8    | Not Registered           | User is not registered for this auction            | Register via web app     |
| 9    | Registration Pending     | Registration not yet approved by admin             | Wait for approval        |
| 10   | No Active Session        | Bid attempted without a prior NFC scan             | Scan NFC card first      |
| 11   | Item Not Found           | The item_id in the bid does not exist              | Refresh item list        |
| 12   | Item Not Active          | Item exists but bidding is not open                | Wait for item to go live |
| 13   | Bid Too Low              | Amount is below the minimum required bid           | Increase bid amount      |
| 14   | Bidder On Hold           | Admin has placed a hold on this user's bidding     | Contact administrator    |
| 15   | Bid Failed               | Server error while inserting the bid               | Retry                    |

---

## 11. Device Lifecycle

### Boot Sequence

```
1. Connect to WiFi
2. Configure TLS with certificates (Root CA + device cert + private key)
3. Connect to MQTT broker with Client ID = Thing Name
4. Subscribe to:
   - gem-auction/{device_id}/state
   - gem-auction/{device_id}/auction/update
5. Display startup/idle screen
6. Begin heartbeat timer (every 30 seconds)
7. Wait for NFC card scan
```

### Active Session Flow

```
1. User taps NFC card
2. Publish to gem-auction/{device_id}/nfc/scan
3. Wait for response on .../state (timeout: 10 seconds)
4. If success: display auction items screen
5. User presses bid button
6. Publish to gem-auction/{device_id}/bid/submit
7. Wait for response on .../state (timeout: 10 seconds)
8. Display bid result
9. Listen for push updates on .../auction/update
10. Repeat from step 5 for additional bids
```

### Reconnection

If the MQTT connection drops:
1. Attempt reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
2. After reconnect, resubscribe to both inbound topics
3. If a user session was active, re-publish the NFC scan to refresh state

---

## 12. Firmware Architecture Recommendation

We recommend separating firmware into four layers:

```
┌─────────────────────────────┐
│       Display Renderer      │  Renders screens based on screen.name
├─────────────────────────────┤
│    Display Schema Mapper    │  Maps UnifiedDisplaySchema to UI state
├─────────────────────────────┤
│      Protocol Parser        │  Parses JSON payloads
├─────────────────────────────┤
│     Transport Handler       │  MQTT connection, TLS, topic management
└─────────────────────────────┘
```

This separation ensures that:
- Protocol changes don't cascade into display code
- The display renderer only cares about `screen.name` and the populated data fields
- The transport layer handles connection, reconnection, and topic routing independently

### Key libraries (Arduino/PlatformIO)

| Library          | Purpose                    |
|------------------|----------------------------|
| `WiFiClientSecure` | TLS connection with certificates |
| `PubSubClient`   | MQTT 3.1.1 client          |
| `ArduinoJson`    | JSON parsing/serialization |
| `TFT_eSPI` or `LVGL` | Display rendering     |

---

## Testing

Before connecting the physical device, you can test all APIs using the **AWS IoT Core MQTT Test Client** in the AWS Console:

1. Open: https://ap-southeast-1.console.aws.amazon.com/iot/home?region=ap-southeast-1#/test
2. Subscribe to `gem-auction/AuxtionDevice/#`
3. Publish test payloads to the outbound topics listed above
4. Observe responses in the subscription panel

This tests the full backend pipeline (Topic Rules, Lambda, Supabase) without needing a physical device.
