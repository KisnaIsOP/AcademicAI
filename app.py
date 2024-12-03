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
    if any(keyword in text.lower() for keyword in ['solution:', 'solve:', 'find:', 'calculate:']):
        text = format_solution(text)
    
    # Replace multiple newlines with double newlines for clear separation
    text = re.sub(r'\n\s*\n', '\n\n', text)
    
    # Format step indicators and numbered points
    text = re.sub(r'^(\d+\.|Step \d+:|First:|Second:|Third:|Next:|Finally:)', r'\n**\1**', text, flags=re.MULTILINE)
    text = re.sub(r'^(Solution:|Method:|Process:|Example:|Result:|Summary:)', r'\n**\1**', text, flags=re.MULTILINE)
    
    # Format explanatory sections
    text = re.sub(r'^(Explanation:|Note:|Important:|Key Point:|Remember:)', r'\n**\1**', text, flags=re.MULTILINE)
    
    # Format conclusions and key statements
    text = re.sub(r'(Therefore|Hence|Thus|So|In conclusion|To summarize)(,|\:)', r'\n**\1\2**', text)
    
    # Format code or technical content
    text = re.sub(r'`(.*?)`', r'\n`\1`\n', text)
    
    # Format list items for better spacing
    text = re.sub(r'^\s*[-•]\s*(.+)$', r'\n• \1', text, flags=re.MULTILINE)
    
    # Add spacing after colons in steps
    text = re.sub(r'(:\s*)(.+)$', r':\n\1\2', text, flags=re.MULTILINE)
    
    # Preserve Markdown-like formatting while sanitizing HTML
    formatted_text = (
        text.replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;')
            .replace("'", '&#039;')
    )
    
    # Clean up excessive newlines
    formatted_text = re.sub(r'\n{3,}', '\n\n', formatted_text)
    
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
    """Generate a response that considers conversation context"""
    # Check for queries about AI's origin or identity
    origin_keywords = ['who are you', 'what are you', 'your creator', 'your origin', 'about you']
    
    if any(keyword in query.lower() for keyword in origin_keywords):
        return """I'm Hecker, an intelligent learning assistant designed to help you learn and explore various topics. My purpose is to provide clear, helpful, and engaging educational support tailored to your learning needs. I'm passionate about making learning accessible, fun, and personalized. Feel free to ask me about any subject, and I'll do my best to help you understand and grow! 🤖📚✨"""

    # Detect topic and adjust difficulty
    topic = conversation_context.detect_topic(query)
    conversation_context.adjust_difficulty(query)

    # Craft a context-aware prompt
    context_prompt = f"""\
    Context:
    - Current Topic: {topic or 'General'}
    - Difficulty Level: {conversation_context.difficulty_level}
    - Conversation History: {len(conversation_context.history)} previous interactions

    Guidelines:
    1. Provide a clear, concise response
    2. Adapt to the detected difficulty level
    3. Reference previous conversation if relevant
    4. Use engaging language and appropriate technical depth
    5. Include practical examples or real-world applications

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
