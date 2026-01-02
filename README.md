# 🎵 IoT Offline MP3 Project (Codenamed: MiReproductor)

Este proyecto consiste en el desarrollo de un reproductor de música inalámbrico basado en el microcontrolador **ESP32**. El dispositivo funciona de manera offline, permitiendo la gestión y transferencia de archivos de audio desde una **aplicación web en Angular** mediante una conexión local.

## 🚀 Características principales
- **Reproducción Offline:** Almacenamiento de archivos MP3 en una tarjeta MicroSD.
- **Audio Bluetooth:** Transmisión de audio a auriculares o altavoces mediante el protocolo A2DP (Bluetooth Classic).
- **Gestión Web:** Interfaz en Angular para subir, eliminar y organizar la música mediante una conexión punto a punto (Wi-Fi AP).
- **Bajo Nivel:** Firmware optimizado en C++ para garantizar estabilidad en el streaming de audio sin cortes.
- **Diseño Integrado:** Carcasa diseñada en 3D para albergar todos los componentes electrónicos.

---

## 🛠️ Stack Tecnológico

### Hardware & Firmware
- **Microcontrolador:** ESP32 (NodeMCU o similar).
- **Lenguaje:** C++ (entorno PlatformIO o Arduino IDE).
- **Periféricos:**
  - DAC I2S (ej. PCM5102A) para salida de audio de alta fidelidad.
  - Módulo de lectura MicroSD (SPI).
  - Batería LiPo + Módulo de carga TP4056.

### Software (Web App)
- **Framework:** Angular 17+ (TypeScript).
- **Estilos:** SCSS / Angular Material.
- **Comunicación:** Protocolo HTTP para la transferencia de archivos de audio.

### Diseño 3D
- **Herramienta:** Fusion 360 / Spline.
- **Exportable:** Archivos .STL para impresión 3D.

---

## 📂 Estructura del Repositorio

/
├── firmware/          # Código fuente en C++ para el ESP32
│   ├── src/           # Lógica principal y manejo de Bluetooth/SD
│   └── lib/           # Librerías específicas (A2DP, Audio I2S)
├── webapp/            # Aplicación Frontend en Angular
│   ├── src/app/       # Componentes y servicios de gestión de archivos
│   └── assets/        # Recursos visuales
├── design/            # Modelos 3D y esquemáticos
│   ├── models/        # Archivos .STEP / .STL para la carcasa
│   └── circuits/      # Diagrama de conexiones
└── docs/              # Documentación técnica adicional