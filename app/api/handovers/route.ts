import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { badRequest, id } from "@/lib/api";
import { verifyToken } from "@/lib/token";
import { createHashChainEntry, verifyHashChain } from "@/lib/hash-chain";

export const runtime = "nodejs";

// Middleware to verify token
function verifyAuth(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  return payload?.id || null;
}

export async function GET(request: Request) {
  try {
    const userId = verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');
    
    const database = await db();
    
    let filter: any = {};
    if (batchId) {
      filter.batch_id = id(batchId);
    }
    
    const handovers = await database.collection("handovers")
      .find(filter)
      .sort({ created_at: 1 })
      .toArray();
      
    // Verify hash chain if we have handovers
    let integrityCheck = null;
    if (handovers.length > 0) {
      // Get batch info for proper hash chain verification
      const batchIds = [...new Set(handovers.map(h => h.batch_id))];
      const batches = await database.collection("batches")
        .find({ _id: { $in: batchIds } })
        .toArray();
      
      const batchMap = new Map(batches.map(b => [b._id.toString(), b]));
      
      // Group handovers by batch and verify each chain
      const handoversByBatch = new Map<string, any[]>();
      handovers.forEach(h => {
        const batchIdStr = h.batch_id.toString();
        if (!handoversByBatch.has(batchIdStr)) {
          handoversByBatch.set(batchIdStr, []);
        }
        handoversByBatch.get(batchIdStr)!.push(h);
      });
      
      const verificationResults = [];
      for (const [batchIdStr, batchHandovers] of handoversByBatch) {
        const batch = batchMap.get(batchIdStr);
        if (batch) {
          const result = verifyHashChain(batchHandovers.map(h => ({
            ...h,
            batch_id: batch.public_id,
            event_type: h.status || 'handover',
            integrity_hash: h.integrity_hash,
            previous_hash: h.previous_hash
          })));
          verificationResults.push({
            batchId: batch.public_id,
            ...result
          });
        }
      }
      
      integrityCheck = verificationResults;
    }
    
    return NextResponse.json({ 
      handovers,
      integrityCheck
    });
  } catch (error) {
    return NextResponse.json({ 
      detail: error instanceof Error ? error.message : "Failed to fetch handovers" 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const { batch_id, receiver, location, weight_kg, status, temperature, humidity } = body;
    
    if (!batch_id || !receiver || !location || !weight_kg) {
      return badRequest("Missing required fields: batch_id, receiver, location, weight_kg");
    }
    
    const database = await db();
    
    // Verify batch exists
    const batch = await database.collection("batches").findOne({ 
      _id: id(batch_id) 
    });
    
    if (!batch) {
      return NextResponse.json({ detail: "Batch not found" }, { status: 404 });
    }
    
    // Get previous handover for hash chain
    const previousHandover = await database.collection("handovers")
      .find({ batch_id: id(batch_id) })
      .sort({ created_at: -1 })
      .limit(1)
      .toArray();
    
    const previousHash = previousHandover.length > 0 ? previousHandover[0].integrity_hash : null;
    
    // Create hash chain entry
    const { currentHash, canonicalData } = createHashChainEntry(
      {
        batchId: batch.public_id,
        eventType: status || 'handover',
        timestamp: new Date(),
        handler: receiver,
        location: location,
        weight: weight_kg,
        temperature: temperature,
        humidity: humidity,
      },
      previousHash
    );
    
    // Create handover record with hash chain
    const handover = {
      batch_id: id(batch_id),
      receiver,
      location,
      weight_kg: Number(weight_kg),
      status: status || 'verified',
      temperature: temperature || null,
      humidity: humidity || null,
      integrity_hash: currentHash,
      previous_hash: previousHash,
      canonical_data: canonicalData,
      created_at: new Date()
    };
    
    const result = await database.collection("handovers").insertOne(handover);
    
    return NextResponse.json({
      id: result.insertedId.toString(),
      ...handover,
      hash_chain_verified: true
    }, { status: 201 });
    
  } catch (error) {
    console.error("Handover creation error:", error);
    return NextResponse.json({ 
      detail: error instanceof Error ? error.message : "Failed to create handover" 
    }, { status: 500 });
  }
}