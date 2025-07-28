# Sistema IoT de Monitoramento de Temperatura

## Visão Geral

Este projeto implementa um sistema de monitoramento de temperatura utilizando um sensor IoT (ESP32 + DHT22). A interface web exibe dados em tempo real, como temperatura, umidade e status da bateria, além de informações climáticas obtidas de uma API externa.

## Funcionalidades Principais

### 🌡️ Sensor IoT (ESP32 + DHT22)

- **Localização**: Card principal no centro da tela.
- **Dados Exibidos**: Temperatura, umidade e status da bateria.
- **Fonte de Dados**: API do ESP32 ou JSON local (`iot-sensor-data.json`) para desenvolvimento.
- **Status**: Indicação visual de "ESP32 Online" ou status baseado na temperatura.
- **Atualização**: Dados atualizados a cada 5 segundos.

### 🌍 Dados Climáticos (API wttr.in)

- **Temperatura Atual**: Temperatura em tempo real da localização.
- **Máxima e Mínima do Dia**: Dados climáticos diários.
- **Fonte**: API gratuita wttr.in (sem necessidade de chave de API).
- **Atualização**: A cada 5 minutos.
- **Fallback**: Exibe "N/A" e "Serviço indisponível" em caso de falha.

### 🌓 Sistema de Temas

- **Alternância de Tema**: Botão no Navbar para alternar entre temas claro e escuro.
- **Persistência**: Tema salvo no localStorage do navegador.
- **Transições Suaves**: Animações ao alternar temas.
- **Acessibilidade**: Ícones intuitivos para identificação do tema.

## Estrutura do Projeto

```
IoT-Monitoramento-DHT22/
├── index.html              # Interface principal
├── css/style.css           # Estilos visuais com cores dinâmicas
├── js/script.js            # Lógica da aplicação
├── json/
│   └── iot-sensor-data.json # Dados simulados para desenvolvimento
└── README.md               # Documentação do projeto
```

## Configuração

### 1. Configurar a API do Sensor

Edite diretamente no arquivo `script.js` a constante:

```javascript
const IOT_SENSOR_API_URL = "http://192.168.1.100/api/temperature"; // Altere para o IP do seu ESP32
```

### 2. API de Clima (wttr.in)

- **Já configurada e funcionando!**
- **Sem necessidade de chave de API.**
- **Sem limites de requisições.**

### 3. Formato JSON Esperado do ESP32

O sensor deve retornar dados no seguinte formato:

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

## Como Usar

1. Configure o IP do ESP32 na constante `IOT_SENSOR_API_URL` do arquivo `script.js`.
2. Abra o arquivo `index.html` em um navegador.
3. Permita acesso à localização quando solicitado.
4. O sistema exibirá dados em tempo real ou simulados (se offline).

## Recursos Adicionais

- **API meteorológica gratuita** com wttr.in (sem chave necessária).
- **Geolocalização automática** para dados climáticos precisos.
- **Cores dinâmicas** no card principal baseadas na temperatura do sensor.
- **Sistema de temas** Dark/Light com persistência no navegador.
- **Fallback inteligente** quando offline.
- **Interface responsiva** com Bootstrap.
- **Status de conexão** em tempo real.
- **Atualização automática** a cada 5 segundos.
