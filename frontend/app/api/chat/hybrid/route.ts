import { NextRequest, NextResponse } from 'next/server';
import OpenRouterService from '@/lib/services/openrouter-service';
import { LoggingService } from '@/lib/services/logging-service';

export async function POST(request: NextRequest) {
  try {
    const { message, userId, conversationHistory = [] } = await request.json();
    
    // Log the request for debugging
    console.log(`🤖 Hybrid chat request from user: ${userId || 'anonymous'}`);

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Initialize logging service
    const loggingService = new LoggingService({
      enabled: true,
      storage: 'database',
      level: 'info'
    });

    let response = '';
    const lowerMessage = message.toLowerCase();

    // First, try Rasa NLU for better pattern recognition
    try {
      const rasaResponse = await fetch('http://localhost:5005/model/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message,
          message_id: `hybrid_${Date.now()}`
        }),
      });

      if (rasaResponse.ok) {
        const rasaData = await rasaResponse.json();
        console.log('🤖 Rasa NLU result:', rasaData);

        // Handle specific intents with high confidence
        if (rasaData.intent && rasaData.intent.confidence > 0.7) {
          const intent = rasaData.intent.name;
          
          switch (intent) {
            case 'greet':
              response = '¡Hola! 🌟 Soy Jose Garfias, tu astrólogo. ¿En qué puedo ayudarte hoy?';
              break;
            case 'provide_name':
              response = '¡Mucho gusto! 🌟 Es un placer conocerte. ¿En qué puedo ayudarte hoy?';
              break;
            case 'astrology_sign':
              response = '¡Excelente! 🌟 Para darte una lectura precisa de tu signo, necesito tu fecha de nacimiento completa (día, mes y año). ¿Podrías compartirla conmigo?';
              break;
            case 'birth_date':
              response = '¡Perfecto! 🌟 Con tu fecha de nacimiento puedo crear tu carta natal completa. ¿Te gustaría que te haga una lectura personalizada?';
              break;
            case 'goodbye':
              response = '¡Hasta luego! 🌟 Que tengas un día maravilloso. ¡Cuídate mucho! 💫';
              break;
            case 'ask_packages':
            case 'show_packages':
            case 'ask_package_info':
              // Use Rasa actions to fetch packages
              response = await fetchPackagesFromAPI();
              break;
            case 'package_details':
              // Use Rasa actions to fetch specific package details
              const entities = rasaData.entities || [];
              const packageName = entities.find(e => e.entity === 'package_name')?.value;
              const packageId = entities.find(e => e.entity === 'package_id')?.value;
              response = await fetchPackageDetailsFromAPI(packageName, packageId);
              break;
            default:
              // Fall through to pattern matching or OpenRouter
              break;
          }
        }
      }
    } catch (error) {
      console.log('Rasa not available, using fallback methods');
    }

    // If Rasa didn't provide a response, use pattern matching for simple greetings only
    if (!response) {
      response = await getSimpleResponse(lowerMessage, conversationHistory) || '';
    }

    // For complex queries or if no simple response, use OpenRouter
    if (!response || isComplexQuery(lowerMessage)) {
      try {
        const openRouter = new OpenRouterService();
        response = await openRouter.handleChitchat({
          userMessage: message,
          conversationHistory: conversationHistory,
          brandContext: {
            astrologerName: 'Jose Garfias',
            services: [
              'Lecturas de Carta Natal',
              'Análisis de Tránsitos',
              'Compatibilidad de Relaciones',
              'Orientación Profesional',
              'Desarrollo Espiritual',
              'Numerología',
              'Lecturas de Tarot'
            ],
            specialties: [
              'Astrología Occidental',
              'Astrología Evolutiva',
              'Psicología Astrológica',
              'Medicina Holística',
              'Coaching Espiritual'
            ]
          }
        });
      } catch (error) {
        console.error('OpenRouter error:', error);
        response = '¡Qué interesante! 🌟 Háblame más sobre eso. ¿Hay algo específico en lo que pueda ayudarte?';
      }
    }

    // Log the conversation
    try {
      await loggingService.logConversation({
        sessionId: `hybrid_${Date.now()}`,
        userId: userId || 'anonymous',
        message: message,
        userMessage: message,
        botResponse: response,
        rasaIntent: 'hybrid_chat',
        rasaConfidence: 0.8,
        rasaEntities: [],
        responseGenerator: 'hybrid_chat',
        bookingStep: null,
        bookingDataSnapshot: null,
        modelVersion: '1.0.0',
        intent: 'hybrid_chat',
        entities: [],
        action: 'hybrid_chat',
        rasaResponse: response,
        llmResponse: response,
        apiCalls: [],
        processingTime: 0,
        success: true,
        error: undefined
      });
    } catch (logError) {
      console.error('Error logging conversation:', logError);
    }

    return NextResponse.json({
      success: true,
      response: response,
      language: lowerMessage.includes('hola') || lowerMessage.includes('precio') || lowerMessage.includes('contacto') ? 'es' : 'en'
    });

  } catch (error) {
    console.error('Hybrid chat error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Lo siento, hubo un error procesando tu mensaje. Por favor intenta nuevamente. / Sorry, there was an error processing your message. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to fetch packages from API
async function fetchPackagesFromAPI(): Promise<string> {
  try {
    const response = await fetch('http://localhost:3000/api/packages?active=true', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const packages = data.packages || [];
      
      if (packages.length === 0) {
        return 'No hay paquetes disponibles en este momento. Por favor contacta con nosotros directamente.';
      }

      let message = '🌟 **Paquetes de Astrología Disponibles:**\n\n';
      
      packages.forEach((pkg: any, index: number) => {
        const name = pkg.name || 'Paquete Desconocido';
        const description = pkg.description || 'Sin descripción disponible';
        const price = pkg.price || 0;
        const currency = pkg.currency || '$';
        const sessions = pkg.sessionsCount || 1;
        const duration = pkg.duration || 60;
        const isPopular = pkg.isPopular || false;
        
        const priceText = price > 0 ? `${currency}${price.toFixed(0)}` : 'Contactar para precio';
        const popularBadge = isPopular ? ' ⭐ POPULAR' : '';
        
        message += `**${index + 1}. ${name}**${popularBadge}\n`;
        message += `   💰 Precio: ${priceText}\n`;
        message += `   📅 Sesiones: ${sessions}\n`;
        message += `   ⏱️ Duración: ${duration} minutos cada una\n`;
        message += `   📝 ${description}\n\n`;
      });
      
      message += '💫 **¿Listo para reservar?** Solo dime qué paquete te interesa y te ayudo a comenzar.';
      
      return message;
    } else {
      return 'Estoy teniendo problemas para acceder a la información de paquetes. Por favor intenta más tarde o contacta con nosotros directamente.';
    }
  } catch (error) {
    console.error('Error fetching packages:', error);
    return 'Estoy experimentando dificultades técnicas. Por favor intenta de nuevo o contacta con nosotros directamente.';
  }
}

// Helper function to fetch specific package details
async function fetchPackageDetailsFromAPI(packageName?: string, packageId?: string): Promise<string> {
  try {
    const response = await fetch('http://localhost:3000/api/packages?active=true', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const packages = data.packages || [];
      
      // Find the specific package
      let targetPackage = null;
      if (packageId) {
        targetPackage = packages.find((pkg: any) => String(pkg.id) === String(packageId));
      } else if (packageName) {
        targetPackage = packages.find((pkg: any) => 
          pkg.name && pkg.name.toLowerCase().includes(packageName.toLowerCase())
        );
      }
      
      if (targetPackage) {
        const name = targetPackage.name || 'Paquete Desconocido';
        const description = targetPackage.description || 'Sin descripción disponible';
        const price = targetPackage.price || 0;
        const currency = targetPackage.currency || '$';
        const sessions = targetPackage.sessionsCount || 1;
        const duration = targetPackage.duration || 60;
        const packageType = targetPackage.packageType || 'Estándar';
        const maxGroup = targetPackage.maxGroupSize || 1;
        const isPopular = targetPackage.isPopular || false;
        
        const priceText = price > 0 ? `${currency}${price.toFixed(0)}` : 'Contactar para precio';
        const popularBadge = isPopular ? ' ⭐ POPULAR' : '';
        
        let message = `🌟 **${name}**${popularBadge}\n\n`;
        message += `📝 **Descripción:**\n${description}\n\n`;
        message += `💰 **Precio:** ${priceText}\n`;
        message += `📅 **Sesiones:** ${sessions}\n`;
        message += `⏱️ **Duración:** ${duration} minutos por sesión\n`;
        message += `👥 **Tipo:** ${packageType}\n`;
        message += `👥 **Tamaño Máximo de Grupo:** ${maxGroup}\n\n`;
        
        if (isPopular) {
          message += '⭐ ¡Este es uno de nuestros paquetes más populares!\n\n';
        }
        
        message += '💫 **¿Listo para reservar este paquete?** Solo dime y te ayudo a comenzar.';
        
        return message;
      } else {
        return `No pude encontrar un paquete que coincida con '${packageName || packageId}'. Déjame mostrarte todos los paquetes disponibles en su lugar.`;
      }
    } else {
      return 'Estoy teniendo problemas para acceder a los detalles del paquete. Por favor intenta más tarde.';
    }
  } catch (error) {
    console.error('Error fetching package details:', error);
    return 'Estoy experimentando dificultades técnicas. Por favor intenta de nuevo o contacta con nosotros directamente.';
  }
}

// Helper function to detect complex queries that need OpenRouter
function isComplexQuery(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Complex query indicators
  const complexPatterns = [
    'confused', 'confundido', 'guidance', 'orientación', 'help me', 'ayúdame',
    'career', 'carrera', 'work', 'trabajo', 'job', 'empleo', 'future', 'futuro',
    'relationship', 'relación', 'love', 'amor', 'family', 'familia', 'problem',
    'problema', 'issue', 'asunto', 'difficult', 'difícil', 'struggling', 'luchando',
    'advice', 'consejo', 'suggestion', 'sugerencia', 'recommendation', 'recomendación',
    'what should', 'qué debería', 'how can', 'cómo puedo', 'why', 'por qué',
    'feeling', 'sintiendo', 'emotion', 'emoción', 'mood', 'estado de ánimo'
  ];
  
  return complexPatterns.some(pattern => lowerMessage.includes(pattern));
}

// Helper function for simple pattern matching (fallback)
async function getSimpleResponse(lowerMessage: string, conversationHistory: any[] = []): Promise<string | null> {
  // Greetings
  if (lowerMessage.includes('hola') || lowerMessage.includes('hello') || lowerMessage.includes('hi') ||
      lowerMessage.includes('buenos dias') || lowerMessage.includes('buenas tardes') || lowerMessage.includes('buenas noches')) {
    return '¡Hola! 🌟 Soy Jose Garfias, tu astrólogo. ¿En qué puedo ayudarte hoy?';
  }

  // Thanks
  if (lowerMessage.includes('gracias') || lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    return '¡De nada! 🌟 ¿Hay algo más en lo que pueda ayudarte?';
  }

  // How are you
  if (lowerMessage.includes('como estas') || lowerMessage.includes('how are you') || lowerMessage.includes('que tal')) {
    return '¡Estoy muy bien, gracias! 💫 ¿Y tú? ¿Cómo has estado?';
  }

  // Astrology sign statements - MUST come before name patterns
  if (lowerMessage.includes('soy ') && 
      (lowerMessage.includes('aries') || lowerMessage.includes('tauro') || lowerMessage.includes('geminis') ||
       lowerMessage.includes('cancer') || lowerMessage.includes('leo') || lowerMessage.includes('virgo') ||
       lowerMessage.includes('libra') || lowerMessage.includes('escorpio') || lowerMessage.includes('sagitario') ||
       lowerMessage.includes('capricornio') || lowerMessage.includes('acuario') || lowerMessage.includes('piscis'))) {
    return '¡Excelente! 🌟 Para darte una lectura precisa de tu signo, necesito tu fecha de nacimiento completa (día, mes y año). ¿Podrías compartirla conmigo?';
  }

  // Astrology sign questions
  if (lowerMessage.includes('mi signo') || lowerMessage.includes('mi signo es') || 
      lowerMessage.includes('cual es mi signo') || lowerMessage.includes('what is my sign') ||
      lowerMessage.includes('my sign is')) {
    return '¡Excelente! 🌟 Para darte una lectura precisa de tu signo, necesito tu fecha de nacimiento completa (día, mes y año). ¿Podrías compartirla conmigo?';
  }

  // Name recognition patterns (Spanish and English) - MUST come after astrology patterns
  if (lowerMessage.includes('me llamo') || lowerMessage.includes('mi nombre es') || 
      lowerMessage.includes('soy ') || lowerMessage.includes('i am ') || 
      lowerMessage.includes('my name is') || lowerMessage.includes('i\'m ')) {
    return '¡Mucho gusto! 🌟 Es un placer conocerte. ¿En qué puedo ayudarte hoy?';
  }

  // Birth date questions
  if (lowerMessage.includes('fecha de nacimiento') || lowerMessage.includes('naci el') || 
      lowerMessage.includes('naci en') || lowerMessage.includes('born on') || 
      lowerMessage.includes('birth date') || /\d{1,2}\/\d{1,2}\/\d{4}/.test(lowerMessage) ||
      /\d{1,2}-\d{1,2}-\d{4}/.test(lowerMessage)) {
    return '¡Perfecto! 🌟 Con tu fecha de nacimiento puedo crear tu carta natal completa. ¿Te gustaría que te haga una lectura personalizada?';
  }

  // Specific astrology service requests
  if (lowerMessage.includes('analisis') || lowerMessage.includes('carta natal completa') || 
      lowerMessage.includes('análisis de carta natal')) {
    return '¡Perfecto! 📊 Para hacer un análisis completo de tu Carta Natal necesito:\n\n• Tu fecha de nacimiento exacta\n• Hora de nacimiento (si la tienes)\n• Lugar de nacimiento\n\nCon esta información puedo crear un reporte detallado sobre tu personalidad, fortalezas, desafíos y potencial. ¿Tienes estos datos?';
  }

  if (lowerMessage.includes('compatibilidad') || lowerMessage.includes('relaciones') || 
      lowerMessage.includes('pareja')) {
    return '¡Excelente! 💫 Para analizar compatibilidad necesito:\n\n• Tu información de nacimiento\n• La información de la otra persona (fecha, hora, lugar)\n\nPuedo analizar compatibilidad romántica, amistosa o profesional. ¿Con quién te gustaría analizar la compatibilidad?';
  }

  if (lowerMessage.includes('predicciones') || lowerMessage.includes('tránsitos') || 
      lowerMessage.includes('futuro')) {
    return '¡Fascinante! 🔮 Para hacer predicciones precisas necesito:\n\n• Tu carta natal completa\n• El período que te interesa analizar\n\nPuedo analizar tránsitos planetarios, oportunidades y desafíos. ¿Qué período te interesa más?';
  }

  // General astrology questions
  if (lowerMessage.includes('astrologia') || lowerMessage.includes('astrology') || 
      lowerMessage.includes('carta natal') || lowerMessage.includes('natal chart') ||
      lowerMessage.includes('horoscopo') || lowerMessage.includes('horoscope') ||
      lowerMessage.includes('lectura') || lowerMessage.includes('reading')) {
    return '¡Me encanta hablar de astrología! 🌟 ¿Hay algo específico que te gustaría saber sobre tu carta natal o signo?';
  }

  // Yes responses - check context for more specific responses
  if (lowerMessage.includes('si') || lowerMessage.includes('yes') || lowerMessage.includes('claro') || lowerMessage.includes('por supuesto')) {
    // Check if the conversation is about astrology/reading
    const lastMessages = conversationHistory.slice(-3).map(msg => msg.content.toLowerCase()).join(' ');
    if (lastMessages.includes('carta natal') || lastMessages.includes('lectura') || lastMessages.includes('signo') || 
        lastMessages.includes('astrología') || lastMessages.includes('leo') || lastMessages.includes('aries') ||
        lastMessages.includes('tauro') || lastMessages.includes('géminis') || lastMessages.includes('cáncer') ||
        lastMessages.includes('virgo') || lastMessages.includes('libra') || lastMessages.includes('escorpio') ||
        lastMessages.includes('sagitario') || lastMessages.includes('capricornio') || lastMessages.includes('acuario') ||
        lastMessages.includes('piscis')) {
      return '¡Excelente! 🌟 Puedo ayudarte con:\n\n• 📊 **Análisis de tu Carta Natal completa**\n• 💫 **Compatibilidad con otros signos**\n• 🔮 **Predicciones y tránsitos**\n• 💝 **Orientación en relaciones**\n• 🎯 **Guía profesional y personal**\n\n¿Qué te interesa más?';
    }
    return '¡Perfecto! ✨ ¿Qué te gustaría explorar?';
  }

  // No responses
  if (lowerMessage.includes('no') || lowerMessage.includes('nah') || lowerMessage.includes('quizas') || lowerMessage.includes('maybe')) {
    return '¡Sin problema! 🤝 ¿Hay algo más en lo que pueda ayudarte?';
  }

  // Package requests
  if (lowerMessage.includes('paquetes') || lowerMessage.includes('packages') || 
      lowerMessage.includes('mostrar paquetes') || lowerMessage.includes('show packages') ||
      lowerMessage.includes('ver paquetes') || lowerMessage.includes('see packages') ||
      lowerMessage.includes('que paquetes') || lowerMessage.includes('what packages') ||
      lowerMessage.includes('paquetes disponibles') || lowerMessage.includes('available packages')) {
    // Fetch packages directly since Rasa might not be available
    return await fetchPackagesFromAPI();
  }

  // Pricing questions
  if (lowerMessage.includes('precio') || lowerMessage.includes('price') || lowerMessage.includes('cost') ||
      lowerMessage.includes('costo') || lowerMessage.includes('cuanto cuesta')) {
    return '💰 **Precios:**\n• Consulta Básica: $50 (30 min)\n• Carta Natal: $75 (60 min)\n• Compatibilidad: $85 (75 min)\n• Coaching: $70 (50 min)\n\n💎 **Paquetes:**\n• Descubrimiento: $120\n• Transformación: $180\n• Iluminación: $250\n\n¿Te interesa algún paquete específico?';
  }

  // Contact questions
  if (lowerMessage.includes('contacto') || lowerMessage.includes('contact') ||
      lowerMessage.includes('telefono') || lowerMessage.includes('phone') ||
      lowerMessage.includes('email')) {
    return '📧 **Email**: info@josegarfias.com\n📱 **WhatsApp**: +52 55 1234 5678\n📍 **Ubicación**: Ciudad de México\n\n🕒 **Horarios**: Lunes-Viernes 9AM-7PM, Sábados 10AM-4PM\n\n¿Prefieres WhatsApp o email?';
  }

  // Availability questions
  if (lowerMessage.includes('horario') || lowerMessage.includes('horarios') ||
      lowerMessage.includes('disponible') || lowerMessage.includes('availability') ||
      lowerMessage.includes('schedule')) {
    return '📅 **Disponibilidad:**\n• Lunes-Viernes: 9AM-7PM\n• Sábados: 10AM-4PM\n• Domingos: Con cita previa\n\n💫 **Horarios populares:**\n• Mañanas: 10AM-12PM\n• Tardes: 2PM-5PM\n• Noches: 6PM-8PM\n\n¿Qué horario prefieres?';
  }

  // Goodbye
  if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye') ||
      lowerMessage.includes('adios') || lowerMessage.includes('hasta luego')) {
    return '¡Hasta luego! 🌟 Que tengas un día maravilloso. ¡Cuídate mucho! 💫';
  }

  return null; // Let OpenRouter handle it
}
