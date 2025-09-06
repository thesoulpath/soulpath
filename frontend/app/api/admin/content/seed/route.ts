import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Zod schema for content data (unused - keeping for future use)
// const contentSchema = z.object({
//   key: z.string().min(1, 'Content key is required'),
//   value: z.any(),
//   language: z.enum(['en', 'es']).optional()
// });

const seedContentSchema = z.object({
  content: z.record(z.string(), z.any())
});

export async function POST() {
  try {
    // Default content structure
    const defaultContent = {
      hero: {
        en: {
          title: "Discover Your Soul's Path",
          subtitle: "Professional Astrology Consultations",
          description: "Unlock the secrets of your birth chart and find guidance for your life journey through personalized astrology readings.",
          cta: "Book Your Session"
        },
        es: {
          title: "Descubre el Camino de tu Alma",
          subtitle: "Consultas Astrológicas Profesionales",
          description: "Desbloquea los secretos de tu carta natal y encuentra guía para tu viaje de vida a través de lecturas astrológicas personalizadas.",
          cta: "Reserva tu Sesión"
        }
      },
      about: {
        en: {
          title: "About Soul Path",
          subtitle: "Your Journey to Self-Discovery",
          description: "We are dedicated to helping you understand your unique astrological blueprint and navigate life's challenges with confidence and clarity.",
          features: [
            "Personalized Birth Chart Analysis",
            "Life Path Guidance",
            "Relationship Compatibility",
            "Career Direction Insights"
          ]
        },
        es: {
          title: "Acerca de Soul Path",
          subtitle: "Tu Camino hacia el Autoconocimiento",
          description: "Estamos dedicados a ayudarte a entender tu único plano astrológico y navegar los desafíos de la vida con confianza y claridad.",
          features: [
            "Análisis Personalizado de Carta Natal",
            "Guía del Camino de Vida",
            "Compatibilidad de Relaciones",
            "Insights de Dirección Profesional"
          ]
        }
      },
      session: {
        en: {
          title: "Astrology Sessions",
          subtitle: "Transform Your Life Through Astrology",
          description: "Our personalized sessions help you understand your unique astrological makeup and provide practical guidance for your life decisions.",
          types: [
            {
              name: "Birth Chart Reading",
              description: "Comprehensive analysis of your natal chart",
              duration: "90 minutes",
              price: "$150"
            },
            {
              name: "Relationship Compatibility",
              description: "Understanding dynamics between partners",
              duration: "60 minutes",
              price: "$120"
            },
            {
              name: "Career Guidance",
              description: "Astrological insights for professional growth",
              duration: "60 minutes",
              price: "$120"
            }
          ],
          price: "Starting from $120",
          deliverables: [
            "Detailed written report",
            "Audio recording of session",
            "Follow-up email support",
            "30-day consultation access"
          ],
          cta: "Book Your Session"
        },
        es: {
          title: "Sesiones de Astrología",
          subtitle: "Transforma tu Vida a través de la Astrología",
          description: "Nuestras sesiones personalizadas te ayudan a entender tu composición astrológica única y proporcionan guía práctica para tus decisiones de vida.",
          types: [
            {
              name: "Lectura de Carta Natal",
              description: "Análisis completo de tu carta natal",
              duration: "90 minutos",
              price: "$150"
            },
            {
              name: "Compatibilidad de Relaciones",
              description: "Entendiendo la dinámica entre parejas",
              duration: "60 minutos",
              price: "$120"
            },
            {
              name: "Guía Profesional",
              description: "Insights astrológicos para crecimiento profesional",
              duration: "60 minutos",
              price: "$120"
            }
          ],
          price: "Desde $120",
          deliverables: [
            "Reporte escrito detallado",
            "Grabación de audio de la sesión",
            "Soporte por email de seguimiento",
            "Acceso a consulta por 30 días"
          ],
          cta: "Reserva tu Sesión"
        }
      },
      approach: {
        en: {
          title: "Our Approach",
          subtitle: "How We Work Together",
          description: "We combine traditional astrological wisdom with modern psychological insights to provide you with practical, actionable guidance.",
          steps: [
            {
              step: 1,
              title: "Initial Consultation",
              description: "We discuss your goals and what you hope to gain from the session."
            },
            {
              step: 2,
              title: "Chart Analysis",
              description: "Deep dive into your birth chart to identify key patterns and themes."
            },
            {
              step: 3,
              title: "Guidance Session",
              description: "Interactive session where we explore your questions and provide insights."
            },
            {
              step: 4,
              title: "Follow-up Support",
              description: "Continued guidance and support as you implement the insights."
            }
          ]
        },
        es: {
          title: "Nuestro Enfoque",
          subtitle: "Cómo Trabajamos Juntos",
          description: "Combinamos la sabiduría astrológica tradicional con insights psicológicos modernos para proporcionarte guía práctica y accionable.",
          steps: [
            {
              step: 1,
              title: "Consulta Inicial",
              description: "Discutimos tus objetivos y lo que esperas obtener de la sesión."
            },
            {
              step: 2,
              title: "Análisis de Carta",
              description: "Inmersión profunda en tu carta natal para identificar patrones y temas clave."
            },
            {
              step: 3,
              title: "Sesión de Guía",
              description: "Sesión interactiva donde exploramos tus preguntas y proporcionamos insights."
            },
            {
              step: 4,
              title: "Soporte de Seguimiento",
              description: "Guía y soporte continuo mientras implementas los insights."
            }
          ]
        }
      },
      contact: {
        en: {
          title: "Get in Touch",
          subtitle: "Ready to Begin Your Journey?",
          description: "Contact us to schedule your personalized astrology consultation and start your path to self-discovery.",
          email: "hello@soulpath.lat",
          phone: "+1 (555) 123-4567",
          cta: "Contact Us"
        },
        es: {
          title: "Ponte en Contacto",
          subtitle: "¿Listo para Comenzar tu Viaje?",
          description: "Contáctanos para programar tu consulta astrológica personalizada y comenzar tu camino hacia el autoconocimiento.",
          email: "hello@soulpath.lat",
          phone: "+1 (555) 123-4567",
          cta: "Contáctanos"
        }
      }
    };

    // Validate content data
    const validation = seedContentSchema.safeParse({ content: defaultContent });
    if (!validation.success) {
      console.error('Validation error:', validation.error.issues);
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Content data validation failed',
        details: validation.error.issues,
        toast: {
          type: 'error',
          title: 'Validation Error',
          description: 'Content data validation failed. Please check the data format.'
        }
      }, { status: 400 });
    }

    // Insert content into kv_store table
    const { error } = await supabase
      .from('kv_store_f839855f')
      .upsert({
        key: 'website_content',
        value: defaultContent,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error seeding content:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to seed content',
        details: error.message,
        toast: {
          type: 'error',
          title: 'Database Error',
          description: 'Failed to seed content. Please try again.'
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Content seeded successfully',
      toast: {
        type: 'success',
        title: 'Success!',
        description: 'Website content has been seeded successfully'
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      toast: {
        type: 'error',
        title: 'Unexpected Error',
        description: 'An unexpected error occurred. Please try again.'
      }
    }, { status: 500 });
  }
}
