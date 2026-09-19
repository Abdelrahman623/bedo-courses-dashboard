import type { RoadmapTemplate } from '../roadmapTemplates';

export const DEVELOPMENT_ROADMAPS: Record<string, RoadmapTemplate> = {
  // ─── Frontend ─────────────────────────────────────────────────────────
  'frontend': {
    id: 'frontend',
    name: 'Frontend',
    icon: '🎨',
    badge: 'roadmap.sh',
    category: 'development',
    description: "Complete path to becoming a modern frontend developer: Web basics, HTML5, CSS3, JavaScript ES6+, React, hooks, Tailwind CSS, state management (Zustand), Next.js App Router, testing, and Core Web Vitals performance optimization.",
    roadmapUrl: 'https://roadmap.sh/frontend',
    nodes: [
      {
            "id": "fe_internet",
            "label": "How the Internet Works & Web Standards",
            "phase": "1. Web Foundations",
            "status": "not_started",
            "description": "Understand how computers communicate across the globe: DNS resolution, TCP/IP, HTTP/HTTPS protocols, and browser rendering engines.",
            "subtopics": [
                  "How browsers parse HTML, build the DOM, and paint pixels",
                  "DNS resolution and domain lookups",
                  "HTTP/1.1 vs HTTP/2 vs HTTP/3 (QUIC)",
                  "Hosting, IP addresses, ports, and SSL certificates"
            ],
            "resources": [
                  {
                        "title": "MDN: How the Web Works",
                        "url": "https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/How_does_the_Internet_work"
                  }
            ]
      },
      {
            "id": "fe_html",
            "label": "Semantic HTML5 & Accessibility (a11y)",
            "phase": "1. Web Foundations",
            "status": "not_started",
            "description": "Structure modern web content cleanly: semantic elements, forms and validation, SEO meta tags, and ARIA roles for accessibility.",
            "subtopics": [
                  "Semantic markup (<header>, <main>, <nav>, <article>, <section>)",
                  "HTML5 form inputs, attributes, and native client validation",
                  "ARIA roles, accessible labels, and keyboard tab indices",
                  "SEO meta tags, Open Graph preview tags, and favicon setup"
            ],
            "resources": [
                  {
                        "title": "web.dev: Learn HTML",
                        "url": "https://web.dev/learn/html/"
                  }
            ]
      },
      {
            "id": "fe_css",
            "label": "Modern CSS, Flexbox & CSS Grid",
            "phase": "1. Web Foundations",
            "status": "not_started",
            "description": "Master styling and layout systems: CSS Box Model, specificity, Flexbox 1D layouts, CSS Grid 2D responsive grids, and CSS variables.",
            "subtopics": [
                  "CSS Box Model, margins, padding, and box-sizing: border-box",
                  "Flexbox layout: flex-direction, justify-content, align-items, flex-wrap",
                  "CSS Grid: grid-template-columns, fr units, minmax(), auto-fit",
                  "CSS Custom Properties (Variables) and dark mode theming"
            ],
            "resources": [
                  {
                        "title": "CSS-Tricks: Complete Guide to Flexbox",
                        "url": "https://css-tricks.com/snippets/css/a-guide-to-flexbox/"
                  }
            ]
      },
      {
            "id": "fe_responsive",
            "label": "Responsive Design & Modern CSS Layouts",
            "phase": "1. Web Foundations",
            "status": "not_started",
            "description": "Build adaptive interfaces across mobile, tablet, and desktop: media queries, mobile-first design, fluid clamp() typography, and Container Queries.",
            "subtopics": [
                  "Mobile-first design philosophy and viewport meta tag",
                  "Media queries (min-width, prefers-color-scheme)",
                  "Fluid sizing with clamp(), min(), and max() functions",
                  "CSS Container Queries (@container) for component-level adaptability"
            ],
            "resources": [
                  {
                        "title": "web.dev: Learn Responsive Design",
                        "url": "https://web.dev/learn/design/"
                  }
            ]
      },
      {
            "id": "fe_js_syntax",
            "label": "Modern JavaScript (ES6+) Fundamentals",
            "phase": "2. JavaScript Core",
            "status": "not_started",
            "description": "Deep dive into modern ECMAScript: variables (let/const), arrow functions, destructuring, rest/spread operators, and array iterators.",
            "subtopics": [
                  "Scopes: Global, Function, and Block scope (let/const vs var)",
                  "Arrow functions, lexical this, and default parameters",
                  "Array methods: map(), filter(), reduce(), find(), some(), every()",
                  "Object destructuring, optional chaining (?.), and nullish coalescing (??)"
            ],
            "resources": [
                  {
                        "title": "JavaScript.info: The Modern JavaScript Tutorial",
                        "url": "https://javascript.info/"
                  }
            ]
      },
      {
            "id": "fe_js_advanced",
            "label": "JavaScript Under the Hood: Closures & Event Loop",
            "phase": "2. JavaScript Core",
            "status": "not_started",
            "description": "Understand the JS runtime mechanics: Execution Context, Call Stack, Closures, Prototypal Inheritance, and the Microtask Event Loop.",
            "subtopics": [
                  "Execution Context, Hoisting, and the Call Stack",
                  "Lexical Scoping and Closures practical memory use",
                  "Prototypes, __proto__, and ES6 class syntax",
                  "Event Loop: Call Stack, Web APIs, Microtask Queue (Promises), Task Queue (setTimeout)"
            ],
            "resources": [
                  {
                        "title": "MDN: Closures",
                        "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures"
                  }
            ]
      },
      {
            "id": "fe_dom",
            "label": "DOM Manipulation & Event Handling",
            "phase": "2. JavaScript Core",
            "status": "not_started",
            "description": "Interact with webpage elements dynamically: DOM queries, event delegation, bubbling, capturing, and modifying attributes.",
            "subtopics": [
                  "querySelector, querySelectorAll, and element traversal",
                  "addEventListener, event object, preventDefault(), and stopPropagation()",
                  "Event Bubbling vs Capturing and Event Delegation patterns",
                  "Manipulating classes (classList), styles, and dataset attributes"
            ],
            "resources": [
                  {
                        "title": "MDN: Manipulating Documents",
                        "url": "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Manipulating_documents"
                  }
            ]
      },
      {
            "id": "fe_async",
            "label": "Async JS, Promises & Fetch API",
            "phase": "2. JavaScript Core",
            "status": "not_started",
            "description": "Handle asynchronous network requests: Promises, async/await syntax, try/catch error handling, and browser storage mechanisms.",
            "subtopics": [
                  "Promises states (Pending, Fulfilled, Rejected) and Promise.all / Promise.allSettled",
                  "async/await syntax for clean readable asynchronous code",
                  "Fetch API: HTTP methods, request headers, and JSON body parsing",
                  "Client storage: localStorage, sessionStorage, Cookies, and IndexedDB"
            ],
            "resources": [
                  {
                        "title": "MDN: Asynchronous JavaScript",
                        "url": "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous"
                  }
            ]
      },
      {
            "id": "fe_git",
            "label": "Git, GitHub & Version Control Workflows",
            "phase": "3. Tooling & Ecosystem",
            "status": "not_started",
            "description": "Collaborate like a professional engineer: Git repositories, branches, rebasing, Pull Requests, merge conflicts, and commit hygiene.",
            "subtopics": [
                  "git init, clone, add, commit, push, pull, and status",
                  "Feature branching workflows and branch naming conventions",
                  "Resolving merge conflicts and git stash workflows",
                  "Creating Pull Requests, code reviews, and conventional commits"
            ],
            "resources": [
                  {
                        "title": "Pro Git Book",
                        "url": "https://git-scm.com/book/en/v2"
                  }
            ]
      },
      {
            "id": "fe_build_tools",
            "label": "Package Managers & Bundlers (pnpm & Vite)",
            "phase": "3. Tooling & Ecosystem",
            "status": "not_started",
            "description": "Modern build pipelines: package managers (npm, pnpm), ESM modules, Vite development server, Hot Module Replacement (HMR), and bundlers.",
            "subtopics": [
                  "package.json, package-lock.json, and semantic versioning (^, ~)",
                  "pnpm content-addressable storage benefits over npm",
                  "Vite instant server start via native ES Modules (ESM)",
                  "ESLint for code quality and Prettier for automated formatting"
            ],
            "resources": [
                  {
                        "title": "Vite Getting Started",
                        "url": "https://vitejs.dev/guide/"
                  }
            ]
      },
      {
            "id": "fe_typescript",
            "label": "TypeScript for Frontend Developers",
            "phase": "3. Tooling & Ecosystem",
            "status": "not_started",
            "description": "Add static typing to JavaScript: primitive types, interfaces, type aliases, union types, generics, and typing React component props.",
            "subtopics": [
                  "Primitive types, type inference, and any vs unknown",
                  "Interfaces vs Type Aliases and extending types",
                  "Union types, literal types, and type narrowing (typeof, instanceof)",
                  "Generics functions and typing React Props / State"
            ],
            "resources": [
                  {
                        "title": "TypeScript Handbook",
                        "url": "https://www.typescriptlang.org/docs/handbook/intro.html"
                  }
            ]
      },
      {
            "id": "fe_react_core",
            "label": "React Core Fundamentals & JSX",
            "phase": "4. React Ecosystem",
            "status": "not_started",
            "description": "Build component-driven user interfaces: JSX syntax, component trees, props passing, conditional rendering, and rendering lists with keys.",
            "subtopics": [
                  "JSX syntax and compilation to React.createElement",
                  "Functional components and unidirectional data flow (props)",
                  "Conditional rendering (ternary, logical &&) and null returns",
                  "Rendering lists, map(), and the importance of unique key props"
            ],
            "resources": [
                  {
                        "title": "React Official Documentation",
                        "url": "https://react.dev/"
                  }
            ]
      },
      {
            "id": "fe_react_hooks",
            "label": "React Hooks Mastery (useState, useEffect, useRef)",
            "phase": "4. React Ecosystem",
            "status": "not_started",
            "description": "Manage component lifecycle and reactive state: useState, useEffect dependencies, useRef for DOM access, useMemo, and useCallback.",
            "subtopics": [
                  "useState: functional updates and state immutability",
                  "useEffect: cleanup functions, dependency arrays, avoiding infinite loops",
                  "useRef: accessing DOM nodes and persisting values without re-rendering",
                  "useMemo and useCallback: preventing unnecessary recalculations"
            ],
            "resources": [
                  {
                        "title": "React Docs: Built-in React Hooks",
                        "url": "https://react.dev/reference/react"
                  }
            ]
      },
      {
            "id": "fe_styling_tailwind",
            "label": "Tailwind CSS & Utility-First Styling",
            "phase": "4. React Ecosystem",
            "status": "not_started",
            "description": "Rapidly style modern responsive UIs with utility classes, design tokens, hover/focus states, dark mode, and clsx/tailwind-merge.",
            "subtopics": [
                  "Utility-first philosophy vs CSS stylesheets",
                  "Responsive prefixes (sm:, md:, lg:, xl:) and state variants (hover:, focus:)",
                  "Tailwind CSS configuration: custom theme colors, fonts, spacing",
                  "Combining dynamic class names with clsx and tailwind-merge"
            ],
            "resources": [
                  {
                        "title": "Tailwind CSS Documentation",
                        "url": "https://tailwindcss.com/docs"
                  }
            ]
      },
      {
            "id": "fe_state_mgmt",
            "label": "State Management (Zustand / TanStack Query)",
            "phase": "4. React Ecosystem",
            "status": "not_started",
            "description": "Separate server cache from client UI state: client state with Zustand, server state fetching, caching, and mutations with TanStack Query.",
            "subtopics": [
                  "Client state vs Server state distinction",
                  "Zustand lightweight stores, actions, and selectors",
                  "TanStack Query (React Query): useQuery, automatic caching, and refetching",
                  "useMutation for optimistic UI updates and cache invalidation"
            ],
            "resources": [
                  {
                        "title": "Zustand GitHub Documentation",
                        "url": "https://github.com/pmndrs/zustand"
                  }
            ]
      },
      {
            "id": "fe_nextjs",
            "label": "Next.js App Router & Server Components",
            "phase": "5. Meta-Frameworks & SSR",
            "status": "not_started",
            "description": "Modern full-featured React framework: App Router, React Server Components (RSC), Client Components (\"use client\"), and Server Actions.",
            "subtopics": [
                  "React Server Components (RSC) vs Client Components",
                  "App Router file-system routing: layout.tsx, page.tsx, loading.tsx, error.tsx",
                  "SSR (Server-Side Rendering) vs SSG (Static Site Generation) vs ISR",
                  "Server Actions for form submissions without separate API routes"
            ],
            "resources": [
                  {
                        "title": "Next.js Documentation",
                        "url": "https://nextjs.org/docs"
                  }
            ]
      },
      {
            "id": "fe_testing",
            "label": "Testing: Unit (Vitest) & E2E (Playwright)",
            "phase": "6. Testing & Web Quality",
            "status": "not_started",
            "description": "Ensure application stability and prevent regressions: Unit testing with Vitest, Component testing with RTL, and E2E with Playwright.",
            "subtopics": [
                  "Vitest test runner: describe, test, expect, and mocking",
                  "React Testing Library: testing user behavior instead of implementation",
                  "End-to-End browser automation with Playwright",
                  "Continuous Integration test execution in GitHub Actions"
            ],
            "resources": [
                  {
                        "title": "Testing Library Documentation",
                        "url": "https://testing-library.com/"
                  }
            ]
      },
      {
            "id": "fe_performance",
            "label": "Core Web Vitals & Frontend Performance",
            "phase": "6. Testing & Web Quality",
            "status": "not_started",
            "description": "Optimize user experience and Google search ranking: LCP, INP, CLS, code-splitting with React.lazy, and image optimization.",
            "subtopics": [
                  "Largest Contentful Paint (LCP) optimization techniques",
                  "Interaction to Next Paint (INP) responsiveness tuning",
                  "Cumulative Layout Shift (CLS) prevention with reserved dimensions",
                  "Dynamic imports, route-based code splitting, and bundle analysis"
            ],
            "resources": [
                  {
                        "title": "web.dev: Core Web Vitals",
                        "url": "https://web.dev/vitals/"
                  }
            ]
      }
],
    edges: [
      {
            "source": "fe_internet",
            "target": "fe_html"
      },
      {
            "source": "fe_html",
            "target": "fe_css"
      },
      {
            "source": "fe_css",
            "target": "fe_responsive"
      },
      {
            "source": "fe_responsive",
            "target": "fe_js_syntax"
      },
      {
            "source": "fe_js_syntax",
            "target": "fe_js_advanced"
      },
      {
            "source": "fe_js_advanced",
            "target": "fe_dom"
      },
      {
            "source": "fe_dom",
            "target": "fe_async"
      },
      {
            "source": "fe_async",
            "target": "fe_git"
      },
      {
            "source": "fe_git",
            "target": "fe_build_tools"
      },
      {
            "source": "fe_build_tools",
            "target": "fe_typescript"
      },
      {
            "source": "fe_typescript",
            "target": "fe_react_core"
      },
      {
            "source": "fe_react_core",
            "target": "fe_react_hooks"
      },
      {
            "source": "fe_react_hooks",
            "target": "fe_styling_tailwind"
      },
      {
            "source": "fe_styling_tailwind",
            "target": "fe_state_mgmt"
      },
      {
            "source": "fe_state_mgmt",
            "target": "fe_nextjs"
      },
      {
            "source": "fe_nextjs",
            "target": "fe_testing"
      },
      {
            "source": "fe_testing",
            "target": "fe_performance"
      }
]
  },

  // ─── Backend ─────────────────────────────────────────────────────────
  'backend': {
    id: 'backend',
    name: 'Backend',
    icon: '⚙️',
    badge: 'roadmap.sh',
    category: 'development',
    description: "Complete backend engineering curriculum: Linux, Node.js event loop, PostgreSQL relational database design, indexing, Redis caching, RESTful API design, GraphQL, gRPC, JWT/OAuth auth, message brokers (Kafka), and Docker.",
    roadmapUrl: 'https://roadmap.sh/backend',
    nodes: [
      {
            "id": "be_linux_networking",
            "label": "Linux OS & Server Networking",
            "phase": "1. Foundations & Systems",
            "status": "not_started",
            "description": "Backend environment fundamentals: Linux shell scripting, file permissions, systemd service daemons, SSH, and TCP/UDP sockets.",
            "subtopics": [
                  "Linux terminal navigation, process management (ps, kill, systemctl)",
                  "SSH keys, config files, and remote server access",
                  "TCP 3-way handshake vs UDP socket communication",
                  "DNS resolution, IP routing, and port forwarding basics"
            ],
            "resources": [
                  {
                        "title": "roadmap.sh Backend Guide",
                        "url": "https://roadmap.sh/backend"
                  }
            ]
      },
      {
            "id": "be_runtime_node",
            "label": "Node.js Runtime & Async Event Loop",
            "phase": "1. Foundations & Systems",
            "status": "not_started",
            "description": "Master non-blocking asynchronous JavaScript/TypeScript backend runtimes: libuv event loop, streams, buffers, and clustering.",
            "subtopics": [
                  "Libuv event loop phases (Timers, Poll, Check, Close)",
                  "Node.js Streams (Readable, Writable, Transform) for large payloads",
                  "Buffers, TypedArrays, and binary memory management",
                  "Worker Threads and Cluster module for multi-core CPU scaling"
            ],
            "resources": [
                  {
                        "title": "Node.js Official Documentation",
                        "url": "https://nodejs.org/docs/latest/api/"
                  }
            ]
      },
      {
            "id": "be_rdbms_postgres",
            "label": "Relational Databases (PostgreSQL) & Normalization",
            "phase": "2. Databases & Storage",
            "status": "not_started",
            "description": "Design robust schemas: Boyce-Codd 3NF normalization, foreign keys, constraints, and ACID transaction guarantees.",
            "subtopics": [
                  "Database normalization: 1NF, 2NF, 3NF and denormalization tradeoffs",
                  "ACID properties: Atomicity, Consistency, Isolation, Durability",
                  "Transaction isolation levels (Read Committed, Repeatable Read, Serializable)",
                  "Foreign key cascade rules (CASCADE, SET NULL, RESTRICT)"
            ],
            "resources": [
                  {
                        "title": "PostgreSQL Tutorial",
                        "url": "https://www.postgresqltutorial.com/"
                  }
            ]
      },
      {
            "id": "be_sql_indexing",
            "label": "Complex SQL, Indexing & Query Tuning",
            "phase": "2. Databases & Storage",
            "status": "not_started",
            "description": "Write high-performance queries: JOIN types, Common Table Expressions (CTEs), window functions, and B-Tree/GIN indexes.",
            "subtopics": [
                  "INNER, LEFT, RIGHT, and FULL OUTER joins performance",
                  "Common Table Expressions (WITH queries) and recursive SQL",
                  "Window functions: ROW_NUMBER(), RANK(), DENSE_RANK(), LAG(), LEAD()",
                  "B-Tree indexes, composite indexes, and EXPLAIN ANALYZE interpretation"
            ],
            "resources": [
                  {
                        "title": "Use The Index, Luke!",
                        "url": "https://use-the-index-luke.com/"
                  }
            ]
      },
      {
            "id": "be_caching_redis",
            "label": "Caching Strategies with Redis",
            "phase": "2. Databases & Storage",
            "status": "not_started",
            "description": "Accelerate read latency: in-memory data structures (Strings, Hashes, Sets, Sorted Sets), TTL expiration, and cache patterns.",
            "subtopics": [
                  "Cache-Aside vs Write-Through vs Write-Behind patterns",
                  "Cache Stampede prevention and Distributed Locks (Redlock)",
                  "Redis Sorted Sets (ZADD, ZRANGE) for leaderboards and rate limiting",
                  "Redis Pub/Sub and Redis Streams for lightweight messaging"
            ],
            "resources": [
                  {
                        "title": "Redis Official Documentation",
                        "url": "https://redis.io/docs/"
                  }
            ]
      },
      {
            "id": "be_rest_api",
            "label": "RESTful API Design & HTTP Protocols",
            "phase": "3. API Design & Protocols",
            "status": "not_started",
            "description": "Design enterprise REST APIs: resource naming, standard HTTP verbs, status codes (2xx, 3xx, 4xx, 5xx), pagination, and idempotency.",
            "subtopics": [
                  "REST architectural constraints and resource URIs",
                  "HTTP methods: GET, POST, PUT, PATCH, DELETE idempotency rules",
                  "Cursor-based pagination vs offset-based pagination",
                  "Rate limiting headers (X-RateLimit-Limit, Retry-After) and CORS headers"
            ],
            "resources": [
                  {
                        "title": "RESTful API Guidelines (Zalando)",
                        "url": "https://opensource.zalando.com/restful-api-guidelines/"
                  }
            ]
      },
      {
            "id": "be_graphql_grpc",
            "label": "GraphQL & High-Performance gRPC",
            "phase": "3. API Design & Protocols",
            "status": "not_started",
            "description": "Modern API alternatives: GraphQL schemas, queries, mutations, subscriptions, and high-throughput binary RPCs with gRPC.",
            "subtopics": [
                  "GraphQL Schema Definition Language (SDL) and Resolvers",
                  "Solving N+1 query problem with DataLoader batching",
                  "gRPC Protocol Buffers (protobuf) binary serialization",
                  "Unary, Client streaming, Server streaming, and Bi-directional gRPC"
            ],
            "resources": [
                  {
                        "title": "gRPC Documentation",
                        "url": "https://grpc.io/docs/"
                  }
            ]
      },
      {
            "id": "be_auth_jwt_oauth",
            "label": "Authentication, OAuth 2.0 & JWT Security",
            "phase": "4. Security & Auth",
            "status": "not_started",
            "description": "Secure APIs and identities: JSON Web Tokens (JWT), Refresh Token rotation, OAuth 2.0 grant types, and OpenID Connect (OIDC).",
            "subtopics": [
                  "JWT structure: Header, Payload, Signature & HMAC vs RSA signing",
                  "Access tokens vs Refresh tokens with secure rotation",
                  "OAuth 2.0 Authorization Code Grant with PKCE for single-page apps",
                  "HttpOnly, Secure, and SameSite cookie defense against XSS and CSRF"
            ],
            "resources": [
                  {
                        "title": "Auth0: Introduction to IAM & OAuth 2.0",
                        "url": "https://auth0.com/intro-to-iam/"
                  }
            ]
      },
      {
            "id": "be_queues_kafka",
            "label": "Message Brokers & Async Queues (RabbitMQ / Kafka)",
            "phase": "5. Distributed Systems & Deployment",
            "status": "not_started",
            "description": "Decouple services with asynchronous message queues: BullMQ, RabbitMQ AMQP exchanges, and Apache Kafka event streams.",
            "subtopics": [
                  "BullMQ Redis-backed job queues with retry backoff",
                  "RabbitMQ Direct, Topic, and Fanout exchanges",
                  "Apache Kafka topics, consumer groups, and partition offsets",
                  "Idempotent consumer design and Dead Letter Queues (DLQ)"
            ],
            "resources": [
                  {
                        "title": "RabbitMQ Tutorials",
                        "url": "https://www.rabbitmq.com/getstarted.html"
                  }
            ]
      },
      {
            "id": "be_docker_cicd",
            "label": "Docker, Reverse Proxies & CI/CD Pipelines",
            "phase": "5. Distributed Systems & Deployment",
            "status": "not_started",
            "description": "Package, deploy, and maintain backend services: Docker containers, Nginx reverse proxying, and GitHub Actions CI/CD.",
            "subtopics": [
                  "Multi-stage Dockerfiles for lean production Node/Go images",
                  "Nginx reverse proxying, upstream load balancing, and SSL termination",
                  "GitHub Actions automated testing, linting, and container publishing",
                  "Health checks (/healthz), graceful shutdown handling, and PM2/Docker logs"
            ],
            "resources": [
                  {
                        "title": "Docker Official Documentation",
                        "url": "https://docs.docker.com/"
                  }
            ]
      }
],
    edges: [
      {
            "source": "be_linux_networking",
            "target": "be_runtime_node"
      },
      {
            "source": "be_runtime_node",
            "target": "be_rdbms_postgres"
      },
      {
            "source": "be_rdbms_postgres",
            "target": "be_sql_indexing"
      },
      {
            "source": "be_sql_indexing",
            "target": "be_caching_redis"
      },
      {
            "source": "be_caching_redis",
            "target": "be_rest_api"
      },
      {
            "source": "be_rest_api",
            "target": "be_graphql_grpc"
      },
      {
            "source": "be_graphql_grpc",
            "target": "be_auth_jwt_oauth"
      },
      {
            "source": "be_auth_jwt_oauth",
            "target": "be_queues_kafka"
      },
      {
            "source": "be_queues_kafka",
            "target": "be_docker_cicd"
      }
]
  },

  // ─── Full Stack ─────────────────────────────────────────────────────────
  'full-stack': {
    id: 'full-stack',
    name: 'Full Stack',
    icon: '🌐',
    badge: 'roadmap.sh',
    category: 'development',
    description: "End-to-end full-stack web development: React & TypeScript frontend, Node.js API services, PostgreSQL & Prisma ORM, Next.js App Router, authentication with OAuth/RBAC, background worker queues, and cloud deployment.",
    roadmapUrl: 'https://roadmap.sh/full-stack',
    nodes: [
      {
            "id": "fs_frontend_core",
            "label": "Frontend Core (React, TypeScript & Tailwind)",
            "phase": "1. Frontend Foundations",
            "status": "not_started",
            "description": "Master the frontend half of the stack: React 19 component architecture, TypeScript static types, and Tailwind CSS responsive styling.",
            "subtopics": [
                  "React components, props, state, and unidirectional data flow",
                  "TypeScript interfaces, generics, and strict type safety",
                  "Tailwind CSS utility classes, flexbox, and responsive grid layouts",
                  "Client-side routing and interactive form handling"
            ],
            "resources": [
                  {
                        "title": "roadmap.sh Full Stack Guide",
                        "url": "https://roadmap.sh/full-stack"
                  }
            ]
      },
      {
            "id": "fs_backend_api",
            "label": "Backend APIs with Node.js & Express / Fastify",
            "phase": "2. Backend & API Services",
            "status": "not_started",
            "description": "Build robust server services: RESTful API endpoints, routing, middleware pipelines, error handling, and schema validation with Zod.",
            "subtopics": [
                  "Express / Fastify server architecture and route handlers",
                  "Middleware functions: CORS, helmet security headers, logging",
                  "Request payload validation with Zod / Yup schemas",
                  "Standardized JSON error response formats"
            ],
            "resources": [
                  {
                        "title": "Fastify Official Documentation",
                        "url": "https://fastify.dev/"
                  }
            ]
      },
      {
            "id": "fs_database_orm",
            "label": "Databases & ORMs (PostgreSQL & Prisma / Drizzle)",
            "phase": "3. Data Layer & ORMs",
            "status": "not_started",
            "description": "Model data relationships and execute type-safe queries: PostgreSQL relational schemas, Prisma schema definitions, migrations, and Drizzle.",
            "subtopics": [
                  "Relational data modeling: 1:1, 1:N, and N:M relationships",
                  "Prisma Schema definitions, relations, and type generation",
                  "Database migrations (prisma migrate) and seed scripts",
                  "Drizzle ORM for lightweight, SQL-like type-safe queries"
            ],
            "resources": [
                  {
                        "title": "Prisma Documentation",
                        "url": "https://www.prisma.io/docs"
                  }
            ]
      },
      {
            "id": "fs_nextjs_fullstack",
            "label": "Full-Stack Meta-Frameworks (Next.js App Router)",
            "phase": "4. Full-Stack Meta-Frameworks",
            "status": "not_started",
            "description": "Unify frontend and backend in one codebase: Server Components, Server Actions for mutations, dynamic API routes, and SSR.",
            "subtopics": [
                  "Server Actions for direct database writes without API boilerplate",
                  "Route Handlers (app/api/route.ts) for external webhooks",
                  "Server-side data fetching with React Server Components",
                  "Hydration, Streaming SSR, and Suspense boundaries"
            ],
            "resources": [
                  {
                        "title": "Next.js App Router Guide",
                        "url": "https://nextjs.org/docs/app"
                  }
            ]
      },
      {
            "id": "fs_auth_security",
            "label": "Authentication, Sessions & Role-Based Access (RBAC)",
            "phase": "5. Security & Auth",
            "status": "not_started",
            "description": "Secure full-stack applications: NextAuth.js / Supabase Auth, OAuth social logins, session management, and role-based permissions.",
            "subtopics": [
                  "NextAuth.js / Auth.js configuration with OAuth & email magic links",
                  "Supabase Auth with Row-Level Security (RLS) policies",
                  "Role-Based Access Control (RBAC) in middleware and database rules",
                  "Cross-Site Scripting (XSS) and CSRF mitigation in modern stacks"
            ],
            "resources": [
                  {
                        "title": "Auth.js Official Documentation",
                        "url": "https://authjs.dev/"
                  }
            ]
      },
      {
            "id": "fs_async_workers",
            "label": "Background Workers & External Integrations (Stripe)",
            "phase": "6. Integrations & Background Jobs",
            "status": "not_started",
            "description": "Handle long-running processes: Redis background queues with BullMQ, payment integration with Stripe, and transactional emails with Resend.",
            "subtopics": [
                  "BullMQ worker queues for async background jobs",
                  "Stripe checkout sessions, webhook signatures, and customer subscriptions",
                  "Transactional email delivery with Resend / Postmark",
                  "S3 / Cloudflare R2 file upload signed URLs"
            ],
            "resources": [
                  {
                        "title": "Stripe API Reference",
                        "url": "https://stripe.com/docs/api"
                  }
            ]
      },
      {
            "id": "fs_deployment_cloud",
            "label": "Production Deployment & Cloud Hosting",
            "phase": "7. Deployment & Observability",
            "status": "not_started",
            "description": "Deploy full-stack applications to production: Vercel serverless edges, Railway / Render container hosting, and Supabase / Neon DBs.",
            "subtopics": [
                  "Deploying Next.js to Vercel with environment variables",
                  "Dockerizing full-stack applications for container platforms",
                  "Serverless PostgreSQL connection pooling (Neon / Supabase PgBouncer)",
                  "Sentry error monitoring and performance tracking"
            ],
            "resources": [
                  {
                        "title": "Vercel Deployment Documentation",
                        "url": "https://vercel.com/docs"
                  }
            ]
      }
],
    edges: [
      {
            "source": "fs_frontend_core",
            "target": "fs_backend_api"
      },
      {
            "source": "fs_backend_api",
            "target": "fs_database_orm"
      },
      {
            "source": "fs_database_orm",
            "target": "fs_nextjs_fullstack"
      },
      {
            "source": "fs_nextjs_fullstack",
            "target": "fs_auth_security"
      },
      {
            "source": "fs_auth_security",
            "target": "fs_async_workers"
      },
      {
            "source": "fs_async_workers",
            "target": "fs_deployment_cloud"
      }
]
  },

  // ─── Android ─────────────────────────────────────────────────────────
  'android': {
    id: 'android',
    name: 'Android',
    icon: '🤖',
    badge: 'roadmap.sh',
    category: 'development',
    description: "Modern Android development roadmap: Kotlin fundamentals, Jetpack Compose declarative UI, MVVM architecture, Coroutines & Flow, Retrofit networking, Room database persistence, Hilt dependency injection, and Play Store release.",
    roadmapUrl: 'https://roadmap.sh/android',
    nodes: [
      {
            "id": "and_kotlin",
            "label": "Kotlin Programming Fundamentals",
            "phase": "1. Kotlin Foundations",
            "status": "not_started",
            "description": "Master the first-class language of modern Android: null safety, data classes, extension functions, lambdas, and sealed interfaces.",
            "subtopics": [
                  "Kotlin null safety: safe call (?.), Elvis operator (?:), smart casting",
                  "Data classes, sealed classes, and pattern matching with when",
                  "Extension functions and higher-order lambda functions",
                  "Kotlin Collections API (map, filter, associateBy, groupBy)"
            ],
            "resources": [
                  {
                        "title": "Kotlin Official Documentation",
                        "url": "https://kotlinlang.org/docs/home.html"
                  }
            ]
      },
      {
            "id": "and_compose_ui",
            "label": "Modern Android UI with Jetpack Compose",
            "phase": "2. UI & Jetpack Compose",
            "status": "not_started",
            "description": "Build declarative user interfaces: Composables, state hoisting, modifiers, Row/Column/Box layouts, and LazyColumn dynamic lists.",
            "subtopics": [
                  "Declarative UI paradigm: @Composable functions and recomposition",
                  "State hoisting with remember and mutableStateOf",
                  "LazyColumn & LazyRow for high-performance recycling lists",
                  "Material 3 theming: colors, typography, shapes, and dark mode"
            ],
            "resources": [
                  {
                        "title": "Android Developers: Jetpack Compose Basics",
                        "url": "https://developer.android.com/jetpack/compose"
                  }
            ]
      },
      {
            "id": "and_architecture",
            "label": "Android Architecture: MVVM & Jetpack ViewModel",
            "phase": "3. App Architecture",
            "status": "not_started",
            "description": "Follow Google official Android Architecture guidelines: UI Layer, Domain Layer, Data Layer, and surviving configuration changes.",
            "subtopics": [
                  "Jetpack ViewModel lifecycle and surviving screen rotations",
                  "StateFlow and SharedFlow for reactive UI state streams",
                  "Repository pattern for abstracting network and local database sources",
                  "Single Source of Truth (SSOT) data architecture"
            ],
            "resources": [
                  {
                        "title": "Guide to Android App Architecture",
                        "url": "https://developer.android.com/topic/architecture"
                  }
            ]
      },
      {
            "id": "and_coroutines",
            "label": "Asynchronous Android: Coroutines & Kotlin Flow",
            "phase": "4. Concurrency & Networking",
            "status": "not_started",
            "description": "Handle background operations smoothly: Kotlin Coroutines, Dispatchers (Main, IO, Default), viewModelScope, and reactive Flows.",
            "subtopics": [
                  "Suspend functions and non-blocking asynchronous execution",
                  "Coroutine Dispatchers: Dispatchers.Main vs Dispatchers.IO",
                  "viewModelScope and lifecycleScope automatic cancellation",
                  "Cold Flow vs Hot StateFlow stream transformations (map, flatMapLatest)"
            ],
            "resources": [
                  {
                        "title": "Kotlin Coroutines on Android",
                        "url": "https://developer.android.com/kotlin/coroutines"
                  }
            ]
      },
      {
            "id": "and_networking",
            "label": "Networking & REST APIs (Retrofit & OkHttp)",
            "phase": "4. Concurrency & Networking",
            "status": "not_started",
            "description": "Fetch and parse remote JSON data: Retrofit 2 client interfaces, OkHttp logging interceptors, and Kotlinx Serialization.",
            "subtopics": [
                  "Retrofit @GET, @POST interface definitions and dynamic path params",
                  "Kotlinx.serialization and Moshi JSON parsing",
                  "OkHttp Interceptors for adding authentication headers and logging",
                  "Coil library for asynchronous image loading and memory caching"
            ],
            "resources": [
                  {
                        "title": "Retrofit by Square",
                        "url": "https://square.github.io/retrofit/"
                  }
            ]
      },
      {
            "id": "and_storage_room",
            "label": "Local Data Storage: Room Database & DataStore",
            "phase": "5. Storage & Dependency Injection",
            "status": "not_started",
            "description": "Store structured offline data with Room SQLite abstraction; store user preferences with Jetpack DataStore.",
            "subtopics": [
                  "Room Entities, Data Access Objects (DAOs), and @Database class",
                  "Observing Room queries with Kotlin Flow for live UI updates",
                  "Database migrations (automated and manual schema migrations)",
                  "Jetpack DataStore Preferences vs Proto DataStore (replacing SharedPreferences)"
            ],
            "resources": [
                  {
                        "title": "Save Data in a Local Database Using Room",
                        "url": "https://developer.android.com/training/data-storage/room"
                  }
            ]
      },
      {
            "id": "and_hilt",
            "label": "Dependency Injection with Hilt / Dagger",
            "phase": "5. Storage & Dependency Injection",
            "status": "not_started",
            "description": "Manage dependencies cleanly across Android lifecycles: Hilt annotations (@HiltAndroidApp, @AndroidEntryPoint, @Inject, @ViewModelScoped).",
            "subtopics": [
                  "Dependency injection principles and testability benefits",
                  "@HiltAndroidApp and Application component setup",
                  "Hilt Modules and @Provides / @Binds for third-party classes",
                  "Scoping dependencies: @Singleton vs @ViewModelScoped"
            ],
            "resources": [
                  {
                        "title": "Hilt Dependency Injection Guide",
                        "url": "https://developer.android.com/training/dependency-injection/hilt-android"
                  }
            ]
      },
      {
            "id": "and_release",
            "label": "Testing, R8 Shrinking & Google Play Release",
            "phase": "6. Testing & Play Store",
            "status": "not_started",
            "description": "Ship production-ready Android apps: JUnit unit tests, Compose UI tests, R8 code minification, App Bundles (.aab), and Play Console.",
            "subtopics": [
                  "Unit testing ViewModels and Repositories with JUnit 5 & MockK",
                  "Compose UI testing with composeTestRule and semantic matchers",
                  "R8 code shrinking, obfuscation, and ProGuard keep rules",
                  "Generating signed Android App Bundles (.aab) and Play Store tracks"
            ],
            "resources": [
                  {
                        "title": "Google Play Console Guide",
                        "url": "https://developer.android.com/distribute/console"
                  }
            ]
      }
],
    edges: [
      {
            "source": "and_kotlin",
            "target": "and_compose_ui"
      },
      {
            "source": "and_compose_ui",
            "target": "and_architecture"
      },
      {
            "source": "and_architecture",
            "target": "and_coroutines"
      },
      {
            "source": "and_coroutines",
            "target": "and_networking"
      },
      {
            "source": "and_networking",
            "target": "and_storage_room"
      },
      {
            "source": "and_storage_room",
            "target": "and_hilt"
      },
      {
            "source": "and_hilt",
            "target": "and_release"
      }
]
  },

  // ─── iOS ─────────────────────────────────────────────────────────
  'ios': {
    id: 'ios',
    name: 'iOS',
    icon: '🍎',
    badge: 'roadmap.sh',
    category: 'development',
    description: "Modern iOS development curriculum: Swift programming, SwiftUI declarative views, Observation state framework, Swift Concurrency (async/await & actors), URLSession networking, SwiftData persistence, MVVM, and TestFlight release.",
    roadmapUrl: 'https://roadmap.sh/ios',
    nodes: [
      {
            "id": "ios_swift",
            "label": "Swift Language Foundations",
            "phase": "1. Swift Language Core",
            "status": "not_started",
            "description": "Master Apple’s modern programming language: optionals, value vs reference types (structs vs classes), protocols, and generics.",
            "subtopics": [
                  "Optionals: optional binding (if let, guard let) and nil coalescing",
                  "Structs (Value types) vs Classes (Reference types) in Swift",
                  "Protocols and Protocol Extensions for composable behavior",
                  "Enums with associated values and pattern matching"
            ],
            "resources": [
                  {
                        "title": "The Swift Programming Language Book",
                        "url": "https://docs.swift.org/swift-book/"
                  }
            ]
      },
      {
            "id": "ios_swiftui",
            "label": "Modern iOS UI with SwiftUI",
            "phase": "2. SwiftUI & State",
            "status": "not_started",
            "description": "Build declarative iOS apps: Views, modifiers, layout stacks (VStack, HStack, ZStack), List dynamic views, and NavigationStack.",
            "subtopics": [
                  "Declarative body view structure and View modifiers order",
                  "Layout stacks (VStack, HStack, ZStack) and Spacer mechanics",
                  "List and ForEach for efficient scrolling table views",
                  "NavigationStack, navigationDestination, and type-safe navigation"
            ],
            "resources": [
                  {
                        "title": "Apple Developer: SwiftUI Tutorials",
                        "url": "https://developer.apple.com/tutorials/swiftui"
                  }
            ]
      },
      {
            "id": "ios_state_observation",
            "label": "SwiftUI State & Observation Framework",
            "phase": "2. SwiftUI & State",
            "status": "not_started",
            "description": "Manage reactive state cleanly: @State, @Binding, and the modern Swift Observation framework (@Observable macro in iOS 17+).",
            "subtopics": [
                  "@State for view-local ephemeral state",
                  "@Binding for two-way child-to-parent state synchronization",
                  "@Observable macro (iOS 17+) replacing ObservableObject & @Published",
                  "@Environment and EnvironmentValues for dependency injection"
            ],
            "resources": [
                  {
                        "title": "Managing Model Data in SwiftUI",
                        "url": "https://developer.apple.com/documentation/swiftui/managing-model-data-in-your-app"
                  }
            ]
      },
      {
            "id": "ios_concurrency",
            "label": "Swift Concurrency: Async/Await & Actors",
            "phase": "3. Concurrency & Networking",
            "status": "not_started",
            "description": "Handle asynchronous operations safely: async/await, Task, TaskGroup, and Actors to prevent data races at compile time.",
            "subtopics": [
                  "async/await syntax and structured concurrency",
                  "Task and TaskGroup for parallel concurrent execution",
                  "@MainActor annotation for guaranteed main-thread UI updates",
                  "Actors for thread-safe state encapsulation without manual locks"
            ],
            "resources": [
                  {
                        "title": "Apple: Swift Concurrency",
                        "url": "https://docs.swift.org/swift-book/documentation/the-swift-programming-language/concurrency/"
                  }
            ]
      },
      {
            "id": "ios_networking",
            "label": "Networking with URLSession & Codable",
            "phase": "3. Concurrency & Networking",
            "status": "not_started",
            "description": "Communicate with RESTful backends: URLSession data tasks, JSON parsing with Codable, error handling, and AsyncImage.",
            "subtopics": [
                  "URLSession.shared.data(from:) async network calls",
                  "Codable (Encodable & Decodable) for JSON mapping",
                  "Custom CodingKeys for snake_case to camelCase conversion",
                  "AsyncImage for asynchronous image loading with placeholder states"
            ],
            "resources": [
                  {
                        "title": "Apple: Fetching Website Data into Memory",
                        "url": "https://developer.apple.com/documentation/foundation/url_loading_system/fetching_website_data_into_memory"
                  }
            ]
      },
      {
            "id": "ios_swiftdata",
            "label": "Data Persistence: SwiftData & Keychain",
            "phase": "4. Persistence & Architecture",
            "status": "not_started",
            "description": "Persist data locally: modern SwiftData (@Model, ModelContainer, @Query), CoreData legacy interoperability, and Keychain for secrets.",
            "subtopics": [
                  "SwiftData @Model macro for defining persistent entities",
                  "@Query macro in SwiftUI views for automated live updates",
                  "ModelContext operations (insert, delete, save)",
                  "Keychain Services for securely storing user tokens and passwords"
            ],
            "resources": [
                  {
                        "title": "Apple: SwiftData Documentation",
                        "url": "https://developer.apple.com/documentation/swiftdata"
                  }
            ]
      },
      {
            "id": "ios_architecture",
            "label": "iOS App Architecture (MVVM & TCA)",
            "phase": "4. Persistence & Architecture",
            "status": "not_started",
            "description": "Structure scalable enterprise iOS apps: Model-View-ViewModel (MVVM), Repository pattern, and Point-Free Composable Architecture (TCA).",
            "subtopics": [
                  "Clean MVVM architecture in SwiftUI projects",
                  "Repository pattern for data source abstraction",
                  "Dependency injection in SwiftUI apps",
                  "The Composable Architecture (TCA) state machine architecture overview"
            ],
            "resources": [
                  {
                        "title": "Point-Free: The Composable Architecture",
                        "url": "https://github.com/pointfreeco/swift-composable-architecture"
                  }
            ]
      },
      {
            "id": "ios_testing_appstore",
            "label": "Testing, TestFlight & App Store Deployment",
            "phase": "5. Testing & App Store",
            "status": "not_started",
            "description": "Ship flawless iOS applications: XCTest unit testing, View inspector, TestFlight beta distribution, and App Store submission.",
            "subtopics": [
                  "Unit testing business logic and ViewModels with XCTest",
                  "UI testing with XCUITest automation",
                  "Configuring App IDs, Provisioning Profiles, and Signing Certificates",
                  "TestFlight external testing groups and App Store Connect review guidelines"
            ],
            "resources": [
                  {
                        "title": "App Store Connect Help",
                        "url": "https://developer.apple.com/help/app-store-connect/"
                  }
            ]
      }
],
    edges: [
      {
            "source": "ios_swift",
            "target": "ios_swiftui"
      },
      {
            "source": "ios_swiftui",
            "target": "ios_state_observation"
      },
      {
            "source": "ios_state_observation",
            "target": "ios_concurrency"
      },
      {
            "source": "ios_concurrency",
            "target": "ios_networking"
      },
      {
            "source": "ios_networking",
            "target": "ios_swiftdata"
      },
      {
            "source": "ios_swiftdata",
            "target": "ios_architecture"
      },
      {
            "source": "ios_architecture",
            "target": "ios_testing_appstore"
      }
]
  },

  // ─── QA ─────────────────────────────────────────────────────────
  'qa': {
    id: 'qa',
    name: 'QA',
    icon: '🧪',
    badge: 'roadmap.sh',
    category: 'development',
    description: "Software Quality Assurance & Test Automation: Testing fundamentals & STLC, test design techniques, E2E browser automation with Playwright, API testing with Postman, k6 performance load testing, and CI/CD Allure reporting.",
    roadmapUrl: 'https://roadmap.sh/qa',
    nodes: [
      {
            "id": "qa_fundamentals",
            "label": "Software Testing Fundamentals & STLC",
            "phase": "1. Testing Fundamentals",
            "status": "not_started",
            "description": "Foundations of quality assurance: Software Testing Life Cycle (STLC), Test Plans, Test Cases, Bug reports, and Test Pyramids.",
            "subtopics": [
                  "Test Levels: Unit, Integration, System, and Acceptance (UAT)",
                  "Test Pyramid: Many unit tests, balanced integration, focused E2E",
                  "Black-Box vs White-Box testing techniques",
                  "Writing structured bug reports in Jira with reproduction steps"
            ],
            "resources": [
                  {
                        "title": "roadmap.sh QA Engineer Guide",
                        "url": "https://roadmap.sh/qa"
                  }
            ]
      },
      {
            "id": "qa_test_design",
            "label": "Test Design Techniques & Exploratory Testing",
            "phase": "1. Testing Fundamentals",
            "status": "not_started",
            "description": "Design effective test suites with maximum coverage: Equivalence Partitioning, Boundary Value Analysis (BVA), and Decision Tables.",
            "subtopics": [
                  "Equivalence Partitioning (valid vs invalid input classes)",
                  "Boundary Value Analysis (min, min-1, max, max+1)",
                  "State Transition testing for complex user workflows",
                  "Exploratory testing charters and time-boxed testing sessions"
            ],
            "resources": [
                  {
                        "title": "ISTQB Foundation Level Syllabus",
                        "url": "https://www.istqb.org/"
                  }
            ]
      },
      {
            "id": "qa_playwright",
            "label": "E2E Web Automation with Playwright",
            "phase": "2. Web Test Automation",
            "status": "not_started",
            "description": "Modern end-to-end browser automation: Playwright locators, auto-waiting, Page Object Model (POM), and cross-browser execution.",
            "subtopics": [
                  "Playwright test runner setup with TypeScript",
                  "Resilient locators (getByRole, getByText, getByTestId)",
                  "Page Object Model (POM) pattern for maintainable tests",
                  "Visual regression testing with snapshot comparisons"
            ],
            "resources": [
                  {
                        "title": "Playwright Official Documentation",
                        "url": "https://playwright.dev/"
                  }
            ]
      },
      {
            "id": "qa_api_testing",
            "label": "API Testing & Automation (Postman & REST Assured)",
            "phase": "3. API & Contract Testing",
            "status": "not_started",
            "description": "Validate backend endpoints and contracts: Postman collections, Newman CLI test runner, status assertions, and REST Assured.",
            "subtopics": [
                  "Postman environment variables, pre-request scripts, and test assertions",
                  "Running collections in CI pipelines with Newman CLI",
                  "Schema validation using JSON Schema against OpenAPI specs",
                  "Contract testing fundamentals with Pact"
            ],
            "resources": [
                  {
                        "title": "Postman Learning Center",
                        "url": "https://learning.postman.com/"
                  }
            ]
      },
      {
            "id": "qa_perf_k6",
            "label": "Performance & Load Testing with k6",
            "phase": "4. Performance & CI/CD",
            "status": "not_started",
            "description": "Stress-test backend throughput under heavy traffic: Grafana k6 JavaScript scripts, virtual users (VUs), latency percentiles, and thresholds.",
            "subtopics": [
                  "Writing k6 load test scripts in JavaScript",
                  "Virtual Users (VUs) scaling and ramp-up stages",
                  "Interpreting metrics: p95/p99 response latency, throughput RPS, error rates",
                  "Defining pass/fail thresholds in automated build pipelines"
            ],
            "resources": [
                  {
                        "title": "Grafana k6 Documentation",
                        "url": "https://k6.io/docs/"
                  }
            ]
      },
      {
            "id": "qa_cicd_reporting",
            "label": "CI/CD Automation & Test Reporting (Allure)",
            "phase": "4. Performance & CI/CD",
            "status": "not_started",
            "description": "Integrate automated tests into continuous deployment pipelines: GitHub Actions parallel shards, flaky test retries, and Allure reports.",
            "subtopics": [
                  "Running Playwright test shards in parallel on GitHub Actions",
                  "Flaky test detection, quarantine, and automated retries",
                  "Allure Report generation with screenshots and video traces",
                  "Quality gates blocking merges on test failures"
            ],
            "resources": [
                  {
                        "title": "Allure Report Documentation",
                        "url": "https://allurereport.org/"
                  }
            ]
      }
],
    edges: [
      {
            "source": "qa_fundamentals",
            "target": "qa_test_design"
      },
      {
            "source": "qa_test_design",
            "target": "qa_playwright"
      },
      {
            "source": "qa_playwright",
            "target": "qa_api_testing"
      },
      {
            "source": "qa_api_testing",
            "target": "qa_perf_k6"
      },
      {
            "source": "qa_perf_k6",
            "target": "qa_cicd_reporting"
      }
]
  },

  // ─── Blockchain ─────────────────────────────────────────────────────────
  'blockchain': {
    id: 'blockchain',
    name: 'Blockchain',
    icon: '⛓️',
    badge: 'roadmap.sh',
    category: 'development',
    description: "Comprehensive Web3 & Blockchain developer path: Cryptography fundamentals, Ethereum & EVM architecture, Solidity smart contract programming, Foundry testing framework, OpenZeppelin token standards, Wagmi/Viem frontend integration, and security auditing.",
    roadmapUrl: 'https://roadmap.sh/blockchain',
    nodes: [
      {
            "id": "bc_crypto_p2p",
            "label": "Cryptography & Blockchain Architecture",
            "phase": "1. Blockchain Foundations",
            "status": "not_started",
            "description": "Core decentralized technologies: cryptographic hashes (SHA-256, Keccak-256), public-key cryptography, Merkle trees, and P2P networks.",
            "subtopics": [
                  "Cryptographic hash functions and preimage resistance",
                  "Public/Private key pairs and Elliptic Curve Cryptography (secp256k1)",
                  "Merkle Trees for cryptographic transaction verification",
                  "Proof of Work (PoW) vs Proof of Stake (PoS) consensus mechanisms"
            ],
            "resources": [
                  {
                        "title": "roadmap.sh Blockchain Guide",
                        "url": "https://roadmap.sh/blockchain"
                  }
            ]
      },
      {
            "id": "bc_evm_architecture",
            "label": "Ethereum & EVM Architecture",
            "phase": "1. Blockchain Foundations",
            "status": "not_started",
            "description": "Understand the world computer: Ethereum Virtual Machine (EVM), gas mechanics, bytecode, account types (EOA vs Contract), and state trie.",
            "subtopics": [
                  "Externally Owned Accounts (EOA) vs Smart Contract Accounts",
                  "Gas limit, base fee, priority fee (EIP-1559), and execution cost",
                  "EVM execution stack, memory, storage slots, and calldata",
                  "World State and Patricia Merkle Trie architecture"
            ],
            "resources": [
                  {
                        "title": "Ethereum.org: Ethereum Virtual Machine (EVM)",
                        "url": "https://ethereum.org/en/developers/docs/evm/"
                  }
            ]
      },
      {
            "id": "bc_solidity_core",
            "label": "Solidity Smart Contract Programming",
            "phase": "2. Smart Contract Development",
            "status": "not_started",
            "description": "Write secure decentralized code: Solidity 0.8+, data types, mappings, structs, modifiers, events, and inheritance.",
            "subtopics": [
                  "Solidity state variables, visibility (public, external, internal, private)",
                  "Mappings, nested mappings, and memory vs storage references",
                  "Function modifiers for access control and custom errors (revert CustomError())",
                  "Events and logs for indexing with off-chain frontends"
            ],
            "resources": [
                  {
                        "title": "Solidity Official Documentation",
                        "url": "https://docs.soliditylang.org/"
                  }
            ]
      },
      {
            "id": "bc_foundry",
            "label": "Smart Contract Development with Foundry",
            "phase": "2. Smart Contract Development",
            "status": "not_started",
            "description": "Fast, type-safe development environment: Forge for writing unit tests in Solidity, Cast for RPC calls, and Anvil for local node forks.",
            "subtopics": [
                  "Writing fast tests in pure Solidity with forge test",
                  "Fuzz testing and invariant testing in Foundry",
                  "Mainnet state forking with Anvil for local testing",
                  "Deploying contracts with forge script and automated verification on Etherscan"
            ],
            "resources": [
                  {
                        "title": "Foundry Book Documentation",
                        "url": "https://book.getfoundry.sh/"
                  }
            ]
      },
      {
            "id": "bc_token_standards",
            "label": "Token Standards & OpenZeppelin (ERC-20, ERC-721)",
            "phase": "3. Standards & Integration",
            "status": "not_started",
            "description": "Implement industry-standard tokens using audited OpenZeppelin contracts: ERC-20 fungible, ERC-721 NFTs, and ERC-1155 multi-token.",
            "subtopics": [
                  "ERC-20 fungible token standard: transfer, approve, transferFrom, allowance",
                  "ERC-721 non-fungible token (NFT) standard and metadata URIs",
                  "OpenZeppelin Ownable and AccessControl role-based permissions",
                  "ReentrancyGuard implementation and Pausable security switches"
            ],
            "resources": [
                  {
                        "title": "OpenZeppelin Contracts Documentation",
                        "url": "https://docs.openzeppelin.com/contracts/"
                  }
            ]
      },
      {
            "id": "bc_web3_frontend",
            "label": "Web3 Frontend Integration (Wagmi & Viem)",
            "phase": "3. Standards & Integration",
            "status": "not_started",
            "description": "Connect React web apps to smart contracts: Viem lightweight client, Wagmi React hooks, and wallet connectors (RainbowKit / AppKit).",
            "subtopics": [
                  "Viem lightweight TypeScript interface for Ethereum",
                  "Wagmi React hooks: useAccount, useReadContract, useWriteContract",
                  "Connecting wallets with RainbowKit / WalletConnect",
                  "Handling transaction confirmations, pending states, and error toasts"
            ],
            "resources": [
                  {
                        "title": "Wagmi React Hooks Documentation",
                        "url": "https://wagmi.sh/"
                  }
            ]
      },
      {
            "id": "bc_security_auditing",
            "label": "Smart Contract Security & Auditing",
            "phase": "4. Security & Auditing",
            "status": "not_started",
            "description": "Defend against multi-million dollar exploits: Reentrancy, flash loan attacks, front-running, and static analysis with Slither.",
            "subtopics": [
                  "Reentrancy attacks and the Checks-Effects-Interactions pattern",
                  "Integer overflow prevention (checked arithmetic in Solidity 0.8+)",
                  "Oracle manipulation and Flash Loan attack mechanics",
                  "Static analysis scanning with Slither and Mythril"
            ],
            "resources": [
                  {
                        "title": "Consensys: Smart Contract Security Best Practices",
                        "url": "https://consensys.github.io/smart-contract-best-practices/"
                  }
            ]
      }
],
    edges: [
      {
            "source": "bc_crypto_p2p",
            "target": "bc_evm_architecture"
      },
      {
            "source": "bc_evm_architecture",
            "target": "bc_solidity_core"
      },
      {
            "source": "bc_solidity_core",
            "target": "bc_foundry"
      },
      {
            "source": "bc_foundry",
            "target": "bc_token_standards"
      },
      {
            "source": "bc_token_standards",
            "target": "bc_web3_frontend"
      },
      {
            "source": "bc_web3_frontend",
            "target": "bc_security_auditing"
      }
]
  },

  // ─── Game Developer ─────────────────────────────────────────────────────────
  'game-developer': {
    id: 'game-developer',
    name: 'Game Developer',
    icon: '🎮',
    badge: 'roadmap.sh',
    category: 'development',
    description: "Game development engineering curriculum: Vector mathematics & physics, C++ and C#, Unity & Unreal engines, game loop architecture & ECS, graphics shaders (HLSL), A* pathfinding & AI behavior trees, and performance profiling.",
    roadmapUrl: 'https://roadmap.sh/game-developer',
    nodes: [
      {
            "id": "gd_math_physics",
            "label": "Game Mathematics & Physics Foundations",
            "phase": "1. Math & Physics Foundations",
            "status": "not_started",
            "description": "The mathematical backbone of games: 2D/3D vectors, dot/cross products, trigonometry, matrices, raycasting, and rigid body physics.",
            "subtopics": [
                  "2D/3D Vector arithmetic: normalization, magnitude, distance",
                  "Dot product for field of view and lighting calculations",
                  "Cross product for surface normal vectors",
                  "Rigid body physics: velocity, acceleration, gravity, and collision shapes"
            ],
            "resources": [
                  {
                        "title": "roadmap.sh Game Developer Guide",
                        "url": "https://roadmap.sh/game-developer"
                  }
            ]
      },
      {
            "id": "gd_cpp_csharp",
            "label": "Programming Languages for Games (C++ & C#)",
            "phase": "1. Math & Physics Foundations",
            "status": "not_started",
            "description": "Master core game programming languages: C# for Unity game logic and C++ for Unreal Engine high-performance systems.",
            "subtopics": [
                  "C# object-oriented programming, interfaces, and events for Unity",
                  "C++ pointers, references, manual memory management, and RAII",
                  "Cache locality and Data-Oriented Design (DOD) principles",
                  "Garbage collection spikes mitigation in game runtimes"
            ],
            "resources": [
                  {
                        "title": "Learn C++ for Game Development",
                        "url": "https://www.learncpp.com/"
                  }
            ]
      },
      {
            "id": "gd_game_engines",
            "label": "Game Engines: Unity & Unreal Engine",
            "phase": "2. Game Engines & Gameplay",
            "status": "not_started",
            "description": "Build games inside modern industry engines: Unity GameObject-Component architecture and Unreal Engine Actor-Component hierarchy.",
            "subtopics": [
                  "Unity Scene hierarchy, GameObjects, and MonoBehaviour lifecycle",
                  "Unreal Engine Actor lifecycle, components, and Blueprints visual scripting",
                  "Transform hierarchies: position, rotation (quaternions), and scale",
                  "Input System configuration for keyboard, mouse, and gamepads"
            ],
            "resources": [
                  {
                        "title": "Unity Learn Platform",
                        "url": "https://learn.unity.com/"
                  }
            ]
      },
      {
            "id": "gd_game_loop_arch",
            "label": "Game Loop, State Machines & ECS Architecture",
            "phase": "2. Game Engines & Gameplay",
            "status": "not_started",
            "description": "Structure gameplay systems cleanly: deterministic Game Loop (Update vs FixedUpdate), Finite State Machines, and Entity Component Systems.",
            "subtopics": [
                  "Game loop execution: variable Update() vs fixed timestep FixedUpdate()",
                  "Finite State Machines (FSM) for character movement and animation",
                  "Entity Component System (ECS) architecture for massive entity counts",
                  "Singleton pattern and ScriptableObjects for modular game architecture"
            ],
            "resources": [
                  {
                        "title": "Game Programming Patterns (Robert Nystrom)",
                        "url": "https://gameprogrammingpatterns.com/"
                  }
            ]
      },
      {
            "id": "gd_graphics_shaders",
            "label": "Graphics Pipeline & Shaders (HLSL / GLSL)",
            "phase": "3. Graphics & Shaders",
            "status": "not_started",
            "description": "Render visual worlds: 3D graphics rendering pipeline, vertex shaders, fragment/pixel shaders, materials, and lighting models.",
            "subtopics": [
                  "Rendering pipeline stages: Vertex -> Rasterization -> Fragment",
                  "Writing custom shaders with HLSL / Shader Graph in Unity",
                  "PBR (Physically Based Rendering) materials: albedo, metallic, smoothness/roughness",
                  "Post-processing effects: bloom, color grading, ambient occlusion, depth of field"
            ],
            "resources": [
                  {
                        "title": "The Book of Shaders",
                        "url": "https://thebookofshaders.com/"
                  }
            ]
      },
      {
            "id": "gd_ai_audio",
            "label": "Game AI (Pathfinding & Behavior Trees) & Audio",
            "phase": "4. AI, Audio & Optimization",
            "status": "not_started",
            "description": "Bring game worlds to life: A* pathfinding algorithm, NavMesh navigation, AI Behavior Trees, and 3D spatial audio.",
            "subtopics": [
                  "A* pathfinding algorithm and heuristic distance estimation",
                  "NavMesh surface generation and AI agent path following",
                  "Behavior Trees: Composites (Sequence, Selector), Decorators, and Actions",
                  "3D spatial audio attenuation and dynamic sound mixers (FMOD / Wwise)"
            ],
            "resources": [
                  {
                        "title": "AI for Games (Ian Millington)",
                        "url": "https://www.routledge.com/AI-for-Games-Third-Edition/Millington/p/book/9781138483972"
                  }
            ]
      },
      {
            "id": "gd_profiling_opt",
            "label": "Game Profiling & Performance Optimization",
            "phase": "4. AI, Audio & Optimization",
            "status": "not_started",
            "description": "Maintain steady 60/120 FPS frame rates: reducing draw calls, mesh batching, LOD systems, occlusion culling, and memory profiling.",
            "subtopics": [
                  "Unity Profiler / Unreal Unreal Insights CPU and GPU timeline inspection",
                  "Draw call reduction: Static and dynamic batching, GPU instancing",
                  "Levels of Detail (LOD) systems and Occlusion Culling",
                  "Texture compression formats and memory footprint budgets"
            ],
            "resources": [
                  {
                        "title": "Unity Performance Optimization Guide",
                        "url": "https://unity.com/how-to/profile-and-optimize-your-game-performance"
                  }
            ]
      }
],
    edges: [
      {
            "source": "gd_math_physics",
            "target": "gd_cpp_csharp"
      },
      {
            "source": "gd_cpp_csharp",
            "target": "gd_game_engines"
      },
      {
            "source": "gd_game_engines",
            "target": "gd_game_loop_arch"
      },
      {
            "source": "gd_game_loop_arch",
            "target": "gd_graphics_shaders"
      },
      {
            "source": "gd_graphics_shaders",
            "target": "gd_ai_audio"
      },
      {
            "source": "gd_ai_audio",
            "target": "gd_profiling_opt"
      }
]
  },

  // ─── Server Side Game Developer ─────────────────────────────────────────────────────────
  'server-side-game-developer': {
    id: 'server-side-game-developer',
    name: 'Server Side Game Developer',
    icon: '🕹️',
    badge: 'roadmap.sh',
    category: 'development',
    description: "High-scale multiplayer game backend engineering: UDP vs TCP protocols, dedicated authoritative servers, client prediction & server reconciliation, spatial partitioning grids, matchmaking with Agones on Kubernetes, and persistent Redis leaderboards.",
    roadmapUrl: 'https://roadmap.sh/server-side-game-developer',
    nodes: [
      {
            "id": "ssg_networking_protocols",
            "label": "Game Networking: UDP vs TCP & WebSockets",
            "phase": "1. Networking & Protocols",
            "status": "not_started",
            "description": "Foundations of multiplayer network programming: UDP packet transmission, TCP stream reliability, WebSockets, and binary serialization.",
            "subtopics": [
                  "Why fast-paced multiplayer games use UDP over TCP",
                  "Packet loss, out-of-order delivery, and jitter mitigation",
                  "Custom binary packet serialization (Protobuf / FlatBuffers)",
                  "WebSockets for browser-based and turn-based games"
            ],
            "resources": [
                  {
                        "title": "Glenn Fiedler: Gaffer on Games Networking",
                        "url": "https://gafferongames.com/"
                  }
            ]
      },
      {
            "id": "ssg_authoritative_server",
            "label": "Dedicated Authoritative Game Servers",
            "phase": "2. Architecture & Synchronization",
            "status": "not_started",
            "description": "Architect secure multiplayer game servers: Dedicated Authoritative Server architecture, server tick rates (30Hz/60Hz), and state sync.",
            "subtopics": [
                  "Authoritative server model vs peer-to-peer (P2P) vulnerabilities",
                  "Server game loop, fixed simulation tick rates, and delta timing",
                  "State synchronization: full state snapshots vs delta compression",
                  "Anti-cheat design: preventing speed hacks and impossible actions on the server"
            ],
            "resources": [
                  {
                        "title": "Valve: Source Multiplayer Networking",
                        "url": "https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking"
                  }
            ]
      },
      {
            "id": "ssg_latency_compensation",
            "label": "Latency Compensation & Client Prediction",
            "phase": "2. Architecture & Synchronization",
            "status": "not_started",
            "description": "Hide network lag for smooth player experience: Client-side prediction, server reconciliation, entity interpolation, and lag compensation.",
            "subtopics": [
                  "Client-side prediction for instant local player responsiveness",
                  "Server reconciliation on prediction mispredictions",
                  "Linear and hermite interpolation for remote player movement",
                  "Lag compensation (rewinding server state for hitscan weapons)"
            ],
            "resources": [
                  {
                        "title": "Gabriel Gambetta: Fast-Paced Multiplayer",
                        "url": "https://www.gabrielgambetta.com/client-server-game-architecture.html"
                  }
            ]
      },
      {
            "id": "ssg_spatial_partitioning",
            "label": "Spatial Partitioning & Interest Management",
            "phase": "3. Scaling & Infrastructure",
            "status": "not_started",
            "description": "Scale game servers to hundreds of players: spatial partitioning grids, quadtrees, and interest management / relevance filtering.",
            "subtopics": [
                  "Spatial grid partitioning for fast player proximity queries",
                  "Quadtree and octree data structures for 2D/3D spatial indexing",
                  "Interest Management: Only sending packets for entities within player view distance",
                  "Area of Interest (AOI) pub/sub filtering to conserve server network bandwidth"
            ],
            "resources": [
                  {
                        "title": "Spatial Partitioning in Game Development",
                        "url": "https://gameprogrammingpatterns.com/spatial-partition.html"
                  }
            ]
      },
      {
            "id": "ssg_matchmaking_fleet",
            "label": "Matchmaking, Fleet Scaling & Agones",
            "phase": "3. Scaling & Infrastructure",
            "status": "not_started",
            "description": "Manage fleets of game server containers: matchmaking systems (ELO/MMR), lobby sessions, and Kubernetes orchestration with Agones.",
            "subtopics": [
                  "Matchmaking logic: ELO / MMR rating calculations and latency matching",
                  "Lobby services, room codes, and game session management",
                  "Agones: Open-source Kubernetes platform for scaling dedicated game servers",
                  "Zero-downtime rolling updates and handling stateful long-lived game matches"
            ],
            "resources": [
                  {
                        "title": "Agones: Dedicated Game Server Hosting on Kubernetes",
                        "url": "https://agones.dev/"
                  }
            ]
      },
      {
            "id": "ssg_persistent_services",
            "label": "Persistent Game Backend & Economy Services",
            "phase": "4. Player Services & Persistence",
            "status": "not_started",
            "description": "Build supporting live-ops game services: player profiles, virtual economy transactions, inventory databases, and Redis leaderboards.",
            "subtopics": [
                  "Relational vs NoSQL databases for storing player inventories and gear",
                  "ACID transactions for in-game purchases and virtual currency balances",
                  "Global and regional leaderboards using Redis Sorted Sets",
                  "Analytics event logging for player telemetry and balance tuning"
            ],
            "resources": [
                  {
                        "title": "Building Scalable Game Backends (AWS Games)",
                        "url": "https://aws.amazon.com/gametech/"
                  }
            ]
      }
],
    edges: [
      {
            "source": "ssg_networking_protocols",
            "target": "ssg_authoritative_server"
      },
      {
            "source": "ssg_authoritative_server",
            "target": "ssg_latency_compensation"
      },
      {
            "source": "ssg_latency_compensation",
            "target": "ssg_spatial_partitioning"
      },
      {
            "source": "ssg_spatial_partitioning",
            "target": "ssg_matchmaking_fleet"
      },
      {
            "source": "ssg_matchmaking_fleet",
            "target": "ssg_persistent_services"
      }
]
  }

};
