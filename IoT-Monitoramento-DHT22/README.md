# Sistema IoT de Monitoramento de Temperatura

## ⚡ Funcionamento Atualizado

### 🌡️ **Card Principal - Sensor IoT (ESP32 + DHT22)**

- **Localização**: Card principal no centro da tela
- **Dados**: Temperatura, umidade e bateria do sensor IoT
- **Fonte**: API do ESP32 ou JSON local (`iot-sensor-data.json`) para desenvolvimento
- **Status**: Badge visual mostra "ESP32 Online" ou status baseado na temperatura
- **Atualização**: A cada 5 segundos

### 🌍 **Cards de Dados Climáticos (3 Cards - wttr.in API)**

1. **Temperatura Atual**: Temperatura em tempo real da localização
2. **Máxima Hoje**: Temperatura máxima do dia
3. **Mínima Hoje**: Temperatura mínima do dia

- **Fonte**: API wttr.in (gratuita, sem necessidade de chave de API)
- **URL**: `https://wttr.in/{lat},{lon}?format=j1`
- **Vantagens**: Sem limites de requisições, sem cadastro necessário
- **Atualização**: A cada 5 minutos
- **Fallback**: Se a API falhar, exibe "N/A" e "Serviço indisponível"

## 📁 Estrutura do Projeto

```
IoT-Monitoramento-DHT22/
├── index.html              # Interface principal
├── css/style.css           # Estilos visuais com cores dinâmicas
├── js/script.js            # Lógica da aplicação
├── json/
│   └── iot-sensor-data.json # Dados simulados para desenvolvimento
└── README.md               # Documentação do projeto
```

## 📁 Arquivos para Desenvolvimento

### `iot-sensor-data.json`

JSON local com dados simulados do sensor IoT:

```json
{
  "current": {
    "temperature": 25.7,
    "humidity": 59.4,
    "battery": 85,
    "timestamp": "2025-07-22T10:25:00Z"
  },
  "statistics": {
    "daily_avg": 24.8,
    "daily_max": 26.2,
    "daily_min": 22.1
  }
}
```

## Configuração

### 1. Configurar a API do Sensor

Edite diretamente no arquivo `script.js` a constante:

```javascript
const IOT_SENSOR_API_URL = "http://192.168.1.100/api/temperature"; // Altere para o IP do seu ESP32
```

### 2. API de Clima (wttr.in)

✅ **Já configurada e funcionando!**

- **Sem necessidade de chave de API**
- **Sem limites de requisições**
- **Sem cadastro necessário**

### 3. Formato JSON Esperado do ESP32

O sensor deve retornar dados no formato:

```json
{
  "temperature": 25.4,
  "humidity": 60.2,
  "timestamp": "2025-07-22T10:30:00Z"
}
```

### 4. Configuração do ESP32

Exemplo de código para o ESP32 retornar os dados em JSON:

```cpp
#include <WiFi.h>
#include <WebServer.h>
#include <DHT.h>
#include <ArduinoJson.h>

#define DHT_PIN 2
#define DHT_TYPE DHT22

DHT dht(DHT_PIN, DHT_TYPE);
WebServer server(80);

void setup() {
  // Configuração WiFi e sensor
  dht.begin();

  server.on("/api/temperature", HTTP_GET, []() {
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();

    DynamicJsonDocument doc(1024);
    doc["temperature"] = temp;
    doc["humidity"] = hum;
    doc["timestamp"] = "2025-07-22T10:30:00Z"; // Use RTC para timestamp real

    String response;
    serializeJson(doc, response);

    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", response);
  });

  server.begin();
}
```

## 📁 Estrutura Final do Projeto

```
IoT-Monitoramento-DHT22/
├── index.html              # Interface principal
├── css/style.css           # Estilos visuais com cores dinâmicas
├── js/script.js            # Lógica da aplicação
├── json/
│   └── iot-sensor-data.json # Dados simulados para desenvolvimento
└── README.md               # Documentação do projeto
```

- ✅ **API meteorológica gratuita** com wttr.in (sem chave necessária)
- ✅ **Geolocalização automática** para dados climáticos precisos
- ✅ **Temperatura atual, máxima e mínima** baseadas na localização
- ✅ **Fallback inteligente** quando offline
- ✅ **Interface responsiva** com Bootstrap
- ✅ **Status de conexão** em tempo real
- ✅ **Atualização automática** a cada 5 segundos

## Como usar

1. Configure o IP do ESP32 na constante `IOT_SENSOR_API_URL` do arquivo `script.js`
2. Abra o `index.html` em um navegador
3. Permita acesso à localização quando solicitado
4. O sistema mostrará dados em tempo real ou simulados se offline
