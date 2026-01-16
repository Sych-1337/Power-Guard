
export enum PowerSourceType {
  POWERBANK = 'Павербанк',
  STATION = 'Зарядна станція',
  UPS = 'ДБЖ (UPS)',
  BATTERY = 'Акумулятор'
}

export enum DeviceType {
  CHARGEABLE = 'Заряджання батареї',
  CONSTANT = 'Постійне навантаження'
}

export enum PortType {
  USB_A = 'USB-A',
  USB_C_PD = 'USB-C PD',
  DC_12V = 'DC 12V',
  AC_220V = 'AC 220V'
}

export interface PowerSource {
  id: string;
  brand: string;
  model: string;
  type: PowerSourceType;
  capacityWh: number;
  capacityMah?: number;
  nominalVoltage: number; // usually 3.7 for li-ion
  maxOutputW: number;
  efficiency: {
    [key in PortType]: number;
  };
  healthFactor: number; // 1.0 (new), 0.85 (mid), 0.7 (old)
}

export interface Device {
  id: string;
  category: string;
  name: string;
  type: DeviceType;
  powerW: number; // Avg consumption or charging speed
  batteryWh?: number; // for chargeable devices
  preferredPort: PortType;
  requiredW: number;
}

export interface Scenario {
  id: string;
  name: string;
  hoursPerDay: number;
  intensityMultiplier: number; // 0.5 (eco), 1.0 (normal), 1.5 (max)
}

export interface CalculationResult {
  totalRuntimeHours: number;
  runtimePerSource: { [sourceId: string]: number };
  chargeCounts: { [deviceId: string]: number };
  totalLossWh: number;
  warnings: string[];
  recommendations: string[];
}
