// Atualizar horário atual
function updateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString("pt-BR");
  document.getElementById("currentTime").textContent = timeString;
}

// Simular atualização de temperatura
function simulateTemperature() {
  const temp = (20 + Math.random() * 10).toFixed(1);
  document.getElementById("temperature").textContent = temp + "°C";

  // Atualizar timestamp
  document.getElementById("lastUpdate").textContent = "Agora mesmo";
}

// Inicializar
updateTime();
setInterval(updateTime, 1000);
setInterval(simulateTemperature, 5000);
