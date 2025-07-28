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

// Removendo lógica de APIs externas
function getLocationAndWeather() {
  console.log("Obtendo dados apenas do IoT...");
  handleWeatherApiError();
}

function handleWeatherApiError() {
  weatherData.location = "IoT Sensor";
  updateLocationDisplay("IoT Sensor", "IoT", true);

  document.getElementById("currentTemp").textContent = "N/A";
  document.getElementById("maxTemp").textContent = "N/A";
  document.getElementById("minTemp").textContent = "N/A";

  document.getElementById("currentHumidity").textContent = "N/A";
  document.getElementById("maxHumidity").textContent = "N/A";
  document.getElementById("minHumidity").textContent = "N/A";
}

// Obter dados do sensor IoT - VERSÃO MELHORADA
// async function getCurrentTemperature() {
//   try {
//     // Primeiro tenta obter dados da API do ESP32
//     let response = await fetch(IOT_SENSOR_API_URL, {
//       method: "GET",
//       timeout: 5000, // 5 segundos de timeout
//     });

//     if (!response.ok) {
//       // Se falhar, tenta o JSON local para desenvolvimento
//       console.log(
//         "API do ESP32 não disponível, usando dados locais para desenvolvimento"
//       );
//       response = await fetch(IOT_LOCAL_JSON);
//     }

//     if (response.ok) {
//       const data = await response.json();

//       // Se for da API do ESP32 (formato simples)
//       if (data.temperature !== undefined) {
//         const temp = parseFloat(data.temperature);
//         const humidity = data.humidity ? parseFloat(data.humidity) : null;
//         const battery = data.battery ? parseFloat(data.battery) : null;

//         if (validateTemperature(temp)) {
//           const validHumidity =
//             humidity && validateHumidity(humidity) ? humidity : null;
//           const validBattery =
//             battery && validateBattery(battery) ? battery : 85;

//           updateIoTDisplay(temp, validHumidity, validBattery);
//           document.getElementById("lastUpdate").textContent = "Agora mesmo";
//           updateConnectionStatus(true);
//           return;
//         }
//       }

//       // Se for do JSON local (formato completo)
//       if (data.current && data.current.temperature !== undefined) {
//         const temp = parseFloat(data.current.temperature);
//         const humidity = data.current.humidity
//           ? parseFloat(data.current.humidity)
//           : null;
//         const battery = data.current.battery
//           ? parseFloat(data.current.battery)
//           : null;

//         if (validateTemperature(temp)) {
//           const validHumidity =
//             humidity && validateHumidity(humidity) ? humidity : null;
//           const validBattery =
//             battery && validateBattery(battery) ? battery : 85;

//           updateIoTDisplay(temp, validHumidity, validBattery);
//           document.getElementById("lastUpdate").textContent =
//             "Simulado - " +
//             new Date(data.current.timestamp).toLocaleTimeString("pt-BR");
//           updateConnectionStatus(false);
//           return;
//         }
//       }
//     }

//     throw new Error("Dados inválidos do sensor");
//   } catch (error) {
//     console.log("Erro ao conectar com sensor IoT:", error.message);
//     updateConnectionStatus(false);
//   }
// }

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

// Função para atualizar a cor do card de temperatura
function updateTemperatureCardColor(temperature) {
  const temperatureCard = document.querySelector(".temperature-card");

  if (!temperatureCard) return;

  // Remover classes existentes
  temperatureCard.classList.remove(
    "temp-freezing",
    "temp-cold",
    "temp-cool",
    "temp-comfortable",
    "temp-warm",
    "temp-hot",
    "temp-very-hot",
    "temp-extreme"
  );

  // Adicionar classe baseada na temperatura
  if (temperature < 0) {
    temperatureCard.classList.add("temp-freezing");
  } else if (temperature < 10) {
    temperatureCard.classList.add("temp-cold");
  } else if (temperature < 18) {
    temperatureCard.classList.add("temp-cool");
  } else if (temperature < 22) {
    temperatureCard.classList.add("temp-comfortable");
  } else if (temperature < 26) {
    temperatureCard.classList.add("temp-warm");
  } else if (temperature < 30) {
    temperatureCard.classList.add("temp-hot");
  } else if (temperature < 35) {
    temperatureCard.classList.add("temp-very-hot");
  } else {
    temperatureCard.classList.add("temp-extreme");
  }
}

// Função separada para atualizar o badge de temperatura
function updateTemperatureBadge(temperature) {
  const statusBadge = document.querySelector(".status-badge");

  if (!statusBadge) return;

  // Atualizar conteúdo e classe do badge
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
  console.log("Obtendo dados apenas do IoT...");
  handleWeatherApiError();
}

function handleWeatherApiError() {
  weatherData.location = "IoT Sensor";
  updateLocationDisplay("IoT Sensor", "IoT", true);

  document.getElementById("currentTemp").textContent = "N/A";
  document.getElementById("maxTemp").textContent = "N/A";
  document.getElementById("minTemp").textContent = "N/A";

  document.getElementById("currentHumidity").textContent = "N/A";
  document.getElementById("maxHumidity").textContent = "N/A";
  document.getElementById("minHumidity").textContent = "N/A";
}

// Obter dados do sensor IoT - VERSÃO MELHORADA
// async function getCurrentTemperature() {
//   try {
//     // Primeiro tenta obter dados da API do ESP32
//     let response = await fetch(IOT_SENSOR_API_URL, {
//       method: "GET",
//       timeout: 5000, // 5 segundos de timeout
//     });

//     if (!response.ok) {
//       // Se falhar, tenta o JSON local para desenvolvimento
//       console.log(
//         "API do ESP32 não disponível, usando dados locais para desenvolvimento"
//       );
//       response = await fetch(IOT_LOCAL_JSON);
//     }

//     if (response.ok) {
//       const data = await response.json();

//       // Se for da API do ESP32 (formato simples)
//       if (data.temperature !== undefined) {
//         const temp = parseFloat(data.temperature);
//         const humidity = data.humidity ? parseFloat(data.humidity) : null;
//         const battery = data.battery ? parseFloat(data.battery) : null;

//         if (validateTemperature(temp)) {
//           const validHumidity =
//             humidity && validateHumidity(humidity) ? humidity : null;
//           const validBattery =
//             battery && validateBattery(battery) ? battery : 85;

//           updateIoTDisplay(temp, validHumidity, validBattery);
//           document.getElementById("lastUpdate").textContent = "Agora mesmo";
//           updateConnectionStatus(true);
//           return;
//         }
//       }

//       // Se for do JSON local (formato completo)
//       if (data.current && data.current.temperature !== undefined) {
//         const temp = parseFloat(data.current.temperature);
//         const humidity = data.current.humidity
//           ? parseFloat(data.current.humidity)
//           : null;
//         const battery = data.current.battery
//           ? parseFloat(data.current.battery)
//           : null;

//         if (validateTemperature(temp)) {
//           const validHumidity =
//             humidity && validateHumidity(humidity) ? humidity : null;
//           const validBattery =
//             battery && validateBattery(battery) ? battery : 85;

//           updateIoTDisplay(temp, validHumidity, validBattery);
//           document.getElementById("lastUpdate").textContent =
//             "Simulado - " +
//             new Date(data.current.timestamp).toLocaleTimeString("pt-BR");
//           updateConnectionStatus(false);
//           return;
//         }
//       }
//     }

//     throw new Error("Dados inválidos do sensor");
//   } catch (error) {
//     console.log("Erro ao conectar com sensor IoT:", error.message);
//     updateConnectionStatus(false);
//   }
// }

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

// Função para atualizar a cor do card de temperatura
function updateTemperatureCardColor(temperature) {
  const temperatureCard = document.querySelector(".temperature-card");

  if (!temperatureCard) return;

  // Remover classes existentes
  temperatureCard.classList.remove(
    "temp-freezing",
    "temp-cold",
    "temp-cool",
    "temp-comfortable",
    "temp-warm",
    "temp-hot",
    "temp-very-hot",
    "temp-extreme"
  );

  // Adicionar classe baseada na temperatura
  if (temperature < 0) {
    temperatureCard.classList.add("temp-freezing");
  } else if (temperature < 10) {
    temperatureCard.classList.add("temp-cold");
  } else if (temperature < 18) {
    temperatureCard.classList.add("temp-cool");
  } else if (temperature < 22) {
    temperatureCard.classList.add("temp-comfortable");
  } else if (temperature < 26) {
    temperatureCard.classList.add("temp-warm");
  } else if (temperature < 30) {
    temperatureCard.classList.add("temp-hot");
  } else if (temperature < 35) {
    temperatureCard.classList.add("temp-very-hot");
  } else {
    temperatureCard.classList.add("temp-extreme");
  }
}

// Função separada para atualizar o badge de temperatura
function updateTemperatureBadge(temperature) {
  const statusBadge = document.querySelector(".status-badge");

  if (!statusBadge) return;

  // Atualizar conteúdo e classe do badge
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
  console.log("Obtendo dados apenas do IoT...");
  handleWeatherApiError();
}

function handleWeatherApiError() {
  weatherData.location = "IoT Sensor";
  updateLocationDisplay("IoT Sensor", "IoT", true);

  document.getElementById("currentTemp").textContent = "N/A";
  document.getElementById("maxTemp").textContent = "N/A";
  document.getElementById("minTemp").textContent = "N/A";

  document.getElementById("currentHumidity").textContent = "N/A";
  document.getElementById("maxHumidity").textContent = "N/A";
  document.getElementById("minHumidity").textContent = "N/A";
}

// Obter dados do sensor IoT - VERSÃO MELHORADA
// async function getCurrentTemperature() {
//   try {
//     // Primeiro tenta obter dados da API do ESP32
//     let response = await fetch(IOT_SENSOR_API_URL, {
//       method: "GET",
//       timeout: 5000, // 5 segundos de timeout
//     });

//     if (!response.ok) {
//       // Se falhar, tenta o JSON local para desenvolvimento
//       console.log(
//         "API do ESP32 não disponível, usando dados locais para desenvolvimento"
//       );
//       response = await fetch(IOT_LOCAL_JSON);
//     }

//     if (response.ok) {
//       const data = await response.json();

//       // Se for da API do ESP32 (formato simples)
//       if (data.temperature !== undefined) {
//         const temp = parseFloat(data.temperature);
//         const humidity = data.humidity ? parseFloat(data.humidity) : null;
//         const battery = data.battery ? parseFloat(data.battery) : null;

//         if (validateTemperature(temp)) {
//           const validHumidity =
//             humidity && validateHumidity(humidity) ? humidity : null;
//           const validBattery =
//             battery && validateBattery(battery) ? battery : 85;

//           updateIoTDisplay(temp, validHumidity, validBattery);
//           document.getElementById("lastUpdate").textContent = "Agora mesmo";
//           updateConnectionStatus(true);
//           return;
//         }
//       }

//       // Se for do JSON local (formato completo)
//       if (data.current && data.current.temperature !== undefined) {
//         const temp = parseFloat(data.current.temperature);
//         const humidity = data.current.humidity
//           ? parseFloat(data.current.humidity)
//           : null;
//         const battery = data.current.battery
//           ? parseFloat(data.current.battery)
//           : null;

//         if (validateTemperature(temp)) {
//           const validHumidity =
//             humidity && validateHumidity(humidity) ? humidity : null;
//           const validBattery =
//             battery && validateBattery(battery) ? battery : 85;

//           updateIoTDisplay(temp, validHumidity, validBattery);
//           document.getElementById("lastUpdate").textContent =
//             "Simulado - " +
//             new Date(data.current.timestamp).toLocaleTimeString("pt-BR");
//           updateConnectionStatus(false);
//           return;
//         }
//       }
//     }

//     throw new Error("Dados inválidos do sensor");
//   } catch (error) {
//     console.log("Erro ao conectar com sensor IoT:", error.message);
//     updateConnectionStatus(false);
//   }
// }

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

// Função para atualizar a cor do card de temperatura
function updateTemperatureCardColor(temperature) {
  const temperatureCard = document.querySelector(".temperature-card");

  if (!temperatureCard) return;

  // Remover classes existentes
  temperatureCard.classList.remove(
    "temp-freezing",
    "temp-cold",
    "temp-cool",
    "temp-comfortable",
    "temp-warm",
    "temp-hot",
    "temp-very-hot",
    "temp-extreme"
  );

  // Adicionar classe baseada na temperatura
  if (temperature < 0) {
    temperatureCard.classList.add("temp-freezing");
  } else if (temperature < 10) {
    temperatureCard.classList.add("temp-cold");
  } else if (temperature < 18) {
    temperatureCard.classList.add("temp-cool");
  } else if (temperature < 22) {
    temperatureCard.classList.add("temp-comfortable");
  } else if (temperature < 26) {
    temperatureCard.classList.add("temp-warm");
  } else if (temperature < 30) {
    temperatureCard.classList.add("temp-hot");
  } else if (temperature < 35) {
    temperatureCard.classList.add("temp-very-hot");
  } else {
    temperatureCard.classList.add("temp-extreme");
  }
}

// Função separada para atualizar o badge de temperatura
function updateTemperatureBadge(temperature) {
  const statusBadge = document.querySelector(".status-badge");

  if (!statusBadge) return;

  // Atualizar conteúdo e classe do badge
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
  console.log("Obtendo dados apenas do IoT...");
  handleWeatherApiError();
}

function handleWeatherApiError() {
  weatherData.location = "IoT Sensor";
  updateLocationDisplay("IoT Sensor", "IoT", true);

  document.getElementById("currentTemp").textContent = "N/A";
  document.getElementById("maxTemp").textContent = "N/A";
  document.getElementById("minTemp").textContent = "N/A";

  document.getElementById("currentHumidity").textContent = "N/A";
  document.getElementById("maxHumidity").textContent = "N/A";
  document.getElementById("minHumidity").textContent = "N/A";
}

// Obter dados do sensor IoT - VERSÃO MELHORADA
// async function getCurrentTemperature() {
//   try {
//     // Primeiro tenta obter dados da API do ESP32
//     let response = await fetch(IOT_SENSOR_API_URL, {
//       method: "GET",
//       timeout: 5000, // 5 segundos de timeout
//     });

//     if (!response.ok) {
//       // Se falhar, tenta o JSON local para desenvolvimento
//       console.log(
//         "API do ESP32 não disponível, usando dados locais para desenvolvimento"
//       );
//       response = await fetch(IOT_LOCAL_JSON);
//     }

//     if (response.ok) {
//       const data = await response.json();

//       // Se for da API do ESP32 (formato simples)
//       if (data.temperature !== undefined) {
//         const temp = parseFloat(data.temperature);
//         const humidity = data.humidity ? parseFloat(data.humidity) : null;
//         const battery = data.battery ? parseFloat(data.battery) : null;

//         if (validateTemperature(temp)) {
//           const validHumidity =
//             humidity && validateHumidity(humidity) ? humidity : null;
//           const validBattery =
//             battery && validateBattery(battery) ? battery : 85;

//           updateIoTDisplay(temp, validHumidity, validBattery);
//           document.getElementById("lastUpdate").textContent = "Agora mesmo";
//           updateConnectionStatus(true);
//           return;
//         }
//       }

//       // Se for do JSON local (formato completo)
//       if (data.current && data.current.temperature !== undefined) {
//         const temp = parseFloat(data.current.temperature);
//         const humidity = data.current.humidity
//           ? parseFloat(data.current.humidity)
//           : null;
//         const battery = data.current.battery
//           ? parseFloat(data.current.battery)
//           : null;

//         if (validateTemperature(temp)) {
//           const validHumidity =
//             humidity && validateHumidity(humidity) ? humidity : null;
//           const validBattery =
//             battery && validateBattery(battery) ? battery : 85;

//           updateIoTDisplay(temp, validHumidity, validBattery);
//           document.getElementById("lastUpdate").textContent =
//             "Simulado - " +
//             new Date(data.current.timestamp).toLocaleTimeString("pt-BR");
//           updateConnectionStatus(false);
//           return;
//         }
//       }
//     }

//     throw new Error("Dados inválidos do sensor");
//   } catch (error) {
//     console.log("Erro ao conectar com sensor IoT:", error.message);
//     updateConnectionStatus(false);
//   }
// }

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

// Função para atualizar a cor do card de temperatura
function updateTemperatureCardColor(temperature) {
  const temperatureCard = document.querySelector(".temperature-card");

  if (!temperatureCard) return;

  // Remover classes existentes
  temperatureCard.classList.remove(
    "temp-freezing",
    "temp-cold",
    "temp-cool",
    "temp-comfortable",
    "temp-warm",
    "temp-hot",
    "temp-very-hot",
    "temp-extreme"
  );

  // Adicionar classe baseada na temperatura
  if (temperature < 0) {
    temperatureCard.classList.add("temp-freezing");
  } else if (temperature < 10) {
    temperatureCard.classList.add("temp-cold");
  } else if (temperature < 18) {
    temperatureCard.classList.add("temp-cool");
  } else if (temperature < 22) {
    temperatureCard.classList.add("temp-comfortable");
  } else if (temperature < 26) {
    temperatureCard.classList.add("temp-warm");
  } else if (temperature < 30) {
    temperatureCard.classList.add("temp-hot");
  } else if (temperature < 35) {
    temperatureCard.classList.add("temp-very-hot");
  } else {
    temperatureCard.classList.add("temp-extreme");
  }
}

// Função separada para atualizar o badge de temperatura
function updateTemperatureBadge(temperature) {
  const statusBadge = document.querySelector(".status-badge");

  if (!statusBadge) return;

  // Atualizar conteúdo e classe do badge
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
  console.log("Obtendo dados apenas do IoT...");
  handleWeatherApiError();
}

function handleWeatherApiError() {
  weatherData.location = "IoT Sensor";
  updateLocationDisplay("IoT Sensor", "IoT", true);

  document.getElementById("currentTemp").textContent = "N/A";
  document.getElementById("maxTemp").textContent = "N/A";
  document.getElementById("minTemp").textContent = "N/A";

  document.getElementById("currentHumidity").textContent = "N/A";
  document.getElementById("maxHumidity").textContent = "N/A";
  document.getElementById("minHumidity").textContent = "N/A";
}

// Obter dados do sensor IoT - VERSÃO MELHORADA
// async function getCurrentTemperature() {
//   try {
//     // Primeiro tenta obter dados da API do ESP32
//     let response = await fetch(IOT_SENSOR_API_URL, {
//       method: "GET",
//       timeout: 5000, // 5 segundos de timeout
//     });

//     if (!response.ok) {
//       // Se falhar, tenta o JSON local para desenvolvimento
//       console.log(
//         "API do ESP32 não disponível, usando dados locais para desenvolvimento"
//       );
//       response = await fetch(IOT_LOCAL_JSON);
//     }

//     if (response.ok) {
//       const data = await response.json();

//       // Se for da API do ESP32 (formato simples)
//       if (data.temperature !== undefined) {
//         const temp = parseFloat(data.temperature);
//         const humidity = data.humidity ? parseFloat(data.humidity) : null;
//         const battery = data.battery ? parseFloat(data.battery) : null;

//         if (validateTemperature(temp)) {
//           const validHumidity =
//             humidity && validateHumidity(humidity) ? humidity : null;
//           const validBattery =
//             battery && validateBattery(battery) ? battery : 85;

//           updateIoTDisplay(temp, validHumidity, validBattery);
//           document.getElementById("lastUpdate").textContent = "Agora mesmo";
//           updateConnectionStatus(true);
//           return;
//         }
//       }

//       // Se for do JSON local (formato completo)
//       if (data.current && data.current.temperature !== undefined) {
//         const temp = parseFloat(data.current.temperature);
//         const humidity = data.current.humidity
//           ? parseFloat(data.current.humidity)
//           : null;
//         const battery = data.current.battery
//           ? parseFloat(data.current.battery)
//           : null;

//         if (validateTemperature(temp)) {
//           const validHumidity =
//             humidity && validateHumidity(humidity) ? humidity : null;
//           const validBattery =
//             battery && validateBattery(battery) ? battery : 85;

//           updateIoTDisplay(temp, validHumidity, validBattery);
//           document.getElementById("lastUpdate").textContent =
//             "Simulado - " +
//             new Date(data.current.timestamp).toLocaleTimeString("pt-BR");
//           updateConnectionStatus(false);
//           return;
//         }
//       }
//     }

//     throw new Error("Dados inválidos do sensor");
//   } catch (error) {
//     console.log("Erro ao conectar com sensor IoT:", error.message);
//     updateConnectionStatus(false);
//   }
// }

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

// Função para atualizar a cor do card de temperatura
function updateTemperatureCardColor(temperature) {
  const temperatureCard = document.querySelector(".temperature-card");

  if (!temperatureCard) return;

  // Remover classes existentes
  temperatureCard.classList.remove(
    "temp-freezing",
    "temp-cold",
    "temp-cool",
    "temp-comfortable",
    "temp-warm",
    "temp-hot",
    "temp-very-hot",
    "temp-extreme"
  );

  // Adicionar classe baseada na temperatura
  if (temperature < 0) {
    temperatureCard.classList.add("temp-freezing");
  } else if (temperature < 10) {
    temperatureCard.classList.add("temp-cold");
  } else if (temperature < 18) {
    temperatureCard.classList.add("temp-cool");
  } else if (temperature < 22) {
    temperatureCard.classList.add("temp-comfortable");
  } else if (temperature < 26) {
    temperatureCard.classList.add("temp-warm");
  } else if (temperature < 30) {
    temperatureCard.classList.add("temp-hot");
  } else if (temperature < 35) {
    temperatureCard.classList.add("temp-very-hot");
  } else {
    temperatureCard.classList.add("temp-extreme");
  }
}

// Função separada para atualizar o badge de temperatura
function updateTemperatureBadge(temperature) {
  const statusBadge = document.querySelector(".status-badge");

  if (!statusBadge) return;

  // Atualizar conteúdo e classe do badge
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
  console.log("Obtendo dados apenas do IoT...");
  handleWeatherApiError();
}

function handleWeatherApiError() {
  weatherData.location = "IoT Sensor";
  updateLocationDisplay("IoT Sensor", "IoT", true);

  document.getElementById("currentTemp").textContent = "N/A";
  document.getElementById("maxTemp").textContent = "N/A";
  document.getElementById("minTemp").textContent = "N/A";

  document.getElementById("currentHumidity").textContent = "N/A";
  document.getElementById("maxHumidity").textContent = "N/A";
  document.getElementById("minHumidity").textContent = "N/A";
}

// Obter dados do sensor IoT - VERSÃO MELHORADA
// async function getCurrentTemperature() {
//   try {
//     // Primeiro tenta obter dados da API do ESP32
//     let response = await fetch(IOT_SENSOR_API_URL, {
//       method: "GET",
//       timeout: 5000, // 5 segundos de timeout
//     });

//     if (!response.ok) {
//       // Se falhar, tenta o JSON local para desenvolvimento
//       console.log(
//         "API do ESP32 não disponível, usando dados locais para desenvolvimento"
//       );
//       response = await fetch(IOT_LOCAL_JSON);
//     }

//     if (response.ok) {
//       const data = await response.json();

//       // Se for da API do ESP32 (formato simples)
//       if (data.temperature !== undefined) {
//         const temp = parseFloat(data.temperature);
//         const humidity = data.humidity ? parseFloat(data.humidity) : null;
//         const battery = data.battery ? parseFloat(data.battery) : null;

//         if (validateTemperature(temp)) {
//           const validHumidity =
//             humidity && validateHumidity(humidity) ? humidity : null;
//           const validBattery =
//             battery && validateBattery(battery) ? battery : 85;

//           updateIoTDisplay(temp, validHumidity, validBattery);
//           document.getElementById("lastUpdate").textContent = "Agora mesmo";
//           updateConnectionStatus(true);
//           return;
//         }
//       }

//       // Se for do JSON local (formato completo)
//       if (data.current && data.current.temperature !== undefined) {
//         const temp = parseFloat(data.current.temperature);
//         const humidity = data.current.humidity
//           ? parseFloat(data.current.humidity)
//           : null;
//         const battery = data.current.battery
//           ? parseFloat(data.current.battery)
//           : null;

//         if (validateTemperature(temp)) {
//           const validHumidity =
//             humidity && validateHumidity(humidity) ? humidity : null;
//           const validBattery =
//             battery && validateBattery(battery) ? battery : 85;

//           updateIoTDisplay(temp, validHumidity, validBattery);
//           document.getElementById("lastUpdate").textContent =
//             "Simulado - " +
//             new Date(data.current.timestamp).toLocaleTimeString("pt-BR");
//           updateConnectionStatus(false);
//           return;
//         }
//       }
//     }

//     throw new Error("Dados inválidos do sensor");
//   } catch (error) {
//     console.log("Erro ao conectar com sensor IoT:", error.message);
//     updateConnectionStatus(false);
//   }
// }

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

// Função para atualizar a cor do card de temperatura
function updateTemperatureCardColor(temperature) {
  const temperatureCard = document.querySelector(".temperature-card");

  if (!temperatureCard) return;

  // Remover classes existentes
  temperatureCard.classList.remove(
    "temp-freezing",
    "temp-cold",
    "temp-cool",
    "temp-comfortable",
    "temp-warm",
    "temp-hot",
    "temp-very-hot",
    "temp-extreme"
  );

  // Adicionar classe baseada na temperatura
  if (temperature < 0) {
    temperatureCard.classList.add("temp-freezing");
  } else if (temperature < 10) {
    temperatureCard.classList.add("temp-cold");
  } else if (temperature < 18) {
    temperatureCard.classList.add("temp-cool");
  } else if (temperature < 22) {
    temperatureCard.classList.add("temp-comfortable");
  } else if (temperature < 26) {
    temperatureCard.classList.add("temp-warm");
  } else if (temperature < 30) {
    temperatureCard.classList.add("temp-hot");
  } else if (temperature < 35) {
    temperatureCard.classList.add("temp-very-hot");
  } else {
    temperatureCard.classList.add("temp-extreme");
  }
}

// Função separada para atualizar o badge de temperatura
function updateTemperatureBadge(temperature) {
  const statusBadge = document.querySelector(".status-badge");

  if (!statusBadge) return;

  // Atualizar conteúdo e classe do badge
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
  console.log("Obtendo dados apenas do IoT...");
  handleWeatherApiError();
}

function handleWeatherApiError() {
  weatherData.location = "IoT Sensor";
  updateLocationDisplay("IoT Sensor", "IoT", true);

  document.getElementById("currentTemp").textContent = "N/A";
  document.getElementById("maxTemp").textContent = "N/A";
  document.getElementById("minTemp").textContent = "N/A";

  document.getElementById("currentHumidity").textContent = "N/A";
  document.getElementById("maxHumidity").textContent = "N/A";
  document.getElementById("minHumidity").textContent = "N/A";
}

// Obter dados do sensor IoT - VERSÃO MELHORADA
// async function getCurrentTemperature() {
//   try {
//     // Primeiro tenta obter dados da API do ESP32
//     let response = await fetch(IOT_SENSOR_API_URL, {
//       method: "GET",
//       timeout: 5000, // 5 segundos de timeout
//     });

//     if (!response.ok) {
//       // Se falhar, tenta o JSON local para desenvolvimento
//       console.log(
//         "API do ESP32 não disponível, usando dados locais para desenvolvimento"
//       );
//       response = await fetch(IOT_LOCAL_JSON);
//     }

//     if (response.ok) {
//       const data = await response.json();

//       // Se for da API do ESP32 (formato simples)
//       if (data.temperature !== undefined) {
//         const temp = parseFloat(data.temperature);
//         const humidity = data.humidity ? parseFloat(data.humidity) : null;
//         const battery = data.battery ? parseFloat(data.battery) : null;

//         if (validateTemperature(temp)) {
//           const validHumidity =
//             humidity && validateHumidity(humidity) ? humidity : null;
//           const validBattery =
//             battery && validateBattery(battery) ? battery : 85;

//           updateIoTDisplay(temp, validHumidity, validBattery);
//           document.getElementById("lastUpdate").textContent = "Agora mesmo";
//           updateConnectionStatus(true);
//           return;
//         }
//       }

//       // Se for do JSON local (formato completo)
//       if (data.current && data.current.temperature !== undefined) {
//         const temp = parseFloat(data.current.temperature);
//         const humidity = data.current.humidity
//           ? parseFloat(data.current.humidity)
//           : null;
//         const battery = data.current.battery
//           ? parseFloat(data.current.battery)
//           : null;

//         if (validateTemperature(temp)) {
//           const validHumidity =
//             humidity && validateHumidity(humidity) ? humidity : null;
//           const validBattery =
//             battery && validateBattery(battery) ? battery : 85;

//           updateIoTDisplay(temp, validHumidity, validBattery);
//           document.getElementById("lastUpdate").textContent =
//             "Simulado - " +
//             new Date(data.current.timestamp).toLocaleTimeString("pt-BR");
//           updateConnectionStatus(false);
//           return;
//         }
//       }
//     }

//     throw new Error("Dados inválidos do sensor");
//   } catch (error) {
//     console.log("Erro ao conectar com sensor IoT:", error.message);
//     updateConnectionStatus(false);
//   }
// }

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

// Função para atualizar a cor do card de temperatura
function updateTemperatureCardColor(temperature) {
  const temperatureCard = document.querySelector(".temperature-card");

  if (!temperatureCard) return;

  // Remover classes existentes
  temperatureCard.classList.remove(
    "temp-freezing",
    "temp-cold",
    "temp-cool",
    "temp-comfortable",
    "temp-warm",
    "temp-hot",
    "temp-very-hot",
    "temp-extreme"
  );

  // Adicionar classe baseada na temperatura
  if (temperature < 0) {
    temperatureCard.classList.add("temp-freezing");
  } else if (temperature < 10) {
    temperatureCard.classList.add("temp-cold");
  } else if (temperature < 18) {
    temperatureCard.classList.add("temp-cool");
  } else if (temperature < 22) {
    temperatureCard.classList.add("temp-comfortable");
  } else if (temperature < 26) {
    temperatureCard.classList.add("temp-warm");
  } else if (temperature < 30) {
    temperatureCard.classList.add("temp-hot");
  } else if (temperature < 35) {
    temperatureCard.classList.add("temp-very-hot");
  } else {
    temperatureCard.classList.add("temp-extreme");
  }
}

// Função separada para atualizar o badge de temperatura
function updateTemperatureBadge(temperature) {
  const statusBadge = document.querySelector(".status-badge");

  if (!statusBadge) return;

  // Atualizar conteúdo e classe do badge
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
