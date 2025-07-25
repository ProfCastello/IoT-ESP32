/**
 * Chart Controller
 * Gerencia os gráficos de temperatura e umidade
 */

class ChartController {
  constructor() {
    this.chart = null;
    this.sensorData = this.loadSensorData();
    this.maxDataPoints = 50; // Máximo de pontos no gráfico
    this.updateInterval = null;

    this.init();
  }

  /**
   * Inicializa o controlador do gráfico
   */
  init() {
    this.createChart();
    this.startAutoUpdate();
  }

  /**
   * Carrega dados do sensor do localStorage
   */
  loadSensorData() {
    const saved = localStorage.getItem("sensorData");
    if (saved) {
      const data = JSON.parse(saved);
      // Converte strings de data de volta para objetos Date
      data.timestamps = data.timestamps.map((ts) => new Date(ts));
      return data;
    }

    return {
      timestamps: [],
      temperature: [],
      humidity: [],
    };
  }

  /**
   * Salva dados do sensor no localStorage
   */
  saveSensorData() {
    // Converte objetos Date para strings antes de salvar
    const dataToSave = {
      timestamps: this.sensorData.timestamps.map((ts) => ts.toISOString()),
      temperature: [...this.sensorData.temperature],
      humidity: [...this.sensorData.humidity],
    };

    localStorage.setItem("sensorData", JSON.stringify(dataToSave));
  }

  /**
   * Cria o gráfico Chart.js
   */
  createChart() {
    const ctx = document.getElementById("sensorChart");
    if (!ctx) return;

    // Configuração do tema baseada no tema atual
    const isDark =
      document.documentElement.getAttribute("data-bs-theme") === "dark";
    const gridColor = isDark
      ? "rgba(255, 255, 255, 0.1)"
      : "rgba(0, 0, 0, 0.1)";
    const textColor = isDark
      ? "rgba(255, 255, 255, 0.8)"
      : "rgba(0, 0, 0, 0.8)";

    this.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: this.sensorData.timestamps,
        datasets: [
          {
            label: "Temperatura (°C)",
            data: this.sensorData.temperature,
            borderColor: "#ef4444",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: "#ef4444",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
          },
          {
            label: "Umidade (%)",
            data: this.sensorData.humidity,
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: "#3b82f6",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: "easeInOutQuart",
        },
        interaction: {
          intersect: false,
          mode: "index",
        },
        plugins: {
          legend: {
            position: "top",
            labels: {
              color: textColor,
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12,
                weight: "500",
              },
            },
          },
          tooltip: {
            backgroundColor: isDark
              ? "rgba(30, 41, 59, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
            titleColor: textColor,
            bodyColor: textColor,
            borderColor: gridColor,
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              title: function (context) {
                const date = new Date(context[0].label);
                return date.toLocaleString("pt-BR");
              },
              label: function (context) {
                const label = context.dataset.label;
                const value = context.parsed.y;
                if (label.includes("Temperatura")) {
                  return `${label}: ${value.toFixed(1)}°C`;
                } else {
                  return `${label}: ${value.toFixed(1)}%`;
                }
              },
            },
          },
        },
        scales: {
          x: {
            type: "time",
            time: {
              displayFormats: {
                minute: "HH:mm",
                hour: "HH:mm",
                day: "dd/MM",
              },
            },
            grid: {
              color: gridColor,
              drawBorder: false,
            },
            ticks: {
              color: textColor,
              maxTicksLimit: 6,
              font: {
                size: 11,
              },
            },
          },
          y: {
            beginAtZero: false,
            grid: {
              color: gridColor,
              drawBorder: false,
            },
            ticks: {
              color: textColor,
              callback: function (value) {
                return value.toFixed(0);
              },
              font: {
                size: 11,
              },
            },
          },
        },
        elements: {
          point: {
            hoverBackgroundColor: "#ffffff",
          },
        },
      },
    });

    // Atualiza o gráfico quando o tema muda
    this.observeThemeChanges();
  }

  /**
   * Observa mudanças no tema para atualizar o gráfico
   */
  observeThemeChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "data-bs-theme"
        ) {
          this.updateChartTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-bs-theme"],
    });
  }

  /**
   * Atualiza o tema do gráfico
   */
  updateChartTheme() {
    if (!this.chart) return;

    const isDark =
      document.documentElement.getAttribute("data-bs-theme") === "dark";
    const gridColor = isDark
      ? "rgba(255, 255, 255, 0.1)"
      : "rgba(0, 0, 0, 0.1)";
    const textColor = isDark
      ? "rgba(255, 255, 255, 0.8)"
      : "rgba(0, 0, 0, 0.8)";

    // Atualiza cores
    this.chart.options.plugins.legend.labels.color = textColor;
    this.chart.options.plugins.tooltip.backgroundColor = isDark
      ? "rgba(30, 41, 59, 0.95)"
      : "rgba(255, 255, 255, 0.95)";
    this.chart.options.plugins.tooltip.titleColor = textColor;
    this.chart.options.plugins.tooltip.bodyColor = textColor;
    this.chart.options.plugins.tooltip.borderColor = gridColor;

    this.chart.options.scales.x.grid.color = gridColor;
    this.chart.options.scales.x.ticks.color = textColor;
    this.chart.options.scales.y.grid.color = gridColor;
    this.chart.options.scales.y.ticks.color = textColor;

    this.chart.update("none");
  }

  /**
   * Adiciona novo ponto de dados
   */
  addDataPoint(temperature, humidity) {
    const now = new Date();

    // Adiciona novos dados
    this.sensorData.timestamps.push(now);
    this.sensorData.temperature.push(parseFloat(temperature));
    this.sensorData.humidity.push(parseFloat(humidity));

    // Remove pontos antigos se exceder o limite
    if (this.sensorData.timestamps.length > this.maxDataPoints) {
      this.sensorData.timestamps.shift();
      this.sensorData.temperature.shift();
      this.sensorData.humidity.shift();
    }

    // Atualiza o gráfico
    this.updateChart();

    // Atualiza valores atuais
    this.updateCurrentValues(temperature, humidity);

    // Salva dados
    this.saveSensorData();
  }

  /**
   * Atualiza o gráfico com novos dados
   */
  updateChart() {
    if (!this.chart) return;

    this.chart.data.labels = this.sensorData.timestamps;
    this.chart.data.datasets[0].data = this.sensorData.temperature;
    this.chart.data.datasets[1].data = this.sensorData.humidity;

    this.chart.update("active");
  }

  /**
   * Atualiza os valores atuais na interface
   */
  updateCurrentValues(temperature, humidity) {
    const tempElement = document.getElementById("currentTemp");
    const humidityElement = document.getElementById("currentHumidity");

    if (tempElement) {
      tempElement.textContent = `${parseFloat(temperature).toFixed(1)}°C`;
      tempElement.classList.add("text-danger");

      // Animação de atualização
      tempElement.style.transform = "scale(1.1)";
      setTimeout(() => {
        tempElement.style.transform = "scale(1)";
      }, 300);
    }

    if (humidityElement) {
      humidityElement.textContent = `${parseFloat(humidity).toFixed(1)}%`;
      humidityElement.classList.add("text-info");

      // Animação de atualização
      humidityElement.style.transform = "scale(1.1)";
      setTimeout(() => {
        humidityElement.style.transform = "scale(1)";
      }, 300);
    }
  }

  /**
   * Processa mensagem MQTT de sensor
   */
  processSensorMessage(topic, message) {
    try {
      // Espera JSON no formato: {"temperature": 25.5, "humidity": 60.2}
      const data = JSON.parse(message);

      if (data.temperature !== undefined && data.humidity !== undefined) {
        this.addDataPoint(data.temperature, data.humidity);
      }
    } catch (error) {
      console.error("Erro ao processar dados do sensor:", error);

      // Tenta formato simples: "25.5,60.2"
      const parts = message.split(",");
      if (parts.length === 2) {
        const temp = parseFloat(parts[0]);
        const hum = parseFloat(parts[1]);

        if (!isNaN(temp) && !isNaN(hum)) {
          this.addDataPoint(temp, hum);
        }
      }
    }
  }

  /**
   * Inicia atualização automática (para demonstração)
   */
  startAutoUpdate() {
    // Atualiza valores atuais
    if (this.sensorData.temperature.length > 0) {
      const lastTemp =
        this.sensorData.temperature[this.sensorData.temperature.length - 1];
      const lastHum =
        this.sensorData.humidity[this.sensorData.humidity.length - 1];
      this.updateCurrentValues(lastTemp, lastHum);
    }

    // Atualiza a cada 30 segundos (para demonstração)
    this.updateInterval = setInterval(() => {}, 30000);
  }

  /**
   * Para a atualização automática
   */
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Limpa todos os dados
   */
  clearData() {
    this.sensorData = {
      timestamps: [],
      temperature: [],
      humidity: [],
    };

    this.updateChart();
    this.updateCurrentValues("--", "--");
    this.saveSensorData();
  }

  /**
   * Exporta dados do sensor
   */
  exportData() {
    const data = {
      exported_at: new Date().toISOString(),
      data: this.sensorData,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `sensor_data_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  /**
   * Destrói o gráfico
   */
  destroy() {
    this.stopAutoUpdate();

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}

// Torna a classe disponível globalmente
window.ChartController = ChartController;
