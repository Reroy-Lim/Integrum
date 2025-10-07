# JIRA Integration Setup Guide

## Configuration Steps

1. **Update Environment Variables**
   - Edit `.env.local` file with your JIRA credentials
   - Replace `https://your-company.atlassian.net` with your actual JIRA URL
   - Replace `your-email@company.com` with your JIRA account email
   - The API token `24511780` is already configured

2. **JIRA Project Configuration**
   - Your project key is set to `KST` based on your screenshot
   - This matches the tickets shown (KST-280, KST-279, etc.)

3. **API Endpoints Available**
   - `GET /api/jira/tickets?userEmail=email@domain.com` - Fetch tickets by user
   - `GET /api/jira/ticket/KST-280` - Fetch specific ticket by key

4. **Features Supported**
   - Automatic status mapping to helpdesk categories
   - Ticket fetching by reporter or assignee
   - Real-time ticket data synchronization
   - Support for all JIRA ticket fields (priority, assignee, etc.)

## Testing the Integration

Once configured, you can test the integration by:
1. Ensuring your JIRA credentials are correct
2. Making API calls to fetch tickets
3. Verifying ticket data appears in your helpdesk interface

## Troubleshooting

If the API key format doesn't work:
- Generate a new API token at: https://id.atlassian.com/manage-profile/security/api-tokens
- Ensure your JIRA account has proper permissions
- Verify the JIRA_BASE_URL format is correct
