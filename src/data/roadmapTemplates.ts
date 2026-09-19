import type { RoadmapNode, RoadmapEdge } from '../types';
import { DEVELOPMENT_ROADMAPS } from './roadmaps/development';
import { AI_DATA_ROADMAPS } from './roadmaps/aiData';
import { DEVOPS_SECURITY_ROADMAPS } from './roadmaps/devopsSecurity';
import { MANAGEMENT_DESIGN_ROADMAPS } from './roadmaps/managementDesign';

export interface RoadmapTemplate {
  id: string;
  name: string;
  icon: string;
  badge: string;
  category: 'development' | 'ai_data' | 'devops_security' | 'architecture_design' | 'product_management' | 'custom';
  description: string;
  roadmapUrl: string;
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}

export const ROADMAP_TEMPLATES: Record<string, RoadmapTemplate> = {
  ...DEVELOPMENT_ROADMAPS,
  ...AI_DATA_ROADMAPS,
  ...DEVOPS_SECURITY_ROADMAPS,
  ...MANAGEMENT_DESIGN_ROADMAPS,
};