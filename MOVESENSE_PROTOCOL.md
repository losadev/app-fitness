# 📡 Protocolo Movesense

## UUIDs Bluetooth

- **Servicio:** `34802252-7185-4d5d-b431-630e7050e8f0`
- **Comandos (Write):** `34800001-7185-4d5d-b431-630e7050e8f0`
- **Datos (Notify):** `34800002-7185-4d5d-b431-630e7050e8f0`

## Comandos API

Los comandos se envían como JSON:

### Operaciones (Op)

- `1` = GET (leer información)
- `2` = POST/Subscribe (suscribirse a datos)
- `3` = DELETE/Unsubscribe (desuscribirse)
- `4` = PUT (actualizar configuración)

### Rutas disponibles (Path)

#### Acelerómetro

```json
{ "Op": 2, "Path": "Meas/Acc/52" }
```

- Frecuencias: 13, 26, 52, 104, 208, 416, 833, 1666 Hz

#### Giroscopio

```json
{ "Op": 2, "Path": "Meas/Gyro/52" }
```

- Frecuencias: 13, 26, 52, 104, 208, 416, 833, 1666 Hz

#### Magnetómetro

```json
{ "Op": 2, "Path": "Meas/Magn/52" }
```

- Frecuencias: 13, 26, 52, 104 Hz

#### Frecuencia Cardíaca

```json
{ "Op": 2, "Path": "Meas/HR" }
```

#### ECG

```json
{ "Op": 2, "Path": "Meas/ECG/125" }
```

- Frecuencias: 125, 128, 200, 250, 256, 500, 512 Hz

## Formato de Respuesta

### Respuesta a comandos (JSON)

```json
{
  "Uri": "Meas/Acc/52",
  "Status": 200,
  "Content": { ... }
}
```

### Datos de sensores (Binario)

Los datos llegan en formato SBEM (Suunto Binary Encoded Message):

- Header: identificador del tipo de dato
- Body: datos binarios del sensor
- Típicamente floats de 32 bits (little-endian)

#### Estructura Acelerómetro/Giroscopio/Magnetómetro:

```
Timestamp (uint32) + ArrayAcc (3x float32)
```

- 4 bytes: timestamp en ms
- 12 bytes: x, y, z (float32 cada uno)
- Total: 16 bytes por muestra

#### Ejemplo parseo:

```typescript
const view = new DataView(bytes.buffer);
const timestamp = view.getUint32(0, true);
const x = view.getFloat32(4, true);
const y = view.getFloat32(8, true);
const z = view.getFloat32(12, true);
```

## Estado actual

✅ Conexión establecida
✅ Comandos implementados
🔄 Falta: Parsear respuestas binarias de sensores
⏳ Siguiente: Identificar formato exacto de datos IMU
