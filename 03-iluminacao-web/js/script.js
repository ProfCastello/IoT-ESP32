


ligarLampada = (lampada) => {
  document.getElementById(lampada).classList.toggle('ligada');
  const button = document.getElementById(`btn-${lampada}`);
  button.innerText = button.innerText === "Ligar" ? "Desligar" : "Ligar";
};
