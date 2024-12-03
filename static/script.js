document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.createElement('div');
    themeToggle.classList.add('theme-toggle');
    themeToggle.innerHTML = `
        <button id="theme-switch">
            <i class="fas fa-moon"></i>
        </button>
    `;
    document.body.appendChild(themeToggle);

    const themeButton = document.getElementById('theme-switch');
    const moonIcon = '<i class="fas fa-moon"></i>';
    const sunIcon = '<i class="fas fa-sun"></i>';

    // Theme Toggle Logic
    themeButton.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        
        themeButton.innerHTML = document.body.classList.contains('dark-mode') 
            ? sunIcon 
            : moonIcon;

        // Optional: Save theme preference
        localStorage.setItem('theme', 
            document.body.classList.contains('dark-mode') ? 'dark' : 'light'
        );
    });

    // Restore theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeButton.innerHTML = sunIcon;
    }

    const body = document.body;
    const lightIcon = themeToggle.querySelector('.light-icon');
    const darkIcon = themeToggle.querySelector('.dark-icon');

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        updateThemeIcons();
    });

    function updateThemeIcons() {
        if (body.classList.contains('dark-mode')) {
            lightIcon.classList.remove('active');
            darkIcon.classList.add('active');
        } else {
            lightIcon.classList.add('active');
            darkIcon.classList.remove('active');
        }
    }

    // Initial theme icon setup
    updateThemeIcons();

    // Send Message
    const sendButton = document.getElementById('send-button');
    const userInput = document.getElementById('user-input');
    const messagesContainer = document.getElementById('messages');

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    function sendMessage() {
        const message = userInput.value.trim();
        if (message) {
            // Add user message
            addMessage(message, 'user');
            userInput.value = '';

            // Simulate AI response (replace with actual backend call)
            setTimeout(() => {
                addMessage('Processing your request...', 'ai');
            }, 1000);
        }
    }

    function addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', type);
        
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        
        const messageText = document.createElement('p');
        messageText.textContent = content;
        
        const timestamp = document.createElement('span');
        timestamp.classList.add('timestamp');
        timestamp.textContent = new Date().toLocaleTimeString();
        
        messageContent.appendChild(messageText);
        messageContent.appendChild(timestamp);
        messageDiv.appendChild(messageContent);
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Dynamic Message Animation
    function animateMessages() {
        const messages = document.querySelectorAll('.message');
        messages.forEach((message, index) => {
            message.style.animationDelay = `${index * 0.2}s`;
        });
    }
    animateMessages();

    // Logo Hover Effect
    const logo = document.querySelector('.main-logo');
    if (logo) {
        logo.addEventListener('mousemove', (e) => {
            const rect = logo.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            logo.style.transform = `
                perspective(500px) 
                rotateX(${(y - rect.height/2) / 20}deg) 
                rotateY(${-(x - rect.width/2) / 20}deg)
            `;
        });

        logo.addEventListener('mouseleave', () => {
            logo.style.transform = 'perspective(500px) rotateX(0deg) rotateY(0deg)';
        });
    }

    // Dynamic Chat Input Expansion
    const chatInput = document.querySelector('.input-container textarea');
    if (chatInput) {
        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = `${this.scrollHeight}px`;
        });
    }

    // Engagement Features
    const notebookSection = document.querySelector('.notebook-section');
    const quizSection = document.querySelector('.quiz-section');
    const studyTimerSection = document.querySelector('.study-timer');
    const feedbackContainer = document.querySelector('.feedback-container');

    // Toggle sections (you can add more complex logic)
    document.getElementById('save-notebook').addEventListener('click', () => {
        const notebookEntry = document.getElementById('notebook-entry').value;
        if (notebookEntry) {
            alert('Notes saved!');
            document.getElementById('notebook-entry').value = '';
        }
    });

    document.getElementById('generate-quiz').addEventListener('click', () => {
        const quizContainer = document.getElementById('quiz-container');
        quizContainer.innerHTML = 'Quiz generated! (Placeholder)';
    });

    const timerDisplay = document.querySelector('.timer-display');
    const startTimerButton = document.getElementById('start-timer');
    let timer;

    startTimerButton.addEventListener('click', () => {
        let timeLeft = 25 * 60; // 25 minutes
        
        timer = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            
            timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                alert('Pomodoro session complete!');
            }
            
            timeLeft--;
        }, 1000);
    });

    // Feedback Stars
    const feedbackStars = document.querySelectorAll('.feedback-stars i');
    
    feedbackStars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = star.getAttribute('data-rating');
            
            // Reset all stars
            feedbackStars.forEach(s => s.classList.remove('active'));
            
            // Activate stars up to the clicked one
            feedbackStars.forEach(s => {
                if (parseInt(s.getAttribute('data-rating')) <= rating) {
                    s.classList.add('active');
                }
            });
        });
    });

    document.getElementById('submit-feedback').addEventListener('click', () => {
        const activeStars = document.querySelectorAll('.feedback-stars .active').length;
        const feedbackText = document.getElementById('feedback-text').value;
        
        if (activeStars > 0) {
            alert(`Thank you for your feedback! Rating: ${activeStars}/5`);
            // Reset feedback
            feedbackStars.forEach(star => star.classList.remove('active'));
            document.getElementById('feedback-text').value = '';
        } else {
            alert('Please select a rating');
        }
    });

    // Engagement Features Hover Effects
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.transform = `
                perspective(500px) 
                rotateX(${(y - rect.height/2) / 20}deg) 
                rotateY(${-(x - rect.width/2) / 20}deg) 
                scale(1.05)
            `;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(500px) rotateX(0deg) rotateY(0deg) scale(1)';
        });
    });
});
