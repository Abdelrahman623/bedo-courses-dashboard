import type { RoadmapTemplate } from '../roadmapTemplates';

export const MANAGEMENT_DESIGN_ROADMAPS: Record<string, RoadmapTemplate> = {
  // ─── Software Architect ─────────────────────────────────────────────────────────
  'software-architect': {
    id: 'software-architect',
    name: 'Software Architect',
    icon: '🏛️',
    badge: 'roadmap.sh',
    category: 'architecture_design',
    description: "Master high-scale software architecture: Non-functional requirements, Clean Architecture, Domain-Driven Design (DDD), CQRS, Event Sourcing, Saga distributed transactions, distributed consensus, resilience patterns, and C4 model documentation.",
    roadmapUrl: 'https://roadmap.sh/software-architect',
    nodes: [
      {
            "id": "sa_principles",
            "label": "Architecture Principles & Quality Attributes",
            "phase": "1. Foundations & NFRs",
            "status": "not_started",
            "description": "Balance Non-Functional Requirements (NFRs): Scalability, Availability, Maintainability, Latency, and Cost-efficiency.",
            "subtopics": [
                  "Quality attributes & tradeoffs (Availability vs Consistency)",
                  "Software architecture vs Software design",
                  "Technical debt management strategies",
                  "Evaluating architecture with ATAM (Architecture Tradeoff Analysis Method)"
            ],
            "resources": [
                  {
                        "title": "Software Architecture Patterns (Mark Richards)",
                        "url": "https://www.oreilly.com/library/view/software-architecture-patterns/9781491971437/"
                  }
            ]
      },
      {
            "id": "sa_paradigms",
            "label": "Architectural Styles & Microservices",
            "phase": "1. Foundations & NFRs",
            "status": "not_started",
            "description": "Compare architectural topologies: Monolith, Modular Monolith, Microservices, Event-Driven, and Service-Oriented (SOA).",
            "subtopics": [
                  "Monolith to Microservices decomposition strategies",
                  "Modular monoliths and package encapsulation",
                  "Microservices anti-patterns (Distributed Monolith)",
                  "Cell-based architecture for high isolation"
            ],
            "resources": [
                  {
                        "title": "Martin Fowler: Microservices Guide",
                        "url": "https://martinfowler.com/microservices/"
                  }
            ]
      },
      {
            "id": "sa_clean_arch",
            "label": "Clean Architecture & Hexagonal Ports/Adapters",
            "phase": "2. Domain & Application Design",
            "status": "not_started",
            "description": "Decouple core business logic from databases and external frameworks using Hexagonal (Ports and Adapters) architecture.",
            "subtopics": [
                  "Onion Architecture & Dependency Inversion Principle",
                  "Ports (Interfaces) and Adapters (Implementations)",
                  "Domain layer purity without framework dependencies",
                  "Application use-case orchestrators"
            ],
            "resources": [
                  {
                        "title": "Clean Architecture by Robert C. Martin",
                        "url": "https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html"
                  }
            ]
      },
      {
            "id": "sa_ddd",
            "label": "Domain-Driven Design (DDD)",
            "phase": "2. Domain & Application Design",
            "status": "not_started",
            "description": "Model complex domains: Ubiquitous Language, Bounded Contexts, Aggregates, Entities, Value Objects, and Context Maps.",
            "subtopics": [
                  "Strategic DDD: Bounded Contexts & Subdomains (Core, Supporting, Generic)",
                  "Tactical DDD: Entities, Value Objects, Aggregate Roots",
                  "Domain Events for asynchronous cross-context synchronization",
                  "Context Mapping patterns (Partnership, Shared Kernel, Anti-Corruption Layer)"
            ],
            "resources": [
                  {
                        "title": "Domain-Driven Design Reference (Eric Evans)",
                        "url": "https://www.domainlanguage.com/ddd/reference/"
                  }
            ]
      },
      {
            "id": "sa_patterns_cqrs",
            "label": "Enterprise Patterns: CQRS & Event Sourcing",
            "phase": "3. Distributed Patterns",
            "status": "not_started",
            "description": "Segregate read and write models with CQRS; preserve full state history as immutable append-only events with Event Sourcing.",
            "subtopics": [
                  "Command Query Responsibility Segregation (CQRS) flow",
                  "Event Sourcing: Reconstructing state from event streams",
                  "Materialized read views and projections",
                  "Transactional Outbox pattern for reliable event publishing"
            ],
            "resources": [
                  {
                        "title": "Microsoft: CQRS Pattern",
                        "url": "https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs"
                  }
            ]
      },
      {
            "id": "sa_dist_transactions",
            "label": "Distributed Transactions & Saga Pattern",
            "phase": "3. Distributed Patterns",
            "status": "not_started",
            "description": "Manage data consistency across distributed microservices without two-phase commit: Choreography and Orchestration Sagas.",
            "subtopics": [
                  "Saga Pattern: Choreography (Event-driven) vs Orchestration (Central coordinator)",
                  "Compensating transactions for failure rollback",
                  "Two-Phase Commit (2PC) limitations in modern cloud",
                  "Idempotent consumers and deduplication tokens"
            ],
            "resources": [
                  {
                        "title": "Microservices.io: Saga Pattern",
                        "url": "https://microservices.io/patterns/data/saga.html"
                  }
            ]
      },
      {
            "id": "sa_dist_systems",
            "label": "Distributed Systems & Consistency Models",
            "phase": "4. Distributed Systems",
            "status": "not_started",
            "description": "Deep dive into CAP Theorem, PACELC theorem, consensus algorithms (Raft, Paxos), and data partitioning strategies.",
            "subtopics": [
                  "CAP Theorem and real-world PACELC tradeoffs",
                  "Consistency models: Linearizability, Sequential, Eventual, Read-Your-Writes",
                  "Horizontal database sharding & consistent hashing",
                  "Consensus protocols: Raft and Paxos high-level mechanics"
            ],
            "resources": [
                  {
                        "title": "Designing Data-Intensive Applications (Martin Kleppmann)",
                        "url": "https://dataintensive.net/"
                  }
            ]
      },
      {
            "id": "sa_resilience",
            "label": "System Resilience, Caching & Fault Tolerance",
            "phase": "4. Distributed Systems",
            "status": "not_started",
            "description": "Build self-healing systems: Circuit Breakers, Bulkheads, Rate Limiting, distributed caching strategies, and Backpressure.",
            "subtopics": [
                  "Circuit Breaker pattern (Closed, Open, Half-Open states)",
                  "Bulkhead isolation and thread pool partition",
                  "Distributed caching patterns: Cache-Aside, Write-Through, Write-Behind",
                  "Rate limiting algorithms (Token Bucket, Leaky Bucket)"
            ],
            "resources": [
                  {
                        "title": "AWS Well-Architected Reliability Pillar",
                        "url": "https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html"
                  }
            ]
      },
      {
            "id": "sa_documentation_c4",
            "label": "Architecture Documentation (C4 Model & ADRs)",
            "phase": "5. Governance & Documentation",
            "status": "not_started",
            "description": "Communicate software architectures effectively to engineers and executives using C4 diagrams and Architecture Decision Records (ADRs).",
            "subtopics": [
                  "C4 Model: Context, Container, Component, and Code diagrams",
                  "Architecture Decision Records (ADRs) template and lifecycle",
                  "Threat modeling during architectural reviews",
                  "Building and maintaining an Engineering Technology Radar"
            ],
            "resources": [
                  {
                        "title": "The C4 Model for Visualising Software Architecture",
                        "url": "https://c4model.com/"
                  }
            ]
      }
],
    edges: [
      {
            "source": "sa_principles",
            "target": "sa_paradigms"
      },
      {
            "source": "sa_paradigms",
            "target": "sa_clean_arch"
      },
      {
            "source": "sa_clean_arch",
            "target": "sa_ddd"
      },
      {
            "source": "sa_ddd",
            "target": "sa_patterns_cqrs"
      },
      {
            "source": "sa_patterns_cqrs",
            "target": "sa_dist_transactions"
      },
      {
            "source": "sa_dist_transactions",
            "target": "sa_dist_systems"
      },
      {
            "source": "sa_dist_systems",
            "target": "sa_resilience"
      },
      {
            "source": "sa_resilience",
            "target": "sa_documentation_c4"
      }
]
  },

  // ─── PostgreSQL ─────────────────────────────────────────────────────────
  'postgresql-dba': {
    id: 'postgresql-dba',
    name: 'PostgreSQL',
    icon: '🐘',
    badge: 'roadmap.sh',
    category: 'architecture_design',
    description: "Deep PostgreSQL Database Administration: Engine internals, MVCC, VACUUM tuning, B-Tree/GIN/BRIN indexing, EXPLAIN ANALYZE query optimization, PgBouncer pooling, Patroni streaming replication, partitioning, and pgBackRest disaster recovery.",
    roadmapUrl: 'https://roadmap.sh/postgresql-dba',
    nodes: [
      {
            "id": "pg_internals",
            "label": "PostgreSQL Architecture & Memory Internals",
            "phase": "1. Architecture & Storage",
            "status": "not_started",
            "description": "Deep dive into Postgres processes: Postmaster, backend workers, shared memory buffers, WAL writer, checkpointer, and background writer.",
            "subtopics": [
                  "Shared memory layout: shared_buffers, WAL buffers",
                  "Backend process lifecycle and connection overhead",
                  "Disk storage layout: Tablespaces, databases, and page file blocks (8KB)",
                  "Checkpoints, dirty buffer flushes, and recovery"
            ],
            "resources": [
                  {
                        "title": "The Internals of PostgreSQL (Hironobu Suzuki)",
                        "url": "https://www.interdb.jp/pg/"
                  }
            ]
      },
      {
            "id": "pg_mvcc_vacuum",
            "label": "MVCC, Tuple Versions & VACUUM Internals",
            "phase": "1. Architecture & Storage",
            "status": "not_started",
            "description": "Understand Multi-Version Concurrency Control: xmin/xmax tuple headers, transaction visibility, table bloat, and autovacuum tuning.",
            "subtopics": [
                  "xmin, xmax, and snapshot isolation visibility rules",
                  "Table bloat causes and measuring dead tuples",
                  "VACUUM vs VACUUM FULL vs pg_repack zero-downtime compaction",
                  "Autovacuum worker tuning (autovacuum_vacuum_cost_limit, scale_factor)"
            ],
            "resources": [
                  {
                        "title": "PostgreSQL Docs: Concurrency Control",
                        "url": "https://www.postgresql.org/docs/current/mvcc.html"
                  }
            ]
      },
      {
            "id": "pg_indexing",
            "label": "Advanced Indexing Strategies & Types",
            "phase": "2. Indexes & Performance",
            "status": "not_started",
            "description": "Choose the optimal index type: B-Tree, GIN, GiST, BRIN, and SP-GiST; partial, expression, and covering indexes with INCLUDE.",
            "subtopics": [
                  "B-Tree index structure, leaf pages, and sorting",
                  "GIN indexes for JSONB, arrays, and full-text search",
                  "BRIN (Block Range Index) for massive time-series tables",
                  "Covering indexes (INCLUDE clause) for index-only scans"
            ],
            "resources": [
                  {
                        "title": "Use The Index, Luke! (Markus Winand)",
                        "url": "https://use-the-index-luke.com/"
                  }
            ]
      },
      {
            "id": "pg_tuning",
            "label": "Query Execution Plans & Performance Optimization",
            "phase": "2. Indexes & Performance",
            "status": "not_started",
            "description": "Master EXPLAIN (ANALYZE, BUFFERS), cost estimates, scan types, join algorithms, and tuning memory parameters (work_mem).",
            "subtopics": [
                  "EXPLAIN ANALYZE reading: Seq Scan, Index Scan, Bitmap Scan",
                  "Join methods: Nested Loop, Hash Join, Merge Join",
                  "work_mem and maintenance_work_mem tuning",
                  "pg_stat_statements for identifying slowest production queries"
            ],
            "resources": [
                  {
                        "title": "PostgreSQL EXPLAIN Explained",
                        "url": "https://www.depesz.com/"
                  }
            ]
      },
      {
            "id": "pg_connection_pooling",
            "label": "Connection Pooling with PgBouncer",
            "phase": "3. Scaling & High Availability",
            "status": "not_started",
            "description": "Scale concurrent client connections without exhausting database process memory using PgBouncer pooling modes.",
            "subtopics": [
                  "Session vs Transaction vs Statement pooling modes",
                  "Configuring pgbouncer.ini and auth_file",
                  "Handling prepared statements with transaction pooling",
                  "Monitoring pool stats (SHOW POOLS, SHOW CLIENTS)"
            ],
            "resources": [
                  {
                        "title": "PgBouncer Documentation",
                        "url": "https://www.pgbouncer.org/"
                  }
            ]
      },
      {
            "id": "pg_replication",
            "label": "Streaming Replication & High Availability (Patroni)",
            "phase": "3. Scaling & High Availability",
            "status": "not_started",
            "description": "Configure Physical Streaming Replication, synchronous standby nodes, replication slots, and automated failover with Patroni.",
            "subtopics": [
                  "Physical streaming replication (synchronous vs asynchronous)",
                  "Replication slots and preventing WAL deletion",
                  "Patroni high-availability template with etcd / Consul consensus",
                  "Logical replication for selective cross-database publishing"
            ],
            "resources": [
                  {
                        "title": "Patroni High Availability PostgreSQL",
                        "url": "https://patroni.readthedocs.io/"
                  }
            ]
      },
      {
            "id": "pg_partitioning",
            "label": "Declarative Partitioning & Sharding",
            "phase": "4. Scaling & Disaster Recovery",
            "status": "not_started",
            "description": "Partition large enterprise tables: Range, List, and Hash partitioning, partition pruning, and scaling with Citus.",
            "subtopics": [
                  "Range partitioning on dates/timestamps",
                  "List and Hash partitioning strategies",
                  "Runtime partition pruning performance benefits",
                  "Citus distributed tables extension for multi-node PostgreSQL"
            ],
            "resources": [
                  {
                        "title": "PostgreSQL Table Partitioning Guide",
                        "url": "https://www.postgresql.org/docs/current/ddl-partitioning.html"
                  }
            ]
      },
      {
            "id": "pg_backup_pitr",
            "label": "Enterprise Backups & PITR (pgBackRest)",
            "phase": "4. Scaling & Disaster Recovery",
            "status": "not_started",
            "description": "Implement disaster recovery: physical backups, continuous WAL archiving, and Point-In-Time Recovery (PITR) with pgBackRest.",
            "subtopics": [
                  "pg_dump / pg_restore logical backups vs physical backups",
                  "Continuous WAL archiving to Amazon S3 / cloud storage",
                  "Point-In-Time Recovery (PITR) recovery.conf / standby.signal",
                  "pgBackRest parallel compression and automated restore validation"
            ],
            "resources": [
                  {
                        "title": "pgBackRest Official Documentation",
                        "url": "https://pgbackrest.org/"
                  }
            ]
      }
],
    edges: [
      {
            "source": "pg_internals",
            "target": "pg_mvcc_vacuum"
      },
      {
            "source": "pg_mvcc_vacuum",
            "target": "pg_indexing"
      },
      {
            "source": "pg_indexing",
            "target": "pg_tuning"
      },
      {
            "source": "pg_tuning",
            "target": "pg_connection_pooling"
      },
      {
            "source": "pg_connection_pooling",
            "target": "pg_replication"
      },
      {
            "source": "pg_replication",
            "target": "pg_partitioning"
      },
      {
            "source": "pg_partitioning",
            "target": "pg_backup_pitr"
      }
]
  },

  // ─── Product Design ─────────────────────────────────────────────────────────
  'product-design': {
    id: 'product-design',
    name: 'Product Design',
    icon: '📐',
    badge: 'roadmap.sh',
    category: 'architecture_design',
    description: "Complete Product Design curriculum: Design Thinking, user interviews, information architecture, 8pt spatial grid visual design, Figma design systems & tokens, smart animate prototyping, and developer handoff.",
    roadmapUrl: 'https://roadmap.sh/product-design',
    nodes: [
      {
            "id": "pd_thinking",
            "label": "Design Thinking & Double Diamond Model",
            "phase": "1. Discovery & Research",
            "status": "not_started",
            "description": "Iterative problem-solving framework: Discover, Define, Develop, Deliver; framing problem statements and user needs.",
            "subtopics": [
                  "Double Diamond 4-phase design methodology",
                  "Problem statement framing (How Might We questions)",
                  "Stakeholder alignment and kickoff workshops",
                  "Balancing user desirability, business viability, technical feasibility"
            ],
            "resources": [
                  {
                        "title": "Nielsen Norman Group: Design Thinking 101",
                        "url": "https://www.nngroup.com/articles/design-thinking/"
                  }
            ]
      },
      {
            "id": "pd_research",
            "label": "User Research & Synthesis",
            "phase": "1. Discovery & Research",
            "status": "not_started",
            "description": "Qualitative and quantitative research: interviews, surveys, empathy mapping, personas, and user journey maps.",
            "subtopics": [
                  "Conducting semi-structured user interviews",
                  "Empathy maps & evidence-based user personas",
                  "Customer journey mapping (touchpoints, friction, emotions)",
                  "Synthesizing qualitative findings with affinity diagramming"
            ],
            "resources": [
                  {
                        "title": "Just Enough Research (Erika Hall)",
                        "url": "https://abookapart.com/products/just-enough-research"
                  }
            ]
      },
      {
            "id": "pd_ia",
            "label": "Information Architecture & User Flows",
            "phase": "2. Structure & Wireframing",
            "status": "not_started",
            "description": "Organize digital experiences logically: sitemaps, card sorting, user flow diagrams, and low-fidelity wireframing.",
            "subtopics": [
                  "Card sorting (open vs closed) for taxonomy testing",
                  "Sitemap structuring and hierarchy",
                  "User task flow diagrams with decision branches",
                  "Low-fidelity wireframing for rapid concept validation"
            ],
            "resources": [
                  {
                        "title": "Information Architecture for the Web (O’Reilly)",
                        "url": "https://www.oreilly.com/library/view/information-architecture-4th/9781491913529/"
                  }
            ]
      },
      {
            "id": "pd_visual_design",
            "label": "Visual Design Fundamentals & 8pt Grid",
            "phase": "2. Structure & Wireframing",
            "status": "not_started",
            "description": "UI typography, color theory, contrast ratios, iconography, and spatial rhythm using an 8pt layout grid.",
            "subtopics": [
                  "Typography scales, line-heights, and readability",
                  "Color palettes (60-30-10 rule) and semantic colors",
                  "8pt and 4pt spatial layout grids",
                  "Visual hierarchy (contrast, scale, proximity, alignment)"
            ],
            "resources": [
                  {
                        "title": "Refactoring UI (Adam Wathan & Steve Schoger)",
                        "url": "https://www.refactoringui.com/"
                  }
            ]
      },
      {
            "id": "pd_figma_systems",
            "label": "Figma Mastery & Design Systems",
            "phase": "3. Design Systems & Prototyping",
            "status": "not_started",
            "description": "Build enterprise design systems: Auto-layout 5.0, component variants, properties, and scalable Design Tokens.",
            "subtopics": [
                  "Figma Auto-layout responsive resizing",
                  "Component variants & boolean/text properties",
                  "Design tokens (color, spacing, typography) structure",
                  "Atomic Design methodology (Atoms, Molecules, Organisms)"
            ],
            "resources": [
                  {
                        "title": "Figma Design Systems Guide",
                        "url": "https://help.figma.com/hc/en-us/articles/360038662654-Guide-to-design-systems"
                  }
            ]
      },
      {
            "id": "pd_prototyping",
            "label": "Interactive Prototyping & Micro-interactions",
            "phase": "3. Design Systems & Prototyping",
            "status": "not_started",
            "description": "Craft realistic high-fidelity prototypes: smart animate, micro-interactions, interactive variables, and component states.",
            "subtopics": [
                  "Figma Smart Animate & transition easing curves",
                  "Component states (default, hover, active, disabled, focus)",
                  "Figma variables & conditional prototype logic",
                  "Designing micro-interactions for instant user feedback"
            ],
            "resources": [
                  {
                        "title": "Figma Advanced Prototyping Tutorials",
                        "url": "https://help.figma.com/hc/en-us/sections/360006764514-Prototyping"
                  }
            ]
      },
      {
            "id": "pd_testing_handoff",
            "label": "Usability Testing & Developer Handoff",
            "phase": "4. Testing & Handoff",
            "status": "not_started",
            "description": "Validate designs with real users (unmoderated tests, think-aloud) and deliver pixel-perfect specs to developers.",
            "subtopics": [
                  "Usability testing protocols & task prompt writing",
                  "Analyzing test results (System Usability Scale SUS, completion rate)",
                  "Figma Dev Mode specs, inspect, and token exports",
                  "Design QA during frontend implementation sprints"
            ],
            "resources": [
                  {
                        "title": "Design Handoff Guide (InVision)",
                        "url": "https://www.invisionapp.com/inside-design/design-handoff/"
                  }
            ]
      }
],
    edges: [
      {
            "source": "pd_thinking",
            "target": "pd_research"
      },
      {
            "source": "pd_research",
            "target": "pd_ia"
      },
      {
            "source": "pd_ia",
            "target": "pd_visual_design"
      },
      {
            "source": "pd_visual_design",
            "target": "pd_figma_systems"
      },
      {
            "source": "pd_figma_systems",
            "target": "pd_prototyping"
      },
      {
            "source": "pd_prototyping",
            "target": "pd_testing_handoff"
      }
]
  },

  // ─── UX Design ─────────────────────────────────────────────────────────
  'ux-design': {
    id: 'ux-design',
    name: 'UX Design',
    icon: '✨',
    badge: 'roadmap.sh',
    category: 'architecture_design',
    description: "User Experience Design mastery: Cognitive psychology (Hick’s, Fitts’s, Jakob’s Laws), Gestalt perception, Nielsen’s 10 Usability Heuristics, WCAG 2.2 accessibility, interaction design, and SUS usability benchmarking.",
    roadmapUrl: 'https://roadmap.sh/ux-design',
    nodes: [
      {
            "id": "ux_psychology",
            "label": "Cognitive Psychology & Laws of UX",
            "phase": "1. UX Foundations",
            "status": "not_started",
            "description": "Understand how the human brain interacts with software: Hick’s Law, Fitts’s Law, Jakob’s Law, and Miller’s Law.",
            "subtopics": [
                  "Hick’s Law: Decision time increases with choices",
                  "Fitts’s Law: Target distance and size mechanics",
                  "Jakob’s Law: Users expect familiarity across web apps",
                  "Miller’s Law & Cognitive Load Theory (Intrinsic, Extraneous, Germane)"
            ],
            "resources": [
                  {
                        "title": "Laws of UX (Jon Yablonski)",
                        "url": "https://lawsofux.com/"
                  }
            ]
      },
      {
            "id": "ux_gestalt",
            "label": "Gestalt Principles of Visual Perception",
            "phase": "1. UX Foundations",
            "status": "not_started",
            "description": "Apply perception principles to UI layouts: Proximity, Similarity, Continuity, Closure, and Common Region.",
            "subtopics": [
                  "Principle of Proximity for grouping related controls",
                  "Similarity in visual styles and interactive affordances",
                  "Common Region containers and card UI groupings",
                  "Focal points and visual contrast guiding user attention"
            ],
            "resources": [
                  {
                        "title": "Nielsen Norman Group: Gestalt Principles",
                        "url": "https://www.nngroup.com/articles/gestalt-similarity/"
                  }
            ]
      },
      {
            "id": "ux_heuristics",
            "label": "Nielsen’s 10 Usability Heuristics",
            "phase": "2. Heuristics & Architecture",
            "status": "not_started",
            "description": "Evaluate interfaces using industry-standard heuristics: visibility of system status, error prevention, and user control.",
            "subtopics": [
                  "Visibility of system status & loading indicators",
                  "Match between system and the real world",
                  "User control and freedom (undo, redo, cancel)",
                  "Error prevention and helpful error recovery messages"
            ],
            "resources": [
                  {
                        "title": "10 Usability Heuristics for User Interface Design (Jakob Nielsen)",
                        "url": "https://www.nngroup.com/articles/ten-usability-heuristics/"
                  }
            ]
      },
      {
            "id": "ux_accessibility",
            "label": "Accessibility (a11y) & WCAG 2.2 Standards",
            "phase": "2. Heuristics & Architecture",
            "status": "not_started",
            "description": "Ensure designs are inclusive and accessible to everyone: WCAG 2.2 AA standards, screen readers, contrast, and focus states.",
            "subtopics": [
                  "Color contrast requirements (4.5:1 for normal text, 3:1 for large)",
                  "Accessible keyboard navigation & visible focus rings",
                  "Screen reader announcements, alt text, and semantic HTML",
                  "Designing for motor impairments and color blindness modes"
            ],
            "resources": [
                  {
                        "title": "W3C Web Content Accessibility Guidelines (WCAG) 2.2",
                        "url": "https://www.w3.org/WAI/standards-guidelines/wcag/"
                  }
            ]
      },
      {
            "id": "ux_interaction",
            "label": "Interaction Design & Feedback Loops",
            "phase": "3. Interaction & Validation",
            "status": "not_started",
            "description": "Design intuitive interaction loops: affordances, signifiers, form validations, empty states, and progressive disclosure.",
            "subtopics": [
                  "Affordances vs Signifiers in digital controls",
                  "Progressive disclosure to minimize upfront complexity",
                  "Form design: inline validation, error states, and label placement",
                  "Zero-data empty states and celebratory confirmation states"
            ],
            "resources": [
                  {
                        "title": "The Design of Everyday Things (Don Norman)",
                        "url": "https://jnd.org/the-design-of-everyday-things-revised-and-expanded-edition/"
                  }
            ]
      },
      {
            "id": "ux_validation",
            "label": "Usability Benchmarking & UX Metrics",
            "phase": "3. Interaction & Validation",
            "status": "not_started",
            "description": "Quantify user experience with empirical data: System Usability Scale (SUS), Customer Effort Score (CES), and Task Success Rate.",
            "subtopics": [
                  "System Usability Scale (SUS) survey calculation and benchmark scores",
                  "Time-on-Task & Task Completion Rate tracking",
                  "Customer Effort Score (CES) post-interaction surveys",
                  "A/B testing qualitative validation and heatmaps (Hotjar)"
            ],
            "resources": [
                  {
                        "title": "Measuring the User Experience (Tullis & Albert)",
                        "url": "https://www.elsevier.com/books/measuring-the-user-experience/albert/978-0-12-415781-1"
                  }
            ]
      }
],
    edges: [
      {
            "source": "ux_psychology",
            "target": "ux_gestalt"
      },
      {
            "source": "ux_gestalt",
            "target": "ux_heuristics"
      },
      {
            "source": "ux_heuristics",
            "target": "ux_accessibility"
      },
      {
            "source": "ux_accessibility",
            "target": "ux_interaction"
      },
      {
            "source": "ux_interaction",
            "target": "ux_validation"
      }
]
  },

  // ─── Product Manager ─────────────────────────────────────────────────────────
  'product-manager': {
    id: 'product-manager',
    name: 'Product Manager',
    icon: '🎯',
    badge: 'roadmap.sh',
    category: 'product_management',
    description: "End-to-end Product Management: Product vision & TAM market sizing, customer discovery with Jobs To Be Done (JTBD), RICE prioritization, outcome-based OKR roadmaps, Agile Scrum delivery, AARRR growth analytics, and go-to-market launches.",
    roadmapUrl: 'https://roadmap.sh/product-manager',
    nodes: [
      {
            "id": "pm_strategy",
            "label": "Product Vision & Market Strategy",
            "phase": "1. Strategy & Discovery",
            "status": "not_started",
            "description": "Formulate winning product strategy: Product Vision statements, TAM/SAM/SOM market sizing, and competitive positioning.",
            "subtopics": [
                  "Defining inspiring Product Vision & Mission",
                  "Total Addressable Market (TAM) bottom-up estimation",
                  "Value Proposition Canvas (Customer jobs vs Pain relievers)",
                  "Competitive differentiation and blue ocean strategy"
            ],
            "resources": [
                  {
                        "title": "Inspired: How to Create Tech Products Customers Love (Marty Cagan)",
                        "url": "https://svpg.com/books/inspired-how-to-create-tech-products-customers-love/"
                  }
            ]
      },
      {
            "id": "pm_discovery",
            "label": "Continuous Customer Discovery & JTBD",
            "phase": "1. Strategy & Discovery",
            "status": "not_started",
            "description": "Validate problems before building solutions: Jobs To Be Done (JTBD), customer problem interviews, and assumption testing.",
            "subtopics": [
                  "The Mom Test: How to talk to customers without lying",
                  "Jobs To Be Done (JTBD) framework and outcome statements",
                  "Opportunity Solution Trees (Teresa Torres)",
                  "Assumption testing and prototype validation sprints"
            ],
            "resources": [
                  {
                        "title": "Continuous Discovery Habits (Teresa Torres)",
                        "url": "https://www.producttalk.org/continuous-discovery-habits/"
                  }
            ]
      },
      {
            "id": "pm_prioritization",
            "label": "Prioritization Frameworks (RICE / MoSCoW)",
            "phase": "2. Roadmapping & Prioritization",
            "status": "not_started",
            "description": "Make defensible roadmap tradeoffs using quantitative prioritization models: RICE, MoSCoW, Kano, and Cost of Delay.",
            "subtopics": [
                  "RICE scoring: Reach, Impact, Confidence, Effort",
                  "MoSCoW method: Must have, Should have, Could have, Won’t have",
                  "Kano Model: Basic expectations vs Delighters",
                  "Cost of Delay / Weighted Shortest Job First (WSJF)"
            ],
            "resources": [
                  {
                        "title": "Intercom on Product Management: RICE Scoring",
                        "url": "https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/"
                  }
            ]
      },
      {
            "id": "pm_roadmaps_okrs",
            "label": "Outcome-Based Roadmaps & OKRs",
            "phase": "2. Roadmapping & Prioritization",
            "status": "not_started",
            "description": "Shift from output feature factories to business outcomes: Objectives and Key Results (OKRs) and Now-Next-Later roadmaps.",
            "subtopics": [
                  "Now-Next-Later roadmap format vs rigid timelines",
                  "Writing measurable OKRs (Objective + 3 Key Results)",
                  "Connecting company strategy to engineering team initiatives",
                  "Managing executive stakeholder expectations and pushback"
            ],
            "resources": [
                  {
                        "title": "Measure What Matters (John Doerr)",
                        "url": "https://www.whatmatters.com/"
                  }
            ]
      },
      {
            "id": "pm_execution",
            "label": "Agile Delivery & Scrum/Kanban Execution",
            "phase": "3. Agile Execution & Delivery",
            "status": "not_started",
            "description": "Partner with engineering teams: User story writing, acceptance criteria, backlog grooming, sprint planning, and retrospectives.",
            "subtopics": [
                  "Writing user stories with INVEST criteria",
                  "Clear Acceptance Criteria (Given-When-Then format)",
                  "Backlog refinement, story sizing, and sprint planning",
                  "Cross-functional trios: PM + Tech Lead + Product Designer"
            ],
            "resources": [
                  {
                        "title": "Scrum Guide Official",
                        "url": "https://scrumguides.org/"
                  }
            ]
      },
      {
            "id": "pm_growth_analytics",
            "label": "Product Analytics & Retention (AARRR)",
            "phase": "4. Growth & Go-To-Market",
            "status": "not_started",
            "description": "Drive growth with data: Pirate Metrics (AARRR: Acquisition, Activation, Retention, Referral, Revenue) and funnel drop-off analysis.",
            "subtopics": [
                  "Defining the Activation / \"Aha!\" moment",
                  "Cohort retention curves and identifying churn drivers",
                  "Funnel analysis and drop-off diagnostics with Mixpanel / Amplitude",
                  "Feature flags (LaunchDarkly) and progressive rollouts"
            ],
            "resources": [
                  {
                        "title": "Amplitude Product Analytics Playbook",
                        "url": "https://amplitude.com/retention-playbook"
                  }
            ]
      },
      {
            "id": "pm_gtm",
            "label": "Go-To-Market Strategy & Product Launch",
            "phase": "4. Growth & Go-To-Market",
            "status": "not_started",
            "description": "Plan and coordinate successful product releases: Beta programs, product positioning, internal sales enablement, and launch retrospectives.",
            "subtopics": [
                  "Coordinating GTM with Marketing, Sales, and Customer Success",
                  "Alpha and Beta cohort feedback loops",
                  "Pricing models and packaging tiers",
                  "Post-launch retrospective and KPI tracking"
            ],
            "resources": [
                  {
                        "title": "First Round Review: Product Go-To-Market Playbook",
                        "url": "https://review.firstround.com/"
                  }
            ]
      }
],
    edges: [
      {
            "source": "pm_strategy",
            "target": "pm_discovery"
      },
      {
            "source": "pm_discovery",
            "target": "pm_prioritization"
      },
      {
            "source": "pm_prioritization",
            "target": "pm_roadmaps_okrs"
      },
      {
            "source": "pm_roadmaps_okrs",
            "target": "pm_execution"
      },
      {
            "source": "pm_execution",
            "target": "pm_growth_analytics"
      },
      {
            "source": "pm_growth_analytics",
            "target": "pm_gtm"
      }
]
  },

  // ─── Engineering Manager ─────────────────────────────────────────────────────────
  'engineering-manager': {
    id: 'engineering-manager',
    name: 'Engineering Manager',
    icon: '👥',
    badge: 'roadmap.sh',
    category: 'product_management',
    description: "Engineering leadership and management: High-impact 1-on-1s, engineering career ladders, technical hiring rubrics, project capacity planning, DORA velocity metrics, and incident management with blameless post-mortems.",
    roadmapUrl: 'https://roadmap.sh/engineering-manager',
    nodes: [
      {
            "id": "em_people",
            "label": "People Management & High-Impact 1-on-1s",
            "phase": "1. People & Leadership",
            "status": "not_started",
            "description": "Build high-trust teams: structuring impactful weekly 1-on-1s, active listening, coaching frameworks, and psychological safety.",
            "subtopics": [
                  "1-on-1 agendas focused on coaching and growth",
                  "Creating psychological safety in engineering teams",
                  "Delivering constructive real-time feedback (SBI Model)",
                  "Recognizing and mitigating burnout signals"
            ],
            "resources": [
                  {
                        "title": "The Manager’s Path (Camille Fournier)",
                        "url": "https://www.oreilly.com/library/view/the-managers-path/9781491973882/"
                  }
            ]
      },
      {
            "id": "em_career",
            "label": "Career Ladders & Performance Management",
            "phase": "1. People & Leadership",
            "status": "not_started",
            "description": "Guide engineer growth: Engineering Competency Matrix, promotion packets, performance evaluations, and managing underperformance.",
            "subtopics": [
                  "Engineering career ladder levels (IC1 to Principal)",
                  "Setting SMART quarterly goals and growth milestones",
                  "Writing fair, bias-free performance reviews",
                  "Performance Improvement Plans (PIPs) handled with empathy"
            ],
            "resources": [
                  {
                        "title": "Radical Candor (Kim Scott)",
                        "url": "https://www.radicalcandor.com/"
                  }
            ]
      },
      {
            "id": "em_hiring",
            "label": "Technical Hiring & Team Scaling",
            "phase": "2. Hiring & Organization",
            "status": "not_started",
            "description": "Scale engineering headcount effectively: Structured interview rubrics, practical coding assessments, and onboarding ramp-ups.",
            "subtopics": [
                  "Designing structured, objective interview loops",
                  "Writing practical coding questions that reflect real work",
                  "Candidate debrief sessions and calibration",
                  "30-60-90 day engineer onboarding roadmap"
            ],
            "resources": [
                  {
                        "title": "Who: The A Method for Hiring (Geoff Smart)",
                        "url": "https://whothebook.com/"
                  }
            ]
      },
      {
            "id": "em_delivery",
            "label": "Technical Project Delivery & Capacity Planning",
            "phase": "3. Technical Delivery",
            "status": "not_started",
            "description": "Balance technical debt with business features: sprint forecasting, capacity planning, risk management, and cross-team dependencies.",
            "subtopics": [
                  "Capacity planning considering PTO and on-call rotations",
                  "Balancing 70% product work / 20% tech debt / 10% innovation",
                  "Managing cross-team blockers and critical paths",
                  "Post-mortems for missed deadlines and scope replanning"
            ],
            "resources": [
                  {
                        "title": "An Elegant Puzzle: Systems of Engineering Management (Will Larson)",
                        "url": "https://lethain.com/elegant-puzzle/"
                  }
            ]
      },
      {
            "id": "em_dora",
            "label": "Engineering Productivity & DORA Metrics",
            "phase": "3. Technical Delivery",
            "status": "not_started",
            "description": "Measure and optimize engineering throughput using DORA (DevOps Research and Assessment) and SPACE metrics.",
            "subtopics": [
                  "4 DORA metrics: Deployment Frequency, Lead Time, Change Failure Rate, MTTR",
                  "The SPACE framework for developer productivity",
                  "Eliminating CI/CD build bottlenecks and flaky tests",
                  "Engineering velocity trends without weaponizing story points"
            ],
            "resources": [
                  {
                        "title": "Accelerate: Building and Scaling High Performing Technology Organizations",
                        "url": "https://itrevolution.com/book/accelerate/"
                  }
            ]
      },
      {
            "id": "em_incident_culture",
            "label": "Incident Management & Blameless Culture",
            "phase": "4. Operations & Stakeholders",
            "status": "not_started",
            "description": "Lead operational excellence: Fair on-call rotations, incident commander workflows, blameless retrospectives, and SLA management.",
            "subtopics": [
                  "Healthy on-call rotation schedules and alert fatigue prevention",
                  "Incident commander role during P0/P1 outages",
                  "Writing blameless post-mortems with actionable timeline analysis",
                  "Tracking 5 Whys and prioritizing preventative engineering tasks"
            ],
            "resources": [
                  {
                        "title": "PagerDuty Incident Response Documentation",
                        "url": "https://response.pagerduty.com/"
                  }
            ]
      }
],
    edges: [
      {
            "source": "em_people",
            "target": "em_career"
      },
      {
            "source": "em_career",
            "target": "em_hiring"
      },
      {
            "source": "em_hiring",
            "target": "em_delivery"
      },
      {
            "source": "em_delivery",
            "target": "em_dora"
      },
      {
            "source": "em_dora",
            "target": "em_incident_culture"
      }
]
  },

  // ─── Technical Writer ─────────────────────────────────────────────────────────
  'technical-writer': {
    id: 'technical-writer',
    name: 'Technical Writer',
    icon: '📝',
    badge: 'roadmap.sh',
    category: 'product_management',
    description: "Professional Technical Writing: Style guides (Google/Microsoft), Diátaxis documentation framework (Tutorials, How-Tos, Reference, Explanation), Docs-as-Code with Git and Vale, OpenAPI 3.0 specifications, quickstarts, and search analytics.",
    roadmapUrl: 'https://roadmap.sh/technical-writer',
    nodes: [
      {
            "id": "tw_style",
            "label": "Technical Writing Standards & Style Guides",
            "phase": "1. Writing Foundations",
            "status": "not_started",
            "description": "Master clarity, active voice, conciseness, and developer style guides: Google Developer Style Guide and Microsoft Style Guide.",
            "subtopics": [
                  "Writing in active voice and imperative mood",
                  "Google Developer Documentation Style Guide standards",
                  "Sentence structure, jargon elimination, and scannability",
                  "Writing for international audiences and translation readiness"
            ],
            "resources": [
                  {
                        "title": "Google Developer Documentation Style Guide",
                        "url": "https://developers.google.com/style"
                  }
            ]
      },
      {
            "id": "tw_diataxis",
            "label": "The Diátaxis Documentation Framework",
            "phase": "1. Writing Foundations",
            "status": "not_started",
            "description": "Structure documentation by purpose: Tutorials (learning), How-To Guides (problem solving), Reference (information), and Explanation (understanding).",
            "subtopics": [
                  "Tutorials: Step-by-step learning for complete newcomers",
                  "How-To Guides: Goal-oriented recipes for practical problems",
                  "Reference Docs: Technical specifications, parameters, and return types",
                  "Explanation / Architecture: Conceptual background and design rationale"
            ],
            "resources": [
                  {
                        "title": "Diátaxis Documentation Framework",
                        "url": "https://diataxis.fr/"
                  }
            ]
      },
      {
            "id": "tw_docs_code",
            "label": "Docs-as-Code Workflow (Markdown & Git)",
            "phase": "2. Docs-as-Code & Tooling",
            "status": "not_started",
            "description": "Treat documentation like production code: Git versioning, pull request reviews, Markdown/MDX, and automated CI doc linters.",
            "subtopics": [
                  "Markdown and MDX syntax extensions",
                  "Static Site Generators (Docusaurus, VitePress, Starlight, MkDocs)",
                  "Automated prose linting with Vale in CI pipelines",
                  "Managing versioned documentation across software releases"
            ],
            "resources": [
                  {
                        "title": "Docs for Developers: An Engineer’s Field Guide",
                        "url": "https://docsfordevelopers.com/"
                  }
            ]
      },
      {
            "id": "tw_api_docs",
            "label": "API Documentation & OpenAPI / Swagger",
            "phase": "2. Docs-as-Code & Tooling",
            "status": "not_started",
            "description": "Document RESTful and GraphQL APIs: OpenAPI Specification 3.0, Swagger UI, interactive API explorers, and SDK snippets.",
            "subtopics": [
                  "OpenAPI 3.0 YAML specification syntax",
                  "Documenting request headers, path params, request bodies, and responses",
                  "Generating interactive documentation with Redoc / Scalar / Swagger",
                  "Multi-language code snippet generation (curl, Python, Node.js)"
            ],
            "resources": [
                  {
                        "title": "OpenAPI Specification Documentation",
                        "url": "https://swagger.io/specification/"
                  }
            ]
      },
      {
            "id": "tw_tutorials",
            "label": "SDK Guides, Quickstarts & Sample Repos",
            "phase": "3. Developer Content & Architecture",
            "status": "not_started",
            "description": "Write developer-first quickstarts: 5-minute time-to-first-hello-world, troubleshooting common errors, and runnable sample apps.",
            "subtopics": [
                  "Time-to-Hello-World optimization for developer SDKs",
                  "Designing copy-pasteable runnable code blocks",
                  "Troubleshooting sections and common error resolution guides",
                  "Maintaining GitHub starter template repositories"
            ],
            "resources": [
                  {
                        "title": "Stripe Documentation Design Case Study",
                        "url": "https://stripe.com/docs"
                  }
            ]
      },
      {
            "id": "tw_analytics",
            "label": "Information Architecture & Doc Analytics",
            "phase": "3. Developer Content & Architecture",
            "status": "not_started",
            "description": "Organize complex documentation sites: search indexing with Algolia, page feedback widgets, and measuring doc usefulness.",
            "subtopics": [
                  "Information hierarchy, sidebar taxonomy, and breadcrumbs",
                  "Search integration with Algolia DocSearch",
                  "Page-level feedback widgets (\"Was this page helpful?\")",
                  "Tracking page bounce rates, search queries with 0 results, and GitHub issues"
            ],
            "resources": [
                  {
                        "title": "Algolia DocSearch",
                        "url": "https://docsearch.algolia.com/"
                  }
            ]
      }
],
    edges: [
      {
            "source": "tw_style",
            "target": "tw_diataxis"
      },
      {
            "source": "tw_diataxis",
            "target": "tw_docs_code"
      },
      {
            "source": "tw_docs_code",
            "target": "tw_api_docs"
      },
      {
            "source": "tw_api_docs",
            "target": "tw_tutorials"
      },
      {
            "source": "tw_tutorials",
            "target": "tw_analytics"
      }
]
  },

  // ─── Developer Relations ─────────────────────────────────────────────────────────
  'developer-relations': {
    id: 'developer-relations',
    name: 'Developer Relations',
    icon: '📢',
    badge: 'roadmap.sh',
    category: 'product_management',
    description: "Developer Relations & Advocacy: Developer Experience (DX) friction logging, technical blogging, open-source sample repos, tech conference speaking, Orbit community building, developer feedback synthesis, and DevRel business metrics.",
    roadmapUrl: 'https://roadmap.sh/developer-relations',
    nodes: [
      {
            "id": "devrel_dx",
            "label": "Developer Experience (DX) & Journey Mapping",
            "phase": "1. Foundations & DX",
            "status": "not_started",
            "description": "Audit and streamline the developer journey: friction logging, onboarding experience, SDK ergonomics, and developer empathy.",
            "subtopics": [
                  "Writing actionable Friction Logs during SDK onboarding",
                  "Measuring Time-to-First-Hello-World (TTFHW)",
                  "Developer empathy and understanding community pain points",
                  "Advocacy vs Developer Marketing vs Technical Support"
            ],
            "resources": [
                  {
                        "title": "The Developer Relations Handbook (Mary Thengvall)",
                        "url": "https://developerrelations.com/"
                  }
            ]
      },
      {
            "id": "devrel_content",
            "label": "Technical Content Creation & Demos",
            "phase": "2. Content & Demos",
            "status": "not_started",
            "description": "Produce high-converting technical content: deep-dive blog posts, GitHub sample repos, video tutorials, and live coding demos.",
            "subtopics": [
                  "Writing viral technical blog posts with practical code",
                  "Building polished GitHub starter repositories and templates",
                  "Creating engaging YouTube and short-form video tutorials",
                  "Interactive demo deployment with Vercel / Railway / CodeSandbox"
            ],
            "resources": [
                  {
                        "title": "Developer Relations: How to Build and Grow a Successful Developer Program",
                        "url": "https://www.apress.com/gp/book/9781484218990"
                  }
            ]
      },
      {
            "id": "devrel_speaking",
            "label": "Public Speaking & Tech Conferences",
            "phase": "2. Content & Demos",
            "status": "not_started",
            "description": "Represent the product at global developer conferences: writing Call For Proposal (CFP) pitches, slide design, and live coding.",
            "subtopics": [
                  "Writing winning CFP conference talk proposals",
                  "Presentation deck design for technical audiences",
                  "Disaster-proofing live coding demos (local fallbacks, videos)",
                  "Hosting interactive workshops and hands-on labs"
            ],
            "resources": [
                  {
                        "title": "Speaking.io: Technical Public Speaking (Zach Holman)",
                        "url": "https://speaking.io/"
                  }
            ]
      },
      {
            "id": "devrel_community",
            "label": "Community Building & Engagement (Orbit Model)",
            "phase": "3. Community & Advocacy",
            "status": "not_started",
            "description": "Build vibrant developer communities on Discord, Slack, and Discourse; cultivate community champions and open-source contributors.",
            "subtopics": [
                  "The Orbit Model for measuring community love and reach",
                  "Community platform moderation and engagement (Discord / Discourse)",
                  "Designing Community Champion / MVP recognition programs",
                  "Organizing virtual and in-person hackathons"
            ],
            "resources": [
                  {
                        "title": "The Orbit Model for Community Engagement",
                        "url": "https://orbit.love/model"
                  }
            ]
      },
      {
            "id": "devrel_feedback",
            "label": "Voice of the Developer & Product Feedback",
            "phase": "4. Strategy & Metrics",
            "status": "not_started",
            "description": "Act as the internal bridge between external developers and product/engineering teams; synthesize feedback into product roadmaps.",
            "subtopics": [
                  "Synthesizing developer feedback into GitHub issues and RFCs",
                  "Partnering with Product Managers during alpha/beta feature testing",
                  "Tracking developer sentiment across Reddit, Hacker News, X, and forums",
                  "Advocating for bug fixes and API ergonomics internally"
            ],
            "resources": [
                  {
                        "title": "DevRel Collective Resources",
                        "url": "https://devrelcollective.fun/"
                  }
            ]
      },
      {
            "id": "devrel_metrics",
            "label": "DevRel Metrics, KPIs & Business Value",
            "phase": "4. Strategy & Metrics",
            "status": "not_started",
            "description": "Demonstrate concrete business impact: tracking active developers, API key creations, community growth, and product adoption.",
            "subtopics": [
                  "Tracking Monthly Active Developers (MAD) and API usage growth",
                  "Measuring content reach, code sample clones, and engagement",
                  "Attributing developer signups to DevRel initiatives",
                  "Reporting quarterly DevRel ROI to company leadership"
            ],
            "resources": [
                  {
                        "title": "Developer Relations Metrics Guide",
                        "url": "https://developerrelations.com/metrics"
                  }
            ]
      }
],
    edges: [
      {
            "source": "devrel_dx",
            "target": "devrel_content"
      },
      {
            "source": "devrel_content",
            "target": "devrel_speaking"
      },
      {
            "source": "devrel_speaking",
            "target": "devrel_community"
      },
      {
            "source": "devrel_community",
            "target": "devrel_feedback"
      },
      {
            "source": "devrel_feedback",
            "target": "devrel_metrics"
      }
]
  },

  // ─── Forward Deployed Engineer ─────────────────────────────────────────────────────────
  'forward-deployed-engineer': {
    id: 'forward-deployed-engineer',
    name: 'Forward Deployed Engineer',
    icon: '🚀',
    badge: 'roadmap.sh',
    category: 'product_management',
    description: "Forward Deployed Engineering: Consultative enterprise problem solving, ERP/CRM legacy integrations, custom extensions, air-gapped private cloud deployments, SAML/SSO enterprise security, and production cutover advisory.",
    roadmapUrl: 'https://roadmap.sh/forward-deployed-engineer',
    nodes: [
      {
            "id": "fde_foundations",
            "label": "Forward Deployed Engineering Mindset",
            "phase": "1. Enterprise Foundations",
            "status": "not_started",
            "description": "Operate at the intersection of software engineering, consulting, and customer deployment: solving mission-critical enterprise problems.",
            "subtopics": [
                  "The FDE role: Palantir model of embedded engineering",
                  "Consultative problem discovery vs ticket-taking",
                  "Balancing rapid client custom code with reusable core platform features",
                  "Managing client expectations under tight delivery deadlines"
            ],
            "resources": [
                  {
                        "title": "Palantir Forward Deployed Engineering Overview",
                        "url": "https://www.palantir.com/careers/forward-deployed-software-engineer/"
                  }
            ]
      },
      {
            "id": "fde_integrations",
            "label": "Enterprise Systems & Data Integrations",
            "phase": "1. Enterprise Foundations",
            "status": "not_started",
            "description": "Connect client legacy platforms: integrating ERPs (SAP, Oracle), CRMs (Salesforce), custom data warehouses, and webhooks.",
            "subtopics": [
                  "Integrating legacy systems via SOAP, REST, and database links",
                  "Building fault-tolerant ETL pipelines for messy enterprise data",
                  "Handling schema drift and data format mismatches",
                  "Webhook delivery, retry backoff, and idempotent event ingestion"
            ],
            "resources": [
                  {
                        "title": "Enterprise Integration Patterns (Gregor Hohpe)",
                        "url": "https://www.enterpriseintegrationpatterns.com/"
                  }
            ]
      },
      {
            "id": "fde_custom_ext",
            "label": "Custom Extensions, Plugins & SDKs",
            "phase": "2. Extensions & Architecture",
            "status": "not_started",
            "description": "Develop bespoke connectors and custom services to satisfy enterprise requirements without bloating core product code.",
            "subtopics": [
                  "Writing plugin architectures and extension hooks",
                  "Building client-tailored microservices in Go, Python, or TypeScript",
                  "Creating isolated data transform scripts",
                  "Abstracting recurring client features back into core product PRs"
            ],
            "resources": [
                  {
                        "title": "Building Microservices (Sam Newman)",
                        "url": "https://samnewman.io/books/building_microservices/"
                  }
            ]
      },
      {
            "id": "fde_deployment",
            "label": "Private Cloud & Air-Gapped Deployments",
            "phase": "2. Extensions & Architecture",
            "status": "not_started",
            "description": "Deploy software in secure, highly restricted client environments: On-Premises, Client VPCs (AWS/Azure/GCP), and Air-Gapped networks.",
            "subtopics": [
                  "Deploying inside air-gapped environments without internet access",
                  "Packaging offline Helm charts, container tarballs, and dependencies",
                  "Configuring Kubernetes in client VPCs with restricted egress",
                  "Debugging through remote bastion hosts and jump boxes"
            ],
            "resources": [
                  {
                        "title": "Air-Gapped Kubernetes Deployments Guide",
                        "url": "https://kubernetes.io/"
                  }
            ]
      },
      {
            "id": "fde_security",
            "label": "Enterprise Security, SSO & Compliance",
            "phase": "3. Security & Production Go-Live",
            "status": "not_started",
            "description": "Satisfy enterprise InfoSec audits: Single Sign-On (SAML 2.0 / OIDC), SCIM user provisioning, RBAC, and SOC 2 compliance.",
            "subtopics": [
                  "Configuring SAML 2.0 and OpenID Connect (Okta, Azure AD)",
                  "SCIM protocol for automated employee provisioning and de-provisioning",
                  "Fine-grained Role-Based Access Control (RBAC) and audit logging",
                  "Passing client InfoSec security questionnaires and penetration tests"
            ],
            "resources": [
                  {
                        "title": "SAML 2.0 Technical Overview (OASIS)",
                        "url": "http://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html"
                  }
            ]
      },
      {
            "id": "fde_client_advisory",
            "label": "Client Technical Advisory & Production Go-Live",
            "phase": "3. Security & Production Go-Live",
            "status": "not_started",
            "description": "Lead technical deployment: Proof-of-Concept (PoC) scoping, User Acceptance Testing (UAT), cutover planning, and hypercare support.",
            "subtopics": [
                  "Scoping measurable Proof of Concept (PoC) success criteria",
                  "Managing User Acceptance Testing (UAT) with customer engineers",
                  "Production cutover planning and rollback contingency playbooks",
                  "Hypercare support and seamless handoff to Customer Success"
            ],
            "resources": [
                  {
                        "title": "The Field Guide to Enterprise Software Deployments",
                        "url": "https://martinfowler.com/"
                  }
            ]
      }
],
    edges: [
      {
            "source": "fde_foundations",
            "target": "fde_integrations"
      },
      {
            "source": "fde_integrations",
            "target": "fde_custom_ext"
      },
      {
            "source": "fde_custom_ext",
            "target": "fde_deployment"
      },
      {
            "source": "fde_deployment",
            "target": "fde_security"
      },
      {
            "source": "fde_security",
            "target": "fde_client_advisory"
      }
]
  }

};
