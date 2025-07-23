# 🚦 Semáforo Inteligente IoT - ESP32

## 📋 Visão Geral

Sistema moderno de controle de semáforo inteligente com interface web responsiva, projetado para integração com ESP32. Implementa as mais recentes tendências de UI/UX para uma experiência de usuário excepcional.

## ✨ Características Principais

### 🎨 Design Moderno

- **Glassmorphism**: Efeitos de vidro translúcido com blur
- **Neumorphism**: Elementos com profundidade e sombras suaves
- **Design System**: Paleta de cores consistente e moderna
- **Tipografia**: Inter + JetBrains Mono para máxima legibilidade
- **Animações Fluidas**: Micro-interações e transições suaves

### 📱 Responsividade Completa

- Design mobile-first
- Breakpoints otimizados para todos os dispositivos
- Orientação adaptativa
- Touch-friendly em dispositivos móveis

### 🔧 Funcionalidades

#### Controles Manuais

- **LED Vermelho**: Sinal de parada
- **LED Amarelo**: Sinal de atenção
- **LED Verde**: Sinal de passagem livre
- **Modo Automático**: Sequência automática de semáforo
- **Desligar**: Desativa todo o sistema

#### Interações Avançadas

- **Atalhos de Teclado**:

  - `R` ou `1`: LED Vermelho
  - `Y` ou `2`: LED Amarelo
  - `G` ou `3`: LED Verde
  - `A`: Toggle Modo Automático
  - `ESC` ou `D`: Desligar Sistema

- **Feedback Tátil**: Vibração em dispositivos móveis
- **Acessibilidade**: Compatível com leitores de tela
- **Estados ARIA**: Elementos semânticos completos

### 🔗 Integração IoT

- Preparado para comunicação com ESP32
- API REST ready
- Sistema de logging avançado
- Tratamento de erros robusto

## 🚀 Tecnologias Utilizadas

### Frontend

- **HTML5**: Estrutura semântica moderna
- **CSS3**:
  - Custom Properties (CSS Variables)
  - Grid & Flexbox
  - Animações CSS3
  - Media Queries avançadas
- **JavaScript ES6+**:
  - Classes ES6
  - Async/Await
  - Promises
  - Event Delegation
  - Performance optimizations

### Frameworks & Bibliotecas

- **Bootstrap 5.3.2**: Sistema de grid e componentes
- **Font Awesome 6.4.0**: Ícones modernos
- **Google Fonts**: Inter & JetBrains Mono

## 📁 Estrutura do Projeto

```
IoT-semaforoWeb/
├── index.html          # Página principal
├── css/
│   └── style.css       # Estilos modernos
├── js/
│   └── script.js       # Lógica de controle
└── README.md           # Documentação
```

## 🎯 Como Usar

### Instalação

1. Clone ou baixe o projeto
2. Abra `index.html` em um navegador moderno
3. O sistema inicializará automaticamente

### Controles

1. **Manual**: Clique nos botões coloridos para controlar cada LED
2. **Automático**: Clique em "Automático" para iniciar sequência
3. **Teclado**: Use as teclas de atalho para controle rápido
4. **Touch**: Toque diretamente nos LEDs em dispositivos móveis

### Integração ESP32

O sistema está preparado para integração com ESP32. Para implementar:

1. Configure endpoint no método `enviarComandoESP32()`
2. Implemente API REST no ESP32
3. Ajuste comandos conforme necessário

```javascript
// Exemplo de integração
async enviarComandoESP32(comando) {
  try {
    const response = await fetch('/api/semaforo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comando, timestamp: Date.now() })
    });

    const data = await response.json();
    console.log('Comando enviado:', data);
  } catch (error) {
    console.error('Erro de comunicação:', error);
  }
}
```

## 🔧 Personalização

### Cores

Edite as variáveis CSS em `:root` para personalizar:

```css
:root {
  --cor-vermelho: #ef4444;
  --cor-amarelo: #fbbf24;
  --cor-verde: #10b981;
  /* ... outras variáveis */
}
```

### Sequência Automática

Modifique a propriedade `sequenciaAutomatica` na classe:

```javascript
this.sequenciaAutomatica = [
  { cor: "verde", tempo: 5000, status: "SIGA", classe: "text-success" },
  { cor: "amarelo", tempo: 2000, status: "ATENÇÃO", classe: "text-warning" },
  { cor: "vermelho", tempo: 5000, status: "PARE", classe: "text-danger" },
];
```

## 🌟 Recursos Avançados

### Performance

- **Lazy Loading**: Carregamento otimizado de recursos
- **RequestIdleCallback**: Otimizações em tempo ocioso
- **Event Delegation**: Gerenciamento eficiente de eventos

### Acessibilidade

- **WCAG 2.1**: Compatibilidade com diretrizes de acessibilidade
- **Screen Readers**: Suporte completo a leitores de tela
- **Keyboard Navigation**: Navegação completa por teclado
- **Focus Management**: Gerenciamento de foco apropriado

### PWA Ready

- Service Worker preparado
- Manifest configurável
- Offline capability ready

## 🐛 Debug e Desenvolvimento

### Console Commands

```javascript
// Status do sistema
semaforoDebug.status();

// Reset completo
semaforoDebug.reset();

// Teste de sequência
semaforoDebug.test();
```

### Logs

O sistema fornece logs detalhados no console:

- 🚦 Inicialização
- 🔴🟡🟢 Estados dos LEDs
- 🔄 Modo automático
- 📡 Comandos ESP32
- ❌ Erros e avisos

## 📊 Compatibilidade

### Navegadores

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Dispositivos

- ✅ Desktop (Windows, macOS, Linux)
- ✅ Tablets (iPad, Android)
- ✅ Smartphones (iOS, Android)

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Implemente as mudanças
4. Teste em diferentes dispositivos
5. Submeta um pull request

## 📄 Licença

Este projeto é open source e está disponível sob a licença MIT.

## 👥 Autor

Desenvolvido para o curso técnico em desenvolvimento de sistemas - SENAI SP

---

**🚀 Ready for the future of IoT interfaces!**
