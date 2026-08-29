/**
 * Dynamic Spoilage Index & Thermal Holdover Algorithm
 * Calculates food spoilage risk and thermal holdover time based on temperature,
 * exposure time, and battery backup capacity.
 */

export interface SpoilageRiskResult {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  spoilageIndex: number; // 0-100 scale
  riskFactors: string[];
  thermalHoldoverTime: number | null; // hours remaining, null if not applicable
  thermalHoldoverMessage: string | null;
}

export interface ThermalHoldoverParams {
  batteryLevel: number; // percentage
  powerLoad: number; // watts
  batteryCapacity: number; // watt-hours
  gridStatus: 'active' | 'inactive';
}

/**
 * Calculate spoilage risk based on temperature, time, and battery level
 * @param temperature - Current temperature in Celsius
 * @param timeHours - Duration at current temperature in hours
 * @param batteryLevel - Current battery level percentage (0-100)
 * @param storageMinTemp - Minimum safe storage temperature
 * @param storageMaxTemp - Maximum safe storage temperature
 */
export function calculateSpoilageRisk(
  temperature: number,
  timeHours: number,
  batteryLevel: number,
  storageMinTemp: number = 2,
  storageMaxTemp: number = 8
): SpoilageRiskResult {
  const riskFactors: string[] = [];
  let spoilageIndex = 0;

  // Temperature deviation factor (40% weight)
  const tempDeviation = Math.max(
    0,
    Math.max(temperature - storageMaxTemp, storageMinTemp - temperature)
  );
  const tempFactor = Math.min(40, (tempDeviation / 10) * 40);
  spoilageIndex += tempFactor;

  if (tempDeviation > 0) {
    riskFactors.push(`Temperature ${tempDeviation.toFixed(1)}°C outside safe range`);
  }

  // Time exposure factor (30% weight)
  const timeFactor = Math.min(30, (timeHours / 24) * 30);
  spoilageIndex += timeFactor;

  if (timeHours > 4) {
    riskFactors.push(`Extended exposure: ${timeHours.toFixed(1)} hours at current temp`);
  }

  // Battery level factor (30% weight)
  const batteryFactor = batteryLevel < 20 ? 30 : batteryLevel < 50 ? 15 : 0;
  spoilageIndex += batteryFactor;

  if (batteryLevel < 20) {
    riskFactors.push(`Critical battery level: ${batteryLevel}%`);
  } else if (batteryLevel < 50) {
    riskFactors.push(`Low battery level: ${batteryLevel}%`);
  }

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (spoilageIndex < 25) {
    riskLevel = 'low';
  } else if (spoilageIndex < 50) {
    riskLevel = 'medium';
  } else if (spoilageIndex < 75) {
    riskLevel = 'high';
  } else {
    riskLevel = 'critical';
  }

  // Calculate thermal holdover time if grid is inactive and battery is low
  const thermalHoldoverResult = calculateThermalHoldover({
    batteryLevel,
    powerLoad: 300, // typical cold storage load
    batteryCapacity: 2000, // typical battery capacity in Wh
    gridStatus: 'inactive'
  });

  return {
    riskLevel,
    spoilageIndex: Math.round(spoilageIndex),
    riskFactors,
    thermalHoldoverTime: thermalHoldoverResult.time,
    thermalHoldoverMessage: thermalHoldoverResult.message
  };
}

/**
 * Calculate thermal holdover time based on battery capacity and power load
 * @param params - Thermal holdover calculation parameters
 */
export function calculateThermalHoldover(
  params: ThermalHoldoverParams
): { time: number | null; message: string | null } {
  const { batteryLevel, powerLoad, batteryCapacity, gridStatus } = params;

  // If grid is active, thermal holdover is not a concern
  if (gridStatus === 'active') {
    return {
      time: null,
      message: null
    };
  }

  // If battery is critically low, calculate holdover time
  if (batteryLevel < 20) {
    const availableEnergy = (batteryLevel / 100) * batteryCapacity; // Wh
    const holdoverHours = availableEnergy / powerLoad; // hours

    if (holdoverHours < 1) {
      return {
        time: holdoverHours,
        message: `Warning: Less than 1 hour of safe temperature remaining (${holdoverHours.toFixed(1)} hours)`
      };
    } else if (holdoverHours < 4) {
      return {
        time: holdoverHours,
        message: `Warning: Only ${holdoverHours.toFixed(1)} hours of safe temperature remaining`
      };
    } else {
      return {
        time: holdoverHours,
        message: `Approximately ${holdoverHours.toFixed(1)} hours of battery backup remaining`
      };
    }
  }

  return {
    time: null,
    message: null
  };
}

/**
 * Get risk level color for UI display
 */
export function getRiskLevelColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'low':
      return 'text-emerald-600 bg-emerald-50';
    case 'medium':
      return 'text-amber-600 bg-amber-50';
    case 'high':
      return 'text-orange-600 bg-orange-50';
    case 'critical':
      return 'text-rose-600 bg-rose-50';
    default:
      return 'text-slate-600 bg-slate-50';
  }
}

/**
 * Get risk level icon description
 */
export function getRiskLevelDescription(riskLevel: string): string {
  switch (riskLevel) {
    case 'low':
      return 'Safe conditions maintained';
    case 'medium':
      return 'Monitor conditions closely';
    case 'high':
      return 'Immediate attention required';
    case 'critical':
      return 'Emergency action needed';
    default:
      return 'Risk assessment unavailable';
  }
}