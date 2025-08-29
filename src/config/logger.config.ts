import { registerAs } from '@nestjs/config';
import * as winston from 'winston';
import * as path from 'path';
import * as DailyRotateFile from 'winston-daily-rotate-file';

export const loggerConfig = registerAs('logger', () => {
  const logDir = process.env.LOG_DIR || './logs';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Formato base para todos los logs
  const baseFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, context, job, module, category, ...meta }) => {
      let logMessage = `${timestamp} [${level.toUpperCase()}]`;
      
      if (job) logMessage += ` [JOB:${job}]`;
      if (module) logMessage += ` [MODULE:${module}]`;
      if (context) logMessage += ` [${context}]`;
      
      logMessage += `: ${message}`;
      
      if (Object.keys(meta).length > 0) {
        logMessage += ` ${JSON.stringify(meta)}`;
      }
      
      return logMessage;
    })
  );

  // Formato para buffer timeline (más compacto)
  const bufferTimelineFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.printf(({ timestamp, level, message, job, action, login, duration, error, ...meta }) => {
      let logMessage = `${timestamp} [${level.toUpperCase()}] [${job}]`;
      
      if (action) logMessage += ` ${action}`;
      if (login) logMessage += ` login=${login}`;
      if (duration) logMessage += ` duration=${duration}ms`;
      if (error) logMessage += ` ERROR: ${error}`;
      
      logMessage += ` | ${message}`;
      
      return logMessage;
    })
  );

  const transports: winston.transport[] = [];

  // Console para desarrollo
  if (isDevelopment) {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    );
  }

  // Log general de la aplicación
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: baseFormat
    })
  );

  // Log solo para errores
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '10m',
      maxFiles: '30d',
      format: baseFormat
    })
  );

  // Log específico para jobs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'jobs-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '15m',
      maxFiles: '7d',
      format: baseFormat
    })
  );

  // Log específico para módulos
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'modules-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '15m',
      maxFiles: '7d',
      format: baseFormat
    })
  );

  // Log especial para buffer timeline (ligero y efectivo)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'buffer-timeline-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '14d',
      format: bufferTimelineFormat
    })
  );

  return {
    level: process.env.LOG_LEVEL || 'info',
    format: baseFormat,
    transports,
    exitOnError: false
  };
});

// Configuraciones específicas para diferentes categorías
export const createCategoryLogger = (category: string) => {
  const logDir = process.env.LOG_DIR || './logs';
  
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let logMessage = `${timestamp} [${level.toUpperCase()}] [${category.toUpperCase()}]: ${message}`;
        
        if (Object.keys(meta).length > 0) {
          logMessage += ` ${JSON.stringify(meta)}`;
        }
        
        return logMessage;
      })
    ),
    transports: [
      new DailyRotateFile({
        filename: path.join(logDir, `${category}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        maxSize: '10m',
        maxFiles: '7d'
      })
    ]
  });
};