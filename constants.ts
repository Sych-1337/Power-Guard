import { PowerSource, PowerSourceType, Device, DeviceType, PortType } from './types';
import { catalogData } from './catalog';

export interface ExtendedPowerSource extends PowerSource {
  popular?: boolean;
}

export interface ExtendedDevice extends Device {
  popular?: boolean;
}

// Map strings from catalog to Enums
const stringToPowerType = (type: string): PowerSourceType => {
  const map: Record<string, PowerSourceType> = {
    'Павербанк': PowerSourceType.POWERBANK,
    'Зарядна станція': PowerSourceType.STATION,
    'ДБЖ (UPS)': PowerSourceType.UPS,
    'Акумулятор': PowerSourceType.BATTERY
  };
  return map[type] || PowerSourceType.POWERBANK;
};

const stringToDeviceType = (type: string): DeviceType => {
  return type === 'Заряджання батареї' ? DeviceType.CHARGEABLE : DeviceType.CONSTANT;
};

const stringToPortType = (port: string): PortType => {
  const map: Record<string, PortType> = {
    'USB-A': PortType.USB_A,
    'USB-C PD': PortType.USB_C_PD,
    'DC 12V': PortType.DC_12V,
    'AC 220V': PortType.AC_220V
  };
  return map[port] || PortType.USB_C_PD;
};

export const CATALOG_SOURCES: ExtendedPowerSource[] = catalogData.sources.map(s => ({
  ...s,
  type: stringToPowerType(s.type),
  healthFactor: 1.0,
  efficiency: {
    [PortType.USB_A]: s.type === 'Зарядна станція' ? 0.90 : 0.85,
    [PortType.USB_C_PD]: s.type === 'Зарядна станція' ? 0.94 : 0.90,
    [PortType.DC_12V]: s.type === 'Зарядна станція' ? 0.95 : 0.88,
    [PortType.AC_220V]: s.type === 'Зарядна станція' ? 0.87 : 0.78
  }
}));

export const CATALOG_DEVICES: ExtendedDevice[] = catalogData.devices.map(d => ({
  ...d,
  type: stringToDeviceType(d.type),
  preferredPort: stringToPortType(d.preferredPort)
}));