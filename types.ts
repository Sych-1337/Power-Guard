
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
  nominalVoltage: number;
  maxOutputW: number;
  efficiency: {
    [key in PortType]: number;
  };
  healthFactor: number;
}

export interface Device {
  id: string;
  category: string;
  name: string;
  type: DeviceType;
  powerW: number;
  batteryWh?: number;
  preferredPort: PortType;
  requiredW: number;
  usageHours?: number;
}

export interface Scenario {
  id: string;
  name: string;
  hoursPerDay: number;
  intensityMultiplier: number;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface Connection {
  sourceId: string;
  deviceId: string;
}

export interface CalculationResult {
  totalRuntimeHours: number;
  runtimePerSource: { [sourceId: string]: number };
  chargeCounts: { [deviceId: string]: number };
  totalLossWh: number;
  warnings: string[];
  recommendations: string[];
}
