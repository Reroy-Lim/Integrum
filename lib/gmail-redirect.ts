export class GmailRedirectHandler {
  static generateGmailComposeUrl(
    to: string,
    subject: string,
    body: string,
    customerEmail: string,
    userEmail?: string,
  ): string {
    const params = new URLSearchParams({
      to,
      su: subject,
      body: `${body}\n\nFrom: ${customerEmail}`,
    })

    // Direct Gmail compose URL without OAuth wrapper
    const accountPath = userEmail ? `/u/${userEmail}/` : "/"
    return `https://mail.google.com/mail${accountPath}?view=cm&fs=1&${params.toString()}`
  }

  static generateAccountSwitchUrl(
    to: string,
    subject: string,
    body: string,
    customerEmail: string,
    userEmail?: string,
  ): string {
    const params = new URLSearchParams({
      to,
      su: subject,
      body: `${body}\n\nFrom: ${customerEmail}`,
    })

    // Use Gmail's account switcher (authuser=0 forces account selection)
    const accountPath = userEmail ? `/u/${userEmail}/` : "/u/0/"
    return `https://mail.google.com/mail${accountPath}?authuser=0&view=cm&fs=1&${params.toString()}`
  }

  static generateAddAccountUrl(
    to: string,
    subject: string,
    body: string,
    customerEmail: string,
    userEmail?: string,
  ): string {
    const params = new URLSearchParams({
      to,
      su: subject,
      body: `${body}\n\nFrom: ${customerEmail}`,
    })

    // This creates the final Gmail compose URL that will be used after account selection
    const accountPath = userEmail ? `/u/${userEmail}/` : "/"
    const finalGmailUrl = `https://mail.google.com/mail${accountPath}?view=cm&fs=1&${params.toString()}`

    // Direct redirect to Google's account chooser - shows all signed-in accounts
    return `https://accounts.google.com/v3/signin/accountchooser?continue=${encodeURIComponent(finalGmailUrl)}&service=mail`
  }

  static generateReturnUrl(ticketId: string): string {
    const baseUrl = window.location.origin
    const returnParams = new URLSearchParams({
      view: "yourTickets",
      ticket: ticketId,
      timestamp: Date.now().toString(),
    })

    return `${baseUrl}/?${returnParams.toString()}`
  }

  static createGmailInstructions(ticketId: string, customerEmail: string) {
    const returnUrl = this.generateReturnUrl(ticketId)

    return {
      instructions: [
        "1. Send your email in Gmail",
        "2. Wait for auto-acknowledgement from heyroy23415@gmail.com (usually 1-5 minutes)",
        "3. Click the link below to return to your ticket page",
        "4. We'll verify the timing matches your submission",
      ],
      returnUrl,
      expectedSender: "heyroy23415@gmail.com",
      timeWindow: "1-5 minutes",
    }
  }
}
