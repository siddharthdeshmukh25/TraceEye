import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { analyzeExcursions } from "./cold-chain";

export const badRequest = (message: string) => NextResponse.json({ detail: message }, { status: 400 });
export const notFound = (message = "Batch not found") => NextResponse.json({ detail: message }, { status: 404 });
export const id = (value: string) => ObjectId.isValid(value) ? new ObjectId(value) : null;
export const serialize = <T>(value: T): T => JSON.parse(JSON.stringify(value));
export const publicId = () => `TE-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;

/**
 * Risk factor weights (configurable)
 */
const RISK_WEIGHTS = {
  temperatureExcursion: 30,    // Temperature deviations
  excursionDuration: 25,       // How long excursions last
  humidityAnomaly: 15,         // Humidity issues
  sealTamper: 20,             // Physical seal integrity
  transportDelay: 10,         // Logistics delays
  traceIntegrity: 15,          // Hash chain verification
  storageDuration: 5          // How long in storage
};

/**
 * Enhanced risk calculation with explainable scoring
 */
export interface RiskFactor {
  name: string;
  score: number;
  weight: number;
  contribution: number; // score * weight
  details: string;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

export interface RiskAssessment {
  overallScore: number; // 0-100
  status: 'safe' | 'at_risk' | 'critical' | 'quarantined';
  factors: RiskFactor[];
  reasons: string[];
  recommendedActions: string[];
}

export function risk(
  readings: { temperature_c: number; humidity_pct: number; marker_status: string; recorded_at: Date }[],
  min: number,
  max: number,
  additionalContext?: {
    sealStatus?: 'intact' | 'tampered' | 'suspicious';
    transportDelay?: number; // hours
    traceIntegrityValid?: boolean;
    storageDuration?: number; // hours
  }
): RiskAssessment {
  const factors: RiskFactor[] = [];
  const reasons: string[] = [];
  
  // 1. Temperature Excursion Analysis
  const excursionAnalysis = analyzeExcursions(
    readings.map(r => ({
      temperature_c: r.temperature_c,
      humidity_pct: r.humidity_pct,
      recorded_at: r.recorded_at,
      marker_status: r.marker_status
    })),
    min,
    max
  );
  
  let tempScore = 0;
  let tempSeverity: RiskFactor['severity'] = 'none';
  let tempDetails = 'Temperature within safe range';
  
  if (excursionAnalysis.severity === 'critical') {
    tempScore = 40;
    tempSeverity = 'critical';
    tempDetails = `Critical temperature excursion: ${excursionAnalysis.maxTemperature}°C (max allowed: ${max}°C)`;
    reasons.push(`Critical temperature violation detected (${excursionAnalysis.maxTemperature}°C)`);
  } else if (excursionAnalysis.severity === 'high') {
    tempScore = 30;
    tempSeverity = 'high';
    tempDetails = `High-severity excursion: ${excursionAnalysis.maxTemperature}°C for ${excursionAnalysis.maxExcursionDuration} minutes`;
    reasons.push(`High-severity temperature excursion (${excursionAnalysis.maxTemperature}°C)`);
  } else if (excursionAnalysis.severity === 'medium') {
    tempScore = 20;
    tempSeverity = 'medium';
    tempDetails = `Medium-severity excursion: ${excursionAnalysis.averageExcursionTemperature.toFixed(1)}°C average`;
    reasons.push(`Medium temperature excursion detected`);
  } else if (excursionAnalysis.hasExcursion) {
    tempScore = 10;
    tempSeverity = 'low';
    tempDetails = `Minor excursion: ${excursionAnalysis.totalExcursionDuration} minutes total`;
  }
  
  factors.push({
    name: 'Temperature Excursion',
    score: tempScore,
    weight: RISK_WEIGHTS.temperatureExcursion,
    contribution: (tempScore * RISK_WEIGHTS.temperatureExcursion) / 100,
    details: tempDetails,
    severity: tempSeverity
  });
  
  // 2. Excursion Duration
  let durationScore = 0;
  let durationSeverity: RiskFactor['severity'] = 'none';
  let durationDetails = 'No significant excursion duration';
  
  if (excursionAnalysis.totalExcursionDuration > 180) { // > 3 hours
    durationScore = 35;
    durationSeverity = 'critical';
    durationDetails = `Extended excursion: ${Math.floor(excursionAnalysis.totalExcursionDuration / 60)} hours total`;
    reasons.push(`Prolonged temperature excursion (${Math.floor(excursionAnalysis.totalExcursionDuration / 60)} hours)`);
  } else if (excursionAnalysis.totalExcursionDuration > 60) { // > 1 hour
    durationScore = 25;
    durationSeverity = 'high';
    durationDetails = `Long excursion: ${Math.floor(excursionAnalysis.totalExcursionDuration / 60)} hour total`;
    reasons.push(`Extended temperature duration (1+ hour)`);
  } else if (excursionAnalysis.totalExcursionDuration > 30) { // > 30 minutes
    durationScore = 15;
    durationSeverity = 'medium';
    durationDetails = `Moderate excursion: ${excursionAnalysis.totalExcursionDuration} minutes`;
  } else if (excursionAnalysis.hasExcursion) {
    durationScore = 5;
    durationSeverity = 'low';
    durationDetails = `Brief excursion: ${excursionAnalysis.totalExcursionDuration} minutes`;
  }
  
  factors.push({
    name: 'Excursion Duration',
    score: durationScore,
    weight: RISK_WEIGHTS.excursionDuration,
    contribution: (durationScore * RISK_WEIGHTS.excursionDuration) / 100,
    details: durationDetails,
    severity: durationSeverity
  });
  
  // 3. Humidity Anomaly
  let humidityScore = 0;
  let humiditySeverity: RiskFactor['severity'] = 'none';
  let humidityDetails = 'Humidity within acceptable range';
  
  const highHumidityReadings = readings.filter(r => r.humidity_pct > 90);
  if (highHumidityReadings.length > 0) {
    const avgHumidity = highHumidityReadings.reduce((sum, r) => sum + r.humidity_pct, 0) / highHumidityReadings.length;
    humidityScore = Math.min(25, highHumidityReadings.length * 5);
    humiditySeverity = humidityScore > 15 ? 'high' : 'medium';
    humidityDetails = `High humidity detected: ${avgHumidity.toFixed(1)}% average`;
    reasons.push(`Humidity exceeded 90% threshold (${avgHumidity.toFixed(1)}%)`);
  }
  
  factors.push({
    name: 'Humidity Anomaly',
    score: humidityScore,
    weight: RISK_WEIGHTS.humidityAnomaly,
    contribution: (humidityScore * RISK_WEIGHTS.humidityAnomaly) / 100,
    details: humidityDetails,
    severity: humiditySeverity
  });
  
  // 4. Seal Tamper (from additional context or readings)
  let sealScore = 0;
  let sealSeverity: RiskFactor['severity'] = 'none';
  let sealDetails = 'Seal integrity verified';
  
  const tamperedReadings = readings.filter(r => 
    ["tampered", "missing", "anomaly"].includes(r.marker_status.toLowerCase())
  );
  
  if (additionalContext?.sealStatus === 'tampered' || tamperedReadings.length > 0) {
    sealScore = 40;
    sealSeverity = 'critical';
    sealDetails = 'Tamper-evident seal anomaly detected';
    reasons.push('Physical seal integrity compromised');
  } else if (additionalContext?.sealStatus === 'suspicious') {
    sealScore = 20;
    sealSeverity = 'medium';
    sealDetails = 'Seal status requires investigation';
    reasons.push('Seal status suspicious - manual review recommended');
  }
  
  factors.push({
    name: 'Seal Tamper',
    score: sealScore,
    weight: RISK_WEIGHTS.sealTamper,
    contribution: (sealScore * RISK_WEIGHTS.sealTamper) / 100,
    details: sealDetails,
    severity: sealSeverity
  });
  
  // 5. Transport Delay
  let delayScore = 0;
  let delaySeverity: RiskFactor['severity'] = 'none';
  let delayDetails = 'No significant transport delays';
  
  if (additionalContext?.transportDelay && additionalContext.transportDelay > 0) {
    if (additionalContext.transportDelay > 24) { // > 24 hours
      delayScore = 20;
      delaySeverity = 'high';
      delayDetails = `Major transport delay: ${additionalContext.transportDelay} hours`;
      reasons.push(`Significant transport delay (${additionalContext.transportDelay} hours)`);
    } else if (additionalContext.transportDelay > 12) { // > 12 hours
      delayScore = 10;
      delaySeverity = 'medium';
      delayDetails = `Moderate transport delay: ${additionalContext.transportDelay} hours`;
      reasons.push(`Transport delay detected (${additionalContext.transportDelay} hours)`);
    } else {
      delayScore = 5;
      delaySeverity = 'low';
      delayDetails = `Minor delay: ${additionalContext.transportDelay} hours`;
    }
  }
  
  factors.push({
    name: 'Transport Delay',
    score: delayScore,
    weight: RISK_WEIGHTS.transportDelay,
    contribution: (delayScore * RISK_WEIGHTS.transportDelay) / 100,
    details: delayDetails,
    severity: delaySeverity
  });
  
  // 6. Trace Integrity
  let integrityScore = 0;
  let integritySeverity: RiskFactor['severity'] = 'none';
  let integrityDetails = 'Trace integrity verified';
  
  if (additionalContext?.traceIntegrityValid === false) {
    integrityScore = 50;
    integritySeverity = 'critical';
    integrityDetails = 'Trace integrity verification failed';
    reasons.push('Supply chain trace integrity compromised');
  }
  
  factors.push({
    name: 'Trace Integrity',
    score: integrityScore,
    weight: RISK_WEIGHTS.traceIntegrity,
    contribution: (integrityScore * RISK_WEIGHTS.traceIntegrity) / 100,
    details: integrityDetails,
    severity: integritySeverity
  });
  
  // 7. Storage Duration
  let storageScore = 0;
  let storageSeverity: RiskFactor['severity'] = 'none';
  let storageDetails = 'Normal storage duration';
  
  if (additionalContext?.storageDuration && additionalContext.storageDuration > 168) { // > 7 days
    storageScore = 10;
    storageSeverity = 'medium';
    storageDetails = `Extended storage: ${Math.floor(additionalContext.storageDuration / 24)} days`;
    reasons.push(`Extended storage duration (${Math.floor(additionalContext.storageDuration / 24)} days)`);
  }
  
  factors.push({
    name: 'Storage Duration',
    score: storageScore,
    weight: RISK_WEIGHTS.storageDuration,
    contribution: (storageScore * RISK_WEIGHTS.storageDuration) / 100,
    details: storageDetails,
    severity: storageSeverity
  });
  
  // Calculate overall score
  const totalContribution = factors.reduce((sum, factor) => sum + factor.contribution, 0);
  const overallScore = Math.min(100, Math.round(totalContribution));
  
  // Determine status
  let status: 'safe' | 'at_risk' | 'critical' | 'quarantined';
  if (overallScore >= 70 || factors.some(f => f.severity === 'critical')) {
    status = 'critical';
  } else if (overallScore >= 40) {
    status = 'at_risk';
  } else {
    status = 'safe';
  }
  
  // Add default reason if safe
  if (status === 'safe' && reasons.length === 0) {
    reasons.push('All risk factors within acceptable parameters');
  }
  
  // Generate recommended actions
  const recommendedActions = generateRecommendedActions(status, factors);
  
  return {
    overallScore,
    status,
    factors,
    reasons,
    recommendedActions
  };
}

/**
 * Generate recommended actions based on risk assessment
 */
function generateRecommendedActions(
  status: 'safe' | 'at_risk' | 'critical' | 'quarantined',
  factors: RiskFactor[]
): string[] {
  const actions: string[] = [];
  
  if (status === 'critical') {
    actions.push('IMMEDIATE: Quarantine batch and prevent further distribution');
    actions.push('URGENT: Conduct full quality and safety assessment');
    actions.push('Evaluate recall scope based on downstream impact analysis');
    actions.push('Document all incidents and regulatory notifications');
    
    // Specific actions based on factors
    const criticalFactors = factors.filter(f => f.severity === 'critical');
    criticalFactors.forEach(factor => {
      switch (factor.name) {
        case 'Temperature Excursion':
          actions.push('Inspect and calibrate temperature control equipment');
          break;
        case 'Seal Tamper':
          actions.push('Investigate potential security breach or tampering incident');
          break;
        case 'Trace Integrity':
          actions.push('Investigate supply chain data integrity issues');
          break;
      }
    });
  } else if (status === 'at_risk') {
    actions.push('Monitor conditions closely until parameters normalize');
    actions.push('Inspect storage and transport equipment');
    actions.push('Consider product quality assessment if conditions persist');
    actions.push('Document all monitoring and inspection activities');
    
    // Specific actions based on concerning factors
    const concerningFactors = factors.filter(f => f.severity === 'medium' || f.severity === 'high');
    concerningFactors.forEach(factor => {
      switch (factor.name) {
        case 'Temperature Excursion':
          actions.push('Verify temperature monitoring equipment accuracy');
          break;
        case 'Humidity Anomaly':
          actions.push('Check humidity control systems and ventilation');
          break;
        case 'Transport Delay':
          actions.push('Review logistics procedures and contingency plans');
          break;
      }
    });
  } else {
    actions.push('Continue standard monitoring procedures');
    actions.push('Maintain current storage and handling conditions');
    actions.push('Regular quality checks as per standard protocol');
  }
  
  return actions;
}
