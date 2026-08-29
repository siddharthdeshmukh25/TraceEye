import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    // Generate realistic mock telemetry data for cold storage unit
    const solarInputVoltage = (18 + Math.random() * 8).toFixed(1); // 18-26V solar panel range
    const batteryHealth = (65 + Math.random() * 35).toFixed(0); // 65-100% battery health
    const batteryLevel = (20 + Math.random() * 80).toFixed(0); // 20-100% current charge
    const gridStatus = Math.random() > 0.3 ? "active" : "inactive"; // 70% chance grid is active
    const solarStatus = Math.random() > 0.4 ? "active" : "inactive"; // 60% chance solar is active
    const temperature = (2 + Math.random() * 6).toFixed(1); // 2-8°C storage temperature
    const humidity = (60 + Math.random() * 25).toFixed(0); // 60-85% humidity
    const powerLoad = (150 + Math.random() * 300).toFixed(0); // 150-450W power load
    const lastUpdated = new Date().toISOString();

    const telemetryData = {
      solar_input_voltage: parseFloat(solarInputVoltage),
      battery_health: parseInt(batteryHealth),
      battery_level: parseInt(batteryLevel),
      grid_status: gridStatus,
      solar_status: solarStatus,
      temperature: parseFloat(temperature),
      humidity: parseInt(humidity),
      power_load_watts: parseInt(powerLoad),
      last_updated: lastUpdated,
      unit_id: "CSU-" + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
      location: "Cold Storage Unit A1"
    };

    return NextResponse.json(telemetryData);
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Telemetry service unavailable" },
      { status: 503 }
    );
  }
}