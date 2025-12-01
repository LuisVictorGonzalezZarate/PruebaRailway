// Variables globales
let currentCarouselIndex = 0;
let currentTestimonialIndex = 0;
let isChatOpen = false;
let currentSessionId = ''; // Nueva variable para el ID de sesión

// Configuración del chatbot
const n8n_API_URL = 'http://localhost:5678/webhook/4f19d435-a22a-40a4-ab34-a49d12e106d1';

// Configuración del chatbot para n8n (adaptado de nocodeveloper.com/chat.js)
const n8nConfig = {
    webhook: {
        url: n8n_API_URL, // Usamos la URL existente
        route: 'general' // Puedes ajustar esto si tu webhook de n8n usa una ruta específica
    }
};

// Función para generar UUID (adaptado de nocodeveloper.com/chat.js)
function generateUUID() {
    return crypto.randomUUID();
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function () {
    initializeNavigation();
    initializeCarousel();
    initializeTestimonials();
    initializeScrollEffects();
    initializeChat();
});

// Navegación suave
function initializeNavigation() {
    // Smooth scrolling para enlaces de navegación
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Navegación móvil
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function () {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }

    // Cambiar estilo del header al hacer scroll
    window.addEventListener('scroll', function () {
        const header = document.querySelector('.header');
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = 'none';
        }
    });
}

// Carrusel de comida
function initializeCarousel() {
    const track = document.querySelector('.food-track');
    const cards = document.querySelectorAll('.food-card');

    if (!track || !cards.length) return;

    const cardWidth = cards[0].offsetWidth + 32; // 32px es el gap
    const maxIndex = Math.max(0, cards.length - Math.floor(track.parentElement.offsetWidth / cardWidth));

    window.moveCarousel = function (direction) {
        currentCarouselIndex += direction;

        if (currentCarouselIndex < 0) {
            currentCarouselIndex = 0;
        } else if (currentCarouselIndex > maxIndex) {
            currentCarouselIndex = maxIndex;
        }

        track.style.transform = `translateX(-${currentCarouselIndex * cardWidth}px)`;
    };

    // Auto-scroll del carrusel
    setInterval(() => {
        if (currentCarouselIndex >= maxIndex) {
            currentCarouselIndex = 0;
        } else {
            currentCarouselIndex++;
        }
        track.style.transform = `translateX(-${currentCarouselIndex * cardWidth}px)`;
    }, 5000);
}

// Testimonios
function initializeTestimonials() {
    const testimonials = document.querySelectorAll('.testimonial');
    const dots = document.querySelectorAll('.dot');

    if (!testimonials.length) return;

    window.currentTestimonial = function (index) {
        // Ocultar todos los testimonios
        testimonials.forEach(testimonial => {
            testimonial.classList.remove('active');
        });

        // Remover clase active de todos los dots
        dots.forEach(dot => {
            dot.classList.remove('active');
        });

        // Mostrar testimonial seleccionado
        if (testimonials[index - 1]) {
            testimonials[index - 1].classList.add('active');
        }

        // Activar dot correspondiente
        if (dots[index - 1]) {
            dots[index - 1].classList.add('active');
        }

        currentTestimonialIndex = index - 1;
    };

    // Auto-cambio de testimonios
    setInterval(() => {
        currentTestimonialIndex = (currentTestimonialIndex + 1) % testimonials.length;
        currentTestimonial(currentTestimonialIndex + 1);
    }, 6000);
}

// Efectos de scroll
function initializeScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observar elementos para animaciones
    document.querySelectorAll('.attraction-card, .food-card, .timeline-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Funcionalidad del Chat
function initializeChat() {
    const chatWidget = document.getElementById('chatWidget');
    const chatToggle = document.getElementById('chatToggle');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');

    // Verificar que los elementos existen
    if (!chatWidget || !chatToggle || !chatInput || !sendButton) {
        console.error('Elementos del chat no encontrados');
        return;
    }

    // Configurar eventos
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', handleKeyPress);
}

// Toggle del chat
function toggleChat() {
    const chatWidget = document.getElementById('chatWidget');
    const chatToggle = document.getElementById('chatToggle');

    if (!chatWidget || !chatToggle) return;

    isChatOpen = !isChatOpen;

    if (isChatOpen) {
        chatWidget.classList.add('active');
        chatToggle.classList.add('hidden');
        document.getElementById('chatInput').focus();
    } else {
        chatWidget.classList.remove('active');
        chatToggle.classList.remove('hidden');
    }
}

// Manejar tecla Enter en el input del chat
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Enviar mensaje
async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    const amplifiedSection = document.getElementById('amplifiedSection');

    if (!message) return;

    // Limpiar input
    chatInput.value = '';

    // Agregar mensaje del usuario
    addMessage(message, 'user');

    // Mostrar indicador de escritura
    showTypingIndicator();

    try {
        const webhookUrl = "http://localhost:5678/webhook/4f19d435-a22a-40a4-ab34-a49d12e106d1";
        const urlWithParams = `${webhookUrl}?message=${encodeURIComponent(message)}`;

        const response = await fetch(urlWithParams, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();

        // Remover indicador de escritura
        removeTypingIndicator();

        // Show the amplified section
        if (amplifiedSection) {
            // Move the amplified section to the end of the chat messages container
            // so it appears after the user's message
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.appendChild(amplifiedSection);

            amplifiedSection.style.display = 'block';

            // Add the response content
            const responseContent = responseData.Reporte || responseData.response || JSON.stringify(responseData);

            // Check if marked is available
            const parsedContent = typeof marked !== 'undefined' ? marked.parse(responseContent) : responseContent;

            const amplifiedHtml = `
                <h4 style="color: var(--palm-cyan, #00acc1); margin-bottom: 10px;">Respuesta ampliada:</h4>
                <div style="color: var(--palm-light, #333); font-size: 0.95rem; line-height: 1.5;">${parsedContent}</div>
            `;

            amplifiedSection.innerHTML = amplifiedHtml;

            // Scroll to show the new content
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            // Fallback if amplifiedSection is missing
            const responseContent = responseData.Reporte || responseData.response || JSON.stringify(responseData);
            addMessage(responseContent, 'bot');
        }

    } catch (error) {
        console.error('Error al enviar mensaje:', error);

        // Remover indicador de escritura
        removeTypingIndicator();

        // Mostrar mensaje de error amigable
        const errorMessage = 'Lo siento, hay un problema con la conexión. Por favor, intenta de nuevo más tarde.';
        addMessage(errorMessage, 'bot');
    }
}

// Agregar mensaje al chat
function addMessage(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const currentTime = new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-${sender === 'user' ? 'user' : 'robot'}"></i>
        </div>
        <div class="message-content">
            <p>${message}</p>
            <span class="message-time">${currentTime}</span>
        </div>
    `;

    chatMessages.appendChild(messageDiv);

    // Scroll al final
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Mostrar indicador de escritura
function showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator';
    typingDiv.id = 'typingIndicator';

    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <p>
                <span class="typing-dots">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                </span>
                Escribiendo...
            </p>
        </div>
    `;

    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Agregar animación a los puntos
    const dots = typingDiv.querySelectorAll('.typing-dots span');
    dots.forEach((dot, index) => {
        dot.style.animation = `typing 1.4s infinite ${index * 0.2}s`;
    });
}

// Remover indicador de escritura
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Funciones de utilidad
function formatTime(date) {
    return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Agregar estilos CSS para la animación de escritura
const typingStyles = `
    @keyframes typing {
        0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
        }
        30% {
            transform: translateY(-10px);
            opacity: 1;
        }
    }
    
    .typing-dots {
        display: inline-block;
        margin-right: 5px;
    }
    
    .typing-dots span {
        display: inline-block;
        margin-right: 2px;
        font-weight: bold;
        font-size: 1.2em;
    }
    
    .typing-indicator .message-content p {
        background: #f0f0f0 !important;
        color: #666 !important;
        font-style: italic;
    }
`;

// Agregar estilos al head
const styleSheet = document.createElement('style');
styleSheet.textContent = typingStyles;
document.head.appendChild(styleSheet);

// Manejar redimensionamiento de ventana
window.addEventListener('resize', function () {
    // Recalcular carrusel
    if (typeof moveCarousel === 'function') {
        currentCarouselIndex = 0;
        const track = document.querySelector('.food-track');
        if (track) {
            track.style.transform = 'translateX(0)';
        }
    }
});

// Funciones adicionales para mejorar la experiencia
function addQuickReplies() {
    const quickReplies = [
        '¿Qué lugares puedo visitar?',
        '¿Dónde comer tacos?',
        '¿Cómo llegar al Zócalo?',
        '¿Qué hacer en Coyoacán?'
    ];

    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const quickRepliesDiv = document.createElement('div');
    quickRepliesDiv.className = 'quick-replies';
    quickRepliesDiv.innerHTML = `
        <p>Preguntas frecuentes:</p>
        ${quickReplies.map(reply =>
        `<button class="quick-reply-btn" onclick="sendQuickReply('${reply}')">${reply}</button>`
    ).join('')}
    `;

    chatMessages.appendChild(quickRepliesDiv);
}

function sendQuickReply(message) {
    document.getElementById('chatInput').value = message;
    sendMessage();

    // Remover botones de respuesta rápida
    const quickReplies = document.querySelector('.quick-replies');
    if (quickReplies) {
        quickReplies.remove();
    }
}

// Agregar estilos para respuestas rápidas
const quickReplyStyles = `
    .quick-replies {
        margin: 1rem 0;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 3px solid var(--primary-color);
    }
    
    .quick-replies p {
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: var(--text-dark);
    }
    
    .quick-reply-btn {
        display: inline-block;
        margin: 0.25rem 0.25rem 0.25rem 0;
        padding: 0.5rem 1rem;
        background: white;
        border: 1px solid #ddd;
        border-radius: 20px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.3s ease;
    }
    
    .quick-reply-btn:hover {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
    }
`;

// Agregar estilos de respuestas rápidas
const quickReplyStyleSheet = document.createElement('style');
quickReplyStyleSheet.textContent = quickReplyStyles;
document.head.appendChild(quickReplyStyleSheet);

// Mostrar respuestas rápidas después de un tiempo
setTimeout(() => {
    if (isChatOpen) {
        addQuickReplies();
    }
}, 3000);

console.log('🤖 Chatbot CDMX inicializado correctamente');
console.log('📍 Configurado para conectar con Flowise en:', FLOWISE_API_URL);