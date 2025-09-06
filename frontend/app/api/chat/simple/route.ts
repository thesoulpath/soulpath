import { NextRequest, NextResponse } from 'next/server';

// Helper function to get dynamic base URL
function getBaseUrl(): string {
  // In production, use NEXT_PUBLIC_BASE_URL
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  
  // In development, use localhost with dynamic port
  const port = process.env.PORT || 3000;
  return `http://localhost:${port}`;
}

function getRasaUrl(): string {
  if (process.env.RASA_URL) {
    return process.env.RASA_URL;
  }
  // In production, use the Render.com Rasa server
  if (process.env.NODE_ENV === 'production') {
    return 'https://soulpath-rasa-server.onrender.com';
  }
  return 'http://localhost:5005';
}

// Country code and phone format helper functions
function getCountryCode(country: string): string {
  const countryMap: { [key: string]: string } = {
    'mexico': '+52',
    'united states': '+1',
    'canada': '+1',
    'united kingdom': '+44',
    'spain': '+34',
    'france': '+33',
    'germany': '+49',
    'italy': '+39',
    'brazil': '+55',
    'argentina': '+54',
    'colombia': '+57',
    'chile': '+56',
    'peru': '+51',
    'venezuela': '+58',
    'ecuador': '+593',
    'bolivia': '+591',
    'uruguay': '+598',
    'paraguay': '+595',
    'japan': '+81',
    'china': '+86',
    'india': '+91',
    'australia': '+61',
    'new zealand': '+64',
    'south africa': '+27',
    'russia': '+7',
    'south korea': '+82',
    'thailand': '+66',
    'singapore': '+65',
    'malaysia': '+60',
    'indonesia': '+62',
    'philippines': '+63',
    'vietnam': '+84',
    'taiwan': '+886',
    'hong kong': '+852',
    'israel': '+972',
    'turkey': '+90',
    'egypt': '+20',
    'nigeria': '+234',
    'kenya': '+254',
    'morocco': '+212',
    'saudi arabia': '+966',
    'uae': '+971',
    'qatar': '+974',
    'kuwait': '+965',
    'bahrain': '+973',
    'oman': '+968'
  };
  
  const normalizedCountry = country.toLowerCase().trim();
  return countryMap[normalizedCountry] || '+1';
}

function getPhoneFormat(country: string): string {
  const formatMap: { [key: string]: string } = {
    'mexico': '+52 55 1234 5678',
    'united states': '+1 (555) 123-4567',
    'canada': '+1 (555) 123-4567',
    'united kingdom': '+44 20 1234 5678',
    'spain': '+34 612 345 678',
    'france': '+33 6 12 34 56 78',
    'germany': '+49 30 12345678',
    'italy': '+39 06 1234 5678',
    'brazil': '+55 11 91234-5678',
    'argentina': '+54 9 11 1234-5678',
    'colombia': '+57 300 123 4567',
    'chile': '+56 9 1234 5678',
    'peru': '+51 987 654 321',
    'venezuela': '+58 412 123 4567',
    'ecuador': '+593 99 123 4567',
    'bolivia': '+591 7 123 4567',
    'uruguay': '+598 99 123 456',
    'paraguay': '+595 981 123 456',
    'japan': '+81 90-1234-5678',
    'china': '+86 138 0013 8000',
    'india': '+91 98765 43210',
    'australia': '+61 4 1234 5678',
    'new zealand': '+64 21 123 4567',
    'south africa': '+27 82 123 4567',
    'russia': '+7 912 345-67-89',
    'south korea': '+82 10-1234-5678',
    'thailand': '+66 81 234 5678',
    'singapore': '+65 8123 4567',
    'malaysia': '+60 12-345 6789',
    'indonesia': '+62 812-3456-7890',
    'philippines': '+63 917 123 4567',
    'vietnam': '+84 90 123 45 67',
    'taiwan': '+886 912 345 678',
    'hong kong': '+852 9123 4567',
    'israel': '+972 50-123-4567',
    'turkey': '+90 532 123 45 67',
    'egypt': '+20 10 1234 5678',
    'nigeria': '+234 803 123 4567',
    'kenya': '+254 700 123 456',
    'morocco': '+212 6 12 34 56 78',
    'saudi arabia': '+966 50 123 4567',
    'uae': '+971 50 123 4567',
    'qatar': '+974 3312 3456',
    'kuwait': '+965 9001 2345',
    'bahrain': '+973 3312 3456',
    'oman': '+968 9123 4567'
  };
  
  const normalizedCountry = country.toLowerCase().trim();
  return formatMap[normalizedCountry] || '+1 (555) 123-4567';
}

export async function POST(request: NextRequest) {
  try {
    const { message, userId, bookingData: requestBookingData } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if this is a button payload first
    let intent = '';
    let confidence = 1.0;
    let rasaData: any = { entities: [] };
    let bookingData = requestBookingData || null;
    let buttons: any[] = [];

    // Handle button payloads directly
    if (message.startsWith('confirm_booking_') || 
        message.startsWith('select_package_') || 
        message.startsWith('select_slot_') ||
        message === 'provide_all_details' ||
        message === 'step_by_step_details' ||
        message === 'waiting_for_details' ||
        message === 'cancel_booking' ||
        message === 'view_packages' ||
        message === 'book_reading') {
      intent = message;
    } else {
      // Step 1: Get intent and entities from Rasa for natural language
      const rasaResponse = await fetch(`${getRasaUrl()}/model/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message
        })
      });

      if (!rasaResponse.ok) {
        throw new Error(`Rasa API error: ${rasaResponse.status}`);
      }

      rasaData = await rasaResponse.json();
      intent = rasaData.intent?.name;
      confidence = rasaData.intent?.confidence || 0;
    }
    
    // Step 2: Get response from Rasa webhook (skip for certain intents)
    let responseText = 'Sorry, I did not understand that.';
    
    if (intent === 'view_packages') {
      // Handle view_packages directly without Rasa webhook - let button handling section take care of package fetching
      responseText = "Here are our available astrology packages. Each package is designed to provide you with comprehensive insights into your birth chart and astrological profile.";
    } else {
      // Use Rasa webhook for other intents
      const webhookResponse = await fetch(`${getRasaUrl()}/webhooks/rest/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: userId || 'web_user',
          message: message
        })
      });

      if (!webhookResponse.ok) {
        throw new Error(`Rasa webhook error: ${webhookResponse.status}`);
      }

      const webhookData = await webhookResponse.json();
      responseText = webhookData.length > 0 ? webhookData[0].text : 'Sorry, I did not understand that.';
    }

    // Step 3: Handle booking collection BEFORE OpenRouter processing
    // Check if we're in a booking collection state and handle user input
    if (bookingData && bookingData.step && bookingData.step.startsWith('collecting_') && 
        !message.startsWith('select_') && !message.startsWith('collect_') && 
        !message.startsWith('set_') && !message.startsWith('complete_') && 
        !message.startsWith('cancel_') && !message.startsWith('provide_') && 
        !message.startsWith('step_') && !message.startsWith('waiting_') &&
        !message.startsWith('book_') && !message.startsWith('view_') &&
        !message.startsWith('ask_') && bookingData.currentField) {
      
      const field = bookingData.currentField;
      const userInput = message.trim();
      
      // Email validation
      if (field === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userInput)) {
          responseText = `Please enter a valid email address.\n\n**Step 2:** What's your email address?`;
          buttons = [
            { title: "Cancel", payload: "cancel_booking" }
          ];
          return NextResponse.json({
            success: true,
            response: responseText,
            intent: intent,
            confidence: confidence,
            entities: rasaData.entities || [],
            buttons: buttons,
            bookingData: bookingData
          });
        }
      }

      // Phone validation based on country
      if (field === 'phone') {
        const country = bookingData.collectedDetails.country;
        if (country) {
          const countryCode = getCountryCode(country);
          const phoneFormat = getPhoneFormat(country);
          
          // Basic phone validation - check if it contains the country code
          if (!userInput.includes(countryCode.replace('+', ''))) {
            responseText = `Please enter a valid phone number for ${country}.\n\n**Step 6:** What's your phone number? (Required)\n\nCountry: ${country}\nCountry Code: ${countryCode}\nFormat: ${phoneFormat}`;
            buttons = [
              { title: "Cancel", payload: "cancel_booking" }
            ];
            return NextResponse.json({
              success: true,
              response: responseText,
              intent: intent,
              confidence: confidence,
              entities: rasaData.entities || [],
              buttons: buttons,
              bookingData: bookingData
            });
          }
        }
      }
      
      // Store the collected detail
      if (!bookingData.collectedDetails) {
        bookingData.collectedDetails = {};
      }
      bookingData.collectedDetails[field] = userInput;
      
      // Move to next field
      if (field === 'name') {
        responseText = `Great! I have your name: **${userInput}**\n\n**Step 2:** What's your email address? (Required)`;
        buttons = [
          { title: "Cancel", payload: "cancel_booking" }
        ];
        bookingData.step = 'collecting_email';
        bookingData.currentField = 'email';
      } else if (field === 'email') {
        responseText = `Perfect! I have your email: **${userInput}**\n\n**Step 3:** What's your birth date? (Required - YYYY-MM-DD)`;
        buttons = [
          { title: "Cancel", payload: "cancel_booking" }
        ];
        bookingData.step = 'collecting_birth_date';
        bookingData.currentField = 'birthDate';
      } else if (field === 'birthDate') {
        responseText = `Excellent! I have your birth date: **${userInput}**\n\n**Step 4:** What's your birth place? (Required - City, Country)`;
        buttons = [
          { title: "Cancel", payload: "cancel_booking" }
        ];
        bookingData.step = 'collecting_birth_place';
        bookingData.currentField = 'birthPlace';
      } else if (field === 'birthPlace') {
        responseText = `Great! I have your birth place: **${userInput}**\n\n**Step 5:** What would you like to explore in your reading? (Required)`;
        buttons = [
          { title: "Cancel", payload: "cancel_booking" }
        ];
        bookingData.step = 'collecting_question';
        bookingData.currentField = 'question';
      } else if (field === 'question') {
        responseText = `Perfect! I have your question: **${userInput}**\n\n**Step 6:** What's your country? (Required)`;
        buttons = [
          { title: "Cancel", payload: "cancel_booking" }
        ];
        bookingData.step = 'collecting_country';
        bookingData.currentField = 'country';
      } else if (field === 'country') {
        // Get country code and show phone format
        const countryCode = getCountryCode(userInput);
        const phoneFormat = getPhoneFormat(userInput);
        
        responseText = `Great! I have your country: **${userInput}**\n\n**Step 6:** What's your phone number? (Required)\n\nCountry: **${userInput}**\nCountry Code: **${countryCode}**\nFormat: **${phoneFormat}**`;
        buttons = [
          { title: "Cancel", payload: "cancel_booking" }
        ];
        bookingData.step = 'collecting_phone';
        bookingData.currentField = 'phone';
      } else if (field === 'phone') {
        responseText = `Great! I have your phone: **${userInput}**\n\n**Step 7:** What's your birth time? (Required - HH:MM)`;
        buttons = [
          { title: "Cancel", payload: "cancel_booking" }
        ];
        bookingData.step = 'collecting_birth_time';
        bookingData.currentField = 'birthTime';
      } else if (field === 'birthTime') {
        responseText = `Perfect! I have your birth time: **${userInput}**\n\n**Step 8:** What language would you prefer for your reading? (Required)`;
        buttons = [
          { title: "English", payload: "set_language_en" },
          { title: "Spanish", payload: "set_language_es" },
          { title: "Cancel", payload: "cancel_booking" }
        ];
        bookingData.step = 'collecting_language';
        bookingData.currentField = 'language';
      } else if (field === 'language') {
        responseText = `Excellent! I have your language preference: **${userInput}**\n\n**Step 9:** Any special requests or additional information? (Required)`;
        buttons = [
          { title: "Complete Booking", payload: "complete_booking" },
          { title: "Cancel", payload: "cancel_booking" }
        ];
        bookingData.step = 'collecting_special_requests';
        bookingData.currentField = 'specialRequests';
      } else if (field === 'specialRequests') {
        responseText = `Perfect! I have all your details:\n\n**Name:** ${bookingData.collectedDetails.name}\n**Email:** ${bookingData.collectedDetails.email}\n**Birth Date:** ${bookingData.collectedDetails.birthDate}\n**Birth Place:** ${bookingData.collectedDetails.birthPlace}\n**Question:** ${bookingData.collectedDetails.question}\n**Country:** ${bookingData.collectedDetails.country}\n**Phone:** ${bookingData.collectedDetails.phone}\n**Birth Time:** ${bookingData.collectedDetails.birthTime}\n**Language:** ${bookingData.collectedDetails.language}\n**Special Requests:** ${userInput}\n\nLet me complete your booking now...`;
        buttons = [
          { title: "Complete Booking", payload: "complete_booking" },
          { title: "Cancel", payload: "cancel_booking" }
        ];
        bookingData.step = 'ready_to_book';
        bookingData.currentField = null;
      }
      
      return NextResponse.json({
        success: true,
        response: responseText,
        intent: intent,
        confidence: confidence,
        entities: rasaData.entities || [],
        buttons: buttons,
        bookingData: bookingData
      });
    }

    // Step 4: Enhance response with OpenRouter for certain intents (only if not in booking collection)

    // For astrology, booking, and greeting intents, enhance with OpenRouter
    if (confidence > 0.7 && (intent?.includes('astrology') || intent?.includes('birth_chart') || intent?.includes('zodiac') || intent?.includes('book') || intent === 'greet')) {
      try {
        const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer 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`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://soulpath.com',
            'X-Title': 'SoulPath Astrology Assistant'
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.3-8b-instruct:free',
            messages: [
              {
                role: 'system',
                content: 'You are a friendly assistant for SoulPath astrology. Be helpful and concise. Keep responses to 1-2 short sentences. Always mention Jose Garfias, our amazing astrology consultant, and encourage booking a session with him. Be warm, natural, and conversational.'
              },
              {
                role: 'user',
                content: `User intent: ${intent}\nUser message: ${message}\n\nRespond in 1-2 short sentences and encourage booking a reading.`
              }
            ],
            max_tokens: 80,
            temperature: 0.7
          })
        });

        if (openrouterResponse.ok) {
          const openrouterData = await openrouterResponse.json();
          if (openrouterData.choices && openrouterData.choices[0]?.message?.content) {
            responseText = openrouterData.choices[0].message.content;
            // Add booking buttons to OpenRouter responses
            buttons = [
              { title: "Book with Jose", payload: "book_reading" },
              { title: "View Packages", payload: "view_packages" },
              { title: "Ask More Questions", payload: "ask_questions" }
            ];
          }
        }
      } catch (error) {
        console.log('OpenRouter enhancement failed, using Rasa response:', error);
        // Continue with Rasa response if OpenRouter fails
      }
    }

    // Add interactive buttons for booking workflow
    
    if (intent === 'book_reading' || intent === 'birth_chart_question') {
      // Fetch available packages for booking
      try {
        const packagesResponse = await fetch(`${getBaseUrl()}/api/packages?active=true`);
        if (packagesResponse.ok) {
          const packagesData = await packagesResponse.json();
          if (packagesData.success && packagesData.data) {
            buttons = packagesData.data.slice(0, 4).map((pkg: any) => ({
              title: `${pkg.name} (${pkg.sessionDuration?.duration_minutes || 60} min) - ${pkg.currency}${pkg.price}`,
              payload: `select_package_${pkg.id}`
            }));
            bookingData = { packages: packagesData.data };
            responseText = `Great! Here are our available astrology packages. Please select the one that interests you:`;
          }
        }
      } catch (error) {
        console.log('Failed to fetch packages:', error);
      }
      
      // Only show fallback if we couldn't fetch packages
      if (buttons.length === 0) {
        responseText = "I'd be happy to help you schedule an astrology reading. Let me show you our available packages.";
        buttons = [
          { title: "View Available Packages", payload: "view_packages" },
          { title: "Ask About Services", payload: "ask_about_services" }
        ];
      }
    } else if (intent === 'ask_about_services') {
      buttons = [
        { title: "Book with Jose", payload: "book_reading" },
        { title: "View Packages", payload: "view_packages" },
        { title: "Ask Questions", payload: "ask_questions" }
      ];
    } else if (intent === 'ask_about_pricing') {
      buttons = [
        { title: "View Packages", payload: "view_packages" },
        { title: "Book with Jose", payload: "book_reading" },
        { title: "Ask Questions", payload: "ask_questions" }
      ];
    } else if (intent === 'view_packages') {
      // Fetch and display all available packages
      console.log('Processing view_packages intent...');
      try {
        const packagesUrl = `${getBaseUrl()}/api/packages?active=true`;
        console.log('Fetching packages from:', packagesUrl);
        const packagesResponse = await fetch(packagesUrl);
        console.log('Packages response status:', packagesResponse.status);
        
        if (packagesResponse.ok) {
          const packagesData = await packagesResponse.json();
          console.log('Packages data:', packagesData);
          
          if (packagesData.success && packagesData.packages) {
            buttons = packagesData.packages.map((pkg: any) => ({
              title: `**${pkg.name}** (${pkg.duration || 90} min) - **${pkg.currency}${pkg.price}**`,
              payload: `select_package_${pkg.id}`
            }));
            bookingData = { packages: packagesData.packages };
            responseText = `Here are all our available astrology packages:`;
            console.log('Created buttons:', buttons);
          }
        }
      } catch (error) {
        console.log('Failed to fetch packages:', error);
        responseText = "I'm having trouble loading our packages right now. But Jose Garfias is still available for bookings! Want to book with him?";
        buttons = [
          { title: "Book with Jose", payload: "book_reading" },
          { title: "Ask Questions", payload: "ask_questions" }
        ];
      }
    } else if (intent === 'select_package' || intent?.startsWith('select_package_')) {
      // Handle package selection - fetch available time slots
      const packageId = intent === 'select_package' ? '1' : intent.replace('select_package_', '');
      console.log('Processing select_package intent for package:', packageId);
      try {
        const slotsUrl = `${getBaseUrl()}/api/chat/schedule-slots?isAvailable=true&limit=5`;
        console.log('Fetching slots from:', slotsUrl);
        const slotsResponse = await fetch(slotsUrl);
        console.log('Slots response status:', slotsResponse.status);
        
        if (slotsResponse.ok) {
          const slotsData = await slotsResponse.json();
          console.log('Slots data:', slotsData);
          
          if (slotsData.success && slotsData.data) {
            buttons = slotsData.data.slice(0, 5).map((slot: any) => ({
              title: `**${slot.date}** at **${slot.time}**`,
              payload: `select_slot_${slot.id}_${packageId}`
            }));
            bookingData = { 
              selectedPackage: packageId,
              availableSlots: slotsData.data 
            };
            responseText = `Great choice! Here are the available time slots for this package:`;
            console.log('Created slot buttons:', buttons);
          }
        }
      } catch (error) {
        console.log('Failed to fetch time slots:', error);
      }
    } else if (intent === 'select_slot' || intent?.startsWith('select_slot_')) {
      // Handle time slot selection - directly start step-by-step detail collection
      const [slotId, packageId] = intent === 'select_slot' ? ['6', '1'] : intent.replace('select_slot_', '').split('_');
      
      responseText = `Perfect! I have your booking details:\n\n**Selected Package:** Package ${packageId}\n**Selected Time Slot:** Slot ${slotId}\n\nTo complete your booking, I need to collect some details from you step by step.\n\n**Step 1:** What's your full name? (Required)`;
      
      buttons = [
        { title: "Choose Different Time", payload: `select_package_${packageId}` },
        { title: "Choose Different Package", payload: "book_reading" }
      ];
      
      bookingData = {
        selectedPackage: packageId,
        selectedSlot: slotId,
        step: 'collecting_name',
        currentField: 'name',
        collectedDetails: {}
      };
    }

    // Handle booking confirmation - collect client details
    if (intent?.startsWith('confirm_booking_')) {
      const [slotId, packageId] = intent.replace('confirm_booking_', '').split('_');
      
      responseText = `Perfect! To complete your booking, I need to collect some details from you:\n\n📝 Please provide your:\n• Full Name\n• Email address\n• Birth Date (YYYY-MM-DD)\n• Birth Place (City, Country)\n• Your question or focus areas for the reading\n\nYou can provide all details at once or I can ask for them one by one.`;
      
      buttons = [
        { title: "Provide All Details", payload: "provide_all_details" },
        { title: "Step by Step", payload: "step_by_step_details" },
        { title: "Cancel Booking", payload: "cancel_booking" }
      ];
      
      bookingData = {
        selectedPackage: packageId,
        selectedSlot: slotId,
        step: 'collecting_details'
      };
    }

    // Handle step-by-step detail collection (only if confidence is high)
    if (intent === 'step_by_step_details' && confidence > 0.9) {
      responseText = `Perfect! Let's collect your details step by step.\n\n**Step 1:** What's your full name?`;

      buttons = [
        { title: "Skip to Email", payload: "collect_email" },
        { title: "Cancel", payload: "cancel_booking" }
      ];

      bookingData = {
        step: 'collecting_name',
        currentField: 'name',
        collectedDetails: {}
      };
    } else if (intent === 'collect_email') {
      responseText = `**Step 2:** What's your email address?`;

      buttons = [
        { title: "Skip to Birth Date", payload: "collect_birth_date" },
        { title: "Cancel", payload: "cancel_booking" }
      ];

      bookingData = {
        step: 'collecting_email',
        currentField: 'email',
        collectedDetails: {}
      };
    } else if (intent === 'collect_birth_date') {
      responseText = `**Step 3:** What's your birth date? (Please use format: YYYY-MM-DD)\n\nExample: 1990-05-15`;

      buttons = [
        { title: "Skip to Birth Place", payload: "collect_birth_place" },
        { title: "Cancel", payload: "cancel_booking" }
      ];

      bookingData = {
        step: 'collecting_birth_date',
        currentField: 'birthDate',
        collectedDetails: {}
      };
    } else if (intent === 'collect_birth_place') {
      responseText = `**Step 4:** What's your birth place? (Required - City, Country)\n\nExample: Mexico City, Mexico`;

      buttons = [
        { title: "Skip to Question", payload: "collect_question" },
        { title: "Cancel", payload: "cancel_booking" }
      ];

      bookingData = {
        step: 'collecting_birth_place',
        currentField: 'birthPlace',
        collectedDetails: {}
      };
    } else if (intent === 'collect_question') {
      responseText = `**Step 5:** What would you like to explore in your reading? (Required) What's your main question or focus area?`;

      buttons = [
        { title: "Skip to Phone", payload: "collect_phone" },
        { title: "Cancel", payload: "cancel_booking" }
      ];

      bookingData = {
        step: 'collecting_question',
        currentField: 'question',
        collectedDetails: {}
      };
    } else if (intent === 'collect_country') {
      responseText = `**Step 6:** What's your country? (Required)\n\nPlease enter your country name (e.g., Mexico, United States, Canada, etc.)`;

      buttons = [
        { title: "Skip to Birth Time", payload: "collect_birth_time" },
        { title: "Skip to Language", payload: "collect_language" },
        { title: "Cancel", payload: "cancel_booking" }
      ];

      bookingData = {
        step: 'collecting_country',
        currentField: 'country',
        collectedDetails: {}
      };
    } else if (intent === 'collect_phone') {
      responseText = `**Step 6:** What's your phone number? (Required)\n\nPlease enter your phone number with country code (e.g., +52 55 1234 5678 for Mexico)`;

      buttons = [
        { title: "Skip to Birth Time", payload: "collect_birth_time" },
        { title: "Skip to Language", payload: "collect_language" },
        { title: "Cancel", payload: "cancel_booking" }
      ];

      bookingData = {
        step: 'collecting_phone',
        currentField: 'phone',
        collectedDetails: {}
      };
    } else if (intent === 'collect_birth_time') {
      responseText = `**Step 7:** What's your birth time? (Optional - format: HH:MM)\n\nExample: 14:30`;

      buttons = [
        { title: "Skip to Language", payload: "collect_language" },
        { title: "Cancel", payload: "cancel_booking" }
      ];

      bookingData = {
        step: 'collecting_birth_time',
        currentField: 'birthTime',
        collectedDetails: {}
      };
    } else if (intent === 'collect_language') {
      responseText = `**Step 8:** What language would you prefer? (en/es)`;

      buttons = [
        { title: "English", payload: "set_language_en" },
        { title: "Español", payload: "set_language_es" },
        { title: "Skip to Special Requests", payload: "collect_special_requests" },
        { title: "Cancel", payload: "cancel_booking" }
      ];

      bookingData = {
        step: 'collecting_language',
        currentField: 'language',
        collectedDetails: {}
      };
    } else if (intent === 'set_language_en' || intent === 'set_language_es') {
      const language = intent === 'set_language_en' ? 'en' : 'es';
      responseText = `**Step 9:** Any special requests or additional notes? (Optional)`;

      buttons = [
        { title: "No special requests", payload: "complete_booking" },
        { title: "Cancel", payload: "cancel_booking" }
      ];

      bookingData = {
        step: 'collecting_special_requests',
        currentField: 'specialRequests',
        collectedDetails: { language }
      };
    } else if (intent === 'collect_special_requests') {
      responseText = `**Step 9:** Any special requests or additional notes? (Optional)`;

      buttons = [
        { title: "No special requests", payload: "complete_booking" },
        { title: "Cancel", payload: "cancel_booking" }
      ];

      bookingData = {
        step: 'collecting_special_requests',
        currentField: 'specialRequests',
        collectedDetails: {}
      };
    } else if (intent === 'cancel_booking') {
      responseText = `No problem! Your booking has been cancelled. Feel free to start over anytime or ask me any questions about our services.`;

      buttons = [
        { title: "Start New Booking", payload: "book_reading" },
        { title: "View Packages", payload: "view_packages" },
        { title: "Ask Questions", payload: "ask_questions" }
      ];
    }

    // Handle user input for current field (only for natural language input, not button payloads)
    // Check if this is a natural language response during booking collection
    if (intent && !intent.startsWith('select_') && !intent.startsWith('collect_') && 
        !intent.startsWith('set_') && !intent.startsWith('complete_') && 
        !intent.startsWith('cancel_') && !intent.startsWith('provide_') && 
        !intent.startsWith('step_') && !intent.startsWith('waiting_') &&
        !intent.startsWith('book_') && !intent.startsWith('view_') &&
        !intent.startsWith('ask_') && confidence < 0.5) {
      
      // This section is removed - let the normal flow handle responses
    }
    
    // Handle user input for current field (only for natural language input, not button payloads)
    if (bookingData && bookingData.step && bookingData.step.startsWith('collecting_') && 
        !message.startsWith('select_') && !message.startsWith('collect_') && 
        !message.startsWith('set_') && !message.startsWith('complete_') && 
        !message.startsWith('cancel_') && !message.startsWith('provide_') && 
        !message.startsWith('step_') && !message.startsWith('waiting_') &&
        !message.startsWith('book_') && !message.startsWith('view_') &&
        !message.startsWith('ask_')) {
      
      const field = bookingData.currentField;
      const userInput = message.trim();
      
                // Email validation
          if (field === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userInput)) {
              responseText = `Please enter a valid email address.\n\n**Step 2:** What's your email address?`;
              buttons = [
                { title: "Cancel", payload: "cancel_booking" }
              ];
              return NextResponse.json({
                success: true,
                response: responseText,
                intent: intent,
                confidence: confidence,
                entities: rasaData.entities || [],
                buttons: buttons,
                bookingData: bookingData
              });
            }
          }

          // Phone validation based on country
          if (field === 'phone') {
            const country = bookingData.collectedDetails.country;
            if (country) {
              const countryCode = getCountryCode(country);
              const phoneFormat = getPhoneFormat(country);
              
              // Basic phone validation - check if it contains the country code
              if (!userInput.includes(countryCode.replace('+', ''))) {
                responseText = `Please enter a valid phone number for ${country}.\n\n**Step 6:** What's your phone number? (Required)\n\nCountry: ${country}\nCountry Code: ${countryCode}\nFormat: ${phoneFormat}`;
                buttons = [
                  { title: "Cancel", payload: "cancel_booking" }
                ];
                return NextResponse.json({
                  success: true,
                  response: responseText,
                  intent: intent,
                  confidence: confidence,
                  entities: rasaData.entities || [],
                  buttons: buttons,
                  bookingData: bookingData
                });
              }
            }
          }
      
      // Store the collected detail
      if (!bookingData.collectedDetails) {
        bookingData.collectedDetails = {};
      }
      bookingData.collectedDetails[field] = userInput;
      
      // Move to next field
      if (field === 'name') {
        responseText = `Great! Now let's get your email.\n\n**Step 2:** What's your email address?`;
        buttons = [
          { title: "Cancel", payload: "cancel_booking" }
        ];
        bookingData.step = 'collecting_email';
        bookingData.currentField = 'email';
      } else if (field === 'email') {
        responseText = `Perfect! Now let's get your birth date.\n\n**Step 3:** What's your birth date? (Required - YYYY-MM-DD)`;
        buttons = [
          { title: "Cancel", payload: "cancel_booking" }
        ];
        bookingData.step = 'collecting_birth_date';
        bookingData.currentField = 'birthDate';
      } else if (field === 'birthDate') {
        responseText = `Excellent! Now let's get your birth place.\n\n**Step 4:** What's your birth place? (Required - City, Country)`;
        buttons = [
          { title: "Cancel", payload: "cancel_booking" }
        ];
        bookingData.step = 'collecting_birth_place';
        bookingData.currentField = 'birthPlace';
      } else if (field === 'birthPlace') {
        responseText = `Great! Now let's get your question.\n\n**Step 5:** What would you like to explore in your reading? (Required)`;
        buttons = [
          { title: "Cancel", payload: "cancel_booking" }
        ];
        bookingData.step = 'collecting_question';
        bookingData.currentField = 'question';
      } else if (field === 'question') {
        responseText = `Perfect! Now let's get your country.\n\n**Step 6:** What's your country? (Required)`;
        buttons = [
          { title: "Cancel", payload: "cancel_booking" }
        ];
        bookingData.step = 'collecting_country';
        bookingData.currentField = 'country';
      } else if (field === 'country') {
        // Get country code and show phone format
        const countryCode = getCountryCode(userInput);
        const phoneFormat = getPhoneFormat(userInput);
        
        responseText = `Great! Now let's get your phone number.\n\n**Step 6:** What's your phone number? (Required)\n\nCountry: ${userInput}\nCountry Code: ${countryCode}\nFormat: ${phoneFormat}`;
        buttons = [
          { title: "Cancel", payload: "cancel_booking" }
        ];
        bookingData.step = 'collecting_phone';
        bookingData.currentField = 'phone';
      } else if (field === 'phone') {
        responseText = `Great! Now let's get your birth time.\n\n**Step 7:** What's your birth time? (Required - HH:MM)`;
        buttons = [
          { title: "Cancel", payload: "cancel_booking" }
        ];
        bookingData.step = 'collecting_birth_time';
        bookingData.currentField = 'birthTime';
      } else if (field === 'birthTime') {
        responseText = `Excellent! Now let's choose your language.\n\n**Step 8:** What language would you prefer? (en/es)`;
        buttons = [
          { title: "English", payload: "set_language_en" },
          { title: "Español", payload: "set_language_es" },
          { title: "Cancel", payload: "cancel_booking" }
        ];
        bookingData.step = 'collecting_language';
        bookingData.currentField = 'language';
      } else if (field === 'specialRequests') {
        responseText = `Perfect! I have all your details. Let me create your booking...`;
        buttons = [
          { title: "Cancel", payload: "cancel_booking" }
        ];
        bookingData.step = 'completing_booking';
      }
    }

    // Step 5: Default booking guidance for any other intents
    if (buttons.length === 0 && !bookingData) {
      responseText = "I'm here to help! Jose Garfias, our astrology consultant, is amazing at giving personalized insights. He's really good at making everything clear and meaningful. Want to book a session with him?";
      buttons = [
        { title: "Book with Jose", payload: "book_reading" },
        { title: "View Packages", payload: "view_packages" },
        { title: "Ask Questions", payload: "ask_questions" }
      ];
    }

    return NextResponse.json({
      success: true,
      response: responseText,
      intent: intent,
      confidence: confidence,
      entities: rasaData.entities || [],
      buttons: buttons,
      bookingData: bookingData
    });

  } catch (error) {
    console.error('Simple chat error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Sorry, there was an error processing your message. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
