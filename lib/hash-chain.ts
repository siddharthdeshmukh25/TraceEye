import crypto from 'crypto';

/**
 * Create SHA-256 hash of data
 * @param data - String data to hash
 * @returns Hexadecimal hash string
 */
export function createHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Create canonical string representation of event data for consistent hashing
 * @param event - Event object with relevant fields
 * @returns Canonical string representation
 */
export function canonicalizeEvent(event: {
  batchId: string;
  eventType: string;
  timestamp: string | Date;
  handler?: string;
  location?: string;
  weight?: number;
  temperature?: number;
  humidity?: number;
  previousHash?: string;
}): string {
  const timestamp = event.timestamp instanceof Date ? event.timestamp.toISOString() : event.timestamp;
  
  // Sort keys and create consistent string representation
  const fields = [
    `batchId:${event.batchId}`,
    `eventType:${event.eventType}`,
    `timestamp:${timestamp}`,
  ];
  
  if (event.handler) fields.push(`handler:${event.handler}`);
  if (event.location) fields.push(`location:${event.location}`);
  if (event.weight !== undefined) fields.push(`weight:${event.weight}`);
  if (event.temperature !== undefined) fields.push(`temperature:${event.temperature}`);
  if (event.humidity !== undefined) fields.push(`humidity:${event.humidity}`);
  if (event.previousHash) fields.push(`previousHash:${event.previousHash}`);
  
  return fields.join('|');
}

/**
 * Create hash chain entry for an event
 * @param eventData - Event data
 * @param previousHash - Hash of previous event in chain
 * @returns Current hash and canonical data
 */
export function createHashChainEntry(
  eventData: {
    batchId: string;
    eventType: string;
    timestamp: string | Date;
    handler?: string;
    location?: string;
    weight?: number;
    temperature?: number;
    humidity?: number;
  },
  previousHash: string | null = null
): { currentHash: string; canonicalData: string } {
  const canonicalData = canonicalizeEvent({
    ...eventData,
    previousHash: previousHash || undefined
  });
  
  const currentHash = createHash(canonicalData);
  
  return { currentHash, canonicalData };
}

/**
 * Verify hash chain integrity
 * @param events - Array of events with hash information
 * @returns Verification result with details
 */
export function verifyHashChain(events: Array<{
  _id?: string;
  batch_id: string;
  event_type: string;
  created_at: Date;
  handler?: string;
  location?: string;
  weight_kg?: number;
  temperature?: number;
  humidity?: number;
  integrity_hash?: string;
  previous_hash?: string;
}>): {
  valid: boolean;
  breakPoint: number | null;
  details: Array<{
    index: number;
    eventId: string;
    expectedHash: string;
    actualHash: string;
    valid: boolean;
  }>;
} {
  const details = [];
  let breakPoint: number | null = null;
  
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const previousHash = i > 0 ? events[i - 1].integrity_hash : null;
    
    // Recreate expected hash
    const { currentHash: expectedHash } = createHashChainEntry(
      {
        batchId: event.batch_id.toString(),
        eventType: event.event_type,
        timestamp: event.created_at,
        handler: event.handler,
        location: event.location,
        weight: event.weight_kg,
        temperature: event.temperature,
        humidity: event.humidity,
      },
      previousHash
    );
    
    const actualHash = event.integrity_hash || '';
    const valid = expectedHash === actualHash;
    
    details.push({
      index: i,
      eventId: event._id?.toString() || `event-${i}`,
      expectedHash,
      actualHash,
      valid
    });
    
    if (!valid && breakPoint === null) {
      breakPoint = i;
    }
  }
  
  return {
    valid: breakPoint === null,
    breakPoint,
    details
  };
}

/**
 * Generate initial hash for batch creation
 * @param batchData - Batch creation data
 * @returns Initial hash for the chain
 */
export function createInitialBatchHash(batchData: {
  publicId: string;
  productName: string;
  originName: string;
  quantity: number;
  qualityGrade: string;
  createdAt: Date;
}): string {
  const canonicalData = canonicalizeEvent({
    batchId: batchData.publicId,
    eventType: 'batch_created',
    timestamp: batchData.createdAt,
    handler: 'system',
    location: batchData.originName,
    weight: batchData.quantity,
  });
  
  return createHash(canonicalData);
}