import type { RoadmapTemplate } from '../roadmapTemplates';

export const DEVOPS_SECURITY_ROADMAPS: Record<string, RoadmapTemplate> = {
  // ─── DevOps ─────────────────────────────────────────────────────────
  'devops': {
    id: 'devops',
    name: 'DevOps',
    icon: '♾️',
    badge: 'roadmap.sh',
    category: 'devops_security',
    description: "Master modern DevOps: Linux, networking, web servers (Nginx), containers (Docker), Kubernetes orchestration, Infrastructure as Code (Terraform, Ansible), CI/CD, and Prometheus/Grafana observability.",
    roadmapUrl: 'https://roadmap.sh/devops',
    nodes: [
      {
            "id": "do_linux",
            "label": "Linux OS & Shell Scripting",
            "phase": "1. Linux & Networking",
            "status": "not_started",
            "description": "Master the core operating system of modern cloud infrastructure: file systems, permissions, process management, and Bash automation.",
            "subtopics": [
                  "File hierarchy, chmod/chown, sudoers",
                  "Process inspection (ps, top, htop, systemctl)",
                  "Bash scripting: loops, variables, piping, awk, sed",
                  "cron scheduled tasks & logrotate"
            ],
            "resources": [
                  {
                        "title": "Linux Journey Interactive Guide",
                        "url": "https://linuxjourney.com/"
                  }
            ]
      },
      {
            "id": "do_networking",
            "label": "Networking Fundamentals & Protocols",
            "phase": "1. Linux & Networking",
            "status": "not_started",
            "description": "Understand how systems communicate over internet protocols: OSI 7-layer model, DNS resolution, TCP/UDP sockets, and TLS encryption.",
            "subtopics": [
                  "DNS records (A, CNAME, TXT, MX) and propagation",
                  "TCP 3-way handshake & UDP differences",
                  "HTTP/1.1, HTTP/2, HTTP/3 & TLS certificates",
                  "SSH keys, agent forwarding, and bastion hosts"
            ],
            "resources": [
                  {
                        "title": "Cloudflare: What is DNS?",
                        "url": "https://www.cloudflare.com/learning/dns/what-is-dns/"
                  }
            ]
      },
      {
            "id": "do_webservers",
            "label": "Web Servers & Reverse Proxies (Nginx)",
            "phase": "2. Servers & Version Control",
            "status": "not_started",
            "description": "Configure production web servers, SSL termination, load balancing algorithms, and caching with Nginx and Caddy.",
            "subtopics": [
                  "Nginx configuration directives (server, location, upstream)",
                  "Reverse proxying and WebSocket proxying",
                  "SSL/TLS termination with Let’s Encrypt / Certbot",
                  "Load balancing methods (Round-robin, Least connections, IP hash)"
            ],
            "resources": [
                  {
                        "title": "Nginx Beginner’s Guide",
                        "url": "https://nginx.org/en/docs/beginners_guide.html"
                  }
            ]
      },
      {
            "id": "do_git",
            "label": "Git & GitOps Collaboration",
            "phase": "2. Servers & Version Control",
            "status": "not_started",
            "description": "Version control workflows for code and infrastructure: branching models, interactive rebasing, tags, and PR review hygiene.",
            "subtopics": [
                  "Trunk-based development vs GitFlow",
                  "Interactive rebase, cherry-pick, and git bisect",
                  "Semantic versioning and Git release tags",
                  "GitOps fundamentals: infrastructure state stored in Git"
            ],
            "resources": [
                  {
                        "title": "Pro Git Book",
                        "url": "https://git-scm.com/book/en/v2"
                  }
            ]
      },
      {
            "id": "do_containers",
            "label": "Docker & Containerization",
            "phase": "3. Containerization",
            "status": "not_started",
            "description": "Package applications into lightweight, isolated containers: writing efficient Dockerfiles, layers, multi-stage builds, and Compose.",
            "subtopics": [
                  "Linux namespaces and cgroups foundation",
                  "Dockerfile optimization & layer caching",
                  "Multi-stage builds to minimize image attack surface",
                  "Docker Compose for multi-container local stacks"
            ],
            "resources": [
                  {
                        "title": "Docker Official Getting Started",
                        "url": "https://docs.docker.com/get-started/"
                  }
            ]
      },
      {
            "id": "do_container_registries",
            "label": "Container Registries & Image Scanning",
            "phase": "3. Containerization",
            "status": "not_started",
            "description": "Publish, sign, and scan images across registries (Docker Hub, AWS ECR, GitHub Container Registry) using Trivy and Cosign.",
            "subtopics": [
                  "Docker Hub, AWS ECR, and GHCR workflows",
                  "Vulnerability scanning with Trivy and Grype",
                  "Image signing & verification with Sigstore Cosign",
                  "Distroless and Alpine minimal base images"
            ],
            "resources": [
                  {
                        "title": "Trivy Vulnerability Scanner Docs",
                        "url": "https://aquasecurity.github.io/trivy/"
                  }
            ]
      },
      {
            "id": "do_k8s_architecture",
            "label": "Kubernetes Architecture & Core Objects",
            "phase": "4. Kubernetes Orchestration",
            "status": "not_started",
            "description": "Master production container orchestration: Control plane (API server, etcd, scheduler) and Worker nodes (kubelet, kube-proxy).",
            "subtopics": [
                  "Kubernetes architecture & control plane components",
                  "Pods, ReplicaSets, and Deployments",
                  "ConfigMaps and Secrets injection",
                  "Services (ClusterIP, NodePort, LoadBalancer)"
            ],
            "resources": [
                  {
                        "title": "Kubernetes Official Documentation",
                        "url": "https://kubernetes.io/docs/home/"
                  }
            ]
      },
      {
            "id": "do_k8s_networking_storage",
            "label": "Kubernetes Ingress, Networking & Storage",
            "phase": "4. Kubernetes Orchestration",
            "status": "not_started",
            "description": "Expose cluster workloads and handle persistent storage: Ingress controllers, cert-manager, PersistentVolumes (PV), and PVCs.",
            "subtopics": [
                  "Ingress controllers (Nginx Ingress, Traefik)",
                  "Cert-manager automated SSL provisioning",
                  "PersistentVolumes (PV) & PersistentVolumeClaims (PVC)",
                  "StorageClasses and dynamic volume provisioning"
            ],
            "resources": [
                  {
                        "title": "Kubernetes Ingress Guide",
                        "url": "https://kubernetes.io/docs/concepts/services-networking/ingress/"
                  }
            ]
      },
      {
            "id": "do_k8s_helm",
            "label": "Helm Package Manager & Kustomize",
            "phase": "4. Kubernetes Orchestration",
            "status": "not_started",
            "description": "Package, template, and deploy Kubernetes applications declaratively with Helm charts, values.yaml, and Kustomize overlays.",
            "subtopics": [
                  "Helm chart directory structure and templates",
                  "values.yaml parameterization and environments",
                  "Helm dependency management and repository hosting",
                  "Kustomize template-free overlay customization"
            ],
            "resources": [
                  {
                        "title": "Helm Official Documentation",
                        "url": "https://helm.sh/docs/"
                  }
            ]
      },
      {
            "id": "do_terraform",
            "label": "Infrastructure as Code with Terraform",
            "phase": "5. Infrastructure as Code",
            "status": "not_started",
            "description": "Provision cloud resources declaratively using HashiCorp HCL, providers, remote state locking with S3/DynamoDB, and reusable modules.",
            "subtopics": [
                  "HCL syntax, resources, and data sources",
                  "Remote state management and DynamoDB state locking",
                  "Terraform modules for reusable architecture",
                  "Terraform plan, apply, destroy, and drift detection"
            ],
            "resources": [
                  {
                        "title": "Terraform Learn Tutorials",
                        "url": "https://developer.hashicorp.com/terraform/tutorials"
                  }
            ]
      },
      {
            "id": "do_ansible",
            "label": "Configuration Management with Ansible",
            "phase": "5. Infrastructure as Code",
            "status": "not_started",
            "description": "Automate software configuration and OS patching across servers over agentless SSH with Ansible playbooks and roles.",
            "subtopics": [
                  "Ansible inventory files (static and dynamic)",
                  "Playbooks, tasks, and idempotent modules",
                  "Ansible roles and Ansible Galaxy community packages",
                  "Jinja2 templating for server configurations"
            ],
            "resources": [
                  {
                        "title": "Ansible Getting Started",
                        "url": "https://docs.ansible.com/ansible/latest/getting_started/index.html"
                  }
            ]
      },
      {
            "id": "do_cicd_pipelines",
            "label": "CI/CD Pipelines (GitHub Actions / GitLab CI)",
            "phase": "6. CI/CD & GitOps",
            "status": "not_started",
            "description": "Build continuous integration and delivery pipelines: automated linting, test suites, Docker image building, and deployment triggers.",
            "subtopics": [
                  "GitHub Actions workflows, jobs, and steps",
                  "Matrix builds for multiple runtime versions",
                  "Caching dependencies for faster builds",
                  "Self-hosted runners and security hardening"
            ],
            "resources": [
                  {
                        "title": "GitHub Actions Documentation",
                        "url": "https://docs.github.com/en/actions"
                  }
            ]
      },
      {
            "id": "do_gitops_argocd",
            "label": "GitOps Continuous Deployment (ArgoCD)",
            "phase": "6. CI/CD & GitOps",
            "status": "not_started",
            "description": "Implement declarative continuous delivery for Kubernetes using ArgoCD or Flux; sync cluster state automatically with Git repos.",
            "subtopics": [
                  "GitOps pull-based vs push-based CD",
                  "ArgoCD Application CRD and sync policies",
                  "Automated rollouts and self-healing clusters",
                  "Progressive delivery: Canary deployments with Argo Rollouts"
            ],
            "resources": [
                  {
                        "title": "ArgoCD Official Documentation",
                        "url": "https://argo-cd.readthedocs.io/"
                  }
            ]
      },
      {
            "id": "do_prometheus_grafana",
            "label": "Metrics & Dashboards (Prometheus & Grafana)",
            "phase": "7. Observability & Monitoring",
            "status": "not_started",
            "description": "Collect, query, and visualize time-series performance metrics across infrastructure and applications using PromQL and Grafana.",
            "subtopics": [
                  "Prometheus pull model, exporters (node_exporter), and scrape jobs",
                  "PromQL queries: rate, sum, histogram_quantile",
                  "Grafana dashboard design and alert rules",
                  "Alertmanager routing, grouping, and PagerDuty/Slack webhooks"
            ],
            "resources": [
                  {
                        "title": "Prometheus Official Documentation",
                        "url": "https://prometheus.io/docs/"
                  }
            ]
      },
      {
            "id": "do_logging_tracing",
            "label": "Centralized Logging & Distributed Tracing",
            "phase": "7. Observability & Monitoring",
            "status": "not_started",
            "description": "Aggregate logs and trace microservice requests: Grafana Loki / ELK Stack, and OpenTelemetry (OTel) traces with Jaeger.",
            "subtopics": [
                  "Grafana Loki & Promtail log aggregation",
                  "LogQL querying across distributed pods",
                  "OpenTelemetry standard for traces, metrics, logs",
                  "Jaeger / Tempo distributed request tracing"
            ],
            "resources": [
                  {
                        "title": "OpenTelemetry Documentation",
                        "url": "https://opentelemetry.io/docs/"
                  }
            ]
      },
      {
            "id": "do_cloud_aws",
            "label": "Cloud Architecture & AWS Foundations",
            "phase": "8. Cloud & Site Reliability",
            "status": "not_started",
            "description": "Architect resilient cloud infrastructure on AWS: IAM least privilege, VPC subnets, route tables, security groups, and S3.",
            "subtopics": [
                  "IAM policies, roles, and MFA enforcement",
                  "VPC architecture: Public/Private subnets & NAT Gateways",
                  "Compute: EC2, Auto-scaling groups, and ECS/EKS",
                  "CloudWatch logs, alarms, and billing alerts"
            ],
            "resources": [
                  {
                        "title": "AWS Well-Architected Framework",
                        "url": "https://aws.amazon.com/architecture/well-architected/"
                  }
            ]
      },
      {
            "id": "do_sre_chaos",
            "label": "Site Reliability Engineering (SRE) & Incident Management",
            "phase": "8. Cloud & Site Reliability",
            "status": "not_started",
            "description": "Apply Google SRE principles: SLI, SLO, SLA, Error Budgets, blameless post-mortems, and Chaos Engineering experiments.",
            "subtopics": [
                  "SLIs (Service Level Indicators) vs SLOs (Objectives)",
                  "Error Budgets and release velocity throttling",
                  "Blameless post-mortem culture & action items",
                  "Chaos engineering with Litmus / Chaos Mesh"
            ],
            "resources": [
                  {
                        "title": "Google SRE Book",
                        "url": "https://sre.google/sre-book/table-of-contents/"
                  }
            ]
      }
],
    edges: [
      {
            "source": "do_linux",
            "target": "do_networking"
      },
      {
            "source": "do_networking",
            "target": "do_webservers"
      },
      {
            "source": "do_webservers",
            "target": "do_git"
      },
      {
            "source": "do_git",
            "target": "do_containers"
      },
      {
            "source": "do_containers",
            "target": "do_container_registries"
      },
      {
            "source": "do_container_registries",
            "target": "do_k8s_architecture"
      },
      {
            "source": "do_k8s_architecture",
            "target": "do_k8s_networking_storage"
      },
      {
            "source": "do_k8s_networking_storage",
            "target": "do_k8s_helm"
      },
      {
            "source": "do_k8s_helm",
            "target": "do_terraform"
      },
      {
            "source": "do_terraform",
            "target": "do_ansible"
      },
      {
            "source": "do_ansible",
            "target": "do_cicd_pipelines"
      },
      {
            "source": "do_cicd_pipelines",
            "target": "do_gitops_argocd"
      },
      {
            "source": "do_gitops_argocd",
            "target": "do_prometheus_grafana"
      },
      {
            "source": "do_prometheus_grafana",
            "target": "do_logging_tracing"
      },
      {
            "source": "do_logging_tracing",
            "target": "do_cloud_aws"
      },
      {
            "source": "do_cloud_aws",
            "target": "do_sre_chaos"
      }
]
  },

  // ─── DevSecOps ─────────────────────────────────────────────────────────
  'devsecops': {
    id: 'devsecops',
    name: 'DevSecOps',
    icon: '🛡️',
    badge: 'roadmap.sh',
    category: 'devops_security',
    description: "Shift-left engineering security: Threat modeling with STRIDE, SAST code scanning, SCA/SBOM dependency security, secrets management (Vault), container hardening, and runtime policy enforcement (OPA/Kyverno, Falco).",
    roadmapUrl: 'https://roadmap.sh/devsecops',
    nodes: [
      {
            "id": "dso_shift_left",
            "label": "Shift-Left Security & DevSecOps Culture",
            "phase": "1. Foundations & Modeling",
            "status": "not_started",
            "description": "Integrate security controls early into the developer workflow, breaking silos between development, security, and operations.",
            "subtopics": [
                  "Shift-Left philosophy vs traditional waterfall security",
                  "Security as Code principles",
                  "Security Champions program in engineering teams",
                  "Shared responsibility model across cloud layers"
            ],
            "resources": [
                  {
                        "title": "roadmap.sh DevSecOps Guide",
                        "url": "https://roadmap.sh/devsecops"
                  }
            ]
      },
      {
            "id": "dso_threat_modeling",
            "label": "Threat Modeling & STRIDE Framework",
            "phase": "1. Foundations & Modeling",
            "status": "not_started",
            "description": "Identify potential architectural vulnerabilities and attack vectors during design using STRIDE and Data Flow Diagrams (DFDs).",
            "subtopics": [
                  "STRIDE model: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege",
                  "Creating Data Flow Diagrams (DFDs)",
                  "Trust boundaries and attack surfaces",
                  "OWASP Threat Dragon & Microsoft Threat Modeling Tool"
            ],
            "resources": [
                  {
                        "title": "OWASP Threat Modeling Guide",
                        "url": "https://owasp.org/www-community/Threat_Modeling"
                  }
            ]
      },
      {
            "id": "dso_sast",
            "label": "Static Application Security Testing (SAST)",
            "phase": "2. Code & Dependency Security",
            "status": "not_started",
            "description": "Analyze source code for security flaws without executing it: Semgrep, SonarQube, and GitHub CodeQL rules.",
            "subtopics": [
                  "Writing custom Semgrep security rules",
                  "SonarQube quality gates and vulnerability detection",
                  "CodeQL semantic code analysis in GitHub Actions",
                  "Remediating SQLi, XSS, and hardcoded secrets in code"
            ],
            "resources": [
                  {
                        "title": "Semgrep Official Documentation",
                        "url": "https://semgrep.dev/docs/"
                  }
            ]
      },
      {
            "id": "dso_sca_sbom",
            "label": "Software Supply Chain Security & SBOM (SCA)",
            "phase": "2. Code & Dependency Security",
            "status": "not_started",
            "description": "Protect against compromised open-source packages: Software Bill of Materials (SBOM), Snyk, Trivy, and Dependabot.",
            "subtopics": [
                  "Software Composition Analysis (SCA) concepts",
                  "Generating SBOMs with Syft (CycloneDX / SPDX formats)",
                  "Scanning open-source CVEs with Snyk & Trivy",
                  "Automated PR updates with Dependabot & Renovate"
            ],
            "resources": [
                  {
                        "title": "CISA Software Bill of Materials (SBOM)",
                        "url": "https://www.cisa.gov/sbom"
                  }
            ]
      },
      {
            "id": "dso_secrets_mgmt",
            "label": "Secret Management & Leak Prevention",
            "phase": "2. Code & Dependency Security",
            "status": "not_started",
            "description": "Prevent API keys and credentials from entering source control: GitGuardian, TruffleHog, and HashiCorp Vault.",
            "subtopics": [
                  "Pre-commit secret scanning with Gitleaks & TruffleHog",
                  "HashiCorp Vault dynamic credentials & transit secrets",
                  "AWS Secrets Manager and automatic rotation",
                  "SOPS (Secrets OPerationS) with age/KMS encryption"
            ],
            "resources": [
                  {
                        "title": "HashiCorp Vault Tutorials",
                        "url": "https://developer.hashicorp.com/vault/tutorials"
                  }
            ]
      },
      {
            "id": "dso_dast_zap",
            "label": "Dynamic Security Testing (DAST & IAST)",
            "phase": "3. Dynamic Security & DAST",
            "status": "not_started",
            "description": "Probe running web applications for exploitable vulnerabilities using OWASP ZAP, Burp Suite, and automated CI scans.",
            "subtopics": [
                  "OWASP ZAP automated baseline and full scans",
                  "Spidering web applications and testing endpoints",
                  "Interactive Application Security Testing (IAST) contrast",
                  "API security testing with Postman & RESTler"
            ],
            "resources": [
                  {
                        "title": "OWASP ZAP Getting Started",
                        "url": "https://www.zaproxy.org/getting-started/"
                  }
            ]
      },
      {
            "id": "dso_container_sec",
            "label": "Container Hardening & Image Security",
            "phase": "4. Container & Cluster Security",
            "status": "not_started",
            "description": "Secure containers from base image to runtime: non-root users, read-only root filesystems, and minimal base images.",
            "subtopics": [
                  "Running containers as non-root (USER directive)",
                  "Read-only root filesystem and dropping Linux capabilities",
                  "Distroless & scratch images for minimal attack footprint",
                  "Scanning container images in CI with Trivy and Grype"
            ],
            "resources": [
                  {
                        "title": "Docker Security Best Practices",
                        "url": "https://docs.docker.com/develop/security-best-practices/"
                  }
            ]
      },
      {
            "id": "dso_k8s_policy",
            "label": "Kubernetes Policy Enforcement (OPA / Kyverno)",
            "phase": "4. Container & Cluster Security",
            "status": "not_started",
            "description": "Enforce security guardrails at cluster admission: OPA Gatekeeper with Rego, Kyverno policies, and Pod Security Standards.",
            "subtopics": [
                  "Admission Controllers: Mutating vs Validating webhooks",
                  "OPA Gatekeeper constraints & Rego policy language",
                  "Kyverno declarative Kubernetes-native policies",
                  "Pod Security Standards: Privileged, Baseline, Restricted"
            ],
            "resources": [
                  {
                        "title": "Kyverno Policy Documentation",
                        "url": "https://kyverno.io/docs/"
                  }
            ]
      },
      {
            "id": "dso_runtime_security",
            "label": "Runtime Security & Anomaly Detection (Falco)",
            "phase": "4. Container & Cluster Security",
            "status": "not_started",
            "description": "Detect abnormal system calls, container escapes, and privilege escalation in real time using eBPF and Falco.",
            "subtopics": [
                  "Linux eBPF kernel tracing mechanics",
                  "Falco rules for detecting unexpected shell spawns",
                  "Detecting modifications to sensitive directories (/etc, /bin)",
                  "Alert forwarding to Slack, Elasticsearch, and SIEM"
            ],
            "resources": [
                  {
                        "title": "Falco Security Documentation",
                        "url": "https://falco.org/docs/"
                  }
            ]
      },
      {
            "id": "dso_iac_security",
            "label": "Infrastructure as Code Security (Checkov / tfsec)",
            "phase": "5. Cloud Security & Compliance",
            "status": "not_started",
            "description": "Catch misconfigured cloud resources before deployment: scanning Terraform, CloudFormation, and Helm templates.",
            "subtopics": [
                  "Checkov automated policy scans in pull requests",
                  "Tfsec security scanner for Terraform code",
                  "Detecting open S3 buckets, permissive security groups, unencrypted EBS",
                  "Automated remediation of IaC drift and violations"
            ],
            "resources": [
                  {
                        "title": "Checkov IaC Security Scanner",
                        "url": "https://www.checkov.io/"
                  }
            ]
      },
      {
            "id": "dso_cloud_posture",
            "label": "Cloud Security Posture Management (CSPM & CIS Benchmarks)",
            "phase": "5. Cloud Security & Compliance",
            "status": "not_started",
            "description": "Audit cloud infrastructure against industry standards: CIS AWS/GCP Foundations Benchmarks, AWS Security Hub, and Prowler.",
            "subtopics": [
                  "CIS Cloud Benchmarks implementation",
                  "AWS Security Hub & GuardDuty threat detection",
                  "Prowler open-source security assessment tool",
                  "Cloud Infrastructure Entitlement Management (CIEM) for IAM least-privilege"
            ],
            "resources": [
                  {
                        "title": "Center for Internet Security (CIS) Benchmarks",
                        "url": "https://www.cisecurity.org/cis-benchmarks/"
                  }
            ]
      }
],
    edges: [
      {
            "source": "dso_shift_left",
            "target": "dso_threat_modeling"
      },
      {
            "source": "dso_threat_modeling",
            "target": "dso_sast"
      },
      {
            "source": "dso_sast",
            "target": "dso_sca_sbom"
      },
      {
            "source": "dso_sca_sbom",
            "target": "dso_secrets_mgmt"
      },
      {
            "source": "dso_secrets_mgmt",
            "target": "dso_dast_zap"
      },
      {
            "source": "dso_dast_zap",
            "target": "dso_container_sec"
      },
      {
            "source": "dso_container_sec",
            "target": "dso_k8s_policy"
      },
      {
            "source": "dso_k8s_policy",
            "target": "dso_runtime_security"
      },
      {
            "source": "dso_runtime_security",
            "target": "dso_iac_security"
      },
      {
            "source": "dso_iac_security",
            "target": "dso_cloud_posture"
      }
]
  },

  // ─── Cyber Security ─────────────────────────────────────────────────────────
  'cyber-security': {
    id: 'cyber-security',
    name: 'Cyber Security',
    icon: '🔐',
    badge: 'roadmap.sh',
    category: 'devops_security',
    description: "Comprehensive Cyber Security path: Networking fundamentals, packet analysis with Wireshark, cryptography & PKI, OS hardening, OWASP Top 10 web vulnerabilities, Burp Suite penetration testing, firewalls/IDS, and digital forensics (DFIR).",
    roadmapUrl: 'https://roadmap.sh/cyber-security',
    nodes: [
      {
            "id": "cs_fundamentals",
            "label": "Information Security Fundamentals & CIA Triad",
            "phase": "1. Foundations & Networking",
            "status": "not_started",
            "description": "Core concepts: Confidentiality, Integrity, Availability (CIA), Non-repudiation, Defense in Depth, and Risk Assessment.",
            "subtopics": [
                  "CIA Triad & Defense-in-Depth layers",
                  "Authentication, Authorization, and Accounting (AAA)",
                  "Risk assessment, threat agents, vulnerabilities, and impacts",
                  "Security policies, standards, and procedures"
            ],
            "resources": [
                  {
                        "title": "roadmap.sh Cyber Security Guide",
                        "url": "https://roadmap.sh/cyber-security"
                  }
            ]
      },
      {
            "id": "cs_networking_packet",
            "label": "Network Security & Packet Analysis (Wireshark)",
            "phase": "1. Foundations & Networking",
            "status": "not_started",
            "description": "Deep network packet inspection: TCP/IP headers, ARP spoofing, DNS poisoning, and Wireshark traffic analysis.",
            "subtopics": [
                  "TCP flags (SYN, ACK, FIN, RST) and handshake teardown",
                  "Packet capturing and filtering with Wireshark & tcpdump",
                  "ARP poisoning & Man-in-the-Middle (MitM) attacks",
                  "DNS spoofing, hijacking, and DNSSEC mitigation"
            ],
            "resources": [
                  {
                        "title": "Wireshark User’s Guide",
                        "url": "https://www.wireshark.org/docs/wsug_html_chunked/"
                  }
            ]
      },
      {
            "id": "cs_cryptography",
            "label": "Applied Cryptography & PKI",
            "phase": "2. Cryptography & Systems",
            "status": "not_started",
            "description": "Modern cryptographic algorithms: Symmetric (AES-GCM), Asymmetric (RSA, ECC), Hashing (SHA-256, Argon2), and Certificate Authorities.",
            "subtopics": [
                  "Symmetric encryption (AES-256) and block cipher modes",
                  "Asymmetric encryption (RSA, Diffie-Hellman, ECC)",
                  "Cryptographic hashes, salts, and password hashing (bcrypt, Argon2)",
                  "Public Key Infrastructure (PKI), X.509 certificates, and CRL/OCSP"
            ],
            "resources": [
                  {
                        "title": "Practical Cryptography for Developers",
                        "url": "https://cryptobook.nakov.com/"
                  }
            ]
      },
      {
            "id": "cs_system_hardening",
            "label": "Operating System Hardening (Linux & Windows)",
            "phase": "2. Cryptography & Systems",
            "status": "not_started",
            "description": "Harden host systems against intrusion: Linux PAM, SELinux, AppArmor, Windows Group Policies, and Active Directory security.",
            "subtopics": [
                  "Linux file permissions, sudoers, and auditd logging",
                  "SELinux mandatory access control & policies",
                  "Windows Active Directory domain controllers & Kerberos",
                  "PowerShell Constrained Language Mode and AppLocker"
            ],
            "resources": [
                  {
                        "title": "CIS Linux Hardening Guide",
                        "url": "https://www.cisecurity.org/"
                  }
            ]
      },
      {
            "id": "cs_owasp_top10",
            "label": "OWASP Top 10 Web Vulnerabilities",
            "phase": "3. Web & App Security",
            "status": "not_started",
            "description": "Master exploitation and defense of critical web application vulnerabilities: SQLi, XSS, CSRF, SSRF, and Broken Access Control.",
            "subtopics": [
                  "SQL Injection (Inband, Blind, Error-based) & prepared statements",
                  "Cross-Site Scripting (Reflected, Stored, DOM-based)",
                  "Server-Side Request Forgery (SSRF) and cloud metadata attacks",
                  "Broken Object-Level Authorization (BOLA / IDOR)"
            ],
            "resources": [
                  {
                        "title": "OWASP Top 10 Documentation",
                        "url": "https://owasp.org/www-project-top-ten/"
                  }
            ]
      },
      {
            "id": "cs_burp_suite",
            "label": "Web Penetration Testing with Burp Suite",
            "phase": "3. Web & App Security",
            "status": "not_started",
            "description": "Intercept, tamper, and automate HTTP/S requests: Burp Proxy, Repeater, Intruder, Decoder, and Collaborator.",
            "subtopics": [
                  "Configuring Burp CA certificate and intercepting traffic",
                  "Burp Repeater for manual payload testing",
                  "Intruder wordlist fuzzing and rate limit analysis",
                  "PortSwigger Web Security Academy lab practice"
            ],
            "resources": [
                  {
                        "title": "PortSwigger Web Security Academy",
                        "url": "https://portswigger.net/web-security"
                  }
            ]
      },
      {
            "id": "cs_firewalls_ids",
            "label": "Firewalls, IDS/IPS & Zero Trust",
            "phase": "4. Network Defense",
            "status": "not_started",
            "description": "Defend perimeter and internal traffic: Next-Gen Firewalls (pfsense, iptables), Snort/Suricata IDS/IPS, and Zero Trust architecture.",
            "subtopics": [
                  "Stateful firewalls vs Next-Generation Firewalls (NGFW)",
                  "Intrusion Detection & Prevention (Snort / Suricata signature rules)",
                  "Zero Trust principles: never trust, always verify",
                  "Virtual Private Networks (WireGuard, OpenVPN) & IPsec"
            ],
            "resources": [
                  {
                        "title": "Suricata User Guide",
                        "url": "https://suricata.io/documentation/"
                  }
            ]
      },
      {
            "id": "cs_siem_soc",
            "label": "Security Operations & SIEM (Splunk / Wazuh)",
            "phase": "5. Threat Hunting & Forensics",
            "status": "not_started",
            "description": "Aggregate enterprise security logs, correlate events, detect breaches, and trigger automated SOC alert playbooks.",
            "subtopics": [
                  "Log aggregation from syslogs, Windows Event Logs, and cloud trails",
                  "Splunk search processing language (SPL) & dashboarding",
                  "Wazuh open-source SIEM & host agent monitoring",
                  "MITRE ATT&CK framework mapping for adversary tactics"
            ],
            "resources": [
                  {
                        "title": "MITRE ATT&CK Framework",
                        "url": "https://attack.mitre.org/"
                  }
            ]
      },
      {
            "id": "cs_forensics_ir",
            "label": "Digital Forensics & Incident Response (DFIR)",
            "phase": "5. Threat Hunting & Forensics",
            "status": "not_started",
            "description": "Respond to breaches, preserve evidence chains, analyze volatile memory dumps with Volatility, and triage malware.",
            "subtopics": [
                  "Incident response phases: Preparation, Detection, Containment, Eradication, Recovery",
                  "Volatile memory acquisition & Volatility framework analysis",
                  "Disk imaging & autopsy timeline reconstruction",
                  "Malware sandbox analysis with Any.Run / Cuckoo"
            ],
            "resources": [
                  {
                        "title": "SANS Incident Handler’s Handbook",
                        "url": "https://www.sans.org/"
                  }
            ]
      }
],
    edges: [
      {
            "source": "cs_fundamentals",
            "target": "cs_networking_packet"
      },
      {
            "source": "cs_networking_packet",
            "target": "cs_cryptography"
      },
      {
            "source": "cs_cryptography",
            "target": "cs_system_hardening"
      },
      {
            "source": "cs_system_hardening",
            "target": "cs_owasp_top10"
      },
      {
            "source": "cs_owasp_top10",
            "target": "cs_burp_suite"
      },
      {
            "source": "cs_burp_suite",
            "target": "cs_firewalls_ids"
      },
      {
            "source": "cs_firewalls_ids",
            "target": "cs_siem_soc"
      },
      {
            "source": "cs_siem_soc",
            "target": "cs_forensics_ir"
      }
]
  },

  // ─── Network Engineer ─────────────────────────────────────────────────────────
  'network-engineer': {
    id: 'network-engineer',
    name: 'Network Engineer',
    icon: '🌐',
    badge: 'roadmap.sh',
    category: 'devops_security',
    description: "End-to-end Network Engineering: OSI 7-layer model, IPv4/IPv6 subnetting, switching & VLANs, Spanning Tree Protocol (STP), OSPF & BGP routing, NAT, IPsec VPNs, and Python/Ansible network automation.",
    roadmapUrl: 'https://roadmap.sh/network-engineer',
    nodes: [
      {
            "id": "ne_osi_tcpip",
            "label": "OSI 7-Layer & TCP/IP Protocol Suite",
            "phase": "1. Network Fundamentals",
            "status": "not_started",
            "description": "Comprehensive understanding of network layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application.",
            "subtopics": [
                  "Encapsulation & decapsulation (PDU, Packet, Frame, Bit)",
                  "TCP sliding window, flow control, and congestion control",
                  "UDP connectionless broadcast/multicast transmission",
                  "ICMP protocol and troubleshooting ping/traceroute"
            ],
            "resources": [
                  {
                        "title": "roadmap.sh Network Engineer Guide",
                        "url": "https://roadmap.sh/network-engineer"
                  }
            ]
      },
      {
            "id": "ne_ip_addressing",
            "label": "IPv4 Subnetting, VLSM & IPv6",
            "phase": "1. Network Fundamentals",
            "status": "not_started",
            "description": "Master binary IP calculation, Classless Inter-Domain Routing (CIDR), Variable Length Subnet Masking (VLSM), and IPv6 addressing.",
            "subtopics": [
                  "Binary to decimal conversions and subnet masks",
                  "CIDR notation (/24, /27, /30 link subnets)",
                  "VLSM network design to optimize IP utilization",
                  "IPv6 address types: Global Unicast, Link-Local, Multicast"
            ],
            "resources": [
                  {
                        "title": "Cisco Subnetting Guide",
                        "url": "https://www.cisco.com/"
                  }
            ]
      },
      {
            "id": "ne_vlans_trunking",
            "label": "VLANs, 802.1Q Trunking & Inter-VLAN Routing",
            "phase": "2. Switching & LAN Design",
            "status": "not_started",
            "description": "Segment broadcast domains: Access ports, trunk ports, IEEE 802.1Q encapsulation, Router-on-a-Stick, and Layer 3 switches.",
            "subtopics": [
                  "Configuring VLANs and port access assignments",
                  "802.1Q trunking protocol and Native VLAN security",
                  "Inter-VLAN routing with Router-on-a-Stick and SVIs",
                  "DTP (Dynamic Trunking Protocol) and VTP hazards"
            ],
            "resources": [
                  {
                        "title": "Cisco VLAN Configuration Guide",
                        "url": "https://www.cisco.com/"
                  }
            ]
      },
      {
            "id": "ne_stp_etherchannel",
            "label": "Spanning Tree Protocol (STP) & Link Aggregation",
            "phase": "2. Switching & LAN Design",
            "status": "not_started",
            "description": "Prevent switching loops and increase bandwidth: Rapid STP (RSTP 802.1w), MSTP, BPDU Guard, and LACP EtherChannel bundles.",
            "subtopics": [
                  "Spanning Tree election: Root bridge, root ports, designated ports",
                  "Rapid STP convergence and port states",
                  "BPDU Guard, Root Guard, and Loop Guard protections",
                  "LACP (802.3ad) and PAgP EtherChannel bundle configuration"
            ],
            "resources": [
                  {
                        "title": "NetworkLessons: Spanning Tree Protocol",
                        "url": "https://networklessons.com/spanning-tree/"
                  }
            ]
      },
      {
            "id": "ne_ospf",
            "label": "Open Shortest Path First (OSPF)",
            "phase": "3. Routing Protocols & WAN",
            "status": "not_started",
            "description": "Enterprise interior routing: Dijkstra algorithm, single-area and multi-area OSPF, LSA types, and router neighbor states.",
            "subtopics": [
                  "Link-State Advertisements (LSA Types 1, 2, 3, 4, 5)",
                  "OSPF neighbor states (Down, Init, 2-Way, ExStart, Exchange, Loading, Full)",
                  "Designated Router (DR) and BDR elections on broadcast links",
                  "Area 0 (Backbone) and stub / totally stubby area designs"
            ],
            "resources": [
                  {
                        "title": "NetworkLessons: OSPF",
                        "url": "https://networklessons.com/cisco/ccna-routing-switching-icnd2-200-105/ospf-configuration-step-by-step"
                  }
            ]
      },
      {
            "id": "ne_bgp",
            "label": "Border Gateway Protocol (BGP)",
            "phase": "3. Routing Protocols & WAN",
            "status": "not_started",
            "description": "The routing protocol that powers the Internet: Autonomous Systems (AS), eBGP vs iBGP, path vector attributes, and route filtering.",
            "subtopics": [
                  "Autonomous System Numbers (ASN) & peering relationships",
                  "eBGP vs iBGP loop prevention rules (split horizon)",
                  "BGP Path Attributes: Weight, Local Preference, AS-Path, MED",
                  "Route reflectors and BGP community tags"
            ],
            "resources": [
                  {
                        "title": "BGP Routing Explained (Cloudflare)",
                        "url": "https://www.cloudflare.com/learning/security/glossary/what-is-bgp/"
                  }
            ]
      },
      {
            "id": "ne_nat_dhcp_dns",
            "label": "Network Services (NAT, DHCP, DNS, NTP)",
            "phase": "4. Network Services & Security",
            "status": "not_started",
            "description": "Core infrastructure services: Static/Dynamic NAT, Port Address Translation (PAT), DHCP snooping, and NTP synchronization.",
            "subtopics": [
                  "NAT/PAT configuration and translation tables",
                  "DHCP DORA process, relay agents, and DHCP Snooping",
                  "DNS forward/reverse lookup integration",
                  "Network Time Protocol (NTP) hierarchy and stratum levels"
            ],
            "resources": [
                  {
                        "title": "Cisco Network Services Guide",
                        "url": "https://www.cisco.com/"
                  }
            ]
      },
      {
            "id": "ne_ipsec_vpn",
            "label": "IPsec VPNs & Network Security",
            "phase": "4. Network Services & Security",
            "status": "not_started",
            "description": "Secure data in transit across WANs: IKEv1/IKEv2 phases, Diffie-Hellman key exchange, ESP encryption, and Access Control Lists (ACLs).",
            "subtopics": [
                  "Standard vs Extended Access Control Lists (ACLs)",
                  "IKE Phase 1 (ISAKMP SA) and Phase 2 (IPsec SA)",
                  "Diffie-Hellman groups, AES-CBC vs AES-GCM encryption",
                  "Site-to-Site and Remote Access VPN architectures"
            ],
            "resources": [
                  {
                        "title": "Cisco IPsec VPN Technology Guide",
                        "url": "https://www.cisco.com/"
                  }
            ]
      },
      {
            "id": "ne_automation_python",
            "label": "Network Automation with Python & Ansible",
            "phase": "5. Automation & Monitoring",
            "status": "not_started",
            "description": "Modern network engineering: Replace manual CLI typing with automated Python scripts (Netmiko, Scrapli) and Ansible playbooks.",
            "subtopics": [
                  "SSH automation with Netmiko & Paramiko",
                  "RESTCONF and NETCONF programmatic device interfaces",
                  "YANG data modeling language fundamentals",
                  "Ansible cisco.ios / arista.eos automation modules"
            ],
            "resources": [
                  {
                        "title": "Kirk Byers: Python for Network Engineers",
                        "url": "https://pynet.twb-tech.com/"
                  }
            ]
      },
      {
            "id": "ne_monitoring_traffic",
            "label": "Network Telemetry & Traffic Analysis",
            "phase": "5. Automation & Monitoring",
            "status": "not_started",
            "description": "Monitor health, bandwidth, and latency: SNMP v2c/v3 polling, NetFlow/sFlow flow exporting, and syslog aggregation.",
            "subtopics": [
                  "SNMP MIBs, OIDs, polling, and SNMPv3 encryption",
                  "NetFlow / IPFIX flow data analysis and top-talker tracking",
                  "Syslog severity levels (0-7) and centralized collector setup",
                  "Quality of Service (QoS): DSCP marking, queuing, and traffic shaping"
            ],
            "resources": [
                  {
                        "title": "SolarWinds: Network Monitoring Best Practices",
                        "url": "https://www.solarwinds.com/"
                  }
            ]
      }
],
    edges: [
      {
            "source": "ne_osi_tcpip",
            "target": "ne_ip_addressing"
      },
      {
            "source": "ne_ip_addressing",
            "target": "ne_vlans_trunking"
      },
      {
            "source": "ne_vlans_trunking",
            "target": "ne_stp_etherchannel"
      },
      {
            "source": "ne_stp_etherchannel",
            "target": "ne_ospf"
      },
      {
            "source": "ne_ospf",
            "target": "ne_bgp"
      },
      {
            "source": "ne_bgp",
            "target": "ne_nat_dhcp_dns"
      },
      {
            "source": "ne_nat_dhcp_dns",
            "target": "ne_ipsec_vpn"
      },
      {
            "source": "ne_ipsec_vpn",
            "target": "ne_automation_python"
      },
      {
            "source": "ne_automation_python",
            "target": "ne_monitoring_traffic"
      }
]
  }

};
