let randomNumber = Math.floor(Math.random() * 100) + 1;
let attempts = 0;

function checkGuess() {
    const guess = Number(document.getElementById('guessInput').value);
    const feedback = document.getElementById('feedback');
    attempts++;
    document.getElementById('attempts').textContent = "Intentos: " + attempts;

    if (guess === randomNumber) {
        feedback.textContent = "🎉 ¡Felicidades! Adivinaste el número " + randomNumber + " en " + attempts + " intentos.";
        feedback.style.color = "green";
    } else if (guess < randomNumber) {
        feedback.textContent = "⬆️ Muy bajo. Intenta un número más alto.";
        feedback.style.color = "blue";
    } else if (guess > randomNumber) {
        feedback.textContent = "⬇️ Muy alto. Intenta un número más bajo.";
        feedback.style.color = "red";
    }
}

function restartGame() {
    randomNumber = Math.floor(Math.random() * 100) + 1;
    attempts = 0;
    document.getElementById('feedback').textContent = "";
    document.getElementById('attempts').textContent = "Intentos: 0";
    document.getElementById('guessInput').value = "";
}
