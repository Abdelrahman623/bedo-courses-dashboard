import type { RoadmapTemplate } from '../roadmapTemplates';

export const AI_DATA_ROADMAPS: Record<string, RoadmapTemplate> = {
  // ─── AI Engineer ─────────────────────────────────────────────────────────
  'ai-engineer': {
    id: 'ai-engineer',
    name: 'AI Engineer',
    icon: '🤖',
    badge: 'roadmap.sh',
    category: 'ai_data',
    description: "Build production AI applications: LLM APIs, prompt engineering, vector databases, LangChain/LlamaIndex, RAG architectures, and AI agent frameworks.",
    roadmapUrl: 'https://roadmap.sh/ai-engineer',
    nodes: [
      {
            "id": "aie_python",
            "label": "Python Typing & Async for AI",
            "phase": "1. Python Foundations",
            "status": "not_started",
            "description": "Modern asynchronous Python, Pydantic v2 data models for structured LLM parsing, type annotations, and environment managers.",
            "subtopics": [
                  "AsyncIO event loops & concurrency",
                  "Pydantic v2 validation & BaseModel",
                  "Poetry & uv packaging",
                  "NumPy & tensor slicing"
            ],
            "resources": [
                  {
                        "title": "Pydantic Documentation",
                        "url": "https://docs.pydantic.dev/"
                  }
            ]
      },
      {
            "id": "aie_llm_apis",
            "label": "LLM APIs & Provider Ecosystem",
            "phase": "1. Python Foundations",
            "status": "not_started",
            "description": "Master API interfaces for OpenAI, Anthropic Claude, Google Gemini, and open-source models via Groq and Together AI.",
            "subtopics": [
                  "Tokens, context limits & cost trade-offs",
                  "Streaming completions & Server-Sent Events",
                  "System instructions & role separation",
                  "Rate limits, retries, and exponential backoff"
            ],
            "resources": [
                  {
                        "title": "OpenAI API Reference",
                        "url": "https://platform.openai.com/docs/api-reference"
                  }
            ]
      },
      {
            "id": "aie_prompting",
            "label": "Advanced Prompt Engineering",
            "phase": "1. Python Foundations",
            "status": "not_started",
            "description": "Systematic prompt design: Few-Shot In-Context Learning, Chain-of-Thought (CoT), directional stimulus prompting, and structured output formatting.",
            "subtopics": [
                  "Few-Shot exemplar design",
                  "Chain-of-Thought & Self-Consistency",
                  "Directional Stimulus & Rephrase and Respond",
                  "JSON mode & Pydantic schema enforcement"
            ],
            "resources": [
                  {
                        "title": "Learn Prompting Guide",
                        "url": "https://learnprompting.org/"
                  }
            ]
      },
      {
            "id": "aie_embeddings",
            "label": "Vector Embeddings & Semantic Search",
            "phase": "2. Embeddings & Vectors",
            "status": "not_started",
            "description": "Transform text, code, and multimodal data into high-dimensional vector representations; evaluate similarity metrics.",
            "subtopics": [
                  "Dense embedding models (text-embedding-3, BAAI/bge)",
                  "Cosine similarity, Euclidean distance, Dot product",
                  "Sparse embeddings (BM25, SPLADE)",
                  "Chunking strategies (token-based, semantic, markdown)"
            ],
            "resources": [
                  {
                        "title": "Pinecone: What are Vector Embeddings?",
                        "url": "https://www.pinecone.io/learn/vector-embeddings/"
                  }
            ]
      },
      {
            "id": "aie_vectordb",
            "label": "Vector Databases & Indexing",
            "phase": "2. Embeddings & Vectors",
            "status": "not_started",
            "description": "Deploy, configure, and scale vector databases: Qdrant, Pinecone, Chroma, and pgvector; understand HNSW indexing and metadata filtering.",
            "subtopics": [
                  "HNSW (Hierarchical Navigable Small World) graphs",
                  "IVFFlat indexing tradeoffs",
                  "pgvector for relational PostgreSQL",
                  "Pre-filtering vs post-filtering metadata"
            ],
            "resources": [
                  {
                        "title": "Qdrant Vector Database Documentation",
                        "url": "https://qdrant.tech/documentation/"
                  }
            ]
      },
      {
            "id": "aie_rag_core",
            "label": "RAG Architecture & Pipeline",
            "phase": "3. RAG Architecture",
            "status": "not_started",
            "description": "Architect production-grade RAG systems combining document ingestion, vector retrieval, prompt construction, and synthesis.",
            "subtopics": [
                  "Document loaders (PDF, HTML, Notion, code)",
                  "RecursiveCharacterTextSplitter & semantic chunkers",
                  "Query rewriting & multi-query expansions",
                  "Prompt context stuffing & lost-in-the-middle mitigation"
            ],
            "resources": [
                  {
                        "title": "roadmap.sh AI Engineer Guide",
                        "url": "https://roadmap.sh/ai-engineer"
                  }
            ]
      },
      {
            "id": "aie_rag_advanced",
            "label": "Advanced Hybrid RAG & Re-ranking",
            "phase": "3. RAG Architecture",
            "status": "not_started",
            "description": "Enhance retrieval accuracy using hybrid search (lexical + dense), cross-encoder re-ranking, and contextual compression.",
            "subtopics": [
                  "Reciprocal Rank Fusion (RRF)",
                  "Cross-Encoder Re-rankers (Cohere, BGE-reranker)",
                  "Contextual compression & document summarizers",
                  "Parent-child document retrieval"
            ],
            "resources": [
                  {
                        "title": "Cohere Rerank Documentation",
                        "url": "https://cohere.com/rerank"
                  }
            ]
      },
      {
            "id": "aie_rag_eval",
            "label": "RAG Evaluation & Triad Metrics",
            "phase": "3. RAG Architecture",
            "status": "not_started",
            "description": "Benchmark and evaluate RAG pipelines using quantitative automated frameworks like Ragas, TruLens, and DeepEval.",
            "subtopics": [
                  "Faithfulness (hallucination detection)",
                  "Answer Relevance to original query",
                  "Context Precision & Context Recall",
                  "Automated synthetic testset generation"
            ],
            "resources": [
                  {
                        "title": "Ragas Evaluation Framework",
                        "url": "https://docs.ragas.io/"
                  }
            ]
      },
      {
            "id": "aie_langchain",
            "label": "LangChain & LCEL Pipeline",
            "phase": "4. Orchestration",
            "status": "not_started",
            "description": "Compose declarative, streaming, and parallel LLM pipelines using LangChain Expression Language (LCEL).",
            "subtopics": [
                  "LCEL runnable interfaces (| pipe operator)",
                  "PromptTemplate, ChatPromptTemplate",
                  "Output parsers (PydanticOutputParser)",
                  "RunnableParallel & RunnablePassthrough"
            ],
            "resources": [
                  {
                        "title": "LangChain Official Docs",
                        "url": "https://python.langchain.com/"
                  }
            ]
      },
      {
            "id": "aie_llamaindex",
            "label": "LlamaIndex Data Framework",
            "phase": "4. Orchestration",
            "status": "not_started",
            "description": "Data framework for LLM-based applications: VectorStoreIndex, QueryEngine, RouterQueryEngine, and SubQuestionQueryEngine.",
            "subtopics": [
                  "Ingestion pipelines & Transformations",
                  "VectorStoreIndex & SummaryIndex",
                  "QueryEngine vs ChatEngine",
                  "Sub-question query decomposition"
            ],
            "resources": [
                  {
                        "title": "LlamaIndex Documentation",
                        "url": "https://docs.llamaindex.ai/"
                  }
            ]
      },
      {
            "id": "aie_tool_calling",
            "label": "Function Calling & Tool Use",
            "phase": "5. AI Agents",
            "status": "not_started",
            "description": "Equip models with computational capabilities: web browsing, SQL querying, code interpreters, and third-party REST API execution.",
            "subtopics": [
                  "OpenAI & Anthropic Tools schema specification",
                  "Executing tool calls safely with error recovery",
                  "Handling multi-tool sequential invocations",
                  "Schema validation with Pydantic models"
            ],
            "resources": [
                  {
                        "title": "OpenAI Function Calling Guide",
                        "url": "https://platform.openai.com/docs/guides/function-calling"
                  }
            ]
      },
      {
            "id": "aie_react_agent",
            "label": "ReAct Pattern & Agent Reasoning",
            "phase": "5. AI Agents",
            "status": "not_started",
            "description": "Implement Thought-Action-Observation loops allowing agents to reason dynamically, formulate plans, and adapt to tool results.",
            "subtopics": [
                  "ReAct (Reason + Act) prompting architecture",
                  "Plan-and-Solve agent paradigms",
                  "Self-reflection & error correction loops",
                  "Stopping criteria & loop prevention"
            ],
            "resources": [
                  {
                        "title": "ReAct: Synergizing Reasoning and Acting in Language Models",
                        "url": "https://react-lm.github.io/"
                  }
            ]
      },
      {
            "id": "aie_multi_agent",
            "label": "Multi-Agent Systems (LangGraph / CrewAI)",
            "phase": "5. AI Agents",
            "status": "not_started",
            "description": "Design multi-agent collaborative networks using state machines, graph workflows, and specialized role delegation.",
            "subtopics": [
                  "LangGraph stateful cyclic graphs",
                  "CrewAI role-based collaborative agents",
                  "State persistence & checkpoints",
                  "Human-in-the-loop approvals & pauses"
            ],
            "resources": [
                  {
                        "title": "LangGraph Documentation",
                        "url": "https://langchain-ai.github.io/langgraph/"
                  }
            ]
      },
      {
            "id": "aie_hf_ecosystem",
            "label": "Hugging Face & Open Models",
            "phase": "6. Open LLMs & Fine-Tuning",
            "status": "not_started",
            "description": "Download, inspect, and run open weights models (Llama 3, Mistral, Gemma) using Hugging Face Transformers and Accelerate.",
            "subtopics": [
                  "Hugging Face Hub & Transformers pipeline",
                  "Tokenizer encoding & decoding mechanics",
                  "Model weights architectures & attention heads",
                  "Quantization concepts (4-bit, 8-bit, FP16)"
            ],
            "resources": [
                  {
                        "title": "Hugging Face NLP Course",
                        "url": "https://huggingface.co/learn/nlp-course"
                  }
            ]
      },
      {
            "id": "aie_peft_lora",
            "label": "Parameter-Efficient Fine-Tuning (LoRA & QLoRA)",
            "phase": "6. Open LLMs & Fine-Tuning",
            "status": "not_started",
            "description": "Fine-tune large language models on consumer GPUs using Low-Rank Adaptation (LoRA) and 4-bit Quantized LoRA (QLoRA).",
            "subtopics": [
                  "LoRA rank (r) and alpha hyperparameters",
                  "Target attention modules (q_proj, v_proj)",
                  "Instruction fine-tuning dataset formatting (ShareGPT, Alpaca)",
                  "BitsAndBytes 4-bit quantization NF4"
            ],
            "resources": [
                  {
                        "title": "Hugging Face PEFT Library",
                        "url": "https://huggingface.co/docs/peft"
                  }
            ]
      },
      {
            "id": "aie_local_inference",
            "label": "High-Throughput Inference (vLLM & Ollama)",
            "phase": "6. Open LLMs & Fine-Tuning",
            "status": "not_started",
            "description": "Serve LLMs in production with ultra-fast latency: PagedAttention, KV cache management, batching, and local dev with Ollama.",
            "subtopics": [
                  "vLLM engine & PagedAttention memory management",
                  "Continuous batching vs static batching",
                  "Ollama for local workstation development",
                  "GGUF / llama.cpp for CPU & Apple Silicon edge execution"
            ],
            "resources": [
                  {
                        "title": "vLLM Documentation",
                        "url": "https://docs.vllm.ai/"
                  }
            ]
      },
      {
            "id": "aie_guardrails",
            "label": "AI Safety, Guardrails & Jailbreak Defense",
            "phase": "7. AI Ops & Security",
            "status": "not_started",
            "description": "Protect AI applications against prompt injection, jailbreaks, PII leakage, and toxic outputs using guardrail systems.",
            "subtopics": [
                  "Prompt injection attacks & indirect injection",
                  "NeMo Guardrails & Llama Guard classification",
                  "PII masking and regex/NER sanitization",
                  "Hallucination filtering & citation verification"
            ],
            "resources": [
                  {
                        "title": "NVIDIA NeMo Guardrails",
                        "url": "https://github.com/NVIDIA/NeMo-Guardrails"
                  }
            ]
      },
      {
            "id": "aie_observability",
            "label": "LLM Observability & Tracing",
            "phase": "7. AI Ops & Security",
            "status": "not_started",
            "description": "Trace, debug, and monitor production LLM requests, latency, token spend, and errors with LangSmith, Phoenix, or Arize.",
            "subtopics": [
                  "Distributed LLM call tracing",
                  "Token usage & dollar cost attribution",
                  "Latency profiling per pipeline stage",
                  "LangSmith / Arize Phoenix observability setup"
            ],
            "resources": [
                  {
                        "title": "LangSmith Observability Platform",
                        "url": "https://www.langchain.com/langsmith"
                  }
            ]
      }
],
    edges: [
      {
            "source": "aie_python",
            "target": "aie_llm_apis"
      },
      {
            "source": "aie_llm_apis",
            "target": "aie_prompting"
      },
      {
            "source": "aie_prompting",
            "target": "aie_embeddings"
      },
      {
            "source": "aie_embeddings",
            "target": "aie_vectordb"
      },
      {
            "source": "aie_vectordb",
            "target": "aie_rag_core"
      },
      {
            "source": "aie_rag_core",
            "target": "aie_rag_advanced"
      },
      {
            "source": "aie_rag_advanced",
            "target": "aie_rag_eval"
      },
      {
            "source": "aie_rag_eval",
            "target": "aie_langchain"
      },
      {
            "source": "aie_langchain",
            "target": "aie_llamaindex"
      },
      {
            "source": "aie_llamaindex",
            "target": "aie_tool_calling"
      },
      {
            "source": "aie_tool_calling",
            "target": "aie_react_agent"
      },
      {
            "source": "aie_react_agent",
            "target": "aie_multi_agent"
      },
      {
            "source": "aie_multi_agent",
            "target": "aie_hf_ecosystem"
      },
      {
            "source": "aie_hf_ecosystem",
            "target": "aie_peft_lora"
      },
      {
            "source": "aie_peft_lora",
            "target": "aie_local_inference"
      },
      {
            "source": "aie_local_inference",
            "target": "aie_guardrails"
      },
      {
            "source": "aie_guardrails",
            "target": "aie_observability"
      }
]
  },

  // ─── 2. Data Analyst ───────────────────────────────────────────────────────
  'data-analyst': {
    id: 'data-analyst',
    name: 'Data Analyst',
    icon: '📊',
    badge: 'roadmap.sh',
    category: 'ai_data',
    description: 'Complete official roadmap.sh Data Analyst path: Foundations, Excel functions & PivotTables, SQL mastery, Python/R programming, data collection, visualization (Power BI/Tableau), statistical analysis, and machine learning.',
    roadmapUrl: 'https://roadmap.sh/data-analyst',
    nodes: [
      // Phase 1: Foundations & Concepts
      {
        id: 'da_intro',
        label: 'What is Data Analytics?',
        phase: '1. Foundations',
        status: 'not_started',
        description: 'Understand the role of data analytics in transforming raw business data into actionable strategic intelligence and competitive advantages.',
        subtopics: ['Role of a Data Analyst', 'Data-driven decision making', 'Data lifecycle from ingestion to insight', 'Ethics and data privacy basics'],
        resources: [
          { title: 'roadmap.sh Data Analyst Guide', url: 'https://roadmap.sh/data-analyst' },
          { title: 'Google Data Analytics Certificate Foundations', url: 'https://www.coursera.org/professional-certificates/google-data-analytics' }
        ]
      },
      {
        id: 'da_types',
        label: 'Types of Data Analytics',
        phase: '1. Foundations',
        status: 'not_started',
        description: 'Master the four core tiers of data analysis: Descriptive (What happened?), Diagnostic (Why did it happen?), Predictive (What will happen?), and Prescriptive (What should we do?).',
        subtopics: ['Descriptive Analytics: Historical reporting & KPIs', 'Diagnostic Analytics: Root cause drill-down', 'Predictive Analytics: Forecasting & regression', 'Prescriptive Analytics: Optimization & recommendations'],
        resources: [{ title: 'Gartner: The 4 Types of Analytics', url: 'https://www.gartner.com/' }]
      },
      {
        id: 'da_lifecycle',
        label: 'Key Concepts of Data Lifecycle',
        phase: '1. Foundations',
        status: 'not_started',
        description: 'Understand the end-to-end data lifecycle: Collection, Cleanup, Exploration, Visualization, Statistical Analysis, and Machine Learning.',
        subtopics: ['Data Collection methods', 'Data Cleanup & sanitation importance', 'Exploratory Data Analysis (EDA)', 'Statistical modeling & ML handoff'],
        resources: [{ title: 'Harvard Business Review: The Data Lifecycle', url: 'https://hbr.org/' }]
      },

      // Phase 2: Excel & Spreadsheet Mastery
      {
        id: 'da_excel_logic',
        label: 'Excel Logical & Date Functions',
        phase: '2. Excel & Spreadsheets',
        status: 'not_started',
        description: 'Master conditional logic and date arithmetic in Microsoft Excel and Google Sheets.',
        subtopics: ['IF, IFS, AND, OR statements', 'Nested conditionals', 'DATEDIF, EDATE, and WORKDAY calculations', 'Date formatting and parsing'],
        resources: [{ title: 'ExcelJet: IF Formula Guide', url: 'https://exceljet.net/functions/if-function' }]
      },
      {
        id: 'da_excel_lookup',
        label: 'Excel Lookup Functions (XLOOKUP)',
        phase: '2. Excel & Spreadsheets',
        status: 'not_started',
        description: 'Connect datasets across sheets using modern lookup functions: XLOOKUP, INDEX / MATCH, VLOOKUP, and HLOOKUP.',
        subtopics: ['XLOOKUP exact match and wildcards', 'INDEX / MATCH two-way lookups', 'VLOOKUP / HLOOKUP limitations', 'Handling #N/A errors with IFERROR'],
        resources: [{ title: 'Microsoft Support: XLOOKUP Guide', url: 'https://support.microsoft.com/en-us/office/xlookup-function-b7fd680e-6d10-43e6-84f9-88eae8bf5929' }]
      },
      {
        id: 'da_excel_text',
        label: 'Excel Text Functions & Cleaning',
        phase: '2. Excel & Spreadsheets',
        status: 'not_started',
        description: 'Clean raw spreadsheet text strings: stripping whitespaces, replacing characters, and standardizing casing.',
        subtopics: ['CONCAT, TEXTJOIN, and & operator', 'TRIM and CLEAN for invisible whitespace', 'REPLACE vs SUBSTITUTE', 'UPPER, LOWER, and PROPER case formatting'],
        resources: [{ title: 'ExcelJet: Cleaning Text in Excel', url: 'https://exceljet.net/' }]
      },
      {
        id: 'da_excel_stats',
        label: 'Excel Math & Stats Functions',
        phase: '2. Excel & Spreadsheets',
        status: 'not_started',
        description: 'Compute aggregates and conditional statistics directly in spreadsheet sheets.',
        subtopics: ['SUM, AVERAGE, MIN, and MAX', 'COUNT, COUNTA, and COUNTBLANK', 'COUNTIF and COUNTIFS criteria counting', 'SUMIFS and AVERAGEIFS multi-condition aggregates'],
        resources: [{ title: 'ExcelJet: Statistical Formulas', url: 'https://exceljet.net/' }]
      },
      {
        id: 'da_excel_pivot',
        label: 'Pivot Tables & Slicers',
        phase: '2. Excel & Spreadsheets',
        status: 'not_started',
        description: 'Summarize hundreds of thousands of rows dynamically: grouping dates by quarter/month, value field settings, and interactive slicers.',
        subtopics: ['Creating Pivot Tables from raw tabular tables', 'Grouping dates, numbers, and categories', 'Calculated Fields and Calculated Items', 'Interactive Slicers and Timelines'],
        resources: [{ title: 'Microsoft: Create a Pivot Table', url: 'https://support.microsoft.com/' }]
      },
      {
        id: 'da_excel_charts',
        label: 'Excel Charting & Dashboards',
        phase: '2. Excel & Spreadsheets',
        status: 'not_started',
        description: 'Build polished business charts in Excel: Combo charts, primary/secondary axes, Sparklines, and conditional formatting rules.',
        subtopics: ['Bar, Column, and Line charts', 'Secondary axis combo charts', 'Conditional formatting with data bars and icon sets', 'Dynamic named ranges for dashboard views'],
        resources: [{ title: 'Chandoo: Excel Dashboard Tutorials', url: 'https://chandoo.org/' }]
      },

      // Phase 3: SQL for Data Analysis
      {
        id: 'da_sql_basics',
        label: 'SQL Queries, SELECT & Filtering',
        phase: '3. SQL Database Queries',
        status: 'not_started',
        description: 'Master SQL syntax for querying relational databases: SELECT, FROM, WHERE, LIKE, IN, BETWEEN, ORDER BY, and LIMIT.',
        subtopics: ['Relational database concepts (Tables, Keys, Schemas)', 'SELECT column aliasing and arithmetic', 'Filtering with WHERE, AND/OR, NOT, LIKE %', 'Sorting with ORDER BY (ASC/DESC) and LIMIT/OFFSET'],
        resources: [{ title: 'Mode Analytics: SQL Tutorial for Beginners', url: 'https://mode.com/sql-tutorial/' }]
      },
      {
        id: 'da_sql_agg',
        label: 'SQL Aggregations & GROUP BY',
        phase: '3. SQL Database Queries',
        status: 'not_started',
        description: 'Aggregate millions of transactional records into summaries using aggregate functions and GROUP BY clauses.',
        subtopics: ['COUNT(*), COUNT(DISTINCT), SUM, AVG, MIN, MAX', 'GROUP BY single and multiple dimensions', 'HAVING clause vs WHERE clause', 'Dealing with NULL values in aggregations'],
        resources: [{ title: 'SQLBolt Interactive SQL Lessons', url: 'https://sqlbolt.com/' }]
      },
      {
        id: 'da_sql_joins',
        label: 'SQL Table Joins (INNER, LEFT, FULL)',
        phase: '3. SQL Database Queries',
        status: 'not_started',
        description: 'Combine tables using primary and foreign keys: INNER JOIN, LEFT JOIN, RIGHT JOIN, and self-joins.',
        subtopics: ['INNER JOIN vs LEFT (OUTER) JOIN', 'Handling unmatched rows and NULL values after joins', 'Joining on multiple composite keys', 'CROSS JOIN and Cartesian products'],
        resources: [{ title: 'Visual Guide to SQL Joins', url: 'https://blog.codinghorror.com/a-visual-explanation-of-sql-joins/' }]
      },
      {
        id: 'da_sql_subqueries',
        label: 'Subqueries & CTEs (WITH Clause)',
        phase: '3. SQL Database Queries',
        status: 'not_started',
        description: 'Write clean, modular queries using Common Table Expressions (WITH queries) and nested subqueries in WHERE/FROM clauses.',
        subtopics: ['Common Table Expressions (CTEs) readability', 'Correlated subqueries vs Scalar subqueries', 'Temporary tables vs Views', 'Chaining multiple CTEs for complex transformations'],
        resources: [{ title: 'PostgreSQL CTE Documentation', url: 'https://www.postgresql.org/docs/current/queries-with.html' }]
      },
      {
        id: 'da_sql_window',
        label: 'SQL Window Functions',
        phase: '3. SQL Database Queries',
        status: 'not_started',
        description: 'Perform advanced analytical calculations without collapsing rows: ROW_NUMBER, RANK, DENSE_RANK, LEAD, LAG, and running totals.',
        subtopics: ['OVER (PARTITION BY ... ORDER BY ...)', 'ROW_NUMBER() vs RANK() vs DENSE_RANK()', 'LEAD() and LAG() for Period-over-Period growth', 'Running totals and moving averages with SUM() OVER'],
        resources: [{ title: 'Mode: SQL Window Functions Guide', url: 'https://mode.com/sql-tutorial/sql-window-functions/' }]
      },

      // Phase 4: Programming with Python
      {
        id: 'da_python_basics',
        label: 'Python Programming Fundamentals',
        phase: '4. Python Programming',
        status: 'not_started',
        description: 'Learn core Python programming: variables, lists, dictionaries, list comprehensions, functions, and control flow in Jupyter Notebooks.',
        subtopics: ['Variables, types (int, float, str, bool)', 'Lists, Dictionaries, Sets, and Tuples', 'For loops and List Comprehensions', 'Defining functions and lambda expressions', 'Jupyter Lab and Notebook workflows'],
        resources: [{ title: 'Automate the Boring Stuff with Python', url: 'https://automatetheboringstuff.com/' }]
      },
      {
        id: 'da_pandas_core',
        label: 'Pandas DataFrames & Manipulation',
        phase: '4. Python Programming',
        status: 'not_started',
        description: 'The standard library for data manipulation in Python: Series, DataFrames, indexing (.loc, .iloc), and column operations.',
        subtopics: ['Reading datasets (read_csv, read_excel, read_sql)', 'Selecting columns and filtering with boolean masks', 'Adding, deleting, and modifying columns', '.loc vs .iloc indexing differences'],
        resources: [{ title: 'Pandas Official Getting Started Tutorials', url: 'https://pandas.pydata.org/docs/getting_started/intro_tutorials/' }]
      },
      {
        id: 'da_numpy',
        label: 'NumPy Vectorized Arrays',
        phase: '4. Python Programming',
        status: 'not_started',
        description: 'Perform high-speed mathematical and numerical computations with multidimensional NumPy arrays.',
        subtopics: ['NumPy 1D and 2D arrays', 'Vectorized mathematical operations without loops', 'Broadcasting rules', 'Array slicing, masking, and filtering'],
        resources: [{ title: 'NumPy Quickstart Tutorial', url: 'https://numpy.org/doc/stable/user/quickstart.html' }]
      },
      {
        id: 'da_data_cleanup',
        label: 'Data Cleaning & Transformation',
        phase: '4. Python Programming',
        status: 'not_started',
        description: 'Detect and resolve dirty data: missing values (.isna, .fillna, .dropna), removing duplicates, string stripping, and type conversions.',
        subtopics: ['Detecting and imputing missing data (mean/median/mode)', 'Removing duplicated rows (.drop_duplicates)', 'Detecting and capping outliers using IQR / Z-score', 'Type casting (.astype) and datetime parsing (pd.to_datetime)'],
        resources: [{ title: 'Kaggle: Data Cleaning Course', url: 'https://www.kaggle.com/learn/data-cleaning' }]
      },

      // Phase 5: Mastering Data Handling & Collection
      {
        id: 'da_collect_db',
        label: 'Querying Databases via Python',
        phase: '5. Data Handling & Collection',
        status: 'not_started',
        description: 'Connect Python scripts to relational databases using SQLAlchemy, psycopg2, or sqlite3 to stream query results into DataFrames.',
        subtopics: ['SQLAlchemy engine connection strings', 'pd.read_sql and pd.read_sql_query', 'Streaming large tables in chunks (chunksize)', 'Writing DataFrames back to database (to_sql)'],
        resources: [{ title: 'SQLAlchemy Documentation', url: 'https://docs.sqlalchemy.org/' }]
      },
      {
        id: 'da_collect_files',
        label: 'Ingesting CSV, Excel & Parquet Files',
        phase: '5. Data Handling & Collection',
        status: 'not_started',
        description: 'Ingest raw data files with custom delimiters, encodings, date parsers, and columnar Parquet formats.',
        subtopics: ['Handling CSV encodings (UTF-8, Latin-1, CP1252)', 'Custom delimiters (tabs, pipes, semicolons)', 'Reading multi-sheet Excel files', 'Columnar compressed Parquet files for speed'],
        resources: [{ title: 'Pandas IO Tools Documentation', url: 'https://pandas.pydata.org/docs/user_guide/io.html' }]
      },
      {
        id: 'da_collect_apis',
        label: 'Fetching Data from Web APIs',
        phase: '5. Data Handling & Collection',
        status: 'not_started',
        description: 'Extract live data from REST APIs using Python requests: headers, authentication tokens, status codes, and parsing JSON.',
        subtopics: ['HTTP GET requests with requests.get()', 'Bearer tokens, API keys, and query parameters', 'Parsing nested JSON responses into tabular DataFrames', 'Handling rate limits and pagination (next page tokens)'],
        resources: [{ title: 'Real Python: Python Requests Guide', url: 'https://realpython.com/python-requests/' }]
      },
      {
        id: 'da_collect_scrape',
        label: 'Web Scraping with BeautifulSoup',
        phase: '5. Data Handling & Collection',
        status: 'not_started',
        description: 'Scrape structured tabular data from public websites using BeautifulSoup and HTML parsing.',
        subtopics: ['HTML DOM tree inspection (tables, tags, classes)', 'Finding elements with find() and find_all()', 'Extracting table rows into Pandas DataFrames', 'Robots.txt compliance and scraping etiquette'],
        resources: [{ title: 'BeautifulSoup Documentation', url: 'https://www.crummy.com/software/BeautifulSoup/bs4/doc/' }]
      },

      // Phase 6: Data Visualization & BI Tools
      {
        id: 'da_viz_choice',
        label: 'Chart Selection & Storytelling',
        phase: '6. Visualization & BI',
        status: 'not_started',
        description: 'Select the optimal chart for the story: Distributions (Histograms, Box plots), Comparisons (Bar, Column), Trends (Line), Relationships (Scatter), and Proportions.',
        subtopics: ['Choosing charts based on data types', 'Bar charts vs Histograms vs Box plots', 'Scatter plots for correlation visualization', 'Avoiding misleading axes and pie chart pitfalls'],
        resources: [{ title: 'From Data to Viz: Chart Decision Tree', url: 'https://www.data-to-viz.com/' }]
      },
      {
        id: 'da_viz_python',
        label: 'Python Plotting (Matplotlib & Seaborn)',
        phase: '6. Visualization & BI',
        status: 'not_started',
        description: 'Create publication-grade exploratory charts in Python using Matplotlib subplots and Seaborn statistical plots.',
        subtopics: ['Matplotlib figure and axes architecture', 'Seaborn distribution plots (histplot, kdeplot)', 'Seaborn relationship plots (scatterplot, lineplot)', 'Heatmaps with correlation matrices'],
        resources: [{ title: 'Seaborn Tutorial & Gallery', url: 'https://seaborn.pydata.org/tutorial.html' }]
      },
      {
        id: 'da_viz_powerbi',
        label: 'Power BI Data Modeling & Dashboards',
        phase: '6. Visualization & BI',
        status: 'not_started',
        description: 'Build enterprise BI dashboards in Power BI: Star Schema relationships, Power Query transformations, and interactive visuals.',
        subtopics: ['Power Query ETL transformations', 'Star Schema data modeling (Fact and Dimension tables)', 'Relationships (1-to-many, active vs inactive)', 'Building interactive visuals, filters, and bookmarks'],
        resources: [{ title: 'Microsoft Learn: Power BI Analyst Path', url: 'https://learn.microsoft.com/en-us/training/paths/power-bi-data-analyst/' }]
      },
      {
        id: 'da_viz_tableau',
        label: 'Tableau Visual Analytics & LODs',
        phase: '6. Visualization & BI',
        status: 'not_started',
        description: 'Design interactive dashboards in Tableau: Dimensions vs Measures, discrete vs continuous pills, parameters, and Level of Detail (LOD) calculations.',
        subtopics: ['Blue vs Green pills (Discrete vs Continuous)', 'Calculated fields, table calculations, and parameters', 'Level of Detail (LOD) expressions (FIXED, INCLUDE, EXCLUDE)', 'Publishing interactive dashboards to Tableau Server/Public'],
        resources: [{ title: 'Tableau Free Training Videos', url: 'https://www.tableau.com/learn/training' }]
      },
      {
        id: 'da_viz_dax',
        label: 'DAX Measures & Time Intelligence',
        phase: '6. Visualization & BI',
        status: 'not_started',
        description: 'Author custom business calculations in Power BI using Data Analysis Expressions (DAX).',
        subtopics: ['Calculated Columns vs DAX Measures', 'CALCULATE function and filter context transition', 'Time intelligence: YTD, MTD, SamePeriodLastYear', 'DIVIDE, RELATED, and ALL filtering functions'],
        resources: [{ title: 'SQLBI: Guide to DAX Basics', url: 'https://www.sqlbi.com/guides/dax/' }]
      },

      // Phase 7: Statistical Analysis & Hypothesis Testing
      {
        id: 'da_stat_desc',
        label: 'Descriptive Statistics & Central Tendency',
        phase: '7. Statistical Analysis',
        status: 'not_started',
        description: 'Quantify data distributions: Mean, Median, Mode, weighted averages, and when to use each.',
        subtopics: ['Mean vs Median in skewed distributions', 'Mode for categorical frequencies', 'Weighted mean calculations', 'Sensitivity to extreme outliers'],
        resources: [{ title: 'Khan Academy: Summarizing Quantitative Data', url: 'https://www.khanacademy.org/math/statistics-probability' }]
      },
      {
        id: 'da_stat_disp',
        label: 'Measures of Dispersion & Spread',
        phase: '7. Statistical Analysis',
        status: 'not_started',
        description: 'Measure the variability and spread of your data: Range, Variance, Standard Deviation, and Interquartile Range (IQR).',
        subtopics: ['Variance and Standard Deviation calculations', 'Degrees of freedom (N-1 vs N)', 'Interquartile Range (IQR) and percentiles (p25, p75, p90)', 'Empirical Rule (68-95-99.7) for normal curves'],
        resources: [{ title: 'StatQuest: Standard Deviation and Variance', url: 'https://statquest.org/' }]
      },
      {
        id: 'da_stat_dist',
        label: 'Distributions, Skewness & Kurtosis',
        phase: '7. Statistical Analysis',
        status: 'not_started',
        description: 'Understand probability distributions, bell curves, positive/negative skewness, kurtosis, and the Central Limit Theorem.',
        subtopics: ['Normal (Gaussian) distribution and Z-scores', 'Right-skewed vs Left-skewed data distributions', 'Kurtosis (peakedness and heavy tails)', 'Central Limit Theorem (CLT) mechanics'],
        resources: [{ title: 'Seeing Theory: Visual Introduction to Probability and Statistics', url: 'https://seeing-theory.brown.edu/' }]
      },
      {
        id: 'da_stat_corr',
        label: 'Correlation & Covariance',
        phase: '7. Statistical Analysis',
        status: 'not_started',
        description: 'Analyze relationships between variables: Pearson correlation coefficient (r), Spearman rank correlation, and covariance.',
        subtopics: ['Pearson r correlation (-1 to +1)', 'Spearman rank correlation for non-linear data', 'Correlation matrix heatmaps', 'Correlation vs Causation fallacies'],
        resources: [{ title: 'Spurious Correlations (Tyler Vigen)', url: 'https://www.tylervigen.com/spurious-correlations' }]
      },
      {
        id: 'da_stat_hypo',
        label: 'Hypothesis Testing & P-Values',
        phase: '7. Statistical Analysis',
        status: 'not_started',
        description: 'Test business assumptions statistically: Null ($H_0$) vs Alternative ($H_1$) hypotheses, Type I/II errors, and p-values.',
        subtopics: ['Null ($H_0$) and Alternative ($H_1$) hypotheses', 'Significance level ($\alpha = 0.05$) and critical regions', 'Interpreting p-values correctly', 'Type I (False Positive) vs Type II (False Negative) errors'],
        resources: [{ title: 'StatQuest: Hypothesis Testing and P-Values', url: 'https://statquest.org/' }]
      },
      {
        id: 'da_stat_tests',
        label: 'Statistical Tests (t-test, ANOVA, Chi-Square)',
        phase: '7. Statistical Analysis',
        status: 'not_started',
        description: 'Choose and run appropriate statistical tests: Two-sample t-test, Paired t-test, ANOVA for multi-group means, and Chi-Square test of independence.',
        subtopics: ['Two-sample independent t-test', 'One-way ANOVA for 3+ groups (F-statistic)', 'Chi-Square test for categorical independence', 'Running statistical tests with scipy.stats in Python'],
        resources: [{ title: 'Scipy Stats Documentation', url: 'https://docs.scipy.org/doc/scipy/reference/stats.html' }]
      },
      {
        id: 'da_stat_ab',
        label: 'A/B Testing & Experimentation',
        phase: '7. Statistical Analysis',
        status: 'not_started',
        description: 'Design and evaluate real-world A/B tests for web apps and marketing campaigns: sample sizing, statistical power, and conversion lift.',
        subtopics: ['Control vs Variant randomized splitting', 'Sample size calculation and Minimum Detectable Effect (MDE)', 'Statistical power ($1 - \beta = 0.80$)', 'Evaluating conversion rate lift and revenue significance'],
        resources: [{ title: 'Evan Miller A/B Testing Calculator & Guide', url: 'https://www.evanmiller.org/ab-testing/' }]
      },
      {
        id: 'da_stat_reg',
        label: 'Linear & Multiple Regression Analysis',
        phase: '7. Statistical Analysis',
        status: 'not_started',
        description: 'Model predictive relationships: Ordinary Least Squares (OLS), slope, intercept, coefficients, $R^2$, and multicollinearity.',
        subtopics: ['Simple linear regression equation ($y = mx + b$)', 'Multiple linear regression with multiple predictors', 'Interpreting $R^2$ (coefficient of determination) and Adjusted $R^2$', 'Detecting Multicollinearity with Variance Inflation Factor (VIF)'],
        resources: [{ title: 'StatQuest: Linear Regression', url: 'https://statquest.org/' }]
      },

      // Phase 8: Advanced Topics: Machine Learning & Big Data
      {
        id: 'da_ml_types',
        label: 'Machine Learning Fundamentals & Types',
        phase: '8. ML & Big Data',
        status: 'not_started',
        description: 'Understand the three main branches of machine learning: Supervised Learning (labeled targets), Unsupervised Learning (clustering), and Reinforcement Learning.',
        subtopics: ['Supervised Learning (Regression vs Classification)', 'Unsupervised Learning (Clustering vs Dimensionality reduction)', 'Reinforcement Learning overview', 'Features, labels, and training/test splits'],
        resources: [{ title: 'Google Machine Learning Crash Course', url: 'https://developers.google.com/machine-learning/crash-course' }]
      },
      {
        id: 'da_ml_algorithms',
        label: 'Popular Machine Learning Algorithms',
        phase: '8. ML & Big Data',
        status: 'not_started',
        description: 'Apply essential algorithms with Scikit-Learn: Decision Trees, Random Forests, Logistic Regression, Naive Bayes, KNN, and K-Means.',
        subtopics: ['Logistic Regression for binary classification', 'Decision Trees and Random Forest ensembles', 'K-Nearest Neighbors (KNN) classification', 'K-Means clustering for customer segmentation'],
        resources: [{ title: 'Scikit-Learn Machine Learning in Python', url: 'https://scikit-learn.org/stable/' }]
      },
      {
        id: 'da_ml_eval',
        label: 'Model Evaluation & Validation Techniques',
        phase: '8. ML & Big Data',
        status: 'not_started',
        description: 'Assess machine learning models: Confusion Matrix, Accuracy, Precision, Recall, F1-Score, and ROC-AUC curve.',
        subtopics: ['Confusion Matrix: TP, FP, TN, FN', 'Precision vs Recall tradeoff', 'F1-Score (Harmonic mean)', 'ROC curve and Area Under Curve (AUC) score'],
        resources: [{ title: 'StatQuest: ROC and AUC Curves', url: 'https://statquest.org/' }]
      },
      {
        id: 'da_deep_learning',
        label: 'Deep Learning & Neural Networks Intro',
        phase: '8. ML & Big Data',
        status: 'not_started',
        description: 'High-level introduction to artificial neural networks: perceptrons, layers, activation functions, CNNs for computer vision, and RNNs/Transformers.',
        subtopics: ['Biological vs Artificial Neurons', 'Layers (Input, Hidden, Output)', 'Convolutional Neural Networks (CNNs) for images', 'PyTorch & TensorFlow ecosystem overview'],
        resources: [{ title: '3Blue1Brown: But what is a neural network?', url: 'https://www.3blue1brown.com/lessons/neural-networks' }]
      },
      {
        id: 'da_big_data',
        label: 'Big Data Concepts & Apache Spark',
        phase: '8. ML & Big Data',
        status: 'not_started',
        description: 'Scale analytics beyond single-machine memory: 3 V\'s of Big Data (Volume, Velocity, Variety), Data Lakes (S3), and distributed processing with Apache Spark and Hadoop.',
        subtopics: ['Big Data 3 V\'s: Volume, Velocity, Variety', 'Data Warehouses vs Data Lakes (AWS S3, Snowflake)', 'Distributed computing architecture (Driver and Workers)', 'Apache Spark & PySpark basics'],
        resources: [{ title: 'Databricks: What is Apache Spark?', url: 'https://www.databricks.com/spark/about' }]
      }
    ],
    edges: [
      // Phase 1 -> Phase 2
      { source: 'da_intro', target: 'da_types' },
      { source: 'da_types', target: 'da_lifecycle' },
      { source: 'da_lifecycle', target: 'da_excel_logic' },

      // Phase 2 Excel
      { source: 'da_excel_logic', target: 'da_excel_lookup' },
      { source: 'da_excel_lookup', target: 'da_excel_text' },
      { source: 'da_excel_text', target: 'da_excel_stats' },
      { source: 'da_excel_stats', target: 'da_excel_pivot' },
      { source: 'da_excel_pivot', target: 'da_excel_charts' },

      // Phase 2 -> Phase 3 SQL
      { source: 'da_excel_charts', target: 'da_sql_basics' },
      { source: 'da_sql_basics', target: 'da_sql_agg' },
      { source: 'da_sql_agg', target: 'da_sql_joins' },
      { source: 'da_sql_joins', target: 'da_sql_subqueries' },
      { source: 'da_sql_subqueries', target: 'da_sql_window' },

      // Phase 3 -> Phase 4 Python
      { source: 'da_sql_window', target: 'da_python_basics' },
      { source: 'da_python_basics', target: 'da_pandas_core' },
      { source: 'da_pandas_core', target: 'da_numpy' },
      { source: 'da_numpy', target: 'da_data_cleanup' },

      // Phase 4 -> Phase 5 Data Handling
      { source: 'da_data_cleanup', target: 'da_collect_db' },
      { source: 'da_collect_db', target: 'da_collect_files' },
      { source: 'da_collect_files', target: 'da_collect_apis' },
      { source: 'da_collect_apis', target: 'da_collect_scrape' },

      // Phase 5 -> Phase 6 Visualization
      { source: 'da_collect_scrape', target: 'da_viz_choice' },
      { source: 'da_viz_choice', target: 'da_viz_python' },
      { source: 'da_viz_python', target: 'da_viz_powerbi' },
      { source: 'da_viz_powerbi', target: 'da_viz_tableau' },
      { source: 'da_viz_tableau', target: 'da_viz_dax' },

      // Phase 6 -> Phase 7 Statistics
      { source: 'da_viz_dax', target: 'da_stat_desc' },
      { source: 'da_stat_desc', target: 'da_stat_disp' },
      { source: 'da_stat_disp', target: 'da_stat_dist' },
      { source: 'da_stat_dist', target: 'da_stat_corr' },
      { source: 'da_stat_corr', target: 'da_stat_hypo' },
      { source: 'da_stat_hypo', target: 'da_stat_tests' },
      { source: 'da_stat_tests', target: 'da_stat_ab' },
      { source: 'da_stat_ab', target: 'da_stat_reg' },

      // Phase 7 -> Phase 8 ML & Big Data
      { source: 'da_stat_reg', target: 'da_ml_types' },
      { source: 'da_ml_types', target: 'da_ml_algorithms' },
      { source: 'da_ml_algorithms', target: 'da_ml_eval' },
      { source: 'da_ml_eval', target: 'da_deep_learning' },
      { source: 'da_deep_learning', target: 'da_big_data' }
    ]
  },

  // ─── AI and Data Scientist ─────────────────────────────────────────────────────────
  'ai-data-scientist': {
    id: 'ai-data-scientist',
    name: 'AI and Data Scientist',
    icon: '🔬',
    badge: 'roadmap.sh',
    category: 'ai_data',
    description: "Complete curriculum for AI & Data Science: Linear algebra, multivariable calculus, probability, scientific Python, Scikit-Learn, PyTorch deep learning, and model deployment.",
    roadmapUrl: 'https://roadmap.sh/ai-data-scientist',
    nodes: [
      {
            "id": "aids_linear_algebra",
            "label": "Linear Algebra for Machine Learning",
            "phase": "1. Mathematical Foundations",
            "status": "not_started",
            "description": "Vectors, matrices, matrix multiplication, determinants, eigenvalues, eigenvectors, and singular value decomposition (SVD).",
            "subtopics": [
                  "Vector spaces, norms & dot products",
                  "Matrix transformations & inverses",
                  "Eigenvalues and Eigenvectors in PCA",
                  "Singular Value Decomposition (SVD)"
            ],
            "resources": [
                  {
                        "title": "3Blue1Brown: Essence of Linear Algebra",
                        "url": "https://www.3blue1brown.com/topics/linear-algebra"
                  }
            ]
      },
      {
            "id": "aids_multivariate_calc",
            "label": "Multivariate Calculus & Optimization",
            "phase": "1. Mathematical Foundations",
            "status": "not_started",
            "description": "Derivatives, partial derivatives, gradients, Jacobian, Hessian matrices, and gradient descent optimization mechanics.",
            "subtopics": [
                  "Partial derivatives and the Gradient vector",
                  "Chain rule for backpropagation",
                  "Hessian matrix and convexity",
                  "Gradient Descent: Batch, Stochastic (SGD), and Adam"
            ],
            "resources": [
                  {
                        "title": "Khan Academy: Multivariable Calculus",
                        "url": "https://www.khanacademy.org/math/multivariable-calculus"
                  }
            ]
      },
      {
            "id": "aids_prob_stats",
            "label": "Probability Theory & Random Variables",
            "phase": "1. Mathematical Foundations",
            "status": "not_started",
            "description": "Probability distributions (Gaussian, Bernoulli, Poisson), Bayes theorem, conditional probability, and expectation.",
            "subtopics": [
                  "Bayes Theorem & Prior/Posterior probabilities",
                  "Probability Density Functions (PDF) & CDF",
                  "Central Limit Theorem & Law of Large Numbers",
                  "Maximum Likelihood Estimation (MLE)"
            ],
            "resources": [
                  {
                        "title": "Penn State STAT 414 Probability Theory",
                        "url": "https://online.stat.psu.edu/stat414/"
                  }
            ]
      },
      {
            "id": "aids_numpy",
            "label": "Advanced NumPy & Vectorization",
            "phase": "2. Scientific Computing",
            "status": "not_started",
            "description": "High-performance n-dimensional array computing, broadcasting, vectorization, and memory views.",
            "subtopics": [
                  "Array indexing, slicing, and strides",
                  "Broadcasting rules and multidimensional math",
                  "Vectorized computations vs Python loops",
                  "Linear algebra with numpy.linalg"
            ],
            "resources": [
                  {
                        "title": "NumPy User Guide",
                        "url": "https://numpy.org/doc/stable/user/"
                  }
            ]
      },
      {
            "id": "aids_pandas",
            "label": "Pandas & Modern Data Wrangling",
            "phase": "2. Scientific Computing",
            "status": "not_started",
            "description": "Complex data manipulation, multi-index tables, time-series data, merges, aggregations, and window functions.",
            "subtopics": [
                  "MultiIndex & hierarchical data",
                  "groupby(), agg(), pivot_table()",
                  "Datetime manipulation & resample()",
                  "Polars high-performance alternative dataframe"
            ],
            "resources": [
                  {
                        "title": "Pandas Documentation",
                        "url": "https://pandas.pydata.org/docs/"
                  }
            ]
      },
      {
            "id": "aids_eda",
            "label": "Exploratory Data Analysis (EDA)",
            "phase": "2. Scientific Computing",
            "status": "not_started",
            "description": "Uncover patterns, spot anomalies, test hypotheses, and verify assumptions using summary statistics and visualization.",
            "subtopics": [
                  "Correlation matrices & heatmaps",
                  "Outlier detection (IQR, Z-score, Isolation Forest)",
                  "Missing data imputation (Iterative, KNN, MICE)",
                  "Feature distributions & Q-Q plots"
            ],
            "resources": [
                  {
                        "title": "EDA with Python (Kaggle Learn)",
                        "url": "https://www.kaggle.com/learn/data-cleaning"
                  }
            ]
      },
      {
            "id": "aids_feature_eng",
            "label": "Feature Engineering & Preprocessing",
            "phase": "3. Machine Learning Core",
            "status": "not_started",
            "description": "Transform raw data into predictive feature signals: encoding, scaling, transformations, and polynomial expansions.",
            "subtopics": [
                  "One-Hot & Target Encoding for categoricals",
                  "StandardScaler, MinMaxScaler, RobustScaler",
                  "Box-Cox & Yeo-Johnson power transforms",
                  "Principal Component Analysis (PCA) dimensionality reduction"
            ],
            "resources": [
                  {
                        "title": "Scikit-Learn Preprocessing Guide",
                        "url": "https://scikit-learn.org/stable/modules/preprocessing.html"
                  }
            ]
      },
      {
            "id": "aids_supervised_ml",
            "label": "Supervised Learning Algorithms",
            "phase": "3. Machine Learning Core",
            "status": "not_started",
            "description": "Implement regression and classification algorithms: Ridge/Lasso, Support Vector Machines (SVM), and Ensembles.",
            "subtopics": [
                  "Ridge & Lasso regularization (L1/L2)",
                  "Support Vector Machines (Linear & RBF kernels)",
                  "Random Forest & Bagging ensembles",
                  "Gradient Boosting (XGBoost, LightGBM, CatBoost)"
            ],
            "resources": [
                  {
                        "title": "XGBoost Documentation",
                        "url": "https://xgboost.readthedocs.io/"
                  }
            ]
      },
      {
            "id": "aids_unsupervised_ml",
            "label": "Unsupervised Learning & Clustering",
            "phase": "3. Machine Learning Core",
            "status": "not_started",
            "description": "Group unlabelled data and discover latent representations: K-Means, Hierarchical clustering, and DBSCAN.",
            "subtopics": [
                  "K-Means & Elbow Method / Silhouette score",
                  "DBSCAN density-based clustering",
                  "Hierarchical Agglomerative clustering & Dendrograms",
                  "t-SNE & UMAP for high-dimensional visualization"
            ],
            "resources": [
                  {
                        "title": "StatQuest: K-Means Clustering",
                        "url": "https://statquest.org/"
                  }
            ]
      },
      {
            "id": "aids_neural_nets",
            "label": "Neural Networks & PyTorch Fundamentals",
            "phase": "4. Deep Learning & PyTorch",
            "status": "not_started",
            "description": "Build neural networks from scratch: tensors, autograd, forward/backward passes, loss functions, and optimizers.",
            "subtopics": [
                  "PyTorch Tensors, GPU acceleration (CUDA)",
                  "nn.Module, layers, and forward method",
                  "Loss functions (CrossEntropy, MSE)",
                  "Optimizers (SGD with momentum, AdamW)"
            ],
            "resources": [
                  {
                        "title": "PyTorch Deep Learning Tutorials",
                        "url": "https://pytorch.org/tutorials/"
                  }
            ]
      },
      {
            "id": "aids_regularization_dl",
            "label": "Deep Learning Optimization & Regularization",
            "phase": "4. Deep Learning & PyTorch",
            "status": "not_started",
            "description": "Overcome vanishing gradients and overfitting: Dropout, Batch Normalization, Layer Normalization, and learning rate schedules.",
            "subtopics": [
                  "Dropout & Weight Decay (L2 penalty)",
                  "BatchNorm vs LayerNorm",
                  "Learning Rate Warmup & Cosine Annealing",
                  "Early stopping & checkpoint saving"
            ],
            "resources": [
                  {
                        "title": "Deep Learning Book (Goodfellow, Bengio)",
                        "url": "https://www.deeplearningbook.org/"
                  }
            ]
      },
      {
            "id": "aids_cnn",
            "label": "Computer Vision & CNN Architectures",
            "phase": "5. Specialized Domains",
            "status": "not_started",
            "description": "Convolutional neural networks for image classification, object detection, and transfer learning with torchvision.",
            "subtopics": [
                  "Convolutional kernels, stride, and padding",
                  "Pooling layers (MaxPooling, GlobalAveragePooling)",
                  "ResNet, EfficientNet & residual skip connections",
                  "Transfer learning with pre-trained vision weights"
            ],
            "resources": [
                  {
                        "title": "CS231n: Deep Learning for Computer Vision (Stanford)",
                        "url": "https://cs231n.github.io/"
                  }
            ]
      },
      {
            "id": "aids_transformers",
            "label": "NLP & Transformer Architecture",
            "phase": "5. Specialized Domains",
            "status": "not_started",
            "description": "Attention Is All You Need: self-attention, multi-head attention, positional encodings, and BERT/GPT architectures.",
            "subtopics": [
                  "Scaled Dot-Product Self-Attention mechanics",
                  "Multi-Head Attention & Query/Key/Value vectors",
                  "Positional Encodings (Sinusoidal & RoPE)",
                  "Encoder-only (BERT) vs Decoder-only (GPT) architectures"
            ],
            "resources": [
                  {
                        "title": "The Illustrated Transformer (Jay Alammar)",
                        "url": "https://jalammar.github.io/illustrated-transformer/"
                  }
            ]
      },
      {
            "id": "aids_mlflow",
            "label": "Experiment Tracking & Model Registry (MLflow)",
            "phase": "6. Production Data Science",
            "status": "not_started",
            "description": "Log metrics, hyperparameters, dataset hashes, and model artifacts with MLflow or Weights & Biases (W&B).",
            "subtopics": [
                  "Logging parameters, metrics, and artifact artifacts",
                  "Model Registry: Staging, Production, and Archived",
                  "Reproducible environments with Conda/Docker",
                  "Weights & Biases (wandb) dashboard setup"
            ],
            "resources": [
                  {
                        "title": "MLflow Official Documentation",
                        "url": "https://mlflow.org/docs/latest/index.html"
                  }
            ]
      },
      {
            "id": "aids_deployment",
            "label": "Model Serving & FastAPI Inference",
            "phase": "6. Production Data Science",
            "status": "not_started",
            "description": "Wrap ML and deep learning models inside production REST APIs with FastAPI, Docker, and ONNX Runtime.",
            "subtopics": [
                  "FastAPI asynchronous endpoints for prediction",
                  "Dockerizing ML inference containers",
                  "ONNX model export & ONNX Runtime acceleration",
                  "Batch prediction vs real-time latency optimization"
            ],
            "resources": [
                  {
                        "title": "FastAPI Official Documentation",
                        "url": "https://fastapi.tiangolo.com/"
                  }
            ]
      }
],
    edges: [
      {
            "source": "aids_linear_algebra",
            "target": "aids_multivariate_calc"
      },
      {
            "source": "aids_multivariate_calc",
            "target": "aids_prob_stats"
      },
      {
            "source": "aids_prob_stats",
            "target": "aids_numpy"
      },
      {
            "source": "aids_numpy",
            "target": "aids_pandas"
      },
      {
            "source": "aids_pandas",
            "target": "aids_eda"
      },
      {
            "source": "aids_eda",
            "target": "aids_feature_eng"
      },
      {
            "source": "aids_feature_eng",
            "target": "aids_supervised_ml"
      },
      {
            "source": "aids_supervised_ml",
            "target": "aids_unsupervised_ml"
      },
      {
            "source": "aids_unsupervised_ml",
            "target": "aids_neural_nets"
      },
      {
            "source": "aids_neural_nets",
            "target": "aids_regularization_dl"
      },
      {
            "source": "aids_regularization_dl",
            "target": "aids_cnn"
      },
      {
            "source": "aids_cnn",
            "target": "aids_transformers"
      },
      {
            "source": "aids_transformers",
            "target": "aids_mlflow"
      },
      {
            "source": "aids_mlflow",
            "target": "aids_deployment"
      }
]
  },

  // ─── Data Engineer ─────────────────────────────────────────────────────────
  'data-engineer': {
    id: 'data-engineer',
    name: 'Data Engineer',
    icon: '⚙️',
    badge: 'roadmap.sh',
    category: 'ai_data',
    description: "Comprehensive Data Engineering path: Distributed computing, SQL mastery, Snowflake/BigQuery data warehouses, Apache Iceberg, Apache Spark, Airflow, dbt, and Kafka streaming.",
    roadmapUrl: 'https://roadmap.sh/data-engineer',
    nodes: [
      {
            "id": "de_linux_sql",
            "label": "Linux, Shell & Advanced SQL",
            "phase": "1. Foundations",
            "status": "not_started",
            "description": "Command-line text processing (awk, sed, grep), cron scheduling, environment configs, and advanced analytic SQL.",
            "subtopics": [
                  "Bash scripting & automated cron jobs",
                  "Window functions (RANK, ROW_NUMBER, LAG, LEAD)",
                  "Common Table Expressions (CTEs) & recursive queries",
                  "EXPLAIN ANALYZE & query optimization"
            ],
            "resources": [
                  {
                        "title": "roadmap.sh Data Engineer Guide",
                        "url": "https://roadmap.sh/data-engineer"
                  }
            ]
      },
      {
            "id": "de_data_modeling",
            "label": "Data Modeling & Warehousing Concepts",
            "phase": "1. Foundations",
            "status": "not_started",
            "description": "Design analytical schemas: Kimball dimensional modeling, Star schema, Snowflake schema, and Data Vault 2.0.",
            "subtopics": [
                  "Star Schema: Fact tables vs Dimension tables",
                  "Slowly Changing Dimensions (SCD Type 1, 2, 3)",
                  "Snowflake schema normalization tradeoffs",
                  "Data Vault 2.0 Hubs, Links, and Satellites"
            ],
            "resources": [
                  {
                        "title": "The Data Warehouse Toolkit (Ralph Kimball)",
                        "url": "https://www.kimballgroup.com/"
                  }
            ]
      },
      {
            "id": "de_file_formats",
            "label": "Columnar File Formats (Parquet & ORC)",
            "phase": "2. Storage & Formats",
            "status": "not_started",
            "description": "High-performance storage for analytical queries: Apache Parquet, Snappy compression, dictionary encoding, and Avro.",
            "subtopics": [
                  "Row-oriented (CSV, JSON, Avro) vs Columnar (Parquet, ORC)",
                  "Snappy & ZSTD compression benchmarks",
                  "Column pruning & predicate pushdown mechanics",
                  "Schema evolution and backward compatibility"
            ],
            "resources": [
                  {
                        "title": "Apache Parquet Documentation",
                        "url": "https://parquet.apache.org/"
                  }
            ]
      },
      {
            "id": "de_cloud_warehouses",
            "label": "Cloud Data Warehouses (Snowflake, BigQuery, Redshift)",
            "phase": "2. Storage & Formats",
            "status": "not_started",
            "description": "Architect and query modern cloud warehouses: Snowflake virtual warehouses, BigQuery serverless slots, and Redshift clusters.",
            "subtopics": [
                  "Snowflake multi-cluster architecture & micro-partitions",
                  "BigQuery partitioning and clustering strategies",
                  "Amazon Redshift distribution styles & sort keys",
                  "Cost control and compute/storage decoupling"
            ],
            "resources": [
                  {
                        "title": "Snowflake Architecture Overview",
                        "url": "https://docs.snowflake.com/en/user-guide/intro-key-concepts"
                  }
            ]
      },
      {
            "id": "de_lakehouse",
            "label": "Modern Table Formats (Delta Lake & Iceberg)",
            "phase": "3. Data Lakehouses",
            "status": "not_started",
            "description": "Bring ACID transactions, schema enforcement, and time-travel querying to object storage (S3/GCS) with Apache Iceberg & Delta Lake.",
            "subtopics": [
                  "Apache Iceberg metadata tree & snapshot isolation",
                  "Delta Lake transaction log (_delta_log)",
                  "Time travel queries & historical rollbacks",
                  "Compaction (OPTIMIZE) and vacuum operations"
            ],
            "resources": [
                  {
                        "title": "Apache Iceberg Documentation",
                        "url": "https://iceberg.apache.org/"
                  }
            ]
      },
      {
            "id": "de_spark_core",
            "label": "Distributed Processing with Apache Spark",
            "phase": "4. Distributed Compute",
            "status": "not_started",
            "description": "Scale compute across clusters: Spark Core, Catalyst Optimizer, DataFrames, Tungsten execution engine, and PySpark.",
            "subtopics": [
                  "Spark Architecture: Driver, Cluster Manager, Executors",
                  "Transformations (Lazy) vs Actions (Eager)",
                  "Narrow vs Wide dependencies & Shuffle partitions",
                  "PySpark DataFrame API and SQL transformations"
            ],
            "resources": [
                  {
                        "title": "Databricks Spark Guide",
                        "url": "https://spark.apache.org/docs/latest/api/python/"
                  }
            ]
      },
      {
            "id": "de_spark_tuning",
            "label": "Spark Performance Tuning & Optimization",
            "phase": "4. Distributed Compute",
            "status": "not_started",
            "description": "Diagnose and fix cluster bottlenecks: data skew, broadcast joins, memory spills, and partition management.",
            "subtopics": [
                  "Broadcast Hash Join (BHJ) vs Sort-Merge Join",
                  "Handling Data Skew with salting",
                  "Memory allocation (Storage memory vs Execution memory)",
                  "Inspecting Spark UI for stages and spilled tasks"
            ],
            "resources": [
                  {
                        "title": "Spark Performance Tuning Guide",
                        "url": "https://spark.apache.org/docs/latest/tuning.html"
                  }
            ]
      },
      {
            "id": "de_orchestration_airflow",
            "label": "Workflow Orchestration (Apache Airflow)",
            "phase": "5. Orchestration & dbt",
            "status": "not_started",
            "description": "Author, schedule, and monitor data pipelines as Directed Acyclic Graphs (DAGs) with Apache Airflow.",
            "subtopics": [
                  "Airflow DAGs, Operators, and Sensors",
                  "Task dependencies & dynamic task mapping",
                  "XComs vs intermediate cloud storage",
                  "Airflow Celery / Kubernetes Executors"
            ],
            "resources": [
                  {
                        "title": "Apache Airflow Official Documentation",
                        "url": "https://airflow.apache.org/"
                  }
            ]
      },
      {
            "id": "de_dbt",
            "label": "Data Transformation with dbt (data build tool)",
            "phase": "5. Orchestration & dbt",
            "status": "not_started",
            "description": "Transform data in-warehouse using software engineering best practices: version control, modular SQL, testing, and documentation.",
            "subtopics": [
                  "dbt models (Tables, Views, Incremental)",
                  "Jinja templating & ref() macros",
                  "dbt generic tests (unique, not_null, accepted_values)",
                  "dbt docs generate & lineage DAG graph"
            ],
            "resources": [
                  {
                        "title": "dbt Learn & Documentation",
                        "url": "https://docs.getdbt.com/"
                  }
            ]
      },
      {
            "id": "de_streaming_kafka",
            "label": "Event Streaming with Apache Kafka",
            "phase": "6. Streaming & Messaging",
            "status": "not_started",
            "description": "Build high-throughput, fault-tolerant real-time ingestion pipelines with Apache Kafka, topics, partitions, and consumer groups.",
            "subtopics": [
                  "Kafka Brokers, Topics, and Partitions",
                  "Producers, Consumers & Consumer Groups",
                  "Commit offsets, At-least-once vs Exactly-once semantics",
                  "Kafka Connect for database CDC (Change Data Capture)"
            ],
            "resources": [
                  {
                        "title": "Apache Kafka Official Documentation",
                        "url": "https://kafka.apache.org/"
                  }
            ]
      },
      {
            "id": "de_stream_processing",
            "label": "Stream Processing (Spark Streaming / Flink)",
            "phase": "6. Streaming & Messaging",
            "status": "not_started",
            "description": "Process continuous event data streams in real time: tumbling/sliding windows, watermarks, and stateful stream joins.",
            "subtopics": [
                  "Spark Structured Streaming micro-batching",
                  "Apache Flink true event-driven architecture",
                  "Watermarks and late-arriving event handling",
                  "Windowing: Tumbling, Sliding, and Session windows"
            ],
            "resources": [
                  {
                        "title": "Apache Flink Documentation",
                        "url": "https://flink.apache.org/"
                  }
            ]
      },
      {
            "id": "de_data_quality",
            "label": "Data Quality & Observability",
            "phase": "7. Governance & Observability",
            "status": "not_started",
            "description": "Ensure pipeline reliability and contract testing with Great Expectations, Soda, and data lineage platforms.",
            "subtopics": [
                  "Great Expectations validation suites",
                  "Data lineage tracking with OpenLineage",
                  "Data contracts between producers and consumers",
                  "Alerting on schema drift and volume anomalies"
            ],
            "resources": [
                  {
                        "title": "Great Expectations Documentation",
                        "url": "https://docs.greatexpectations.io/"
                  }
            ]
      }
],
    edges: [
      {
            "source": "de_linux_sql",
            "target": "de_data_modeling"
      },
      {
            "source": "de_data_modeling",
            "target": "de_file_formats"
      },
      {
            "source": "de_file_formats",
            "target": "de_cloud_warehouses"
      },
      {
            "source": "de_cloud_warehouses",
            "target": "de_lakehouse"
      },
      {
            "source": "de_lakehouse",
            "target": "de_spark_core"
      },
      {
            "source": "de_spark_core",
            "target": "de_spark_tuning"
      },
      {
            "source": "de_spark_tuning",
            "target": "de_orchestration_airflow"
      },
      {
            "source": "de_orchestration_airflow",
            "target": "de_dbt"
      },
      {
            "source": "de_dbt",
            "target": "de_streaming_kafka"
      },
      {
            "source": "de_streaming_kafka",
            "target": "de_stream_processing"
      },
      {
            "source": "de_stream_processing",
            "target": "de_data_quality"
      }
]
  },

  // ─── Machine Learning ─────────────────────────────────────────────────────────
  'machine-learning': {
    id: 'machine-learning',
    name: 'Machine Learning',
    icon: '🧠',
    badge: 'roadmap.sh',
    category: 'ai_data',
    description: "End-to-end Machine Learning mastery: Mathematics, feature engineering, classification, regression, ensembles (XGBoost), clustering, Optuna, and deep learning with PyTorch.",
    roadmapUrl: 'https://roadmap.sh/machine-learning',
    nodes: [
      {
            "id": "ml_math_stats",
            "label": "Linear Algebra, Calculus & Statistics",
            "phase": "1. Math & Statistics",
            "status": "not_started",
            "description": "Foundations essential for ML: matrix decompositions, gradient vectors, Bayes rule, hypothesis testing, and loss landscapes.",
            "subtopics": [
                  "Eigenvalues, SVD & matrix inverses",
                  "Partial derivatives & gradient descent",
                  "Probability distributions & Bayes Theorem",
                  "Confidence intervals & p-values"
            ],
            "resources": [
                  {
                        "title": "Mathematics for Machine Learning (Deisenroth)",
                        "url": "https://mml-book.github.io/"
                  }
            ]
      },
      {
            "id": "ml_python_stack",
            "label": "Scientific Python (NumPy, SciPy, Pandas)",
            "phase": "1. Math & Statistics",
            "status": "not_started",
            "description": "Vectorized mathematical programming, tabular manipulation, and scientific algorithms.",
            "subtopics": [
                  "NumPy vector operations & matrix math",
                  "Pandas data wrangling & cleaning",
                  "SciPy scientific routines and statistics",
                  "Matplotlib & Seaborn diagnostic plotting"
            ],
            "resources": [
                  {
                        "title": "SciPy Lecture Notes",
                        "url": "https://scipy-lectures.org/"
                  }
            ]
      },
      {
            "id": "ml_feature_eng",
            "label": "Feature Engineering & Data Preprocessing",
            "phase": "2. Preprocessing & Features",
            "status": "not_started",
            "description": "Techniques to prepare data for algorithms: imputation, encoding, transformation, scaling, and feature selection.",
            "subtopics": [
                  "Handling missing values (KNN, MICE, median)",
                  "Categorical encoding (One-hot, Ordinal, Target)",
                  "Feature scaling (Standard, MinMax, Robust)",
                  "Feature selection (Recursive Feature Elimination, Mutual Info)"
            ],
            "resources": [
                  {
                        "title": "Scikit-Learn Feature Extraction",
                        "url": "https://scikit-learn.org/stable/modules/feature_extraction.html"
                  }
            ]
      },
      {
            "id": "ml_regression",
            "label": "Linear & Logistic Regression",
            "phase": "3. Supervised Learning",
            "status": "not_started",
            "description": "Understand linear regression with L1/L2 regularization and logistic regression for probabilistic classification.",
            "subtopics": [
                  "Ordinary Least Squares (OLS) closed-form solution",
                  "Lasso (L1) feature selection & Ridge (L2) shrinkage",
                  "Sigmoid activation & Log-Loss (Binary Cross-Entropy)",
                  "Multinomial Softmax regression"
            ],
            "resources": [
                  {
                        "title": "StatQuest: Logistic Regression",
                        "url": "https://statquest.org/"
                  }
            ]
      },
      {
            "id": "ml_trees_forests",
            "label": "Decision Trees & Random Forests",
            "phase": "3. Supervised Learning",
            "status": "not_started",
            "description": "Non-linear tree architectures: Gini impurity, entropy, information gain, bagging, and out-of-bag error evaluation.",
            "subtopics": [
                  "Splitting criteria: Gini Impurity vs Entropy",
                  "Tree pruning (cost-complexity pruning, max_depth)",
                  "Bootstrap Aggregating (Bagging)",
                  "Feature importance calculation"
            ],
            "resources": [
                  {
                        "title": "Scikit-Learn Ensemble Methods",
                        "url": "https://scikit-learn.org/stable/modules/ensemble.html"
                  }
            ]
      },
      {
            "id": "ml_boosting",
            "label": "Gradient Boosting (XGBoost, LightGBM, CatBoost)",
            "phase": "3. Supervised Learning",
            "status": "not_started",
            "description": "State-of-the-art tabular algorithms: sequential boosting, residual fitting, learning rates, and tree building optimizations.",
            "subtopics": [
                  "Boosting intuition: fitting pseudo-residuals",
                  "XGBoost second-order Taylor expansion",
                  "LightGBM Histogram-based binning and GOSS",
                  "CatBoost native categorical feature handling"
            ],
            "resources": [
                  {
                        "title": "CatBoost Official Documentation",
                        "url": "https://catboost.ai/docs/"
                  }
            ]
      },
      {
            "id": "ml_svm_knn",
            "label": "Support Vector Machines & KNN",
            "phase": "3. Supervised Learning",
            "status": "not_started",
            "description": "Maximum-margin classifiers, kernel trick (RBF, polynomial), and distance-weighted nearest neighbor algorithms.",
            "subtopics": [
                  "Hyperplanes & margin maximization",
                  "Kernel Trick (Linear, Polynomial, RBF)",
                  "Slack variables & C regularization parameter",
                  "Distance metrics: Euclidean, Manhattan, Minkowski"
            ],
            "resources": [
                  {
                        "title": "Stanford CS229: Support Vector Machines",
                        "url": "https://cs229.stanford.edu/"
                  }
            ]
      },
      {
            "id": "ml_clustering",
            "label": "Clustering & Dimensionality Reduction",
            "phase": "4. Unsupervised Learning",
            "status": "not_started",
            "description": "Unsupervised pattern recognition: K-Means, DBSCAN, Gaussian Mixture Models (GMM), and PCA.",
            "subtopics": [
                  "K-Means++ initialization & Silhouette scores",
                  "DBSCAN density & core point definitions",
                  "Expectation-Maximization (EM) for GMMs",
                  "Principal Component Analysis (PCA) & explained variance ratio"
            ],
            "resources": [
                  {
                        "title": "Scikit-Learn Clustering Guide",
                        "url": "https://scikit-learn.org/stable/modules/clustering.html"
                  }
            ]
      },
      {
            "id": "ml_model_eval",
            "label": "Model Evaluation, Cross-Validation & Metrics",
            "phase": "5. Model Evaluation",
            "status": "not_started",
            "description": "Rigorous validation methodologies to avoid data leakage and quantify generalization performance.",
            "subtopics": [
                  "Stratified K-Fold & TimeSeriesSplit cross-validation",
                  "Precision, Recall, F1, PR-AUC vs ROC-AUC",
                  "Regression metrics: MAE, RMSE, MAPE, R-squared",
                  "Detecting and preventing train-test data leakage"
            ],
            "resources": [
                  {
                        "title": "Scikit-Learn Model Evaluation",
                        "url": "https://scikit-learn.org/stable/modules/model_evaluation.html"
                  }
            ]
      },
      {
            "id": "ml_hyperparam_tuning",
            "label": "Hyperparameter Optimization (Optuna)",
            "phase": "5. Model Evaluation",
            "status": "not_started",
            "description": "Search parameter spaces efficiently: Grid Search, Random Search, and Bayesian Optimization with Optuna.",
            "subtopics": [
                  "Bayesian optimization & Tree-structured Parzen Estimators (TPE)",
                  "Optuna study creation, trials, and pruning",
                  "Search spaces for learning rates and tree depths",
                  "Early stopping trials to conserve compute"
            ],
            "resources": [
                  {
                        "title": "Optuna Documentation",
                        "url": "https://optuna.org/"
                  }
            ]
      },
      {
            "id": "ml_dl_pytorch",
            "label": "Neural Networks & PyTorch",
            "phase": "6. Deep Learning Intro",
            "status": "not_started",
            "description": "Multi-layer perceptrons (MLP), backpropagation, non-linear activations (ReLU, GELU), and PyTorch training loops.",
            "subtopics": [
                  "Universal Approximation Theorem",
                  "Activation functions: ReLU, LeakyReLU, GELU, Sigmoid",
                  "Autograd computational graph mechanics",
                  "Custom PyTorch Dataset and DataLoader classes"
            ],
            "resources": [
                  {
                        "title": "Deep Learning with PyTorch Book",
                        "url": "https://pytorch.org/deep-learning-with-pytorch"
                  }
            ]
      },
      {
            "id": "ml_cnn_rnn",
            "label": "CNNs, Embeddings & Sequence Models",
            "phase": "6. Deep Learning Intro",
            "status": "not_started",
            "description": "Spatial and sequential neural network building blocks: 2D convolutions, word embeddings, LSTMs, and self-attention.",
            "subtopics": [
                  "2D Convolutions & pooling for visual signals",
                  "Word2Vec, GloVe, and learned embedding layers",
                  "Recurrent Neural Networks (RNNs) & LSTMs",
                  "Self-attention mechanism and Transformer overview"
            ],
            "resources": [
                  {
                        "title": "Stanford CS224N: Natural Language Processing with Deep Learning",
                        "url": "https://web.stanford.edu/class/cs224n/"
                  }
            ]
      }
],
    edges: [
      {
            "source": "ml_math_stats",
            "target": "ml_python_stack"
      },
      {
            "source": "ml_python_stack",
            "target": "ml_feature_eng"
      },
      {
            "source": "ml_feature_eng",
            "target": "ml_regression"
      },
      {
            "source": "ml_regression",
            "target": "ml_trees_forests"
      },
      {
            "source": "ml_trees_forests",
            "target": "ml_boosting"
      },
      {
            "source": "ml_boosting",
            "target": "ml_svm_knn"
      },
      {
            "source": "ml_svm_knn",
            "target": "ml_clustering"
      },
      {
            "source": "ml_clustering",
            "target": "ml_model_eval"
      },
      {
            "source": "ml_model_eval",
            "target": "ml_hyperparam_tuning"
      },
      {
            "source": "ml_hyperparam_tuning",
            "target": "ml_dl_pytorch"
      },
      {
            "source": "ml_dl_pytorch",
            "target": "ml_cnn_rnn"
      }
]
  },

  // ─── MLOps ─────────────────────────────────────────────────────────
  'mlops': {
    id: 'mlops',
    name: 'MLOps',
    icon: '🔄',
    badge: 'roadmap.sh',
    category: 'ai_data',
    description: "Production Machine Learning Engineering: Docker, DVC data versioning, Feast feature stores, MLflow experiment tracking, CI/CD with CML, Triton model serving, and Evidently drift monitoring.",
    roadmapUrl: 'https://roadmap.sh/mlops',
    nodes: [
      {
            "id": "mlops_env_git",
            "label": "Git, Pre-commit & Environment Management",
            "phase": "1. Code & Packaging",
            "status": "not_started",
            "description": "Production software hygiene for data science: Git branching, automated pre-commit hooks (ruff, black), and deterministic environments.",
            "subtopics": [
                  "Git workflows & trunk-based development",
                  "pre-commit hooks: formatting, linting, type checks",
                  "Poetry / Conda / uv deterministic lockfiles",
                  "Data science project structuring (Cookiecutter / Kedro)"
            ],
            "resources": [
                  {
                        "title": "roadmap.sh MLOps Guide",
                        "url": "https://roadmap.sh/mlops"
                  }
            ]
      },
      {
            "id": "mlops_docker",
            "label": "Docker & Containerization for ML",
            "phase": "1. Code & Packaging",
            "status": "not_started",
            "description": "Containerize training scripts and model serving runtimes: multi-stage builds, GPU pass-through with NVIDIA Container Toolkit.",
            "subtopics": [
                  "Writing minimal Dockerfiles for Python & PyTorch",
                  "NVIDIA Container Toolkit & nvidia-smi inside containers",
                  "Multi-stage builds for lean production images",
                  "Docker Compose for local service dependencies"
            ],
            "resources": [
                  {
                        "title": "Docker Official Documentation",
                        "url": "https://docs.docker.com/"
                  }
            ]
      },
      {
            "id": "mlops_dvc",
            "label": "Data & Model Versioning (DVC)",
            "phase": "2. Data & Model Versioning",
            "status": "not_started",
            "description": "Version large datasets, feature matrices, and model weights alongside Git commits using Data Version Control (DVC).",
            "subtopics": [
                  "DVC data tracking with remote S3/GCS backends",
                  "dvc.yaml pipelines and dependency graphs",
                  "Reproducible data pipelines with dvc repro",
                  "Data registry & dataset release tags"
            ],
            "resources": [
                  {
                        "title": "DVC Official Documentation",
                        "url": "https://dvc.org/doc"
                  }
            ]
      },
      {
            "id": "mlops_feature_store",
            "label": "Feature Stores (Feast)",
            "phase": "2. Data & Model Versioning",
            "status": "not_started",
            "description": "Centralize feature definitions, eliminate training-serving skew, and serve features with ultra-low latency using Feast.",
            "subtopics": [
                  "Offline store (Parquet/Snowflake) vs Online store (Redis)",
                  "Feature definitions, entities, and feature views",
                  "Point-in-time correctness (time-travel joins)",
                  "Serving features in real-time inference APIs"
            ],
            "resources": [
                  {
                        "title": "Feast Feature Store Documentation",
                        "url": "https://docs.feast.dev/"
                  }
            ]
      },
      {
            "id": "mlops_mlflow",
            "label": "Experiment Tracking & Registry (MLflow / W&B)",
            "phase": "3. Experimentation & Registry",
            "status": "not_started",
            "description": "Track model iterations, compare hyperparameter runs, log confusion matrices, and manage model lifecycle stages.",
            "subtopics": [
                  "Logging parameters, metrics, artifacts, and signatures",
                  "MLflow Model Registry: Challenger vs Champion models",
                  "Model staging, production promotion, and rollback",
                  "Weights & Biases (wandb) collaborative tracking"
            ],
            "resources": [
                  {
                        "title": "MLflow Model Registry Docs",
                        "url": "https://mlflow.org/docs/latest/model-registry.html"
                  }
            ]
      },
      {
            "id": "mlops_cicd_pipelines",
            "label": "CI/CD & Automated Model Retraining",
            "phase": "4. Continuous Training & CI/CD",
            "status": "not_started",
            "description": "Automate model training, validation gates, and deployment pipelines using GitHub Actions, CML, or GitLab CI.",
            "subtopics": [
                  "Continuous Machine Learning (CML) PR reports",
                  "Automated data & model validation test gates",
                  "Automated retraining triggers (cron, data drift, webhook)",
                  "Semantic versioning for ML artifacts"
            ],
            "resources": [
                  {
                        "title": "Iterative CML Guide",
                        "url": "https://cml.dev/"
                  }
            ]
      },
      {
            "id": "mlops_serving_fastapi",
            "label": "High-Throughput Model Serving (FastAPI & Triton)",
            "phase": "5. Model Serving",
            "status": "not_started",
            "description": "Serve models with low latency and high concurrency: FastAPI async endpoints, Triton Inference Server, and TorchServe.",
            "subtopics": [
                  "FastAPI async prediction endpoints & worker scaling (Uvicorn)",
                  "Triton Inference Server dynamic batching & multi-model serving",
                  "Model optimization: ONNX Runtime, TensorRT acceleration",
                  "gRPC vs REST prediction APIs"
            ],
            "resources": [
                  {
                        "title": "Triton Inference Server Docs",
                        "url": "https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/"
                  }
            ]
      },
      {
            "id": "mlops_k8s_kserve",
            "label": "Kubernetes & Model Orchestration (KServe / Seldon)",
            "phase": "5. Model Serving",
            "status": "not_started",
            "description": "Deploy auto-scaling ML workloads on Kubernetes: KServe, Seldon Core, canary deployments, and GPU node pools.",
            "subtopics": [
                  "Kubernetes pods, services, and Horizontal Pod Autoscalers (HPA)",
                  "Scale-to-zero serverless inference with Knative",
                  "Canary & Blue-Green model deployment strategies",
                  "Multi-armed bandit traffic routing"
            ],
            "resources": [
                  {
                        "title": "KServe Official Documentation",
                        "url": "https://kserve.github.io/website/"
                  }
            ]
      },
      {
            "id": "mlops_drift_monitoring",
            "label": "Model Monitoring & Data Drift (Evidently AI)",
            "phase": "6. Monitoring & Drift",
            "status": "not_started",
            "description": "Detect data drift, concept drift, and performance degradation in production before business metrics drop.",
            "subtopics": [
                  "Data Drift: Kolmogorov-Smirnov (KS) test, Population Stability Index (PSI)",
                  "Concept Drift: Target distribution shift detection",
                  "Evidently AI drift dashboards & automated test suites",
                  "Prometheus & Grafana alerting on inference latency & drift"
            ],
            "resources": [
                  {
                        "title": "Evidently AI Documentation",
                        "url": "https://docs.evidentlyai.com/"
                  }
            ]
      }
],
    edges: [
      {
            "source": "mlops_env_git",
            "target": "mlops_docker"
      },
      {
            "source": "mlops_docker",
            "target": "mlops_dvc"
      },
      {
            "source": "mlops_dvc",
            "target": "mlops_feature_store"
      },
      {
            "source": "mlops_feature_store",
            "target": "mlops_mlflow"
      },
      {
            "source": "mlops_mlflow",
            "target": "mlops_cicd_pipelines"
      },
      {
            "source": "mlops_cicd_pipelines",
            "target": "mlops_serving_fastapi"
      },
      {
            "source": "mlops_serving_fastapi",
            "target": "mlops_k8s_kserve"
      },
      {
            "source": "mlops_k8s_kserve",
            "target": "mlops_drift_monitoring"
      }
]
  },

  // ─── BI Analyst ─────────────────────────────────────────────────────────
  'bi-analyst': {
    id: 'bi-analyst',
    name: 'BI Analyst',
    icon: '📈',
    badge: 'roadmap.sh',
    category: 'ai_data',
    description: "Business Intelligence Analyst curriculum: Business metrics, dimensional modeling, Power BI Desktop, advanced DAX, Tableau LOD calculations, UX dashboard design, and semantic layers.",
    roadmapUrl: 'https://roadmap.sh/bi-analyst',
    nodes: [
      {
            "id": "bi_metrics",
            "label": "Business Metrics & KPI Architecture",
            "phase": "1. Business Intelligence Core",
            "status": "not_started",
            "description": "Translate corporate goals into measurable KPIs: North Star metrics, cohort retention, CAC, LTV, and churn modeling.",
            "subtopics": [
                  "North Star metrics & OKR alignment",
                  "SaaS metrics: ARR, MRR, Churn, LTV, CAC",
                  "E-commerce metrics: Conversion rate, AOV, ROAS",
                  "Cohort analysis & user retention matrices"
            ],
            "resources": [
                  {
                        "title": "roadmap.sh BI Analyst Guide",
                        "url": "https://roadmap.sh/bi-analyst"
                  }
            ]
      },
      {
            "id": "bi_sql_analytics",
            "label": "Advanced Analytical SQL for BI",
            "phase": "1. Business Intelligence Core",
            "status": "not_started",
            "description": "SQL queries for executive reporting: Window functions, self-joins, CTEs, conditional aggregations, and rolling windows.",
            "subtopics": [
                  "Window functions: OVER(PARTITION BY... ORDER BY...)",
                  "Rolling 7-day and 30-day moving averages",
                  "Year-over-Year (YoY) & MoM calculations",
                  "Pivoting rows into columns with CASE WHEN"
            ],
            "resources": [
                  {
                        "title": "PostgreSQL Window Functions Tutorial",
                        "url": "https://www.postgresqltutorial.com/postgresql-window-function/"
                  }
            ]
      },
      {
            "id": "bi_dimensional_modeling",
            "label": "Dimensional Modeling & Star Schemas",
            "phase": "2. Data Modeling & Warehousing",
            "status": "not_started",
            "description": "Design robust BI schemas: Star schemas, snowflake schemas, degenerate dimensions, and conformed dimensions.",
            "subtopics": [
                  "Fact tables: Transaction, Periodic snapshot, Accumulating snapshot",
                  "Dimension tables: Slowly Changing Dimensions (SCD 1, 2)",
                  "Conformed dimensions across business units",
                  "Granularity definition and avoidance of double-counting"
            ],
            "resources": [
                  {
                        "title": "Kimball Group: Dimensional Modeling Techniques",
                        "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/"
                  }
            ]
      },
      {
            "id": "bi_powerbi_modeling",
            "label": "Power BI Data Modeling & Power Query",
            "phase": "3. Power BI Ecosystem",
            "status": "not_started",
            "description": "Master Power BI Desktop: Power Query M transformation, relationship cardinalities (1:*, *:1), and bidirectional cross-filtering.",
            "subtopics": [
                  "Power Query ETL: Unpivoting, merging, appending",
                  "Relationship cardinalities & active vs inactive relationships",
                  "Managing circular dependencies & ambiguity",
                  "Star schema implementation in Power BI model view"
            ],
            "resources": [
                  {
                        "title": "Microsoft Learn Power BI Training",
                        "url": "https://learn.microsoft.com/en-us/training/powerplatform/power-bi"
                  }
            ]
      },
      {
            "id": "bi_dax_advanced",
            "label": "Advanced DAX (Data Analysis Expressions)",
            "phase": "3. Power BI Ecosystem",
            "status": "not_started",
            "description": "Write performant DAX: CALCULATE, filter contexts, row contexts, context transition, time intelligence, and iterators.",
            "subtopics": [
                  "Evaluation Context: Filter Context vs Row Context",
                  "CALCULATE modifier functions (ALL, ALLEXCEPT, KEEPFILTERS)",
                  "Time Intelligence: DATESYTD, SAMEPERIODLASTYEAR, DATEADD",
                  "Iterators: SUMX, AVERAGEX, RANKX and performance optimization"
            ],
            "resources": [
                  {
                        "title": "SQLBI: The Definitive Guide to DAX",
                        "url": "https://www.sqlbi.com/"
                  }
            ]
      },
      {
            "id": "bi_tableau",
            "label": "Tableau Desktop & Calculations",
            "phase": "4. Tableau Ecosystem",
            "status": "not_started",
            "description": "Build interactive dashboards in Tableau: Level of Detail (LOD) expressions, parameters, sets, and table calculations.",
            "subtopics": [
                  "LOD expressions: FIXED, INCLUDE, EXCLUDE",
                  "Table calculations: Running Total, Percent of Total, Rank",
                  "Parameters & dynamic measure selection",
                  "Dashboard actions: Filter, Highlight, and URL actions"
            ],
            "resources": [
                  {
                        "title": "Tableau Official Training Videos",
                        "url": "https://www.tableau.com/learn/training"
                  }
            ]
      },
      {
            "id": "bi_ui_storytelling",
            "label": "Dashboard UX Design & Data Storytelling",
            "phase": "5. Visualization & Storytelling",
            "status": "not_started",
            "description": "Design executive-ready dashboards: Gestalt visual principles, color palettes, visual hierarchy, and actionable insights.",
            "subtopics": [
                  "Gestalt principles of visual perception",
                  "Visual hierarchy: Z-pattern and F-pattern layouts",
                  "Selecting charts: Distribution vs Composition vs Relationship",
                  "Effective executive summaries and drill-through pages"
            ],
            "resources": [
                  {
                        "title": "Storytelling with Data (Cole Nussbaumer Knaflic)",
                        "url": "https://www.storytellingwithdata.com/"
                  }
            ]
      },
      {
            "id": "bi_semantic_layer",
            "label": "Modern Semantic Layers & Governance",
            "phase": "6. Semantic Layer & Governance",
            "status": "not_started",
            "description": "Implement consistent metric definitions across tools using semantic layers (Cube, dbt Semantic Layer, Looker LookML).",
            "subtopics": [
                  "Semantic layer principles: single source of truth for metrics",
                  "Looker LookML view and explore modeling",
                  "Row-level security (RLS) and data privacy controls",
                  "Automated scheduled reports, alerts, and mobile BI apps"
            ],
            "resources": [
                  {
                        "title": "Cube Semantic Layer Docs",
                        "url": "https://cube.dev/docs"
                  }
            ]
      }
],
    edges: [
      {
            "source": "bi_metrics",
            "target": "bi_sql_analytics"
      },
      {
            "source": "bi_sql_analytics",
            "target": "bi_dimensional_modeling"
      },
      {
            "source": "bi_dimensional_modeling",
            "target": "bi_powerbi_modeling"
      },
      {
            "source": "bi_powerbi_modeling",
            "target": "bi_dax_advanced"
      },
      {
            "source": "bi_dax_advanced",
            "target": "bi_tableau"
      },
      {
            "source": "bi_tableau",
            "target": "bi_ui_storytelling"
      },
      {
            "source": "bi_ui_storytelling",
            "target": "bi_semantic_layer"
      }
]
  }

};
