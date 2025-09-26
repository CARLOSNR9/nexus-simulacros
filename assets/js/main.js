document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'index.html' || currentPage === '') {
        // Lógica para la página de acceso
        const correctPassword = 'UPB';
        const passwordInput = document.getElementById('passwordInput');
        const loginButton = document.getElementById('loginButton');
        const errorMessage = document.getElementById('error-message');

        const handleLogin = () => {
            if (passwordInput.value === correctPassword) {
                window.location.href = 'temas.html';
            } else {
                errorMessage.textContent = 'Contraseña incorrecta. Inténtalo de nuevo.';
                errorMessage.classList.add('visible');
                passwordInput.value = '';
                passwordInput.focus();
            }
        };

        loginButton.addEventListener('click', handleLogin);
        passwordInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                handleLogin();
            }
        });

    } else if (currentPage === 'temas.html') {
        // Lógica para la página de selección de temas
        const topicsContainer = document.getElementById('topicsContainer');
        const logoutLink = document.querySelector('.logout-link');

        const fetchTopics = async () => {
            try {
                const response = await fetch('data/temas.json');
                if (!response.ok) {
                    throw new Error(`Error al cargar los temas: ${response.statusText}`);
                }
                const topics = await response.json();
                
                topics.forEach(topic => {
                    const button = document.createElement('button');
                    button.classList.add('topic-button');

                    let buttonContent = `<strong>${topic.title}</strong><br><small>${topic.description}</small>`;

                    if (topic.locked) {
                        button.classList.add('locked');
                        buttonContent += `<span class="lock-icon">&#128274;</span>`;
                    }

                    button.innerHTML = buttonContent;

                    button.addEventListener('click', () => {
                        if (topic.locked) {
                            alert('Este tema está bloqueado. Desbloquéalo para acceder a este simulacro.');
                        } else {
                            window.location.href = `simulacro.html?temaId=${topic.id}`;
                        }
                    });
                    topicsContainer.appendChild(button);
                });
            } catch (error) {
                console.error('Error al cargar los temas:', error);
                topicsContainer.innerHTML = '<p class="error-message visible">No se pudieron cargar los temas. Por favor, revisa la conexión.</p>';
            }
        };

        fetchTopics();
        
        if (logoutLink) {
            logoutLink.addEventListener('click', (event) => {
                event.preventDefault();
                window.location.href = 'index.html';
            });
        }

    } else if (currentPage === 'simulacro.html') {
        // Lógica del simulacro
        let questions = [];
        let currentQuestionIndex = 0;
        let score = 0;
        let timerInterval;
        let startTime;

        const quizTitle = document.getElementById('quizTitle');
        const timerElement = document.getElementById('timer');
        const questionCounterElement = document.getElementById('questionCounter');
        const questionTextElement = document.getElementById('questionText');
        const optionsContainer = document.getElementById('optionsContainer');
        const feedbackContainer = document.getElementById('feedbackContainer');
        const feedbackTitleElement = document.getElementById('feedbackTitle');
        const feedbackTextElement = document.getElementById('feedbackText');
        const feedbackNextButton = document.getElementById('feedbackNextButton');
        const quizContainer = document.getElementById('quizContainer');
        const resultsContainer = document.getElementById('resultsContainer');
        const finalScoreElement = document.getElementById('finalScore');
        const finalTimeElement = document.getElementById('finalTime');

        const startTimer = () => {
            startTime = Date.now();
            timerInterval = setInterval(() => {
                const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
                const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
                const seconds = (elapsedTime % 60).toString().padStart(2, '0');
                timerElement.textContent = `Tiempo: ${minutes}:${seconds}`;
            }, 1000);
        };

        const stopTimer = () => {
            clearInterval(timerInterval);
        };

        const shuffleArray = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };

        const displayQuestion = () => {
            const currentQuestion = questions[currentQuestionIndex];
            
            questionTextElement.textContent = currentQuestion.question;
            optionsContainer.innerHTML = '';
            
            const shuffledOptions = shuffleArray([...currentQuestion.options]);
            
            shuffledOptions.forEach(option => {
                const button = document.createElement('button');
                button.classList.add('option-button');
                button.textContent = option.text;
                button.addEventListener('click', () => handleAnswer(option.isCorrect, button));
                optionsContainer.appendChild(button);
            });

            questionCounterElement.textContent = `Pregunta: ${currentQuestionIndex + 1}/50`;
            quizContainer.style.display = 'block';
            feedbackContainer.style.display = 'none';
        };

        const handleAnswer = (isCorrect, button) => {
            const allOptions = optionsContainer.querySelectorAll('.option-button');
            allOptions.forEach(btn => btn.disabled = true);

            if (isCorrect) {
                score++;
                button.classList.add('correct');
                feedbackTitleElement.textContent = '¡Respuesta Correcta!';
                feedbackTextElement.textContent = questions[currentQuestionIndex].feedback.correct;
            } else {
                button.classList.add('incorrect');
                const correctAnswerText = questions[currentQuestionIndex].options.find(opt => opt.isCorrect).text;
                const correctOptionButton = Array.from(allOptions).find(btn => btn.textContent === correctAnswerText);
                
                if (correctOptionButton) {
                    correctOptionButton.classList.add('correct');
                }
                
                feedbackTitleElement.textContent = 'Respuesta Incorrecta';
                feedbackTextElement.textContent = questions[currentQuestionIndex].feedback.incorrect;
            }

            quizContainer.style.display = 'none';
            feedbackContainer.style.display = 'block';
        };

        feedbackNextButton.addEventListener('click', () => {
            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length) {
                displayQuestion();
            } else {
                showResults();
            }
        });

        const showResults = () => {
            stopTimer();
            const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
            const seconds = (elapsedTime % 60).toString().padStart(2, '0');
            const finalTime = `Tiempo total: ${minutes}:${seconds}`;

            const finalScore = Math.floor((score / questions.length) * 100);

            quizContainer.style.display = 'none';
            feedbackContainer.style.display = 'none';
            resultsContainer.style.display = 'block';

            finalScoreElement.textContent = `Puntaje Final: ${finalScore}/100`;
            finalTimeElement.textContent = finalTime;
        };

        const loadQuizData = async (temaId) => {
            try {
                const temasResponse = await fetch('data/temas.json');
                const temas = await temasResponse.json();
                const selectedTopic = temas.find(tema => tema.id === temaId);
                
                if (!selectedTopic) {
                    throw new Error('Tema no encontrado');
                }

                quizTitle.textContent = selectedTopic.title;
                const dataFileResponse = await fetch(selectedTopic.dataFile);
                
                if (!dataFileResponse.ok) {
                    throw new Error(`No se pudo cargar el banco de preguntas: ${dataFileResponse.statusText}`);
                }
                
                const fullQuestionBank = await dataFileResponse.json();
                
                questions = shuffleArray(fullQuestionBank).slice(0, 50);

                if (questions.length === 0) {
                    throw new Error('El banco de preguntas para este tema está vacío.');
                }
                
                startTimer();
                displayQuestion();
            } catch (error) {
                console.error('Error al cargar el simulacro:', error);
                quizContainer.innerHTML = `<p class="error-message visible">Ocurrió un error al cargar el simulacro. Vuelve a intentarlo más tarde.</p>`;
            }
        };

        const urlParams = new URLSearchParams(window.location.search);
        const temaId = urlParams.get('temaId');
        if (temaId) {
            loadQuizData(temaId);
        }
    }
});