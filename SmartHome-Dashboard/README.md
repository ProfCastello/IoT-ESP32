# Smart Home Dashboard - IoT ESP32

Uma interface web moderna e responsiva para controlar dispositivos IoT via MQTT, desenvolvida com HTML5, Bootstrap 5 e JavaScript puro.

## 🚀 Características

- **Dashboard Moderno**: Interface com design moderno e responsivo
- **Dark/Light Mode**: Alternância entre tema claro e escuro
- **MQTT WebSocket**: Comunicação em tempo real via MQTT
- **Controle de Dispositivos**: Lâmpadas, tomadas, irrigação, portão, etc.
- **Monitoramento**: Gráficos de temperatura e umidade em tempo real
- **Animações**: Efeitos visuais suaves e responsivos
- **LocalStorage**: Persistência de configurações e estados
- **PWA Ready**: Pronto para ser usado como aplicativo web

## 📱 Dispositivos Suportados

- **Lâmpadas**: Controle on/off com animação de brilho
- **Tomadas**: Controle de eletrodomésticos
- **Irrigação**: Sistema de jardim automático
- **Portão**: Controle de acesso da garagem
- **Ar Condicionado**: Climatização
- **Sensores DHT22**: Temperatura e umidade

## 🔧 Configuração

### Broker MQTT

Por padrão, o sistema está configurado para usar o broker público HiveMQ:

- **Broker**: `broker.hivemq.com`
- **Porta WebSocket**: `8000`
- **Protocolo**: WebSocket (ws://) ou WebSocket Secure (wss://)

### Tópicos MQTT

#### Dispositivos (Comando/Status):

- `casa/sala/luz1` - Lâmpada da sala
- `casa/quarto/luz1` - Lâmpada do quarto
- `casa/cozinha/tomada1` - Tomada da cozinha
- `casa/jardim/irrigacao` - Sistema de irrigação
- `casa/garagem/portao` - Portão da garagem
- `casa/sala/ar` - Ar condicionado

#### Sensores (Recebimento):

- `casa/sensores/dht22` - Dados do sensor DHT22 (JSON)
- `casa/sala/temperatura` - Temperatura isolada
- `casa/sala/umidade` - Umidade isolada

### Formato das Mensagens

#### Comandos para Dispositivos:

- `on` - Liga o dispositivo
- `off` - Desliga o dispositivo
- `toggle` - Alterna estado (portão)

#### Dados de Sensores:

```json
{
  "temperature": 25.5,
  "humidity": 60.2
}
```

Ou formato simples: `25.5,60.2`

## 🛠️ Uso

### 1. Configuração Inicial

1. Abra o arquivo `index.html` em um navegador
2. Clique no ícone de configurações (⚙️) na barra superior
3. Configure o broker MQTT (se necessário)
4. Clique em "Salvar e Reconectar"

### 2. Controle de Dispositivos

- **Switches**: Use os interruptores para ligar/desligar dispositivos
- **Botões**: Clique nos botões para acionar dispositivos como o portão
- **Feedback Visual**: Os ícones mudam de cor e animam conforme o estado

### 3. Monitoramento

- O gráfico mostra temperatura e umidade em tempo real
- Valores atuais são exibidos na lateral
- Dados são salvos localmente para persistência

### 4. Atalhos de Teclado

- `Ctrl + D`: Alternar tema claro/escuro
- `Ctrl + S`: Abrir configurações
- `Ctrl + R`: Reconectar MQTT

## 📝 Código do ESP32

### Exemplo com WiFi e MQTT:

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// Configurações WiFi
const char* ssid = "SEU_WIFI";
const char* password = "SUA_SENHA";

// Configurações MQTT
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;

// Configurações DHT22
#define DHT_PIN 4
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

// Configurações dos pinos
#define LED_SALA 2
#define LED_QUARTO 5
#define TOMADA_COZINHA 18
#define IRRIGACAO 19
#define PORTAO 21
#define AR_CONDICIONADO 22

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
    Serial.begin(115200);

    // Inicializa pinos
    pinMode(LED_SALA, OUTPUT);
    pinMode(LED_QUARTO, OUTPUT);
    pinMode(TOMADA_COZINHA, OUTPUT);
    pinMode(IRRIGACAO, OUTPUT);
    pinMode(PORTAO, OUTPUT);
    pinMode(AR_CONDICIONADO, OUTPUT);

    // Inicializa DHT
    dht.begin();

    // Conecta WiFi
    setup_wifi();

    // Configura MQTT
    client.setServer(mqtt_server, mqtt_port);
    client.setCallback(callback);
}

void setup_wifi() {
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi conectado!");
}

void callback(char* topic, byte* payload, unsigned int length) {
    String message = "";
    for (int i = 0; i < length; i++) {
        message += (char)payload[i];
    }

    // Controle dos dispositivos
    if (String(topic) == "casa/sala/luz1") {
        digitalWrite(LED_SALA, message == "on" ? HIGH : LOW);
        client.publish("casa/sala/luz1", message.c_str());
    }
    else if (String(topic) == "casa/quarto/luz1") {
        digitalWrite(LED_QUARTO, message == "on" ? HIGH : LOW);
        client.publish("casa/quarto/luz1", message.c_str());
    }
    // ... outros dispositivos
}

void reconnect() {
    while (!client.connected()) {
        String clientId = "ESP32Client-" + String(random(0xffff), HEX);
        if (client.connect(clientId.c_str())) {
            // Subscreve aos tópicos
            client.subscribe("casa/sala/luz1");
            client.subscribe("casa/quarto/luz1");
            client.subscribe("casa/cozinha/tomada1");
            client.subscribe("casa/jardim/irrigacao");
            client.subscribe("casa/garagem/portao");
            client.subscribe("casa/sala/ar");
        } else {
            delay(5000);
        }
    }
}

void loop() {
    if (!client.connected()) {
        reconnect();
    }
    client.loop();

    // Envia dados do sensor a cada 30 segundos
    static unsigned long lastSensorRead = 0;
    if (millis() - lastSensorRead > 30000) {
        float temp = dht.readTemperature();
        float hum = dht.readHumidity();

        if (!isnan(temp) && !isnan(hum)) {
            String sensorData = "{\"temperature\":" + String(temp) + ",\"humidity\":" + String(hum) + "}";
            client.publish("casa/sensores/dht22", sensorData.c_str());
        }

        lastSensorRead = millis();
    }

    delay(100);
}
```

## 🎨 Personalização

### Cores e Tema

Edite o arquivo `css/style.css` para personalizar:

```css
:root {
  --primary-color: #4f46e5; /* Cor principal */
  --secondary-color: #8b5cf6; /* Cor secundária */
  --success-color: #10b981; /* Cor de sucesso */
  --warning-color: #f59e0b; /* Cor de aviso */
  --danger-color: #ef4444; /* Cor de erro */
}
```

### Adicionando Dispositivos

1. **HTML**: Adicione um novo card em `index.html`
2. **JavaScript**: Configure o tópico em `js/ui-controller.js`
3. **CSS**: Adicione animações específicas se necessário

### Novos Tipos de Sensor

1. **Chart Controller**: Modifique `js/chart-controller.js`
2. **Tópicos**: Adicione novos tópicos em `js/app.js`

## 🚀 Deploy

### GitHub Pages

1. Faça upload dos arquivos para um repositório GitHub
2. Ative GitHub Pages nas configurações
3. Acesse via URL fornecida

### Servidor Local

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

## 📱 PWA (Progressive Web App)

O dashboard está pronto para ser usado como PWA. Adicione um `manifest.json` para instalação:

```json
{
  "name": "Smart Home Dashboard",
  "short_name": "SmartHome",
  "description": "Dashboard IoT para ESP32",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#4f46e5",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

## 🔧 Resolução de Problemas

### MQTT não conecta

- Verifique se o broker está online
- Teste a conectividade de rede
- Verifique configurações de proxy/firewall

### Dispositivos não respondem

- Confirme se o ESP32 está conectado
- Verifique os tópicos MQTT
- Monitore o console do navegador

### Gráficos não aparecem

- Verifique se Chart.js está carregando
- Confirme se há dados de sensores
- Verifique o console para erros

## 📄 Licença

Este projeto é open source e está disponível sob a licença MIT.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para:

- Reportar bugs
- Sugerir melhorias
- Enviar pull requests
- Compartilhar ideias

## 📞 Suporte

Para dúvidas e suporte:

- Abra uma issue no repositório
- Consulte a documentação
- Verifique os exemplos fornecidos

---

**Desenvolvido com ❤️ para projetos IoT educacionais**
