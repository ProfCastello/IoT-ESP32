// Constante para URL da API do sensor IoT
const IOT_SENSOR_API_URL = "http://192.168.1.100/api/temperature"; // Altere para o IP do seu ESP32
const IOT_LOCAL_JSON = "./iot-sensor-data.json"; // JSON local para desenvolvimento

// Variáveis globais para dados meteorológicos
let weatherData = {
  currentTemp: null,
  maxTemp: null,
  minTemp: null,
  location: "Carregando...",
};

// Variável para controle do sensor IoT
let iotSensorData = {
  temperature: null,
  humidity: null,
  battery: null,
  status: "connecting",
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
          // Usando wttr.in API (sem necessidade de chave)
          // Formato: wttr.in/{lat},{lon}?format=j1
          const response = await fetch(
            `https://wttr.in/${lat},${lon}?format=j1`,
            {
              headers: {
                "User-Agent": "IoT-Monitoring-System",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();

            // wttr.in retorna temperatura em Celsius por padrão
            const currentCondition = data.current_condition[0];
            const weather = data.weather[0];

            weatherData.currentTemp = parseFloat(currentCondition.temp_C);
            weatherData.maxTemp = parseFloat(weather.maxtempC);
            weatherData.minTemp = parseFloat(weather.mintempC);

            // Obter nome da localização mais amigável
            const location = data.nearest_area[0];
            const cityName = location.areaName[0].value;
            const countryName = location.country[0].value;
            weatherData.location = `${cityName}, ${countryName}`;

            updateWeatherDisplay();
            updateLocationDisplay(weatherData.location, "GPS", true);
          } else {
            // Se a API falhar, mostrar erro mas não simular dados
            handleWeatherApiError();
          }
        } catch (error) {
          console.log(
            "Erro ao obter dados meteorológicos da API wttr.in:",
            error
          );
          handleWeatherApiError();
        }
      },
      (error) => {
        console.log("Erro ao obter localização:", error);
        handleLocationError();
      }
    );
  } else {
    console.log("Geolocalização não suportada");
    handleLocationError();
  }
}

// Lidar com erro da API meteorológica
function handleWeatherApiError() {
  weatherData.location = "API Indisponível";
  updateLocationDisplay("Serviço wttr.in indisponível", "Erro", false);

  document.getElementById("currentTemp").textContent = "N/A";
  document.getElementById("maxTemp").textContent = "N/A";
  document.getElementById("minTemp").textContent = "N/A";
  document.getElementById("currentTempLocation").textContent =
    "Serviço indisponível";
  document.getElementById("maxTempLocation").textContent =
    "Serviço indisponível";
  document.getElementById("minTempLocation").textContent =
    "Serviço indisponível";
}

// Lidar com erro de localização
function handleLocationError() {
  updateLocationDisplay("Localização não disponível", "Erro", false);
  handleWeatherApiError();
}

// Atualizar display da localização
function updateLocationDisplay(location, accuracyType, isRealLocation) {
  const locationElement = document.getElementById("currentLocation");
  const accuracyElement = document.getElementById("locationAccuracy");
  const weatherSourceElement = document.getElementById("weatherSource");

  if (locationElement) {
    locationElement.innerHTML = `
      <i class="bi bi-geo-alt-fill me-2"></i>
      ${location}
    `;
  }

  if (accuracyElement) {
    if (isRealLocation) {
      accuracyElement.className = "badge bg-success";
      accuracyElement.innerHTML = `<i class="bi bi-check-circle me-1"></i>${accuracyType}`;
    } else {
      accuracyElement.className = "badge bg-warning";
      accuracyElement.innerHTML = `<i class="bi bi-exclamation-triangle me-1"></i>${accuracyType}`;
    }
  }

  if (weatherSourceElement) {
    if (isRealLocation) {
      weatherSourceElement.innerHTML = `Dados meteorológicos em tempo real`;
    } else {
      weatherSourceElement.innerHTML = `Dados simulados para demonstração`;
    }
  }
}

// Atualizar display com dados meteorológicos
function updateWeatherDisplay() {
  if (weatherData.currentTemp !== null) {
    document.getElementById("currentTemp").textContent =
      weatherData.currentTemp.toFixed(1) + "°C";
    document.getElementById("maxTemp").textContent =
      weatherData.maxTemp.toFixed(1) + "°C";
    document.getElementById("minTemp").textContent =
      weatherData.minTemp.toFixed(1) + "°C";

    // Atualizar localização nos cards de temperatura
    const locationText = weatherData.location;
    const currentTempLocationElement = document.getElementById(
      "currentTempLocation"
    );
    const maxTempLocationElement = document.getElementById("maxTempLocation");
    const minTempLocationElement = document.getElementById("minTempLocation");

    if (currentTempLocationElement) {
      currentTempLocationElement.textContent = locationText;
    }
    if (maxTempLocationElement) {
      maxTempLocationElement.textContent = locationText;
    }
    if (minTempLocationElement) {
      minTempLocationElement.textContent = locationText;
    }
  }
}

// Obter dados do sensor IoT
async function getCurrentTemperature() {
  try {
    // Primeiro tenta obter dados da API do ESP32
    let response = await fetch(IOT_SENSOR_API_URL);

    if (!response.ok) {
      // Se falhar, tenta o JSON local para desenvolvimento
      console.log(
        "API do ESP32 não disponível, usando dados locais para desenvolvimento"
      );
      response = await fetch(IOT_LOCAL_JSON);
    }

    if (response.ok) {
      const data = await response.json();

      // Se for da API do ESP32 (formato simples)
      if (data.temperature !== undefined) {
        updateIoTDisplay(data.temperature, data.humidity, data.battery || 85);
        document.getElementById("lastUpdate").textContent = "Agora mesmo";
        updateConnectionStatus(true);
        return;
      }

      // Se for do JSON local (formato completo)
      if (data.current && data.current.temperature !== undefined) {
        updateIoTDisplay(
          data.current.temperature,
          data.current.humidity,
          data.current.battery
        );
        document.getElementById("lastUpdate").textContent =
          "Simulado - " +
          new Date(data.current.timestamp).toLocaleTimeString("pt-BR");
        updateConnectionStatus(false);
        return;
      }
    }

    // Se tudo falhar, usar simulação básica
    throw new Error("Falha ao obter dados do sensor");
  } catch (error) {
    console.log("Erro ao conectar com sensor IoT:", error.message);

    // Fallback: simular temperatura
    simulateIoTTemperature();
    updateConnectionStatus(false);
  }
}

// Atualizar display do sensor IoT
function updateIoTDisplay(temperature, humidity = null, battery = null) {
  iotSensorData.temperature = temperature;
  iotSensorData.humidity = humidity;
  // Garantir que a bateria seja sempre um número inteiro
  iotSensorData.battery = battery !== null ? Math.round(battery) : null;

  document.getElementById("iotTemperature").textContent =
    temperature.toFixed(1) + "°C";

  // Aplicar cor de fundo baseada na temperatura
  updateTemperatureCardColor(temperature);

  // Atualizar badge de status baseado na temperatura do IoT
  const statusBadge = document.querySelector(".status-badge");

  if (temperature < 10) {
    statusBadge.className = "badge bg-info status-badge mt-2";
    statusBadge.innerHTML =
      '<i class="bi bi-thermometer-snow me-1"></i>Muito Frio';
  } else if (temperature < 18) {
    statusBadge.className = "badge bg-primary status-badge mt-2";
    statusBadge.innerHTML = '<i class="bi bi-thermometer-low me-1"></i>Frio';
  } else if (temperature < 22) {
    statusBadge.className = "badge bg-success status-badge mt-2";
    statusBadge.innerHTML = '<i class="bi bi-thermometer me-1"></i>Agradável';
  } else if (temperature < 26) {
    statusBadge.className = "badge bg-success status-badge mt-2";
    statusBadge.innerHTML =
      '<i class="bi bi-check-circle me-1"></i>Confortável';
  } else if (temperature < 30) {
    statusBadge.className = "badge bg-warning status-badge mt-2";
    statusBadge.innerHTML = '<i class="bi bi-thermometer-half me-1"></i>Morno';
  } else if (temperature < 35) {
    statusBadge.className = "badge bg-danger status-badge mt-2";
    statusBadge.innerHTML = '<i class="bi bi-thermometer-high me-1"></i>Quente';
  } else {
    statusBadge.className = "badge bg-dark status-badge mt-2";
    statusBadge.innerHTML =
      '<i class="bi bi-exclamation-triangle me-1"></i>Muito Quente';
  }

  // Atualizar bateria no status se disponível
  if (battery !== null) {
    const batteryElement = document.querySelector("[data-battery]");
    if (batteryElement) {
      // O valor da bateria já foi arredondado na entrada da função
      batteryElement.textContent = iotSensorData.battery + "%";
    }
  }
}

// Função para aplicar cor de fundo baseada na temperatura
function updateTemperatureCardColor(temperature) {
  const card = document.querySelector(".temperature-card");
  const icon = document.querySelector(".sensor-icon");

  // Remover todas as classes de temperatura existentes
  const tempClasses = [
    "temp-freezing",
    "temp-cold",
    "temp-cool",
    "temp-comfortable",
    "temp-warm",
    "temp-hot",
    "temp-very-hot",
    "temp-extreme",
  ];
  const iconClasses = ["freezing", "cold", "hot", "extreme"];

  tempClasses.forEach((cls) => card.classList.remove(cls));
  iconClasses.forEach((cls) => icon.classList.remove(cls));

  // Aplicar classe baseada na temperatura
  // Faixas de temperatura com cores intuitivas:
  // < 5°C: Congelante (azul escuro)
  // 5-15°C: Frio (azul/roxo)
  // 15-20°C: Fresco (verde/azul)
  // 20-25°C: Confortável (verde)
  // 25-30°C: Morno (rosa/laranja)
  // 30-35°C: Quente (laranja/vermelho)
  // 35-40°C: Muito quente (vermelho)
  // > 40°C: Extremo (vermelho escuro com animação)

  if (temperature < 5) {
    card.classList.add("temp-freezing");
    icon.classList.add("freezing");
  } else if (temperature < 15) {
    card.classList.add("temp-cold");
    icon.classList.add("cold");
  } else if (temperature < 20) {
    card.classList.add("temp-cool");
  } else if (temperature < 25) {
    card.classList.add("temp-comfortable");
  } else if (temperature < 30) {
    card.classList.add("temp-warm");
  } else if (temperature < 35) {
    card.classList.add("temp-hot");
    icon.classList.add("hot");
  } else if (temperature < 40) {
    card.classList.add("temp-very-hot");
    icon.classList.add("hot");
  } else {
    card.classList.add("temp-extreme");
    icon.classList.add("extreme");
  }
}

// Simular dados do sensor IoT (fallback)
function simulateIoTTemperature() {
  const temp = 20 + Math.random() * 10;
  const humidity = 50 + Math.random() * 30;
  // Gerar bateria como número inteiro entre 80 e 100
  const battery = Math.floor(80 + Math.random() * 21);

  updateIoTDisplay(temp, humidity, battery);
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
  console.log("🚀 Iniciando Sistema IoT de Monitoramento");
  console.log("📡 Sensor IoT: ESP32 + DHT22 (com fallback simulado)");
  console.log("🌍 Dados Climáticos: wttr.in API (sem necessidade de chave)");
  console.log("📍 Localização: Geolocalização do navegador");
  console.log("🌓 Tema: Detecção automática baseada no sistema operacional");

  // Inicializar tema
  initializeTheme();

  updateTime();
  getLocationAndWeather(); // Dados reais da API wttr.in
  getCurrentTemperature(); // Sensor IoT (simulado se não conectado)

  // Intervalos de atualização
  setInterval(updateTime, 1000);
  setInterval(getCurrentTemperature, 5000); // Sensor IoT - atualizar a cada 5 segundos
  setInterval(getLocationAndWeather, 300000); // API meteorológica - atualizar a cada 5 minutos
}

// ========================================
// SISTEMA DE TEMAS DARK/LIGHT
// ========================================

// Inicializar sistema de temas
function initializeTheme() {
  const themeToggle = document.getElementById("themeToggle");

  // Verificar preferência do sistema operacional
  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

  // Verificar tema salvo no localStorage ou usar preferência do sistema
  const savedTheme = localStorage.getItem("theme");
  const systemTheme = prefersDarkScheme.matches ? "dark" : "light";
  const defaultTheme = savedTheme || systemTheme;

  // Log informativo sobre detecção do tema
  if (savedTheme) {
    console.log(`🎨 Tema: ${savedTheme} (salvo pelo usuário)`);
  } else {
    console.log(`🎨 Tema: ${systemTheme} (detectado do sistema operacional)`);
  }

  setTheme(defaultTheme);

  // Event listener para o botão de tema
  themeToggle.addEventListener("click", toggleTheme);

  // Escutar mudanças na preferência do sistema (opcional)
  prefersDarkScheme.addEventListener("change", (e) => {
    // Só aplica automaticamente se o usuário não definiu uma preferência manual
    if (!localStorage.getItem("theme")) {
      const newSystemTheme = e.matches ? "dark" : "light";
      console.log(
        `🎨 Tema alterado automaticamente para: ${newSystemTheme} (sistema operacional)`
      );
      setTheme(newSystemTheme);
    }
  });
}

// Alternar entre temas
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  setTheme(newTheme);
}

// Aplicar tema
function setTheme(theme) {
  const themeIcon = document.getElementById("themeIcon");
  const body = document.body;

  // Adicionar classe de animação antes de trocar
  themeIcon.style.transform = "rotate(180deg) scale(0.8)";

  setTimeout(() => {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      body.classList.remove("bg-light");
      body.classList.add("bg-dark");

      // Atualizar ícone para lua (tema escuro ativo)
      themeIcon.className = "bi bi-moon-fill";
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      body.classList.remove("bg-dark");
      body.classList.add("bg-light");

      // Atualizar ícone para sol (tema claro ativo)
      themeIcon.className = "bi bi-sun-fill";
    }

    // Restaurar animação
    themeIcon.style.transform = "rotate(0deg) scale(1)";

    // Salvar tema no localStorage (definindo preferência manual)
    localStorage.setItem("theme", theme);
  }, 150);
}

// Inicializar quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", initializeApp);
