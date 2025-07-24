/**
 * Smart Home Dashboard - Main Application
 * Aplicação principal que coordena todos os componentes
 */

class SmartHomeApp {
  constructor() {
    this.mqttClient = null;
    this.uiController = null;
    this.chartController = null;
    this.isInitialized = false;

    this.init();
  }

  /**
   * Inicializa a aplicação
   */
  init() {
    // Aguarda o DOM estar carregado
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () =>
        this.initializeComponents()
      );
    } else {
      // Adiciona um pequeno delay para garantir que todas as bibliotecas estejam carregadas
      setTimeout(() => this.initializeComponents(), 100);
    }
  }

  /**
   * Inicializa todos os componentes
   */
  initializeComponents() {
    try {
      console.log("Inicializando Smart Home Dashboard...");

      // Inicializa controlador da UI
      this.uiController = new UIController();
      console.log("UI Controller inicializado");

      // Inicializa controlador do gráfico
      this.chartController = new ChartController();
      console.log("Chart Controller inicializado");

      // Inicializa cliente MQTT
      this.mqttClient = new MQTTClient();
      console.log("MQTT Client inicializado");

      // Conecta os componentes
      this.connectComponents();

      // Configura tópicos MQTT
      this.setupMQTTSubscriptions();

      // Configura eventos globais
      this.setupGlobalEvents();

      this.isInitialized = true;
      console.log("Smart Home Dashboard inicializado com sucesso!");
    } catch (error) {
      console.error("Erro ao inicializar aplicação:", error);
      this.showErrorMessage(
        "Erro ao inicializar a aplicação. Verifique o console para mais detalhes."
      );
    }
  }

  /**
   * Conecta os componentes entre si
   */
  connectComponents() {
    // Liga UI Controller ao MQTT Client
    this.uiController.setMQTTClient(this.mqttClient);

    // Configura callbacks do MQTT Client
    this.mqttClient.onConnectionChange = (isConnected) => {
      this.handleConnectionChange(isConnected);
    };

    this.mqttClient.onMessageReceived = (topic, message) => {
      this.handleMQTTMessage(topic, message);
    };

    this.mqttClient.onError = (error) => {
      this.handleMQTTError(error);
    };
  }

  /**
   * Configura inscrições em tópicos MQTT
   */
  setupMQTTSubscriptions() {
    // Tópicos de dispositivos
    const deviceTopics = [
      "smarthome790/sala/luz1",
      "smarthome790/quarto/luz1",
      "smarthome790/cozinha/tomada1",
      "smarthome790/jardim/irrigacao",
      "smarthome790/garagem/portao",
      "smarthome790/sala/ar",
    ];

    // Tópicos de sensores
    const sensorTopics = ["smarthome790/sensores/dht22"];

    // Aguarda conexão MQTT antes de se inscrever
    const subscribeWhenConnected = () => {
      if (this.mqttClient.isConnected) {
        // Inscreve em tópicos de dispositivos
        deviceTopics.forEach((topic) => {
          this.mqttClient.subscribe(topic);
        });

        // Inscreve em tópicos de sensores
        sensorTopics.forEach((topic) => {
          this.mqttClient.subscribe(topic);
        });

        console.log("Inscrito em todos os tópicos MQTT");
      } else {
        // Tenta novamente em 1 segundo
        setTimeout(subscribeWhenConnected, 1000);
      }
    };

    subscribeWhenConnected();
  }

  /**
   * Manipula mudanças na conexão MQTT
   */
  handleConnectionChange(isConnected) {
    if (isConnected) {
      console.log("MQTT conectado - configurando inscrições...");
      this.setupMQTTSubscriptions();
    } else {
      console.log("MQTT desconectado");
    }
  }

  /**
   * Manipula mensagens MQTT recebidas
   */
  handleMQTTMessage(topic, message) {
    console.log(
      `Mensagem MQTT recebida - Tópico: ${topic}, Mensagem: ${message}`
    );

    try {
      // Processa mensagens de sensores
      if (this.isSensorTopic(topic)) {
        this.chartController.processSensorMessage(topic, message);
      }
      // Processa mensagens de dispositivos
      else if (this.isDeviceTopic(topic)) {
        this.uiController.processMQTTMessage(topic, message);
      }
    } catch (error) {
      console.error("Erro ao processar mensagem MQTT:", error);
    }
  }

  /**
   * Manipula erros do MQTT
   */
  handleMQTTError(error) {
    console.error("Erro MQTT:", error);
    this.uiController.showToast(
      "Erro MQTT",
      "Ocorreu um erro na comunicação MQTT",
      "error"
    );
  }

  /**
   * Verifica se é um tópico de sensor
   */
  isSensorTopic(topic) {
    const sensorTopics = ["smarthome790/sensores/dht22"];
    return sensorTopics.includes(topic);
  }

  /**
   * Verifica se é um tópico de dispositivo
   */
  isDeviceTopic(topic) {
    const deviceTopics = [
      "smarthome790/sala/luz1",
      "smarthome790/quarto/luz1",
      "smarthome790/cozinha/tomada1",
      "smarthome790/jardim/irrigacao",
      "smarthome790/garagem/portao",
      "smarthome790/sala/ar",
    ];
    return deviceTopics.includes(topic);
  }

  /**
   * Configura eventos globais
   */
  setupGlobalEvents() {
    // Detecta quando a página vai ser fechada para desconectar MQTT
    window.addEventListener("beforeunload", () => {
      if (this.mqttClient && this.mqttClient.isConnected) {
        this.mqttClient.disconnect();
      }
    });

    // Detecta mudanças de visibilidade da página
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        console.log("Página oculta - pausando atividades");
      } else {
        console.log("Página visível - retomando atividades");
        // Verifica conexão MQTT
        if (this.mqttClient && !this.mqttClient.isConnected) {
          this.mqttClient.connect();
        }
      }
    });

    // Detecta mudanças na conexão de rede
    window.addEventListener("online", () => {
      console.log("Conexão de rede restaurada");
      this.uiController.showToast(
        "Conexão Restaurada",
        "Conexão com a internet foi restaurada",
        "success"
      );

      // Tenta reconectar MQTT
      if (this.mqttClient && !this.mqttClient.isConnected) {
        setTimeout(() => this.mqttClient.connect(), 2000);
      }
    });

    window.addEventListener("offline", () => {
      console.log("Conexão de rede perdida");
      this.uiController.showToast(
        "Sem Conexão",
        "Conexão com a internet foi perdida",
        "warning"
      );
    });

    // Adiciona atalhos de teclado
    this.setupKeyboardShortcuts();
  }

  /**
   * Configura atalhos de teclado
   */
  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (event) => {
      // Ctrl/Cmd + D: Toggle tema
      if ((event.ctrlKey || event.metaKey) && event.key === "d") {
        event.preventDefault();
        this.uiController.toggleTheme();
      }

      // Ctrl/Cmd + S: Abrir configurações
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        const settingsModal = new bootstrap.Modal(
          document.getElementById("settingsModal")
        );
        settingsModal.show();
      }

      // Ctrl/Cmd + R: Reconectar MQTT
      if ((event.ctrlKey || event.metaKey) && event.key === "r") {
        event.preventDefault();
        if (this.mqttClient) {
          this.mqttClient.disconnect();
          setTimeout(() => this.mqttClient.connect(), 1000);
        }
      }
    });
  }

  /**
   * Mostra mensagem de erro
   */
  showErrorMessage(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className =
      "alert alert-danger alert-dismissible fade show position-fixed";
    errorDiv.style.cssText =
      "top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; min-width: 300px;";
    errorDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

    document.body.appendChild(errorDiv);

    // Remove automaticamente após 10 segundos
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 10000);
  }

  /**
   * Simula recebimento de dados do ESP32 (para demonstração)
   */
  simulateESP32Data() {
    if (!this.isInitialized || !this.mqttClient.isConnected) return;

    // Simula dados de sensor DHT22
    const temperature = (20 + Math.random() * 10).toFixed(1);
    const humidity = (50 + Math.random() * 30).toFixed(1);
    const sensorData = JSON.stringify({ temperature, humidity });

    // Simula publicação do ESP32
    this.handleMQTTMessage("smarthome790/sensores/dht22", sensorData);

    // Simula mudança aleatória de estado de dispositivo
    const devices = [
      "smarthome790/sala/luz1",
      "smarthome790/quarto/luz1",
      "smarthome790/cozinha/tomada1",
    ];
    const randomDevice = devices[Math.floor(Math.random() * devices.length)];
    const randomState =
      Math.random() > 0.7 ? (Math.random() > 0.5 ? "on" : "off") : null;

    if (randomState) {
      setTimeout(() => {
        this.handleMQTTMessage(randomDevice, randomState);
      }, Math.random() * 5000);
    }
  }

  /**
   * Inicia simulação de dados (para demonstração)
   */
  startSimulation() {
    // Simula dados a cada 60 segundos
    setInterval(() => {
      this.simulateESP32Data();
    }, 60000);

    // Primeira execução após 5 segundos
    setTimeout(() => {
      this.simulateESP32Data();
    }, 5000);
  }

  /**
   * Obtém informações de status da aplicação
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      mqtt: this.mqttClient ? this.mqttClient.getConnectionStatus() : null,
      components: {
        uiController: !!this.uiController,
        chartController: !!this.chartController,
        mqttClient: !!this.mqttClient,
      },
    };
  }
}

/**
 * Footer Controller
 * Gerencia as informações do rodapé em tempo real
 */
class FooterController {
  constructor() {
    this.startTime = Date.now();
    this.updateInterval = null;
    this.lastUpdateTime = null;

    this.init();
  }

  /**
   * Inicializa o controlador do rodapé
   */
  init() {
    this.startUpdates();
  }

  /**
   * Inicia as atualizações periódicas
   */
  startUpdates() {
    // Atualiza imediatamente
    this.updateFooterInfo();

    // Atualiza a cada segundo
    this.updateInterval = setInterval(() => {
      this.updateFooterInfo();
    }, 1000);
  }

  /**
   * Para as atualizações
   */
  stopUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Atualiza as informações do rodapé
   */
  updateFooterInfo() {
    try {
      this.updateUptime();
      this.updateLastUpdate();
      this.updateMQTTStatus();
    } catch (error) {
      console.warn("Erro ao atualizar informações do footer:", error);
      // Para as atualizações se houver erro persistente
      this.stopUpdates();
    }
  }

  /**
   * Atualiza o uptime
   */
  updateUptime() {
    const uptimeElement = document.getElementById("footerUptime");
    if (!uptimeElement) return;

    const uptime = Date.now() - this.startTime;
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((uptime % (1000 * 60)) / 1000);

    uptimeElement.textContent = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  /**
   * Atualiza a última atualização
   */
  updateLastUpdate() {
    const lastUpdateElement = document.getElementById("footerLastUpdate");
    if (!lastUpdateElement) return;

    if (this.lastUpdateTime) {
      const now = new Date();
      lastUpdateElement.textContent = now.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      lastUpdateElement.textContent = "--:--";
    }
  }

  /**
   * Atualiza o status MQTT
   */
  updateMQTTStatus() {
    const mqttStatusElement = document.getElementById("footerMqttStatus");
    if (!mqttStatusElement) return;

    // Verifica se há uma instância global da aplicação
    if (window.smartHomeApp && window.smartHomeApp.mqttClient) {
      const isConnected = window.smartHomeApp.mqttClient.isConnected;

      mqttStatusElement.className = `badge bg-${
        isConnected ? "success" : "danger"
      }`;
      mqttStatusElement.textContent = isConnected
        ? "Conectado"
        : "Desconectado";
    }
  }

  /**
   * Marca que houve uma atualização
   */
  markUpdate() {
    this.lastUpdateTime = Date.now();
  }

  /**
   * Atualiza contador de dispositivos ativos
   */
  updateDeviceCount() {
    const deviceCountElement = document.getElementById("footerDeviceCount");
    if (!deviceCountElement) return;

    // Conta dispositivos ativos
    const activeDevices = document.querySelectorAll(
      ".device-card.active"
    ).length;
    const totalDevices = document.querySelectorAll(".device-card").length;

    deviceCountElement.textContent = `${activeDevices}/${totalDevices} ativos`;
  }
}

/**
 * PWA Service Worker Registration
 * Registra o service worker para funcionalidade offline
 */
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./sw.js")
        .then((registration) => {
          console.log(
            "Service Worker registrado com sucesso:",
            registration.scope
          );

          // Verifica se há atualizações
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;

            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // Nova versão disponível
                console.log("Nova versão do app disponível");

                // Mostra notificação para o usuário
                if (window.smartHomeApp && window.smartHomeApp.uiController) {
                  window.smartHomeApp.uiController.showToast(
                    "Atualização Disponível",
                    "Nova versão do dashboard disponível. Recarregue a página.",
                    "info"
                  );
                }
              }
            });
          });
        })
        .catch((error) => {
          console.log("Falha ao registrar Service Worker:", error);
        });
    });
  } else {
    console.log("Service Worker não suportado neste navegador");
  }
}

// Inicializa a aplicação quando o script é carregado
document.addEventListener("DOMContentLoaded", () => {
  try {
    // Registra service worker para PWA
    registerServiceWorker();

    // Cria instância global da aplicação
    window.smartHomeApp = new SmartHomeApp();

    // Cria instância global do controlador do rodapé com tratamento de erro
    try {
      window.footerController = new FooterController();
    } catch (footerError) {
      console.warn("Erro ao inicializar FooterController:", footerError);
      // A aplicação continua funcionando mesmo se o footer falhar
    }

    // Inicia simulação para demonstração
    setTimeout(() => {
      if (window.smartHomeApp.isInitialized) {
        window.smartHomeApp.startSimulation();
      }
    }, 10000);
  } catch (error) {
    console.error("Erro ao inicializar aplicação:", error);
  }
});

// Exporta a classe para uso global
window.SmartHomeApp = SmartHomeApp;
