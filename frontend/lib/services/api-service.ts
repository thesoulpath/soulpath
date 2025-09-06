import axios, { AxiosResponse } from 'axios';
import { APICallResult, IntentActionMapping, OrchestratorConfig } from '@/lib/types/conversational-orchestrator';

export class APIService {
  private config: OrchestratorConfig['apis'];
  private baseUrl: string;
  private intentActionMapping: IntentActionMapping;

  constructor(config: OrchestratorConfig['apis'], intentActionMapping: IntentActionMapping) {
    this.config = config;
    this.baseUrl = config.baseUrl;
    this.intentActionMapping = intentActionMapping;
  }

  /**
   * Ejecuta una acción basada en la intención detectada
   */
  async executeAction(
    intent: string,
    entities: Record<string, any>,
    userId: string
  ): Promise<APICallResult[]> {
    const actionConfig = this.intentActionMapping[intent];
    
    if (!actionConfig) {
      return [{
        success: false,
        error: `No action mapping found for intent: ${intent}`,
        statusCode: 404
      }];
    }

    const results: APICallResult[] = [];

    try {
      // Validar entidades requeridas
      if (actionConfig.requiredEntities) {
        const missingEntities = actionConfig.requiredEntities.filter(
          entity => !entities[entity]
        );
        
        if (missingEntities.length > 0) {
          return [{
            success: false,
            error: `Missing required entities: ${missingEntities.join(', ')}`,
            statusCode: 400
          }];
        }
      }

      // Ejecutar la acción específica
      switch (actionConfig.action) {
        case 'consultar_estado':
          results.push(await this.consultarEstado(entities, userId));
          break;
        case 'agendar_cita':
          results.push(await this.agendarCita(entities, userId));
          break;
        case 'consultar_paquetes':
          results.push(await this.consultarPaquetes(entities, userId));
          break;
        case 'pagar_servicio':
          results.push(await this.pagarServicio(entities, userId));
          break;
        case 'cancelar_cita':
          results.push(await this.cancelarCita(entities, userId));
          break;
        case 'consultar_historial':
          results.push(await this.consultarHistorial(entities, userId));
          break;
        case 'consultar_horarios':
          results.push(await this.consultarHorarios(entities, userId));
          break;
        case 'actualizar_perfil':
          results.push(await this.actualizarPerfil(entities, userId));
          break;
        default:
          results.push({
            success: false,
            error: `Unknown action: ${actionConfig.action}`,
            statusCode: 400
          });
      }

      return results;
    } catch (error) {
      console.error(`Error executing action ${actionConfig.action}:`, error);
      return [{
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500
      }];
    }
  }

  /**
   * Consulta el estado de una solicitud o cita
   */
  private async consultarEstado(entities: Record<string, any>, _userId: string): Promise<APICallResult> {
    try {
      const { solicitud_id, cita_id, email } = entities;
      
      let endpoint = '';
      const params: any = {};

      if (solicitud_id) {
        endpoint = '/admin/bookings';
        params.id = solicitud_id;
      } else if (cita_id) {
        endpoint = '/client/bookings';
        params.id = cita_id;
      } else if (email) {
        endpoint = '/client/my-bookings';
        params.email = email;
      } else {
        return {
          success: false,
          error: 'No se especificó ID de solicitud, cita o email',
          statusCode: 400
        };
      }

      const response = await this.makeAPICall('GET', endpoint, params);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error consultando estado',
        statusCode: 500
      };
    }
  }

  /**
   * Agenda una nueva cita
   */
  private async agendarCita(entities: Record<string, any>, _userId: string): Promise<APICallResult> {
    try {
      const { fecha, hora, tipo_sesion, paquete_id, email } = entities;

      if (!fecha || !hora || !email) {
        return {
          success: false,
          error: 'Faltan datos requeridos: fecha, hora o email',
          statusCode: 400
        };
      }

      const bookingData = {
        clientEmail: email,
        userPackageId: paquete_id || null,
        sessionDate: fecha,
        sessionTime: hora,
        sessionType: tipo_sesion || 'individual',
        groupSize: entities.tamaño_grupo || 1,
        notes: entities.notas || ''
      };

      const response = await this.makeAPICall('POST', '/booking', bookingData);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error agendando cita',
        statusCode: 500
      };
    }
  }

  /**
   * Consulta paquetes disponibles
   */
  private async consultarPaquetes(entities: Record<string, any>, _userId: string): Promise<APICallResult> {
    try {
      const { tipo_paquete, moneda, duración } = entities;
      
      const params: any = {};
      if (tipo_paquete) params.packageType = tipo_paquete;
      if (moneda) params.currency = moneda;
      if (duración) params.duration = duración;

      const response = await this.makeAPICall('GET', '/packages', params);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error consultando paquetes',
        statusCode: 500
      };
    }
  }

  /**
   * Procesa un pago
   */
  private async pagarServicio(entities: Record<string, any>, _userId: string): Promise<APICallResult> {
    try {
      const { monto, método_pago, cita_id, paquete_id, email } = entities;

      if (!monto || !método_pago || !email) {
        return {
          success: false,
          error: 'Faltan datos requeridos: monto, método de pago o email',
          statusCode: 400
        };
      }

      const paymentData = {
        clientEmail: email,
        amount: parseFloat(monto),
        currencyCode: entities.moneda || 'USD',
        paymentMethod: método_pago,
        userPackageId: paquete_id || null,
        groupBookingId: cita_id || null,
        notes: entities.notas || ''
      };

      const response = await this.makeAPICall('POST', '/client/purchase', paymentData);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error procesando pago',
        statusCode: 500
      };
    }
  }

  /**
   * Cancela una cita
   */
  private async cancelarCita(entities: Record<string, any>, _userId: string): Promise<APICallResult> {
    try {
      const { cita_id, email } = entities;

      if (!cita_id || !email) {
        return {
          success: false,
          error: 'Faltan datos requeridos: ID de cita o email',
          statusCode: 400
        };
      }

      const updateData = {
        status: 'cancelled',
        notes: entities.motivo || 'Cancelada por el usuario'
      };

      const response = await this.makeAPICall('PUT', `/client/bookings/${cita_id}`, updateData);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error cancelando cita',
        statusCode: 500
      };
    }
  }

  /**
   * Consulta el historial del usuario
   */
  private async consultarHistorial(entities: Record<string, any>, _userId: string): Promise<APICallResult> {
    try {
      const { email, tipo_historial, fecha_desde, fecha_hasta } = entities;

      if (!email) {
        return {
          success: false,
          error: 'Email requerido para consultar historial',
          statusCode: 400
        };
      }

      const params: any = { email };
      if (tipo_historial) params.type = tipo_historial;
      if (fecha_desde) params.dateFrom = fecha_desde;
      if (fecha_hasta) params.dateTo = fecha_hasta;

      const response = await this.makeAPICall('GET', '/client/purchase-history', params);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error consultando historial',
        statusCode: 500
      };
    }
  }

  /**
   * Consulta horarios disponibles
   */
  private async consultarHorarios(entities: Record<string, any>, _userId: string): Promise<APICallResult> {
    try {
      const { fecha, duración, tipo_sesion } = entities;

      const params: any = {};
      if (fecha) params.date = fecha;
      if (duración) params.duration = duración;
      if (tipo_sesion) params.sessionType = tipo_sesion;

      const response = await this.makeAPICall('GET', '/schedule-slots', params);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error consultando horarios',
        statusCode: 500
      };
    }
  }

  /**
   * Actualiza el perfil del usuario
   */
  private async actualizarPerfil(entities: Record<string, any>, _userId: string): Promise<APICallResult> {
    try {
      const { email, nombre, teléfono, fecha_nacimiento, lugar_nacimiento } = entities;

      if (!email) {
        return {
          success: false,
          error: 'Email requerido para actualizar perfil',
          statusCode: 400
        };
      }

      const updateData: any = {};
      if (nombre) updateData.name = nombre;
      if (teléfono) updateData.phone = teléfono;
      if (fecha_nacimiento) updateData.birthDate = fecha_nacimiento;
      if (lugar_nacimiento) updateData.birthPlace = lugar_nacimiento;

      const response = await this.makeAPICall('PUT', '/client/me', updateData);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error actualizando perfil',
        statusCode: 500
      };
    }
  }

  /**
   * Realiza una llamada genérica a la API
   */
  private async makeAPICall(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    retries: number = 0
  ): Promise<APICallResult> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const config: any = {
        method,
        url,
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        config.data = data;
      } else if (data && method === 'GET') {
        config.params = data;
      }

      const response: AxiosResponse = await axios(config);

      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error) {
      if (retries < this.config.retries) {
        console.log(`API call failed, retrying... (${retries + 1}/${this.config.retries})`);
        await this.delay(1000 * (retries + 1)); // Exponential backoff
        return this.makeAPICall(method, endpoint, data, retries + 1);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown API error',
        statusCode: (error as any).response?.status || 500
      };
    }
  }

  /**
   * Delay helper para retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Verifica el estado de salud de las APIs
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeAPICall('GET', '/health');
      return response.success;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }
}
