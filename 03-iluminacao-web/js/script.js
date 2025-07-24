let clienteWeb = null;

const clientId = "Esp32" + Math.floor(Math.random() * 900) + 100;
clienteWeb = new Paho.MQTT.Client("broker.hivemq.com", 8884, clientId);

clienteWeb.connect({
  useSSL: true,
  onSuccess: function () {
    alert("A conexão com Broker foi bem sucedida");
  },
  onFailure: function () {
    alert("A conexão com Broker falhou");
  },
});

ligarLampada = (lampada) => {
  document.getElementById(lampada).classList.toggle("ligada");
  const button = document.getElementById(`btn-${lampada}`);
  button.innerText = button.innerText === "Ligar" ? "Desligar" : "Ligar";
};
