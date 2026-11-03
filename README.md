# Awning Configurator

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-000000?logo=fastify&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?logo=kubernetes&logoColor=white)
![Argo CD](https://img.shields.io/badge/Argo%20CD-EF7B4D?logo=argo&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?logo=turborepo&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)

A web-based configurator for awnings. Customers choose size, fabric and motor,
see the price in real time and send a request. Built as a monorepo with
independent microservices, test-driven pricing logic and a GitOps deployment
pipeline to Kubernetes.

> Product data and prices are sample data.

## Architecture

```mermaid
flowchart LR
    U[Customer] --> W[web<br/>Next.js]
    W -->|REST| P[product-service<br/>Fastify]
    W -->|REST| O[order-service<br/>Fastify]
    P --> S[(packages/shared<br/>types and pricing)]
    O --> S
    O --> DB[(PostgreSQL)]
```

| Component                  | Responsibility                                                           |
| -------------------------- | ------------------------------------------------------------------------ |
| `apps/web`                 | Configurator UI with live price                                          |
| `services/product-service` | Price calculation and validation via REST API                            |
| `services/order-service`   | Stores customer requests, recalculates the price server-side             |
| `packages/shared`          | Shared TypeScript types and pricing logic, used by all apps and services |

## Key features

- **Monorepo** with pnpm workspaces and Turborepo, including task caching
- **Shared code without duplication:** services import types and logic via `workspace:*`
- **Test-driven pricing logic** with full coverage of surcharges, rounding and validation
- **Money handled in integer cents** to avoid floating point errors
- **Server-side pricing:** prices sent by the client are ignored and recalculated
- **Request validation** with JSON schema (`additionalProperties: false`) before business logic runs
- **Liveness and readiness probes:** readiness returns 503 when the database is down
- **Dependency injection** in the order-service, so tests run with fakes instead of a real database
- **Graceful shutdown** on `SIGTERM`
- **Multi-stage Docker images** running as non-root user
- **GitOps with Argo CD:** the cluster always matches the `k8s/` folder in Git (self-heal enabled)

## API

### product-service (port 4001)

| Method | Endpoint  | Description                                             |
| ------ | --------- | ------------------------------------------------------- |
| `GET`  | `/health` | Health check                                            |
| `POST` | `/price`  | Calculates net, VAT and gross price for a configuration |

```bash
curl -X POST http://localhost:4001/price \
  -H "Content-Type: application/json" \
  -d '{"widthCm":400,"projectionCm":250,"fabricCategory":"B","motor":true}'
```

```json
{ "netCents": 188000, "vatCents": 35720, "grossCents": 223720 }
```

### order-service (port 4002)

| Method | Endpoint        | Description                                           |
| ------ | --------------- | ----------------------------------------------------- |
| `GET`  | `/health`       | Liveness: the process is running                      |
| `GET`  | `/health/ready` | Readiness: database reachable (503 otherwise)         |
| `POST` | `/orders`       | Validates the request, calculates the price, saves it |

```bash
curl -X POST http://localhost:4002/orders \
  -H "Content-Type: application/json" \
  -d '{"widthCm":400,"projectionCm":250,"fabricCategory":"B","motor":true,"customerEmail":"test@example.com"}'
```

## Getting started

### Local development

Requirements: Node.js 22+, pnpm 10+

```bash
pnpm install
pnpm dev     # starts all apps and services in watch mode
pnpm test    # runs all tests across the monorepo
```

### With Docker Compose

Requirements: Docker

```bash
docker compose up -d --build
curl localhost:4001/health
curl localhost:4002/health/ready
```

### On Kubernetes (k3d + Argo CD)

Requirements: Docker, k3d, kubectl

```bash
# Create the cluster and import the images
k3d cluster create markise
docker compose build
docker tag markisen-konfigurator-product-service markise/product-service:v1
docker tag markisen-konfigurator-order-service markise/order-service:v2
k3d image import markise/product-service:v1 markise/order-service:v2 -c markise

# Database credentials (kept out of Git on purpose)
kubectl create secret generic db-credentials \
  --from-literal=POSTGRES_USER=markise \
  --from-literal=POSTGRES_PASSWORD=markise \
  --from-literal=POSTGRES_DB=markise \
  --from-literal=DATABASE_URL=postgres://markise:markise@postgres:5432/markise

# Install Argo CD and let it sync the k8s/ folder from this repository
kubectl create namespace argocd
kubectl apply -n argocd --server-side --force-conflicts \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl apply -f argocd/application.yaml
```

| Manifest                   | Purpose                                             |
| -------------------------- | --------------------------------------------------- |
| `k8s/postgres.yaml`        | StatefulSet with a persistent volume                |
| `k8s/migration-job.yaml`   | Runs the database migrations once as a Job          |
| `k8s/order-service.yaml`   | Deployment with liveness and readiness probes       |
| `k8s/product-service.yaml` | Deployment with liveness and readiness probes       |
| `argocd/application.yaml`  | GitOps: Argo CD syncs `k8s/` with self-heal enabled |

## Project structure

```text
apps/
  web/                 Next.js frontend
services/
  product-service/     Pricing API
  order-service/       Orders with PostgreSQL (Drizzle ORM)
packages/
  shared/              Types and pricing logic
k8s/                   Kubernetes manifests
argocd/                Argo CD application
```

## Roadmap

- [x] Monorepo with pnpm workspaces and Turborepo
- [x] Shared pricing logic, developed test-first
- [x] product-service with REST API and integration tests
- [x] order-service with PostgreSQL
- [x] CI pipeline with GitHub Actions
- [x] Docker images and Docker Compose
- [x] Kubernetes deployment (k3d)
- [x] GitOps deployment with Argo CD
- [ ] Build and push images in CI (GitHub Container Registry)
- [ ] Manage secrets with Sealed Secrets
- [ ] 3D awning preview with React Three Fiber

## Author

**Dejan Jankovic** · [dejan-jankovic.dev](https://www.dejan-jankovic.dev) · [LinkedIn](https://www.linkedin.com/in/dejan-jankovic-1083b2188)
