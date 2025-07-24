/**
 * Sistema de Notificações Centralizado
 * Gerencia todas as mensagens e erros da aplicação
 */

class NotificationSystem {
  constructor() {
    this.container = document.getElementById("notificationContainer");
    this.notifications = new Map();
    this.autoCloseTime = 5000; // 5 segundos
    this.maxNotifications = 4;
  }

  /**
   * Mostra uma notificação
   * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
   * @param {string} title - Título da notificação
   * @param {string} message - Mensagem da notificação
   * @param {Object} options - Opções adicionais
   */
  show(type, title, message, options = {}) {
    const config = {
      autoClose: options.autoClose !== false,
      duration: options.duration || this.autoCloseTime,
      persistent: options.persistent || false,
      id: options.id || this.generateId(),
      showProgress: options.showProgress !== false,
      ...options,
    };

    // Remove notificação existente com mesmo ID
    if (this.notifications.has(config.id)) {
      this.hide(config.id);
    }

    // Limita o número de notificações
    this.limitNotifications();

    // Cria o elemento da notificação
    const notification = this.createNotificationElement(
      type,
      title,
      message,
      config
    );

    // Armazena a notificação
    this.notifications.set(config.id, {
      element: notification,
      timer: null,
      config: config,
    });

    // Adiciona ao container
    this.container.appendChild(notification);

    // Anima a entrada
    requestAnimationFrame(() => {
      notification.classList.add("show");
    });

    // Configura auto-close se necessário
    if (config.autoClose && !config.persistent) {
      this.setAutoClose(config.id, config.duration, config.showProgress);
    }

    return config.id;
  }

  /**
   * Cria o elemento HTML da notificação
   */
  createNotificationElement(type, title, message, config) {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.setAttribute("data-id", config.id);

    const icon = this.getIcon(type);

    notification.innerHTML = `
      <div class="notification-icon">
        <i class="${icon}"></i>
      </div>
      <div class="notification-content">
        <div class="notification-title">${title}</div>
        ${message ? `<div class="notification-message">${message}</div>` : ""}
      </div>
      <button class="notification-close" aria-label="Fechar">
        <i class="fas fa-times"></i>
      </button>
      ${
        config.showProgress && config.autoClose
          ? '<div class="notification-progress"></div>'
          : ""
      }
    `;

    // Event listener para fechar
    const closeBtn = notification.querySelector(".notification-close");
    closeBtn.addEventListener("click", () => {
      this.hide(config.id);
    });

    return notification;
  }

  /**
   * Retorna o ícone para cada tipo de notificação
   */
  getIcon(type) {
    const icons = {
      success: "fas fa-check-circle",
      error: "fas fa-exclamation-circle",
      warning: "fas fa-exclamation-triangle",
      info: "fas fa-info-circle",
    };
    return icons[type] || icons.info;
  }

  /**
   * Esconde uma notificação
   */
  hide(id) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    // Para o timer se existir
    if (notification.timer) {
      clearTimeout(notification.timer);
    }

    // Anima a saída
    notification.element.classList.add("hide");
    notification.element.classList.remove("show");

    // Remove após a animação
    setTimeout(() => {
      if (notification.element.parentNode) {
        notification.element.parentNode.removeChild(notification.element);
      }
      this.notifications.delete(id);
    }, 400);
  }

  /**
   * Configura auto-close com barra de progresso
   */
  setAutoClose(id, duration, showProgress) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    const progressBar = notification.element.querySelector(
      ".notification-progress"
    );

    if (showProgress && progressBar) {
      progressBar.style.width = "100%";
      progressBar.style.transition = `width ${duration}ms linear`;

      // Anima a barra de progresso
      requestAnimationFrame(() => {
        progressBar.style.width = "0%";
      });
    }

    // Timer para auto-close
    notification.timer = setTimeout(() => {
      this.hide(id);
    }, duration);
  }

  /**
   * Limita o número de notificações visíveis
   */
  limitNotifications() {
    const notificationElements =
      this.container.querySelectorAll(".notification");
    if (notificationElements.length >= this.maxNotifications) {
      // Remove a mais antiga
      const oldestId = notificationElements[0].getAttribute("data-id");
      this.hide(oldestId);
    }
  }

  /**
   * Gera um ID único para a notificação
   */
  generateId() {
    return `notification_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  /**
   * Remove todas as notificações
   */
  clear() {
    const ids = Array.from(this.notifications.keys());
    ids.forEach((id) => this.hide(id));
  }

  /**
   * Métodos de conveniência
   */
  success(title, message, options = {}) {
    return this.show("success", title, message, options);
  }

  error(title, message, options = {}) {
    return this.show("error", title, message, options);
  }

  warning(title, message, options = {}) {
    return this.show("warning", title, message, options);
  }

  info(title, message, options = {}) {
    return this.show("info", title, message, options);
  }

  /**
   * Métodos específicos para MQTT
   */
  mqttConnecting() {
    return this.info("MQTT", "Conectando ao broker...", {
      id: "mqtt_status",
      persistent: true,
      autoClose: false,
    });
  }

  mqttConnected() {
    this.hide("mqtt_status");
    return this.success("MQTT", "Conectado com sucesso!", {
      id: "mqtt_connected",
      duration: 3000,
    });
  }

  mqttDisconnected() {
    this.hide("mqtt_status");
    this.hide("mqtt_connected");
    return this.warning("MQTT", "Desconectado do broker", {
      id: "mqtt_disconnected",
      duration: 4000,
    });
  }

  mqttError(errorMessage) {
    this.hide("mqtt_status");
    return this.error("Erro MQTT", errorMessage, {
      id: "mqtt_error",
      duration: 6000,
    });
  }

  deviceControl(deviceName, action) {
    return this.info("Dispositivo", `${deviceName} ${action}`, {
      duration: 2000,
      showProgress: false,
    });
  }

  deviceError(deviceName, error) {
    return this.error("Erro no Dispositivo", `${deviceName}: ${error}`, {
      duration: 4000,
    });
  }
}

// Instância global do sistema de notificações
window.notificationSystem = new NotificationSystem();
