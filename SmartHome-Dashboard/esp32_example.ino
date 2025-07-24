/*
  Smart Home ESP32 - Exemplo de código para integração com o Dashboard Web

  Este código demonstra como conectar um ESP32 ao dashboard web via MQTT,
  controlando dispositivos e enviando dados de sensores.

  Componentes necessários:
  - ESP32
  - Sensor DHT22 (temperatura e umidade)
  - LEDs para simular lâmpadas
  - Relés para controlar tomadas/dispositivos
  - Servo motor para simular portão (opcional)

  Bibliotecas necessárias:
  - WiFi
  - PubSubClient
  - DHT sensor library
  - ArduinoJson (opcional, para JSON)
*/

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ====================================
// CONFIGURAÇÕES DE REDE
// ====================================
const char *ssid = "SEU_WIFI_AQUI";      // Nome da sua rede WiFi
const char *password = "SUA_SENHA_AQUI"; // Senha da sua rede WiFi

// ====================================
// CONFIGURAÇÕES MQTT
// ====================================
const char *mqtt_server = "broker.hivemq.com"; // Broker MQTT público
const int mqtt_port = 1883;                    // Porta MQTT padrão
const char *mqtt_user = "";                    // Usuário (vazio para broker público)
const char *mqtt_pass = "";                    // Senha (vazio para broker público)

// ====================================
// CONFIGURAÇÕES DO SENSOR DHT22
// ====================================
#define DHT_PIN 4      // Pino do sensor DHT22
#define DHT_TYPE DHT22 // Tipo do sensor
DHT dht(DHT_PIN, DHT_TYPE);

// ====================================
// DEFINIÇÃO DOS PINOS
// ====================================
// LEDs simulando lâmpadas
#define LED_SALA 2   // GPIO2 - LED da sala
#define LED_QUARTO 5 // GPIO5 - LED do quarto

// Relés para dispositivos
#define RELE_TOMADA_COZINHA 18  // GPIO18 - Relé da tomada
#define RELE_IRRIGACAO 19       // GPIO19 - Relé da irrigação
#define RELE_AR_CONDICIONADO 21 // GPIO21 - Relé do A/C

// Servo/Relé do portão
#define PORTAO_PIN 22 // GPIO22 - Controle do portão

// LED de status
#define LED_STATUS 23 // GPIO23 - LED de status da conexão

// ====================================
// OBJETOS GLOBAIS
// ====================================
WiFiClient espClient;
PubSubClient client(espClient);

// ====================================
// VARIÁVEIS DE CONTROLE
// ====================================
unsigned long lastSensorRead = 0;              // Última leitura do sensor
unsigned long lastHeartbeat = 0;               // Último heartbeat
const unsigned long sensorInterval = 30000;    // Intervalo de leitura do sensor (30s)
const unsigned long heartbeatInterval = 60000; // Intervalo de heartbeat (60s)

// Estados dos dispositivos
bool estadoLuzSala = false;
bool estadoLuzQuarto = false;
bool estadoTomadaCozinha = false;
bool estadoIrrigacao = false;
bool estadoArCondicionado = false;
bool estadoPortao = false;

// ====================================
// SETUP - CONFIGURAÇÃO INICIAL
// ====================================
void setup()
{
    // Inicializa comunicação serial
    Serial.begin(115200);
    Serial.println();
    Serial.println("=================================");
    Serial.println("Smart Home ESP32 - Iniciando...");
    Serial.println("=================================");

    // Configura pinos como saída
    setupPins();

    // Inicializa sensor DHT
    dht.begin();
    Serial.println("Sensor DHT22 inicializado");

    // Conecta ao WiFi
    setupWiFi();

    // Configura cliente MQTT
    setupMQTT();

    // Teste inicial dos dispositivos
    testeInicial();

    Serial.println("Setup concluído!");
    Serial.println("=================================");
}

// ====================================
// CONFIGURAÇÃO DOS PINOS
// ====================================
void setupPins()
{
    // Configura pinos como saída
    pinMode(LED_SALA, OUTPUT);
    pinMode(LED_QUARTO, OUTPUT);
    pinMode(RELE_TOMADA_COZINHA, OUTPUT);
    pinMode(RELE_IRRIGACAO, OUTPUT);
    pinMode(RELE_AR_CONDICIONADO, OUTPUT);
    pinMode(PORTAO_PIN, OUTPUT);
    pinMode(LED_STATUS, OUTPUT);

    // Inicializa todos os dispositivos desligados
    digitalWrite(LED_SALA, LOW);
    digitalWrite(LED_QUARTO, LOW);
    digitalWrite(RELE_TOMADA_COZINHA, LOW);
    digitalWrite(RELE_IRRIGACAO, LOW);
    digitalWrite(RELE_AR_CONDICIONADO, LOW);
    digitalWrite(PORTAO_PIN, LOW);

    Serial.println("Pinos configurados");
}

// ====================================
// CONFIGURAÇÃO DO WIFI
// ====================================
void setupWiFi()
{
    delay(10);
    Serial.print("Conectando ao WiFi: ");
    Serial.println(ssid);

    WiFi.begin(ssid, password);

    // Pisca LED de status enquanto conecta
    int tentativas = 0;
    while (WiFi.status() != WL_CONNECTED && tentativas < 30)
    {
        delay(500);
        Serial.print(".");
        digitalWrite(LED_STATUS, !digitalRead(LED_STATUS));
        tentativas++;
    }

    if (WiFi.status() == WL_CONNECTED)
    {
        Serial.println();
        Serial.println("WiFi conectado com sucesso!");
        Serial.print("Endereço IP: ");
        Serial.println(WiFi.localIP());
        Serial.print("Força do sinal: ");
        Serial.print(WiFi.RSSI());
        Serial.println(" dBm");

        // LED de status ligado (conectado)
        digitalWrite(LED_STATUS, HIGH);
    }
    else
    {
        Serial.println();
        Serial.println("Falha na conexão WiFi!");
        // LED de status desligado (erro)
        digitalWrite(LED_STATUS, LOW);
    }
}

// ====================================
// CONFIGURAÇÃO DO MQTT
// ====================================
void setupMQTT()
{
    client.setServer(mqtt_server, mqtt_port);
    client.setCallback(callbackMQTT);
    Serial.print("Servidor MQTT configurado: ");
    Serial.print(mqtt_server);
    Serial.print(":");
    Serial.println(mqtt_port);
}

// ====================================
// CALLBACK MQTT - RECEBIMENTO DE MENSAGENS
// ====================================
void callbackMQTT(char *topic, byte *payload, unsigned int length)
{
    // Converte payload para string
    String message = "";
    for (int i = 0; i < length; i++)
    {
        message += (char)payload[i];
    }

    // Log da mensagem recebida
    Serial.print("Mensagem recebida [");
    Serial.print(topic);
    Serial.print("]: ");
    Serial.println(message);

    // Processa comandos para cada dispositivo
    processarComando(String(topic), message);
}

// ====================================
// PROCESSAMENTO DE COMANDOS MQTT
// ====================================
void processarComando(String topic, String comando)
{
    // Lâmpada da Sala
    if (topic == "casa/sala/luz1")
    {
        estadoLuzSala = (comando == "on");
        digitalWrite(LED_SALA, estadoLuzSala ? HIGH : LOW);
        Serial.print("Lâmpada da sala: ");
        Serial.println(estadoLuzSala ? "LIGADA" : "DESLIGADA");

        // Confirma o estado
        client.publish("casa/sala/luz1", estadoLuzSala ? "on" : "off", true);
    }

    // Lâmpada do Quarto
    else if (topic == "casa/quarto/luz1")
    {
        estadoLuzQuarto = (comando == "on");
        digitalWrite(LED_QUARTO, estadoLuzQuarto ? HIGH : LOW);
        Serial.print("Lâmpada do quarto: ");
        Serial.println(estadoLuzQuarto ? "LIGADA" : "DESLIGADA");

        // Confirma o estado
        client.publish("casa/quarto/luz1", estadoLuzQuarto ? "on" : "off", true);
    }

    // Tomada da Cozinha
    else if (topic == "casa/cozinha/tomada1")
    {
        estadoTomadaCozinha = (comando == "on");
        digitalWrite(RELE_TOMADA_COZINHA, estadoTomadaCozinha ? HIGH : LOW);
        Serial.print("Tomada da cozinha: ");
        Serial.println(estadoTomadaCozinha ? "LIGADA" : "DESLIGADA");

        // Confirma o estado
        client.publish("casa/cozinha/tomada1", estadoTomadaCozinha ? "on" : "off", true);
    }

    // Sistema de Irrigação
    else if (topic == "casa/jardim/irrigacao")
    {
        estadoIrrigacao = (comando == "on");
        digitalWrite(RELE_IRRIGACAO, estadoIrrigacao ? HIGH : LOW);
        Serial.print("Irrigação: ");
        Serial.println(estadoIrrigacao ? "ATIVADA" : "DESATIVADA");

        // Confirma o estado
        client.publish("casa/jardim/irrigacao", estadoIrrigacao ? "on" : "off", true);
    }

    // Portão da Garagem
    else if (topic == "casa/garagem/portao")
    {
        if (comando == "toggle" || comando == "on")
        {
            acionarPortao();
        }
    }

    // Ar Condicionado
    else if (topic == "casa/sala/ar")
    {
        estadoArCondicionado = (comando == "on");
        digitalWrite(RELE_AR_CONDICIONADO, estadoArCondicionado ? HIGH : LOW);
        Serial.print("Ar condicionado: ");
        Serial.println(estadoArCondicionado ? "LIGADO" : "DESLIGADO");

        // Confirma o estado
        client.publish("casa/sala/ar", estadoArCondicionado ? "on" : "off", true);
    }
}

// ====================================
// ACIONAMENTO DO PORTÃO
// ====================================
void acionarPortao()
{
    Serial.println("Acionando portão da garagem...");

    // Simula abertura/fechamento do portão
    estadoPortao = !estadoPortao;

    // Pulso no relé (simula acionamento)
    digitalWrite(PORTAO_PIN, HIGH);
    delay(500); // Pulso de 500ms
    digitalWrite(PORTAO_PIN, LOW);

    // Publica novo estado
    client.publish("casa/garagem/portao", estadoPortao ? "open" : "closed", true);

    Serial.print("Portão: ");
    Serial.println(estadoPortao ? "ABERTO" : "FECHADO");
}

// ====================================
// CONEXÃO/RECONEXÃO MQTT
// ====================================
void reconnectMQTT()
{
    // Loop até conectar
    while (!client.connected())
    {
        Serial.print("Tentando conexão MQTT...");

        // Gera ID único para o cliente
        String clientId = "ESP32SmartHome-";
        clientId += String(random(0xffff), HEX);

        // Tenta conectar
        if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass))
        {
            Serial.println(" conectado!");

            // Subscreve aos tópicos de comando
            subscribeTopics();

            // Publica status inicial
            publicarStatusInicial();
        }
        else
        {
            Serial.print(" falhou, rc=");
            Serial.print(client.state());
            Serial.println(" tentando novamente em 5 segundos");
            delay(5000);
        }
    }
}

// ====================================
// INSCRIÇÃO EM TÓPICOS MQTT
// ====================================
void subscribeTopics()
{
    client.subscribe("casa/sala/luz1");
    client.subscribe("casa/quarto/luz1");
    client.subscribe("casa/cozinha/tomada1");
    client.subscribe("casa/jardim/irrigacao");
    client.subscribe("casa/garagem/portao");
    client.subscribe("casa/sala/ar");

    Serial.println("Inscrito em todos os tópicos de comando");
}

// ====================================
// PUBLICAÇÃO DO STATUS INICIAL
// ====================================
void publicarStatusInicial()
{
    // Publica estado atual de todos os dispositivos
    client.publish("casa/sala/luz1", estadoLuzSala ? "on" : "off", true);
    client.publish("casa/quarto/luz1", estadoLuzQuarto ? "on" : "off", true);
    client.publish("casa/cozinha/tomada1", estadoTomadaCozinha ? "on" : "off", true);
    client.publish("casa/jardim/irrigacao", estadoIrrigacao ? "on" : "off", true);
    client.publish("casa/sala/ar", estadoArCondicionado ? "on" : "off", true);
    client.publish("casa/garagem/portao", estadoPortao ? "open" : "closed", true);

    // Publica informações do sistema
    String infoMsg = "{\"ip\":\"" + WiFi.localIP().toString() + "\",\"rssi\":" + WiFi.RSSI() + ",\"uptime\":" + millis() + "}";
    client.publish("casa/sistema/info", infoMsg.c_str());

    Serial.println("Status inicial publicado");
}

// ====================================
// LEITURA E ENVIO DOS SENSORES
// ====================================
void lerEnviarSensores()
{
    // Lê temperatura e umidade
    float temperatura = dht.readTemperature();
    float umidade = dht.readHumidity();

    // Verifica se as leituras são válidas
    if (isnan(temperatura) || isnan(umidade))
    {
        Serial.println("Erro na leitura do sensor DHT22!");
        return;
    }

    // Log das leituras
    Serial.print("Temperatura: ");
    Serial.print(temperatura);
    Serial.print("°C | Umidade: ");
    Serial.print(umidade);
    Serial.println("%");

    // Cria JSON com os dados
    StaticJsonDocument<200> doc;
    doc["temperature"] = round(temperatura * 10) / 10.0; // 1 casa decimal
    doc["humidity"] = round(umidade * 10) / 10.0;        // 1 casa decimal
    doc["timestamp"] = millis();

    String jsonString;
    serializeJson(doc, jsonString);

    // Publica no tópico principal
    client.publish("casa/sensores/dht22", jsonString.c_str());

    // Publica também em tópicos separados (compatibilidade)
    client.publish("casa/sala/temperatura", String(temperatura).c_str());
    client.publish("casa/sala/umidade", String(umidade).c_str());
}

// ====================================
// HEARTBEAT - SINAL DE VIDA
// ====================================
void enviarHeartbeat()
{
    StaticJsonDocument<300> doc;
    doc["device"] = "ESP32SmartHome";
    doc["uptime"] = millis();
    doc["free_heap"] = ESP.getFreeHeap();
    doc["wifi_rssi"] = WiFi.RSSI();
    doc["ip"] = WiFi.localIP().toString();

    String jsonString;
    serializeJson(doc, jsonString);

    client.publish("casa/sistema/heartbeat", jsonString.c_str());
    Serial.println("Heartbeat enviado");
}

// ====================================
// TESTE INICIAL DOS DISPOSITIVOS
// ====================================
void testeInicial()
{
    Serial.println("Executando teste inicial dos dispositivos...");

    // Teste sequencial dos LEDs
    digitalWrite(LED_SALA, HIGH);
    delay(200);
    digitalWrite(LED_SALA, LOW);

    digitalWrite(LED_QUARTO, HIGH);
    delay(200);
    digitalWrite(LED_QUARTO, LOW);

    // Teste dos relés (pulso curto)
    digitalWrite(RELE_TOMADA_COZINHA, HIGH);
    delay(100);
    digitalWrite(RELE_TOMADA_COZINHA, LOW);

    digitalWrite(RELE_IRRIGACAO, HIGH);
    delay(100);
    digitalWrite(RELE_IRRIGACAO, LOW);

    digitalWrite(RELE_AR_CONDICIONADO, HIGH);
    delay(100);
    digitalWrite(RELE_AR_CONDICIONADO, LOW);

    Serial.println("Teste inicial concluído");
}

// ====================================
// LOOP PRINCIPAL
// ====================================
void loop()
{
    // Verifica conexão WiFi
    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("WiFi desconectado! Tentando reconectar...");
        setupWiFi();
        return;
    }

    // Verifica conexão MQTT
    if (!client.connected())
    {
        digitalWrite(LED_STATUS, LOW); // LED de status desligado
        reconnectMQTT();
    }
    else
    {
        digitalWrite(LED_STATUS, HIGH); // LED de status ligado
    }

    // Processa mensagens MQTT
    client.loop();

    // Leitura periódica dos sensores
    unsigned long agora = millis();
    if (agora - lastSensorRead >= sensorInterval)
    {
        lerEnviarSensores();
        lastSensorRead = agora;
    }

    // Heartbeat periódico
    if (agora - lastHeartbeat >= heartbeatInterval)
    {
        enviarHeartbeat();
        lastHeartbeat = agora;
    }

    // Pequeno delay para não sobrecarregar o sistema
    delay(100);
}

// ====================================
// FUNÇÕES AUXILIARES
// ====================================

// Função para debug - imprime informações do sistema
void printSystemInfo()
{
    Serial.println("\n=== INFORMAÇÕES DO SISTEMA ===");
    Serial.print("Chip ID: ");
    Serial.println(ESP.getChipModel());
    Serial.print("Frequência: ");
    Serial.print(ESP.getCpuFreqMHz());
    Serial.println(" MHz");
    Serial.print("Memória livre: ");
    Serial.print(ESP.getFreeHeap());
    Serial.println(" bytes");
    Serial.print("Uptime: ");
    Serial.print(millis() / 1000);
    Serial.println(" segundos");
    Serial.println("==============================\n");
}

// Função para resetar todos os dispositivos
void resetarDispositivos()
{
    Serial.println("Resetando todos os dispositivos...");

    estadoLuzSala = false;
    estadoLuzQuarto = false;
    estadoTomadaCozinha = false;
    estadoIrrigacao = false;
    estadoArCondicionado = false;
    estadoPortao = false;

    digitalWrite(LED_SALA, LOW);
    digitalWrite(LED_QUARTO, LOW);
    digitalWrite(RELE_TOMADA_COZINHA, LOW);
    digitalWrite(RELE_IRRIGACAO, LOW);
    digitalWrite(RELE_AR_CONDICIONADO, LOW);
    digitalWrite(PORTAO_PIN, LOW);

    // Publica novos estados
    if (client.connected())
    {
        publicarStatusInicial();
    }

    Serial.println("Reset concluído");
}
