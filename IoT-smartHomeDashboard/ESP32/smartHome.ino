#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ====================================
// CONFIGURAÇÕES DE REDE
// ====================================
const char *ssid = "Wokwi-GUEST"; // Nome da sua rede WiFi
const char *password = "";        // Senha da sua rede WiFi

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
#define DHT_PIN 12     // Pino do sensor DHT22
#define DHT_TYPE DHT22 // Tipo do sensor
DHT dht(DHT_PIN, DHT_TYPE);

// ====================================
// DEFINIÇÃO DOS PINOS
// ====================================
// LEDs simulando lâmpadas
#define LED_SALA 17   // GPIO17 - LED da sala
#define LED_QUARTO 16 // GPIO16 - LED do quarto

// Relés para dispositivos
#define RELE_TOMADA_COZINHA 18  // GPIO18 - Relé da tomada
#define RELE_IRRIGACAO 19       // GPIO19 - Relé da irrigação
#define RELE_AR_CONDICIONADO 21 // GPIO21 - Relé do A/C

// Servo/Relé do portão
#define PORTAO_PIN 22 // GPIO22 - Controle do portão

// LED de status
#define LED_STATUS 2 // GPIO2 - LED de status da conexão

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

// Estados dos dispositivos (true = HIGH/on, false = LOW/off)
// Usamos o estado da variável para controlar o que foi definido
// e o digitalRead para saber o estado real do pino.
bool estadoLuzSala = false;
bool estadoLuzQuarto = false;
bool estadoTomadaCozinha = false;
bool estadoIrrigacao = false;
bool estadoArCondicionado = false;
bool estadoPortao = false; // Para o portão, 'false' pode ser fechado, 'true' pode ser aberto ou o último estado.

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
    // Garante que os pinos estejam em um estado conhecido no boot
    digitalWrite(LED_SALA, LOW);
    digitalWrite(LED_QUARTO, LOW);
    digitalWrite(RELE_TOMADA_COZINHA, LOW);
    digitalWrite(RELE_IRRIGACAO, LOW);
    digitalWrite(RELE_AR_CONDICIONADO, LOW);
    digitalWrite(PORTAO_PIN, LOW); // Portão normalmente fechado ou sem pulso

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
    // Variável para armazenar o estado desejado
    bool desiredState;
    bool stateChanged = false; // Flag para indicar se o estado físico mudou

    // Lâmpada da Sala
    if (topic == "smarthome790/sala/luz1")
    {
        desiredState = (comando == "on");
        if (estadoLuzSala != desiredState)
        { // Apenas atualiza se o estado lógico mudar
            estadoLuzSala = desiredState;
            digitalWrite(LED_SALA, estadoLuzSala ? HIGH : LOW);
            stateChanged = true;
            Serial.print("Lâmpada da sala: ");
            Serial.println(estadoLuzSala ? "LIGADA" : "DESLIGADA");
        }
        // Publica o estado atualizado para garantir consistência
        if (stateChanged)
        { // Publica apenas se o estado foi alterado
            client.publish("smarthome790/sala/luz1", estadoLuzSala ? "on" : "off", true);
        }
    }

    // Lâmpada do Quarto
    else if (topic == "smarthome790/quarto/luz1")
    {
        desiredState = (comando == "on");
        if (estadoLuzQuarto != desiredState)
        {
            estadoLuzQuarto = desiredState;
            digitalWrite(LED_QUARTO, estadoLuzQuarto ? HIGH : LOW);
            stateChanged = true;
            Serial.print("Lâmpada do quarto: ");
            Serial.println(estadoLuzQuarto ? "LIGADA" : "DESLIGADA");
        }
        if (stateChanged)
        {
            client.publish("smarthome790/quarto/luz1", estadoLuzQuarto ? "on" : "off", true);
        }
    }

    // Tomada da Cozinha
    else if (topic == "smarthome790/cozinha/tomada1")
    {
        desiredState = (comando == "on");
        if (estadoTomadaCozinha != desiredState)
        {
            estadoTomadaCozinha = desiredState;
            digitalWrite(RELE_TOMADA_COZINHA, estadoTomadaCozinha ? HIGH : LOW);
            stateChanged = true;
            Serial.print("Tomada da cozinha: ");
            Serial.println(estadoTomadaCozinha ? "LIGADA" : "DESLIGADA");
        }
        if (stateChanged)
        {
            client.publish("smarthome790/cozinha/tomada1", estadoTomadaCozinha ? "on" : "off", true);
        }
    }

    // Sistema de Irrigação
    else if (topic == "smarthome790/jardim/irrigacao")
    {
        desiredState = (comando == "on");
        if (estadoIrrigacao != desiredState)
        {
            estadoIrrigacao = desiredState;
            digitalWrite(RELE_IRRIGACAO, estadoIrrigacao ? HIGH : LOW);
            stateChanged = true;
            Serial.print("Irrigação: ");
            Serial.println(estadoIrrigacao ? "ATIVADA" : "DESATIVADA");
        }
        if (stateChanged)
        {
            client.publish("smarthome790/jardim/irrigacao", estadoIrrigacao ? "on" : "off", true);
        }
    }

    // Portão da Garagem
    else if (topic == "smarthome790/garagem/portao")
    {
        if (comando == "toggle" || comando == "on")
        {
            // O portão é um acionamento momentâneo.
            // A lógica de estado para ele é um pouco diferente.
            // Publicamos o estado 'open' ou 'closed' após o pulso.
            acionarPortao();
        }
    }

    // Ar Condicionado
    else if (topic == "smarthome790/sala/ar")
    {
        desiredState = (comando == "on");
        if (estadoArCondicionado != desiredState)
        {
            estadoArCondicionado = desiredState;
            digitalWrite(RELE_AR_CONDICIONADO, estadoArCondicionado ? HIGH : LOW);
            stateChanged = true;
            Serial.print("Ar condicionado: ");
            Serial.println(estadoArCondicionado ? "LIGADO" : "DESLIGADO");
        }
        if (stateChanged)
        {
            client.publish("smarthome790/sala/ar", estadoArCondicionado ? "on" : "off", true);
        }
    }
}

// ====================================
// ACIONAMENTO DO PORTÃO
// ====================================
void acionarPortao()
{
    Serial.println("Acionando portão da garagem...");

    // Inverte o estado lógico do portão (simula abertura/fechamento)
    estadoPortao = !estadoPortao;

    // Pulso no relé (simula acionamento de um motor/trava)
    digitalWrite(PORTAO_PIN, HIGH);
    delay(500); // Pulso de 500ms
    digitalWrite(PORTAO_PIN, LOW);

    // Publica o novo estado do portão
    // Note que para o portão, 'open' e 'closed' são estados, não 'on/off'
    client.publish("smarthome790/garagem/portao", estadoPortao ? "open" : "closed", true);

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

            // Publica status inicial (garante que os estados sejam reportados ao broker)
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
    client.subscribe("smarthome790/sala/luz1");
    client.subscribe("smarthome790/quarto/luz1");
    client.subscribe("smarthome790/cozinha/tomada1");
    client.subscribe("smarthome790/jardim/irrigacao");
    client.subscribe("smarthome790/garagem/portao");
    client.subscribe("smarthome790/sala/ar");

    Serial.println("Inscrito em todos os tópicos de comando");
}

// ====================================
// PUBLICAÇÃO DO STATUS INICIAL
// ====================================
void publicarStatusInicial()
{
    // Publica estado atual de todos os dispositivos baseado nas variáveis de estado
    client.publish("smarthome790/sala/luz1", estadoLuzSala ? "on" : "off", true);
    client.publish("smarthome790/quarto/luz1", estadoLuzQuarto ? "on" : "off", true);
    client.publish("smarthome790/cozinha/tomada1", estadoTomadaCozinha ? "on" : "off", true);
    client.publish("smarthome790/jardim/irrigacao", estadoIrrigacao ? "on" : "off", true);
    client.publish("smarthome790/sala/ar", estadoArCondicionado ? "on" : "off", true);
    client.publish("smarthome790/garagem/portao", estadoPortao ? "open" : "closed", true);

    // Publica informações do sistema
    String infoMsg = "{\"ip\":\"" + WiFi.localIP().toString() + "\",\"rssi\":" + WiFi.RSSI() + ",\"uptime\":" + millis() + "}";
    client.publish("smarthome790/sistema/info", infoMsg.c_str());

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
    doc["temperature"] = temperatura;
    doc["humidity"] = umidade;
    doc["timestamp"] = millis();

    String jsonString;
    serializeJson(doc, jsonString);

    // Publica no tópico principal
    client.publish("smarthome790/sensores/dht22", jsonString.c_str());

    // Publica também em tópicos separados (compatibilidade)
    client.publish("smarthome790/sala/temperatura", String(temperatura).c_str());
    client.publish("smarthome790/sala/umidade", String(umidade).c_str());
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

    client.publish("smarthome790/sistema/heartbeat", jsonString.c_str());
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
        return; // Retorna para que o loop comece do zero após a reconexão
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