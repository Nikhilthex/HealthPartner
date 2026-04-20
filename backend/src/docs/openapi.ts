export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Health Partner API',
    version: '1.0.0',
    description: 'Backend API documentation for medicines, alerts, reminders, and reports.'
  },
  servers: [
    {
      url: '/api',
      description: 'Relative API base path'
    }
  ],
  tags: [
    { name: 'Health' },
    { name: 'Medicines' },
    { name: 'Alerts' },
    { name: 'Reminders' },
    { name: 'Reports' }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Service is healthy'
          }
        }
      }
    },
    '/medicines': {
      get: {
        tags: ['Medicines'],
        summary: 'List medicines',
        parameters: [
          {
            name: 'includeInactive',
            in: 'query',
            schema: { type: 'boolean' }
          }
        ],
        responses: {
          '200': {
            description: 'Medicine list',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/MedicinesListResponse'
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Medicines'],
        summary: 'Create medicine',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateMedicineRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Medicine created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MedicineResponse' }
              }
            }
          },
          '422': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/medicines/{id}': {
      get: {
        tags: ['Medicines'],
        summary: 'Get medicine by id',
        parameters: [{ $ref: '#/components/parameters/IdPathParam' }],
        responses: {
          '200': {
            description: 'Medicine detail',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MedicineResponse' }
              }
            }
          },
          '404': {
            description: 'Not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      put: {
        tags: ['Medicines'],
        summary: 'Update medicine',
        parameters: [{ $ref: '#/components/parameters/IdPathParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateMedicineRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Medicine updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MedicineResponse' }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Medicines'],
        summary: 'Archive medicine',
        parameters: [{ $ref: '#/components/parameters/IdPathParam' }],
        responses: {
          '200': {
            description: 'Medicine archived'
          }
        }
      }
    },
    '/medicines/{id}/intake': {
      post: {
        tags: ['Medicines'],
        summary: 'Log medicine intake',
        parameters: [{ $ref: '#/components/parameters/IdPathParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/IntakeRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Intake logged',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/IntakeResponse' }
              }
            }
          }
        }
      }
    },
    '/alert-settings': {
      get: {
        tags: ['Alerts'],
        summary: 'Get alert settings',
        responses: {
          '200': {
            description: 'Alert settings',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AlertSettingsResponse' }
              }
            }
          }
        }
      },
      put: {
        tags: ['Alerts'],
        summary: 'Update alert settings',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AlertSettings' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Updated alert settings',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AlertSettingsResponse' }
              }
            }
          }
        }
      }
    },
    '/reminders/due': {
      get: {
        tags: ['Reminders'],
        summary: 'Get due reminders',
        parameters: [
          {
            name: 'now',
            in: 'query',
            schema: { type: 'string', format: 'date-time' }
          },
          {
            name: 'windowMinutes',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 15 }
          }
        ],
        responses: {
          '200': {
            description: 'Due reminders',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DueRemindersResponse' }
              }
            }
          }
        }
      }
    },
    '/reminders/{id}/acknowledge': {
      post: {
        tags: ['Reminders'],
        summary: 'Acknowledge reminder',
        parameters: [{ $ref: '#/components/parameters/IdPathParam' }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  acknowledgedAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Reminder acknowledged'
          }
        }
      }
    },
    '/reminders/{id}/dismiss': {
      post: {
        tags: ['Reminders'],
        summary: 'Dismiss reminder',
        parameters: [{ $ref: '#/components/parameters/IdPathParam' }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  dismissedAt: { type: 'string', format: 'date-time' },
                  reason: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Reminder dismissed'
          }
        }
      }
    },
    '/reports/upload': {
      post: {
        tags: ['Reports'],
        summary: 'Upload report file',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['reportFile'],
                properties: {
                  reportFile: {
                    type: 'string',
                    format: 'binary'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Report uploaded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ReportResponse' }
              }
            }
          }
        }
      }
    },
    '/reports': {
      get: {
        tags: ['Reports'],
        summary: 'List reports',
        responses: {
          '200': {
            description: 'Reports list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ReportsListResponse' }
              }
            }
          }
        }
      }
    },
    '/reports/{id}': {
      get: {
        tags: ['Reports'],
        summary: 'Get report metadata',
        parameters: [{ $ref: '#/components/parameters/IdPathParam' }],
        responses: {
          '200': {
            description: 'Report metadata',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ReportResponse' }
              }
            }
          }
        }
      }
    },
    '/reports/{id}/analyze': {
      post: {
        tags: ['Reports'],
        summary: 'Analyze uploaded report',
        parameters: [{ $ref: '#/components/parameters/IdPathParam' }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  analysisMode: { type: 'string', enum: ['sync'] }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Analysis completed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AnalyzeResponse' }
              }
            }
          }
        }
      }
    },
    '/reports/{id}/analysis': {
      get: {
        tags: ['Reports'],
        summary: 'Get report analysis',
        parameters: [{ $ref: '#/components/parameters/IdPathParam' }],
        responses: {
          '200': {
            description: 'Report analysis',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ReportAnalysisResponse' }
              }
            }
          }
        }
      }
    }
  },
  components: {
    parameters: {
      IdPathParam: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'integer', minimum: 1 }
      }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      },
      MedicineSchedule: {
        type: 'object',
        properties: {
          slot: { type: 'string', enum: ['morning', 'noon', 'evening'] },
          enabled: { type: 'boolean' },
          doseTime: { type: 'string', example: '08:00' },
          qty: { type: 'number' }
        }
      },
      Medicine: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          rxName: { type: 'string' },
          daysOfSupply: { type: 'integer' },
          totalAvailableQty: { type: 'number' },
          remainingQty: { type: 'number' },
          dailyQtyPlanned: { type: 'number' },
          estimatedDepletionDate: { type: 'string', nullable: true },
          notes: { type: 'string', nullable: true },
          schedules: {
            type: 'array',
            items: { $ref: '#/components/schemas/MedicineSchedule' }
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      CreateMedicineRequest: {
        type: 'object',
        required: ['rxName', 'daysOfSupply', 'totalAvailableQty', 'schedules'],
        properties: {
          rxName: { type: 'string' },
          daysOfSupply: { type: 'integer', minimum: 1 },
          totalAvailableQty: { type: 'number', minimum: 0.01 },
          notes: { type: 'string' },
          schedules: {
            type: 'array',
            items: { $ref: '#/components/schemas/MedicineSchedule' }
          }
        }
      },
      UpdateMedicineRequest: {
        allOf: [{ $ref: '#/components/schemas/CreateMedicineRequest' }],
        properties: {
          remainingQty: { type: 'number', minimum: 0 }
        }
      },
      MedicinesListResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Medicine' }
          }
        }
      },
      MedicineResponse: {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/Medicine' }
        }
      },
      IntakeRequest: {
        type: 'object',
        required: ['reminderEventId', 'qtyTaken', 'takenAt'],
        properties: {
          reminderEventId: { type: 'integer' },
          qtyTaken: { type: 'number' },
          takenAt: { type: 'string', format: 'date-time' }
        }
      },
      IntakeResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              medicineId: { type: 'integer' },
              remainingQty: { type: 'number' },
              reminderEventId: { type: 'integer' },
              reminderStatus: { type: 'string' },
              intakeLogId: { type: 'integer' }
            }
          }
        }
      },
      AlertSettings: {
        type: 'object',
        required: ['morningTime', 'noonTime', 'eveningTime', 'preAlertMinutes', 'onTimeEnabled', 'timezone'],
        properties: {
          morningTime: { type: 'string' },
          noonTime: { type: 'string' },
          eveningTime: { type: 'string' },
          preAlertMinutes: { type: 'integer' },
          onTimeEnabled: { type: 'boolean' },
          timezone: { type: 'string' }
        }
      },
      AlertSettingsResponse: {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/AlertSettings' },
          meta: {
            type: 'object',
            properties: {
              futureRemindersRebuilt: { type: 'boolean' }
            }
          }
        }
      },
      DueReminder: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          medicineId: { type: 'integer' },
          rxName: { type: 'string' },
          slot: { type: 'string' },
          alertType: { type: 'string' },
          doseTime: { type: 'string' },
          qty: { type: 'number' },
          scheduledFor: { type: 'string', format: 'date-time' },
          status: { type: 'string' },
          displayMessage: { type: 'string' }
        }
      },
      DueRemindersResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/DueReminder' }
          },
          meta: {
            type: 'object',
            properties: {
              serverTime: { type: 'string', format: 'date-time' },
              windowMinutes: { type: 'integer' }
            }
          }
        }
      },
      Report: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          originalFilename: { type: 'string' },
          mimeType: { type: 'string' },
          fileSize: { type: 'integer' },
          analysisStatus: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      ReportResponse: {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/Report' }
        }
      },
      ReportsListResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Report' }
          }
        }
      },
      ReportAnalysis: {
        type: 'object',
        properties: {
          reportId: { type: 'integer' },
          summaryLayman: { type: 'string' },
          risks: { type: 'array', items: { type: 'string' } },
          medicineSuggestions: { type: 'array', items: { type: 'string' } },
          vitaminSuggestions: { type: 'array', items: { type: 'string' } },
          importantNotes: { type: 'array', items: { type: 'string' } },
          disclaimer: { type: 'string' },
          aiModel: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      AnalyzeResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              reportId: { type: 'integer' },
              analysisStatus: { type: 'string' },
              analysis: { $ref: '#/components/schemas/ReportAnalysis' }
            }
          }
        }
      },
      ReportAnalysisResponse: {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/ReportAnalysis' }
        }
      }
    }
  }
} as const;
