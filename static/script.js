document.addEventListener('DOMContentLoaded', function() {
    const messagesContainer = document.getElementById('messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const feedbackContainer = document.querySelector('.feedback-container');
    const feedbackStars = document.querySelectorAll('.feedback-stars i');
    const submitFeedback = document.getElementById('submit-feedback');
    const themeToggle = document.getElementById('themeToggle');
    
    let currentRating = 0;
    let conversationCount = 0;
    let sessionId = localStorage.getItem('session_id') || Date.now().toString();
    
    // Store session ID
    localStorage.setItem('session_id', sessionId);

    // Initialize engagement features
    const journalSection = document.querySelector('.journal-section');
    const gratitudeSection = document.querySelector('.gratitude-section');
    const mindfulnessTimer = document.querySelector('.mindfulness-timer');
    
    // Theme Management
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (prefersDarkScheme.matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Theme toggle handler
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Add animation class
        themeToggle.classList.add('theme-transition');
        setTimeout(() => themeToggle.classList.remove('theme-transition'), 300);
    });

    // Enhanced Emoji Mapping with more contextual categories
    const emojiMap = {
        greeting: ['👋', '🤗', '😊', '✨', '💫'],
        farewell: ['👋', '💫', '🌟', '✨', '🤗'],
        positive: ['😊', '🌟', '💫', '✨', '🎉', '💖', '🌈'],
        concern: ['😔', '💙', '🫂', '💭', '🤍'],
        empathy: ['💗', '🫂', '💝', '💖', '🤗'],
        reflection: ['🤔', '💭', '💡', '✨', '🌟'],
        listening: ['👂', '🎧', '💭', '🤝', '💫'],
        support: ['💪', '🤗', '🌈', '💫', '💝'],
        gratitude: ['🙏', '💖', '✨', '💫', '🌟'],
        encouragement: ['💫', '🌟', '✨', '💪', '🔆'],
        understanding: ['💭', '🤝', '💡', '💫', '💖'],
        sympathy: ['💙', '🫂', '🤗', '💖', '💝'],
        celebration: ['🎉', '🌟', '✨', '🎊', '💫'],
        mindfulness: ['🧘‍♀️', '🌱', '🍃', '🌸', '💫'],
        growth: ['🌱', '🚀', '📈', '💫', '⭐'],
        healing: ['💖', '🌈', '✨', '🌸', '💫'],
        strength: ['💪', '🦁', '⭐', '🌟', '💫'],
        peace: ['🕊️', '☮️', '🌸', '✨', '💫'],
        anxiety: ['😮‍💨', '💭', '🫂', '💙', '🤍'],
        depression: ['💙', '🫂', '💗', '🤍', '💝'],
        hope: ['🌅', '🌈', '✨', '💫', '🌟'],
        sleep: ['😴', '💤', '🌙', '✨', '🌟'],
        stress: ['😮‍💨', '🫂', '💆‍♀️', '🌸', '💫'],
        confidence: ['💪', '👑', '⭐', '🌟', '💫']
    };

    // Improved Symbol and Emoji Support
    function processMarkdownAndMath(text) {
        // Enhanced markdown processing
        let processedText = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>')  // Italic
            .replace(/__(.*?)__/g, '<u>$1</u>')  // Underline
            .replace(/`(.*?)`/g, '<code>$1</code>');  // Inline code

        // Detect and process mathematical equations with improved rendering
        processedText = processedText.replace(/\$\$(.*?)\$\$/g, (match, equation) => {
            return `<div class="math-block">
                <span class="equation">${equation}</span>
            </div>`;
        }).replace(/\$(.*?)\$/g, (match, equation) => {
            return `<span class="math-inline">${equation}</span>`;
        });

        // Improved step and section formatting with enhanced visibility
        processedText = processedText.replace(/\*\*Step (\d+):(.+?)(?=\*\*Step \d+|\*\*Key Insights\*\*|$)/gs, (match, stepNumber, content) => {
            return `
                <div class="step">
                    <h3 class="step-title">Step ${stepNumber}:</h3>
                    <div class="step-content">${content.trim()}</div>
                </div>
            `;
        });

        return processedText;
    }

    function formatMathResponse(text) {
        // Format mathematical terms with proper styling
        text = text.replace(/\b([A-Za-z])\b(?=\s*[=,]|\s+is|\s+and)/g, '<span class="term">$1</span>');
        
        // Format equations with proper LaTeX delimiters
        text = text.replace(/\$\$(.*?)\$\$/g, '<div class="math">\\[$1\\]</div>');
        text = text.replace(/\$(.*?)\$/g, '<span class="math">\\($1\\)</span>');
        
        return text;
    }

    function formatResponseText(text) {
        // Log the raw input for debugging
        console.log('Raw input:', text);
        
        // Format sections
        text = text.replace(/\*\*([^*]+)\*\*/g, '<div class="section-title">$1</div>');
        
        // Format key points
        text = text.replace(/\[Key Point\](.*?)(?=\[|$)/g, '<div class="key-point">$1</div>');
        
        // Format equations with labels
        text = text.replace(/\[Equation\](.*?)\[(.*?)\]/g, `
            <div class="equation-container">
                <div class="equation-label">$1</div>
                <div class="equation">\\[$2\\]</div>
            </div>
        `);
        
        // Format definitions
        text = text.replace(/\[Definition\](.*?):(.*?)(?=\[|$)/g, `
            <div class="definition">
                <span class="definition-term">$1:</span>
                $2
            </div>
        `);
        
        // Format examples
        text = text.replace(/\[Example\](.*?)(?=\[|$)/g, `
            <div class="example">
                <div class="example-title">Example:</div>
                $1
            </div>
        `);
        
        // Format steps
        text = text.replace(/\[Step (\d+)\](.*?)(?=\[Step|$)/g, `
            <div class="step">
                <span class="step-number">Step $1:</span>
                $2
            </div>
        `);
        
        // Format mathematical terms
        text = text.replace(/\b([A-Za-z])\b(?=\s*[=,]|\s+is|\s+and)/g, '<span class="term">$1</span>');
        
        // Replace newlines with breaks
        text = text.replace(/\n/g, '<br>');
        
        // Log the formatted output for debugging
        console.log('Formatted output:', text);
        
        return text;
    }

    function appendMessage(message, isUser = false) {
        const messagesContainer = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', isUser ? 'user' : 'therapist');

        // Profile image
        const profileImg = document.createElement('img');
        profileImg.src = isUser 
            ? (userProfileImage || '/static/images/default_user.png') 
            : '/static/images/logo.png';
        profileImg.alt = isUser ? 'User Profile' : 'Bot Profile';
        profileImg.classList.add(isUser ? 'user-profile' : 'bot-profile');

        // Message content
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        
        const messageText = document.createElement('p');
        messageText.innerHTML = message;
        messageContent.appendChild(messageText);

        // Timestamp
        const timestamp = document.createElement('span');
        timestamp.classList.add('timestamp');
        timestamp.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        if (isUser) {
            messageDiv.appendChild(messageContent);
            messageDiv.appendChild(profileImg);
        } else {
            messageDiv.appendChild(profileImg);
            messageDiv.appendChild(messageContent);
            messageContent.appendChild(timestamp);
        }

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function renderMessage(message, sender, timestamp = null) {
        const chatContainer = document.getElementById('chat-container');
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);

        // Improved markdown and math rendering
        const processedMessage = processMarkdownAndMath(message);

        // Full-width, responsive message content
        messageElement.innerHTML = `
            <div class="message-content">
                ${processedMessage}
                ${timestamp ? `<div class="timestamp">${timestamp}</div>` : ''}
            </div>
        `;

        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function addMessage(content, isUser) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'therapist'}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const text = document.createElement('p');
        text.innerHTML = processMarkdownAndMath(content);
        
        const timestamp = document.createElement('span');
        timestamp.className = 'timestamp';
        timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageContent.appendChild(text);
        messageContent.appendChild(timestamp);
        messageDiv.appendChild(messageContent);
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Increment conversation count and show feedback after every 5 messages
        conversationCount++;
        if (conversationCount % 5 === 0) {
            showFeedback();
        }
    }

    // Add emojis to AI responses for more engaging communication
    function addEmojisToResponse(text) {
        const emojis = [
            '🤖', '✨', '🌟', '🚀', '🧠', '📚', '🎓', '💡', '🤔', 
            '📝', '🌈', '🔍', '💪', '🌞', '🌙', '🌍', '🎉', '👍'
        ];

        // Randomly select 1-3 emojis to add
        const numEmojis = Math.floor(Math.random() * 3) + 1;
        const selectedEmojis = Array.from({length: numEmojis}, () => 
            emojis[Math.floor(Math.random() * emojis.length)]
        );

        // Add emojis at the beginning or end of the response
        return Math.random() > 0.5 
            ? `${selectedEmojis.join(' ')} ${text}` 
            : `${text} ${selectedEmojis.join(' ')}`;
    }

    // Send message
    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        // Disable input and button while sending
        userInput.disabled = true;
        sendButton.disabled = true;

        addMessage(message, true);
        userInput.value = '';
        userInput.style.height = 'auto';

        try {
            const response = await fetch('/generate_response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: message,
                    session_id: sessionId 
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            
            if (!data || !data.response) {
                console.warn('Received empty or invalid response', data);
                throw new Error('No valid response from server');
            }

            const aiResponse = data.response || 'I apologize, but I could not generate a response.';
            
            const enhancedResponse = addEmojisToResponse(aiResponse);
            appendMessage(enhancedResponse, false);
        } catch (error) {
            console.error('Detailed Error:', {
                message: error.message,
                stack: error.stack,
                userMessage: message,
                sessionId: sessionId
            });
            
            // More informative error message
            const errorMessages = [
                'Sorry, there was an unexpected issue. Our team has been notified.',
                'Communication hiccup! Could you try your message again?',
                'Oops! Seems like our AI is taking a brief meditation break. Retry?'
            ];
            
            appendMessage(errorMessages[Math.floor(Math.random() * errorMessages.length)], false);
        } finally {
            // Re-enable input and button
            userInput.disabled = false;
            sendButton.disabled = false;
        }
    }

    // Event listeners for sending messages
    sendButton.addEventListener('click', function(e) {
        e.preventDefault();
        sendMessage();
    });

    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Feedback handling
    function showFeedback() {
        feedbackContainer.style.display = 'block';
    }

    feedbackStars.forEach(star => {
        star.addEventListener('mouseover', function() {
            const rating = this.dataset.rating;
            updateStars(rating);
        });

        star.addEventListener('mouseout', function() {
            updateStars(currentRating);
        });

        star.addEventListener('click', function() {
            currentRating = this.dataset.rating;
            updateStars(currentRating);
        });
    });

    function updateStars(rating) {
        feedbackStars.forEach(star => {
            const starRating = star.dataset.rating;
            star.className = starRating <= rating ? 'fas fa-star' : 'far fa-star';
        });
    }

    submitFeedback.addEventListener('click', async function() {
        const feedbackText = document.getElementById('feedback-text').value;
        try {
            await fetch('/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    score: currentRating,
                    feedback: feedbackText
                })
            });
            feedbackContainer.style.display = 'none';
            currentRating = 0;
            updateStars(0);
            document.getElementById('feedback-text').value = '';
        } catch (error) {
            console.error('Error submitting feedback:', error);
        }
    });

    // Engagement feature handlers
    function showJournalSection() {
        journalSection.style.display = 'block';
        gratitudeSection.style.display = 'none';
        mindfulnessTimer.style.display = 'none';
    }

    function showGratitudeSection() {
        gratitudeSection.style.display = 'block';
        journalSection.style.display = 'none';
        mindfulnessTimer.style.display = 'none';
    }

    function showMindfulnessTimer() {
        mindfulnessTimer.style.display = 'block';
        journalSection.style.display = 'none';
        gratitudeSection.style.display = 'none';
    }

    // Journal handling
    document.getElementById('save-journal').addEventListener('click', function() {
        const entry = document.getElementById('journal-entry').value;
        if (entry) {
            document.getElementById('journal-entry').value = '';
            journalSection.style.display = 'none';
            addMessage("Thank you for sharing your thoughts. Would you like to explore these feelings further?", false);
        }
    });

    // Gratitude list handling
    document.getElementById('add-gratitude').addEventListener('click', function() {
        const gratitudeInput = document.getElementById('gratitude-input');
        const gratitudeList = document.getElementById('gratitude-list');
        
        if (gratitudeInput.value) {
            const li = document.createElement('li');
            li.textContent = gratitudeInput.value;
            gratitudeList.appendChild(li);
            gratitudeInput.value = '';
            
            if (gratitudeList.children.length >= 3) {
                gratitudeSection.style.display = 'none';
                addMessage("It's wonderful to practice gratitude. How do these positive reflections make you feel?", false);
            }
        }
    });

    // Mindfulness timer handling
    let timerInterval;
    document.getElementById('start-timer').addEventListener('click', function() {
        const timerDisplay = document.querySelector('.timer-display');
        let timeLeft = 300; // 5 minutes in seconds
        
        this.disabled = true;
        
        timerInterval = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                this.disabled = false;
                mindfulnessTimer.style.display = 'none';
                addMessage("How do you feel after taking this mindful moment?", false);
            }
        }, 1000);
    });

    // Added a self-ping function to keep the server active by pinging every 5 minutes
    function keepServerAlive() {
        setInterval(() => {
            fetch('/ping')
                .then(response => console.log('Server pinged to stay alive'))
                .catch(error => console.error('Error pinging server:', error));
        }, 5 * 60 * 1000); // Ping every 5 minutes
    }

    // Call the function to start pinging
    keepServerAlive();

    // Custom Cursor Glow Effect
    document.addEventListener('DOMContentLoaded', () => {
        const cursorGlow = document.createElement('div');
        cursorGlow.classList.add('cursor-glow');
        document.body.appendChild(cursorGlow);

        document.addEventListener('mousemove', (e) => {
            cursorGlow.style.left = `${e.clientX}px`;
            cursorGlow.style.top = `${e.clientY}px`;
        });

        // Optional: Change glow color on hover
        const interactiveElements = document.querySelectorAll('a, button, input, textarea, .clickable');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorGlow.style.transform = 'scale(1.5)';
                cursorGlow.style.background = 'radial-gradient(circle closest-side, rgba(0, 255, 0, 0.4), rgba(0, 255, 0, 0))';
            });

            el.addEventListener('mouseleave', () => {
                cursorGlow.style.transform = 'scale(1)';
                cursorGlow.style.background = 'radial-gradient(circle closest-side, rgba(30, 144, 255, 0.4), rgba(30, 144, 255, 0))';
            });
        });
    });
});
