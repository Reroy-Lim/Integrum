export class GmailRedirectHandler {
  static generateGmailComposeUrl(to: string, subject: string, body: string, customerEmail: string): string {
    const params = new URLSearchParams({
      to,
      su: subject,
      body: `${body}\n\nFrom: ${customerEmail}`,
      authuser: customerEmail, // Force Gmail to use this specific account
    })

    return `https://mail.google.com/mail/?view=cm&fs=1&${params.toString()}`
  }

  static generateAccountSwitchUrl(to: string, subject: string, body: string, customerEmail: string): string {
    const params = new URLSearchParams({
      to,
      su: subject,
      body: `${body}\n\nFrom: ${customerEmail}`,
    })

    // Use Gmail's account switcher with the specific email
    return `https://mail.google.com/mail/?authuser=${encodeURIComponent(customerEmail)}&view=cm&fs=1&${params.toString()}`
  }

  static generateAddAccountUrl(to: string, subject: string, body: string, customerEmail: string): string {
    const params = new URLSearchParams({
      to,
      su: subject,
      body: `${body}\n\nFrom: ${customerEmail}`,
      authuser: customerEmail, // Force Gmail to use this specific account after login
    })

    const finalGmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&${params.toString()}`

    return `https://accounts.google.com/v3/signin/accountchooser?Email=${encodeURIComponent(customerEmail)}&continue=${encodeURIComponent(finalGmailUrl)}&service=mail`
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
