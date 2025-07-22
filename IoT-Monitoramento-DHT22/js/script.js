// Constante para URL da API do sensor IoT
const IOT_SENSOR_API_URL = "http://192.168.1.100/api/temperature"; // Altere para o IP do seu ESP32

// Variáveis globais para dados meteorológicos
let weatherData = {
  maxTemp: null,
  minTemp: null,
  location: "Carregando...",
};

// Atualizar horário atual
function updateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString("pt-BR");
  document.getElementById("currentTime").textContent = timeString;
}

// Obter localização e dados meteorológicos
function getLocationAndWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          // Usando OpenWeatherMap API (substitua YOUR_API_KEY pela sua chave)
          const apiKey = "YOUR_API_KEY"; // Obtenha em https://openweathermap.org/api
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`
          );

          if (response.ok) {
            const data = await response.json();
            weatherData.maxTemp = data.main.temp_max;
            weatherData.minTemp = data.main.temp_min;
            weatherData.location = data.name;

            updateWeatherDisplay();
          } else {
            // Fallback com dados simulados baseados na localização
            simulateLocalWeather();
          }
        } catch (error) {
          console.log(
            "Erro ao obter dados meteorológicos, usando dados simulados"
          );
          simulateLocalWeather();
        }
      },
      (error) => {
        console.log("Erro ao obter localização:", error);
        simulateLocalWeather();
      }
    );
  } else {
    console.log("Geolocalização não suportada");
    simulateLocalWeather();
  }
}

// Simular dados meteorológicos locais quando não conseguir obter da API
function simulateLocalWeather() {
  const baseTemp = 20 + Math.random() * 10; // Temperatura base entre 20-30°C
  weatherData.maxTemp = (baseTemp + Math.random() * 5).toFixed(1);
  weatherData.minTemp = (baseTemp - Math.random() * 8).toFixed(1);
  weatherData.location = "São Paulo"; // Localização padrão

  updateWeatherDisplay();
}

// Atualizar display com dados meteorológicos
function updateWeatherDisplay() {
  if (weatherData.maxTemp !== null) {
    document.getElementById("maxTemp").textContent = weatherData.maxTemp + "°C";
    document.getElementById("minTemp").textContent = weatherData.minTemp + "°C";
  }
}

// Obter temperatura atual do sensor IoT via JSON
async function getCurrentTemperature() {
  try {
    const response = await fetch(IOT_SENSOR_API_URL);

    if (response.ok) {
      const data = await response.json();

      // Esperando JSON no formato: {"temperature": 25.4, "humidity": 60.2, "timestamp": "2025-07-22T10:30:00Z"}
      if (data.temperature !== undefined) {
        updateTemperatureDisplay(data.temperature, data.humidity);
        document.getElementById("lastUpdate").textContent = "Agora mesmo";

        // Atualizar status da conexão
        updateConnectionStatus(true);
        return;
      }
    }

    // Se falhar, usar simulação
    throw new Error("Falha ao obter dados do sensor");
  } catch (error) {
    console.log("Erro ao conectar com sensor IoT:", error.message);

    // Fallback: simular temperatura
    simulateTemperature();
    updateConnectionStatus(false);
  }
}

// Atualizar display da temperatura
function updateTemperatureDisplay(temperature, humidity = null) {
  document.getElementById("temperature").textContent =
    temperature.toFixed(1) + "°C";

  // Atualizar badge de status baseado na temperatura
  const statusBadge = document.querySelector(".status-badge");
  const statusIcon = statusBadge.querySelector("i");

  if (temperature < 18) {
    statusBadge.className = "badge bg-primary status-badge mt-2";
    statusIcon.className = "bi bi-thermometer-low me-1";
    statusBadge.innerHTML = '<i class="bi bi-thermometer-low me-1"></i>Baixa';
  } else if (temperature > 28) {
    statusBadge.className = "badge bg-danger status-badge mt-2";
    statusIcon.className = "bi bi-thermometer-high me-1";
    statusBadge.innerHTML = '<i class="bi bi-thermometer-high me-1"></i>Alta';
  } else {
    statusBadge.className = "badge bg-success status-badge mt-2";
    statusIcon.className = "bi bi-check-circle me-1";
    statusBadge.innerHTML = '<i class="bi bi-check-circle me-1"></i>Normal';
  }

  // Atualizar umidade se disponível
  if (humidity !== null && document.getElementById("humidity")) {
    document.getElementById("humidity").textContent = humidity.toFixed(1) + "%";
  }
}

// Simular atualização de temperatura (fallback)
function simulateTemperature() {
  const temp = 20 + Math.random() * 10;
  updateTemperatureDisplay(temp);
  document.getElementById("lastUpdate").textContent = "Simulado - Agora mesmo";
}

// Atualizar status da conexão
function updateConnectionStatus(isOnline) {
  const connectionSpan = document.querySelector("[data-connection-status]");
  const wifiIcon = document.querySelector("[data-wifi-icon]");

  if (connectionSpan) {
    if (isOnline) {
      connectionSpan.textContent = "Online";
      connectionSpan.className = "text-success";
      if (wifiIcon) wifiIcon.className = "bi bi-wifi text-success me-3 fs-4";
    } else {
      connectionSpan.textContent = "Offline (Simulado)";
      connectionSpan.className = "text-warning";
      if (wifiIcon)
        wifiIcon.className = "bi bi-wifi-off text-warning me-3 fs-4";
    }
  }
}

// Inicializar aplicação
function initializeApp() {
  updateTime();
  getLocationAndWeather();
  getCurrentTemperature();

  // Intervalos de atualização
  setInterval(updateTime, 1000);
  setInterval(getCurrentTemperature, 5000); // Atualizar temperatura a cada 5 segundos
  setInterval(getLocationAndWeather, 300000); // Atualizar dados meteorológicos a cada 5 minutos
}

// Inicializar quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", initializeApp);
