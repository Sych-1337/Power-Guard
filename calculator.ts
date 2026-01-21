
import { PowerSource, Device, DeviceType, PortType, Scenario, CalculationResult, PowerSourceType, Connection } from './types';

export const calculateAutonomy = (
  sources: PowerSource[],
  devices: Device[],
  scenario: Scenario,
  connections: Connection[] = []
): CalculationResult => {
  const result: CalculationResult = {
    totalRuntimeHours: 0,
    runtimePerSource: {},
    chargeCounts: {},
    totalLossWh: 0,
    warnings: [],
    recommendations: []
  };

  if (sources.length === 0 || devices.length === 0) return result;

  // 1. Group devices by source connection
  const sourceToDevices = new Map<string, Device[]>();
  devices.forEach(device => {
    const conn = connections.find(c => c.deviceId === device.id);
    if (conn) {
      const devs = sourceToDevices.get(conn.sourceId) || [];
      devs.push(device);
      sourceToDevices.set(conn.sourceId, devs);
    }
  });

  let totalUsableSystemWh = 0;
  let totalSystemDailyWhNeeded = 0;

  // 2. Calculate per-source capacity and runtime
  sources.forEach(source => {
    const connectedDevices = sourceToDevices.get(source.id) || [];
    
    // Average efficiency based on ports used
    const avgEfficiency = connectedDevices.length > 0 
      ? connectedDevices.reduce((sum, d) => sum + (source.efficiency[d.preferredPort] || 0.85), 0) / connectedDevices.length
      : (source.type === PowerSourceType.STATION ? 0.90 : 0.85);

    const usableWh = source.capacityWh * source.healthFactor * avgEfficiency;
    totalUsableSystemWh += usableWh;

    // Calculate daily consumption for THIS source based on device usage hours
    let sourceDailyWhNeeded = 0;
    let sourceInstantLoadW = 0;

    connectedDevices.forEach(d => {
      const consumptionW = d.powerW * scenario.intensityMultiplier;
      const hours = d.usageHours || scenario.hoursPerDay;
      sourceDailyWhNeeded += consumptionW * hours;
      sourceInstantLoadW += consumptionW;
    });

    totalSystemDailyWhNeeded += sourceDailyWhNeeded;

    // Runtime calculation: How many hours this source lasts if everything runs simultaneously
    if (sourceInstantLoadW > 0) {
      result.runtimePerSource[source.id] = usableWh / sourceInstantLoadW;
    } else {
      result.runtimePerSource[source.id] = Infinity;
    }

    // Peak Load / Overload check
    const peakLoadW = connectedDevices.reduce((sum, d) => sum + d.requiredW, 0);
    if (peakLoadW > source.maxOutputW) {
      result.warnings.push(`Перевантаження "${source.model}": пік ${peakLoadW}W > макс ${source.maxOutputW}W.`);
    }
  });

  // 3. Add internal battery capacities of devices to the system total
  devices.forEach(device => {
    if (device.batteryWh) {
      totalUsableSystemWh += device.batteryWh;
    }
  });

  // 4. Calculate Global Autonomy based on daily cycle
  if (totalSystemDailyWhNeeded > 0) {
    // How many daily cycles the system covers
    const cyclesCovered = totalUsableSystemWh / totalSystemDailyWhNeeded;
    result.totalRuntimeHours = cyclesCovered * scenario.hoursPerDay;
  } else {
    result.totalRuntimeHours = 0;
  }

  // 5. Recommendations
  const hasPC = devices.some(d => (d.category === "Комп'ютер" || d.powerW > 100) && connections.some(c => c.deviceId === d.id));
  const onlyPBs = sources.every(s => s.type === PowerSourceType.POWERBANK);
  if (hasPC && onlyPBs) {
    result.warnings.push("Павербанки не підходять для ПК. Використовуйте станції або ДБЖ.");
  }

  if (result.totalRuntimeHours < scenario.hoursPerDay && devices.length > 0) {
    result.recommendations.push("Заряду не вистачить на повний цикл. Вимкніть потужних споживачів.");
  }

  return result;
};
