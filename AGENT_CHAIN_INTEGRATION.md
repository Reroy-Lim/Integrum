# Agent Chain Integration Guide

## Auto-Acknowledgement Detection System with Date/Time Verification

This system detects when the Agent Chain workflow has sent an auto-acknowledgement email, verifies the timing matches the ticket creation, fetches the latest ticket, and redirects the customer to the specific ticket page.

### How it Works

1. **Agent Chain Workflow**: Processes incoming email and creates JIRA ticket
2. **Latest Ticket Fetching**: System automatically fetches the most recent ticket for the user
3. **Date/Time Verification**: System verifies the acknowledgement email timestamp matches the ticket creation time
4. **Agent Chain Webhook**: The Agent Chain workflow calls our webhook endpoint after sending the auto-acknowledgement:
   \`\`\`
   POST /api/acknowledgement/webhook
   \`\`\`

5. **Enhanced Webhook Payload**: The Agent Chain should send this JSON payload with timestamp:
   \`\`\`json
   {
     "customerEmail": "customer@example.com",
     "ticketId": "KST-123",
     "messageId": "gmail-message-id",
     "status": "acknowledgement_sent",
     "emailTimestamp": "2025-01-09T10:30:00.000Z"
   }
   \`\`\`

6. **Verification Process**: The webhook performs date/time verification:
   - Compares email timestamp with ticket creation time
   - Allows 10-minute tolerance for time differences
   - If no email timestamp provided, checks if ticket was created within last 15 minutes
   - Only stores acknowledgement if verification passes

7. **Latest Ticket Integration**: The webhook automatically fetches the latest ticket using:
   \`\`\`
   GET /api/jira/latest-ticket?userEmail=customer@example.com
   \`\`\`

8. **Status Polling**: The frontend polls the status endpoint every 3 seconds:
   \`\`\`
   GET /api/acknowledgement/status?email=customer@example.com
   \`\`\`

9. **Verified Auto-Redirect**: When acknowledgement is detected AND verified, the system shows the acknowledgement dialog with latest ticket info and redirects to the specific ticket page.

### Date/Time Verification Features

- **Timestamp Matching**: Ensures acknowledgement corresponds to the correct ticket submission
- **Time Tolerance**: 10-minute window to account for processing delays
- **Recent Ticket Fallback**: If no timestamp provided, verifies ticket was created recently (15 minutes)
- **Verification Status**: Clear feedback to users about verification success/failure
- **Retry Mechanism**: Users can retry verification if it initially fails

### Agent Chain Configuration

To integrate with this system, add a webhook node to your Agent Chain workflow after the "Auto-Acknowledgement" node:

1. **Add HTTP Request Node** after the "Auto-Acknowledgement" node
2. **Configure the webhook**:
   - Method: POST
   - URL: `https://your-domain.com/api/acknowledgement/webhook`
   - Headers: `Content-Type: application/json`
   - Body:
     \`\`\`json
     {
       "customerEmail": "{{ $('Gmail Trigger').item.json.from.value[0].address }}",
       "ticketId": "{{ $('Creating issue').item.json.key }}",
       "messageId": "{{ $('Gmail Trigger').item.json.id }}",
       "status": "acknowledgement_sent",
       "emailTimestamp": "{{ $('Gmail Trigger').item.json.internalDate }}"
     }
     \`\`\`

### Latest Ticket Features

- **Automatic Fetching**: Latest ticket is fetched automatically when acknowledgement is received
- **Smart Redirect**: Users are redirected to the specific latest ticket page instead of general tickets page
- **Ticket Display**: Latest ticket information is shown in the acknowledgement dialog
- **Error Handling**: System gracefully handles cases where latest ticket cannot be fetched
- **Verification Display**: Shows verification status and timestamp information

### API Endpoints

#### Get Latest Ticket
\`\`\`
GET /api/jira/latest-ticket?userEmail=customer@example.com
\`\`\`

Response:
\`\`\`json
{
  "ticket": {
    "id": "12345",
    "key": "KST-123",
    "summary": "User reported login issue",
    "status": {
      "name": "Open",
      "statusCategory": {
        "name": "To Do"
      }
    },
    "created": "2025-01-09T10:30:00.000Z",
    "updated": "2025-01-09T10:30:00.000Z",
    "priority": {
      "name": "Medium"
    },
    "issuetype": {
      "name": "Bug"
    }
  }
}
\`\`\`

#### Acknowledgement Status (Enhanced)
\`\`\`
GET /api/acknowledgement/status?email=customer@example.com
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "acknowledged": true,
  "verified": true,
  "data": {
    "ticketId": "KST-123",
    "messageId": "gmail-message-id",
    "timestamp": "2025-01-09T10:31:00.000Z",
    "emailTimestamp": "2025-01-09T10:30:00.000Z",
    "acknowledged": true,
    "verified": true,
    "latestTicket": { /* ticket object */ }
  },
  "latestTicket": { /* ticket object */ }
}
\`\`\`

### Testing

1. Submit a ticket through the system
2. The Agent Chain should process the email and create a JIRA ticket
3. The Agent Chain should send the auto-acknowledgement with timestamp
4. The webhook should be called, which will:
   - Record the acknowledgement status
   - Verify the email timestamp matches ticket creation time (within 10 minutes)
   - Fetch the latest ticket for the user
   - Store both pieces of information only if verification passes
5. The frontend should detect this and show the acknowledgement dialog with verification status
6. After closing the dialog, the user should be redirected to the specific ticket page

### Verification Error Handling

- **Time Mismatch**: If email timestamp doesn't match ticket creation time, verification fails
- **No Recent Ticket**: If no ticket found within 15 minutes, verification fails
- **Missing Timestamp**: System falls back to checking recent ticket creation
- **User Feedback**: Clear error messages explain why verification failed
- **Retry Option**: Users can retry verification process
- **Fallback Navigation**: Users can still access tickets page even if verification fails

### Production Considerations

- Replace the in-memory store with a proper database (Redis, PostgreSQL, etc.)
- Add authentication/authorization to the webhook endpoint
- Implement proper error handling and retry logic for JIRA API calls
- Add logging for debugging and monitoring verification process
- Consider rate limiting for the latest ticket API endpoint
- Implement caching for frequently accessed tickets
- Monitor verification success rates and adjust time tolerances if needed
- Set up alerts for high verification failure rates
</markdown>
