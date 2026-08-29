import { ObjectId } from 'mongodb';

/**
 * Downstream Impact Analysis Module
 * Traces affected locations, quantities, and entities for smart recalls
 */

export interface AffectedEntity {
  id: string;
  name: string;
  type: 'warehouse' | 'retailer' | 'distributor' | 'store';
  location: string;
  quantity: number;
  contact?: string;
  lastHandover: Date;
}

export interface ImpactAnalysis {
  batch_id: string;
  product_name: string;
  total_affected_quantity: number;
  affected_entities: AffectedEntity[];
  affected_locations: string[];
  supply_chain_tree: SupplyChainNode;
  recall_scope: 'local' | 'regional' | 'national';
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface SupplyChainNode {
  entity: {
    id: string;
    name: string;
    type: string;
    location: string;
  };
  timestamp: Date;
  quantity: number;
  children: SupplyChainNode[];
}

/**
 * Analyze downstream impact for a batch
 */
export async function analyzeDownstreamImpact(
  batchId: ObjectId,
  database: any
): Promise<ImpactAnalysis> {
  // Get batch information
  const batch = await database.collection("batches").findOne({ 
    _id: batchId 
  });
  
  if (!batch) {
    throw new Error("Batch not found");
  }
  
  // Get all handovers for this batch
  const handovers = await database.collection("handovers")
    .find({ batch_id: batchId })
    .sort({ created_at: 1 })
    .toArray();
  
  // Get organizations/receivers information
  const receiverIds = handovers
    .map(h => h.receiver_id)
    .filter(id => id !== null && id !== undefined);
  
  const organizations = await database.collection("organizations")
    .find({ _id: { $in: receiverIds } })
    .toArray();
  
  const orgMap = new Map(
    organizations.map(org => [org._id.toString(), org])
  );
  
  // Build affected entities list
  const affectedEntities: AffectedEntity[] = [];
  const locationSet = new Set<string>();
  
  for (const handover of handovers) {
    const org = orgMap.get(handover.receiver_id?.toString());
    if (org) {
      const entity: AffectedEntity = {
        id: org._id.toString(),
        name: org.name,
        type: determineEntityType(handover.location, org.name),
        location: org.location_name || handover.location,
        quantity: handover.weight_kg,
        contact: org.contact_email,
        lastHandover: handover.created_at
      };
      
      affectedEntities.push(entity);
      locationSet.add(org.location_name || handover.location);
    }
  }
  
  // Build supply chain tree
  const supplyChainTree = buildSupplyChainTree(batch, handovers, orgMap);
  
  // Calculate total affected quantity
  const totalAffectedQuantity = affectedEntities.reduce(
    (sum, entity) => sum + entity.quantity, 
    0
  );
  
  // Determine recall scope
  const recallScope = determineRecallScope(locationSet.size, affectedEntities.length);
  
  // Determine urgency based on batch status and time since last handover
  const urgency = determineUrgency(
    batch.current_status,
    handovers.length > 0 ? handovers[handovers.length - 1].created_at : batch.created_at
  );
  
  return {
    batch_id: batch.public_id,
    product_name: batch.product_name,
    total_affected_quantity: totalAffectedQuantity || batch.initial_quantity_kg,
    affected_entities: affectedEntities,
    affected_locations: Array.from(locationSet),
    supply_chain_tree: supplyChainTree,
    recall_scope,
    urgency
  };
}

/**
 * Determine entity type based on location and name patterns
 */
function determineEntityType(location: string, name: string): AffectedEntity['type'] {
  const locationLower = location.toLowerCase();
  const nameLower = name.toLowerCase();
  
  if (locationLower.includes('warehouse') || nameLower.includes('warehouse')) {
    return 'warehouse';
  }
  if (locationLower.includes('retail') || nameLower.includes('retail') || nameLower.includes('store')) {
    return 'retailer';
  }
  if (locationLower.includes('distrib') || nameLower.includes('distrib')) {
    return 'distributor';
  }
  
  return 'store'; // Default to store
}

/**
 * Build supply chain tree structure
 */
function buildSupplyChainTree(
  batch: any,
  handovers: any[],
  orgMap: Map<string, any>
): SupplyChainNode {
  // Start with producer as root
  const rootNode: SupplyChainNode = {
    entity: {
      id: batch.producer_id?.toString() || 'unknown',
      name: 'Producer/Farm',
      type: 'producer',
      location: batch.origin_name
    },
    timestamp: batch.created_at,
    quantity: batch.initial_quantity_kg,
    children: []
  };
  
  // Add handovers as children
  let currentNode = rootNode;
  
  for (const handover of handovers) {
    const org = orgMap.get(handover.receiver_id?.toString());
    const node: SupplyChainNode = {
      entity: {
        id: handover.receiver_id?.toString() || 'unknown',
        name: org?.name || handover.receiver,
        type: determineEntityType(handover.location, org?.name || ''),
        location: org?.location_name || handover.location
      },
      timestamp: handover.created_at,
      quantity: handover.weight_kg,
      children: []
    };
    
    currentNode.children.push(node);
    currentNode = node;
  }
  
  return rootNode;
}

/**
 * Determine recall scope based on affected locations
 */
function determineRecallScope(
  locationCount: number,
  entityCount: number
): 'local' | 'regional' | 'national' {
  if (locationCount === 1 && entityCount <= 2) {
    return 'local';
  }
  if (locationCount <= 3 && entityCount <= 5) {
    return 'regional';
  }
  return 'national';
}

/**
 * Determine urgency based on status and timing
 */
function determineUrgency(
  status: string,
  lastActivity: Date
): 'low' | 'medium' | 'high' | 'critical' {
  if (status === 'critical') {
    return 'critical';
  }
  
  const hoursSinceActivity = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);
  
  if (status === 'at_risk' && hoursSinceActivity < 24) {
    return 'high';
  }
  
  if (status === 'at_risk' || hoursSinceActivity < 48) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Generate recall notification content
 */
export function generateRecallNotification(analysis: ImpactAnalysis): {
  subject: string;
  message: string;
  recommendedActions: string[];
} {
  const subject = `URGENT: Product Recall - ${analysis.product_name} (${analysis.batch_id})`;
  
  let message = `IMMEDIATE ACTION REQUIRED\n\n`;
  message += `Product: ${analysis.product_name}\n`;
  message += `Batch ID: ${analysis.batch_id}\n`;
  message += `Total Affected Quantity: ${analysis.total_affected_quantity} kg\n`;
  message += `Affected Locations: ${analysis.affected_locations.length}\n`;
  message += `Recall Scope: ${analysis.recall_scope.toUpperCase()}\n`;
  message += `Urgency: ${analysis.urgency.toUpperCase()}\n\n`;
  
  message += `AFFECTED ENTITIES:\n`;
  analysis.affected_entities.forEach((entity, index) => {
    message += `${index + 1}. ${entity.name} (${entity.type})\n`;
    message += `   Location: ${entity.location}\n`;
    message += `   Quantity: ${entity.quantity} kg\n`;
    message += `   Contact: ${entity.contact || 'N/A'}\n\n`;
  });
  
  const recommendedActions = [
    `Immediately stop distribution of batch ${analysis.batch_id}`,
    `Secure all affected inventory at listed locations`,
    `Notify all affected entities in the supply chain`,
    `Initiate quality assessment procedures`,
    `Document all recall activities for regulatory compliance`,
    `Prepare consumer notification if required`
  ];
  
  if (analysis.urgency === 'critical') {
    recommendedActions.unshift('EMERGENCY: Execute immediate recall protocol');
  }
  
  return {
    subject,
    message,
    recommendedActions
  };
}