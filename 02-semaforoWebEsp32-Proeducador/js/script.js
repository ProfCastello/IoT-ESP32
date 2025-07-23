// Configurações MQTT
const MQTT_HOST = "broker.hivemq.com";
const MQTT_PORT = 8884;
const MQTT_TOPIC = "proeducador790/semaforo";
let clientWeb = null;
let isConnected = false;
let reconnectTimeout = null;

// Inicializar cliente MQTT
function initMQTT() {
  const clientId = "Esp32" + Math.floor(Math.random() * 900) + 100;
  clientWeb = new Paho.MQTT.Client(MQTT_HOST, MQTT_PORT, clientId);

  // Configurar callbacks
  clientWeb.onConnectionLost = handleConnectionLost;
  clientWeb.onMessageArrived = handleMessageArrived;

  connectMQTT();
}

// Conectar ao broker MQTT
function connectMQTT() {
  clientWeb.connect({
    useSSL: true,
    timeout: 10,
    onSuccess: handleConnectSuccess,
    onFailure: handleConnectFailure,
  });
}

// Sucesso na conexão
function handleConnectSuccess() {
  console.log("Conectado ao broker MQTT");
  alert("Conectado ao broker MQTT");
  isConnected = true;

  // Limpar timeout de reconexão
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  // Assinar tópico
  clientWeb.subscribe(MQTT_TOPIC);
}

// Falha na conexão
function handleConnectFailure(error) {
  console.error("Falha na conexão: " + error.errorMessage);
  alert("Falha na conexão: " + error.errorMessage);
  isConnected = false;

  scheduleReconnect();
}

// Reconexão
function scheduleReconnect() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }

  reconnectTimeout = setTimeout(() => {
    console.log("Tentando reconectar...");
    connectMQTT();
  }, 5000);
}

// Conexão perdida
function handleConnectionLost(responseObject) {
  if (responseObject.errorCode !== 0) {
    console.error("Conexão perdida: " + responseObject.errorMessage);
    alert("Conexão perdida. Tentando reconectar...");
    isConnected = false;

    scheduleReconnect();
  }
}

// Mensagem recebida
function handleMessageArrived(message) {
  const payload = message.payloadString;
  console.log(`Mensagem recebida: ${payload}`);

  switch (payload) {
    case "verde":
      document.getElementById("verde").classList.add("verde");
      break;
    case "amarelo":
      document.getElementById("amarelo").classList.add("amarelo");
      break;
    case "vermelho":
      document.getElementById("vermelho").classList.add("vermelho");
      break;
    case "desligar":
      break;
    case "automatico":
      break;
    default:
      console.warn("Comando desconhecido: " + payload);
  }
}

// Enviar mensagem MQTT
function enviarMensagem(mensagem) {
  if (isConnected && clientWeb.isConnected()) {
    const msg = new Paho.MQTT.Message(mensagem);
    msg.destinationName = MQTT_TOPIC;
    clientWeb.send(msg);
    console.log(`Mensagem enviada: ${mensagem}`);
  } else {
    alert("Cliente MQTT não está conectado. Tentando reconectar...");
    scheduleReconnect();
  }
}

// Controle de LEDs
function ligarLed(corFuncao) {
  desligarVisual();
  enviarMensagem(corFuncao);
}

function desligarVisual() {
  document.getElementById("vermelho").classList.remove("vermelho");
  document.getElementById("amarelo").classList.remove("amarelo");
  document.getElementById("verde").classList.remove("verde");
}

// Inicializar sistema
initMQTT();
