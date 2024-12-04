from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
from dotenv import load_dotenv
import os
import random
import re
from datetime import datetime
import threading
import time
import requests

# Load environment variables
load_dotenv()

# Configure Gemini AI
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

app = Flask(__name__)

# Self-Pinging Function
def keep_alive():
    while True:
        try:
            # Use the actual render.com URL of your app
            response = requests.get('https://hecker-ai.onrender.com', timeout=10)
            print(f"Self-ping status: {response.status_code}")
        except Exception as e:
            print(f"Self-ping error: {e}")
        
        # Sleep for 20 minutes (1200 seconds)
        time.sleep(1200)

# Start the keep-alive thread
keep_alive_thread = threading.Thread(target=keep_alive, daemon=True)
keep_alive_thread.start()

# AI Configuration
AI_DESCRIPTION = """
You are Hecker, an advanced AI learning companion designed to provide personalized, context-aware educational support. 
Your goal is to help students learn effectively by:
1. Breaking down complex topics into digestible explanations
2. Providing adaptive learning strategies
3. Generating targeted study materials
4. Offering motivational and constructive feedback

Key Characteristics:
- Patient and encouraging
- Adaptable to different learning styles
- Capable of explaining topics at various complexity levels
- Focused on student's individual learning journey
"""

# Model Configuration
generation_config = {
    'temperature': 0.7,
    'top_p': 0.9,
    'max_output_tokens': 2048
}

safety_settings = [
    {'category': 'HARM_CATEGORY_HARASSMENT', 'threshold': 'BLOCK_NONE'},
    {'category': 'HARM_CATEGORY_HATE_SPEECH', 'threshold': 'BLOCK_NONE'},
    {'category': 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'threshold': 'BLOCK_NONE'},
    {'category': 'HARM_CATEGORY_DANGEROUS_CONTENT', 'threshold': 'BLOCK_NONE'}
]

model = genai.GenerativeModel(
    model_name='gemini-pro', 
    generation_config=generation_config, 
    safety_settings=safety_settings
)

chat = model.start_chat(history=[
    {
        'role': 'user',
        'parts': [AI_DESCRIPTION]
    },
    {
        'role': 'model',
        'parts': ['I understand. I will act as Hecker, an advanced AI learning companion with the described characteristics.']
    }
])

# Context Management
class ConversationContext:
    def __init__(self, max_history=5):
        self.history = []
        self.max_history = max_history
        self.current_topic = None
        self.difficulty_level = 'intermediate'

    def add_interaction(self, user_query, ai_response):
        # Trim history if it exceeds max_history
        if len(self.history) >= self.max_history:
            self.history.pop(0)
        
        # Add new interaction
        self.history.append({
            'user_query': user_query,
            'ai_response': ai_response
        })

    def detect_topic(self, query):
        # Simple topic detection using keyword matching
        topics = {
            'mathematics': ['math', 'algebra', 'geometry', 'calculus', 'trigonometry'],
            'science': ['physics', 'chemistry', 'biology', 'science'],
            'language': ['english', 'grammar', 'writing', 'literature'],
            'history': ['history', 'historical', 'civilization', 'era'],
            'technology': ['computer', 'programming', 'tech', 'coding']
        }

        for topic, keywords in topics.items():
            if any(keyword in query.lower() for keyword in keywords):
                self.current_topic = topic
                return topic
        
        return None

    def adjust_difficulty(self, query):
        # Detect complexity of query and adjust difficulty
        complexity_indicators = {
            'advanced': ['prove', 'derive', 'complex', 'advanced', 'theoretical'],
            'beginner': ['explain', 'what is', 'basic', 'simple', 'introduction']
        }

        for level, indicators in complexity_indicators.items():
            if any(indicator in query.lower() for indicator in indicators):
                self.difficulty_level = level
                break

conversation_context = ConversationContext()

def generate_emoji():
    """Generate a random emoji to add personality"""
    emojis = [
        '😊', '🌟', '👍', '🚀', '🤔', '💡', '📚', '🎓', 
        '🧠', '✨', '🌈', '👏', '🤓', '💪', '🌞'
    ]
    return random.choice(emojis)

def format_solution(text):
    """Format mathematical solutions with clear steps and equations"""
    # Split into steps
    steps = text.split('\n\n')
    formatted_steps = []
    
    for i, step in enumerate(steps):
        if i == 0 and step.lower().startswith('solution:'):
            formatted_steps.append(f"**{step.strip()}**\n")
        elif step.strip():
            # Format step numbers
            if step.lower().startswith(('step ', 'therefore', 'hence', 'thus', 'final')):
                formatted_steps.append(f"\n**{step.strip()}**\n")
            else:
                # Format equations and explanations
                lines = step.split('\n')
                formatted_lines = []
                for line in lines:
                    # Check if line contains equations
                    if any(char in line for char in '=+-×÷*/'):
                        formatted_lines.append(f"```math\n{line.strip()}\n```")
                    else:
                        formatted_lines.append(line.strip())
                formatted_steps.append('\n'.join(formatted_lines))
    
    return '\n\n'.join(formatted_steps)

def sanitize_response(text):
    """Clean and format the AI response"""
    # Enhanced formatting to prevent multiple boxes
    
    # Normalize line breaks and spacing
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Improve step and section formatting
    text = re.sub(r'^(Step\s*\d+:)', r'**\1**', text, flags=re.MULTILINE)
    text = re.sub(r'^(Conclusion:)', r'**\1**', text, flags=re.MULTILINE)
    
    # Format equations and mathematical expressions
    text = re.sub(r'\$\$(.*?)\$\$', r'**Equation:** \1', text, flags=re.DOTALL)
    text = re.sub(r'\$(.*?)\$', r'*\1*', text)
    
    # Preserve overall response structure
    text = text.strip()
    
    # Sanitize HTML to prevent XSS
    formatted_text = (
        text.replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;')
            .replace("'", '&#039;')
    )
    
    return formatted_text

@app.route('/')
def home():
    now = datetime.now().strftime("%I:%M %p")
    initial_question = "Welcome to Hecker! What would you like to learn today?"
    return render_template('index.html', now=now, initial_question=initial_question)

@app.route('/generate_response', methods=['POST'])
def generate_response():
    user_message = request.json.get('message', '')
    
    try:
        response = chat.send_message(user_message)
        return jsonify({
            'response': response.text,
            'timestamp': datetime.now().strftime("%I:%M %p")
        })
    except Exception as e:
        return jsonify({
            'response': f"I'm experiencing some difficulties. Error: {str(e)}",
            'timestamp': datetime.now().strftime("%I:%M %p")
        })

@app.route('/api/query', methods=['POST'])
def query():
    try:
        data = request.json
        query_text = data.get('query', '')
        is_regeneration = data.get('regenerate', False)

        # Generate response
        response_text = generate_response_with_context(query_text)

        # Update conversation context
        conversation_context.add_interaction(query_text, response_text)

        return jsonify({
            'success': True,
            'response': response_text
        })

    except Exception as e:
        app.logger.error(f"Query processing error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def generate_response_with_context(query):
    """Generate a response that considers conversation context and provides detailed, step-by-step explanations"""
    
    # Special handling for dimensional analysis and scientific queries
    if any(keyword in query.lower() for keyword in ['dimension', 'dimensional analysis', 'viscosity', 'prove', 'derivation']):
        response = f"""😮‍💨 💗 Dimensional Analysis of {query.split()[-1].capitalize()}

Step 1: Identify the physical quantities involved*
{query.split()[-1].capitalize()} is a measure of a physical property. Let's break down the fundamental quantities involved.

Step 2: Express the physical quantities in terms of their fundamental dimensions*
- Force: [M L T⁻²]
- Area: [L²]
- Velocity: [L T⁻¹]
- Time: [T]

Step 3: Dimensional Analysis Calculation*
To prove the dimensional consistency, we'll analyze the dimensions of each component.

**Dimensional Equation:**
$$ \\frac{{[Force]}}{{[Area]}} \\cdot [Time] $$

**Dimensional Breakdown:**
- Force/Area: [M L T⁻²] / [L²] = [M L⁻¹ T⁻²]
- Multiplying by Time: [M L⁻¹ T⁻²] · [T] = [M L⁻¹ T⁻¹]

Step 4: Verify Dimensional Consistency*
The final dimensional representation confirms the consistency of the physical quantity.

**Conclusion:**
The dimensional analysis shows that the quantity has consistent fundamental dimensions, validating its physical significance.

**Key Insights:**
- Dimensional analysis helps verify the physical meaning of quantities
- It ensures the mathematical relationships make physical sense
- Provides a powerful tool for understanding complex physical phenomena
"""
        return response

    # Default response generation logic
    context_prompt = f"""\
Context:
- Current Query: {query}
- Conversation History: {len(conversation_context.history)} previous interactions

Guidelines:
1. Provide a clear, comprehensive response
2. Break down complex topics into digestible steps
3. Use engaging and accessible language
4. Include practical examples or real-world applications

Query: {query}
"""

    try:
        response = model.generate_content(context_prompt)
        return sanitize_response(response.text)
    except Exception as e:
        app.logger.error(f"Response generation error: {e}")
        return f"I'm sorry, I encountered an error processing your query. {generate_emoji()}"

if __name__ == '__main__':
    app.run(debug=True)
