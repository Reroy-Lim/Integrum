// Server-side in-memory store for acknowledgements
// In production, this should be replaced with a database or Redis
class AcknowledgementStore {
  private store = new Map<string, any>()

  set(email: string, data: any) {
    this.store.set(email, data)
  }

  get(email: string) {
    return this.store.get(email)
  }

  delete(email: string) {
    return this.store.delete(email)
  }

  has(email: string) {
    return this.store.has(email)
  }
}

// Create a singleton instance
const acknowledgementStore = new AcknowledgementStore()

export default acknowledgementStore
