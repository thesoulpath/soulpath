import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface NestedContent {
  [key: string]: any;
}

interface TransformedContent {
  en: NestedContent;
  es: NestedContent;
}

function transformFlatContentToNested(flatContent: any): TransformedContent {
  const nestedContent: TransformedContent = {
    en: {} as NestedContent,
    es: {} as NestedContent
  };

  // Transform the flat Prisma Content model to nested structure
  if (flatContent) {
    // Hero section
    nestedContent.en.hero = {
      title: flatContent.heroTitleEn || 'SOULPATH',
      tagline: 'Transform your life through spiritual guidance and healing',
      description: 'Experience profound transformation through personalized spiritual sessions, energy healing, and guidance on your journey to inner peace and self-discovery.',
      ctaPrimary: 'Book Your Session',
      ctaSecondary: 'Learn More',
      subtitle: flatContent.heroSubtitleEn || 'Your journey to wellness starts here'
    };
    nestedContent.es.hero = {
      title: flatContent.heroTitleEs || 'SOULPATH',
      tagline: 'Transforma tu vida a través de la guía espiritual y la sanación',
      description: 'Experimenta una transformación profunda a través de sesiones espirituales personalizadas, sanación energética y guía en tu camino hacia la paz interior y el autodescubrimiento.',
      ctaPrimary: 'Reserva tu Sesión',
      ctaSecondary: 'Conoce Más',
      subtitle: flatContent.heroSubtitleEs || 'Tu camino al bienestar comienza aquí'
    };

    // About section
    nestedContent.en.about = {
      title: flatContent.aboutTitleEn || 'About SOULPATH',
      text: flatContent.aboutContentEn || 'SOULPATH was founded with a simple yet profound mission: to help people find their true selves and live authentic, fulfilling lives. Through spiritual guidance, energy healing, and compassionate counseling, we\'ve helped hundreds of individuals transform their lives and discover their purpose.',
      description: flatContent.aboutContentEn || 'SOULPATH was founded with a simple yet profound mission: to help people find their true selves and live authentic, fulfilling lives. Through spiritual guidance, energy healing, and compassionate counseling, we\'ve helped hundreds of individuals transform their lives and discover their purpose.',
      statsClients: 'Clients Helped',
      statsYears: 'Years Experience',
      statsSessions: 'Sessions Completed',
      statsCountries: 'Countries Served',
      valuesTitle: 'Our Core Values',
      value1Title: 'Compassion',
      value1Description: 'We approach every client with deep empathy and understanding, creating a safe space for healing and growth.',
      value2Title: 'Authenticity',
      value2Description: 'Our guidance comes from genuine spiritual wisdom and personal experience, not from textbooks or theories.',
      value3Title: 'Transformation',
      value3Description: 'We believe in the power of real change and are committed to helping you achieve lasting transformation.',
      storyTitle: 'Jose\'s Story',
      storyText: 'My journey began over 15 years ago when I experienced a profound spiritual awakening that changed my life forever. Since then, I\'ve dedicated myself to helping others find their own path to spiritual growth and personal transformation. Through years of study, practice, and working with clients from around the world, I\'ve developed a unique approach that combines traditional spiritual wisdom with modern understanding of human psychology and energy work.'
    };
    nestedContent.es.about = {
      title: flatContent.aboutTitleEs || 'Acerca de SOULPATH',
      text: flatContent.aboutContentEs || 'SOULPATH fue fundado con una misión simple pero profunda: ayudar a las personas a encontrar su verdadero ser y vivir vidas auténticas y satisfactorias. A través de la guía espiritual, la sanación energética y el asesoramiento compasivo, hemos ayudado a cientos de individuos a transformar sus vidas y descubrir su propósito.',
      description: flatContent.aboutContentEs || 'SOULPATH fue fundado con una misión simple pero profunda: ayudar a las personas a encontrar su verdadero ser y vivir vidas auténticas y satisfactorias. A través de la guía espiritual, la sanación energética y el asesoramiento compasivo, hemos ayudado a cientos de individuos a transformar sus vidas y descubrir su propósito.',
      statsClients: 'Clientes Ayudados',
      statsYears: 'Años de Experiencia',
      statsSessions: 'Sesiones Completadas',
      statsCountries: 'Países Atendidos',
      valuesTitle: 'Nuestros Valores Fundamentales',
      value1Title: 'Compasión',
      value1Description: 'Nos acercamos a cada cliente con profunda empatía y comprensión, creando un espacio seguro para la sanación y el crecimiento.',
      value2Title: 'Autenticidad',
      value2Description: 'Nuestra guía proviene de la sabiduría espiritual genuina y la experiencia personal, no de libros de texto o teorías.',
      value3Title: 'Transformación',
      value3Description: 'Creemos en el poder del cambio real y estamos comprometidos a ayudarte a lograr una transformación duradera.',
      storyTitle: 'La Historia de José',
      storyText: 'Mi viaje comenzó hace más de 15 años cuando experimenté un despertar espiritual profundo que cambió mi vida para siempre. Desde entonces, me he dedicado a ayudar a otros a encontrar su propio camino hacia el crecimiento espiritual y la transformación personal. A través de años de estudio, práctica y trabajo con clientes de todo el mundo, he desarrollado un enfoque único que combina la sabiduría espiritual tradicional con la comprensión moderna de la psicología humana y el trabajo energético.'
    };

    // Approach section
    nestedContent.en.approach = {
      title: flatContent.approachTitleEn || 'Our Approach',
      content: flatContent.approachContentEn || 'We use a holistic approach to wellness.',
      items: [
        {
          title: 'Heart-Centered Healing',
          text: 'Connect with your emotional core and release past traumas through compassionate guidance and energy work.'
        },
        {
          title: 'Mindful Transformation',
          text: 'Develop mental clarity and break free from limiting beliefs that hold you back from your true potential.'
        },
        {
          title: 'Spiritual Awakening',
          text: 'Discover your spiritual path and deepen your connection to the divine through meditation and spiritual practices.'
        }
      ]
    };
    nestedContent.es.approach = {
      title: flatContent.approachTitleEs || 'Nuestro Enfoque',
      content: flatContent.approachContentEs || 'Usamos un enfoque holístico para el bienestar.',
      items: [
        {
          title: 'Sanación Centrada en el Corazón',
          text: 'Conecta con tu núcleo emocional y libera traumas pasados a través de guía compasiva y trabajo energético.'
        },
        {
          title: 'Transformación Consciente',
          text: 'Desarrolla claridad mental y libérate de creencias limitantes que te impiden alcanzar tu verdadero potencial.'
        },
        {
          title: 'Despertar Espiritual',
          text: 'Descubre tu camino espiritual y profundiza tu conexión con lo divino a través de la meditación y prácticas espirituales.'
        }
      ]
    };

    // Services section
    nestedContent.en.services = {
      title: flatContent.servicesTitleEn || 'Our Services',
      content: flatContent.servicesContentEn || 'Professional wellness services in a peaceful environment.'
    };
    nestedContent.es.services = {
      title: flatContent.servicesTitleEs || 'Nuestros Servicios',
      content: flatContent.servicesContentEs || 'Servicios profesionales de bienestar en un ambiente pacífico.'
    };

    // Navigation
    nestedContent.en.nav = {
      invitation: 'Invitation',
      approach: 'Approach',
      session: 'Session',
      about: 'About',
      apply: 'Apply'
    };
    nestedContent.es.nav = {
      invitation: 'Invitación',
      approach: 'Enfoque',
      session: 'Sesión',
      about: 'Acerca de',
      apply: 'Aplicar'
    };

    // CTA buttons
    nestedContent.en.cta = {
      bookReading: 'Book Your Reading'
    };
    nestedContent.es.cta = {
      bookReading: 'Reserva Tu Lectura'
    };
  }

  return nestedContent;
}

export async function GET() {
  try {
    // Get content from the Content table using Prisma
    const content = await prisma.content.findFirst();

    if (!content) {
      console.log('No content found, creating default content');
      // Create default content if none exists
      const defaultContent = await prisma.content.create({
        data: {
          heroTitleEn: 'Welcome to SOULPATH',
          heroTitleEs: 'Bienvenido a SOULPATH',
          heroSubtitleEn: 'Your journey to wellness starts here',
          heroSubtitleEs: 'Tu camino al bienestar comienza aquí',
          aboutTitleEn: 'About Us',
          aboutTitleEs: 'Sobre Nosotros',
          aboutContentEn: 'We are dedicated to helping you achieve your wellness goals.',
          aboutContentEs: 'Estamos dedicados a ayudarte a alcanzar tus metas de bienestar.',
          approachTitleEn: 'Our Approach',
          approachTitleEs: 'Nuestro Enfoque',
          approachContentEn: 'We use a holistic approach to wellness.',
          approachContentEs: 'Usamos un enfoque holístico para el bienestar.',
          servicesTitleEn: 'Our Services',
          servicesTitleEs: 'Nuestros Servicios',
          servicesContentEn: 'Professional wellness services in a peaceful environment.',
          servicesContentEs: 'Servicios profesionales de bienestar en un ambiente pacífico.'
        }
      });
      
      const transformedContent = transformFlatContentToNested(defaultContent);
      console.log('✅ Default content created and loaded');
      return NextResponse.json({ content: transformedContent });
    }

    // Transform flat content to nested structure
    const transformedContent = transformFlatContentToNested(content);
    
    console.log('✅ Content loaded from database and transformed');
    return NextResponse.json({ content: transformedContent });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get the first content record or create one
    let content = await prisma.content.findFirst();
    
    if (!content) {
      // Create new content record
      content = await prisma.content.create({
        data: {
          heroTitleEn: body.heroTitleEn || 'Welcome to SOULPATH',
          heroTitleEs: body.heroTitleEs || 'Bienvenido a SOULPATH',
          heroSubtitleEn: body.heroSubtitleEn || 'Your journey to wellness starts here',
          heroSubtitleEs: body.heroSubtitleEs || 'Tu camino al bienestar comienza aquí',
          aboutTitleEn: body.aboutTitleEn || 'About Us',
          aboutTitleEs: body.aboutTitleEs || 'Sobre Nosotros',
          aboutContentEn: body.aboutContentEn || 'We are dedicated to helping you achieve your wellness goals.',
          aboutContentEs: body.aboutContentEs || 'Estamos dedicados a ayudarte a alcanzar tus metas de bienestar.',
          approachTitleEn: body.approachTitleEn || 'Our Approach',
          approachTitleEs: body.approachTitleEs || 'Nuestro Enfoque',
          approachContentEn: body.approachContentEn || 'We use a holistic approach to wellness.',
          approachContentEs: body.approachContentEs || 'Usamos un enfoque holístico para el bienestar.',
          servicesTitleEn: body.servicesTitleEn || 'Our Services',
          servicesTitleEs: body.servicesTitleEs || 'Nuestros Servicios',
          servicesContentEn: body.servicesContentEn || 'Professional wellness services in a peaceful environment.',
          servicesContentEs: body.servicesContentEs || 'Servicios profesionales de bienestar en un ambiente pacífico.'
        }
      });
    } else {
      // Update existing content record
      content = await prisma.content.update({
        where: { id: content.id },
        data: {
          heroTitleEn: body.heroTitleEn,
          heroTitleEs: body.heroTitleEs,
          heroSubtitleEn: body.heroSubtitleEn,
          heroSubtitleEs: body.heroSubtitleEs,
          aboutTitleEn: body.aboutTitleEn,
          aboutTitleEs: body.aboutTitleEs,
          aboutContentEn: body.aboutContentEn,
          aboutContentEs: body.aboutContentEs,
          approachTitleEn: body.approachTitleEn,
          approachTitleEs: body.approachTitleEs,
          approachContentEn: body.approachContentEn,
          approachContentEs: body.approachContentEs,
          servicesTitleEn: body.servicesTitleEn,
          servicesTitleEs: body.servicesTitleEs,
          servicesContentEn: body.servicesContentEn,
          servicesContentEs: body.servicesContentEs
        }
      });
    }

    const transformedContent = transformFlatContentToNested(content);
    return NextResponse.json({ content: transformedContent });
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}
