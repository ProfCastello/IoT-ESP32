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

    this.status = document.getElementById("status");
    this.loadingOverlay = document.getElementById("loading-overlay");

    // Estado do sistema
    this.modoAutomatico = false;
    this.intervalId = null;
    this.currentStep = 0;
    this.isInitialized = false;

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
      // Simular carregamento inicial
      await this.inicializar();

      // Configurar event listeners
      this.configurarEventListeners();

      // Aplicar animações iniciais
      this.aplicarAnimacoesIniciais();

      // Remover overlay de carregamento
      this.ocultarCarregamento();

      // Definir status inicial
      this.atualizarStatus("Sistema Pronto", "text-success");

      this.isInitialized = true;
      console.log("🚦 Sistema IoT ESP32 inicializado com sucesso!");
    } catch (error) {
      console.error("❌ Erro na inicialização:", error);
      this.atualizarStatus("Erro na Inicialização", "text-danger");
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

      // Simular comando para ESP32
      this.enviarComandoESP32(`LED_${cor.toUpperCase()}_ON`);
    }
  }

  desligarTodos() {
    if (!this.isInitialized) return;

    this.pararAutomatico();
    this.apagarTodos();
    this.atualizarStatus("Sistema Desligado", "text-muted");

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

  // Métodos de diagnóstico
  obterStatusSistema() {
    return {
      inicializado: this.isInitialized,
      modoAutomatico: this.modoAutomatico,
      ledAtivo:
        Object.entries(this.leds).find(([_, led]) =>
          led.classList.contains("ativo")
        )?.[0] || "nenhum",
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
