let clienteWeb = null;

const clientId = "Esp32" + Math.floor(Math.random() * 900) + 100;
clienteWeb = new Paho.MQTT.Client("broker.hivemq.com", 8884, clientId);

// Obtem acesso ao elemento do HTML
const tempPagina = document.getElementById("temperatura");
const umidadePagina = document.getElementById("umidade");
const timePagina = document.getElementById("time");

// Define o callback para quando a mensagem chegar
clienteWeb.onMessageArrived = onMessage;

// Conecta ao Broker MQTT
function connectBroker() {
  clienteWeb.connect({
    useSSL: true,
    onSuccess: function () {
      alert("Conexão com Broker bem sucedida");
      clienteWeb.subscribe("senai510/temperatura/m");
    },
    onFailure: function () {
      alert("Falha ao conectar ao Broker");
    },
  });
}

// Define o callback para quando a conexão for perdida
clienteWeb.onConnectionLost = function (responseObject) {
  if (responseObject.errorCode !== 0) {
    alert("A conexão com o Broker foi perdida: " + responseObject.errorMessage);
  }
  console.log("Conexão perdida: " + responseObject.errorMessage);
  tempPagina.textContent = "Conexão perdida";
  umidadePagina.textContent = "";
  timePagina.textContent = "";

  // Tenta reconectar após 5 segundos
  setTimeout(connectBroker, 5000);
};

// Define a função para processar mensagens recebidas
function onMessage(message) {
  const payload = message.payloadString;
  const dados = JSON.parse(payload);

  tempPagina.textContent = String(dados.temperatura) + " °C";
  umidadePagina.textContent = String(dados.umidade) + " %";

  const agora = new Date();
  const dataPtBR = agora.toLocaleString();
  timePagina.textContent = "Atualizado em: " + dataPtBR;
}

// Inicia a conexão
connectBroker();
