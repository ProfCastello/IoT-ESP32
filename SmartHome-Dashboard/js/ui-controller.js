/**
 * UI Controller
 * Gerencia a interface do usuário e interações
 */

class UIController {
  constructor() {
    this.theme = this.loadTheme();
    this.deviceStates = this.loadDeviceStates();
    this.mqttClient = null;

    this.init();
  }

  /**
   * Inicializa o controlador da UI
   */
  init() {
    this.applyTheme();
    this.setupEventListeners();
    this.loadMQTTSettings();
    this.restoreDeviceStates();
    this.addFadeInAnimations();
  }

  /**
   * Carrega o tema do localStorage
   */
  loadTheme() {
    return localStorage.getItem("theme") || "dark";
  }

  /**
   * Salva o tema no localStorage
   */
  saveTheme(theme) {
    this.theme = theme;
    localStorage.setItem("theme", theme);
  }

  /**
   * Aplica o tema atual
   */
  applyTheme() {
    document.documentElement.setAttribute("data-bs-theme", this.theme);
    this.updateThemeIcon();
  }

  /**
   * Atualiza o ícone do botão de tema
   */
  updateThemeIcon() {
    const themeIcon = document.getElementById("themeIcon");
    if (themeIcon) {
      themeIcon.className =
        this.theme === "dark" ? "fas fa-sun" : "fas fa-moon";
    }
  }

  /**
   * Alterna entre tema claro e escuro
   */
  toggleTheme() {
    const newTheme = this.theme === "dark" ? "light" : "dark";
    this.saveTheme(newTheme);
    this.applyTheme();
    this.showToast(
      "Tema alterado",
      `Tema ${newTheme === "dark" ? "escuro" : "claro"} ativado`
    );
  }

  /**
   * Carrega estados dos dispositivos do localStorage
   */
  loadDeviceStates() {
    const saved = localStorage.getItem("deviceStates");
    return saved ? JSON.parse(saved) : {};
  }

  /**
   * Salva estados dos dispositivos no localStorage
   */
  saveDeviceStates() {
    localStorage.setItem("deviceStates", JSON.stringify(this.deviceStates));
  }

  /**
   * Restaura os estados dos dispositivos na interface
   */
  restoreDeviceStates() {
    Object.keys(this.deviceStates).forEach((deviceId) => {
      const state = this.deviceStates[deviceId];
      this.updateDeviceUI(deviceId, state.status, false);
    });
  }

  /**
   * Configura event listeners
   */
  setupEventListeners() {
    // Toggle de tema
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => this.toggleTheme());
    }

    // Switches de dispositivos
    document.querySelectorAll(".device-switch").forEach((switch_) => {
      switch_.addEventListener("change", this.handleDeviceSwitch.bind(this));
    });

    // Botões de dispositivos
    document.querySelectorAll(".device-button").forEach((button) => {
      button.addEventListener("click", this.handleDeviceButton.bind(this));
    });

    // Configurações MQTT
    const saveSettings = document.getElementById("saveSettings");
    if (saveSettings) {
      saveSettings.addEventListener("click", this.saveMQTTSettings.bind(this));
    }

    // Clique nos cards de dispositivos (para feedback visual)
    document.querySelectorAll(".device-card").forEach((card) => {
      card.addEventListener("click", this.handleCardClick.bind(this));
    });
  }

  /**
   * Manipula o clique em switches de dispositivos
   */
  handleDeviceSwitch(event) {
    const switch_ = event.target;
    const topic = switch_.dataset.topic;
    const deviceId = switch_.id.replace("switch_", "");
    const isOn = switch_.checked;
    const message = isOn ? "on" : "off";

    // Adiciona animação de loading
    this.addLoadingState(switch_);

    // Envia comando MQTT
    if (this.mqttClient && this.mqttClient.publish(topic, message)) {
      // Atualiza estado local
      this.updateDeviceState(deviceId, isOn ? "on" : "off");
      this.updateDeviceUI(deviceId, isOn ? "on" : "off");

      // Remove loading após delay
      setTimeout(() => this.removeLoadingState(switch_), 500);
    } else {
      // Reverte o switch se falhou
      switch_.checked = !isOn;
      this.removeLoadingState(switch_);
      this.showToast("Erro", "Falha ao enviar comando", "error");
    }
  }

  /**
   * Manipula o clique em botões de dispositivos
   */
  handleDeviceButton(event) {
    const button = event.target.closest(".device-button");
    const topic = button.dataset.topic;
    const message = button.dataset.message || "toggle";
    const deviceId = button.closest(".device-card").dataset.device;

    // Adiciona animação de loading
    this.addLoadingState(button);

    // Envia comando MQTT
    if (this.mqttClient && this.mqttClient.publish(topic, message)) {
      // Para dispositivos tipo botão, alterna o estado
      const currentState = this.deviceStates[deviceId]?.status || "off";
      const newState = currentState === "on" ? "off" : "on";

      this.updateDeviceState(deviceId, newState);
      this.updateDeviceUI(deviceId, newState);

      setTimeout(() => this.removeLoadingState(button), 500);
    } else {
      this.removeLoadingState(button);
      this.showToast("Erro", "Falha ao enviar comando", "error");
    }
  }

  /**
   * Manipula o clique nos cards (feedback visual)
   */
  handleCardClick(event) {
    const card = event.currentTarget;

    // Adiciona efeito de ripple
    this.addRippleEffect(card, event);
  }

  /**
   * Atualiza o estado de um dispositivo
   */
  updateDeviceState(deviceId, status) {
    this.deviceStates[deviceId] = {
      status,
      lastUpdate: new Date().toISOString(),
    };
    this.saveDeviceStates();
  }

  /**
   * Atualiza a interface de um dispositivo
   */
  updateDeviceUI(deviceId, status, animate = true) {
    const icon = document.getElementById(`icon_${deviceId}`);
    const statusText = document.getElementById(`status_${deviceId}`);
    const switch_ = document.getElementById(`switch_${deviceId}`);
    const card = document.querySelector(`[data-device="${deviceId}"]`);

    if (!icon) return;

    const isOn = status === "on" || status === "open" || status === "active";

    // Atualiza ícone
    if (animate) {
      icon.style.transform = "scale(1.2)";
      setTimeout(() => {
        icon.style.transform = "scale(1)";
      }, 200);
    }

    // Remove classes anteriores
    icon.classList.remove("on", "off", "open", "closed", "active", "inactive");

    // Adiciona nova classe baseada no status
    icon.classList.add(isOn ? "on" : "off");

    // Atualiza texto de status
    if (statusText) {
      statusText.textContent = this.getStatusText(deviceId, status);
      statusText.classList.toggle("online", isOn);
      statusText.classList.toggle("offline", !isOn);
    }

    // Atualiza switch (se existir)
    if (switch_) {
      switch_.checked = isOn;
    }

    // Atualiza card
    if (card) {
      card.classList.toggle("active", isOn);
    }

    // Atualiza estado interno
    this.updateDeviceState(deviceId, status);

    // Atualiza informações do footer
    this.updateFooterInfo();
  }

  /**
   * Atualiza informações do footer
   */
  updateFooterInfo() {
    // Atualiza contador de dispositivos ativos no footer
    if (window.footerController) {
      window.footerController.updateDeviceCount();
      window.footerController.markUpdate();
    }
  }

  /**
   * Obtém o texto de status baseado no dispositivo e estado
   */
  getStatusText(deviceId, status) {
    const statusMap = {
      on: "Ligado",
      off: "Desligado",
      open: "Aberto",
      closed: "Fechado",
      active: "Ativo",
      inactive: "Inativo",
    };

    return statusMap[status] || status;
  }

  /**
   * Adiciona estado de loading a um elemento
   */
  addLoadingState(element) {
    element.classList.add("loading");
    element.disabled = true;
  }

  /**
   * Remove estado de loading de um elemento
   */
  removeLoadingState(element) {
    element.classList.remove("loading");
    element.disabled = false;
  }

  /**
   * Adiciona efeito ripple a um elemento
   */
  addRippleEffect(element, event) {
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement("div");
    ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple 0.6s linear;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
        `;

    element.style.position = "relative";
    element.style.overflow = "hidden";
    element.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  /**
   * Carrega configurações MQTT na modal
   */
  loadMQTTSettings() {
    const settings = JSON.parse(localStorage.getItem("mqttSettings") || "{}");

    const fields = {
      mqttBroker: settings.broker || "broker.hivemq.com",
      mqttPort: settings.port || 8000,
      mqttClientId: settings.clientId || "",
      mqttSecure: settings.secure || false,
    };

    Object.keys(fields).forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      if (field) {
        if (field.type === "checkbox") {
          field.checked = fields[fieldId];
        } else {
          field.value = fields[fieldId];
        }
      }
    });
  }

  /**
   * Salva configurações MQTT
   */
  saveMQTTSettings() {
    const settings = {
      broker: document.getElementById("mqttBroker").value,
      port: parseInt(document.getElementById("mqttPort").value),
      clientId: document.getElementById("mqttClientId").value,
      secure: document.getElementById("mqttSecure").checked,
    };

    // Valida configurações
    if (!settings.broker || !settings.port) {
      this.showToast("Erro", "Preencha todos os campos obrigatórios", "error");
      return;
    }

    // Reconecta com novas configurações
    if (this.mqttClient) {
      this.mqttClient.reconnectWithSettings(settings);
    }

    // Fecha modal
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("settingsModal")
    );
    if (modal) modal.hide();

    this.showToast(
      "Sucesso",
      "Configurações salvas e reconectando...",
      "success"
    );
  }

  /**
   * Adiciona animações fade-in aos elementos
   */
  addFadeInAnimations() {
    const cards = document.querySelectorAll(".device-card");
    cards.forEach((card, index) => {
      card.style.animationDelay = `${index * 0.1}s`;
      card.classList.add("fade-in");
    });
  }

  /**
   * Define o cliente MQTT
   */
  setMQTTClient(mqttClient) {
    this.mqttClient = mqttClient;
  }

  /**
   * Processa mensagem MQTT recebida
   */
  processMQTTMessage(topic, message) {
    // Extrai o deviceId do tópico
    const deviceId = this.extractDeviceIdFromTopic(topic);

    if (deviceId) {
      this.updateDeviceUI(deviceId, message.toLowerCase());

      // Mostra notificação se necessário
      if (message.toLowerCase() === "on" || message.toLowerCase() === "off") {
        this.showToast(
          "Dispositivo Atualizado",
          `${this.getDeviceName(deviceId)} foi ${
            message.toLowerCase() === "on" ? "ligado" : "desligado"
          }`,
          "info"
        );
      }
    }
  }

  /**
   * Extrai o ID do dispositivo do tópico MQTT
   */
  extractDeviceIdFromTopic(topic) {
    const topicMap = {
      "casa/sala/luz1": "sala_luz1",
      "casa/quarto/luz1": "quarto_luz1",
      "casa/cozinha/tomada1": "cozinha_tomada1",
      "casa/jardim/irrigacao": "jardim_irrigacao",
      "casa/garagem/portao": "garagem_portao",
      "casa/sala/ar": "sala_ar",
    };

    return topicMap[topic] || null;
  }

  /**
   * Obtém o nome amigável do dispositivo
   */
  getDeviceName(deviceId) {
    const nameMap = {
      sala_luz1: "Lâmpada da Sala",
      quarto_luz1: "Lâmpada do Quarto",
      cozinha_tomada1: "Tomada da Cozinha",
      jardim_irrigacao: "Irrigação do Jardim",
      garagem_portao: "Portão da Garagem",
      sala_ar: "Ar Condicionado",
    };

    return nameMap[deviceId] || deviceId;
  }

  /**
   * Mostra toast de notificação
   */
  showToast(title, message, type = "info") {
    // Cria container de toast se não existir
    let toastContainer = document.querySelector(".toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.className =
        "toast-container position-fixed top-0 end-0 p-3";
      toastContainer.style.zIndex = "9999";
      document.body.appendChild(toastContainer);
    }

    // Define cor baseada no tipo
    const typeClasses = {
      success: "text-bg-success",
      error: "text-bg-danger",
      warning: "text-bg-warning",
      info: "text-bg-info",
    };

    const toastClass = typeClasses[type] || typeClasses.info;

    // Cria toast
    const toastElement = document.createElement("div");
    toastElement.className = `toast ${toastClass}`;
    toastElement.setAttribute("role", "alert");
    toastElement.innerHTML = `
            <div class="toast-header">
                <strong class="me-auto">${title}</strong>
                <small>agora</small>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;

    toastContainer.appendChild(toastElement);

    // Mostra toast
    const toast = new bootstrap.Toast(toastElement, {
      autohide: true,
      delay: 3000,
    });

    toast.show();

    // Remove do DOM após fechar
    toastElement.addEventListener("hidden.bs.toast", () => {
      toastElement.remove();
    });
  }
}

// Torna a classe disponível globalmente
window.UIController = UIController;
