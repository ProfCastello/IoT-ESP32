let lampadaSalaLigada = false
let lampadaCozinhaLigada = false
//conectar com o broker MQTT
//https://www.hivemq.com/mqtt-client/
let clienteWeb = null

const clientId = 'Esp32' + Math.floor(Math.random() * 900) + 100;
clienteWeb = new Paho.MQTT.Client('broker.hivemq.com', 8884, clientId);

clienteWeb.connect({
    useSSL: true,
    onSuccess: function () {
        alert('A conexão com Broker foi bem sucedida')
    },
    onFailure: function () {
        alert('A conexão com Broker falhou')
    }
});

function ligarLampadaSala() {
    const msg = new Paho.MQTT.Message("")

    if (lampadaSalaLigada == false) {
        //alert("Ligar a lâmpada da sala");
        document.getElementById("lampadaSala").classList.add("acesa")
        document.getElementById("bt-sala").textContent = "Desligar"
        lampadaSalaLigada = true;
        msg.destinationName = "senai115/lampada/sala/ligar"
    } else {
        document.getElementById("lampadaSala").classList.remove("acesa")
        //alert("Desligar a lâmpada da sala");
        document.getElementById("bt-sala").textContent = "ligar"
        lampadaSalaLigada = false;
        msg.destinationName = "senai115/lampada/sala/desligar"
    }
    clienteWeb.send(msg)
}

function ligarLampadacozinha() {
    const msg = new Paho.MQTT.Message("")

    if (lampadaCozinhaLigada == false) {
        lampadaCozinhaLigada = true
        document.getElementById("bt-cozinha").textContent = "Desligar"
        msg.destinationName = "senai115/lampada/cosinha/ligar"
    } else {
        lampadaCozinhaLigada = false
        document.getElementById("bt-cozinha").textContent = "Ligar"
        msg.destinationName = "senai115/lampada/cosinha/desligar"

    }
    
    // foi feito modo fiferente de sala e cosinha 
    document.getElementById("lamp-cozinha").classList.toggle("acesa")
    clienteWeb.send(msg)
}

ligarLampada = (lampada) => {
  document.getElementById(lampada).classList.toggle("ligada");
  const button = document.getElementById(`btn-${lampada}`);
  button.innerText = button.innerText === "Ligar" ? "Desligar" : "Ligar";
};
