/**
 * PolicySphere OpenAPI 3.0.0 Specification
 * Full documentation for all 22+ enterprise insurance microservice modules.
 */

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'PolicySphere Enterprise Insurance Marketplace API',
    version: '1.0.0',
    description: `
**PolicySphere** is a cloud-native, high-throughput digital insurance marketplace API.
Complies with IRDAI guidelines, DPDP Act 2023, ISO 27001, and OpenAPI 3.0 standards.

### Supported Capabilities
- **Authentication & RBAC**: JWT Access & Refresh tokens, Cookie authentication, Role Guards
- **Policy Catalog & Quotes**: Real-time quote engine, Multi-insurer policy comparison
- **Proposals & Underwriting**: Digital proposal wizard, automated medical underwriting
- **Claims Lifecycle**: Incident filing, document verification, TPA cashless pre-auth GOP
- **Payment Gateway**: Multi-provider routing, Idempotency-Key support, financial reconciliation
- **Enterprise CRM & Support**: 6-stage sales pipeline, SLA breach engine, SphereSupport AI
- **Executive Reporting**: 10 domain reports, IRDAI Form 80D Tax Certificates, CSV/JSON export
- **Super Admin Governance**: Full RBAC directory, promotional coupons, forensic audit trail
- **Corporate & Group Insurance**: GMC/GPA/GTL master policies, bulk CSV roster ingestion, digital e-Cards
- **Partner Insurer Ecosystem**: Actuarial product guidelines, claims adjudication, financial remittance
    `,
    contact: {
      name: 'PolicySphere Developer Operations',
      email: 'api-support@policysphere.com',
      url: 'http://localhost:5173/developers',
    },
    license: {
      name: 'Proprietary - PolicySphere Enterprise',
      url: 'https://policysphere.com/terms',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Local Development Server',
    },
    {
      url: 'https://api.policysphere.com/v1',
      description: 'Production Multi-Region Cluster',
    },
  ],
  tags: [
    { name: 'Health & Diagnostics', description: 'System health checks, uptime, and SLA probes' },
    { name: 'Authentication', description: 'User login, registration, token refresh, and logout' },
    { name: 'Customer Profile', description: 'Personal information, KYC records, and nominee setup' },
    { name: 'Policies & Marketplace', description: 'Browse insurance catalog, policy details, and purchase' },
    { name: 'Quotes & Comparison', description: 'Dynamic age/lifestyle quote engine & side-by-side comparison' },
    { name: 'Proposals & Underwriting', description: 'Multi-stage proposal wizard & medical risk scoring' },
    { name: 'Claims Management', description: 'Cashless & reimbursement claims filing and evidence upload' },
    { name: 'Payment Gateway', description: 'Checkout processing, idempotency support, and reconciliation' },
    { name: 'Notifications', description: 'Multi-channel dispatches (Email, SMS, WhatsApp, Web Push, In-App)' },
    { name: 'AI & Smart Advisor', description: 'AI policy recommendation, premium prediction, and fraud detection' },
    { name: 'Search Engine', description: 'Sub-millisecond full-text search, auto-complete, and semantic AI' },
    { name: 'CRM & Sales', description: 'Enterprise sales pipeline, lead scoring, dialer, and meetings' },
    { name: 'Support & Helpdesk', description: 'Omnichannel tickets, knowledge base, and SLA escalation' },
    { name: 'Executive Reporting', description: '10 domain analytics reports, Form 80D tax certificates' },
    { name: 'Governance & RBAC', description: 'Super Admin control center, audit logs, and coupon engine' },
    { name: 'Corporate & Group', description: 'Corporate employee benefits, bulk census CSV, and e-Cards' },
    { name: 'Insurer Ecosystem', description: 'Partner insurer portal, actuarial rules, and claims desk' },
    { name: 'Performance & SLA', description: 'Microsecond latency telemetry, SLA adherence, and cache hit metrics' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health & Diagnostics'],
        summary: 'Service Health Check Probe',
        description: 'Returns API health status, server uptime, and timestamp.',
        responses: {
          200: {
            description: 'API is healthy and operational',
            content: {
              'application/json': {
                example: { status: 'ok', service: 'PolicySphere API', timestamp: '2026-09-23T10:00:00.000Z' },
              },
            },
          },
        },
      },
    },
    '/performance/sla': {
      get: {
        tags: ['Performance & SLA'],
        summary: 'Get Real-Time SLA & Latency Telemetry',
        description: 'Returns p50, p95, p99 latency percentiles, total requests, cache hit rate, and SLA compliance.',
        responses: {
          200: {
            description: 'SLA telemetry metrics payload',
            content: {
              'application/json': {
                example: {
                  success: true,
                  slaCompliancePercent: 99.4,
                  metrics: { totalRequests: 1420, p50Ms: 12, p95Ms: 48, p99Ms: 142 },
                  cache: { hitRatePercent: 86.5, hits: 1230, misses: 190 },
                },
              },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register New User Account',
        description: 'Creates a new user profile with CUSTOMER, ADVISOR, or ADMIN role.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', minLength: 8, example: 'SecurePassword123!' },
                  firstName: { type: 'string', example: 'John' },
                  lastName: { type: 'string', example: 'Doe' },
                  phone: { type: 'string', example: '+919876543210' },
                  role: { type: 'string', enum: ['CUSTOMER', 'ADVISOR', 'ADMIN'], default: 'CUSTOMER' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User successfully registered' },
          409: { description: 'Email address already registered' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Authenticate User & Issue Tokens',
        description: 'Validates email and password, returns JWT access token and sets secure refresh cookie.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'john.doe@example.com' },
                  password: { type: 'string', example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated successfully' },
          401: { description: 'Invalid email or password' },
        },
      },
    },
    '/policies': {
      get: {
        tags: ['Policies & Marketplace'],
        summary: 'List Available Insurance Policies',
        description: 'Fetches active policies with category, provider, and price sorting filters (cached <200ms SLA).',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' }, example: 'HEALTH' },
          { name: 'provider', in: 'query', schema: { type: 'string' }, example: 'Star Health' },
          { name: 'maxBudget', in: 'query', schema: { type: 'number' }, example: 25000 },
        ],
        responses: {
          200: { description: 'List of matching insurance plans' },
        },
      },
    },
    '/quotes/calculate': {
      post: {
        tags: ['Quotes & Comparison'],
        summary: 'Calculate Dynamic Insurance Quote',
        description: 'Calculates actuarial premium quote based on age, gender, sum insured, lifestyle, and NCB discounts.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['policyId', 'age', 'sumInsured'],
                properties: {
                  policyId: { type: 'string' },
                  age: { type: 'integer', example: 34 },
                  isSmoker: { type: 'boolean', example: false },
                  sumInsured: { type: 'number', example: 1000000 },
                  cityTier: { type: 'string', enum: ['TIER_1', 'TIER_2', 'TIER_3'], example: 'TIER_1' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Itemized premium breakdown with GST' },
        },
      },
    },
    '/payments/checkout': {
      post: {
        tags: ['Payment Gateway'],
        summary: 'Process Policy Premium Payment',
        description: 'Atomic checkout creating policy subscription and payment transaction record. Supports Idempotency-Key.',
        parameters: [
          {
            name: 'Idempotency-Key',
            in: 'header',
            required: false,
            schema: { type: 'string' },
            description: 'Unique client token preventing duplicate charges upon network retries.',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['policyId', 'paymentMethod'],
                properties: {
                  policyId: { type: 'string' },
                  paymentMethod: { type: 'string', enum: ['CARD', 'UPI', 'NET_BANKING'] },
                  couponCode: { type: 'string', example: 'FESTIVE15' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Payment authorized and policy issued' },
          409: { description: 'Idempotency conflict - duplicate transaction' },
        },
      },
    },
    '/claims': {
      get: {
        tags: ['Claims Management'],
        summary: 'Get Customer Filed Claims',
        responses: {
          200: { description: 'List of filed claims with real-time status' },
        },
      },
      post: {
        tags: ['Claims Management'],
        summary: 'Submit New Insurance Claim',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userPolicyId', 'claimType', 'claimAmount', 'incidentDate', 'description'],
                properties: {
                  userPolicyId: { type: 'string' },
                  claimType: { type: 'string', enum: ['HEALTH_CASHLESS', 'HEALTH_REIMBURSEMENT', 'MOTOR_ACCIDENT', 'LIFE_DEATH'] },
                  claimAmount: { type: 'number', example: 75000 },
                  incidentDate: { type: 'string', format: 'date-time' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Claim filed and assigned to reviewer' },
        },
      },
    },
    '/insurer/v1/policy/bind': {
      post: {
        tags: ['Insurer Ecosystem'],
        summary: 'Open Insurance B2B Policy Binding API',
        description: 'Machine-to-machine instant policy binding for certified partner insurers.',
        responses: {
          200: { description: 'Policy bound successfully with unique policy number' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
      },
      IdempotencyHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'Idempotency-Key',
      },
    },
  },
};

module.exports = swaggerSpec;
