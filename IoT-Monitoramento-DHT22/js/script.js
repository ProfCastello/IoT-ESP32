// ========================================
// DETECÇÃO PRECOCE DO TEMA (Evitar flash de conteúdo)
// ========================================

// Executar imediatamente quando o script é carregado
(function () {
  // Detectar preferência do sistema e tema salvo
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const savedTheme = localStorage.getItem("theme");
  const theme = savedTheme || (prefersDark ? "dark" : "light");

  // Aplicar tema imediatamente
  document.documentElement.setAttribute("data-theme", theme);

  // Aplicar classe inicial ao body baseado no tema detectado
  if (theme === "dark") {
    document.documentElement.classList.add("theme-dark-init");
  } else {
    document.documentElement.classList.add("theme-light-init");
  }
})();

// ========================================
// CONFIGURAÇÕES E CONSTANTES
// ========================================

// Constante para URL da API do sensor IoT
const IOT_SENSOR_API_URL = "http://192.168.1.100/api/temperature"; // Altere para o IP do seu ESP32
const IOT_LOCAL_JSON = "./iot-sensor-data.json"; // JSON local para desenvolvimento

// Variáveis globais para dados meteorológicos
let weatherData = {
  currentTemp: null,
  maxTemp: null,
  minTemp: null,
  currentHumidity: null,
  maxHumidity: null,
  minHumidity: null,
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

// Funções de validação de dados
function validateTemperature(temp) {
  const temperature = parseFloat(temp);
  return !isNaN(temperature) && temperature >= -50 && temperature <= 80;
}

function validateHumidity(hum) {
  const humidity = parseFloat(hum);
  return !isNaN(humidity) && humidity >= 0 && humidity <= 100;
}

function validateBattery(bat) {
  const battery = parseFloat(bat);
  return !isNaN(battery) && battery >= 0 && battery <= 100;
}

// Obter localização e dados meteorológicos - VERSÃO MELHORADA
function getLocationAndWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          // Tentar com diferentes endpoints para contornar CORS
          let response;
          try {
            response = await fetch(`https://wttr.in/${lat},${lon}?format=j1`, {
              headers: { "User-Agent": "IoT-Monitoring-System" },
              mode: "cors",
            });
          } catch (corsError) {
            console.log("Tentando proxy para contornar CORS...");
            // Fallback para proxy público se CORS falhar
            response = await fetch(
              `https://api.allorigins.win/raw?url=${encodeURIComponent(
                `https://wttr.in/${lat},${lon}?format=j1`
              )}`
            );
          }

          if (response.ok) {
            const data = await response.json();

            // wttr.in retorna temperatura em Celsius por padrão
            const currentCondition = data.current_condition[0];
            const weather = data.weather[0];

            // Validar dados antes de usar
            const currentTemp = parseFloat(currentCondition.temp_C);
            const maxTemp = parseFloat(weather.maxtempC);
            const minTemp = parseFloat(weather.mintempC);

            // Capturar dados de umidade
            const currentHumidity = parseInt(currentCondition.humidity);

            // Calcular umidade máxima e mínima do dia a partir dos dados horários
            let maxHumidity = 0;
            let minHumidity = 100;

            weather.hourly.forEach((hour) => {
              const hourHumidity = parseInt(hour.humidity);
              if (hourHumidity > maxHumidity) maxHumidity = hourHumidity;
              if (hourHumidity < minHumidity) minHumidity = hourHumidity;
            });

            if (
              validateTemperature(currentTemp) &&
              validateTemperature(maxTemp) &&
              validateTemperature(minTemp) &&
              validateHumidity(currentHumidity) &&
              validateHumidity(maxHumidity) &&
              validateHumidity(minHumidity)
            ) {
              weatherData.currentTemp = currentTemp;
              weatherData.maxTemp = maxTemp;
              weatherData.minTemp = minTemp;
              weatherData.currentHumidity = currentHumidity;
              weatherData.maxHumidity = maxHumidity;
              weatherData.minHumidity = minHumidity;

              // Obter nome da localização mais amigável
              const location = data.nearest_area[0];
              const cityName = location.areaName[0].value;
              const countryName = location.country[0].value;
              weatherData.location = `${cityName}, ${countryName}`;

              updateWeatherDisplay();
              updateLocationDisplay(weatherData.location, "GPS", true);
            } else {
              throw new Error("Dados meteorológicos inválidos recebidos");
            }
          } else {
            throw new Error(`API wttr.in retornou status: ${response.status}`);
          }
        } catch (error) {
          console.log("Erro ao obter dados meteorológicos:", error.message);
          handleWeatherApiError();
        }
      },
      (error) => {
        handleLocationError(error);
      }
    );
  } else {
    console.log("Geolocalização não suportada");
    handleLocationError();
  }
}

// Melhor tratamento de erros de localização
function handleLocationError(error) {
  let errorMessage = "Localização não disponível";
  let errorType = "Erro";

  if (error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "Permissão de localização negada";
        errorType = "Permissão";
        console.log("❌ Usuário negou acesso à localização");
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Localização indisponível";
        errorType = "GPS";
        console.log("❌ Posição GPS indisponível");
        break;
      case error.TIMEOUT:
        errorMessage = "Timeout na localização";
        errorType = "Timeout";
        console.log("❌ Timeout ao obter localização");
        break;
      default:
        console.log("❌ Erro desconhecido na geolocalização:", error.message);
    }
  }

  updateLocationDisplay(errorMessage, errorType, false);
  handleWeatherApiError();
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

  // Limpar dados de umidade também
  document.getElementById("currentHumidity").textContent = "N/A";
  document.getElementById("maxHumidity").textContent = "N/A";
  document.getElementById("minHumidity").textContent = "N/A";
  document.getElementById("currentHumidityLocation").textContent =
    "Serviço indisponível";
  document.getElementById("maxHumidityLocation").textContent =
    "Serviço indisponível";
  document.getElementById("minHumidityLocation").textContent =
    "Serviço indisponível";
}

// Obter dados do sensor IoT - VERSÃO MELHORADA
async function getCurrentTemperature() {
  try {
    // Primeiro tenta obter dados da API do ESP32
    let response = await fetch(IOT_SENSOR_API_URL, {
      method: "GET",
      timeout: 5000, // 5 segundos de timeout
    });

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
        const temp = parseFloat(data.temperature);
        const humidity = data.humidity ? parseFloat(data.humidity) : null;
        const battery = data.battery ? parseFloat(data.battery) : null;

        if (validateTemperature(temp)) {
          const validHumidity =
            humidity && validateHumidity(humidity) ? humidity : null;
          const validBattery =
            battery && validateBattery(battery) ? battery : 85;

          updateIoTDisplay(temp, validHumidity, validBattery);
          document.getElementById("lastUpdate").textContent = "Agora mesmo";
          updateConnectionStatus(true);
          return;
        }
      }

      // Se for do JSON local (formato completo)
      if (data.current && data.current.temperature !== undefined) {
        const temp = parseFloat(data.current.temperature);
        const humidity = data.current.humidity
          ? parseFloat(data.current.humidity)
          : null;
        const battery = data.current.battery
          ? parseFloat(data.current.battery)
          : null;

        if (validateTemperature(temp)) {
          const validHumidity =
            humidity && validateHumidity(humidity) ? humidity : null;
          const validBattery =
            battery && validateBattery(battery) ? battery : 85;

          updateIoTDisplay(temp, validHumidity, validBattery);
          document.getElementById("lastUpdate").textContent =
            "Simulado - " +
            new Date(data.current.timestamp).toLocaleTimeString("pt-BR");
          updateConnectionStatus(false);
          return;
        }
      }
    }

    throw new Error("Dados inválidos do sensor");
  } catch (error) {
    console.log("Erro ao conectar com sensor IoT:", error.message);
    simulateIoTTemperature();
    updateConnectionStatus(false);
  }
}

// Atualizar display do sensor IoT - VERSÃO MELHORADA
function updateIoTDisplay(temperature, humidity = null, battery = null) {
  // Validar e armazenar dados
  iotSensorData.temperature = validateTemperature(temperature)
    ? temperature
    : 22.0;
  iotSensorData.humidity =
    humidity && validateHumidity(humidity) ? humidity : null;
  iotSensorData.battery =
    battery && validateBattery(battery) ? Math.round(battery) : null;

  // Atualizar temperatura
  document.getElementById("iotTemperature").textContent =
    iotSensorData.temperature.toFixed(1) + "°C";

  // Atualizar umidade se disponível
  const humidityElement = document.getElementById("iotHumidity");
  if (humidityElement && iotSensorData.humidity !== null) {
    humidityElement.innerHTML = `
      <i class="bi bi-droplet me-1"></i>
      <span>${iotSensorData.humidity.toFixed(1)}%</span>
    `;
    humidityElement.style.display = "block";
  } else if (humidityElement) {
    humidityElement.style.display = "none";
  }

  // Aplicar cor de fundo baseada na temperatura
  updateTemperatureCardColor(iotSensorData.temperature);

  // Atualizar badge de status baseado na temperatura do IoT
  updateTemperatureBadge(iotSensorData.temperature);

  // Atualizar bateria no status se disponível
  if (iotSensorData.battery !== null) {
    const batteryElement = document.querySelector("[data-battery]");
    if (batteryElement) {
      batteryElement.textContent = iotSensorData.battery + "%";
    }
  }
}

// Função separada para atualizar o badge de temperatura
function updateTemperatureBadge(temperature) {
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
}

// Simular dados do sensor IoT (fallback) - VERSÃO MELHORADA
function simulateIoTTemperature() {
  // Gerar valores mais realistas
  const temp = 18 + Math.random() * 12; // Entre 18°C e 30°C
  const humidity = 45 + Math.random() * 35; // Entre 45% e 80%
  const battery = Math.floor(75 + Math.random() * 26); // Entre 75% e 100%

  updateIoTDisplay(temp, humidity, battery);
  document.getElementById("lastUpdate").textContent = "Simulado - Agora mesmo";

  console.log(
    `🎲 Simulação: ${temp.toFixed(1)}°C, ${humidity.toFixed(1)}%, ${battery}%`
  );
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

    // Atualizar dados de umidade
    document.getElementById("currentHumidity").textContent =
      weatherData.currentHumidity + "%";
    document.getElementById("maxHumidity").textContent =
      weatherData.maxHumidity + "%";
    document.getElementById("minHumidity").textContent =
      weatherData.minHumidity + "%";

    // Atualizar localização nos cards de temperatura
    const locationText = weatherData.location;
    const currentTempLocationElement = document.getElementById(
      "currentTempLocation"
    );
    const maxTempLocationElement = document.getElementById("maxTempLocation");
    const minTempLocationElement = document.getElementById("minTempLocation");

    // Atualizar localização nos cards de umidade
    const currentHumidityLocationElement = document.getElementById(
      "currentHumidityLocation"
    );
    const maxHumidityLocationElement = document.getElementById(
      "maxHumidityLocation"
    );
    const minHumidityLocationElement = document.getElementById(
      "minHumidityLocation"
    );

    if (currentTempLocationElement) {
      currentTempLocationElement.textContent = locationText;
    }
    if (maxTempLocationElement) {
      maxTempLocationElement.textContent = locationText;
    }
    if (minTempLocationElement) {
      minTempLocationElement.textContent = locationText;
    }
    if (currentHumidityLocationElement) {
      currentHumidityLocationElement.textContent = locationText;
    }
    if (maxHumidityLocationElement) {
      maxHumidityLocationElement.textContent = locationText;
    }
    if (minHumidityLocationElement) {
      minHumidityLocationElement.textContent = locationText;
    }
  }
}

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

            // Capturar dados de umidade
            weatherData.currentHumidity = parseInt(currentCondition.humidity);

            // Calcular umidade máxima e mínima do dia a partir dos dados horários
            let maxHumidity = 0;
            let minHumidity = 100;

            weather.hourly.forEach((hour) => {
              const hourHumidity = parseInt(hour.humidity);
              if (hourHumidity > maxHumidity) maxHumidity = hourHumidity;
              if (hourHumidity < minHumidity) minHumidity = hourHumidity;
            });

            weatherData.maxHumidity = maxHumidity;
            weatherData.minHumidity = minHumidity;

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

  // Limpar dados de umidade também
  document.getElementById("currentHumidity").textContent = "N/A";
  document.getElementById("maxHumidity").textContent = "N/A";
  document.getElementById("minHumidity").textContent = "N/A";
  document.getElementById("currentHumidityLocation").textContent =
    "Serviço indisponível";
  document.getElementById("maxHumidityLocation").textContent =
    "Serviço indisponível";
  document.getElementById("minHumidityLocation").textContent =
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

// Inicializar aplicação - VERSÃO MELHORADA
function initializeApp() {
  console.log("🚀 ========== SISTEMA IoT INICIADO ==========");
  console.log("📡 Sensor IoT: ESP32 + DHT22");
  console.log(`   ├─ API Principal: ${IOT_SENSOR_API_URL}`);
  console.log(`   ├─ Fallback Local: ${IOT_LOCAL_JSON}`);
  console.log(`   └─ Fallback Final: Simulação automática`);
  console.log("🌍 Dados Climáticos: wttr.in API");
  console.log(`   ├─ Sem chave necessária`);
  console.log(`   ├─ Baseado em geolocalização GPS`);
  console.log(`   └─ Proxy CORS como fallback`);
  console.log("🌓 Sistema de Temas: Light/Dark automático");
  console.log("📱 Interface: Totalmente responsiva");
  console.log("🔄 Atualizações:");
  console.log("   ├─ Relógio: A cada 1 segundo");
  console.log("   ├─ Sensor IoT: A cada 5 segundos");
  console.log("   └─ Dados climáticos: A cada 5 minutos");
  console.log("============================================");

  // Verificar suporte do navegador
  checkBrowserSupport();

  // Inicializar tema
  initializeTheme();

  // Inicializar funcionalidades
  updateTime();
  getLocationAndWeather(); // Dados reais da API wttr.in
  getCurrentTemperature(); // Sensor IoT (simulado se não conectado)

  // Intervalos de atualização com tratamento de erro
  setInterval(() => {
    try {
      updateTime();
    } catch (error) {
      console.error("Erro ao atualizar horário:", error);
    }
  }, 1000);

  setInterval(() => {
    try {
      getCurrentTemperature();
    } catch (error) {
      console.error("Erro ao atualizar sensor IoT:", error);
    }
  }, 5000);

  setInterval(() => {
    try {
      getLocationAndWeather();
    } catch (error) {
      console.error("Erro ao atualizar dados climáticos:", error);
    }
  }, 300000); // 5 minutos

  console.log("✅ Sistema IoT inicializado com sucesso!");
}

// Verificar suporte do navegador
function checkBrowserSupport() {
  const features = {
    geolocation: !!navigator.geolocation,
    localStorage: !!window.localStorage,
    fetch: !!window.fetch,
    mediaQuery: !!window.matchMedia,
  };

  console.log("🔍 Verificação de compatibilidade:");
  Object.entries(features).forEach(([feature, supported]) => {
    const icon = supported ? "✅" : "❌";
    console.log(
      `   ${icon} ${feature}: ${supported ? "Suportado" : "Não suportado"}`
    );
  });

  // Avisos para recursos não suportados
  if (!features.geolocation) {
    console.warn(
      "⚠️ Geolocalização não suportada - dados climáticos não serão obtidos"
    );
  }

  if (!features.localStorage) {
    console.warn("⚠️ localStorage não suportado - tema não será salvo");
  }
}

// ========================================
// SISTEMA DE TEMAS DARK/LIGHT
// ========================================

// Inicializar sistema de temas
function initializeTheme() {
  const themeToggle = document.getElementById("themeToggle");

  // O tema já foi aplicado pelo script de detecção precoce
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "light";

  // Log informativo sobre o tema atual
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    console.log(`🎨 Tema: ${savedTheme} (salvo pelo usuário)`);
  } else {
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const systemTheme = prefersDarkScheme.matches ? "dark" : "light";
    console.log(`🎨 Tema: ${systemTheme} (detectado do sistema operacional)`);
  }

  // Configurar ícone inicial do botão sem animação
  updateThemeIcon(currentTheme);

  // Limpar classes de inicialização e aplicar classes corretas do body
  document.documentElement.classList.remove(
    "theme-dark-init",
    "theme-light-init"
  );
  const body = document.body;
  if (currentTheme === "dark") {
    body.classList.remove("bg-light");
    body.classList.add("bg-dark");
  } else {
    body.classList.remove("bg-dark");
    body.classList.add("bg-light");
  }

  // Event listener para o botão de tema
  themeToggle.addEventListener("click", toggleTheme);

  // Escutar mudanças na preferência do sistema
  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
  prefersDarkScheme.addEventListener("change", (e) => {
    // Só aplica automaticamente se o usuário não definiu uma preferência manual
    if (!localStorage.getItem("theme")) {
      const newSystemTheme = e.matches ? "dark" : "light";
      console.log(
        `🎨 Tema alterado automaticamente para: ${newSystemTheme} (sistema operacional)`
      );
      setTheme(newSystemTheme, false);
    }
  });
}

// Alternar entre temas
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  setTheme(newTheme);
}

// Atualizar apenas o ícone do tema
function updateThemeIcon(theme) {
  const themeIcon = document.getElementById("themeIcon");
  if (themeIcon) {
    if (theme === "dark") {
      themeIcon.className = "bi bi-moon-fill";
    } else {
      themeIcon.className = "bi bi-sun-fill";
    }
  }
}

// Aplicar tema
function setTheme(theme, animate = true) {
  const themeIcon = document.getElementById("themeIcon");
  const body = document.body;

  // Função para aplicar as mudanças
  const applyTheme = () => {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      body.classList.remove("bg-light");
      body.classList.add("bg-dark");

      // Atualizar ícone para lua (tema escuro ativo)
      if (themeIcon) themeIcon.className = "bi bi-moon-fill";
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      body.classList.remove("bg-dark");
      body.classList.add("bg-light");

      // Atualizar ícone para sol (tema claro ativo)
      if (themeIcon) themeIcon.className = "bi bi-sun-fill";
    }

    // Salvar tema no localStorage (definindo preferência manual)
    localStorage.setItem("theme", theme);
  };

  // Se deve animar (clique do usuário)
  if (animate && themeIcon) {
    // Adicionar classe de animação antes de trocar
    themeIcon.style.transform = "rotate(180deg) scale(0.8)";

    setTimeout(() => {
      applyTheme();
      // Restaurar animação
      themeIcon.style.transform = "rotate(0deg) scale(1)";
    }, 150);
  } else {
    // Aplicar imediatamente (inicialização)
    applyTheme();
  }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", initializeApp);
