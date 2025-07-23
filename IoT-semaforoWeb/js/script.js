// Sistema de Controle do Semáforo IoT ESP32 - Versão Moderna
class SemaforoIoTController {
  constructor() {
    // Elementos DOM
    this.leds = {
      vermelho: document.getElementById("vermelho"),
      amarelo: document.getElementById("amarelo"),
      verde: document.getElementById("verde"),
    };

    this.botoes = {
      vermelho: document.querySelector(".btn-vermelho"),
      amarelo: document.querySelector(".btn-amarelo"),
      verde: document.querySelector(".btn-verde"),
      automatico: document.querySelector(".btn-automatico"),
      desligar: document.querySelector(".btn-desligar"),
    };

    // Elementos do device card
    this.deviceElements = {
      connectionStatus: document.getElementById("connection-status"),
      connectionIndicator: document.getElementById("connection-indicator"),
      modeBadge: document.getElementById("mode-badge"),
      batteryLevel: document.getElementById("battery-level"),
      temperature: document.getElementById("temperature"),
      wifiStrength: document.getElementById("wifi-strength"),
      uptime: document.getElementById("uptime"),
      simulatorAlert: document.getElementById("simulator-alert"),
    };

    // Elementos de notificação
    this.notificationElements = {
      container: document.getElementById("system-notification"),
      icon: document.getElementById("notification-icon"),
      title: document.getElementById("notification-title"),
      message: document.getElementById("notification-message"),
      close: document.getElementById("notification-close"),
      progress: document.getElementById("notification-progress"),
    };

    this.status = document.getElementById("status");
    this.loadingOverlay = document.getElementById("loading-overlay");

    // Estado do sistema
    this.modoAutomatico = false;
    this.intervalId = null;
    this.statusUpdateInterval = null;
    this.currentStep = 0;
    this.isInitialized = false;
    this.isConnectedToIoT = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;

    // Dados simulados do dispositivo
    this.deviceSimData = {
      battery: 87,
      temperature: 24.5,
      wifiStrength: -45,
      uptimeStart: Date.now(),
      isOnline: false,
    };

    // Configurações de sequência automática
    this.sequenciaAutomatica = [
      {
        cor: "verde",
        tempo: 5000,
        status: "SIGA - Verde Ativo",
        classe: "text-success",
      },
      {
        cor: "amarelo",
        tempo: 2000,
        status: "ATENÇÃO - Amarelo Ativo",
        classe: "text-warning",
      },
      {
        cor: "vermelho",
        tempo: 5000,
        status: "PARE - Vermelho Ativo",
        classe: "text-danger",
      },
    ];

    this.init();
  }

  async init() {
    try {
      // Tentar conectar com dispositivo IoT
      await this.tentarConexaoIoT();

      // Configurar event listeners
      this.configurarEventListeners();

      // Aplicar animações iniciais
      this.aplicarAnimacoesIniciais();

      // Iniciar atualizações do status do dispositivo
      this.iniciarAtualizacaoStatus();

      // Remover overlay de carregamento
      this.ocultarCarregamento();

      // Definir status inicial baseado na conexão
      if (this.isConnectedToIoT) {
        this.atualizarStatus("Sistema Conectado - Pronto", "text-success");
        this.notifySystemAction("iot_connected");
      } else {
        this.atualizarStatus("Modo Simulador - Pronto", "text-warning");
        this.notifySystemAction("iot_disconnected");
      }

      this.isInitialized = true;
      console.log(
        `🚦 Sistema IoT ESP32 inicializado - Modo: ${
          this.isConnectedToIoT ? "Conectado" : "Simulador"
        }`
      );
    } catch (error) {
      console.error("❌ Erro na inicialização:", error);
      this.atualizarStatus("Erro na Inicialização", "text-danger");
      this.atualizarDeviceStatus("error");
    }
  }

  async tentarConexaoIoT() {
    console.log("🔍 Tentando conectar com dispositivo ESP32...");
    this.atualizarDeviceStatus("checking");

    for (let attempt = 1; attempt <= this.maxConnectionAttempts; attempt++) {
      try {
        console.log(`📡 Tentativa ${attempt}/${this.maxConnectionAttempts}`);

        // Simular tentativa de conexão (substitua pela chamada real)
        const connected = await this.testarConexaoESP32();

        if (connected) {
          console.log("✅ Dispositivo ESP32 encontrado!");
          this.isConnectedToIoT = true;
          this.atualizarDeviceStatus("connected");
          await this.obterDadosDispositivo();
          return;
        }

        // Aguardar antes da próxima tentativa
        if (attempt < this.maxConnectionAttempts) {
          await this.delay(1000);
        }
      } catch (error) {
        console.log(`❌ Tentativa ${attempt} falhou:`, error.message);
      }
    }

    // Se chegou aqui, não conseguiu conectar
    console.log(
      "⚠️ Dispositivo ESP32 não encontrado. Iniciando modo simulador..."
    );
    this.isConnectedToIoT = false;
    this.atualizarDeviceStatus("simulator");
    this.iniciarSimuladorDados();
  }

  async testarConexaoESP32() {
    // Substitua esta implementação pela chamada real para seu ESP32
    try {
      // Por enquanto, simular falha de conexão (para demonstrar modo simulador)
      return new Promise((resolve) => {
        setTimeout(() => {
          // Simular 20% de chance de conexão bem-sucedida
          resolve(Math.random() < 0.2);
        }, 1500);
      });
    } catch (error) {
      return false;
    }
  }

  async obterDadosDispositivo() {
    try {
      // Dados simulados mais realistas para modo conectado
      this.deviceSimData = {
        battery: 94,
        temperature: 26.2,
        wifiStrength: -38,
        uptimeStart: Date.now() - 3 * 60 * 60 * 1000, // 3 horas de uptime
        isOnline: true,
      };
    } catch (error) {
      console.error("❌ Erro ao obter dados do dispositivo:", error);
    }
  }

  iniciarSimuladorDados() {
    // Dados simulados mais dinâmicos
    this.deviceSimData = {
      battery: 87 + Math.random() * 10, // 87-97%
      temperature: 24 + Math.random() * 6, // 24-30°C
      wifiStrength: -50 + Math.random() * 20, // -50 a -30 dBm
      uptimeStart: Date.now() - Math.random() * 12 * 60 * 60 * 1000, // até 12h
      isOnline: false,
    };
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  atualizarDeviceStatus(status) {
    const { connectionStatus, connectionIndicator, modeBadge, simulatorAlert } =
      this.deviceElements;

    // Limpar classes anteriores
    connectionIndicator.className = "connection-indicator";
    modeBadge.className = "mode-badge";

    switch (status) {
      case "checking":
        connectionStatus.textContent = "Verificando conexão...";
        connectionIndicator.classList.add("checking");
        modeBadge.textContent = "VERIFICANDO";
        modeBadge.classList.add("initializing");
        simulatorAlert.style.display = "none";
        break;

      case "connected":
        connectionStatus.textContent = "Conectado ao ESP32";
        connectionIndicator.classList.add("connected");
        modeBadge.textContent = "CONECTADO";
        modeBadge.classList.add("connected");
        simulatorAlert.style.display = "none";
        break;

      case "simulator":
        connectionStatus.textContent = "Modo Simulador";
        connectionIndicator.classList.add("disconnected");
        modeBadge.textContent = "SIMULADOR";
        modeBadge.classList.add("simulator");
        simulatorAlert.style.display = "block";
        break;

      case "error":
        connectionStatus.textContent = "Erro de Conexão";
        connectionIndicator.classList.add("disconnected");
        modeBadge.textContent = "ERRO";
        modeBadge.classList.add("simulator");
        simulatorAlert.style.display = "block";
        break;
    }
  }

  iniciarAtualizacaoStatus() {
    // Atualizar dados do dispositivo a cada 5 segundos
    this.statusUpdateInterval = setInterval(() => {
      this.atualizarDadosDispositivo();
    }, 5000);

    // Primeira atualização imediata
    this.atualizarDadosDispositivo();
  }

  atualizarDadosDispositivo() {
    const { batteryLevel, temperature, wifiStrength, uptime } =
      this.deviceElements;

    if (this.isConnectedToIoT) {
      // Se conectado, dados mais estáveis com pequenas variações
      this.deviceSimData.battery = Math.max(
        85,
        this.deviceSimData.battery + (Math.random() - 0.5) * 2
      );
      this.deviceSimData.temperature = Math.max(
        20,
        Math.min(
          35,
          this.deviceSimData.temperature + (Math.random() - 0.5) * 0.5
        )
      );
      this.deviceSimData.wifiStrength = Math.max(
        -60,
        Math.min(
          -30,
          this.deviceSimData.wifiStrength + (Math.random() - 0.5) * 3
        )
      );
    } else {
      // Modo simulador - dados mais variáveis
      this.deviceSimData.battery = Math.max(
        70,
        Math.min(100, this.deviceSimData.battery + (Math.random() - 0.5) * 3)
      );
      this.deviceSimData.temperature = Math.max(
        20,
        Math.min(40, this.deviceSimData.temperature + (Math.random() - 0.5) * 1)
      );
      this.deviceSimData.wifiStrength = Math.max(
        -70,
        Math.min(
          -25,
          this.deviceSimData.wifiStrength + (Math.random() - 0.5) * 5
        )
      );
    }

    // Atualizar elementos da interface
    batteryLevel.textContent = `${Math.round(this.deviceSimData.battery)}%`;
    temperature.textContent = `${this.deviceSimData.temperature.toFixed(1)}°C`;
    wifiStrength.textContent = `${Math.round(
      this.deviceSimData.wifiStrength
    )}dBm`;

    // Calcular e atualizar uptime
    const uptimeMs = Date.now() - this.deviceSimData.uptimeStart;
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((uptimeMs % (1000 * 60)) / 1000);
    uptime.textContent = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    // Atualizar ícone da bateria baseado no nível
    this.atualizarIconeBateria(this.deviceSimData.battery);
  }

  atualizarIconeBateria(nivel) {
    const statIcon = document.querySelector(
      ".stat-item .stat-icon i.fa-battery-three-quarters"
    );
    if (!statIcon) return;

    // Remover classes de bateria anteriores
    statIcon.className = statIcon.className.replace(/fa-battery-[a-z-]+/g, "");

    if (nivel > 80) {
      statIcon.classList.add("fa-battery-full");
    } else if (nivel > 60) {
      statIcon.classList.add("fa-battery-three-quarters");
    } else if (nivel > 40) {
      statIcon.classList.add("fa-battery-half");
    } else if (nivel > 20) {
      statIcon.classList.add("fa-battery-quarter");
    } else {
      statIcon.classList.add("fa-battery-empty");
    }
  }

  async inicializar() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 2000); // Simula tempo de inicialização
    });
  }

  configurarEventListeners() {
    // Event listeners para botões principais
    this.botoes.vermelho.addEventListener("click", () =>
      this.acenderLed("vermelho")
    );
    this.botoes.amarelo.addEventListener("click", () =>
      this.acenderLed("amarelo")
    );
    this.botoes.verde.addEventListener("click", () => this.acenderLed("verde"));
    this.botoes.automatico.addEventListener("click", () =>
      this.toggleAutomatico()
    );
    this.botoes.desligar.addEventListener("click", () => this.desligarTodos());

    // Event listeners para LEDs (interação direta)
    Object.entries(this.leds).forEach(([cor, led]) => {
      led.addEventListener("click", () => this.acenderLed(cor));
      led.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.acenderLed(cor);
        }
      });
    });

    // Atalhos de teclado aprimorados
    document.addEventListener("keydown", (event) =>
      this.handleKeyboardShortcuts(event)
    );

    // Detecção de mudança de orientação
    window.addEventListener("orientationchange", () =>
      this.handleOrientationChange()
    );

    // Visibilidade da página
    document.addEventListener("visibilitychange", () =>
      this.handleVisibilityChange()
    );

    // Event listener para fechar notificação
    if (this.notificationElements.close) {
      this.notificationElements.close.addEventListener("click", () => {
        this.hideNotification();
      });

      this.notificationElements.close.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.hideNotification();
        }
      });
    }
  }

  aplicarAnimacoesIniciais() {
    // Aplicar animação fade-in sequencial
    const elementos = [
      document.querySelector("h1"),
      document.querySelector(".semaforo"),
      document.querySelector(".controles"),
      document.querySelector(".status"),
    ];

    elementos.forEach((elemento, index) => {
      if (elemento) {
        setTimeout(() => {
          elemento.classList.add("fade-in");
        }, index * 200);
      }
    });
  }

  ocultarCarregamento() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.add("hidden");
      setTimeout(() => {
        this.loadingOverlay.style.display = "none";
      }, 500);
    }
  }

  acenderLed(cor, isAutomatic = false) {
    if (!this.isInitialized) return;

    if (this.modoAutomatico && !isAutomatic) {
      this.pararAutomatico();
    }

    // Desligar todos os LEDs
    this.apagarTodos();

    // Acender o LED selecionado com animação
    const led = this.leds[cor];
    const botao = this.botoes[cor];

    if (led && botao) {
      // Atualizar estado visual
      led.classList.add("ativo");
      led.setAttribute("aria-pressed", "true");

      // Atualizar status com classe de cor apropriada
      const statusClasses = {
        vermelho: "text-danger",
        amarelo: "text-warning",
        verde: "text-success",
      };

      const statusTexts = {
        vermelho: "PARE - LED Vermelho Ativo",
        amarelo: "ATENÇÃO - LED Amarelo Ativo",
        verde: "SIGA - LED Verde Ativo",
      };

      this.atualizarStatus(statusTexts[cor], statusClasses[cor]);

      // Feedback visual no botão
      this.adicionarFeedbackBotao(botao);

      // Vibração em dispositivos móveis
      if (navigator.vibrate) {
        navigator.vibrate([50]);
      }

      // Log para debug
      console.log(`🔴🟡🟢 LED ${cor.toUpperCase()} ativado`);

      // Mostrar notificação (apenas em modo manual)
      if (!isAutomatic) {
        this.notifyLedAction(cor);
      }

      // Simular comando para ESP32
      this.enviarComandoESP32(`LED_${cor.toUpperCase()}_ON`);
    }
  }

  desligarTodos() {
    if (!this.isInitialized) return;

    this.pararAutomatico();
    this.apagarTodos();
    this.atualizarStatus("Sistema Desligado", "text-muted");

    // Mostrar notificação
    this.notifySystemAction("system_off");

    // Vibração longa para desligar
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    console.log("🔴 Todos os LEDs desligados");
    this.enviarComandoESP32("SYSTEM_OFF");
  }

  apagarTodos() {
    Object.entries(this.leds).forEach(([cor, led]) => {
      led.classList.remove("ativo");
      led.setAttribute("aria-pressed", "false");
    });
  }

  toggleAutomatico() {
    if (!this.isInitialized) return;

    if (this.modoAutomatico) {
      this.pararAutomatico();
    } else {
      this.iniciarAutomatico();
    }
  }

  iniciarAutomatico() {
    if (this.modoAutomatico) return;

    this.modoAutomatico = true;
    this.currentStep = 0;

    // Atualizar botão
    const botaoAuto = this.botoes.automatico;
    botaoAuto.innerHTML =
      '<i class="fas fa-pause" aria-hidden="true"></i><span>Parar</span>';
    botaoAuto.classList.add("loading");
    botaoAuto.setAttribute("aria-pressed", "true");

    this.atualizarStatus("Modo Automático Iniciado", "text-info");

    // Mostrar notificação
    this.notifySystemAction("automatico_on");

    const executarSequencia = () => {
      if (!this.modoAutomatico) return;

      const passo = this.sequenciaAutomatica[this.currentStep];
      this.acenderLed(passo.cor, true);
      this.atualizarStatus(passo.status, passo.classe);

      this.intervalId = setTimeout(() => {
        this.currentStep =
          (this.currentStep + 1) % this.sequenciaAutomatica.length;
        executarSequencia();
      }, passo.tempo);
    };

    // Iniciar sequência
    executarSequencia();
    console.log("🔄 Modo automático iniciado");
    this.enviarComandoESP32("AUTO_MODE_ON");
  }

  pararAutomatico() {
    if (!this.modoAutomatico) return;

    this.modoAutomatico = false;

    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }

    // Restaurar botão
    const botaoAuto = this.botoes.automatico;
    botaoAuto.innerHTML =
      '<i class="fas fa-magic" aria-hidden="true"></i><span>Automático</span>';
    botaoAuto.classList.remove("loading");
    botaoAuto.setAttribute("aria-pressed", "false");

    this.atualizarStatus("Modo Manual Ativo", "text-primary");

    // Mostrar notificação
    this.notifySystemAction("automatico_off");

    console.log("⏹️ Modo automático parado");
    this.enviarComandoESP32("AUTO_MODE_OFF");
  }

  atualizarStatus(texto, classe = "") {
    if (this.status) {
      this.status.textContent = texto;
      this.status.className = `status-text ${classe}`;

      // Animação de atualização
      const container = this.status.parentElement;
      container.classList.remove("fade-in");
      setTimeout(() => {
        container.classList.add("fade-in");
      }, 10);

      // Remover animação após conclusão
      setTimeout(() => {
        container.classList.remove("fade-in");
      }, 600);
    }
  }

  adicionarFeedbackBotao(botao) {
    if (!botao) return;

    botao.style.transform = "scale(0.95)";
    botao.style.filter = "brightness(1.1)";

    setTimeout(() => {
      botao.style.transform = "";
      botao.style.filter = "";
    }, 150);
  }

  // Manipuladores de eventos avançados
  handleKeyboardShortcuts(event) {
    if (!this.isInitialized) return;

    // Prevenir ações se um elemento de entrada estiver focado
    if (
      event.target.tagName === "INPUT" ||
      event.target.tagName === "TEXTAREA"
    ) {
      return;
    }

    const key = event.key.toLowerCase();

    switch (key) {
      case "1":
      case "r":
        event.preventDefault();
        this.acenderLed("vermelho");
        break;
      case "2":
      case "y":
        event.preventDefault();
        this.acenderLed("amarelo");
        break;
      case "3":
      case "g":
        event.preventDefault();
        this.acenderLed("verde");
        break;
      case "a":
        event.preventDefault();
        this.toggleAutomatico();
        break;
      case "escape":
      case "d":
        event.preventDefault();
        this.desligarTodos();
        break;
      case " ":
        if (event.target.classList.contains("led")) {
          // Já tratado no evento click do LED
          return;
        }
        break;
    }
  }

  handleOrientationChange() {
    setTimeout(() => {
      console.log("📱 Orientação alterada - Layout ajustado");
      // Forçar repaint para corrigir possíveis problemas de layout
      document.body.style.display = "none";
      document.body.offsetHeight; // Trigger reflow
      document.body.style.display = "";
    }, 100);
  }

  handleVisibilityChange() {
    if (document.hidden && this.modoAutomatico) {
      console.log("🔄 Página oculta - Pausando modo automático");
      // Opcional: pausar automático quando página não está visível
    } else if (!document.hidden && this.wasAutoBeforeHidden) {
      console.log("🔄 Página visível - Retomando modo automático");
      // Opcional: retomar automático
    }
  }

  // Integração com ESP32 (preparado para implementação real)
  async enviarComandoESP32(comando) {
    try {
      // Aqui seria implementada a comunicação real com ESP32
      // Exemplo de implementação:
      /*
      const response = await fetch('/api/semaforo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          comando: comando,
          timestamp: Date.now()
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Comando enviado com sucesso:', data);
      */

      // Por enquanto, apenas log
      console.log(`📡 Comando para ESP32: ${comando}`);
    } catch (error) {
      console.error("❌ Erro ao enviar comando para ESP32:", error);
      this.atualizarStatus("Erro de Comunicação", "text-danger");
    }
  }

  // Métodos utilitários
  destruir() {
    // Limpar timers
    if (this.intervalId) {
      clearTimeout(this.intervalId);
    }

    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
    }

    // Remover event listeners
    document.removeEventListener("keydown", this.handleKeyboardShortcuts);
    window.removeEventListener(
      "orientationchange",
      this.handleOrientationChange
    );
    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange
    );

    console.log("🧹 Sistema limpo e destruído");
  }

  // Sistema de Notificações
  showNotification(
    title,
    message,
    type = "info",
    autoHide = true,
    duration = 4000
  ) {
    if (!this.notificationElements.container) return;

    // Atualizar conteúdo
    this.notificationElements.title.textContent = title;
    this.notificationElements.message.textContent = message;

    // Definir ícone baseado no tipo
    const icons = {
      info: "fas fa-info-circle",
      success: "fas fa-check-circle",
      warning: "fas fa-exclamation-triangle",
      error: "fas fa-times-circle",
    };

    this.notificationElements.icon.className = icons[type] || icons.info;

    // Remover classes de tipo anteriores
    this.notificationElements.container.classList.remove(
      "success",
      "warning",
      "error"
    );

    // Adicionar classe do tipo atual
    if (type !== "info") {
      this.notificationElements.container.classList.add(type);
    }

    // Resetar display e mostrar notificação
    this.notificationElements.container.style.display = "block";
    this.notificationElements.container.classList.remove("hide");
    this.notificationElements.container.classList.add("show");

    // Configurar auto-hide
    if (autoHide) {
      this.notificationElements.container.classList.add("auto-hide");

      setTimeout(() => {
        this.hideNotification();
      }, duration);
    } else {
      this.notificationElements.container.classList.remove("auto-hide");
    }

    console.log(`📢 Notificação (${type}): ${title} - ${message}`);
  }

  hideNotification() {
    if (!this.notificationElements.container) return;

    // Usar posicionamento fixo que não afeta o layout da página
    this.notificationElements.container.classList.remove("show", "auto-hide");
    this.notificationElements.container.classList.add("hide");

    // Após a animação, remover da tela sem afetar layout
    setTimeout(() => {
      this.notificationElements.container.style.display = "none";
      this.notificationElements.container.classList.remove("hide");
    }, 300);
  }

  // Métodos de notificação específicos
  notifyLedAction(cor) {
    const messages = {
      vermelho: {
        title: "LED Vermelho Ativado",
        message: "Sinal de parada ativo",
        type: "error",
      },
      amarelo: {
        title: "LED Amarelo Ativado",
        message: "Sinal de atenção ativo",
        type: "warning",
      },
      verde: {
        title: "LED Verde Ativado",
        message: "Sinal livre ativo",
        type: "success",
      },
    };

    const config = messages[cor];
    if (config) {
      this.showNotification(config.title, config.message, config.type);
    }
  }

  notifySystemAction(action) {
    const messages = {
      automatico_on: {
        title: "Modo Automático Ativado",
        message: "Sistema iniciou sequência automática",
        type: "info",
      },
      automatico_off: {
        title: "Modo Automático Desativado",
        message: "Sistema voltou ao controle manual",
        type: "info",
      },
      system_off: {
        title: "Sistema Desligado",
        message: "Todos os LEDs foram desativados",
        type: "warning",
      },
      iot_connected: {
        title: "ESP32 Conectado",
        message: "Dispositivo IoT encontrado e conectado",
        type: "success",
      },
      iot_disconnected: {
        title: "Modo Simulador",
        message: "ESP32 não encontrado, usando simulação",
        type: "warning",
      },
    };

    const config = messages[action];
    if (config) {
      this.showNotification(config.title, config.message, config.type);
    }
  }

  // Métodos de diagnóstico
  obterStatusSistema() {
    return {
      inicializado: this.isInitialized,
      conectadoIoT: this.isConnectedToIoT,
      modoAutomatico: this.modoAutomatico,
      ledAtivo:
        Object.entries(this.leds).find(([_, led]) =>
          led.classList.contains("ativo")
        )?.[0] || "nenhum",
      dadosDispositivo: this.deviceSimData,
      timestamp: new Date().toISOString(),
    };
  }
}

// Inicialização e configuração global
document.addEventListener("DOMContentLoaded", () => {
  // Criar instância global do controlador
  window.semaforoIoT = new SemaforoIoTController();

  // Expor métodos úteis globalmente para debug
  window.semaforoDebug = {
    status: () => window.semaforoIoT.obterStatusSistema(),
    reset: () => {
      window.semaforoIoT.destruir();
      window.semaforoIoT = new SemaforoIoTController();
    },
    test: () => {
      console.log("🧪 Executando teste de sequência...");
      const cores = ["vermelho", "amarelo", "verde"];
      cores.forEach((cor, index) => {
        setTimeout(() => {
          window.semaforoIoT.acenderLed(cor);
        }, index * 1000);
      });
    },
    forceConnect: () => {
      console.log("🔧 Forçando modo conectado...");
      window.semaforoIoT.isConnectedToIoT = true;
      window.semaforoIoT.atualizarDeviceStatus("connected");
      window.semaforoIoT.obterDadosDispositivo();
    },
    forceSimulator: () => {
      console.log("🔧 Forçando modo simulador...");
      window.semaforoIoT.isConnectedToIoT = false;
      window.semaforoIoT.atualizarDeviceStatus("simulator");
      window.semaforoIoT.iniciarSimuladorDados();
    },
    deviceData: () => window.semaforoIoT.deviceSimData,
  };
});

// Tratamento de erros global
window.addEventListener("error", (event) => {
  console.error("❌ Erro JavaScript:", event.error);
  if (window.semaforoIoT) {
    window.semaforoIoT.atualizarStatus("Erro do Sistema", "text-danger");
  }
});

// Performance e otimizações
if (typeof window.requestIdleCallback === "function") {
  window.requestIdleCallback(() => {
    console.log("⚡ Sistema otimizado e pronto para uso");
  });
}
