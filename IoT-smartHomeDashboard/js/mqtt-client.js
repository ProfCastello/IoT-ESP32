/**
 * MQTT Client Controller
 * Gerencia a conexão MQTT e comunicação com o ESP32
 */

class MQTTClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.settings = this.loadSettings();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.subscriptions = new Set();

    // Callbacks para eventos
    this.onConnectionChange = null;
    this.onMessageReceived = null;
    this.onError = null;

    this.init();
  }

  /**
   * Inicializa o cliente MQTT
   */
  init() {
    this.generateClientId();

    // Aguarda o carregamento da biblioteca Paho MQTT
    this.waitForPaho()
      .then(() => {
        this.connect();
      })
      .catch((error) => {
        console.error("Erro ao carregar biblioteca Paho MQTT:", error);
        this.updateConnectionStatus(
          "error",
          "Erro: Biblioteca MQTT não carregada"
        );

        // Mostra notificação de erro
        if (window.notificationSystem) {
          window.notificationSystem.mqttError(
            "Biblioteca MQTT não foi carregada corretamente"
          );
        }
      });
  }

  /**
   * Aguarda o carregamento da biblioteca Paho MQTT
   */
  waitForPaho() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 segundos máximo

      const checkPaho = () => {
        if (typeof Paho !== "undefined" && Paho.MQTT && Paho.MQTT.Client) {
          resolve();
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkPaho, 100);
        } else {
          reject(new Error("Timeout: Biblioteca Paho MQTT não foi carregada"));
        }
      };

      checkPaho();
    });
  }

  /**
   * Carrega configurações do localStorage
   */
  loadSettings() {
    const defaultSettings = {
      broker: "broker.hivemq.com",
      port: 8884,
      secure: true,
      clientId: "",
      keepAlive: 60,
      cleanSession: true,
    };

    const saved = localStorage.getItem("mqttSettings");
    return saved
      ? { ...defaultSettings, ...JSON.parse(saved) }
      : defaultSettings;
  }

  /**
   * Salva configurações no localStorage
   */
  saveSettings(settings) {
    this.settings = { ...this.settings, ...settings };
    localStorage.setItem("mqttSettings", JSON.stringify(this.settings));
  }

  /**
   * Gera um Client ID único
   */
  generateClientId() {
    if (!this.settings.clientId) {
      this.settings.clientId = `smarthome_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      this.saveSettings({ clientId: this.settings.clientId });
    }
  }

  /**
   * Conecta ao broker MQTT
   */
  connect() {
    try {
      this.updateConnectionStatus("connecting", "Conectando...");

      // Mostra notificação de conexão
      if (window.notificationSystem) {
        window.notificationSystem.mqttConnecting();
      }

      // Verifica se a biblioteca Paho MQTT está carregada
      if (typeof Paho === "undefined" || !Paho.MQTT || !Paho.MQTT.Client) {
        throw new Error(
          "Biblioteca Paho MQTT não está carregada. Verifique se o script está incluído corretamente."
        );
      }

      // Cria nova instância do cliente
      this.client = new Paho.MQTT.Client(
        this.settings.broker,
        this.settings.port,
        this.settings.clientId
      );

      // Configura callbacks
      this.client.onConnectionLost = this.onConnectionLost.bind(this);
      this.client.onMessageArrived = this.onMessageArrived.bind(this);

      // Opções de conexão
      const connectOptions = {
        keepAliveInterval: this.settings.keepAlive,
        cleanSession: this.settings.cleanSession,
        useSSL: this.settings.secure,
        onSuccess: this.onConnectSuccess.bind(this),
        onFailure: this.onConnectFailure.bind(this),
      };

      // Conecta
      this.client.connect(connectOptions);
    } catch (error) {
      console.error("Erro ao conectar:", error);
      this.updateConnectionStatus("error", "Erro de conexão");

      // Mostra notificação de erro
      if (window.notificationSystem) {
        window.notificationSystem.mqttError(
          error.message || "Erro desconhecido na conexão"
        );
      }

      if (this.onError) this.onError(error);
    }
  }

  /**
   * Callback de sucesso na conexão
   */
  onConnectSuccess() {
    console.log("Conectado ao broker MQTT");
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.updateConnectionStatus("connected", "Conectado");

    // Mostra notificação de sucesso
    if (window.notificationSystem) {
      window.notificationSystem.mqttConnected();
    }

    // Reinscreve em tópicos anteriores
    this.resubscribeAll();

    if (this.onConnectionChange) {
      this.onConnectionChange(true);
    }
  }

  /**
   * Callback de falha na conexão
   */
  onConnectFailure(error) {
    console.error("Falha na conexão MQTT:", error);
    this.isConnected = false;
    this.updateConnectionStatus("error", "Falha na conexão");

    // Mostra notificação de erro
    if (window.notificationSystem) {
      window.notificationSystem.mqttError(
        error.errorMessage || "Falha na conexão com o broker"
      );
    }

    if (this.onConnectionChange) {
      this.onConnectionChange(false);
    }

    // Tenta reconectar
    this.scheduleReconnect();
  }

  /**
   * Callback quando a conexão é perdida
   */
  onConnectionLost(responseObject) {
    console.log("Conexão perdida:", responseObject.errorMessage);
    this.isConnected = false;
    this.updateConnectionStatus("disconnected", "Desconectado");

    // Mostra notificação de desconexão
    if (window.notificationSystem) {
      window.notificationSystem.mqttDisconnected();
    }

    if (this.onConnectionChange) {
      this.onConnectionChange(false);
    }

    // Tenta reconectar se não foi intencional
    if (responseObject.errorCode !== 0) {
      this.scheduleReconnect();
    }
  }

  /**
   * Agenda tentativa de reconexão
   */
  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      console.log(
        `Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts})`
      );
      this.updateConnectionStatus(
        "reconnecting",
        `Reconectando... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        if (!this.isConnected) {
          this.connect();
        }
      }, delay);
    } else {
      this.updateConnectionStatus("error", "Falha total");
      console.error("Número máximo de tentativas de reconexão atingido");
    }
  }

  /**
   * Callback quando uma mensagem é recebida
   */
  onMessageArrived(message) {
    console.log(
      "Mensagem recebida:",
      message.destinationName,
      message.payloadString
    );

    if (this.onMessageReceived) {
      this.onMessageReceived(message.destinationName, message.payloadString);
    }
  }

  /**
   * Publica uma mensagem
   */
  publish(topic, message, qos = 0, retained = false) {
    if (!this.isConnected || !this.client) {
      console.warn("Cliente MQTT não conectado");
      return false;
    }

    try {
      const mqttMessage = new Paho.MQTT.Message(message);
      mqttMessage.destinationName = topic;
      mqttMessage.qos = qos;
      mqttMessage.retained = retained;

      this.client.send(mqttMessage);
      console.log(`Mensagem enviada - Tópico: ${topic}, Mensagem: ${message}`);
      return true;
    } catch (error) {
      console.error("Erro ao publicar mensagem:", error);
      if (this.onError) this.onError(error);
      return false;
    }
  }

  /**
   * Inscreve-se em um tópico
   */
  subscribe(topic, qos = 0) {
    if (!this.isConnected || !this.client) {
      console.warn("Cliente MQTT não conectado");
      // Adiciona à lista para inscrever quando conectar
      this.subscriptions.add({ topic, qos });
      return false;
    }

    try {
      this.client.subscribe(topic, {
        qos: qos,
        onSuccess: () => {
          console.log(`Inscrito no tópico: ${topic}`);
          this.subscriptions.add({ topic, qos });
        },
        onFailure: (error) => {
          console.error(`Erro ao se inscrever no tópico ${topic}:`, error);
        },
      });
      return true;
    } catch (error) {
      console.error("Erro ao se inscrever:", error);
      if (this.onError) this.onError(error);
      return false;
    }
  }

  /**
   * Desinscreve-se de um tópico
   */
  unsubscribe(topic) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      this.client.unsubscribe(topic, {
        onSuccess: () => {
          console.log(`Desinscrito do tópico: ${topic}`);
          this.subscriptions.delete(topic);
        },
        onFailure: (error) => {
          console.error(`Erro ao se desinscrever do tópico ${topic}:`, error);
        },
      });
      return true;
    } catch (error) {
      console.error("Erro ao se desinscrever:", error);
      return false;
    }
  }

  /**
   * Reinscreve em todos os tópicos
   */
  resubscribeAll() {
    this.subscriptions.forEach(({ topic, qos }) => {
      this.subscribe(topic, qos);
    });
  }

  /**
   * Desconecta do broker
   */
  disconnect() {
    if (this.client && this.isConnected) {
      this.client.disconnect();
      this.isConnected = false;
      this.updateConnectionStatus("disconnected", "Desconectado");
    }
  }

  /**
   * Atualiza o status da conexão na interface
   */
  updateConnectionStatus(status, text) {
    const statusElement = document.getElementById("connectionStatus");
    if (!statusElement) return;

    // Remove classes anteriores
    statusElement.className = "badge me-3";

    // Adiciona nova classe baseada no status
    switch (status) {
      case "connected":
        statusElement.classList.add("bg-success");
        statusElement.innerHTML = '<i class="fas fa-wifi me-1"></i>' + text;
        break;
      case "connecting":
      case "reconnecting":
        statusElement.classList.add("bg-warning");
        statusElement.innerHTML =
          '<i class="fas fa-spinner fa-spin me-1"></i>' + text;
        break;
      case "disconnected":
        statusElement.classList.add("bg-secondary");
        statusElement.innerHTML =
          '<i class="fas fa-wifi-slash me-1"></i>' + text;
        break;
      case "error":
        statusElement.classList.add("bg-danger");
        statusElement.innerHTML =
          '<i class="fas fa-exclamation-triangle me-1"></i>' + text;
        break;
    }
  }

  /**
   * Reconecta com novas configurações
   */
  reconnectWithSettings(newSettings) {
    this.disconnect();
    this.saveSettings(newSettings);
    this.settings = { ...this.settings, ...newSettings };
    this.reconnectAttempts = 0;

    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  /**
   * Obtém o status da conexão
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      settings: this.settings,
      subscriptions: Array.from(this.subscriptions),
    };
  }
}

// Torna a classe disponível globalmente
window.MQTTClient = MQTTClient;
