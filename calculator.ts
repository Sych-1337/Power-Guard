
import { PowerSource, Device, DeviceType, PortType, Scenario, CalculationResult } from './types';

export const calculateAutonomy = (
  sources: PowerSource[],
  devices: Device[],
  scenario: Scenario
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

  // 1. Calculate combined usable energy from all external sources
  let totalUsableBankWh = 0;
  sources.forEach(source => {
    // Determine the most likely port being used to apply correct efficiency
    // If there's a station, we assume it might use AC or DC. 
    // For general calculation we use a blended efficiency.
    const avgEff = source.type === 'Зарядна станція' ? 0.88 : 0.85;
    const usable = source.capacityWh * source.healthFactor * avgEff;
    totalUsableBankWh += usable;
    result.runtimePerSource[source.id] = usable;
  });

  // 2. Calculate Load & Initial Internal Battery Buffer
  let totalHourlyDrainW = 0;
  let totalInternalBatteryWh = 0;

  devices.forEach(device => {
    // Current drain power (adjusted by intensity)
    const hourlyDrain = device.powerW * scenario.intensityMultiplier;
    totalHourlyDrainW += hourlyDrain;

    // Buffer: If device is already charged, add its internal battery to the "energy pool"
    if (device.type === DeviceType.CHARGEABLE && device.batteryWh) {
      totalInternalBatteryWh += device.batteryWh;

      // Calculate how many full recharges the banks can provide
      // Losses happen during transfer (PowerBank -> Device Battery)
      const usableTransferredWh = totalUsableBankWh;
      const chargeCostWh = device.batteryWh / 0.85; // 0.85 is charging efficiency
      result.chargeCounts[device.id] = Math.floor((usableTransferredWh / chargeCostWh) * 10) / 10;
    }
  });

  // 3. Final Runtime Calculation: (Bank Energy + Internal Energy) / Total Drain
  if (totalHourlyDrainW > 0) {
    result.totalRuntimeHours = (totalUsableBankWh + totalInternalBatteryWh) / totalHourlyDrainW;

    // Distribute source-specific runtime for visual feedback
    Object.keys(result.runtimePerSource).forEach(id => {
      const sourceUsableWh = result.runtimePerSource[id];
      result.runtimePerSource[id] = sourceUsableWh / totalHourlyDrainW;
    });
  } else {
    result.totalRuntimeHours = 0;
  }

  // 4. Overload Warnings
  const peakRequiredW = devices.reduce((sum, d) => sum + d.requiredW, 0);
  sources.forEach(source => {
    if (peakRequiredW > source.maxOutputW) {
      result.warnings.push(`Ризик перевантаження джерела "${source.brand} ${source.model}" (Пік ${peakRequiredW}Вт > Макс ${source.maxOutputW}Вт).`);
    }
  });

  // 5. Productive Recommendations
  result.recommendations.push("Розрахунок базується на 'розумному' циклі: повна зарядка -> використання до розрядки -> повторна зарядка.");
  result.recommendations.push("Користуйтесь пристроями від вбудованої батареї до 10-20%, потім підключайте павербанк — це мінімізує втрати на фонове живлення плати павербанка.");
  
  if (totalUsableBankWh > 200) {
    result.recommendations.push("При великій ємності джерел намагайтесь живити роутер та ONU через DC-кабелі 12В замість розетки 220В — це додасть 15-20% часу роботи.");
  }

  return result;
};
