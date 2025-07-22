# Sistema IoT de Monitoramento de Temperatura

## Configuração

### 1. Configurar a API do Sensor

Edite o arquivo `config.json` ou diretamente no `script.js`:

- **apiUrl**: Altere para o IP do seu ESP32 (ex: `http://192.168.1.100/api/temperature`)

### 2. Configurar API de Clima (Opcional)

Para obter dados meteorológicos reais baseados na localização:

1. Crie uma conta gratuita em [OpenWeatherMap](https://openweathermap.org/api)
2. Substitua `YOUR_OPENWEATHER_API_KEY` pela sua chave no `script.js`

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

## Funcionalidades

- ✅ **Temperatura em tempo real** via JSON do ESP32
- ✅ **Geolocalização automática** para dados meteorológicos
- ✅ **Máxima e mínima** baseadas na localização atual
- ✅ **Fallback inteligente** quando offline
- ✅ **Interface responsiva** com Bootstrap
- ✅ **Status de conexão** em tempo real
- ✅ **Atualização automática** a cada 5 segundos

## Como usar

1. Configure o IP do ESP32 no arquivo `script.js`
2. Abra o `index.html` em um navegador
3. Permita acesso à localização quando solicitado
4. O sistema mostrará dados em tempo real ou simulados se offline
