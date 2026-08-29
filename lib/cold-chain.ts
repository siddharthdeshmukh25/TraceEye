/**
 * Advanced Cold-Chain Intelligence Module
 * Handles temperature excursion analysis, severity classification, and thermal holdover calculations
 */

export interface TemperatureReading {
  temperature_c: number;
  humidity_pct: number;
  recorded_at: Date;
  marker_status: string;
}

export interface ExcursionAnalysis {
  hasExcursion: boolean;
  excursionCount: number;
  totalExcursionDuration: number; // in minutes
  maxExcursionDuration: number; // in minutes
  averageExcursionTemperature: number;
  maxTemperature: number;
  minTemperature: number;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  excursions: Array<{
    startTime: Date;
    endTime: Date;
    duration: number; // minutes
    maxTemp: number;
    avgTemp: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

export interface ThermalHoldoverResult {
  safeHoursRemaining: number;
  batteryPercent: number;
  gridStatus: 'online' | 'offline';
  warning: boolean;
  warningMessage: string;
}

/**
 * Analyze temperature excursions from sensor readings
 * @param readings - Array of temperature readings
 * @param minTemp - Minimum safe temperature
 * @param maxTemp - Maximum safe temperature
 * @returns Detailed excursion analysis
 */
export function analyzeExcursions(
  readings: TemperatureReading[],
  minTemp: number,
  maxTemp: number
): ExcursionAnalysis {
  if (!readings || readings.length === 0) {
    return {
      hasExcursion: false,
      excursionCount: 0,
      totalExcursionDuration: 0,
      maxExcursionDuration: 0,
      averageExcursionTemperature: 0,
      maxTemperature: 0,
      minTemperature: 0,
      severity: 'none',
      excursions: []
    };
  }

  // Sort readings by timestamp
  const sortedReadings = [...readings].sort((a, b) => 
    new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );

  const excursions: ExcursionAnalysis['excursions'] = [];
  let currentExcursion: typeof excursions[0] | null = null;
  let totalExcursionDuration = 0;
  let maxExcursionDuration = 0;
  let excursionTemps: number[] = [];

  // Find overall max/min
  const allTemps = sortedReadings.map(r => r.temperature_c);
  const maxTemperature = Math.max(...allTemps);
  const minTemperature = Math.min(...allTemps);

  // Detect excursions
  for (let i = 0; i < sortedReadings.length; i++) {
    const reading = sortedReadings[i];
    const isOutsideRange = reading.temperature_c < minTemp || reading.temperature_c > maxTemp;

    if (isOutsideRange) {
      if (!currentExcursion) {
        // Start new excursion
        currentExcursion = {
          startTime: new Date(reading.recorded_at),
          endTime: new Date(reading.recorded_at),
          duration: 0,
          maxTemp: reading.temperature_c,
          avgTemp: reading.temperature_c,
          severity: 'low'
        };
        excursionTemps = [reading.temperature_c];
      } else {
        // Continue current excursion
        currentExcursion.endTime = new Date(reading.recorded_at);
        currentExcursion.maxTemp = Math.max(currentExcursion.maxTemp, reading.temperature_c);
        excursionTemps.push(reading.temperature_c);
        
        // Update duration
        const duration = (currentExcursion.endTime.getTime() - currentExcursion.startTime.getTime()) / (1000 * 60); // minutes
        currentExcursion.duration = duration;
      }
    } else {
      if (currentExcursion) {
        // End current excursion
        currentExcursion.avgTemp = excursionTemps.reduce((a, b) => a + b, 0) / excursionTemps.length;
        currentExcursion.severity = calculateExcursionSeverity(
          currentExcursion.maxTemp, 
          minTemp, 
          maxTemp, 
          currentExcursion.duration
        );
        
        excursions.push({ ...currentExcursion });
        totalExcursionDuration += currentExcursion.duration;
        maxExcursionDuration = Math.max(maxExcursionDuration, currentExcursion.duration);
        
        currentExcursion = null;
        excursionTemps = [];
      }
    }
  }

  // Handle ongoing excursion
  if (currentExcursion) {
    currentExcursion.avgTemp = excursionTemps.reduce((a, b) => a + b, 0) / excursionTemps.length;
    currentExcursion.severity = calculateExcursionSeverity(
      currentExcursion.maxTemp, 
      minTemp, 
      maxTemp, 
      currentExcursion.duration
    );
    
    excursions.push({ ...currentExcursion });
    totalExcursionDuration += currentExcursion.duration;
    maxExcursionDuration = Math.max(maxExcursionDuration, currentExcursion.duration);
  }

  // Calculate overall severity
  const overallSeverity = calculateOverallSeverity(excursions, maxTemperature, minTemp, maxTemp);

  // Calculate average excursion temperature
  const allExcursionTemps = excursions.flatMap(e => [e.maxTemp, e.avgTemp]);
  const averageExcursionTemperature = allExcursionTemps.length > 0
    ? allExcursionTemps.reduce((a, b) => a + b, 0) / allExcursionTemps.length
    : 0;

  return {
    hasExcursion: excursions.length > 0,
    excursionCount: excursions.length,
    totalExcursionDuration,
    maxExcursionDuration,
    averageExcursionTemperature,
    maxTemperature,
    minTemperature,
    severity: overallSeverity,
    excursions
  };
}

/**
 * Calculate severity of a single excursion
 */
function calculateExcursionSeverity(
  maxTemp: number, 
  minTemp: number, 
  maxAllowed: number, 
  duration: number
): 'low' | 'medium' | 'high' | 'critical' {
  const tempDeviation = Math.max(maxTemp - maxAllowed, minTemp - maxTemp);
  
  // Critical: More than 5 degrees outside range OR more than 2 hours
  if (tempDeviation > 5 || duration > 120) {
    return 'critical';
  }
  
  // High: 3-5 degrees outside range OR 1-2 hours
  if (tempDeviation > 3 || duration > 60) {
    return 'high';
  }
  
  // Medium: 1-3 degrees outside range OR 30-60 minutes
  if (tempDeviation > 1 || duration > 30) {
    return 'medium';
  }
  
  // Low: Less than 1 degree outside range OR less than 30 minutes
  return 'low';
}

/**
 * Calculate overall severity based on all excursions
 */
function calculateOverallSeverity(
  excursions: Array<{ severity: string; duration: number }>,
  maxTemp: number,
  minTemp: number,
  maxAllowed: number
): 'none' | 'low' | 'medium' | 'high' | 'critical' {
  if (excursions.length === 0) return 'none';
  
  const hasCritical = excursions.some(e => e.severity === 'critical');
  const hasHigh = excursions.some(e => e.severity === 'high');
  const totalDuration = excursions.reduce((sum, e) => sum + e.duration, 0);
  
  if (hasCritical) return 'critical';
  if (hasHigh || totalDuration > 180) return 'high'; // More than 3 hours total
  if (excursions.length > 2 || totalDuration > 60) return 'medium'; // More than 2 excursions or 1 hour total
  
  return 'low';
}

/**
 * Calculate thermal holdover time based on battery and grid status
 * @param currentTemp - Current storage temperature
 * @param batteryPercent - Battery percentage (0-100)
 * @param gridStatus - Grid power status
 * @param minTemp - Minimum safe temperature
 * @param maxTemp - Maximum safe temperature
 * @returns Thermal holdover analysis
 */
export function calculateThermalHoldover(
  currentTemp: number,
  batteryPercent: number,
  gridStatus: 'online' | 'offline',
  minTemp: number = 2,
  maxTemp: number = 8
): ThermalHoldoverResult {
  // Base calculations
  const tempBuffer = Math.min(
    maxTemp - currentTemp, 
    currentTemp - minTemp
  );
  
  let safeHoursRemaining: number;
  
  if (gridStatus === 'online') {
    // With grid power, essentially unlimited (within reasonable limits)
    safeHoursRemaining = 999; // Effectively unlimited
  } else {
    // On battery power - simplified model
    // Assume 1% battery = ~30 minutes of cooling at current conditions
    // Adjusted by temperature buffer
    const baseHoursPerPercent = 0.5; // 30 minutes per percent
    const tempFactor = Math.max(0.5, tempBuffer / 2); // Temperature safety buffer factor
    
    safeHoursRemaining = (batteryPercent * baseHoursPerPercent) * tempFactor;
    
    // Cap at reasonable maximum
    safeHoursRemaining = Math.min(safeHoursRemaining, 48); // Max 48 hours
  }
  
  // Determine warning status
  const warning = gridStatus === 'offline' && batteryPercent < 30;
  let warningMessage = '';
  
  if (warning) {
    if (batteryPercent < 10) {
      warningMessage = `CRITICAL: Battery critically low (${batteryPercent}%). Less than ${Math.ceil(safeHoursRemaining)} hours of safe temperature remaining!`;
    } else if (batteryPercent < 20) {
      warningMessage = `WARNING: Battery low (${batteryPercent}%). Approximately ${Math.ceil(safeHoursRemaining)} hours of safe temperature remaining.`;
    } else {
      warningMessage = `Thermal Holdover Warning: Approximately ${Math.ceil(safeHoursRemaining)} hours of safe temperature remaining on battery power.`;
    }
  }
  
  return {
    safeHoursRemaining,
    batteryPercent,
    gridStatus,
    warning,
    warningMessage
  };
}

/**
 * Get cold-chain status summary
 */
export function getColdChainStatus(
  analysis: ExcursionAnalysis,
  currentTemp: number,
  minTemp: number,
  maxTemp: number
): {
  status: 'safe' | 'warning' | 'critical';
  message: string;
  recommendations: string[];
} {
  if (analysis.severity === 'critical') {
    return {
      status: 'critical',
      message: `Critical cold-chain violation detected. Temperature reached ${analysis.maxTemperature}°C (safe range: ${minTemp}-${maxTemp}°C).`,
      recommendations: [
        'Immediately quarantine affected batch',
        'Inspect storage/transport equipment',
        'Evaluate product quality and safety',
        'Consider recall if duration exceeded safety limits'
      ]
    };
  }
  
  if (analysis.severity === 'high') {
    return {
      status: 'warning',
      message: `High-severity temperature excursion: ${analysis.maxTemperature}°C for ${analysis.maxExcursionDuration} minutes.`,
      recommendations: [
        'Monitor temperature closely',
        'Inspect storage conditions',
        'Verify equipment functionality',
        'Consider product quality assessment'
      ]
    };
  }
  
  if (analysis.hasExcursion) {
    return {
      status: 'warning',
      message: `Minor temperature excursion detected: ${analysis.averageExcursionTemperature.toFixed(1)}°C average for ${analysis.totalExcursionDuration} minutes total.`,
      recommendations: [
        'Continue monitoring',
        'Document excursion details',
        'Review storage procedures'
      ]
    };
  }
  
  const isCurrentlySafe = currentTemp >= minTemp && currentTemp <= maxTemp;
  
  if (!isCurrentlySafe) {
    return {
      status: 'warning',
      message: `Current temperature ${currentTemp}°C is outside safe range (${minTemp}-${maxTemp}°C).`,
      recommendations: [
        'Adjust storage temperature immediately',
        'Monitor until temperature stabilizes',
        'Document the incident'
      ]
    };
  }
  
  return {
    status: 'safe',
    message: `Cold chain operating normally. Current temperature: ${currentTemp}°C (safe range: ${minTemp}-${maxTemp}°C).`,
    recommendations: [
      'Continue standard monitoring',
      'Maintain current storage conditions'
    ]
  };
}