const temperaturas = [
  { id: 1, temperatura: 23.9 },
  { id: 2, temperatura: 25.4 },
  { id: 3, temperatura: 21.1 },
  { id: 4, temperatura: 32.7 },
];

function simularLeitura() {
  //   alert("Temperatura: 23.5 °C");
  //   Math.floor faz o arredondamento
  //   Math.random gera um número aleatório menor que 1

  const numeroSorteado = Math.floor(Math.random() * temperaturas.length);

  const tempSorteada = temperaturas[numeroSorteado].temperatura;

  const temperaturaPagina = document.getElementById("temperatura");
  temperaturaPagina.textContent = `${tempSorteada} °C `;
}
