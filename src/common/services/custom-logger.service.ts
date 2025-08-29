import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { createCategoryLogger } from 'src/config/logger.config';

export interface BufferTimelineLogData {
  action: string;
  login?: string;
  duration?: number;
  error?: string;
  metadata?: any;
}

export interface JobLogData {
  jobName: string;
  operation: string;
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  details?: {
    trigger?: string;
    duration_ms?: number;
    buffer_size?: number;
    total_accounts?: number;
    processed_count?: number;
    updated_count?: number;
    skipped_count?: number;
    failed_count?: number;
    validation_count?: number;
    error_count?: number;
    dirty_accounts?: number;
    browser_status?: boolean;
    browser_deleted?: boolean;
    timezone?: string;
    error?: string;
    [key: string]: any;
  };
}

export interface ModuleLogData {
  moduleName: string;
  action?: string;
  userId?: string;
  requestId?: string;
  error?: string;
  metadata?: any;
}

@Injectable()
export class CustomLoggerService {
  private bufferTimelineLogger: Logger;
  private jobsLogger: Logger;
  private modulesLogger: Logger;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {
    // Crear loggers específicos para categorías
    this.bufferTimelineLogger = createCategoryLogger('buffer-timeline');
    this.jobsLogger = createCategoryLogger('jobs');
    this.modulesLogger = createCategoryLogger('modules');
  }

  // ========== LOGS GENERALES ==========
  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  // ========== LOGS ESPECÍFICOS PARA JOBS ==========
  logJob(data: JobLogData, message?: string) {
    const logMessage = message || `${data.operation} - ${data.status}`;
    const logData = {
      job: data.jobName,
      category: 'job',
      operation: data.operation,
      status: data.status,
      details: data.details || {}
    };

    if (data.status === 'failed' && data.details?.error) {
      this.logger.error(`[JOB:${data.jobName}] ${logMessage}`, { 
        ...logData, 
        error: data.details.error 
      });
      this.jobsLogger.error(logMessage, { ...logData, error: data.details.error });
    } else {
      this.logger.info(`[JOB:${data.jobName}] ${logMessage}`, logData);
      this.jobsLogger.info(logMessage, logData);
    }
  }

  logJobStart(jobName: string, message?: string) {
    const msg = message || 'Job started';
    this.logJob({ jobName, operation: 'START', status: 'started' }, msg);
  }

  logJobEnd(jobName: string, duration: number, recordsProcessed?: number, message?: string) {
    const msg = message || 'Job completed';
    this.logJob({
      jobName,
      operation: 'END',
      status: 'completed',
      details: {
        duration_ms: duration,
        processed_count: recordsProcessed
      }
    }, msg);
  }

  logJobError(jobName: string, error: string, message?: string) {
    const msg = message || 'Job failed';
    this.logJob({ 
      jobName, 
      operation: 'ERROR', 
      status: 'failed',
      details: { error }
    }, msg);
  }

  // ========== LOGS ESPECÍFICOS PARA MÓDULOS ==========
  logModule(data: ModuleLogData, message: string) {
    const logData = {
      module: data.moduleName,
      category: 'module',
      action: data.action,
      userId: data.userId,
      requestId: data.requestId,
      metadata: data.metadata
    };

    if (data.error) {
      this.logger.error(`[MODULE:${data.moduleName}] ${message}`, { 
        ...logData, 
        error: data.error 
      });
      this.modulesLogger.error(message, { ...logData, error: data.error });
    } else {
      this.logger.info(`[MODULE:${data.moduleName}] ${message}`, logData);
      this.modulesLogger.info(message, logData);
    }
  }

  // ========== BUFFER TIMELINE LOGS (LIGERO Y EFECTIVO) ==========
  logBufferTimeline(jobName: string, data: BufferTimelineLogData, message: string) {
    const timelineData = {
      job: jobName,
      action: data.action,
      login: data.login,
      duration: data.duration,
      error: data.error,
      metadata: data.metadata
    };

    if (data.error) {
      this.bufferTimelineLogger.error(message, timelineData);
    } else {
      this.bufferTimelineLogger.info(message, timelineData);
    }
  }

  // Métodos específicos para buffer operations
  logBufferLoad(jobName: string, accountsLoaded: number, duration: number) {
    this.logBufferTimeline(jobName, {
      action: 'LOAD',
      duration,
      metadata: { accountsLoaded }
    }, `Loaded ${accountsLoaded} accounts into buffer`);
  }

  logBufferFlush(jobName: string, accountsFlushed: number, duration: number) {
    this.logBufferTimeline(jobName, {
      action: 'FLUSH',
      duration,
      metadata: { accountsFlushed }
    }, `Flushed ${accountsFlushed} accounts from buffer`);
  }

  logBufferUpdate(jobName: string, login: string, duration: number) {
    this.logBufferTimeline(jobName, {
      action: 'UPDATE',
      login,
      duration
    }, `Updated account data`);
  }

  logBufferError(jobName: string, login: string, error: string, action: string) {
    this.logBufferTimeline(jobName, {
      action: action.toUpperCase(),
      login,
      error
    }, `Buffer operation failed`);
  }

  logBufferDataExtraction(jobName: string, login: string, duration: number, success: boolean) {
    if (success) {
      this.logBufferTimeline(jobName, {
        action: 'EXTRACT',
        login,
        duration
      }, `Data extracted successfully`);
    } else {
      this.logBufferTimeline(jobName, {
        action: 'EXTRACT',
        login,
        duration,
        error: 'Extraction failed'
      }, `Data extraction failed`);
    }
  }

  // ========== MÉTODOS DE CONVENIENCIA ==========
  
  // Para jobs de buffer específicos
  logBufferLoaderJob(message: string, data?: any) {
    this.logJob({ 
      jobName: 'BufferLoader', 
      operation: 'buffer_load', 
      status: 'in_progress' 
    }, message);
    if (data) {
      this.logBufferTimeline('BufferLoader', { action: 'PROCESS' }, message);
    }
  }

  logFlushBufferJob(message: string, data?: any) {
    this.logJob({ 
      jobName: 'FlushBuffer', 
      operation: 'buffer_flush', 
      status: 'in_progress' 
    }, message);
    if (data) {
      this.logBufferTimeline('FlushBuffer', { action: 'PROCESS' }, message);
    }
  }

  logBrokeretDataExtractorJob(message: string, data?: any) {
    this.logJob({ 
      jobName: 'BrokeretDataExtractor', 
      operation: 'data_extraction', 
      status: 'in_progress' 
    }, message);
    if (data) {
      this.logBufferTimeline('BrokeretDataExtractor', { action: 'PROCESS' }, message);
    }
  }

  // Para módulos específicos
  logAuthModule(message: string, userId?: string, action?: string) {
    this.logModule({ 
      moduleName: 'Auth', 
      userId, 
      action 
    }, message);
  }

  logChallengesModule(message: string, action?: string, metadata?: any) {
    this.logModule({ 
      moduleName: 'Challenges', 
      action, 
      metadata 
    }, message);
  }

  logBrokerAccountsModule(message: string, action?: string, metadata?: any) {
    this.logModule({ 
      moduleName: 'BrokerAccounts', 
      action, 
      metadata 
    }, message);
  }
}