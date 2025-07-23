let clientWeb = null;
const clientId = "Esp32" + Math.floor(Math.random() * 900) + 100;
let MQTT_HOST = "broker.hivemq.com";
let MQTT_PORT = 8884;
let MQTT_TOPIC = "proeducador790/semaforo";
let isConnected = false;
let reconnectTimeout = null;

clientWeb = new Paho.MQTT.Client(MQTT_HOST, MQTT_PORT, clientId);

// Configurar callbacks
clientWeb.onConnectionLost = onConnectionLost;
clientWeb.onMessageArrived = onMessageArrived;

function connectMQTT() {
  clientWeb.connect({
    useSSL: true,
    timeout: 2,
    onSuccess: onConnect,
    onFailure: onConnectFailure,
  });
}

function onConnect() {
  console.log("Conectado ao broker MQTT");
  alert("Conectado ao broker MQTT");
  isConnected = true;

  // Limpar timeout de reconexão se existir
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
}

function onConnectFailure(error) {
  console.log("Falha na conexão: " + error.errorMessage);
  alert("Falha na conexão: " + error.errorMessage);
  isConnected = false;

  // Tentar reconectar após 5 segundos
  scheduleReconnect();
}

function onConnectionLost(responseObject) {
  if (responseObject.errorCode !== 0) {
    console.log("Conexão perdida: " + responseObject.errorMessage);
    alert("Conexão perdida. Tentando reconectar...");
    isConnected = false;

    // Tentar reconectar
    scheduleReconnect();
  }
}

function onMessageArrived(message) {
  console.log("Mensagem recebida: " + message.payloadString);
}

function scheduleReconnect() {
  // Evitar múltiplos timeouts de reconexão
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }

  reconnectTimeout = setTimeout(() => {
    console.log("Tentando reconectar...");
    connectMQTT();
  }, 5000); // Reconectar após 5 segundos
}

// Iniciar conexão
connectMQTT();

// Adicionar suporte aos tópicos MQTT específicos
const MQTT_TOPICO_LIGAR_VERDE = "proeducador790/semaforo/verde";
const MQTT_TOPICO_LIGAR_AMARELO = "proeducador790/semaforo/amarelo";
const MQTT_TOPICO_LIGAR_VERMELHO = "proeducador790/semaforo/vermelho";
const MQTT_TOPICO_DESLIGAR = "proeducador790/semaforo/desligar";
const MQTT_TOPICO_AUTOMATICO = "proeducador790/semaforo/automatico";

// Função para enviar mensagens MQTT
function enviarMensagem(topico, mensagem) {
  if (isConnected && clientWeb.isConnected()) {
    const msg = new Paho.MQTT.Message(mensagem);
    msg.destinationName = topico;
    clientWeb.send(msg);
    console.log(`Mensagem enviada: ${mensagem}`);
  } else {
    alert("Cliente MQTT não está conectado. Tentando reconectar...");
    if (!reconnectTimeout) {
      scheduleReconnect();
    }
  }
}

// Funções para controlar LEDs
function ligarVermelho() {
  document.getElementById("vermelho").classList.add("vermelho");
  enviarMensagem(MQTT_TOPICO_LIGAR_VERMELHO, "vermelho");
}

function ligarAmarelo() {
  document.getElementById("amarelo").classList.add("amarelo");
  enviarMensagem(MQTT_TOPICO_LIGAR_AMARELO, "amarelo");
}

function ligarVerde() {
  document.getElementById("verde").classList.add("verde");
  enviarMensagem(MQTT_TOPICO_LIGAR_VERDE, "verde");
}

function desligarLed() {
  document.getElementById("vermelho").classList.remove("vermelho");
  document.getElementById("amarelo").classList.remove("amarelo");
  document.getElementById("verde").classList.remove("verde");
  enviarMensagem(MQTT_TOPICO_DESLIGAR, "desligar");
}

function ligarAutomatico() {
  enviarMensagem(MQTT_TOPICO_AUTOMATICO, "automatico");
}
