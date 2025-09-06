-- Seed email_templates table with default templates
INSERT INTO email_templates (template_key, language, subject, body) VALUES
('purchaseConfirmation', 'en', 'Purchase Confirmation - SOULPATH', 
'<h2>Thank you for your purchase!</h2>
<p>Dear {{clientName}},</p>
<p>Your purchase has been confirmed successfully.</p>
<p><strong>Package:</strong> {{packageName}}<br>
<strong>Quantity:</strong> {{quantity}}<br>
<strong>Total Amount:</strong> {{totalAmount}} {{currency}}</p>
<p>You can now book your sessions through your client portal.</p>
<p>Best regards,<br>SOULPATH Team</p>'),

('purchaseConfirmation', 'es', 'Confirmación de Compra - SOULPATH',
'<h2>¡Gracias por tu compra!</h2>
<p>Estimado/a {{clientName}},</p>
<p>Tu compra ha sido confirmada exitosamente.</p>
<p><strong>Paquete:</strong> {{packageName}}<br>
<strong>Cantidad:</strong> {{quantity}}<br>
<strong>Monto Total:</strong> {{totalAmount}} {{currency}}</p>
<p>Ahora puedes reservar tus sesiones a través de tu portal de cliente.</p>
<p>Saludos cordiales,<br>Equipo SOULPATH</p>'),

('bookingConfirmation', 'en', 'Booking Confirmation - SOULPATH',
'<h2>Your session has been booked!</h2>
<p>Dear {{clientName}},</p>
<p>Your session has been successfully scheduled.</p>
<p><strong>Date:</strong> {{sessionDate}}<br>
<strong>Time:</strong> {{sessionTime}}<br>
<strong>Type:</strong> {{sessionType}}</p>
<p>We look forward to seeing you!</p>
<p>Best regards,<br>SOULPATH Team</p>'),

('bookingConfirmation', 'es', 'Confirmación de Reserva - SOULPATH',
'<h2>¡Tu sesión ha sido reservada!</h2>
<p>Estimado/a {{clientName}},</p>
<p>Tu sesión ha sido programada exitosamente.</p>
<p><strong>Fecha:</strong> {{sessionDate}}<br>
<strong>Hora:</strong> {{sessionTime}}<br>
<strong>Tipo:</strong> {{sessionType}}</p>
<p>¡Esperamos verte!</p>
<p>Saludos cordiales,<br>Equipo SOULPATH</p>')

ON CONFLICT (template_key, language) DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  updated_at = NOW();
