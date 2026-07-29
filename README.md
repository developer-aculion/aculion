# ACULION Platform Monorepo

Clean monorepo workspace organizing ACULION web applications, spatial & traffic microservices, and shared packages.

## Monorepo Folder Structure

```
aculion-platform/
├── apps/
│   ├── web/                    # Main React/Vite platform application
│   ├── location-intelligence/  # Location Intelligence frontend module
│   └── traffic-intelligence/   # Traffic Intelligence frontend module (placeholder)
├── services/
│   ├── location-service/       # FastAPI location & spatial analytics engine
│   ├── traffic-service/        # Traffic telemetry & flow service (placeholder)
│   └── api-gateway/            # Unified API routing gateway (placeholder)
├── packages/
│   ├── ui/                     # Shared design system & UI components (placeholder)
│   ├── maps/                   # Shared geospatial & map components (placeholder)
│   └── config/                 # Shared configurations (placeholder)
├── .gitignore                  # Monorepo git ignore policy
└── README.md                   # Monorepo architecture summary
```
